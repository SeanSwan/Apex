"""
APEX AI ENGINE - FACE DETECTION OVERLAY SYSTEM
==============================================
Real-time face detection overlay processing for video streams

This module provides real-time face detection overlay generation,
stream integration, and performance optimization for multiple video sources.
Integrates seamlessly with the existing face recognition engine.

Key Features:
- Real-time face detection overlays for video streams
- Person type visual indicators and badges
- Performance optimized for multiple simultaneous cameras
- Integration with existing face recognition database
- Alert generation and overlay coordination
- Stream-specific performance tracking
"""

import cv2
import numpy as np
import logging
import time
import json
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Callable, Any
from dataclasses import dataclass
from enum import Enum
import threading
import queue
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Import face recognition engine
from .face_recognition_engine import FaceRecognitionEngine

# Configure logging
logger = logging.getLogger(__name__)

class OverlayStyle(Enum):
    """Face detection overlay styles"""
    MINIMAL = "minimal"
    STANDARD = "standard"
    DETAILED = "detailed"
    SECURITY = "security"

@dataclass
class FaceOverlayConfig:
    """Configuration for face detection overlays"""
    show_bounding_box: bool = True
    show_person_name: bool = True
    show_confidence: bool = True
    show_person_type_badge: bool = True
    show_quality_indicator: bool = False
    overlay_style: OverlayStyle = OverlayStyle.STANDARD
    font_scale: float = 0.7
    box_thickness: int = 2
    text_thickness: int = 1
    background_alpha: float = 0.3

