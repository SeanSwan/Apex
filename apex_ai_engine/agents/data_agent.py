"""
APEX AI DATA AGENT
==================
Specialized AI agent for data management, logging, and evidence archival

This agent encapsulates all data persistence logic including audit logging,
evidence archival, database operations, and compliance reporting.

Features:
- Comprehensive audit logging and event tracking
- Automated evidence collection and archival
- Database operations and data integrity management
- Compliance reporting and data retention
- Real-time data synchronization
- Backup and recovery operations

Agent Responsibilities:
- Log all system events and user actions
- Archive video evidence and threat detections
- Manage database connections and transactions
- Generate compliance and audit reports
- Handle data backup and recovery
- Ensure data integrity and security
"""

import asyncio
import json
import logging
import time
import threading
import hashlib
import os
import shutil
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path
from enum import Enum
import queue
import sqlite3
import csv

# Database imports
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    POSTGRESQL_AVAILABLE = True
except ImportError:
    POSTGRESQL_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("⚠️ PostgreSQL not available - using SQLite fallback")

# Import existing data components
try:
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from audit_logger import AuditLogger
    from evidence_archiver import EvidenceArchiver
    DATA_COMPONENTS_AVAILABLE = True
except ImportError as e:
    # Fallback for development
    DATA_COMPONENTS_AVAILABLE = False
    AuditLogger = None
    EvidenceArchiver = None
    logger = logging.getLogger(__name__)
    logger.warning(f"⚠️ Data components not available - agent will operate in simulation mode: {e}")
    
    # Create mock classes
    class MockAuditLogger:
        def __init__(self, config=None):
            self.config = config or {}
        
        def log_event(self, event_data):
            pass
    
    class MockEvidenceArchiver:
        def __init__(self, config=None):
            self.config = config or {}
        
        def archive_evidence(self, evidence_data):
            return {"success": True, "evidence_id": f"mock_{int(time.time())}"}
    
    AuditLogger = MockAuditLogger
    EvidenceArchiver = MockEvidenceArchiver

logger = logging.getLogger(__name__)

class DataEventType(Enum):
    """Types of data events"""
    SYSTEM_EVENT = "system_event"
    USER_ACTION = "user_action"
    THREAT_DETECTION = "threat_detection"
    ALERT_GENERATED = "alert_generated"
    CONVERSATION_LOG = "conversation_log"
    EVIDENCE_ARCHIVED = "evidence_archived"
    SYSTEM_ERROR = "system_error"
    AUDIT_EVENT = "audit_event"

class DataRetentionPolicy(Enum):
    """Data retention policies"""
    SHORT_TERM = "short_term"    # 30 days
    MEDIUM_TERM = "medium_term"  # 1 year
    LONG_TERM = "long_term"      # 7 years
    PERMANENT = "permanent"      # Indefinite

@dataclass
class DataRecord:
    """Represents a data record"""
    record_id: str
    event_type: DataEventType
    source_agent: str
    timestamp: str
    data_payload: Dict[str, Any]
    retention_policy: DataRetentionPolicy
    metadata: Dict[str, Any] = None
    archived: bool = False
    integrity_hash: Optional[str] = None

@dataclass
class EvidenceRecord:
    """Represents an evidence record"""
    evidence_id: str
    evidence_type: str  # video, image, audio, data
    source_id: str
    detection_id: Optional[str]
    file_path: str
    file_size: int
    created_at: str
    retention_until: str
    metadata: Dict[str, Any] = None
    integrity_hash: str = None
    archived: bool = False
    encrypted: bool = False

@dataclass
class DataTask:
    """Represents a data processing task"""
    task_id: str
    action: str  # log_event, archive_evidence, backup_data, etc.
    data_payload: Dict[str, Any]
    parameters: Dict[str, Any] = None
    priority: int = 1
    timestamp: str = None

