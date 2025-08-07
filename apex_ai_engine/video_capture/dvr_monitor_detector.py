"""
APEX AI ENGINE - DVR MONITOR DETECTOR
=====================================
Automatic monitor detection and DVR system mapping for optimal security monitoring

This module provides comprehensive monitor detection capabilities specifically
designed for DVR security monitoring setups. Automatically detects available
monitors, maps their layouts, identifies DVR applications, and optimizes
capture configurations for AI threat detection.

Key Features:
- Automatic detection of all connected monitors and their properties
- DVR application window detection and mapping
- Monitor layout optimization for security monitoring
- Display configuration persistence and management
- Integration with screen capture and region management systems
- Support for complex multi-monitor DVR setups
"""

import win32api
import win32con
import win32gui
import win32process
import psutil
import cv2
import numpy as np
import json
import time
import logging
import threading
from typing import Dict, List, Optional, Tuple, NamedTuple
from dataclasses import dataclass, asdict
from collections import defaultdict
import re

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class MonitorConfiguration:
    """Comprehensive monitor configuration information"""
    monitor_id: int
    device_name: str
    display_name: str
    width: int
    height: int
    x_offset: int
    y_offset: int
    is_primary: bool
    refresh_rate: int
    color_depth: int
    orientation: str
    scale_factor: float
    work_area: Tuple[int, int, int, int]  # left, top, right, bottom
    
class DVRWindowInfo(NamedTuple):
    """Information about detected DVR application windows"""
    hwnd: int
    title: str
    process_name: str
    pid: int
    rect: Tuple[int, int, int, int]  # left, top, right, bottom
    monitor_id: int
    is_fullscreen: bool
    confidence_score: float  # How likely this is a DVR application

@dataclass
class DVRSystemLayout:
    """Complete DVR system layout configuration"""
    layout_id: str
    dvr_windows: List[DVRWindowInfo]
    monitor_assignments: Dict[int, List[int]]  # monitor_id -> dvr_window_indices
    total_cameras: int
    layout_type: str  # "single_monitor", "multi_monitor", "mixed"
    detected_timestamp: float
    confidence_score: float

