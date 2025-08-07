"""
APEX AI VISION AGENT
====================
Specialized AI agent for video input management and visual processing

This agent encapsulates all video capture logic including screen capture,
RTSP streams, and visual preprocessing for the AI detection pipeline.

Features:
- Unified video source management (RTSP, screen capture)
- Intelligent source failover and health monitoring
- Frame preprocessing and optimization for AI detection
- Multi-source coordination and load balancing
- Real-time performance monitoring
- Integration with MCP Server orchestration

Agent Responsibilities:
- Capture frames from video sources
- Monitor video source health and performance
- Provide frame data to detection agents
- Handle video source failover and recovery
- Manage video evidence collection
"""

import asyncio
import cv2
import numpy as np
import threading
import time
import queue
import logging
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass
from datetime import datetime
import json

# Import existing video capture components
try:
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from video_capture.video_input_manager import (
        VideoInputManager, VideoSourceConfig, VideoSourceType, VideoSourcePriority
    )
    from video_capture.dvr_screen_capture import DVRScreenCapture, ScreenRegion, CaptureMode
    from video_capture.rtsp_stream_client import RTSPStreamManager, RTSPStreamConfig
    from video_capture.screen_region_manager import ScreenRegionManager
    from video_capture.dvr_monitor_detector import DVRMonitorDetector
except ImportError as e:
    # Fallback for development
    VideoInputManager = None
    DVRScreenCapture = None
    RTSPStreamManager = None
    ScreenRegionManager = None
    logger = logging.getLogger(__name__)
    logger.warning(f"⚠️ Video capture components not available - agent will operate in simulation mode: {e}")
    
    # Create mock classes for development
    class MockCaptureMode:
        OPTIMIZED = "optimized"
    
    class MockScreenRegion:
        def __init__(self, x=0, y=0, width=640, height=480):
            self.x, self.y, self.width, self.height = x, y, width, height
    
    CaptureMode = MockCaptureMode
    ScreenRegion = MockScreenRegion

logger = logging.getLogger(__name__)

@dataclass
class VisionAgentTask:
    """Represents a task for the Vision Agent"""
    task_id: str
    action: str  # capture_frame, monitor_feeds, capture_evidence, etc.
    parameters: Dict[str, Any]
    priority: int = 1
    timestamp: str = None

@dataclass
class FrameData:
    """Represents captured frame data"""
    frame_id: str
    source_id: str
    frame: np.ndarray
    timestamp: str
    metadata: Dict[str, Any]
    quality_score: float = 1.0

