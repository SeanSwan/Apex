"""
APEX AI ALERT PATTERN GENERATOR
===============================
Advanced pattern generation system for visual threat alerts
Creates dynamic, attention-grabbing patterns based on threat severity and type

Features:
- Multiple alert pattern types (blink, pulse, strobe, gradient)
- Dynamic pattern intensity based on threat level
- Smooth animation transitions
- Performance-optimized pattern calculation
- Customizable timing and behavior
- Psychological attention-grabbing algorithms

Priority: P1 HIGH - Essential for dispatcher attention and response
"""

import math
import time
import numpy as np
from typing import Dict, List, Tuple, Optional, Any, Callable
from enum import Enum
from dataclasses import dataclass
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

class PatternType(Enum):
    """Available alert pattern types"""
    SOLID = "solid"
    SLOW_BLINK = "slow_blink"
    FAST_BLINK = "fast_blink"
    PULSE = "pulse"
    STROBE = "strobe"
    GRADIENT_PULSE = "gradient_pulse"
    HEARTBEAT = "heartbeat"
    BREATHING = "breathing"
    EMERGENCY_FLASH = "emergency_flash"
    WAVE = "wave"

class EasingFunction(Enum):
    """Easing functions for smooth animations"""
    LINEAR = "linear"
    EASE_IN = "ease_in"
    EASE_OUT = "ease_out"
    EASE_IN_OUT = "ease_in_out"
    SINE = "sine"
    BOUNCE = "bounce"
    ELASTIC = "elastic"

@dataclass
class PatternState:
    """Current state of an alert pattern"""
    pattern_type: PatternType
    start_time: float
    duration: float
    current_frame: int
    intensity: float
    is_visible: bool
    opacity: float
    scale: float
    color_shift: float

