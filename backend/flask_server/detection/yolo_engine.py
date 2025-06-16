# APEX AI DETECTION ENGINE - YOLO IMPLEMENTATION
# Master Prompt v29.1-APEX Implementation
# Phase 2A: AI Detection Capabilities

import cv2
import numpy as np
from ultralytics import YOLO
import torch
from typing import List, Dict, Tuple, Optional
import logging
from dataclasses import dataclass
from datetime import datetime
import time
import os

logger = logging.getLogger(__name__)

@dataclass
class Detection:
    """Detection result from YOLO model"""
    class_id: int
    class_name: str
    confidence: float
    bbox: Tuple[float, float, float, float]  # x, y, width, height (normalized)
    timestamp: datetime
    frame_id: int

@dataclass
class WeaponDetection(Detection):
    """Specialized detection for weapons"""
    weapon_type: str
    threat_level: str
    certainty_score: float

class YOLODetectionEngine:
    """YOLO-based detection engine for Apex AI platform"""
    
    def __init__(self, model_path: str = "yolov8n.pt"):
        """Initialize YOLO detection engine"""
        self.model_path = model_path
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.is_loaded = False
        
        # Detection thresholds
        self.person_confidence_threshold = 0.5
        self.weapon_confidence_threshold = 0.3  # Lower for weapon detection
        self.vehicle_confidence_threshold = 0.6
        
        # Class mappings for YOLO COCO dataset
        self.coco_classes = {
            0: 'person',
            2: 'car',
            3: 'motorcycle', 
            5: 'bus',
            7: 'truck',
            # Add more as needed for security applications
        }
        
        # Weapon detection classes (would be custom trained)
        self.weapon_classes = {
            80: 'knife',
            81: 'gun',
            82: 'hammer',
            83: 'pipe',
            # These would be custom classes from fine-tuned model
        }
        
        logger.info(f"YOLO Detection Engine initialized for device: {self.device}")
    
    def load_model(self) -> bool:
        """Load YOLO model for inference"""
        try:
            logger.info(f"Loading YOLO model from {self.model_path}")
            self.model = YOLO(self.model_path)
            self.model.to(self.device)
            self.is_loaded = True
            logger.info("YOLO model loaded successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            self.is_loaded = False
            return False
    
    def detect_objects(self, frame: np.ndarray, frame_id: int = 0) -> List[Detection]:
        """Detect objects in a single frame"""
        if not self.is_loaded:
            logger.warning("Model not loaded, cannot perform detection")
            return []
        
        try:
            # Run YOLO inference
            results = self.model(frame, verbose=False)
            detections = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Extract detection data
                        class_id = int(box.cls[0])
                        confidence = float(box.conf[0])
                        bbox = box.xywhn[0].tolist()  # Normalized coordinates
                        
                        # Get class name
                        class_name = self.get_class_name(class_id)
                        
                        # Apply confidence thresholds
                        if self.should_report_detection(class_id, confidence):
                            detection = Detection(
                                class_id=class_id,
                                class_name=class_name,
                                confidence=confidence,
                                bbox=tuple(bbox),
                                timestamp=datetime.now(),
                                frame_id=frame_id
                            )
                            detections.append(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"Error in object detection: {e}")
            return []
    
    def detect_persons(self, frame: np.ndarray, frame_id: int = 0) -> List[Detection]:
        """Specialized person detection"""
        all_detections = self.detect_objects(frame, frame_id)
        return [d for d in all_detections if d.class_name == 'person']
    
    def detect_weapons(self, frame: np.ndarray, frame_id: int = 0) -> List[WeaponDetection]:
        """Specialized weapon detection (requires custom trained model)"""
        if not self.is_loaded:
            return []
        
        try:
            # This would use a custom weapon detection model
            # For demo, we'll simulate weapon detection logic
            person_detections = self.detect_persons(frame, frame_id)
            weapon_detections = []
            
            # Simulate weapon detection based on person detections
            # In production, this would be a separate fine-tuned model
            for person in person_detections:
                # Analyze person region for potential weapons
                x, y, w, h = person.bbox
                person_region = self.extract_region(frame, x, y, w, h)
                
                # Simulate weapon analysis (replace with actual model)
                weapon_probability = self.analyze_for_weapons(person_region)
                
                if weapon_probability > self.weapon_confidence_threshold:
                    weapon_detection = WeaponDetection(
                        class_id=81,  # Gun class ID
                        class_name='weapon_detected',
                        confidence=weapon_probability,
                        bbox=person.bbox,
                        timestamp=datetime.now(),
                        frame_id=frame_id,
                        weapon_type='unknown',
                        threat_level='high',
                        certainty_score=weapon_probability
                    )
                    weapon_detections.append(weapon_detection)
            
            return weapon_detections
            
        except Exception as e:
            logger.error(f"Error in weapon detection: {e}")
            return []
    
    def detect_vehicles(self, frame: np.ndarray, frame_id: int = 0) -> List[Detection]:
        """Specialized vehicle detection"""
        all_detections = self.detect_objects(frame, frame_id)
        vehicle_classes = ['car', 'motorcycle', 'bus', 'truck']
        return [d for d in all_detections if d.class_name in vehicle_classes]
    
    def extract_region(self, frame: np.ndarray, x: float, y: float, w: float, h: float) -> np.ndarray:
        """Extract region from frame using normalized coordinates"""
        height, width = frame.shape[:2]
        
        # Convert normalized to pixel coordinates
        x1 = int((x - w/2) * width)
        y1 = int((y - h/2) * height)
        x2 = int((x + w/2) * width)
        y2 = int((y + h/2) * height)
        
        # Ensure bounds
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(width, x2)
        y2 = min(height, y2)
        
        return frame[y1:y2, x1:x2]
    
    def analyze_for_weapons(self, region: np.ndarray) -> float:
        """Analyze image region for weapons (simulation for demo)"""
        # This is a simulation - in production, use a dedicated weapon detection model
        # For demo purposes, return random probability with some logic
        
        if region.size == 0:
            return 0.0
        
        # Simulate analysis based on image characteristics
        # Look for dark objects, straight lines, metallic reflections, etc.
        gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
        
        # Simple heuristics for demo (replace with real model)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size
        
        # Simulate weapon probability based on edge density and other factors
        if edge_density > 0.15:  # High edge density might indicate objects
            return min(0.7, edge_density * 3)  # Cap at 70% confidence
        
        return 0.1  # Low baseline probability
    
    def get_class_name(self, class_id: int) -> str:
        """Get class name from class ID"""
        if class_id in self.coco_classes:
            return self.coco_classes[class_id]
        elif class_id in self.weapon_classes:
            return self.weapon_classes[class_id]
        else:
            return f'class_{class_id}'
    
    def should_report_detection(self, class_id: int, confidence: float) -> bool:
        """Determine if detection should be reported based on thresholds"""
        class_name = self.get_class_name(class_id)
        
        if class_name == 'person':
            return confidence >= self.person_confidence_threshold
        elif class_name in ['car', 'motorcycle', 'bus', 'truck']:
            return confidence >= self.vehicle_confidence_threshold
        elif class_name in self.weapon_classes.values():
            return confidence >= self.weapon_confidence_threshold
        else:
            return confidence >= 0.5  # Default threshold
    
    def annotate_frame(self, frame: np.ndarray, detections: List[Detection]) -> np.ndarray:
        """Annotate frame with detection results"""
        annotated_frame = frame.copy()
        height, width = frame.shape[:2]
        
        for detection in detections:
            x, y, w, h = detection.bbox
            
            # Convert normalized to pixel coordinates
            x1 = int((x - w/2) * width)
            y1 = int((y - h/2) * height)
            x2 = int((x + w/2) * width)
            y2 = int((y + h/2) * height)
            
            # Choose color based on detection type
            if detection.class_name == 'person':
                color = (0, 255, 0)  # Green for person
            elif 'weapon' in detection.class_name:
                color = (0, 0, 255)  # Red for weapon
            elif detection.class_name in ['car', 'motorcycle', 'bus', 'truck']:
                color = (255, 0, 0)  # Blue for vehicle
            else:
                color = (255, 255, 0)  # Cyan for other
            
            # Draw bounding box
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
            
            # Draw label
            label = f"{detection.class_name}: {detection.confidence:.2f}"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
            cv2.rectangle(annotated_frame, (x1, y1 - label_size[1] - 10), 
                         (x1 + label_size[0], y1), color, -1)
            cv2.putText(annotated_frame, label, (x1, y1 - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        return annotated_frame
    
    def get_detection_stats(self) -> Dict:
        """Get detection engine statistics"""
        return {
            "model_loaded": self.is_loaded,
            "model_path": self.model_path,
            "device": self.device,
            "person_threshold": self.person_confidence_threshold,
            "weapon_threshold": self.weapon_confidence_threshold,
            "vehicle_threshold": self.vehicle_confidence_threshold,
            "supported_classes": list(self.coco_classes.values()) + list(self.weapon_classes.values())
        }

# Behavioral Analysis Functions
class BehaviorAnalyzer:
    """Analyze suspicious behaviors from detection sequences"""
    
    def __init__(self):
        self.person_tracking = {}  # Track persons across frames
        self.loitering_threshold = 30  # seconds
        self.zone_definitions = {}  # Define restricted zones
    
    def analyze_loitering(self, person_detections: List[Detection], camera_id: str) -> List[Dict]:
        """Detect loitering behavior"""
        loitering_alerts = []
        
        for detection in person_detections:
            person_key = f"{camera_id}_{detection.bbox}"  # Simple tracking
            
            if person_key not in self.person_tracking:
                self.person_tracking[person_key] = {
                    "first_seen": detection.timestamp,
                    "last_seen": detection.timestamp,
                    "position": detection.bbox
                }
            else:
                self.person_tracking[person_key]["last_seen"] = detection.timestamp
                
                # Check for loitering
                duration = (detection.timestamp - self.person_tracking[person_key]["first_seen"]).total_seconds()
                
                if duration > self.loitering_threshold:
                    loitering_alerts.append({
                        "type": "loitering",
                        "duration": duration,
                        "position": detection.bbox,
                        "confidence": detection.confidence,
                        "severity": "medium" if duration < 60 else "high"
                    })
        
        return loitering_alerts
    
    def check_zone_breach(self, detections: List[Detection], restricted_zones: List[Dict]) -> List[Dict]:
        """Check if detections breach restricted zones"""
        breaches = []
        
        for detection in detections:
            for zone in restricted_zones:
                if self.is_in_zone(detection.bbox, zone):
                    breaches.append({
                        "type": "zone_breach",
                        "zone_name": zone.get("name", "restricted"),
                        "detection": detection,
                        "severity": zone.get("severity", "high")
                    })
        
        return breaches
    
    def is_in_zone(self, bbox: Tuple[float, float, float, float], zone: Dict) -> bool:
        """Check if bounding box intersects with zone"""
        # Simple rectangular zone check
        x, y, w, h = bbox
        zone_coords = zone.get("coordinates", {})
        
        # Implementation depends on zone definition format
        # This is a simplified version
        return True  # Placeholder implementation

# Export main classes
__all__ = ['YOLODetectionEngine', 'BehaviorAnalyzer', 'Detection', 'WeaponDetection']
