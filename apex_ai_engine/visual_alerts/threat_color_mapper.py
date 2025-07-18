"""
APEX AI THREAT COLOR MAPPER
===========================
Dynamic color-coding system for threat level visualization
Maps threat types and levels to appropriate colors and visual schemes

Features:
- Threat level to color mapping
- Color psychology for security applications
- Dynamic color adjustment based on confidence
- Zone-specific color schemes
- Accessibility-compliant color choices
- Emergency color escalation patterns

Priority: P1 HIGH - Critical for dispatcher quick threat identification
"""

import colorsys
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
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
    
    class ThreatType(Enum):
        WEAPON = "weapon"
        VIOLENCE = "violence"
        PACKAGE_THEFT = "package_theft"
        VANDALISM = "vandalism"
        TRESPASSING = "trespassing"
        TRANSIENT_ACTIVITY = "transient_activity"

logger = logging.getLogger(__name__)

class ColorScheme(Enum):
    """Predefined color schemes for different environments"""
    DEFAULT = "default"
    HIGH_CONTRAST = "high_contrast"
    COLORBLIND_FRIENDLY = "colorblind_friendly"
    NIGHT_MODE = "night_mode"
    LUXURY_THEME = "luxury_theme"

class ThreatColorMapper:
    """
    Advanced color mapping system for threat visualization
    
    Provides dynamic color assignment based on threat levels, types,
    and environmental factors for optimal dispatcher recognition.
    """
    
    def __init__(self, color_scheme: ColorScheme = ColorScheme.DEFAULT):
        """
        Initialize the threat color mapper
        
        Args:
            color_scheme: Color scheme to use for mapping
        """
        self.color_scheme = color_scheme
        
        # Initialize color schemes
        self._init_color_schemes()
        
        # Current active scheme
        self.active_colors = self.color_schemes[color_scheme]
        
        # Color intensity settings
        self.intensity_settings = {
            'base_intensity': 0.8,
            'confidence_factor': 0.4,  # How much confidence affects intensity
            'zone_factor': 0.2,        # How much zone sensitivity affects intensity
            'time_decay': 0.1          # How much color fades over time
        }
        
        # Threat type specific color modifications
        self.threat_type_modifiers = {
            ThreatType.WEAPON: {
                'hue_shift': 0,           # No hue shift for weapons (keep pure red)
                'saturation_boost': 0.2,   # Boost saturation for urgency
                'brightness_boost': 0.1
            },
            ThreatType.VIOLENCE: {
                'hue_shift': -10,         # Slight shift toward orange-red
                'saturation_boost': 0.15,
                'brightness_boost': 0.05
            },
            ThreatType.PACKAGE_THEFT: {
                'hue_shift': 15,          # Shift toward yellow-orange
                'saturation_boost': 0.0,
                'brightness_boost': 0.0
            },
            ThreatType.TRESPASSING: {
                'hue_shift': -15,         # Shift toward purple-red
                'saturation_boost': 0.1,
                'brightness_boost': 0.0
            },
            ThreatType.TRANSIENT_ACTIVITY: {
                'hue_shift': 30,          # Shift toward yellow
                'saturation_boost': -0.1,
                'brightness_boost': -0.1
            },
            ThreatType.VANDALISM: {
                'hue_shift': 20,          # Shift toward orange
                'saturation_boost': 0.05,
                'brightness_boost': 0.0
            }
        }
        
        logger.info(f"🎨 Threat Color Mapper initialized with {color_scheme.value} scheme")
    
    def _init_color_schemes(self):
        """Initialize all available color schemes"""
        self.color_schemes = {
            ColorScheme.DEFAULT: {
                ThreatLevel.CRITICAL: (255, 0, 0),      # Bright Red
                ThreatLevel.HIGH: (255, 165, 0),        # Orange
                ThreatLevel.MEDIUM: (255, 255, 0),      # Yellow
                ThreatLevel.LOW: (0, 255, 255),         # Cyan
                'background': (40, 40, 40),             # Dark gray
                'text': (255, 255, 255),                # White
                'border': (128, 128, 128)               # Gray
            },
            
            ColorScheme.HIGH_CONTRAST: {
                ThreatLevel.CRITICAL: (255, 0, 0),      # Pure Red
                ThreatLevel.HIGH: (255, 128, 0),        # Pure Orange
                ThreatLevel.MEDIUM: (255, 255, 0),      # Pure Yellow
                ThreatLevel.LOW: (0, 255, 0),           # Pure Green
                'background': (0, 0, 0),                # Pure Black
                'text': (255, 255, 255),                # Pure White
                'border': (255, 255, 255)               # Pure White
            },
            
            ColorScheme.COLORBLIND_FRIENDLY: {
                ThreatLevel.CRITICAL: (213, 94, 0),     # Vermillion (red-blind safe)
                ThreatLevel.HIGH: (240, 228, 66),       # Yellow
                ThreatLevel.MEDIUM: (0, 158, 115),      # Bluish Green
                ThreatLevel.LOW: (86, 180, 233),        # Sky Blue
                'background': (50, 50, 50),             # Dark gray
                'text': (255, 255, 255),                # White
                'border': (200, 200, 200)               # Light gray
            },
            
            ColorScheme.NIGHT_MODE: {
                ThreatLevel.CRITICAL: (180, 0, 0),      # Dark Red
                ThreatLevel.HIGH: (180, 120, 0),        # Dark Orange
                ThreatLevel.MEDIUM: (180, 180, 0),      # Dark Yellow
                ThreatLevel.LOW: (0, 120, 120),         # Dark Cyan
                'background': (20, 20, 25),             # Very dark blue-gray
                'text': (200, 200, 200),                # Light gray
                'border': (80, 80, 80)                  # Medium gray
            },
            
            ColorScheme.LUXURY_THEME: {
                ThreatLevel.CRITICAL: (220, 20, 60),    # Crimson
                ThreatLevel.HIGH: (255, 140, 0),        # Dark Orange
                ThreatLevel.MEDIUM: (255, 215, 0),      # Gold
                ThreatLevel.LOW: (72, 209, 204),        # Medium Turquoise
                'background': (25, 25, 35),             # Elegant dark blue
                'text': (245, 245, 245),                # Off-white
                'border': (139, 69, 19)                 # Saddle Brown (luxury accent)
            }
        }
    
    def get_threat_color(self, threat_level: ThreatLevel, 
                        threat_type: ThreatType = None,
                        confidence: float = 1.0,
                        zone_sensitivity: float = 1.0,
                        age_seconds: float = 0.0) -> Tuple[int, int, int]:
        """
        Get the appropriate color for a threat
        
        Args:
            threat_level: Threat severity level
            threat_type: Type of threat (optional)
            confidence: Detection confidence (0.0-1.0)
            zone_sensitivity: Zone sensitivity multiplier
            age_seconds: How long ago the threat was detected
        
        Returns:
            RGB color tuple (0-255 range)
        """
        # Get base color for threat level
        base_color = self.active_colors.get(threat_level, self.active_colors[ThreatLevel.MEDIUM])
        
        # Convert to HSV for easier manipulation
        r, g, b = [c / 255.0 for c in base_color]
        h, s, v = colorsys.rgb_to_hsv(r, g, b)
        
        # Apply threat type modifications
        if threat_type and threat_type in self.threat_type_modifiers:
            modifiers = self.threat_type_modifiers[threat_type]
            
            # Adjust hue
            h += modifiers['hue_shift'] / 360.0
            h = h % 1.0  # Keep in valid range
            
            # Adjust saturation
            s += modifiers['saturation_boost']
            s = max(0.0, min(1.0, s))
            
            # Adjust brightness
            v += modifiers['brightness_boost']
            v = max(0.0, min(1.0, v))
        
        # Apply confidence factor
        confidence_factor = self.intensity_settings['confidence_factor']
        intensity_boost = confidence * confidence_factor
        v = min(1.0, v + intensity_boost)
        
        # Apply zone sensitivity
        zone_factor = self.intensity_settings['zone_factor']
        zone_boost = (zone_sensitivity - 1.0) * zone_factor
        s = max(0.0, min(1.0, s + zone_boost))
        
        # Apply time decay (older threats get slightly dimmer)
        if age_seconds > 0:
            time_decay = self.intensity_settings['time_decay']
            decay_factor = max(0.5, 1.0 - (age_seconds / 300.0) * time_decay)  # 5 minute decay
            v *= decay_factor
        
        # Convert back to RGB
        r, g, b = colorsys.hsv_to_rgb(h, s, v)
        rgb_color = (int(r * 255), int(g * 255), int(b * 255))
        
        return rgb_color
    
    def get_threat_color_gradient(self, threat_level: ThreatLevel,
                                 threat_type: ThreatType = None,
                                 steps: int = 10) -> List[Tuple[int, int, int]]:
        """
        Get a color gradient for pulsing/animated effects
        
        Args:
            threat_level: Threat severity level
            threat_type: Type of threat
            steps: Number of gradient steps
        
        Returns:
            List of RGB colors forming a gradient
        """
        base_color = self.get_threat_color(threat_level, threat_type, confidence=1.0)
        gradient = []
        
        # Convert to HSV
        r, g, b = [c / 255.0 for c in base_color]
        h, s, v = colorsys.rgb_to_hsv(r, g, b)
        
        # Create gradient by varying brightness
        min_brightness = 0.3
        for i in range(steps):
            # Sinusoidal brightness variation
            brightness = min_brightness + (v - min_brightness) * (1 + np.sin(2 * np.pi * i / steps)) / 2
            
            # Convert back to RGB
            r_grad, g_grad, b_grad = colorsys.hsv_to_rgb(h, s, brightness)
            rgb_grad = (int(r_grad * 255), int(g_grad * 255), int(b_grad * 255))
            gradient.append(rgb_grad)
        
        return gradient
    
    def get_complementary_colors(self, base_color: Tuple[int, int, int]) -> Dict[str, Tuple[int, int, int]]:
        """
        Get complementary colors for UI elements
        
        Args:
            base_color: Base threat color
        
        Returns:
            Dictionary with complementary colors
        """
        # Convert to HSV
        r, g, b = [c / 255.0 for c in base_color]
        h, s, v = colorsys.rgb_to_hsv(r, g, b)
        
        # Generate complementary colors
        colors = {}
        
        # Complementary (opposite hue)
        comp_h = (h + 0.5) % 1.0
        r_comp, g_comp, b_comp = colorsys.hsv_to_rgb(comp_h, s, v)
        colors['complementary'] = (int(r_comp * 255), int(g_comp * 255), int(b_comp * 255))
        
        # Analogous colors (±30 degrees)
        analog1_h = (h + 1/12) % 1.0  # +30 degrees
        analog2_h = (h - 1/12) % 1.0  # -30 degrees
        
        r_a1, g_a1, b_a1 = colorsys.hsv_to_rgb(analog1_h, s, v)
        r_a2, g_a2, b_a2 = colorsys.hsv_to_rgb(analog2_h, s, v)
        
        colors['analogous1'] = (int(r_a1 * 255), int(g_a1 * 255), int(b_a1 * 255))
        colors['analogous2'] = (int(r_a2 * 255), int(g_a2 * 255), int(b_a2 * 255))
        
        # Triadic colors (±120 degrees)
        triad1_h = (h + 1/3) % 1.0
        triad2_h = (h - 1/3) % 1.0
        
        r_t1, g_t1, b_t1 = colorsys.hsv_to_rgb(triad1_h, s, v)
        r_t2, g_t2, b_t2 = colorsys.hsv_to_rgb(triad2_h, s, v)
        
        colors['triadic1'] = (int(r_t1 * 255), int(g_t1 * 255), int(b_t1 * 255))
        colors['triadic2'] = (int(r_t2 * 255), int(g_t2 * 255), int(b_t2 * 255))
        
        # Lighter and darker versions
        light_v = min(1.0, v + 0.3)
        dark_v = max(0.0, v - 0.3)
        
        r_light, g_light, b_light = colorsys.hsv_to_rgb(h, s, light_v)
        r_dark, g_dark, b_dark = colorsys.hsv_to_rgb(h, s, dark_v)
        
        colors['lighter'] = (int(r_light * 255), int(g_light * 255), int(b_light * 255))
        colors['darker'] = (int(r_dark * 255), int(g_dark * 255), int(b_dark * 255))
        
        return colors
    
    def get_color_for_css(self, color: Tuple[int, int, int], opacity: float = 1.0) -> str:
        """
        Convert RGB color to CSS-compatible format
        
        Args:
            color: RGB color tuple
            opacity: Opacity value (0.0-1.0)
        
        Returns:
            CSS color string
        """
        r, g, b = color
        if opacity < 1.0:
            return f"rgba({r}, {g}, {b}, {opacity:.2f})"
        else:
            return f"rgb({r}, {g}, {b})"
    
    def get_color_for_hex(self, color: Tuple[int, int, int]) -> str:
        """
        Convert RGB color to hexadecimal format
        
        Args:
            color: RGB color tuple
        
        Returns:
            Hexadecimal color string
        """
        r, g, b = color
        return f"#{r:02x}{g:02x}{b:02x}"
    
    def set_color_scheme(self, scheme: ColorScheme):
        """
        Change the active color scheme
        
        Args:
            scheme: New color scheme to use
        """
        if scheme in self.color_schemes:
            self.color_scheme = scheme
            self.active_colors = self.color_schemes[scheme]
            logger.info(f"🎨 Color scheme changed to {scheme.value}")
        else:
            logger.error(f"❌ Unknown color scheme: {scheme}")
    
    def create_custom_color_scheme(self, name: str, colors: Dict[ThreatLevel, Tuple[int, int, int]]):
        """
        Create a custom color scheme
        
        Args:
            name: Name for the custom scheme
            colors: Dictionary mapping threat levels to colors
        """
        # Validate colors
        required_levels = [ThreatLevel.CRITICAL, ThreatLevel.HIGH, ThreatLevel.MEDIUM, ThreatLevel.LOW]
        for level in required_levels:
            if level not in colors:
                logger.error(f"❌ Missing color for {level} in custom scheme")
                return False
        
        # Add default UI colors if not provided
        if 'background' not in colors:
            colors['background'] = (40, 40, 40)
        if 'text' not in colors:
            colors['text'] = (255, 255, 255)
        if 'border' not in colors:
            colors['border'] = (128, 128, 128)
        
        # Create custom scheme enum value
        custom_scheme = ColorScheme(name)
        self.color_schemes[custom_scheme] = colors
        
        logger.info(f"✅ Created custom color scheme: {name}")
        return True
    
    def get_accessibility_info(self, color: Tuple[int, int, int]) -> Dict[str, Any]:
        """
        Get accessibility information for a color
        
        Args:
            color: RGB color tuple
        
        Returns:
            Dictionary with accessibility metrics
        """
        r, g, b = [c / 255.0 for c in color]
        
        # Calculate relative luminance (WCAG formula)
        def gamma_correct(c):
            return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
        
        r_linear = gamma_correct(r)
        g_linear = gamma_correct(g)
        b_linear = gamma_correct(b)
        
        luminance = 0.2126 * r_linear + 0.7152 * g_linear + 0.0722 * b_linear
        
        # Calculate contrast ratios with common backgrounds
        white_luminance = 1.0
        black_luminance = 0.0
        
        # Contrast ratio formula
        def contrast_ratio(l1, l2):
            lighter = max(l1, l2)
            darker = min(l1, l2)
            return (lighter + 0.05) / (darker + 0.05)
        
        white_contrast = contrast_ratio(luminance, white_luminance)
        black_contrast = contrast_ratio(luminance, black_luminance)
        
        # WCAG compliance levels
        aa_normal = white_contrast >= 4.5 or black_contrast >= 4.5
        aa_large = white_contrast >= 3.0 or black_contrast >= 3.0
        aaa_normal = white_contrast >= 7.0 or black_contrast >= 7.0
        
        return {
            'luminance': luminance,
            'contrast_with_white': white_contrast,
            'contrast_with_black': black_contrast,
            'wcag_aa_normal': aa_normal,
            'wcag_aa_large': aa_large,
            'wcag_aaa_normal': aaa_normal,
            'recommended_text_color': 'white' if black_contrast > white_contrast else 'black'
        }
    
    def get_color_palette_for_frontend(self) -> Dict[str, Any]:
        """
        Export color palette in format suitable for frontend use
        
        Returns:
            Frontend-compatible color palette
        """
        palette = {
            'scheme': self.color_scheme.value,
            'threatLevels': {},
            'ui': {},
            'threatTypes': {}
        }
        
        # Threat level colors
        for level in [ThreatLevel.CRITICAL, ThreatLevel.HIGH, ThreatLevel.MEDIUM, ThreatLevel.LOW]:
            color = self.active_colors[level]
            palette['threatLevels'][level.name.lower()] = {
                'rgb': color,
                'hex': self.get_color_for_hex(color),
                'css': self.get_color_for_css(color)
            }
        
        # UI colors
        ui_elements = ['background', 'text', 'border']
        for element in ui_elements:
            if element in self.active_colors:
                color = self.active_colors[element]
                palette['ui'][element] = {
                    'rgb': color,
                    'hex': self.get_color_for_hex(color),
                    'css': self.get_color_for_css(color)
                }
        
        # Threat type specific colors
        for threat_type in ThreatType:
            # Get color for each threat type at HIGH level as example
            color = self.get_threat_color(ThreatLevel.HIGH, threat_type)
            palette['threatTypes'][threat_type.value] = {
                'rgb': color,
                'hex': self.get_color_for_hex(color),
                'css': self.get_color_for_css(color)
            }
        
        return palette
    
    def validate_color_scheme(self, scheme_colors: Dict) -> List[str]:
        """
        Validate a color scheme for accessibility and usability
        
        Args:
            scheme_colors: Color scheme to validate
        
        Returns:
            List of validation warnings/errors
        """
        warnings = []
        
        # Check all required colors are present
        required_levels = [ThreatLevel.CRITICAL, ThreatLevel.HIGH, ThreatLevel.MEDIUM, ThreatLevel.LOW]
        for level in required_levels:
            if level not in scheme_colors:
                warnings.append(f"Missing color for {level.name}")
        
        # Check color distinctiveness
        colors = [scheme_colors[level] for level in required_levels if level in scheme_colors]
        
        for i, color1 in enumerate(colors):
            for j, color2 in enumerate(colors[i+1:], i+1):
                # Calculate color distance
                r1, g1, b1 = color1
                r2, g2, b2 = color2
                
                distance = np.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2)
                
                if distance < 100:  # Colors are too similar
                    warnings.append(f"Colors {i} and {j} are too similar (distance: {distance:.1f})")
        
        # Check accessibility
        for level, color in scheme_colors.items():
            if isinstance(level, ThreatLevel):
                accessibility = self.get_accessibility_info(color)
                if not accessibility['wcag_aa_large']:
                    warnings.append(f"{level.name} color may have poor accessibility")
        
        return warnings
