"""
APEX AI ENGINE - MAIN INFERENCE SCRIPT
=====================================
Core AI processing engine for real-time security monitoring
Features: YOLO detection, RTSP processing, rule engine, WebSocket communication

Requirements:
- ultralytics (YOLOv8)
- opencv-python
- websockets
- numpy
- Pillow
- asyncio
"""

import asyncio
import json
import logging
import cv2
import numpy as np
import websockets
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import threading
import queue

# AI/ML imports
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("⚠️ Ultralytics not installed. Install with: pip install ultralytics")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ApexAIEngine:
    def __init__(self, websocket_port=8765, model_path=None):
        self.websocket_port = websocket_port
        self.model_path = model_path or "yolov8n.pt"  # Default to nano model
        self.model = None
        self.active_cameras = {}
        self.detection_queue = queue.Queue()
        self.ai_rules = self.load_default_rules()
        self.websocket_clients = set()
        self.is_running = False
        
        # Performance tracking
        self.detection_count = 0
        self.start_time = time.time()
        
        logger.info("🚀 Apex AI Engine initialized")

    def load_default_rules(self) -> Dict:
        """Load default AI detection rules"""
        return {
            "loitering": {
                "enabled": True,
                "time_threshold": 30,  # seconds
                "zones": ["entrance", "elevator"],
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
                "priority": "high"
            },
            "person_detection": {
                "enabled": True,
                "confidence_threshold": 0.5,
                "track_movement": True
            }
        }

    async def load_model(self):
        """Load YOLO model for inference"""
        try:
            if not YOLO_AVAILABLE:
                logger.warning("YOLO not available, using simulation mode")
                return True
                
            logger.info(f"📥 Loading YOLO model: {self.model_path}")
            self.model = YOLO(self.model_path)
            logger.info("✅ YOLO model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            return False

    async def start_camera_stream(self, camera_data: Dict):
        """Start processing a camera stream"""
        camera_id = camera_data.get('id')
        rtsp_url = camera_data.get('rtspUrl')
        
        if camera_id in self.active_cameras:
            logger.warning(f"⚠️ Camera {camera_id} already active")
            return
            
        logger.info(f"📹 Starting camera stream: {camera_id}")
        
        # Create camera processor
        camera_processor = CameraProcessor(
            camera_id=camera_id,
            rtsp_url=rtsp_url,
            model=self.model,
            ai_rules=self.ai_rules,
            detection_queue=self.detection_queue
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
                'timestamp': datetime.now().isoformat()
            }
        })

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
        logger.info("⚙️ Updating AI rules configuration")
        self.ai_rules.update(new_rules)
        
        # Update rules for all active processors
        for camera_info in self.active_cameras.values():
            camera_info['processor'].update_rules(self.ai_rules)
            
        logger.info("✅ AI rules updated successfully")

    async def capture_snapshot(self, camera_id: str):
        """Capture snapshot from camera"""
        if camera_id not in self.active_cameras:
            logger.warning(f"⚠️ Camera {camera_id} not active for snapshot")
            return
            
        logger.info(f"📸 Capturing snapshot: {camera_id}")
        
        camera_info = self.active_cameras[camera_id]
        snapshot_path = camera_info['processor'].capture_snapshot()
        
        # Notify clients
        await self.broadcast_message({
            'type': 'snapshot_ready',
            'data': {
                'camera_id': camera_id,
                'snapshot_path': snapshot_path,
                'timestamp': datetime.now().isoformat()
            }
        })

    async def process_detection_queue(self):
        """Process detections from all cameras"""
        while self.is_running:
            try:
                if not self.detection_queue.empty():
                    detection = self.detection_queue.get_nowait()
                    await self.handle_detection(detection)
                else:
                    await asyncio.sleep(0.1)
                    
            except Exception as e:
                logger.error(f"❌ Detection queue error: {e}")
                await asyncio.sleep(1)

    async def handle_detection(self, detection: Dict):
        """Handle a detection result"""
        self.detection_count += 1
        
        # Apply AI rules
        alerts = self.apply_ai_rules(detection)
        
        # Broadcast detection
        await self.broadcast_message({
            'type': 'detection',
            'data': detection
        })
        
        # Broadcast any alerts
        for alert in alerts:
            await self.broadcast_message({
                'type': 'alert',
                'data': alert
            })

    def apply_ai_rules(self, detection: Dict) -> List[Dict]:
        """Apply AI rules to detection and generate alerts"""
        alerts = []
        
        # Person detection rule
        if detection.get('class') == 'person':
            confidence = detection.get('confidence', 0)
            
            # Unknown person alert
            if (self.ai_rules['unknown_person']['enabled'] and 
                confidence >= self.ai_rules['unknown_person']['alert_threshold']):
                
                alerts.append({
                    'alert_id': f"unknown_{int(time.time())}",
                    'alert_type': 'unknown_person',
                    'camera_id': detection['camera_id'],
                    'priority': self.ai_rules['unknown_person']['priority'],
                    'description': f"Unknown person detected with {confidence:.1%} confidence",
                    'timestamp': datetime.now().isoformat(),
                    'detection_details': detection
                })
        
        # Zone breach detection (simulated)
        if self.ai_rules['zone_breach']['enabled']:
            # Simulate zone breach detection
            if np.random.random() < 0.05:  # 5% chance for demo
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

    async def websocket_handler(self, websocket, path):
        """Handle WebSocket connections from Electron app"""
        logger.info("🔌 New WebSocket client connected")
        self.websocket_clients.add(websocket)
        
        try:
            # Send initial status
            await websocket.send(json.dumps({
                'type': 'status',
                'data': {
                    'engine_status': 'connected',
                    'model_loaded': self.model is not None,
                    'active_cameras': len(self.active_cameras),
                    'detection_count': self.detection_count,
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
        """Handle incoming WebSocket messages"""
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
                await self.capture_snapshot(payload.get('camera_id'))
            elif command == 'get_status':
                await websocket.send(json.dumps({
                    'type': 'status',
                    'data': {
                        'engine_status': 'running',
                        'active_cameras': len(self.active_cameras),
                        'detection_count': self.detection_count
                    }
                }))
            else:
                logger.warning(f"⚠️ Unknown command: {command}")
                
        except json.JSONDecodeError:
            logger.error("❌ Invalid JSON message received")
        except Exception as e:
            logger.error(f"❌ Message handling error: {e}")

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
        logger.info(f"🚀 Starting WebSocket server on port {self.websocket_port}")
        
        server = await websockets.serve(
            self.websocket_handler,
            "localhost",
            self.websocket_port
        )
        
        logger.info(f"✅ WebSocket server running on ws://localhost:{self.websocket_port}")
        return server

    async def run(self):
        """Main run loop for AI engine"""
        self.is_running = True
        logger.info("🚀 Starting Apex AI Engine...")
        
        # Load AI model
        model_loaded = await self.load_model()
        if not model_loaded:
            logger.error("❌ Failed to load AI model, running in simulation mode")
        
        # Start WebSocket server
        websocket_server = await self.start_websocket_server()
        
        # Start detection processing
        detection_task = asyncio.create_task(self.process_detection_queue())
        
        logger.info("✅ Apex AI Engine is ready!")
        
        try:
            # Keep running
            await asyncio.gather(
                detection_task,
                websocket_server.wait_closed()
            )
        except KeyboardInterrupt:
            logger.info("🛑 Shutting down AI Engine...")
        finally:
            self.is_running = False
            
            # Stop all cameras
            for camera_id in list(self.active_cameras.keys()):
                await self.stop_camera_stream(camera_id)
            
            logger.info("✅ AI Engine shutdown complete")


class CameraProcessor:
    """Processes individual camera streams"""
    
    def __init__(self, camera_id: str, rtsp_url: str, model, ai_rules: Dict, detection_queue: queue.Queue):
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.model = model
        self.ai_rules = ai_rules
        self.detection_queue = detection_queue
        self.is_running = False
        self.cap = None
        
    def process_stream(self):
        """Main processing loop for camera stream"""
        self.is_running = True
        logger.info(f"📹 Starting camera processor: {self.camera_id}")
        
        try:
            # Try to open video stream
            self.cap = cv2.VideoCapture(self.rtsp_url)
            
            if not self.cap.isOpened():
                logger.warning(f"⚠️ Could not open stream: {self.camera_id}, using simulation")
                self.simulate_detections()
                return
            
            frame_count = 0
            while self.is_running:
                ret, frame = self.cap.read()
                
                if not ret:
                    logger.warning(f"⚠️ Failed to read frame from {self.camera_id}")
                    time.sleep(1)
                    continue
                
                # Process every 5th frame for performance
                if frame_count % 5 == 0:
                    self.process_frame(frame)
                
                frame_count += 1
                time.sleep(0.1)  # Limit processing rate
                
        except Exception as e:
            logger.error(f"❌ Camera processor error for {self.camera_id}: {e}")
        finally:
            if self.cap:
                self.cap.release()
            logger.info(f"✅ Camera processor stopped: {self.camera_id}")
    
    def process_frame(self, frame):
        """Process a single frame for AI detection"""
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
                self.simulate_frame_detection()
                
        except Exception as e:
            logger.error(f"❌ Frame processing error: {e}")
    
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
    
    def simulate_detections(self):
        """Simulate detections when real stream is not available"""
        logger.info(f"🎭 Simulating detections for {self.camera_id}")
        
        while self.is_running:
            # Randomly generate detections
            if np.random.random() < 0.3:  # 30% chance per iteration
                self.simulate_frame_detection()
            
            time.sleep(2)  # Check every 2 seconds
    
    def simulate_frame_detection(self):
        """Generate a simulated detection"""
        classes = ['person', 'car', 'truck', 'bicycle']
        selected_class = np.random.choice(classes, p=[0.7, 0.15, 0.1, 0.05])
        
        detection = {
            'camera_id': self.camera_id,
            'timestamp': datetime.now().isoformat(),
            'class': selected_class,
            'confidence': 0.6 + np.random.random() * 0.4,  # 60-100%
            'bounding_box': {
                'x': np.random.random() * 0.7,  # 0-70% from left
                'y': np.random.random() * 0.7,  # 0-70% from top
                'width': 0.1 + np.random.random() * 0.2,  # 10-30% width
                'height': 0.1 + np.random.random() * 0.3   # 10-40% height
            }
        }
        
        self.detection_queue.put(detection)
    
    def capture_snapshot(self) -> str:
        """Capture snapshot from current frame"""
        timestamp = int(time.time())
        snapshot_filename = f"snapshot_{self.camera_id}_{timestamp}.jpg"
        
        # In a real implementation, save actual frame
        logger.info(f"📸 Snapshot captured: {snapshot_filename}")
        return snapshot_filename
    
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
    
    # Create and run AI engine
    engine = ApexAIEngine(
        websocket_port=WEBSOCKET_PORT,
        model_path=MODEL_PATH
    )
    
    try:
        asyncio.run(engine.run())
    except KeyboardInterrupt:
        logger.info("👋 AI Engine stopped by user")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
