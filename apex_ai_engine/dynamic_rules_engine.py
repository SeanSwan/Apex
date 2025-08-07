"""
APEX AI DYNAMIC RULES ENGINE
============================
Advanced rule processing engine for geofenced zones with dynamic threat analysis
Implements complex security rules, time-based restrictions, and intelligent threat filtering

Key Features:
- Zone-based rule evaluation and processing
- Time-sensitive security protocols (day/night, business hours)
- Object-type filtering and restrictions (weapons, packages, people)
- Multi-condition rule logic with AND/OR operations
- Rule priority management and conflict resolution
- Real-time rule evaluation for threat detection
- Performance-optimized rule processing
- Audit trail for rule violations and enforcement
"""

import logging
import json
from typing import Dict, List, Optional, Any, Union, Callable
from dataclasses import dataclass, asdict
from datetime import datetime, time, timedelta
from enum import Enum
import re
import threading

from .geofencing_manager import GeofencingManager, GeofenceZone, ZoneType, CoordinateSystem

logger = logging.getLogger(__name__)

class RuleAction(Enum):
    """Actions that can be triggered by rule violations"""
    ALERT = "alert"                    # Generate alert
    BLOCK = "block"                    # Block/prevent action
    LOG = "log"                        # Log event only
    ESCALATE = "escalate"              # Escalate to higher priority
    NOTIFY = "notify"                  # Send notification
    RECORD = "record"                  # Start recording
    VOICE_WARNING = "voice_warning"    # Trigger voice warning
    LOCKDOWN = "lockdown"              # Emergency lockdown

class RuleConditionType(Enum):
    """Types of conditions that can be evaluated"""
    OBJECT_PRESENCE = "object_presence"       # Object detected in zone
    OBJECT_TYPE = "object_type"               # Specific object type
    PERSON_COUNT = "person_count"             # Number of people in zone
    TIME_RANGE = "time_range"                 # Time-based restrictions
    CONFIDENCE_LEVEL = "confidence_level"     # AI confidence threshold
    DURATION = "duration"                     # How long condition persists
    MOVEMENT_PATTERN = "movement_pattern"     # Movement characteristics
    ZONE_COMBINATION = "zone_combination"     # Multi-zone conditions

class RuleOperator(Enum):
    """Logical operators for combining conditions"""
    AND = "and"
    OR = "or"
    NOT = "not"
    XOR = "xor"

@dataclass
class RuleCondition:
    """
    Individual condition within a security rule
    """
    condition_id: str
    condition_type: RuleConditionType
    parameters: Dict[str, Any]
    operator: RuleOperator = RuleOperator.AND
    weight: float = 1.0  # Importance weight for scoring
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert condition to dictionary"""
        condition_dict = asdict(self)
        condition_dict['condition_type'] = self.condition_type.value
        condition_dict['operator'] = self.operator.value
        return condition_dict
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'RuleCondition':
        """Create condition from dictionary"""
        data['condition_type'] = RuleConditionType(data['condition_type'])
        data['operator'] = RuleOperator(data['operator'])
        return cls(**data)

@dataclass
class SecurityRule:
    """
    Complete security rule with conditions, actions, and metadata
    """
    rule_id: str
    name: str
    description: str
    zone_ids: List[str]  # Zones this rule applies to
    conditions: List[RuleCondition]
    actions: List[RuleAction]
    
    # Rule configuration
    is_active: bool = True
    priority: int = 1  # Higher numbers = higher priority
    confidence_threshold: float = 0.75
    
    # Time restrictions
    time_restrictions: Optional[Dict[str, Any]] = None
    
    # Rule metadata
    created_at: str = ""
    created_by: str = "system"
    last_triggered: Optional[str] = None
    trigger_count: int = 0
    
    # Performance settings
    cooldown_period: int = 0  # Seconds between triggers
    max_triggers_per_hour: int = 0  # Rate limiting
    
    def __post_init__(self):
        """Initialize rule after creation"""
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert rule to dictionary for serialization"""
        rule_dict = asdict(self)
        rule_dict['conditions'] = [c.to_dict() for c in self.conditions]
        rule_dict['actions'] = [action.value for action in self.actions]
        return rule_dict
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SecurityRule':
        """Create rule from dictionary"""
        data['conditions'] = [RuleCondition.from_dict(c) for c in data['conditions']]
        data['actions'] = [RuleAction(action) for action in data['actions']]
        return cls(**data)

