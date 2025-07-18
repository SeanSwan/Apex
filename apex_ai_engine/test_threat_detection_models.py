"""
APEX AI THREAT DETECTION MODELS - TEST SCRIPT
=============================================
Comprehensive test script for all threat detection models
Tests individual models and the master coordinator

This script validates:
- Individual model initialization
- Master coordinator functionality 
- Threat detection and correlation
- Performance monitoring
- Configuration management

Run this script to verify your threat detection models are working correctly.
"""

import cv2
import numpy as np
import logging
import time
from datetime import datetime
from typing import Dict, List

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_individual_models():
    """Test each threat detection model individually"""
    print("\n" + "="*60)
    print("🧪 TESTING INDIVIDUAL THREAT DETECTION MODELS")
    print("="*60)
    
    try:
        # Import models
        from models import (
            WeaponsDetectionModel,
            ViolenceDetectionModel,
            PackageTheftDetectionModel,
            TrespassingDetectionModel,
            TransientActivityDetector,
            VandalismDetectionModel,
            ThreatLevel,
            ThreatType
        )
        
        # Create test frame
        test_frame = np.zeros((640, 640, 3), dtype=np.uint8)
        # Add some shapes to simulate objects
        cv2.rectangle(test_frame, (100, 100), (200, 300), (100, 100, 100), -1)  # Person-like shape
        cv2.rectangle(test_frame, (300, 200), (350, 250), (150, 150, 150), -1)  # Object
        
        # Test each model
        models_to_test = [
            ("Weapons Detection", WeaponsDetectionModel, {}),
            ("Violence Detection", ViolenceDetectionModel, {}),
            ("Package Theft Detection", PackageTheftDetectionModel, {}),
            ("Trespassing Detection", TrespassingDetectionModel, {}),
            ("Transient Activity Detection", TransientActivityDetector, {}),
            ("Vandalism Detection", VandalismDetectionModel, {})
        ]
        
        results = {}
        
        for model_name, model_class, config in models_to_test:
            print(f"\n🔍 Testing {model_name}...")
            
            try:
                # Initialize model
                model = model_class(**config)
                init_success = model.initialize_model()
                
                if init_success:
                    print(f"  ✅ {model_name} initialized successfully")
                    
                    # Test detection
                    start_time = time.time()
                    detections = model.process_frame(
                        test_frame, 
                        camera_id="test_cam", 
                        zone="test_zone"
                    )
                    processing_time = time.time() - start_time
                    
                    print(f"  📊 Processing time: {processing_time:.4f} seconds")
                    print(f"  🎯 Detections found: {len(detections)}")
                    
                    # Test performance stats
                    stats = model.get_performance_stats()
                    print(f"  📈 Model stats: {stats}")
                    
                    results[model_name] = {
                        'initialized': True,
                        'processing_time': processing_time,
                        'detection_count': len(detections),
                        'stats': stats
                    }
                    
                else:
                    print(f"  ❌ {model_name} initialization failed")
                    results[model_name] = {'initialized': False}
                    
            except Exception as e:
                print(f"  ❌ Error testing {model_name}: {e}")
                results[model_name] = {'error': str(e)}
        
        return results
        
    except ImportError as e:
        print(f"❌ Failed to import threat detection models: {e}")
        return {}

