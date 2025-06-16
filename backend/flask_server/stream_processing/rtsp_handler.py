# APEX AI STREAM PROCESSING - RTSP HANDLING
# Master Prompt v29.1-APEX Implementation
# Phase 2A: Real-time Stream Processing

import cv2
import numpy as np
import threading
import time
import queue
from typing import Dict, List, Optional, Callable
import logging
from dataclasses import dataclass
from datetime import datetime
import base64
import io
from PIL import Image

logger = logging.getLogger(__name__)

@dataclass
class StreamFrame:
    """Represents a frame from an RTSP stream"""
    camera_id: str
    frame_id: int
    timestamp: datetime
    frame_data: np.ndarray
    width: int
    height: int
    channels: int

@dataclass
class StreamConfig:
    """Configuration for RTSP stream"""
    camera_id: str
    rtsp_url: str
    fps_target: int = 30
    resolution: tuple = (1920, 1080)
    buffer_size: int = 10
    auto_reconnect: bool = True
    detection_enabled: bool = True
    recording_enabled: bool = False

class RTSPStreamProcessor:
    """RTSP stream processor for real-time AI inference"""
    
    def __init__(self, config: StreamConfig, detection_callback: Optional[Callable] = None):
        """Initialize RTSP stream processor"""
        self.config = config
        self.detection_callback = detection_callback
        
        # Stream state
        self.is_active = False
        self.is_connected = False
        self.capture = None
        self.processing_thread = None
        self.frame_queue = queue.Queue(maxsize=config.buffer_size)
        
        # Performance metrics
        self.frames_processed = 0
        self.frames_dropped = 0
        self.last_frame_time = None
        self.fps_actual = 0.0
        self.connection_attempts = 0
        self.last_error = None
        
        # Frame processing
        self.frame_interval = 1.0 / config.fps_target
        self.last_process_time = 0
        
        logger.info(f"RTSP processor initialized for {config.camera_id}")
    
    def start_stream(self) -> bool:
        """Start RTSP stream processing"""
        try:
            logger.info(f"Starting RTSP stream for {self.config.camera_id}")
            
            # Initialize video capture
            self.capture = cv2.VideoCapture(self.config.rtsp_url)
            
            # Set buffer size to reduce latency
            self.capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            # Set resolution if supported
            if self.config.resolution:
                self.capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.config.resolution[0])
                self.capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config.resolution[1])
            
            # Test connection
            ret, frame = self.capture.read()
            if not ret:
                raise Exception("Failed to read initial frame from RTSP stream")
            
            self.is_connected = True
            self.is_active = True
            
            # Start processing thread
            self.processing_thread = threading.Thread(target=self._processing_loop, daemon=True)
            self.processing_thread.start()
            
            logger.info(f"RTSP stream started successfully for {self.config.camera_id}")
            return True
            
        except Exception as e:
            self.last_error = str(e)
            logger.error(f"Failed to start RTSP stream for {self.config.camera_id}: {e}")
            self.cleanup()
            return False
    
    def stop_stream(self):
        """Stop RTSP stream processing"""
        logger.info(f"Stopping RTSP stream for {self.config.camera_id}")
        self.is_active = False
        
        if self.processing_thread and self.processing_thread.is_alive():
            self.processing_thread.join(timeout=5.0)
        
        self.cleanup()
        logger.info(f"RTSP stream stopped for {self.config.camera_id}")
    
    def cleanup(self):
        """Cleanup resources"""
        self.is_connected = False
        
        if self.capture:
            self.capture.release()
            self.capture = None
        
        # Clear frame queue
        while not self.frame_queue.empty():
            try:
                self.frame_queue.get_nowait()
            except queue.Empty:
                break
    
    def _processing_loop(self):
        """Main processing loop for RTSP stream"""
        frame_id = 0
        last_fps_check = time.time()
        fps_frame_count = 0
        
        while self.is_active and self.is_connected:
            try:
                # Read frame from stream
                ret, frame = self.capture.read()
                
                if not ret:
                    logger.warning(f"Failed to read frame from {self.config.camera_id}")
                    if self.config.auto_reconnect:
                        self._attempt_reconnect()
                    else:
                        break
                    continue
                
                current_time = time.time()
                
                # Frame rate control
                if current_time - self.last_process_time < self.frame_interval:
                    continue
                
                self.last_process_time = current_time
                frame_id += 1
                
                # Create stream frame object
                stream_frame = StreamFrame(
                    camera_id=self.config.camera_id,
                    frame_id=frame_id,
                    timestamp=datetime.now(),
                    frame_data=frame.copy(),
                    width=frame.shape[1],
                    height=frame.shape[0],
                    channels=frame.shape[2] if len(frame.shape) > 2 else 1
                )
                
                # Add to processing queue
                try:
                    self.frame_queue.put_nowait(stream_frame)
                except queue.Full:
                    # Drop oldest frame if queue is full
                    try:
                        self.frame_queue.get_nowait()
                        self.frames_dropped += 1
                    except queue.Empty:
                        pass
                    self.frame_queue.put_nowait(stream_frame)
                
                self.frames_processed += 1
                fps_frame_count += 1
                
                # Calculate FPS
                if current_time - last_fps_check >= 1.0:
                    self.fps_actual = fps_frame_count / (current_time - last_fps_check)
                    fps_frame_count = 0
                    last_fps_check = current_time
                
                # Trigger detection if enabled and callback provided
                if self.config.detection_enabled and self.detection_callback:
                    try:
                        self.detection_callback(stream_frame)
                    except Exception as e:
                        logger.error(f"Error in detection callback: {e}")
                
                self.last_frame_time = current_time
                
            except Exception as e:
                logger.error(f"Error in processing loop for {self.config.camera_id}: {e}")
                if self.config.auto_reconnect:
                    self._attempt_reconnect()
                else:
                    break
        
        logger.info(f"Processing loop ended for {self.config.camera_id}")
    
    def _attempt_reconnect(self):
        """Attempt to reconnect to RTSP stream"""
        self.connection_attempts += 1
        logger.info(f"Attempting to reconnect to {self.config.camera_id} (attempt {self.connection_attempts})")
        
        # Cleanup current connection
        if self.capture:
            self.capture.release()
        
        # Wait before reconnecting
        time.sleep(2.0)
        
        try:
            # Reinitialize capture
            self.capture = cv2.VideoCapture(self.config.rtsp_url)
            self.capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            # Test connection
            ret, frame = self.capture.read()
            if ret:
                self.is_connected = True
                logger.info(f"Reconnected successfully to {self.config.camera_id}")
            else:
                self.is_connected = False
                logger.warning(f"Reconnection failed for {self.config.camera_id}")
                
        except Exception as e:
            self.is_connected = False
            logger.error(f"Reconnection error for {self.config.camera_id}: {e}")
    
    def get_latest_frame(self) -> Optional[StreamFrame]:
        """Get the latest frame from the queue"""
        try:
            return self.frame_queue.get_nowait()
        except queue.Empty:
            return None
    
    def get_frame_as_base64(self, frame: Optional[StreamFrame] = None) -> Optional[str]:
        """Convert frame to base64 for web display"""
        if frame is None:
            frame = self.get_latest_frame()
        
        if frame is None:
            return None
        
        try:
            # Encode frame as JPEG
            _, buffer = cv2.imencode('.jpg', frame.frame_data, [cv2.IMWRITE_JPEG_QUALITY, 80])
            
            # Convert to base64
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            return f"data:image/jpeg;base64,{img_base64}"
            
        except Exception as e:
            logger.error(f"Error converting frame to base64: {e}")
            return None
    
    def get_stream_stats(self) -> Dict:
        """Get stream processing statistics"""
        return {
            "camera_id": self.config.camera_id,
            "is_active": self.is_active,
            "is_connected": self.is_connected,
            "frames_processed": self.frames_processed,
            "frames_dropped": self.frames_dropped,
            "fps_actual": round(self.fps_actual, 2),
            "fps_target": self.config.fps_target,
            "connection_attempts": self.connection_attempts,
            "queue_size": self.frame_queue.qsize(),
            "last_frame_time": self.last_frame_time.isoformat() if self.last_frame_time else None,
            "last_error": self.last_error
        }

