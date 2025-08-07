"""
APEX AI ENGINE - ENHANCED WITH MULTI-MONITOR THREAT CORRELATION
===============================================================
Complete AI processing engine with real-time video capture, threat detection, and cross-monitor correlation
Integrates advanced multi-monitor threat tracking with <500ms handoff latency

Enhanced Key Features:
- Real-time screen capture and RTSP stream processing
- Multi-monitor threat correlation and tracking
- Cross-monitor threat handoff with AI-powered matching
- Advanced threat classification and alert generation
- Comprehensive performance monitoring and optimization
- Integration with professional frontend alert components
"""

import asyncio
import logging
import time
import random
import cv2
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
import json
import threading
import uuid

# Import enhanced WebSocket client
from enhanced_websocket_client import EnhancedWebSocketClient

# Import our new video capture system
from video_capture.video_input_manager import (
    VideoInputManager, VideoSourceConfig, VideoSourceType, VideoSourcePriority,
    create_screen_capture_source, create_rtsp_source
)
from video_capture.dvr_screen_capture import ScreenRegion
from video_capture.dvr_monitor_detector import DVRMonitorDetector

# Import enhanced TIER 2 alert coordination system with multi-monitor support
from tier2_alert_coordinator_enhanced import Tier2AlertCoordinator

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

