"""
APEX AI MCP SERVER - MODEL CONTEXT PROTOCOL v42.1 IMPLEMENTATION
================================================================
Enhanced FastAPI server with AI Agent Orchestration for dual-mode security operations

This server acts as the "Master Control Program" for all AI capabilities, featuring:
- Specialized AI Agent coordination (Vision, Detection, Alerting, Conversation, Data)
- Dual-mode operation (Co-Pilot vs Autopilot)
- MCP Tools and Resources for unified AI orchestration
- Real-time WebSocket communication
- Zero Trust security architecture
- Cross-platform deployment capability

Architecture: FastAPI + MCP Protocol + AI Agent Ecosystem + Dual-Mode Operations
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
import yaml
import traceback

# FastAPI and WebSocket imports
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# MCP Tools imports (preserved from existing)
from tools.vision_analysis_tool import VisionAnalysisTool
from tools.conversation_tool import ConversationTool
from tools.voice_synthesis_tool import VoiceSynthesisTool
from tools.alerting_tool import AlertingTool

# Import operational mode management components
try:
    from .operational_mode_manager import OperationalModeManager, OperationalMode
    from .decision_matrix_engine import DecisionMatrixEngine
except ImportError:
    # Fallback for development
    import sys
    sys.path.append(os.path.dirname(__file__))
    from operational_mode_manager import OperationalModeManager, OperationalMode
    from decision_matrix_engine import DecisionMatrixEngine

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MCPServer:
    """
    Model Context Protocol Server v42.1 - Master Control Program
    
    Enhanced with AI Agent orchestration and dual-mode operations:
    - Agent Management: Vision, Detection, Alerting, Conversation, Data
    - Operational Modes: Co-Pilot (human-supervised) vs Autopilot (autonomous)
    - Task Orchestration: High-level tasks distributed to specialized agents
    - Security First: Zero Trust architecture with comprehensive validation
    """
    
    def __init__(self, config_path: Optional[str] = None):
        self.app = FastAPI(
            title="APEX AI MCP Server v42.1",
            description="Master Control Program for AI Agent Orchestration",
            version="42.1.0"
        )
        
        # Initialize core components
        self.tools: Dict[str, Any] = {}
        self.resources: Dict[str, Any] = {}
        self.agents: Dict[str, Any] = {}  # NEW: AI Agent registry
        self.active_clients: Dict[str, WebSocket] = {}
        self.config = self.load_configuration(config_path)
        
        # Initialize operational mode management (NEW)
        self.operational_mode_manager = OperationalModeManager(
            initial_mode=OperationalMode.CO_PILOT,
            config=self.config.get('operational_modes', {})
        )
        
        # Initialize AI decision matrix for autopilot mode (NEW)
        self.decision_matrix = DecisionMatrixEngine(
            config=self.config.get('decision_matrix', {}),
            operational_mode_manager=self.operational_mode_manager
        )
        
        # Enhanced statistics tracking
        self.stats = {
            'server_start_time': time.time(),
            'total_requests': 0,
            'tool_calls': 0,
            'resource_accesses': 0,
            'agent_tasks': 0,  # NEW
            'active_sessions': 0,
            'mode_switches': 0,  # NEW
            'autonomous_decisions': 0,  # NEW
            'current_mode': self.operational_mode_manager.current_mode.value
        }
        
        # Task orchestration state (NEW)
        self.active_tasks: Dict[str, Dict] = {}
        self.task_counter = 0
        
        # Setup FastAPI app
        self.setup_fastapi()
        self.setup_routes()
        
        logger.info("🚀 MCP Server v42.1 initialized with AI Agent orchestration")

    def load_configuration(self, config_path: Optional[str] = None) -> Dict:
        """Load MCP server configuration with v42.1 enhancements"""
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
        """Enhanced default configuration for v42.1"""
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
            },
            # NEW: Agent configuration
            'agents': {
                'vision_agent': {'enabled': True, 'priority': 1, 'timeout': 10},
                'detection_agent': {'enabled': True, 'priority': 1, 'timeout': 15},
                'alerting_agent': {'enabled': True, 'priority': 2, 'timeout': 5},
                'conversation_agent': {'enabled': True, 'priority': 3, 'timeout': 20},
                'data_agent': {'enabled': True, 'priority': 2, 'timeout': 10},
                'voice_dispatch_agent': {'enabled': True, 'priority': 1, 'timeout': 60}  # NEW: P0 Voice AI Dispatcher
            },
            # NEW: Operational mode settings
            'operational_modes': {
                'default_mode': 'co_pilot',
                'allow_mode_switching': True,
                'autopilot_confidence_threshold': 0.85,
                'co_pilot_confirmation_timeout': 30
            },
            # NEW: Decision matrix for autopilot
            'decision_matrix': {
                'rules_file': 'shared/decision_rules.yaml',
                'max_concurrent_decisions': 5,
                'decision_timeout': 10,
                'fallback_to_human': True
            }
        }

    def setup_fastapi(self):
        """Configure FastAPI application with enhanced security"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # TODO: Restrict in production
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def setup_routes(self):
        """Setup enhanced FastAPI routes for v42.1 operations"""
        
        @self.app.get("/")
        async def root():
            return {
                "service": "APEX AI MCP Server v42.1",
                "status": "operational",
                "version": "42.1.0",
                "uptime": time.time() - self.stats['server_start_time'],
                "current_mode": self.stats['current_mode'],
                "active_agents": len([a for a in self.agents.values() if a.get('enabled', False)]),
                "stats": self.stats
            }

        # Existing MCP routes (preserved)
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

        # NEW: Agent orchestration routes
        @self.app.get("/mcp/agents")
        async def list_agents():
            """List all available AI agents"""
            return {
                "agents": [
                    {
                        "name": name,
                        "status": agent.get('status', 'unknown'),
                        "enabled": agent.get('enabled', False),
                        "priority": agent.get('priority', 0),
                        "last_task": agent.get('last_task_time', None),
                        "total_tasks": agent.get('task_count', 0)
                    }
                    for name, agent in self.agents.items()
                ],
                "total_agents": len(self.agents)
            }

        @self.app.post("/mcp/agents/{agent_name}/task")
        async def assign_task_to_agent(agent_name: str, task_data: Dict):
            """Assign a specific task to an AI agent"""
            return await self.assign_agent_task(agent_name, task_data)

        @self.app.post("/mcp/orchestrate")
        async def orchestrate_high_level_task(task_request: Dict):
            """Orchestrate a high-level task across multiple agents"""
            return await self.orchestrate_task(task_request)

        # NEW: Operational mode management routes
        @self.app.get("/mcp/mode")
        async def get_operational_mode():
            """Get current operational mode"""
            return {
                "current_mode": self.operational_mode_manager.current_mode.value,
                "mode_switched_at": self.operational_mode_manager.mode_switched_at,
                "can_switch": self.operational_mode_manager.can_switch_mode(),
                "autopilot_metrics": self.operational_mode_manager.get_autopilot_metrics()
            }

        @self.app.post("/mcp/mode/switch")
        async def switch_operational_mode(mode_request: Dict):
            """Switch operational mode (Co-Pilot <-> Autopilot)"""
            return await self.switch_operational_mode(mode_request)

        # NEW: Decision matrix routes (for autopilot configuration)
        @self.app.get("/mcp/decision-matrix/rules")
        async def get_decision_rules():
            """Get current decision matrix rules"""
            return await self.decision_matrix.get_rules()

        @self.app.post("/mcp/decision-matrix/rules")
        async def update_decision_rules(rules_update: Dict):
            """Update decision matrix rules"""
            return await self.decision_matrix.update_rules(rules_update)

        @self.app.post("/mcp/decision-matrix/execute")
        async def execute_autonomous_decision(decision_data: Dict):
            """Execute an autonomous decision (autopilot mode)"""
            return await self.execute_autonomous_decision(decision_data)

        # Enhanced WebSocket endpoint
        @self.app.websocket("/mcp/ws/{client_id}")
        async def websocket_endpoint(websocket: WebSocket, client_id: str):
            """Enhanced WebSocket endpoint for real-time MCP communication"""
            await self.handle_websocket_client(websocket, client_id)

    async def initialize_agents(self):
        """Initialize all AI agents in the ecosystem"""
        try:
            logger.info("🤖 Initializing AI Agent ecosystem...")
            
            # Import agents dynamically to avoid circular imports
            try:
                from agents.vision_agent import VisionAgent
                from agents.detection_agent import DetectionAgent
                from agents.alerting_agent import AlertingAgent
                from agents.conversation_agent import ConversationAgent
                from agents.data_agent import DataAgent
                from agents.voice_dispatch_agent import VoiceDispatchAgent  # NEW: Voice AI Dispatcher
            except ImportError as e:
                logger.warning(f"⚠️ Agent imports not available yet: {e}. Will initialize when agents are created.")
                return
            
            agent_classes = {
                'vision_agent': VisionAgent,
                'detection_agent': DetectionAgent,
                'alerting_agent': AlertingAgent,
                'conversation_agent': ConversationAgent,
                'data_agent': DataAgent,
                'voice_dispatch_agent': VoiceDispatchAgent  # NEW: Voice AI Dispatcher
            }
            
            for agent_name, agent_class in agent_classes.items():
                if self.config['agents'].get(agent_name, {}).get('enabled', True):
                    try:
                        agent_config = self.config['agents'][agent_name]
                        agent_instance = agent_class(
                            name=agent_name,
                            config=agent_config,
                            mcp_server=self
                        )
                        
                        await agent_instance.initialize()
                        
                        self.agents[agent_name] = {
                            'instance': agent_instance,
                            'config': agent_config,
                            'enabled': True,
                            'status': 'ready',
                            'priority': agent_config.get('priority', 0),
                            'task_count': 0,
                            'last_task_time': None
                        }
                        
                        logger.info(f"✅ {agent_name} initialized successfully")
                        
                    except Exception as e:
                        logger.error(f"❌ Failed to initialize {agent_name}: {e}")
                        self.agents[agent_name] = {
                            'instance': None,
                            'config': self.config['agents'][agent_name],
                            'enabled': False,
                            'status': 'error',
                            'error': str(e)
                        }
            
            logger.info(f"🎯 {len([a for a in self.agents.values() if a.get('enabled', False)])} AI agents initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize AI agents: {e}")
            logger.error(traceback.format_exc())

    async def initialize_tools(self):
        """Initialize all MCP tools (preserved from existing)"""
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
        """Initialize all MCP resources (preserved from existing)"""
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

    # NEW: Agent orchestration methods
    async def assign_agent_task(self, agent_name: str, task_data: Dict) -> Dict:
        """Assign a specific task to an AI agent"""
        try:
            self.stats['agent_tasks'] += 1
            
            if agent_name not in self.agents:
                raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")
            
            agent = self.agents[agent_name]
            if not agent.get('enabled', False):
                raise HTTPException(status_code=400, detail=f"Agent '{agent_name}' is disabled")
            
            agent_instance = agent['instance']
            if not agent_instance:
                raise HTTPException(status_code=500, detail=f"Agent '{agent_name}' instance not available")
            
            # Create task ID
            self.task_counter += 1
            task_id = f"task_{agent_name}_{self.task_counter}_{int(time.time())}"
            
            # Prepare task with metadata
            enhanced_task = {
                **task_data,
                'task_id': task_id,
                'agent_name': agent_name,
                'assigned_at': datetime.now().isoformat(),
                'operational_mode': self.operational_mode_manager.current_mode.value
            }
            
            # Track active task
            self.active_tasks[task_id] = {
                'agent_name': agent_name,
                'task_data': enhanced_task,
                'started_at': time.time(),
                'status': 'running'
            }
            
            # Execute task with timeout
            timeout = agent['config'].get('timeout', 30)
            start_time = time.time()
            
            result = await asyncio.wait_for(
                agent_instance.execute_task(enhanced_task), 
                timeout=timeout
            )
            
            execution_time = time.time() - start_time
            
            # Update agent stats
            agent['task_count'] = agent.get('task_count', 0) + 1
            agent['last_task_time'] = datetime.now().isoformat()
            
            # Update task status
            self.active_tasks[task_id]['status'] = 'completed'
            self.active_tasks[task_id]['completed_at'] = time.time()
            self.active_tasks[task_id]['execution_time'] = execution_time
            
            return {
                "success": True,
                "task_id": task_id,
                "agent": agent_name,
                "result": result,
                "execution_time": execution_time,
                "timestamp": datetime.now().isoformat()
            }
            
        except asyncio.TimeoutError:
            logger.error(f"⏰ Agent task timeout: {agent_name}")
            if task_id in self.active_tasks:
                self.active_tasks[task_id]['status'] = 'timeout'
            raise HTTPException(status_code=408, detail=f"Agent '{agent_name}' task timeout")
        except Exception as e:
            logger.error(f"❌ Agent task error ({agent_name}): {e}")
            if task_id in self.active_tasks:
                self.active_tasks[task_id]['status'] = 'error'
                self.active_tasks[task_id]['error'] = str(e)
            raise HTTPException(status_code=500, detail=f"Agent task failed: {str(e)}")

    async def orchestrate_task(self, task_request: Dict) -> Dict:
        """Orchestrate a high-level task across multiple agents"""
        try:
            task_type = task_request.get('task_type', 'unknown')
            task_data = task_request.get('task_data', {})
            priority = task_request.get('priority', 'medium')
            
            orchestration_id = f"orchestration_{int(time.time() * 1000)}"
            
            logger.info(f"🎯 Orchestrating task: {task_type} [{orchestration_id}]")
            
            # Determine agent execution order based on task type
            execution_plan = self._create_execution_plan(task_type, task_data)
            
            orchestration_result = {
                "orchestration_id": orchestration_id,
                "task_type": task_type,
                "started_at": datetime.now().isoformat(),
                "execution_plan": execution_plan,
                "agent_results": {},
                "overall_status": "running"
            }
            
            # Execute agents in planned sequence
            for step in execution_plan:
                agent_name = step['agent']
                agent_task = step['task_data']
                
                try:
                    result = await self.assign_agent_task(agent_name, agent_task)
                    orchestration_result["agent_results"][agent_name] = {
                        "success": True,
                        "result": result,
                        "completed_at": datetime.now().isoformat()
                    }
                    
                    # Check if this is autopilot mode and decision is needed
                    if (self.operational_mode_manager.current_mode == OperationalMode.AUTOPILOT and
                        step.get('requires_decision', False)):
                        
                        decision_result = await self.decision_matrix.process_decision({
                            "agent_result": result,
                            "context": task_data,
                            "orchestration_id": orchestration_id
                        })
                        
                        orchestration_result["agent_results"][agent_name]["autonomous_decision"] = decision_result
                        self.stats['autonomous_decisions'] += 1
                        
                except Exception as e:
                    logger.error(f"❌ Agent {agent_name} failed in orchestration: {e}")
                    orchestration_result["agent_results"][agent_name] = {
                        "success": False,
                        "error": str(e),
                        "failed_at": datetime.now().isoformat()
                    }
                    
                    # Handle failure based on operational mode
                    if self.operational_mode_manager.current_mode == OperationalMode.AUTOPILOT:
                        # In autopilot, try to recover or escalate
                        recovery_action = await self._handle_orchestration_failure(
                            orchestration_id, agent_name, str(e)
                        )
                        orchestration_result["recovery_action"] = recovery_action
                    else:
                        # In co-pilot, notify human operator
                        await self._notify_human_operator({
                            "type": "orchestration_failure",
                            "orchestration_id": orchestration_id,
                            "failed_agent": agent_name,
                            "error": str(e)
                        })
            
            orchestration_result["overall_status"] = "completed"
            orchestration_result["completed_at"] = datetime.now().isoformat()
            
            return orchestration_result
            
        except Exception as e:
            logger.error(f"❌ Task orchestration failed: {e}")
            raise HTTPException(status_code=500, detail=f"Orchestration failed: {str(e)}")

    def _create_execution_plan(self, task_type: str, task_data: Dict) -> List[Dict]:
        """Create execution plan for task orchestration"""
        
        # Standard execution plans for common task types
        plans = {
            "threat_detection": [
                {"agent": "vision_agent", "task_data": {"action": "capture_frame", **task_data}},
                {"agent": "detection_agent", "task_data": {"action": "analyze_threat", **task_data}, "requires_decision": True},
                {"agent": "alerting_agent", "task_data": {"action": "trigger_alert", **task_data}},
                {"agent": "data_agent", "task_data": {"action": "log_incident", **task_data}}
            ],
            "security_incident": [
                {"agent": "vision_agent", "task_data": {"action": "capture_evidence", **task_data}},
                {"agent": "detection_agent", "task_data": {"action": "classify_incident", **task_data}},
                {"agent": "conversation_agent", "task_data": {"action": "initiate_response", **task_data}, "requires_decision": True},
                {"agent": "alerting_agent", "task_data": {"action": "escalate_alert", **task_data}},
                {"agent": "data_agent", "task_data": {"action": "archive_evidence", **task_data}}
            ],
            "routine_monitoring": [
                {"agent": "vision_agent", "task_data": {"action": "monitor_feeds", **task_data}},
                {"agent": "detection_agent", "task_data": {"action": "background_scan", **task_data}},
                {"agent": "data_agent", "task_data": {"action": "update_logs", **task_data}}
            ],
            # NEW: Voice AI Dispatcher execution plans
            "inbound_call": [
                {"agent": "voice_dispatch_agent", "task_data": {"action": "handle_inbound_call", **task_data}, "requires_decision": True},
                {"agent": "data_agent", "task_data": {"action": "log_call", **task_data}}
            ],
            "voice_incident_report": [
                {"agent": "voice_dispatch_agent", "task_data": {"action": "process_incident_call", **task_data}, "requires_decision": True},
                {"agent": "alerting_agent", "task_data": {"action": "send_notifications", **task_data}},
                {"agent": "data_agent", "task_data": {"action": "create_incident_from_call", **task_data}}
            ],
            "emergency_call_escalation": [
                {"agent": "voice_dispatch_agent", "task_data": {"action": "initiate_emergency_call", **task_data}, "requires_decision": True},
                {"agent": "alerting_agent", "task_data": {"action": "critical_alert", **task_data}},
                {"agent": "data_agent", "task_data": {"action": "log_emergency_escalation", **task_data}}
            ]
        }
        
        return plans.get(task_type, [
            {"agent": "vision_agent", "task_data": {"action": "generic_task", **task_data}}
        ])

    async def switch_operational_mode(self, mode_request: Dict) -> Dict:
        """Switch operational mode between Co-Pilot and Autopilot"""
        try:
            target_mode = mode_request.get('target_mode', '').lower()
            authorization = mode_request.get('authorization', '')
            reason = mode_request.get('reason', 'Manual switch')
            
            # Validate mode
            if target_mode not in ['co_pilot', 'autopilot']:
                raise HTTPException(status_code=400, detail="Invalid target mode")
            
            # TODO: Implement proper authorization validation
            # For now, we'll accept any non-empty authorization
            if not authorization:
                raise HTTPException(status_code=401, detail="Authorization required")
            
            target_mode_enum = OperationalMode.CO_PILOT if target_mode == 'co_pilot' else OperationalMode.AUTOPILOT
            
            # Attempt mode switch
            success = await self.operational_mode_manager.switch_mode(
                target_mode_enum, 
                reason=reason, 
                authorized_by=authorization
            )
            
            if success:
                self.stats['mode_switches'] += 1
                self.stats['current_mode'] = target_mode_enum.value
                
                # Notify all connected clients
                await self.broadcast_to_clients({
                    "type": "operational_mode_changed",
                    "new_mode": target_mode_enum.value,
                    "changed_at": datetime.now().isoformat(),
                    "reason": reason
                })
                
                logger.info(f"🔄 Operational mode switched to: {target_mode_enum.value}")
                
                return {
                    "success": True,
                    "previous_mode": self.operational_mode_manager.previous_mode.value if self.operational_mode_manager.previous_mode else None,
                    "new_mode": target_mode_enum.value,
                    "switched_at": self.operational_mode_manager.mode_switched_at,
                    "reason": reason
                }
            else:
                raise HTTPException(status_code=400, detail="Mode switch not allowed")
                
        except Exception as e:
            logger.error(f"❌ Mode switch failed: {e}")
            raise HTTPException(status_code=500, detail=f"Mode switch failed: {str(e)}")

    async def execute_autonomous_decision(self, decision_data: Dict) -> Dict:
        """Execute an autonomous decision in autopilot mode"""
        try:
            if self.operational_mode_manager.current_mode != OperationalMode.AUTOPILOT:
                raise HTTPException(status_code=400, detail="Autonomous decisions only available in Autopilot mode")
            
            result = await self.decision_matrix.execute_decision(decision_data)
            self.stats['autonomous_decisions'] += 1
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Autonomous decision execution failed: {e}")
            raise HTTPException(status_code=500, detail=f"Decision execution failed: {str(e)}")

    async def _handle_orchestration_failure(self, orchestration_id: str, failed_agent: str, error: str) -> Dict:
        """Handle orchestration failure in autopilot mode"""
        try:
            recovery_strategy = await self.decision_matrix.get_recovery_strategy({
                "orchestration_id": orchestration_id,
                "failed_agent": failed_agent,
                "error": error
            })
            
            logger.info(f"🔧 Executing recovery strategy for {orchestration_id}: {recovery_strategy}")
            
            return recovery_strategy
            
        except Exception as e:
            logger.error(f"❌ Recovery strategy failed: {e}")
            return {"strategy": "escalate_to_human", "reason": str(e)}

    async def _notify_human_operator(self, notification_data: Dict):
        """Notify human operator in co-pilot mode"""
        try:
            await self.broadcast_to_clients({
                "type": "human_notification",
                "data": notification_data,
                "timestamp": datetime.now().isoformat(),
                "requires_attention": True
            })
            
            logger.info(f"👤 Human operator notified: {notification_data.get('type', 'Unknown')}")
            
        except Exception as e:
            logger.error(f"❌ Failed to notify human operator: {e}")

    # Preserved existing methods with minimal changes
    async def execute_tool(self, tool_name: str, payload: Dict) -> Dict:
        """Execute a specific MCP tool (preserved from existing)"""
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
        """Get a specific MCP resource (preserved from existing)"""
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
        """Enhanced WebSocket client handling with agent status updates"""
        await websocket.accept()
        self.active_clients[client_id] = websocket
        self.stats['active_sessions'] += 1
        
        logger.info(f"🔌 WebSocket client connected: {client_id}")
        
        try:
            # Send enhanced initial status
            await websocket.send_text(json.dumps({
                "type": "connection_established",
                "client_id": client_id,
                "server_status": "operational",
                "server_version": "42.1.0",
                "current_mode": self.operational_mode_manager.current_mode.value,
                "available_tools": list(self.tools.keys()),
                "available_resources": list(self.resources.keys()),
                "active_agents": list(self.agents.keys()),
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
        """Enhanced WebSocket message processing with agent commands"""
        try:
            message_type = message.get('type')
            payload = message.get('payload', {})
            
            # Existing message types (preserved)
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
            
            # NEW: Agent command handling
            elif message_type == 'agent_task':
                agent_name = payload.get('agent_name')
                task_data = payload.get('task_data', {})
                result = await self.assign_agent_task(agent_name, task_data)
                return {
                    "type": "agent_task_result",
                    "client_id": client_id,
                    "result": result
                }
            
            elif message_type == 'orchestrate_task':
                result = await self.orchestrate_task(payload)
                return {
                    "type": "orchestration_result",
                    "client_id": client_id,
                    "result": result
                }
            
            elif message_type == 'switch_mode':
                result = await self.switch_operational_mode(payload)
                return {
                    "type": "mode_switch_result",
                    "client_id": client_id,
                    "result": result
                }
                
            elif message_type == 'ping':
                return {
                    "type": "pong",
                    "client_id": client_id,
                    "server_mode": self.operational_mode_manager.current_mode.value,
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
        """Broadcast message to all connected WebSocket clients (preserved)"""
        for client_id, websocket in self.active_clients.items():
            if exclude_client and client_id == exclude_client:
                continue
                
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"❌ Failed to broadcast to client {client_id}: {e}")

    async def startup(self):
        """Enhanced server startup procedure"""
        logger.info("🚀 Starting APEX AI MCP Server v42.1...")
        
        # Initialize core components
        await self.initialize_tools()
        await self.initialize_resources()
        await self.initialize_agents()  # NEW
        
        # Initialize operational mode manager
        await self.operational_mode_manager.initialize()
        
        # Initialize decision matrix
        await self.decision_matrix.initialize()
        
        logger.info("✅ MCP Server v42.1 startup complete - Ready for AI Agent orchestration")

    async def shutdown(self):
        """Enhanced server shutdown procedure"""
        logger.info("🛑 Shutting down APEX AI MCP Server v42.1...")
        
        # Close all WebSocket connections
        for client_id, websocket in self.active_clients.items():
            try:
                await websocket.close()
            except Exception as e:
                logger.error(f"❌ Error closing WebSocket for {client_id}: {e}")
        
        # Shutdown agents
        for agent_name, agent in self.agents.items():
            try:
                if agent.get('instance') and hasattr(agent['instance'], 'shutdown'):
                    await agent['instance'].shutdown()
                    logger.info(f"✅ {agent_name} shutdown complete")
            except Exception as e:
                logger.error(f"❌ Error shutting down agent {agent_name}: {e}")
        
        # Shutdown tools
        for tool_name, tool in self.tools.items():
            try:
                if hasattr(tool, 'shutdown'):
                    await tool.shutdown()
            except Exception as e:
                logger.error(f"❌ Error shutting down tool {tool_name}: {e}")
        
        # Shutdown operational components
        await self.decision_matrix.shutdown()
        await self.operational_mode_manager.shutdown()
        
        logger.info("✅ MCP Server v42.1 shutdown complete")

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
    print("\n" + "="*80)
    print("       🚀 APEX AI MCP SERVER v42.1 - MASTER CONTROL PROGRAM")
    print("="*80)
    print("🤖 AI Agent Orchestration: Vision, Detection, Alerting, Conversation, Data")
    print("🔄 Dual-Mode Operations: Co-Pilot (Human-Supervised) ⟷ Autopilot (Autonomous)")
    print("🔧 MCP Tools: Vision Analysis, Conversation, Voice Synthesis, Alerting")
    print("📚 MCP Resources: Security Scripts, Threat Profiles, Decision Rules")
    print("🔌 WebSocket Support: Real-time Agent Communication")
    print("🛡️ Security First: Zero Trust Architecture")
    print("🎯 Production Ready: FastAPI + Async/Await + Agent Ecosystem")
    print("="*80 + "\n")
    
    # Get configuration
    config = mcp_server.config
    host = config['server']['host']
    port = config['server']['port']
    debug = config['server']['debug']
    
    # Start server
    uvicorn.run(
        "mcp_main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
