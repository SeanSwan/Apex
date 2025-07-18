"""
APEX AI MCP ALERTING TOOL
=========================
MCP Tool for triggering visual and audio alerts in the Electron frontend

This tool provides:
- Real-time alert generation and dispatch
- Visual alert coordination (blinking borders, color-coded indicators)
- Audio alert management (tones, voice announcements)
- Integration with dispatch systems
- Alert prioritization and escalation
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import uuid

logger = logging.getLogger(__name__)

class AlertingTool:
    """
    MCP Tool for comprehensive alerting and notification management
    
    Capabilities:
    - Multi-channel alert dispatch (visual, audio, mobile)
    - Alert prioritization and escalation
    - Real-time notification to Electron frontend
    - Integration with guard dispatch systems
    - Alert lifecycle management
    """
    
    def __init__(self, config: Dict = None):
        self.name = "alerting"
        self.description = "Comprehensive alerting system for security notifications and dispatch"
        self.enabled = True
        self.config = config or self.get_default_config()
        
        # Alert management
        self.active_alerts = {}
        self.alert_queue = asyncio.Queue()
        self.notification_clients = set()
        self.is_initialized = False
        self.last_used = None
        
        # Alert configurations
        self.alert_types = self.load_alert_configurations()
        self.color_schemes = self.load_color_schemes()
        self.audio_profiles = self.load_audio_profiles()
        
        # Performance tracking
        self.stats = {
            'total_alerts': 0,
            'alerts_by_priority': {'low': 0, 'medium': 0, 'high': 0, 'critical': 0},
            'avg_response_time': 0,
            'active_alert_count': 0,
            'escalation_count': 0,
            'success_rate': 0,
            'last_reset': time.time()
        }
        
        logger.info("🚨 Alerting Tool initialized")

    def get_default_config(self) -> Dict:
        """Default configuration for alerting system"""
        return {
            'max_concurrent_alerts': 50,
            'alert_timeout': 300,  # 5 minutes
            'auto_escalation_time': 120,  # 2 minutes
            'enable_audio_alerts': True,
            'enable_visual_alerts': True,
            'enable_mobile_notifications': True,
            'alert_persistence': True,
            'notification_rate_limit': 10  # per minute
        }

    def load_alert_configurations(self) -> Dict:
        """Load alert type configurations"""
        return {
            'security_breach': {
                'priority': 'critical',
                'auto_escalate': True,
                'escalation_time': 60,
                'requires_response': True,
                'visual_style': 'urgent_red',
                'audio_profile': 'critical_alert',
                'dispatch_required': True
            },
            'weapon_detected': {
                'priority': 'critical',
                'auto_escalate': False,  # Already max priority
                'escalation_time': 0,
                'requires_response': True,
                'visual_style': 'emergency_red',
                'audio_profile': 'emergency_alert',
                'dispatch_required': True,
                'law_enforcement': True
            },
            'unauthorized_person': {
                'priority': 'high',
                'auto_escalate': True,
                'escalation_time': 120,
                'requires_response': True,
                'visual_style': 'warning_orange',
                'audio_profile': 'security_alert',
                'dispatch_required': True
            },
            'loitering_detected': {
                'priority': 'medium',
                'auto_escalate': True,
                'escalation_time': 300,
                'requires_response': False,
                'visual_style': 'caution_yellow',
                'audio_profile': 'information_tone',
                'dispatch_required': False
            },
            'zone_breach': {
                'priority': 'high',
                'auto_escalate': True,
                'escalation_time': 90,
                'requires_response': True,
                'visual_style': 'alert_red',
                'audio_profile': 'warning_alert',
                'dispatch_required': True
            },
            'suspicious_behavior': {
                'priority': 'medium',
                'auto_escalate': True,
                'escalation_time': 180,
                'requires_response': False,
                'visual_style': 'attention_blue',
                'audio_profile': 'notification_tone',
                'dispatch_required': False
            },
            'equipment_malfunction': {
                'priority': 'low',
                'auto_escalate': False,
                'escalation_time': 0,
                'requires_response': False,
                'visual_style': 'info_blue',
                'audio_profile': 'system_notification',
                'dispatch_required': False
            },
            'face_recognition_match': {
                'priority': 'medium',
                'auto_escalate': False,
                'escalation_time': 0,
                'requires_response': False,
                'visual_style': 'info_green',
                'audio_profile': 'soft_notification',
                'dispatch_required': False
            },
            'unknown_face_detected': {
                'priority': 'medium',
                'auto_escalate': True,
                'escalation_time': 240,
                'requires_response': False,
                'visual_style': 'caution_yellow',
                'audio_profile': 'information_tone',
                'dispatch_required': False
            }
        }

    def load_color_schemes(self) -> Dict:
        """Load visual alert color schemes"""
        return {
            'emergency_red': {
                'border_color': '#FF0000',
                'background_color': '#FF000030',
                'text_color': '#FFFFFF',
                'blink_rate': 'fast',
                'intensity': 'high'
            },
            'urgent_red': {
                'border_color': '#CC0000',
                'background_color': '#CC000020',
                'text_color': '#FFFFFF',
                'blink_rate': 'medium',
                'intensity': 'high'
            },
            'alert_red': {
                'border_color': '#AA0000',
                'background_color': '#AA000015',
                'text_color': '#FFFFFF',
                'blink_rate': 'medium',
                'intensity': 'medium'
            },
            'warning_orange': {
                'border_color': '#FF6600',
                'background_color': '#FF660020',
                'text_color': '#FFFFFF',
                'blink_rate': 'medium',
                'intensity': 'medium'
            },
            'caution_yellow': {
                'border_color': '#FFAA00',
                'background_color': '#FFAA0015',
                'text_color': '#000000',
                'blink_rate': 'slow',
                'intensity': 'low'
            },
            'attention_blue': {
                'border_color': '#0066CC',
                'background_color': '#0066CC15',
                'text_color': '#FFFFFF',
                'blink_rate': 'slow',
                'intensity': 'low'
            },
            'info_blue': {
                'border_color': '#0099FF',
                'background_color': '#0099FF10',
                'text_color': '#000000',
                'blink_rate': 'none',
                'intensity': 'low'
            },
            'info_green': {
                'border_color': '#00AA00',
                'background_color': '#00AA0010',
                'text_color': '#000000',
                'blink_rate': 'none',
                'intensity': 'low'
            }
        }

    def load_audio_profiles(self) -> Dict:
        """Load audio alert profiles"""
        return {
            'emergency_alert': {
                'tone_pattern': 'rapid_beep',
                'frequency': 1000,
                'duration': 2.0,
                'repeat_interval': 0.5,
                'volume': 1.0,
                'voice_announcement': True
            },
            'critical_alert': {
                'tone_pattern': 'urgent_siren',
                'frequency': 800,
                'duration': 1.5,
                'repeat_interval': 0.8,
                'volume': 0.9,
                'voice_announcement': True
            },
            'security_alert': {
                'tone_pattern': 'warning_tone',
                'frequency': 600,
                'duration': 1.0,
                'repeat_interval': 1.0,
                'volume': 0.8,
                'voice_announcement': True
            },
            'warning_alert': {
                'tone_pattern': 'attention_beep',
                'frequency': 500,
                'duration': 0.8,
                'repeat_interval': 1.2,
                'volume': 0.7,
                'voice_announcement': False
            },
            'information_tone': {
                'tone_pattern': 'gentle_chime',
                'frequency': 400,
                'duration': 0.5,
                'repeat_interval': 2.0,
                'volume': 0.6,
                'voice_announcement': False
            },
            'notification_tone': {
                'tone_pattern': 'soft_beep',
                'frequency': 350,
                'duration': 0.3,
                'repeat_interval': 3.0,
                'volume': 0.5,
                'voice_announcement': False
            },
            'soft_notification': {
                'tone_pattern': 'gentle_tone',
                'frequency': 300,
                'duration': 0.2,
                'repeat_interval': 5.0,
                'volume': 0.4,
                'voice_announcement': False
            },
            'system_notification': {
                'tone_pattern': 'system_beep',
                'frequency': 250,
                'duration': 0.1,
                'repeat_interval': 10.0,
                'volume': 0.3,
                'voice_announcement': False
            }
        }

    async def initialize(self):
        """Initialize the alerting tool"""
        try:
            logger.info("🔄 Initializing alerting system...")
            
            # Start alert processing task
            asyncio.create_task(self.process_alert_queue())
            
            # Start alert lifecycle management
            asyncio.create_task(self.manage_alert_lifecycle())
            
            self.is_initialized = True
            logger.info("✅ Alerting Tool initialization complete")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize alerting tool: {e}")
            self.is_initialized = False
            raise

    async def execute(self, payload: Dict) -> Dict:
        """
        Execute alert generation and dispatch
        
        Payload format:
        {
            "alert_type": "unauthorized_person",
            "camera_id": "camera_001",
            "location": "lobby",
            "severity": "high",
            "detection_details": {
                "confidence": 0.87,
                "detection_type": "person",
                "bounding_box": {...}
            },
            "custom_message": "Unauthorized person detected in lobby",
            "options": {
                "auto_dispatch": true,
                "voice_announcement": true,
                "escalation_enabled": true
            }
        }
        """
        start_time = time.time()
        
        try:
            if not self.is_initialized:
                raise Exception("Alerting Tool not initialized")
            
            # Extract payload data
            alert_type = payload.get('alert_type', 'security_breach')
            camera_id = payload.get('camera_id', 'unknown')
            location = payload.get('location', 'unknown')
            severity = payload.get('severity', 'medium')
            detection_details = payload.get('detection_details', {})
            custom_message = payload.get('custom_message', '')
            options = payload.get('options', {})
            
            # Get alert configuration
            alert_config = self.alert_types.get(alert_type, self.alert_types['security_breach'])
            
            # Override priority if specified
            priority = severity if severity in ['low', 'medium', 'high', 'critical'] else alert_config['priority']
            
            # Create alert
            alert = await self.create_alert(
                alert_type, camera_id, location, priority, 
                detection_details, custom_message, options, alert_config
            )
            
            # Dispatch alert
            dispatch_result = await self.dispatch_alert(alert)
            
            # Update statistics
            execution_time = time.time() - start_time
            self.update_stats(execution_time, priority)
            
            # Prepare response
            result = {
                'alert_id': alert['alert_id'],
                'alert_type': alert_type,
                'priority': priority,
                'camera_id': camera_id,
                'location': location,
                'dispatch_result': dispatch_result,
                'visual_alert_active': dispatch_result.get('visual_alert_sent', False),
                'audio_alert_active': dispatch_result.get('audio_alert_sent', False),
                'guard_dispatched': dispatch_result.get('guard_dispatched', False),
                'execution_time': execution_time,
                'timestamp': alert['timestamp'],
                'success': True
            }
            
            logger.info(f"🚨 Alert generated: {alert['alert_id']} ({priority}) - {location}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Alert execution error: {e}")
            return {
                'success': False,
                'error': str(e),
                'execution_time': time.time() - start_time,
                'timestamp': datetime.now().isoformat()
            }

    async def create_alert(self, alert_type: str, camera_id: str, location: str, priority: str,
                          detection_details: Dict, custom_message: str, options: Dict, alert_config: Dict) -> Dict:
        """Create a new alert with full context"""
        alert_id = str(uuid.uuid4())[:8]  # Short unique ID
        
        alert = {
            'alert_id': alert_id,
            'alert_type': alert_type,
            'camera_id': camera_id,
            'location': location,
            'priority': priority,
            'status': 'active',
            'detection_details': detection_details,
            'custom_message': custom_message,
            'options': options,
            'config': alert_config,
            'timestamp': datetime.now().isoformat(),
            'created_at': time.time(),
            'last_updated': time.time(),
            'escalation_level': 0,
            'response_required': alert_config.get('requires_response', False),
            'acknowledged': False,
            'resolved': False
        }
        
        # Store in active alerts
        self.active_alerts[alert_id] = alert
        
        return alert

    async def dispatch_alert(self, alert: Dict) -> Dict:
        """Dispatch alert through all configured channels"""
        dispatch_result = {
            'visual_alert_sent': False,
            'audio_alert_sent': False,
            'mobile_notification_sent': False,
            'guard_dispatched': False,
            'law_enforcement_contacted': False
        }
        
        try:
            alert_config = alert['config']
            
            # Visual alerts
            if self.config.get('enable_visual_alerts', True):
                visual_result = await self.send_visual_alert(alert)
                dispatch_result['visual_alert_sent'] = visual_result
            
            # Audio alerts
            if self.config.get('enable_audio_alerts', True):
                audio_result = await self.send_audio_alert(alert)
                dispatch_result['audio_alert_sent'] = audio_result
            
            # Mobile notifications
            if self.config.get('enable_mobile_notifications', True):
                mobile_result = await self.send_mobile_notification(alert)
                dispatch_result['mobile_notification_sent'] = mobile_result
            
            # Guard dispatch
            if alert_config.get('dispatch_required', False):
                guard_result = await self.dispatch_guard(alert)
                dispatch_result['guard_dispatched'] = guard_result
            
            # Law enforcement (critical alerts only)
            if alert_config.get('law_enforcement', False):
                law_enforcement_result = await self.contact_law_enforcement(alert)
                dispatch_result['law_enforcement_contacted'] = law_enforcement_result
            
            # Schedule auto-escalation if enabled
            if alert_config.get('auto_escalate', False):
                escalation_time = alert_config.get('escalation_time', 120)
                asyncio.create_task(self.schedule_escalation(alert['alert_id'], escalation_time))
            
            return dispatch_result
            
        except Exception as e:
            logger.error(f"❌ Alert dispatch error: {e}")
            return dispatch_result

    async def send_visual_alert(self, alert: Dict) -> bool:
        """Send visual alert to Electron frontend"""
        try:
            alert_config = alert['config']
            visual_style = alert_config.get('visual_style', 'attention_blue')
            color_scheme = self.color_schemes.get(visual_style, self.color_schemes['attention_blue'])
            
            visual_alert = {
                'type': 'visual_alert',
                'alert_id': alert['alert_id'],
                'camera_id': alert['camera_id'],
                'location': alert['location'],
                'priority': alert['priority'],
                'color_scheme': color_scheme,
                'message': alert.get('custom_message', f"{alert['alert_type'].replace('_', ' ').title()} detected"),
                'timestamp': alert['timestamp'],
                'detection_details': alert['detection_details']
            }
            
            # Send to all connected Electron clients
            await self.broadcast_to_clients(visual_alert)
            
            logger.info(f"👁️ Visual alert sent: {alert['alert_id']} - {visual_style}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Visual alert error: {e}")
            return False

    async def send_audio_alert(self, alert: Dict) -> bool:
        """Send audio alert with tones and voice announcements"""
        try:
            alert_config = alert['config']
            audio_profile_name = alert_config.get('audio_profile', 'notification_tone')
            audio_profile = self.audio_profiles.get(audio_profile_name, self.audio_profiles['notification_tone'])
            
            audio_alert = {
                'type': 'audio_alert',
                'alert_id': alert['alert_id'],
                'camera_id': alert['camera_id'],
                'location': alert['location'],
                'priority': alert['priority'],
                'audio_profile': audio_profile,
                'message': alert.get('custom_message', ''),
                'voice_announcement': audio_profile.get('voice_announcement', False),
                'timestamp': alert['timestamp']
            }
            
            # Send to audio system
            await self.broadcast_to_clients(audio_alert)
            
            logger.info(f"🔊 Audio alert sent: {alert['alert_id']} - {audio_profile_name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Audio alert error: {e}")
            return False

    async def send_mobile_notification(self, alert: Dict) -> bool:
        """Send mobile push notification to security guards"""
        try:
            mobile_notification = {
                'type': 'mobile_notification',
                'alert_id': alert['alert_id'],
                'title': f"Security Alert - {alert['priority'].upper()}",
                'body': f"{alert['alert_type'].replace('_', ' ').title()} at {alert['location']}",
                'priority': alert['priority'],
                'camera_id': alert['camera_id'],
                'location': alert['location'],
                'timestamp': alert['timestamp'],
                'requires_response': alert.get('response_required', False)
            }
            
            # Send to mobile notification service
            await self.broadcast_to_clients(mobile_notification)
            
            logger.info(f"📱 Mobile notification sent: {alert['alert_id']}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Mobile notification error: {e}")
            return False

    async def dispatch_guard(self, alert: Dict) -> bool:
        """Dispatch security guard to location"""
        try:
            guard_dispatch = {
                'type': 'guard_dispatch',
                'alert_id': alert['alert_id'],
                'location': alert['location'],
                'priority': alert['priority'],
                'description': alert.get('custom_message', f"{alert['alert_type'].replace('_', ' ').title()} detected"),
                'camera_id': alert['camera_id'],
                'estimated_response_time': self.calculate_response_time(alert['location']),
                'timestamp': alert['timestamp']
            }
            
            # Send to guard dispatch system
            await self.broadcast_to_clients(guard_dispatch)
            
            logger.info(f"👮 Guard dispatched: {alert['alert_id']} to {alert['location']}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Guard dispatch error: {e}")
            return False

    async def contact_law_enforcement(self, alert: Dict) -> bool:
        """Contact law enforcement for critical threats"""
        try:
            law_enforcement_alert = {
                'type': 'law_enforcement_alert',
                'alert_id': alert['alert_id'],
                'alert_type': alert['alert_type'],
                'location': alert['location'],
                'urgency': 'immediate',
                'description': alert.get('custom_message', f"Critical security threat: {alert['alert_type']}"),
                'camera_id': alert['camera_id'],
                'detection_details': alert['detection_details'],
                'timestamp': alert['timestamp']
            }
            
            # In production, this would integrate with emergency services API
            await self.broadcast_to_clients(law_enforcement_alert)
            
            logger.warning(f"🚔 Law enforcement alert: {alert['alert_id']} - {alert['alert_type']}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Law enforcement alert error: {e}")
            return False

    def calculate_response_time(self, location: str) -> int:
        """Calculate estimated guard response time in seconds"""
        # Simple location-based response time calculation
        response_times = {
            'lobby': 60,
            'elevator': 90,
            'parking': 120,
            'stairwell': 90,
            'roof': 180,
            'basement': 150
        }
        
        return response_times.get(location.lower(), 120)  # Default 2 minutes

    async def schedule_escalation(self, alert_id: str, escalation_time: int):
        """Schedule automatic alert escalation"""
        try:
            await asyncio.sleep(escalation_time)
            
            if alert_id in self.active_alerts:
                alert = self.active_alerts[alert_id]
                
                # Check if alert still needs escalation
                if not alert.get('acknowledged', False) and not alert.get('resolved', False):
                    await self.escalate_alert(alert_id)
                    
        except Exception as e:
            logger.error(f"❌ Alert escalation error: {e}")

    async def escalate_alert(self, alert_id: str) -> bool:
        """Escalate an existing alert"""
        try:
            if alert_id not in self.active_alerts:
                logger.warning(f"⚠️ Cannot escalate non-existent alert: {alert_id}")
                return False
            
            alert = self.active_alerts[alert_id]
            alert['escalation_level'] += 1
            alert['last_updated'] = time.time()
            
            # Increase priority if possible
            priority_levels = ['low', 'medium', 'high', 'critical']
            current_index = priority_levels.index(alert['priority'])
            if current_index < len(priority_levels) - 1:
                alert['priority'] = priority_levels[current_index + 1]
            
            # Re-dispatch with higher priority
            escalation_dispatch = await self.dispatch_alert(alert)
            
            self.stats['escalation_count'] += 1
            
            logger.warning(f"⬆️ Alert escalated: {alert_id} to {alert['priority']}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Alert escalation error: {e}")
            return False

    async def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> bool:
        """Acknowledge an alert"""
        try:
            if alert_id in self.active_alerts:
                alert = self.active_alerts[alert_id]
                alert['acknowledged'] = True
                alert['acknowledged_by'] = acknowledged_by
                alert['acknowledged_at'] = time.time()
                alert['last_updated'] = time.time()
                
                logger.info(f"✅ Alert acknowledged: {alert_id} by {acknowledged_by}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Alert acknowledgment error: {e}")
            return False

    async def resolve_alert(self, alert_id: str, resolved_by: str, resolution_notes: str = '') -> bool:
        """Resolve an alert"""
        try:
            if alert_id in self.active_alerts:
                alert = self.active_alerts[alert_id]
                alert['resolved'] = True
                alert['resolved_by'] = resolved_by
                alert['resolved_at'] = time.time()
                alert['resolution_notes'] = resolution_notes
                alert['status'] = 'resolved'
                alert['last_updated'] = time.time()
                
                logger.info(f"✅ Alert resolved: {alert_id} by {resolved_by}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Alert resolution error: {e}")
            return False

    async def process_alert_queue(self):
        """Process queued alerts"""
        while True:
            try:
                # This could be used for rate limiting or batch processing
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"❌ Alert queue processing error: {e}")

    async def manage_alert_lifecycle(self):
        """Manage alert lifecycle and cleanup"""
        while True:
            try:
                current_time = time.time()
                alert_timeout = self.config.get('alert_timeout', 300)
                
                # Clean up old alerts
                expired_alerts = []
                for alert_id, alert in self.active_alerts.items():
                    if current_time - alert['created_at'] > alert_timeout:
                        if alert.get('resolved', False) or not alert.get('response_required', False):
                            expired_alerts.append(alert_id)
                
                # Remove expired alerts
                for alert_id in expired_alerts:
                    del self.active_alerts[alert_id]
                    logger.info(f"🗑️ Expired alert removed: {alert_id}")
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"❌ Alert lifecycle management error: {e}")
                await asyncio.sleep(60)

    async def broadcast_to_clients(self, message: Dict):
        """Broadcast message to all connected notification clients"""
        if not self.notification_clients:
            logger.debug("📡 No notification clients connected")
            return
        
        message_json = json.dumps(message)
        disconnected_clients = set()
        
        for client in self.notification_clients:
            try:
                # In a real implementation, this would send via WebSocket
                # For now, we log the broadcast
                logger.debug(f"📡 Broadcasting to client: {message['type']}")
                
            except Exception as e:
                logger.error(f"❌ Broadcast error: {e}")
                disconnected_clients.add(client)
        
        # Remove disconnected clients
        self.notification_clients -= disconnected_clients

    def add_notification_client(self, client_id: str):
        """Add a notification client"""
        self.notification_clients.add(client_id)
        logger.info(f"🔌 Notification client added: {client_id}")

    def remove_notification_client(self, client_id: str):
        """Remove a notification client"""
        self.notification_clients.discard(client_id)
        logger.info(f"🔌 Notification client removed: {client_id}")

    def update_stats(self, execution_time: float, priority: str):
        """Update performance statistics"""
        self.stats['total_alerts'] += 1
        self.stats['alerts_by_priority'][priority] += 1
        self.stats['active_alert_count'] = len(self.active_alerts)
        
        # Update average response time
        if self.stats['total_alerts'] == 1:
            self.stats['avg_response_time'] = execution_time
        else:
            alpha = 0.1  # Exponential moving average factor
            self.stats['avg_response_time'] = (
                alpha * execution_time + 
                (1 - alpha) * self.stats['avg_response_time']
            )
        
        # Update success rate (simplified)
        self.stats['success_rate'] = min(
            (self.stats['total_alerts'] - 1) / self.stats['total_alerts'] + 0.1,
            1.0
        )

    async def shutdown(self):
        """Shutdown the alerting tool"""
        logger.info("🛑 Shutting down Alerting Tool...")
        
        # Clear active alerts
        self.active_alerts.clear()
        
        # Clear notification clients
        self.notification_clients.clear()
        
        self.is_initialized = False
        logger.info("✅ Alerting Tool shutdown complete")

    def get_stats(self) -> Dict:
        """Get current performance statistics"""
        return {
            **self.stats,
            'connected_clients': len(self.notification_clients),
            'uptime': time.time() - self.stats['last_reset'],
            'is_initialized': self.is_initialized,
            'last_used': self.last_used
        }

    def get_active_alerts(self) -> List[Dict]:
        """Get list of active alerts"""
        return list(self.active_alerts.values())

    def get_alert_configurations(self) -> Dict:
        """Get available alert type configurations"""
        return self.alert_types
