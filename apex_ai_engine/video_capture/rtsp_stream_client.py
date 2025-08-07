"""
APEX AI ENGINE - RTSP STREAM CLIENT
==================================
High-performance RTSP stream processing for direct camera feed analysis

This module provides robust RTSP (Real Time Streaming Protocol) client
capabilities for connecting directly to IP cameras and NVR systems.
Designed for optimal AI threat detection with automatic failover,
connection recovery, and frame optimization.

Key Features:
- Multi-stream RTSP connection management with authentication
- Automatic connection recovery and failover mechanisms
- Frame extraction optimized for AI processing (YOLOv8 compatible)
- Concurrent stream handling for multiple camera feeds
- Bandwidth optimization and adaptive quality control
- Integration with screen capture fallback system
- Comprehensive error handling and logging
"""

import cv2
import numpy as np
import threading
import time
import queue
import logging
import asyncio
import aiohttp
from typing import Dict, List, Optional, Tuple, Callable, Union
from dataclasses import dataclass
from urllib.parse import urlparse
import re
import socket
from concurrent.futures import ThreadPoolExecutor
import json

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class RTSPStreamConfig:
    """Configuration for an RTSP stream connection"""
    stream_id: str
    rtsp_url: str
    username: Optional[str] = None
    password: Optional[str] = None
    camera_name: str = "Unknown Camera"
    location: str = "Unknown Location"
    
    # Connection settings
    timeout_seconds: int = 10
    retry_attempts: int = 3
    retry_delay: float = 2.0
    
    # Stream settings
    target_fps: int = 15
    max_resolution: Tuple[int, int] = (1920, 1080)
    buffer_size: int = 3
    
    # AI processing settings
    ai_enabled: bool = True
    confidence_threshold: float = 0.5
    threat_models: List[str] = None
    
    # Face detection settings (Phase 1 Enhancement)
    face_detection_enabled: bool = True
    face_overlay_enabled: bool = True
    face_confidence_threshold: float = 0.7
    
    def __post_init__(self):
        if self.threat_models is None:
            self.threat_models = ["all"]
    
    @property
    def connection_url(self) -> str:
        """Get RTSP URL with authentication if provided"""
        if self.username and self.password:
            parsed = urlparse(self.rtsp_url)
            auth_url = f"{parsed.scheme}://{self.username}:{self.password}@{parsed.netloc}{parsed.path}"
            if parsed.query:
                auth_url += f"?{parsed.query}"
            return auth_url
        return self.rtsp_url

