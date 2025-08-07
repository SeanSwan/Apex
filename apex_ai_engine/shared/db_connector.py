"""
APEX AI SHARED UTILITIES - DATABASE CONNECTOR
==============================================
Centralized database connection and operations management

Features:
- PostgreSQL and SQLite support with automatic fallback
- Connection pooling and management
- Transaction handling and error recovery
- Query optimization and monitoring
- Database health checking and monitoring
"""

import asyncio
import logging
import time
import threading
from typing import Dict, List, Optional, Any, Union, Tuple
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
import queue

# Database imports
try:
    import psycopg2
    from psycopg2 import pool
    from psycopg2.extras import RealDictCursor
    POSTGRESQL_AVAILABLE = True
except ImportError:
    POSTGRESQL_AVAILABLE = False

import sqlite3
from pathlib import Path

logger = logging.getLogger(__name__)

@dataclass
class ConnectionInfo:
    """Database connection information"""
    connection_id: str
    connection_type: str  # 'postgresql' or 'sqlite'
    created_at: str
    last_used: str
    query_count: int = 0
    error_count: int = 0
    in_use: bool = False

@dataclass
class QueryMetrics:
    """Query performance metrics"""
    query_id: str
    query_type: str  # SELECT, INSERT, UPDATE, DELETE
    execution_time: float
    rows_affected: int
    timestamp: str
    success: bool
    error_message: Optional[str] = None

