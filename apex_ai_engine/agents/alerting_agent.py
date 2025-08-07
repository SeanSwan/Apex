"""
APEX AI ALERTING AGENT
======================
Specialized AI agent for alert generation and notification management

This agent encapsulates all alerting logic including visual alerts,
spatial audio, alert coordination, and frontend communication.

Features:
- Multi-modal alert generation (visual, audio, notifications)
- Real-time frontend communication via WebSocket
- Alert escalation and de-escalation logic
- Multi-zone alert coordination
- Performance optimized alert rendering
- Alert acknowledgment and resolution tracking

Agent Responsibilities:
- Generate visual alerts for detected threats
- Coordinate spatial audio alerts
- Manage alert escalation procedures
- Communicate with frontend components
- Track alert acknowledgments and resolutions
- Handle alert rate limiting and cooldowns
"""

import asyncio
import json
import time
import math
import threading
import logging
from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass
from datetime import datetime, timedelta
from collections import defaultdict, deque
from enum import Enum
import queue

# Import existing alert components
try:
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from visual_alerts.enhanced_visual_alert_engine import (
        EnhancedVisualAlertEngine, ThreatLevel as ExistingThreatLevel, AlertPattern
    )
    from audio_alerts.spatial_audio_engine import SpatialAudioEngine, ThreatAudioProfile
    from tier2_alert_coordinator import Tier2AlertCoordinator
    ALERT_COMPONENTS_AVAILABLE = True
except ImportError as e:
    # Fallback for development
    ALERT_COMPONENTS_AVAILABLE = False
    EnhancedVisualAlertEngine = None
    SpatialAudioEngine = None
    Tier2AlertCoordinator = None
    logger = logging.getLogger(__name__)
    logger.warning(f"⚠️ Alert components not available - agent will operate in simulation mode: {e}")
    
    # Create mock classes
    class MockVisualAlertEngine:
        def __init__(self, websocket_client=None, config=None):
            self.websocket_client = websocket_client
            self.config = config or {}
        
        async def trigger_visual_alert(self, zone_id, threat_data):
            return f"visual_alert_{zone_id}_{int(time.time())}"
        
        async def clear_visual_alert(self, zone_id):
            return True
        
        def set_websocket_client(self, client):
            self.websocket_client = client
    
    class MockAudioEngine:
        def __init__(self, websocket_client=None, config=None):
            self.websocket_client = websocket_client
            self.config = config or {}
        
        async def trigger_spatial_alert(self, alert_data):
            return f"audio_alert_{int(time.time())}"
        
        async def stop_zone_audio_alerts(self, zone_id):
            return True
        
        def set_websocket_client(self, client):
            self.websocket_client = client
    
    class MockTier2Coordinator:
        def __init__(self, websocket_client=None, config=None):
            self.websocket_client = websocket_client
            self.config = config or {}
        
        async def trigger_coordinated_alert(self, alert_data):
            return {"success": True, "alert_id": f"coord_{int(time.time())}"}
        
        def set_websocket_client(self, client):
            self.websocket_client = client
    
    EnhancedVisualAlertEngine = MockVisualAlertEngine
    SpatialAudioEngine = MockAudioEngine
    Tier2AlertCoordinator = MockTier2Coordinator
    
    # Define fallback classes
    class ThreatLevel(Enum):
        SAFE = 'SAFE'
        LOW = 'LOW'
        MEDIUM = 'MEDIUM'
        HIGH = 'HIGH'
        CRITICAL = 'CRITICAL'
        WEAPON = 'WEAPON'
    
    class AlertPattern(Enum):
        SAFE = 'safe'
        LOW_PULSE = 'low_pulse'
        MEDIUM_BLINK = 'medium_blink'
        HIGH_FLASH = 'high_flash'
        CRITICAL_STROBE = 'critical_strobe'
        WEAPON_URGENT = 'weapon_urgent'

logger = logging.getLogger(__name__)

class AlertStatus(Enum):
    """Alert status tracking"""
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    EXPIRED = "expired"
    SNOOZED = "snoozed"

@dataclass
class AlertRecord:
    """Represents an active alert"""
    alert_id: str
    threat_type: str
    threat_level: ThreatLevel
    zone_id: str
    source_id: str
    priority: int
    status: AlertStatus
    created_at: str
    acknowledged_at: Optional[str] = None
    resolved_at: Optional[str] = None
    acknowledgment_user: Optional[str] = None
    resolution_reason: Optional[str] = None
    metadata: Dict[str, Any] = None
    visual_alert_active: bool = False
    audio_alert_active: bool = False
    escalation_count: int = 0

