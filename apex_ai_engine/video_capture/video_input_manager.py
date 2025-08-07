"""
APEX AI ENGINE - VIDEO INPUT MANAGER
====================================
Central video source coordination and failover management system

This module serves as the master coordinator for all video input sources,
including screen capture, RTSP streams, and fallback mechanisms. It provides
unified video feed management with intelligent failover, load balancing, and
AI integration for comprehensive security monitoring.

Key Features:
- Unified management of screen capture and RTSP video sources
- Intelligent failover between RTSP and screen capture
- Load balancing and performance optimization across sources
- Centralized AI frame distribution and processing coordination
- Real-time source health monitoring and automatic recovery
- Dynamic source prioritization and quality adaptation
- Integration with existing AI threat detection pipeline
"""

import cv2
import numpy as np
import threading
import time
import queue
import logging
import json
from typing import Dict, List, Optional, Tuple, Callable, Union, Any
from dataclasses import dataclass, field
from enum import Enum
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Import our video capture modules
try:
    from .dvr_screen_capture import DVRScreenCapture, ScreenRegion, CaptureMode
    from .rtsp_stream_client import RTSPStreamManager, RTSPStreamConfig
    from .screen_region_manager import ScreenRegionManager, RegionConfig
    from .dvr_monitor_detector import DVRMonitorDetector
except ImportError:
    # Fallback for absolute imports when run as script
    from dvr_screen_capture import DVRScreenCapture, ScreenRegion, CaptureMode
    from rtsp_stream_client import RTSPStreamManager, RTSPStreamConfig
    from screen_region_manager import ScreenRegionManager, RegionConfig
    from dvr_monitor_detector import DVRMonitorDetector

# Face detection components - disabled for Python 3.13 compatibility
# try:
#     from ..face_recognition_engine import FaceRecognitionEngine, create_face_recognition_engine
#     from ..face_detection_overlay import FaceDetectionOverlay, FaceOverlayConfig, create_face_overlay_system
#     FACE_RECOGNITION_AVAILABLE = True
# except ImportError:
#     FACE_RECOGNITION_AVAILABLE = False

# Configure logging
logger = logging.getLogger(__name__)

class VideoSourceType(Enum):
    """Types of video sources supported"""
    SCREEN_CAPTURE = "screen_capture"
    RTSP_STREAM = "rtsp_stream"
    HYBRID = "hybrid"  # Both screen capture and RTSP

class VideoSourcePriority(Enum):
    """Priority levels for video sources"""
    PRIMARY = "primary"
    SECONDARY = "secondary"
    FALLBACK = "fallback"

@dataclass
class VideoSourceConfig:
    """Configuration for a video source"""
    source_id: str
    source_type: VideoSourceType
    priority: VideoSourcePriority
    name: str
    location: str
    
    # Source-specific configuration
    rtsp_config: Optional[RTSPStreamConfig] = None
    screen_region: Optional[ScreenRegion] = None
    monitor_id: int = 0
    
    # Quality and performance settings
    target_fps: int = 15
    max_resolution: Tuple[int, int] = (1920, 1080)
    ai_enabled: bool = True
    
    # Failover settings
    enable_failover: bool = True
    failover_delay: float = 5.0
    health_check_interval: float = 2.0
    
    # AI processing settings
    threat_models: List[str] = field(default_factory=lambda: ["all"])
    confidence_threshold: float = 0.5
    
    # Face detection settings (Phase 1 Enhancement)
    face_detection_enabled: bool = True
    face_overlay_enabled: bool = True
    face_confidence_threshold: float = 0.7
    face_quality_threshold: float = 0.6

@dataclass
class VideoSourceStatus:
    """Status information for a video source"""
    source_id: str
    is_active: bool
    is_healthy: bool
    current_fps: float
    frames_processed: int
    errors_count: int
    last_frame_time: float
    source_type: VideoSourceType
    priority: VideoSourcePriority
    failover_active: bool = False
    last_error: Optional[str] = None