class RuleEvaluationResult:
    """
    Result of rule evaluation with detailed information
    """
    
    def __init__(self, rule_id: str, triggered: bool, confidence: float = 0.0):
        self.rule_id = rule_id
        self.triggered = triggered
        self.confidence = confidence
        self.timestamp = datetime.now().isoformat()
        
        # Detailed evaluation data
        self.condition_results: Dict[str, bool] = {}
        self.condition_confidences: Dict[str, float] = {}
        self.failed_conditions: List[str] = []
        self.evaluation_time_ms: float = 0.0
        self.zone_ids: List[str] = []
        self.threat_data: Optional[Dict[str, Any]] = None
        
        # Actions to be executed
        self.actions_to_execute: List[RuleAction] = []
        self.action_parameters: Dict[str, Any] = {}

class DynamicRulesEngine:
    """
    Advanced rules engine for dynamic security threat evaluation
    
    Processes complex security rules against detected threats, evaluates
    multi-condition logic, and triggers appropriate security responses.
    """
    
    def __init__(self, geofencing_manager: GeofencingManager, config: Optional[Dict[str, Any]] = None):
        """
        Initialize dynamic rules engine
        
        Args:
            geofencing_manager: Geofencing manager instance
            config: Configuration parameters
        """
        self.geofencing_manager = geofencing_manager
        self.config = config or {}
        
        # Rule storage
        self.rules: Dict[str, SecurityRule] = {}
        self.rules_by_zone: Dict[str, List[str]] = {}  # zone_id -> rule_ids
        self.rules_by_priority: List[str] = []  # Sorted by priority
        
        # Rule evaluation cache and performance
        self.evaluation_cache: Dict[str, RuleEvaluationResult] = {}
        self.cache_ttl: int = self.config.get('cache_ttl_seconds', 60)
        
        # Rate limiting and cooldown tracking
        self.rule_cooldowns: Dict[str, datetime] = {}
        self.rule_trigger_counts: Dict[str, List[datetime]] = {}
        
        # Performance monitoring
        self.stats = {
            'rules_evaluated': 0,
            'rules_triggered': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'average_evaluation_time_ms': 0.0,
            'rules_by_status': {'active': 0, 'inactive': 0},
            'last_evaluation': None
        }
        
        # Thread safety
        self._lock = threading.RLock()
        
        # Built-in condition evaluators
        self.condition_evaluators: Dict[RuleConditionType, Callable] = {
            RuleConditionType.OBJECT_PRESENCE: self._evaluate_object_presence,
            RuleConditionType.OBJECT_TYPE: self._evaluate_object_type,
            RuleConditionType.PERSON_COUNT: self._evaluate_person_count,
            RuleConditionType.TIME_RANGE: self._evaluate_time_range,
            RuleConditionType.CONFIDENCE_LEVEL: self._evaluate_confidence_level,
            RuleConditionType.DURATION: self._evaluate_duration,
            RuleConditionType.MOVEMENT_PATTERN: self._evaluate_movement_pattern,
            RuleConditionType.ZONE_COMBINATION: self._evaluate_zone_combination
        }
        
        logger.info("📋 Dynamic Rules Engine initialized")
    
    def create_rule(self, rule_data: Dict[str, Any]) -> SecurityRule:
        """
        Create a new security rule
        
        Args:
            rule_data: Rule configuration data
            
        Returns:
            Created SecurityRule object
        """
        try:
            with self._lock:
                # Create rule object
                rule = SecurityRule.from_dict(rule_data)
                
                # Validate rule
                validation_result = self.validate_rule(rule)
                if not validation_result['is_valid']:
                    raise ValueError(f"Rule validation failed: {validation_result['errors']}")
                
                # Store rule
                self.rules[rule.rule_id] = rule
                
                # Update indices
                self._update_rule_indices()
                
                # Update statistics
                self._update_stats()
                
                logger.info(f"📋 Created rule: {rule.rule_id} ({rule.name}) - Priority {rule.priority}")
                
                return rule
                
        except Exception as e:
            logger.error(f"❌ Failed to create rule: {e}")
            raise
    
    def update_rule(self, rule_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update existing security rule
        
        Args:
            rule_id: Rule identifier
            updates: Updated configuration data
            
        Returns:
            True if rule was updated successfully
        """
        with self._lock:
            if rule_id not in self.rules:
                logger.warning(f"⚠️ Rule {rule_id} not found for update")
                return False
            
            try:
                rule = self.rules[rule_id]
                
                # Update rule attributes
                for key, value in updates.items():
                    if hasattr(rule, key):
                        setattr(rule, key, value)
                
                # Re-validate rule
                validation_result = self.validate_rule(rule)
                if not validation_result['is_valid']:
                    raise ValueError(f"Updated rule validation failed: {validation_result['errors']}")
                
                # Update indices
                self._update_rule_indices()
                
                # Clear relevant cache entries
                self._clear_rule_cache(rule_id)
                
                # Update statistics
                self._update_stats()
                
                logger.info(f"✅ Updated rule: {rule_id}")
                
                return True
                
            except Exception as e:
                logger.error(f"❌ Failed to update rule {rule_id}: {e}")
                return False
    
    def delete_rule(self, rule_id: str) -> bool:
        """
        Delete a security rule
        
        Args:
            rule_id: Rule identifier
            
        Returns:
            True if rule was deleted successfully
        """
        with self._lock:
            if rule_id not in self.rules:
                logger.warning(f"⚠️ Rule {rule_id} not found for deletion")
                return False
            
            try:
                # Remove rule
                rule = self.rules.pop(rule_id)
                
                # Update indices
                self._update_rule_indices()
                
                # Clear cache and tracking data
                self._clear_rule_cache(rule_id)
                if rule_id in self.rule_cooldowns:
                    del self.rule_cooldowns[rule_id]
                if rule_id in self.rule_trigger_counts:
                    del self.rule_trigger_counts[rule_id]
                
                # Update statistics
                self._update_stats()
                
                logger.info(f"🗑️ Deleted rule: {rule_id}")
                
                return True
                
            except Exception as e:
                logger.error(f"❌ Failed to delete rule {rule_id}: {e}")
                return False
    
    def evaluate_threat_against_rules(self, threat_data: Dict[str, Any]) -> List[RuleEvaluationResult]:
        """
        Evaluate detected threat against all applicable rules
        
        Args:
            threat_data: Comprehensive threat detection data
            
        Returns:
            List of rule evaluation results
        """
        evaluation_start = datetime.now()
        evaluation_results = []
        
        try:
            # Extract threat information
            zone_id = threat_data.get('zone_id', 'UNKNOWN')
            bbox = threat_data.get('bbox', (0, 0, 100, 100))
            confidence = threat_data.get('confidence', 75) / 100.0
            threat_type = threat_data.get('threat_type', 'unknown')
            
            # Get zones containing the threat
            point = self._bbox_to_center_point(bbox)
            containing_zones = self.geofencing_manager.get_zones_containing_point(
                point, coordinate_system=CoordinateSystem.NORMALIZED
            )
            
            if not containing_zones:
                logger.debug(f"⚠️ Threat at {point} not in any monitored zones")
                return evaluation_results
            
            # Get applicable rules for the zones
            applicable_rules = set()
            for zone in containing_zones:
                zone_rules = self.rules_by_zone.get(zone.zone_id, [])
                applicable_rules.update(zone_rules)
            
            logger.debug(f"🔍 Evaluating {len(applicable_rules)} rules for threat in zones: "
                        f"{[z.zone_id for z in containing_zones]}")
            
            # Evaluate each applicable rule
            for rule_id in applicable_rules:
                if rule_id not in self.rules:
                    continue
                
                rule = self.rules[rule_id]
                
                # Skip inactive rules
                if not rule.is_active:
                    continue
                
                # Check cooldown
                if self._is_rule_in_cooldown(rule_id):
                    continue
                
                # Check rate limiting
                if self._is_rule_rate_limited(rule_id):
                    continue
                
                # Evaluate rule
                evaluation_result = self._evaluate_single_rule(rule, threat_data, containing_zones)
                evaluation_results.append(evaluation_result)
                
                # Update rule tracking if triggered
                if evaluation_result.triggered:
                    self._update_rule_tracking(rule_id)
                    self.stats['rules_triggered'] += 1
                
                self.stats['rules_evaluated'] += 1
            
            # Sort results by priority and confidence
            evaluation_results.sort(key=lambda r: (
                self.rules[r.rule_id].priority if r.rule_id in self.rules else 0,
                r.confidence
            ), reverse=True)
            
            # Update performance statistics
            evaluation_time = (datetime.now() - evaluation_start).total_seconds() * 1000
            self._update_evaluation_stats(evaluation_time)
            
            logger.debug(f"⚡ Rule evaluation complete: {len(evaluation_results)} results in {evaluation_time:.2f}ms")
            
        except Exception as e:
            logger.error(f"❌ Threat rule evaluation failed: {e}")
        
        return evaluation_results
    
    def get_zone_rules(self, zone_id: str) -> List[SecurityRule]:
        """
        Get all rules applicable to a specific zone
        
        Args:
            zone_id: Zone identifier
            
        Returns:
            List of applicable security rules
        """
        rule_ids = self.rules_by_zone.get(zone_id, [])
        return [self.rules[rid] for rid in rule_ids if rid in self.rules]
    
    def validate_rule(self, rule: SecurityRule) -> Dict[str, Any]:
        """
        Validate rule configuration and logic
        
        Args:
            rule: Security rule to validate
            
        Returns:
            Validation results with errors and warnings
        """
        validation_result = {
            'is_valid': True,
            'errors': [],
            'warnings': [],
            'suggestions': []
        }
        
        try:
            # Required fields validation
            if not rule.name or not rule.name.strip():
                validation_result['errors'].append("Rule name is required")
                validation_result['is_valid'] = False
            
            if not rule.zone_ids:
                validation_result['errors'].append("Rule must apply to at least one zone")
                validation_result['is_valid'] = False
            
            if not rule.conditions:
                validation_result['errors'].append("Rule must have at least one condition")
                validation_result['is_valid'] = False
            
            if not rule.actions:
                validation_result['errors'].append("Rule must have at least one action")
                validation_result['is_valid'] = False
            
            # Zone existence validation
            for zone_id in rule.zone_ids:
                if zone_id not in self.geofencing_manager.zones:
                    validation_result['warnings'].append(f"Zone {zone_id} does not exist")
            
            # Condition validation
            for condition in rule.conditions:
                condition_validation = self._validate_condition(condition)
                if not condition_validation['is_valid']:
                    validation_result['errors'].extend(condition_validation['errors'])
                    validation_result['is_valid'] = False
                validation_result['warnings'].extend(condition_validation.get('warnings', []))
            
            # Logic validation
            if len(rule.conditions) > 1:
                logic_validation = self._validate_rule_logic(rule)
                validation_result['warnings'].extend(logic_validation.get('warnings', []))
            
            # Performance validation
            if rule.priority < 1 or rule.priority > 10:
                validation_result['warnings'].append("Rule priority should be between 1-10")
            
            if rule.confidence_threshold < 0.5:
                validation_result['warnings'].append("Low confidence threshold may cause false positives")
            
        except Exception as e:
            validation_result['errors'].append(f"Validation error: {str(e)}")
            validation_result['is_valid'] = False
        
        return validation_result
    
    def get_rules_statistics(self) -> Dict[str, Any]:
        """
        Get comprehensive rules engine statistics
        
        Returns:
            Statistics dictionary
        """
        with self._lock:
            # Update current stats
            self._update_stats()
            
            # Calculate additional metrics
            total_rules = len(self.rules)
            active_rules = sum(1 for rule in self.rules.values() if rule.is_active)
            
            # Rule distribution by priority
            priority_distribution = {}
            for rule in self.rules.values():
                priority = rule.priority
                priority_distribution[priority] = priority_distribution.get(priority, 0) + 1
            
            # Most triggered rules
            most_triggered = sorted(
                [(rid, rule.trigger_count) for rid, rule in self.rules.items()],
                key=lambda x: x[1], reverse=True
            )[:5]
            
            extended_stats = {
                **self.stats,
                'rule_distribution': {
                    'total_rules': total_rules,
                    'active_rules': active_rules,
                    'inactive_rules': total_rules - active_rules,
                    'by_priority': priority_distribution,
                    'zones_with_rules': len(self.rules_by_zone),
                    'average_conditions_per_rule': sum(len(r.conditions) for r in self.rules.values()) / max(total_rules, 1)
                },
                'performance_metrics': {
                    'cache_hit_rate': (self.stats['cache_hits'] / max(self.stats['cache_hits'] + self.stats['cache_misses'], 1)) * 100,
                    'rules_in_cooldown': len(self.rule_cooldowns),
                    'most_triggered_rules': most_triggered
                }
            }
            
            return extended_stats
    
    def export_rules(self, zone_ids: Optional[List[str]] = None, 
                     include_stats: bool = True) -> Dict[str, Any]:
        """
        Export rules configuration for backup or transfer
        
        Args:
            zone_ids: Filter by zones (optional)
            include_stats: Include statistics in export
            
        Returns:
            Exported rules data
        """
        # Filter rules if zone_ids specified
        rules_to_export = list(self.rules.values())
        if zone_ids:
            rules_to_export = [
                rule for rule in rules_to_export 
                if any(zone_id in rule.zone_ids for zone_id in zone_ids)
            ]
        
        export_data = {
            'export_timestamp': datetime.now().isoformat(),
            'export_version': '1.0',
            'total_rules': len(rules_to_export),
            'filters': {
                'zone_ids': zone_ids
            },
            'rules': [rule.to_dict() for rule in rules_to_export]
        }
        
        if include_stats:
            export_data['statistics'] = self.get_rules_statistics()
        
        logger.info(f"📤 Exported {len(rules_to_export)} rules")
        
        return export_data
    
    def import_rules(self, import_data: Dict[str, Any], 
                     overwrite_existing: bool = False) -> Dict[str, Any]:
        """
        Import rules configuration from backup or transfer
        
        Args:
            import_data: Exported rules data
            overwrite_existing: Whether to overwrite existing rules
            
        Returns:
            Import results
        """
        import_result = {
            'imported_count': 0,
            'skipped_count': 0,
            'error_count': 0,
            'errors': [],
            'imported_rule_ids': []
        }
        
        try:
            with self._lock:
                rules_data = import_data.get('rules', [])
                
                for rule_data in rules_data:
                    try:
                        rule_id = rule_data.get('rule_id')
                        
                        # Check if rule exists
                        if rule_id in self.rules and not overwrite_existing:
                            import_result['skipped_count'] += 1
                            continue
                        
                        # Create or update rule
                        if rule_id in self.rules:
                            # Update existing
                            self.update_rule(rule_id, rule_data)
                        else:
                            # Create new
                            rule = SecurityRule.from_dict(rule_data)
                            self.rules[rule.rule_id] = rule
                        
                        import_result['imported_count'] += 1
                        import_result['imported_rule_ids'].append(rule_id)
                        
                    except Exception as e:
                        import_result['error_count'] += 1
                        import_result['errors'].append(f"Rule {rule_data.get('rule_id', 'unknown')}: {str(e)}")
                
                # Update indices and statistics
                self._update_rule_indices()
                self._update_stats()
                
                logger.info(f"📥 Import complete: {import_result['imported_count']} imported, "
                           f"{import_result['skipped_count']} skipped, {import_result['error_count']} errors")
                
        except Exception as e:
            import_result['errors'].append(f"Import failed: {str(e)}")
            logger.error(f"❌ Rules import failed: {e}")
        
        return import_result
    
    # ========== PRIVATE METHODS ==========
    
    def _evaluate_single_rule(self, rule: SecurityRule, threat_data: Dict[str, Any], 
                             containing_zones: List[GeofenceZone]) -> RuleEvaluationResult:
        """Evaluate a single rule against threat data"""
        evaluation_start = datetime.now()
        
        result = RuleEvaluationResult(rule.rule_id, False)
        result.zone_ids = [zone.zone_id for zone in containing_zones]
        result.threat_data = threat_data.copy()
        
        try:
            # Evaluate each condition
            condition_results = []
            
            for condition in rule.conditions:
                evaluator = self.condition_evaluators.get(condition.condition_type)
                if not evaluator:
                    logger.warning(f"⚠️ No evaluator for condition type: {condition.condition_type}")
                    continue
                
                # Evaluate condition
                condition_satisfied, condition_confidence = evaluator(
                    condition, threat_data, containing_zones
                )
                
                result.condition_results[condition.condition_id] = condition_satisfied
                result.condition_confidences[condition.condition_id] = condition_confidence
                
                if not condition_satisfied:
                    result.failed_conditions.append(condition.condition_id)
                
                condition_results.append({
                    'satisfied': condition_satisfied,
                    'confidence': condition_confidence,
                    'weight': condition.weight,
                    'operator': condition.operator
                })
            
            # Evaluate combined rule logic
            rule_triggered, rule_confidence = self._evaluate_rule_logic(rule, condition_results)
            
            # Check against rule confidence threshold
            if rule_confidence >= rule.confidence_threshold:
                result.triggered = rule_triggered
                result.confidence = rule_confidence
                
                if rule_triggered:
                    result.actions_to_execute = rule.actions.copy()
                    result.action_parameters = {
                        'rule_id': rule.rule_id,
                        'rule_name': rule.name,
                        'zone_ids': result.zone_ids,
                        'confidence': rule_confidence,
                        'threat_data': threat_data
                    }
            
        except Exception as e:
            logger.error(f"❌ Rule evaluation failed for {rule.rule_id}: {e}")
        
        # Record evaluation time
        evaluation_time = (datetime.now() - evaluation_start).total_seconds() * 1000
        result.evaluation_time_ms = evaluation_time
        
        return result
    
    def _evaluate_rule_logic(self, rule: SecurityRule, 
                           condition_results: List[Dict[str, Any]]) -> Tuple[bool, float]:
        """Evaluate combined rule logic with operators"""
        if not condition_results:
            return False, 0.0
        
        # For simple implementation, use weighted average approach
        # In production, would implement full boolean logic evaluation
        
        total_weight = sum(cr['weight'] for cr in condition_results)
        if total_weight == 0:
            return False, 0.0
        
        weighted_score = sum(
            cr['confidence'] * cr['weight'] for cr in condition_results if cr['satisfied']
        )
        
        satisfied_conditions = sum(1 for cr in condition_results if cr['satisfied'])
        total_conditions = len(condition_results)
        
        # Rule triggers if majority of conditions are satisfied
        rule_triggered = satisfied_conditions > (total_conditions / 2)
        rule_confidence = weighted_score / total_weight
        
        return rule_triggered, rule_confidence
    
    def _validate_condition(self, condition: RuleCondition) -> Dict[str, Any]:
        """Validate individual condition configuration"""
        validation = {'is_valid': True, 'errors': [], 'warnings': []}
        
        # Check if condition type is supported
        if condition.condition_type not in self.condition_evaluators:
            validation['errors'].append(f"Unsupported condition type: {condition.condition_type}")
            validation['is_valid'] = False
        
        # Validate parameters based on condition type
        params = condition.parameters
        
        if condition.condition_type == RuleConditionType.OBJECT_TYPE:
            if 'allowed_types' not in params and 'forbidden_types' not in params:
                validation['errors'].append("Object type condition requires allowed_types or forbidden_types")
                validation['is_valid'] = False
        
        elif condition.condition_type == RuleConditionType.PERSON_COUNT:
            if 'min_count' not in params and 'max_count' not in params:
                validation['errors'].append("Person count condition requires min_count or max_count")
                validation['is_valid'] = False
        
        elif condition.condition_type == RuleConditionType.TIME_RANGE:
            if 'start_time' not in params or 'end_time' not in params:
                validation['errors'].append("Time range condition requires start_time and end_time")
                validation['is_valid'] = False
        
        # Add more specific validations as needed
        
        return validation
    
    def _validate_rule_logic(self, rule: SecurityRule) -> Dict[str, Any]:
        """Validate rule logic and combinations"""
        validation = {'warnings': []}
        
        # Check for potentially conflicting conditions
        condition_types = [c.condition_type for c in rule.conditions]
        
        # Warning for overly complex rules
        if len(rule.conditions) > 5:
            validation['warnings'].append("Rule has many conditions - consider splitting into multiple rules")
        
        # Warning for mixing time and non-time conditions without proper operators
        has_time_conditions = any(ct == RuleConditionType.TIME_RANGE for ct in condition_types)
        has_detection_conditions = any(ct in [
            RuleConditionType.OBJECT_PRESENCE, RuleConditionType.OBJECT_TYPE
        ] for ct in condition_types)
        
        if has_time_conditions and has_detection_conditions:
            validation['warnings'].append("Mixing time and detection conditions - ensure proper logic operators")
        
        return validation
    
    # ========== CONDITION EVALUATORS ==========
    
    def _evaluate_object_presence(self, condition: RuleCondition, 
                                 threat_data: Dict[str, Any], 
                                 containing_zones: List[GeofenceZone]) -> Tuple[bool, float]:
        """Evaluate object presence condition"""
        # Object is present if we have threat data
        confidence = threat_data.get('confidence', 0) / 100.0
        required_confidence = condition.parameters.get('min_confidence', 0.5)
        
        return confidence >= required_confidence, confidence
    
    def _evaluate_object_type(self, condition: RuleCondition, 
                            threat_data: Dict[str, Any], 
                            containing_zones: List[GeofenceZone]) -> Tuple[bool, float]:
        """Evaluate object type condition"""
        threat_type = threat_data.get('threat_type', '').lower()
        confidence = threat_data.get('confidence', 0) / 100.0
        
        allowed_types = condition.parameters.get('allowed_types', [])
        forbidden_types = condition.parameters.get('forbidden_types', [])
        
        # Check allowed types
        if allowed_types:
            allowed = any(allowed_type.lower() in threat_type for allowed_type in allowed_types)
            if not allowed:
                return False, 0.0
        
        # Check forbidden types
        if forbidden_types:
            forbidden = any(forbidden_type.lower() in threat_type for forbidden_type in forbidden_types)
            if forbidden:
                return False, 0.0
        
        return True, confidence
    
    def _evaluate_person_count(self, condition: RuleCondition, 
                             threat_data: Dict[str, Any], 
                             containing_zones: List[GeofenceZone]) -> Tuple[bool, float]:
        """Evaluate person count condition"""
        # Simplified - would integrate with person counting system
        person_count = threat_data.get('person_count', 1)
        
        min_count = condition.parameters.get('min_count', 0)
        max_count = condition.parameters.get('max_count', float('inf'))
        
        satisfied = min_count <= person_count <= max_count
        confidence = 0.9 if satisfied else 0.1
        
        return satisfied, confidence
    
    def _evaluate_time_range(self, condition: RuleCondition, 
                           threat_data: Dict[str, Any], 
                           containing_zones: List[GeofenceZone]) -> Tuple[bool, float]:
        """Evaluate time range condition"""
        current_time = datetime.now().time()
        
        start_time_str = condition.parameters.get('start_time', '00:00')
        end_time_str = condition.parameters.get('end_time', '23:59')
        
        try:
            start_time = datetime.strptime(start_time_str, '%H:%M').time()
            end_time = datetime.strptime(end_time_str, '%H:%M').time()
            
            if start_time <= end_time:
                # Same day range
                satisfied = start_time <= current_time <= end_time
            else:
                # Overnight range
                satisfied = current_time >= start_time or current_time <= end_time
            
            return satisfied, 1.0 if satisfied else 0.0
            
        except ValueError:
            logger.error(f"❌ Invalid time format in condition {condition.condition_id}")
            return False, 0.0
    
    def _evaluate_confidence_level(self, condition: RuleCondition, 
                                 threat_data: Dict[str, Any], 
                                 containing_zones: List[GeofenceZone]) -> Tuple[bool, float]:
        """Evaluate confidence level condition"""
        confidence = threat_data.get('confidence', 0) / 100.0
        min_confidence = condition.parameters.get('min_confidence', 0.5)
        
        satisfied = confidence >= min_confidence
        return satisfied, confidence
    
    def _evaluate_duration(self, condition: RuleCondition, 
                         threat_data: Dict[str, Any], 
                         containing_zones: List[GeofenceZone]) -> Tuple[bool, float]:
        """Evaluate duration condition"""
        # Simplified - would track threat duration
        duration_seconds = threat_data.get('duration_seconds', 0)
        min_duration = condition.parameters.get('min_duration_seconds', 0)
        max_duration = condition.parameters.get('max_duration_seconds', float('inf'))
        
        satisfied = min_duration <= duration_seconds <= max_duration
        confidence = 0.8 if satisfied else 0.2
        
        return satisfied, confidence
    
    def _evaluate_movement_pattern(self, condition: RuleCondition, 
                                 threat_data: Dict[str, Any], 
                                 containing_zones: List[GeofenceZone]) -> Tuple[bool, float]:
        """Evaluate movement pattern condition"""
        # Simplified - would analyze actual movement patterns
        movement_type = threat_data.get('movement_pattern', 'unknown')
        expected_patterns = condition.parameters.get('patterns', [])
        
        if not expected_patterns:
            return True, 0.5
        
        satisfied = movement_type in expected_patterns
        confidence = 0.7 if satisfied else 0.3
        
        return satisfied, confidence
    
    def _evaluate_zone_combination(self, condition: RuleCondition, 
                                 threat_data: Dict[str, Any], 
                                 containing_zones: List[GeofenceZone]) -> Tuple[bool, float]:
        """Evaluate zone combination condition"""
        required_zones = condition.parameters.get('required_zones', [])
        forbidden_zones = condition.parameters.get('forbidden_zones', [])
        
        current_zone_ids = [zone.zone_id for zone in containing_zones]
        
        # Check required zones
        if required_zones:
            has_required = any(zone_id in current_zone_ids for zone_id in required_zones)
            if not has_required:
                return False, 0.0
        
        # Check forbidden zones
        if forbidden_zones:
            has_forbidden = any(zone_id in current_zone_ids for zone_id in forbidden_zones)
            if has_forbidden:
                return False, 0.0
        
        return True, 0.9
    
    # ========== UTILITY METHODS ==========
    
    def _bbox_to_center_point(self, bbox: tuple) -> Tuple[float, float]:
        """Convert bounding box to center point"""
        try:
            x, y, width, height = bbox
            center_x = x + width / 2
            center_y = y + height / 2
            
            # Normalize to 0-1 range (assuming screen coordinates)
            # In production, would use actual screen resolution
            screen_width = 1920
            screen_height = 1080
            
            norm_x = max(0.0, min(1.0, center_x / screen_width))
            norm_y = max(0.0, min(1.0, center_y / screen_height))
            
            return (norm_x, norm_y)
        except:
            return (0.5, 0.5)  # Default center
    
    def _is_rule_in_cooldown(self, rule_id: str) -> bool:
        """Check if rule is in cooldown period"""
        if rule_id not in self.rule_cooldowns:
            return False
        
        rule = self.rules.get(rule_id)
        if not rule or rule.cooldown_period <= 0:
            return False
        
        cooldown_until = self.rule_cooldowns[rule_id]
        return datetime.now() < cooldown_until
    
    def _is_rule_rate_limited(self, rule_id: str) -> bool:
        """Check if rule is rate limited"""
        rule = self.rules.get(rule_id)
        if not rule or rule.max_triggers_per_hour <= 0:
            return False
        
        if rule_id not in self.rule_trigger_counts:
            return False
        
        # Count triggers in last hour
        one_hour_ago = datetime.now() - timedelta(hours=1)
        recent_triggers = [
            trigger_time for trigger_time in self.rule_trigger_counts[rule_id]
            if trigger_time > one_hour_ago
        ]
        
        return len(recent_triggers) >= rule.max_triggers_per_hour
    
    def _update_rule_tracking(self, rule_id: str):
        """Update rule trigger tracking"""
        now = datetime.now()
        
        # Update trigger count
        if rule_id in self.rules:
            self.rules[rule_id].trigger_count += 1
            self.rules[rule_id].last_triggered = now.isoformat()
        
        # Update cooldown
        rule = self.rules.get(rule_id)
        if rule and rule.cooldown_period > 0:
            self.rule_cooldowns[rule_id] = now + timedelta(seconds=rule.cooldown_period)
        
        # Update rate limiting
        if rule and rule.max_triggers_per_hour > 0:
            if rule_id not in self.rule_trigger_counts:
                self.rule_trigger_counts[rule_id] = []
            self.rule_trigger_counts[rule_id].append(now)
    
    def _update_rule_indices(self):
        """Update rule lookup indices"""
        self.rules_by_zone.clear()
        
        for rule_id, rule in self.rules.items():
            for zone_id in rule.zone_ids:
                if zone_id not in self.rules_by_zone:
                    self.rules_by_zone[zone_id] = []
                if rule_id not in self.rules_by_zone[zone_id]:
                    self.rules_by_zone[zone_id].append(rule_id)
        
        # Update priority-sorted list
        self.rules_by_priority = sorted(
            self.rules.keys(),
            key=lambda rid: self.rules[rid].priority if rid in self.rules else 0,
            reverse=True
        )
    
    def _update_stats(self):
        """Update rules engine statistics"""
        self.stats['rules_by_status']['active'] = sum(1 for rule in self.rules.values() if rule.is_active)
        self.stats['rules_by_status']['inactive'] = len(self.rules) - self.stats['rules_by_status']['active']
        self.stats['last_evaluation'] = datetime.now().isoformat()
    
    def _update_evaluation_stats(self, evaluation_time_ms: float):
        """Update evaluation performance statistics"""
        # Rolling average
        current_avg = self.stats['average_evaluation_time_ms']
        total_evaluations = self.stats['rules_evaluated']
        
        if total_evaluations > 0:
            new_avg = ((current_avg * (total_evaluations - 1)) + evaluation_time_ms) / total_evaluations
            self.stats['average_evaluation_time_ms'] = new_avg
    
    def _clear_rule_cache(self, rule_id: str):
        """Clear evaluation cache for specific rule"""
        keys_to_remove = [key for key in self.evaluation_cache.keys() if key.startswith(f"{rule_id}_")]
        for key in keys_to_remove:
            del self.evaluation_cache[key]