class DVRMonitorDetector:
    """
    Advanced monitor detection and DVR system mapping
    
    Provides comprehensive detection of monitors and DVR applications
    for optimal AI-powered security monitoring setup.
    """
    
    def __init__(self):
        self.monitors: Dict[int, MonitorConfiguration] = {}
        self.dvr_windows: List[DVRWindowInfo] = []
        self.dvr_layouts: List[DVRSystemLayout] = []
        
        # DVR application detection patterns
        self.dvr_patterns = [
            # Common DVR software names and patterns
            r'.*dvr.*', r'.*nvr.*', r'.*camera.*', r'.*security.*', r'.*surveillance.*',
            r'.*monitor.*', r'.*viewer.*', r'.*recorder.*', r'.*cctv.*',
            # Specific DVR software brands
            r'.*hikvision.*', r'.*dahua.*', r'.*axis.*', r'.*panasonic.*',
            r'.*sony.*', r'.*samsung.*', r'.*bosch.*', r'.*honeywell.*',
            r'.*milestone.*', r'.*genetec.*', r'.*avigilon.*', r'.*verkada.*',
            # Generic video applications that might be DVRs
            r'.*video.*', r'.*media.*', r'.*stream.*', r'.*live.*'
        ]
        
        # Process name patterns for DVR software
        self.dvr_process_patterns = [
            r'.*dvr.*', r'.*nvr.*', r'.*cam.*', r'.*sec.*', r'.*surv.*',
            r'.*hikvision.*', r'.*dahua.*', r'.*milestone.*', r'.*viewer.*'
        ]
        
        logger.info("DVR Monitor Detector initialized")
    
    def detect_all_monitors(self) -> Dict[int, MonitorConfiguration]:
        """Detect and catalog all available monitors"""
        self.monitors.clear()
        
        try:
            # Get monitor information using Windows API
            monitor_count = win32api.GetSystemMetrics(win32con.SM_CMONITORS)
            logger.info(f"Detected {monitor_count} monitor(s)")
            
            def monitor_enum_proc(hMonitor, hdcMonitor, lprcMonitor, dwData):
                """Callback for monitor enumeration"""
                try:
                    # Get monitor info
                    monitor_info = win32api.GetMonitorInfo(hMonitor)
                    
                    # Get device context for additional info
                    device_name = monitor_info.get('Device', f'Monitor_{len(self.monitors)}')
                    
                    # Calculate monitor properties
                    monitor_rect = monitor_info['Monitor']
                    work_rect = monitor_info['Work']
                    
                    width = monitor_rect[2] - monitor_rect[0]
                    height = monitor_rect[3] - monitor_rect[1]
                    x_offset = monitor_rect[0]
                    y_offset = monitor_rect[1]
                    
                    is_primary = monitor_info['Flags'] == win32con.MONITORINFOF_PRIMARY
                    
                    # Try to get additional display information
                    refresh_rate = 60  # Default
                    color_depth = 32   # Default
                    scale_factor = 1.0  # Default
                    
                    try:
                        # Get device context
                        hdc = win32gui.GetDC(0)
                        if hdc:
                            refresh_rate = win32api.GetDeviceCaps(hdc, win32con.VREFRESH)
                            color_depth = win32api.GetDeviceCaps(hdc, win32con.BITSPIXEL)
                            win32gui.ReleaseDC(0, hdc)
                    except Exception as e:
                        logger.debug(f"Could not get extended monitor info: {e}")
                    
                    # Determine orientation
                    orientation = "landscape" if width >= height else "portrait"
                    
                    # Create monitor configuration
                    monitor_config = MonitorConfiguration(
                        monitor_id=len(self.monitors),
                        device_name=device_name,
                        display_name=f"Monitor {len(self.monitors) + 1}",
                        width=width,
                        height=height,
                        x_offset=x_offset,
                        y_offset=y_offset,
                        is_primary=is_primary,
                        refresh_rate=refresh_rate,
                        color_depth=color_depth,
                        orientation=orientation,
                        scale_factor=scale_factor,
                        work_area=work_rect
                    )
                    
                    self.monitors[len(self.monitors)] = monitor_config
                    
                    logger.info(f"Monitor {len(self.monitors)}: {width}x{height} at ({x_offset}, {y_offset}) - {device_name}")
                    
                except Exception as e:
                    logger.error(f"Error processing monitor: {e}")
                
                return True
            
            # Enumerate all monitors
            win32api.EnumDisplayMonitors(None, None, monitor_enum_proc, 0)
            
            return self.monitors
            
        except Exception as e:
            logger.error(f"Failed to detect monitors: {e}")
            
            # Fallback: Create default monitor configuration
            try:
                screen_width = win32api.GetSystemMetrics(win32con.SM_CXSCREEN)
                screen_height = win32api.GetSystemMetrics(win32con.SM_CYSCREEN)
                
                default_monitor = MonitorConfiguration(
                    monitor_id=0,
                    device_name="Primary Monitor",
                    display_name="Monitor 1", 
                    width=screen_width,
                    height=screen_height,
                    x_offset=0,
                    y_offset=0,
                    is_primary=True,
                    refresh_rate=60,
                    color_depth=32,
                    orientation="landscape" if screen_width >= screen_height else "portrait",
                    scale_factor=1.0,
                    work_area=(0, 0, screen_width, screen_height)
                )
                
                self.monitors[0] = default_monitor
                logger.info(f"Using fallback monitor configuration: {screen_width}x{screen_height}")
                
            except Exception as fallback_error:
                logger.error(f"Fallback monitor detection failed: {fallback_error}")
            
            return self.monitors
    
    def detect_dvr_windows(self) -> List[DVRWindowInfo]:
        """Detect windows that are likely DVR/security camera applications"""
        self.dvr_windows.clear()
        detected_windows = []
        
        def enum_windows_callback(hwnd, lparam):
            """Callback for window enumeration"""
            try:
                # Skip invisible windows
                if not win32gui.IsWindowVisible(hwnd):
                    return True
                
                # Get window information
                window_title = win32gui.GetWindowText(hwnd)
                if not window_title:
                    return True
                
                # Get window rectangle
                try:
                    rect = win32gui.GetWindowRect(hwnd)
                    window_width = rect[2] - rect[0]
                    window_height = rect[3] - rect[1]
                    
                    # Skip very small windows
                    if window_width < 200 or window_height < 150:
                        return True
                        
                except Exception:
                    return True
                
                # Get process information
                try:
                    _, pid = win32process.GetWindowThreadProcessId(hwnd)
                    process = psutil.Process(pid)
                    process_name = process.name().lower()
                except Exception:
                    process_name = "unknown"
                    pid = 0
                
                # Calculate confidence score based on title and process name
                confidence_score = self._calculate_dvr_confidence(window_title, process_name)
                
                # Only consider windows with reasonable confidence
                if confidence_score > 0.3:
                    # Determine which monitor this window is on
                    monitor_id = self._get_window_monitor(rect)
                    
                    # Check if window is fullscreen
                    is_fullscreen = self._is_window_fullscreen(rect, monitor_id)
                    
                    dvr_window = DVRWindowInfo(
                        hwnd=hwnd,
                        title=window_title,
                        process_name=process_name,
                        pid=pid,
                        rect=rect,
                        monitor_id=monitor_id,
                        is_fullscreen=is_fullscreen,
                        confidence_score=confidence_score
                    )
                    
                    detected_windows.append(dvr_window)
                    
                    logger.info(f"Detected potential DVR window: '{window_title}' (confidence: {confidence_score:.2f})")
                
            except Exception as e:
                logger.debug(f"Error processing window: {e}")
            
            return True
        
        try:
            # Enumerate all windows
            win32gui.EnumWindows(enum_windows_callback, None)
            
            # Sort by confidence score (highest first)
            detected_windows.sort(key=lambda w: w.confidence_score, reverse=True)
            
            self.dvr_windows = detected_windows
            logger.info(f"Detected {len(self.dvr_windows)} potential DVR windows")
            
            return self.dvr_windows
            
        except Exception as e:
            logger.error(f"Failed to detect DVR windows: {e}")
            return []
    
    def _calculate_dvr_confidence(self, title: str, process_name: str) -> float:
        """Calculate confidence score that a window is a DVR application"""
        confidence = 0.0
        title_lower = title.lower()
        process_lower = process_name.lower()
        
        # Check title against DVR patterns
        for pattern in self.dvr_patterns:
            if re.search(pattern, title_lower):
                confidence += 0.4
                break
        
        # Check process name against DVR patterns  
        for pattern in self.dvr_process_patterns:
            if re.search(pattern, process_lower):
                confidence += 0.3
                break
        
        # Bonus points for specific keywords
        high_confidence_keywords = ['camera', 'dvr', 'nvr', 'surveillance', 'security', 'cctv']
        for keyword in high_confidence_keywords:
            if keyword in title_lower:
                confidence += 0.2
                break
        
        # Bonus for known DVR brands
        dvr_brands = ['hikvision', 'dahua', 'axis', 'milestone', 'genetec', 'avigilon']
        for brand in dvr_brands:
            if brand in title_lower or brand in process_lower:
                confidence += 0.3
                break
        
        # Penalty for common non-DVR applications
        exclude_keywords = ['browser', 'chrome', 'firefox', 'edge', 'notepad', 'word', 'excel']
        for keyword in exclude_keywords:
            if keyword in title_lower or keyword in process_lower:
                confidence -= 0.4
                break
        
        return max(0.0, min(1.0, confidence))
    
    def _get_window_monitor(self, window_rect: Tuple[int, int, int, int]) -> int:
        """Determine which monitor a window is primarily on"""
        window_center_x = (window_rect[0] + window_rect[2]) // 2
        window_center_y = (window_rect[1] + window_rect[3]) // 2
        
        for monitor_id, monitor in self.monitors.items():
            if (monitor.x_offset <= window_center_x < monitor.x_offset + monitor.width and
                monitor.y_offset <= window_center_y < monitor.y_offset + monitor.height):
                return monitor_id
        
        return 0  # Default to primary monitor
    
    def _is_window_fullscreen(self, window_rect: Tuple[int, int, int, int], monitor_id: int) -> bool:
        """Check if a window is fullscreen on its monitor"""
        if monitor_id not in self.monitors:
            return False
        
        monitor = self.monitors[monitor_id]
        window_width = window_rect[2] - window_rect[0]
        window_height = window_rect[3] - window_rect[1]
        
        # Consider fullscreen if window covers at least 90% of monitor
        width_ratio = window_width / monitor.width
        height_ratio = window_height / monitor.height
        
        return width_ratio >= 0.9 and height_ratio >= 0.9
    
    def analyze_dvr_layout(self) -> List[DVRSystemLayout]:
        """Analyze detected DVR windows to determine system layout"""
        self.dvr_layouts.clear()
        
        if not self.dvr_windows:
            logger.warning("No DVR windows detected for layout analysis")
            return []
        
        try:
            # Group DVR windows by monitor
            monitor_groups = defaultdict(list)
            for i, window in enumerate(self.dvr_windows):
                monitor_groups[window.monitor_id].append(i)
            
            # Determine layout type
            if len(monitor_groups) == 1:
                layout_type = "single_monitor"
            elif all(len(windows) == 1 for windows in monitor_groups.values()):
                layout_type = "multi_monitor"
            else:
                layout_type = "mixed"
            
            # Estimate total cameras (heuristic based on window sizes and patterns)
            total_cameras = self._estimate_camera_count()
            
            # Calculate overall confidence
            avg_confidence = sum(w.confidence_score for w in self.dvr_windows) / len(self.dvr_windows)
            
            # Create layout configuration
            layout = DVRSystemLayout(
                layout_id=f"layout_{int(time.time())}",
                dvr_windows=self.dvr_windows.copy(),
                monitor_assignments=dict(monitor_groups),
                total_cameras=total_cameras,
                layout_type=layout_type,
                detected_timestamp=time.time(),
                confidence_score=avg_confidence
            )
            
            self.dvr_layouts.append(layout)
            
            logger.info(f"Analyzed DVR layout: {layout_type} with {total_cameras} estimated cameras")
            return self.dvr_layouts
            
        except Exception as e:
            logger.error(f"Failed to analyze DVR layout: {e}")
            return []
    
    def _estimate_camera_count(self) -> int:
        """Estimate total number of cameras based on DVR window analysis"""
        if not self.dvr_windows:
            return 0
        
        total_cameras = 0
        
        for window in self.dvr_windows:
            window_width = window.rect[2] - window.rect[0]
            window_height = window.rect[3] - window.rect[1]
            
            # Heuristic: estimate cameras based on aspect ratio and size
            # Common DVR layouts: 1, 4, 9, 16, 25, 36 cameras (square grids)
            aspect_ratio = window_width / window_height if window_height > 0 else 1
            
            if abs(aspect_ratio - 1.0) < 0.2:  # Nearly square - likely grid layout
                area = window_width * window_height
                # Estimate based on typical camera feed sizes
                if area > 800000:  # Large window
                    cameras = 16
                elif area > 400000:  # Medium window
                    cameras = 9
                elif area > 200000:  # Small window
                    cameras = 4
                else:
                    cameras = 1
            else:  # Non-square - might be single or horizontal/vertical layout
                if aspect_ratio > 1.5:  # Wide window
                    cameras = max(2, int(aspect_ratio * 2))
                elif aspect_ratio < 0.7:  # Tall window
                    cameras = max(2, int(2 / aspect_ratio))
                else:
                    cameras = 1
            
            total_cameras = max(total_cameras, cameras)
        
        return min(total_cameras, 64)  # Cap at reasonable maximum
    
    def get_optimal_capture_configuration(self) -> Dict:
        """Generate optimal capture configuration based on detected layout"""
        if not self.monitors or not self.dvr_windows:
            logger.warning("Insufficient information for optimal configuration")
            return {}
        
        config = {
            'monitors': {},
            'dvr_windows': [],
            'recommended_regions': [],
            'capture_settings': {
                'fps': 15,
                'resolution_scale': 1.0,
                'multi_monitor': len(self.monitors) > 1
            }
        }
        
        # Monitor configurations
        for monitor_id, monitor in self.monitors.items():
            config['monitors'][monitor_id] = {
                'width': monitor.width,
                'height': monitor.height,
                'offset': (monitor.x_offset, monitor.y_offset),
                'is_primary': monitor.is_primary,
                'recommended_for_dvr': monitor_id in [w.monitor_id for w in self.dvr_windows]
            }
        
        # DVR window configurations
        for window in self.dvr_windows:
            config['dvr_windows'].append({
                'title': window.title,
                'rect': window.rect,
                'monitor_id': window.monitor_id,
                'is_fullscreen': window.is_fullscreen,
                'confidence': window.confidence_score
            })
        
        # Generate recommended capture regions
        for window in self.dvr_windows:
            if window.confidence_score > 0.5:  # Only high-confidence windows
                # Create region slightly smaller than window to avoid borders
                margin = 10
                region = {
                    'name': f"DVR_{window.title[:20]}",
                    'x': window.rect[0] + margin,
                    'y': window.rect[1] + margin,
                    'width': (window.rect[2] - window.rect[0]) - 2 * margin,
                    'height': (window.rect[3] - window.rect[1]) - 2 * margin,
                    'monitor_id': window.monitor_id,
                    'confidence': window.confidence_score
                }
                config['recommended_regions'].append(region)
        
        return config
    
    def save_configuration(self, filename: str = "monitor_config.json") -> bool:
        """Save detected configuration to file"""
        try:
            config_data = {
                'monitors': {str(k): asdict(v) for k, v in self.monitors.items()},
                'dvr_windows': [w._asdict() for w in self.dvr_windows],
                'dvr_layouts': [asdict(layout) for layout in self.dvr_layouts],
                'detection_timestamp': time.time(),
                'optimal_config': self.get_optimal_capture_configuration()
            }
            
            with open(filename, 'w') as f:
                json.dump(config_data, f, indent=2)
            
            logger.info(f"Configuration saved to {filename}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save configuration: {e}")
            return False
    
    def load_configuration(self, filename: str = "monitor_config.json") -> bool:
        """Load configuration from file"""
        try:
            with open(filename, 'r') as f:
                config_data = json.load(f)
            
            # Load monitors
            self.monitors = {}
            for monitor_id_str, monitor_data in config_data.get('monitors', {}).items():
                monitor_id = int(monitor_id_str)
                self.monitors[monitor_id] = MonitorConfiguration(**monitor_data)
            
            # Load DVR windows
            self.dvr_windows = []
            for window_data in config_data.get('dvr_windows', []):
                self.dvr_windows.append(DVRWindowInfo(**window_data))
            
            logger.info(f"Configuration loaded from {filename}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load configuration: {e}")
            return False
    
    def get_detection_summary(self) -> Dict:
        """Get comprehensive detection summary"""
        return {
            'monitors': {
                'count': len(self.monitors),
                'primary_monitor': next((m.monitor_id for m in self.monitors.values() if m.is_primary), 0),
                'total_resolution': sum(m.width * m.height for m in self.monitors.values()),
                'configurations': [
                    {
                        'id': m.monitor_id,
                        'name': m.display_name,
                        'resolution': f"{m.width}x{m.height}",
                        'position': f"({m.x_offset}, {m.y_offset})"
                    }
                    for m in self.monitors.values()
                ]
            },
            'dvr_detection': {
                'windows_found': len(self.dvr_windows),
                'high_confidence_windows': len([w for w in self.dvr_windows if w.confidence_score > 0.7]),
                'avg_confidence': sum(w.confidence_score for w in self.dvr_windows) / len(self.dvr_windows) if self.dvr_windows else 0,
                'layout_type': self.dvr_layouts[0].layout_type if self.dvr_layouts else "unknown",
                'estimated_cameras': self.dvr_layouts[0].total_cameras if self.dvr_layouts else 0
            },
            'recommendations': {
                'ready_for_capture': len(self.dvr_windows) > 0 and len(self.monitors) > 0,
                'optimal_monitor_count': len(set(w.monitor_id for w in self.dvr_windows)),
                'suggested_fps': 15 if len(self.dvr_windows) <= 2 else 10,
                'capture_regions': len([w for w in self.dvr_windows if w.confidence_score > 0.5])
            }
        }


