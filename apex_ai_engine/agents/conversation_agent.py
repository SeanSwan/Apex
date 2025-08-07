"""
APEX AI CONVERSATION AGENT
==========================
Specialized AI agent for voice communication and conversation management

This agent encapsulates all AI conversation logic including voice synthesis,
speech recognition, conversation management, and de-escalation protocols.

Features:
- AI-powered conversation management with suspects/persons
- Pre-defined security scripts and dynamic responses
- Voice synthesis and speech recognition
- Conversation logging and analysis
- Escalation and de-escalation protocols
- Multi-language support
- Legal compliance and recording

Agent Responsibilities:
- Manage 2-way voice communication
- Process conversation requests from other agents
- Generate contextual AI responses
- Handle voice synthesis and speech recognition
- Log conversations for compliance and analysis
- Manage conversation escalation procedures
"""

import asyncio
import json
import logging
import time
import threading
from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from collections import deque
import queue

# Voice processing imports
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("⚠️ OpenAI not available - conversation will use simulation mode")

try:
    import speech_recognition as sr
    import pyttsx3
    VOICE_PROCESSING_AVAILABLE = True
except ImportError:
    VOICE_PROCESSING_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("⚠️ Voice processing libraries not available")

# Import existing conversation engine
try:
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from ai_voice.ai_conversation_engine import *
    AI_VOICE_AVAILABLE = True
except ImportError as e:
    # Fallback for development
    AI_VOICE_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning(f"⚠️ AI conversation engine not available - using simulation mode: {e}")

logger = logging.getLogger(__name__)

class ConversationStatus(Enum):
    """Conversation session status"""
    INACTIVE = "inactive"
    INITIALIZING = "initializing"
    ACTIVE = "active"
    LISTENING = "listening"
    PROCESSING = "processing"
    RESPONDING = "responding"
    PAUSED = "paused"
    COMPLETED = "completed"
    ERROR = "error"

class ConversationType(Enum):
    """Types of conversations"""
    DE_ESCALATION = "de_escalation"
    WARNING = "warning"
    GREETING = "greeting"
    INVESTIGATION = "investigation"
    EMERGENCY_RESPONSE = "emergency_response"
    GENERAL = "general"

class ResponseMode(Enum):
    """AI response modes"""
    SCRIPTED = "scripted"      # Use pre-defined scripts
    DYNAMIC = "dynamic"        # AI-generated responses
    HYBRID = "hybrid"          # Combination of scripted and dynamic

@dataclass
class ConversationSession:
    """Represents an active conversation session"""
    session_id: str
    conversation_type: ConversationType
    zone_id: str
    source_id: str
    status: ConversationStatus
    response_mode: ResponseMode
    started_at: str
    participant_count: int = 1
    language: str = "en"
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = None
    messages: List[Dict[str, Any]] = None
    audio_enabled: bool = True
    recording_enabled: bool = True

@dataclass
class ConversationTask:
    """Represents a conversation task"""
    task_id: str
    action: str  # initiate_response, process_speech, generate_response, etc.
    session_id: Optional[str] = None
    parameters: Dict[str, Any] = None
    priority: int = 1
    timestamp: str = None

