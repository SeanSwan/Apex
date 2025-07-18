"""
APEX AI CONVERSATION ENGINE
===========================
AI-powered conversation system for suspect interaction and de-escalation
Manages 2-way voice communication between AI and detected persons

Features:
- Real-time AI conversation management
- Pre-defined security scripts
- Dynamic ChatGPT integration for responses
- Voice synthesis and recognition
- Conversation logging and analysis
- Escalation and de-escalation protocols
- Multi-language support
- Legal compliance and recording

Priority: P1 HIGH - Critical for proactive threat mitigation
"""

import asyncio
import json
import logging
import time
from typing import Dict, List, Tuple, Optional, Any, Callable
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, asdict
import threading
from collections import deque
import re

# Text-to-Speech and Speech-to-Text imports
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("⚠️ OpenAI not available. Install with: pip install openai")

try:
    import speech_recognition as sr
    SPEECH_RECOGNITION_AVAILABLE = True
except ImportError:
    SPEECH_RECOGNITION_AVAILABLE = False
    print("⚠️ SpeechRecognition not available. Install with: pip install SpeechRecognition")

try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False
    print("⚠️ pyttsx3 not available. Install with: pip install pyttsx3")

# Import threat models for threat level definitions
try:
    from models import ThreatLevel, ThreatType
    THREAT_MODELS_AVAILABLE = True
except ImportError:
    THREAT_MODELS_AVAILABLE = False
    # Fallback threat levels
    class ThreatLevel(Enum):
        LOW = 1
        MEDIUM = 2
        HIGH = 3
        CRITICAL = 4

logger = logging.getLogger(__name__)

class ConversationState(Enum):
    """States of AI conversation"""
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    SPEAKING = "speaking"
    WAITING_RESPONSE = "waiting_response"
    ESCALATED = "escalated"
    COMPLETED = "completed"
    ERROR = "error"

class ConversationType(Enum):
    """Types of AI conversations"""
    WARNING = "warning"
    INQUIRY = "inquiry"
    DE_ESCALATION = "de_escalation"
    INSTRUCTION = "instruction"
    EMERGENCY = "emergency"
    CUSTOM = "custom"

class ResponseMode(Enum):
    """AI response generation modes"""
    SCRIPTED = "scripted"
    DYNAMIC = "dynamic"
    HYBRID = "hybrid"

@dataclass
class ConversationMessage:
    """Individual message in a conversation"""
    timestamp: datetime
    speaker: str  # 'ai' or 'person'
    content: str
    audio_file: Optional[str] = None
    confidence: float = 1.0
    language: str = 'en'
    metadata: Dict[str, Any] = None

@dataclass
class ConversationSession:
    """Complete conversation session data"""
    session_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    conversation_type: ConversationType = ConversationType.WARNING
    threat_level: ThreatLevel = ThreatLevel.MEDIUM
    person_id: Optional[str] = None
    location: str = "unknown"
    camera_id: str = "unknown"
    state: ConversationState = ConversationState.IDLE
    messages: List[ConversationMessage] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.messages is None:
            self.messages = []
        if self.metadata is None:
            self.metadata = {}

