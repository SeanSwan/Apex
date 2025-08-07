"""
APEX AI ENGINE - VIDEO CAPTURE MODULE
====================================
Real-time video input and capture system for AI threat detection

This module provides comprehensive video capture capabilities including:
- Multi-monitor screen capture for DVR systems
- RTSP stream processing for direct camera feeds  
- Screen region management for focused monitoring
- Automatic monitor detection and configuration
- Centralized video input coordination

Components:
- dvr_screen_capture: Core screen capture engine
- screen_region_manager: ROI selection and management
- dvr_monitor_detector: Automatic monitor detection  
- rtsp_stream_client: Direct RTSP feed processing
- video_input_manager: Central coordination system
"""

from .dvr_screen_capture import (
    DVRScreenCapture,
    ScreenRegion, 
    MonitorInfo,
    CaptureMode,
    create_screen_capture_for_ai,
    setup_demo_capture_regions
)

from .screen_region_manager import (
    ScreenRegionManager,
    RegionConfig,
    RegionSelector,
    create_demo_regions_for_dvr
)

from .dvr_monitor_detector import (
    DVRMonitorDetector,
    MonitorConfiguration,
    DVRWindowInfo,
    DVRSystemLayout,
    quick_monitor_detection,
    full_dvr_system_detection
)

from .rtsp_stream_client import (
    RTSPStreamClient,
    RTSPStreamManager,
    RTSPStreamConfig,
    create_rtsp_config,
    create_demo_rtsp_streams
)

from .video_input_manager import (
    VideoInputManager,
    VideoSourceConfig,
    VideoSourceType,
    VideoSourcePriority,
    create_screen_capture_source,
    create_rtsp_source
)

__all__ = [
    # Screen Capture
    'DVRScreenCapture',
    'ScreenRegion', 
    'MonitorInfo', 
    'CaptureMode',
    'create_screen_capture_for_ai',
    'setup_demo_capture_regions',
    
    # Region Management
    'ScreenRegionManager',
    'RegionConfig',
    'RegionSelector',
    'create_demo_regions_for_dvr',
    
    # Monitor Detection
    'DVRMonitorDetector',
    'MonitorConfiguration',
    'DVRWindowInfo', 
    'DVRSystemLayout',
    'quick_monitor_detection',
    'full_dvr_system_detection',
    
    # RTSP Streaming
    'RTSPStreamClient',
    'RTSPStreamManager',
    'RTSPStreamConfig',
    'create_rtsp_config',
    'create_demo_rtsp_streams',
    
    # Video Input Management
    'VideoInputManager',
    'VideoSourceConfig',
    'VideoSourceType',
    'VideoSourcePriority',
    'create_screen_capture_source',
    'create_rtsp_source'
]

__version__ = '1.0.0'
