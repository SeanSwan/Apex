"""
APEX AI ENGINE - DVR SCREEN CAPTURE SYSTEM
==========================================
Real-time multi-monitor screen capture engine for AI threat detection

This module provides high-performance screen capture capabilities specifically
designed to feed frames to AI threat detection models. Supports multiple monitors,
ROI selection, and optimized frame processing for real-time security analysis.

Key Features:
- Multi-monitor screen capture with configurable FPS
- ROI (Region of Interest) support for focusing on specific screen areas
- Frame preprocessing optimized for YOLOv8 and threat detection models
- Thread-safe operation for real-time AI integration
- Automatic monitor detection and resolution handling
- Memory-efficient frame buffering and processing
"""

import cv2
import numpy as np
import threading
import time
import logging
from typing import Dict, List, Optional, Tuple, Callable
from PIL import ImageGrab, Image
import queue
from dataclasses import dataclass
from enum import Enum
import win32gui
import win32con
import win32api

# Configure logging
logger = logging.getLogger(__name__)

class CaptureMode(Enum):
    """Screen capture modes for different use cases"""
    FULL_SCREEN = "full_screen"
    REGION_OF_INTEREST = "roi" 
    WINDOW_SPECIFIC = "window"
    MULTI_MONITOR = "multi_monitor"

@dataclass
class ScreenRegion:
    """Defines a region of interest on screen for capture"""
    x: int
    y: int
    width: int
    height: int
    monitor_id: int = 0
    name: str = "Region"
    
    def to_bbox(self) -> Tuple[int, int, int, int]:
        """Convert to bounding box format (left, top, right, bottom)"""
        return (self.x, self.y, self.x + self.width, self.y + self.height)

@dataclass
class MonitorInfo:
    """Information about available monitors"""
    monitor_id: int
    width: int
    height: int
    x_offset: int
    y_offset: int
    is_primary: bool
    device_name: str

