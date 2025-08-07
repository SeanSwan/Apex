"""
APEX AI DECISION MATRIX ENGINE
==============================
Autonomous decision-making engine for Autopilot mode operations

Features:
- Rule-based decision making for autonomous operations
- Configurable threat response rules and escalation procedures
- Confidence-based decision validation
- Fallback mechanisms and human escalation
- Comprehensive decision logging and audit trails
- Recovery strategies for failed operations

Decision Matrix:
- Maps detected threats to autonomous actions
- Considers context, confidence levels, and operational parameters
- Supports complex conditional logic and multi-step actions
- Maintains accountability through detailed decision records
"""

import asyncio
import logging
import yaml
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Union, Callable
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class DecisionType(Enum):
    """Types of decisions the matrix can make"""
    THREAT_RESPONSE = "threat_response"
    ESCALATION = "escalation"
    VOICE_INTERACTION = "voice_interaction"
    EVIDENCE_COLLECTION = "evidence_collection"
    SYSTEM_ACTION = "system_action"
    RECOVERY_ACTION = "recovery_action"

class DecisionPriority(Enum):
    """Priority levels for decisions"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

@dataclass
class DecisionRule:
    """Represents a decision rule in the matrix"""
    rule_id: str
    name: str
    description: str
    conditions: Dict[str, Any]
    actions: List[Dict[str, Any]]
    priority: DecisionPriority
    confidence_threshold: float
    enabled: bool = True
    cooldown_seconds: int = 0
    max_executions_per_hour: int = 0

@dataclass
class DecisionRecord:
    """Records a decision execution"""
    decision_id: str
    rule_id: str
    timestamp: str
    input_data: Dict[str, Any]
    decision_type: DecisionType
    priority: DecisionPriority
    confidence: float
    actions_taken: List[Dict[str, Any]]
    execution_time: float
    success: bool
    error: Optional[str] = None
    human_escalation: bool = False

class DecisionMatrixEngine:
    """
    Autonomous decision-making engine for APEX AI Autopilot mode
    
    Processes threat detections and other events through a configurable
    rule matrix to determine appropriate autonomous actions.
    """
    
    def __init__(self, config: Dict[str, Any] = None, operational_mode_manager = None):
        self.config = config or {}
        self.operational_mode_manager = operational_mode_manager
        
        # Decision rules storage
        self.rules: Dict[str, DecisionRule] = {}
        self.rules_file = self.config.get('rules_file', 'shared/decision_rules.yaml')
        
        # Decision execution tracking
        self.decision_history: List[DecisionRecord] = []
        self.max_history_size = self.config.get('max_history_size', 1000)
        self.active_decisions: Dict[str, Dict] = {}
        self.decision_counter = 0
        
        # Configuration settings
        self.max_concurrent_decisions = self.config.get('max_concurrent_decisions', 5)
        self.decision_timeout = self.config.get('decision_timeout', 10)
        self.fallback_to_human = self.config.get('fallback_to_human', True)
        self.global_confidence_threshold = self.config.get('global_confidence_threshold', 0.75)
        
        # Rule execution tracking (for cooldowns and rate limiting)
        self.rule_executions: Dict[str, List[float]] = {}
        
        # Statistics
        self.stats = {
            'total_decisions': 0,
            'successful_decisions': 0,
            'failed_decisions': 0,
            'human_escalations': 0,
            'average_decision_time': 0.0,
            'decisions_by_type': {},
            'decisions_by_priority': {},
            'rules_triggered': {},
            'last_decision_time': None
        }
        
        logger.info("🧠 Decision Matrix Engine initialized")
    
    async def initialize(self):
        """Initialize the decision matrix engine"""
        try:
            # Load decision rules from file
            await self.load_rules_from_file()
            
            # Initialize default rules if none exist
            if not self.rules:
                await self.create_default_rules()
            
            logger.info(f"✅ Decision Matrix Engine initialized with {len(self.rules)} rules")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Decision Matrix Engine: {e}")
            # Create basic fallback rules
            await self.create_fallback_rules()
    
    async def load_rules_from_file(self):
        """Load decision rules from YAML configuration file"""
        try:
            rules_path = Path(self.rules_file)
            
            if rules_path.exists():
                with open(rules_path, 'r') as f:
                    rules_data = yaml.safe_load(f)
                
                for rule_data in rules_data.get('rules', []):
                    rule = DecisionRule(
                        rule_id=rule_data['rule_id'],
                        name=rule_data['name'],
                        description=rule_data['description'],
                        conditions=rule_data['conditions'],
                        actions=rule_data['actions'],
                        priority=DecisionPriority(rule_data.get('priority', 'medium')),
                        confidence_threshold=rule_data.get('confidence_threshold', 0.75),
                        enabled=rule_data.get('enabled', True),
                        cooldown_seconds=rule_data.get('cooldown_seconds', 0),
                        max_executions_per_hour=rule_data.get('max_executions_per_hour', 0)
                    )
                    
                    self.rules[rule.rule_id] = rule
                
                logger.info(f"📋 Loaded {len(self.rules)} decision rules from {rules_path}")
                
            else:
                logger.warning(f"⚠️ Rules file not found: {rules_path}")
                
        except Exception as e:
            logger.error(f"❌ Failed to load rules from file: {e}")
    
    async def create_default_rules(self):
        """Create default decision rules for common scenarios"""
        default_rules = [
            # Weapon detection rule
            DecisionRule(
                rule_id="weapon_detection_critical",
                name="Weapon Detection - Critical Response",
                description="Immediate response to weapon detection",
                conditions={
                    "threat_type": {"contains": "weapon"},
                    "confidence": {"gte": 0.9},
                    "threat_level": {"in": ["HIGH", "CRITICAL", "WEAPON"]}
                },
                actions=[
                    {"type": "trigger_alert", "urgency": "critical", "sound": True, "visual": True},
                    {"type": "voice_response", "script": "WEAPON_DETECTED", "immediate": True},
                    {"type": "evidence_capture", "duration": 30, "priority": "high"},
                    {"type": "notify_authorities", "delay": 0},
                    {"type": "human_escalation", "reason": "Weapon detected - immediate attention required"}
                ],
                priority=DecisionPriority.EMERGENCY,
                confidence_threshold=0.9,
                cooldown_seconds=10
            ),
            
            # Violence detection rule
            DecisionRule(
                rule_id="violence_detection_high",
                name="Violence Detection - High Priority",
                description="Response to violence or physical altercation",
                conditions={
                    "threat_type": {"contains": "violence"},
                    "confidence": {"gte": 0.8}
                },
                actions=[
                    {"type": "trigger_alert", "urgency": "high", "sound": True, "visual": True},
                    {"type": "voice_response", "script": "DE_ESCALATION", "delay": 2},
                    {"type": "evidence_capture", "duration": 60, "priority": "high"},
                    {"type": "monitor_escalation", "timeout": 30}
                ],
                priority=DecisionPriority.HIGH,
                confidence_threshold=0.8,
                cooldown_seconds=30
            ),
            
            # Trespassing rule
            DecisionRule(
                rule_id="trespassing_standard",
                name="Trespassing - Standard Response",
                description="Standard response to trespassing detection",
                conditions={
                    "threat_type": {"contains": "trespassing"},
                    "confidence": {"gte": 0.7}
                },
                actions=[
                    {"type": "trigger_alert", "urgency": "medium", "sound": True, "visual": True},
                    {"type": "voice_response", "script": "TRESPASSING", "delay": 5},
                    {"type": "evidence_capture", "duration": 30, "priority": "medium"}
                ],
                priority=DecisionPriority.MEDIUM,
                confidence_threshold=0.7,
                cooldown_seconds=60
            ),
            
            # Package theft rule
            DecisionRule(
                rule_id="package_theft_response",
                name="Package Theft - Active Response",
                description="Response to package theft detection",
                conditions={
                    "threat_type": {"contains": "package_theft"},
                    "confidence": {"gte": 0.75}
                },
                actions=[
                    {"type": "trigger_alert", "urgency": "high", "sound": True, "visual": True},
                    {"type": "voice_response", "script": "PACKAGE_THEFT", "delay": 1},
                    {"type": "evidence_capture", "duration": 45, "priority": "high"},
                    {"type": "track_suspect", "duration": 120}
                ],
                priority=DecisionPriority.HIGH,
                confidence_threshold=0.75,
                cooldown_seconds=120
            )
        ]
        
        for rule in default_rules:
            self.rules[rule.rule_id] = rule
        
        # Save default rules to file
        await self.save_rules_to_file()
        
        logger.info(f"✅ Created {len(default_rules)} default decision rules")
    
    async def create_fallback_rules(self):
        """Create minimal fallback rules for emergency operation"""
        fallback_rule = DecisionRule(
            rule_id="fallback_escalation",
            name="Fallback - Human Escalation",
            description="Fallback rule that escalates all threats to human",
            conditions={
                "threat_type": {"exists": True}
            },
            actions=[
                {"type": "human_escalation", "reason": "Fallback rule - decision matrix unavailable"}
            ],
            priority=DecisionPriority.MEDIUM,
            confidence_threshold=0.5
        )
        
        self.rules[fallback_rule.rule_id] = fallback_rule
        logger.warning("⚠️ Using fallback escalation rule only")
    
    async def process_decision(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process input data through the decision matrix
        
        Args:
            input_data: Context data for decision making
            
        Returns:
            Decision result with actions taken
        """
        try:
            if len(self.active_decisions) >= self.max_concurrent_decisions:
                logger.warning("⚠️ Maximum concurrent decisions reached - queuing")
                return await self._queue_decision(input_data)
            
            decision_id = f"decision_{self.decision_counter}_{int(time.time() * 1000)}"
            self.decision_counter += 1
            
            start_time = time.time()
            
            # Track active decision
            self.active_decisions[decision_id] = {
                'input_data': input_data,
                'started_at': start_time,
                'status': 'processing'
            }
            
            # Find matching rules
            matching_rules = await self._find_matching_rules(input_data)
            
            if not matching_rules:
                logger.info("ℹ️ No matching rules found - using fallback")
                result = await self._handle_no_matching_rules(decision_id, input_data)
            else:
                # Execute highest priority rule
                selected_rule = max(matching_rules, key=lambda r: r.priority.value)
                result = await self._execute_rule(decision_id, selected_rule, input_data)
            
            execution_time = time.time() - start_time
            
            # Record decision
            await self._record_decision(decision_id, result, input_data, execution_time)
            
            # Clean up active decision
            if decision_id in self.active_decisions:
                del self.active_decisions[decision_id]
            
            # Update operational mode manager if available
            if self.operational_mode_manager:
                self.operational_mode_manager.record_autopilot_decision(
                    execution_time, result.get('success', False), 
                    input_data.get('confidence', 0.0)
                )
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Decision processing failed: {e}")
            
            # Clean up
            if decision_id in self.active_decisions:
                del self.active_decisions[decision_id]
            
            # Return error result
            return {
                'success': False,
                'decision_id': decision_id,
                'error': str(e),
                'fallback_action': 'human_escalation',
                'timestamp': datetime.now().isoformat()
            }
    
    async def _find_matching_rules(self, input_data: Dict[str, Any]) -> List[DecisionRule]:
        """Find rules that match the input conditions"""
        matching_rules = []
        
        for rule in self.rules.values():
            if not rule.enabled:
                continue
            
            # Check confidence threshold
            input_confidence = input_data.get('confidence', 0.0)
            if input_confidence < rule.confidence_threshold:
                continue
            
            # Check global confidence threshold
            if input_confidence < self.global_confidence_threshold:
                continue
            
            # Check cooldown
            if not self._check_rule_cooldown(rule.rule_id):
                continue
            
            # Check rate limiting
            if not self._check_rule_rate_limit(rule.rule_id):
                continue
            
            # Check rule conditions
            if self._evaluate_conditions(rule.conditions, input_data):
                matching_rules.append(rule)
        
        return matching_rules
    
    def _evaluate_conditions(self, conditions: Dict[str, Any], input_data: Dict[str, Any]) -> bool:
        """Evaluate rule conditions against input data"""
        try:
            for field, condition in conditions.items():
                input_value = input_data.get(field)
                
                if input_value is None:
                    if condition.get('required', False):
                        return False
                    continue
                
                # Handle different condition types
                if isinstance(condition, dict):
                    if 'equals' in condition and input_value != condition['equals']:
                        return False
                    if 'contains' in condition and condition['contains'].lower() not in str(input_value).lower():
                        return False
                    if 'in' in condition and input_value not in condition['in']:
                        return False
                    if 'gte' in condition and input_value < condition['gte']:
                        return False
                    if 'lte' in condition and input_value > condition['lte']:
                        return False
                    if 'gt' in condition and input_value <= condition['gt']:
                        return False
                    if 'lt' in condition and input_value >= condition['lt']:
                        return False
                    if 'exists' in condition and condition['exists'] and input_value is None:
                        return False
                
                elif input_value != condition:
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Condition evaluation error: {e}")
            return False
    
    def _check_rule_cooldown(self, rule_id: str) -> bool:
        """Check if rule is not in cooldown period"""
        rule = self.rules.get(rule_id)
        if not rule or rule.cooldown_seconds <= 0:
            return True
        
        last_executions = self.rule_executions.get(rule_id, [])
        if not last_executions:
            return True
        
        time_since_last = time.time() - last_executions[-1]
        return time_since_last >= rule.cooldown_seconds
    
    def _check_rule_rate_limit(self, rule_id: str) -> bool:
        """Check if rule hasn't exceeded rate limit"""
        rule = self.rules.get(rule_id)
        if not rule or rule.max_executions_per_hour <= 0:
            return True
        
        current_time = time.time()
        hour_ago = current_time - 3600  # 1 hour ago
        
        recent_executions = [
            t for t in self.rule_executions.get(rule_id, [])
            if t > hour_ago
        ]
        
        return len(recent_executions) < rule.max_executions_per_hour
    
    async def _execute_rule(self, decision_id: str, rule: DecisionRule, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a decision rule's actions"""
        try:
            logger.info(f"🎯 Executing rule: {rule.name} [{rule.rule_id}]")
            
            actions_taken = []
            all_success = True
            
            for action in rule.actions:
                try:
                    action_result = await self._execute_action(action, input_data, decision_id)
                    actions_taken.append({
                        'action': action,
                        'result': action_result,
                        'success': action_result.get('success', False),
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    if not action_result.get('success', False):
                        all_success = False
                        
                except Exception as e:
                    logger.error(f"❌ Action execution failed: {e}")
                    actions_taken.append({
                        'action': action,
                        'result': {'success': False, 'error': str(e)},
                        'success': False,
                        'timestamp': datetime.now().isoformat()
                    })
                    all_success = False
            
            # Record rule execution
            self._record_rule_execution(rule.rule_id)
            
            # Update statistics
            self.stats['rules_triggered'][rule.rule_id] = self.stats['rules_triggered'].get(rule.rule_id, 0) + 1
            
            return {
                'success': all_success,
                'decision_id': decision_id,
                'rule_id': rule.rule_id,
                'rule_name': rule.name,
                'priority': rule.priority.value,
                'actions_taken': actions_taken,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Rule execution failed: {e}")
            return {
                'success': False,
                'decision_id': decision_id,
                'rule_id': rule.rule_id,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def _execute_action(self, action: Dict[str, Any], input_data: Dict[str, Any], decision_id: str) -> Dict[str, Any]:
        """Execute a specific action"""
        try:
            action_type = action.get('type', 'unknown')
            logger.debug(f"🔧 Executing action: {action_type}")
            
            # Here you would implement actual action execution
            # For now, we'll simulate the actions
            
            if action_type == 'trigger_alert':
                return await self._trigger_alert(action, input_data)
            elif action_type == 'voice_response':
                return await self._trigger_voice_response(action, input_data)
            elif action_type == 'evidence_capture':
                return await self._capture_evidence(action, input_data)
            elif action_type == 'human_escalation':
                return await self._escalate_to_human(action, input_data, decision_id)
            elif action_type == 'notify_authorities':
                return await self._notify_authorities(action, input_data)
            else:
                logger.warning(f"⚠️ Unknown action type: {action_type}")
                return {'success': False, 'error': f'Unknown action type: {action_type}'}
                
        except Exception as e:
            logger.error(f"❌ Action execution error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _trigger_alert(self, action: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger visual/audio alert"""
        # This would integrate with the alerting system
        logger.info(f"🚨 Triggering alert - Urgency: {action.get('urgency', 'medium')}")
        return {'success': True, 'alert_triggered': True, 'urgency': action.get('urgency')}
    
    async def _trigger_voice_response(self, action: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger AI voice response"""
        script = action.get('script', 'GENERAL_WARNING')
        delay = action.get('delay', 0)
        
        if delay > 0:
            await asyncio.sleep(delay)
        
        logger.info(f"🗣️ Triggering voice response - Script: {script}")
        return {'success': True, 'voice_response_triggered': True, 'script': script}
    
    async def _capture_evidence(self, action: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Capture evidence"""
        duration = action.get('duration', 30)
        priority = action.get('priority', 'medium')
        
        logger.info(f"📹 Capturing evidence - Duration: {duration}s, Priority: {priority}")
        return {'success': True, 'evidence_capture_started': True, 'duration': duration}
    
    async def _escalate_to_human(self, action: Dict[str, Any], input_data: Dict[str, Any], decision_id: str) -> Dict[str, Any]:
        """Escalate to human operator"""
        reason = action.get('reason', 'Autonomous decision requires human intervention')
        
        logger.warning(f"👤 Escalating to human - Reason: {reason}")
        
        # Update statistics
        self.stats['human_escalations'] += 1
        
        # Record escalation in operational mode manager
        if self.operational_mode_manager:
            self.operational_mode_manager.record_autopilot_escalation(reason)
        
        return {'success': True, 'escalated_to_human': True, 'reason': reason}
    
    async def _notify_authorities(self, action: Dict[str, Any], input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Notify authorities"""
        delay = action.get('delay', 0)
        
        if delay > 0:
            await asyncio.sleep(delay)
        
        logger.warning(f"🚔 Notifying authorities - Delay: {delay}s")
        return {'success': True, 'authorities_notified': True}
    
    def _record_rule_execution(self, rule_id: str):
        """Record when a rule was executed"""
        current_time = time.time()
        
        if rule_id not in self.rule_executions:
            self.rule_executions[rule_id] = []
        
        self.rule_executions[rule_id].append(current_time)
        
        # Keep only recent executions (last 24 hours)
        day_ago = current_time - 86400
        self.rule_executions[rule_id] = [
            t for t in self.rule_executions[rule_id] if t > day_ago
        ]
    
    async def _record_decision(self, decision_id: str, result: Dict[str, Any], 
                             input_data: Dict[str, Any], execution_time: float):
        """Record a decision in the history"""
        try:
            # Determine decision type and priority from input or result
            decision_type = DecisionType.THREAT_RESPONSE  # Default
            priority = DecisionPriority.MEDIUM  # Default
            
            if 'rule_id' in result:
                rule = self.rules.get(result['rule_id'])
                if rule:
                    priority = rule.priority
            
            decision_record = DecisionRecord(
                decision_id=decision_id,
                rule_id=result.get('rule_id', 'unknown'),
                timestamp=datetime.now().isoformat(),
                input_data=input_data,
                decision_type=decision_type,
                priority=priority,
                confidence=input_data.get('confidence', 0.0),
                actions_taken=result.get('actions_taken', []),
                execution_time=execution_time,
                success=result.get('success', False),
                error=result.get('error'),
                human_escalation=any(
                    'escalated_to_human' in action.get('result', {})
                    for action in result.get('actions_taken', [])
                )
            )
            
            self.decision_history.append(decision_record)
            
            # Maintain history size limit
            if len(self.decision_history) > self.max_history_size:
                self.decision_history.pop(0)
            
            # Update statistics
            self._update_decision_stats(decision_record)
            
        except Exception as e:
            logger.error(f"❌ Failed to record decision: {e}")
    
    def _update_decision_stats(self, record: DecisionRecord):
        """Update decision statistics"""
        self.stats['total_decisions'] += 1
        self.stats['last_decision_time'] = record.timestamp
        
        if record.success:
            self.stats['successful_decisions'] += 1
        else:
            self.stats['failed_decisions'] += 1
        
        if record.human_escalation:
            self.stats['human_escalations'] += 1
        
        # Update averages
        total = self.stats['total_decisions']
        current_avg = self.stats['average_decision_time']
        new_avg = ((current_avg * (total - 1)) + record.execution_time) / total
        self.stats['average_decision_time'] = new_avg
        
        # Update type and priority counters
        decision_type = record.decision_type.value
        self.stats['decisions_by_type'][decision_type] = self.stats['decisions_by_type'].get(decision_type, 0) + 1
        
        priority = record.priority.value
        self.stats['decisions_by_priority'][priority] = self.stats['decisions_by_priority'].get(priority, 0) + 1
    
    async def _handle_no_matching_rules(self, decision_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle case when no rules match"""
        if self.fallback_to_human:
            logger.info("👤 No matching rules - escalating to human")
            return {
                'success': True,
                'decision_id': decision_id,
                'escalated_to_human': True,
                'reason': 'No matching decision rules found',
                'fallback': True,
                'timestamp': datetime.now().isoformat()
            }
        else:
            logger.warning("⚠️ No matching rules and fallback disabled - no action taken")
            return {
                'success': False,
                'decision_id': decision_id,
                'error': 'No matching rules and fallback disabled',
                'timestamp': datetime.now().isoformat()
            }
    
    async def _queue_decision(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Queue decision when at capacity"""
        # For now, just reject. Could implement proper queuing later
        logger.warning("⚠️ Decision queue full - rejecting")
        return {
            'success': False,
            'error': 'Decision processing queue full',
            'queued': False,
            'timestamp': datetime.now().isoformat()
        }
    
    async def get_rules(self) -> Dict[str, Any]:
        """Get current decision rules"""
        return {
            'rules': [
                {
                    'rule_id': rule.rule_id,
                    'name': rule.name,
                    'description': rule.description,
                    'conditions': rule.conditions,
                    'actions': rule.actions,
                    'priority': rule.priority.value,
                    'confidence_threshold': rule.confidence_threshold,
                    'enabled': rule.enabled,
                    'cooldown_seconds': rule.cooldown_seconds,
                    'max_executions_per_hour': rule.max_executions_per_hour
                }
                for rule in self.rules.values()
            ],
            'total_rules': len(self.rules),
            'enabled_rules': len([r for r in self.rules.values() if r.enabled])
        }
    
    async def update_rules(self, rules_update: Dict[str, Any]) -> Dict[str, Any]:
        """Update decision rules"""
        try:
            updated_count = 0
            
            for rule_data in rules_update.get('rules', []):
                rule_id = rule_data.get('rule_id')
                if not rule_id:
                    continue
                
                if rule_id in self.rules:
                    # Update existing rule
                    rule = self.rules[rule_id]
                    rule.name = rule_data.get('name', rule.name)
                    rule.description = rule_data.get('description', rule.description)
                    rule.conditions = rule_data.get('conditions', rule.conditions)
                    rule.actions = rule_data.get('actions', rule.actions)
                    rule.priority = DecisionPriority(rule_data.get('priority', rule.priority.value))
                    rule.confidence_threshold = rule_data.get('confidence_threshold', rule.confidence_threshold)
                    rule.enabled = rule_data.get('enabled', rule.enabled)
                    rule.cooldown_seconds = rule_data.get('cooldown_seconds', rule.cooldown_seconds)
                    rule.max_executions_per_hour = rule_data.get('max_executions_per_hour', rule.max_executions_per_hour)
                    
                    updated_count += 1
                    logger.info(f"✅ Updated rule: {rule_id}")
                else:
                    # Create new rule
                    rule = DecisionRule(
                        rule_id=rule_id,
                        name=rule_data['name'],
                        description=rule_data['description'],
                        conditions=rule_data['conditions'],
                        actions=rule_data['actions'],
                        priority=DecisionPriority(rule_data.get('priority', 'medium')),
                        confidence_threshold=rule_data.get('confidence_threshold', 0.75),
                        enabled=rule_data.get('enabled', True),
                        cooldown_seconds=rule_data.get('cooldown_seconds', 0),
                        max_executions_per_hour=rule_data.get('max_executions_per_hour', 0)
                    )
                    
                    self.rules[rule_id] = rule
                    updated_count += 1
                    logger.info(f"✅ Created new rule: {rule_id}")
            
            # Save updated rules
            await self.save_rules_to_file()
            
            return {
                'success': True,
                'updated_rules': updated_count,
                'total_rules': len(self.rules),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to update rules: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def save_rules_to_file(self):
        """Save current rules to file"""
        try:
            rules_data = {
                'rules': [
                    {
                        'rule_id': rule.rule_id,
                        'name': rule.name,
                        'description': rule.description,
                        'conditions': rule.conditions,
                        'actions': rule.actions,
                        'priority': rule.priority.value,
                        'confidence_threshold': rule.confidence_threshold,
                        'enabled': rule.enabled,
                        'cooldown_seconds': rule.cooldown_seconds,
                        'max_executions_per_hour': rule.max_executions_per_hour
                    }
                    for rule in self.rules.values()
                ]
            }
            
            # Ensure directory exists
            rules_path = Path(self.rules_file)
            rules_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(rules_path, 'w') as f:
                yaml.dump(rules_data, f, default_flow_style=False, indent=2)
            
            logger.info(f"💾 Saved {len(self.rules)} rules to {rules_path}")
            
        except Exception as e:
            logger.error(f"❌ Failed to save rules to file: {e}")
    
    async def execute_decision(self, decision_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a specific decision (for external calls)"""
        return await self.process_decision(decision_data)
    
    async def get_recovery_strategy(self, failure_context: Dict[str, Any]) -> Dict[str, Any]:
        """Get recovery strategy for failed operations"""
        # Simple recovery strategies - could be made more sophisticated
        failed_agent = failure_context.get('failed_agent', 'unknown')
        error = failure_context.get('error', '')
        
        if 'timeout' in error.lower():
            return {
                'strategy': 'retry_with_increased_timeout',
                'parameters': {'timeout_multiplier': 2},
                'fallback': 'escalate_to_human'
            }
        elif 'connection' in error.lower():
            return {
                'strategy': 'switch_to_backup_service',
                'parameters': {'backup_agent': f'backup_{failed_agent}'},
                'fallback': 'escalate_to_human'
            }
        else:
            return {
                'strategy': 'escalate_to_human',
                'reason': f'Unknown error in {failed_agent}: {error}'
            }
    
    def get_decision_statistics(self) -> Dict[str, Any]:
        """Get comprehensive decision statistics"""
        return {
            **self.stats,
            'active_decisions': len(self.active_decisions),
            'total_rules': len(self.rules),
            'enabled_rules': len([r for r in self.rules.values() if r.enabled]),
            'recent_decisions': len([
                d for d in self.decision_history 
                if datetime.fromisoformat(d.timestamp) > datetime.now() - timedelta(hours=24)
            ]),
            'success_rate': (
                self.stats['successful_decisions'] / self.stats['total_decisions']
                if self.stats['total_decisions'] > 0 else 0.0
            ),
            'escalation_rate': (
                self.stats['human_escalations'] / self.stats['total_decisions']
                if self.stats['total_decisions'] > 0 else 0.0
            )
        }
    
    async def shutdown(self):
        """Shutdown the decision matrix engine"""
        try:
            # Save current rules
            await self.save_rules_to_file()
            
            # Log final statistics
            logger.info("📊 Final Decision Matrix Statistics:")
            logger.info(f"   Total decisions: {self.stats['total_decisions']}")
            logger.info(f"   Success rate: {self.stats['successful_decisions']}/{self.stats['total_decisions']}")
            logger.info(f"   Human escalations: {self.stats['human_escalations']}")
            
            logger.info("✅ Decision Matrix Engine shutdown complete")
            
        except Exception as e:
            logger.error(f"❌ Decision Matrix Engine shutdown error: {e}")