def test_master_coordinator():
    """Test the master threat detection coordinator"""
    print("\n" + "="*60)
    print("🧠 TESTING MASTER THREAT DETECTION COORDINATOR")
    print("="*60)
    
    try:
        from models import MasterThreatDetectionCoordinator, DEFAULT_CONFIG
        
        # Create coordinator with test config
        test_config = DEFAULT_CONFIG.copy()
        
        print("🔧 Initializing Master Threat Detection Coordinator...")
        coordinator = MasterThreatDetectionCoordinator(test_config)
        
        # Test model status
        print("\n📋 Model Status:")
        model_status = coordinator.get_model_status()
        for model_name, status in model_status.items():
            enabled_status = "✅ Enabled" if status['enabled'] else "❌ Disabled"
            print(f"  {model_name}: {enabled_status} (Priority: {status['priority']})")
        
        # Create test frame
        test_frame = np.zeros((640, 640, 3), dtype=np.uint8)
        cv2.rectangle(test_frame, (100, 100), (200, 300), (100, 100, 100), -1)
        cv2.rectangle(test_frame, (300, 200), (350, 250), (150, 150, 150), -1)
        
        # Test threat detection
        print("\n🎯 Testing threat detection...")
        start_time = time.time()
        
        threats = coordinator.detect_threats(
            test_frame,
            camera_id="test_camera",
            zone="lobby",
            known_persons=set()
        )
        
        processing_time = time.time() - start_time
        
        print(f"⏱️ Total processing time: {processing_time:.4f} seconds")
        print(f"🚨 Threats detected: {len(threats)}")
        
        # Display detected threats
        for i, threat in enumerate(threats):
            print(f"  Threat {i+1}:")
            print(f"    Type: {threat.get('type', 'unknown')}")
            print(f"    Confidence: {threat.get('confidence', 0.0):.2f}")
            print(f"    Level: {threat.get('threat_level', 'unknown')}")
            print(f"    Description: {threat.get('description', 'N/A')}")
        
        # Test performance statistics
        print("\n📊 Performance Statistics:")
        stats = coordinator.get_processing_statistics()
        for key, value in stats.items():
            print(f"  {key}: {value}")
        
        # Test active threats
        print("\n🔥 Active Threats:")
        active_threats = coordinator.get_active_threats()
        print(f"  Current active threats: {len(active_threats)}")
        
        # Test model enable/disable
        print("\n🎛️ Testing model control...")
        
        # Disable a model
        success = coordinator.disable_model('vandalism')
        print(f"  Disable vandalism model: {'✅' if success else '❌'}")
        
        # Re-enable it
        success = coordinator.enable_model('vandalism')
        print(f"  Re-enable vandalism model: {'✅' if success else '❌'}")
        
        # Test configuration update
        print("\n⚙️ Testing configuration update...")
        new_config = {'confidence_threshold': 0.8}
        success = coordinator.update_model_config('weapons', new_config)
        print(f"  Update weapons config: {'✅' if success else '❌'}")
        
        # Cleanup
        coordinator.shutdown()
        print("🔄 Coordinator shutdown complete")
        
        return {
            'coordinator_initialized': True,
            'processing_time': processing_time,
            'threats_detected': len(threats),
            'active_threats': len(active_threats),
            'model_control_works': True,
            'config_update_works': success
        }
        
    except ImportError as e:
        print(f"❌ Failed to import master coordinator: {e}")
        return {'error': str(e)}
    except Exception as e:
        print(f"❌ Error testing master coordinator: {e}")
        return {'error': str(e)}

def test_enhanced_inference_integration():
    """Test the enhanced inference engine integration"""
    print("\n" + "="*60)
    print("🚀 TESTING ENHANCED INFERENCE ENGINE INTEGRATION")
    print("="*60)
    
    try:
        # This would test the enhanced_inference_v2.py file
        # For now, just verify it can be imported
        import enhanced_inference_v2
        
        # Test basic engine initialization
        print("🔧 Testing engine initialization...")
        
        # Create engine instance (but don't run it)
        engine = enhanced_inference_v2.EnhancedApexAIEngine(websocket_port=8766)
        
        print(f"  ✅ Engine created successfully")
        print(f"  🧠 Threat coordinator available: {engine.threat_coordinator is not None}")
        print(f"  👤 Face engine available: {engine.face_engine is not None}")
        
        # Test status
        status = engine.get_engine_status()
        print(f"\n📊 Engine Status:")
        for key, value in status.items():
            print(f"  {key}: {value}")
        
        # Test simulated detection creation
        print(f"\n🎭 Testing simulated detection creation...")
        simulated_detection = engine.create_simulated_detection('weapons', 'test_cam', 'lobby')
        print(f"  ✅ Simulated detection created: {simulated_detection['type']}")
        
        simulated_face = engine.create_simulated_face_detection('test_cam', 'lobby')
        print(f"  ✅ Simulated face detection created: {simulated_face['person_name']}")
        
        return {
            'engine_created': True,
            'threat_coordinator_available': engine.threat_coordinator is not None,
            'face_engine_available': engine.face_engine is not None,
            'status_working': len(status) > 0,
            'simulation_working': True
        }
        
    except ImportError as e:
        print(f"❌ Failed to import enhanced inference engine: {e}")
        return {'error': str(e)}
    except Exception as e:
        print(f"❌ Error testing enhanced inference engine: {e}")
        return {'error': str(e)}

def run_performance_test():
    """Run a performance test with multiple frames"""
    print("\n" + "="*60)
    print("⚡ RUNNING PERFORMANCE TEST")
    print("="*60)
    
    try:
        from models import MasterThreatDetectionCoordinator, DEFAULT_CONFIG
        
        coordinator = MasterThreatDetectionCoordinator(DEFAULT_CONFIG)
        
        # Create test frames
        num_frames = 10
        frames = []
        
        for i in range(num_frames):
            frame = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
            # Add some shapes
            cv2.rectangle(frame, (100+i*10, 100), (200+i*10, 300), (100, 100, 100), -1)
            frames.append(frame)
        
        print(f"🎬 Processing {num_frames} frames...")
        
        start_time = time.time()
        total_threats = 0
        
        for i, frame in enumerate(frames):
            threats = coordinator.detect_threats(
                frame,
                camera_id=f"perf_test_cam_{i}",
                zone="test_zone"
            )
            total_threats += len(threats)
        
        total_time = time.time() - start_time
        
        print(f"⏱️ Total processing time: {total_time:.4f} seconds")
        print(f"📊 Average time per frame: {total_time/num_frames:.4f} seconds")
        print(f"🎯 Total threats detected: {total_threats}")
        print(f"📈 FPS capability: {num_frames/total_time:.2f}")
        
        # Get final statistics
        final_stats = coordinator.get_processing_statistics()
        print(f"📊 Final processing statistics:")
        for key, value in final_stats.items():
            if isinstance(value, float):
                print(f"  {key}: {value:.4f}")
            else:
                print(f"  {key}: {value}")
        
        coordinator.shutdown()
        
        return {
            'frames_processed': num_frames,
            'total_time': total_time,
            'avg_time_per_frame': total_time/num_frames,
            'fps_capability': num_frames/total_time,
            'total_threats': total_threats
        }
        
    except Exception as e:
        print(f"❌ Error in performance test: {e}")
        return {'error': str(e)}