class AIConversationEngine:
    """
    Advanced AI conversation engine for security applications
    
    Manages intelligent conversations with detected persons for
    de-escalation, warnings, and information gathering.
    """
    
    def __init__(self, openai_api_key: str = None, config: Dict[str, Any] = None):
        """
        Initialize the AI conversation engine
        
        Args:
            openai_api_key: OpenAI API key for dynamic responses
            config: Configuration dictionary
        """
        self.config = config or {}
        self.openai_api_key = openai_api_key
        
        # Initialize OpenAI if available
        if OPENAI_AVAILABLE and openai_api_key:
            openai.api_key = openai_api_key
            self.openai_enabled = True
        else:
            self.openai_enabled = False
            logger.warning("⚠️ OpenAI not available - using scripted responses only")
        
        # Initialize TTS engine
        self.tts_engine = None
        if PYTTSX3_AVAILABLE:
            self._initialize_tts()
        
        # Initialize speech recognition
        self.speech_recognizer = None
        if SPEECH_RECOGNITION_AVAILABLE:
            self.speech_recognizer = sr.Recognizer()
        
        # Active conversations
        self.active_conversations = {}  # session_id -> ConversationSession
        self.conversation_history = deque(maxlen=1000)
        
        # Pre-defined conversation scripts
        self.conversation_scripts = self._load_conversation_scripts()
        
        # AI personality and behavior settings
        self.ai_persona = {
            'name': 'APEX Security AI',
            'tone': 'professional but friendly',
            'language_style': 'clear and authoritative',
            'de_escalation_approach': 'calm and understanding',
            'emergency_tone': 'urgent but controlled'
        }
        
        # Conversation rules and limitations
        self.conversation_rules = {
            'max_conversation_time': 300,  # 5 minutes max
            'max_response_length': 100,    # Max words per response
            'prohibited_topics': ['personal information', 'unrelated topics'],
            'escalation_triggers': ['threats', 'violence', 'weapons'],
            'auto_escalate_threshold': 3,  # Number of failed attempts
            'recording_enabled': True,
            'legal_disclaimer': True
        }
        
        # Performance tracking
        self.conversation_stats = {
            'total_conversations': 0,
            'successful_de_escalations': 0,
            'escalated_conversations': 0,
            'average_conversation_time': 0.0,
            'response_time_avg': 0.0
        }
        
        # Thread safety
        self._lock = threading.Lock()
        
        logger.info("🎙️ AI Conversation Engine initialized")
    
    def _initialize_tts(self):
        """Initialize text-to-speech engine"""
        try:
            self.tts_engine = pyttsx3.init()
            
            # Configure TTS settings
            voices = self.tts_engine.getProperty('voices')
            if voices:
                # Prefer female voice for less threatening tone
                for voice in voices:
                    if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                        self.tts_engine.setProperty('voice', voice.id)
                        break
            
            # Set speech rate and volume
            self.tts_engine.setProperty('rate', 150)  # Slightly slower for clarity
            self.tts_engine.setProperty('volume', 0.8)
            
            logger.info("✅ TTS engine initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize TTS engine: {e}")
            self.tts_engine = None
    
    def _load_conversation_scripts(self) -> Dict[str, Dict[str, List[str]]]:
        """Load pre-defined conversation scripts"""
        return {
            # WARNING SCRIPTS
            ConversationType.WARNING.value: {
                ThreatLevel.LOW.name: [
                    "Hello, this is APEX Security. Please be aware that you are in a monitored area.",
                    "For your safety and the safety of others, please follow all posted guidelines.",
                    "Thank you for your cooperation."
                ],
                ThreatLevel.MEDIUM.name: [
                    "Attention, this is APEX Security. We have detected unusual activity in your area.",
                    "Please ensure you are authorized to be in this location.",
                    "If you need assistance, please contact security immediately."
                ],
                ThreatLevel.HIGH.name: [
                    "This is APEX Security with an urgent message.",
                    "You are currently in a restricted area. Please exit immediately.",
                    "Security personnel are being notified. Please comply with all instructions."
                ],
                ThreatLevel.CRITICAL.name: [
                    "IMMEDIATE SECURITY ALERT: This is APEX Security.",
                    "You must stop all activity and remain where you are.",
                    "Security personnel are responding. Do not move from your current location."
                ]
            },
            
            # DE-ESCALATION SCRIPTS  
            ConversationType.DE_ESCALATION.value: {
                ThreatLevel.MEDIUM.name: [
                    "I understand there may be some confusion. Let me help clarify the situation.",
                    "Everyone's safety is our priority. Can you help me understand what's happening?",
                    "We want to resolve this peacefully. Please let me know how I can assist you."
                ],
                ThreatLevel.HIGH.name: [
                    "I can see this is a stressful situation. Let's work together to resolve it calmly.",
                    "Your safety and everyone else's safety is what matters most right now.",
                    "Please take a deep breath. We can sort this out if we communicate clearly."
                ],
                ThreatLevel.CRITICAL.name: [
                    "I understand you may be upset, but we need to keep everyone safe.",
                    "Let's talk about this calmly. Violence is not the solution.",
                    "Help is available. Please put down any weapons and let's discuss this peacefully."
                ]
            },
            
            # INQUIRY SCRIPTS
            ConversationType.INQUIRY.value: {
                'general': [
                    "Excuse me, this is APEX Security. May I ask what brings you to this area?",
                    "Are you authorized to be in this location?",
                    "Do you need any assistance or directions?"
                ],
                'identification': [
                    "For security purposes, could you please identify yourself?",
                    "Do you have any identification or authorization to be here?",
                    "Are you a resident, visitor, or staff member?"
                ]
            },
            
            # INSTRUCTION SCRIPTS
            ConversationType.INSTRUCTION.value: {
                'exit': [
                    "Please exit the area immediately through the nearest marked exit.",
                    "For safety reasons, you need to leave this location now.",
                    "Follow the exit signs and proceed calmly to the main entrance."
                ],
                'compliance': [
                    "Please remain calm and follow all security instructions.",
                    "For everyone's safety, please comply with all directives.",
                    "Your cooperation is essential for maintaining security."
                ]
            },
            
            # EMERGENCY SCRIPTS
            ConversationType.EMERGENCY.value: {
                'weapon_detected': [
                    "STOP. Drop any weapons immediately and put your hands where I can see them.",
                    "Do not move. Security and emergency services are responding.",
                    "Your safety depends on your immediate compliance with these instructions."
                ],
                'violence_detected': [
                    "STOP all aggressive behavior immediately.",
                    "Separate yourselves and remain calm. Help is on the way.",
                    "Any continued violence will result in immediate law enforcement response."
                ]
            }
        }
    
    async def start_conversation(self, trigger_data: Dict[str, Any]) -> str:
        """
        Start a new AI conversation based on threat detection
        
        Args:
            trigger_data: Data about the detected threat/person
        
        Returns:
            str: Session ID for the conversation
        """
        session_id = f"conv_{int(time.time() * 1000)}"
        
        # Extract conversation parameters
        threat_level = trigger_data.get('threat_level', ThreatLevel.MEDIUM)
        threat_type = trigger_data.get('threat_type', 'unknown')
        location = trigger_data.get('location', 'unknown')
        camera_id = trigger_data.get('camera_id', 'unknown')
        person_id = trigger_data.get('person_id')
        
        # Determine conversation type based on threat
        conversation_type = self._determine_conversation_type(threat_type, threat_level)
        
        # Create conversation session
        session = ConversationSession(
            session_id=session_id,
            start_time=datetime.now(),
            conversation_type=conversation_type,
            threat_level=threat_level,
            person_id=person_id,
            location=location,
            camera_id=camera_id,
            state=ConversationState.IDLE,
            metadata={
                'trigger_data': trigger_data,
                'threat_type': threat_type,
                'initial_response_mode': self._select_response_mode(conversation_type, threat_level)
            }
        )
        
        with self._lock:
            self.active_conversations[session_id] = session
        
        # Start the conversation with initial message
        await self._send_initial_message(session_id)
        
        logger.info(f"🎙️ Started {conversation_type.value} conversation {session_id} for {threat_type} ({threat_level.name})")
        
        return session_id
    
    def _determine_conversation_type(self, threat_type: str, threat_level: ThreatLevel) -> ConversationType:
        """Determine appropriate conversation type based on threat"""
        if threat_type in ['weapon', 'violence'] or threat_level == ThreatLevel.CRITICAL:
            return ConversationType.EMERGENCY
        elif threat_type in ['trespassing', 'vandalism']:
            return ConversationType.WARNING
        elif threat_type in ['transient_activity', 'package_theft']:
            return ConversationType.INQUIRY
        elif threat_level == ThreatLevel.HIGH:
            return ConversationType.DE_ESCALATION
        else:
            return ConversationType.WARNING
    
    def _select_response_mode(self, conversation_type: ConversationType, threat_level: ThreatLevel) -> ResponseMode:
        """Select appropriate response generation mode"""
        if threat_level == ThreatLevel.CRITICAL or conversation_type == ConversationType.EMERGENCY:
            return ResponseMode.SCRIPTED  # Use reliable scripts for emergencies
        elif self.openai_enabled and threat_level in [ThreatLevel.HIGH, ThreatLevel.MEDIUM]:
            return ResponseMode.HYBRID  # Mix scripts with dynamic responses
        else:
            return ResponseMode.SCRIPTED  # Default to scripts
    
    async def _send_initial_message(self, session_id: str):
        """Send the initial AI message to start conversation"""
        session = self.active_conversations.get(session_id)
        if not session:
            return
        
        session.state = ConversationState.PROCESSING
        
        # Get initial script message
        script_messages = self._get_script_messages(session.conversation_type, session.threat_level)
        if script_messages:
            initial_message = script_messages[0]
            
            # Add legal disclaimer if required
            if self.conversation_rules['legal_disclaimer']:
                initial_message = "This conversation is being recorded for security purposes. " + initial_message
            
            # Create and add message
            message = ConversationMessage(
                timestamp=datetime.now(),
                speaker='ai',
                content=initial_message,
                metadata={'script_based': True, 'message_index': 0}
            )
            
            session.messages.append(message)
            session.state = ConversationState.SPEAKING
            
            # Synthesize and play speech
            await self._synthesize_and_play_speech(session_id, initial_message)
            
            # Wait for response
            session.state = ConversationState.WAITING_RESPONSE
            
            # Start listening for response
            asyncio.create_task(self._listen_for_response(session_id))
    
    def _get_script_messages(self, conversation_type: ConversationType, threat_level: ThreatLevel) -> Optional[List[str]]:
        """Get script messages for conversation type and threat level"""
        scripts = self.conversation_scripts.get(conversation_type.value, {})
        
        # Try to get scripts for specific threat level
        level_scripts = scripts.get(threat_level.name)
        if level_scripts:
            return level_scripts
        
        # Fallback to general scripts
        return scripts.get('general', None)
    
    async def _synthesize_and_play_speech(self, session_id: str, text: str):
        """Synthesize speech and play it"""
        if not self.tts_engine:
            logger.warning("⚠️ TTS engine not available")
            return
        
        try:
            # Generate speech file
            audio_file = f"conversation_{session_id}_{int(time.time())}.wav"
            
            # Synthesize speech (this is a simplified implementation)
            # In production, you might use more advanced TTS services
            self.tts_engine.save_to_file(text, audio_file)
            self.tts_engine.runAndWait()
            
            # Update message with audio file
            session = self.active_conversations.get(session_id)
            if session and session.messages:
                session.messages[-1].audio_file = audio_file
            
            logger.debug(f"🔊 Synthesized speech: {text[:50]}...")
            
        except Exception as e:
            logger.error(f"❌ Speech synthesis error: {e}")
    
    async def _listen_for_response(self, session_id: str, timeout: int = 30):
        """Listen for audio response from person"""
        if not self.speech_recognizer:
            logger.warning("⚠️ Speech recognition not available")
            return
        
        session = self.active_conversations.get(session_id)
        if not session:
            return
        
        session.state = ConversationState.LISTENING
        
        try:
            # This is a simplified implementation
            # In production, you would implement proper audio capture and processing
            await asyncio.sleep(timeout)  # Simulate listening period
            
            # Simulate received response (in production, this would be actual speech recognition)
            simulated_response = self._generate_simulated_response(session)
            
            if simulated_response:
                await self._process_person_response(session_id, simulated_response)
            else:
                # No response received
                await self._handle_no_response(session_id)
            
        except Exception as e:
            logger.error(f"❌ Speech recognition error: {e}")
            session.state = ConversationState.ERROR
    
    def _generate_simulated_response(self, session: ConversationSession) -> Optional[str]:
        """Generate simulated person response for testing"""
        # This is for testing - in production, this would be actual speech recognition
        responses = [
            "I'm sorry, I didn't know I wasn't supposed to be here.",
            "I'm just looking for the bathroom.",
            "I work here, I have my ID.",
            "I'm waiting for someone.",
            None  # No response
        ]
        
        import random
        return random.choice(responses)
    
    async def _process_person_response(self, session_id: str, response_text: str):
        """Process response from person and generate AI reply"""
        session = self.active_conversations.get(session_id)
        if not session:
            return
        
        session.state = ConversationState.PROCESSING
        
        # Add person's message to conversation
        person_message = ConversationMessage(
            timestamp=datetime.now(),
            speaker='person',
            content=response_text,
            confidence=0.8,  # Simulated confidence
            metadata={'recognition_method': 'speech_to_text'}
        )
        
        session.messages.append(person_message)
        
        # Analyze response and generate AI reply
        ai_response = await self._generate_ai_response(session_id, response_text)
        
        if ai_response:
            # Add AI response message
            ai_message = ConversationMessage(
                timestamp=datetime.now(),
                speaker='ai',
                content=ai_response,
                metadata={'generation_method': session.metadata.get('initial_response_mode', 'scripted')}
            )
            
            session.messages.append(ai_message)
            session.state = ConversationState.SPEAKING
            
            # Synthesize and play response
            await self._synthesize_and_play_speech(session_id, ai_response)
            
            # Check if conversation should continue or end
            if self._should_continue_conversation(session):
                session.state = ConversationState.WAITING_RESPONSE
                asyncio.create_task(self._listen_for_response(session_id))
            else:
                await self._end_conversation(session_id, 'completed')
    
    async def _generate_ai_response(self, session_id: str, person_input: str) -> str:
        """Generate AI response based on person's input"""
        session = self.active_conversations.get(session_id)
        if not session:
            return "I'm sorry, there was an error. Please contact security."
        
        response_mode = session.metadata.get('initial_response_mode', ResponseMode.SCRIPTED)
        
        if response_mode == ResponseMode.SCRIPTED:
            return self._generate_scripted_response(session, person_input)
        elif response_mode == ResponseMode.DYNAMIC and self.openai_enabled:
            return await self._generate_dynamic_response(session, person_input)
        elif response_mode == ResponseMode.HYBRID:
            # Try dynamic first, fallback to scripted
            try:
                if self.openai_enabled:
                    return await self._generate_dynamic_response(session, person_input)
            except Exception as e:
                logger.warning(f"⚠️ Dynamic response failed, using scripted: {e}")
            return self._generate_scripted_response(session, person_input)
        else:
            return self._generate_scripted_response(session, person_input)
    
    def _generate_scripted_response(self, session: ConversationSession, person_input: str) -> str:
        """Generate response using pre-defined scripts"""
        # Analyze person's input for keywords
        input_lower = person_input.lower()
        
        # Check for escalation triggers
        if any(trigger in input_lower for trigger in self.conversation_rules['escalation_triggers']):
            return "I understand you're upset. Please remain calm. Security personnel are being contacted immediately."
        
        # Check for compliance indicators
        if any(word in input_lower for word in ['sorry', 'didn\'t know', 'mistake', 'leaving']):
            return "Thank you for your cooperation. Please exit the area safely and have a good day."
        
        # Check for identification/authorization
        if any(word in input_lower for word in ['work here', 'live here', 'have id', 'authorized']):
            return "Please show your identification or authorization to the nearest security personnel."
        
        # Check for confusion/questions
        if any(word in input_lower for word in ['where', 'how', 'why', 'what', 'confused']):
            return "I understand you may be confused. Please contact security at the front desk for assistance."
        
        # Default response based on conversation type
        if session.conversation_type == ConversationType.WARNING:
            return "Please follow the posted guidelines and exit the area if you are not authorized to be here."
        elif session.conversation_type == ConversationType.DE_ESCALATION:
            return "Let's work together to resolve this situation calmly. Please follow any instructions from security personnel."
        else:
            return "Please contact security personnel for further assistance."
    
    async def _generate_dynamic_response(self, session: ConversationSession, person_input: str) -> str:
        """Generate dynamic response using OpenAI"""
        if not self.openai_enabled:
            raise Exception("OpenAI not available")
        
        # Build context for AI
        context = self._build_conversation_context(session)
        
        # Create prompt for OpenAI
        prompt = f"""You are {self.ai_persona['name']}, a professional security AI assistant. 
        
Context: {context}

Conversation so far:
"""
        
        for msg in session.messages[-3:]:  # Include last 3 messages for context
            speaker = "Security AI" if msg.speaker == 'ai' else "Person"
            prompt += f"{speaker}: {msg.content}\n"
        
        prompt += f"Person: {person_input}\nSecurity AI:"
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": f"You are a professional security AI with a {self.ai_persona['tone']} tone. Keep responses under {self.conversation_rules['max_response_length']} words. Focus on safety and de-escalation."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.3  # Lower temperature for more consistent responses
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Validate response
            if self._validate_ai_response(ai_response):
                return ai_response
            else:
                raise Exception("AI response failed validation")
                
        except Exception as e:
            logger.error(f"❌ OpenAI API error: {e}")
            raise e
    
    def _build_conversation_context(self, session: ConversationSession) -> str:
        """Build context string for AI conversation"""
        context_parts = [
            f"Threat Level: {session.threat_level.name}",
            f"Conversation Type: {session.conversation_type.value}",
            f"Location: {session.location}",
            f"Duration: {(datetime.now() - session.start_time).total_seconds():.0f} seconds"
        ]
        
        if 'threat_type' in session.metadata:
            context_parts.append(f"Detected Threat: {session.metadata['threat_type']}")
        
        return ", ".join(context_parts)
    
    def _validate_ai_response(self, response: str) -> bool:
        """Validate AI-generated response for safety and appropriateness"""
        # Check length
        word_count = len(response.split())
        if word_count > self.conversation_rules['max_response_length']:
            return False
        
        # Check for prohibited content
        prohibited_keywords = ['personal information', 'unrelated', 'inappropriate']
        response_lower = response.lower()
        
        if any(keyword in response_lower for keyword in prohibited_keywords):
            return False
        
        # Check for professional tone
        if any(word in response_lower for word in ['stupid', 'idiot', 'shut up']):
            return False
        
        return True
    
    async def _handle_no_response(self, session_id: str):
        """Handle case where no response is received from person"""
        session = self.active_conversations.get(session_id)
        if not session:
            return
        
        # Check number of attempts
        no_response_count = session.metadata.get('no_response_count', 0) + 1
        session.metadata['no_response_count'] = no_response_count
        
        if no_response_count >= self.conversation_rules['auto_escalate_threshold']:
            # Escalate after multiple failed attempts
            await self._escalate_conversation(session_id, 'no_response')
        else:
            # Try again with different approach
            repeat_message = "I didn't hear a response. Please let me know if you need assistance."
            
            ai_message = ConversationMessage(
                timestamp=datetime.now(),
                speaker='ai',
                content=repeat_message,
                metadata={'repeat_attempt': no_response_count}
            )
            
            session.messages.append(ai_message)
            session.state = ConversationState.SPEAKING
            
            await self._synthesize_and_play_speech(session_id, repeat_message)
            
            # Try listening again
            session.state = ConversationState.WAITING_RESPONSE
            asyncio.create_task(self._listen_for_response(session_id, timeout=20))
    
    def _should_continue_conversation(self, session: ConversationSession) -> bool:
        """Determine if conversation should continue"""
        # Check time limit
        duration = (datetime.now() - session.start_time).total_seconds()
        if duration > self.conversation_rules['max_conversation_time']:
            return False
        
        # Check number of exchanges
        if len(session.messages) > 10:  # Max 10 messages
            return False
        
        # Check for resolution indicators
        if session.messages:
            last_person_message = None
            for msg in reversed(session.messages):
                if msg.speaker == 'person':
                    last_person_message = msg
                    break
            
            if last_person_message:
                content_lower = last_person_message.content.lower()
                resolution_keywords = ['thank you', 'sorry', 'leaving', 'goodbye', 'understand']
                if any(keyword in content_lower for keyword in resolution_keywords):
                    return False
        
        return True
    
    async def _escalate_conversation(self, session_id: str, reason: str):
        """Escalate conversation to human security personnel"""
        session = self.active_conversations.get(session_id)
        if not session:
            return
        
        session.state = ConversationState.ESCALATED
        session.metadata['escalation_reason'] = reason
        session.metadata['escalation_time'] = datetime.now()
        
        # Send escalation message
        escalation_message = "This situation requires human security personnel. Please remain where you are."
        
        ai_message = ConversationMessage(
            timestamp=datetime.now(),
            speaker='ai',
            content=escalation_message,
            metadata={'escalation': True, 'reason': reason}
        )
        
        session.messages.append(ai_message)
        
        await self._synthesize_and_play_speech(session_id, escalation_message)
        
        # Notify security personnel
        await self._notify_security_escalation(session_id, reason)
        
        # End AI conversation
        await self._end_conversation(session_id, 'escalated')
        
        logger.warning(f"🚨 Conversation {session_id} escalated: {reason}")
    
    async def _notify_security_escalation(self, session_id: str, reason: str):
        """Notify security personnel of conversation escalation"""
        session = self.active_conversations.get(session_id)
        if not session:
            return
        
        notification = {
            'type': 'conversation_escalation',
            'session_id': session_id,
            'reason': reason,
            'location': session.location,
            'camera_id': session.camera_id,
            'threat_level': session.threat_level.name,
            'conversation_summary': self._generate_conversation_summary(session),
            'timestamp': datetime.now().isoformat()
        }
        
        # In production, this would send to security dispatch system
        logger.info(f"📞 Security escalation notification: {notification}")
    
    def _generate_conversation_summary(self, session: ConversationSession) -> str:
        """Generate a brief summary of the conversation"""
        if not session.messages:
            return "No conversation content"
        
        summary_parts = [
            f"Duration: {(datetime.now() - session.start_time).total_seconds():.0f}s",
            f"Messages: {len(session.messages)}",
            f"Type: {session.conversation_type.value}",
            f"Level: {session.threat_level.name}"
        ]
        
        # Add last person response if available
        last_person_message = None
        for msg in reversed(session.messages):
            if msg.speaker == 'person':
                last_person_message = msg
                break
        
        if last_person_message:
            summary_parts.append(f"Last response: {last_person_message.content[:50]}...")
        
        return " | ".join(summary_parts)
    
    async def _end_conversation(self, session_id: str, reason: str):
        """End a conversation and clean up"""
        session = self.active_conversations.get(session_id)
        if not session:
            return
        
        session.end_time = datetime.now()
        session.state = ConversationState.COMPLETED
        session.metadata['end_reason'] = reason
        
        # Update statistics
        self._update_conversation_stats(session)
        
        # Archive conversation
        with self._lock:
            self.conversation_history.append(session)
            if session_id in self.active_conversations:
                del self.active_conversations[session_id]
        
        duration = (session.end_time - session.start_time).total_seconds()
        logger.info(f"✅ Conversation {session_id} ended: {reason} (duration: {duration:.1f}s)")
    
    def _update_conversation_stats(self, session: ConversationSession):
        """Update conversation statistics"""
        self.conversation_stats['total_conversations'] += 1
        
        duration = (session.end_time - session.start_time).total_seconds()
        
        # Update average conversation time
        total_convs = self.conversation_stats['total_conversations']
        current_avg = self.conversation_stats['average_conversation_time']
        new_avg = ((current_avg * (total_convs - 1)) + duration) / total_convs
        self.conversation_stats['average_conversation_time'] = new_avg
        
        # Update success/escalation counts
        if session.state == ConversationState.ESCALATED:
            self.conversation_stats['escalated_conversations'] += 1
        elif session.metadata.get('end_reason') == 'completed':
            self.conversation_stats['successful_de_escalations'] += 1
    
    async def stop_conversation(self, session_id: str) -> bool:
        """
        Manually stop an active conversation
        
        Args:
            session_id: ID of conversation to stop
        
        Returns:
            bool: True if conversation was stopped
        """
        if session_id in self.active_conversations:
            await self._end_conversation(session_id, 'manual_stop')
            return True
        return False
    
    def get_active_conversations(self) -> List[Dict[str, Any]]:
        """Get list of active conversations"""
        with self._lock:
            return [
                {
                    'session_id': session.session_id,
                    'start_time': session.start_time.isoformat(),
                    'duration': (datetime.now() - session.start_time).total_seconds(),
                    'conversation_type': session.conversation_type.value,
                    'threat_level': session.threat_level.name,
                    'state': session.state.value,
                    'location': session.location,
                    'camera_id': session.camera_id,
                    'message_count': len(session.messages)
                }
                for session in self.active_conversations.values()
            ]
    
    def get_conversation_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get conversation history"""
        with self._lock:
            recent_conversations = list(self.conversation_history)[-limit:]
            
            return [
                {
                    'session_id': session.session_id,
                    'start_time': session.start_time.isoformat(),
                    'end_time': session.end_time.isoformat() if session.end_time else None,
                    'duration': (session.end_time - session.start_time).total_seconds() if session.end_time else None,
                    'conversation_type': session.conversation_type.value,
                    'threat_level': session.threat_level.name,
                    'state': session.state.value,
                    'location': session.location,
                    'message_count': len(session.messages),
                    'end_reason': session.metadata.get('end_reason'),
                    'escalated': session.state == ConversationState.ESCALATED
                }
                for session in recent_conversations
            ]
    
    def get_conversation_statistics(self) -> Dict[str, Any]:
        """Get conversation engine statistics"""
        return {
            'active_conversations': len(self.active_conversations),
            'openai_enabled': self.openai_enabled,
            'tts_available': self.tts_engine is not None,
            'speech_recognition_available': self.speech_recognizer is not None,
            **self.conversation_stats
        }
    
    def update_configuration(self, config: Dict[str, Any]):
        """Update conversation engine configuration"""
        if 'conversation_rules' in config:
            self.conversation_rules.update(config['conversation_rules'])
        
        if 'ai_persona' in config:
            self.ai_persona.update(config['ai_persona'])
        
        logger.info("✅ Conversation engine configuration updated")
    
    def export_conversation(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Export complete conversation data
        
        Args:
            session_id: ID of conversation to export
        
        Returns:
            Complete conversation data
        """
        # Check active conversations
        session = self.active_conversations.get(session_id)
        
        # Check conversation history
        if not session:
            for historical_session in self.conversation_history:
                if historical_session.session_id == session_id:
                    session = historical_session
                    break
        
        if not session:
            return None
        
        return {
            'session_data': asdict(session),
            'messages': [asdict(msg) for msg in session.messages],
            'export_timestamp': datetime.now().isoformat(),
            'conversation_summary': self._generate_conversation_summary(session)
        }
    
    def shutdown(self):
        """Shutdown the conversation engine"""
        logger.info("🔇 Shutting down AI Conversation Engine...")
        
        # Stop all active conversations
        for session_id in list(self.active_conversations.keys()):
            asyncio.create_task(self._end_conversation(session_id, 'shutdown'))
        
        # Cleanup TTS engine
        if self.tts_engine:
            try:
                self.tts_engine.stop()
            except:
                pass
        
        logger.info("✅ AI Conversation Engine shutdown complete")
