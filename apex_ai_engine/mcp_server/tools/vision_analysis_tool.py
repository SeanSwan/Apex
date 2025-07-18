"""
APEX AI MCP VISION ANALYSIS TOOL
================================
MCP Tool that wraps YOLO models and threat detection logic for security monitoring

This tool provides:
- Real-time object detection using YOLO models
- Security-specific threat classification
- Confidence scoring and risk assessment
- Integration with existing enhanced_inference.py engine
- Modular design for easy model swapping
"""

import asyncio
import json
import logging
import time
import cv2
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import base64
import io
from PIL import Image

# AI/ML imports
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logging.warning("⚠️ Ultralytics not installed. Vision analysis will run in simulation mode.")

logger = logging.getLogger(__name__)

class VisionAnalysisTool:
    """
    MCP Tool for AI-powered vision analysis and threat detection
    
    Capabilities:
    - YOLO-based object detection
    - Security threat classification
    - Risk scoring and assessment
    - Frame processing and analysis
    - Real-time inference
    """
    
    def __init__(self, model_path: str = "yolov8n.pt", config: Dict = None):
        self.name = "vision_analysis"
        self.description = "AI-powered vision analysis and threat detection using YOLO models"
        self.enabled = True
        self.model_path = model_path
        self.config = config or self.get_default_config()
        
        # Model and processing state
        self.model = None
        self.is_initialized = False
        self.last_used = None
        
        # Performance tracking
        self.stats = {
            'total_inferences': 0,
            'total_detections': 0,
            'avg_inference_time': 0,
            'success_rate': 0,
            'last_reset': time.time()
        }
        
        # Security threat mapping
        self.threat_classes = self.load_threat_classification()
        
        logger.info(f"🎯 Vision Analysis Tool initialized: {model_path}")

    def get_default_config(self) -> Dict:
        """Default configuration for vision analysis"""
        return {
            'confidence_threshold': 0.5,
            'iou_threshold': 0.45,
            'max_detections': 100,
            'input_size': (640, 640),
            'enable_tracking': True,
            'security_mode': True,
            'threat_assessment': True
        }

    def load_threat_classification(self) -> Dict:
        """Load security threat classification mapping"""
        return {
            'person': {
                'base_threat_level': 'low',
                'risk_factors': ['location', 'time', 'behavior', 'authorization'],
                'alert_priority': 'medium'
            },
            'weapon': {
                'base_threat_level': 'critical',
                'risk_factors': ['type', 'accessibility', 'intent'],
                'alert_priority': 'critical'
            },
            'knife': {
                'base_threat_level': 'high',
                'risk_factors': ['context', 'wielding', 'threatening'],
                'alert_priority': 'high'
            },
            'gun': {
                'base_threat_level': 'critical',
                'risk_factors': ['drawn', 'aimed', 'context'],
                'alert_priority': 'critical'
            },
            'vehicle': {
                'base_threat_level': 'low',
                'risk_factors': ['location', 'speed', 'restricted_area'],
                'alert_priority': 'low'
            },
            'backpack': {
                'base_threat_level': 'low',
                'risk_factors': ['unattended', 'restricted_area', 'suspicious_behavior'],
                'alert_priority': 'medium'
            },
            'suitcase': {
                'base_threat_level': 'low',
                'risk_factors': ['unattended', 'location', 'duration'],
                'alert_priority': 'medium'
            }
        }

    async def initialize(self):
        """Initialize the vision analysis model"""
        try:
            logger.info(f"🔄 Initializing vision model: {self.model_path}")
            
            if YOLO_AVAILABLE:
                # Load actual YOLO model
                self.model = YOLO(self.model_path)
                logger.info("✅ YOLO model loaded successfully")
                
                # Warm up the model
                dummy_image = np.zeros((640, 640, 3), dtype=np.uint8)
                _ = self.model(dummy_image, verbose=False)
                logger.info("🔥 Model warmed up with dummy inference")
                
            else:
                logger.warning("⚠️ YOLO not available, using simulation mode")
            
            self.is_initialized = True
            logger.info("✅ Vision Analysis Tool initialization complete")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize vision model: {e}")
            self.is_initialized = False
            raise

    async def execute(self, payload: Dict) -> Dict:
        """
        Execute vision analysis on provided image data
        
        Payload format:
        {
            "image_data": "base64_encoded_image",
            "camera_id": "camera_001",
            "timestamp": "2024-07-16T10:30:00Z",
            "analysis_type": "threat_detection",
            "options": {
                "confidence_threshold": 0.5,
                "enable_tracking": true,
                "threat_assessment": true
            }
        }
        """
        start_time = time.time()
        
        try:
            if not self.is_initialized:
                raise Exception("Vision Analysis Tool not initialized")
            
            # Extract payload data
            image_data = payload.get('image_data')
            camera_id = payload.get('camera_id', 'unknown')
            timestamp = payload.get('timestamp', datetime.now().isoformat())
            analysis_type = payload.get('analysis_type', 'threat_detection')
            options = payload.get('options', {})
            
            # Merge options with config
            analysis_config = {**self.config, **options}
            
            # Process image
            image = self.decode_image(image_data)
            detections = await self.analyze_image(image, analysis_config)
            
            # Perform threat assessment
            if analysis_config.get('threat_assessment', True):
                threat_analysis = self.assess_threats(detections, camera_id, timestamp)
            else:
                threat_analysis = None
            
            # Update statistics
            execution_time = time.time() - start_time
            self.update_stats(execution_time, len(detections))
            
            # Prepare response
            result = {
                'camera_id': camera_id,
                'timestamp': timestamp,
                'analysis_type': analysis_type,
                'detections': detections,
                'threat_analysis': threat_analysis,
                'execution_time': execution_time,
                'model_info': {
                    'model_path': self.model_path,
                    'confidence_threshold': analysis_config['confidence_threshold'],
                    'total_detections': len(detections)
                },
                'success': True
            }
            
            logger.info(f"🎯 Vision analysis complete: {len(detections)} detections in {execution_time:.3f}s")
            return result
            
        except Exception as e:
            logger.error(f"❌ Vision analysis execution error: {e}")
            return {
                'success': False,
                'error': str(e),
                'execution_time': time.time() - start_time,
                'camera_id': payload.get('camera_id', 'unknown'),
                'timestamp': payload.get('timestamp', datetime.now().isoformat())
            }

    def decode_image(self, image_data: str) -> np.ndarray:
        """Decode base64 image data to numpy array"""
        try:
            # Remove data URL prefix if present
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            
            # Convert to PIL Image
            pil_image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB numpy array
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            image_array = np.array(pil_image)
            
            return image_array
            
        except Exception as e:
            logger.error(f"❌ Failed to decode image: {e}")
            raise ValueError(f"Invalid image data: {e}")

    async def analyze_image(self, image: np.ndarray, config: Dict) -> List[Dict]:
        """Perform YOLO inference on image"""
        try:
            if self.model and YOLO_AVAILABLE:
                # Real YOLO inference
                results = self.model(
                    image,
                    conf=config['confidence_threshold'],
                    iou=config['iou_threshold'],
                    max_det=config['max_detections'],
                    verbose=False
                )
                
                detections = []
                for result in results:
                    if result.boxes is not None:
                        for box in result.boxes:
                            detection = self.format_detection(box, image.shape, result.names)
                            detections.append(detection)
                
                return detections
                
            else:
                # Simulation mode for demo/testing
                return self.simulate_detections(image.shape, config)
                
        except Exception as e:
            logger.error(f"❌ Image analysis error: {e}")
            return []

    def format_detection(self, box: Any, image_shape: Tuple, class_names: Dict) -> Dict:
        """Format YOLO detection into standardized format"""
        try:
            # Extract box data
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])
            class_name = class_names.get(class_id, f"class_{class_id}")
            
            # Normalize coordinates
            h, w = image_shape[:2]
            normalized_bbox = {
                'x': float(x1 / w),
                'y': float(y1 / h),
                'width': float((x2 - x1) / w),
                'height': float((y2 - y1) / h)
            }
            
            # Calculate additional metrics
            area = (x2 - x1) * (y2 - y1)
            center_x = (x1 + x2) / 2 / w
            center_y = (y1 + y2) / 2 / h
            
            return {
                'class_id': class_id,
                'class_name': class_name,
                'confidence': confidence,
                'bounding_box': normalized_bbox,
                'absolute_bbox': {
                    'x1': int(x1), 'y1': int(y1),
                    'x2': int(x2), 'y2': int(y2)
                },
                'area': float(area),
                'center': {'x': center_x, 'y': center_y},
                'detection_id': f"det_{int(time.time() * 1000000) % 1000000}"
            }
            
        except Exception as e:
            logger.error(f"❌ Detection formatting error: {e}")
            return {}

    def simulate_detections(self, image_shape: Tuple, config: Dict) -> List[Dict]:
        """Simulate detections for demo/testing purposes"""
        h, w = image_shape[:2]
        simulated_detections = []
        
        # Simulate 0-3 detections
        num_detections = np.random.choice([0, 1, 2, 3], p=[0.4, 0.3, 0.2, 0.1])
        
        class_options = ['person', 'car', 'truck', 'backpack', 'suitcase']
        
        for i in range(num_detections):
            class_name = np.random.choice(class_options, p=[0.6, 0.15, 0.1, 0.1, 0.05])
            confidence = 0.5 + np.random.random() * 0.5
            
            # Random bounding box
            x = np.random.random() * 0.7
            y = np.random.random() * 0.7
            width = 0.1 + np.random.random() * 0.2
            height = 0.1 + np.random.random() * 0.3
            
            detection = {
                'class_id': class_options.index(class_name),
                'class_name': class_name,
                'confidence': confidence,
                'bounding_box': {'x': x, 'y': y, 'width': width, 'height': height},
                'absolute_bbox': {
                    'x1': int(x * w), 'y1': int(y * h),
                    'x2': int((x + width) * w), 'y2': int((y + height) * h)
                },
                'area': width * height * w * h,
                'center': {'x': x + width/2, 'y': y + height/2},
                'detection_id': f"sim_{i}_{int(time.time() * 1000) % 10000}"
            }
            
            simulated_detections.append(detection)
        
        return simulated_detections

    def assess_threats(self, detections: List[Dict], camera_id: str, timestamp: str) -> Dict:
        """Assess security threats from detections"""
        threat_assessment = {
            'overall_risk_level': 'safe',
            'risk_score': 0.0,
            'threat_count': 0,
            'high_priority_threats': [],
            'recommendations': [],
            'analysis_timestamp': datetime.now().isoformat()
        }
        
        total_risk = 0.0
        threat_count = 0
        
        for detection in detections:
            class_name = detection['class_name']
            confidence = detection['confidence']
            
            # Get threat classification
            threat_info = self.threat_classes.get(class_name, {
                'base_threat_level': 'low',
                'alert_priority': 'low'
            })
            
            # Calculate individual risk score
            risk_score = self.calculate_risk_score(detection, threat_info, camera_id)
            total_risk += risk_score
            
            if risk_score > 5.0:  # High risk threshold
                threat_count += 1
                threat_assessment['high_priority_threats'].append({
                    'detection_id': detection['detection_id'],
                    'class_name': class_name,
                    'confidence': confidence,
                    'risk_score': risk_score,
                    'threat_level': threat_info['base_threat_level'],
                    'alert_priority': threat_info['alert_priority'],
                    'location': detection['center']
                })
        
        # Calculate overall assessment
        if detections:
            threat_assessment['risk_score'] = total_risk / len(detections)
        
        threat_assessment['threat_count'] = threat_count
        
        # Determine overall risk level
        if threat_assessment['risk_score'] > 8.0:
            threat_assessment['overall_risk_level'] = 'critical'
        elif threat_assessment['risk_score'] > 6.0:
            threat_assessment['overall_risk_level'] = 'high'
        elif threat_assessment['risk_score'] > 3.0:
            threat_assessment['overall_risk_level'] = 'medium'
        else:
            threat_assessment['overall_risk_level'] = 'low'
        
        # Generate recommendations
        threat_assessment['recommendations'] = self.generate_recommendations(threat_assessment)
        
        return threat_assessment

    def calculate_risk_score(self, detection: Dict, threat_info: Dict, camera_id: str) -> float:
        """Calculate individual detection risk score"""
        base_risk = {
            'safe': 1.0,
            'low': 2.0,
            'medium': 5.0,
            'high': 7.0,
            'critical': 9.0
        }.get(threat_info['base_threat_level'], 2.0)
        
        # Confidence multiplier
        confidence_multiplier = detection['confidence']
        
        # Size factor (larger objects are more concerning in security context)
        size_factor = min(detection['area'] / 10000, 2.0)  # Normalize and cap
        
        # Location factor (center of frame often more significant)
        center = detection['center']
        location_factor = 1.0 + (0.5 - abs(center['x'] - 0.5)) + (0.5 - abs(center['y'] - 0.5))
        
        # Time factor (after hours increases risk for some classes)
        current_hour = datetime.now().hour
        time_factor = 1.5 if (current_hour < 6 or current_hour > 22) else 1.0
        
        # Calculate final risk score
        risk_score = base_risk * confidence_multiplier * size_factor * location_factor * time_factor
        
        return min(risk_score, 10.0)  # Cap at 10.0

    def generate_recommendations(self, threat_assessment: Dict) -> List[str]:
        """Generate security recommendations based on threat assessment"""
        recommendations = []
        
        if threat_assessment['overall_risk_level'] == 'critical':
            recommendations.append("🚨 Immediate security response required")
            recommendations.append("🔒 Activate emergency protocols")
            recommendations.append("📞 Contact law enforcement if weapons detected")
        
        elif threat_assessment['overall_risk_level'] == 'high':
            recommendations.append("⚠️ Dispatch security personnel")
            recommendations.append("📹 Increase monitoring of affected area")
            recommendations.append("🔊 Consider audio deterrent activation")
        
        elif threat_assessment['overall_risk_level'] == 'medium':
            recommendations.append("👁️ Maintain heightened surveillance")
            recommendations.append("📝 Log incident for review")
        
        if threat_assessment['threat_count'] > 2:
            recommendations.append("🔍 Multiple threats detected - coordinate response")
        
        return recommendations

    def update_stats(self, execution_time: float, detection_count: int):
        """Update performance statistics"""
        self.stats['total_inferences'] += 1
        self.stats['total_detections'] += detection_count
        
        # Update average inference time
        if self.stats['total_inferences'] == 1:
            self.stats['avg_inference_time'] = execution_time
        else:
            alpha = 0.1  # Exponential moving average factor
            self.stats['avg_inference_time'] = (
                alpha * execution_time + 
                (1 - alpha) * self.stats['avg_inference_time']
            )
        
        # Update success rate (simplified - based on getting results)
        self.stats['success_rate'] = min(
            (self.stats['total_inferences'] - 1) / self.stats['total_inferences'] + 0.1,
            1.0
        )

    async def shutdown(self):
        """Shutdown the vision analysis tool"""
        logger.info("🛑 Shutting down Vision Analysis Tool...")
        
        if self.model:
            # Cleanup model resources if needed
            del self.model
            self.model = None
        
        self.is_initialized = False
        logger.info("✅ Vision Analysis Tool shutdown complete")

    def get_stats(self) -> Dict:
        """Get current performance statistics"""
        return {
            **self.stats,
            'uptime': time.time() - self.stats['last_reset'],
            'model_path': self.model_path,
            'is_initialized': self.is_initialized,
            'last_used': self.last_used
        }
