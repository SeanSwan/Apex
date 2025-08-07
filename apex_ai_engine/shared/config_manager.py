"""
APEX AI SHARED UTILITIES - CONFIGURATION MANAGER
================================================
Central configuration management for all AI agents and services

Features:
- Centralized configuration loading and management
- Environment-specific configurations
- Configuration validation and defaults
- Real-time configuration updates
- Configuration schema enforcement
"""

import os
import yaml
import json
import logging
from typing import Dict, Any, Optional, Union
from pathlib import Path
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class ConfigSection:
    """Represents a configuration section"""
    section_name: str
    config_data: Dict[str, Any]
    last_modified: str
    schema_version: str = "1.0"

class ConfigurationManager:
    """
    Central configuration manager for APEX AI system
    
    Manages loading, validation, and distribution of configuration
    settings across all system components.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path or self._find_config_file()
        self.config_data: Dict[str, Any] = {}
        self.config_sections: Dict[str, ConfigSection] = {}
        self.watchers: Dict[str, list] = {}  # Config change watchers
        
        # Load configuration
        self.load_configuration()
    
    def _find_config_file(self) -> str:
        """Find configuration file in standard locations"""
        possible_paths = [
            'config.yaml',
            'config/config.yaml',
            '../config.yaml',
            os.path.expanduser('~/.apex_ai/config.yaml'),
            '/etc/apex_ai/config.yaml'
        ]
        
        for path in possible_paths:
            if Path(path).exists():
                return path
        
        # Return default path if none found
        return 'config.yaml'
    
    def load_configuration(self):
        """Load configuration from file"""
        try:
            config_path = Path(self.config_path)
            
            if config_path.exists():
                with open(config_path, 'r') as f:
                    if config_path.suffix in ['.yaml', '.yml']:
                        self.config_data = yaml.safe_load(f)
                    elif config_path.suffix == '.json':
                        self.config_data = json.load(f)
                    else:
                        raise ValueError(f"Unsupported config file format: {config_path.suffix}")
                
                logger.info(f"📋 Configuration loaded from {config_path}")
            else:
                logger.warning(f"⚠️ Config file not found: {config_path}, using defaults")
                self.config_data = self._get_default_configuration()
            
            # Parse into sections
            self._parse_config_sections()
            
        except Exception as e:
            logger.error(f"❌ Configuration loading failed: {e}")
            self.config_data = self._get_default_configuration()
            self._parse_config_sections()
    
    def _get_default_configuration(self) -> Dict[str, Any]:
        """Get default configuration"""
        return {
            'system': {
                'name': 'APEX AI Security System',
                'version': '42.1.0',
                'environment': 'development',
                'debug': True,
                'log_level': 'INFO'
            },
            'mcp_server': {
                'host': '0.0.0.0',
                'port': 8766,
                'debug': True,
                'max_concurrent_requests': 100
            },
            'database': {
                'use_postgresql': False,
                'host': 'localhost',
                'port': 5432,
                'database': 'apex_ai',
                'user': 'apex_user',
                'password': '',
                'pool_size': 10
            },
            'agents': {
                'vision_agent': {
                    'enabled': True,
                    'priority': 1,
                    'timeout': 10,
                    'capture_fps': 15,
                    'max_cache_size': 100
                },
                'detection_agent': {
                    'enabled': True,
                    'priority': 1,
                    'timeout': 15,
                    'confidence_threshold': 0.5,
                    'max_history_size': 1000
                },
                'alerting_agent': {
                    'enabled': True,
                    'priority': 2,
                    'timeout': 5,
                    'enable_visual_alerts': True,
                    'enable_audio_alerts': True
                },
                'conversation_agent': {
                    'enabled': True,
                    'priority': 3,
                    'timeout': 20,
                    'enable_voice_synthesis': True,
                    'max_conversation_duration': 300
                },
                'data_agent': {
                    'enabled': True,
                    'priority': 2,
                    'timeout': 10,
                    'enable_encryption': True,
                    'max_memory_records': 10000
                }
            },
            'operational_modes': {
                'default_mode': 'co_pilot',
                'allow_mode_switching': True,
                'autopilot_confidence_threshold': 0.85,
                'cooldown_period_seconds': 30
            },
            'decision_matrix': {
                'rules_file': 'shared/decision_rules.yaml',
                'max_concurrent_decisions': 5,
                'decision_timeout': 10,
                'fallback_to_human': True
            },
            'security': {
                'enable_encryption': True,
                'enable_audit_logging': True,
                'jwt_secret': 'change_this_secret',
                'session_timeout_minutes': 30
            }
        }
    
    def _parse_config_sections(self):
        """Parse configuration into sections"""
        try:
            timestamp = datetime.now().isoformat()
            
            for section_name, section_data in self.config_data.items():
                self.config_sections[section_name] = ConfigSection(
                    section_name=section_name,
                    config_data=section_data,
                    last_modified=timestamp
                )
            
            logger.debug(f"📊 Parsed {len(self.config_sections)} configuration sections")
            
        except Exception as e:
            logger.error(f"❌ Configuration parsing failed: {e}")
    
    def get_config(self, section: str = None, key: str = None, default: Any = None) -> Any:
        """Get configuration value(s)"""
        try:
            if section is None:
                return self.config_data
            
            if section not in self.config_data:
                return default
            
            section_data = self.config_data[section]
            
            if key is None:
                return section_data
            
            return section_data.get(key, default)
            
        except Exception as e:
            logger.error(f"❌ Get config error: {e}")
            return default
    
    def set_config(self, section: str, key: str = None, value: Any = None):
        """Set configuration value"""
        try:
            if section not in self.config_data:
                self.config_data[section] = {}
            
            if key is None:
                # Setting entire section
                self.config_data[section] = value
            else:
                # Setting specific key
                self.config_data[section][key] = value
            
            # Update section metadata
            timestamp = datetime.now().isoformat()
            self.config_sections[section] = ConfigSection(
                section_name=section,
                config_data=self.config_data[section],
                last_modified=timestamp
            )
            
            # Notify watchers
            self._notify_watchers(section, key, value)
            
            logger.debug(f"📝 Configuration updated: {section}.{key}")
            
        except Exception as e:
            logger.error(f"❌ Set config error: {e}")
    
    def save_configuration(self, file_path: str = None):
        """Save configuration to file"""
        try:
            save_path = file_path or self.config_path
            save_path = Path(save_path)
            
            # Ensure directory exists
            save_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(save_path, 'w') as f:
                if save_path.suffix in ['.yaml', '.yml']:
                    yaml.dump(self.config_data, f, default_flow_style=False, indent=2)
                elif save_path.suffix == '.json':
                    json.dump(self.config_data, f, indent=2)
                else:
                    raise ValueError(f"Unsupported save format: {save_path.suffix}")
            
            logger.info(f"💾 Configuration saved to {save_path}")
            
        except Exception as e:
            logger.error(f"❌ Configuration save failed: {e}")
    
    def reload_configuration(self):
        """Reload configuration from file"""
        try:
            logger.info("🔄 Reloading configuration")
            self.load_configuration()
            
            # Notify all watchers of reload
            for section in self.config_sections:
                self._notify_watchers(section, None, self.config_data.get(section))
            
        except Exception as e:
            logger.error(f"❌ Configuration reload failed: {e}")
    
    def add_watcher(self, section: str, callback):
        """Add configuration change watcher"""
        try:
            if section not in self.watchers:
                self.watchers[section] = []
            
            self.watchers[section].append(callback)
            logger.debug(f"👁️ Added config watcher for section: {section}")
            
        except Exception as e:
            logger.error(f"❌ Add watcher error: {e}")
    
    def remove_watcher(self, section: str, callback):
        """Remove configuration change watcher"""
        try:
            if section in self.watchers and callback in self.watchers[section]:
                self.watchers[section].remove(callback)
                logger.debug(f"👁️ Removed config watcher for section: {section}")
                
        except Exception as e:
            logger.error(f"❌ Remove watcher error: {e}")
    
    def _notify_watchers(self, section: str, key: str, value: Any):
        """Notify configuration change watchers"""
        try:
            if section in self.watchers:
                for callback in self.watchers[section]:
                    try:
                        callback(section, key, value)
                    except Exception as e:
                        logger.error(f"❌ Watcher callback error: {e}")
                        
        except Exception as e:
            logger.error(f"❌ Notify watchers error: {e}")
    
    def validate_configuration(self) -> Dict[str, list]:
        """Validate configuration against schema"""
        try:
            errors = {}
            warnings = {}
            
            # Basic validation rules
            required_sections = ['system', 'mcp_server', 'agents']
            
            for section in required_sections:
                if section not in self.config_data:
                    if section not in errors:
                        errors[section] = []
                    errors[section].append(f"Required section '{section}' missing")
            
            # Agent validation
            if 'agents' in self.config_data:
                required_agents = ['vision_agent', 'detection_agent', 'alerting_agent', 
                                 'conversation_agent', 'data_agent']
                
                for agent in required_agents:
                    if agent not in self.config_data['agents']:
                        if 'agents' not in warnings:
                            warnings['agents'] = []
                        warnings['agents'].append(f"Recommended agent '{agent}' not configured")
            
            return {'errors': errors, 'warnings': warnings}
            
        except Exception as e:
            logger.error(f"❌ Configuration validation error: {e}")
            return {'errors': {'validation': [str(e)]}, 'warnings': {}}
    
    def get_agent_config(self, agent_name: str) -> Dict[str, Any]:
        """Get configuration for a specific agent"""
        return self.get_config('agents', agent_name, {})
    
    def get_database_config(self) -> Dict[str, Any]:
        """Get database configuration"""
        return self.get_config('database', default={})
    
    def get_security_config(self) -> Dict[str, Any]:
        """Get security configuration"""
        return self.get_config('security', default={})
    
    def is_debug_mode(self) -> bool:
        """Check if debug mode is enabled"""
        return self.get_config('system', 'debug', False)
    
    def get_log_level(self) -> str:
        """Get configured log level"""
        return self.get_config('system', 'log_level', 'INFO')
    
    def get_system_info(self) -> Dict[str, Any]:
        """Get system information"""
        return {
            'config_path': self.config_path,
            'config_sections': len(self.config_sections),
            'watchers': {section: len(watchers) for section, watchers in self.watchers.items()},
            'system_config': self.get_config('system', default={}),
            'last_loaded': max([section.last_modified for section in self.config_sections.values()]) 
                          if self.config_sections else None
        }

# Global configuration manager instance
config_manager = ConfigurationManager()

# Convenience functions
def get_config(section: str = None, key: str = None, default: Any = None) -> Any:
    """Convenience function to get configuration"""
    return config_manager.get_config(section, key, default)

def set_config(section: str, key: str = None, value: Any = None):
    """Convenience function to set configuration"""
    return config_manager.set_config(section, key, value)

def get_agent_config(agent_name: str) -> Dict[str, Any]:
    """Convenience function to get agent configuration"""
    return config_manager.get_agent_config(agent_name)