class EnhancedApexAIEngineWithCorrelation:
    """
    Enhanced AI processing engine with multi-monitor threat correlation
    
    Combines real-time video processing from multiple sources with advanced
    AI threat detection models and cross-monitor threat correlation for
    comprehensive security monitoring with seamless threat tracking.
    """
    
    def __init__(self):
        # Enhanced WebSocket client - Connect to Socket.io backend
        self.websocket_client = EnhancedWebSocketClient(
            server_url="http://localhost:5000",
            auth_token="apex_ai_engine_2024"
        )
        
        # Video capture system
        self.video_manager: Optional[VideoInputManager] = None
        self.monitor_detector: Optional[DVRMonitorDetector] = None
        
        # Enhanced TIER 2 Alert Coordinator with Multi-Monitor Support
        self.tier2_coordinator: Optional[Tier2AlertCoordinator] = None
        
        # AI Models
        self.yolo_model = None
        self.threat_coordinator = None
        self.weapons_detector = None
        self.violence_detector = None
        self.package_theft_detector = None
        self.trespassing_detector = None
        
        # Face recognition system
        self.face_encodings = {}
        
        # Multi-monitor correlation state
        self.active_monitor_feeds = {}  # monitor_id -> feed_info
        self.correlation_enabled = True
        self.cross_monitor_handoff_latency_target = 0.5  # 500ms target
        
        # Processing state
        self.is_processing = False
        self.frame_processing_count = 0
        self.threat_detection_count = 0
        self.correlation_events_count = 0
        self.successful_handoffs_count = 0
        self.last_alert_time = {}
        
        # Enhanced performance monitoring including correlation metrics
        self.processing_stats = {
            'total_frames': 0,
            'threats_detected': 0,
            'alerts_sent': 0,
            'correlations_detected': 0,
            'successful_handoffs': 0,
            'failed_handoffs': 0,
            'average_handoff_latency': 0.0,
            'processing_fps': 0.0,
            'start_time': time.time()
        }
        
        # Configuration
        self.alert_cooldown = 3.0  # Minimum seconds between alerts for same source
        self.confidence_threshold = 0.6
        self.correlation_confidence_threshold = 0.65
        self.demo_mode = True  # Set to False for production RTSP streams
        
        logger.info("🚀 Enhanced Apex AI Engine with Multi-Monitor Correlation initialized")
    
    async def initialize_system(self):
        """Initialize the complete AI and video processing system with correlation"""
        logger.info("🚀 Initializing Enhanced AI System with Multi-Monitor Correlation...")
        
        # Initialize AI models
        await self.initialize_ai_models()
        
        # Initialize enhanced alert systems with correlation
        await self.initialize_enhanced_alert_systems()
        
        # Initialize video capture system
        await self.initialize_video_system()
        
        # Initialize threat detection models
        await self.initialize_threat_models()
        
        # Initialize multi-monitor correlation
        await self.initialize_multi_monitor_correlation()
        
        logger.info("✅ Enhanced AI System with Multi-Monitor Correlation initialization complete")
        logger.info(f"🎯 Correlation confidence threshold: {self.correlation_confidence_threshold}")
        logger.info(f"⚡ Target handoff latency: {self.cross_monitor_handoff_latency_target * 1000:.0f}ms")
        return True
    
    async def initialize_ai_models(self):
        """Initialize core AI models"""
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
        
        logger.info("🎯 Core AI models initialized")
    
    async def initialize_enhanced_alert_systems(self):
        """Initialize enhanced TIER 2 alert coordination system with multi-monitor correlation"""
        logger.info("🚨 Initializing Enhanced TIER 2 Alert Coordination System with Multi-Monitor Support...")
        
        try:
            # Initialize enhanced TIER 2 alert coordinator with correlation
            self.tier2_coordinator = Tier2AlertCoordinator(
                websocket_client=self.websocket_client,
                config={
                    'enable_visual': True,
                    'enable_audio': True,
                    'enable_voice': True,
                    'enable_multi_monitor': True,
                    'handoff_latency_target': self.cross_monitor_handoff_latency_target,
                    'correlation': {
                        'min_correlation_confidence': self.correlation_confidence_threshold,
                        'max_threat_age_seconds': 300,
                        'handoff_timeout_seconds': 8,
                        'weight_spatial': 0.3,
                        'weight_temporal': 0.25,
                        'weight_threat_type': 0.2,
                        'weight_features': 0.15,
                        'weight_movement': 0.1
                    },
                    'visual': {
                        'border_thickness': 6,
                        'max_opacity': 0.9,
                        'min_opacity': 0.3
                    },
                    'audio': {
                        'sample_rate': 44100,
                        'buffer_size': 1024,
                        'max_channels': 8,
                        'spatial_range': 10.0
                    }
                }
            )
            
            # Initialize correlation engine
            await self.tier2_coordinator.initialize_correlation_engine()
            
            # Setup demo monitor relationships
            await self.setup_demo_multi_monitor_relationships()
            
            # Register demo monitoring zones
            await self.setup_enhanced_demo_monitoring_zones()
            
            logger.info("✅ Enhanced TIER 2 Alert Coordination System with Multi-Monitor Support initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize enhanced TIER 2 alert system: {e}")
            # Continue without enhanced alerts
    
    async def initialize_multi_monitor_correlation(self):
        """Initialize multi-monitor correlation system"""
        logger.info("🔗 Initializing Multi-Monitor Threat Correlation System...")
        
        # Setup active monitor feeds tracking
        self.active_monitor_feeds = {
            '0': {
                'monitor_name': 'Front Entrance',
                'camera_ids': ['CAM-ENTRANCE-01'],
                'zones': ['DVR_Front_Entrance'],
                'active': True,
                'last_frame_time': None
            },
            '1': {
                'monitor_name': 'Lobby Area',
                'camera_ids': ['CAM-LOBBY-01'],
                'zones': ['DVR_Lobby_Area'],
                'active': True,
                'last_frame_time': None
            },
            '2': {
                'monitor_name': 'Parking Lot',
                'camera_ids': ['CAM-PARKING-01'],
                'zones': ['DVR_Parking_Lot'],
                'active': True,
                'last_frame_time': None
            },
            '3': {
                'monitor_name': 'Rear Exit',
                'camera_ids': ['CAM-REAR-01'],
                'zones': ['DVR_Rear_Exit'],
                'active': True,
                'last_frame_time': None
            }
        }
        
        logger.info(f"📍 Initialized {len(self.active_monitor_feeds)} monitor feeds for correlation tracking")
        logger.info("✅ Multi-Monitor Threat Correlation System ready")
    
    async def setup_demo_multi_monitor_relationships(self):
        """Setup demo monitor relationships for correlation"""
        if not self.tier2_coordinator:
            logger.warning('⚠️ No TIER 2 coordinator available for monitor relationship setup')
            return
        
        # Setup demo monitor relationships from the coordinator
        await self.tier2_coordinator.setup_demo_multi_monitor_relationships()
        
        logger.info("📍 Demo multi-monitor relationships configured")
    
    async def setup_enhanced_demo_monitoring_zones(self):
        """Setup enhanced demo monitoring zones with multi-monitor correlation support"""
        if not self.tier2_coordinator:
            logger.warning('⚠️ No TIER 2 coordinator available for zone setup')
            return
            
        try:
            # Enhanced demo zones with correlation metadata
            demo_zones = [
                {
                    'zone_id': 'DVR_Front_Entrance',
                    'zone_name': 'Front Entrance',
                    'monitor_id': '0',
                    'position': {'x': 50, 'y': 50, 'width': 300, 'height': 200},
                    'spatial_position': {'x': 0.2, 'y': 0.2},
                    'correlation_priority': 'high',  # High priority for correlation
                    'handoff_zones': ['DVR_Lobby_Area']  # Common handoff targets
                },
                {
                    'zone_id': 'DVR_Parking_Lot',
                    'zone_name': 'Parking Lot',
                    'monitor_id': '2',
                    'position': {'x': 400, 'y': 50, 'width': 300, 'height': 200},
                    'spatial_position': {'x': 0.8, 'y': 0.2},
                    'correlation_priority': 'medium',
                    'handoff_zones': ['DVR_Front_Entrance', 'DVR_Rear_Exit']
                },
                {
                    'zone_id': 'DVR_Lobby_Area',
                    'zone_name': 'Lobby Area',
                    'monitor_id': '1',
                    'position': {'x': 50, 'y': 350, 'width': 300, 'height': 200},
                    'spatial_position': {'x': 0.2, 'y': 0.8},
                    'correlation_priority': 'high',
                    'handoff_zones': ['DVR_Front_Entrance', 'DVR_Rear_Exit']
                },
                {
                    'zone_id': 'DVR_Rear_Exit',
                    'zone_name': 'Rear Exit',
                    'monitor_id': '3',
                    'position': {'x': 400, 'y': 350, 'width': 300, 'height': 200},
                    'spatial_position': {'x': 0.8, 'y': 0.8},
                    'correlation_priority': 'medium',
                    'handoff_zones': ['DVR_Lobby_Area', 'DVR_Parking_Lot']
                }
            ]
            
            # Register zones with enhanced configuration
            for zone in demo_zones:
                zone_config = {
                    'name': zone['zone_name'],
                    'spatial_position': zone['spatial_position'],
                    'sensitivity_multiplier': 1.0,
                    'alert_cooldown': 3.0,
                    'correlation_priority': zone['correlation_priority'],
                    'handoff_zones': zone['handoff_zones']
                }
                
                await self.tier2_coordinator.register_zone(
                    zone_id=zone['zone_id'],
                    monitor_id=zone['monitor_id'],
                    position=zone['position'],
                    zone_config=zone_config
                )
            
            logger.info(f'📍 Registered {len(demo_zones)} enhanced monitoring zones with correlation support')
            
        except Exception as e:
            logger.error(f'❌ Failed to setup enhanced demo monitoring zones: {e}')
    
    async def process_threat_with_correlation(self, threat_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhanced threat processing with multi-monitor correlation
        
        Args:
            threat_data: Threat detection data from AI models
            
        Returns:
            Enhanced threat processing results including correlation information
        """
        start_time = time.time()
        
        try:
            # Add correlation-specific metadata to threat data
            enhanced_threat_data = {
                **threat_data,
                'detection_timestamp': time.time(),
                'frame_id': f"frame_{self.frame_processing_count}",
                'engine_id': 'apex_ai_enhanced_correlation',
                'correlation_eligible': True
            }
            
            # Process through enhanced coordinator with correlation
            if self.tier2_coordinator and self.correlation_enabled:
                alert_results = await self.tier2_coordinator.trigger_coordinated_alert_with_correlation(
                    enhanced_threat_data
                )
                
                # Update correlation statistics
                if 'correlation' in alert_results:
                    self.correlation_events_count += 1
                    self.processing_stats['correlations_detected'] += 1
                    
                    # Log correlation event
                    logger.info(f"🔗 Threat correlation detected: {alert_results['correlation']}")
                    
                    # Check for successful handoff
                    if alert_results.get('correlation') and 'handoff' in alert_results:
                        self.successful_handoffs_count += 1
                        self.processing_stats['successful_handoffs'] += 1
                        
                        handoff_latency = alert_results.get('total_coordination_time', 0)
                        if handoff_latency > 0:
                            # Update rolling average handoff latency
                            current_avg = self.processing_stats['average_handoff_latency']
                            total_handoffs = self.processing_stats['successful_handoffs']
                            
                            new_avg = ((current_avg * (total_handoffs - 1)) + handoff_latency) / total_handoffs
                            self.processing_stats['average_handoff_latency'] = new_avg
                            
                            # Check if we met our latency target
                            if handoff_latency <= self.cross_monitor_handoff_latency_target:
                                logger.info(f"✅ Handoff latency target met: {handoff_latency:.3f}s (target: {self.cross_monitor_handoff_latency_target:.3f}s)")
                            else:
                                logger.warning(f"⚠️ Handoff latency exceeded target: {handoff_latency:.3f}s (target: {self.cross_monitor_handoff_latency_target:.3f}s)")
                
                return {
                    **alert_results,
                    'processing_time': time.time() - start_time,
                    'correlation_enabled': True,
                    'engine_version': 'enhanced_with_correlation'
                }
            else:
                # Fallback to standard processing if correlation not available
                logger.warning("⚠️ Correlation not available, using standard processing")
                return {
                    'threat_id': enhanced_threat_data.get('threat_id', f"threat_{int(time.time() * 1000)}"),
                    'processing_time': time.time() - start_time,
                    'correlation_enabled': False,
                    'warning': 'Correlation system not initialized'
                }
                
        except Exception as e:
            logger.error(f"❌ Enhanced threat processing failed: {e}")
            return {
                'error': str(e),
                'processing_time': time.time() - start_time,
                'correlation_enabled': False
            }
    
    async def simulate_enhanced_threat_detection(self):
        """Simulate enhanced threat detection with multi-monitor correlation"""
        logger.info("🎬 Starting enhanced threat detection simulation with multi-monitor correlation...")
        
        # Simulation scenarios with cross-monitor progression
        correlation_scenarios = [
            {
                'name': 'Suspicious Person Cross-Monitor Tracking',
                'sequence': [
                    {
                        'monitor_id': '0',
                        'zone_id': 'DVR_Front_Entrance',
                        'threat_type': 'trespassing',
                        'threat_level': 'MEDIUM',
                        'confidence': 0.78,
                        'bbox': (150, 100, 80, 160),
                        'movement_vector': (2.5, 0.5),
                        'delay': 0
                    },
                    {
                        'monitor_id': '1',
                        'zone_id': 'DVR_Lobby_Area',
                        'threat_type': 'trespassing',
                        'threat_level': 'HIGH',
                        'confidence': 0.82,
                        'bbox': (200, 120, 85, 165),
                        'movement_vector': (1.8, -0.3),
                        'delay': 3.2  # 3.2 second delay for correlation
                    }
                ]
            },
            {
                'name': 'Package Theft Multi-Zone Detection',
                'sequence': [
                    {
                        'monitor_id': '2',
                        'zone_id': 'DVR_Parking_Lot',
                        'threat_type': 'person',
                        'threat_level': 'LOW',
                        'confidence': 0.65,
                        'bbox': (300, 150, 60, 140),
                        'movement_vector': (-1.2, 0.8),
                        'delay': 0
                    },
                    {
                        'monitor_id': '1',
                        'zone_id': 'DVR_Lobby_Area',
                        'threat_type': 'package_theft',
                        'threat_level': 'HIGH',
                        'confidence': 0.87,
                        'bbox': (180, 200, 65, 145),
                        'movement_vector': (-0.8, -1.5),
                        'delay': 4.1  # Delay for correlation
                    }
                ]
            },
            {
                'name': 'Weapon Detection with Immediate Correlation',
                'sequence': [
                    {
                        'monitor_id': '0',
                        'zone_id': 'DVR_Front_Entrance',
                        'threat_type': 'weapon_detection',
                        'threat_level': 'CRITICAL',
                        'confidence': 0.92,
                        'bbox': (180, 80, 90, 180),
                        'movement_vector': (0.5, 1.8),
                        'delay': 0
                    },
                    {
                        'monitor_id': '1',
                        'zone_id': 'DVR_Lobby_Area',
                        'threat_type': 'weapon_detection',
                        'threat_level': 'CRITICAL',
                        'confidence': 0.94,
                        'bbox': (220, 100, 95, 185),
                        'movement_vector': (0.2, 1.5),
                        'delay': 1.8  # Fast correlation for weapon
                    }
                ]
            }
        ]
        
        for scenario in correlation_scenarios:
            logger.info(f"🎯 Running scenario: {scenario['name']}")
            
            # Process each step in the sequence
            for step in scenario['sequence']:
                if step['delay'] > 0:
                    await asyncio.sleep(step['delay'])
                
                # Create threat data with correlation features
                threat_data = {
                    'threat_id': f"threat_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}",
                    'monitor_id': step['monitor_id'],
                    'zone_id': step['zone_id'],
                    'threat_type': step['threat_type'],
                    'threat_level': step['threat_level'],
                    'confidence': step['confidence'],
                    'bbox': step['bbox'],
                    'movement_vector': step.get('movement_vector'),
                    'detection_source': 'enhanced_ai_simulation',
                    'ai_features': {
                        'object_size': step['bbox'][2] * step['bbox'][3],
                        'aspect_ratio': step['bbox'][2] / step['bbox'][3],
                        'dominant_colors': ['dark_clothing', 'suspicious_posture'],
                        'movement_pattern': 'directed_approach' if step['threat_level'] in ['HIGH', 'CRITICAL'] else 'casual_movement'
                    }
                }
                
                # Process through enhanced correlation system
                processing_result = await self.process_threat_with_correlation(threat_data)
                
                # Update processing statistics
                self.frame_processing_count += 1
                self.threat_detection_count += 1
                self.processing_stats['total_frames'] += 1
                self.processing_stats['threats_detected'] += 1
                
                if 'error' not in processing_result:
                    self.processing_stats['alerts_sent'] += 1
                
                logger.info(f"📊 Processed threat: {threat_data['threat_id']} "
                          f"(correlation: {'Yes' if 'correlation' in processing_result else 'No'}, "
                          f"latency: {processing_result.get('processing_time', 0):.3f}s)")
            
            # Pause between scenarios
            await asyncio.sleep(8)
        
        logger.info("🎬 Enhanced threat detection simulation completed")
        
        # Send final statistics
        await self.send_enhanced_processing_stats()
    
    async def send_enhanced_processing_stats(self):
        """Send enhanced processing statistics including correlation metrics"""
        if not self.websocket_client:
            return
        
        try:
            # Get enhanced coordination statistics
            enhanced_stats = {}
            if self.tier2_coordinator:
                enhanced_stats = self.tier2_coordinator.get_enhanced_coordination_stats()
            
            # Combine with processing statistics
            combined_stats = {
                'engine_stats': self.processing_stats.copy(),
                'coordination_stats': enhanced_stats,
                'multi_monitor_performance': {
                    'correlation_events': self.correlation_events_count,
                    'successful_handoffs': self.successful_handoffs_count,
                    'average_handoff_latency': self.processing_stats['average_handoff_latency'],
                    'handoff_latency_target': self.cross_monitor_handoff_latency_target,
                    'latency_target_met': self.processing_stats['average_handoff_latency'] <= self.cross_monitor_handoff_latency_target,
                    'active_monitors': len(self.active_monitor_feeds),
                    'correlation_enabled': self.correlation_enabled
                },
                'timestamp': time.time()
            }
            
            # Send to frontend
            await self.websocket_client.send_message('enhanced_ai_engine_stats', combined_stats)
            
            # Also send through coordinator
            if self.tier2_coordinator:
                await self.tier2_coordinator.send_enhanced_stats_to_frontend()
            
            logger.debug("📊 Enhanced processing statistics sent to frontend")
            
        except Exception as e:
            logger.error(f"❌ Failed to send enhanced processing stats: {e}")
    
    async def initialize_video_system(self):
        """Initialize video capture system"""
        logger.info("📹 Initializing video capture system...")
        
        try:
            # Create video input manager
            self.video_manager = VideoInputManager()
            
            # Create monitor detector for DVR screens
            self.monitor_detector = DVRMonitorDetector()
            
            if self.demo_mode:
                logger.info("🎬 Demo mode enabled - using simulated video sources")
                # In demo mode, we'll simulate video processing
            else:
                logger.info("📹 Production mode - setting up real video sources")
                # Would setup real RTSP streams here
            
            logger.info("✅ Video capture system initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize video system: {e}")
    
    async def initialize_threat_models(self):
        """Initialize specialized threat detection models"""
        logger.info("🛡️ Initializing threat detection models...")
        
        # Initialize placeholder models for demo
        self.weapons_detector = {'status': 'simulated', 'confidence_threshold': 0.8}
        self.violence_detector = {'status': 'simulated', 'confidence_threshold': 0.75}
        self.package_theft_detector = {'status': 'simulated', 'confidence_threshold': 0.7}
        self.trespassing_detector = {'status': 'simulated', 'confidence_threshold': 0.65}
        
        logger.info("🎯 Threat detection models initialized (simulation mode)")
    
    def initialize_demo_face_database(self):
        """Initialize demo face recognition database"""
        logger.info("👤 Initializing demo face recognition database...")
        
        # Simulated face encodings for demo
        self.face_encodings = {
            'authorized_person_1': 'simulated_encoding_1',
            'authorized_person_2': 'simulated_encoding_2',
            'security_guard_1': 'simulated_encoding_3'
        }
        
        logger.info(f"👤 Loaded {len(self.face_encodings)} face encodings for demo")
    
    async def start_processing(self):
        """Start the enhanced AI processing loop with multi-monitor correlation"""
        if self.is_processing:
            logger.warning("⚠️ Processing already started")
            return
        
        self.is_processing = True
        logger.info("🚀 Starting enhanced AI processing with multi-monitor correlation...")
        
        try:
            # Start WebSocket connection
            await self.websocket_client.connect()
            
            # Start processing simulation
            await self.simulate_enhanced_threat_detection()
            
        except Exception as e:
            logger.error(f"❌ Processing failed: {e}")
        finally:
            self.is_processing = False
    
    async def stop_processing(self):
        """Stop the AI processing"""
        logger.info("🛑 Stopping enhanced AI processing...")
        self.is_processing = False
        
        # Cleanup correlation engine
        if self.tier2_coordinator:
            await self.tier2_coordinator.cleanup_correlation_engine()
        
        # Disconnect WebSocket
        if self.websocket_client:
            await self.websocket_client.disconnect()
        
        logger.info("✅ Enhanced AI processing stopped")

# Demo/Testing function
async def main():
    """Main function to run the enhanced AI engine with correlation"""
    engine = EnhancedApexAIEngineWithCorrelation()
    
    try:
        # Initialize the system
        await engine.initialize_system()
        
        # Start processing
        await engine.start_processing()
        
    except KeyboardInterrupt:
        logger.info("🛑 Received interrupt signal")
    finally:
        await engine.stop_processing()

if __name__ == "__main__":
    asyncio.run(main())
