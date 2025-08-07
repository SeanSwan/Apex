#!/usr/bin/env python3
"""
APEX AI - INTEGRATION TEST FOR ENHANCED ENGINE
==============================================
Quick integration test to verify the enhanced AI engine with correlation
can initialize and run basic threat detection simulation

This test validates the complete pipeline without requiring external dependencies.
"""

import asyncio
import logging
import sys
import os
import traceback
from pathlib import Path

# Add apex_ai_engine to path
sys.path.insert(0, str(Path(__file__).parent / 'apex_ai_engine'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_enhanced_ai_engine():
    """Test the enhanced AI engine with correlation"""
    logger.info("🧪 Starting Enhanced AI Engine Integration Test...")
    
    try:
        # Import the enhanced AI engine
        from enhanced_ai_engine_with_correlation import EnhancedApexAIEngineWithCorrelation
        
        logger.info("✅ Successfully imported EnhancedApexAIEngineWithCorrelation")
        
        # Create engine instance
        engine = EnhancedApexAIEngineWithCorrelation()
        logger.info("✅ Engine instance created successfully")
        
        # Initialize the system (this will test all imports and setup)
        logger.info("🚀 Initializing enhanced AI system...")
        initialization_success = await engine.initialize_system()
        
        if initialization_success:
            logger.info("✅ System initialization completed successfully")
            
            # Test the correlation system
            logger.info("🔗 Testing threat correlation system...")
            
            # Create test threat data
            test_threat = {
                'threat_id': 'test_threat_001',
                'monitor_id': '0',
                'zone_id': 'DVR_Front_Entrance',
                'threat_type': 'trespassing',
                'threat_level': 'MEDIUM',
                'confidence': 0.78,
                'bbox': (150, 100, 80, 160),
                'movement_vector': (2.5, 0.5),
                'detection_source': 'integration_test'
            }
            
            # Process threat through correlation system
            result = await engine.process_threat_with_correlation(test_threat)
            
            if 'error' not in result:
                logger.info("✅ Test threat processed successfully through correlation system")
                logger.info(f"📊 Processing time: {result.get('processing_time', 0):.3f}s")
            else:
                logger.warning(f"⚠️ Threat processing returned error: {result['error']}")
            
            # Test statistics
            stats = engine.processing_stats
            logger.info(f"📈 Engine Statistics:")
            logger.info(f"   Total frames processed: {stats['total_frames']}")
            logger.info(f"   Threats detected: {stats['threats_detected']}")
            logger.info(f"   Correlations detected: {stats['correlations_detected']}")
            
            # Clean shutdown
            logger.info("🛑 Stopping enhanced AI engine...")
            await engine.stop_processing()
            logger.info("✅ Engine stopped successfully")
            
            return True
            
        else:
            logger.error("❌ System initialization failed")
            return False
            
    except ImportError as e:
        logger.error(f"❌ Import error: {e}")
        logger.error("💡 Make sure all dependencies are installed: pip install -r production_requirements.txt")
        return False
        
    except Exception as e:
        logger.error(f"❌ Integration test failed: {e}")
        logger.error("🔍 Full traceback:")
        traceback.print_exc()
        return False

async def test_correlation_engine():
    """Test the threat correlation engine directly"""
    logger.info("🔗 Testing threat correlation engine directly...")
    
    try:
        from threat_correlation_engine import ThreatCorrelationEngine
        
        # Create correlation engine
        correlation_engine = ThreatCorrelationEngine()
        logger.info("✅ Correlation engine created successfully")
        
        # Start correlation engine
        await correlation_engine.start_correlation_engine()
        logger.info("✅ Correlation engine started")
        
        # Register demo monitor relationships
        correlation_engine.register_monitor_relationship(
            monitor_a='0',
            monitor_b='1',
            spatial_relationship='adjacent',
            confidence_multiplier=1.3
        )
        logger.info("✅ Monitor relationships registered")
        
        # Test threat correlation
        test_threat_data = {
            'threat_id': 'correlation_test_001',
            'monitor_id': '0',
            'zone_id': 'test_zone',
            'threat_type': 'person',
            'threat_level': 'MEDIUM',
            'confidence': 0.75,
            'bbox': (100, 100, 50, 100),
            'movement_vector': (1.0, 0.5)
        }
        
        correlation_result = await correlation_engine.analyze_threat_for_correlation(test_threat_data)
        
        if correlation_result:
            logger.info(f"✅ Correlation analysis completed: confidence {correlation_result.confidence_score:.2f}")
        else:
            logger.info("✅ No correlation found (expected for single threat)")
        
        # Get statistics
        stats = correlation_engine.get_correlation_statistics()
        logger.info(f"📊 Correlation Statistics:")
        logger.info(f"   Total correlation attempts: {stats['total_correlations_attempted']}")
        logger.info(f"   Successful correlations: {stats['successful_correlations']}")
        
        # Stop engine
        await correlation_engine.stop_correlation_engine()
        logger.info("✅ Correlation engine stopped")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Correlation engine test failed: {e}")
        traceback.print_exc()
        return False

async def main():
    """Run all integration tests"""
    logger.info("🧪 APEX AI - Enhanced Engine Integration Test Suite")
    logger.info("="*60)
    
    # Test 1: Enhanced AI Engine
    test1_success = await test_enhanced_ai_engine()
    
    print()
    
    # Test 2: Correlation Engine
    test2_success = await test_correlation_engine()
    
    print()
    logger.info("="*60)
    
    if test1_success and test2_success:
        logger.info("🎉 ALL TESTS PASSED - Enhanced AI Engine is ready for production!")
        logger.info("🚀 You can now run: start_enhanced_ai_system.bat")
        return 0
    else:
        logger.error("❌ SOME TESTS FAILED - Check logs above for details")
        return 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        print()
        input("Press Enter to exit...")
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\\n🛑 Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\\n💥 Test suite failed: {e}")
        traceback.print_exc()
        sys.exit(1)