class StreamManager:
    """Manage multiple RTSP streams"""
    
    def __init__(self):
        """Initialize stream manager"""
        self.streams = {}  # camera_id -> RTSPStreamProcessor
        self.detection_callbacks = {}  # camera_id -> callback function
        
        logger.info("Stream manager initialized")
    
    def add_stream(self, config: StreamConfig, detection_callback: Optional[Callable] = None) -> bool:
        """Add new RTSP stream"""
        try:
            if config.camera_id in self.streams:
                logger.warning(f"Stream {config.camera_id} already exists, stopping existing stream")
                self.remove_stream(config.camera_id)
            
            # Create stream processor
            processor = RTSPStreamProcessor(config, detection_callback)
            
            # Start stream
            if processor.start_stream():
                self.streams[config.camera_id] = processor
                if detection_callback:
                    self.detection_callbacks[config.camera_id] = detection_callback
                
                logger.info(f"Added stream {config.camera_id} successfully")
                return True
            else:
                logger.error(f"Failed to start stream {config.camera_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error adding stream {config.camera_id}: {e}")
            return False
    
    def remove_stream(self, camera_id: str) -> bool:
        """Remove RTSP stream"""
        try:
            if camera_id in self.streams:
                self.streams[camera_id].stop_stream()
                del self.streams[camera_id]
                
                if camera_id in self.detection_callbacks:
                    del self.detection_callbacks[camera_id]
                
                logger.info(f"Removed stream {camera_id}")
                return True
            else:
                logger.warning(f"Stream {camera_id} not found")
                return False
                
        except Exception as e:
            logger.error(f"Error removing stream {camera_id}: {e}")
            return False
    
    def get_stream(self, camera_id: str) -> Optional[RTSPStreamProcessor]:
        """Get stream processor for camera"""
        return self.streams.get(camera_id)
    
    def get_all_streams(self) -> Dict[str, RTSPStreamProcessor]:
        """Get all active streams"""
        return self.streams.copy()
    
    def get_stream_stats(self, camera_id: Optional[str] = None) -> Dict:
        """Get statistics for one or all streams"""
        if camera_id:
            stream = self.streams.get(camera_id)
            return stream.get_stream_stats() if stream else {}
        else:
            return {
                cam_id: stream.get_stream_stats() 
                for cam_id, stream in self.streams.items()
            }
    
    def stop_all_streams(self):
        """Stop all active streams"""
        logger.info("Stopping all streams")
        
        for camera_id, stream in self.streams.items():
            try:
                stream.stop_stream()
                logger.info(f"Stopped stream {camera_id}")
            except Exception as e:
                logger.error(f"Error stopping stream {camera_id}: {e}")
        
        self.streams.clear()
        self.detection_callbacks.clear()
        
        logger.info("All streams stopped")

# Utility functions for demo/testing
def create_demo_stream_config(camera_id: str, demo_video_path: Optional[str] = None) -> StreamConfig:
    """Create demo stream configuration"""
    # For demo, we can use a local video file or webcam
    rtsp_url = demo_video_path or 0  # 0 for default webcam
    
    return StreamConfig(
        camera_id=camera_id,
        rtsp_url=rtsp_url,
        fps_target=15,  # Lower FPS for demo
        resolution=(640, 480),  # Lower resolution for demo
        buffer_size=5,
        auto_reconnect=True,
        detection_enabled=True,
        recording_enabled=False
    )

# Export main classes
__all__ = ['RTSPStreamProcessor', 'StreamManager', 'StreamFrame', 'StreamConfig', 'create_demo_stream_config']
