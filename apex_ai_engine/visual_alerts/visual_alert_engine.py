"""
APEX AI VISUAL ALERT ENGINE
===========================
Core visual alert system for real-time threat indication
Generates dynamic visual alerts with blinking borders, color coding, and severity-based patterns

Features:
- Dynamic blinking border generation
- Color-coded threat level indicators
- Hardware-accelerated visual effects
- Multi-monitor support with zone mapping
- Customizable alert patterns
- Performance optimized for real-time display

Priority: P1 HIGH - Critical for dispatcher awareness and response times
"""

import cv2
import numpy as np
import threading
import time
import math
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
from collections import defaultdict, deque
from enum import Enum
import logging

# Import threat models for threat level definitions
try:
    from models import ThreatLevel, ThreatType
    THREAT_MODELS_AVAILABLE = True
except ImportError:
    THREAT_MODELS_AVAILABLE = False
    # Fallback threat levels
    class ThreatLevel(Enum):
        LOW = 1
        MEDIUM = 2
        HIGH = 3
        CRITICAL = 4

logger = logging.getLogger(__name__)

class AlertPattern(Enum):
    """Visual alert pattern types"""
    SOLID = "solid"
    SLOW_BLINK = "slow_blink"
    FAST_BLINK = "fast_blink"
    PULSE = "pulse"
    STROBE = "strobe"
    GRADIENT_PULSE = "gradient_pulse"