class DatabaseConnector:
    """
    Centralized database connector for APEX AI system
    
    Provides unified interface for PostgreSQL and SQLite databases
    with connection pooling, error handling, and performance monitoring.
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.connection_type = 'postgresql' if (POSTGRESQL_AVAILABLE and config.get('use_postgresql', False)) else 'sqlite'
        
        # Connection management
        self.connection_pool = None
        self.sqlite_connection = None
        self.connection_lock = threading.Lock()
        
        # Connection tracking
        self.active_connections: Dict[str, ConnectionInfo] = {}
        self.connection_counter = 0
        
        # Performance metrics
        self.query_history: List[QueryMetrics] = []
        self.max_query_history = config.get('max_query_history', 1000)
        self.query_counter = 0
        
        # Health monitoring
        self.health_status = {
            'status': 'unknown',
            'last_check': None,
            'connection_count': 0,
            'error_count': 0,
            'uptime_seconds': 0,
            'queries_per_second': 0.0
        }
        
        self.start_time = time.time()
        
        logger.info(f"💾 Database Connector initialized - Type: {self.connection_type}")
    
    async def initialize(self):
        """Initialize database connections"""
        try:
            if self.connection_type == 'postgresql':
                await self._initialize_postgresql()
            else:
                await self._initialize_sqlite()
            
            # Perform initial health check
            await self._health_check()
            
            logger.info(f"✅ Database connector initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Database connector initialization failed: {e}")
            # Fallback to SQLite if PostgreSQL fails
            if self.connection_type == 'postgresql':
                logger.warning("🔄 Falling back to SQLite")
                self.connection_type = 'sqlite'
                await self._initialize_sqlite()
            else:
                raise
    
    async def _initialize_postgresql(self):
        """Initialize PostgreSQL connection pool"""
        try:
            connection_params = {
                'host': self.config.get('host', 'localhost'),
                'port': self.config.get('port', 5432),
                'database': self.config.get('database', 'apex_ai'),
                'user': self.config.get('user', 'apex_user'),
                'password': self.config.get('password', ''),
            }
            
            pool_size = self.config.get('pool_size', 5)
            max_connections = self.config.get('max_connections', 20)
            
            self.connection_pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=max_connections,
                **connection_params
            )
            
            # Test connection
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT version();")
                    version = cursor.fetchone()[0]
                    logger.info(f"🐘 PostgreSQL connected: {version}")
            
            self.health_status['status'] = 'healthy'
            
        except Exception as e:
            logger.error(f"❌ PostgreSQL initialization failed: {e}")
            raise
    
    async def _initialize_sqlite(self):
        """Initialize SQLite connection"""
        try:
            db_path = Path(self.config.get('sqlite_path', 'data/apex_ai.db'))
            db_path.parent.mkdir(parents=True, exist_ok=True)
            
            self.sqlite_connection = sqlite3.connect(
                str(db_path),
                check_same_thread=False,
                timeout=30.0
            )
            self.sqlite_connection.row_factory = sqlite3.Row
            
            # Enable WAL mode for better concurrency
            self.sqlite_connection.execute("PRAGMA journal_mode=WAL")
            self.sqlite_connection.execute("PRAGMA synchronous=NORMAL")
            self.sqlite_connection.execute("PRAGMA cache_size=10000")
            self.sqlite_connection.execute("PRAGMA temp_store=memory")
            
            logger.info(f"💿 SQLite database initialized: {db_path}")
            
            self.health_status['status'] = 'healthy'
            
        except Exception as e:
            logger.error(f"❌ SQLite initialization failed: {e}")
            raise
    
    @contextmanager
    def _get_connection(self):
        """Get database connection (context manager)"""
        connection = None
        connection_id = None
        
        try:
            with self.connection_lock:
                if self.connection_type == 'postgresql' and self.connection_pool:
                    connection = self.connection_pool.getconn()
                    connection.autocommit = True
                elif self.connection_type == 'sqlite' and self.sqlite_connection:
                    connection = self.sqlite_connection
                else:
                    raise Exception("No database connection available")
                
                # Track connection
                self.connection_counter += 1
                connection_id = f"conn_{self.connection_counter}_{int(time.time())}"
                
                self.active_connections[connection_id] = ConnectionInfo(
                    connection_id=connection_id,
                    connection_type=self.connection_type,
                    created_at=datetime.now().isoformat(),
                    last_used=datetime.now().isoformat(),
                    in_use=True
                )
            
            yield connection
            
        except Exception as e:
            logger.error(f"❌ Database connection error: {e}")
            raise
        finally:
            # Return connection to pool
            try:
                if connection and self.connection_type == 'postgresql' and self.connection_pool:
                    self.connection_pool.putconn(connection)
                
                # Update connection tracking
                if connection_id and connection_id in self.active_connections:
                    conn_info = self.active_connections[connection_id]
                    conn_info.last_used = datetime.now().isoformat()
                    conn_info.in_use = False
                    
            except Exception as e:
                logger.error(f"❌ Connection cleanup error: {e}")
    
    async def execute_query(self, query: str, params: Tuple = None, fetch: str = None) -> Any:
        """
        Execute database query
        
        Args:
            query: SQL query string
            params: Query parameters tuple
            fetch: 'one', 'all', or None
            
        Returns:
            Query results based on fetch parameter
        """
        try:
            start_time = time.time()
            query_type = query.strip().split()[0].upper()
            
            with self._get_connection() as connection:
                if self.connection_type == 'postgresql':
                    cursor = connection.cursor(cursor_factory=RealDictCursor)
                else:
                    cursor = connection.cursor()
                
                try:
                    # Execute query
                    if params:
                        cursor.execute(query, params)
                    else:
                        cursor.execute(query)
                    
                    # Fetch results based on parameter
                    result = None
                    rows_affected = cursor.rowcount
                    
                    if fetch == 'one':
                        result = cursor.fetchone()
                    elif fetch == 'all':
                        result = cursor.fetchall()
                    elif query_type == 'SELECT':
                        result = cursor.fetchall()
                    
                    # Commit for SQLite
                    if self.connection_type == 'sqlite' and query_type in ['INSERT', 'UPDATE', 'DELETE']:
                        connection.commit()
                    
                    execution_time = time.time() - start_time
                    
                    # Record metrics
                    self._record_query_metrics(
                        query_type=query_type,
                        execution_time=execution_time,
                        rows_affected=rows_affected,
                        success=True
                    )
                    
                    logger.debug(f"📊 Query executed: {query_type} in {execution_time:.3f}s")
                    
                    return result
                    
                finally:
                    cursor.close()
                    
        except Exception as e:
            execution_time = time.time() - start_time
            
            # Record error metrics
            self._record_query_metrics(
                query_type=query_type,
                execution_time=execution_time,
                rows_affected=0,
                success=False,
                error_message=str(e)
            )
            
            logger.error(f"❌ Query execution failed: {e}")
            logger.error(f"❌ Query: {query}")
            raise
    
    async def execute_many(self, query: str, params_list: List[Tuple]) -> int:
        """Execute query with multiple parameter sets"""
        try:
            start_time = time.time()
            query_type = query.strip().split()[0].upper()
            total_affected = 0
            
            with self._get_connection() as connection:
                cursor = connection.cursor()
                
                try:
                    cursor.executemany(query, params_list)
                    total_affected = cursor.rowcount
                    
                    # Commit for SQLite
                    if self.connection_type == 'sqlite':
                        connection.commit()
                    
                    execution_time = time.time() - start_time
                    
                    # Record metrics
                    self._record_query_metrics(
                        query_type=f"{query_type}_MANY",
                        execution_time=execution_time,
                        rows_affected=total_affected,
                        success=True
                    )
                    
                    logger.debug(f"📊 Batch query executed: {len(params_list)} operations in {execution_time:.3f}s")
                    
                    return total_affected
                    
                finally:
                    cursor.close()
                    
        except Exception as e:
            execution_time = time.time() - start_time
            
            # Record error metrics
            self._record_query_metrics(
                query_type=f"{query_type}_MANY",
                execution_time=execution_time,
                rows_affected=0,
                success=False,
                error_message=str(e)
            )
            
            logger.error(f"❌ Batch query execution failed: {e}")
            raise
    
    @contextmanager
    def transaction(self):
        """Database transaction context manager"""
        if self.connection_type == 'postgresql':
            # PostgreSQL handles transactions automatically
            with self._get_connection() as connection:
                old_autocommit = connection.autocommit
                connection.autocommit = False
                try:
                    yield connection
                    connection.commit()
                except Exception:
                    connection.rollback()
                    raise
                finally:
                    connection.autocommit = old_autocommit
        else:
            # SQLite transaction
            with self._get_connection() as connection:
                try:
                    yield connection
                    connection.commit()
                except Exception:
                    connection.rollback()
                    raise
    
    def _record_query_metrics(self, query_type: str, execution_time: float, 
                             rows_affected: int, success: bool, error_message: str = None):
        """Record query performance metrics"""
        try:
            self.query_counter += 1
            
            metrics = QueryMetrics(
                query_id=f"query_{self.query_counter}_{int(time.time() * 1000)}",
                query_type=query_type,
                execution_time=execution_time,
                rows_affected=rows_affected,
                timestamp=datetime.now().isoformat(),
                success=success,
                error_message=error_message
            )
            
            self.query_history.append(metrics)
            
            # Maintain history size
            if len(self.query_history) > self.max_query_history:
                self.query_history.pop(0)
            
            # Update health status
            if not success:
                self.health_status['error_count'] += 1
                
        except Exception as e:
            logger.error(f"❌ Query metrics recording error: {e}")
    
    async def _health_check(self):
        """Perform database health check"""
        try:
            start_time = time.time()
            
            # Test basic connectivity
            test_query = "SELECT 1"
            result = await self.execute_query(test_query, fetch='one')
            
            if result:
                self.health_status['status'] = 'healthy'
            else:
                self.health_status['status'] = 'degraded'
            
            # Update metrics
            self.health_status['last_check'] = datetime.now().isoformat()
            self.health_status['connection_count'] = len(self.active_connections)
            self.health_status['uptime_seconds'] = time.time() - self.start_time
            
            # Calculate queries per second
            if self.query_history:
                recent_queries = [q for q in self.query_history if q.success]
                if recent_queries:
                    time_span = max(1, self.health_status['uptime_seconds'])
                    self.health_status['queries_per_second'] = len(recent_queries) / time_span
            
            logger.debug(f"💚 Database health check completed: {self.health_status['status']}")
            
        except Exception as e:
            self.health_status['status'] = 'unhealthy'
            self.health_status['last_check'] = datetime.now().isoformat()
            logger.error(f"❌ Database health check failed: {e}")
    
    async def get_table_info(self, table_name: str) -> Dict[str, Any]:
        """Get information about a database table"""
        try:
            if self.connection_type == 'postgresql':
                query = """
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = %s
                    ORDER BY ordinal_position
                """
                columns = await self.execute_query(query, (table_name,))
                
                # Get row count
                count_query = f"SELECT COUNT(*) FROM {table_name}"
                count_result = await self.execute_query(count_query, fetch='one')
                row_count = count_result[0] if count_result else 0
                
            else:
                # SQLite
                query = f"PRAGMA table_info({table_name})"
                columns = await self.execute_query(query)
                
                # Get row count
                count_query = f"SELECT COUNT(*) FROM {table_name}"
                count_result = await self.execute_query(count_query, fetch='one')
                row_count = count_result[0] if count_result else 0
            
            return {
                'table_name': table_name,
                'columns': columns,
                'row_count': row_count,
                'database_type': self.connection_type
            }
            
        except Exception as e:
            logger.error(f"❌ Get table info error: {e}")
            return {'error': str(e)}
    
    async def get_database_stats(self) -> Dict[str, Any]:
        """Get comprehensive database statistics"""
        try:
            stats = {
                'connection_type': self.connection_type,
                'health_status': self.health_status.copy(),
                'active_connections': len(self.active_connections),
                'total_queries': len(self.query_history),
                'successful_queries': len([q for q in self.query_history if q.success]),
                'failed_queries': len([q for q in self.query_history if not q.success]),
                'average_query_time': 0.0,
                'config': {
                    'max_query_history': self.max_query_history,
                    'pool_size': self.config.get('pool_size', 'N/A')
                }
            }
            
            # Calculate average query time
            if self.query_history:
                total_time = sum(q.execution_time for q in self.query_history)
                stats['average_query_time'] = total_time / len(self.query_history)
            
            # Recent query statistics
            recent_queries = [q for q in self.query_history[-100:]]  # Last 100 queries
            if recent_queries:
                stats['recent_queries'] = {
                    'count': len(recent_queries),
                    'success_rate': len([q for q in recent_queries if q.success]) / len(recent_queries),
                    'average_time': sum(q.execution_time for q in recent_queries) / len(recent_queries),
                    'query_types': {}
                }
                
                # Count query types
                for query in recent_queries:
                    query_type = query.query_type
                    if query_type not in stats['recent_queries']['query_types']:
                        stats['recent_queries']['query_types'][query_type] = 0
                    stats['recent_queries']['query_types'][query_type] += 1
            
            return stats
            
        except Exception as e:
            logger.error(f"❌ Get database stats error: {e}")
            return {'error': str(e)}
    
    async def cleanup_connections(self):
        """Clean up old and unused connections"""
        try:
            current_time = datetime.now()
            cleaned_count = 0
            
            # Clean up connection tracking for old connections
            old_connections = []
            for conn_id, conn_info in self.active_connections.items():
                if not conn_info.in_use:
                    last_used = datetime.fromisoformat(conn_info.last_used)
                    if (current_time - last_used).total_seconds() > 300:  # 5 minutes
                        old_connections.append(conn_id)
            
            for conn_id in old_connections:
                del self.active_connections[conn_id]
                cleaned_count += 1
            
            if cleaned_count > 0:
                logger.debug(f"🧹 Cleaned up {cleaned_count} old connection records")
                
        except Exception as e:
            logger.error(f"❌ Connection cleanup error: {e}")
    
    async def shutdown(self):
        """Shutdown database connections"""
        try:
            logger.info("🛑 Shutting down database connector")
            
            # Close connection pool
            if self.connection_pool:
                self.connection_pool.closeall()
                logger.info("📊 PostgreSQL connection pool closed")
            
            # Close SQLite connection
            if self.sqlite_connection:
                self.sqlite_connection.close()
                logger.info("💿 SQLite connection closed")
            
            # Clear tracking data
            self.active_connections.clear()
            self.query_history.clear()
            
            self.health_status['status'] = 'shutdown'
            
            logger.info("✅ Database connector shutdown complete")
            
        except Exception as e:
            logger.error(f"❌ Database connector shutdown error: {e}")

# Global database connector instance (will be initialized by the system)
db_connector: Optional[DatabaseConnector] = None

def initialize_database(config: Dict[str, Any]) -> DatabaseConnector:
    """Initialize global database connector"""
    global db_connector
    db_connector = DatabaseConnector(config)
    return db_connector

async def get_db_connector() -> DatabaseConnector:
    """Get the global database connector"""
    if db_connector is None:
        raise Exception("Database connector not initialized. Call initialize_database() first.")
    return db_connector

# Convenience functions
async def execute_query(query: str, params: Tuple = None, fetch: str = None) -> Any:
    """Convenience function to execute query"""
    connector = await get_db_connector()
    return await connector.execute_query(query, params, fetch)

async def execute_many(query: str, params_list: List[Tuple]) -> int:
    """Convenience function to execute batch query"""
    connector = await get_db_connector()
    return await connector.execute_many(query, params_list)