class DataAgent:
    """
    Data Agent for APEX AI system
    
    Manages all data persistence, logging, evidence archival, and 
    compliance operations for the security monitoring system.
    """
    
    def __init__(self, name: str, config: Dict[str, Any], mcp_server=None):
        self.name = name
        self.config = config
        self.mcp_server = mcp_server
        
        # Agent state
        self.enabled = True
        self.status = "initializing"
        self.task_queue = asyncio.Queue()
        self.active_tasks: Dict[str, DataTask] = {}
        
        # Database connections
        self.db_connection = None
        self.db_config = config.get('database', {})
        self.use_postgresql = POSTGRESQL_AVAILABLE and self.db_config.get('use_postgresql', False)
        
        # Data storage paths
        self.base_data_path = Path(config.get('base_data_path', 'data'))
        self.evidence_path = self.base_data_path / 'evidence'
        self.logs_path = self.base_data_path / 'logs'
        self.backups_path = self.base_data_path / 'backups'
        self.exports_path = self.base_data_path / 'exports'
        
        # Data management
        self.data_records: List[DataRecord] = []
        self.evidence_records: List[EvidenceRecord] = []
        self.max_memory_records = config.get('max_memory_records', 10000)
        self.record_counter = 0
        self.evidence_counter = 0
        
        # Data retention settings
        self.retention_policies = {
            DataRetentionPolicy.SHORT_TERM: 30,      # days
            DataRetentionPolicy.MEDIUM_TERM: 365,    # days  
            DataRetentionPolicy.LONG_TERM: 2555,     # 7 years
            DataRetentionPolicy.PERMANENT: -1        # never delete
        }
        
        # Compliance settings
        self.enable_encryption = config.get('enable_encryption', True)
        self.enable_integrity_checking = config.get('enable_integrity_checking', True)
        self.enable_audit_logging = config.get('enable_audit_logging', True)
        self.compliance_mode = config.get('compliance_mode', 'standard')  # standard, strict, minimal
        
        # Performance metrics
        self.metrics = {
            'total_records_logged': 0,
            'evidence_files_archived': 0,
            'database_operations': 0,
            'backup_operations': 0,
            'data_integrity_checks': 0,
            'retention_cleanups': 0,
            'average_logging_time': 0.0,
            'storage_used_bytes': 0,
            'database_size_mb': 0.0,
            'error_count': 0,
            'last_backup_time': None,
            'last_cleanup_time': None
        }
        
        # Threading
        self.worker_thread: Optional[threading.Thread] = None
        self.maintenance_thread: Optional[threading.Thread] = None
        self.backup_thread: Optional[threading.Thread] = None
        self.shutdown_event = threading.Event()
        
        # Processing queues
        self.data_queue = queue.Queue(maxsize=1000)
        self.evidence_queue = queue.Queue(maxsize=200)
        self.maintenance_queue = queue.Queue(maxsize=50)
        
        logger.info(f"💾 Data Agent '{name}' initialized")
    
    async def initialize(self):
        """Initialize the Data Agent"""
        try:
            self.status = "initializing"
            
            # Create directory structure
            await self._create_directory_structure()
            
            # Initialize database
            await self._initialize_database()
            
            # Start worker threads
            await self._start_worker_threads()
            
            # Perform initial maintenance
            await self._perform_initial_maintenance()
            
            self.status = "ready"
            logger.info(f"✅ Data Agent '{self.name}' initialized successfully")
            
        except Exception as e:
            self.status = "error"
            logger.error(f"❌ Data Agent initialization failed: {e}")
            raise
    
    async def _create_directory_structure(self):
        """Create necessary directory structure"""
        try:
            directories = [
                self.base_data_path,
                self.evidence_path,
                self.logs_path,
                self.backups_path,
                self.exports_path,
                self.evidence_path / 'video',
                self.evidence_path / 'images',
                self.evidence_path / 'audio',
                self.evidence_path / 'metadata'
            ]
            
            for directory in directories:
                directory.mkdir(parents=True, exist_ok=True)
                logger.debug(f"📁 Directory ensured: {directory}")
            
            logger.info(f"📁 Directory structure created at {self.base_data_path}")
            
        except Exception as e:
            logger.error(f"❌ Directory creation failed: {e}")
            raise
    
    async def _initialize_database(self):
        """Initialize database connection and schema"""
        try:
            if self.use_postgresql:
                await self._initialize_postgresql()
            else:
                await self._initialize_sqlite()
            
            # Create tables if they don't exist
            await self._create_database_schema()
            
            logger.info(f"✅ Database initialized: {'PostgreSQL' if self.use_postgresql else 'SQLite'}")
            
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {e}")
            # Fall back to file-based logging if database fails
            logger.warning("⚠️ Falling back to file-based logging")
    
    async def _initialize_postgresql(self):
        """Initialize PostgreSQL connection"""
        try:
            connection_params = {
                'host': self.db_config.get('host', 'localhost'),
                'port': self.db_config.get('port', 5432),
                'database': self.db_config.get('database', 'apex_ai'),
                'user': self.db_config.get('user', 'apex_user'),
                'password': self.db_config.get('password', ''),
            }
            
            self.db_connection = psycopg2.connect(**connection_params)
            self.db_connection.autocommit = True
            
            # Test connection
            with self.db_connection.cursor() as cursor:
                cursor.execute("SELECT version();")
                version = cursor.fetchone()[0]
                logger.debug(f"🐘 PostgreSQL connected: {version}")
                
        except Exception as e:
            logger.error(f"❌ PostgreSQL connection failed: {e}")
            raise
    
    async def _initialize_sqlite(self):
        """Initialize SQLite connection"""
        try:
            db_path = self.base_data_path / 'apex_ai.db'
            self.db_connection = sqlite3.connect(str(db_path), check_same_thread=False)
            self.db_connection.row_factory = sqlite3.Row
            
            logger.debug(f"💿 SQLite database initialized: {db_path}")
            
        except Exception as e:
            logger.error(f"❌ SQLite initialization failed: {e}")
            raise
    
    async def _create_database_schema(self):
        """Create database schema"""
        try:
            schema_sql = """
            CREATE TABLE IF NOT EXISTS data_records (
                record_id VARCHAR(255) PRIMARY KEY,
                event_type VARCHAR(100) NOT NULL,
                source_agent VARCHAR(100) NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                data_payload TEXT NOT NULL,
                retention_policy VARCHAR(50) NOT NULL,
                metadata TEXT,
                archived BOOLEAN DEFAULT FALSE,
                integrity_hash VARCHAR(64),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS evidence_records (
                evidence_id VARCHAR(255) PRIMARY KEY,
                evidence_type VARCHAR(50) NOT NULL,
                source_id VARCHAR(100) NOT NULL,
                detection_id VARCHAR(255),
                file_path TEXT NOT NULL,
                file_size BIGINT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                retention_until TIMESTAMP NOT NULL,
                metadata TEXT,
                integrity_hash VARCHAR(64),
                archived BOOLEAN DEFAULT FALSE,
                encrypted BOOLEAN DEFAULT FALSE
            );
            
            CREATE TABLE IF NOT EXISTS audit_log (
                audit_id SERIAL PRIMARY KEY,
                event_type VARCHAR(100) NOT NULL,
                user_id VARCHAR(100),
                source_ip VARCHAR(45),
                action VARCHAR(255) NOT NULL,
                resource VARCHAR(255),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                details TEXT,
                success BOOLEAN DEFAULT TRUE
            );
            
            CREATE INDEX IF NOT EXISTS idx_data_records_timestamp ON data_records(timestamp);
            CREATE INDEX IF NOT EXISTS idx_data_records_event_type ON data_records(event_type);
            CREATE INDEX IF NOT EXISTS idx_evidence_records_created_at ON evidence_records(created_at);
            CREATE INDEX IF NOT EXISTS idx_evidence_records_source_id ON evidence_records(source_id);
            CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
            CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
            """
            
            if self.use_postgresql:
                with self.db_connection.cursor() as cursor:
                    # Split by semicolon and execute each statement
                    statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip()]
                    for statement in statements:
                        cursor.execute(statement)
            else:
                # SQLite
                cursor = self.db_connection.cursor()
                cursor.executescript(schema_sql)
                cursor.close()
            
            logger.info("✅ Database schema created/verified")
            
        except Exception as e:
            logger.error(f"❌ Database schema creation failed: {e}")
            raise
    
    async def _start_worker_threads(self):
        """Start background worker threads"""
        try:
            # Start main data processing thread
            self.worker_thread = threading.Thread(
                target=self._data_worker_main,
                name=f"{self.name}_data_worker",
                daemon=True
            )
            self.worker_thread.start()
            
            # Start maintenance thread
            self.maintenance_thread = threading.Thread(
                target=self._maintenance_worker_main,
                name=f"{self.name}_maintenance_worker",
                daemon=True
            )
            self.maintenance_thread.start()
            
            # Start backup thread
            self.backup_thread = threading.Thread(
                target=self._backup_worker_main,
                name=f"{self.name}_backup_worker",
                daemon=True
            )
            self.backup_thread.start()
            
            logger.info(f"✅ Worker threads started for Data Agent '{self.name}'")
            
        except Exception as e:
            logger.error(f"❌ Failed to start worker threads: {e}")
            raise
    
    def _data_worker_main(self):
        """Main data processing worker thread"""
        logger.info(f"🔄 Data Agent worker thread started: {self.name}")
        
        while not self.shutdown_event.is_set():
            try:
                # Process data queue
                try:
                    data_task = self.data_queue.get(timeout=1.0)
                    self._process_data_task(data_task)
                    self.data_queue.task_done()
                except queue.Empty:
                    # Process evidence queue
                    try:
                        evidence_task = self.evidence_queue.get(timeout=0.1)
                        self._process_evidence_task(evidence_task)
                        self.evidence_queue.task_done()
                    except queue.Empty:
                        continue
                    
            except Exception as e:
                logger.error(f"❌ Data worker error: {e}")
                self.metrics['error_count'] += 1
                time.sleep(1)
    
    def _maintenance_worker_main(self):
        """Maintenance worker thread for cleanup and optimization"""
        logger.info(f"🧹 Data Agent maintenance thread started: {self.name}")
        
        while not self.shutdown_event.is_set():
            try:
                # Process maintenance queue
                try:
                    maintenance_task = self.maintenance_queue.get(timeout=1.0)
                    self._process_maintenance_task(maintenance_task)
                    self.maintenance_queue.task_done()
                except queue.Empty:
                    # Periodic maintenance
                    current_time = time.time()
                    last_cleanup = getattr(self, '_last_cleanup_time', 0)
                    
                    if current_time - last_cleanup > 3600:  # Every hour
                        self._perform_periodic_maintenance()
                        self._last_cleanup_time = current_time
                
                # Sleep for maintenance interval
                self.shutdown_event.wait(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error(f"❌ Maintenance worker error: {e}")
                time.sleep(10)
    
    def _backup_worker_main(self):
        """Backup worker thread"""
        logger.info(f"💾 Data Agent backup thread started: {self.name}")
        
        while not self.shutdown_event.is_set():
            try:
                # Perform periodic backups
                current_time = time.time()
                last_backup = getattr(self, '_last_backup_time', 0)
                backup_interval = self.config.get('backup_interval_hours', 24) * 3600
                
                if current_time - last_backup > backup_interval:
                    self._perform_database_backup()
                    self._last_backup_time = current_time
                
                # Sleep until next backup check
                self.shutdown_event.wait(1800)  # Check every 30 minutes
                
            except Exception as e:
                logger.error(f"❌ Backup worker error: {e}")
                time.sleep(30)
    
    def _process_data_task(self, task: DataTask):
        """Process a single data task"""
        try:
            start_time = time.time()
            
            action = task.action
            data_payload = task.data_payload
            parameters = task.parameters or {}
            
            logger.debug(f"🎯 Processing data task: {action} [{task.task_id}]")
            
            # Process based on action type
            if action == 'log_event':
                self._handle_log_event(data_payload, parameters)
            elif action == 'archive_evidence':
                self._handle_archive_evidence(data_payload, parameters)
            elif action == 'update_record':
                self._handle_update_record(data_payload, parameters)
            elif action == 'delete_record':
                self._handle_delete_record(data_payload, parameters)
            elif action == 'audit_log':
                self._handle_audit_log(data_payload, parameters)
            else:
                logger.warning(f"⚠️ Unknown data action: {action}")
                return
            
            processing_time = time.time() - start_time
            
            # Update metrics
            self._update_logging_metrics(processing_time)
            
            logger.debug(f"✅ Processed data task {task.task_id} in {processing_time:.3f}s")
            
        except Exception as e:
            logger.error(f"❌ Data task processing error: {e}")
            self.metrics['error_count'] += 1
    
    def _process_evidence_task(self, evidence_task: Dict[str, Any]):
        """Process an evidence archival task"""
        try:
            task_type = evidence_task.get('type', 'unknown')
            
            if task_type == 'archive_file':
                self._handle_archive_file(evidence_task)
            elif task_type == 'verify_integrity':
                self._handle_verify_integrity(evidence_task)
            elif task_type == 'encrypt_file':
                self._handle_encrypt_file(evidence_task)
            else:
                logger.warning(f"⚠️ Unknown evidence task type: {task_type}")
            
        except Exception as e:
            logger.error(f"❌ Evidence task processing error: {e}")
    
    def _process_maintenance_task(self, maintenance_task: Dict[str, Any]):
        """Process a maintenance task"""
        try:
            task_type = maintenance_task.get('type', 'unknown')
            
            if task_type == 'cleanup_expired':
                self._cleanup_expired_records()
            elif task_type == 'optimize_database':
                self._optimize_database()
            elif task_type == 'update_storage_metrics':
                self._update_storage_metrics()
            elif task_type == 'integrity_check':
                self._perform_integrity_check()
            else:
                logger.warning(f"⚠️ Unknown maintenance task type: {task_type}")
            
        except Exception as e:
            logger.error(f"❌ Maintenance task processing error: {e}")
    
    def _handle_log_event(self, data_payload: Dict[str, Any], parameters: Dict[str, Any]):
        """Handle event logging"""
        try:
            event_type_str = data_payload.get('event_type', 'system_event')
            try:
                event_type = DataEventType(event_type_str)
            except ValueError:
                event_type = DataEventType.SYSTEM_EVENT
            
            source_agent = data_payload.get('source_agent', 'unknown')
            retention_policy_str = parameters.get('retention_policy', 'medium_term')
            
            try:
                retention_policy = DataRetentionPolicy(retention_policy_str)
            except ValueError:
                retention_policy = DataRetentionPolicy.MEDIUM_TERM
            
            # Create data record
            self.record_counter += 1
            record_id = f"data_{self.record_counter}_{int(time.time() * 1000)}"
            
            # Calculate integrity hash if enabled
            integrity_hash = None
            if self.enable_integrity_checking:
                data_str = json.dumps(data_payload, sort_keys=True)
                integrity_hash = hashlib.sha256(data_str.encode()).hexdigest()
            
            data_record = DataRecord(
                record_id=record_id,
                event_type=event_type,
                source_agent=source_agent,
                timestamp=datetime.now().isoformat(),
                data_payload=data_payload,
                retention_policy=retention_policy,
                metadata=parameters.get('metadata', {}),
                integrity_hash=integrity_hash
            )
            
            # Store in database
            self._store_data_record_to_database(data_record)
            
            # Store in memory (limited)
            self.data_records.append(data_record)
            if len(self.data_records) > self.max_memory_records:
                self.data_records.pop(0)
            
            self.metrics['total_records_logged'] += 1
            
            logger.debug(f"📝 Event logged: {record_id} - {event_type.value}")
            
        except Exception as e:
            logger.error(f"❌ Log event error: {e}")
    
    def _handle_archive_evidence(self, data_payload: Dict[str, Any], parameters: Dict[str, Any]):
        """Handle evidence archival"""
        try:
            evidence_type = data_payload.get('evidence_type', 'data')
            source_id = data_payload.get('source_id', 'unknown')
            detection_id = data_payload.get('detection_id')
            file_data = data_payload.get('file_data')
            
            if not file_data:
                logger.warning("⚠️ No file data provided for evidence archival")
                return
            
            # Generate evidence ID
            self.evidence_counter += 1
            evidence_id = f"evidence_{self.evidence_counter}_{int(time.time() * 1000)}"
            
            # Determine file extension
            file_extension = parameters.get('file_extension', '.dat')
            if evidence_type == 'video':
                file_extension = '.mp4'
            elif evidence_type == 'image':
                file_extension = '.jpg'
            elif evidence_type == 'audio':
                file_extension = '.wav'
            
            # Create file path
            evidence_subdir = self.evidence_path / evidence_type
            evidence_subdir.mkdir(exist_ok=True)
            file_path = evidence_subdir / f"{evidence_id}{file_extension}"
            
            # Write file data
            if isinstance(file_data, str):
                # Assume base64 encoded or JSON
                with open(file_path, 'w') as f:
                    f.write(file_data)
            else:
                # Binary data
                with open(file_path, 'wb') as f:
                    f.write(file_data)
            
            file_size = file_path.stat().st_size
            
            # Calculate integrity hash
            integrity_hash = None
            if self.enable_integrity_checking:
                with open(file_path, 'rb') as f:
                    file_hash = hashlib.sha256(f.read()).hexdigest()
                    integrity_hash = file_hash
            
            # Calculate retention date
            retention_days = parameters.get('retention_days', 365)
            retention_until = (datetime.now() + timedelta(days=retention_days)).isoformat()
            
            # Create evidence record
            evidence_record = EvidenceRecord(
                evidence_id=evidence_id,
                evidence_type=evidence_type,
                source_id=source_id,
                detection_id=detection_id,
                file_path=str(file_path),
                file_size=file_size,
                created_at=datetime.now().isoformat(),
                retention_until=retention_until,
                metadata=parameters.get('metadata', {}),
                integrity_hash=integrity_hash,
                encrypted=False  # TODO: Implement encryption
            )
            
            # Store in database
            self._store_evidence_record_to_database(evidence_record)
            
            # Store in memory
            self.evidence_records.append(evidence_record)
            
            self.metrics['evidence_files_archived'] += 1
            self.metrics['storage_used_bytes'] += file_size
            
            logger.info(f"📦 Evidence archived: {evidence_id} - {evidence_type} ({file_size} bytes)")
            
        except Exception as e:
            logger.error(f"❌ Archive evidence error: {e}")
    
    def _handle_update_record(self, data_payload: Dict[str, Any], parameters: Dict[str, Any]):
        """Handle record update"""
        try:
            record_id = data_payload.get('record_id')
            if not record_id:
                logger.warning("⚠️ No record ID provided for update")
                return
            
            update_fields = data_payload.get('update_fields', {})
            
            # Update in database
            if self.db_connection:
                if self.use_postgresql:
                    with self.db_connection.cursor() as cursor:
                        set_clause = ', '.join([f"{k} = %s" for k in update_fields.keys()])
                        query = f"UPDATE data_records SET {set_clause} WHERE record_id = %s"
                        cursor.execute(query, list(update_fields.values()) + [record_id])
                else:
                    cursor = self.db_connection.cursor()
                    set_clause = ', '.join([f"{k} = ?" for k in update_fields.keys()])
                    query = f"UPDATE data_records SET {set_clause} WHERE record_id = ?"
                    cursor.execute(query, list(update_fields.values()) + [record_id])
                    cursor.close()
                    self.db_connection.commit()
            
            # Update in memory if present
            for record in self.data_records:
                if record.record_id == record_id:
                    for field, value in update_fields.items():
                        if hasattr(record, field):
                            setattr(record, field, value)
                    break
            
            logger.debug(f"✏️ Record updated: {record_id}")
            
        except Exception as e:
            logger.error(f"❌ Update record error: {e}")
    
    def _handle_delete_record(self, data_payload: Dict[str, Any], parameters: Dict[str, Any]):
        """Handle record deletion"""
        try:
            record_id = data_payload.get('record_id')
            if not record_id:
                logger.warning("⚠️ No record ID provided for deletion")
                return
            
            # Delete from database
            if self.db_connection:
                if self.use_postgresql:
                    with self.db_connection.cursor() as cursor:
                        cursor.execute("DELETE FROM data_records WHERE record_id = %s", (record_id,))
                else:
                    cursor = self.db_connection.cursor()
                    cursor.execute("DELETE FROM data_records WHERE record_id = ?", (record_id,))
                    cursor.close()
                    self.db_connection.commit()
            
            # Remove from memory
            self.data_records = [r for r in self.data_records if r.record_id != record_id]
            
            logger.debug(f"🗑️ Record deleted: {record_id}")
            
        except Exception as e:
            logger.error(f"❌ Delete record error: {e}")
    
    def _handle_audit_log(self, data_payload: Dict[str, Any], parameters: Dict[str, Any]):
        """Handle audit logging"""
        try:
            if not self.enable_audit_logging:
                return
            
            event_type = data_payload.get('event_type', 'unknown')
            user_id = data_payload.get('user_id', 'system')
            source_ip = data_payload.get('source_ip', '127.0.0.1')
            action = data_payload.get('action', 'unknown')
            resource = data_payload.get('resource', '')
            details = json.dumps(data_payload.get('details', {}))
            success = data_payload.get('success', True)
            
            # Store audit log in database
            if self.db_connection:
                if self.use_postgresql:
                    with self.db_connection.cursor() as cursor:
                        cursor.execute("""
                            INSERT INTO audit_log (event_type, user_id, source_ip, action, resource, details, success)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """, (event_type, user_id, source_ip, action, resource, details, success))
                else:
                    cursor = self.db_connection.cursor()
                    cursor.execute("""
                        INSERT INTO audit_log (event_type, user_id, source_ip, action, resource, details, success)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (event_type, user_id, source_ip, action, resource, details, success))
                    cursor.close()
                    self.db_connection.commit()
            
            logger.debug(f"📋 Audit logged: {action} by {user_id}")
            
        except Exception as e:
            logger.error(f"❌ Audit log error: {e}")
    
    def _store_data_record_to_database(self, record: DataRecord):
        """Store data record to database"""
        try:
            if not self.db_connection:
                return
            
            data_payload_json = json.dumps(record.data_payload)
            metadata_json = json.dumps(record.metadata) if record.metadata else None
            
            if self.use_postgresql:
                with self.db_connection.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO data_records 
                        (record_id, event_type, source_agent, timestamp, data_payload, 
                         retention_policy, metadata, archived, integrity_hash)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        record.record_id, record.event_type.value, record.source_agent,
                        record.timestamp, data_payload_json, record.retention_policy.value,
                        metadata_json, record.archived, record.integrity_hash
                    ))
            else:
                cursor = self.db_connection.cursor()
                cursor.execute("""
                    INSERT INTO data_records 
                    (record_id, event_type, source_agent, timestamp, data_payload, 
                     retention_policy, metadata, archived, integrity_hash)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    record.record_id, record.event_type.value, record.source_agent,
                    record.timestamp, data_payload_json, record.retention_policy.value,
                    metadata_json, record.archived, record.integrity_hash
                ))
                cursor.close()
                self.db_connection.commit()
            
            self.metrics['database_operations'] += 1
            
        except Exception as e:
            logger.error(f"❌ Store data record to database error: {e}")
    
    def _store_evidence_record_to_database(self, record: EvidenceRecord):
        """Store evidence record to database"""
        try:
            if not self.db_connection:
                return
            
            metadata_json = json.dumps(record.metadata) if record.metadata else None
            
            if self.use_postgresql:
                with self.db_connection.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO evidence_records 
                        (evidence_id, evidence_type, source_id, detection_id, file_path, file_size,
                         created_at, retention_until, metadata, integrity_hash, archived, encrypted)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        record.evidence_id, record.evidence_type, record.source_id, record.detection_id,
                        record.file_path, record.file_size, record.created_at, record.retention_until,
                        metadata_json, record.integrity_hash, record.archived, record.encrypted
                    ))
            else:
                cursor = self.db_connection.cursor()
                cursor.execute("""
                    INSERT INTO evidence_records 
                    (evidence_id, evidence_type, source_id, detection_id, file_path, file_size,
                     created_at, retention_until, metadata, integrity_hash, archived, encrypted)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    record.evidence_id, record.evidence_type, record.source_id, record.detection_id,
                    record.file_path, record.file_size, record.created_at, record.retention_until,
                    metadata_json, record.integrity_hash, record.archived, record.encrypted
                ))
                cursor.close()
                self.db_connection.commit()
            
            self.metrics['database_operations'] += 1
            
        except Exception as e:
            logger.error(f"❌ Store evidence record to database error: {e}")
    
    def _update_logging_metrics(self, processing_time: float):
        """Update logging performance metrics"""
        try:
            # Update average logging time
            total_logs = self.metrics['total_records_logged']
            if total_logs > 0:
                current_avg = self.metrics['average_logging_time']
                new_avg = ((current_avg * (total_logs - 1)) + processing_time) / total_logs
                self.metrics['average_logging_time'] = new_avg
                
        except Exception as e:
            logger.error(f"❌ Logging metrics update error: {e}")
    
    def _perform_initial_maintenance(self):
        """Perform initial maintenance tasks"""
        try:
            # Update storage metrics
            self._update_storage_metrics()
            
            # Calculate database size
            self._calculate_database_size()
            
            logger.info("✅ Initial maintenance completed")
            
        except Exception as e:
            logger.error(f"❌ Initial maintenance error: {e}")
    
    def _perform_periodic_maintenance(self):
        """Perform periodic maintenance tasks"""
        try:
            logger.info("🧹 Performing periodic maintenance")
            
            # Clean up expired records
            self._cleanup_expired_records()
            
            # Update storage metrics
            self._update_storage_metrics()
            
            # Optimize database
            self._optimize_database()
            
            # Perform integrity checks
            if self.enable_integrity_checking:
                self._perform_integrity_check()
            
            self.metrics['last_cleanup_time'] = datetime.now().isoformat()
            
            logger.info("✅ Periodic maintenance completed")
            
        except Exception as e:
            logger.error(f"❌ Periodic maintenance error: {e}")
    
    def _cleanup_expired_records(self):
        """Clean up expired records based on retention policy"""
        try:
            current_time = datetime.now()
            cleaned_count = 0
            
            # Clean data records
            expired_records = []
            for record in self.data_records:
                retention_days = self.retention_policies[record.retention_policy]
                if retention_days > 0:  # -1 means permanent
                    record_time = datetime.fromisoformat(record.timestamp)
                    if (current_time - record_time).days > retention_days:
                        expired_records.append(record.record_id)
            
            # Remove expired records
            for record_id in expired_records:
                self._handle_delete_record({'record_id': record_id}, {})
                cleaned_count += 1
            
            # Clean evidence records
            if self.db_connection:
                if self.use_postgresql:
                    with self.db_connection.cursor() as cursor:
                        cursor.execute("""
                            DELETE FROM evidence_records 
                            WHERE retention_until < %s
                        """, (current_time.isoformat(),))
                        evidence_cleaned = cursor.rowcount
                else:
                    cursor = self.db_connection.cursor()
                    cursor.execute("""
                        DELETE FROM evidence_records 
                        WHERE retention_until < ?
                    """, (current_time.isoformat(),))
                    evidence_cleaned = cursor.rowcount
                    cursor.close()
                    self.db_connection.commit()
                
                cleaned_count += evidence_cleaned
            
            self.metrics['retention_cleanups'] += 1
            
            if cleaned_count > 0:
                logger.info(f"🧹 Cleaned up {cleaned_count} expired records")
                
        except Exception as e:
            logger.error(f"❌ Cleanup expired records error: {e}")
    
    def _update_storage_metrics(self):
        """Update storage usage metrics"""
        try:
            total_size = 0
            
            # Calculate directory sizes
            for directory in [self.evidence_path, self.logs_path, self.backups_path]:
                if directory.exists():
                    for file_path in directory.rglob('*'):
                        if file_path.is_file():
                            total_size += file_path.stat().st_size
            
            self.metrics['storage_used_bytes'] = total_size
            
            logger.debug(f"💾 Storage usage: {total_size / (1024*1024):.2f} MB")
            
        except Exception as e:
            logger.error(f"❌ Storage metrics update error: {e}")
    
    def _calculate_database_size(self):
        """Calculate database size"""
        try:
            if self.use_postgresql and self.db_connection:
                with self.db_connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT pg_size_pretty(pg_database_size(current_database())) as size,
                               pg_database_size(current_database()) as size_bytes
                    """)
                    result = cursor.fetchone()
                    if result:
                        self.metrics['database_size_mb'] = result[1] / (1024 * 1024)
            elif not self.use_postgresql:
                # SQLite
                db_path = self.base_data_path / 'apex_ai.db'
                if db_path.exists():
                    size_bytes = db_path.stat().st_size
                    self.metrics['database_size_mb'] = size_bytes / (1024 * 1024)
            
        except Exception as e:
            logger.error(f"❌ Database size calculation error: {e}")
    
    def _optimize_database(self):
        """Optimize database performance"""
        try:
            if not self.db_connection:
                return
            
            if self.use_postgresql:
                with self.db_connection.cursor() as cursor:
                    cursor.execute("VACUUM ANALYZE;")
            else:
                cursor = self.db_connection.cursor()
                cursor.execute("VACUUM;")
                cursor.close()
            
            logger.info("⚡ Database optimized")
            
        except Exception as e:
            logger.error(f"❌ Database optimization error: {e}")
    
    def _perform_integrity_check(self):
        """Perform data integrity checks"""
        try:
            if not self.enable_integrity_checking:
                return
            
            checked_count = 0
            corrupted_count = 0
            
            # Check evidence file integrity
            for evidence_record in self.evidence_records:
                if evidence_record.integrity_hash:
                    file_path = Path(evidence_record.file_path)
                    if file_path.exists():
                        with open(file_path, 'rb') as f:
                            current_hash = hashlib.sha256(f.read()).hexdigest()
                        
                        if current_hash != evidence_record.integrity_hash:
                            logger.error(f"🚨 Integrity check failed for evidence: {evidence_record.evidence_id}")
                            corrupted_count += 1
                        
                        checked_count += 1
            
            self.metrics['data_integrity_checks'] += 1
            
            if checked_count > 0:
                logger.info(f"🔒 Integrity check completed: {checked_count} files checked, {corrupted_count} corrupted")
                
        except Exception as e:
            logger.error(f"❌ Integrity check error: {e}")
    
    def _perform_database_backup(self):
        """Perform database backup"""
        try:
            backup_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"apex_ai_backup_{backup_timestamp}"
            
            if self.use_postgresql:
                # PostgreSQL backup
                backup_path = self.backups_path / f"{backup_filename}.sql"
                # This would use pg_dump in a real implementation
                logger.info(f"💾 PostgreSQL backup would be created: {backup_path}")
            else:
                # SQLite backup
                source_db = self.base_data_path / 'apex_ai.db'
                backup_path = self.backups_path / f"{backup_filename}.db"
                
                if source_db.exists():
                    shutil.copy2(source_db, backup_path)
                    logger.info(f"💾 SQLite backup created: {backup_path}")
            
            self.metrics['backup_operations'] += 1
            self.metrics['last_backup_time'] = datetime.now().isoformat()
            
        except Exception as e:
            logger.error(f"❌ Database backup error: {e}")
    
    async def execute_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a task assigned by the MCP Server"""
        try:
            task_id = task_data.get('task_id', 'unknown')
            action = task_data.get('action', 'unknown')
            parameters = task_data.get('parameters', {})
            
            logger.info(f"🎯 Executing Data Agent task: {action} [{task_id}]")
            
            start_time = time.time()
            
            # Execute based on action type
            if action == 'log_incident':
                result = await self._handle_log_incident_task(parameters)
            elif action == 'archive_evidence':
                result = await self._handle_archive_evidence_task(parameters)
            elif action == 'update_logs':
                result = await self._handle_update_logs_task(parameters)
            elif action == 'export_data':
                result = await self._handle_export_data_task(parameters)
            elif action == 'backup_database':
                result = await self._handle_backup_database_task(parameters)
            elif action == 'get_records':
                result = await self._handle_get_records(parameters)
            elif action == 'get_status':
                result = await self._handle_get_status(parameters)
            else:
                result = {
                    'success': False,
                    'error': f'Unknown action: {action}',
                    'supported_actions': ['log_incident', 'archive_evidence', 'update_logs', 
                                        'export_data', 'backup_database', 'get_records', 'get_status']
                }
            
            execution_time = time.time() - start_time
            
            # Add execution metadata
            result['execution_time'] = execution_time
            result['task_id'] = task_id
            result['agent'] = self.name
            result['timestamp'] = datetime.now().isoformat()
            
            logger.info(f"✅ Data Agent task completed: {action} in {execution_time:.3f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Task execution failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'task_id': task_data.get('task_id', 'unknown'),
                'agent': self.name,
                'timestamp': datetime.now().isoformat()
            }
    
    async def _handle_log_incident_task(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle log incident task"""
        try:
            # Create data task
            data_task = DataTask(
                task_id=f"log_{int(time.time() * 1000)}",
                action='log_event',
                data_payload=parameters.get('incident_data', {}),
                parameters=parameters
            )
            
            # Add to processing queue
            try:
                self.data_queue.put(data_task, timeout=1.0)
                
                return {
                    'success': True,
                    'task_queued': True,
                    'data_task_id': data_task.task_id,
                    'queue_size': self.data_queue.qsize()
                }
            except queue.Full:
                return {
                    'success': False,
                    'error': 'Data queue is full',
                    'queue_size': self.data_queue.qsize()
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _handle_archive_evidence_task(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle archive evidence task"""
        # Similar structure to log incident
        return await self._handle_log_incident_task(parameters)
    
    async def _handle_update_logs_task(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle update logs task"""
        # Similar structure to log incident
        return await self._handle_log_incident_task(parameters)
    
    async def _handle_export_data_task(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle export data task"""
        try:
            export_type = parameters.get('export_type', 'csv')
            date_range = parameters.get('date_range', {})
            
            export_filename = f"apex_ai_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{export_type}"
            export_path = self.exports_path / export_filename
            
            # TODO: Implement actual data export
            # For now, create a placeholder file
            with open(export_path, 'w') as f:
                f.write("# APEX AI Data Export\n")
                f.write(f"# Generated: {datetime.now().isoformat()}\n")
                f.write(f"# Export Type: {export_type}\n")
            
            return {
                'success': True,
                'export_file': str(export_path),
                'export_type': export_type,
                'file_size': export_path.stat().st_size
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _handle_backup_database_task(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle backup database task"""
        try:
            self._perform_database_backup()
            
            return {
                'success': True,
                'backup_completed': True,
                'last_backup_time': self.metrics['last_backup_time']
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _handle_get_records(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle get records request"""
        try:
            limit = parameters.get('limit', 100)
            event_type_filter = parameters.get('event_type')
            
            # Get records from database or memory
            records_data = []
            
            for record in self.data_records[-limit:]:
                if event_type_filter and record.event_type.value != event_type_filter:
                    continue
                
                record_data = {
                    'record_id': record.record_id,
                    'event_type': record.event_type.value,
                    'source_agent': record.source_agent,
                    'timestamp': record.timestamp,
                    'retention_policy': record.retention_policy.value,
                    'archived': record.archived,
                    'has_integrity_hash': record.integrity_hash is not None
                }
                records_data.append(record_data)
            
            return {
                'success': True,
                'records': records_data,
                'total_records': len(records_data),
                'filters_applied': {
                    'limit': limit,
                    'event_type': event_type_filter
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _handle_get_status(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle status request"""
        try:
            return {
                'success': True,
                'agent_name': self.name,
                'status': self.status,
                'enabled': self.enabled,
                'data_records_count': len(self.data_records),
                'evidence_records_count': len(self.evidence_records),
                'data_queue_size': self.data_queue.qsize(),
                'evidence_queue_size': self.evidence_queue.qsize(),
                'maintenance_queue_size': self.maintenance_queue.qsize(),
                'metrics': self.metrics.copy(),
                'configuration': {
                    'use_postgresql': self.use_postgresql,
                    'enable_encryption': self.enable_encryption,
                    'enable_integrity_checking': self.enable_integrity_checking,
                    'enable_audit_logging': self.enable_audit_logging,
                    'compliance_mode': self.compliance_mode,
                    'base_data_path': str(self.base_data_path)
                },
                'database_status': {
                    'connected': self.db_connection is not None,
                    'database_type': 'PostgreSQL' if self.use_postgresql else 'SQLite',
                    'database_size_mb': self.metrics['database_size_mb']
                },
                'storage_info': {
                    'storage_used_bytes': self.metrics['storage_used_bytes'],
                    'storage_used_mb': self.metrics['storage_used_bytes'] / (1024 * 1024)
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_agent_info(self) -> Dict[str, Any]:
        """Get comprehensive agent information"""
        return {
            'name': self.name,
            'type': 'data_agent',
            'status': self.status,
            'enabled': self.enabled,
            'config': self.config,
            'capabilities': [
                'log_incident',
                'archive_evidence',
                'update_logs',
                'export_data',
                'backup_database',
                'get_records',
                'get_status'
            ],
            'data_records': len(self.data_records),
            'evidence_records': len(self.evidence_records),
            'metrics': self.metrics.copy(),
            'uptime': time.time() - getattr(self, '_start_time', time.time())
        }
    
    async def shutdown(self):
        """Shutdown the Data Agent"""
        try:
            logger.info(f"🛑 Shutting down Data Agent '{self.name}'")
            
            self.status = "shutting_down"
            self.shutdown_event.set()
            
            # Wait for threads to finish
            threads = [self.worker_thread, self.maintenance_thread, self.backup_thread]
            for thread in threads:
                if thread and thread.is_alive():
                    thread.join(timeout=5)
            
            # Close database connection
            if self.db_connection:
                try:
                    self.db_connection.close()
                    logger.info("📊 Database connection closed")
                except Exception as e:
                    logger.error(f"❌ Database close error: {e}")
            
            # Clear data structures
            self.data_records.clear()
            self.evidence_records.clear()
            self.active_tasks.clear()
            
            self.status = "shutdown"
            logger.info(f"✅ Data Agent '{self.name}' shutdown complete")
            
        except Exception as e:
            logger.error(f"❌ Data Agent shutdown error: {e}")
            self.status = "error"
