"""
APEX AI GEOFENCING MODULE
========================
Advanced geofencing and dynamic rules engine for the APEX AI Security Platform

This module provides comprehensive polygon-based zone management and dynamic
security rule evaluation for real-time threat detection and response.

Key Components:
- GeofencingManager: Advanced polygon zone management
- DynamicRulesEngine: Complex security rule processing  
- RulesConfigurationManager: Configuration persistence and management

Features:
- Real-time point-in-polygon detection using optimized algorithms
- Multi-condition security rule evaluation with logical operators
- Zone-based threat filtering and escalation
- Time-sensitive rule processing (day/night, business hours)
- Configuration versioning and hot-reload capabilities
- Performance-optimized caching and statistics
"""

from .geofencing_manager import (
    GeofencingManager,
    GeofenceZone,
    ZoneType,
    CoordinateSystem
)

# Dynamic rules engine is at parent level
try:
    from ..dynamic_rules_engine import (
        DynamicRulesEngine,
        SecurityRule,
        RuleCondition,
        RuleAction,
        RuleConditionType,
        RuleOperator,
        RuleEvaluationResult
    )
    
    from ..rules_configuration import (
        RulesConfigurationManager,
        ConfigurationVersion
    )
    
    RULES_ENGINE_AVAILABLE = True
except ImportError:
    RULES_ENGINE_AVAILABLE = False

__all__ = [
    # Geofencing components
    'GeofencingManager',
    'GeofenceZone', 
    'ZoneType',
    'CoordinateSystem',
    
    # Rules engine availability flag
    'RULES_ENGINE_AVAILABLE'
]

# Add rules engine components if available
if RULES_ENGINE_AVAILABLE:
    __all__.extend([
        'DynamicRulesEngine',
        'SecurityRule',
        'RuleCondition', 
        'RuleAction',
        'RuleConditionType',
        'RuleOperator',
        'RuleEvaluationResult',
        'RulesConfigurationManager',
        'ConfigurationVersion'
    ])

__version__ = '1.0.0'
__author__ = 'APEX AI Security Platform'
__description__ = 'Advanced geofencing and dynamic rules engine for AI security systems'