class VideoInputManager:
    """
    Master video input coordination system
    
    Manages all video sources (screen capture and RTSP) with intelligent
    failover, load balancing, and centralized AI integration.
    """
    
    def __init__(self, 
                 ai_frame_callback: Optional[Callable] = None,
                 config_file: str = "video_input_config.json",
                 db_config: Optional[Dict] = None,
                 face_detection_enabled: bool = True):
        
        self.ai_frame_callback = ai_frame_callback
        self.config_file = config_file
        self.face_detection_enabled = face_detection_enabled
        
        # Video source management
        self.video_sources: Dict[str, VideoSourceConfig] = {}
        self.source_status: Dict[str, VideoSourceStatus] = {}
        
        # Active video processors
        self.screen_capture: Optional[DVRScreenCapture] = None
        self.rtsp_manager: Optional[RTSPStreamManager] = None
        self.region_manager: Optional[ScreenRegionManager] = None
        self.monitor_detector: Optional[DVRMonitorDetector] = None
        
        # Face detection components (Phase 1 Enhancement)
        self.face_engine: Optional[FaceRecognitionEngine] = None
        self.face_overlay_system: Optional[FaceDetectionOverlay] = None
        self.face_detection_callbacks: Dict[str, Callable] = {}
        
        # Processing and coordination
        self.is_running = False
        self.coordinator_thread = None
        self.frame_processing_queue = queue.Queue(maxsize=100)
        self.processing_executor = ThreadPoolExecutor(max_workers=4)
        
        # Performance monitoring
        self.total_frames_processed = 0
        self.start_time = None
        self.performance_stats = {}
        
        # Health monitoring
        self.health_check_thread = None
        self.source_health_lock = threading.Lock()
        
        # Initialize components
        self._initialize_components(db_config)
        
        logger.info("Video Input Manager with Face Detection initialized")
    
    def _initialize_components(self, db_config: Optional[Dict] = None) -> None:
        """Initialize video processing components"""
        try:
            # Initialize monitor detector
            self.monitor_detector = DVRMonitorDetector()
            
            # Initialize region manager
            self.region_manager = ScreenRegionManager()
            
            # Initialize RTSP manager with callback
            self.rtsp_manager = RTSPStreamManager(self._rtsp_frame_callback)
            
            # Initialize screen capture (will be configured when sources are added)
            self.screen_capture = DVRScreenCapture(
                target_fps=15,
                ai_frame_callback=self._screen_capture_frame_callback
            )
            
            # Initialize face detection components (Phase 1 Enhancement)
            if self.face_detection_enabled and db_config:
                try:
                    self.face_engine = create_face_recognition_engine(db_config)
                    
                    # Create face overlay system with default config
                    face_overlay_config = FaceOverlayConfig(
                        show_bounding_box=True,
                        show_person_name=True,
                        show_confidence=True,
                        show_person_type_badge=True,
                        show_quality_indicator=False
                    )
                    
                    self.face_overlay_system = create_face_overlay_system(
                        self.face_engine, face_overlay_config
                    )
                    
                    logger.info("✅ Face detection components initialized")
                    
                except Exception as e:
                    logger.error(f"❌ Face detection initialization failed: {e}")
                    self.face_detection_enabled = False
            
            logger.info("Video processing components initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize components: {e}")
    
    # ==================================================================
    # FACE DETECTION INTEGRATION METHODS (PHASE 1 ENHANCEMENT)
    # ==================================================================
    
    def enable_face_detection_for_source(self, source_id: str, 
                                        overlay_enabled: bool = True) -> bool:
        """
        Enable face detection for a specific video source
        
        Args:
            source_id: Video source identifier
            overlay_enabled: Whether to show visual overlays
            
        Returns:
            True if face detection enabled successfully
        """
        try:
            if not self.face_detection_enabled or not self.face_overlay_system:
                logger.warning("Face detection system not available")
                return False
            
            if source_id not in self.video_sources:
                logger.error(f"Source {source_id} not found")
                return False
            
            # Register source with face overlay system
            config = self.video_sources[source_id]
            stream_config = {
                'source_type': config.source_type.value,
                'name': config.name,
                'location': config.location,
                'overlay_enabled': overlay_enabled
            }
            
            self.face_overlay_system.register_stream(source_id, stream_config)
            
            # Update source configuration
            config.face_detection_enabled = True
            config.face_overlay_enabled = overlay_enabled
            
            logger.info(f"✅ Face detection enabled for source: {config.name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to enable face detection for {source_id}: {e}")
            return False
    
    def register_face_detection_callback(self, callback_name: str, 
                                       callback_func: Callable) -> bool:
        """
        Register callback function for face detection events
        
        Args:
            callback_name: Unique name for the callback
            callback_func: Function to call when face is detected
            
        Returns:
            True if callback registered successfully
        """
        try:
            self.face_detection_callbacks[callback_name] = callback_func
            logger.info(f"✅ Face detection callback registered: {callback_name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to register callback {callback_name}: {e}")
            return False
    
    def process_frame_with_face_detection(self, frame: np.ndarray, source_id: str) -> Tuple[np.ndarray, List[Dict]]:
        """
        Process frame with face detection and overlay generation
        
        Args:
            frame: Input video frame
            source_id: Source identifier
            
        Returns:
            Tuple of (processed_frame, face_detections)
        """
        try:
            if not self.face_detection_enabled or not self.face_overlay_system:
                return frame, []
            
            if source_id not in self.video_sources:
                return frame, []
            
            config = self.video_sources[source_id]
            
            # Skip face detection if disabled for this source
            if not config.face_detection_enabled:
                return frame, []
            
            # Process frame with face detection
            processed_frame, detections = self.face_overlay_system.process_stream_frame(
                frame, source_id, config.face_overlay_enabled
            )
            
            # Trigger callbacks for face detections
            if detections:
                self._trigger_face_detection_callbacks(detections, source_id)
            
            return processed_frame, detections
            
        except Exception as e:
            logger.error(f"❌ Face detection processing error for {source_id}: {e}")
            return frame, []
    
    def _trigger_face_detection_callbacks(self, detections: List[Dict], source_id: str):
        """
        Trigger registered callbacks for face detections
        
        Args:
            detections: List of face detection results
            source_id: Source identifier
        """
        try:
            for detection in detections:
                # Create alert if recommended
                if detection.get('alert_recommended', False):
                    alert = self.face_overlay_system.create_face_detection_alert(detection, source_id)
                    
                    # Trigger callbacks
                    for callback_name, callback_func in self.face_detection_callbacks.items():
                        try:
                            callback_func(alert, detection, source_id)
                        except Exception as e:
                            logger.error(f"❌ Callback {callback_name} failed: {e}")
            
        except Exception as e:
            logger.error(f"❌ Failed to trigger face detection callbacks: {e}")
    
    def get_face_detection_stats(self) -> Dict:
        """
        Get face detection performance statistics
        
        Returns:
            Face detection statistics dictionary
        """
        try:
            if not self.face_detection_enabled or not self.face_overlay_system:
                return {'face_detection_enabled': False}
            
            # Get face engine stats
            face_engine_stats = self.face_engine.get_performance_stats()
            
            # Get overlay system stats
            overlay_stats = self.face_overlay_system.get_overlay_performance_stats()
            
            return {
                'face_detection_enabled': True,
                'face_engine_stats': face_engine_stats,
                'overlay_stats': overlay_stats,
                'enabled_sources': [
                    source_id for source_id, config in self.video_sources.items()
                    if config.face_detection_enabled
                ]
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get face detection stats: {e}")
            return {'error': str(e)}
    
    def update_face_overlay_config(self, new_config: FaceOverlayConfig) -> bool:
        """
        Update face overlay configuration
        
        Args:
            new_config: New overlay configuration
            
        Returns:
            True if update successful
        """
        try:
            if not self.face_detection_enabled or not self.face_overlay_system:
                return False
            
            self.face_overlay_system.update_overlay_config(new_config)
            logger.info("✅ Face overlay configuration updated")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to update face overlay config: {e}")
            return False
    
    def add_video_source(self, config: VideoSourceConfig) -> bool:
        """Add a new video source to the manager"""
        if config.source_id in self.video_sources:
            logger.warning(f"Video source {config.source_id} already exists")
            return False
        
        try:
            # Validate configuration
            if not self._validate_source_config(config):
                return False
            
            # Configure specific source type
            if config.source_type == VideoSourceType.RTSP_STREAM:
                if not config.rtsp_config:
                    logger.error(f"RTSP configuration required for source {config.source_id}")
                    return False
                
                # Add to RTSP manager
                success = self.rtsp_manager.add_stream(config.rtsp_config)
                if not success:
                    return False
            
            elif config.source_type == VideoSourceType.SCREEN_CAPTURE:
                if config.screen_region:
                    # Add region to screen capture
                    self.screen_capture.add_capture_region(config.screen_region)
                
                # Set monitor if specified
                if config.monitor_id >= 0:
                    self.screen_capture.set_capture_mode(CaptureMode.FULL_SCREEN, config.monitor_id)
            
            # Add to sources and create status
            self.video_sources[config.source_id] = config
            self.source_status[config.source_id] = VideoSourceStatus(
                source_id=config.source_id,
                is_active=False,
                is_healthy=True,
                current_fps=0.0,
                frames_processed=0,
                errors_count=0,
                last_frame_time=0.0,
                source_type=config.source_type,
                priority=config.priority
            )
            
            logger.info(f"Added video source: {config.name} ({config.source_id})")
            
            # Enable face detection if configured
            if (self.face_detection_enabled and 
                config.face_detection_enabled and 
                self.face_overlay_system):
                self.enable_face_detection_for_source(config.source_id, config.face_overlay_enabled)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to add video source {config.source_id}: {e}")
            return False
    
    def remove_video_source(self, source_id: str) -> bool:
        """Remove a video source"""
        if source_id not in self.video_sources:
            logger.warning(f"Video source {source_id} not found")
            return False
        
        try:
            config = self.video_sources[source_id]
            
            # Stop source if active
            self.stop_source(source_id)
            
            # Remove from specific managers
            if config.source_type == VideoSourceType.RTSP_STREAM and config.rtsp_config:
                self.rtsp_manager.remove_stream(config.rtsp_config.stream_id)
            
            # Remove from collections
            del self.video_sources[source_id]
            if source_id in self.source_status:
                del self.source_status[source_id]
            
            logger.info(f"Removed video source: {source_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to remove video source {source_id}: {e}")
            return False
    
    def start_all_sources(self) -> Dict[str, bool]:
        """Start all configured video sources"""
        results = {}
        
        # Sort sources by priority
        sorted_sources = sorted(
            self.video_sources.values(),
            key=lambda x: ['primary', 'secondary', 'fallback'].index(x.priority.value)
        )
        
        for config in sorted_sources:
            try:
                success = self.start_source(config.source_id)
                results[config.source_id] = success
                
                if success:
                    logger.info(f"Started video source: {config.name}")
                else:
                    logger.error(f"Failed to start video source: {config.name}")
                    
            except Exception as e:
                logger.error(f"Error starting source {config.source_id}: {e}")
                results[config.source_id] = False
        
        # Start coordination and health monitoring
        self.is_running = True
        self.start_time = time.time()
        self._start_coordination()
        
        return results
    
    def start_source(self, source_id: str) -> bool:
        """Start a specific video source"""
        if source_id not in self.video_sources:
            logger.error(f"Source {source_id} not found")
            return False
        
        config = self.video_sources[source_id]
        status = self.source_status[source_id]
        
        try:
            if config.source_type == VideoSourceType.RTSP_STREAM:
                # Start RTSP stream
                if config.rtsp_config:
                    results = self.rtsp_manager.start_all_streams()
                    success = results.get(config.rtsp_config.stream_id, False)
                else:
                    success = False
            
            elif config.source_type == VideoSourceType.SCREEN_CAPTURE:
                # Configure and start screen capture
                if config.screen_region:
                    self.screen_capture.set_capture_mode(CaptureMode.REGION_OF_INTEREST)
                else:
                    self.screen_capture.set_capture_mode(CaptureMode.FULL_SCREEN, config.monitor_id)
                
                success = self.screen_capture.start_capture()
            
            else:
                logger.error(f"Unsupported source type: {config.source_type}")
                success = False
            
            # Update status
            with self.source_health_lock:
                status.is_active = success
                status.is_healthy = success
                if not success:
                    status.errors_count += 1
            
            return success
            
        except Exception as e:
            logger.error(f"Error starting source {source_id}: {e}")
            with self.source_health_lock:
                status.errors_count += 1
                status.last_error = str(e)
            return False
    
    def stop_source(self, source_id: str) -> bool:
        """Stop a specific video source"""
        if source_id not in self.video_sources:
            return False
        
        config = self.video_sources[source_id]
        status = self.source_status[source_id]
        
        try:
            if config.source_type == VideoSourceType.RTSP_STREAM:
                self.rtsp_manager.stop_all_streams()
            elif config.source_type == VideoSourceType.SCREEN_CAPTURE:
                self.screen_capture.stop_capture()
            
            with self.source_health_lock:
                status.is_active = False
            
            logger.info(f"Stopped video source: {config.name}")
            return True
            
        except Exception as e:
            logger.error(f"Error stopping source {source_id}: {e}")
            return False
    
    def stop_all_sources(self) -> None:
        """Stop all video sources and coordination"""
        self.is_running = False
        
        # Stop coordination thread
        if self.coordinator_thread and self.coordinator_thread.is_alive():
            self.coordinator_thread.join(timeout=2.0)
        
        # Stop health monitoring
        if self.health_check_thread and self.health_check_thread.is_alive():
            self.health_check_thread.join(timeout=2.0)
        
        # Stop all sources
        for source_id in self.video_sources:
            self.stop_source(source_id)
        
        logger.info("Stopped all video sources")
    
    def _start_coordination(self) -> None:
        """Start coordination and health monitoring threads"""
        try:
            # Start frame coordination thread
            self.coordinator_thread = threading.Thread(target=self._coordination_loop, daemon=True)
            self.coordinator_thread.start()
            
            # Start health monitoring thread
            self.health_check_thread = threading.Thread(target=self._health_monitoring_loop, daemon=True)
            self.health_check_thread.start()
            
            logger.info("Started coordination and health monitoring")
            
        except Exception as e:
            logger.error(f"Failed to start coordination: {e}")
    
    def _coordination_loop(self) -> None:
        """Main coordination loop for frame processing"""
        logger.info("Starting video coordination loop")
        
        while self.is_running:
            try:
                # Process queued frames
                try:
                    frame_data = self.frame_processing_queue.get(timeout=0.1)
                    self._process_frame(frame_data)
                except queue.Empty:
                    continue
                
                # Update performance statistics
                self._update_performance_stats()
                
            except Exception as e:
                logger.error(f"Error in coordination loop: {e}")
                time.sleep(0.1)
    
    def _health_monitoring_loop(self) -> None:
        """Health monitoring and failover management loop"""
        logger.info("Starting health monitoring loop")
        
        while self.is_running:
            try:
                self._check_source_health()
                self._handle_failovers()
                time.sleep(2.0)  # Check every 2 seconds
                
            except Exception as e:
                logger.error(f"Error in health monitoring: {e}")
                time.sleep(1.0)
    
    def _rtsp_frame_callback(self, frame: np.ndarray, timestamp: float, metadata: Dict) -> None:
        """Callback for RTSP frame processing"""
        try:
            frame_data = {
                'frame': frame,
                'timestamp': timestamp,
                'source_type': VideoSourceType.RTSP_STREAM,
                'metadata': metadata
            }
            
            # Add to processing queue
            try:
                self.frame_processing_queue.put_nowait(frame_data)
            except queue.Full:
                # Drop oldest frame
                try:
                    self.frame_processing_queue.get_nowait()
                    self.frame_processing_queue.put_nowait(frame_data)
                except queue.Empty:
                    pass
                    
        except Exception as e:
            logger.error(f"Error in RTSP frame callback: {e}")
    
    def _screen_capture_frame_callback(self, frame: np.ndarray, timestamp: float) -> None:
        """Callback for screen capture frame processing"""
        try:
            frame_data = {
                'frame': frame,
                'timestamp': timestamp,
                'source_type': VideoSourceType.SCREEN_CAPTURE,
                'metadata': {'monitor_id': self.screen_capture.active_monitor}
            }
            
            # Add to processing queue
            try:
                self.frame_processing_queue.put_nowait(frame_data)
            except queue.Full:
                # Drop oldest frame
                try:
                    self.frame_processing_queue.get_nowait()
                    self.frame_processing_queue.put_nowait(frame_data)
                except queue.Empty:
                    pass
                    
        except Exception as e:
            logger.error(f"Error in screen capture frame callback: {e}")
    
    def _process_frame(self, frame_data: Dict) -> None:
        """Process individual frame through AI pipeline"""
        try:
            frame = frame_data['frame']
            timestamp = frame_data['timestamp']
            source_type = frame_data['source_type']
            metadata = frame_data['metadata']
            
            # Update frame count
            self.total_frames_processed += 1
            
            # Send to AI system if callback provided
            if self.ai_frame_callback:
                # Enhance metadata with source information
                enhanced_metadata = {
                    'source_type': source_type.value,
                    'timestamp': timestamp,
                    'frame_number': self.total_frames_processed,
                    **metadata
                }
                
                self.ai_frame_callback(frame, timestamp, enhanced_metadata)
            
        except Exception as e:
            logger.error(f"Error processing frame: {e}")
    
    def _check_source_health(self) -> None:
        """Check health of all video sources"""
        current_time = time.time()
        
        with self.source_health_lock:
            for source_id, status in self.source_status.items():
                if not status.is_active:
                    continue
                
                config = self.video_sources[source_id]
                
                # Check if source is receiving frames
                if current_time - status.last_frame_time > config.health_check_interval * 2:
                    status.is_healthy = False
                    logger.warning(f"Source {source_id} appears unhealthy - no recent frames")
                else:
                    status.is_healthy = True
    
    def _handle_failovers(self) -> None:
        """Handle failover logic between sources"""
        # Group sources by priority
        primary_sources = [s for s in self.video_sources.values() if s.priority == VideoSourcePriority.PRIMARY]
        secondary_sources = [s for s in self.video_sources.values() if s.priority == VideoSourcePriority.SECONDARY]
        fallback_sources = [s for s in self.video_sources.values() if s.priority == VideoSourcePriority.FALLBACK]
        
        # Check if primary sources are healthy
        unhealthy_primary = []
        for source in primary_sources:
            status = self.source_status.get(source.source_id)
            if status and not status.is_healthy and source.enable_failover:
                unhealthy_primary.append(source)
        
        # Activate fallback sources if needed
        for primary_source in unhealthy_primary:
            self._activate_failover(primary_source, secondary_sources + fallback_sources)
    
    def _activate_failover(self, failed_source: VideoSourceConfig, backup_sources: List[VideoSourceConfig]) -> None:
        """Activate failover for a failed source"""
        logger.warning(f"Activating failover for source: {failed_source.name}")
        
        # Find best backup source
        for backup in backup_sources:
            backup_status = self.source_status.get(backup.source_id)
            if backup_status and backup_status.is_healthy:
                # Start backup source if not already active
                if not backup_status.is_active:
                    success = self.start_source(backup.source_id)
                    if success:
                        backup_status.failover_active = True
                        logger.info(f"Failover activated: {backup.name} replacing {failed_source.name}")
                        break
    
    def _validate_source_config(self, config: VideoSourceConfig) -> bool:
        """Validate video source configuration"""
        if not config.source_id or not config.name:
            logger.error("Source ID and name are required")
            return False
        
        if config.source_type == VideoSourceType.RTSP_STREAM and not config.rtsp_config:
            logger.error("RTSP configuration required for RTSP source")
            return False
        
        if config.target_fps <= 0 or config.target_fps > 60:
            logger.error("Target FPS must be between 1 and 60")
            return False
        
        return True
    
    def _update_performance_stats(self) -> None:
        """Update performance statistics"""
        current_time = time.time()
        uptime = current_time - self.start_time if self.start_time else 0
        
        self.performance_stats = {
            'uptime': uptime,
            'total_frames_processed': self.total_frames_processed,
            'average_fps': self.total_frames_processed / uptime if uptime > 0 else 0,
            'queue_size': self.frame_processing_queue.qsize(),
            'active_sources': sum(1 for s in self.source_status.values() if s.is_active),
            'healthy_sources': sum(1 for s in self.source_status.values() if s.is_healthy),
            'last_update': current_time
        }
    
    def get_system_status(self) -> Dict:
        """Get comprehensive system status"""
        return {
            'manager': {
                'is_running': self.is_running,
                'total_sources': len(self.video_sources),
                'performance': self.performance_stats
            },
            'sources': {
                source_id: {
                    'config': {
                        'name': config.name,
                        'type': config.source_type.value,
                        'priority': config.priority.value,
                        'location': config.location
                    },
                    'status': {
                        'is_active': status.is_active,
                        'is_healthy': status.is_healthy,
                        'current_fps': status.current_fps,
                        'frames_processed': status.frames_processed,
                        'errors_count': status.errors_count,
                        'failover_active': status.failover_active,
                        'last_error': status.last_error
                    }
                }
                for source_id, config in self.video_sources.items()
                for status in [self.source_status[source_id]]
            },
            'components': {
                'screen_capture': self.screen_capture.get_performance_stats() if self.screen_capture else None,
                'rtsp_manager': self.rtsp_manager.get_performance_stats() if self.rtsp_manager else None
            }
        }
    
    def save_configuration(self) -> bool:
        """Save current configuration to file"""
        try:
            config_data = {
                'video_sources': {
                    source_id: {
                        'source_id': config.source_id,
                        'source_type': config.source_type.value,
                        'priority': config.priority.value,
                        'name': config.name,
                        'location': config.location,
                        'target_fps': config.target_fps,
                        'max_resolution': config.max_resolution,
                        'ai_enabled': config.ai_enabled,
                        'enable_failover': config.enable_failover,
                        'threat_models': config.threat_models,
                        'confidence_threshold': config.confidence_threshold
                    }
                    for source_id, config in self.video_sources.items()
                },
                'saved_timestamp': time.time()
            }
            
            with open(self.config_file, 'w') as f:
                json.dump(config_data, f, indent=2)
            
            logger.info(f"Configuration saved to {self.config_file}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save configuration: {e}")
            return False


# Utility functions for easy setup
def create_screen_capture_source(name: str, 
                                location: str,
                                monitor_id: int = 0,
                                region: Optional[ScreenRegion] = None,
                                priority: VideoSourcePriority = VideoSourcePriority.PRIMARY) -> VideoSourceConfig:
    """Create a screen capture video source configuration"""
    return VideoSourceConfig(
        source_id=f"screen_{name.lower().replace(' ', '_')}",
        source_type=VideoSourceType.SCREEN_CAPTURE,
        priority=priority,
        name=name,
        location=location,
        screen_region=region,
        monitor_id=monitor_id
    )

def create_rtsp_source(name: str,
                      location: str, 
                      rtsp_url: str,
                      username: Optional[str] = None,
                      password: Optional[str] = None,
                      priority: VideoSourcePriority = VideoSourcePriority.PRIMARY) -> VideoSourceConfig:
    """Create an RTSP video source configuration"""
    
    rtsp_config = RTSPStreamConfig(
        stream_id=f"rtsp_{name.lower().replace(' ', '_')}",
        rtsp_url=rtsp_url,
        username=username,
        password=password,
        camera_name=name,
        location=location
    )
    
    return VideoSourceConfig(
        source_id=f"rtsp_{name.lower().replace(' ', '_')}",
        source_type=VideoSourceType.RTSP_STREAM,
        priority=priority,
        name=name,
        location=location,
        rtsp_config=rtsp_config
    )


if __name__ == "__main__":
    """Demo and testing code"""
    
    def demo_ai_callback(frame, timestamp, metadata):
        """Demo AI processing callback"""
        print(f"AI Processing: {metadata.get('source_type', 'unknown')} frame at {timestamp:.3f} - Shape: {frame.shape}")
    
    print("APEX AI Video Input Manager Demo")
    print("=" * 50)
    
    # Create video input manager
    manager = VideoInputManager(demo_ai_callback)
    
    # Add demo sources
    screen_source = create_screen_capture_source(
        "Main Monitor DVR",
        "Security Office Monitor 1",
        monitor_id=0,
        priority=VideoSourcePriority.PRIMARY
    )
    
    rtsp_source = create_rtsp_source(
        "Front Entrance Camera",
        "Main Building Entrance",
        "rtsp://demo.camera:554/stream1",
        username="admin",
        password="password",
        priority=VideoSourcePriority.SECONDARY
    )
    
    # Add sources to manager
    manager.add_video_source(screen_source)
    manager.add_video_source(rtsp_source)
    
    # Show system status
    status = manager.get_system_status()
    print(f"Total sources configured: {status['manager']['total_sources']}")
    
    for source_id, source_info in status['sources'].items():
        print(f"  {source_info['config']['name']}: {source_info['config']['type']} ({source_info['config']['priority']})")
    
    print("\nDemo completed!")
    print("Note: Use start_all_sources() to begin video processing")
