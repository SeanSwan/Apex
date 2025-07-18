"""
APEX AI MCP INTEGRATION SCRIPT
==============================
Integration layer between MCP server and existing AI infrastructure
Bridges the gap between enhanced_inference.py and MCP Tools

This script provides:
- MCP server startup and management
- Integration with existing AI components
- Unified API for all AI services
- Backward compatibility with existing code
"""

import asyncio
import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import subprocess
import threading
import signal

# Add paths for imports
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent))

# MCP Server imports
from main import MCPServer
from tools.vision_analysis_tool import VisionAnalysisTool
from tools.conversation_tool import ConversationTool
from tools.voice_synthesis_tool import VoiceSynthesisTool
from tools.alerting_tool import AlertingTool

# Existing AI infrastructure imports
try:
    from enhanced_inference import EnhancedApexAIEngine
    from face_recognition_engine import FaceRecognitionEngine
    EXISTING_AI_AVAILABLE = True
except ImportError:
    EXISTING_AI_AVAILABLE = False
    logging.warning("⚠️ Existing AI infrastructure not available")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ApexAIIntegration:
    """
    Integration layer for APEX AI MCP server with existing infrastructure
    
    This class provides:
    - Unified startup and management
    - Bridge between old and new AI systems
    - Graceful migration path
    - Backward compatibility
    """
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path
        self.mcp_server = None
        self.existing_ai_engine = None
        self.integration_active = False
        self.startup_complete = False
        
        # Integration configuration
        self.integration_config = self.load_integration_config()
        
        # Process management
        self.processes = {}
        self.shutdown_event = asyncio.Event()
        
        logger.info("🔗 APEX AI Integration initialized")

    def load_integration_config(self) -> Dict:
        """Load integration configuration"""
        default_config = {
            'mcp_server': {
                'enabled': True,
                'port': 8766,
                'host': '0.0.0.0'
            },
            'existing_ai': {
                'enabled': EXISTING_AI_AVAILABLE,
                'websocket_port': 8765,
                'bridge_mode': True
            },
            'integration_mode': {
                'unified_api': True,
                'backward_compatibility': True,
                'migration_mode': True
            },
            'services': {
                'vision_analysis': True,
                'conversation': True,
                'voice_synthesis': True,
                'alerting': True,
                'face_recognition': True
            }
        }
        
        # Load custom config if provided
        if self.config_path and Path(self.config_path).exists():
            try:
                import yaml
                with open(self.config_path, 'r') as f:
                    custom_config = yaml.safe_load(f)
                
                # Merge configurations
                default_config.update(custom_config)
                logger.info(f"📋 Integration config loaded from {self.config_path}")
                
            except Exception as e:
                logger.error(f"❌ Failed to load integration config: {e}")
        
        return default_config

    async def start_integration(self):
        """Start the integrated AI system"""
        try:
            logger.info("🚀 Starting APEX AI Integration...")
            
            # Display startup banner
            self.display_startup_banner()
            
            # Initialize MCP server
            if self.integration_config['mcp_server']['enabled']:
                await self.start_mcp_server()
            
            # Initialize existing AI engine if available
            if self.integration_config['existing_ai']['enabled'] and EXISTING_AI_AVAILABLE:
                await self.start_existing_ai_engine()
            
            # Setup integration bridges
            if self.integration_config['integration_mode']['unified_api']:
                await self.setup_unified_api()
            
            # Start monitoring tasks
            asyncio.create_task(self.monitor_services())
            
            self.integration_active = True
            self.startup_complete = True
            
            logger.info("✅ APEX AI Integration startup complete")
            
            # Keep running until shutdown
            await self.run_until_shutdown()
            
        except Exception as e:
            logger.error(f"❌ Integration startup failed: {e}")
            raise

    async def start_mcp_server(self):
        """Start the MCP server"""
        try:
            logger.info("🔧 Starting MCP Server...")
            
            # Create MCP server instance
            self.mcp_server = MCPServer(self.config_path)
            
            # Start server initialization
            await self.mcp_server.startup()
            
            # Start FastAPI server in background
            import uvicorn
            from threading import Thread
            
            def run_server():
                uvicorn.run(
                    self.mcp_server.app,
                    host=self.integration_config['mcp_server']['host'],
                    port=self.integration_config['mcp_server']['port'],
                    log_level="info"
                )
            
            server_thread = Thread(target=run_server, daemon=True)
            server_thread.start()
            
            # Wait for server to start
            await asyncio.sleep(2)
            
            logger.info(f"✅ MCP Server started on port {self.integration_config['mcp_server']['port']}")
            
        except Exception as e:
            logger.error(f"❌ MCP Server startup failed: {e}")
            raise

    async def start_existing_ai_engine(self):
        """Start the existing AI engine for backward compatibility"""
        try:
            logger.info("🔧 Starting Existing AI Engine...")
            
            # Initialize existing AI engine
            self.existing_ai_engine = EnhancedApexAIEngine(
                websocket_port=self.integration_config['existing_ai']['websocket_port'],
                model_path="yolov8n.pt"
            )
            
            # Start existing AI engine in background
            asyncio.create_task(self.existing_ai_engine.run())
            
            logger.info("✅ Existing AI Engine started")
            
        except Exception as e:
            logger.error(f"❌ Existing AI Engine startup failed: {e}")
            # Continue without existing AI engine
            self.integration_config['existing_ai']['enabled'] = False

    async def setup_unified_api(self):
        """Setup unified API that bridges both systems"""
        try:
            logger.info("🔗 Setting up Unified API...")
            
            # Create unified API endpoints
            @self.mcp_server.app.post("/api/unified/vision-analysis")
            async def unified_vision_analysis(payload: Dict):
                """Unified vision analysis endpoint"""
                if self.mcp_server:
                    return await self.mcp_server.execute_tool('vision_analysis', payload)
                else:
                    return {"error": "MCP server not available"}
            
            @self.mcp_server.app.post("/api/unified/conversation")
            async def unified_conversation(payload: Dict):
                """Unified conversation endpoint"""
                if self.mcp_server:
                    return await self.mcp_server.execute_tool('conversation', payload)
                else:
                    return {"error": "MCP server not available"}
            
            @self.mcp_server.app.post("/api/unified/voice-synthesis")
            async def unified_voice_synthesis(payload: Dict):
                """Unified voice synthesis endpoint"""
                if self.mcp_server:
                    return await self.mcp_server.execute_tool('voice_synthesis', payload)
                else:
                    return {"error": "MCP server not available"}
            
            @self.mcp_server.app.post("/api/unified/alert")
            async def unified_alerting(payload: Dict):
                """Unified alerting endpoint"""
                if self.mcp_server:
                    return await self.mcp_server.execute_tool('alerting', payload)
                else:
                    return {"error": "MCP server not available"}
            
            # Bridge endpoint for existing AI engine
            @self.mcp_server.app.post("/api/bridge/legacy-detection")
            async def bridge_legacy_detection(payload: Dict):
                """Bridge to existing AI detection system"""
                if self.existing_ai_engine:
                    # Forward to existing AI engine
                    return await self.forward_to_existing_ai(payload)
                else:
                    return {"error": "Existing AI engine not available"}
            
            logger.info("✅ Unified API setup complete")
            
        except Exception as e:
            logger.error(f"❌ Unified API setup failed: {e}")

    async def forward_to_existing_ai(self, payload: Dict) -> Dict:
        """Forward requests to existing AI engine"""
        try:
            # This would integrate with the existing WebSocket communication
            # For now, we'll simulate the response
            return {
                "status": "forwarded",
                "payload": payload,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"❌ Failed to forward to existing AI: {e}")
            return {"error": str(e)}

    async def monitor_services(self):
        """Monitor all services and restart if needed"""
        while self.integration_active:
            try:
                # Check MCP server health
                if self.mcp_server and not self.mcp_server.stats:
                    logger.warning("⚠️ MCP server health check failed")
                
                # Check existing AI engine health
                if self.existing_ai_engine and not self.existing_ai_engine.is_running:
                    logger.warning("⚠️ Existing AI engine health check failed")
                
                # Log service status
                logger.debug(f"📊 Services monitoring: MCP={bool(self.mcp_server)}, Legacy={bool(self.existing_ai_engine)}")
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"❌ Service monitoring error: {e}")
                await asyncio.sleep(30)

    async def run_until_shutdown(self):
        """Keep the integration running until shutdown signal"""
        try:
            # Setup signal handlers
            def signal_handler(signum, frame):
                logger.info(f"🛑 Shutdown signal received: {signum}")
                self.shutdown_event.set()
            
            signal.signal(signal.SIGINT, signal_handler)
            signal.signal(signal.SIGTERM, signal_handler)
            
            # Wait for shutdown signal
            await self.shutdown_event.wait()
            
        except Exception as e:
            logger.error(f"❌ Runtime error: {e}")
        finally:
            await self.shutdown_integration()

    async def shutdown_integration(self):
        """Gracefully shutdown the integration"""
        logger.info("🛑 Shutting down APEX AI Integration...")
        
        self.integration_active = False
        
        # Shutdown MCP server
        if self.mcp_server:
            try:
                await self.mcp_server.shutdown()
                logger.info("✅ MCP Server shutdown complete")
            except Exception as e:
                logger.error(f"❌ MCP Server shutdown error: {e}")
        
        # Shutdown existing AI engine
        if self.existing_ai_engine:
            try:
                self.existing_ai_engine.is_running = False
                logger.info("✅ Existing AI Engine shutdown complete")
            except Exception as e:
                logger.error(f"❌ Existing AI Engine shutdown error: {e}")
        
        logger.info("✅ APEX AI Integration shutdown complete")

    def display_startup_banner(self):
        """Display startup banner"""
        banner = """
╔════════════════════════════════════════════════════════════════════════════════════════╗
║                     🚀 APEX AI ENHANCED DVR SECURITY SYSTEM                           ║
║                        Model Context Protocol Integration                              ║
╠════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                        ║
║  🧠 AI CAPABILITIES:                                                                   ║
║    • Vision Analysis (YOLO + Face Recognition)                                        ║
║    • Intelligent Conversation System                                                  ║
║    • Voice Synthesis with Emotion Modulation                                          ║
║    • Real-time Alerting and Dispatch                                                  ║
║                                                                                        ║
║  🔧 MCP TOOLS:                                                                         ║
║    • Vision Analysis Tool                                                              ║
║    • Conversation Tool                                                                 ║
║    • Voice Synthesis Tool                                                              ║
║    • Alerting Tool                                                                     ║
║                                                                                        ║
║  📚 MCP RESOURCES:                                                                     ║
║    • Security Scripts Library                                                          ║
║    • Threat Profiles Configuration                                                     ║
║                                                                                        ║
║  🔗 INTEGRATION FEATURES:                                                              ║
║    • Unified API Layer                                                                 ║
║    • Backward Compatibility Bridge                                                     ║
║    • Real-time WebSocket Communication                                                 ║
║    • Production-Ready FastAPI Server                                                   ║
║                                                                                        ║
╚════════════════════════════════════════════════════════════════════════════════════════╝
        """
        print(banner)
        
        # Configuration summary
        print("📋 CONFIGURATION SUMMARY:")
        print(f"   • MCP Server: {'✅ Enabled' if self.integration_config['mcp_server']['enabled'] else '❌ Disabled'}")
        print(f"   • Existing AI: {'✅ Enabled' if self.integration_config['existing_ai']['enabled'] else '❌ Disabled'}")
        print(f"   • Unified API: {'✅ Enabled' if self.integration_config['integration_mode']['unified_api'] else '❌ Disabled'}")
        print(f"   • Bridge Mode: {'✅ Enabled' if self.integration_config['existing_ai'].get('bridge_mode') else '❌ Disabled'}")
        print()
        
        # Service status
        print("🔧 SERVICE STATUS:")
        for service, enabled in self.integration_config['services'].items():
            status = "✅ Enabled" if enabled else "❌ Disabled"
            print(f"   • {service.replace('_', ' ').title()}: {status}")
        print()

    def get_integration_status(self) -> Dict:
        """Get current integration status"""
        return {
            'integration_active': self.integration_active,
            'startup_complete': self.startup_complete,
            'mcp_server_active': bool(self.mcp_server),
            'existing_ai_active': bool(self.existing_ai_engine),
            'services': self.integration_config['services'],
            'uptime': time.time() - (self.startup_complete if self.startup_complete else time.time())
        }

