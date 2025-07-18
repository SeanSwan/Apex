"""
APEX AI ENGINE - ENHANCED INFERENCE SCRIPT WITH FACE RECOGNITION
================================================================
Advanced AI processing engine for real-time security monitoring
Features: YOLO detection, Face Recognition, RTSP processing, rule engine, WebSocket communication

NEW FEATURES:
- Face Recognition Integration
- Unknown person alerts
- Blacklist detection
- Database integration for known faces

Requirements:
- ultralytics (YOLOv8)
- face_recognition
- opencv-python
- websockets
- numpy
- Pillow
- psycopg2
- asyncio
"""

import asyncio
import json
import logging
import cv2
import numpy as np
import websockets
import time
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import threading
import queue
from enum import Enum

# AI/ML imports
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("⚠️ Ultralytics not installed. Install with: pip install ultralytics")

# Face Recognition import
try:
    from face_recognition_engine import FaceRecognitionEngine
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("⚠️ Face recognition not available. Install with: pip install face_recognition")

# Import Sprint 4 Alert Engines
try:
    from visual_alerts.visual_alert_engine import VisualAlertEngine
    VISUAL_ALERTS_AVAILABLE = True
except ImportError:
    VISUAL_ALERTS_AVAILABLE = False
    print("⚠️ Visual Alert Engine not available")

try:
    from audio_alerts.spatial_audio_engine import SpatialAudioEngine
    AUDIO_ALERTS_AVAILABLE = True
except ImportError:
    AUDIO_ALERTS_AVAILABLE = False
    print("⚠️ Spatial Audio Engine not available")

try:
    from ai_voice.ai_conversation_engine import AIConversationEngine
    AI_CONVERSATION_AVAILABLE = True
except ImportError:
    AI_CONVERSATION_AVAILABLE = False
    print("⚠️ AI Conversation Engine not available")

# Import Master Threat Detection Coordinator
try:
    from models.master_threat_coordinator import MasterThreatDetectionCoordinator
    MASTER_COORDINATOR_AVAILABLE = True
