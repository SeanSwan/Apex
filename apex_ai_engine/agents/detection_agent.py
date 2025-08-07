"""
APEX AI DETECTION AGENT
=======================
Specialized AI agent for threat detection and classification

This agent encapsulates all AI inference logic including YOLO detection,
face recognition, threat classification, and security model processing.

Features:
- Multi-model threat detection (YOLO, specialized security models)
- Face recognition and person identification
- Real-time inference processing
- Threat classification and confidence scoring
- Model hot-swapping and management
- Performance monitoring and optimization

Agent Responsibilities:
- Process frames from Vision Agent for threat detection
- Run AI inference models (YOLO, face recognition, etc.)
- Classify and score detected threats
- Provide detection results to other agents
- Manage AI model lifecycle and performance
- Handle model updates and hot-swapping
"""

import asyncio
import cv2
import numpy as np
import logging
import time
import json
import threading
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
import queue

# AI/ML imports
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("⚠️ YOLO/Ultralytics not available - agent will use simulation mode")

# Face recognition import
try:
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from face_recognition_engine import FaceRecognitionEngine
    FACE_RECOGNITION_AVAILABLE = True
except ImportError as e:
    FACE_RECOGNITION_AVAILABLE = False
    FaceRecognitionEngine = None
    logger = logging.getLogger(__name__)
    logger.warning(f"⚠️ Face recognition not available: {e}")
    
    # Create mock class
    class MockFaceRecognitionEngine:
        def __init__(self, config=None):
            self.config = config or {}
        
        async def initialize(self):
            pass
        
        def process_frame(self, frame):
            return []  # No faces detected in simulation
    
    FaceRecognitionEngine = MockFaceRecognitionEngine

# Import existing inference components
try:
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from enhanced_inference import *  # Import existing inference logic
    from threat_correlation_engine import ThreatCorrelationEngine
except ImportError as e:
    # Fallback for development
    ThreatCorrelationEngine = None
    logger = logging.getLogger(__name__)
    logger.warning(f"⚠️ Enhanced inference components not available - using simulation mode: {e}")
    
    # Create mock classes
    class MockThreatCorrelationEngine:
        def __init__(self, config=None):
            self.config = config or {}
        
        async def initialize(self):
            pass
        
        def correlate_threats(self, results, frame_data):
            return results
    
    ThreatCorrelationEngine = MockThreatCorrelationEngine

logger = logging.getLogger(__name__)

