"""
APEX AI ENHANCED VISUAL ALERT ENGINE - TIER 2 INTEGRATION (FIXED)
================================================================
Enhanced visual alert system integrated with frontend TIER 2 components
Generates real-time visual alerts and communicates with React frontend via Socket.io

Features:
- Integration with BlinkingBorderOverlay components
- Real-time Socket.io communication
- Professional threat level mapping
- Multi-zone alert coordination
- Performance optimized rendering
- Frontend-compatible data formats
"""

import asyncio
import json
import time
import math
import threading
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
from collections import defaultdict, deque
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class ThreatLevel(Enum):
    """Threat level definitions matching frontend ThreatLevels"""
    SAFE = 'SAFE'
    LOW = 'LOW'
    MEDIUM = 'MEDIUM'
    HIGH = 'HIGH'
    CRITICAL = 'CRITICAL'
    WEAPON = 'WEAPON'

class AlertPattern(Enum):
    """Visual alert pattern types matching frontend animations"""
    SAFE = 'safe'
    LOW_PULSE = 'low_pulse'
    MEDIUM_BLINK = 'medium_blink'
    HIGH_FLASH = 'high_flash'
    CRITICAL_STROBE = 'critical_strobe'
    WEAPON_URGENT = 'weapon_urgent'

class EnhancedVisualAlertEngine:
    """
    Enhanced visual alert engine with frontend integration
    
    Manages visual alerts and communicates with React frontend components
    via Socket.io for real-time threat visualization.
    """
    
    def __init__(self, websocket_client=None, config: Dict[str, Any] = None):
        """
        Initialize the enhanced visual alert engine
        
        Args:
            websocket_client: Socket.io client for frontend communication
            config: Configuration dictionary
        """
        self.websocket_client = websocket_client
        self.config = config or {}
        
        # Alert state management
        self.active_alerts = {}  # zone_id -> alert_data
        self.alert_history = deque(maxlen=1000)
        self.frame_count = 0
        
        # Frontend-compatible threat level mapping
        self.threat_level_mapping = {
            ThreatLevel.SAFE: {
                'color': '#00FF88',
                'intensity': 0.6,
                'pattern': AlertPattern.SAFE,
                'priority': 1,
                'audio_volume': 0.3,
                'timeout': 5000
            },
            ThreatLevel.LOW: {
                'color': '#FFD700',
                'intensity': 0.7,
                'pattern': AlertPattern.LOW_PULSE,
                'priority': 2,
                'audio_volume': 0.5,
                'timeout': 10000
            },
            ThreatLevel.MEDIUM: {
                'color': '#FF8C00',
                'intensity': 0.8,
                'pattern': AlertPattern.MEDIUM_BLINK,
                'priority': 4,
                'audio_volume': 0.7,
                'timeout': 15000
            },
            ThreatLevel.HIGH: {
                'color': '#FF4444',
                'intensity': 0.9,
                'pattern': AlertPattern.HIGH_FLASH,
                'priority': 8,
                'audio_volume': 0.85,
                'timeout': 30000
            },
            ThreatLevel.CRITICAL: {
                'color': '#FF0033',
                'intensity': 1.0,
                'pattern': AlertPattern.CRITICAL_STROBE,
                'priority': 16,
                'audio_volume': 0.95,
                'timeout': 60000
            },
            ThreatLevel.WEAPON: {
                'color': '#8B0000',
                'intensity': 1.2,
                'pattern': AlertPattern.WEAPON_URGENT,
                'priority': 32,
                'audio_volume': 1.0,
                'timeout': 120000
            }
        }
        
        # Zone and monitor management
        self.registered_zones = {}  # zone_id -> zone_config
        self.monitor_zones = defaultdict(list)  # monitor_id -> [zone_ids]
        
        # Performance tracking
        self.stats = {
            'alerts_triggered': 0,
            'alerts_cleared': 0,
            'active_alert_count': 0,
            'peak_alert_count': 0,
            'average_response_time': 0.0,
            'frontend_messages_sent': 0
        }
        
        # Thread safety
        self._lock = threading.Lock()
        
        logger.info('🎨 Enhanced Visual Alert Engine initialized with frontend integration')
    
    def register_zone(self, zone_id: str, monitor_id: str, 
                     position: Dict[str, int], zone_config: Dict[str, Any] = None):
        """
        Register a monitoring zone for visual alerts
        
        Args:
            zone_id: Unique zone identifier (e.g., 'CAM-01')
            monitor_id: Monitor identifier
            position: Zone position {x, y, width, height}
            zone_config: Additional zone configuration
        """
        with self._lock:
            self.registered_zones[zone_id] = {
                'zone_id': zone_id,
                'monitor_id': monitor_id,
                'position': position,
                'config': zone_config or {},
                'registered_time': datetime.now(),
                'alert_count': 0,
                'last_alert_time': None
            }
            
            self.monitor_zones[monitor_id].append(zone_id)
            
        logger.info(f'📍 Registered zone {zone_id} on monitor {monitor_id} at {position}')
    
    async def trigger_visual_alert(self, zone_id: str, threat_data: Dict[str, Any]) -> str:
        """
        Trigger a visual alert and send to frontend
        
        Args:
            zone_id: Zone where threat was detected
            threat_data: Threat detection information
        
        Returns:
            str: Alert ID
        """
        alert_id = f'alert_{zone_id}_{int(time.time() * 1000)}'
        
        # Extract and validate threat data
        threat_type = threat_data.get('type', 'Unknown Threat')
        threat_level_str = threat_data.get('threat_level', 'MEDIUM')
        confidence = max(0, min(100, threat_data.get('confidence', 75)))
        description = threat_data.get('description', f'{threat_type} detected')
        engines_triggered = threat_data.get('engines_triggered', [])
        
        # Convert threat level string to enum
        try:
            threat_level = ThreatLevel(threat_level_str)
        except ValueError:
            threat_level = ThreatLevel.MEDIUM
            logger.warning(f'⚠️ Invalid threat level {threat_level_str}, defaulting to MEDIUM')
        
        # Get zone configuration
        zone_config = self.registered_zones.get(zone_id, {})
        if not zone_config:
            logger.error(f'❌ Zone {zone_id} not registered, cannot trigger alert')
            return alert_id
        
        # Get threat level properties
        level_config = self.threat_level_mapping.get(threat_level, self.threat_level_mapping[ThreatLevel.MEDIUM])
        
        # Create alert data
        alert_data = {
            'alert_id': alert_id,
            'zone_id': zone_id,
            'threat_type': threat_type,
            'threat_level': threat_level.value,
            'confidence': confidence,
            'description': description,
            'engines_triggered': engines_triggered,
            'timestamp': datetime.now().isoformat(),
            'position': zone_config['position'],
            'monitor_id': zone_config['monitor_id'],
            'level_config': level_config,
            'is_active': True,
            'created_at': time.time()
        }
        
        with self._lock:
            # Check if zone already has an active alert
            existing_alert = self.active_alerts.get(zone_id)
            if existing_alert:
                # Escalate if higher priority
                existing_priority = self.threat_level_mapping[ThreatLevel(existing_alert['threat_level'])]['priority']
                new_priority = level_config['priority']
                
                if new_priority > existing_priority:
                    logger.warning(f'🔥 ESCALATING alert in {zone_id}: {threat_level.value}')
                    self.active_alerts[zone_id] = alert_data
                else:
                    # Update existing alert confidence
                    existing_alert['confidence'] = max(existing_alert['confidence'], confidence)
                    existing_alert['description'] = description
                    alert_data = existing_alert
            else:
                # New alert
                self.active_alerts[zone_id] = alert_data
                logger.warning(f'🚨 NEW visual alert: {threat_type} in {zone_id} ({threat_level.value})')
            
            # Update statistics
            self.stats['alerts_triggered'] += 1
            self.stats['active_alert_count'] = len(self.active_alerts)
            self.stats['peak_alert_count'] = max(self.stats['peak_alert_count'], len(self.active_alerts))
            
            # Update zone statistics
            if zone_id in self.registered_zones:
                self.registered_zones[zone_id]['alert_count'] += 1
                self.registered_zones[zone_id]['last_alert_time'] = datetime.now()
        
        # Send to frontend via Socket.io
        await self._send_visual_alert_to_frontend(alert_data)
        
        # Schedule automatic cleanup
        timeout = level_config['timeout']
        asyncio.create_task(self._schedule_alert_cleanup(alert_id, zone_id, timeout))
        
        return alert_id
    
    async def _send_visual_alert_to_frontend(self, alert_data: Dict[str, Any]):
        """
        Send visual alert data to frontend components
        
        Args:
            alert_data: Alert data to send
        """
        if not self.websocket_client:
            logger.warning('⚠️ No websocket client available for frontend communication')
            return
        
        # Format data for frontend BlinkingBorderOverlay component
        frontend_alert = {
            'alert_id': alert_data['alert_id'],
            'zone_id': alert_data['zone_id'],
            'threat_type': alert_data['threat_type'],
            'threat_level': alert_data['threat_level'],
            'confidence': alert_data['confidence'],
            'position': alert_data['position'],
            'timestamp': alert_data['timestamp'],
            'custom_label': alert_data.get('description'),
            'monitor_id': alert_data.get('monitor_id', 0),
            'overlay_data': {
                'color': alert_data['level_config']['color'],
                'intensity': alert_data['level_config']['intensity'],
                'pattern': alert_data['level_config']['pattern'].value
            }
        }
        
        try:
            # Send visual alert event
            await self.websocket_client.send_message('visual_alert', frontend_alert)
            
            # Also send as general threat alert for AlertManager
            threat_alert = {
                'alert_type': 'visual',
                'threat_level': alert_data['threat_level'],
                'zone_id': alert_data['zone_id'],
                'camera_id': alert_data['zone_id'],
                'description': alert_data['description'],
                'confidence': alert_data['confidence'],
                'engines_triggered': alert_data['engines_triggered'],
                'timestamp': alert_data['timestamp']
            }
            
            await self.websocket_client.send_message('threat_alert', threat_alert)
            
            self.stats['frontend_messages_sent'] += 1
            
            logger.info(f'📤 Visual alert sent to frontend: {alert_data["zone_id"]} - {alert_data["threat_level"]}')
            
        except Exception as e:
            logger.error(f'❌ Failed to send visual alert to frontend: {e}')
    
    async def clear_visual_alert(self, zone_id: str) -> bool:
        """
        Clear a visual alert for a specific zone
        
        Args:
            zone_id: Zone to clear alert for
        
        Returns:
            bool: True if alert was cleared
        """
        with self._lock:
            if zone_id in self.active_alerts:
                alert_data = self.active_alerts[zone_id]
                alert_data['is_active'] = False
                alert_data['cleared_at'] = time.time()
                
                del self.active_alerts[zone_id]
                
                self.stats['alerts_cleared'] += 1
                self.stats['active_alert_count'] = len(self.active_alerts)
                
                logger.info(f'✅ Cleared visual alert for zone {zone_id}')
                
                # Send clear message to frontend
                if self.websocket_client:
                    asyncio.create_task(self._send_clear_alert_to_frontend(zone_id))
                
                return True
        
        return False
    
    async def _send_clear_alert_to_frontend(self, zone_id: str):
        """
        Send alert clear message to frontend
        
        Args:
            zone_id: Zone to clear
        """
        try:
            await self.websocket_client.send_message('clear_visual_alerts', {
                'zoneId': zone_id,
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f'📤 Clear alert sent to frontend for zone {zone_id}')
            
        except Exception as e:
            logger.error(f'❌ Failed to send clear alert to frontend: {e}')
    
    async def clear_all_visual_alerts(self):
        """
        Clear all active visual alerts
        """
        cleared_zones = []
        
        with self._lock:
            for zone_id in list(self.active_alerts.keys()):
                self.active_alerts[zone_id]['is_active'] = False
                self.active_alerts[zone_id]['cleared_at'] = time.time()
                cleared_zones.append(zone_id)
            
            self.active_alerts.clear()
            self.stats['alerts_cleared'] += len(cleared_zones)
            self.stats['active_alert_count'] = 0
        
        # Send clear all message to frontend
        if self.websocket_client and cleared_zones:
            try:
                await self.websocket_client.send_message('clear_visual_alerts', {
                    'timestamp': datetime.now().isoformat()
                })
                
                logger.info(f'🧹 Cleared all visual alerts ({len(cleared_zones)} alerts)')
                
            except Exception as e:
                logger.error(f'❌ Failed to send clear all alerts to frontend: {e}')
    
    async def _schedule_alert_cleanup(self, alert_id: str, zone_id: str, timeout_ms: int):
        """
        Schedule automatic alert cleanup after timeout
        
        Args:
            alert_id: Alert ID
            zone_id: Zone ID
            timeout_ms: Timeout in milliseconds
        """
        await asyncio.sleep(timeout_ms / 1000)
        
        # Check if alert is still active
        with self._lock:
            if zone_id in self.active_alerts and self.active_alerts[zone_id]['alert_id'] == alert_id:
                await self.clear_visual_alert(zone_id)
                logger.info(f'⏰ Auto-cleared expired alert {alert_id} for zone {zone_id}')
    
    def get_active_alerts(self, monitor_id: str = None) -> List[Dict[str, Any]]:
        """
        Get currently active visual alerts
        
        Args:
            monitor_id: Filter by monitor ID (optional)
        
        Returns:
            List of active alert data
        """
        with self._lock:
            alerts = []
            
            for alert_data in self.active_alerts.values():
                if monitor_id and alert_data.get('monitor_id') != monitor_id:
                    continue
                
                alerts.append(alert_data.copy())
            
            return alerts
    
    def get_visual_alert_stats(self) -> Dict[str, Any]:
        """
        Get visual alert engine statistics
        
        Returns:
            Statistics dictionary
        """
        with self._lock:
            stats = self.stats.copy()
            
            # Add current state information
            stats.update({
                'registered_zones': len(self.registered_zones),
                'monitored_displays': len(self.monitor_zones),
                'active_alerts_by_level': self._get_alerts_by_level(),
                'zone_statistics': self._get_zone_statistics(),
                'uptime_seconds': time.time() - getattr(self, '_start_time', time.time())
            })
            
            return stats
    
    def _get_alerts_by_level(self) -> Dict[str, int]:
        """
        Get count of active alerts by threat level
        
        Returns:
            Dictionary with threat level counts
        """
        level_counts = {level.value: 0 for level in ThreatLevel}
        
        for alert_data in self.active_alerts.values():
            threat_level = alert_data['threat_level']
            if threat_level in level_counts:
                level_counts[threat_level] += 1
        
        return level_counts
    
    def _get_zone_statistics(self) -> Dict[str, Any]:
        """
        Get statistics for each registered zone
        
        Returns:
            Zone statistics dictionary
        """
        zone_stats = {}
        
        for zone_id, zone_config in self.registered_zones.items():
            zone_stats[zone_id] = {
                'alert_count': zone_config['alert_count'],
                'last_alert_time': zone_config['last_alert_time'].isoformat() if zone_config['last_alert_time'] else None,
                'is_active': zone_id in self.active_alerts,
                'monitor_id': zone_config['monitor_id']
            }
        
        return zone_stats
    
    async def send_visual_stats_to_frontend(self):
        """
        Send current visual alert statistics to frontend
        """
        if not self.websocket_client:
            return
        
        try:
            stats = self.get_visual_alert_stats()
            
            await self.websocket_client.send_message('visual_stats', {
                'timestamp': datetime.now().isoformat(),
                'statistics': stats,
                'active_alerts': self.get_active_alerts()
            })
            
            logger.debug('📊 Visual stats sent to frontend')
            
        except Exception as e:
            logger.error(f'❌ Failed to send visual stats to frontend: {e}')
    
    def update_zone_position(self, zone_id: str, new_position: Dict[str, int]):
        """
        Update the position of a registered zone
        
        Args:
            zone_id: Zone to update
            new_position: New position {x, y, width, height}
        """
        with self._lock:
            if zone_id in self.registered_zones:
                self.registered_zones[zone_id]['position'] = new_position
                logger.info(f'📍 Updated position for zone {zone_id}: {new_position}')
            else:
                logger.warning(f'⚠️ Cannot update position for unregistered zone {zone_id}')
    
    def set_websocket_client(self, websocket_client):
        """
        Set or update the websocket client for frontend communication
        
        Args:
            websocket_client: Socket.io client instance
        """
        self.websocket_client = websocket_client
        logger.info('🔌 WebSocket client updated for visual alert engine')
    
    def cleanup_expired_alerts(self, max_age_seconds: int = 300):
        """
        Clean up alerts that have been active for too long
        
        Args:
            max_age_seconds: Maximum age for alerts in seconds (default: 5 minutes)
        """
        current_time = time.time()
        expired_zones = []
        
        with self._lock:
            for zone_id, alert_data in self.active_alerts.items():
                if current_time - alert_data['created_at'] > max_age_seconds:
                    expired_zones.append(zone_id)
        
        # Clear expired alerts
        for zone_id in expired_zones:
            asyncio.create_task(self.clear_visual_alert(zone_id))
        
        if expired_zones:
            logger.info(f'🧹 Cleaned up {len(expired_zones)} expired visual alerts')
    
    def __del__(self):
        """Cleanup when engine is destroyed"""
        try:
            asyncio.create_task(self.clear_all_visual_alerts())
        except:
            pass