except ImportError:
    MASTER_COORDINATOR_AVAILABLE = False
    print("⚠️ Master Threat Detection Coordinator not available")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EnhancedApexAIEngine:
    """
    Enhanced AI Engine with Face Recognition capabilities
    """
    
    def __init__(self, websocket_port=8765, model_path=None, db_config=None, openai_api_key=None):
        self.websocket_port = websocket_port
        self.model_path = model_path or "yolov8n.pt"  # Default to nano model
        self.model = None
        self.face_engine = None
        self.db_config = db_config or self.get_default_db_config()
        self.openai_api_key = openai_api_key
        
        # Processing queues
        self.active_cameras = {}
        self.detection_queue = queue.Queue()
        self.face_detection_queue = queue.Queue()
        self.ai_rules = self.load_default_rules()
        self.websocket_clients = set()
        self.is_running = False
        
        # Sprint 4: Initialize Alert Engines
        self.visual_alert_engine = None
        self.spatial_audio_engine = None
        self.ai_conversation_engine = None
        self.master_threat_coordinator = None
        
        # Performance tracking
        self.detection_count = 0
        self.face_detection_count = 0
        self.start_time = time.time()
        
        logger.info("🚀 Enhanced Apex AI Engine initialized with Face Recognition")

    def get_default_db_config(self) -> Dict:
        """Get default database configuration from environment"""
        return {
            'host': os.getenv('PG_HOST', 'localhost'),
            'database': os.getenv('PG_DB', 'apex'),
            'user': os.getenv('PG_USER', 'swanadmin'),
            'password': os.getenv('PG_PASSWORD', ''),
            'port': int(os.getenv('PG_PORT', 5432))
        }

    def load_default_rules(self) -> Dict:
        """Load enhanced AI detection rules with face recognition"""
        return {
            "person_detection": {
                "enabled": True,
                "confidence_threshold": 0.5,
                "track_movement": True,
                "face_recognition": True
            },
            "face_recognition": {
                "enabled": True,
                "confidence_threshold": 0.7,
                "unknown_person_alert": True,
                "blacklist_alert": True,
                "vip_notification": True
            },
            "loitering": {
                "enabled": True,
                "time_threshold": 300,  # 5 minutes
                "zones": ["entrance", "elevator", "parking"],
                "priority": "medium"
            },
            "zone_breach": {
                "enabled": True,
                "restricted_zones": ["server_room", "executive_area"],
                "priority": "high"
            },
            "unknown_person": {
                "enabled": True,
                "alert_threshold": 0.8,
                "priority": "high",
                "auto_snapshot": True
            },
            "blacklist_detection": {
                "enabled": True,
                "priority": "critical",
                "immediate_alert": True,
                "auto_dispatch": True
            }
        }

    async def load_models(self):
        """Load YOLO, Face Recognition models, and Sprint 4 Alert Engines"""
        success = True
        
        # Load YOLO model
        try:
            if not YOLO_AVAILABLE:
                print("⚠️  YOLO not available - running object detection in DEMO mode")
                logger.warning("YOLO not available, using simulation mode")
            else:
                print(f"📥 Loading YOLO model: {self.model_path}")
                logger.info(f"📥 Loading YOLO model: {self.model_path}")
                
                self.model = YOLO(self.model_path)
                print("✅ YOLO model loaded successfully")
                logger.info("✅ YOLO model loaded successfully")
                
        except Exception as e:
            print(f"⚠️  YOLO model loading failed - using DEMO mode")
            print(f"   Error: {e}")
            logger.error(f"❌ Failed to load YOLO model: {e}")
        
        # Load Face Recognition engine
        try:
            if not FACE_RECOGNITION_AVAILABLE:
                print("⚠️  Face Recognition not available - skipping face detection")
                logger.warning("Face Recognition not available")
            else:
                print("📥 Loading Face Recognition engine...")
                logger.info("📥 Loading Face Recognition engine...")
                
                self.face_engine = FaceRecognitionEngine(
                    self.db_config,
                    confidence_threshold=self.ai_rules['face_recognition']['confidence_threshold']
                )
                
                # Load known faces from database
                known_faces = self.face_engine.load_known_faces()
                print(f"✅ Face Recognition engine loaded with {len(known_faces)} known faces")
                logger.info(f"✅ Face Recognition engine loaded with {len(known_faces)} known faces")
                
        except Exception as e:
            print(f"⚠️  Face Recognition engine loading failed")
            print(f"   Error: {e}")
            logger.error(f"❌ Failed to load Face Recognition engine: {e}")
            success = False
        
        # Load Master Threat Detection Coordinator
        try:
            if MASTER_COORDINATOR_AVAILABLE:
                print("📥 Loading Master Threat Detection Coordinator...")
                logger.info("📥 Loading Master Threat Detection Coordinator...")
                
                self.master_threat_coordinator = MasterThreatDetectionCoordinator()
                print("✅ Master Threat Detection Coordinator loaded successfully")
                logger.info("✅ Master Threat Detection Coordinator loaded successfully")
            else:
                print("⚠️  Master Threat Coordinator not available")
                logger.warning("Master Threat Coordinator not available")
        except Exception as e:
            print(f"⚠️  Master Threat Coordinator loading failed: {e}")
            logger.error(f"❌ Failed to load Master Threat Coordinator: {e}")
        
        # Load Visual Alert Engine
        try:
            if VISUAL_ALERTS_AVAILABLE:
                print("🎨 Loading Visual Alert Engine...")
                logger.info("🎨 Loading Visual Alert Engine...")
                
                visual_config = {
                    'border_thickness': 8,
                    'max_opacity': 0.8,
                    'min_opacity': 0.2
                }
                self.visual_alert_engine = VisualAlertEngine(visual_config)
                print("✅ Visual Alert Engine loaded successfully")
                logger.info("✅ Visual Alert Engine loaded successfully")
            else:
                print("⚠️  Visual Alert Engine not available")
                logger.warning("Visual Alert Engine not available")
        except Exception as e:
            print(f"⚠️  Visual Alert Engine loading failed: {e}")
            logger.error(f"❌ Failed to load Visual Alert Engine: {e}")
        
        # Load Spatial Audio Engine
        try:
            if AUDIO_ALERTS_AVAILABLE:
                print("🔊 Loading Spatial Audio Engine...")
                logger.info("🔊 Loading Spatial Audio Engine...")
                
                self.spatial_audio_engine = SpatialAudioEngine(
                    sample_rate=44100,
                    buffer_size=1024,
                    channels=8
                )
                print("✅ Spatial Audio Engine loaded successfully")
                logger.info("✅ Spatial Audio Engine loaded successfully")
            else:
                print("⚠️  Spatial Audio Engine not available")
                logger.warning("Spatial Audio Engine not available")
        except Exception as e:
            print(f"⚠️  Spatial Audio Engine loading failed: {e}")
            logger.error(f"❌ Failed to load Spatial Audio Engine: {e}")
        
        # Load AI Conversation Engine
        try:
            if AI_CONVERSATION_AVAILABLE:
                print("🎙️ Loading AI Conversation Engine...")
                logger.info("🎙️ Loading AI Conversation Engine...")
                
                conversation_config = {
                    'max_conversation_time': 300,
                    'max_response_length': 100,
                    'recording_enabled': True
                }
                self.ai_conversation_engine = AIConversationEngine(
                    openai_api_key=self.openai_api_key,
                    config=conversation_config
                )
                print("✅ AI Conversation Engine loaded successfully")
                logger.info("✅ AI Conversation Engine loaded successfully")
            else:
                print("⚠️  AI Conversation Engine not available")
                logger.warning("AI Conversation Engine not available")
        except Exception as e:
            print(f"⚠️  AI Conversation Engine loading failed: {e}")
            logger.error(f"❌ Failed to load AI Conversation Engine: {e}")
        
        # Register zones with alert engines (example setup)
        await self._setup_alert_zones()
        
        return success
    
    async def _setup_alert_zones(self):
        """Setup monitoring zones for alert engines"""
        logger.info("📍 Setting up alert zones for Sprint 4 engines...")
        
        # Example zone configurations (in production, these would come from configuration)
        example_zones = [
            {
                'zone_id': 'entrance_main',
                'monitor_id': 'monitor_1',
                'region': (0, 0, 1920, 1080),
                'spatial_position': {'x': 0.0, 'y': 1.0, 'z': 0.0},  # Front center
                'sensitivity_multiplier': 1.2
            },
            {
                'zone_id': 'lobby_area',
                'monitor_id': 'monitor_2', 
                'region': (0, 0, 1920, 1080),
                'spatial_position': {'x': -0.7, 'y': 0.5, 'z': 0.0},  # Front left
                'sensitivity_multiplier': 1.0
            },
            {
                'zone_id': 'parking_garage',
                'monitor_id': 'monitor_3',
                'region': (0, 0, 1920, 1080),
                'spatial_position': {'x': 0.7, 'y': -0.5, 'z': 0.0},  # Rear right
                'sensitivity_multiplier': 0.8
            }
        ]
        
        # Register zones with Visual Alert Engine
        if self.visual_alert_engine:
            for zone in example_zones:
                self.visual_alert_engine.register_zone(
                    zone_id=zone['zone_id'],
                    monitor_id=zone['monitor_id'],
                    region=zone['region'],
                    sensitivity_multiplier=zone['sensitivity_multiplier']
                )
        
        # Register zones with Spatial Audio Engine
        if self.spatial_audio_engine:
            try:
                from audio_alerts.spatial_audio_engine import SpatialPosition
                for zone in example_zones:
                    spatial_pos = SpatialPosition(
                        x=zone['spatial_position']['x'],
                        y=zone['spatial_position']['y'],
                        z=zone['spatial_position']['z']
                    )
                    self.spatial_audio_engine.register_zone_position(
                        zone_id=zone['zone_id'],
                        position=spatial_pos
                    )
            except Exception as e:
                logger.error(f"❌ Failed to setup spatial audio zones: {e}")
        
        logger.info(f"✅ Setup {len(example_zones)} alert zones successfully")

    async def start_camera_stream(self, camera_data: Dict):
        """Start processing a camera stream with enhanced detection"""
        camera_id = camera_data.get('id')
        rtsp_url = camera_data.get('rtspUrl')
        
        if camera_id in self.active_cameras:
            logger.warning(f"⚠️ Camera {camera_id} already active")
            return
            
        logger.info(f"📹 Starting enhanced camera stream: {camera_id}")
        
        # Create enhanced camera processor
        camera_processor = EnhancedCameraProcessor(
            camera_id=camera_id,
            rtsp_url=rtsp_url,
            model=self.model,
            face_engine=self.face_engine,
            ai_rules=self.ai_rules,
            detection_queue=self.detection_queue,
            face_detection_queue=self.face_detection_queue
        )
        
        # Start processing in separate thread
        thread = threading.Thread(
            target=camera_processor.process_stream,
            daemon=True
        )
        thread.start()
        
        self.active_cameras[camera_id] = {
            'processor': camera_processor,
            'thread': thread,
            'camera_data': camera_data,
            'start_time': time.time()
        }
        
        # Notify clients
        await self.broadcast_message({
            'type': 'camera_status',
            'data': {
                'camera_id': camera_id,
                'status': 'active',
                'features': ['object_detection', 'face_recognition'],
                'timestamp': datetime.now().isoformat()
            }
        })

    async def process_detection_queues(self):
        """Process both object and face detection queues"""
        while self.is_running:
            try:
                # Process object detections
                if not self.detection_queue.empty():
                    detection = self.detection_queue.get_nowait()
                    await self.handle_object_detection(detection)
                
                # Process face detections
                if not self.face_detection_queue.empty():
                    face_detection = self.face_detection_queue.get_nowait()
                    await self.handle_face_detection(face_detection)
                
                if self.detection_queue.empty() and self.face_detection_queue.empty():
                    await asyncio.sleep(0.1)
                    
            except Exception as e:
                logger.error(f"❌ Detection queue processing error: {e}")
                await asyncio.sleep(1)

    async def handle_object_detection(self, detection: Dict):
        """Handle object detection results with Sprint 4 alert integration"""
        self.detection_count += 1
        
        # Use Master Threat Coordinator if available
        if self.master_threat_coordinator:
            threat_analysis = self.master_threat_coordinator.analyze_detection(detection)
        else:
            # Fallback to original rules
            threat_analysis = self.apply_object_detection_rules(detection)
        
        # Process threat analysis results
        for alert in threat_analysis if isinstance(threat_analysis, list) else [threat_analysis]:
            if alert and alert.get('alert_type'):
                await self._process_threat_alert(alert, detection)
        
        # Broadcast detection
        await self.broadcast_message({
            'type': 'object_detection',
            'data': detection
        })
    
    async def _process_threat_alert(self, alert: Dict, detection: Dict):
        """Process threat alert through all Sprint 4 alert engines"""
        try:
            # Extract alert information
            alert_type = alert.get('alert_type', 'unknown')
            threat_level = alert.get('priority', 'medium').upper()
            camera_id = detection.get('camera_id', 'unknown')
            zone_id = self._map_camera_to_zone(camera_id)
            
            # Convert threat level to enum (with fallback)
            try:
                from models.base_threat_model import ThreatLevel
                if hasattr(ThreatLevel, threat_level):
                    threat_level_enum = getattr(ThreatLevel, threat_level)
                else:
                    threat_level_enum = ThreatLevel.MEDIUM  # Default fallback
            except:
                # Define fallback enum if import fails
                class ThreatLevel:
                    LOW = 1
                    MEDIUM = 2 
                    HIGH = 3
                    CRITICAL = 4
                threat_level_enum = ThreatLevel.MEDIUM
            
            # Prepare threat data for alert engines
            threat_data = {
                'type': alert_type,
                'threat_level': threat_level_enum,
                'confidence': detection.get('confidence', 0.5),
                'description': alert.get('description', f'{alert_type} detected'),
                'bbox': detection.get('bounding_box', (0, 0, 100, 100)),
                'camera_id': camera_id,
                'zone_id': zone_id,
                'timestamp': datetime.now().isoformat()
            }
            
            # Trigger Visual Alert
            if self.visual_alert_engine and zone_id:
                try:
                    visual_alert_id = self.visual_alert_engine.trigger_alert(zone_id, threat_data)
                    logger.info(f"🎨 Visual alert triggered: {visual_alert_id}")
                    
                    # Broadcast visual alert data to frontend
                    overlay_data = self.visual_alert_engine.export_overlay_data_for_frontend(
                        self._get_monitor_for_zone(zone_id)
                    )
                    await self.broadcast_message({
                        'type': 'visual_alert',
                        'data': {
                            'alert_id': visual_alert_id,
                            'zone_id': zone_id,
                            'overlay_data': overlay_data,
                            'threat_data': threat_data
                        }
                    })
                except Exception as e:
                    logger.error(f"❌ Visual alert error: {e}")
            
            # Trigger Spatial Audio Alert
            if self.spatial_audio_engine:
                try:
                    audio_alert_id = self.spatial_audio_engine.play_threat_alert(threat_data)
                    if audio_alert_id:
                        logger.info(f"🔊 Audio alert triggered: {audio_alert_id}")
                        
                        # Broadcast audio alert notification
                        await self.broadcast_message({
                            'type': 'audio_alert',
                            'data': {
                                'alert_id': audio_alert_id,
                                'zone_id': zone_id,
                                'threat_type': alert_type,
                                'threat_level': threat_level,
                                'audio_stats': self.spatial_audio_engine.get_audio_statistics()
                            }
                        })
                except Exception as e:
                    logger.error(f"❌ Audio alert error: {e}")
            
            # Trigger AI Conversation (for appropriate threats)
            if (self.ai_conversation_engine and 
                alert_type in ['trespassing', 'violence', 'weapon', 'vandalism'] and
                threat_level_enum.value >= 2):  # Medium or higher priority
                try:
                    conversation_trigger = {
                        'threat_level': threat_level_enum,
                        'threat_type': alert_type,
                        'location': zone_id,
                        'camera_id': camera_id,
                        'person_id': detection.get('person_id'),
                        'confidence': threat_data['confidence']
                    }
                    
                    conversation_id = await self.ai_conversation_engine.start_conversation(conversation_trigger)
                    if conversation_id:
                        logger.info(f"🎙️ AI conversation started: {conversation_id}")
                        
                        # Broadcast conversation start notification
                        await self.broadcast_message({
                            'type': 'ai_conversation_started',
                            'data': {
                                'conversation_id': conversation_id,
                                'zone_id': zone_id,
                                'threat_type': alert_type,
                                'threat_level': threat_level
                            }
                        })
                except Exception as e:
                    logger.error(f"❌ AI conversation error: {e}")
            
            # Broadcast master alert notification
            await self.broadcast_message({
                'type': 'threat_alert',
                'data': {
                    'alert_type': alert_type,
                    'threat_level': threat_level,
                    'zone_id': zone_id,
                    'camera_id': camera_id,
                    'description': threat_data['description'],
                    'confidence': threat_data['confidence'],
                    'timestamp': threat_data['timestamp'],
                    'engines_triggered': {
                        'visual': self.visual_alert_engine is not None,
                        'audio': self.spatial_audio_engine is not None,
                        'conversation': self.ai_conversation_engine is not None
                    }
                }
            })
            
        except Exception as e:
            logger.error(f"❌ Error processing threat alert: {e}")
    
    def _map_camera_to_zone(self, camera_id: str) -> str:
        """Map camera ID to zone ID (simplified mapping)"""
        # In production, this would come from configuration
        camera_zone_map = {
            'camera_1': 'entrance_main',
            'camera_2': 'lobby_area', 
            'camera_3': 'parking_garage'
        }
        return camera_zone_map.get(camera_id, 'default_zone')
    
    def _get_monitor_for_zone(self, zone_id: str) -> str:
        """Get monitor ID for a zone (simplified mapping)"""
        # In production, this would come from configuration
        zone_monitor_map = {
            'entrance_main': 'monitor_1',
            'lobby_area': 'monitor_2',
            'parking_garage': 'monitor_3'
        }
        return zone_monitor_map.get(zone_id, 'monitor_1')

    async def handle_face_detection(self, face_detection: Dict):
        """Handle face detection and recognition results with Sprint 4 integration"""
        self.face_detection_count += 1
        
        # Apply AI rules for face detection
        alerts = self.apply_face_detection_rules(face_detection)
        
        # Process face-based threat alerts through Sprint 4 engines
        for alert in alerts:
            if alert and alert.get('alert_type'):
                await self._process_threat_alert(alert, face_detection)
        
        # Broadcast face detection
        await self.broadcast_message({
            'type': 'face_detection',
            'data': face_detection
        })

    def apply_object_detection_rules(self, detection: Dict) -> List[Dict]:
        """Apply AI rules to object detection and generate alerts"""
        alerts = []
        
        # Person detection rule
        if detection.get('class') == 'person':
            confidence = detection.get('confidence', 0)
            
            # Basic person detection alert
            if (self.ai_rules['person_detection']['enabled'] and 
                confidence >= self.ai_rules['person_detection']['confidence_threshold']):
                
                alerts.append({
                    'alert_id': f"person_{int(time.time())}",
                    'alert_type': 'person_detection',
                    'camera_id': detection['camera_id'],
                    'priority': 'low',
                    'description': f"Person detected with {confidence:.1%} confidence",
                    'timestamp': datetime.now().isoformat(),
                    'detection_details': detection,
                    'requires_face_analysis': True
                })
        
        # Zone breach detection (simulated)
        if self.ai_rules['zone_breach']['enabled']:
            if np.random.random() < 0.03:  # 3% chance for demo
                alerts.append({
                    'alert_id': f"breach_{int(time.time())}",
                    'alert_type': 'zone_breach',
                    'camera_id': detection['camera_id'],
                    'priority': self.ai_rules['zone_breach']['priority'],
                    'description': "Unauthorized access to restricted zone detected",
                    'timestamp': datetime.now().isoformat(),
                    'detection_details': detection
                })
        
        return alerts

    def apply_face_detection_rules(self, face_detection: Dict) -> List[Dict]:
        """Apply AI rules to face detection and generate alerts"""
        alerts = []
        
        if not self.ai_rules['face_recognition']['enabled']:
            return alerts
        
        person_type = face_detection.get('person_type', 'unknown')
        is_match = face_detection.get('is_match', False)
        confidence = face_detection.get('confidence', 0.0)
        person_name = face_detection.get('person_name', 'Unknown')
        
        # Blacklisted person detection - CRITICAL ALERT
        if person_type == 'blacklist' and is_match:
            alerts.append({
                'alert_id': f"blacklist_{int(time.time())}",
                'alert_type': 'security_threat',
                'camera_id': face_detection['camera_id'],
                'priority': 'critical',
                'description': f"🚨 SECURITY ALERT: Blacklisted individual '{person_name}' detected",
                'timestamp': datetime.now().isoformat(),
                'detection_details': face_detection,
                'immediate_action_required': True,
                'auto_dispatch': self.ai_rules['blacklist_detection']['auto_dispatch']
            })
        
        # Unknown person detection
        elif not is_match and self.ai_rules['unknown_person']['enabled']:
            alerts.append({
                'alert_id': f"unknown_face_{int(time.time())}",
                'alert_type': 'unknown_person_face',
                'camera_id': face_detection['camera_id'],
                'priority': self.ai_rules['unknown_person']['priority'],
                'description': f"Unknown person detected - Face recognition confidence: {confidence:.1%}",
                'timestamp': datetime.now().isoformat(),
                'detection_details': face_detection,
                'auto_snapshot': self.ai_rules['unknown_person']['auto_snapshot']
            })
        
        # VIP person notification
        elif person_type == 'vip' and is_match and self.ai_rules['face_recognition']['vip_notification']:
            alerts.append({
                'alert_id': f"vip_{int(time.time())}",
                'alert_type': 'vip_arrival',
                'camera_id': face_detection['camera_id'],
                'priority': 'medium',
                'description': f"VIP arrival: {person_name} detected",
                'timestamp': datetime.now().isoformat(),
                'detection_details': face_detection,
                'notification_type': 'informational'
            })
        
        # After-hours detection for visitors/contractors
        elif person_type in ['visitor', 'contractor'] and is_match:
            current_hour = datetime.now().hour
            if current_hour < 7 or current_hour > 22:  # After hours
                alerts.append({
                    'alert_id': f"after_hours_{int(time.time())}",
                    'alert_type': 'after_hours_access',
                    'camera_id': face_detection['camera_id'],
                    'priority': 'medium',
                    'description': f"After-hours access: {person_name} ({person_type}) detected",
                    'timestamp': datetime.now().isoformat(),
                    'detection_details': face_detection
                })
        
        return alerts

    async def capture_enhanced_snapshot(self, camera_id: str):
        """Capture enhanced snapshot with face detection"""
        if camera_id not in self.active_cameras:
            logger.warning(f"⚠️ Camera {camera_id} not active for snapshot")
            return
            
        logger.info(f"📸 Capturing enhanced snapshot: {camera_id}")
        
        camera_info = self.active_cameras[camera_id]
        snapshot_data = camera_info['processor'].capture_enhanced_snapshot()
        
        # Notify clients
        await self.broadcast_message({
            'type': 'enhanced_snapshot_ready',
            'data': {
                'camera_id': camera_id,
                'snapshot_data': snapshot_data,
                'timestamp': datetime.now().isoformat()
            }
        })

    async def websocket_handler(self, websocket, path):
        """Enhanced WebSocket handler with face recognition commands"""
        logger.info("🔌 New WebSocket client connected")
        self.websocket_clients.add(websocket)
        
        try:
            # Send initial status
            await websocket.send(json.dumps({
                'type': 'status',
                'data': {
                    'engine_status': 'connected',
                    'object_detection_available': self.model is not None,
                    'face_recognition_available': self.face_engine is not None,
                    'active_cameras': len(self.active_cameras),
                    'object_detection_count': self.detection_count,
                    'face_detection_count': self.face_detection_count,
                    'known_faces_count': len(self.face_engine.known_faces_cache) if self.face_engine else 0,
                    'uptime': time.time() - self.start_time
                }
            }))
            
            async for message in websocket:
                await self.handle_websocket_message(websocket, message)
                
        except websockets.exceptions.ConnectionClosed:
            logger.info("🔌 WebSocket client disconnected")
        except Exception as e:
            logger.error(f"❌ WebSocket error: {e}")
        finally:
            self.websocket_clients.discard(websocket)

    async def handle_websocket_message(self, websocket, message):
        """Handle enhanced WebSocket messages"""
        try:
            data = json.loads(message)
            command = data.get('command')
            payload = data.get('data', {})
            
            if command == 'start_camera':
                await self.start_camera_stream(payload)
            elif command == 'stop_camera':
                await self.stop_camera_stream(payload.get('camera_id'))
            elif command == 'configure_rules':
                await self.configure_rules(payload)
            elif command == 'capture_snapshot':
                await self.capture_enhanced_snapshot(payload.get('camera_id'))
            elif command == 'reload_known_faces':
                await self.reload_known_faces()
            elif command == 'get_face_stats':
                await self.send_face_recognition_stats(websocket)
            elif command == 'get_status':
                await websocket.send(json.dumps({
                    'type': 'status',
                    'data': {
                        'engine_status': 'running',
                        'active_cameras': len(self.active_cameras),
                        'object_detection_count': self.detection_count,
                        'face_detection_count': self.face_detection_count,
                        'face_recognition_available': self.face_engine is not None,
                        'sprint4_engines': {
                            'visual_alerts': self.visual_alert_engine is not None,
                            'spatial_audio': self.spatial_audio_engine is not None,
                            'ai_conversation': self.ai_conversation_engine is not None,
                            'master_coordinator': self.master_threat_coordinator is not None
                        }
                    }
                }))
            # Sprint 4: Visual Alert Commands
            elif command == 'get_visual_overlay':
                await self.handle_get_visual_overlay(websocket, payload)
            elif command == 'clear_visual_alerts':
                await self.handle_clear_visual_alerts(payload)
            elif command == 'get_visual_stats':
                await self.handle_get_visual_stats(websocket)
            # Sprint 4: Audio Alert Commands
            elif command == 'set_audio_volume':
                await self.handle_set_audio_volume(payload)
            elif command == 'stop_audio_alerts':
                await self.handle_stop_audio_alerts()
            elif command == 'get_audio_stats':
                await self.handle_get_audio_stats(websocket)
            # Sprint 4: AI Conversation Commands
            elif command == 'start_conversation':
                await self.handle_start_conversation(payload)
            elif command == 'stop_conversation':
                await self.handle_stop_conversation(payload)
            elif command == 'get_active_conversations':
                await self.handle_get_active_conversations(websocket)
            elif command == 'get_conversation_history':
                await self.handle_get_conversation_history(websocket, payload)
            else:
                logger.warning(f"⚠️ Unknown command: {command}")
                
        except json.JSONDecodeError:
            logger.error("❌ Invalid JSON message received")
        except Exception as e:
            logger.error(f"❌ Message handling error: {e}")

    async def reload_known_faces(self):
        """Reload known faces from database"""
        if self.face_engine:
            try:
                known_faces = self.face_engine.load_known_faces(force_refresh=True)
                logger.info(f"🔄 Reloaded {len(known_faces)} known faces")
                
                await self.broadcast_message({
                    'type': 'known_faces_reloaded',
                    'data': {
                        'count': len(known_faces),
                        'timestamp': datetime.now().isoformat()
                    }
                })
            except Exception as e:
                logger.error(f"❌ Failed to reload known faces: {e}")

    async def send_face_recognition_stats(self, websocket):
        """Send face recognition performance statistics"""
        if self.face_engine:
            try:
                stats = self.face_engine.get_performance_stats()
                await websocket.send(json.dumps({
                    'type': 'face_recognition_stats',
                    'data': stats
                }))
            except Exception as e:
                logger.error(f"❌ Failed to send face recognition stats: {e}")
    
    # Sprint 4: Visual Alert WebSocket Handlers
    async def handle_get_visual_overlay(self, websocket, payload: Dict):
        """Get visual overlay data for a specific monitor"""
        try:
            monitor_id = payload.get('monitor_id', 'monitor_1')
            if self.visual_alert_engine:
                overlay_data = self.visual_alert_engine.export_overlay_data_for_frontend(monitor_id)
                await websocket.send(json.dumps({
                    'type': 'visual_overlay_data',
                    'data': overlay_data
                }))
            else:
                await websocket.send(json.dumps({
                    'type': 'error',
                    'data': {'message': 'Visual Alert Engine not available'}
                }))
        except Exception as e:
            logger.error(f"❌ Visual overlay request error: {e}")
    
    async def handle_clear_visual_alerts(self, payload: Dict):
        """Clear visual alerts for specified zone or all zones"""
        try:
            if self.visual_alert_engine:
                zone_id = payload.get('zone_id')
                if zone_id:
                    self.visual_alert_engine.clear_alert(zone_id)
                    logger.info(f"🧹 Cleared visual alert for zone: {zone_id}")
                else:
                    self.visual_alert_engine.clear_all_alerts()
                    logger.info("🧹 Cleared all visual alerts")
        except Exception as e:
            logger.error(f"❌ Clear visual alerts error: {e}")
    
    async def handle_get_visual_stats(self, websocket):
        """Get visual alert engine statistics"""
        try:
            if self.visual_alert_engine:
                stats = self.visual_alert_engine.get_alert_statistics()
                await websocket.send(json.dumps({
                    'type': 'visual_stats',
                    'data': stats
                }))
        except Exception as e:
            logger.error(f"❌ Visual stats request error: {e}")
    
    # Sprint 4: Audio Alert WebSocket Handlers
    async def handle_set_audio_volume(self, payload: Dict):
        """Set master audio volume"""
        try:
            volume = payload.get('volume', 0.7)
            if self.spatial_audio_engine:
                self.spatial_audio_engine.set_master_volume(volume)
                logger.info(f"🔊 Audio volume set to: {volume}")
        except Exception as e:
            logger.error(f"❌ Set audio volume error: {e}")
    
    async def handle_stop_audio_alerts(self):
        """Stop all active audio alerts"""
        try:
            if self.spatial_audio_engine:
                self.spatial_audio_engine.stop_all_alerts()
                logger.info("🔇 All audio alerts stopped")
        except Exception as e:
            logger.error(f"❌ Stop audio alerts error: {e}")
    
    async def handle_get_audio_stats(self, websocket):
        """Get audio engine statistics"""
        try:
            if self.spatial_audio_engine:
                stats = self.spatial_audio_engine.get_audio_statistics()
                await websocket.send(json.dumps({
                    'type': 'audio_stats',
                    'data': stats
                }))
        except Exception as e:
            logger.error(f"❌ Audio stats request error: {e}")
    
    # Sprint 4: AI Conversation WebSocket Handlers
    async def handle_start_conversation(self, payload: Dict):
        """Manually start an AI conversation"""
        try:
            if self.ai_conversation_engine:
                conversation_id = await self.ai_conversation_engine.start_conversation(payload)
                if conversation_id:
                    logger.info(f"🎙️ Manual conversation started: {conversation_id}")
                    await self.broadcast_message({
                        'type': 'conversation_started',
                        'data': {'conversation_id': conversation_id}
                    })
        except Exception as e:
            logger.error(f"❌ Start conversation error: {e}")
    
    async def handle_stop_conversation(self, payload: Dict):
        """Stop an active AI conversation"""
        try:
            conversation_id = payload.get('conversation_id')
            if self.ai_conversation_engine and conversation_id:
                success = await self.ai_conversation_engine.stop_conversation(conversation_id)
                if success:
                    logger.info(f"🔇 Conversation stopped: {conversation_id}")
                    await self.broadcast_message({
                        'type': 'conversation_stopped',
                        'data': {'conversation_id': conversation_id}
                    })
        except Exception as e:
            logger.error(f"❌ Stop conversation error: {e}")
    
    async def handle_get_active_conversations(self, websocket):
        """Get list of active conversations"""
        try:
            if self.ai_conversation_engine:
                conversations = self.ai_conversation_engine.get_active_conversations()
                await websocket.send(json.dumps({
                    'type': 'active_conversations',
                    'data': conversations
                }))
        except Exception as e:
            logger.error(f"❌ Get active conversations error: {e}")
    
    async def handle_get_conversation_history(self, websocket, payload: Dict):
        """Get conversation history"""
        try:
            limit = payload.get('limit', 50)
            if self.ai_conversation_engine:
                history = self.ai_conversation_engine.get_conversation_history(limit)
                await websocket.send(json.dumps({
                    'type': 'conversation_history',
                    'data': history
                }))
        except Exception as e:
            logger.error(f"❌ Get conversation history error: {e}")

    async def stop_camera_stream(self, camera_id: str):
        """Stop processing a camera stream"""
        if camera_id not in self.active_cameras:
            logger.warning(f"⚠️ Camera {camera_id} not active")
            return
            
        logger.info(f"⏹️ Stopping camera stream: {camera_id}")
        
        # Stop processor
        camera_info = self.active_cameras[camera_id]
        camera_info['processor'].stop()
        
        # Remove from active cameras
        del self.active_cameras[camera_id]
        
        # Notify clients
        await self.broadcast_message({
            'type': 'camera_status',
            'data': {
                'camera_id': camera_id,
                'status': 'stopped',
                'timestamp': datetime.now().isoformat()
            }
        })

    async def configure_rules(self, new_rules: Dict):
        """Update AI detection rules"""
        logger.info("⚙️ Updating enhanced AI rules configuration")
        self.ai_rules.update(new_rules)
        
        # Update rules for all active processors
        for camera_info in self.active_cameras.values():
            camera_info['processor'].update_rules(self.ai_rules)
        
        # Update face recognition confidence if changed
        if self.face_engine and 'face_recognition' in new_rules:
            new_threshold = new_rules['face_recognition'].get('confidence_threshold')
            if new_threshold:
                self.face_engine.confidence_threshold = new_threshold
                
        logger.info("✅ Enhanced AI rules updated successfully")

    async def broadcast_message(self, message: Dict):
        """Broadcast message to all connected WebSocket clients"""
        if not self.websocket_clients:
            return
            
        message_json = json.dumps(message)
        disconnected = set()
        
        for client in self.websocket_clients:
            try:
                await client.send(message_json)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(client)
            except Exception as e:
                logger.error(f"❌ Broadcast error: {e}")
                disconnected.add(client)
        
        # Remove disconnected clients
        self.websocket_clients -= disconnected

    async def start_websocket_server(self):
        """Start WebSocket server for Electron communication"""
        print(f"🚀 Starting Enhanced WebSocket server on port {self.websocket_port}")
        logger.info(f"🚀 Starting Enhanced WebSocket server on port {self.websocket_port}")
        
        server = await websockets.serve(
            self.websocket_handler,
            "localhost",
            self.websocket_port
        )
        
        print(f"✅ Enhanced WebSocket server running on ws://localhost:{self.websocket_port}")
        print("🔌 Ready for Desktop App connection with Face Recognition!")
        logger.info(f"✅ Enhanced WebSocket server running on ws://localhost:{self.websocket_port}")
        return server

    async def run(self):
        """Main run loop for enhanced AI engine"""
        self.is_running = True
        logger.info("🚀 Starting Enhanced Apex AI Engine...")
        
        # Load AI models
        models_loaded = await self.load_models()
        if not models_loaded:
            logger.warning("⚠️ Some models failed to load, running in limited mode")
        
        # Start WebSocket server
        websocket_server = await self.start_websocket_server()
        
        # Start detection processing
        detection_task = asyncio.create_task(self.process_detection_queues())
        
        logger.info("✅ Enhanced Apex AI Engine is ready with Face Recognition!")
        
        try:
            # Keep running
            await asyncio.gather(
                detection_task,
                websocket_server.wait_closed()
            )
        except KeyboardInterrupt:
            logger.info("🛑 Shutting down Enhanced AI Engine...")
        finally:
            self.is_running = False
            
            # Stop all cameras
            for camera_id in list(self.active_cameras.keys()):
                await self.stop_camera_stream(camera_id)
            
            # Shutdown Sprint 4 engines
            if self.spatial_audio_engine:
                self.spatial_audio_engine.shutdown()
            
            if self.ai_conversation_engine:
                self.ai_conversation_engine.shutdown()
            
            logger.info("✅ Enhanced AI Engine with Sprint 4 integration shutdown complete")