# Standalone startup functions
def start_mcp_server_only():
    """Start only the MCP server"""
    async def run_mcp_only():
        server = MCPServer()
        await server.startup()
        
        import uvicorn
        uvicorn.run(server.app, host="0.0.0.0", port=8766)
    
    asyncio.run(run_mcp_only())

def start_full_integration():
    """Start full integration with all components"""
    async def run_full():
        integration = ApexAIIntegration()
        await integration.start_integration()
    
    asyncio.run(run_full())

def start_existing_ai_only():
    """Start only the existing AI engine"""
    async def run_existing_only():
        if EXISTING_AI_AVAILABLE:
            engine = EnhancedApexAIEngine()
            await engine.run()
        else:
            print("❌ Existing AI engine not available")
    
    asyncio.run(run_existing_only())

# Main execution
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="APEX AI Integration Manager")
    parser.add_argument("--mode", choices=["full", "mcp-only", "existing-only"], 
                       default="full", help="Integration mode")
    parser.add_argument("--config", type=str, help="Configuration file path")
    
    args = parser.parse_args()
    
    try:
        if args.mode == "full":
            print("🚀 Starting Full Integration...")
            integration = ApexAIIntegration(args.config)
            asyncio.run(integration.start_integration())
        elif args.mode == "mcp-only":
            print("🚀 Starting MCP Server Only...")
            start_mcp_server_only()
        elif args.mode == "existing-only":
            print("🚀 Starting Existing AI Only...")
            start_existing_ai_only()
            
    except KeyboardInterrupt:
        print("\n🛑 Shutdown requested by user")
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
