"""
APEX AI ENGINE - ENHANCED INFERENCE SCRIPT WITH ADVANCED THREAT DETECTION
=========================================================================
Advanced AI processing engine for real-time security monitoring
Features: Multi-model threat detection, Face Recognition, RTSP processing, WebSocket communication

ENHANCED WITH NEW FEATURES:
- Master Threat Detection Coordinator
- Weapons Detection (CRITICAL)
- Violence Detection (CRITICAL)  
- Package Theft Detection (HIGH)
- Trespassing Detection (CRITICAL)
- Transient Activity Detection (MEDIUM)
- Vandalism Detection (HIGH)
- Face Recognition Integration
- Threat Correlation and Prioritization

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

# Import the new threat detection models
try:
    from models import MasterThreatDetectionCoordinator, DEFAULT_CONFIG, ThreatLevel
    THREAT_MODELS_AVAILABLE = True
except ImportError:
    THREAT_MODELS_AVAILABLE = False
    print("⚠️ Threat detection models not available. Check models package installation.")

# Face Recognition import
try:
    from face_recognition_engine import FaceRecognitionEngine
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("⚠️ Face recognition not available. Install with: pip install face_recognition")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EnhancedApexAIEngine:
    """
    Enhanced AI Engine with Advanced Threat Detection and Face Recognition
    
    This is the main AI processing engine that coordinates multiple specialized
    threat detection models for comprehensive security monitoring.
    """
    
    def __init__(self, websocket_port=8765, model_config=None, db_config=None):
        self.websocket_port = websocket_port
        self.model_config = model_config or DEFAULT_CONFIG
        self.db_config = db_config or self.get_default_db_config()
        
        # Initialize threat detection coordinator
        self.threat_coordinator = None
        if THREAT_MODELS_AVAILABLE:
            self.threat_coordinator = MasterThreatDetectionCoordinator(self.model_config)
            logger.info("🧠 Master Threat Detection Coordinator initialized")
        else:
            logger.error("❌ Threat detection models not available - running in limited mode")
        
        # Initialize face recognition engine
        self.face_engine = None
        if FACE_RECOGNITION_AVAILABLE:
            try:
                self.face_engine = FaceRecognitionEngine(self.db_config)
                logger.info("👤 Face Recognition Engine initialized")
            except Exception as e:
                logger.error(f"❌ Face Recognition initialization failed: {e}")
        
        # Processing queues and state
        self.active_cameras = {}
        self.detection_queue = queue.Queue()
        self.face_detection_queue = queue.Queue()
        self.websocket_clients = set()
        self.is_running = False
        
        # AI rules and configuration
        self.ai_rules = self.load_default_rules()
        
        # Performance tracking
        self.detection_count = 0
        self.face_detection_count = 0
        self.threat_detection_count = 0
        self.start_time = time.time()
        
        # Demo mode settings
        self.demo_mode = True
        self.demo_detection_frequency = 0.3  # 30% chance per frame
        
        logger.info("🚀 Enhanced Apex AI Engine initialized with Advanced Threat Detection")

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
        """Load enhanced AI detection rules with threat detection"""
        return {
            'detection_enabled': True,
            'face_recognition_enabled': True,
            'threat_detection_enabled': True,
            'alert_thresholds': {
                'weapons': 0.7,
                'violence': 0.65,
                'package_theft': 0.6,
                'trespassing': 0.7,
                'transient_activity': 0.6,
                'vandalism': 0.65
            },
            'zones': {
                'lobby': {'sensitivity': 1.2, 'restricted': False},
                'entrance': {'sensitivity': 1.4, 'restricted': False},
                'elevator': {'sensitivity': 1.5, 'restricted': False},
                'parking': {'sensitivity': 0.8, 'restricted': True},
                'roof': {'sensitivity': 1.0, 'restricted': True},
                'storage': {'sensitivity': 1.0, 'restricted': True}
            },
            'time_restrictions': {
                'start_hour': 6,
                'end_hour': 22
            },
            'demo_mode': True,
            'simulation_frequency': 0.3
        }

    async def run(self):
        """Main run loop for the AI engine"""
        self.is_running = True
        
        # Start processing threads
        processing_thread = threading.Thread(target=self.processing_loop, daemon=True)
        processing_thread.start()
        
        face_processing_thread = threading.Thread(target=self.face_processing_loop, daemon=True)
        face_processing_thread.start()
        
        # Start WebSocket server
        logger.info(f"🌐 Starting WebSocket server on port {self.websocket_port}")
        
        try:
            async with websockets.serve(self.websocket_handler, "localhost", self.websocket_port):
                logger.info("✅ WebSocket server started successfully")
                await asyncio.Future()  # Run forever
        except Exception as e:
            logger.error(f"❌ WebSocket server error: {e}")
            self.is_running = False

    async def websocket_handler(self, websocket, path):
        """Handle WebSocket connections from the desktop app"""
        self.websocket_clients.add(websocket)
        client_address = websocket.remote_address
        logger.info(f"🔌 Client connected: {client_address}")
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self.handle_message(data, websocket)
                except json.JSONDecodeError:
                    logger.error(f"❌ Invalid JSON received from {client_address}")
                except Exception as e:
                    logger.error(f"❌ Error handling message from {client_address}: {e}")
        
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"🔌 Client disconnected: {client_address}")
        except Exception as e:
            logger.error(f"❌ WebSocket handler error: {e}")
        finally:
            self.websocket_clients.discard(websocket)

    async def handle_message(self, data: Dict, websocket):
        """Handle incoming messages from clients"""
        message_type = data.get('type')
        
        if message_type == 'start_monitoring':
            camera_id = data.get('camera_id', 'default')
            zone = data.get('zone', 'lobby')
            await self.start_camera_monitoring(camera_id, zone)
            
        elif message_type == 'stop_monitoring':
            camera_id = data.get('camera_id', 'default')
            await self.stop_camera_monitoring(camera_id)
            
        elif message_type == 'update_rules':
            new_rules = data.get('rules', {})
            self.update_ai_rules(new_rules)
            
        elif message_type == 'get_status':
            status = self.get_engine_status()
            await websocket.send(json.dumps({
                'type': 'status_response',
                'data': status
            }))
            
        elif message_type == 'simulate_detection':
            # For demo purposes
            await self.simulate_threat_detection(data.get('camera_id', 'demo'))

    async def start_camera_monitoring(self, camera_id: str, zone: str = 'lobby'):
        """Start monitoring a camera"""
        if camera_id not in self.active_cameras:
            self.active_cameras[camera_id] = {
                'zone': zone,
                'start_time': datetime.now(),
                'frame_count': 0,
                'detection_count': 0
            }
            
            # Start processing for this camera (in demo mode, we simulate)
            if self.demo_mode:
                asyncio.create_task(self.demo_camera_loop(camera_id, zone))
            
            logger.info(f"📹 Started monitoring camera {camera_id} in zone {zone}")

    async def stop_camera_monitoring(self, camera_id: str):
        """Stop monitoring a camera"""
        if camera_id in self.active_cameras:
            del self.active_cameras[camera_id]
            logger.info(f"⏹️ Stopped monitoring camera {camera_id}")

    async def demo_camera_loop(self, camera_id: str, zone: str):
        """Demo camera processing loop with simulated detections"""
        while camera_id in self.active_cameras and self.is_running:
            try:
                # Simulate frame processing
                if np.random.random() < self.demo_detection_frequency:
                    await self.simulate_threat_detection(camera_id, zone)
                
                # Update camera stats
                self.active_cameras[camera_id]['frame_count'] += 1
                
                # Wait for next frame (simulate 10 FPS)
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"❌ Error in demo camera loop for {camera_id}: {e}")
                await asyncio.sleep(1)

    async def simulate_threat_detection(self, camera_id: str, zone: str = 'lobby'):
        """Simulate threat detection for demo purposes"""
        if not self.threat_coordinator:
            return
        
        # Create a dummy frame for simulation
        dummy_frame = np.zeros((640, 640, 3), dtype=np.uint8)
        
        # Add some random shapes to make it more realistic
        cv2.rectangle(dummy_frame, (100, 100), (200, 300), (100, 100, 100), -1)  # Person-like shape
        
        try:
            # Generate simulated threats occasionally
            if np.random.random() < 0.1:  # 10% chance of threat
                # Simulate different types of threats
                threat_types = ['weapons', 'violence', 'package_theft', 'trespassing', 'transient_activity', 'vandalism']
                threat_type = np.random.choice(threat_types)
                
                # Create a simulated detection
                simulated_detection = self.create_simulated_detection(threat_type, camera_id, zone)
                
                # Add to detection queue
                self.detection_queue.put(simulated_detection)
                self.threat_detection_count += 1
                
                logger.warning(f"🚨 SIMULATED {threat_type.upper()} THREAT detected on camera {camera_id}")
            
            # Also simulate face detection occasionally
            if self.face_engine and np.random.random() < 0.15:  # 15% chance
                face_detection = self.create_simulated_face_detection(camera_id, zone)
                self.face_detection_queue.put(face_detection)
                self.face_detection_count += 1
                
        except Exception as e:
            logger.error(f"❌ Error in threat simulation: {e}")

    def create_simulated_detection(self, threat_type: str, camera_id: str, zone: str) -> Dict:
        """Create a simulated threat detection"""
        threat_configs = {
            'weapons': {
                'confidence': 0.8 + np.random.random() * 0.15,
                'threat_level': ThreatLevel.CRITICAL,
                'description': 'Simulated weapon detected - firearm or blade'
            },
            'violence': {
                'confidence': 0.7 + np.random.random() * 0.2,
                'threat_level': ThreatLevel.CRITICAL,
                'description': 'Simulated violence detected - physical altercation'
            },
            'package_theft': {
                'confidence': 0.65 + np.random.random() * 0.25,
                'threat_level': ThreatLevel.HIGH,
                'description': 'Simulated package theft - unauthorized package handling'
            },
            'trespassing': {
                'confidence': 0.75 + np.random.random() * 0.2,
                'threat_level': ThreatLevel.CRITICAL,
                'description': 'Simulated trespassing - unauthorized zone access'
            },
            'transient_activity': {
                'confidence': 0.6 + np.random.random() * 0.3,
                'threat_level': ThreatLevel.MEDIUM,
                'description': 'Simulated loitering - prolonged presence detected'
            },
            'vandalism': {
                'confidence': 0.7 + np.random.random() * 0.25,
                'threat_level': ThreatLevel.HIGH,
                'description': 'Simulated vandalism - property damage detected'
            }
        }
        
        config = threat_configs.get(threat_type, threat_configs['weapons'])
        
        return {
            'type': threat_type,
            'confidence': config['confidence'],
            'bbox': (
                int(100 + np.random.random() * 400),  # x1
                int(100 + np.random.random() * 300),  # y1
                int(200 + np.random.random() * 200),  # x2
                int(300 + np.random.random() * 200)   # y2
            ),
            'threat_level': config['threat_level'],
            'description': config['description'],
            'metadata': {
                'camera_id': camera_id,
                'zone': zone,
                'simulation': True,
                'detection_method': 'demo_simulation'
            },
            'timestamp': datetime.now()
        }

    def create_simulated_face_detection(self, camera_id: str, zone: str) -> Dict:
        """Create a simulated face detection"""
        # Simulate different types of people
        person_types = [
            {'name': 'John Smith', 'type': 'resident', 'confidence': 0.85},
            {'name': 'Unknown Person', 'type': 'unknown', 'confidence': 0.0},
            {'name': 'Sarah Wilson', 'type': 'staff', 'confidence': 0.92},
            {'name': 'Mike Johnson', 'type': 'visitor', 'confidence': 0.78}
        ]
        
        # Rare chance for blacklisted person
        if np.random.random() < 0.05:  # 5% chance
            person_data = {'name': 'Blacklisted Person', 'type': 'blacklist', 'confidence': 0.95}
        else:
            person_data = np.random.choice(person_types)
        
        return {
            'camera_id': camera_id,
            'zone': zone,
            'timestamp': datetime.now().isoformat(),
            'person_name': person_data['name'],
            'person_type': person_data['type'],
            'confidence': person_data['confidence'],
            'face_location': {
                'top': 50 + int(np.random.random() * 100),
                'right': 150 + int(np.random.random() * 100),
                'bottom': 200 + int(np.random.random() * 100),
                'left': 100 + int(np.random.random() * 100)
            },
            'simulation': True
        }

    def processing_loop(self):
        """Main processing loop for threat detections"""
        logger.info("🔄 Started threat detection processing loop")
        
        while self.is_running:
            try:
                # Process detections from queue
                detection = self.detection_queue.get(timeout=1.0)
                asyncio.create_task(self.broadcast_detection(detection))
                self.detection_count += 1
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"❌ Error in processing loop: {e}")
                time.sleep(1)

    def face_processing_loop(self):
        """Processing loop for face recognition results"""
        logger.info("🔄 Started face recognition processing loop")
        
        while self.is_running:
            try:
                # Process face detections from queue
                face_detection = self.face_detection_queue.get(timeout=1.0)
                asyncio.create_task(self.broadcast_face_detection(face_detection))
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"❌ Error in face processing loop: {e}")
                time.sleep(1)

    async def broadcast_detection(self, detection: Dict):
        """Broadcast threat detection to all connected clients"""
        message = {
            'type': 'threat_detection',
            'data': {
                'detection': {
                    'type': detection['type'],
                    'confidence': detection['confidence'],
                    'threat_level': detection['threat_level'].name if hasattr(detection['threat_level'], 'name') else str(detection['threat_level']),
                    'description': detection['description'],
                    'bbox': detection['bbox'],
                    'metadata': detection['metadata'],
                    'timestamp': detection['timestamp'].isoformat() if hasattr(detection['timestamp'], 'isoformat') else str(detection['timestamp'])
                }
            }
        }
        
        # Send to all connected clients
        if self.websocket_clients:
            await asyncio.gather(
                *[client.send(json.dumps(message)) for client in self.websocket_clients],
                return_exceptions=True
            )

    async def broadcast_face_detection(self, face_detection: Dict):
        """Broadcast face detection to all connected clients"""
        message = {
            'type': 'face_detection',
            'data': face_detection
        }
        
        # Send to all connected clients
        if self.websocket_clients:
            await asyncio.gather(
                *[client.send(json.dumps(message)) for client in self.websocket_clients],
                return_exceptions=True
            )

    def update_ai_rules(self, new_rules: Dict):
        """Update AI detection rules"""
        self.ai_rules.update(new_rules)
        
        # Update threat coordinator configuration if available
        if self.threat_coordinator:
            for model_name, config in new_rules.items():
                if model_name in ['weapons', 'violence', 'package_theft', 'trespassing', 'transient_activity', 'vandalism']:
                    self.threat_coordinator.update_model_config(model_name, config)
        
        logger.info("✅ AI rules updated")

    def get_engine_status(self) -> Dict:
        """Get current engine status and statistics"""
        uptime = time.time() - self.start_time
        
        status = {
            'engine_status': 'running' if self.is_running else 'stopped',
            'uptime_seconds': uptime,
            'active_cameras': len(self.active_cameras),
            'connected_clients': len(self.websocket_clients),
            'detection_count': self.detection_count,
            'face_detection_count': self.face_detection_count,
            'threat_detection_count': self.threat_detection_count,
            'detections_per_minute': (self.detection_count / (uptime / 60)) if uptime > 0 else 0,
            'face_recognition_enabled': FACE_RECOGNITION_AVAILABLE and self.face_engine is not None,
            'threat_detection_enabled': THREAT_MODELS_AVAILABLE and self.threat_coordinator is not None,
            'demo_mode': self.demo_mode
        }
        
        # Add threat coordinator stats if available
        if self.threat_coordinator:
            status['threat_models'] = self.threat_coordinator.get_model_status()
            status['processing_stats'] = self.threat_coordinator.get_processing_statistics()
            status['active_threats'] = len(self.threat_coordinator.get_active_threats())
        
        return status

    def stop(self):
        """Stop the AI engine"""
        logger.info("🛑 Stopping Enhanced AI Engine...")
        self.is_running = False
        
        if self.threat_coordinator:
            self.threat_coordinator.shutdown()
        
        logger.info("✅ Enhanced AI Engine stopped")


# Main execution
if __name__ == "__main__":
    # Configuration
    WEBSOCKET_PORT = 8765
    
    # Display startup banner
    print("\n" + "="*70)
    print("    🚀 ENHANCED APEX AI ENGINE - ADVANCED THREAT DETECTION")
    print("="*70)
    print(f"📡 WebSocket Port: {WEBSOCKET_PORT}")
    print(f"🧠 Threat Models: {'✅ Available' if THREAT_MODELS_AVAILABLE else '❌ Not Available'}")
    print(f"👤 Face Recognition: {'✅ Available' if FACE_RECOGNITION_AVAILABLE else '❌ Not Available'}")
    print(f"🎭 Demo Mode: Enabled (simulated detections)")
    print("🔌 Waiting for Desktop App connection...")
    print("="*70 + "\n")
    
    # Create and run enhanced AI engine
    engine = EnhancedApexAIEngine(websocket_port=WEBSOCKET_PORT)
    
    try:
        asyncio.run(engine.run())
    except KeyboardInterrupt:
        print("\n🛑 Enhanced AI Engine stopped by user")
        logger.info("👋 Enhanced AI Engine stopped by user")
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        logger.error(f"❌ Fatal error: {e}")
        input("Press Enter to close...")