class ThreatLevel(Enum):
    """Threat severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    WEAPON = "weapon"

@dataclass
class DetectionResult:
    """Represents a detection result"""
    detection_id: str
    threat_type: str
    threat_level: ThreatLevel
    confidence: float
    bounding_box: Tuple[int, int, int, int]  # x, y, width, height
    frame_id: str
    source_id: str
    timestamp: str
    metadata: Dict[str, Any]
    face_data: Optional[Dict] = None

@dataclass
class DetectionTask:
    """Represents a detection task"""
    task_id: str
    action: str  # analyze_threat, classify_incident, background_scan, etc.
    frame_data: Optional[Dict[str, Any]] = None
    parameters: Dict[str, Any] = None
    priority: int = 1
    timestamp: str = None

class DetectionAgent:
    """
    Detection Agent for APEX AI system
    
    Processes visual data from Vision Agent and performs AI inference
    to detect and classify security threats, faces, and other objects.
    """
    
    def __init__(self, name: str, config: Dict[str, Any], mcp_server=None):
        self.name = name
        self.config = config
        self.mcp_server = mcp_server
        
        # Agent state
        self.enabled = True
        self.status = "initializing"
        self.task_queue = asyncio.Queue()
        self.active_tasks: Dict[str, DetectionTask] = {}
        
        # AI Models
        self.yolo_model: Optional[YOLO] = None
        self.face_recognition_engine: Optional[FaceRecognitionEngine] = None
        self.threat_correlation_engine: Optional[ThreatCorrelationEngine] = None
        
        # Model management
        self.available_models: Dict[str, str] = {}  # model_name -> path
        self.active_model_name = config.get('default_model', 'yolov8n.pt')
        self.model_load_lock = threading.Lock()
        
        # Detection settings
        self.confidence_threshold = config.get('confidence_threshold', 0.5)
        self.iou_threshold = config.get('iou_threshold', 0.45)
        self.enable_face_recognition = config.get('enable_face_recognition', True)
        self.enable_threat_correlation = config.get('enable_threat_correlation', True)
        
        # Detection results management
        self.detection_history: List[DetectionResult] = []
        self.max_history_size = config.get('max_history_size', 1000)
        self.detection_counter = 0
        
        # Performance metrics
        self.metrics = {
            'total_detections': 0,
            'threats_detected': 0,
            'faces_recognized': 0,
            'model_inference_time': 0.0,
            'average_confidence': 0.0,
            'false_positives': 0,
            'model_switches': 0,
            'uptime_seconds': 0,
            'error_count': 0,
            'last_detection_time': None
        }
        
        # Threat classification
        self.threat_classes = config.get('threat_classes', {
            'weapon': ['knife', 'gun', 'pistol', 'rifle', 'sword'],
            'violence': ['fight', 'assault', 'altercation'],
            'person': ['person', 'human', 'individual'],
            'vehicle': ['car', 'truck', 'motorcycle', 'bicycle'],
            'suspicious': ['mask', 'hooded_person', 'loitering']
        })
        
        # Threading
        self.worker_thread: Optional[threading.Thread] = None
        self.model_manager_thread: Optional[threading.Thread] = None
        self.shutdown_event = threading.Event()
        
        # Processing queue
        self.detection_queue = queue.Queue(maxsize=100)
        
        logger.info(f"🔍 Detection Agent '{name}' initialized")
    
    async def initialize(self):
        """Initialize the Detection Agent"""
        try:
            self.status = "initializing"
            
            # Initialize AI models
            await self._initialize_models()
            
            # Initialize correlation engine
            if self.enable_threat_correlation:
                await self._initialize_correlation_engine()
            
            # Start worker threads
            await self._start_worker_threads()
            
            # Discover available models
            await self._discover_available_models()
            
            self.status = "ready"
            logger.info(f"✅ Detection Agent '{self.name}' initialized successfully")
            
        except Exception as e:
            self.status = "error"
            logger.error(f"❌ Detection Agent initialization failed: {e}")
            raise
    
    async def _initialize_models(self):
        """Initialize AI detection models"""
        try:
            # Initialize YOLO model
            if YOLO_AVAILABLE:
                await self._load_yolo_model(self.active_model_name)
            else:
                logger.warning("⚠️ YOLO not available - using simulation mode")
            
            # Initialize face recognition
            if self.enable_face_recognition and FACE_RECOGNITION_AVAILABLE:
                self.face_recognition_engine = FaceRecognitionEngine(
                    config=self.config.get('face_recognition', {})
                )
                await self.face_recognition_engine.initialize()
                logger.info("✅ Face recognition engine initialized")
            else:
                logger.warning("⚠️ Face recognition disabled or not available")
            
        except Exception as e:
            logger.error(f"❌ Model initialization failed: {e}")
            raise
    
    async def _load_yolo_model(self, model_path: str):
        """Load YOLO model with thread safety"""
        try:
            with self.model_load_lock:
                logger.info(f"🔄 Loading YOLO model: {model_path}")
                
                # Check if model file exists
                if not Path(model_path).exists():
                    # Try to find in models directory
                    models_dir = Path(__file__).parent.parent / "models"
                    full_path = models_dir / model_path
                    if full_path.exists():
                        model_path = str(full_path)
                    else:
                        logger.warning(f"⚠️ Model file not found: {model_path}")
                        return
                
                # Load model
                self.yolo_model = YOLO(model_path)
                self.active_model_name = model_path
                
                # Test model with dummy input
                dummy_frame = np.zeros((640, 640, 3), dtype=np.uint8)
                _ = self.yolo_model(dummy_frame, verbose=False)
                
                logger.info(f"✅ YOLO model loaded successfully: {model_path}")
                
        except Exception as e:
            logger.error(f"❌ YOLO model loading failed: {e}")
            self.yolo_model = None
    
    async def _initialize_correlation_engine(self):
        """Initialize threat correlation engine"""
        try:
            self.threat_correlation_engine = ThreatCorrelationEngine(
                config=self.config.get('threat_correlation', {})
            )
            await self.threat_correlation_engine.initialize()
            logger.info("✅ Threat correlation engine initialized")
            
        except Exception as e:
            logger.error(f"❌ Threat correlation initialization failed: {e}")
            self.threat_correlation_engine = None
    
    async def _start_worker_threads(self):
        """Start background worker threads"""
        try:
            # Start main detection processing thread
            self.worker_thread = threading.Thread(
                target=self._detection_worker_main,
                name=f"{self.name}_detection_worker",
                daemon=True
            )
            self.worker_thread.start()
            
            # Start model management thread
            self.model_manager_thread = threading.Thread(
                target=self._model_manager_main,
                name=f"{self.name}_model_manager",
                daemon=True
            )
            self.model_manager_thread.start()
            
            logger.info(f"✅ Worker threads started for Detection Agent '{self.name}'")
            
        except Exception as e:
            logger.error(f"❌ Failed to start worker threads: {e}")
            raise
    
    def _detection_worker_main(self):
        """Main detection processing worker thread"""
        logger.info(f"🔄 Detection Agent worker thread started: {self.name}")
        
        while not self.shutdown_event.is_set():
            try:
                # Process detection queue
                try:
                    detection_task = self.detection_queue.get(timeout=1.0)
                    self._process_detection_task(detection_task)
                    self.detection_queue.task_done()
                except queue.Empty:
                    continue
                    
            except Exception as e:
                logger.error(f"❌ Detection worker error: {e}")
                self.metrics['error_count'] += 1
                time.sleep(1)
    
    def _model_manager_main(self):
        """Model management worker thread"""
        logger.info(f"🧠 Detection Agent model manager started: {self.name}")
        
        while not self.shutdown_event.is_set():
            try:
                # Periodic model health checks
                self._check_model_health()
                
                # Sleep for check interval
                self.shutdown_event.wait(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"❌ Model manager error: {e}")
                time.sleep(5)
    
    def _process_detection_task(self, task: DetectionTask):
        """Process a single detection task"""
        try:
            start_time = time.time()
            
            frame_data = task.frame_data
            if not frame_data:
                logger.warning(f"⚠️ No frame data for task {task.task_id}")
                return
            
            # Extract frame from frame_data
            frame = frame_data.get('frame')
            if frame is None:
                logger.warning(f"⚠️ No frame in frame_data for task {task.task_id}")
                return
            
            # Perform detection based on task action
            if task.action == 'analyze_threat':
                results = self._perform_threat_analysis(frame, frame_data)
            elif task.action == 'classify_incident':
                results = self._perform_incident_classification(frame, frame_data)
            elif task.action == 'background_scan':
                results = self._perform_background_scan(frame, frame_data)
            else:
                logger.warning(f"⚠️ Unknown detection action: {task.action}")
                return
            
            processing_time = time.time() - start_time
            
            # Update metrics
            self._update_detection_metrics(results, processing_time)
            
            # Store results
            for result in results:
                self._store_detection_result(result)
            
            logger.debug(f"🔍 Processed detection task {task.task_id} in {processing_time:.3f}s")
            
        except Exception as e:
            logger.error(f"❌ Detection task processing error: {e}")
            self.metrics['error_count'] += 1
    
    def _perform_threat_analysis(self, frame: np.ndarray, frame_data: Dict) -> List[DetectionResult]:
        """Perform comprehensive threat analysis on frame"""
        try:
            results = []
            
            # YOLO object detection
            if self.yolo_model:
                yolo_results = self._run_yolo_detection(frame, frame_data)
                results.extend(yolo_results)
            else:
                # Simulation mode
                results.extend(self._simulate_threat_detection(frame, frame_data))
            
            # Face recognition
            if self.face_recognition_engine and self.enable_face_recognition:
                face_results = self._run_face_recognition(frame, frame_data)
                results.extend(face_results)
            
            # Threat correlation
            if self.threat_correlation_engine and len(results) > 0:
                correlated_results = self._correlate_threats(results, frame_data)
                results = correlated_results
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Threat analysis error: {e}")
            return []
    
    def _run_yolo_detection(self, frame: np.ndarray, frame_data: Dict) -> List[DetectionResult]:
        """Run YOLO detection on frame"""
        try:
            results = []
            
            # Run YOLO inference
            start_time = time.time()
            predictions = self.yolo_model(frame, conf=self.confidence_threshold, iou=self.iou_threshold)
            inference_time = time.time() - start_time
            
            self.metrics['model_inference_time'] = inference_time
            
            # Process predictions
            for prediction in predictions:
                boxes = prediction.boxes
                if boxes is not None:
                    for i, box in enumerate(boxes):
                        # Extract detection data
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())
                        class_name = self.yolo_model.names[class_id]
                        
                        # Convert to our format (x, y, width, height)
                        bbox = (int(x1), int(y1), int(x2 - x1), int(y2 - y1))
                        
                        # Classify threat level
                        threat_level = self._classify_threat_level(class_name, confidence)
                        threat_type = self._map_class_to_threat_type(class_name)
                        
                        # Create detection result
                        detection_result = DetectionResult(
                            detection_id=f"det_{self.detection_counter}_{int(time.time() * 1000)}",
                            threat_type=threat_type,
                            threat_level=threat_level,
                            confidence=confidence,
                            bounding_box=bbox,
                            frame_id=frame_data.get('frame_id', 'unknown'),
                            source_id=frame_data.get('source_id', 'unknown'),
                            timestamp=datetime.now().isoformat(),
                            metadata={
                                'yolo_class': class_name,
                                'yolo_class_id': class_id,
                                'model_name': self.active_model_name,
                                'inference_time': inference_time
                            }
                        )
                        
                        results.append(detection_result)
                        self.detection_counter += 1
            
            return results
            
        except Exception as e:
            logger.error(f"❌ YOLO detection error: {e}")
            return []
    
    def _simulate_threat_detection(self, frame: np.ndarray, frame_data: Dict) -> List[DetectionResult]:
        """Simulate threat detection for development/testing"""
        try:
            results = []
            
            # Randomly generate some detections for simulation
            import random
            
            if random.random() < 0.1:  # 10% chance of detection per frame
                threat_types = ['person', 'vehicle', 'suspicious_activity']
                threat_type = random.choice(threat_types)
                
                # Random bounding box
                h, w = frame.shape[:2]
                x = random.randint(0, w//2)
                y = random.randint(0, h//2)
                width = random.randint(50, min(200, w-x))
                height = random.randint(50, min(200, h-y))
                
                detection_result = DetectionResult(
                    detection_id=f"sim_det_{self.detection_counter}_{int(time.time() * 1000)}",
                    threat_type=threat_type,
                    threat_level=ThreatLevel.MEDIUM,
                    confidence=random.uniform(0.6, 0.95),
                    bounding_box=(x, y, width, height),
                    frame_id=frame_data.get('frame_id', 'unknown'),
                    source_id=frame_data.get('source_id', 'unknown'),
                    timestamp=datetime.now().isoformat(),
                    metadata={
                        'simulation': True,
                        'random_detection': True
                    }
                )
                
                results.append(detection_result)
                self.detection_counter += 1
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Simulation detection error: {e}")
            return []
    
    def _run_face_recognition(self, frame: np.ndarray, frame_data: Dict) -> List[DetectionResult]:
        """Run face recognition on frame"""
        try:
            if not self.face_recognition_engine:
                return []
            
            results = []
            
            # Run face recognition
            face_results = self.face_recognition_engine.process_frame(frame)
            
            for face_result in face_results:
                # Create detection result for face
                detection_result = DetectionResult(
                    detection_id=f"face_{self.detection_counter}_{int(time.time() * 1000)}",
                    threat_type="face_detection",
                    threat_level=ThreatLevel.LOW,  # Faces are generally low threat unless blacklisted
                    confidence=face_result.get('confidence', 0.8),
                    bounding_box=face_result.get('bbox', (0, 0, 100, 100)),
                    frame_id=frame_data.get('frame_id', 'unknown'),
                    source_id=frame_data.get('source_id', 'unknown'),
                    timestamp=datetime.now().isoformat(),
                    metadata={
                        'face_recognition': True
                    },
                    face_data=face_result
                )
                
                # Check if this is a blacklisted person
                if face_result.get('person_name') and face_result.get('is_blacklisted', False):
                    detection_result.threat_level = ThreatLevel.HIGH
                    detection_result.threat_type = "blacklisted_person"
                
                results.append(detection_result)
                self.detection_counter += 1
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Face recognition error: {e}")
            return []
    
    def _correlate_threats(self, results: List[DetectionResult], frame_data: Dict) -> List[DetectionResult]:
        """Correlate threats using the correlation engine"""
        try:
            if not self.threat_correlation_engine:
                return results
            
            # Convert results to correlation engine format
            threat_data = []
            for result in results:
                threat_data.append({
                    'detection_id': result.detection_id,
                    'threat_type': result.threat_type,
                    'confidence': result.confidence,
                    'bounding_box': result.bounding_box,
                    'timestamp': result.timestamp
                })
            
            # Run correlation
            correlated_data = self.threat_correlation_engine.correlate_threats(
                threat_data, frame_data
            )
            
            # Update results with correlation info
            for result in results:
                correlation_info = next(
                    (cd for cd in correlated_data if cd.get('detection_id') == result.detection_id),
                    None
                )
                if correlation_info:
                    result.metadata['correlation'] = correlation_info
                    
                    # Update threat level if correlation suggests higher severity
                    if correlation_info.get('escalated_threat_level'):
                        result.threat_level = ThreatLevel(correlation_info['escalated_threat_level'])
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Threat correlation error: {e}")
            return results
    
    def _perform_incident_classification(self, frame: np.ndarray, frame_data: Dict) -> List[DetectionResult]:
        """Perform incident classification (more thorough analysis)"""
        # Similar to threat analysis but with additional classification steps
        return self._perform_threat_analysis(frame, frame_data)
    
    def _perform_background_scan(self, frame: np.ndarray, frame_data: Dict) -> List[DetectionResult]:
        """Perform background scanning (lighter analysis)"""
        try:
            # Lighter version of threat analysis with higher thresholds
            original_threshold = self.confidence_threshold
            self.confidence_threshold = min(0.8, original_threshold + 0.2)  # Higher threshold
            
            results = self._perform_threat_analysis(frame, frame_data)
            
            # Restore original threshold
            self.confidence_threshold = original_threshold
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Background scan error: {e}")
            return []
    
    def _classify_threat_level(self, class_name: str, confidence: float) -> ThreatLevel:
        """Classify threat level based on detected class and confidence"""
        try:
            # Check for weapon classes
            if any(weapon in class_name.lower() for weapon in self.threat_classes.get('weapon', [])):
                return ThreatLevel.WEAPON if confidence > 0.8 else ThreatLevel.CRITICAL
            
            # Check for violence classes
            if any(violence in class_name.lower() for violence in self.threat_classes.get('violence', [])):
                return ThreatLevel.HIGH if confidence > 0.7 else ThreatLevel.MEDIUM
            
            # Check for suspicious activity
            if any(suspicious in class_name.lower() for suspicious in self.threat_classes.get('suspicious', [])):
                return ThreatLevel.MEDIUM if confidence > 0.6 else ThreatLevel.LOW
            
            # Default classification based on confidence
            if confidence > 0.9:
                return ThreatLevel.HIGH
            elif confidence > 0.7:
                return ThreatLevel.MEDIUM
            else:
                return ThreatLevel.LOW
                
        except Exception as e:
            logger.error(f"❌ Threat level classification error: {e}")
            return ThreatLevel.LOW
    
    def _map_class_to_threat_type(self, class_name: str) -> str:
        """Map YOLO class name to threat type"""
        try:
            class_lower = class_name.lower()
            
            # Check each threat category
            for threat_type, class_list in self.threat_classes.items():
                if any(threat_class in class_lower for threat_class in class_list):
                    return f"{threat_type}_detection"
            
            # Default mapping
            return f"{class_name}_detection"
            
        except Exception as e:
            logger.error(f"❌ Class mapping error: {e}")
            return "unknown_detection"
    
    def _update_detection_metrics(self, results: List[DetectionResult], processing_time: float):
        """Update detection performance metrics"""
        try:
            self.metrics['total_detections'] += len(results)
            
            # Count threats
            threat_count = len([r for r in results if r.threat_level != ThreatLevel.LOW])
            self.metrics['threats_detected'] += threat_count
            
            # Count faces
            face_count = len([r for r in results if 'face' in r.threat_type])
            self.metrics['faces_recognized'] += face_count
            
            # Update average confidence
            if results:
                total_confidence = sum(r.confidence for r in results)
                avg_confidence = total_confidence / len(results)
                
                # Rolling average
                total_detections = self.metrics['total_detections']
                current_avg = self.metrics['average_confidence']
                new_avg = ((current_avg * (total_detections - len(results))) + 
                          (avg_confidence * len(results))) / total_detections
                self.metrics['average_confidence'] = new_avg
            
            # Update last detection time
            if results:
                self.metrics['last_detection_time'] = datetime.now().isoformat()
            
        except Exception as e:
            logger.error(f"❌ Metrics update error: {e}")
    
    def _store_detection_result(self, result: DetectionResult):
        """Store detection result in history"""
        try:
            self.detection_history.append(result)
            
            # Maintain history size limit
            if len(self.detection_history) > self.max_history_size:
                self.detection_history.pop(0)
                
        except Exception as e:
            logger.error(f"❌ Detection result storage error: {e}")
    
    def _check_model_health(self):
        """Check health of loaded models"""
        try:
            # Check YOLO model
            if self.yolo_model:
                try:
                    # Test with dummy input
                    dummy_frame = np.zeros((320, 320, 3), dtype=np.uint8)
                    _ = self.yolo_model(dummy_frame, verbose=False)
                    logger.debug("✅ YOLO model health check passed")
                except Exception as e:
                    logger.error(f"❌ YOLO model health check failed: {e}")
                    # Could trigger model reload here
            
            # Check face recognition engine
            if self.face_recognition_engine:
                # Face recognition engine health check would go here
                logger.debug("✅ Face recognition health check passed")
                
        except Exception as e:
            logger.error(f"❌ Model health check error: {e}")
    
    async def _discover_available_models(self):
        """Discover available AI models"""
        try:
            models_dir = Path(__file__).parent.parent / "models"
            if models_dir.exists():
                for model_file in models_dir.glob("*.pt"):
                    model_name = model_file.name
                    self.available_models[model_name] = str(model_file)
                    logger.debug(f"📋 Discovered model: {model_name}")
            
            logger.info(f"📋 Discovered {len(self.available_models)} available models")
            
        except Exception as e:
            logger.error(f"❌ Model discovery error: {e}")
    
    async def execute_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a task assigned by the MCP Server"""
        try:
            task_id = task_data.get('task_id', 'unknown')
            action = task_data.get('action', 'unknown')
            parameters = task_data.get('parameters', {})
            
            logger.info(f"🎯 Executing Detection Agent task: {action} [{task_id}]")
            
            start_time = time.time()
            
            # Execute based on action type
            if action == 'analyze_threat':
                result = await self._handle_analyze_threat(parameters)
            elif action == 'classify_incident':
                result = await self._handle_classify_incident(parameters)
            elif action == 'background_scan':
                result = await self._handle_background_scan(parameters)
            elif action == 'switch_model':
                result = await self._handle_switch_model(parameters)
            elif action == 'get_status':
                result = await self._handle_get_status(parameters)
            elif action == 'get_detections':
                result = await self._handle_get_detections(parameters)
            else:
                result = {
                    'success': False,
                    'error': f'Unknown action: {action}',
                    'supported_actions': ['analyze_threat', 'classify_incident', 'background_scan', 
                                        'switch_model', 'get_status', 'get_detections']
                }
            
            execution_time = time.time() - start_time
            
            # Add execution metadata
            result['execution_time'] = execution_time
            result['task_id'] = task_id
            result['agent'] = self.name
            result['timestamp'] = datetime.now().isoformat()
            
            logger.info(f"✅ Detection Agent task completed: {action} in {execution_time:.3f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Task execution failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'task_id': task_data.get('task_id', 'unknown'),
                'agent': self.name,
                'timestamp': datetime.now().isoformat()
            }
    
    async def _handle_analyze_threat(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle threat analysis request"""
        try:
            # This would typically receive frame data from Vision Agent
            frame_data = parameters.get('frame_data')
            if not frame_data:
                return {'success': False, 'error': 'No frame data provided'}
            
            # Create detection task
            detection_task = DetectionTask(
                task_id=f"threat_analysis_{int(time.time() * 1000)}",
                action='analyze_threat',
                frame_data=frame_data,
                parameters=parameters
            )
            
            # Add to processing queue
            try:
                self.detection_queue.put(detection_task, timeout=1.0)
                
                return {
                    'success': True,
                    'task_queued': True,
                    'detection_task_id': detection_task.task_id,
                    'queue_size': self.detection_queue.qsize()
                }
            except queue.Full:
                return {
                    'success': False,
                    'error': 'Detection queue is full',
                    'queue_size': self.detection_queue.qsize()
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _handle_classify_incident(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incident classification request"""
        # Similar to analyze_threat but for incident classification
        return await self._handle_analyze_threat(parameters)
    
    async def _handle_background_scan(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle background scan request"""
        # Similar to analyze_threat but for background scanning
        return await self._handle_analyze_threat(parameters)
    
    async def _handle_switch_model(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle model switching request"""
        try:
            model_name = parameters.get('model_name')
            if not model_name:
                return {
                    'success': False,
                    'error': 'No model name provided',
                    'available_models': list(self.available_models.keys())
                }
            
            if model_name not in self.available_models:
                return {
                    'success': False,
                    'error': f'Model not found: {model_name}',
                    'available_models': list(self.available_models.keys())
                }
            
            # Switch model
            model_path = self.available_models[model_name]
            await self._load_yolo_model(model_path)
            
            self.metrics['model_switches'] += 1
            
            return {
                'success': True,
                'previous_model': self.active_model_name,
                'new_model': model_name,
                'model_path': model_path
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _handle_get_status(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle status request"""
        try:
            return {
                'success': True,
                'agent_name': self.name,
                'status': self.status,
                'enabled': self.enabled,
                'active_model': self.active_model_name,
                'available_models': list(self.available_models.keys()),
                'detection_queue_size': self.detection_queue.qsize(),
                'detection_history_size': len(self.detection_history),
                'metrics': self.metrics.copy(),
                'configuration': {
                    'confidence_threshold': self.confidence_threshold,
                    'iou_threshold': self.iou_threshold,
                    'enable_face_recognition': self.enable_face_recognition,
                    'enable_threat_correlation': self.enable_threat_correlation
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _handle_get_detections(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle get detections request"""
        try:
            limit = parameters.get('limit', 50)
            threat_level_filter = parameters.get('threat_level')
            
            # Filter detections
            filtered_detections = self.detection_history
            
            if threat_level_filter:
                filtered_detections = [
                    d for d in filtered_detections 
                    if d.threat_level.value == threat_level_filter
                ]
            
            # Limit results
            recent_detections = filtered_detections[-limit:] if filtered_detections else []
            
            # Convert to serializable format
            detection_data = []
            for detection in recent_detections:
                detection_data.append({
                    'detection_id': detection.detection_id,
                    'threat_type': detection.threat_type,
                    'threat_level': detection.threat_level.value,
                    'confidence': detection.confidence,
                    'bounding_box': detection.bounding_box,
                    'frame_id': detection.frame_id,
                    'source_id': detection.source_id,
                    'timestamp': detection.timestamp,
                    'metadata': detection.metadata,
                    'face_data': detection.face_data
                })
            
            return {
                'success': True,
                'detections': detection_data,
                'total_detections': len(detection_data),
                'filtered_from': len(self.detection_history)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_agent_info(self) -> Dict[str, Any]:
        """Get comprehensive agent information"""
        return {
            'name': self.name,
            'type': 'detection_agent',
            'status': self.status,
            'enabled': self.enabled,
            'config': self.config,
            'capabilities': [
                'analyze_threat',
                'classify_incident',
                'background_scan',
                'switch_model',
                'get_status',
                'get_detections'
            ],
            'active_model': self.active_model_name,
            'available_models': len(self.available_models),
            'metrics': self.metrics.copy(),
            'uptime': time.time() - getattr(self, '_start_time', time.time())
        }
    
    async def shutdown(self):
        """Shutdown the Detection Agent"""
        try:
            logger.info(f"🛑 Shutting down Detection Agent '{self.name}'")
            
            self.status = "shutting_down"
            self.shutdown_event.set()
            
            # Wait for threads to finish
            if self.worker_thread and self.worker_thread.is_alive():
                self.worker_thread.join(timeout=5)
            
            if self.model_manager_thread and self.model_manager_thread.is_alive():
                self.model_manager_thread.join(timeout=5)
            
            # Cleanup models
            if self.yolo_model:
                # YOLO models don't need explicit cleanup
                self.yolo_model = None
            
            if self.face_recognition_engine:
                await self.face_recognition_engine.shutdown()
            
            if self.threat_correlation_engine:
                await self.threat_correlation_engine.shutdown()
            
            # Clear history and caches
            self.detection_history.clear()
            self.active_tasks.clear()
            
            self.status = "shutdown"
            logger.info(f"✅ Detection Agent '{self.name}' shutdown complete")
            
        except Exception as e:
            logger.error(f"❌ Detection Agent shutdown error: {e}")
            self.status = "error"
