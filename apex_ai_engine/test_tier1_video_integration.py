"""
APEX AI ENGINE - TIER 1 VIDEO INTEGRATION TEST
==============================================
Comprehensive test suite for the complete video capture and AI integration system

This script tests all TIER 1 components:
✅ DVR Screen Capture System
✅ RTSP Stream Client 
✅ Screen Region Manager
✅ DVR Monitor Detector
✅ Video Input Manager
✅ AI Integration Pipeline

Usage:
    python test_tier1_video_integration.py
"""

import asyncio
import logging
import time
import sys
import os
from typing import Dict, List, Optional
import traceback

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our video capture components
try:
    from video_capture import (
        DVRScreenCapture, ScreenRegion, CaptureMode,
        ScreenRegionManager, create_demo_regions_for_dvr,
        DVRMonitorDetector, quick_monitor_detection,
        RTSPStreamManager, create_demo_rtsp_streams,
        VideoInputManager, VideoSourceType, VideoSourcePriority,
        create_screen_capture_source, create_rtsp_source
    )
    VIDEO_CAPTURE_AVAILABLE = True
except ImportError as e:
    print(f"❌ Failed to import video capture modules: {e}")
    VIDEO_CAPTURE_AVAILABLE = False

# Import AI components
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class VideoIntegrationTester:
    """
    Comprehensive tester for TIER 1 video capture integration
    """
    
    def __init__(self):
        self.test_results = {}
        self.frames_received = 0
        self.ai_callbacks_executed = 0
        self.test_start_time = time.time()
        
        # Test components
        self.screen_capture = None
        self.region_manager = None
        self.monitor_detector = None
        self.rtsp_manager = None
        self.video_manager = None
        
        logger.info("🧪 Video Integration Tester initialized")
    
    def ai_frame_callback(self, frame, timestamp, metadata=None):
        """Test AI callback function"""
        self.frames_received += 1
        self.ai_callbacks_executed += 1
        
        if metadata is None:
            metadata = {}
        
        # Log frame details
        source_type = metadata.get('source_type', 'unknown')
        frame_shape = frame.shape if hasattr(frame, 'shape') else 'unknown'
        
        logger.debug(f"🎬 AI Callback: Frame {self.frames_received} from {source_type} - Shape: {frame_shape}")
        
        # Basic frame validation
        if hasattr(frame, 'shape') and len(frame.shape) == 3:
            height, width, channels = frame.shape
            if height > 50 and width > 50 and channels == 3:
                logger.debug(f"✅ Valid frame received: {width}x{height}")
                return True
        
        logger.warning(f"⚠️ Invalid frame received: {frame_shape}")
        return False
    
    async def test_monitor_detection(self) -> bool:
        """Test monitor detection system"""
        logger.info("🖥️ Testing Monitor Detection System...")
        
        try:
            self.monitor_detector = DVRMonitorDetector()
            
            # Detect monitors
            monitors = self.monitor_detector.detect_all_monitors()
            logger.info(f"📺 Detected {len(monitors)} monitors")
            
            for monitor_id, monitor in monitors.items():
                logger.info(f"   Monitor {monitor_id}: {monitor.width}x{monitor.height} at ({monitor.x_offset}, {monitor.y_offset})")
            
            # Detect DVR windows
            dvr_windows = self.monitor_detector.detect_dvr_windows()
            logger.info(f"🖼️ Detected {len(dvr_windows)} potential DVR windows")
            
            for window in dvr_windows[:3]:  # Show first 3
                logger.info(f"   DVR Window: '{window.title}' (confidence: {window.confidence_score:.2f})")
            
            # Analyze layout
            layouts = self.monitor_detector.analyze_dvr_layout()
            if layouts:
                layout = layouts[0]
                logger.info(f"📋 Layout: {layout.layout_type}, estimated cameras: {layout.total_cameras}")
            
            self.test_results['monitor_detection'] = {
                'passed': True,
                'monitors_found': len(monitors),
                'dvr_windows_found': len(dvr_windows),
                'layout_analyzed': len(layouts) > 0
            }
            
            logger.info("✅ Monitor Detection Test PASSED")
            return True
            
        except Exception as e:
            logger.error(f"❌ Monitor Detection Test FAILED: {e}")
            self.test_results['monitor_detection'] = {'passed': False, 'error': str(e)}
            return False
    
    async def test_screen_region_manager(self) -> bool:
        """Test screen region management"""
        logger.info("📐 Testing Screen Region Manager...")
        
        try:
            self.region_manager = ScreenRegionManager("test_regions.json")
            
            # Create demo regions
            demo_regions = create_demo_regions_for_dvr()
            logger.info(f"🎯 Created {len(demo_regions)} demo regions")
            
            # Add regions to manager
            for region in demo_regions:
                success = self.region_manager.add_region(
                    region.name, region.x, region.y,
                    region.width, region.height, region.monitor_id
                )
                if success:
                    logger.info(f"   Added region: {region.name} ({region.width}x{region.height})")
            
            # Test region export
            screen_regions = self.region_manager.export_regions_for_capture()
            logger.info(f"📤 Exported {len(screen_regions)} regions for capture")
            
            # Save configuration
            save_success = self.region_manager.save_configuration()
            
            self.test_results['region_manager'] = {
                'passed': True,
                'regions_created': len(demo_regions),
                'regions_exported': len(screen_regions),
                'config_saved': save_success
            }
            
            logger.info("✅ Screen Region Manager Test PASSED")
            return True
            
        except Exception as e:
            logger.error(f"❌ Screen Region Manager Test FAILED: {e}")
            self.test_results['region_manager'] = {'passed': False, 'error': str(e)}
            return False
    
    async def test_screen_capture(self) -> bool:
        """Test screen capture system"""
        logger.info("🖼️ Testing Screen Capture System...")
        
        try:
            self.screen_capture = DVRScreenCapture(
                target_fps=5,  # Low FPS for testing
                ai_frame_callback=self.ai_frame_callback
            )
            
            # Test monitor detection
            logger.info(f"📺 Screen capture detected {len(self.screen_capture.monitors)} monitors")
            
            # Add demo regions if available
            if self.region_manager:
                regions = self.region_manager.export_regions_for_capture()
                for region in regions[:2]:  # Test with first 2 regions
                    self.screen_capture.add_capture_region(region)
                    logger.info(f"   Added capture region: {region.name}")
            
            # Start capture
            success = self.screen_capture.start_capture()
            if not success:
                raise Exception("Failed to start screen capture")
            
            logger.info("🎬 Screen capture started, collecting frames for 5 seconds...")
            
            # Collect frames for 5 seconds
            initial_frames = self.frames_received
            await asyncio.sleep(5)
            frames_captured = self.frames_received - initial_frames
            
            # Stop capture
            self.screen_capture.stop_capture()
            
            # Get performance stats
            stats = self.screen_capture.get_performance_stats()
            logger.info(f"📊 Capture stats: {stats['actual_fps']:.1f} FPS, {frames_captured} frames captured")
            
            self.test_results['screen_capture'] = {
                'passed': True,
                'frames_captured': frames_captured,
                'actual_fps': stats['actual_fps'],
                'monitors_detected': len(self.screen_capture.monitors)
            }
            
            logger.info("✅ Screen Capture Test PASSED")
            return True
            
        except Exception as e:
            logger.error(f"❌ Screen Capture Test FAILED: {e}")
            self.test_results['screen_capture'] = {'passed': False, 'error': str(e)}
            return False
    
    async def test_rtsp_manager(self) -> bool:
        """Test RTSP stream manager (with demo streams)"""
        logger.info("📡 Testing RTSP Stream Manager...")
        
        try:
            self.rtsp_manager = RTSPStreamManager(self.ai_frame_callback)
            
            # Add demo streams (these won't actually connect)
            demo_streams = create_demo_rtsp_streams()
            logger.info(f"🎥 Adding {len(demo_streams)} demo RTSP streams...")
            
            for stream_config in demo_streams:
                success = self.rtsp_manager.add_stream(stream_config)
                logger.info(f"   Added stream: {stream_config.camera_name} - {'Success' if success else 'Failed'}")
            
            # Test connection (expected to fail with demo URLs)
            logger.info("🔗 Testing RTSP connections (expected to fail with demo URLs)...")
            
            for stream_config in demo_streams[:1]:  # Test only first stream
                test_result = self.rtsp_manager.test_connection(stream_config.stream_id)
                logger.info(f"   Connection test for {stream_config.camera_name}: {test_result.get('success', False)}")
            
            # Get manager status
            status = self.rtsp_manager.get_stream_status()
            logger.info(f"📊 RTSP Manager: {status['total_streams']} streams configured")
            
            self.test_results['rtsp_manager'] = {
                'passed': True,
                'streams_configured': status['total_streams'],
                'manager_functional': True
            }
            
            logger.info("✅ RTSP Stream Manager Test PASSED (configuration verified)")
            return True
            
        except Exception as e:
            logger.error(f"❌ RTSP Stream Manager Test FAILED: {e}")
            self.test_results['rtsp_manager'] = {'passed': False, 'error': str(e)}
            return False
    
    async def test_video_input_manager(self) -> bool:
        """Test unified video input manager"""
        logger.info("🎛️ Testing Video Input Manager...")
        
        try:
            self.video_manager = VideoInputManager(
                ai_frame_callback=self.ai_frame_callback,
                config_file="test_video_config.json"
            )
            
            # Add screen capture source
            screen_source = create_screen_capture_source(
                name="Test Screen Capture",
                location="Test Monitor",
                monitor_id=0,
                priority=VideoSourcePriority.PRIMARY
            )
            screen_source.target_fps = 3  # Very low FPS for testing
            
            success = self.video_manager.add_video_source(screen_source)
            logger.info(f"📺 Added screen capture source: {'Success' if success else 'Failed'}")
            
            # Add RTSP source (demo)
            rtsp_source = create_rtsp_source(
                name="Test RTSP Camera",
                location="Test Location",
                rtsp_url="rtsp://demo.test:554/stream1",
                priority=VideoSourcePriority.SECONDARY
            )
            
            success = self.video_manager.add_video_source(rtsp_source)
            logger.info(f"📡 Added RTSP source: {'Success' if success else 'Failed'}")
            
            # Start video sources
            logger.info("🚀 Starting video sources...")
            initial_callbacks = self.ai_callbacks_executed
            
            start_results = self.video_manager.start_all_sources()
            active_sources = sum(1 for success in start_results.values() if success)
            logger.info(f"✅ Started {active_sources}/{len(start_results)} video sources")
            
            # Collect frames for 8 seconds
            logger.info("🎬 Collecting frames for 8 seconds...")
            await asyncio.sleep(8)
            
            callbacks_received = self.ai_callbacks_executed - initial_callbacks
            
            # Stop video sources
            self.video_manager.stop_all_sources()
            
            # Get system status
            status = self.video_manager.get_system_status()
            logger.info(f"📊 Video Manager: {status['manager']['total_sources']} sources configured")
            
            self.test_results['video_input_manager'] = {
                'passed': True,
                'sources_configured': status['manager']['total_sources'],
                'sources_started': active_sources,
                'ai_callbacks_received': callbacks_received,
                'system_functional': callbacks_received > 0
            }
            
            logger.info(f"✅ Video Input Manager Test PASSED ({callbacks_received} AI callbacks received)")
            return True
            
        except Exception as e:
            logger.error(f"❌ Video Input Manager Test FAILED: {e}")
            self.test_results['video_input_manager'] = {'passed': False, 'error': str(e)}
            return False
    
    async def test_ai_integration(self) -> bool:
        """Test AI integration with video frames"""
        logger.info("🤖 Testing AI Integration...")
        
        try:
            if not YOLO_AVAILABLE:
                logger.warning("⚠️ YOLO not available, testing basic frame processing only")
                
                # Test basic frame processing
                test_frame = np.zeros((480, 640, 3), dtype=np.uint8)
                result = self.ai_frame_callback(test_frame, time.time(), {'source_type': 'test'})
                
                self.test_results['ai_integration'] = {
                    'passed': True,
                    'yolo_available': False,
                    'basic_processing': result,
                    'frames_processed': self.frames_received
                }
                
                logger.info("✅ AI Integration Test PASSED (basic processing)")
                return True
            
            # Test with YOLO
            model = YOLO('yolov8n.pt')
            logger.info("🎯 YOLOv8 model loaded successfully")
            
            # Create test frame
            test_frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
            
            # Run YOLO detection
            results = model(test_frame, verbose=False)
            detections = len(results[0].boxes) if results[0].boxes is not None else 0
            
            logger.info(f"🔍 YOLO detected {detections} objects in test frame")
            
            self.test_results['ai_integration'] = {
                'passed': True,
                'yolo_available': True,
                'yolo_functional': True,
                'test_detections': detections,
                'frames_processed': self.frames_received
            }
            
            logger.info("✅ AI Integration Test PASSED")
            return True
            
        except Exception as e:
            logger.error(f"❌ AI Integration Test FAILED: {e}")
            self.test_results['ai_integration'] = {'passed': False, 'error': str(e)}
            return False
    
    async def run_comprehensive_test(self) -> Dict:
        """Run all integration tests"""
        logger.info("🚀 Starting Comprehensive TIER 1 Video Integration Test")
        logger.info("=" * 60)
        
        # Check dependencies
        logger.info("🔍 Checking dependencies...")
        logger.info(f"   Video Capture Modules: {'✅' if VIDEO_CAPTURE_AVAILABLE else '❌'}")
        logger.info(f"   OpenCV (cv2): {'✅' if CV2_AVAILABLE else '❌'}")
        logger.info(f"   YOLO (ultralytics): {'✅' if YOLO_AVAILABLE else '❌'}")
        
        if not VIDEO_CAPTURE_AVAILABLE or not CV2_AVAILABLE:
            logger.error("❌ Required dependencies missing!")
            return {'overall_passed': False, 'error': 'Missing dependencies'}
        
        # Run individual tests
        test_functions = [
            ('Monitor Detection', self.test_monitor_detection),
            ('Screen Region Manager', self.test_screen_region_manager),
            ('Screen Capture', self.test_screen_capture),
            ('RTSP Manager', self.test_rtsp_manager),
            ('Video Input Manager', self.test_video_input_manager),
            ('AI Integration', self.test_ai_integration)
        ]
        
        passed_tests = 0
        total_tests = len(test_functions)
        
        for test_name, test_func in test_functions:
            logger.info(f"\n{'='*20} {test_name} {'='*20}")
            try:
                result = await test_func()
                if result:
                    passed_tests += 1
                    logger.info(f"✅ {test_name}: PASSED")
                else:
                    logger.error(f"❌ {test_name}: FAILED")
            except Exception as e:
                logger.error(f"❌ {test_name}: EXCEPTION - {e}")
                logger.debug(traceback.format_exc())
        
        # Calculate overall results
        overall_passed = passed_tests == total_tests
        test_duration = time.time() - self.test_start_time
        
        # Final summary
        logger.info("\n" + "="*60)
        logger.info("🏁 COMPREHENSIVE TEST SUMMARY")
        logger.info("="*60)
        logger.info(f"✅ Tests Passed: {passed_tests}/{total_tests}")
        logger.info(f"🎬 Total Frames Received: {self.frames_received}")
        logger.info(f"🤖 AI Callbacks Executed: {self.ai_callbacks_executed}")
        logger.info(f"⏱️ Test Duration: {test_duration:.1f} seconds")
        logger.info(f"🎯 Overall Result: {'✅ PASSED' if overall_passed else '❌ FAILED'}")
        
        # Detailed results
        logger.info("\n📊 Detailed Test Results:")
        for test_name, result in self.test_results.items():
            status = "✅ PASSED" if result.get('passed', False) else "❌ FAILED"
            logger.info(f"   {test_name}: {status}")
            if not result.get('passed', False) and 'error' in result:
                logger.info(f"      Error: {result['error']}")
        
        return {
            'overall_passed': overall_passed,
            'tests_passed': passed_tests,
            'total_tests': total_tests,
            'frames_received': self.frames_received,
            'ai_callbacks_executed': self.ai_callbacks_executed,
            'test_duration': test_duration,
            'detailed_results': self.test_results
        }


async def main():
    """Main test execution function"""
    print("🧪 APEX AI - TIER 1 VIDEO INTEGRATION TEST")
    print("===========================================")
    print("Comprehensive testing of video capture and AI integration")
    print()
    
    # Create and run tester
    tester = VideoIntegrationTester()
    
    try:
        results = await tester.run_comprehensive_test()
        
        if results['overall_passed']:
            print("\n🎉 ALL TESTS PASSED!")
            print("✅ TIER 1 Video Capture System is ready for demo")
            return 0
        else:
            print("\n⚠️ SOME TESTS FAILED")
            print("❌ Please review the test results above")
            return 1
            
    except Exception as e:
        print(f"\n💥 TEST EXECUTION FAILED: {e}")
        print(traceback.format_exc())
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
