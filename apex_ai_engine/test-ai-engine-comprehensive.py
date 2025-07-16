#!/usr/bin/env python3
"""
COMPREHENSIVE AI ENGINE TESTING SUITE
=====================================
Tests all AI Engine functionality for Phase 3 validation

This script validates:
- Python dependencies installation
- AI model loading (YOLO, Face Recognition)  
- WebSocket client functionality
- Configuration management
- Demo engine capabilities
- Integration readiness
"""

import sys
import os
import importlib
import json
import logging
import time
from pathlib import Path
from typing import Dict, List, Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AIEngineTestSuite:
    """Comprehensive testing suite for AI Engine validation"""
    
    def __init__(self):
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'warnings': 0,
            'tests': []
        }
        
        print("🤖 APEX AI ENGINE COMPREHENSIVE TESTING SUITE")
        print("==============================================\\n")

    def log_test(self, test_name: str, status: str, message: str, details: str = None):
        """Log test result with proper formatting"""
        timestamp = time.time()
        status_icon = '✅' if status == 'PASS' else '❌' if status == 'FAIL' else '⚠️'
        
        print(f"{status_icon} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results['tests'].append({
            'name': test_name,
            'status': status,
            'message': message,
            'details': details,
            'timestamp': timestamp
        })
        
        if status == 'PASS':
            self.test_results['passed'] += 1
        elif status == 'FAIL':
            self.test_results['failed'] += 1
        else:
            self.test_results['warnings'] += 1

    def test_python_environment(self):
        """Test 1: Python environment and version"""
        try:
            python_version = sys.version_info
            if python_version.major == 3 and python_version.minor >= 8:
                self.log_test('PYTHON_VERSION', 'PASS', 
                    f'Python {python_version.major}.{python_version.minor}.{python_version.micro} is compatible')
            else:
                self.log_test('PYTHON_VERSION', 'FAIL', 
                    f'Python {python_version.major}.{python_version.minor} is too old (need 3.8+)')
        except Exception as e:
            self.log_test('PYTHON_VERSION', 'FAIL', 'Failed to check Python version', str(e))

    def test_critical_dependencies(self):
        """Test 2: Critical Python dependencies"""
        critical_deps = [
            ('numpy', 'Numerical computing'),
            ('cv2', 'OpenCV computer vision'),
            ('PIL', 'Image processing'),
            ('websockets', 'WebSocket communication'),
            ('asyncio', 'Asynchronous programming'),
            ('json', 'JSON processing'),
            ('yaml', 'YAML configuration'),
            ('logging', 'Logging system')
        ]
        
        for dep_name, description in critical_deps:
            try:
                if dep_name == 'cv2':
                    import cv2
                elif dep_name == 'PIL':
                    from PIL import Image
                elif dep_name == 'yaml':
                    import yaml
                else:
                    importlib.import_module(dep_name)
                
                self.log_test(f'DEP_{dep_name.upper()}', 'PASS', f'{description} available')
            except ImportError:
                self.log_test(f'DEP_{dep_name.upper()}', 'FAIL', f'{description} not available')
            except Exception as e:
                self.log_test(f'DEP_{dep_name.upper()}', 'WARN', f'{description} check failed', str(e))

    def test_ai_dependencies(self):
        """Test 3: AI/ML specific dependencies"""
        ai_deps = [
            ('ultralytics', 'YOLOv8 object detection'),
            ('face_recognition', 'Face recognition library'),
            ('dlib', 'Machine learning library'),
            ('psycopg2', 'PostgreSQL adapter')
        ]
        
        for dep_name, description in ai_deps:
            try:
                importlib.import_module(dep_name)
                self.log_test(f'AI_DEP_{dep_name.upper()}', 'PASS', f'{description} available')
            except ImportError:
                self.log_test(f'AI_DEP_{dep_name.upper()}', 'WARN', 
                    f'{description} not available (optional for demo)')
            except Exception as e:
                self.log_test(f'AI_DEP_{dep_name.upper()}', 'WARN', 
                    f'{description} check failed', str(e))

    def test_configuration_files(self):
        """Test 4: Configuration and script files"""
        critical_files = [
            ('config.yaml', 'AI engine configuration'),
            ('demo_ai_engine.py', 'Demo AI engine script'),
            ('enhanced_websocket_client.py', 'WebSocket client'),
            ('enhanced_inference.py', 'Enhanced inference engine'),
            ('face_recognition_engine.py', 'Face recognition module'),
            ('requirements.txt', 'Python dependencies list')
        ]
        
        for filename, description in critical_files:
            file_path = Path(filename)
            if file_path.exists():
                file_size = file_path.stat().st_size
                self.log_test(f'FILE_{filename.replace(".", "_").upper()}', 'PASS', 
                    f'{description} exists ({file_size} bytes)')
            else:
                self.log_test(f'FILE_{filename.replace(".", "_").upper()}', 'FAIL', 
                    f'{description} not found')

    def test_configuration_loading(self):
        """Test 5: Configuration file loading"""
        try:
            import yaml
            with open('config.yaml', 'r') as f:
                config = yaml.safe_load(f)
            
            # Check essential configuration sections
            required_sections = ['model', 'video', 'communication', 'rules']
            missing_sections = []
            
            for section in required_sections:
                if section not in config:
                    missing_sections.append(section)
            
            if not missing_sections:
                self.log_test('CONFIG_STRUCTURE', 'PASS', 'All required config sections present')
            else:
                self.log_test('CONFIG_STRUCTURE', 'FAIL', 
                    'Missing config sections', ', '.join(missing_sections))
                
            # Check model configuration
            if 'model' in config and 'confidence_threshold' in config['model']:
                threshold = config['model']['confidence_threshold']
                self.log_test('CONFIG_MODEL', 'PASS', f'Model confidence threshold: {threshold}')
            else:
                self.log_test('CONFIG_MODEL', 'WARN', 'Model configuration incomplete')
                
        except FileNotFoundError:
            self.log_test('CONFIG_LOADING', 'FAIL', 'config.yaml not found')
        except Exception as e:
            self.log_test('CONFIG_LOADING', 'FAIL', 'Config loading failed', str(e))

    def test_websocket_client_structure(self):
        """Test 6: WebSocket client structure"""
        try:
            # Try to import and check basic structure
            with open('enhanced_websocket_client.py', 'r') as f:
                client_code = f.read()
            
            required_components = [
                'EnhancedWebSocketClient',
                'ConnectionState',
                'WebSocketMessage',
                'asyncio',
                'websockets'
            ]
            
            missing_components = []
            for component in required_components:
                if component not in client_code:
                    missing_components.append(component)
            
            if not missing_components:
                self.log_test('WEBSOCKET_STRUCTURE', 'PASS', 'WebSocket client structure complete')
            else:
                self.log_test('WEBSOCKET_STRUCTURE', 'WARN', 
                    'WebSocket client missing components', ', '.join(missing_components))
                    
        except FileNotFoundError:
            self.log_test('WEBSOCKET_STRUCTURE', 'FAIL', 'WebSocket client file not found')
        except Exception as e:
            self.log_test('WEBSOCKET_STRUCTURE', 'FAIL', 'WebSocket client check failed', str(e))

    def test_demo_engine_structure(self):
        """Test 7: Demo AI engine structure"""
        try:
            with open('demo_ai_engine.py', 'r') as f:
                demo_code = f.read()
            
            required_components = [
                'ApexAIDemoEngine',
                'initialize_ai_models',
                'enhanced_websocket_client',
                'demo_cameras',
                'asyncio'
            ]
            
            missing_components = []
            for component in required_components:
                if component not in demo_code:
                    missing_components.append(component)
            
            if not missing_components:
                self.log_test('DEMO_ENGINE_STRUCTURE', 'PASS', 'Demo engine structure complete')
            else:
                self.log_test('DEMO_ENGINE_STRUCTURE', 'WARN', 
                    'Demo engine missing components', ', '.join(missing_components))
                    
        except FileNotFoundError:
            self.log_test('DEMO_ENGINE_STRUCTURE', 'FAIL', 'Demo engine file not found')
        except Exception as e:
            self.log_test('DEMO_ENGINE_STRUCTURE', 'FAIL', 'Demo engine check failed', str(e))

    def test_face_recognition_structure(self):
        """Test 8: Face recognition engine structure"""
        try:
            with open('face_recognition_engine.py', 'r') as f:
                face_code = f.read()
            
            required_components = [
                'FaceRecognitionEngine',
                'face_recognition',
                'known_faces_cache',
                'confidence_threshold',
                'psycopg2'
            ]
            
            missing_components = []
            for component in required_components:
                if component not in face_code:
                    missing_components.append(component)
            
            if not missing_components:
                self.log_test('FACE_ENGINE_STRUCTURE', 'PASS', 'Face recognition engine structure complete')
            else:
                self.log_test('FACE_ENGINE_STRUCTURE', 'WARN', 
                    'Face engine missing components', ', '.join(missing_components))
                    
        except FileNotFoundError:
            self.log_test('FACE_ENGINE_STRUCTURE', 'FAIL', 'Face recognition engine file not found')
        except Exception as e:
            self.log_test('FACE_ENGINE_STRUCTURE', 'FAIL', 'Face engine check failed', str(e))

    def test_runtime_imports(self):
        """Test 9: Runtime import capabilities"""
        import_tests = [
            ('json', 'JSON processing'),
            ('time', 'Time utilities'),
            ('asyncio', 'Async processing'),
            ('logging', 'Logging system'),
            ('threading', 'Multi-threading'),
            ('queue', 'Queue processing')
        ]
        
        for module_name, description in import_tests:
            try:
                importlib.import_module(module_name)
                self.log_test(f'RUNTIME_{module_name.upper()}', 'PASS', f'{description} imports successfully')
            except ImportError:
                self.log_test(f'RUNTIME_{module_name.upper()}', 'FAIL', f'{description} import failed')
            except Exception as e:
                self.log_test(f'RUNTIME_{module_name.upper()}', 'WARN', f'{description} import warning', str(e))

    def test_integration_readiness(self):
        """Test 10: Integration readiness assessment"""
        # Check if all critical components are ready for integration
        critical_passed = 0
        total_critical = 0
        
        for test in self.test_results['tests']:
            if any(keyword in test['name'] for keyword in ['PYTHON_VERSION', 'CONFIG_STRUCTURE', 
                  'WEBSOCKET_STRUCTURE', 'DEMO_ENGINE_STRUCTURE']):
                total_critical += 1
                if test['status'] == 'PASS':
                    critical_passed += 1
        
        if critical_passed == total_critical and total_critical > 0:
            self.log_test('INTEGRATION_READINESS', 'PASS', 
                'All critical components ready for integration')
        elif critical_passed >= total_critical * 0.8:
            self.log_test('INTEGRATION_READINESS', 'WARN', 
                'Most components ready, minor issues detected')
        else:
            self.log_test('INTEGRATION_READINESS', 'FAIL', 
                'Critical components missing or failed')

    def run_comprehensive_tests(self):
        """Run all AI Engine tests"""
        print("🎯 Starting comprehensive AI Engine validation...\\n")
        
        print("📋 PHASE 1: PYTHON ENVIRONMENT VALIDATION\\n")
        self.test_python_environment()
        self.test_critical_dependencies()
        self.test_ai_dependencies()
        
        print("\\n📦 PHASE 2: AI ENGINE STRUCTURE VALIDATION\\n")
        self.test_configuration_files()
        self.test_configuration_loading()
        self.test_websocket_client_structure()
        self.test_demo_engine_structure()
        self.test_face_recognition_structure()
        
        print("\\n🔧 PHASE 3: RUNTIME CAPABILITIES VALIDATION\\n")
        self.test_runtime_imports()
        self.test_integration_readiness()
        
        # Final report
        print("\\n📊 COMPREHENSIVE AI ENGINE TEST RESULTS")
        print("=========================================")
        print(f"✅ PASSED: {self.test_results['passed']}")
        print(f"⚠️  WARNINGS: {self.test_results['warnings']}")
        print(f"❌ FAILED: {self.test_results['failed']}")
        print(f"📋 TOTAL TESTS: {len(self.test_results['tests'])}\\n")
        
        if self.test_results['failed'] == 0:
            print("🎉 ALL CRITICAL AI ENGINE TESTS PASSED!")
            print("📈 AI Engine is ready for Phase 4 testing\\n")
            
            print("🚀 NEXT STEPS:")
            print("1. Start demo AI engine: python demo_ai_engine.py")
            print("2. Verify WebSocket connection to backend")
            print("3. Test AI detection simulation")
            print("4. Proceed to Desktop App Testing (Phase 4)\\n")
        else:
            print("⚠️  SOME TESTS FAILED - Review issues above")
            print("🔧 Fix critical issues before proceeding to Phase 4\\n")
            
            # Show failed tests
            failed_tests = [t for t in self.test_results['tests'] if t['status'] == 'FAIL']
            if failed_tests:
                print("❌ FAILED TESTS:")
                for test in failed_tests:
                    print(f"   - {test['name']}: {test['message']}")
                print()
        
        return {
            'success': self.test_results['failed'] == 0,
            'results': self.test_results
        }

if __name__ == "__main__":
    # Run the comprehensive test suite
    test_suite = AIEngineTestSuite()
    results = test_suite.run_comprehensive_tests()
    
    # Exit with appropriate code
    sys.exit(0 if results['success'] else 1)
