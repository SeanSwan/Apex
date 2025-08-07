"""
APEX AI RULES CONFIGURATION MANAGER
===================================
Configuration management and persistence layer for dynamic security rules
Handles rule storage, validation, serialization, and configuration management

Key Features:
- JSON-based rule configuration persistence
- Real-time rule validation and error checking
- Configuration versioning and backup management
- Integration with geofencing and rules engine
- Hot-reload capability for rule updates
- Configuration templates and presets
- Rule import/export with validation
- Audit trail for configuration changes
"""

import json
import logging
import os
import shutil
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from pathlib import Path
import hashlib
import threading

from .geofencing_manager import GeofencingManager, ZoneType
from .dynamic_rules_engine import DynamicRulesEngine, SecurityRule, RuleAction, RuleConditionType

logger = logging.getLogger(__name__)

class ConfigurationVersion:
    """
    Represents a versioned configuration snapshot
    """
    
    def __init__(self, version_id: str, config_data: Dict[str, Any], 
                 created_at: str, created_by: str, description: str = ""):
        self.version_id = version_id
        self.config_data = config_data
        self.created_at = created_at
        self.created_by = created_by
        self.description = description
        self.checksum = self._calculate_checksum()
    
    def _calculate_checksum(self) -> str:
        """Calculate configuration checksum for integrity verification"""
        config_str = json.dumps(self.config_data, sort_keys=True)
        return hashlib.sha256(config_str.encode()).hexdigest()[:16]