class ConversationAgent:
    """
    Conversation Agent for APEX AI system
    
    Manages AI-powered conversations and voice interactions with detected
    persons for de-escalation, warnings, and other security protocols.
    """
    
    def __init__(self, name: str, config: Dict[str, Any], mcp_server=None):
        self.name = name
        self.config = config
        self.mcp_server = mcp_server
        
        # Agent state
        self.enabled = True
        self.status = "initializing"
        self.task_queue = asyncio.Queue()
        self.active_tasks: Dict[str, ConversationTask] = {}
        
        # Conversation engines
        self.openai_client = None
        self.tts_engine = None
        self.speech_recognizer = None
        
        # Conversation management
        self.active_sessions: Dict[str, ConversationSession] = {}
        self.conversation_history: List[ConversationSession] = []
        self.max_history_size = config.get('max_history_size', 500)
        self.session_counter = 0
        
        # Voice settings
        self.enable_voice_synthesis = config.get('enable_voice_synthesis', True)
        self.enable_speech_recognition = config.get('enable_speech_recognition', True)
        self.voice_rate = config.get('voice_rate', 150)
        self.voice_volume = config.get('voice_volume', 0.8)
        self.default_language = config.get('default_language', 'en')
        
        # AI settings
        self.openai_api_key = config.get('openai_api_key', '')
        self.ai_model = config.get('ai_model', 'gpt-3.5-turbo')
        self.max_response_tokens = config.get('max_response_tokens', 150)
        self.response_temperature = config.get('response_temperature', 0.7)
        
        # Conversation scripts
        self.conversation_scripts = config.get('conversation_scripts', {})
        self.default_response_mode = ResponseMode(config.get('default_response_mode', 'hybrid'))
        
        # Security and compliance
        self.enable_recording = config.get('enable_recording', True)
        self.max_conversation_duration = config.get('max_conversation_duration', 300)  # 5 minutes
        self.auto_escalation_keywords = config.get('auto_escalation_keywords', [
            'help', 'police', 'emergency', 'weapon', 'gun', 'knife', 'hurt', 'attack'
        ])
        
        # Performance metrics
        self.metrics = {
            'total_conversations': 0,
            'active_conversations': 0,
            'completed_conversations': 0,
            'escalated_conversations': 0,
            'average_conversation_duration': 0.0,
            'successful_de_escalations': 0,
            'voice_synthesis_calls': 0,
            'speech_recognition_calls': 0,
            'ai_response_generations': 0,
            'error_count': 0,
            'last_conversation_time': None
        }
        
        # Threading
        self.worker_thread: Optional[threading.Thread] = None
        self.voice_processing_thread: Optional[threading.Thread] = None
        self.shutdown_event = threading.Event()
        
        # Processing queues
        self.conversation_queue = queue.Queue(maxsize=50)
        self.voice_processing_queue = queue.Queue(maxsize=100)
        
        logger.info(f"🗣️ Conversation Agent '{name}' initialized")
    
    async def initialize(self):
        """Initialize the Conversation Agent"""
        try:
            self.status = "initializing"
            
            # Initialize AI and voice components
            await self._initialize_ai_components()
            await self._initialize_voice_components()
            
            # Load conversation scripts
            await self._load_conversation_scripts()
            
            # Start worker threads
            await self._start_worker_threads()
            
            self.status = "ready"
            logger.info(f"✅ Conversation Agent '{self.name}' initialized successfully")
            
        except Exception as e:
            self.status = "error"
            logger.error(f"❌ Conversation Agent initialization failed: {e}")
            raise
    
    async def _initialize_ai_components(self):
        """Initialize AI components (OpenAI, etc.)"""
        try:
            if OPENAI_AVAILABLE and self.openai_api_key:
                openai.api_key = self.openai_api_key
                self.openai_client = openai
                
                # Test API connection
                try:
                    test_response = await self._generate_ai_response(
                        "Test connection", "testing", conversation_type=ConversationType.GENERAL
                    )
                    logger.info("✅ OpenAI API connection successful")
                except Exception as e:
                    logger.warning(f"⚠️ OpenAI API test failed: {e}")
                    self.openai_client = None
            else:
                logger.warning("⚠️ OpenAI not available or API key not configured")
                self.openai_client = None
                
        except Exception as e:
            logger.error(f"❌ AI components initialization failed: {e}")
    
    async def _initialize_voice_components(self):
        """Initialize voice synthesis and recognition components"""
        try:
            # Initialize Text-to-Speech
            if self.enable_voice_synthesis and VOICE_PROCESSING_AVAILABLE:
                try:
                    self.tts_engine = pyttsx3.init()
                    self.tts_engine.setProperty('rate', self.voice_rate)
                    self.tts_engine.setProperty('volume', self.voice_volume)
                    logger.info("✅ Text-to-Speech engine initialized")
                except Exception as e:
                    logger.warning(f"⚠️ TTS initialization failed: {e}")
                    self.tts_engine = None
            
            # Initialize Speech Recognition
            if self.enable_speech_recognition and VOICE_PROCESSING_AVAILABLE:
                try:
                    self.speech_recognizer = sr.Recognizer()
                    logger.info("✅ Speech recognition initialized")
                except Exception as e:
                    logger.warning(f"⚠️ Speech recognition initialization failed: {e}")
                    self.speech_recognizer = None
            
        except Exception as e:
            logger.error(f"❌ Voice components initialization failed: {e}")
    
    async def _load_conversation_scripts(self):
        """Load pre-defined conversation scripts"""
        try:
            # Default scripts if none provided
            if not self.conversation_scripts:
                self.conversation_scripts = {
                    'GREETING': {
                        'type': 'greeting',
                        'messages': [
                            "Hello! This area is under video surveillance for security purposes.",
                            "Good day! Please be aware that this area is monitored for safety.",
                            "Welcome! This location is equipped with security monitoring."
                        ]
                    },
                    'TRESPASSING': {
                        'type': 'warning',
                        'messages': [
                            "Attention! This is a restricted area. Please exit immediately.",
                            "Warning: You are in a private area. Please leave now.",
                            "This is private property. Unauthorized access is prohibited."
                        ]
                    },
                    'DE_ESCALATION': {
                        'type': 'de_escalation',
                        'messages': [
                            "Please remain calm. Security personnel have been notified.",
                            "Let's resolve this peacefully. Help is on the way.",
                            "Please step back and remain calm. We want to help you."
                        ]
                    },
                    'WEAPON_DETECTED': {
                        'type': 'emergency_response',
                        'messages': [
                            "Stop! Put down any weapons immediately and raise your hands!",
                            "Weapon detected! Drop everything and put your hands up!",
                            "Security alert! Drop all items and raise your hands above your head!"
                        ]
                    },
                    'PACKAGE_THEFT': {
                        'type': 'warning',
                        'messages': [
                            "Stop! Package theft is a felony. Return the item immediately.",
                            "You are being recorded. Please return the package now.",
                            "Package theft is illegal. Put the item back and leave."
                        ]
                    },
                    'FINAL_WARNING': {
                        'type': 'escalation',
                        'messages': [
                            "Final warning! Leave immediately or authorities will be called.",
                            "Last chance! Exit now or police will be contacted.",
                            "This is your final warning. Authorities are being notified."
                        ]
                    }
                }
            
            logger.info(f"📜 Loaded {len(self.conversation_scripts)} conversation scripts")
            
        except Exception as e:
            logger.error(f"❌ Script loading failed: {e}")
    
    async def _start_worker_threads(self):
        """Start background worker threads"""
        try:
            # Start main conversation processing thread
            self.worker_thread = threading.Thread(
                target=self._conversation_worker_main,
                name=f"{self.name}_conversation_worker",
                daemon=True
            )
            self.worker_thread.start()
            
            # Start voice processing thread
            self.voice_processing_thread = threading.Thread(
                target=self._voice_processing_worker_main,
                name=f"{self.name}_voice_worker",
                daemon=True
            )
            self.voice_processing_thread.start()
            
            logger.info(f"✅ Worker threads started for Conversation Agent '{self.name}'")
            
        except Exception as e:
            logger.error(f"❌ Failed to start worker threads: {e}")
            raise
    
    def _conversation_worker_main(self):
        """Main conversation processing worker thread"""
        logger.info(f"🔄 Conversation Agent worker thread started: {self.name}")
        
        while not self.shutdown_event.is_set():
            try:
                # Process conversation queue
                try:
                    conversation_task = self.conversation_queue.get(timeout=1.0)
                    self._process_conversation_task(conversation_task)
                    self.conversation_queue.task_done()
                except queue.Empty:
                    continue
                    
                # Check for session timeouts
                self._check_session_timeouts()
                
            except Exception as e:
                logger.error(f"❌ Conversation worker error: {e}")
                self.metrics['error_count'] += 1
                time.sleep(1)
    
    def _voice_processing_worker_main(self):
        """Voice processing worker thread"""
        logger.info(f"🎤 Conversation Agent voice processing thread started: {self.name}")
        
        while not self.shutdown_event.is_set():
            try:
                # Process voice queue
                try:
                    voice_task = self.voice_processing_queue.get(timeout=1.0)
                    self._process_voice_task(voice_task)
                    self.voice_processing_queue.task_done()
                except queue.Empty:
                    continue
                    
            except Exception as e:
                logger.error(f"❌ Voice processing worker error: {e}")
                self.metrics['error_count'] += 1
                time.sleep(1)
    
    def _process_conversation_task(self, task: ConversationTask):
        """Process a single conversation task"""
        try:
            start_time = time.time()
            
            action = task.action
            session_id = task.session_id
            parameters = task.parameters or {}
            
            logger.debug(f"🎯 Processing conversation task: {action} [{task.task_id}]")
            
            # Process based on action type
            if action == 'initiate_conversation':
                self._handle_initiate_conversation(parameters)
            elif action == 'process_message':
                self._handle_process_message(session_id, parameters)
            elif action == 'generate_response':
                self._handle_generate_response(session_id, parameters)
            elif action == 'escalate_conversation':
                self._handle_escalate_conversation(session_id, parameters)
            elif action == 'end_conversation':
                self._handle_end_conversation(session_id, parameters)
            else:
                logger.warning(f"⚠️ Unknown conversation action: {action}")
                return
            
            processing_time = time.time() - start_time
            logger.debug(f"✅ Processed conversation task {task.task_id} in {processing_time:.3f}s")
            
        except Exception as e:
            logger.error(f"❌ Conversation task processing error: {e}")
            self.metrics['error_count'] += 1
    
    def _process_voice_task(self, voice_task: Dict[str, Any]):
        """Process a voice-related task"""
        try:
            task_type = voice_task.get('type', 'unknown')
            
            if task_type == 'synthesize_speech':
                self._handle_speech_synthesis(voice_task)
            elif task_type == 'recognize_speech':
                self._handle_speech_recognition(voice_task)
            else:
                logger.warning(f"⚠️ Unknown voice task type: {task_type}")
            
        except Exception as e:
            logger.error(f"❌ Voice task processing error: {e}")
    
    def _handle_initiate_conversation(self, parameters: Dict[str, Any]):
        """Handle conversation initiation"""
        try:
            conversation_type_str = parameters.get('conversation_type', 'general')
            try:
                conversation_type = ConversationType(conversation_type_str.lower())
            except ValueError:
                conversation_type = ConversationType.GENERAL
            
            zone_id = parameters.get('zone_id', 'unknown')
            source_id = parameters.get('source_id', 'unknown')
            script_id = parameters.get('script_id')
            
            # Create new conversation session
            self.session_counter += 1
            session_id = f"conv_{self.session_counter}_{int(time.time() * 1000)}"
            
            session = ConversationSession(
                session_id=session_id,
                conversation_type=conversation_type,
                zone_id=zone_id,
                source_id=source_id,
                status=ConversationStatus.INITIALIZING,
                response_mode=self.default_response_mode,
                started_at=datetime.now().isoformat(),
                language=parameters.get('language', self.default_language),
                metadata=parameters.copy(),
                messages=[],
                audio_enabled=parameters.get('audio_enabled', True),
                recording_enabled=parameters.get('recording_enabled', self.enable_recording)
            )
            
            self.active_sessions[session_id] = session
            
            # Generate initial message
            if script_id and script_id in self.conversation_scripts:
                initial_message = self._get_scripted_message(script_id)
            else:
                initial_message = self._generate_initial_message(conversation_type, parameters)
            
            # Add initial message to session
            session.messages.append({
                'role': 'assistant',
                'content': initial_message,
                'timestamp': datetime.now().isoformat(),
                'type': 'initial'
            })
            
            # Queue voice synthesis
            if session.audio_enabled:
                self._queue_voice_synthesis(session_id, initial_message)
            
            session.status = ConversationStatus.ACTIVE
            
            self.metrics['total_conversations'] += 1
            self.metrics['active_conversations'] += 1
            self.metrics['last_conversation_time'] = session.started_at
            
            logger.info(f"🗣️ Conversation initiated: {session_id} - {conversation_type.value} in {zone_id}")
            
        except Exception as e:
            logger.error(f"❌ Initiate conversation error: {e}")
    
    def _handle_process_message(self, session_id: str, parameters: Dict[str, Any]):
        """Handle processing of incoming message"""
        try:
            if session_id not in self.active_sessions:
                logger.warning(f"⚠️ Process message for unknown session: {session_id}")
                return
            
            session = self.active_sessions[session_id]
            message_content = parameters.get('message', '')
            message_type = parameters.get('type', 'user')
            
            # Add message to session
            session.messages.append({
                'role': 'user' if message_type == 'user' else 'system',
                'content': message_content,
                'timestamp': datetime.now().isoformat(),
                'type': message_type
            })
            
            # Check for escalation keywords
            if self._check_escalation_keywords(message_content):
                self._handle_escalate_conversation(session_id, {'reason': 'Keyword detected'})
                return
            
            # Generate response
            self._handle_generate_response(session_id, parameters)
            
        except Exception as e:
            logger.error(f"❌ Process message error: {e}")
    
    def _handle_generate_response(self, session_id: str, parameters: Dict[str, Any]):
        """Handle response generation"""
        try:
            if session_id not in self.active_sessions:
                logger.warning(f"⚠️ Generate response for unknown session: {session_id}")
                return
            
            session = self.active_sessions[session_id]
            session.status = ConversationStatus.PROCESSING
            
            # Generate response based on mode
            if session.response_mode == ResponseMode.SCRIPTED:
                response = self._generate_scripted_response(session, parameters)
            elif session.response_mode == ResponseMode.DYNAMIC:
                response = asyncio.run(self._generate_ai_response_sync(session, parameters))
            else:  # HYBRID
                response = self._generate_hybrid_response(session, parameters)
            
            if response:
                # Add response to session
                session.messages.append({
                    'role': 'assistant',
                    'content': response,
                    'timestamp': datetime.now().isoformat(),
                    'type': 'response'
                })
                
                # Queue voice synthesis
                if session.audio_enabled:
                    self._queue_voice_synthesis(session_id, response)
                
                session.status = ConversationStatus.ACTIVE
                
                self.metrics['ai_response_generations'] += 1
                
                logger.debug(f"💬 Response generated for {session_id}")
                
        except Exception as e:
            logger.error(f"❌ Generate response error: {e}")
            session.status = ConversationStatus.ERROR
    
    def _handle_escalate_conversation(self, session_id: str, parameters: Dict[str, Any]):
        """Handle conversation escalation"""
        try:
            if session_id not in self.active_sessions:
                logger.warning(f"⚠️ Escalate unknown session: {session_id}")
                return
            
            session = self.active_sessions[session_id]
            reason = parameters.get('reason', 'Manual escalation')
            
            # Add escalation message
            escalation_message = "This conversation is being escalated to human security personnel."
            session.messages.append({
                'role': 'system',
                'content': f"ESCALATED: {reason}",
                'timestamp': datetime.now().isoformat(),
                'type': 'escalation'
            })
            
            # Send escalation message
            if session.audio_enabled:
                self._queue_voice_synthesis(session_id, escalation_message)
            
            # Update metrics
            self.metrics['escalated_conversations'] += 1
            
            # End conversation
            self._handle_end_conversation(session_id, {'reason': f'Escalated: {reason}'})
            
            logger.warning(f"🔥 Conversation escalated: {session_id} - {reason}")
            
        except Exception as e:
            logger.error(f"❌ Escalate conversation error: {e}")
    
    def _handle_end_conversation(self, session_id: str, parameters: Dict[str, Any]):
        """Handle conversation ending"""
        try:
            if session_id not in self.active_sessions:
                logger.warning(f"⚠️ End unknown session: {session_id}")
                return
            
            session = self.active_sessions[session_id]
            reason = parameters.get('reason', 'Manual termination')
            
            session.status = ConversationStatus.COMPLETED
            session.completed_at = datetime.now().isoformat()
            session.metadata['end_reason'] = reason
            
            # Calculate duration
            if session.started_at and session.completed_at:
                started = datetime.fromisoformat(session.started_at)
                completed = datetime.fromisoformat(session.completed_at)
                duration = (completed - started).total_seconds()
                
                # Update average duration
                total_completed = self.metrics['completed_conversations'] + 1
                current_avg = self.metrics['average_conversation_duration']
                new_avg = ((current_avg * (total_completed - 1)) + duration) / total_completed
                self.metrics['average_conversation_duration'] = new_avg
            
            # Move to history
            self.conversation_history.append(session)
            del self.active_sessions[session_id]
            
            # Maintain history size
            if len(self.conversation_history) > self.max_history_size:
                self.conversation_history.pop(0)
            
            # Final message
            if session.audio_enabled:
                final_message = "Thank you. This conversation is now complete."
                self._queue_voice_synthesis(session_id, final_message)
            
            self.metrics['completed_conversations'] += 1
            self.metrics['active_conversations'] -= 1
            
            logger.info(f"✅ Conversation ended: {session_id} - {reason}")
            
        except Exception as e:
            logger.error(f"❌ End conversation error: {e}")
    
    def _get_scripted_message(self, script_id: str) -> str:
        """Get a message from pre-defined scripts"""
        try:
            if script_id in self.conversation_scripts:
                script = self.conversation_scripts[script_id]
                messages = script.get('messages', [])
                if messages:
                    import random
                    return random.choice(messages)
            
            return "Please be aware that this area is under security monitoring."
            
        except Exception as e:
            logger.error(f"❌ Get scripted message error: {e}")
            return "Security alert: This area is monitored."
    
    def _generate_initial_message(self, conversation_type: ConversationType, parameters: Dict[str, Any]) -> str:
        """Generate initial conversation message"""
        try:
            if conversation_type == ConversationType.GREETING:
                return "Hello! This area is under video surveillance for security purposes."
            elif conversation_type == ConversationType.WARNING:
                return "Attention! This is a restricted area. Please comply with security protocols."
            elif conversation_type == ConversationType.DE_ESCALATION:
                return "Please remain calm. Let's resolve this situation peacefully."
            elif conversation_type == ConversationType.EMERGENCY_RESPONSE:
                return "Security alert! Please follow instructions immediately."
            else:
                return "Security monitoring active. Please be aware of your surroundings."
                
        except Exception as e:
            logger.error(f"❌ Generate initial message error: {e}")
            return "Security system active."
    
    def _generate_scripted_response(self, session: ConversationSession, parameters: Dict[str, Any]) -> str:
        """Generate response using scripted messages"""
        try:
            # Simple scripted responses based on conversation type
            if session.conversation_type == ConversationType.DE_ESCALATION:
                responses = [
                    "Please remain calm and cooperate.",
                    "Help is on the way. Please stay where you are.",
                    "We want to resolve this peacefully."
                ]
            elif session.conversation_type == ConversationType.WARNING:
                responses = [
                    "Please exit the area immediately.",
                    "This is your final warning.",
                    "Compliance is required."
                ]
            else:
                responses = [
                    "Thank you for your cooperation.",
                    "Please follow security guidelines.",
                    "Security personnel have been notified."
                ]
            
            import random
            return random.choice(responses)
            
        except Exception as e:
            logger.error(f"❌ Generate scripted response error: {e}")
            return "Please comply with security protocols."
    
    async def _generate_ai_response_sync(self, session: ConversationSession, parameters: Dict[str, Any]) -> str:
        """Generate AI response synchronously (for thread compatibility)"""
        try:
            return await self._generate_ai_response(
                session.messages[-1]['content'] if session.messages else "",
                session.session_id,
                session.conversation_type
            )
        except Exception as e:
            logger.error(f"❌ AI response sync error: {e}")
            return "I understand. Please follow security guidelines."
    
    async def _generate_ai_response(self, message: str, session_id: str, 
                                  conversation_type: ConversationType) -> str:
        """Generate AI response using OpenAI"""
        try:
            if not self.openai_client:
                return self._generate_fallback_response(message, conversation_type)
            
            # Create system prompt based on conversation type
            system_prompt = self._create_system_prompt(conversation_type)
            
            # Generate response using OpenAI
            response = await self.openai_client.ChatCompletion.acreate(
                model=self.ai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                max_tokens=self.max_response_tokens,
                temperature=self.response_temperature
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Filter response for safety
            filtered_response = self._filter_ai_response(ai_response)
            
            return filtered_response
            
        except Exception as e:
            logger.error(f"❌ AI response generation error: {e}")
            return self._generate_fallback_response(message, conversation_type)
    
    def _generate_hybrid_response(self, session: ConversationSession, parameters: Dict[str, Any]) -> str:
        """Generate hybrid response (combination of scripted and AI)"""
        try:
            # Use scripted for certain types, AI for others
            if session.conversation_type in [ConversationType.EMERGENCY_RESPONSE, ConversationType.WARNING]:
                return self._generate_scripted_response(session, parameters)
            else:
                return asyncio.run(self._generate_ai_response_sync(session, parameters))
                
        except Exception as e:
            logger.error(f"❌ Generate hybrid response error: {e}")
            return "Please comply with security protocols."
    
    def _create_system_prompt(self, conversation_type: ConversationType) -> str:
        """Create system prompt for AI based on conversation type"""
        base_prompt = """You are a professional security AI assistant. Keep responses brief, calm, and professional. 
        Focus on de-escalation and compliance. Never use threatening language."""
        
        if conversation_type == ConversationType.DE_ESCALATION:
            return base_prompt + " Your goal is to calm the situation and encourage cooperation."
        elif conversation_type == ConversationType.WARNING:
            return base_prompt + " You need to clearly communicate rules and consequences."
        elif conversation_type == ConversationType.EMERGENCY_RESPONSE:
            return base_prompt + " This is an emergency. Be direct but professional."
        else:
            return base_prompt + " Provide helpful and courteous responses."
    
    def _filter_ai_response(self, response: str) -> str:
        """Filter AI response for safety and compliance"""
        try:
            # Remove potentially problematic content
            filtered = response
            
            # Limit length
            if len(filtered) > 200:
                filtered = filtered[:197] + "..."
            
            # Ensure professional tone
            if not filtered or len(filtered.strip()) < 5:
                filtered = "Thank you for your cooperation."
            
            return filtered
            
        except Exception as e:
            logger.error(f"❌ Response filtering error: {e}")
            return "Please follow security guidelines."
    
    def _generate_fallback_response(self, message: str, conversation_type: ConversationType) -> str:
        """Generate fallback response when AI is unavailable"""
        fallback_responses = {
            ConversationType.DE_ESCALATION: "Please remain calm. Security personnel will assist you.",
            ConversationType.WARNING: "Please comply with security protocols immediately.",
            ConversationType.EMERGENCY_RESPONSE: "Emergency protocols activated. Please follow instructions.",
            ConversationType.GREETING: "Thank you. Please be aware of security monitoring.",
            ConversationType.GENERAL: "Thank you for your cooperation."
        }
        
        return fallback_responses.get(conversation_type, "Please follow security guidelines.")
    
    def _check_escalation_keywords(self, message: str) -> bool:
        """Check if message contains escalation keywords"""
        try:
            message_lower = message.lower()
            return any(keyword in message_lower for keyword in self.auto_escalation_keywords)
        except Exception as e:
            logger.error(f"❌ Escalation keyword check error: {e}")
            return False
    
    def _queue_voice_synthesis(self, session_id: str, message: str):
        """Queue voice synthesis task"""
        try:
            voice_task = {
                'type': 'synthesize_speech',
                'session_id': session_id,
                'message': message,
                'timestamp': datetime.now().isoformat()
            }
            
            self.voice_processing_queue.put(voice_task, timeout=1.0)
            
        except queue.Full:
            logger.warning(f"⚠️ Voice processing queue full - dropping synthesis task")
        except Exception as e:
            logger.error(f"❌ Queue voice synthesis error: {e}")
    
    def _handle_speech_synthesis(self, voice_task: Dict[str, Any]):
        """Handle speech synthesis"""
        try:
            message = voice_task.get('message', '')
            session_id = voice_task.get('session_id', 'unknown')
            
            if self.tts_engine and message:
                # Synthesize speech
                self.tts_engine.say(message)
                self.tts_engine.runAndWait()
                
                self.metrics['voice_synthesis_calls'] += 1
                logger.debug(f"🔊 Speech synthesized for session {session_id}")
            else:
                logger.debug(f"🔇 Speech synthesis skipped (no engine or message)")
                
        except Exception as e:
            logger.error(f"❌ Speech synthesis error: {e}")
    
    def _handle_speech_recognition(self, voice_task: Dict[str, Any]):
        """Handle speech recognition"""
        try:
            session_id = voice_task.get('session_id', 'unknown')
            
            if self.speech_recognizer:
                # This would implement actual speech recognition
                # For now, we'll simulate it
                recognized_text = "Simulated speech recognition result"
                
                # Process recognized speech
                self._handle_process_message(session_id, {
                    'message': recognized_text,
                    'type': 'user_speech'
                })
                
                self.metrics['speech_recognition_calls'] += 1
                logger.debug(f"🎤 Speech recognized for session {session_id}")
                
        except Exception as e:
            logger.error(f"❌ Speech recognition error: {e}")
    
    def _check_session_timeouts(self):
        """Check for conversation session timeouts"""
        try:
            current_time = datetime.now()
            timed_out_sessions = []
            
            for session_id, session in self.active_sessions.items():
                if session.status == ConversationStatus.ACTIVE:
                    started_time = datetime.fromisoformat(session.started_at)
                    duration = (current_time - started_time).total_seconds()
                    
                    if duration > self.max_conversation_duration:
                        timed_out_sessions.append(session_id)
            
            # End timed out sessions
            for session_id in timed_out_sessions:
                self._handle_end_conversation(session_id, {'reason': 'Timeout'})
                
        except Exception as e:
            logger.error(f"❌ Session timeout check error: {e}")
    
    async def execute_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a task assigned by the MCP Server"""
        try:
            task_id = task_data.get('task_id', 'unknown')
            action = task_data.get('action', 'unknown')
            parameters = task_data.get('parameters', {})
            
            logger.info(f"🎯 Executing Conversation Agent task: {action} [{task_id}]")
            
            start_time = time.time()
            
            # Execute based on action type
            if action == 'initiate_response':
                result = await self._handle_initiate_response_task(parameters)
            elif action == 'process_speech':
                result = await self._handle_process_speech_task(parameters)
            elif action == 'generate_response':
                result = await self._handle_generate_response_task(parameters)
            elif action == 'end_conversation':
                result = await self._handle_end_conversation_task(parameters)
            elif action == 'get_active_conversations':
                result = await self._handle_get_active_conversations(parameters)
            elif action == 'get_status':
                result = await self._handle_get_status(parameters)
            else:
                result = {
                    'success': False,
                    'error': f'Unknown action: {action}',
                    'supported_actions': ['initiate_response', 'process_speech', 'generate_response', 
                                        'end_conversation', 'get_active_conversations', 'get_status']
                }
            
            execution_time = time.time() - start_time
            
            # Add execution metadata
            result['execution_time'] = execution_time
            result['task_id'] = task_id
            result['agent'] = self.name
            result['timestamp'] = datetime.now().isoformat()
            
            logger.info(f"✅ Conversation Agent task completed: {action} in {execution_time:.3f}s")
            
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
    
    async def _handle_initiate_response_task(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle initiate response task"""
        try:
            # Create conversation task
            conversation_task = ConversationTask(
                task_id=f"initiate_{int(time.time() * 1000)}",
                action='initiate_conversation',
                parameters=parameters
            )
            
            # Add to processing queue
            try:
                self.conversation_queue.put(conversation_task, timeout=1.0)
                
                return {
                    'success': True,
                    'task_queued': True,
                    'conversation_task_id': conversation_task.task_id,
                    'queue_size': self.conversation_queue.qsize()
                }
            except queue.Full:
                return {
                    'success': False,
                    'error': 'Conversation queue is full',
                    'queue_size': self.conversation_queue.qsize()
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def _handle_process_speech_task(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle process speech task"""
        # Similar structure to other task handlers
        return await self._handle_initiate_response_task(parameters)
    
    async def _handle_generate_response_task(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle generate response task"""
        # Similar structure to other task handlers
        return await self._handle_initiate_response_task(parameters)
    
    async def _handle_end_conversation_task(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle end conversation task"""
        # Similar structure to other task handlers
        return await self._handle_initiate_response_task(parameters)
    
    async def _handle_get_active_conversations(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Handle get active conversations request"""
        try:
            # Convert sessions to serializable format
            conversations_data = []
            for session in self.active_sessions.values():
                conversation_data = {
                    'session_id': session.session_id,
                    'conversation_type': session.conversation_type.value,
                    'zone_id': session.zone_id,
                    'source_id': session.source_id,
                    'status': session.status.value,
                    'response_mode': session.response_mode.value,
                    'started_at': session.started_at,
                    'participant_count': session.participant_count,
                    'language': session.language,
                    'audio_enabled': session.audio_enabled,
                    'recording_enabled': session.recording_enabled,
                    'message_count': len(session.messages) if session.messages else 0
                }
                conversations_data.append(conversation_data)
            
            return {
                'success': True,
                'active_conversations': conversations_data,
                'total_conversations': len(conversations_data)
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
                'active_conversations': len(self.active_sessions),
                'conversation_history_size': len(self.conversation_history),
                'conversation_queue_size': self.conversation_queue.qsize(),
                'voice_queue_size': self.voice_processing_queue.qsize(),
                'metrics': self.metrics.copy(),
                'configuration': {
                    'enable_voice_synthesis': self.enable_voice_synthesis,
                    'enable_speech_recognition': self.enable_speech_recognition,
                    'enable_recording': self.enable_recording,
                    'max_conversation_duration': self.max_conversation_duration,
                    'default_response_mode': self.default_response_mode.value,
                    'ai_model': self.ai_model
                },
                'engines_status': {
                    'openai_client': self.openai_client is not None,
                    'tts_engine': self.tts_engine is not None,
                    'speech_recognizer': self.speech_recognizer is not None
                },
                'available_scripts': list(self.conversation_scripts.keys())
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_agent_info(self) -> Dict[str, Any]:
        """Get comprehensive agent information"""
        return {
            'name': self.name,
            'type': 'conversation_agent',
            'status': self.status,
            'enabled': self.enabled,
            'config': self.config,
            'capabilities': [
                'initiate_response',
                'process_speech',
                'generate_response',
                'end_conversation',
                'get_active_conversations',
                'get_status'
            ],
            'active_conversations': len(self.active_sessions),
            'available_scripts': len(self.conversation_scripts),
            'metrics': self.metrics.copy(),
            'uptime': time.time() - getattr(self, '_start_time', time.time())
        }
    
    async def shutdown(self):
        """Shutdown the Conversation Agent"""
        try:
            logger.info(f"🛑 Shutting down Conversation Agent '{self.name}'")
            
            self.status = "shutting_down"
            self.shutdown_event.set()
            
            # End all active conversations
            for session_id in list(self.active_sessions.keys()):
                self._handle_end_conversation(session_id, {'reason': 'System shutdown'})
            
            # Wait for threads to finish
            if self.worker_thread and self.worker_thread.is_alive():
                self.worker_thread.join(timeout=5)
            
            if self.voice_processing_thread and self.voice_processing_thread.is_alive():
                self.voice_processing_thread.join(timeout=5)
            
            # Cleanup voice components
            if self.tts_engine:
                try:
                    self.tts_engine.stop()
                except:
                    pass
                self.tts_engine = None
            
            # Clear data structures
            self.active_sessions.clear()
            self.active_tasks.clear()
            
            self.status = "shutdown"
            logger.info(f"✅ Conversation Agent '{self.name}' shutdown complete")
            
        except Exception as e:
            logger.error(f"❌ Conversation Agent shutdown error: {e}")
            self.status = "error"