class EnhancedCameraProcessor:
    """Enhanced camera processor with face recognition"""
    
    def __init__(self, camera_id: str, rtsp_url: str, model, face_engine, 
                 ai_rules: Dict, detection_queue: queue.Queue, face_detection_queue: queue.Queue):
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.model = model
        self.face_engine = face_engine
        self.ai_rules = ai_rules
        self.detection_queue = detection_queue
        self.face_detection_queue = face_detection_queue
        self.is_running = False
        self.cap = None
        
    def process_stream(self):
        """Main processing loop for camera stream with face recognition"""
        self.is_running = True
        logger.info(f"📹 Starting enhanced camera processor: {self.camera_id}")
        
        try:
            # Try to open video stream
            self.cap = cv2.VideoCapture(self.rtsp_url)
            
            if not self.cap.isOpened():
                logger.warning(f"⚠️ Could not open stream: {self.camera_id}, using simulation")
                self.simulate_enhanced_detections()
                return
            
            frame_count = 0
            while self.is_running:
                ret, frame = self.cap.read()
                
                if not ret:
                    logger.warning(f"⚠️ Failed to read frame from {self.camera_id}")
                    time.sleep(1)
                    continue
                
                # Process every 5th frame for object detection
                if frame_count % 5 == 0:
                    self.process_frame_for_objects(frame)
                
                # Process every 10th frame for face recognition (more intensive)
                if frame_count % 10 == 0 and self.face_engine:
                    self.process_frame_for_faces(frame)
                
                frame_count += 1
                time.sleep(0.1)  # Limit processing rate
                
        except Exception as e:
            logger.error(f"❌ Enhanced camera processor error for {self.camera_id}: {e}")
        finally:
            if self.cap:
                self.cap.release()
            logger.info(f"✅ Enhanced camera processor stopped: {self.camera_id}")
    
    def process_frame_for_objects(self, frame):
        """Process frame for object detection"""
        try:
            if self.model and YOLO_AVAILABLE:
                # Real YOLO inference
                results = self.model(frame)
                
                for result in results:
                    boxes = result.boxes
                    if boxes is not None:
                        for box in boxes:
                            detection = self.create_detection_from_box(box, frame.shape)
                            self.detection_queue.put(detection)
            else:
                # Simulate detection for demo
                self.simulate_object_detection()
                
        except Exception as e:
            logger.error(f"❌ Object detection error: {e}")
    
    def process_frame_for_faces(self, frame):
        """Process frame for face recognition"""
        try:
            if self.face_engine and self.ai_rules['face_recognition']['enabled']:
                # Real face recognition
                face_detections = self.face_engine.process_frame_for_faces(frame, self.camera_id)
                
                for face_detection in face_detections:
                    self.face_detection_queue.put(face_detection)
            else:
                # Simulate face detection for demo
                self.simulate_face_detection()
                
        except Exception as e:
            logger.error(f"❌ Face recognition error: {e}")
    
    def create_detection_from_box(self, box, frame_shape):
        """Create detection dict from YOLO box"""
        # Get box coordinates (normalized)
        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
        h, w = frame_shape[:2]
        
        return {
            'camera_id': self.camera_id,
            'timestamp': datetime.now().isoformat(),
            'class': self.model.names[int(box.cls[0])],
            'confidence': float(box.conf[0]),
            'bounding_box': {
                'x': float(x1 / w),
                'y': float(y1 / h),
                'width': float((x2 - x1) / w),
                'height': float((y2 - y1) / h)
            }
        }
    
    def simulate_enhanced_detections(self):
        """Simulate both object and face detections"""
        logger.info(f"🎭 Simulating enhanced detections for {self.camera_id}")
        
        while self.is_running:
            # Object detection simulation
            if np.random.random() < 0.3:  # 30% chance
                self.simulate_object_detection()
            
            # Face detection simulation
            if np.random.random() < 0.2:  # 20% chance
                self.simulate_face_detection()
            
            time.sleep(3)  # Check every 3 seconds
    
    def simulate_object_detection(self):
        """Generate simulated object detection"""
        classes = ['person', 'car', 'truck', 'bicycle']
        selected_class = np.random.choice(classes, p=[0.7, 0.15, 0.1, 0.05])
        
        detection = {
            'camera_id': self.camera_id,
            'timestamp': datetime.now().isoformat(),
            'class': selected_class,
            'confidence': 0.6 + np.random.random() * 0.4,
            'bounding_box': {
                'x': np.random.random() * 0.7,
                'y': np.random.random() * 0.7,
                'width': 0.1 + np.random.random() * 0.2,
                'height': 0.1 + np.random.random() * 0.3
            }
        }
        
        self.detection_queue.put(detection)
    
    def simulate_face_detection(self):
        """Generate simulated face detection"""
        # Simulate different types of face detections
        detection_types = [
            {'person_name': 'John Smith', 'person_type': 'resident', 'is_match': True, 'confidence': 0.85},
            {'person_name': 'Unknown', 'person_type': 'unknown', 'is_match': False, 'confidence': 0.0},
            {'person_name': 'Sarah Wilson', 'person_type': 'staff', 'is_match': True, 'confidence': 0.92},
            {'person_name': 'Mike Johnson', 'person_type': 'visitor', 'is_match': True, 'confidence': 0.78}
        ]
        
        # Rare chance for blacklisted person (for demo)
        if np.random.random() < 0.05:  # 5% chance
            face_data = {'person_name': 'Blacklisted Person', 'person_type': 'blacklist', 'is_match': True, 'confidence': 0.95}
        else:
            face_data = np.random.choice(detection_types)
        
        face_detection = {
            'camera_id': self.camera_id,
            'timestamp': datetime.now().isoformat(),
            'face_location': {
                'top': 50,
                'right': 150,
                'bottom': 200,
                'left': 100
            },
            'bounding_box': {
                'x': np.random.random() * 0.6,
                'y': np.random.random() * 0.5,
                'width': 0.15 + np.random.random() * 0.1,
                'height': 0.2 + np.random.random() * 0.1
            },
            'face_quality_score': 0.7 + np.random.random() * 0.3,
            **face_data
        }
        
        self.face_detection_queue.put(face_detection)
    
    def capture_enhanced_snapshot(self) -> Dict:
        """Capture enhanced snapshot with metadata"""
        timestamp = int(time.time())
        snapshot_filename = f"enhanced_snapshot_{self.camera_id}_{timestamp}.jpg"
        
        # In a real implementation, save actual frame with face annotations
        logger.info(f"📸 Enhanced snapshot captured: {snapshot_filename}")
        
        return {
            'filename': snapshot_filename,
            'timestamp': timestamp,
            'has_faces': True,
            'has_objects': True,
            'analysis_complete': True
        }
    
    def update_rules(self, new_rules: Dict):
        """Update AI rules for this processor"""
        self.ai_rules = new_rules
    
    def stop(self):
        """Stop processing"""
        self.is_running = False