# Utility functions
def quick_monitor_detection() -> Dict[int, MonitorConfiguration]:
    """Quick monitor detection without DVR analysis"""
    detector = DVRMonitorDetector()
    return detector.detect_all_monitors()

def full_dvr_system_detection() -> Tuple[Dict[int, MonitorConfiguration], List[DVRWindowInfo], Dict]:
    """Complete DVR system detection and analysis"""
    detector = DVRMonitorDetector()
    
    # Detect monitors
    monitors = detector.detect_all_monitors()
    
    # Detect DVR windows
    dvr_windows = detector.detect_dvr_windows()
    
    # Analyze layout
    detector.analyze_dvr_layout()
    
    # Get optimal configuration
    optimal_config = detector.get_optimal_capture_configuration()
    
    return monitors, dvr_windows, optimal_config


if __name__ == "__main__":
    """Demo and testing code"""
    
    print("APEX AI DVR Monitor Detection Demo")
    print("=" * 50)
    
    # Create detector
    detector = DVRMonitorDetector()
    
    # Detect monitors
    print("\n1. Detecting monitors...")
    monitors = detector.detect_all_monitors()
    print(f"Found {len(monitors)} monitor(s)")
    
    for monitor_id, monitor in monitors.items():
        print(f"  Monitor {monitor_id}: {monitor.width}x{monitor.height} at ({monitor.x_offset}, {monitor.y_offset})")
        print(f"    Device: {monitor.device_name} {'(Primary)' if monitor.is_primary else ''}")
    
    # Detect DVR windows
    print("\n2. Detecting DVR applications...")
    dvr_windows = detector.detect_dvr_windows()
    print(f"Found {len(dvr_windows)} potential DVR window(s)")
    
    for window in dvr_windows:
        print(f"  '{window.title}' (confidence: {window.confidence_score:.2f})")
        print(f"    Process: {window.process_name}, Monitor: {window.monitor_id}")
    
    # Analyze layout
    print("\n3. Analyzing DVR layout...")
    layouts = detector.analyze_dvr_layout()
    
    if layouts:
        layout = layouts[0]
        print(f"Layout type: {layout.layout_type}")
        print(f"Estimated cameras: {layout.total_cameras}")
        print(f"Confidence: {layout.confidence_score:.2f}")
    
    # Get summary
    print("\n4. Detection summary:")
    summary = detector.get_detection_summary()
    print(f"Monitors: {summary['monitors']['count']}")
    print(f"DVR windows: {summary['dvr_detection']['windows_found']}")
    print(f"Ready for capture: {summary['recommendations']['ready_for_capture']}")
    
    # Save configuration
    detector.save_configuration("demo_monitor_config.json")
    print("\nConfiguration saved to demo_monitor_config.json")
