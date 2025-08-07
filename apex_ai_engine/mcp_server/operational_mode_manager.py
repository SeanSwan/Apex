"""
APEX AI OPERATIONAL MODE MANAGER
================================
Manages dual-mode operations between Co-Pilot and Autopilot modes

Features:
- Safe mode switching with validation
- Operational metrics tracking
- Mode-specific behavior management
- Authorization and security controls
- Real-time mode status monitoring

Modes:
- CO_PILOT: Human-supervised operations with AI assistance
- AUTOPILOT: Fully autonomous AI operations with human oversight
"""

import asyncio
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, Optional, Any, List
import time

logger = logging.getLogger(__name__)

class OperationalMode(Enum):
    """Operational modes for the APEX AI system"""
    CO_PILOT = "co_pilot"
    AUTOPILOT = "autopilot"

class ModeTransition:
    """Represents a mode transition event"""
    def __init__(self, from_mode: OperationalMode, to_mode: OperationalMode, 
                 timestamp: str, reason: str, authorized_by: str):
        self.from_mode = from_mode
        self.to_mode = to_mode
        self.timestamp = timestamp
        self.reason = reason
        self.authorized_by = authorized_by

class OperationalModeManager:
    """
    Manages operational mode state and transitions for the APEX AI system
    
    Ensures safe transitions between Co-Pilot and Autopilot modes with
    proper validation, logging, and security controls.
    """
    
    def __init__(self, initial_mode: OperationalMode = OperationalMode.CO_PILOT, 
                 config: Dict[str, Any] = None):
        self.current_mode = initial_mode
        self.previous_mode: Optional[OperationalMode] = None
        self.mode_switched_at = datetime.now().isoformat()
        self.config = config or {}
        
        # Mode transition history
        self.transition_history: List[ModeTransition] = []
        self.max_history_size = self.config.get('max_history_size', 100)
        
        # Mode switching controls
        self.allow_mode_switching = self.config.get('allow_mode_switching', True)
        self.require_authorization = self.config.get('require_authorization', True)
        self.cooldown_period = self.config.get('cooldown_period_seconds', 30)
        self.last_switch_time = 0
        
        # Autopilot metrics
        self.autopilot_metrics = {
            'total_decisions': 0,
            'successful_decisions': 0,
            'failed_decisions': 0,
            'average_decision_time': 0.0,
            'total_runtime_seconds': 0,
            'mode_entered_at': None,
            'confidence_scores': [],
            'escalations_to_human': 0
        }
        
        # Co-pilot metrics
        self.copilot_metrics = {
            'total_assists': 0,
            'human_confirmations': 0,
            'human_overrides': 0,
            'average_response_time': 0.0,
            'total_runtime_seconds': 0,
            'mode_entered_at': None,
            'user_satisfaction_scores': []
        }
        
        # Current mode session tracking
        self.current_session_start = time.time()
        
        logger.info(f"🔄 Operational Mode Manager initialized - Current mode: {self.current_mode.value}")
    
    async def initialize(self):
        """Initialize the operational mode manager"""
        try:
            # Set initial session start time
            if self.current_mode == OperationalMode.AUTOPILOT:
                self.autopilot_metrics['mode_entered_at'] = datetime.now().isoformat()
            else:
                self.copilot_metrics['mode_entered_at'] = datetime.now().isoformat()
            
            logger.info("✅ Operational Mode Manager initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Operational Mode Manager: {e}")
            raise
    
    async def switch_mode(self, target_mode: OperationalMode, reason: str = "Manual switch", 
                         authorized_by: str = "system") -> bool:
        """
        Switch operational mode with validation and logging
        
        Args:
            target_mode: Target operational mode
            reason: Reason for the mode switch
            authorized_by: Who authorized this switch
            
        Returns:
            True if switch was successful, False otherwise
        """
        try:
            # Validation checks
            if not self.can_switch_mode():
                logger.warning(f"⚠️ Mode switch blocked - Current: {self.current_mode.value}, Target: {target_mode.value}")
                return False
            
            if target_mode == self.current_mode:
                logger.info(f"ℹ️ Already in target mode: {target_mode.value}")
                return True
            
            # Check cooldown period
            current_time = time.time()
            if current_time - self.last_switch_time < self.cooldown_period:
                remaining_cooldown = self.cooldown_period - (current_time - self.last_switch_time)
                logger.warning(f"⏰ Mode switch cooldown active - {remaining_cooldown:.1f}s remaining")
                return False
            
            # Prepare for mode switch
            previous_mode = self.current_mode
            switch_timestamp = datetime.now().isoformat()
            
            # Finalize current mode session
            await self._finalize_mode_session(previous_mode)
            
            # Perform the switch
            self.previous_mode = previous_mode
            self.current_mode = target_mode
            self.mode_switched_at = switch_timestamp
            self.last_switch_time = current_time
            
            # Initialize new mode session
            await self._initialize_mode_session(target_mode)
            
            # Record transition
            transition = ModeTransition(
                from_mode=previous_mode,
                to_mode=target_mode,
                timestamp=switch_timestamp,
                reason=reason,
                authorized_by=authorized_by
            )
            
            self.transition_history.append(transition)
            
            # Maintain history size limit
            if len(self.transition_history) > self.max_history_size:
                self.transition_history.pop(0)
            
            logger.info(f"✅ Mode switched: {previous_mode.value} → {target_mode.value} (Reason: {reason})")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Mode switch failed: {e}")
            return False
    
    def can_switch_mode(self) -> bool:
        """Check if mode switching is currently allowed"""
        if not self.allow_mode_switching:
            return False
        
        # Check if we're in a cooldown period
        current_time = time.time()
        if current_time - self.last_switch_time < self.cooldown_period:
            return False
        
        # Add additional safety checks here if needed
        # For example, checking if critical operations are in progress
        
        return True
    
    async def _finalize_mode_session(self, mode: OperationalMode):
        """Finalize the current mode session and update metrics"""
        try:
            session_duration = time.time() - self.current_session_start
            
            if mode == OperationalMode.AUTOPILOT:
                self.autopilot_metrics['total_runtime_seconds'] += session_duration
                logger.info(f"📊 Autopilot session finalized - Duration: {session_duration:.1f}s")
                
            elif mode == OperationalMode.CO_PILOT:
                self.copilot_metrics['total_runtime_seconds'] += session_duration
                logger.info(f"📊 Co-Pilot session finalized - Duration: {session_duration:.1f}s")
            
        except Exception as e:
            logger.error(f"❌ Failed to finalize mode session: {e}")
    
    async def _initialize_mode_session(self, mode: OperationalMode):
        """Initialize a new mode session"""
        try:
            self.current_session_start = time.time()
            session_timestamp = datetime.now().isoformat()
            
            if mode == OperationalMode.AUTOPILOT:
                self.autopilot_metrics['mode_entered_at'] = session_timestamp
                logger.info("🤖 Autopilot mode session initialized")
                
            elif mode == OperationalMode.CO_PILOT:
                self.copilot_metrics['mode_entered_at'] = session_timestamp
                logger.info("👤 Co-Pilot mode session initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize mode session: {e}")
    
    def record_autopilot_decision(self, decision_time: float, success: bool, confidence: float = None):
        """Record metrics for an autopilot decision"""
        if self.current_mode != OperationalMode.AUTOPILOT:
            return
        
        self.autopilot_metrics['total_decisions'] += 1
        
        if success:
            self.autopilot_metrics['successful_decisions'] += 1
        else:
            self.autopilot_metrics['failed_decisions'] += 1
        
        # Update average decision time
        total_decisions = self.autopilot_metrics['total_decisions']
        current_avg = self.autopilot_metrics['average_decision_time']
        new_avg = ((current_avg * (total_decisions - 1)) + decision_time) / total_decisions
        self.autopilot_metrics['average_decision_time'] = new_avg
        
        # Record confidence score if provided
        if confidence is not None:
            self.autopilot_metrics['confidence_scores'].append(confidence)
            
            # Keep only recent confidence scores (last 100)
            if len(self.autopilot_metrics['confidence_scores']) > 100:
                self.autopilot_metrics['confidence_scores'].pop(0)
        
        logger.debug(f"📊 Autopilot decision recorded - Success: {success}, Time: {decision_time:.3f}s")
    
    def record_copilot_interaction(self, response_time: float, interaction_type: str, 
                                  user_action: str = None):
        """Record metrics for a co-pilot interaction"""
        if self.current_mode != OperationalMode.CO_PILOT:
            return
        
        self.copilot_metrics['total_assists'] += 1
        
        # Track specific user actions
        if user_action == 'confirmed':
            self.copilot_metrics['human_confirmations'] += 1
        elif user_action == 'overridden':
            self.copilot_metrics['human_overrides'] += 1
        
        # Update average response time
        total_assists = self.copilot_metrics['total_assists']
        current_avg = self.copilot_metrics['average_response_time']
        new_avg = ((current_avg * (total_assists - 1)) + response_time) / total_assists
        self.copilot_metrics['average_response_time'] = new_avg
        
        logger.debug(f"📊 Co-Pilot interaction recorded - Type: {interaction_type}, Time: {response_time:.3f}s")
    
    def record_autopilot_escalation(self, reason: str = ""):
        """Record when autopilot escalates to human"""
        if self.current_mode == OperationalMode.AUTOPILOT:
            self.autopilot_metrics['escalations_to_human'] += 1
            logger.info(f"📈 Autopilot escalation recorded - Reason: {reason}")
    
    def get_autopilot_metrics(self) -> Dict[str, Any]:
        """Get comprehensive autopilot performance metrics"""
        metrics = self.autopilot_metrics.copy()
        
        # Calculate derived metrics
        total_decisions = metrics['total_decisions']
        if total_decisions > 0:
            metrics['success_rate'] = metrics['successful_decisions'] / total_decisions
            metrics['failure_rate'] = metrics['failed_decisions'] / total_decisions
        else:
            metrics['success_rate'] = 0.0
            metrics['failure_rate'] = 0.0
        
        # Calculate average confidence
        if metrics['confidence_scores']:
            metrics['average_confidence'] = sum(metrics['confidence_scores']) / len(metrics['confidence_scores'])
            metrics['min_confidence'] = min(metrics['confidence_scores'])
            metrics['max_confidence'] = max(metrics['confidence_scores'])
        else:
            metrics['average_confidence'] = 0.0
            metrics['min_confidence'] = 0.0
            metrics['max_confidence'] = 0.0
        
        # Add current session info
        if self.current_mode == OperationalMode.AUTOPILOT:
            current_session_duration = time.time() - self.current_session_start
            metrics['current_session_duration'] = current_session_duration
        
        return metrics
    
    def get_copilot_metrics(self) -> Dict[str, Any]:
        """Get comprehensive co-pilot performance metrics"""
        metrics = self.copilot_metrics.copy()
        
        # Calculate derived metrics
        total_assists = metrics['total_assists']
        if total_assists > 0:
            metrics['confirmation_rate'] = metrics['human_confirmations'] / total_assists
            metrics['override_rate'] = metrics['human_overrides'] / total_assists
        else:
            metrics['confirmation_rate'] = 0.0
            metrics['override_rate'] = 0.0
        
        # Calculate average user satisfaction
        if metrics['user_satisfaction_scores']:
            metrics['average_satisfaction'] = sum(metrics['user_satisfaction_scores']) / len(metrics['user_satisfaction_scores'])
        else:
            metrics['average_satisfaction'] = 0.0
        
        # Add current session info
        if self.current_mode == OperationalMode.CO_PILOT:
            current_session_duration = time.time() - self.current_session_start
            metrics['current_session_duration'] = current_session_duration
        
        return metrics
    
    def get_transition_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent mode transition history"""
        recent_transitions = self.transition_history[-limit:] if self.transition_history else []
        
        return [
            {
                "from_mode": t.from_mode.value,
                "to_mode": t.to_mode.value,
                "timestamp": t.timestamp,
                "reason": t.reason,
                "authorized_by": t.authorized_by
            }
            for t in recent_transitions
        ]
    
    def get_current_status(self) -> Dict[str, Any]:
        """Get comprehensive current operational status"""
        current_session_duration = time.time() - self.current_session_start
        
        return {
            "current_mode": self.current_mode.value,
            "previous_mode": self.previous_mode.value if self.previous_mode else None,
            "mode_switched_at": self.mode_switched_at,
            "current_session_duration": current_session_duration,
            "can_switch_mode": self.can_switch_mode(),
            "allow_mode_switching": self.allow_mode_switching,
            "cooldown_remaining": max(0, self.cooldown_period - (time.time() - self.last_switch_time)),
            "total_transitions": len(self.transition_history),
            "last_transition": self.transition_history[-1].__dict__ if self.transition_history else None
        }
    
    def update_configuration(self, new_config: Dict[str, Any]):
        """Update operational mode manager configuration"""
        self.config.update(new_config)
        
        # Update settings
        self.allow_mode_switching = new_config.get('allow_mode_switching', self.allow_mode_switching)
        self.require_authorization = new_config.get('require_authorization', self.require_authorization)
        self.cooldown_period = new_config.get('cooldown_period_seconds', self.cooldown_period)
        self.max_history_size = new_config.get('max_history_size', self.max_history_size)
        
        logger.info("✅ Operational Mode Manager configuration updated")
    
    async def emergency_switch_to_copilot(self, reason: str = "Emergency switch"):
        """Emergency switch to co-pilot mode (bypasses normal checks)"""
        try:
            logger.warning(f"🚨 Emergency switch to Co-Pilot mode - Reason: {reason}")
            
            previous_mode = self.current_mode
            self.previous_mode = previous_mode
            self.current_mode = OperationalMode.CO_PILOT
            self.mode_switched_at = datetime.now().isoformat()
            self.last_switch_time = time.time()
            
            # Finalize previous session
            await self._finalize_mode_session(previous_mode)
            
            # Initialize co-pilot session
            await self._initialize_mode_session(OperationalMode.CO_PILOT)
            
            # Record emergency transition
            emergency_transition = ModeTransition(
                from_mode=previous_mode,
                to_mode=OperationalMode.CO_PILOT,
                timestamp=self.mode_switched_at,
                reason=f"EMERGENCY: {reason}",
                authorized_by="system_emergency"
            )
            
            self.transition_history.append(emergency_transition)
            
            logger.warning("🚨 Emergency switch to Co-Pilot completed")
            
        except Exception as e:
            logger.error(f"❌ Emergency switch failed: {e}")
            raise
    
    async def shutdown(self):
        """Shutdown the operational mode manager"""
        try:
            # Finalize current session
            await self._finalize_mode_session(self.current_mode)
            
            # Log final statistics
            logger.info("📊 Final Operational Mode Statistics:")
            logger.info(f"   Total transitions: {len(self.transition_history)}")
            logger.info(f"   Autopilot runtime: {self.autopilot_metrics['total_runtime_seconds']:.1f}s")
            logger.info(f"   Co-Pilot runtime: {self.copilot_metrics['total_runtime_seconds']:.1f}s")
            
            logger.info("✅ Operational Mode Manager shutdown complete")
            
        except Exception as e:
            logger.error(f"❌ Operational Mode Manager shutdown error: {e}")