class RulesConfigurationManager:
    """
    Advanced configuration manager for dynamic security rules
    
    Manages rule persistence, validation, versioning, and hot-reload
    capabilities for the dynamic rules engine and geofencing system.
    """
    
    def __init__(self, config_dir: str = None, config: Optional[Dict[str, Any]] = None):
        """
        Initialize rules configuration manager
        
        Args:
            config_dir: Directory for configuration files
            config: Configuration parameters
        """
        self.config = config or {}
        
        # Configuration directory setup
        if config_dir:
            self.config_dir = Path(config_dir)
        else:
            # Default to apex_ai_engine directory
            current_dir = Path(__file__).parent
            self.config_dir = current_dir / "rules_config"
        
        self.config_dir.mkdir(exist_ok=True)
        
        # Configuration files
        self.rules_config_file = self.config_dir / "security_rules.json"
        self.zones_config_file = self.config_dir / "geofence_zones.json"
        self.system_config_file = self.config_dir / "system_config.json"
        self.templates_dir = self.config_dir / "templates"
        self.backups_dir = self.config_dir / "backups"
        self.versions_dir = self.config_dir / "versions"
        
        # Create subdirectories
        self.templates_dir.mkdir(exist_ok=True)
        self.backups_dir.mkdir(exist_ok=True)
        self.versions_dir.mkdir(exist_ok=True)
        
        # Configuration state
        self.current_config_version = None
        self.config_versions: Dict[str, ConfigurationVersion] = {}
        self.config_dirty = False
        
        # Thread safety
        self._lock = threading.RLock()
        
        # Validation settings
        self.validation_enabled = self.config.get('validation_enabled', True)
        self.auto_backup = self.config.get('auto_backup', True)
        self.max_versions = self.config.get('max_versions', 10)
        self.max_backups = self.config.get('max_backups', 20)
        
        # Statistics
        self.stats = {
            'configurations_loaded': 0,
            'configurations_saved': 0,
            'validations_performed': 0,
            'validation_errors': 0,
            'hot_reloads_performed': 0,
            'backups_created': 0,
            'last_save': None,
            'last_load': None
        }
        
        # Initialize default templates
        self._create_default_templates()
        
        logger.info(f"📋 Rules Configuration Manager initialized - Config dir: {self.config_dir}")
    
    def load_complete_configuration(self) -> Dict[str, Any]:
        """
        Load complete system configuration including rules and zones
        
        Returns:
            Complete configuration data
        """
        try:
            with self._lock:
                complete_config = {
                    'metadata': {
                        'loaded_at': datetime.now().isoformat(),
                        'config_version': self._generate_version_id(),
                        'config_dir': str(self.config_dir)
                    },
                    'rules': self._load_rules_config(),
                    'zones': self._load_zones_config(),
                    'system': self._load_system_config()
                }
                
                # Validate configuration
                if self.validation_enabled:
                    validation_result = self.validate_complete_configuration(complete_config)
                    complete_config['validation'] = validation_result
                    
                    if not validation_result['is_valid']:
                        logger.warning(f"⚠️ Loaded configuration has {len(validation_result['errors'])} errors")
                
                self.stats['configurations_loaded'] += 1
                self.stats['last_load'] = datetime.now().isoformat()
                
                logger.info("✅ Complete configuration loaded successfully")
                
                return complete_config
                
        except Exception as e:
            logger.error(f"❌ Failed to load complete configuration: {e}")
            return self._get_default_configuration()
    
    def save_complete_configuration(self, config_data: Dict[str, Any], 
                                   description: str = "", created_by: str = "system") -> bool:
        """
        Save complete system configuration with versioning
        
        Args:
            config_data: Complete configuration data
            description: Version description
            created_by: Who created this configuration
            
        Returns:
            True if configuration was saved successfully
        """
        try:
            with self._lock:
                # Validate configuration before saving
                if self.validation_enabled:
                    validation_result = self.validate_complete_configuration(config_data)
                    if not validation_result['is_valid']:
                        logger.error(f"❌ Cannot save invalid configuration: {validation_result['errors']}")
                        return False
                
                # Create backup if auto-backup enabled
                if self.auto_backup:
                    self._create_backup()
                
                # Save individual configuration files
                success = True
                
                if 'rules' in config_data:
                    success &= self._save_rules_config(config_data['rules'])
                
                if 'zones' in config_data:
                    success &= self._save_zones_config(config_data['zones'])
                
                if 'system' in config_data:
                    success &= self._save_system_config(config_data['system'])
                
                if success:
                    # Create version snapshot
                    version_id = self._generate_version_id()
                    version = ConfigurationVersion(
                        version_id=version_id,
                        config_data=config_data.copy(),
                        created_at=datetime.now().isoformat(),
                        created_by=created_by,
                        description=description
                    )
                    
                    self._save_configuration_version(version)
                    self.current_config_version = version_id
                    
                    # Update statistics
                    self.stats['configurations_saved'] += 1
                    self.stats['last_save'] = datetime.now().isoformat()
                    
                    logger.info(f"✅ Configuration saved successfully - Version: {version_id}")
                    
                    return True
                else:
                    logger.error("❌ Failed to save one or more configuration components")
                    return False
                
        except Exception as e:
            logger.error(f"❌ Failed to save complete configuration: {e}")
            return False
    
    def validate_complete_configuration(self, config_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate complete system configuration
        
        Args:
            config_data: Configuration data to validate
            
        Returns:
            Validation results
        """
        validation_result = {
            'is_valid': True,
            'errors': [],
            'warnings': [],
            'component_validations': {}
        }
        
        try:
            # Validate individual components
            if 'rules' in config_data:
                rules_validation = self._validate_rules_config(config_data['rules'])
                validation_result['component_validations']['rules'] = rules_validation
                
                if not rules_validation['is_valid']:
                    validation_result['is_valid'] = False
                    validation_result['errors'].extend([f"Rules: {err}" for err in rules_validation['errors']])
                validation_result['warnings'].extend([f"Rules: {warn}" for warn in rules_validation['warnings']])
            
            if 'zones' in config_data:
                zones_validation = self._validate_zones_config(config_data['zones'])
                validation_result['component_validations']['zones'] = zones_validation
                
                if not zones_validation['is_valid']:
                    validation_result['is_valid'] = False
                    validation_result['errors'].extend([f"Zones: {err}" for err in zones_validation['errors']])
                validation_result['warnings'].extend([f"Zones: {warn}" for warn in zones_validation['warnings']])
            
            if 'system' in config_data:
                system_validation = self._validate_system_config(config_data['system'])
                validation_result['component_validations']['system'] = system_validation
                
                if not system_validation['is_valid']:
                    validation_result['is_valid'] = False
                    validation_result['errors'].extend([f"System: {err}" for err in system_validation['errors']])
                validation_result['warnings'].extend([f"System: {warn}" for warn in system_validation['warnings']])
            
            # Cross-component validation
            cross_validation = self._validate_cross_component_references(config_data)
            validation_result['component_validations']['cross_references'] = cross_validation
            
            if not cross_validation['is_valid']:
                validation_result['is_valid'] = False
                validation_result['errors'].extend([f"Cross-ref: {err}" for err in cross_validation['errors']])
            validation_result['warnings'].extend([f"Cross-ref: {warn}" for warn in cross_validation['warnings']])
            
            # Update statistics
            self.stats['validations_performed'] += 1
            if not validation_result['is_valid']:
                self.stats['validation_errors'] += 1
            
        except Exception as e:
            validation_result['is_valid'] = False
            validation_result['errors'].append(f"Validation exception: {str(e)}")
            logger.error(f"❌ Configuration validation failed: {e}")
        
        return validation_result
    
    def get_configuration_template(self, template_name: str) -> Optional[Dict[str, Any]]:
        """
        Get configuration template
        
        Args:
            template_name: Name of template to retrieve
            
        Returns:
            Template configuration data
        """
        template_file = self.templates_dir / f"{template_name}.json"
        
        if not template_file.exists():
            logger.warning(f"⚠️ Template {template_name} not found")
            return None
        
        try:
            with open(template_file, 'r') as f:
                template_data = json.load(f)
            
            logger.info(f"📄 Loaded template: {template_name}")
            return template_data
            
        except Exception as e:
            logger.error(f"❌ Failed to load template {template_name}: {e}")
            return None
    
    def save_configuration_template(self, template_name: str, config_data: Dict[str, Any], 
                                   description: str = "") -> bool:
        """
        Save configuration as template
        
        Args:
            template_name: Name for the template
            config_data: Configuration data to save as template
            description: Template description
            
        Returns:
            True if template was saved successfully
        """
        try:
            template_file = self.templates_dir / f"{template_name}.json"
            
            template_metadata = {
                'template_name': template_name,
                'description': description,
                'created_at': datetime.now().isoformat(),
                'version': '1.0'
            }
            
            template_data = {
                'metadata': template_metadata,
                'configuration': config_data
            }
            
            with open(template_file, 'w') as f:
                json.dump(template_data, f, indent=2)
            
            logger.info(f"💾 Saved template: {template_name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to save template {template_name}: {e}")
            return False
    
    def list_configuration_versions(self) -> List[Dict[str, Any]]:
        """
        List all available configuration versions
        
        Returns:
            List of version information
        """
        versions = []
        
        try:
            for version_file in self.versions_dir.glob("*.json"):
                try:
                    with open(version_file, 'r') as f:
                        version_data = json.load(f)
                    
                    version_info = {
                        'version_id': version_data['version_id'],
                        'created_at': version_data['created_at'],
                        'created_by': version_data['created_by'],
                        'description': version_data['description'],
                        'checksum': version_data['checksum'],
                        'is_current': version_data['version_id'] == self.current_config_version
                    }
                    
                    versions.append(version_info)
                    
                except Exception as e:
                    logger.warning(f"⚠️ Failed to read version file {version_file}: {e}")
            
            # Sort by creation date (newest first)
            versions.sort(key=lambda v: v['created_at'], reverse=True)
            
        except Exception as e:
            logger.error(f"❌ Failed to list configuration versions: {e}")
        
        return versions
    
    def restore_configuration_version(self, version_id: str) -> bool:
        """
        Restore a specific configuration version
        
        Args:
            version_id: Version identifier to restore
            
        Returns:
            True if version was restored successfully
        """
        try:
            version_file = self.versions_dir / f"{version_id}.json"
            
            if not version_file.exists():
                logger.error(f"❌ Version {version_id} not found")
                return False
            
            with open(version_file, 'r') as f:
                version_data = json.load(f)
            
            # Verify checksum
            version = ConfigurationVersion(
                version_id=version_data['version_id'],
                config_data=version_data['config_data'],
                created_at=version_data['created_at'],
                created_by=version_data['created_by'],
                description=version_data['description']
            )
            
            if version.checksum != version_data['checksum']:
                logger.error(f"❌ Version {version_id} checksum mismatch - data may be corrupted")
                return False
            
            # Create backup before restore
            if self.auto_backup:
                self._create_backup()
            
            # Restore configuration
            success = self.save_complete_configuration(
                version.config_data,
                f"Restored from version {version_id}",
                "configuration_manager"
            )
            
            if success:
                logger.info(f"✅ Configuration restored from version {version_id}")
                return True
            else:
                logger.error(f"❌ Failed to restore configuration from version {version_id}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to restore version {version_id}: {e}")
            return False
    
    def hot_reload_configuration(self, rules_engine: DynamicRulesEngine, 
                               geofencing_manager: GeofencingManager) -> bool:
        """
        Hot-reload configuration into running engines
        
        Args:
            rules_engine: Rules engine to update
            geofencing_manager: Geofencing manager to update
            
        Returns:
            True if hot-reload was successful
        """
        try:
            with self._lock:
                # Load latest configuration
                config_data = self.load_complete_configuration()
                
                if 'validation' in config_data and not config_data['validation']['is_valid']:
                    logger.error("❌ Cannot hot-reload invalid configuration")
                    return False
                
                # Hot-reload zones
                if 'zones' in config_data:
                    zones_data = config_data['zones']
                    
                    # Clear existing zones
                    geofencing_manager.zones.clear()
                    geofencing_manager.zones_by_camera.clear()
                    geofencing_manager.zones_by_monitor.clear()
                    
                    # Load new zones
                    for zone_data in zones_data.get('zones', []):
                        try:
                            geofencing_manager.create_zone(zone_data)
                        except Exception as e:
                            logger.error(f"❌ Failed to reload zone {zone_data.get('zone_id')}: {e}")
                
                # Hot-reload rules
                if 'rules' in config_data:
                    rules_data = config_data['rules']
                    
                    # Clear existing rules
                    rules_engine.rules.clear()
                    rules_engine.rules_by_zone.clear()
                    rules_engine.rules_by_priority.clear()
                    
                    # Load new rules
                    for rule_data in rules_data.get('rules', []):
                        try:
                            rules_engine.create_rule(rule_data)
                        except Exception as e:
                            logger.error(f"❌ Failed to reload rule {rule_data.get('rule_id')}: {e}")
                
                # Update statistics
                self.stats['hot_reloads_performed'] += 1
                
                logger.info("🔄 Configuration hot-reloaded successfully")
                return True
                
        except Exception as e:
            logger.error(f"❌ Hot-reload failed: {e}")
            return False
    
    def export_configuration(self, export_path: str, include_templates: bool = False, 
                           include_versions: bool = False) -> bool:
        """
        Export complete configuration to file
        
        Args:
            export_path: Path for export file
            include_templates: Include templates in export
            include_versions: Include version history in export
            
        Returns:
            True if export was successful
        """
        try:
            config_data = self.load_complete_configuration()
            
            export_data = {
                'export_metadata': {
                    'exported_at': datetime.now().isoformat(),
                    'exported_by': 'configuration_manager',
                    'export_version': '1.0',
                    'include_templates': include_templates,
                    'include_versions': include_versions
                },
                'configuration': config_data
            }
            
            # Include templates if requested
            if include_templates:
                templates = {}
                for template_file in self.templates_dir.glob("*.json"):
                    template_name = template_file.stem
                    template_data = self.get_configuration_template(template_name)
                    if template_data:
                        templates[template_name] = template_data
                export_data['templates'] = templates
            
            # Include versions if requested
            if include_versions:
                export_data['versions'] = self.list_configuration_versions()
            
            # Write export file
            with open(export_path, 'w') as f:
                json.dump(export_data, f, indent=2)
            
            logger.info(f"📤 Configuration exported to: {export_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Configuration export failed: {e}")
            return False
    
    def import_configuration(self, import_path: str, 
                           overwrite_existing: bool = False) -> Dict[str, Any]:
        """
        Import configuration from file
        
        Args:
            import_path: Path to import file
            overwrite_existing: Whether to overwrite existing configuration
            
        Returns:
            Import results
        """
        import_result = {
            'success': False,
            'imported_components': [],
            'skipped_components': [],
            'errors': []
        }
        
        try:
            with open(import_path, 'r') as f:
                import_data = json.load(f)
            
            # Validate import structure
            if 'configuration' not in import_data:
                import_result['errors'].append("Invalid import file: missing configuration section")
                return import_result
            
            config_data = import_data['configuration']
            
            # Create backup before import
            if self.auto_backup:
                self._create_backup()
            
            # Import configuration
            if overwrite_existing or not self.rules_config_file.exists():
                success = self.save_complete_configuration(
                    config_data,
                    f"Imported from {import_path}",
                    "configuration_manager"
                )
                
                if success:
                    import_result['success'] = True
                    import_result['imported_components'].append('complete_configuration')
                else:
                    import_result['errors'].append("Failed to save imported configuration")
            else:
                import_result['skipped_components'].append('complete_configuration')
                import_result['errors'].append("Configuration exists and overwrite not enabled")
            
            # Import templates if present
            if 'templates' in import_data:
                for template_name, template_data in import_data['templates'].items():
                    template_success = self.save_configuration_template(
                        template_name, template_data, f"Imported template"
                    )
                    if template_success:
                        import_result['imported_components'].append(f'template_{template_name}')
                    else:
                        import_result['errors'].append(f"Failed to import template {template_name}")
            
            logger.info(f"📥 Configuration import complete: {len(import_result['imported_components'])} components")
            
        except Exception as e:
            import_result['errors'].append(f"Import failed: {str(e)}")
            logger.error(f"❌ Configuration import failed: {e}")
        
        return import_result
    
    def get_configuration_statistics(self) -> Dict[str, Any]:
        """
        Get comprehensive configuration statistics
        
        Returns:
            Statistics dictionary
        """
        try:
            config_data = self.load_complete_configuration()
            
            stats = {
                **self.stats,
                'configuration_status': {
                    'rules_count': len(config_data.get('rules', {}).get('rules', [])),
                    'zones_count': len(config_data.get('zones', {}).get('zones', [])),
                    'templates_count': len(list(self.templates_dir.glob("*.json"))),
                    'versions_count': len(list(self.versions_dir.glob("*.json"))),
                    'backups_count': len(list(self.backups_dir.glob("*.json"))),
                    'current_version': self.current_config_version
                },
                'file_sizes': {
                    'rules_config_kb': round(self.rules_config_file.stat().st_size / 1024, 2) if self.rules_config_file.exists() else 0,
                    'zones_config_kb': round(self.zones_config_file.stat().st_size / 1024, 2) if self.zones_config_file.exists() else 0,
                    'total_config_dir_mb': round(sum(f.stat().st_size for f in self.config_dir.rglob('*') if f.is_file()) / (1024*1024), 2)
                },
                'validation_status': config_data.get('validation', {'is_valid': False})
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"❌ Failed to get configuration statistics: {e}")
            return self.stats
    
    # ========== PRIVATE METHODS ==========
    
    def _load_rules_config(self) -> Dict[str, Any]:
        """Load rules configuration"""
        if not self.rules_config_file.exists():
            return {'rules': []}
        
        try:
            with open(self.rules_config_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"❌ Failed to load rules config: {e}")
            return {'rules': []}
    
    def _load_zones_config(self) -> Dict[str, Any]:
        """Load zones configuration"""
        if not self.zones_config_file.exists():
            return {'zones': []}
        
        try:
            with open(self.zones_config_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"❌ Failed to load zones config: {e}")
            return {'zones': []}
    
    def _load_system_config(self) -> Dict[str, Any]:
        """Load system configuration"""
        if not self.system_config_file.exists():
            return self._get_default_system_config()
        
        try:
            with open(self.system_config_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"❌ Failed to load system config: {e}")
            return self._get_default_system_config()
    
    def _save_rules_config(self, rules_data: Dict[str, Any]) -> bool:
        """Save rules configuration"""
        try:
            with open(self.rules_config_file, 'w') as f:
                json.dump(rules_data, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save rules config: {e}")
            return False
    
    def _save_zones_config(self, zones_data: Dict[str, Any]) -> bool:
        """Save zones configuration"""
        try:
            with open(self.zones_config_file, 'w') as f:
                json.dump(zones_data, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save zones config: {e}")
            return False
    
    def _save_system_config(self, system_data: Dict[str, Any]) -> bool:
        """Save system configuration"""
        try:
            with open(self.system_config_file, 'w') as f:
                json.dump(system_data, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save system config: {e}")
            return False
    
    def _validate_rules_config(self, rules_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate rules configuration"""
        validation = {'is_valid': True, 'errors': [], 'warnings': []}
        
        try:
            rules_list = rules_data.get('rules', [])
            
            for rule_data in rules_list:
                # Check required fields
                required_fields = ['rule_id', 'name', 'zone_ids', 'conditions', 'actions']
                for field in required_fields:
                    if field not in rule_data:
                        validation['errors'].append(f"Rule missing required field: {field}")
                        validation['is_valid'] = False
                
                # Validate rule ID uniqueness
                rule_ids = [r.get('rule_id') for r in rules_list]
                if len(rule_ids) != len(set(rule_ids)):
                    validation['errors'].append("Duplicate rule IDs found")
                    validation['is_valid'] = False
            
        except Exception as e:
            validation['errors'].append(f"Rules validation error: {str(e)}")
            validation['is_valid'] = False
        
        return validation
    
    def _validate_zones_config(self, zones_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate zones configuration"""
        validation = {'is_valid': True, 'errors': [], 'warnings': []}
        
        try:
            zones_list = zones_data.get('zones', [])
            
            for zone_data in zones_list:
                # Check required fields
                required_fields = ['zone_id', 'name', 'polygon_points', 'zone_type', 'camera_id']
                for field in required_fields:
                    if field not in zone_data:
                        validation['errors'].append(f"Zone missing required field: {field}")
                        validation['is_valid'] = False
                
                # Validate polygon
                polygon_points = zone_data.get('polygon_points', [])
                if len(polygon_points) < 3:
                    validation['errors'].append(f"Zone {zone_data.get('zone_id')} polygon must have at least 3 points")
                    validation['is_valid'] = False
            
            # Validate zone ID uniqueness
            zone_ids = [z.get('zone_id') for z in zones_list]
            if len(zone_ids) != len(set(zone_ids)):
                validation['errors'].append("Duplicate zone IDs found")
                validation['is_valid'] = False
            
        except Exception as e:
            validation['errors'].append(f"Zones validation error: {str(e)}")
            validation['is_valid'] = False
        
        return validation
    
    def _validate_system_config(self, system_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate system configuration"""
        validation = {'is_valid': True, 'errors': [], 'warnings': []}
        
        try:
            # Basic validation for system config
            # In production, would validate specific system settings
            pass
            
        except Exception as e:
            validation['errors'].append(f"System validation error: {str(e)}")
            validation['is_valid'] = False
        
        return validation
    
    def _validate_cross_component_references(self, config_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate cross-component references"""
        validation = {'is_valid': True, 'errors': [], 'warnings': []}
        
        try:
            # Get zone IDs
            zones_data = config_data.get('zones', {})
            zone_ids = {z.get('zone_id') for z in zones_data.get('zones', [])}
            
            # Check rule zone references
            rules_data = config_data.get('rules', {})
            for rule_data in rules_data.get('rules', []):
                rule_zone_ids = rule_data.get('zone_ids', [])
                for zone_id in rule_zone_ids:
                    if zone_id not in zone_ids:
                        validation['warnings'].append(f"Rule {rule_data.get('rule_id')} references unknown zone: {zone_id}")
            
        except Exception as e:
            validation['errors'].append(f"Cross-reference validation error: {str(e)}")
            validation['is_valid'] = False
        
        return validation
    
    def _create_backup(self) -> bool:
        """Create configuration backup"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = self.backups_dir / f"config_backup_{timestamp}.json"
            
            # Load current configuration
            current_config = self.load_complete_configuration()
            
            # Add backup metadata
            backup_data = {
                'backup_metadata': {
                    'created_at': datetime.now().isoformat(),
                    'backup_id': timestamp,
                    'original_version': self.current_config_version
                },
                'configuration': current_config
            }
            
            # Save backup
            with open(backup_file, 'w') as f:
                json.dump(backup_data, f, indent=2)
            
            # Cleanup old backups
            self._cleanup_old_backups()
            
            self.stats['backups_created'] += 1
            logger.info(f"💾 Configuration backup created: {backup_file}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create backup: {e}")
            return False
    
    def _cleanup_old_backups(self):
        """Clean up old backup files"""
        try:
            backup_files = sorted(self.backups_dir.glob("config_backup_*.json"))
            
            if len(backup_files) > self.max_backups:
                files_to_remove = backup_files[:-self.max_backups]
                for file_to_remove in files_to_remove:
                    file_to_remove.unlink()
                    logger.debug(f"🧹 Removed old backup: {file_to_remove}")
                    
        except Exception as e:
            logger.warning(f"⚠️ Failed to cleanup old backups: {e}")
    
    def _cleanup_old_versions(self):
        """Clean up old version files"""
        try:
            version_files = sorted(self.versions_dir.glob("*.json"))
            
            if len(version_files) > self.max_versions:
                files_to_remove = version_files[:-self.max_versions]
                for file_to_remove in files_to_remove:
                    file_to_remove.unlink()
                    logger.debug(f"🧹 Removed old version: {file_to_remove}")
                    
        except Exception as e:
            logger.warning(f"⚠️ Failed to cleanup old versions: {e}")
    
    def _save_configuration_version(self, version: ConfigurationVersion):
        """Save configuration version"""
        try:
            version_file = self.versions_dir / f"{version.version_id}.json"
            
            version_data = {
                'version_id': version.version_id,
                'config_data': version.config_data,
                'created_at': version.created_at,
                'created_by': version.created_by,
                'description': version.description,
                'checksum': version.checksum
            }
            
            with open(version_file, 'w') as f:
                json.dump(version_data, f, indent=2)
            
            # Cleanup old versions
            self._cleanup_old_versions()
            
            logger.debug(f"💾 Saved configuration version: {version.version_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to save configuration version: {e}")
    
    def _generate_version_id(self) -> str:
        """Generate unique version identifier"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"v_{timestamp}_{hash(str(datetime.now())) % 10000:04d}"
    
    def _get_default_configuration(self) -> Dict[str, Any]:
        """Get default configuration structure"""
        return {
            'metadata': {
                'loaded_at': datetime.now().isoformat(),
                'config_version': 'default',
                'config_dir': str(self.config_dir)
            },
            'rules': {'rules': []},
            'zones': {'zones': []},
            'system': self._get_default_system_config(),
            'validation': {'is_valid': True, 'errors': [], 'warnings': []}
        }
    
    def _get_default_system_config(self) -> Dict[str, Any]:
        """Get default system configuration"""
        return {
            'version': '1.0',
            'created_at': datetime.now().isoformat(),
            'alert_settings': {
                'enable_visual_alerts': True,
                'enable_audio_alerts': True,
                'enable_voice_responses': True,
                'default_confidence_threshold': 0.75
            },
            'performance_settings': {
                'max_concurrent_evaluations': 100,
                'cache_ttl_seconds': 60,
                'enable_performance_monitoring': True
            },
            'security_settings': {
                'audit_log_enabled': True,
                'evidence_archival_enabled': True,
                'encryption_enabled': False
            }
        }
    
    def _create_default_templates(self):
        """Create default configuration templates"""
        try:
            # Basic security rule template
            basic_security_template = {
                'metadata': {
                    'template_name': 'basic_security',
                    'description': 'Basic security configuration for small properties',
                    'created_at': datetime.now().isoformat(),
                    'version': '1.0'
                },
                'configuration': {
                    'rules': {
                        'rules': [
                            {
                                'rule_id': 'basic_weapon_detection',
                                'name': 'Weapon Detection Alert',
                                'description': 'Alert on weapon detection in any zone',
                                'zone_ids': ['*'],  # Apply to all zones
                                'conditions': [
                                    {
                                        'condition_id': 'weapon_present',
                                        'condition_type': 'object_type',
                                        'parameters': {
                                            'forbidden_types': ['weapon', 'gun', 'knife'],
                                            'min_confidence': 0.8
                                        },
                                        'operator': 'and',
                                        'weight': 1.0
                                    }
                                ],
                                'actions': ['alert', 'record', 'escalate'],
                                'is_active': True,
                                'priority': 10,
                                'confidence_threshold': 0.8
                            }
                        ]
                    },
                    'zones': {
                        'zones': [
                            {
                                'zone_id': 'entrance_zone',
                                'name': 'Main Entrance',
                                'polygon_points': [[0.0, 0.0], [1.0, 0.0], [1.0, 0.3], [0.0, 0.3]],
                                'zone_type': 'entry_exit',
                                'coordinate_system': 'normalized',
                                'camera_id': 'CAM-01',
                                'monitor_id': 'MONITOR-1',
                                'is_active': True,
                                'confidence_threshold': 0.75
                            }
                        ]
                    }
                }
            }
            
            # Save default template
            template_file = self.templates_dir / "basic_security.json"
            if not template_file.exists():
                with open(template_file, 'w') as f:
                    json.dump(basic_security_template, f, indent=2)
                logger.info("📄 Created default basic security template")
                
        except Exception as e:
            logger.warning(f"⚠️ Failed to create default templates: {e}")