@dataclass
class AlertingTask:
    """Represents an alerting task"""
    task_id: str
    action: str  # trigger_alert, escalate_alert, acknowledge_alert, etc.
    alert_data: Dict[str, Any]
    parameters: Dict[str, Any] = None
    priority: int = 1
    timestamp: str = None

class AlertingAgent:
    """
    Alerting Agent for APEX AI system
    
    Manages all alert generation, coordination, and tracking.
    Integrates with frontend components and manages multi-modal alerts.
    """
    
    def __init__(self, name: str, config: Dict[str, Any], mcp_server=None):
        self.name = name
        self.config = config
        self.mcp_server = mcp_server
        
        # Agent state
        self.enabled = True
        self.status = "initializing"
        self.task_queue = asyncio.Queue()
        self.active_tasks: Dict[str, AlertingTask] = {}
        
        # Alert engines
        self.visual_engine: Optional = None
        self.audio_engine: Optional = None
        self.tier2_coordinator: Optional = None
        
        # WebSocket client for frontend communication
        self.websocket_client = None
        
        # Alert management
        self.active_alerts: Dict[str, AlertRecord] = {}
        self.alert_history: List[AlertRecord] = []
        self.max_history_size = config.get('max_history_size', 1000)
        self.alert_counter = 0
        
        # Zone management
        self.registered_zones: Dict[str, Dict] = {}
        self.zone_alert_states: Dict[str, Dict] = {}
        
        # Alert settings
        self.enable_visual_alerts = config.get('enable_visual_alerts', True)
        self.enable_audio_alerts = config.get('enable_audio_alerts', True)
        self.enable_escalation = config.get('enable_escalation', True)
        self.auto_acknowledge_timeout = config.get('auto_acknowledge_timeout', 300)  # 5 minutes
        self.alert_cooldown_seconds = config.get('alert_cooldown_seconds', 30)
        
        # Performance metrics  
        self.metrics = {
            'total_alerts_generated': 0,
            'visual_alerts_triggered': 0,
            'audio_alerts_triggered': 0,
            'alerts_acknowledged': 0,
            'alerts_resolved': 0,
            'alerts_escalated': 0,
            'average_acknowledgment_time': 0.0,
            'average_resolution_time': 0.0,
            'active_alerts_count': 0,
            'error_count': 0,
            'last_alert_time': None
        }
        
        # Threading
        self.worker_thread: Optional[threading.Thread] = None
        self.cleanup_thread: Optional[threading.Thread] = None
        self.shutdown_event = threading.Event()
        
        # Processing queue
        self.alert_queue = queue.Queue(maxsize=200)
        
        # Alert cooldowns (zone_id -> last_alert_time)
        self.alert_cooldowns: Dict[str, float] = {}
        
        logger.info(f"🚨 Alerting Agent '{name}' initialized")
    
    async def initialize(self):
        """Initialize the Alerting Agent"""
        try:
            self.status = "initializing"
            
            # Initialize alert engines
            await self._initialize_alert_engines()
            
            # Start worker threads
            await self._start_worker_threads()
            
            # Initialize zones
            await self._initialize_default_zones()
            
            self.status = "ready"
            logger.info(f"✅ Alerting Agent '{self.name}' initialized successfully")
            
        except Exception as e:
            self.status = "error"
            logger.error(f"❌ Alerting Agent initialization failed: {e}")
            raise
    
    async def _initialize_alert_engines(self):
        """Initialize alert generation engines"""
        try:
            # Initialize visual alert engine
            if self.enable_visual_alerts:
                try:
                    self.visual_engine = EnhancedVisualAlertEngine(
                        websocket_client=self.websocket_client,
                        config=self.config.get('visual_alerts', {})
                    )
                    logger.info("✅ Visual alert engine initialized")
                except Exception as e:
                    logger.warning(f"⚠️ Visual alert engine unavailable: {e}")
                    self.visual_engine = None
            
            # Initialize spatial audio engine
            if self.enable_audio_alerts:
                try:
                    self.audio_engine = SpatialAudioEngine(
                        websocket_client=self.websocket_client,
                        config=self.config.get('audio_alerts', {})
                    )
                    logger.info("✅ Spatial audio engine initialized")
                except Exception as e:
                    logger.warning(f"⚠️ Spatial audio engine unavailable: {e}")
                    self.audio_engine = None
            
            # Initialize TIER 2 coordinator
            try:
                self.tier2_coordinator = Tier2AlertCoordinator(
                    websocket_client=self.websocket_client,
                    config=self.config.get('tier2_coordination', {})
                )
                logger.info("✅ TIER 2 alert coordinator initialized")
            except Exception as e:
                logger.warning(f"⚠️ TIER 2 coordinator unavailable: {e}")
                self.tier2_coordinator = None
            
        except Exception as e:
            logger.error(f"❌ Alert engine initialization failed: {e}")
            raise
    
    async def _start_worker_threads(self):
        """Start background worker threads"""
        try:
            # Start main alert processing thread
            self.worker_thread = threading.Thread(
                target=self._alerting_worker_main,
                name=f"{self.name}_alerting_worker",
                daemon=True
            )
            self.worker_thread.start()
            
            # Start cleanup thread
            self.cleanup_thread = threading.Thread(
                target=self._cleanup_worker_main,
                name=f"{self.name}_cleanup_worker",
                daemon=True
            )
            self.cleanup_thread.start()
            
            logger.info(f"✅ Worker threads started for Alerting Agent '{self.name}'")
            
        except Exception as e:
            logger.error(f"❌ Failed to start worker threads: {e}")
            raise
    
    def _alerting_worker_main(self):
        """Main alerting processing worker thread"""
        logger.info(f"🔄 Alerting Agent worker thread started: {self.name}")
        
        while not self.shutdown_event.is_set():
            try:
                # Process alert queue
                try:
                    alert_task = self.alert_queue.get(timeout=1.0)
                    self._process_alert_task(alert_task)
                    self.alert_queue.task_done()
                except queue.Empty:
                    continue
                    
            except Exception as e:
                logger.error(f"❌ Alerting worker error: {e}")
                self.metrics['error_count'] += 1
                time.sleep(1)
    
    def _cleanup_worker_main(self):
        """Cleanup worker thread for expired alerts"""
        logger.info(f"🧹 Alerting Agent cleanup thread started: {self.name}")
        
        while not self.shutdown_event.is_set():
            try:
                # Clean up expired alerts
                self._cleanup_expired_alerts()
                
                # Clean up alert cooldowns
                self._cleanup_alert_cooldowns()
                
                # Update metrics
                self._update_active_alerts_count()
                
                # Sleep for cleanup interval
                self.shutdown_event.wait(30)  # Cleanup every 30 seconds
                
            except Exception as e:
                logger.error(f"❌ Cleanup worker error: {e}")
                time.sleep(10)
    
    def _process_alert_task(self, task: AlertingTask):
        """Process a single alerting task"""
        try:
            start_time = time.time()
            
            action = task.action
            alert_data = task.alert_data
            
            logger.debug(f"🎯 Processing alerting task: {action} [{task.task_id}]")
            
            # Process based on action type
            if action == 'trigger_alert':
                self._handle_trigger_alert(alert_data, task.parameters or {})
            elif action == 'escalate_alert':
                self._handle_escalate_alert(alert_data, task.parameters or {})
            elif action == 'acknowledge_alert':
                self._handle_acknowledge_alert(alert_data, task.parameters or {})
            elif action == 'resolve_alert':
                self._handle_resolve_alert(alert_data, task.parameters or {})
            elif action == 'snooze_alert':
                self._handle_snooze_alert(alert_data, task.parameters or {})
            else:
                logger.warning(f"⚠️ Unknown alerting action: {action}")
                return
            
            processing_time = time.time() - start_time
            logger.debug(f"✅ Processed alerting task {task.task_id} in {processing_time:.3f}s")
            
        except Exception as e:
            logger.error(f"❌ Alerting task processing error: {e}")
            self.metrics['error_count'] += 1
    
    def _handle_trigger_alert(self, alert_data: Dict[str, Any], parameters: Dict[str, Any]):
        """Handle alert triggering"""
        try:
            zone_id = alert_data.get('zone_id', 'unknown')
            threat_type = alert_data.get('threat_type', 'unknown')
            threat_level_str = alert_data.get('threat_level', 'MEDIUM')
            
            # Check cooldown
            if not self._check_alert_cooldown(zone_id):
                logger.debug(f"🕐 Alert cooldown active for zone {zone_id}")
                return
            
            # Map threat level
            try:
                threat_level = ThreatLevel(threat_level_str.upper())
            except ValueError:
                threat_level = ThreatLevel.MEDIUM
                logger.warning(f"⚠️ Unknown threat level: {threat_level_str}, using MEDIUM")
            
            # Create alert record
            alert_id = f"alert_{self.alert_counter}_{int(time.time() * 1000)}"
            self.alert_counter += 1
            
            alert_record = AlertRecord(
                alert_id=alert_id,
                threat_type=threat_type,
                threat_level=threat_level,
                zone_id=zone_id,
                source_id=alert_data.get('source_id', 'unknown'),
                priority=self._calculate_alert_priority(threat_level),
                status=AlertStatus.ACTIVE,
                created_at=datetime.now().isoformat(),
                metadata=alert_data.copy()
            )
            
            # Store alert
            self.active_alerts[alert_id] = alert_record
            
            # Trigger visual alert
            if self.enable_visual_alerts and self.visual_engine:
                try:
                    visual_result = asyncio.run(self.visual_engine.trigger_visual_alert(
                        zone_id=zone_id,
                        threat_data=alert_data
                    ))
                    alert_record.visual_alert_active = True
                    self.metrics['visual_alerts_triggered'] += 1
                    logger.debug(f"✨ Visual alert triggered: {visual_result}")
                except Exception as e:
                    logger.error(f"❌ Visual alert failed: {e}")
            
            # Trigger audio alert
            if self.enable_audio_alerts and self.audio_engine:
                try:
                    audio_result = asyncio.run(self.audio_engine.trigger_spatial_alert(
                        alert_data=alert_data
                    ))
                    alert_record.audio_alert_active = True
                    self.metrics['audio_alerts_triggered'] += 1
                    logger.debug(f"🔊 Audio alert triggered: {audio_result}")
                except Exception as e:
                    logger.error(f"❌ Audio alert failed: {e}")
            
            # Use TIER 2 coordinator if available
            if self.tier2_coordinator:
                try:
                    asyncio.run(self.tier2_coordinator.trigger_coordinated_alert(alert_data))
                    logger.debug("🚨 TIER 2 coordinated alert triggered")
                except Exception as e:
                    logger.error(f"❌ TIER 2 coordination failed: {e}")
            
            # Set cooldown
            self.alert_cooldowns[zone_id] = time.time()
            
            # Update metrics
            self.metrics['total_alerts_generated'] += 1
            self.metrics['last_alert_time'] = alert_record.created_at
            
            # Send to frontend if websocket available
            self._send_alert_to_frontend(alert_record)
            
            logger.info(f"🚨 Alert triggered: {alert_id} - {threat_type} in {zone_id} ({threat_level.value})")
            
        except Exception as e:
            logger.error(f"❌ Trigger alert error: {e}")
    
    def _handle_escalate_alert(self, alert_data: Dict[str, Any], parameters: Dict[str, Any]):
        """Handle alert escalation"""
        try:
            alert_id = alert_data.get('alert_id')
            if not alert_id or alert_id not in self.active_alerts:
                logger.warning(f"⚠️ Cannot escalate unknown alert: {alert_id}")
                return
            
            alert_record = self.active_alerts[alert_id]
            alert_record.escalation_count += 1
            
            # Escalate threat level if not already at maximum
            if alert_record.threat_level != ThreatLevel.WEAPON:
                threat_levels = list(ThreatLevel)
                current_index = threat_levels.index(alert_record.threat_level)
                if current_index < len(threat_levels) - 1:
                    alert_record.threat_level = threat_levels[current_index + 1]
                    alert_record.priority = self._calculate_alert_priority(alert_record.threat_level)
            
            # Re-trigger alerts with higher urgency
            escalated_data = alert_record.metadata.copy()
            escalated_data['escalated'] = True
            escalated_data['escalation_count'] = alert_record.escalation_count
            escalated_data['threat_level'] = alert_record.threat_level.value
            
            self._handle_trigger_alert(escalated_data, parameters)
            
            self.metrics['alerts_escalated'] += 1
            
            logger.warning(f"🔥 Alert escalated: {alert_id} - Now {alert_record.threat_level.value}")
            
        except Exception as e:
            logger.error(f"❌ Escalate alert error: {e}")
    
    def _handle_acknowledge_alert(self, alert_data: Dict[str, Any], parameters: Dict[str, Any]):
        """Handle alert acknowledgment"""
        try:
            alert_id = alert_data.get('alert_id')
            user = parameters.get('user', 'system')
            
            if not alert_id or alert_id not in self.active_alerts:
                logger.warning(f"⚠️ Cannot acknowledge unknown alert: {alert_id}")
                return
            
            alert_record = self.active_alerts[alert_id]
            if alert_record.status == AlertStatus.ACTIVE:
                alert_record.status = AlertStatus.ACKNOWLEDGED
                alert_record.acknowledged_at = datetime.now().isoformat()
                alert_record.acknowledgment_user = user
                
                # Stop visual alerts but keep record
                if self.visual_engine:
                    asyncio.run(self.visual_engine.clear_visual_alert(alert_record.zone_id))
                    alert_record.visual_alert_active = False
                
                # Stop audio alerts
                if self.audio_engine:
                    asyncio.run(self.audio_engine.stop_zone_audio_alerts(alert_record.zone_id))
                    alert_record.audio_alert_active = False
                
                self.metrics['alerts_acknowledged'] += 1
                
                # Update acknowledgment time metrics
                self._update_acknowledgment_metrics(alert_record)
                
                # Send acknowledgment to frontend
                self._send_alert_acknowledgment_to_frontend(alert_record)
                
                logger.info(f"✅ Alert acknowledged: {alert_id} by {user}")
            
        except Exception as e:
            logger.error(f"❌ Acknowledge alert error: {e}")
    
    def _handle_resolve_alert(self, alert_data: Dict[str, Any], parameters: Dict[str, Any]):
        """Handle alert resolution"""
        try:
            alert_id = alert_data.get('alert_id')
            reason = parameters.get('reason', 'Manual resolution')
            
            if not alert_id or alert_id not in self.active_alerts:
                logger.warning(f"⚠️ Cannot resolve unknown alert: {alert_id}")
                return
            
            alert_record = self.active_alerts[alert_id]
            alert_record.status = AlertStatus.RESOLVED
            alert_record.resolved_at = datetime.now().isoformat()
            alert_record.resolution_reason = reason
            
            # Stop all alerts for this zone
            if self.visual_engine:
                asyncio.run(self.visual_engine.clear_visual_alert(alert_record.zone_id))
                alert_record.visual_alert_active = False
            
            if self.audio_engine:
                asyncio.run(self.audio_engine.stop_zone_audio_alerts(alert_record.zone_id))
                alert_record.audio_alert_active = False
            
            # Move to history
            self.alert_history.append(alert_record)
            del self.active_alerts[alert_id]
            
            # Maintain history size
            if len(self.alert_history) > self.max_history_size:
                self.alert_history.pop(0)
            
            self.metrics['alerts_resolved'] += 1
            
            # Update resolution time metrics
            self._update_resolution_metrics(alert_record)
            
            # Send resolution to frontend
            self._send_alert_resolution_to_frontend(alert_record)
            
            logger.info(f"✅ Alert resolved: {alert_id} - {reason}")
            
        except Exception as e:
            logger.error(f"❌ Resolve alert error: {e}")
    
    def _handle_snooze_alert(self, alert_data: Dict[str, Any], parameters: Dict[str, Any]):
        """Handle alert snoozing"""
        try:
            alert_id = alert_data.get('alert_id')
            snooze_duration = parameters.get('duration', 300)  # 5 minutes default
            
            if not alert_id or alert_id not in self.active_alerts:
                logger.warning(f"⚠️ Cannot snooze unknown alert: {alert_id}")
                return
            
            alert_record = self.active_alerts[alert_id]
            alert_record.status = AlertStatus.SNOOZED
            alert_record.metadata['snoozed_until'] = (
                datetime.now() + timedelta(seconds=snooze_duration)
            ).isoformat()
            
            # Temporarily stop visual/audio alerts
            if self.visual_engine:
                asyncio.run(self.visual_engine.clear_visual_alert(alert_record.zone_id))
                alert_record.visual_alert_active = False
            
            if self.audio_engine:
                asyncio.run(self.audio_engine.stop_zone_audio_alerts(alert_record.zone_id))
                alert_record.audio_alert_active = False
            
            logger.info(f"😴 Alert snoozed: {alert_id} for {snooze_duration}s")
            
        except Exception as e:
            logger.error(f"❌ Snooze alert error: {e}")
    
    def _check_alert_cooldown(self, zone_id: str) -> bool:
        """Check if zone is not in alert cooldown"""
        if zone_id not in self.alert_cooldowns:
            return True
        
        time_since_last = time.time() - self.alert_cooldowns[zone_id]
        return time_since_last >= self.alert_cooldown_seconds
    
    def _calculate_alert_priority(self, threat_level: ThreatLevel) -> int:
        """Calculate numeric priority from threat level"""
        priority_map = {
            ThreatLevel.SAFE: 0,
            ThreatLevel.LOW: 1,
            ThreatLevel.MEDIUM: 2,
            ThreatLevel.HIGH: 3,
            ThreatLevel.CRITICAL: 4,
            ThreatLevel.WEAPON: 5
        }
        return priority_map.get(threat_level, 2)
    
    def _send_alert_to_frontend(self, alert_record: AlertRecord):
        """Send alert to frontend via WebSocket"""
        try:
            if not self.websocket_client:
                return
            
            alert_message = {
                'type': 'new_alert',
                'alert': {
                    'alert_id': alert_record.alert_id,
                    'threat_type': alert_record.threat_type,
                    'threat_level': alert_record.threat_level.value,
                    'zone_id': alert_record.zone_id,
                    'source_id': alert_record.source_id,
                    'priority': alert_record.priority,
                    'status': alert_record.status.value,
                    'created_at': alert_record.created_at,
                    'metadata': alert_record.metadata
                },
                'timestamp': datetime.now().isoformat()
            }
            
            asyncio.run(self.websocket_client.send_message('alert_notification', alert_message))
            
        except Exception as e:
            logger.error(f"❌ Failed to send alert to frontend: {e}")
    
    def _send_alert_acknowledgment_to_frontend(self, alert_record: AlertRecord):
        """Send alert acknowledgment to frontend"""
        try:
            if not self.websocket_client:
                return
            
            ack_message = {
                'type': 'alert_acknowledged',
                'alert_id': alert_record.alert_id,
                'acknowledged_by': alert_record.acknowledgment_user,
                'acknowledged_at': alert_record.acknowledged_at,
                'timestamp': datetime.now().isoformat()
            }
            
            asyncio.run(self.websocket_client.send_message('alert_acknowledgment', ack_message))
            
        except Exception as e:
            logger.error(f"❌ Failed to send acknowledgment to frontend: {e}")
    
    def _send_alert_resolution_to_frontend(self, alert_record: AlertRecord):
        """Send alert resolution to frontend"""
        try:
            if not self.websocket_client:
                return
            
            resolution_message = {
                'type': 'alert_resolved',
                'alert_id': alert_record.alert_id,
                'resolved_at': alert_record.resolved_at,
                'resolution_reason': alert_record.resolution_reason,
                'timestamp': datetime.now().isoformat()
            }
            
            asyncio.run(self.websocket_client.send_message('alert_resolution', resolution_message))
            
        except Exception as e:
            logger.error(f"❌ Failed to send resolution to frontend: {e}")
    
    def _update_acknowledgment_metrics(self, alert_record: AlertRecord):
        """Update acknowledgment time metrics"""
        try:
            if alert_record.created_at and alert_record.acknowledged_at:
                created = datetime.fromisoformat(alert_record.created_at)
                acknowledged = datetime.fromisoformat(alert_record.acknowledged_at)
                ack_time = (acknowledged - created).total_seconds()
                
                # Update rolling average
                total_acks = self.metrics['alerts_acknowledged']
                current_avg = self.metrics['average_acknowledgment_time']
                new_avg = ((current_avg * (total_acks - 1)) + ack_time) / total_acks
                self.metrics['average_acknowledgment_time'] = new_avg
                
        except Exception as e:
            logger.error(f"❌ Acknowledgment metrics update error: {e}")
    
    def _update_resolution_metrics(self, alert_record: AlertRecord):
        """Update resolution time metrics"""
        try:
            if alert_record.created_at and alert_record.resolved_at:
                created = datetime.fromisoformat(alert_record.created_at)
                resolved = datetime.fromisoformat(alert_record.resolved_at)
                resolution_time = (resolved - created).total_seconds()
                
                # Update rolling average
                total_resolutions = self.metrics['alerts_resolved']
                current_avg = self.metrics['average_resolution_time']
                new_avg = ((current_avg * (total_resolutions - 1)) + resolution_time) / total_resolutions
                self.metrics['average_resolution_time'] = new_avg
                
        except Exception as e:
            logger.error(f"❌ Resolution metrics update error: {e}")
    
    def _update_active_alerts_count(self):
        """Update active alerts count"""
        self.metrics['active_alerts_count'] = len(self.active_alerts)
    
    def _cleanup_expired_alerts(self):
        """Clean up expired and old alerts"""
        try:
            current_time = datetime.now()
            expired_alerts = []
            
            for alert_id, alert_record in self.active_alerts.items():
                # Check for auto-acknowledge timeout
                if alert_record.status == AlertStatus.ACTIVE:
                    created_time = datetime.fromisoformat(alert_record.created_at)
                    if (current_time - created_time).total_seconds() > self.auto_acknowledge_timeout:
                        # Auto-acknowledge expired alert
                        alert_record.status = AlertStatus.ACKNOWLEDGED
                        alert_record.acknowledged_at = current_time.isoformat()
                        alert_record.acknowledgment_user = "system_timeout"
                        
                        self.metrics['alerts_acknowledged'] += 1
                        logger.info(f"🕐 Auto-acknowledged expired alert: {alert_id}")
                
                # Check for snoozed alerts that should be reactivated
                elif alert_record.status == AlertStatus.SNOOZED:
                    snooze_until_str = alert_record.metadata.get('snoozed_until')
                    if snooze_until_str:
                        snooze_until = datetime.fromisoformat(snooze_until_str)
                        if current_time >= snooze_until:
                            # Reactivate snoozed alert
                            alert_record.status = AlertStatus.ACTIVE
                            del alert_record.metadata['snoozed_until']
                            
                            # Re-trigger alerts
                            self._handle_trigger_alert(alert_record.metadata, {})
                            logger.info(f"⏰ Reactivated snoozed alert: {alert_id}")
            
        except Exception as e:
            logger.error(f"❌ Cleanup expired alerts error: {e}")
    
    def _cleanup_alert_cooldowns(self):
        """Clean up old alert cooldowns"""
        try:
            current_time = time.time()
            expired_cooldowns = [
                zone_id for zone_id, last_time in self.alert_cooldowns.items()
                if current_time - last_time > self.alert_cooldown_seconds * 2  # Keep for 2x cooldown
            ]
            
            for zone_id in expired_cooldowns:
                del self.alert_cooldowns[zone_id]
                
        except Exception as e:
            logger.error(f"❌ Cleanup cooldowns error: {e}")
    
    async def _initialize_default_zones(self):
        """Initialize default monitoring zones"""
        try:
            default_zones = self.config.get('default_zones', [
                {'zone_id': 'CAM-01', 'name': 'Front Entrance', 'priority': 1},
                {'zone_id': 'CAM-02', 'name': 'Parking Lot', 'priority': 2},
                {'zone_id': 'CAM-03', 'name': 'Lobby', 'priority': 1},
                {'zone_id': 'CAM-04', 'name': 'Rear Exit', 'priority': 2}
            ])
            
            for zone_config in default_zones:
                zone_id = zone_config['zone_id']
                self.registered_zones[zone_id] = zone_config
                self.zone_alert_states[zone_id] = {
                    'active_alerts': 0,
                    'last_alert_time': None,
                    'alert_level': ThreatLevel.SAFE
                }
                
                logger.debug(f"📍 Registered zone: {zone_id}")
            
            logger.info(f"📍 Initialized {len(self.registered_zones)} default zones")
            
        except Exception as e:
            logger.error(f"❌ Zone initialization error: {e}")
    
    async def execute_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a task assigned by the MCP Server"""
        try:
            task_id = task_data.get('task_id', 'unknown')
            action = task_data.get('action', 'unknown')
            parameters = task_data.get('parameters', {})
            
            logger.info(f"🎯 Executing Alerting Agent task: {action} [{task_id}]")
            
            start_time = time.time()
            
            # Execute based on action type
            if action == 'trigger_alert':
                result = await self._handle_trigger_alert_task(parameters)
            elif action == 'escalate_alert':
                result = await self._handle_escalate_alert_task(parameters)
            elif action == 'acknowledge_alert':
                result = await self._handle_acknowledge_alert_task(parameters)
            elif action == 'resolve_alert':
                result = await self._handle_resolve_alert_task(parameters)
            elif action == 'get_active_alerts':
                result = await self._handle_get_active_alerts(parameters)
            elif action == 'get_status':
                result = await self._handle_get_status(parameters)
            else:
                result = {
                    'success': False,
                    'error': f'Unknown action: {action}',
                    'supported_actions': ['trigger_alert', 'escalate_alert', 'acknowledge_alert', 
                                        'resolve_alert', 'get_active_alerts', 'get_status']
                }
            
            execution_time = time.time() - start_time
            
            # Add execution metadata
            result['execution_time'] = execution_time
            result['task_id'] = task_id
            result['agent'] = self.name
            result['timestamp'] = datetime.now().isoformat()
            
            logger.info(f"✅ Alerting Agent task completed: {action} in {execution_time:.3f}s")
            
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
    
    async def _handle_trigger_alert_task(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle trigger alert task"""
        try:
            # Create alerting task
            alerting_task = AlertingTask(
                task_id=f"trigger_{int(time.time() * 1000)}",
                action='trigger_alert',
                alert_data=parameters.get('alert_data', {}),
                parameters=parameters
            )
            
            # Add to processing queue
            try:
                self.alert_queue.put(alerting_task, timeout=1.0)
                
                return {
                    'success': True,
                    'task_queued': True,
                    'alerting_task_id': alerting_task.task_id,
                    'queue_size': self.alert_queue.qsize()
                }
            except queue.Full:
                return {
                    'success': False,
                    'error': 'Alert queue is full',
                    'queue_size': self.alert_queue.qsize()
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _handle_escalate_alert_task(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle escalate alert task"""
        # Similar structure to trigger alert
        return await self._handle_trigger_alert_task(parameters)
    
    async def _handle_acknowledge_alert_task(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle acknowledge alert task"""
        # Similar structure to trigger alert
        return await self._handle_trigger_alert_task(parameters)
    
    async def _handle_resolve_alert_task(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle resolve alert task"""
        # Similar structure to trigger alert
        return await self._handle_trigger_alert_task(parameters)
    
    async def _handle_get_active_alerts(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle get active alerts request"""
        try:
            zone_filter = parameters.get('zone_id')
            status_filter = parameters.get('status')
            
            # Filter alerts
            filtered_alerts = []
            for alert_record in self.active_alerts.values():
                if zone_filter and alert_record.zone_id != zone_filter:
                    continue
                if status_filter and alert_record.status.value != status_filter:
                    continue
                
                # Convert to serializable format
                alert_data = {
                    'alert_id': alert_record.alert_id,
                    'threat_type': alert_record.threat_type,
                    'threat_level': alert_record.threat_level.value,
                    'zone_id': alert_record.zone_id,
                    'source_id': alert_record.source_id,
                    'priority': alert_record.priority,
                    'status': alert_record.status.value,
                    'created_at': alert_record.created_at,
                    'acknowledged_at': alert_record.acknowledged_at,
                    'resolved_at': alert_record.resolved_at,
                    'escalation_count': alert_record.escalation_count,
                    'visual_alert_active': alert_record.visual_alert_active,
                    'audio_alert_active': alert_record.audio_alert_active,
                    'metadata': alert_record.metadata
                }
                filtered_alerts.append(alert_data)
            
            return {
                'success': True,
                'active_alerts': filtered_alerts,
                'total_alerts': len(filtered_alerts),
                'filters_applied': {
                    'zone_id': zone_filter,
                    'status': status_filter
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
                'active_alerts': len(self.active_alerts),
                'registered_zones': len(self.registered_zones),
                'alert_queue_size': self.alert_queue.qsize(),
                'metrics': self.metrics.copy(),
                'configuration': {
                    'enable_visual_alerts': self.enable_visual_alerts,
                    'enable_audio_alerts': self.enable_audio_alerts,
                    'enable_escalation': self.enable_escalation,
                    'auto_acknowledge_timeout': self.auto_acknowledge_timeout,
                    'alert_cooldown_seconds': self.alert_cooldown_seconds
                },
                'engines_status': {
                    'visual_engine': self.visual_engine is not None,
                    'audio_engine': self.audio_engine is not None,
                    'tier2_coordinator': self.tier2_coordinator is not None,
                    'websocket_client': self.websocket_client is not None
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def set_websocket_client(self, websocket_client):
        """Set WebSocket client for frontend communication"""
        self.websocket_client = websocket_client
        
        # Update engines with new client
        if self.visual_engine:
            self.visual_engine.set_websocket_client(websocket_client)
        if self.audio_engine:
            self.audio_engine.set_websocket_client(websocket_client)
        if self.tier2_coordinator:
            self.tier2_coordinator.set_websocket_client(websocket_client)
        
        logger.info("🔌 WebSocket client updated for Alerting Agent")
    
    def get_agent_info(self) -> Dict[str, Any]:
        """Get comprehensive agent information"""
        return {
            'name': self.name,
            'type': 'alerting_agent',
            'status': self.status,
            'enabled': self.enabled,
            'config': self.config,
            'capabilities': [
                'trigger_alert',
                'escalate_alert',
                'acknowledge_alert',
                'resolve_alert',
                'get_active_alerts',
                'get_status'
            ],
            'active_alerts': len(self.active_alerts),
            'registered_zones': len(self.registered_zones),
            'metrics': self.metrics.copy(),
            'uptime': time.time() - getattr(self, '_start_time', time.time())
        }
    
    async def shutdown(self):
        """Shutdown the Alerting Agent"""
        try:
            logger.info(f"🛑 Shutting down Alerting Agent '{self.name}'")
            
            self.status = "shutting_down"
            self.shutdown_event.set()
            
            # Wait for threads to finish
            if self.worker_thread and self.worker_thread.is_alive():
                self.worker_thread.join(timeout=5)
            
            if self.cleanup_thread and self.cleanup_thread.is_alive():
                self.cleanup_thread.join(timeout=5)
            
            # Clear all active alerts
            for alert_id in list(self.active_alerts.keys()):
                self._handle_resolve_alert(
                    {'alert_id': alert_id}, 
                    {'reason': 'System shutdown'}
                )
            
            # Shutdown engines
            if self.visual_engine and hasattr(self.visual_engine, 'shutdown'):
                await self.visual_engine.shutdown()
            
            if self.audio_engine and hasattr(self.audio_engine, 'shutdown'):
                await self.audio_engine.shutdown()
            
            if self.tier2_coordinator and hasattr(self.tier2_coordinator, 'shutdown'):
                await self.tier2_coordinator.shutdown()
            
            # Clear data structures
            self.active_alerts.clear()
            self.active_tasks.clear()
            self.alert_cooldowns.clear()
            
            self.status = "shutdown"
            logger.info(f"✅ Alerting Agent '{self.name}' shutdown complete")
            
        except Exception as e:
            logger.error(f"❌ Alerting Agent shutdown error: {e}")
            self.status = "error"
