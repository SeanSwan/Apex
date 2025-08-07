"""
APEX AI ENGINE - ENHANCED WEBSOCKET CLIENT (SOCKET.IO)
==========================================
Production-ready Socket.io client for reliable real-time communication
Features: Auto-reconnection, message queuing, heartbeat monitoring, error recovery

This client connects to the Socket.io Enhanced WebSocket Server and handles:
- AI detection result streaming
- Face recognition alerts
- Camera stream management
- Robust error handling and reconnection
"""

import asyncio
import json
import logging
import socketio
import time
import queue
import threading
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass
from enum import Enum
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ConnectionState(Enum):
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting" 
    CONNECTED = "connected"
    AUTHENTICATED = "authenticated"
    ERROR = "error"

@dataclass
class WebSocketMessage:
    """Structured message for WebSocket communication"""
    type: str
    data: Dict
    timestamp: float = None
    request_id: str = None
    retry_count: int = 0
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = time.time()

class EnhancedWebSocketClient:
    """
    Enhanced Socket.io client with robust connection management
    """
    
    def __init__(self, 
                 server_url: str = "http://localhost:5000",
                 auth_token: str = "apex_ai_engine_2024",
                 max_reconnect_attempts: int = 5,
                 reconnect_delay: float = 2.0,
                 heartbeat_interval: float = 30.0):
        
        self.server_url = server_url
        self.auth_token = auth_token
        self.max_reconnect_attempts = max_reconnect_attempts
        self.reconnect_delay = reconnect_delay
        self.heartbeat_interval = heartbeat_interval
        
        # Initialize Socket.io client
        self.sio = socketio.AsyncClient(
            reconnection=True,
            reconnection_attempts=max_reconnect_attempts,
            reconnection_delay=reconnect_delay,
            logger=True,
            engineio_logger=True
        )
        
        # Connection state
        self.connection_state = ConnectionState.DISCONNECTED
        self.reconnect_count = 0
        self.last_heartbeat = 0
        self.client_id = None
        
        # Message handling
        self.message_queue = queue.Queue()
        self.pending_requests = {}
        self.message_handlers = {}
        self.error_handlers = []
        
        # Background tasks
        self.heartbeat_task = None
        self.message_processor_task = None
        self.connection_monitor_task = None
        
        # Statistics
        self.stats = {
            'messages_sent': 0,
            'messages_received': 0,
            'connection_attempts': 0,
            'reconnections': 0,
            'errors': 0,
            'connected_at': None,
            'last_error': None
        }
        
        # Setup Socket.io event handlers
        self.setup_socketio_handlers()
        self.setup_default_handlers()
        
        logger.info(f"🤖 Enhanced WebSocket client initialized for {server_url}")
    
    def setup_socketio_handlers(self):
        """Setup Socket.io event handlers"""
        
        @self.sio.event
        async def connect():
            logger.info("✅ Socket.io connected")
            self.connection_state = ConnectionState.CONNECTED
            self.stats['connected_at'] = time.time()
            
            # Send client identification
            await self.sio.emit('client_identification', {
                'client_type': 'ai_engine',
                'client_info': {
                    'auth_token': self.auth_token,
                    'capabilities': {
                        'object_detection': True,
                        'face_recognition': True,
                        'real_time_processing': True,
                        'alert_generation': True
                    },
                    'version': '2.0.0'
                }
            })
        
        @self.sio.event
        async def disconnect():
            logger.info("🔌 Socket.io disconnected")
            self.connection_state = ConnectionState.DISCONNECTED
        
        @self.sio.event
        async def connect_error(data):
            logger.error(f"❌ Socket.io connection error: {data}")
            self.connection_state = ConnectionState.ERROR
            self.stats['errors'] += 1
            self.stats['last_error'] = str(data)
        
        @self.sio.event
        async def identification_success(data):
            logger.info(f"🔐 Client authenticated: {data}")
            self.connection_state = ConnectionState.AUTHENTICATED
            self.client_id = data.get('client_id')
        
        # AI Engine specific message handlers
        @self.sio.on('start_stream_processing')
        async def handle_start_stream(data):
            if 'start_stream_processing' in self.message_handlers:
                await self.message_handlers['start_stream_processing'](data)
        
        @self.sio.on('stop_stream_processing')
        async def handle_stop_stream(data):
            if 'stop_stream_processing' in self.message_handlers:
                await self.message_handlers['stop_stream_processing'](data)
        
        @self.sio.on('change_stream_quality')
        async def handle_quality_change(data):
            if 'change_stream_quality' in self.message_handlers:
                await self.message_handlers['change_stream_quality'](data)

    def setup_default_handlers(self):
        """Setup default message handlers for system messages"""
        
        self.register_handler('connection_established', self._handle_connection_established)
        self.register_handler('identification_success', self._handle_identification_success)
        self.register_handler('heartbeat_ack', self._handle_heartbeat_ack)
        self.register_handler('error', self._handle_server_error)
        
        # Stream management handlers
        self.register_handler('start_stream_processing', self._handle_start_stream_processing)
        self.register_handler('stop_stream_processing', self._handle_stop_stream_processing)
        self.register_handler('change_stream_quality', self._handle_change_stream_quality)

    def register_handler(self, message_type: str, handler: Callable):
        """Register a message handler for specific message types"""
        self.message_handlers[message_type] = handler
        logger.debug(f"📝 Registered handler for {message_type}")

    def register_error_handler(self, handler: Callable):
        """Register an error handler"""
        self.error_handlers.append(handler)

    async def connect(self) -> bool:
        """
        Connect to the WebSocket server with retry logic
        """
        logger.info(f"🔌 Connecting to {self.server_url}")
        self.connection_state = ConnectionState.CONNECTING
        self.stats['connection_attempts'] += 1
        
    async def connect(self) -> bool:
        """
        Connect to the Socket.io server with retry logic
        """
        logger.info(f"🔌 Connecting to {self.server_url}")
        self.connection_state = ConnectionState.CONNECTING
        self.stats['connection_attempts'] += 1
        
        try:
            # Connect using Socket.io client
            await self.sio.connect(self.server_url)
            
            # Wait for authentication
            timeout = 10  # 10 seconds timeout
            start_time = time.time()
            while (self.connection_state != ConnectionState.AUTHENTICATED and 
                   time.time() - start_time < timeout):
                await asyncio.sleep(0.1)
            
            if self.connection_state == ConnectionState.AUTHENTICATED:
                logger.info("✅ Successfully connected and authenticated")
                return True
            else:
                logger.error("❌ Authentication timeout")
                return False
                
        except Exception as e:
            logger.error(f"❌ Connection failed: {e}")
            self.connection_state = ConnectionState.ERROR
            self.stats['errors'] += 1
            self.stats['last_error'] = str(e)
            return False
    
    async def send_message(self, message_type: str, data: Dict, request_id: str = None):
        """
        Send a message to the server via Socket.io
        """
        if self.connection_state not in [ConnectionState.CONNECTED, ConnectionState.AUTHENTICATED]:
            logger.warning(f"⚠️ Cannot send message {message_type}: not connected")
            return False
        
        try:
            message_data = {
                'type': message_type,
                'data': data,
                'timestamp': time.time()
            }
            
            if request_id:
                message_data['request_id'] = request_id
            
            # Send via Socket.io
            await self.sio.emit(message_type, message_data)
            
            self.stats['messages_sent'] += 1
            logger.debug(f"📤 Sent {message_type} message")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send message {message_type}: {e}")
            self.stats['errors'] += 1
            return False
            # Connect with timeout
            self.websocket = await asyncio.wait_for(
                websockets.connect(
                    self.server_url,
                    ping_interval=20,
                    ping_timeout=10,
                    close_timeout=10
                ),
                timeout=10.0
            )
            
            self.connection_state = ConnectionState.CONNECTED
            self.stats['connected_at'] = time.time()
            self.reconnect_count = 0
            
            logger.info("✅ WebSocket connection established")
            
            # Start background tasks
            await self.start_background_tasks()
            
            # Send client identification
            await self.identify_client()
            
            return True
            
        except asyncio.TimeoutError:
            logger.error("❌ Connection timeout")
            self.connection_state = ConnectionState.ERROR
            self.stats['errors'] += 1
            return False
            
        except Exception as e:
            logger.error(f"❌ Connection failed: {e}")
            self.connection_state = ConnectionState.ERROR
            self.stats['errors'] += 1
            self.stats['last_error'] = str(e)
            return False

    async def identify_client(self):
        """Send client identification to the server"""
        identification_message = {
            'client_type': 'ai_engine',
            'auth_token': self.auth_token,
            'capabilities': {
                'ai_detection': True,
                'face_recognition': True,
                'rtsp_processing': True,
                'real_time_alerts': True
            },
            'version': '2.0.0'
        }
        
        await self.send_message('client_identify', identification_message)
        logger.info("🔐 Client identification sent")

    async def start_background_tasks(self):
        """Start background tasks for message processing and heartbeat"""
        
        # Message listener
        asyncio.create_task(self.message_listener())
        
        # Message processor
        self.message_processor_task = asyncio.create_task(self.message_processor())
        
        # Heartbeat
        self.heartbeat_task = asyncio.create_task(self.heartbeat_sender())
        
        # Connection monitor
        self.connection_monitor_task = asyncio.create_task(self.connection_monitor())
        
        logger.info("🔄 Background tasks started")

    async def message_listener(self):
        """Listen for incoming messages"""
        try:
            async for message in self.websocket:
                await self.handle_incoming_message(message)
        except websockets.exceptions.ConnectionClosed:
            logger.warning("🔌 WebSocket connection closed")
            self.connection_state = ConnectionState.DISCONNECTED
        except Exception as e:
            logger.error(f"❌ Message listener error: {e}")
            self.connection_state = ConnectionState.ERROR

    async def handle_incoming_message(self, raw_message: str):
        """Handle incoming WebSocket message"""
        try:
            message = json.loads(raw_message)
            self.stats['messages_received'] += 1
            
            message_type = message.get('type') or list(message.keys())[0]
            message_data = message.get('data', message)
            
            logger.debug(f"📨 Received: {message_type}")
            
            # Add to processing queue
            websocket_message = WebSocketMessage(
                type=message_type,
                data=message_data,
                timestamp=time.time()
            )
            
            self.message_queue.put(websocket_message)
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON received: {e}")
            self.stats['errors'] += 1
        except Exception as e:
            logger.error(f"❌ Message handling error: {e}")
            self.stats['errors'] += 1

    async def message_processor(self):
        """Process messages from the queue"""
        while True:
            try:
                # Get message from queue with timeout
                try:
                    message = self.message_queue.get(timeout=1.0)
                except queue.Empty:
                    continue
                
                # Find and execute handler
                handler = self.message_handlers.get(message.type)
                if handler:
                    try:
                        await handler(message.data)
                    except Exception as e:
                        logger.error(f"❌ Handler error for {message.type}: {e}")
                        self.stats['errors'] += 1
                else:
                    logger.debug(f"⚠️ No handler for message type: {message.type}")
                
                self.message_queue.task_done()
                
            except Exception as e:
                logger.error(f"❌ Message processor error: {e}")
                await asyncio.sleep(1)

    async def heartbeat_sender(self):
        """Send periodic heartbeat messages"""
        while self.connection_state in [ConnectionState.CONNECTED, ConnectionState.AUTHENTICATED]:
            try:
                await self.send_message('heartbeat', {
                    'client_time': time.time(),
                    'client_id': self.client_id
                })
                
                await asyncio.sleep(self.heartbeat_interval)
                
            except Exception as e:
                logger.error(f"❌ Heartbeat error: {e}")
                break

    async def connection_monitor(self):
        """Monitor connection health and trigger reconnection if needed"""
        while True:
            try:
                if self.connection_state == ConnectionState.DISCONNECTED:
                    if self.reconnect_count < self.max_reconnect_attempts:
                        logger.info(f"🔄 Attempting reconnection {self.reconnect_count + 1}/{self.max_reconnect_attempts}")
                        await asyncio.sleep(self.reconnect_delay * (2 ** self.reconnect_count))  # Exponential backoff
                        
                        success = await self.connect()
                        if not success:
                            self.reconnect_count += 1
                        else:
                            self.stats['reconnections'] += 1
                    else:
                        logger.error("❌ Maximum reconnection attempts reached")
                        break
                
                await asyncio.sleep(5)  # Check every 5 seconds
                
            except Exception as e:
                logger.error(f"❌ Connection monitor error: {e}")
                await asyncio.sleep(5)

    async def send_message(self, message_type: str, data: Dict, request_id: str = None) -> bool:
        """Send message to the server"""
        if self.connection_state not in [ConnectionState.CONNECTED, ConnectionState.AUTHENTICATED]:
            logger.warning(f"⚠️ Cannot send message: not connected (state: {self.connection_state})")
            return False
        
        try:
            message = {
                'type': message_type,
                'data': data,
                'timestamp': time.time()
            }
            
            if request_id:
                message['request_id'] = request_id
            
            await self.websocket.send(json.dumps(message))
            self.stats['messages_sent'] += 1
            
            logger.debug(f"📤 Sent: {message_type}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Send message error: {e}")
            self.stats['errors'] += 1
            return False

    # Default message handlers
    async def _handle_connection_established(self, data: Dict):
        """Handle connection establishment"""
        self.client_id = data.get('client_id')
        logger.info(f"✅ Connection established, client ID: {self.client_id}")

    async def _handle_identification_success(self, data: Dict):
        """Handle successful client identification"""
        self.connection_state = ConnectionState.AUTHENTICATED
        logger.info("🔐 Client authentication successful")

    async def _handle_heartbeat_ack(self, data: Dict):
        """Handle heartbeat acknowledgment"""
        self.last_heartbeat = time.time()
        server_time = data.get('server_time', 0)
        client_time = data.get('client_time', 0)
        
        # Calculate latency
        latency = (time.time() - client_time) * 1000  # ms
        logger.debug(f"💓 Heartbeat ACK (latency: {latency:.1f}ms)")

    async def _handle_server_error(self, data: Dict):
        """Handle server error messages"""
        error_code = data.get('code', 'UNKNOWN')
        error_message = data.get('message', 'Unknown error')
        
        logger.error(f"❌ Server error [{error_code}]: {error_message}")
        self.stats['errors'] += 1
        
        # Call error handlers
        for handler in self.error_handlers:
            try:
                await handler(data)
            except Exception as e:
                logger.error(f"❌ Error handler failed: {e}")

    async def _handle_start_stream_processing(self, data: Dict):
        """Handle stream start processing request"""
        camera_id = data.get('camera_id')
        rtsp_url = data.get('rtsp_url')
        quality = data.get('quality', 'thumbnail')
        request_id = data.get('request_id')
        
        logger.info(f"🎥 Starting stream processing for camera {camera_id} (quality: {quality})")
        
        # TODO: Implement actual stream processing
        # For now, simulate processing
        await asyncio.sleep(0.5)
        
        # Send success response
        await self.send_message('stream_processing_started', {
            'camera_id': camera_id,
            'quality': quality,
            'status': 'processing'
        }, request_id)

    async def _handle_stop_stream_processing(self, data: Dict):
        """Handle stream stop processing request"""
        camera_id = data.get('camera_id')
        request_id = data.get('request_id')
        
        logger.info(f"🛑 Stopping stream processing for camera {camera_id}")
        
        # TODO: Implement actual stream stopping
        
        # Send success response
        await self.send_message('stream_processing_stopped', {
            'camera_id': camera_id,
            'status': 'stopped'
        }, request_id)

    async def _handle_change_stream_quality(self, data: Dict):
        """Handle stream quality change request"""
        camera_id = data.get('camera_id')
        new_quality = data.get('new_quality')
        request_id = data.get('request_id')
        
        logger.info(f"🔧 Changing stream quality for camera {camera_id} to {new_quality}")
        
        # TODO: Implement actual quality change
        
        # Send success response
        await self.send_message('stream_quality_changed', {
            'camera_id': camera_id,
            'new_quality': new_quality,
            'status': 'changed'
        }, request_id)

    # Public API methods for AI detection results
    async def send_ai_detection_result(self, camera_id: str, detections: List[Dict]):
        """Send AI detection results to the server"""
        await self.send_message('ai_detection_result', {
            'camera_id': camera_id,
            'detections': detections,
            'timestamp': time.time()
        })

    async def send_face_detection_result(self, camera_id: str, faces: List[Dict]):
        """Send face detection results to the server"""
        await self.send_message('face_detection_result', {
            'camera_id': camera_id,
            'faces': faces,
            'timestamp': time.time()
        })

    async def send_alert(self, alert_type: str, camera_id: str, data: Dict):
        """Send alert to the server"""
        await self.send_message('alert_triggered', {
            'type': alert_type,
            'camera_id': camera_id,
            'data': data,
            'timestamp': time.time(),
            'severity': data.get('severity', 'medium')
        })

    def get_stats(self) -> Dict:
        """Get connection statistics"""
        stats = self.stats.copy()
        stats['connection_state'] = self.connection_state.value
        stats['client_id'] = self.client_id
        stats['queue_size'] = self.message_queue.qsize()
        stats['reconnect_count'] = self.reconnect_count
        return stats

    async def disconnect(self):
        """Gracefully disconnect from the Socket.io server"""
        logger.info("🔌 Disconnecting from Socket.io server")
        
        self.connection_state = ConnectionState.DISCONNECTED
        
        # Cancel background tasks
        tasks = [self.heartbeat_task, self.message_processor_task, self.connection_monitor_task]
        for task in tasks:
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        
        # Disconnect Socket.io connection
        if self.sio.connected:
            await self.sio.disconnect()
        
        logger.info("✅ Disconnected successfully")