class RTSPStreamClient:
    """
    High-performance RTSP stream client for individual camera feeds
    
    Handles connection, frame extraction, and stream management for a single
    RTSP camera feed with automatic recovery and AI integration.
    """
    
    def __init__(self, 
                 config: RTSPStreamConfig,
                 ai_frame_callback: Optional[Callable] = None):
        self.config = config
        self.ai_frame_callback = ai_frame_callback
        
        # Connection state
        self.is_connected = False
        self.is_streaming = False
        self.connection_attempts = 0
        self.last_connection_time = 0
        
        # OpenCV video capture
        self.cap = None
        self.stream_thread = None
        self.frame_lock = threading.Lock()
        
        # Frame management
        self.frame_queue = queue.Queue(maxsize=config.buffer_size)
        self.latest_frame = None
        self.latest_timestamp = None
        self.frame_count = 0
        
        # Performance monitoring
        self.fps_counter = 0
        self.last_fps_time = time.time()
        self.actual_fps = 0.0
        self.dropped_frames = 0
        
        # Error tracking
        self.last_error = None
        self.error_count = 0
        
        # Face detection integration (Phase 1 Enhancement)
        self.face_detection_enabled = config.face_detection_enabled
        self.face_detection_callback: Optional[Callable] = None
        self.face_overlay_enabled = config.face_overlay_enabled
        
        logger.info(f"RTSP Client initialized for {config.camera_name} ({config.stream_id})")
    
    # ==================================================================
    # FACE DETECTION INTEGRATION METHODS (PHASE 1 ENHANCEMENT)
    # ==================================================================
    
    def enable_face_detection(self, face_detection_callback: Optional[Callable] = None, 
                             overlay_enabled: bool = True) -> bool:
        """
        Enable face detection for RTSP stream frames
        
        Args:
            face_detection_callback: Callback function for face detection processing
            overlay_enabled: Whether to apply face detection overlays
            
        Returns:
            True if face detection enabled successfully
        """
        try:
            self.face_detection_enabled = True
            self.face_detection_callback = face_detection_callback
            self.face_overlay_enabled = overlay_enabled
            
            logger.info(f"✅ Face detection enabled for RTSP stream: {self.config.camera_name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to enable face detection for RTSP stream: {e}")
            return False
    
    def disable_face_detection(self) -> bool:
        """
        Disable face detection for RTSP stream frames
        
        Returns:
            True if face detection disabled successfully
        """
        try:
            self.face_detection_enabled = False
            self.face_detection_callback = None
            
            logger.info(f"✅ Face detection disabled for RTSP stream: {self.config.camera_name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to disable face detection: {e}")
            return False
    
    def process_frame_with_face_detection(self, frame: np.ndarray) -> Tuple[np.ndarray, List[Dict]]:
        """
        Process RTSP frame with face detection if enabled
        
        Args:
            frame: RTSP video frame
            
        Returns:
            Tuple of (processed_frame, face_detections)
        """
        try:
            if not self.face_detection_enabled or not self.face_detection_callback:
                return frame, []
            
            # Call face detection callback with stream identifier
            processed_frame, detections = self.face_detection_callback(frame, self.config.stream_id)
            
            return processed_frame if self.face_overlay_enabled else frame, detections
            
        except Exception as e:
            logger.error(f"❌ Face detection processing error for RTSP stream: {e}")
            return frame, []
    
    def get_face_detection_status(self) -> Dict:
        """
        Get face detection status and configuration
        
        Returns:
            Face detection status dictionary
        """
        return {
            'enabled': self.face_detection_enabled,
            'overlay_enabled': self.face_overlay_enabled,
            'callback_registered': self.face_detection_callback is not None,
            'stream_id': self.config.stream_id,
            'camera_name': self.config.camera_name
        }
    
    def connect(self) -> bool:
        """Establish connection to RTSP stream"""
        if self.is_connected:
            logger.warning(f"Stream {self.config.stream_id} already connected")
            return True
        
        try:
            self.connection_attempts += 1
            logger.info(f"Connecting to RTSP stream: {self.config.camera_name} (attempt {self.connection_attempts})")
            
            # Create OpenCV VideoCapture with RTSP URL
            self.cap = cv2.VideoCapture(self.config.connection_url)
            
            if not self.cap.isOpened():
                raise RuntimeError("Failed to open RTSP stream")
            
            # Configure capture settings for optimal performance
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, self.config.buffer_size)
            self.cap.set(cv2.CAP_PROP_FPS, self.config.target_fps)
            
            # Try to set resolution if specified
            if self.config.max_resolution:
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.config.max_resolution[0])
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config.max_resolution[1])
            
            # Test connection by reading a frame
            ret, frame = self.cap.read()
            if not ret or frame is None:
                raise RuntimeError("Failed to read initial frame from RTSP stream")
            
            # Connection successful
            self.is_connected = True
            self.last_connection_time = time.time()
            self.connection_attempts = 0
            self.error_count = 0
            
            # Get actual stream properties
            width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = self.cap.get(cv2.CAP_PROP_FPS)
            
            logger.info(f"RTSP connection established: {width}x{height} @ {fps:.1f} FPS")
            return True
            
        except Exception as e:
            self.last_error = str(e)
            self.error_count += 1
            logger.error(f"Failed to connect to RTSP stream {self.config.stream_id}: {e}")
            
            # Clean up failed connection
            if self.cap:
                self.cap.release()
                self.cap = None
            
            self.is_connected = False
            return False
    
    def disconnect(self) -> None:
        """Disconnect from RTSP stream"""
        try:
            self.stop_streaming()
            
            if self.cap:
                self.cap.release()
                self.cap = None
            
            self.is_connected = False
            logger.info(f"Disconnected from RTSP stream: {self.config.stream_id}")
            
        except Exception as e:
            logger.error(f"Error disconnecting RTSP stream: {e}")
    
    def start_streaming(self) -> bool:
        """Start streaming frames from RTSP source"""
        if not self.is_connected:
            if not self.connect():
                return False
        
        if self.is_streaming:
            logger.warning(f"Stream {self.config.stream_id} already streaming")
            return True
        
        try:
            self.is_streaming = True
            self.stream_thread = threading.Thread(target=self._streaming_loop, daemon=True)
            self.stream_thread.start()
            
            logger.info(f"Started streaming from {self.config.camera_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start streaming: {e}")
            self.is_streaming = False
            return False
    
    def stop_streaming(self) -> None:
        """Stop streaming frames"""
        if not self.is_streaming:
            return
        
        self.is_streaming = False
        
        if self.stream_thread and self.stream_thread.is_alive():
            self.stream_thread.join(timeout=2.0)
        
        logger.info(f"Stopped streaming from {self.config.camera_name}")
    
    def _streaming_loop(self) -> None:
        """Main streaming loop (runs in separate thread)"""
        logger.info(f"Starting streaming loop for {self.config.stream_id}")
        consecutive_failures = 0
        max_consecutive_failures = 10
        
        while self.is_streaming:
            try:
                # Check if connection is still valid
                if not self.is_connected or not self.cap or not self.cap.isOpened():
                    if not self._attempt_reconnection():
                        time.sleep(self.config.retry_delay)
                        continue
                
                # Read frame from stream
                ret, frame = self.cap.read()
                
                if not ret or frame is None:
                    consecutive_failures += 1
                    if consecutive_failures >= max_consecutive_failures:
                        logger.warning(f"Too many consecutive failures, attempting reconnection")
                        self.is_connected = False
                        consecutive_failures = 0
                    continue
                
                # Reset failure counter on successful read
                consecutive_failures = 0
                
                # Process frame
                current_time = time.time()
                self.frame_count += 1
                
                # Update latest frame with thread safety
                with self.frame_lock:
                    self.latest_frame = frame.copy()
                    self.latest_timestamp = current_time
                
                # Add to frame queue (non-blocking)
                try:
                    self.frame_queue.put_nowait((frame.copy(), current_time))
                except queue.Full:
                    # Remove oldest frame and add new one
                    try:
                        self.frame_queue.get_nowait()
                        self.frame_queue.put_nowait((frame.copy(), current_time))
                        self.dropped_frames += 1
                    except queue.Empty:
                        pass
                
                # Send to AI system if callback provided
                if self.ai_frame_callback and self.config.ai_enabled:
                    try:
                        self.ai_frame_callback(frame, current_time, self.config.stream_id)
                    except Exception as e:
                        logger.error(f"Error in AI callback for {self.config.stream_id}: {e}")
                
                # Update performance metrics
                self._update_performance_metrics()
                
                # Frame rate control
                time.sleep(1.0 / self.config.target_fps)
                
            except Exception as e:
                logger.error(f"Error in streaming loop for {self.config.stream_id}: {e}")
                consecutive_failures += 1
                time.sleep(0.1)
    
    def _attempt_reconnection(self) -> bool:
        """Attempt to reconnect to RTSP stream"""
        if self.connection_attempts >= self.config.retry_attempts:
            logger.error(f"Max reconnection attempts reached for {self.config.stream_id}")
            return False
        
        logger.info(f"Attempting reconnection for {self.config.stream_id}")
        self.disconnect()
        time.sleep(self.config.retry_delay)
        
        return self.connect()
    
    def _update_performance_metrics(self) -> None:
        """Update FPS and performance metrics"""
        current_time = time.time()
        self.fps_counter += 1
        
        if current_time - self.last_fps_time >= 1.0:
            self.actual_fps = self.fps_counter / (current_time - self.last_fps_time)
            self.fps_counter = 0
            self.last_fps_time = current_time
    
    def get_latest_frame(self) -> Optional[Tuple[np.ndarray, float]]:
        """Get the most recent frame with timestamp"""
        with self.frame_lock:
            if self.latest_frame is not None:
                return self.latest_frame.copy(), self.latest_timestamp
            return None
    
    def get_frame_from_queue(self, timeout: float = 0.1) -> Optional[Tuple[np.ndarray, float]]:
        """Get a frame from the processing queue"""
        try:
            return self.frame_queue.get(timeout=timeout)
        except queue.Empty:
            return None
    
    def get_stream_info(self) -> Dict:
        """Get comprehensive stream information"""
        info = {
            'stream_id': self.config.stream_id,
            'camera_name': self.config.camera_name,
            'location': self.config.location,
            'rtsp_url': self.config.rtsp_url,
            'is_connected': self.is_connected,
            'is_streaming': self.is_streaming,
            'actual_fps': round(self.actual_fps, 2),
            'target_fps': self.config.target_fps,
            'frame_count': self.frame_count,
            'dropped_frames': self.dropped_frames,
            'connection_attempts': self.connection_attempts,
            'error_count': self.error_count,
            'last_error': self.last_error,
            'queue_size': self.frame_queue.qsize(),
            'ai_enabled': self.config.ai_enabled
        }
        
        # Add stream properties if connected
        if self.is_connected and self.cap:
            try:
                info.update({
                    'resolution': (
                        int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                        int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                    ),
                    'stream_fps': self.cap.get(cv2.CAP_PROP_FPS)
                })
            except Exception:
                pass
        
        return info