class AlertPatternGenerator:
    """
    Advanced pattern generator for visual threat alerts
    
    Generates dynamic, attention-grabbing visual patterns optimized
    for security dispatcher awareness and rapid threat identification.
    """
    
    def __init__(self, fps: int = 30):
        """
        Initialize the alert pattern generator
        
        Args:
            fps: Target frames per second for pattern calculations
        """
        self.fps = fps
        self.frame_duration = 1.0 / fps
        
        # Pattern configurations
        self.pattern_configs = self._init_pattern_configs()
        
        # Threat level to pattern mapping
        self.threat_patterns = {
            ThreatLevel.CRITICAL: PatternType.EMERGENCY_FLASH,
            ThreatLevel.HIGH: PatternType.FAST_BLINK,
            ThreatLevel.MEDIUM: PatternType.PULSE,
            ThreatLevel.LOW: PatternType.BREATHING
        }
        
        # Active pattern states
        self.active_patterns = {}  # pattern_id -> PatternState
        
        # Performance tracking
        self.pattern_stats = {
            'patterns_generated': 0,
            'total_calculation_time': 0.0,
            'average_calculation_time': 0.0
        }
        
        # Easing functions
        self.easing_functions = self._init_easing_functions()
        
        logger.info(f"⚡ Alert Pattern Generator initialized (FPS: {fps})")
    
    def _init_pattern_configs(self) -> Dict[PatternType, Dict[str, Any]]:
        """Initialize configuration for all pattern types"""
        return {
            PatternType.SOLID: {
                'duration': float('inf'),
                'intensity_min': 1.0,
                'intensity_max': 1.0,
                'easing': EasingFunction.LINEAR,
                'description': 'Solid, constant visibility'
            },
            
            PatternType.SLOW_BLINK: {
                'duration': 2.0,  # 2 seconds per cycle
                'on_time': 1.0,   # 1 second on
                'off_time': 1.0,  # 1 second off
                'intensity_min': 0.0,
                'intensity_max': 1.0,
                'easing': EasingFunction.LINEAR,
                'description': 'Slow on/off blinking'
            },
            
            PatternType.FAST_BLINK: {
                'duration': 0.6,  # 0.6 seconds per cycle
                'on_time': 0.3,   # 0.3 seconds on
                'off_time': 0.3,  # 0.3 seconds off
                'intensity_min': 0.0,
                'intensity_max': 1.0,
                'easing': EasingFunction.LINEAR,
                'description': 'Fast attention-grabbing blinks'
            },
            
            PatternType.PULSE: {
                'duration': 3.0,  # 3 seconds per cycle
                'intensity_min': 0.3,
                'intensity_max': 1.0,
                'easing': EasingFunction.SINE,
                'description': 'Smooth sinusoidal pulse'
            },
            
            PatternType.STROBE: {
                'duration': 0.2,  # 0.2 seconds per cycle
                'on_time': 0.05,  # Very short on time
                'off_time': 0.15, # Longer off time
                'intensity_min': 0.0,
                'intensity_max': 1.0,
                'easing': EasingFunction.LINEAR,
                'description': 'Urgent strobe effect'
            },
            
            PatternType.GRADIENT_PULSE: {
                'duration': 4.0,  # 4 seconds per cycle
                'intensity_min': 0.2,
                'intensity_max': 1.0,
                'color_shift_range': 30,  # Degrees of hue shift
                'easing': EasingFunction.EASE_IN_OUT,
                'description': 'Pulsing with color gradient'
            },
            
            PatternType.HEARTBEAT: {
                'duration': 1.2,  # 1.2 seconds per cycle
                'beat1_time': 0.15,
                'pause1_time': 0.15,
                'beat2_time': 0.15,
                'pause2_time': 0.75,
                'intensity_min': 0.1,
                'intensity_max': 1.0,
                'easing': EasingFunction.EASE_OUT,
                'description': 'Double-beat like heartbeat'
            },
            
            PatternType.BREATHING: {
                'duration': 4.0,  # 4 seconds per cycle
                'inhale_time': 1.5,
                'hold_time': 1.0,
                'exhale_time': 1.5,
                'intensity_min': 0.4,
                'intensity_max': 0.8,
                'easing': EasingFunction.EASE_IN_OUT,
                'description': 'Gentle breathing-like pattern'
            },
            
            PatternType.EMERGENCY_FLASH: {
                'duration': 0.1,  # Very fast cycle
                'on_time': 0.02,  # Very short on
                'off_time': 0.08, # Short off
                'intensity_min': 0.0,
                'intensity_max': 1.0,
                'color_boost': 1.2,  # Boost intensity
                'easing': EasingFunction.LINEAR,
                'description': 'Maximum urgency emergency flash'
            },
            
            PatternType.WAVE: {
                'duration': 2.5,  # 2.5 seconds per cycle
                'wave_count': 3,   # 3 waves per cycle
                'intensity_min': 0.2,
                'intensity_max': 1.0,
                'easing': EasingFunction.SINE,
                'description': 'Multi-wave pattern'
            }
        }
    
    def _init_easing_functions(self) -> Dict[EasingFunction, Callable]:
        """Initialize easing functions for smooth animations"""
        return {
            EasingFunction.LINEAR: lambda t: t,
            EasingFunction.EASE_IN: lambda t: t * t,
            EasingFunction.EASE_OUT: lambda t: 1 - (1 - t) * (1 - t),
            EasingFunction.EASE_IN_OUT: lambda t: 2 * t * t if t < 0.5 else 1 - 2 * (1 - t) * (1 - t),
            EasingFunction.SINE: lambda t: (1 + math.sin(2 * math.pi * t - math.pi / 2)) / 2,
            EasingFunction.BOUNCE: self._bounce_easing,
            EasingFunction.ELASTIC: self._elastic_easing
        }
    
    def _bounce_easing(self, t: float) -> float:
        """Bounce easing function"""
        if t < 1/2.75:
            return 7.5625 * t * t
        elif t < 2/2.75:
            t -= 1.5/2.75
            return 7.5625 * t * t + 0.75
        elif t < 2.5/2.75:
            t -= 2.25/2.75
            return 7.5625 * t * t + 0.9375
        else:
            t -= 2.625/2.75
            return 7.5625 * t * t + 0.984375
    
    def _elastic_easing(self, t: float) -> float:
        """Elastic easing function"""
        if t == 0 or t == 1:
            return t
        
        p = 0.3
        s = p / 4
        return -(2**(10*(t-1))) * math.sin((t-1-s)*(2*math.pi)/p)
    
    def create_pattern(self, pattern_id: str, pattern_type: PatternType,
                      threat_level: ThreatLevel = ThreatLevel.MEDIUM,
                      duration_override: float = None,
                      intensity_multiplier: float = 1.0) -> PatternState:
        """
        Create a new alert pattern
        
        Args:
            pattern_id: Unique identifier for this pattern
            pattern_type: Type of pattern to create
            threat_level: Threat level for intensity adjustment
            duration_override: Override default pattern duration
            intensity_multiplier: Multiply pattern intensity
        
        Returns:
            PatternState object representing the new pattern
        """
        config = self.pattern_configs.get(pattern_type, self.pattern_configs[PatternType.SOLID])
        
        # Adjust intensity based on threat level
        threat_intensity_multipliers = {
            ThreatLevel.CRITICAL: 1.2,
            ThreatLevel.HIGH: 1.0,
            ThreatLevel.MEDIUM: 0.8,
            ThreatLevel.LOW: 0.6
        }
        
        final_intensity = intensity_multiplier * threat_intensity_multipliers.get(threat_level, 1.0)
        
        # Create pattern state
        pattern_state = PatternState(
            pattern_type=pattern_type,
            start_time=time.time(),
            duration=duration_override or config['duration'],
            current_frame=0,
            intensity=final_intensity,
            is_visible=True,
            opacity=1.0,
            scale=1.0,
            color_shift=0.0
        )
        
        # Store active pattern
        self.active_patterns[pattern_id] = pattern_state
        
        logger.debug(f"⚡ Created {pattern_type.value} pattern: {pattern_id}")
        return pattern_state
    
    def calculate_pattern_properties(self, pattern_id: str) -> Dict[str, Any]:
        """
        Calculate current visual properties for a pattern
        
        Args:
            pattern_id: ID of the pattern to calculate
        
        Returns:
            Dictionary with current visual properties
        """
        start_time = time.time()
        
        if pattern_id not in self.active_patterns:
            return self._get_default_properties()
        
        pattern_state = self.active_patterns[pattern_id]
        config = self.pattern_configs[pattern_state.pattern_type]
        
        # Calculate time within current cycle
        elapsed_time = time.time() - pattern_state.start_time
        
        # Handle infinite duration patterns
        if pattern_state.duration == float('inf'):
            cycle_time = elapsed_time
            normalized_time = 0
        else:
            cycle_time = elapsed_time % pattern_state.duration
            normalized_time = cycle_time / pattern_state.duration
        
        # Calculate properties based on pattern type
        properties = self._calculate_pattern_specific_properties(
            pattern_state.pattern_type, 
            config, 
            normalized_time, 
            cycle_time,
            pattern_state.intensity
        )
        
        # Update pattern state
        pattern_state.current_frame += 1
        pattern_state.opacity = properties['opacity']
        pattern_state.is_visible = properties['is_visible']
        pattern_state.scale = properties.get('scale', 1.0)
        pattern_state.color_shift = properties.get('color_shift', 0.0)
        
        # Update performance stats
        calculation_time = time.time() - start_time
        self._update_performance_stats(calculation_time)
        
        # Add metadata
        properties.update({
            'pattern_id': pattern_id,
            'pattern_type': pattern_state.pattern_type.value,
            'elapsed_time': elapsed_time,
            'cycle_time': cycle_time,
            'frame_count': pattern_state.current_frame,
            'calculation_time': calculation_time
        })
        
        return properties
    
    def _calculate_pattern_specific_properties(self, pattern_type: PatternType,
                                             config: Dict[str, Any],
                                             normalized_time: float,
                                             cycle_time: float,
                                             intensity: float) -> Dict[str, Any]:
        """Calculate properties specific to each pattern type"""
        
        if pattern_type == PatternType.SOLID:
            return {
                'opacity': intensity,
                'is_visible': True,
                'scale': 1.0,
                'color_shift': 0.0
            }
        
        elif pattern_type in [PatternType.SLOW_BLINK, PatternType.FAST_BLINK, PatternType.STROBE]:
            on_time = config['on_time']
            is_on = cycle_time < on_time
            
            return {
                'opacity': intensity if is_on else 0.0,
                'is_visible': is_on,
                'scale': 1.0,
                'color_shift': 0.0
            }
        
        elif pattern_type == PatternType.PULSE:
            easing_func = self.easing_functions[config['easing']]
            eased_time = easing_func(normalized_time)
            
            # Sinusoidal pulse
            pulse_value = (1 + math.sin(2 * math.pi * eased_time - math.pi / 2)) / 2
            min_intensity = config['intensity_min']
            max_intensity = config['intensity_max']
            
            opacity = min_intensity + (max_intensity - min_intensity) * pulse_value
            opacity *= intensity
            
            return {
                'opacity': opacity,
                'is_visible': True,
                'scale': 0.9 + 0.1 * pulse_value,  # Slight scale pulse
                'color_shift': 0.0
            }
        
        elif pattern_type == PatternType.GRADIENT_PULSE:
            easing_func = self.easing_functions[config['easing']]
            eased_time = easing_func(normalized_time)
            
            # Smooth pulse with color shifting
            pulse_value = (1 + math.sin(2 * math.pi * eased_time - math.pi / 2)) / 2
            min_intensity = config['intensity_min']
            max_intensity = config['intensity_max']
            
            opacity = min_intensity + (max_intensity - min_intensity) * pulse_value
            opacity *= intensity
            
            # Color shift based on pulse
            color_shift_range = config.get('color_shift_range', 30)
            color_shift = color_shift_range * pulse_value
            
            return {
                'opacity': opacity,
                'is_visible': True,
                'scale': 0.95 + 0.05 * pulse_value,
                'color_shift': color_shift
            }
        
        elif pattern_type == PatternType.HEARTBEAT:
            beat1_time = config['beat1_time']
            pause1_time = config['pause1_time']
            beat2_time = config['beat2_time']
            
            beat1_end = beat1_time
            pause1_end = beat1_end + pause1_time
            beat2_end = pause1_end + beat2_time
            
            if cycle_time < beat1_end:
                # First beat
                beat_progress = cycle_time / beat1_time
                easing_func = self.easing_functions[config['easing']]
                opacity = intensity * easing_func(1 - abs(beat_progress - 0.5) * 2)
                is_visible = True
            elif cycle_time < pause1_end:
                # First pause
                opacity = config['intensity_min'] * intensity
                is_visible = True
            elif cycle_time < beat2_end:
                # Second beat
                beat_progress = (cycle_time - pause1_end) / beat2_time
                easing_func = self.easing_functions[config['easing']]
                opacity = intensity * easing_func(1 - abs(beat_progress - 0.5) * 2)
                is_visible = True
            else:
                # Final pause
                opacity = config['intensity_min'] * intensity
                is_visible = True
            
            return {
                'opacity': opacity,
                'is_visible': is_visible,
                'scale': 0.95 + 0.05 * (opacity / intensity),
                'color_shift': 0.0
            }
        
        elif pattern_type == PatternType.BREATHING:
            inhale_time = config['inhale_time']
            hold_time = config['hold_time']
            exhale_time = config['exhale_time']
            
            inhale_end = inhale_time
            hold_end = inhale_end + hold_time
            exhale_end = hold_end + exhale_time
            
            min_intensity = config['intensity_min']
            max_intensity = config['intensity_max']
            
            if cycle_time < inhale_end:
                # Inhaling (increasing)
                progress = cycle_time / inhale_time
                easing_func = self.easing_functions[config['easing']]
                eased_progress = easing_func(progress)
                opacity = min_intensity + (max_intensity - min_intensity) * eased_progress
            elif cycle_time < hold_end:
                # Holding (steady)
                opacity = max_intensity
            else:
                # Exhaling (decreasing)
                progress = (cycle_time - hold_end) / exhale_time
                easing_func = self.easing_functions[config['easing']]
                eased_progress = easing_func(progress)
                opacity = max_intensity - (max_intensity - min_intensity) * eased_progress
            
            opacity *= intensity
            
            return {
                'opacity': opacity,
                'is_visible': True,
                'scale': 0.98 + 0.02 * (opacity / max_intensity),
                'color_shift': 0.0
            }
        
        elif pattern_type == PatternType.EMERGENCY_FLASH:
            on_time = config['on_time']
            is_on = cycle_time < on_time
            
            # Boost intensity for emergency
            boosted_intensity = intensity * config.get('color_boost', 1.2)
            
            return {
                'opacity': boosted_intensity if is_on else 0.0,
                'is_visible': is_on,
                'scale': 1.05 if is_on else 1.0,  # Slight scale boost
                'color_shift': 10 if is_on else 0  # Color shift for urgency
            }
        
        elif pattern_type == PatternType.WAVE:
            wave_count = config['wave_count']
            min_intensity = config['intensity_min']
            max_intensity = config['intensity_max']
            
            # Multiple sine waves
            wave_value = 0
            for i in range(wave_count):
                phase_offset = (i / wave_count) * 2 * math.pi
                wave_value += math.sin(2 * math.pi * normalized_time + phase_offset)
            
            # Normalize and scale
            wave_value = (wave_value + wave_count) / (2 * wave_count)  # Normalize to 0-1
            opacity = min_intensity + (max_intensity - min_intensity) * wave_value
            opacity *= intensity
            
            return {
                'opacity': opacity,
                'is_visible': True,
                'scale': 0.98 + 0.02 * wave_value,
                'color_shift': 15 * wave_value
            }
        
        else:
            # Default to solid
            return self._get_default_properties()
    
    def _get_default_properties(self) -> Dict[str, Any]:
        """Get default pattern properties"""
        return {
            'opacity': 1.0,
            'is_visible': True,
            'scale': 1.0,
            'color_shift': 0.0,
            'pattern_id': 'default',
            'pattern_type': 'solid',
            'elapsed_time': 0.0,
            'cycle_time': 0.0,
            'frame_count': 0,
            'calculation_time': 0.0
        }
    
    def remove_pattern(self, pattern_id: str) -> bool:
        """
        Remove an active pattern
        
        Args:
            pattern_id: ID of pattern to remove
        
        Returns:
            bool: True if pattern was removed
        """
        if pattern_id in self.active_patterns:
            del self.active_patterns[pattern_id]
            logger.debug(f"🗑️ Removed pattern: {pattern_id}")
            return True
        return False
    
    def clear_all_patterns(self):
        """Remove all active patterns"""
        count = len(self.active_patterns)
        self.active_patterns.clear()
        logger.info(f"🧹 Cleared all patterns ({count} patterns)")
    
    def get_pattern_for_threat(self, threat_level: ThreatLevel, 
                              threat_type: ThreatType = None) -> PatternType:
        """
        Get recommended pattern type for a threat
        
        Args:
            threat_level: Threat severity level
            threat_type: Type of threat (optional)
        
        Returns:
            Recommended pattern type
        """
        # Base pattern from threat level
        base_pattern = self.threat_patterns.get(threat_level, PatternType.PULSE)
        
        # Modify based on threat type
        if threat_type:
            if threat_type.value == 'weapon' and threat_level == ThreatLevel.CRITICAL:
                return PatternType.EMERGENCY_FLASH
            elif threat_type.value == 'violence' and threat_level in [ThreatLevel.CRITICAL, ThreatLevel.HIGH]:
                return PatternType.HEARTBEAT
            elif threat_type.value == 'transient_activity':
                return PatternType.BREATHING
        
        return base_pattern
    
    def get_pattern_info(self, pattern_type: PatternType) -> Dict[str, Any]:
        """
        Get information about a pattern type
        
        Args:
            pattern_type: Pattern type to get info for
        
        Returns:
            Pattern information dictionary
        """
        config = self.pattern_configs.get(pattern_type, {})
        return {
            'type': pattern_type.value,
            'duration': config.get('duration', 0),
            'description': config.get('description', 'No description'),
            'intensity_range': (
                config.get('intensity_min', 0),
                config.get('intensity_max', 1)
            ),
            'easing': config.get('easing', EasingFunction.LINEAR).value,
            'suitable_for': self._get_suitable_threats(pattern_type)
        }
    
    def _get_suitable_threats(self, pattern_type: PatternType) -> List[str]:
        """Get list of threat levels suitable for this pattern"""
        suitable = []
        for level, pattern in self.threat_patterns.items():
            if pattern == pattern_type:
                suitable.append(level.name)
        return suitable
    
    def _update_performance_stats(self, calculation_time: float):
        """Update performance statistics"""
        self.pattern_stats['patterns_generated'] += 1
        self.pattern_stats['total_calculation_time'] += calculation_time
        
        count = self.pattern_stats['patterns_generated']
        total_time = self.pattern_stats['total_calculation_time']
        self.pattern_stats['average_calculation_time'] = total_time / count
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        return {
            'active_patterns': len(self.active_patterns),
            'fps': self.fps,
            **self.pattern_stats,
            'patterns_per_second': self.fps * len(self.active_patterns) if self.active_patterns else 0
        }
    
    def export_patterns_for_frontend(self) -> Dict[str, Any]:
        """
        Export all active patterns in frontend-compatible format
        
        Returns:
            Frontend-compatible pattern data
        """
        frontend_patterns = {}
        
        for pattern_id, pattern_state in self.active_patterns.items():
            properties = self.calculate_pattern_properties(pattern_id)
            
            frontend_patterns[pattern_id] = {
                'type': pattern_state.pattern_type.value,
                'properties': {
                    'opacity': properties['opacity'],
                    'isVisible': properties['is_visible'],
                    'scale': properties.get('scale', 1.0),
                    'colorShift': properties.get('color_shift', 0.0)
                },
                'metadata': {
                    'elapsedTime': properties['elapsed_time'],
                    'frameCount': properties['frame_count'],
                    'intensity': pattern_state.intensity
                }
            }
        
        return {
            'patterns': frontend_patterns,
            'timestamp': time.time(),
            'fps': self.fps,
            'activeCount': len(self.active_patterns)
        }