class DVRScreenCapture:
    """
    High-performance screen capture engine for AI threat detection
    
    This class provides real-time screen capture capabilities optimized for
    feeding frames to AI models. Supports multiple monitors, ROI selection,
    and configurable capture parameters.
    """
    
    def __init__(self, 
                 target_fps: int = 15,
                 frame_queue_size: int = 30,
                 ai_frame_callback: Optional[Callable] = None):
        """
        Initialize the DVR screen capture system
        
        Args:
            target_fps: Target frames per second for capture (default: 15)
            frame_queue_size: Maximum frames to buffer (default: 30)
            ai_frame_callback: Callback function to send frames to AI system
        """
        self.target_fps = target_fps
        self.frame_interval = 1.0 / target_fps
        self.frame_queue_size = frame_queue_size
        self.ai_frame_callback = ai_frame_callback
        
        # Threading and state management
        self.is_capturing = False
        self.capture_thread = None
        self.frame_lock = threading.Lock()
        
        # Frame storage and processing
        self.frame_queue = queue.Queue(maxsize=frame_queue_size)
        self.latest_frame = None
        self.latest_timestamp = None
        
        # Monitor and region configuration
        self.monitors: List[MonitorInfo] = []
        self.capture_regions: List[ScreenRegion] = []
        self.capture_mode = CaptureMode.FULL_SCREEN
        self.active_monitor = 0
        
        # Performance monitoring
        self.frames_captured = 0
        self.frames_processed = 0
        self.last_fps_check = time.time()
        self.actual_fps = 0.0
        
        # Face detection integration (Phase 1 Enhancement)
        self.face_detection_enabled = False
        self.face_detection_callback: Optional[Callable] = None
        self.face_overlay_enabled = True
        
        # Initialize system
        self._detect_monitors()
        logger.info(f"DVR Screen Capture initialized - Target FPS: {target_fps}")
    
    # ==================================================================
    # FACE DETECTION INTEGRATION METHODS (PHASE 1 ENHANCEMENT)
    # ==================================================================
    
    def enable_face_detection(self, face_detection_callback: Optional[Callable] = None, 
                             overlay_enabled: bool = True) -> bool:
        """
        Enable face detection for captured frames
        
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
            
            logger.info("✅ Face detection enabled for screen capture")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to enable face detection: {e}")
            return False
    
    def disable_face_detection(self) -> bool:
        """
        Disable face detection for captured frames
        
        Returns:
            True if face detection disabled successfully
        """
        try:
            self.face_detection_enabled = False
            self.face_detection_callback = None
            
            logger.info("✅ Face detection disabled for screen capture")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to disable face detection: {e}")
            return False
    
    def process_frame_with_face_detection(self, frame: np.ndarray, 
                                        region_name: str = "screen") -> Tuple[np.ndarray, List[Dict]]:
        """
        Process captured frame with face detection if enabled
        
        Args:
            frame: Captured frame
            region_name: Name of the capture region
            
        Returns:
            Tuple of (processed_frame, face_detections)
        """
        try:
            if not self.face_detection_enabled or not self.face_detection_callback:
                return frame, []
            
            # Call face detection callback
            processed_frame, detections = self.face_detection_callback(frame, region_name)
            
            return processed_frame if self.face_overlay_enabled else frame, detections
            
        except Exception as e:
            logger.error(f"❌ Face detection processing error: {e}")
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
            'callback_registered': self.face_detection_callback is not None
        }
    
    def _detect_monitors(self) -> None:
        """Detect and catalog available monitors"""
        self.monitors.clear()
        
        def enum_windows_callback(hwnd, monitors_list):
            """Callback for enumerating monitors"""
            try:
                monitor_info = win32api.GetMonitorInfo(
                    win32api.MonitorFromWindow(hwnd, win32con.MONITOR_DEFAULTTONEAREST)
                )
                work_area = monitor_info['Work']
                monitor_area = monitor_info['Monitor']
                
                monitor = MonitorInfo(
                    monitor_id=len(monitors_list),
                    width=monitor_area[2] - monitor_area[0],
                    height=monitor_area[3] - monitor_area[1],
                    x_offset=monitor_area[0],
                    y_offset=monitor_area[1],
                    is_primary=monitor_info['Flags'] == win32con.MONITORINFOF_PRIMARY,
                    device_name=monitor_info.get('Device', f'Monitor_{len(monitors_list)}')
                )
                
                # Avoid duplicates
                if not any(m.x_offset == monitor.x_offset and m.y_offset == monitor.y_offset 
                          for m in monitors_list):
                    monitors_list.append(monitor)
                    
            except Exception as e:
                logger.warning(f"Error detecting monitor: {e}")
        
        # Simple fallback: get primary monitor info
        try:
            screen_width = win32api.GetSystemMetrics(win32con.SM_CXSCREEN)
            screen_height = win32api.GetSystemMetrics(win32con.SM_CYSCREEN)
            
            primary_monitor = MonitorInfo(
                monitor_id=0,
                width=screen_width,
                height=screen_height,
                x_offset=0,
                y_offset=0,
                is_primary=True,
                device_name="Primary Monitor"
            )
            self.monitors.append(primary_monitor)
            
            logger.info(f"Detected primary monitor: {screen_width}x{screen_height}")
            
        except Exception as e:
            logger.error(f"Failed to detect monitors: {e}")
            # Ultimate fallback
            self.monitors.append(MonitorInfo(0, 1920, 1080, 0, 0, True, "Default Monitor"))
    
    def add_capture_region(self, region: ScreenRegion) -> None:
        """Add a region of interest for capture"""
        self.capture_regions.append(region)
        logger.info(f"Added capture region: {region.name} at ({region.x}, {region.y}) {region.width}x{region.height}")
    
    def set_capture_mode(self, mode: CaptureMode, monitor_id: int = 0) -> None:
        """Set the capture mode and target monitor"""
        self.capture_mode = mode
        self.active_monitor = monitor_id
        logger.info(f"Capture mode set to: {mode.value} on monitor {monitor_id}")
    
    def start_capture(self) -> bool:
        """Start the screen capture thread"""
        if self.is_capturing:
            logger.warning("Capture already running")
            return False
        
        try:
            self.is_capturing = True
            self.capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
            self.capture_thread.start()
            logger.info("Screen capture started successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start capture: {e}")
            self.is_capturing = False
            return False
    
    def stop_capture(self) -> None:
        """Stop the screen capture thread"""
        if not self.is_capturing:
            return
        
        self.is_capturing = False
        if self.capture_thread and self.capture_thread.is_alive():
            self.capture_thread.join(timeout=2.0)
        
        logger.info("Screen capture stopped")
    
    def _capture_loop(self) -> None:
        """Main capture loop running in separate thread"""
        logger.info("Starting capture loop")
        last_capture_time = 0
        
        while self.is_capturing:
            try:
                current_time = time.time()
                
                # Maintain target FPS
                if current_time - last_capture_time < self.frame_interval:
                    time.sleep(0.001)  # Small sleep to prevent busy waiting
                    continue
                
                # Capture frame based on current mode
                frame = self._capture_frame()
                
                if frame is not None:
                    # Update performance metrics
                    self.frames_captured += 1
                    last_capture_time = current_time
                    
                    # Store latest frame with thread safety
                    with self.frame_lock:
                        self.latest_frame = frame
                        self.latest_timestamp = current_time
                    
                    # Add to frame queue (non-blocking)
                    try:
                        self.frame_queue.put_nowait((frame, current_time))
                    except queue.Full:
                        # Remove oldest frame and add new one
                        try:
                            self.frame_queue.get_nowait()
                            self.frame_queue.put_nowait((frame, current_time))
                        except queue.Empty:
                            pass
                    
                    # Send frame to AI system if callback is provided
                    if self.ai_frame_callback:
                        try:
                            self.ai_frame_callback(frame, current_time)
                            self.frames_processed += 1
                        except Exception as e:
                            logger.error(f"Error in AI frame callback: {e}")
                
                # Update FPS metrics
                self._update_fps_metrics()
                
            except Exception as e:
                logger.error(f"Error in capture loop: {e}")
                time.sleep(0.1)  # Prevent rapid error loops
    
    def _capture_frame(self) -> Optional[np.ndarray]:
        """Capture a single frame based on current configuration"""
        try:
            if self.capture_mode == CaptureMode.FULL_SCREEN:
                return self._capture_full_screen()
            elif self.capture_mode == CaptureMode.REGION_OF_INTEREST:
                return self._capture_roi()
            elif self.capture_mode == CaptureMode.WINDOW_SPECIFIC:
                return self._capture_window()
            elif self.capture_mode == CaptureMode.MULTI_MONITOR:
                return self._capture_multi_monitor()
            else:
                return self._capture_full_screen()
                
        except Exception as e:
            logger.error(f"Frame capture error: {e}")
            return None
    
    def _capture_full_screen(self) -> Optional[np.ndarray]:
        """Capture the full screen of the active monitor"""
        try:
            if self.active_monitor < len(self.monitors):
                monitor = self.monitors[self.active_monitor]
                bbox = (monitor.x_offset, monitor.y_offset,
                       monitor.x_offset + monitor.width,
                       monitor.y_offset + monitor.height)
            else:
                bbox = None  # Capture primary monitor
            
            # Capture screen using PIL
            screenshot = ImageGrab.grab(bbox=bbox)
            
            # Convert to OpenCV format (BGR)
            frame = cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2BGR)
            
            return frame
            
        except Exception as e:
            logger.error(f"Full screen capture error: {e}")
            return None
    
    def _capture_roi(self) -> Optional[np.ndarray]:
        """Capture specific regions of interest"""
        if not self.capture_regions:
            logger.warning("No capture regions defined, falling back to full screen")
            return self._capture_full_screen()
        
        try:
            # For demo, capture the first ROI
            # In production, this could capture multiple ROIs and composite them
            region = self.capture_regions[0]
            
            # Adjust coordinates based on monitor offset
            if region.monitor_id < len(self.monitors):
                monitor = self.monitors[region.monitor_id]
                x_offset = monitor.x_offset
                y_offset = monitor.y_offset
            else:
                x_offset = y_offset = 0
            
            bbox = (
                x_offset + region.x,
                y_offset + region.y,
                x_offset + region.x + region.width,
                y_offset + region.y + region.height
            )
            
            screenshot = ImageGrab.grab(bbox=bbox)
            frame = cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2BGR)
            
            return frame
            
        except Exception as e:
            logger.error(f"ROI capture error: {e}")
            return None
    
    def _capture_window(self) -> Optional[np.ndarray]:
        """Capture a specific window (placeholder for future implementation)"""
        # For now, fall back to full screen
        # Future: Implement specific window capture using win32gui
        return self._capture_full_screen()
    
    def _capture_multi_monitor(self) -> Optional[np.ndarray]:
        """Capture multiple monitors (placeholder for future implementation)"""
        # For now, fall back to full screen of primary monitor
        # Future: Implement multi-monitor composite capture
        return self._capture_full_screen()
    
    def _update_fps_metrics(self) -> None:
        """Update FPS performance metrics"""
        current_time = time.time()
        if current_time - self.last_fps_check >= 1.0:  # Update every second
            time_elapsed = current_time - self.last_fps_check
            self.actual_fps = self.frames_captured / time_elapsed if time_elapsed > 0 else 0
            
            # Reset counters
            self.frames_captured = 0
            self.last_fps_check = current_time
    
    def get_latest_frame(self) -> Optional[Tuple[np.ndarray, float]]:
        """Get the most recent captured frame with timestamp"""
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
    
    def get_performance_stats(self) -> Dict:
        """Get current performance statistics"""
        return {
            'target_fps': self.target_fps,
            'actual_fps': round(self.actual_fps, 2),
            'frames_captured': self.frames_captured,
            'frames_processed': self.frames_processed,
            'queue_size': self.frame_queue.qsize(),
            'is_capturing': self.is_capturing,
            'monitors_detected': len(self.monitors),
            'capture_mode': self.capture_mode.value,
            'active_monitor': self.active_monitor
        }
    
    def resize_frame_for_ai(self, frame: np.ndarray, target_size: Tuple[int, int] = (640, 640)) -> np.ndarray:
        """
        Resize frame for optimal AI processing
        
        Args:
            frame: Input frame
            target_size: Target size for AI model (default: 640x640 for YOLOv8)
        
        Returns:
            Resized frame optimized for AI processing
        """
        try:
            # Resize while maintaining aspect ratio
            h, w = frame.shape[:2]
            target_w, target_h = target_size
            
            # Calculate scaling factor to fit within target size
            scale = min(target_w / w, target_h / h)
            new_w, new_h = int(w * scale), int(h * scale)
            
            # Resize frame
            resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
            
            # Pad to exact target size if needed
            if new_w != target_w or new_h != target_h:
                # Create black canvas
                canvas = np.zeros((target_h, target_w, 3), dtype=np.uint8)
                
                # Center the resized image
                y_offset = (target_h - new_h) // 2
                x_offset = (target_w - new_w) // 2
                canvas[y_offset:y_offset + new_h, x_offset:x_offset + new_w] = resized
                
                return canvas
            
            return resized
            
        except Exception as e:
            logger.error(f"Frame resize error: {e}")
            return frame
    
    def __del__(self):
        """Cleanup when object is destroyed"""
        self.stop_capture()


# Utility functions for easy integration
def create_screen_capture_for_ai(ai_callback: Callable, fps: int = 15) -> DVRScreenCapture:
    """
    Create a screen capture instance optimized for AI threat detection
    
    Args:
        ai_callback: Function to call with each captured frame
        fps: Target frames per second
    
    Returns:
        Configured DVRScreenCapture instance
    """
    return DVRScreenCapture(
        target_fps=fps,
        frame_queue_size=30,
        ai_frame_callback=ai_callback
    )

def setup_demo_capture_regions() -> List[ScreenRegion]:
    """
    Create demo capture regions for testing
    
    Returns:
        List of demo screen regions
    """
    return [
        ScreenRegion(0, 0, 640, 480, 0, "Top-Left Camera"),
        ScreenRegion(640, 0, 640, 480, 0, "Top-Right Camera"),
        ScreenRegion(0, 480, 640, 480, 0, "Bottom-Left Camera"),
        ScreenRegion(640, 480, 640, 480, 0, "Bottom-Right Camera")
    ]


if __name__ == "__main__":
    """Demo and testing code"""
    
    def demo_ai_callback(frame, timestamp):
        """Demo callback function that simulates AI processing"""
        print(f"AI Processing frame at {timestamp:.3f} - Shape: {frame.shape}")
    
    # Create capture instance
    capture = create_screen_capture_for_ai(demo_ai_callback, fps=10)
    
    # Add demo regions
    demo_regions = setup_demo_capture_regions()
    for region in demo_regions:
        capture.add_capture_region(region)
    
    try:
        print("Starting screen capture demo...")
        print("Available monitors:")
        for i, monitor in enumerate(capture.monitors):
            print(f"  Monitor {i}: {monitor.width}x{monitor.height} at ({monitor.x_offset}, {monitor.y_offset})")
        
        # Start capture
        capture.start_capture()
        
        # Run for 10 seconds
        for i in range(10):
            time.sleep(1)
            stats = capture.get_performance_stats()
            print(f"Stats: FPS={stats['actual_fps']}, Queue={stats['queue_size']}, Captured={stats['frames_captured']}")
        
        print("Demo completed successfully!")
        
    except KeyboardInterrupt:
        print("Demo interrupted by user")
    finally:
        capture.stop_capture()
        print("Capture stopped")
