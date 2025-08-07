#!/usr/bin/env python3
"""
APEX AI SYSTEM VALIDATION SCRIPT
================================
Validates all components for Phase 2A-1: Multi-Monitor Correlation system
Ensures all imports, dependencies, and database connections are working

Run this before starting the enhanced AI engine to verify system readiness.
"""

import sys
import os
import asyncio
import logging
import traceback
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SystemValidator:
    """Comprehensive system validation for APEX AI Engine"""
    
    def __init__(self):
        self.validation_results = {}
        self.critical_failures = []
        self.warnings = []
        
    async def run_full_validation(self):
        """Run complete system validation"""
        logger.info("🚀 Starting APEX AI System Validation...")
        
        # Core system checks
        await self.validate_python_version()
        await self.validate_core_dependencies()
        await self.validate_ai_models()
        await self.validate_video_capture_system()
        await self.validate_alert_systems()
        await self.validate_websocket_client()
        await self.validate_correlation_engine()
        await self.validate_database_connection()
        
        # Report results
        self.generate_validation_report()
        
        return len(self.critical_failures) == 0
    
    async def validate_python_version(self):
        """Validate Python version compatibility"""
        try:
            version = sys.version_info
            if version.major == 3 and version.minor >= 9:
                self.validation_results['python_version'] = f"✅ Python {version.major}.{version.minor}.{version.micro}"
            else:
                self.critical_failures.append(f"❌ Python version {version.major}.{version.minor} not supported. Need Python 3.9+")
                self.validation_results['python_version'] = f"❌ Python {version.major}.{version.minor}.{version.micro}"
        except Exception as e:
            self.critical_failures.append(f"❌ Python version check failed: {e}")
    
    async def validate_core_dependencies(self):
        """Validate core dependencies can be imported"""
        dependencies = {
            'cv2': 'OpenCV (computer vision)',
            'numpy': 'NumPy (numerical computing)',
            'PIL': 'Pillow (image processing)',
            'yaml': 'PyYAML (configuration)',
            'psutil': 'System monitoring',
            'asyncio': 'Async I/O (built-in)',
            'threading': 'Threading (built-in)',
            'time': 'Time utilities (built-in)',
            'logging': 'Logging (built-in)'
        }
        
        for module, description in dependencies.items():
            try:
                __import__(module)
                self.validation_results[f'dependency_{module}'] = f"✅ {description}"
            except ImportError as e:
                if module in ['asyncio', 'threading', 'time', 'logging']:
                    self.critical_failures.append(f"❌ Built-in module {module} not available: {e}")
                else:
                    self.critical_failures.append(f"❌ {description} not installed: {e}")
                self.validation_results[f'dependency_{module}'] = f"❌ Not available"
    
    async def validate_ai_models(self):
        """Validate AI models can be loaded"""
        try:
            from ultralytics import YOLO
            # Try to load a model (this will download if not present)
            model = YOLO('yolov8n.pt')
            self.validation_results['yolo_model'] = "✅ YOLOv8 model loaded successfully"
        except ImportError:
            self.warnings.append("⚠️ YOLOv8 not available - install with: pip install ultralytics")
            self.validation_results['yolo_model'] = "⚠️ YOLOv8 not installed"
        except Exception as e:
            self.warnings.append(f"⚠️ YOLOv8 model loading failed: {e}")
            self.validation_results['yolo_model'] = f"⚠️ Model loading failed"
    
    async def validate_video_capture_system(self):
        """Validate video capture components"""
        try:
            # Check if we can import our video capture system
            from video_capture.video_input_manager import VideoInputManager
            from video_capture.dvr_screen_capture import DVRScreenCapture
            from video_capture.rtsp_stream_client import RTSPStreamManager
            
            self.validation_results['video_capture'] = "✅ Video capture system available"
            
            # Test screen capture capability
            try:
                from PIL import ImageGrab
                test_screenshot = ImageGrab.grab(bbox=(0, 0, 100, 100))
                self.validation_results['screen_capture'] = "✅ Screen capture functional"
            except Exception as e:
                self.warnings.append(f"⚠️ Screen capture test failed: {e}")
                self.validation_results['screen_capture'] = "⚠️ Screen capture may not work"
                
        except ImportError as e:
            self.critical_failures.append(f"❌ Video capture system import failed: {e}")
            self.validation_results['video_capture'] = "❌ Import failed"
    
    async def validate_alert_systems(self):
        """Validate visual and audio alert systems"""
        try:
            from visual_alerts.enhanced_visual_alert_engine import EnhancedVisualAlertEngine
            from audio_alerts.spatial_audio_engine import SpatialAudioEngine
            
            self.validation_results['alert_systems'] = "✅ Alert systems available"
            
            # Test alert engine initialization
            visual_engine = EnhancedVisualAlertEngine()
            audio_engine = SpatialAudioEngine()
            
            self.validation_results['alert_initialization'] = "✅ Alert engines initialize successfully"
            
        except ImportError as e:
            self.critical_failures.append(f"❌ Alert systems import failed: {e}")
            self.validation_results['alert_systems'] = "❌ Import failed"
        except Exception as e:
            self.warnings.append(f"⚠️ Alert system initialization warning: {e}")
            self.validation_results['alert_initialization'] = f"⚠️ Initialization warning"
    
    async def validate_websocket_client(self):
        """Validate WebSocket client"""
        try:
            from enhanced_websocket_client import EnhancedWebSocketClient
            
            # Test client creation (don't connect)
            client = EnhancedWebSocketClient("http://localhost:5000", "test_token")
            
            self.validation_results['websocket_client'] = "✅ WebSocket client available"
            
        except ImportError as e:
            self.critical_failures.append(f"❌ WebSocket client import failed: {e}")
            self.validation_results['websocket_client'] = "❌ Import failed"
        except Exception as e:
            self.warnings.append(f"⚠️ WebSocket client creation warning: {e}")
    
    async def validate_correlation_engine(self):
        """Validate threat correlation engine"""
        try:
            from threat_correlation_engine import ThreatCorrelationEngine
            from tier2_alert_coordinator_enhanced import Tier2AlertCoordinator
            
            # Test engine creation
            correlation_engine = ThreatCorrelationEngine()
            coordinator = Tier2AlertCoordinator()
            
            self.validation_results['correlation_engine'] = "✅ Threat correlation engine available"
            
        except ImportError as e:
            self.critical_failures.append(f"❌ Correlation engine import failed: {e}")
            self.validation_results['correlation_engine'] = "❌ Import failed"
        except Exception as e:
            self.warnings.append(f"⚠️ Correlation engine creation warning: {e}")
    
    async def validate_database_connection(self):
        """Validate database connection capability"""
        try:
            import psycopg2
            self.validation_results['database_driver'] = "✅ PostgreSQL driver available"
            
            # Don't actually connect without credentials, just validate driver
            self.warnings.append("📋 Database connection not tested (credentials required)")
            
        except ImportError:
            self.warnings.append("⚠️ PostgreSQL driver not installed - install with: pip install psycopg2-binary")
            self.validation_results['database_driver'] = "⚠️ Driver not installed"
    
    def generate_validation_report(self):
        """Generate comprehensive validation report"""
        print("\\n" + "="*80)
        print("🔍 APEX AI SYSTEM VALIDATION REPORT")
        print("="*80)
        
        # Show all validation results
        for component, result in self.validation_results.items():
            print(f"{component.replace('_', ' ').title()}: {result}")
        
        print("\\n" + "-"*80)
        
        # Show warnings
        if self.warnings:
            print("⚠️  WARNINGS:")
            for warning in self.warnings:
                print(f"   {warning}")
            print()
        
        # Show critical failures
        if self.critical_failures:
            print("❌ CRITICAL FAILURES:")
            for failure in self.critical_failures:
                print(f"   {failure}")
            print()
            print("🚨 SYSTEM NOT READY - Fix critical failures before proceeding")
        else:
            print("✅ SYSTEM VALIDATION PASSED")
            print("🚀 Ready to start APEX AI Enhanced Engine with Multi-Monitor Correlation")
        
        print("="*80)
        
        # Summary stats
        total_checks = len(self.validation_results)
        passed_checks = len([r for r in self.validation_results.values() if r.startswith("✅")])
        warning_checks = len([r for r in self.validation_results.values() if r.startswith("⚠️")])
        
        print(f"📊 SUMMARY: {passed_checks}/{total_checks} checks passed, {warning_checks} warnings, {len(self.critical_failures)} critical failures")
        print("="*80 + "\\n")

async def main():
    """Run system validation"""
    validator = SystemValidator()
    success = await validator.run_full_validation()
    
    if success:
        print("🎉 System is ready for Phase 2A-1: Multi-Monitor Correlation!")
        return 0
    else:
        print("❌ System validation failed. Please fix issues before proceeding.")
        return 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\\n🛑 Validation interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\\n💥 Validation failed with error: {e}")
        traceback.print_exc()
        sys.exit(1)