class VisualAlertEngine:
    """
    Core visual alert engine for generating real-time threat visual indicators
    
    Manages dynamic visual alerts including blinking borders, color coding,
    and threat-specific patterns for dispatcher awareness.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the visual alert engine
        
        Args:
            config: Configuration dictionary for visual alert settings
        """
        self.config = config or {}
        
        # Alert state management
        self.active_alerts = {}  # zone_id -> alert_data
        self.alert_history = deque(maxlen=1000)
        self.frame_count = 0
        
        # Threat level to color mapping (RGB values)
        self.threat_colors = {
            ThreatLevel.CRITICAL: (255, 0, 0),      # Bright Red
            ThreatLevel.HIGH: (255, 165, 0),        # Orange  
            ThreatLevel.MEDIUM: (255, 255, 0),      # Yellow
            ThreatLevel.LOW: (0, 255, 255),         # Cyan
            'default': (128, 128, 128)              # Gray
        }
        
        # Threat level to pattern mapping
        self.threat_patterns = {
            ThreatLevel.CRITICAL: AlertPattern.STROBE,      # Urgent strobe
            ThreatLevel.HIGH: AlertPattern.FAST_BLINK,      # Fast blinking
            ThreatLevel.MEDIUM: AlertPattern.SLOW_BLINK,    # Slow blinking
            ThreatLevel.LOW: AlertPattern.PULSE,            # Gentle pulse
            'default': AlertPattern.SOLID                   # Solid border
        }
        
        # Pattern timing configurations (in frames)
        self.pattern_configs = {
            AlertPattern.SOLID: {'duration': float('inf'), 'intensity': 1.0},
            AlertPattern.SLOW_BLINK: {'period': 60, 'on_frames': 30},      # 2 second cycle
            AlertPattern.FAST_BLINK: {'period': 20, 'on_frames': 10},      # 0.67 second cycle
            AlertPattern.PULSE: {'period': 90, 'min_intensity': 0.3},      # 3 second pulse
            AlertPattern.STROBE: {'period': 6, 'on_frames': 2},            # 0.2 second strobe
            AlertPattern.GRADIENT_PULSE: {'period': 120, 'min_intensity': 0.1}  # 4 second gradient
        }
        
        # Visual alert settings
        self.border_thickness = self.config.get('border_thickness', 8)
        self.max_opacity = self.config.get('max_opacity', 0.8)
        self.min_opacity = self.config.get('min_opacity', 0.2)
        
        # Monitor/zone mapping
        self.zone_monitors = {}  # zone_id -> monitor_info
        self.monitor_zones = defaultdict(list)  # monitor_id -> [zone_ids]
        
        # Performance tracking
        self.render_stats = {
            'frames_rendered': 0,
            'average_render_time': 0.0,
            'active_alert_count': 0,
            'peak_alert_count': 0
        }
        
        # Thread safety
        self._lock = threading.Lock()
        
        logger.info("🎨 Visual Alert Engine initialized")
    
    def register_zone(self, zone_id: str, monitor_id: str, region: Tuple[int, int, int, int],
                     sensitivity_multiplier: float = 1.0):
        """
        Register a monitoring zone with its display region
        
        Args:
            zone_id: Unique identifier for the zone
            monitor_id: Monitor/screen identifier
            region: Screen region (x, y, width, height)
            sensitivity_multiplier: Alert sensitivity multiplier for this zone
        """
        with self._lock:
            self.zone_monitors[zone_id] = {
                'monitor_id': monitor_id,
                'region': region,
                'sensitivity_multiplier': sensitivity_multiplier,
                'registered_time': datetime.now()
            }
            
            self.monitor_zones[monitor_id].append(zone_id)
            
        logger.info(f"📍 Registered zone '{zone_id}' on monitor '{monitor_id}' at region {region}")
    
    def trigger_alert(self, zone_id: str, threat_data: Dict[str, Any]) -> str:
        """
        Trigger a visual alert for a detected threat
        
        Args:
            zone_id: Zone where threat was detected
            threat_data: Threat detection data
        
        Returns:
            str: Alert ID for tracking
        """
        alert_id = f"alert_{zone_id}_{int(time.time() * 1000)}"
        
        # Extract threat information
        threat_type = threat_data.get('type', 'unknown')
        threat_level = threat_data.get('threat_level', ThreatLevel.MEDIUM)
        confidence = threat_data.get('confidence', 0.5)
        description = threat_data.get('description', 'Threat detected')
        bbox = threat_data.get('bbox', (0, 0, 100, 100))
        
        # Apply zone sensitivity
        zone_info = self.zone_monitors.get(zone_id, {})
        sensitivity = zone_info.get('sensitivity_multiplier', 1.0)
        adjusted_confidence = min(1.0, confidence * sensitivity)
        
        # Determine visual properties based on threat level
        color = self.threat_colors.get(threat_level, self.threat_colors['default'])
        pattern = self.threat_patterns.get(threat_level, self.threat_patterns['default'])
        
        # Create alert data
        alert_data = {
            'alert_id': alert_id,
            'zone_id': zone_id,
            'threat_type': threat_type,
            'threat_level': threat_level,
            'confidence': confidence,
            'adjusted_confidence': adjusted_confidence,
            'description': description,
            'bbox': bbox,
            'color': color,
            'pattern': pattern,
            'start_time': datetime.now(),
            'last_update': datetime.now(),
            'frame_triggered': self.frame_count,
            'duration_frames': 0,
            'is_active': True,
            'zone_info': zone_info
        }
        
        with self._lock:
            # Update or add alert
            existing_alert = self.active_alerts.get(zone_id)
            if existing_alert:
                # If there's already an alert, escalate if this one is higher priority
                if threat_level.value > existing_alert['threat_level'].value:
                    logger.warning(f"🔥 ESCALATING alert in zone {zone_id}: {threat_type} -> {threat_level.name}")
                    self.active_alerts[zone_id] = alert_data
                else:
                    # Update existing alert with new data
                    existing_alert['last_update'] = datetime.now()
                    existing_alert['confidence'] = max(existing_alert['confidence'], confidence)
            else:
                # New alert
                self.active_alerts[zone_id] = alert_data
                logger.warning(f"🚨 NEW visual alert triggered: {threat_type} in zone {zone_id} (level: {threat_level.name})")
            
            # Add to history
            self.alert_history.append(alert_data.copy())
            
            # Update stats
            self.render_stats['active_alert_count'] = len(self.active_alerts)
            self.render_stats['peak_alert_count'] = max(
                self.render_stats['peak_alert_count'], 
                len(self.active_alerts)
            )
        
        return alert_id
    
    def clear_alert(self, zone_id: str) -> bool:
        """
        Clear an active alert for a zone
        
        Args:
            zone_id: Zone to clear alert for
        
        Returns:
            bool: True if alert was cleared
        """
        with self._lock:
            if zone_id in self.active_alerts:
                alert_data = self.active_alerts[zone_id]
                alert_data['is_active'] = False
                alert_data['end_time'] = datetime.now()
                
                del self.active_alerts[zone_id]
                
                self.render_stats['active_alert_count'] = len(self.active_alerts)
                
                logger.info(f"✅ Cleared alert for zone {zone_id}")
                return True
        
        return False
    
    def clear_all_alerts(self):
        """Clear all active alerts"""
        with self._lock:
            cleared_count = len(self.active_alerts)
            
            for alert_data in self.active_alerts.values():
                alert_data['is_active'] = False
                alert_data['end_time'] = datetime.now()
            
            self.active_alerts.clear()
            self.render_stats['active_alert_count'] = 0
            
        logger.info(f"🧹 Cleared all alerts ({cleared_count} alerts)")
    
    def generate_alert_overlay(self, monitor_id: str, base_frame: np.ndarray = None) -> Dict[str, Any]:
        """
        Generate visual alert overlay for a specific monitor
        
        Args:
            monitor_id: Monitor to generate overlay for
            base_frame: Base frame to overlay on (optional)
        
        Returns:
            Dict containing overlay data and rendering instructions
        """
        start_time = time.time()
        
        # Get zones for this monitor
        monitor_zones = self.monitor_zones.get(monitor_id, [])
        if not monitor_zones:
            return {'overlay_frame': None, 'alerts': [], 'render_time': 0}
        
        # Create overlay instructions
        overlay_data = {
            'monitor_id': monitor_id,
            'frame_count': self.frame_count,
            'timestamp': datetime.now(),
            'alerts': [],
            'render_instructions': []
        }
        
        with self._lock:
            # Process alerts for zones on this monitor
            for zone_id in monitor_zones:
                if zone_id in self.active_alerts:
                    alert_data = self.active_alerts[zone_id]
                    
                    # Update alert duration
                    alert_data['duration_frames'] = self.frame_count - alert_data['frame_triggered']
                    
                    # Calculate current visual properties
                    visual_props = self._calculate_visual_properties(alert_data)
                    
                    # Create render instruction
                    render_instruction = {
                        'zone_id': zone_id,
                        'alert_id': alert_data['alert_id'],
                        'region': alert_data['zone_info'].get('region', (0, 0, 100, 100)),
                        'color': visual_props['color'],
                        'opacity': visual_props['opacity'],
                        'thickness': visual_props['thickness'],
                        'pattern': visual_props['pattern'],
                        'is_visible': visual_props['is_visible'],
                        'threat_level': alert_data['threat_level'].name,
                        'threat_type': alert_data['threat_type'],
                        'description': alert_data['description']
                    }
                    
                    overlay_data['alerts'].append(alert_data)
                    overlay_data['render_instructions'].append(render_instruction)
        
        # Generate overlay frame if base frame provided
        if base_frame is not None:
            overlay_frame = self._render_overlay_frame(base_frame, overlay_data['render_instructions'])
            overlay_data['overlay_frame'] = overlay_frame
        
        # Update frame count
        self.frame_count += 1
        
        # Update performance stats
        render_time = time.time() - start_time
        self._update_render_stats(render_time)
        overlay_data['render_time'] = render_time
        
        return overlay_data
    
    def _calculate_visual_properties(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate current visual properties for an alert based on its pattern
        
        Args:
            alert_data: Alert data dictionary
        
        Returns:
            Dict with current visual properties
        """
        pattern = alert_data['pattern']
        duration_frames = alert_data['duration_frames']
        threat_level = alert_data['threat_level']
        confidence = alert_data['adjusted_confidence']
        
        # Base properties
        base_color = alert_data['color']
        base_thickness = int(self.border_thickness * (0.5 + confidence * 0.5))  # Scale by confidence
        
        # Get pattern configuration
        pattern_config = self.pattern_configs.get(pattern, self.pattern_configs[AlertPattern.SOLID])
        
        # Calculate pattern-specific properties
        if pattern == AlertPattern.SOLID:
            opacity = self.max_opacity * confidence
            is_visible = True
            
        elif pattern == AlertPattern.SLOW_BLINK or pattern == AlertPattern.FAST_BLINK:
            period = pattern_config['period']
            on_frames = pattern_config['on_frames']
            
            cycle_position = duration_frames % period
            is_visible = cycle_position < on_frames
            opacity = self.max_opacity * confidence if is_visible else 0
            
        elif pattern == AlertPattern.PULSE:
            period = pattern_config['period']
            min_intensity = pattern_config['min_intensity']
            
            cycle_position = duration_frames % period
            # Smooth sinusoidal pulse
            intensity = min_intensity + (1 - min_intensity) * (1 + math.sin(2 * math.pi * cycle_position / period)) / 2
            opacity = self.max_opacity * confidence * intensity
            is_visible = True
            
        elif pattern == AlertPattern.STROBE:
            period = pattern_config['period']
            on_frames = pattern_config['on_frames']
            
            cycle_position = duration_frames % period
            is_visible = cycle_position < on_frames
            opacity = self.max_opacity * confidence if is_visible else 0
            
        elif pattern == AlertPattern.GRADIENT_PULSE:
            period = pattern_config['period']
            min_intensity = pattern_config['min_intensity']
            
            cycle_position = duration_frames % period
            # Smooth gradient pulse with color shifting
            intensity = min_intensity + (1 - min_intensity) * (1 + math.sin(2 * math.pi * cycle_position / period)) / 2
            
            # Shift color slightly based on intensity for gradient effect
            color_shift = int(30 * intensity)
            gradient_color = (
                min(255, base_color[0] + color_shift),
                max(0, base_color[1] - color_shift // 2),
                max(0, base_color[2] - color_shift // 2)
            )
            base_color = gradient_color
            
            opacity = self.max_opacity * confidence * intensity
            is_visible = True
            
        else:
            # Default solid
            opacity = self.max_opacity * confidence
            is_visible = True
        
        return {
            'color': base_color,
            'opacity': max(0, min(1, opacity)),
            'thickness': base_thickness,
            'pattern': pattern,
            'is_visible': is_visible,
            'cycle_info': {
                'duration_frames': duration_frames,
                'pattern_period': pattern_config.get('period', 0)
            }
        }
    
    def _render_overlay_frame(self, base_frame: np.ndarray, 
                            render_instructions: List[Dict[str, Any]]) -> np.ndarray:
        """
        Render visual alerts onto a base frame
        
        Args:
            base_frame: Base video frame
            render_instructions: List of rendering instructions
        
        Returns:
            Frame with alert overlays rendered
        """
        if not render_instructions:
            return base_frame
        
        # Create overlay on copy of base frame
        overlay_frame = base_frame.copy()
        
        # Render each alert
        for instruction in render_instructions:
            if not instruction['is_visible']:
                continue
            
            # Extract render parameters
            region = instruction['region']
            color = instruction['color']
            opacity = instruction['opacity']
            thickness = instruction['thickness']
            
            # Convert region to coordinates
            x, y, width, height = region
            x1, y1 = x, y
            x2, y2 = x + width, y + height
            
            # Ensure coordinates are within frame bounds
            frame_h, frame_w = overlay_frame.shape[:2]
            x1 = max(0, min(frame_w - 1, x1))
            y1 = max(0, min(frame_h - 1, y1))
            x2 = max(0, min(frame_w, x2))
            y2 = max(0, min(frame_h, y2))
            
            # Draw border rectangle with opacity
            if opacity > 0:
                # Create colored overlay
                overlay = overlay_frame.copy()
                cv2.rectangle(overlay, (x1, y1), (x2, y2), color, thickness)
                
                # Blend with original frame
                cv2.addWeighted(overlay, opacity, overlay_frame, 1 - opacity, 0, overlay_frame)
        
        return overlay_frame
    
    def _update_render_stats(self, render_time: float):
        """Update rendering performance statistics"""
        with self._lock:
            self.render_stats['frames_rendered'] += 1
            
            # Update average render time (rolling average)
            frames_rendered = self.render_stats['frames_rendered']
            current_avg = self.render_stats['average_render_time']
            
            new_avg = ((current_avg * (frames_rendered - 1)) + render_time) / frames_rendered
            self.render_stats['average_render_time'] = new_avg
    
    def get_active_alerts(self, monitor_id: str = None) -> List[Dict[str, Any]]:
        """
        Get currently active alerts
        
        Args:
            monitor_id: Filter by monitor (None for all)
        
        Returns:
            List of active alert data
        """
        with self._lock:
            alerts = []
            
            for zone_id, alert_data in self.active_alerts.items():
                if monitor_id:
                    zone_monitor = alert_data.get('zone_info', {}).get('monitor_id')
                    if zone_monitor != monitor_id:
                        continue
                
                alerts.append(alert_data.copy())
            
            return alerts
    
    def get_alert_statistics(self) -> Dict[str, Any]:
        """
        Get visual alert engine statistics
        
        Returns:
            Dictionary with performance and usage statistics
        """
        with self._lock:
            current_time = datetime.now()
            
            # Calculate alert duration statistics
            total_duration = 0
            active_count = len(self.active_alerts)
            
            for alert_data in self.active_alerts.values():
                duration = (current_time - alert_data['start_time']).total_seconds()
                total_duration += duration
            
            avg_duration = total_duration / active_count if active_count > 0 else 0
            
            stats = {
                'active_alerts': active_count,
                'total_alerts_triggered': len(self.alert_history),
                'registered_zones': len(self.zone_monitors),
                'monitored_displays': len(self.monitor_zones),
                'average_alert_duration': avg_duration,
                'render_statistics': self.render_stats.copy(),
                'frame_count': self.frame_count
            }
            
            return stats
    
    def update_config(self, new_config: Dict[str, Any]):
        """
        Update visual alert engine configuration
        
        Args:
            new_config: New configuration parameters
        """
        with self._lock:
            self.config.update(new_config)
            
            # Update settings
            self.border_thickness = new_config.get('border_thickness', self.border_thickness)
            self.max_opacity = new_config.get('max_opacity', self.max_opacity)
            self.min_opacity = new_config.get('min_opacity', self.min_opacity)
            
            # Update threat colors if provided
            if 'threat_colors' in new_config:
                self.threat_colors.update(new_config['threat_colors'])
            
            # Update threat patterns if provided
            if 'threat_patterns' in new_config:
                self.threat_patterns.update(new_config['threat_patterns'])
        
        logger.info("✅ Visual alert engine configuration updated")
    
    def export_overlay_data_for_frontend(self, monitor_id: str) -> Dict[str, Any]:
        """
        Export overlay data in format suitable for frontend rendering
        
        Args:
            monitor_id: Monitor to export data for
        
        Returns:
            Frontend-compatible overlay data
        """
        overlay_data = self.generate_alert_overlay(monitor_id)
        
        # Convert to frontend format
        frontend_data = {
            'monitor_id': monitor_id,
            'timestamp': overlay_data['timestamp'].isoformat(),
            'frame_count': overlay_data['frame_count'],
            'alerts': []
        }
        
        for instruction in overlay_data.get('render_instructions', []):
            frontend_alert = {
                'zoneId': instruction['zone_id'],
                'alertId': instruction['alert_id'],
                'region': {
                    'x': instruction['region'][0],
                    'y': instruction['region'][1], 
                    'width': instruction['region'][2],
                    'height': instruction['region'][3]
                },
                'style': {
                    'borderColor': f"rgb({instruction['color'][0]}, {instruction['color'][1]}, {instruction['color'][2]})",
                    'borderWidth': f"{instruction['thickness']}px",
                    'opacity': instruction['opacity'],
                    'visibility': 'visible' if instruction['is_visible'] else 'hidden'
                },
                'threatLevel': instruction['threat_level'],
                'threatType': instruction['threat_type'],
                'description': instruction['description']
            }
            
            frontend_data['alerts'].append(frontend_alert)
        
        return frontend_data
    
    def cleanup_expired_alerts(self, max_age_minutes: int = 30):
        """
        Clean up old alerts that have been active too long
        
        Args:
            max_age_minutes: Maximum age for alerts in minutes
        """
        current_time = datetime.now()
        max_age = timedelta(minutes=max_age_minutes)
        
        expired_zones = []
        
        with self._lock:
            for zone_id, alert_data in self.active_alerts.items():
                if current_time - alert_data['start_time'] > max_age:
                    expired_zones.append(zone_id)
        
        # Clear expired alerts
        for zone_id in expired_zones:
            self.clear_alert(zone_id)
            logger.info(f"🧹 Expired alert cleared for zone {zone_id}")
        
        if expired_zones:
            logger.info(f"🧹 Cleaned up {len(expired_zones)} expired alerts")
