"""
APEX AI MCP SERVER - MODEL CONTEXT PROTOCOL IMPLEMENTATION
=========================================================
FastAPI server hosting MCP Tools and Resources as the central AI orchestration layer

This server acts as the "central nervous system" for all AI capabilities, providing:
- MCP Tools for AI operations (vision, conversation, voice, alerting)
- MCP Resources for configuration and scripts
- Unified API for AI service orchestration
- Scalability and multi-model support

Architecture: FastAPI + MCP Protocol + WebSocket communication
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import yaml
import traceback

# FastAPI and WebSocket imports
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# MCP Tools imports
from tools.vision_analysis_tool import VisionAnalysisTool
from tools.conversation_tool import ConversationTool
from tools.voice_synthesis_tool import VoiceSynthesisTool
from tools.alerting_tool import AlertingTool

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MCPServer:
    """
    Model Context Protocol Server - Central AI Orchestration Hub
    
    This server provides:
    - Tool management and execution
    - Resource configuration and access
    - Client communication via WebSocket
    - Request routing and response handling
    """
    
    def __init__(self, config_path: Optional[str] = None):
        self.app = FastAPI(
            title="APEX AI MCP Server",
            description="Model Context Protocol server for AI orchestration",
            version="1.0.0"
        )
        
        # Initialize core components
        self.tools: Dict[str, Any] = {}
        self.resources: Dict[str, Any] = {}
        self.active_clients: Dict[str, WebSocket] = {}
        self.config = self.load_configuration(config_path)
        self.stats = {
            'server_start_time': time.time(),
            'total_requests': 0,
            'tool_calls': 0,
            'resource_accesses': 0,
            'active_sessions': 0
        }
        
        # Setup FastAPI app
        self.setup_fastapi()
        self.setup_routes()
        
        logger.info("🚀 MCP Server initialized successfully")

    def load_configuration(self, config_path: Optional[str] = None) -> Dict:
        """Load MCP server configuration"""
        try:
            if config_path is None:
                config_path = Path(__file__).parent.parent / "config.yaml"
            
            if Path(config_path).exists():
                with open(config_path, 'r') as f:
                    config = yaml.safe_load(f)
                logger.info(f"📋 Configuration loaded from {config_path}")
                return config
            else:
                logger.warning(f"⚠️ Config file not found: {config_path}, using defaults")
                return self.get_default_config()
                
        except Exception as e:
            logger.error(f"❌ Failed to load configuration: {e}")
            return self.get_default_config()

    def get_default_config(self) -> Dict:
        """Default MCP server configuration"""
        return {
            'server': {
                'host': '0.0.0.0',
                'port': 8766,
                'debug': True
            },
            'ai_models': {
                'vision_model': 'yolov8n.pt',
                'conversation_model': 'gpt-3.5-turbo',
                'voice_model': 'azure-tts'
            },
            'tools': {
                'vision_analysis': {'enabled': True, 'timeout': 30},
                'conversation': {'enabled': True, 'timeout': 15},
                'voice_synthesis': {'enabled': True, 'timeout': 10},
                'alerting': {'enabled': True, 'timeout': 5}
            },
            'resources': {
                'security_scripts': 'resources/security_scripts.json',
                'threat_profiles': 'resources/threat_profiles.yaml'
            }
        }

    def setup_fastapi(self):
        """Configure FastAPI application"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def setup_routes(self):
        """Setup FastAPI routes for MCP operations"""
        
        @self.app.get("/")
        async def root():
            return {
                "service": "APEX AI MCP Server",
                "status": "operational",
                "version": "1.0.0",
                "uptime": time.time() - self.stats['server_start_time'],
                "stats": self.stats
            }

        @self.app.get("/mcp/tools")
        async def list_tools():
            """List all available MCP tools"""
            return {
                "tools": [
                    {
                        "name": name,
                        "description": tool.description,
                        "enabled": tool.enabled,
                        "last_used": getattr(tool, 'last_used', None)
                    }
                    for name, tool in self.tools.items()
                ]
            }

        @self.app.get("/mcp/resources")
        async def list_resources():
            """List all available MCP resources"""
            return {
                "resources": list(self.resources.keys()),
                "total_resources": len(self.resources)
            }

        @self.app.post("/mcp/tools/{tool_name}/execute")
        async def execute_tool(tool_name: str, payload: Dict):
            """Execute a specific MCP tool"""
            return await self.execute_tool(tool_name, payload)

        @self.app.get("/mcp/resources/{resource_name}")
        async def get_resource(resource_name: str):
            """Get a specific MCP resource"""
            return await self.get_resource(resource_name)

        @self.app.websocket("/mcp/ws/{client_id}")
        async def websocket_endpoint(websocket: WebSocket, client_id: str):
            """WebSocket endpoint for real-time MCP communication"""
            await self.handle_websocket_client(websocket, client_id)

    async def initialize_tools(self):
        """Initialize all MCP tools"""
        try:
            logger.info("🔧 Initializing MCP tools...")
            
            # Initialize Vision Analysis Tool
            if self.config['tools']['vision_analysis']['enabled']:
                self.tools['vision_analysis'] = VisionAnalysisTool(
                    model_path=self.config['ai_models']['vision_model'],
                    config=self.config['tools']['vision_analysis']
                )
                await self.tools['vision_analysis'].initialize()
                logger.info("✅ Vision Analysis Tool initialized")

            # Initialize Conversation Tool
            if self.config['tools']['conversation']['enabled']:
                self.tools['conversation'] = ConversationTool(
                    model_name=self.config['ai_models']['conversation_model'],
                    config=self.config['tools']['conversation']
                )
                await self.tools['conversation'].initialize()
                logger.info("✅ Conversation Tool initialized")

            # Initialize Voice Synthesis Tool
            if self.config['tools']['voice_synthesis']['enabled']:
                self.tools['voice_synthesis'] = VoiceSynthesisTool(
                    model_name=self.config['ai_models']['voice_model'],
                    config=self.config['tools']['voice_synthesis']
                )
                await self.tools['voice_synthesis'].initialize()
                logger.info("✅ Voice Synthesis Tool initialized")

            # Initialize Alerting Tool
            if self.config['tools']['alerting']['enabled']:
                self.tools['alerting'] = AlertingTool(
                    config=self.config['tools']['alerting']
                )
                await self.tools['alerting'].initialize()
                logger.info("✅ Alerting Tool initialized")

            logger.info(f"🎯 {len(self.tools)} MCP tools initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize tools: {e}")
            logger.error(traceback.format_exc())

    async def initialize_resources(self):
        """Initialize all MCP resources"""
        try:
            logger.info("📚 Initializing MCP resources...")
            
            # Load security scripts
            scripts_path = Path(self.config['resources']['security_scripts'])
            if scripts_path.exists():
                with open(scripts_path, 'r') as f:
                    self.resources['security_scripts'] = json.load(f)
                logger.info("✅ Security scripts loaded")
            else:
                logger.warning(f"⚠️ Security scripts not found: {scripts_path}")
                self.resources['security_scripts'] = {}

            # Load threat profiles
            profiles_path = Path(self.config['resources']['threat_profiles'])
            if profiles_path.exists():
                with open(profiles_path, 'r') as f:
                    self.resources['threat_profiles'] = yaml.safe_load(f)
                logger.info("✅ Threat profiles loaded")
            else:
                logger.warning(f"⚠️ Threat profiles not found: {profiles_path}")
                self.resources['threat_profiles'] = {}

            logger.info(f"📋 {len(self.resources)} MCP resources initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize resources: {e}")
            logger.error(traceback.format_exc())

    async def execute_tool(self, tool_name: str, payload: Dict) -> Dict:
        """Execute a specific MCP tool"""
        try:
            self.stats['tool_calls'] += 1
            
            if tool_name not in self.tools:
                raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")
            
            tool = self.tools[tool_name]
            if not tool.enabled:
                raise HTTPException(status_code=400, detail=f"Tool '{tool_name}' is disabled")
            
            # Execute tool with timeout
            timeout = self.config['tools'].get(tool_name, {}).get('timeout', 30)
            result = await asyncio.wait_for(tool.execute(payload), timeout=timeout)
            
            # Update tool usage stats
            tool.last_used = datetime.now().isoformat()
            
            return {
                "success": True,
                "tool": tool_name,
                "result": result,
                "execution_time": result.get('execution_time', 0),
                "timestamp": datetime.now().isoformat()
            }
            
        except asyncio.TimeoutError:
            logger.error(f"⏰ Tool execution timeout: {tool_name}")
            raise HTTPException(status_code=408, detail=f"Tool '{tool_name}' execution timeout")
        except Exception as e:
            logger.error(f"❌ Tool execution error ({tool_name}): {e}")
            raise HTTPException(status_code=500, detail=f"Tool execution failed: {str(e)}")

    async def get_resource(self, resource_name: str) -> Dict:
        """Get a specific MCP resource"""
        try:
            self.stats['resource_accesses'] += 1
            
            if resource_name not in self.resources:
                raise HTTPException(status_code=404, detail=f"Resource '{resource_name}' not found")
            
            return {
                "success": True,
                "resource": resource_name,
                "data": self.resources[resource_name],
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Resource access error ({resource_name}): {e}")
            raise HTTPException(status_code=500, detail=f"Resource access failed: {str(e)}")

    async def handle_websocket_client(self, websocket: WebSocket, client_id: str):
        """Handle WebSocket client connections for real-time communication"""
        await websocket.accept()
        self.active_clients[client_id] = websocket
        self.stats['active_sessions'] += 1
        
        logger.info(f"🔌 WebSocket client connected: {client_id}")
        
        try:
            # Send initial status
            await websocket.send_text(json.dumps({
                "type": "connection_established",
                "client_id": client_id,
                "server_status": "operational",
                "available_tools": list(self.tools.keys()),
                "available_resources": list(self.resources.keys()),
                "timestamp": datetime.now().isoformat()
            }))
            
            # Handle incoming messages
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                response = await self.process_websocket_message(client_id, message)
                await websocket.send_text(json.dumps(response))
                
        except WebSocketDisconnect:
            logger.info(f"🔌 WebSocket client disconnected: {client_id}")
        except Exception as e:
            logger.error(f"❌ WebSocket error for client {client_id}: {e}")
        finally:
            if client_id in self.active_clients:
                del self.active_clients[client_id]
            self.stats['active_sessions'] -= 1

    async def process_websocket_message(self, client_id: str, message: Dict) -> Dict:
        """Process incoming WebSocket messages"""
        try:
            message_type = message.get('type')
            payload = message.get('payload', {})
            
            if message_type == 'execute_tool':
                tool_name = payload.get('tool_name')
                tool_payload = payload.get('payload', {})
                result = await self.execute_tool(tool_name, tool_payload)
                return {
                    "type": "tool_result",
                    "client_id": client_id,
                    "result": result
                }
                
            elif message_type == 'get_resource':
                resource_name = payload.get('resource_name')
                result = await self.get_resource(resource_name)
                return {
                    "type": "resource_data",
                    "client_id": client_id,
                    "result": result
                }
                
            elif message_type == 'ping':
                return {
                    "type": "pong",
                    "client_id": client_id,
                    "timestamp": datetime.now().isoformat()
                }
                
            else:
                return {
                    "type": "error",
                    "client_id": client_id,
                    "error": f"Unknown message type: {message_type}"
                }
                
        except Exception as e:
            logger.error(f"❌ WebSocket message processing error: {e}")
            return {
                "type": "error",
                "client_id": client_id,
                "error": str(e)
            }

    async def broadcast_to_clients(self, message: Dict, exclude_client: Optional[str] = None):
        """Broadcast message to all connected WebSocket clients"""
        for client_id, websocket in self.active_clients.items():
            if exclude_client and client_id == exclude_client:
                continue
                
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"❌ Failed to broadcast to client {client_id}: {e}")

    async def startup(self):
        """Server startup procedure"""
        logger.info("🚀 Starting APEX AI MCP Server...")
        
        # Initialize tools and resources
        await self.initialize_tools()
        await self.initialize_resources()
        
        logger.info("✅ MCP Server startup complete")

    async def shutdown(self):
        """Server shutdown procedure"""
        logger.info("🛑 Shutting down APEX AI MCP Server...")
        
        # Close all WebSocket connections
        for client_id, websocket in self.active_clients.items():
            try:
                await websocket.close()
            except Exception as e:
                logger.error(f"❌ Error closing WebSocket for {client_id}: {e}")
        
        # Shutdown tools
        for tool_name, tool in self.tools.items():
            try:
                if hasattr(tool, 'shutdown'):
                    await tool.shutdown()
            except Exception as e:
                logger.error(f"❌ Error shutting down tool {tool_name}: {e}")
        
        logger.info("✅ MCP Server shutdown complete")

# Global MCP server instance
mcp_server = MCPServer()

# FastAPI app instance for uvicorn
app = mcp_server.app

@app.on_event("startup")
async def startup_event():
    await mcp_server.startup()

@app.on_event("shutdown")
async def shutdown_event():
    await mcp_server.shutdown()

# Main execution
if __name__ == "__main__":
    print("\n" + "="*70)
    print("       🚀 APEX AI MCP SERVER - MODEL CONTEXT PROTOCOL")
    print("="*70)
    print("🧠 Central AI Orchestration Hub")
    print("🔧 MCP Tools: Vision, Conversation, Voice, Alerting")
    print("📚 MCP Resources: Security Scripts, Threat Profiles")
    print("🔌 WebSocket Support: Real-time Communication")
    print("🎯 Production Ready: FastAPI + Async/Await")
    print("="*70 + "\n")
    
    # Get configuration
    config = mcp_server.config
    host = config['server']['host']
    port = config['server']['port']
    debug = config['server']['debug']
    
    # Start server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