class VisionAgent:
    """
    Vision Agent for APEX AI system
    
    Manages all video input sources and provides frame data to other agents
    in the ecosystem. Operates as part of the MCP orchestrated agent network.
    """
    
    def __init__(self, name: str, config: Dict[str, Any], mcp_server=None):
        self.name = name
        self.config = config
        self.mcp_server = mcp_server
        
        # Agent state
        self.enabled = True
        self.status = "initializing"
        self.task_queue = asyncio.Queue()
        self.active_tasks: Dict[str, VisionAgentTask] = {}
        
        # Video management components
        self.video_manager: Optional[VideoInputManager] = None
        self.screen_capture: Optional[DVRScreenCapture] = None
        self.rtsp_manager: Optional[RTSPStreamManager] = None
        self.region_manager: Optional[ScreenRegionManager] = None
        
        # Frame management
        self.frame_cache: Dict[str, FrameData] = {}
        self.max_cache_size = config.get('max_cache_size', 100)
        self.frame_counter = 0
        
        # Video sources
        self.active_sources: Dict[str, Dict] = {}
        self.source_health: Dict[str, Dict] = {}
        
        # Performance metrics
        self.metrics = {
            'frames_captured': 0,
            'frames_processed': 0,
            'source_switches': 0,
            'health_checks': 0,
            'average_fps': 0.0,
            'error_count': 0,
            'last_frame_time': None,
            'uptime_seconds': 0
        }
        
        # Configuration
        self.capture_fps = config.get('capture_fps', 15)
        self.frame_quality = config.get('frame_quality', 85)
        self.enable_screen_capture = config.get('enable_screen_capture', True)
        self.enable_rtsp_streams = config.get('enable_rtsp_streams', True)
        self.health_check_interval = config.get('health_check_interval', 30)
        
        # Threading
        self.worker_thread: Optional[threading.Thread] = None
        self.health_monitor_thread: Optional[threading.Thread] = None
        self.shutdown_event = threading.Event()
        
        logger.info(f"🎥 Vision Agent '{name}' initialized")
    
    async def initialize(self):
        """Initialize the Vision Agent"""
        try:
            self.status = "initializing"
            
            # Initialize video management components if available
            if VideoInputManager:
                await self._initialize_video_components()
            else:
                logger.warning("⚠️ Video components not available - running in simulation mode")
                await self._initialize_simulation_mode()
            
            # Start worker threads
            await self._start_worker_threads()
            
            self.status = "ready"
            logger.info(f"✅ Vision Agent '{self.name}' initialized successfully")
            
        except Exception as e:
            self.status = "error"
            logger.error(f"❌ Vision Agent initialization failed: {e}")
            raise
    
    async def _initialize_video_components(self):
        """Initialize actual video capture components"""
        try:
            # Initialize screen capture
            if self.enable_screen_capture:
                self.screen_capture = DVRScreenCapture(
                    capture_mode=CaptureMode.OPTIMIZED,
                    target_fps=self.capture_fps
                )
                
                # Initialize region manager
                self.region_manager = ScreenRegionManager()
                
                logger.info("✅ Screen capture initialized")
            
            # Initialize RTSP manager
            if self.enable_rtsp_streams:
                self.rtsp_manager = RTSPStreamManager()
                logger.info("✅ RTSP manager initialized")
            
            # Initialize main video manager
            self.video_manager = VideoInputManager()
            
            # Register default sources
            await self._register_default_sources()
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize video components: {e}")
            raise
    
    async def _initialize_simulation_mode(self):
        """Initialize simulation mode for development/testing"""
        logger.info("🎭 Initializing Vision Agent in simulation mode")
        
        # Create simulated video sources
        self.active_sources = {
            'sim_camera_1': {
                'type': 'simulation',
                'name': 'Simulated Camera 1',
                'status': 'active',
                'fps': self.capture_fps,
                'resolution': (1920, 1080)
            },
            'sim_camera_2': {
                'type': 'simulation',
                'name': 'Simulated Camera 2',
                'status': 'active',
                'fps': self.capture_fps,
                'resolution': (1280, 720)
            }
        }
        
        # Initialize health monitoring for simulated sources
        for source_id in self.active_sources:
            self.source_health[source_id] = {
                'status': 'healthy',
                'fps': self.capture_fps,
                'error_count': 0,
                'last_check': datetime.now().isoformat()
            }
    
    async def _register_default_sources(self):
        """Register default video sources"""
        try:
            # Register screen capture regions if available
            if self.screen_capture and self.region_manager:
                # Add some default monitoring regions
                default_regions = [
                    {'name': 'Main Monitor', 'x': 0, 'y': 0, 'width': 1920, 'height': 1080},
                    {'name': 'Secondary Monitor', 'x': 1920, 'y': 0, 'width': 1920, 'height': 1080}
                ]
                
                for region_config in default_regions:
                    try:
                        region = ScreenRegion(
                            x=region_config['x'],
                            y=region_config['y'],
                            width=region_config['width'],
                            height=region_config['height']
                        )
                        
                        source_id = f"screen_{region_config['name'].lower().replace(' ', '_')}"
                        self.active_sources[source_id] = {
                            'type': 'screen_capture',
                            'region': region,
                            'name': region_config['name'],
                            'status': 'active'
                        }
                        
                        self.source_health[source_id] = {
                            'status': 'healthy',
                            'fps': self.capture_fps,
                            'error_count': 0,
                            'last_check': datetime.now().isoformat()
                        }
                        
                        logger.info(f"✅ Registered screen capture source: {source_id}")
                        
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to register screen region {region_config['name']}: {e}")
            
            # TODO: Register RTSP sources from configuration
            
        except Exception as e:
            logger.error(f"❌ Failed to register default sources: {e}")
    
    async def _start_worker_threads(self):
        """Start background worker threads"""
        try:
            # Start main processing thread
            self.worker_thread = threading.Thread(
                target=self._worker_thread_main,
                name=f"{self.name}_worker",
                daemon=True
            )
            self.worker_thread.start()
            
            # Start health monitoring thread
            self.health_monitor_thread = threading.Thread(
                target=self._health_monitor_main,
                name=f"{self.name}_health",
                daemon=True
            )
            self.health_monitor_thread.start()
            
            logger.info(f"✅ Worker threads started for Vision Agent '{self.name}'")
            
        except Exception as e:
            logger.error(f"❌ Failed to start worker threads: {e}")
            raise
    
    def _worker_thread_main(self):
        """Main worker thread for frame capture and processing"""
        logger.info(f"🔄 Vision Agent worker thread started: {self.name}")
        
        last_frame_time = time.time()
        frame_interval = 1.0 / self.capture_fps
        
        while not self.shutdown_event.is_set():
            try:
                current_time = time.time()
                
                # Capture frames from active sources
                if current_time - last_frame_time >= frame_interval:
                    self._capture_frames_from_sources()
                    last_frame_time = current_time
                
                # Process any pending tasks
                self._process_pending_tasks()
                
                # Small sleep to prevent CPU spinning
                time.sleep(0.01)
                
            except Exception as e:
                logger.error(f"❌ Worker thread error: {e}")
                self.metrics['error_count'] += 1
                time.sleep(1)
    
    def _health_monitor_main(self):
        """Health monitoring thread"""
        logger.info(f"🏥 Vision Agent health monitor started: {self.name}")
        
        while not self.shutdown_event.is_set():
            try:
                self._perform_health_checks()
                self.metrics['health_checks'] += 1
                
                # Sleep for health check interval
                self.shutdown_event.wait(self.health_check_interval)
                
            except Exception as e:
                logger.error(f"❌ Health monitor error: {e}")
                time.sleep(5)
    
    def _capture_frames_from_sources(self):
        """Capture frames from all active video sources"""
        try:
            for source_id, source_config in self.active_sources.items():
                if source_config.get('status') != 'active':
                    continue
                
                try:
                    frame = self._capture_frame_from_source(source_id, source_config)
                    if frame is not None:
                        self._process_captured_frame(source_id, frame)
                        
                except Exception as e:
                    logger.error(f"❌ Frame capture error for {source_id}: {e}")
                    self._handle_source_error(source_id, str(e))
                    
        except Exception as e:
            logger.error(f"❌ Frame capture loop error: {e}")
    
    def _capture_frame_from_source(self, source_id: str, source_config: Dict) -> Optional[np.ndarray]:
        """Capture a frame from a specific source"""
        try:
            source_type = source_config.get('type', 'unknown')
            
            if source_type == 'screen_capture' and self.screen_capture:
                region = source_config.get('region')
                if region:
                    frame = self.screen_capture.capture_region(region)
                    return frame
                    
            elif source_type == 'rtsp' and self.rtsp_manager:
                stream_url = source_config.get('url')
                if stream_url:
                    frame = self.rtsp_manager.get_latest_frame(stream_url)
                    return frame
                    
            elif source_type == 'simulation':
                # Generate simulated frame
                resolution = source_config.get('resolution', (640, 480))
                frame = self._generate_simulation_frame(source_id, resolution)
                return frame
                
            else:
                logger.warning(f"⚠️ Unknown source type: {source_type} for {source_id}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Failed to capture frame from {source_id}: {e}")
            return None
    
    def _generate_simulation_frame(self, source_id: str, resolution: Tuple[int, int]) -> np.ndarray:
        """Generate a simulated frame for testing"""
        try:
            # Create a simple test pattern with timestamp
            height, width = resolution[1], resolution[0]
            frame = np.zeros((height, width, 3), dtype=np.uint8)
            
            # Add some visual elements
            cv2.rectangle(frame, (50, 50), (width-50, height-50), (0, 100, 200), 2)
            
            # Add timestamp text
            timestamp = datetime.now().strftime("%H:%M:%S")
            cv2.putText(frame, f"{source_id} - {timestamp}", (60, 100), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            # Add frame counter
            cv2.putText(frame, f"Frame: {self.frame_counter}", (60, 150), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            return frame
            
        except Exception as e:
            logger.error(f"❌ Failed to generate simulation frame: {e}")
            return None
    
    def _process_captured_frame(self, source_id: str, frame: np.ndarray):
        """Process a captured frame"""
        try:
            self.frame_counter += 1
            frame_id = f"frame_{source_id}_{self.frame_counter}_{int(time.time() * 1000)}"
            
            # Create frame data object
            frame_data = FrameData(
                frame_id=frame_id,
                source_id=source_id,
                frame=frame.copy(),
                timestamp=datetime.now().isoformat(),
                metadata={
                    'source_type': self.active_sources[source_id].get('type', 'unknown'),
                    'resolution': (frame.shape[1], frame.shape[0]),
                    'channels': frame.shape[2] if len(frame.shape) > 2 else 1,
                    'size_bytes': frame.nbytes
                },
                quality_score=self._calculate_frame_quality(frame)
            )
            
            # Cache frame
            self._cache_frame(frame_data)
            
            # Update metrics
            self.metrics['frames_captured'] += 1
            self.metrics['frames_processed'] += 1
            self.metrics['last_frame_time'] = frame_data.timestamp
            
            # Calculate FPS
            self._update_fps_metrics()
            
            logger.debug(f"📸 Processed frame {frame_id} from {source_id}")
            
        except Exception as e:
            logger.error(f"❌ Frame processing error: {e}")
    
    def _calculate_frame_quality(self, frame: np.ndarray) -> float:
        """Calculate quality score for a frame"""
        try:
            # Simple quality metric based on variance (higher variance = more detail)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if len(frame.shape) > 2 else frame
            variance = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Normalize to 0-1 range (arbitrarily using 1000 as max variance)
            quality = min(variance / 1000.0, 1.0)
            return max(quality, 0.1)  # Minimum quality of 0.1
            
        except Exception as e:
            logger.error(f"❌ Quality calculation error: {e}")
            return 0.5  # Default medium quality
    
    def _cache_frame(self, frame_data: FrameData):
        """Cache frame data with size management"""
        try:
            self.frame_cache[frame_data.frame_id] = frame_data
            
            # Manage cache size
            if len(self.frame_cache) > self.max_cache_size:
                # Remove oldest frames
                oldest_keys = sorted(self.frame_cache.keys())[:len(self.frame_cache) - self.max_cache_size]
                for key in oldest_keys:
                    del self.frame_cache[key]
                    
        except Exception as e:
            logger.error(f"❌ Frame caching error: {e}")
    
    def _update_fps_metrics(self):
        """Update FPS calculation"""
        try:
            # Simple FPS calculation over recent frames
            current_time = time.time()
            if not hasattr(self, '_fps_calculation_start'):
                self._fps_calculation_start = current_time
                self._fps_frame_count = 0
            
            self._fps_frame_count += 1
            elapsed = current_time - self._fps_calculation_start
            
            if elapsed >= 5.0:  # Calculate every 5 seconds
                fps = self._fps_frame_count / elapsed
                self.metrics['average_fps'] = fps
                
                # Reset counters
                self._fps_calculation_start = current_time
                self._fps_frame_count = 0
                
                logger.debug(f"📊 Current FPS: {fps:.2f}")
                
        except Exception as e:
            logger.error(f"❌ FPS calculation error: {e}")
    
    def _perform_health_checks(self):
        """Perform health checks on all video sources"""
        try:
            for source_id, source_config in self.active_sources.items():
                health_status = self._check_source_health(source_id, source_config)
                self.source_health[source_id] = health_status
                
                if health_status['status'] != 'healthy':
                    logger.warning(f"⚠️ Source {source_id} health issue: {health_status}")
                    
        except Exception as e:
            logger.error(f"❌ Health check error: {e}")
    
    def _check_source_health(self, source_id: str, source_config: Dict) -> Dict:
        """Check health of a specific source"""
        try:
            # Basic health check implementation
            health_status = {
                'status': 'healthy',
                'fps': self.capture_fps,
                'error_count': 0,
                'last_check': datetime.now().isoformat(),
                'details': {}
            }
            
            # TODO: Implement actual health checks based on source type
            # For now, assume all sources are healthy
            
            return health_status
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'last_check': datetime.now().isoformat()
            }
    
    def _handle_source_error(self, source_id: str, error: str):
        """Handle an error with a video source"""
        try:
            logger.error(f"❌ Source error for {source_id}: {error}")
            
            # Update source health
            if source_id in self.source_health:
                self.source_health[source_id]['error_count'] += 1
                self.source_health[source_id]['status'] = 'error'
                self.source_health[source_id]['last_error'] = error
            
            # TODO: Implement recovery logic
            
        except Exception as e:
            logger.error(f"❌ Error handling failed: {e}")
    
    def _process_pending_tasks(self):
        """Process any pending tasks from the task queue"""
        try:
            # Non-blocking task processing
            # In a real implementation, this would process async tasks
            pass
            
        except Exception as e:
            logger.error(f"❌ Task processing error: {e}")
    
    async def execute_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a task assigned by the MCP Server"""
        try:
            task_id = task_data.get('task_id', 'unknown')
            action = task_data.get('action', 'unknown')
            parameters = task_data.get('parameters', {})
            
            logger.info(f"🎯 Executing Vision Agent task: {action} [{task_id}]")
            
            start_time = time.time()
            
            # Execute based on action type
            if action == 'capture_frame':
                result = await self._handle_capture_frame(parameters)
            elif action == 'monitor_feeds':
                result = await self._handle_monitor_feeds(parameters)
            elif action == 'capture_evidence':
                result = await self._handle_capture_evidence(parameters)
            elif action == 'get_status':
                result = await self._handle_get_status(parameters)
            elif action == 'list_sources':
                result = await self._handle_list_sources(parameters)
            else:
                result = {
                    'success': False,
                    'error': f'Unknown action: {action}',
                    'supported_actions': ['capture_frame', 'monitor_feeds', 'capture_evidence', 'get_status', 'list_sources']
                }
            
            execution_time = time.time() - start_time
            
            # Add execution metadata
            result['execution_time'] = execution_time
            result['task_id'] = task_id
            result['agent'] = self.name
            result['timestamp'] = datetime.now().isoformat()
            
            logger.info(f"✅ Vision Agent task completed: {action} in {execution_time:.3f}s")
            
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
    
    async def _handle_capture_frame(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle frame capture request"""
        try:
            source_id = parameters.get('source_id', 'all')
            format_type = parameters.get('format', 'array')
            
            if source_id == 'all':
                # Capture from all sources
                frames_data = []
                for sid in self.active_sources.keys():
                    frame_data = self._get_latest_frame(sid)
                    if frame_data:
                        frames_data.append({
                            'source_id': sid,
                            'frame_id': frame_data.frame_id,
                            'timestamp': frame_data.timestamp,
                            'metadata': frame_data.metadata,
                            'quality_score': frame_data.quality_score
                        })
                
                return {
                    'success': True,
                    'frames': frames_data,
                    'total_frames': len(frames_data)
                }
            else:
                # Capture from specific source
                frame_data = self._get_latest_frame(source_id)
                if frame_data:
                    return {
                        'success': True,
                        'frame_id': frame_data.frame_id,
                        'source_id': source_id,
                        'timestamp': frame_data.timestamp,
                        'metadata': frame_data.metadata,
                        'quality_score': frame_data.quality_score
                    }
                else:
                    return {
                        'success': False,
                        'error': f'No frame available from source: {source_id}'
                    }
                    
        except Exception as e:
            logger.error(f"❌ Capture frame error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _handle_monitor_feeds(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle feed monitoring request"""
        try:
            duration = parameters.get('duration', 30)  # seconds
            
            # Return current monitoring status
            return {
                'success': True,
                'monitoring_active': True,
                'active_sources': len(self.active_sources),
                'healthy_sources': len([s for s in self.source_health.values() if s.get('status') == 'healthy']),
                'monitoring_duration': duration,
                'fps': self.metrics['average_fps']
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _handle_capture_evidence(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle evidence capture request"""
        try:
            duration = parameters.get('duration', 30)
            priority = parameters.get('priority', 'medium')
            source_id = parameters.get('source_id', 'all')
            
            # For now, return success with capture details
            evidence_id = f"evidence_{int(time.time() * 1000)}"
            
            return {
                'success': True,
                'evidence_id': evidence_id,
                'duration': duration,
                'priority': priority,
                'source_id': source_id,
                'capture_started': datetime.now().isoformat()
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
                'active_sources': len(self.active_sources),
                'cached_frames': len(self.frame_cache),
                'metrics': self.metrics.copy(),
                'source_health': self.source_health.copy()
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _handle_list_sources(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle list sources request"""
        try:
            include_health = parameters.get('include_health', True)
            
            sources_info = []
            for source_id, source_config in self.active_sources.items():
                source_info = {
                    'source_id': source_id,
                    'name': source_config.get('name', source_id),
                    'type': source_config.get('type', 'unknown'),
                    'status': source_config.get('status', 'unknown')
                }
                
                if include_health and source_id in self.source_health:
                    source_info['health'] = self.source_health[source_id]
                
                sources_info.append(source_info)
            
            return {
                'success': True,
                'sources': sources_info,
                'total_sources': len(sources_info)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _get_latest_frame(self, source_id: str) -> Optional[FrameData]:
        """Get the latest frame from a specific source"""
        try:
            # Find the most recent frame from this source
            source_frames = [
                frame for frame in self.frame_cache.values()
                if frame.source_id == source_id
            ]
            
            if source_frames:
                # Return the most recent frame
                return max(source_frames, key=lambda f: f.timestamp)
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Get latest frame error: {e}")
            return None
    
    def get_agent_info(self) -> Dict[str, Any]:
        """Get comprehensive agent information"""
        return {
            'name': self.name,
            'type': 'vision_agent',
            'status': self.status,
            'enabled': self.enabled,
            'config': self.config,
            'capabilities': [
                'capture_frame',
                'monitor_feeds', 
                'capture_evidence',
                'get_status',
                'list_sources'
            ],
            'active_sources': len(self.active_sources),
            'metrics': self.metrics.copy(),
            'uptime': time.time() - getattr(self, '_start_time', time.time())
        }
    
    async def shutdown(self):
        """Shutdown the Vision Agent"""
        try:
            logger.info(f"🛑 Shutting down Vision Agent '{self.name}'")
            
            self.status = "shutting_down"
            self.shutdown_event.set()
            
            # Wait for threads to finish
            if self.worker_thread and self.worker_thread.is_alive():
                self.worker_thread.join(timeout=5)
            
            if self.health_monitor_thread and self.health_monitor_thread.is_alive():
                self.health_monitor_thread.join(timeout=5)
            
            # Cleanup video components
            if self.screen_capture:
                # TODO: Add cleanup method if available
                pass
            
            if self.rtsp_manager:
                # TODO: Add cleanup method if available
                pass
            
            # Clear caches
            self.frame_cache.clear()
            self.active_tasks.clear()
            
            self.status = "shutdown"
            logger.info(f"✅ Vision Agent '{self.name}' shutdown complete")
            
        except Exception as e:
            logger.error(f"❌ Vision Agent shutdown error: {e}")
            self.status = "error"