class FaceDetectionOverlay:
    """
    Real-time face detection overlay system for video streams
    """
    
    def __init__(self, face_engine: FaceRecognitionEngine, config: FaceOverlayConfig = None):
        """
        Initialize face detection overlay system
        
        Args:
            face_engine: Face recognition engine instance
            config: Overlay configuration
        """
        self.face_engine = face_engine
        self.config = config or FaceOverlayConfig()
        
        # Stream tracking
        self.active_streams = {}
        self.stream_stats = {}
        
        # Color schemes for person types
        self.person_type_colors = {
            'resident': {'primary': (0, 255, 0), 'secondary': (0, 200, 0), 'text': (255, 255, 255)},
            'staff': {'primary': (255, 128, 0), 'secondary': (255, 100, 0), 'text': (255, 255, 255)},
            'worker': {'primary': (255, 165, 0), 'secondary': (255, 140, 0), 'text': (0, 0, 0)},
            'visitor': {'primary': (255, 255, 0), 'secondary': (255, 200, 0), 'text': (0, 0, 0)},
            'contractor': {'primary': (255, 140, 0), 'secondary': (255, 120, 0), 'text': (255, 255, 255)},
            'vip': {'primary': (255, 0, 255), 'secondary': (200, 0, 200), 'text': (255, 255, 255)},
            'blacklist': {'primary': (0, 0, 255), 'secondary': (0, 0, 200), 'text': (255, 255, 255)},
            'unknown': {'primary': (0, 0, 255), 'secondary': (0, 0, 180), 'text': (255, 255, 255)}
        }
        
        # Performance tracking
        self.performance_stats = {
            'total_frames_processed': 0,
            'total_faces_detected': 0,
            'avg_processing_time': 0.0,
            'overlay_generation_time': 0.0
        }
        
        logger.info("🎨 Face Detection Overlay System initialized")
    
    def process_stream_frame(self, frame: np.ndarray, stream_id: str, 
                           generate_overlay: bool = True) -> Tuple[np.ndarray, List[Dict]]:
        """
        Process video frame with face detection and overlay generation
        
        Args:
            frame: Input video frame
            stream_id: Unique stream identifier
            generate_overlay: Whether to generate visual overlay
            
        Returns:
            Tuple of (overlaid_frame, detection_results)
        """
        start_time = time.time()
        
        try:
            # Register stream if not already registered
            if stream_id not in self.active_streams:
                self.register_stream(stream_id)
            
            # Perform face detection using the face recognition engine
            detections = self.face_engine.process_frame_for_faces(frame, stream_id)
            
            # Generate overlay if requested
            overlaid_frame = frame.copy()
            if generate_overlay and detections:
                overlaid_frame = self.generate_frame_overlay(frame, detections)
            
            # Update performance statistics
            processing_time = time.time() - start_time
            self.update_stream_performance(stream_id, processing_time, len(detections))
            
            return overlaid_frame, detections
            
        except Exception as e:
            logger.error(f"❌ Stream processing error for {stream_id}: {e}")
            return frame, []
    
    def generate_frame_overlay(self, frame: np.ndarray, detections: List[Dict]) -> np.ndarray:
        """
        Generate visual overlay for face detections on frame
        
        Args:
            frame: Original video frame
            detections: List of face detection results
            
        Returns:
            Frame with overlay applied
        """
        overlay_start = time.time()
        
        try:
            overlay_frame = frame.copy()
            
            for detection in detections:
                overlay_frame = self.draw_face_overlay(overlay_frame, detection)
            
            # Update overlay generation time
            overlay_time = time.time() - overlay_start
            self.performance_stats['overlay_generation_time'] = (
                0.9 * self.performance_stats['overlay_generation_time'] + 0.1 * overlay_time
            )
            
            return overlay_frame
            
        except Exception as e:
            logger.error(f"❌ Overlay generation error: {e}")
            return frame
    
    def draw_face_overlay(self, frame: np.ndarray, detection: Dict) -> np.ndarray:
        """
        Draw individual face detection overlay
        
        Args:
            frame: Video frame to draw on
            detection: Face detection result
            
        Returns:
            Frame with face overlay drawn
        """
        try:
            face_location = detection['face_location']
            person_type = detection['person_type']
            person_name = detection['person_name']
            confidence = detection['confidence']
            is_match = detection['is_match']
            alert_recommended = detection['alert_recommended']
            
            # Get colors for person type
            colors = self.person_type_colors.get(person_type, self.person_type_colors['unknown'])
            
            # Coordinates
            left = face_location['left']
            top = face_location['top']
            right = face_location['right']
            bottom = face_location['bottom']
            
            # Adjust thickness based on alert status
            box_thickness = self.config.box_thickness + (2 if alert_recommended else 0)
            
            # Draw bounding box
            if self.config.show_bounding_box:
                cv2.rectangle(frame, (left, top), (right, bottom), 
                             colors['primary'], box_thickness)
                
                # Draw alert border if needed
                if alert_recommended:
                    cv2.rectangle(frame, (left-3, top-3), (right+3, bottom+3), 
                                 (0, 0, 255), 1)
            
            # Draw person type badge
            if self.config.show_person_type_badge:
                self.draw_person_type_badge(frame, (right-20, top+20), person_type, colors)
            
            # Draw name and confidence label
            if self.config.show_person_name or self.config.show_confidence:
                self.draw_face_label(frame, (left, top-10), detection, colors)
            
            # Draw quality indicator for low-quality faces
            if (self.config.show_quality_indicator and 
                detection['face_quality_score'] < 0.7):
                self.draw_quality_indicator(frame, (left, bottom+5), 
                                          detection['face_quality_score'])
            
            return frame
            
        except Exception as e:
            logger.error(f"❌ Face overlay drawing error: {e}")
            return frame
    
    def draw_person_type_badge(self, frame: np.ndarray, position: Tuple[int, int], 
                              person_type: str, colors: Dict):
        """
        Draw person type badge/indicator
        
        Args:
            frame: Frame to draw on
            position: (x, y) position for badge
            person_type: Type of person
            colors: Color scheme dictionary
        """
        try:
            x, y = position
            
            # Badge icons/symbols
            badge_symbols = {
                'resident': 'R',
                'staff': 'S', 
                'worker': 'W',
                'visitor': 'V',
                'contractor': 'C',
                'vip': '★',
                'blacklist': '!',
                'unknown': '?'
            }
            
            symbol = badge_symbols.get(person_type, '?')
            
            # Draw badge background circle
            cv2.circle(frame, (x, y), 12, colors['secondary'], -1)
            cv2.circle(frame, (x, y), 12, colors['primary'], 2)
            
            # Draw symbol
            font = cv2.FONT_HERSHEY_SIMPLEX
            text_size = cv2.getTextSize(symbol, font, 0.5, 1)[0]
            text_x = x - text_size[0] // 2
            text_y = y + text_size[1] // 2
            
            cv2.putText(frame, symbol, (text_x, text_y), font, 0.5, 
                       colors['text'], 1, cv2.LINE_AA)
            
        except Exception as e:
            logger.error(f"❌ Badge drawing error: {e}")
    
    def draw_face_label(self, frame: np.ndarray, position: Tuple[int, int], 
                       detection: Dict, colors: Dict):
        """
        Draw face identification label
        
        Args:
            frame: Frame to draw on
            position: (x, y) position for label
            detection: Face detection data
            colors: Color scheme dictionary
        """
        try:
            x, y = position
            person_name = detection['person_name']
            confidence = detection['confidence']
            is_match = detection['is_match']
            
            # Prepare label text
            if is_match:
                if self.config.show_confidence:
                    label_text = f"{person_name} ({confidence:.1%})"
                else:
                    label_text = person_name
            else:
                label_text = "Unknown"
            
            # Calculate text dimensions
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = self.config.font_scale
            thickness = self.config.text_thickness
            
            (text_width, text_height), baseline = cv2.getTextSize(
                label_text, font, font_scale, thickness
            )\n            \n            # Draw background rectangle\n            padding = 4\n            bg_top_left = (x - padding, y - text_height - padding - baseline)\n            bg_bottom_right = (x + text_width + padding, y + padding)\n            \n            # Semi-transparent background\n            overlay = frame.copy()\n            cv2.rectangle(overlay, bg_top_left, bg_bottom_right, \n                         colors['secondary'], -1)\n            frame = cv2.addWeighted(frame, 1 - self.config.background_alpha, \n                                   overlay, self.config.background_alpha, 0)\n            \n            # Draw text\n            cv2.putText(frame, label_text, (x, y - baseline), font, \n                       font_scale, colors['text'], thickness, cv2.LINE_AA)\n            \n        except Exception as e:\n            logger.error(f\"❌ Label drawing error: {e}\")\n    \n    def draw_quality_indicator(self, frame: np.ndarray, position: Tuple[int, int], \n                              quality_score: float):\n        \"\"\"\n        Draw face quality indicator\n        \n        Args:\n            frame: Frame to draw on\n            position: (x, y) position for indicator\n            quality_score: Quality score (0.0 to 1.0)\n        \"\"\"\n        try:\n            x, y = position\n            \n            # Quality color (red for low, yellow for medium, green for high)\n            if quality_score < 0.4:\n                color = (0, 0, 255)  # Red\n            elif quality_score < 0.7:\n                color = (0, 255, 255)  # Yellow\n            else:\n                color = (0, 255, 0)  # Green\n            \n            # Draw quality bar\n            bar_width = 30\n            bar_height = 4\n            fill_width = int(bar_width * quality_score)\n            \n            # Background bar\n            cv2.rectangle(frame, (x, y), (x + bar_width, y + bar_height), \n                         (100, 100, 100), -1)\n            \n            # Quality fill\n            if fill_width > 0:\n                cv2.rectangle(frame, (x, y), (x + fill_width, y + bar_height), \n                             color, -1)\n            \n            # Quality text\n            quality_text = f\"Q: {quality_score:.1f}\"\n            cv2.putText(frame, quality_text, (x, y + bar_height + 15), \n                       cv2.FONT_HERSHEY_SIMPLEX, 0.3, color, 1, cv2.LINE_AA)\n            \n        except Exception as e:\n            logger.error(f\"❌ Quality indicator drawing error: {e}\")\n    \n    def register_stream(self, stream_id: str, stream_config: Dict = None):\n        \"\"\"\n        Register a video stream for overlay processing\n        \n        Args:\n            stream_id: Unique stream identifier\n            stream_config: Optional stream configuration\n        \"\"\"\n        try:\n            self.active_streams[stream_id] = {\n                'config': stream_config or {},\n                'registered_at': datetime.now().isoformat(),\n                'frame_count': 0,\n                'detection_count': 0,\n                'last_activity': datetime.now().isoformat()\n            }\n            \n            self.stream_stats[stream_id] = {\n                'processing_times': [],\n                'detection_counts': [],\n                'avg_processing_time': 0.0,\n                'fps': 0.0,\n                'detection_rate': 0.0\n            }\n            \n            logger.info(f\"🎨 Registered overlay stream: {stream_id}\")\n            \n        except Exception as e:\n            logger.error(f\"❌ Stream registration failed: {e}\")\n    \n    def update_stream_performance(self, stream_id: str, processing_time: float, \n                                 detection_count: int):\n        \"\"\"\n        Update performance statistics for stream\n        \n        Args:\n            stream_id: Stream identifier\n            processing_time: Frame processing time in seconds\n            detection_count: Number of faces detected\n        \"\"\"\n        try:\n            if stream_id not in self.active_streams:\n                return\n            \n            # Update stream data\n            stream_data = self.active_streams[stream_id]\n            stream_data['frame_count'] += 1\n            stream_data['detection_count'] += detection_count\n            stream_data['last_activity'] = datetime.now().isoformat()\n            \n            # Update performance statistics\n            stats = self.stream_stats[stream_id]\n            stats['processing_times'].append(processing_time)\n            stats['detection_counts'].append(detection_count)\n            \n            # Keep only last 100 measurements\n            if len(stats['processing_times']) > 100:\n                stats['processing_times'] = stats['processing_times'][-100:]\n                stats['detection_counts'] = stats['detection_counts'][-100:]\n            \n            # Calculate moving averages\n            stats['avg_processing_time'] = np.mean(stats['processing_times'])\n            if stats['avg_processing_time'] > 0:\n                stats['fps'] = 1.0 / stats['avg_processing_time']\n            stats['detection_rate'] = np.mean(stats['detection_counts'])\n            \n            # Update global stats\n            self.performance_stats['total_frames_processed'] += 1\n            self.performance_stats['total_faces_detected'] += detection_count\n            \n            # Update global average processing time\n            alpha = 0.1  # Smoothing factor\n            self.performance_stats['avg_processing_time'] = (\n                alpha * processing_time + \n                (1 - alpha) * self.performance_stats['avg_processing_time']\n            )\n            \n        except Exception as e:\n            logger.error(f\"❌ Performance update failed for {stream_id}: {e}\")\n    \n    def get_overlay_performance_stats(self) -> Dict:\n        \"\"\"\n        Get comprehensive overlay performance statistics\n        \n        Returns:\n            Performance statistics dictionary\n        \"\"\"\n        try:\n            return {\n                'global_stats': self.performance_stats.copy(),\n                'stream_stats': {\n                    stream_id: {\n                        **self.active_streams[stream_id],\n                        'performance': self.stream_stats[stream_id]\n                    }\n                    for stream_id in self.active_streams\n                },\n                'active_streams': len(self.active_streams),\n                'total_detections': sum(\n                    stream['detection_count'] for stream in self.active_streams.values()\n                )\n            }\n            \n        except Exception as e:\n            logger.error(f\"❌ Failed to get performance stats: {e}\")\n            return {}\n    \n    def create_face_detection_alert(self, detection: Dict, stream_id: str) -> Dict:\n        \"\"\"\n        Create formatted alert for face detection with overlay data\n        \n        Args:\n            detection: Face detection result\n            stream_id: Stream identifier\n            \n        Returns:\n            Formatted alert with overlay information\n        \"\"\"\n        try:\n            # Use face engine to create base alert\n            alert = self.face_engine.create_face_detection_alert(detection)\n            \n            # Add overlay-specific data\n            alert['overlay_info'] = {\n                'stream_id': stream_id,\n                'overlay_style': self.config.overlay_style.value,\n                'visual_elements': {\n                    'bounding_box': self.config.show_bounding_box,\n                    'person_name': self.config.show_person_name,\n                    'confidence': self.config.show_confidence,\n                    'type_badge': self.config.show_person_type_badge,\n                    'quality_indicator': self.config.show_quality_indicator\n                },\n                'colors': self.person_type_colors.get(\n                    detection['person_type'], \n                    self.person_type_colors['unknown']\n                )\n            }\n            \n            return alert\n            \n        except Exception as e:\n            logger.error(f\"❌ Alert creation error: {e}\")\n            return {}\n    \n    def update_overlay_config(self, new_config: FaceOverlayConfig):\n        \"\"\"\n        Update overlay configuration\n        \n        Args:\n            new_config: New overlay configuration\n        \"\"\"\n        self.config = new_config\n        logger.info(\"🎨 Overlay configuration updated\")\n    \n    def cleanup_inactive_streams(self, inactive_threshold_minutes: int = 5):\n        \"\"\"\n        Clean up inactive streams\n        \n        Args:\n            inactive_threshold_minutes: Minutes of inactivity before cleanup\n        \"\"\"\n        try:\n            current_time = datetime.now()\n            inactive_streams = []\n            \n            for stream_id, stream_data in self.active_streams.items():\n                last_activity = datetime.fromisoformat(stream_data['last_activity'])\n                inactive_minutes = (current_time - last_activity).total_seconds() / 60\n                \n                if inactive_minutes > inactive_threshold_minutes:\n                    inactive_streams.append(stream_id)\n            \n            # Remove inactive streams\n            for stream_id in inactive_streams:\n                del self.active_streams[stream_id]\n                del self.stream_stats[stream_id]\n                logger.info(f\"🧹 Cleaned up inactive stream: {stream_id}\")\n            \n            if inactive_streams:\n                logger.info(f\"🧹 Cleaned up {len(inactive_streams)} inactive streams\")\n                \n        except Exception as e:\n            logger.error(f\"❌ Stream cleanup failed: {e}\")\n\n\n# Utility functions\ndef create_face_overlay_system(face_engine: FaceRecognitionEngine, \n                               config: FaceOverlayConfig = None) -> FaceDetectionOverlay:\n    \"\"\"\n    Factory function to create face detection overlay system\n    \n    Args:\n        face_engine: Face recognition engine instance\n        config: Optional overlay configuration\n        \n    Returns:\n        Configured FaceDetectionOverlay instance\n    \"\"\"\n    return FaceDetectionOverlay(face_engine, config)\n\n\nif __name__ == \"__main__\":\n    # Test configuration\n    from .face_recognition_engine import create_face_recognition_engine\n    \n    test_db_config = {\n        'host': 'localhost',\n        'database': 'apex',\n        'user': 'swanadmin',\n        'password': 'your_password',\n        'port': 5432\n    }\n    \n    # Create face engine and overlay system\n    face_engine = create_face_recognition_engine(test_db_config)\n    overlay_system = create_face_overlay_system(face_engine)\n    \n    print(\"✅ Face Detection Overlay System created successfully\")\n    print(f\"📊 Performance Stats: {overlay_system.get_overlay_performance_stats()}\")\n