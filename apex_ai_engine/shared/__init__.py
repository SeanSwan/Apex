"""
APEX AI SHARED UTILITIES
========================
Shared utilities and common functionality for all APEX AI agents and services

This package provides:
- Configuration management
- Database connectivity
- Common data structures
- Utility functions
- Shared constants and enums
"""

from .config_manager import ConfigurationManager, config_manager, get_config, set_config, get_agent_config
from .db_connector import DatabaseConnector, initialize_database, get_db_connector, execute_query, execute_many

__all__ = [
    'ConfigurationManager',
    'config_manager', 
    'get_config',
    'set_config',
    'get_agent_config',
    'DatabaseConnector',
    'initialize_database',
    'get_db_connector', 
    'execute_query',
    'execute_many'
]

__version__ = "42.1.0"