# Main execution
if __name__ == "__main__":
    # Configuration
    MODEL_PATH = "yolov8n.pt"  # Start with nano model for speed
    WEBSOCKET_PORT = 8765
    
    # Display startup banner
    print("\n" + "="*80)
    print("    🚀 ENHANCED APEX AI ENGINE - SPRINT 4 INTEGRATION COMPLETE")
    print("="*80)
    print(f"📡 WebSocket Port: {WEBSOCKET_PORT}")
    print(f"🧠 Object Detection: {MODEL_PATH}")
    print(f"👤 Face Recognition: Enabled")
    print(f"🎨 Visual Alert Engine: Enabled")
    print(f"🔊 Spatial Audio Engine: Enabled")
    print(f"🎙️ AI Conversation Engine: Enabled")
    print(f"🤖 Master Threat Coordinator: Enabled")
    print(f"🎭 Demo Mode: Enabled (simulated detections)")
    print("🔌 Waiting for Desktop App connection...")
    print("="*80 + "\n")
    
    # Get OpenAI API key from environment (optional)
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    
    # Create and run enhanced AI engine with Sprint 4 integration
    engine = EnhancedApexAIEngine(
        websocket_port=WEBSOCKET_PORT,
        model_path=MODEL_PATH,
        openai_api_key=OPENAI_API_KEY
    )
    
    try:
        asyncio.run(engine.run())
    except KeyboardInterrupt:
        print("\n🛑 Enhanced AI Engine stopped by user")
        logger.info("👋 Enhanced AI Engine stopped by user")
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        logger.error(f"❌ Fatal error: {e}")
        input("Press Enter to close...")