class RTSPStreamManager:
    """
    Multi-stream RTSP management system
    
    Manages multiple RTSP camera feeds with centralized control,
    load balancing, and AI integration coordination.
    """
    
    def __init__(self, ai_frame_callback: Optional[Callable] = None):
        self.ai_frame_callback = ai_frame_callback
        self.streams: Dict[str, RTSPStreamClient] = {}
        self.is_running = False
        
        # Performance monitoring
        self.total_frames_processed = 0
        self.start_time = None
        
        logger.info("RTSP Stream Manager initialized")
    
    def add_stream(self, config: RTSPStreamConfig) -> bool:
        """Add a new RTSP stream"""
        if config.stream_id in self.streams:
            logger.warning(f"Stream {config.stream_id} already exists")
            return False
        
        try:
            stream_client = RTSPStreamClient(config, self._ai_callback_wrapper)
            self.streams[config.stream_id] = stream_client
            
            logger.info(f"Added RTSP stream: {config.camera_name} ({config.stream_id})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add RTSP stream {config.stream_id}: {e}")
            return False
    
    def remove_stream(self, stream_id: str) -> bool:
        """Remove an RTSP stream"""
        if stream_id not in self.streams:
            logger.warning(f"Stream {stream_id} not found")
            return False
        
        try:
            stream = self.streams[stream_id]
            stream.stop_streaming()
            stream.disconnect()
            del self.streams[stream_id]
            
            logger.info(f"Removed RTSP stream: {stream_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to remove RTSP stream {stream_id}: {e}")
            return False
    
    def start_all_streams(self) -> Dict[str, bool]:
        """Start streaming for all configured streams"""
        results = {}
        
        for stream_id, stream in self.streams.items():
            try:
                success = stream.start_streaming()
                results[stream_id] = success
                
                if success:
                    logger.info(f"Started stream: {stream_id}")
                else:
                    logger.error(f"Failed to start stream: {stream_id}")
                    
            except Exception as e:
                logger.error(f"Error starting stream {stream_id}: {e}")
                results[stream_id] = False
        
        self.is_running = True
        self.start_time = time.time()
        
        return results
    
    def stop_all_streams(self) -> None:
        """Stop all active streams"""
        for stream_id, stream in self.streams.items():
            try:
                stream.stop_streaming()
                logger.info(f"Stopped stream: {stream_id}")
            except Exception as e:
                logger.error(f"Error stopping stream {stream_id}: {e}")
        
        self.is_running = False
    
    def _ai_callback_wrapper(self, frame: np.ndarray, timestamp: float, stream_id: str) -> None:
        """Wrapper for AI callback that adds stream identification"""
        self.total_frames_processed += 1
        
        if self.ai_frame_callback:
            try:
                # Add stream metadata to frame processing
                self.ai_frame_callback(frame, timestamp, {'stream_id': stream_id})
            except Exception as e:
                logger.error(f"Error in AI callback wrapper for {stream_id}: {e}")
    
    def get_stream_status(self, stream_id: Optional[str] = None) -> Dict:
        """Get status of one or all streams"""
        if stream_id:
            if stream_id in self.streams:
                return self.streams[stream_id].get_stream_info()
            else:
                return {'error': f'Stream {stream_id} not found'}
        
        # Return status of all streams
        status = {
            'manager_running': self.is_running,
            'total_streams': len(self.streams),
            'active_streams': sum(1 for s in self.streams.values() if s.is_streaming),
            'connected_streams': sum(1 for s in self.streams.values() if s.is_connected),
            'total_frames_processed': self.total_frames_processed,
            'streams': {}
        }
        
        for stream_id, stream in self.streams.items():
            status['streams'][stream_id] = stream.get_stream_info()
        
        return status
    
    def test_connection(self, stream_id: str) -> Dict:
        """Test connection to a specific stream"""
        if stream_id not in self.streams:
            return {'success': False, 'error': f'Stream {stream_id} not found'}
        
        stream = self.streams[stream_id]
        
        try:
            # Temporarily connect and test
            was_connected = stream.is_connected
            
            if not was_connected:
                success = stream.connect()
                if success:
                    # Test frame read
                    frame_result = stream.get_latest_frame()
                    stream.disconnect()
                    
                    return {
                        'success': True,
                        'can_connect': True,
                        'can_read_frames': frame_result is not None,
                        'stream_info': stream.get_stream_info()
                    }
                else:
                    return {
                        'success': False,
                        'can_connect': False,
                        'error': stream.last_error or 'Unknown connection error'
                    }
            else:
                # Already connected, just test frame read
                frame_result = stream.get_latest_frame()
                return {
                    'success': True,
                    'can_connect': True,
                    'can_read_frames': frame_result is not None,
                    'stream_info': stream.get_stream_info()
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_performance_stats(self) -> Dict:
        """Get comprehensive performance statistics"""
        stats = {
            'manager': {
                'is_running': self.is_running,
                'uptime': time.time() - self.start_time if self.start_time else 0,
                'total_streams': len(self.streams),
                'total_frames_processed': self.total_frames_processed
            },
            'streams': {},
            'aggregated': {
                'total_fps': 0,
                'total_dropped_frames': 0,
                'total_errors': 0,
                'connected_count': 0,
                'streaming_count': 0
            }
        }
        
        for stream_id, stream in self.streams.items():
            stream_info = stream.get_stream_info()
            stats['streams'][stream_id] = stream_info
            
            # Aggregate statistics
            stats['aggregated']['total_fps'] += stream_info.get('actual_fps', 0)
            stats['aggregated']['total_dropped_frames'] += stream_info.get('dropped_frames', 0)
            stats['aggregated']['total_errors'] += stream_info.get('error_count', 0)
            
            if stream_info.get('is_connected'):
                stats['aggregated']['connected_count'] += 1
            if stream_info.get('is_streaming'):
                stats['aggregated']['streaming_count'] += 1
        
        return stats


# Utility functions for easy RTSP setup
def create_rtsp_config(rtsp_url: str, 
                      camera_name: str,
                      username: Optional[str] = None,
                      password: Optional[str] = None,
                      **kwargs) -> RTSPStreamConfig:
    """Create RTSP configuration with sensible defaults"""
    return RTSPStreamConfig(
        stream_id=f"camera_{camera_name.lower().replace(' ', '_')}",
        rtsp_url=rtsp_url,
        username=username,
        password=password,
        camera_name=camera_name,
        **kwargs
    )

def create_demo_rtsp_streams() -> List[RTSPStreamConfig]:
    """Create demo RTSP stream configurations for testing"""
    return [
        RTSPStreamConfig(
            stream_id="front_entrance",
            rtsp_url="rtsp://demo.camera:554/stream1",
            camera_name="Front Entrance",
            location="Main Building Entrance",
            username="admin",
            password="password"
        ),
        RTSPStreamConfig(
            stream_id="parking_lot",
            rtsp_url="rtsp://demo.camera:554/stream2", 
            camera_name="Parking Lot",
            location="West Parking Area",
            username="admin",
            password="password"
        ),
        RTSPStreamConfig(
            stream_id="lobby_area",
            rtsp_url="rtsp://demo.camera:554/stream3",
            camera_name="Lobby Area", 
            location="Main Lobby",
            username="admin",
            password="password"
        )
    ]


if __name__ == "__main__":
    """Demo and testing code"""
    
    def demo_ai_callback(frame, timestamp, metadata):
        """Demo AI processing callback"""
        stream_id = metadata.get('stream_id', 'unknown')
        print(f"Processing frame from {stream_id} at {timestamp:.3f} - Shape: {frame.shape}")
    
    print("APEX AI RTSP Stream Client Demo")
    print("=" * 40)
    
    # Create stream manager
    manager = RTSPStreamManager(demo_ai_callback)
    
    # Add demo streams (these won't actually connect without real RTSP URLs)
    demo_configs = create_demo_rtsp_streams()
    
    for config in demo_configs:
        success = manager.add_stream(config)
        print(f"Added stream {config.camera_name}: {'Success' if success else 'Failed'}")
    
    # Show manager status
    status = manager.get_stream_status()
    print(f"\nManager Status:")
    print(f"Total streams: {status['total_streams']}")
    print(f"Active streams: {status['active_streams']}")
    
    print("\nDemo completed!")
    print("Note: Actual RTSP connections require valid camera URLs")