# Usage example and testing
async def main():
    """Example usage of the Enhanced Socket.io Client"""
    
    # Create client
    client = EnhancedWebSocketClient(
        server_url="http://localhost:5000",  # HTTP for Socket.io
        auth_token="apex_ai_engine_2024"
    )
    
    # Register custom handlers
    async def custom_stream_handler(data):
        print(f"Custom handler received: {data}")
    
    client.register_handler('custom_message', custom_stream_handler)
    
    # Connect
    success = await client.connect()
    if not success:
        print("Failed to connect")
        return
    
    # Send some test messages
    await asyncio.sleep(2)
    
    # Simulate AI detection results
    await client.send_ai_detection_result("cam_001", [
        {
            'type': 'person',
            'confidence': 0.95,
            'bounding_box': {'x': 0.1, 'y': 0.2, 'width': 0.3, 'height': 0.4}
        }
    ])
    
    # Simulate face detection
    await client.send_face_detection_result("cam_001", [
        {
            'person_id': 'person_123',
            'confidence': 0.89,
            'is_known': False,
            'bounding_box': {'x': 0.15, 'y': 0.25, 'width': 0.1, 'height': 0.15}
        }
    ])
    
    # Keep running
    try:
        while True:
            stats = client.get_stats()
            print(f"Stats: {stats}")
            await asyncio.sleep(10)
            
    except KeyboardInterrupt:
        print("Shutting down...")
        await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
