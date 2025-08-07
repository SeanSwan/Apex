"""
APEX AI ENGINE - INTEGRATED DEMO SCRIPT (LEGACY VERSION)
========================================================
⚠️  IMPORTANT: This is the legacy demo script with simulated video processing.
⬆️  For REAL VIDEO PROCESSING use: enhanced_ai_engine_with_video.py

The enhanced version includes:
✅ Real-time screen capture from DVR monitors
✅ RTSP stream processing for direct camera feeds
✅ Actual AI threat detection on real video frames
✅ Automatic failover between video sources
✅ Performance monitoring and optimization

This legacy script demonstrates:
- Enhanced WebSocket communication with backend
- Simulated AI detection processing
- Face recognition alerts (demo data)
- Robust error handling and reconnection

For the July 28th demo, use: enhanced_ai_engine_with_video.py
"""

import asyncio
import logging
import time
import random
from typing import Dict, List, Optional
import json

# Import enhanced WebSocket client
from enhanced_websocket_client import EnhancedWebSocketClient

# Import AI processing components
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("⚠️ YOLO not available. Install with: pip install ultralytics")

try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("⚠️ Face recognition not available (using simulated mode for Python 3.13 compatibility)")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ApexAIDemoEngine:
    """
    Complete AI processing engine for Apex AI demo
    """
    
    def __init__(self):
        # Enhanced WebSocket client - Connect to Socket.io backend
        self.websocket_client = EnhancedWebSocketClient(
            server_url="http://localhost:5000",  # HTTP for Socket.io connection
            auth_token="apex_ai_engine_2024"
        )
        
        # AI Models
        self.yolo_model = None
        self.face_encodings = {}  # Known face encodings database
        
        # Demo cameras
        self.demo_cameras = [
            'cam_entrance_1',
            'cam_parking_1', 
            'cam_elevator_1',
            'cam_rooftop_1'
        ]
        
        # Processing state
        self.active_streams = set()
        self.processing_tasks = {}
        self.detection_counter = 0
        self.face_counter = 0
        
        logger.info("🚀 Apex AI Demo Engine initialized")

    async def initialize_ai_models(self):
        """Initialize AI models for processing"""
        logger.info("🤖 Initializing AI models...")
        
        if YOLO_AVAILABLE:
            try:
                self.yolo_model = YOLO('yolov8n.pt')  # Nano model for speed
                logger.info("✅ YOLOv8 model loaded successfully")
            except Exception as e:
                logger.error(f"❌ Failed to load YOLO model: {e}")
                self.yolo_model = None
        
        # Initialize demo face database
        self.initialize_demo_face_database()
        
        logger.info("🎯 AI models initialization complete")

    def initialize_demo_face_database(self):
        """Initialize demo face database with known persons"""
        # For demo purposes, we'll simulate known face encodings
        demo_persons = [
            {'id': 'person_001', 'name': 'John Smith', 'role': 'Employee'},
            {'id': 'person_002', 'name': 'Sarah Johnson', 'role': 'Resident'},
            {'id': 'person_003', 'name': 'Mike Wilson', 'role': 'Security'},
            {'id': 'person_004', 'name': 'Unknown Person', 'role': 'Visitor'}
        ]
        
        # Simulate face encodings (in production, these would be real face encodings)
        for person in demo_persons:
            # Generate random face encoding for demo
            fake_encoding = [random.uniform(-1, 1) for _ in range(128)]
            self.face_encodings[person['id']] = {
                'encoding': fake_encoding,
                'name': person['name'],
                'role': person['role']
            }
        
        logger.info(f"👥 Demo face database initialized with {len(demo_persons)} persons")

    async def start_engine(self):
        """Start the complete AI engine"""
        logger.info("🚀 Starting Apex AI Demo Engine...")
        
        # Initialize AI models
        await self.initialize_ai_models()
        
        # Connect to WebSocket server
        success = await self.websocket_client.connect()
        if not success:
            logger.error("❌ Failed to connect to WebSocket server")
            return False
        
        # Register custom message handlers
        self.websocket_client.register_handler('start_stream_processing', self.handle_start_stream)
        self.websocket_client.register_handler('stop_stream_processing', self.handle_stop_stream)
        self.websocket_client.register_handler('change_stream_quality', self.handle_quality_change)
        
        # Start demo processing simulation
        await self.start_demo_simulation()
        
        logger.info("✅ Apex AI Demo Engine started successfully")
        return True

    async def handle_start_stream(self, data: Dict):
        """Handle stream start processing request"""
        camera_id = data.get('camera_id')
        rtsp_url = data.get('rtsp_url')
        quality = data.get('quality', 'thumbnail')
        
        logger.info(f"🎥 Starting AI processing for camera {camera_id}")
        
        if camera_id not in self.active_streams:
            self.active_streams.add(camera_id)
            
            # Start processing task for this camera
            task = asyncio.create_task(self.process_camera_stream(camera_id, rtsp_url, quality))
            self.processing_tasks[camera_id] = task
            
            logger.info(f"✅ AI processing started for camera {camera_id}")

    async def handle_stop_stream(self, data: Dict):
        """Handle stream stop processing request"""
        camera_id = data.get('camera_id')
        
        logger.info(f"🛑 Stopping AI processing for camera {camera_id}")
        
        if camera_id in self.active_streams:
            self.active_streams.remove(camera_id)
            
            # Cancel processing task
            if camera_id in self.processing_tasks:
                self.processing_tasks[camera_id].cancel()
                del self.processing_tasks[camera_id]
            
            logger.info(f"✅ AI processing stopped for camera {camera_id}")

    async def handle_quality_change(self, data: Dict):
        """Handle stream quality change request"""
        camera_id = data.get('camera_id')
        new_quality = data.get('new_quality')
        
        logger.info(f"🔧 Changing quality for camera {camera_id} to {new_quality}")
        
        # In a real implementation, this would adjust processing parameters
        # For demo, we just acknowledge the change
        
        await self.websocket_client.send_message('stream_quality_changed', {
            'camera_id': camera_id,
            'new_quality': new_quality,
            'status': 'changed'
        })

    async def process_camera_stream(self, camera_id: str, rtsp_url: str, quality: str):
        """Process individual camera stream for AI detection"""
        logger.info(f"🎬 Processing stream for camera {camera_id}")
        
        try:
            while camera_id in self.active_streams:
                # Simulate AI processing interval (every 2-5 seconds for demo)
                processing_interval = random.uniform(2.0, 5.0)
                await asyncio.sleep(processing_interval)
                
                # Generate demo AI detections
                await self.generate_demo_ai_detection(camera_id)
                
                # Occasionally generate face detection
                if random.random() < 0.3:  # 30% chance
                    await self.generate_demo_face_detection(camera_id)
                
                # Occasionally generate alerts
                if random.random() < 0.1:  # 10% chance
                    await self.generate_demo_alert(camera_id)
                
        except asyncio.CancelledError:
            logger.info(f"🛑 Camera processing cancelled for {camera_id}")
        except Exception as e:
            logger.error(f"❌ Error processing camera {camera_id}: {e}")

    async def generate_demo_ai_detection(self, camera_id: str):
        """Generate demo AI detection results"""
        detection_types = ['person', 'vehicle', 'package', 'animal']
        alert_levels = ['low', 'medium', 'high', 'critical']
        
        # Generate 1-3 detections
        num_detections = random.randint(1, 3)
        detections = []
        
        for i in range(num_detections):
            detection = {
                'detection_id': f'det_{camera_id}_{self.detection_counter}_{i}',
                'timestamp': time.time(),
                'detection_type': random.choice(detection_types),
                'confidence': random.uniform(0.7, 0.98),
                'bounding_box': {
                    'x': random.uniform(0.1, 0.7),
                    'y': random.uniform(0.1, 0.7),
                    'width': random.uniform(0.1, 0.3),
                    'height': random.uniform(0.1, 0.4)
                },
                'alert_level': random.choice(alert_levels)
            }
            detections.append(detection)
        
        # Send to frontend via WebSocket
        await self.websocket_client.send_ai_detection_result(camera_id, detections)
        
        self.detection_counter += 1
        logger.debug(f"🤖 Sent {num_detections} AI detections for {camera_id}")

    async def generate_demo_face_detection(self, camera_id: str):
        """Generate demo face detection results"""
        # Generate 1-2 face detections
        num_faces = random.randint(1, 2)
        faces = []
        
        for i in range(num_faces):
            # Randomly choose if this is a known or unknown person
            is_known = random.random() < 0.7  # 70% chance of known person
            
            if is_known and self.face_encodings:
                # Select random known person
                person_id = random.choice(list(self.face_encodings.keys()))
                person_data = self.face_encodings[person_id]
                
                face = {
                    'face_id': f'face_{camera_id}_{self.face_counter}_{i}',
                    'timestamp': time.time(),
                    'person_id': person_id,
                    'name': person_data['name'],
                    'confidence': random.uniform(0.8, 0.95),
                    'bounding_box': {
                        'x': random.uniform(0.2, 0.6),
                        'y': random.uniform(0.1, 0.5),
                        'width': random.uniform(0.1, 0.2),
                        'height': random.uniform(0.1, 0.2)
                    },
                    'is_known': True,
                    'threat_level': 'safe'
                }
            else:
                # Unknown person
                face = {
                    'face_id': f'face_{camera_id}_{self.face_counter}_{i}',
                    'timestamp': time.time(),
                    'person_id': None,
                    'name': None,
                    'confidence': random.uniform(0.6, 0.85),
                    'bounding_box': {
                        'x': random.uniform(0.2, 0.6),
                        'y': random.uniform(0.1, 0.5),
                        'width': random.uniform(0.1, 0.2),
                        'height': random.uniform(0.1, 0.2)
                    },
                    'is_known': False,
                    'threat_level': random.choice(['unknown', 'watch_list'])
                }
            
            faces.append(face)
        
        # Send to frontend via WebSocket
        await self.websocket_client.send_face_detection_result(camera_id, faces)
        
        self.face_counter += 1
        logger.debug(f"👤 Sent {num_faces} face detections for {camera_id}")

    async def generate_demo_alert(self, camera_id: str):
        """Generate demo security alerts"""
        alert_types = [
            'unknown_person',
            'suspicious_activity', 
            'weapon_detected',
            'perimeter_breach',
            'loitering_detected'
        ]
        
        alert_type = random.choice(alert_types)
        severity = random.choice(['low', 'medium', 'high', 'critical'])
        
        alert_data = {
            'alert_id': f'alert_{camera_id}_{int(time.time())}',
            'timestamp': time.time(),
            'description': f'{alert_type.replace("_", " ").title()} detected on {camera_id}',
            'severity': severity,
            'location': f'Camera {camera_id}',
            'confidence': random.uniform(0.7, 0.9)
        }
        
        # Send alert via WebSocket
        await self.websocket_client.send_alert(alert_type, camera_id, alert_data)
        
        logger.info(f"🚨 Generated {alert_type} alert for {camera_id} (severity: {severity})")

    async def start_demo_simulation(self):
        """Start demo simulation for all cameras"""
        logger.info("🎭 Starting demo simulation...")
        
        # Simulate streams starting for demo cameras
        for camera_id in self.demo_cameras:
            await asyncio.sleep(0.5)  # Stagger the starts
            
            # Simulate stream start request
            await self.handle_start_stream({
                'camera_id': camera_id,
                'rtsp_url': f'rtsp://demo.server.com/{camera_id}',
                'quality': 'thumbnail'
            })
        
        logger.info(f"✅ Demo simulation started for {len(self.demo_cameras)} cameras")

    async def stop_engine(self):
        """Stop the AI engine gracefully"""
        logger.info("🛑 Stopping Apex AI Demo Engine...")
        
        # Stop all processing tasks
        for camera_id in list(self.active_streams):
            await self.handle_stop_stream({'camera_id': camera_id})
        
        # Disconnect from WebSocket
        await self.websocket_client.disconnect()
        
        logger.info("✅ Apex AI Demo Engine stopped")

    def get_engine_stats(self) -> Dict:
        """Get engine statistics"""
        return {
            'active_streams': len(self.active_streams),
            'total_detections': self.detection_counter,
            'total_faces': self.face_counter,
            'known_persons': len(self.face_encodings),
            'websocket_stats': self.websocket_client.get_stats(),
            'models_loaded': {
                'yolo': self.yolo_model is not None,
                'face_recognition': FACE_RECOGNITION_AVAILABLE
            }
        }

async def main():
    """Main demo function"""
    print("🚀 APEX AI DEMO ENGINE")
    print("======================")
    print("Enhanced AI processing with real-time WebSocket communication")
    print()
    
    # Create and start engine
    engine = ApexAIDemoEngine()
    
    try:
        # Start the engine
        success = await engine.start_engine()
        if not success:
            print("❌ Failed to start AI engine")
            return
        
        print("✅ AI Engine started successfully!")
        print("📡 Real-time AI processing active")
        print("🎥 Processing demo camera feeds")
        print("🤖 Generating AI detections and face recognition")
        print()
        print("Press Ctrl+C to stop...")
        
        # Keep running and show stats periodically
        while True:
            await asyncio.sleep(30)  # Show stats every 30 seconds
            
            stats = engine.get_engine_stats()
            print(f"📊 Stats: {stats['active_streams']} streams, " + 
                  f"{stats['total_detections']} detections, " +
                  f"{stats['total_faces']} faces processed")
            
    except KeyboardInterrupt:
        print("\n🛑 Shutting down AI engine...")
        await engine.stop_engine()
        print("✅ Shutdown complete")

if __name__ == "__main__":
    asyncio.run(main())