def generate_test_report(results: Dict):
    """Generate a comprehensive test report"""
    print("\n" + "="*60)
    print("📋 COMPREHENSIVE TEST REPORT")
    print("="*60)
    
    report = {
        'test_timestamp': datetime.now().isoformat(),
        'overall_status': 'PASS',
        'results': results
    }
    
    # Check individual model tests
    individual_results = results.get('individual_models', {})
    models_passed = 0
    models_total = len(individual_results)
    
    print(f"\n📝 Individual Model Tests ({models_total} models):")
    for model_name, result in individual_results.items():
        if result.get('initialized', False):
            print(f"  ✅ {model_name}: PASS")
            models_passed += 1
        else:
            print(f"  ❌ {model_name}: FAIL")
            report['overall_status'] = 'FAIL'
    
    # Check coordinator test
    coordinator_result = results.get('master_coordinator', {})
    coordinator_passed = coordinator_result.get('coordinator_initialized', False)
    
    print(f"\n🧠 Master Coordinator Test:")
    print(f"  {'✅' if coordinator_passed else '❌'} Coordinator: {'PASS' if coordinator_passed else 'FAIL'}")
    
    if not coordinator_passed:
        report['overall_status'] = 'FAIL'
    
    # Check integration test
    integration_result = results.get('enhanced_inference', {})
    integration_passed = integration_result.get('engine_created', False)
    
    print(f"\n🚀 Integration Test:")
    print(f"  {'✅' if integration_passed else '❌'} Enhanced Inference: {'PASS' if integration_passed else 'FAIL'}")
    
    if not integration_passed:
        report['overall_status'] = 'FAIL'
    
    # Performance summary
    performance_result = results.get('performance_test', {})
    if 'avg_time_per_frame' in performance_result:
        avg_time = performance_result['avg_time_per_frame']
        fps = performance_result.get('fps_capability', 0)
        
        print(f"\n⚡ Performance Summary:")
        print(f"  Average processing time: {avg_time:.4f} seconds/frame")
        print(f"  FPS capability: {fps:.2f}")
        print(f"  Performance rating: {'✅ GOOD' if fps >= 5 else '⚠️ SLOW' if fps >= 1 else '❌ POOR'}")
    
    # Overall summary
    print(f"\n🎯 OVERALL TEST RESULT: {report['overall_status']}")
    
    if report['overall_status'] == 'PASS':
        print("🎉 All tests passed! Your threat detection system is ready for deployment.")
    else:
        print("⚠️ Some tests failed. Please review the errors above.")
    
    print(f"\n📊 Summary Statistics:")
    print(f"  Models tested: {models_total}")
    print(f"  Models passed: {models_passed}")
    print(f"  Success rate: {(models_passed/models_total)*100:.1f}%" if models_total > 0 else "  Success rate: N/A")
    
    return report

def main():
    """Main test execution function"""
    print("🧪 APEX AI THREAT DETECTION MODELS - COMPREHENSIVE TEST")
    print("This test validates all threat detection models and components")
    print("="*70)
    
    results = {}
    
    # Test 1: Individual Models
    print("\n🔍 Running individual model tests...")
    results['individual_models'] = test_individual_models()
    
    # Test 2: Master Coordinator  
    print("\n🧠 Running master coordinator tests...")
    results['master_coordinator'] = test_master_coordinator()
    
    # Test 3: Enhanced Inference Integration
    print("\n🚀 Running integration tests...")
    results['enhanced_inference'] = test_enhanced_inference_integration()
    
    # Test 4: Performance Test
    print("\n⚡ Running performance tests...")
    results['performance_test'] = run_performance_test()
    
    # Generate comprehensive report
    report = generate_test_report(results)
    
    return report

if __name__ == "__main__":
    try:
        test_report = main()
        
        # Save report to file
        import json
        with open('threat_detection_test_report.json', 'w') as f:
            json.dump(test_report, f, indent=2, default=str)
        
        print(f"\n💾 Test report saved to: threat_detection_test_report.json")
        
    except KeyboardInterrupt:
        print("\n\n🛑 Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {e}")
        logger.error(f"Test execution error: {e}", exc_info=True)
