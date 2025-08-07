"""
OLLAMA SERVICE - MASTER PROMPT v52.0
=====================================
Ollama integration service for local LLM processing
Handles conversation management for Voice AI Dispatcher

Features:
- Local LLM inference via Ollama
- Multiple model support (Llama 3, Mistral, etc.)
- Conversation context management
- SOP-guided conversation flows
- Emergency escalation detection
- Real-time response generation
- Production-grade error handling
- Comprehensive logging and monitoring
"""

import os
import asyncio
import logging
import json
import aiohttp
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from enum import Enum

# Set up logging
logger = logging.getLogger(__name__)

class ConversationState(Enum):
    """Conversation state enumeration"""
    INITIATED = "initiated"
    GATHERING_INFO = "gathering_info"
    PROCESSING_REQUEST = "processing_request"
    ESCALATING = "escalating"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class ConversationTurn:
    """Individual turn in conversation"""
    speaker: str  # 'caller' or 'ai'
    message: str
    timestamp: datetime
    confidence: float = 1.0
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class ConversationContext:
    """Complete conversation context"""
    conversation_id: str
    call_sid: str
    property_id: Optional[str]
    incident_type: Optional[str]
    state: ConversationState
    turns: List[ConversationTurn]
    extracted_info: Dict[str, Any]
    sop_id: Optional[str]
    confidence_score: float
    escalation_triggers: List[str]
    created_at: datetime
    updated_at: datetime

@dataclass
class LLMResponse:
    """Response from LLM"""
    text: str
    confidence: float
    should_escalate: bool
    incident_type: Optional[str]
    extracted_info: Dict[str, Any]
    suggested_actions: List[str]
    conversation_state: ConversationState
    metadata: Optional[Dict[str, Any]] = None

class OllamaService:
    """
    Comprehensive Ollama integration service for Voice AI Dispatcher
    """
    
    def __init__(self):
        """Initialize Ollama service with configuration"""
        self.base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.default_model = os.getenv('OLLAMA_MODEL', 'llama3:latest')
        
        # Model configurations for different scenarios
        self.model_configs = {
            'llama3:latest': {
                'temperature': 0.3,  # Low for consistent responses
                'top_p': 0.9,
                'top_k': 40,
                'num_predict': 256,  # Max tokens to generate
                'repeat_penalty': 1.1,
                'description': 'General purpose conversational model'
            },
            'mistral:latest': {
                'temperature': 0.2,
                'top_p': 0.85,
                'top_k': 35,
                'num_predict': 200,
                'repeat_penalty': 1.15,
                'description': 'Fast, efficient model for quick responses'
            },
            'llama3:instruct': {
                'temperature': 0.1,  # Very low for instruction following
                'top_p': 0.8,
                'top_k': 30,
                'num_predict': 300,
                'repeat_penalty': 1.2,
                'description': 'Instruction-tuned for structured conversations'
            }
        }
        
        self.active_conversations: Dict[str, ConversationContext] = {}
        
        # System prompt template for security dispatch
        self.system_prompt = """You are APEX AI, a professional security dispatcher for residential properties. Your role is to:

1. GATHER INFORMATION: Ask relevant questions to understand the caller's security concern
2. CLASSIFY INCIDENTS: Determine the type and urgency of the security issue
3. EXTRACT KEY DETAILS: Get caller name, callback number, property location, and incident specifics
4. FOLLOW PROCEDURES: Use property-specific Standard Operating Procedures (SOPs)
5. ESCALATE WHEN NEEDED: Recognize when human intervention is required

IMPORTANT GUIDELINES:
- Be professional, calm, and reassuring
- Ask ONE question at a time to avoid overwhelming callers
- Always get: caller name, phone number, property/unit, and nature of incident
- For emergencies, gather info quickly but thoroughly
- If you detect weapons, violence, medical emergencies, or feel uncertain, escalate to human operator
- Use natural, conversational language - avoid being robotic
- Show empathy while maintaining professionalism

INCIDENT TYPES TO RECOGNIZE:
- noise_complaint, lockout, maintenance_emergency, security_breach
- medical_emergency, fire_alarm, suspicious_activity, package_theft
- vandalism, domestic_disturbance, utility_outage, elevator_emergency
- parking_violation, unauthorized_access, general_inquiry

ESCALATION TRIGGERS:
- Mention of weapons, violence, or immediate danger
- Medical emergencies requiring paramedics
- Fire or gas leaks
- Caller sounds distressed, intoxicated, or incoherent
- Unable to understand the nature of the incident after 3 attempts
- Any situation you're uncertain about

Always respond with structured JSON containing your response and analysis."""
        
        logger.info("OllamaService initialized successfully")
    
    async def start_conversation(
        self,
        conversation_id: str,
        call_sid: str,
        property_id: Optional[str] = None,
        sop_id: Optional[str] = None
    ) -> ConversationContext:
        """
        Start a new conversation with the caller
        
        Args:
            conversation_id: Unique conversation identifier
            call_sid: Twilio call SID
            property_id: Property ID if known
            sop_id: Relevant SOP ID if predetermined
            
        Returns:
            ConversationContext object
        """
        try:
            context = ConversationContext(
                conversation_id=conversation_id,
                call_sid=call_sid,
                property_id=property_id,
                incident_type=None,
                state=ConversationState.INITIATED,
                turns=[],
                extracted_info={},
                sop_id=sop_id,
                confidence_score=1.0,
                escalation_triggers=[],
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            self.active_conversations[conversation_id] = context
            
            logger.info(f"Started conversation: {conversation_id} for call: {call_sid}")
            return context
            
        except Exception as e:
            logger.error(f"Failed to start conversation {conversation_id}: {e}")
            raise
    
    async def process_caller_input(
        self,
        conversation_id: str,
        caller_message: str,
        transcription_confidence: float = 1.0
    ) -> LLMResponse:
        """
        Process caller input and generate AI response
        
        Args:
            conversation_id: Conversation identifier
            caller_message: What the caller said
            transcription_confidence: Confidence from speech-to-text
            
        Returns:
            LLMResponse with AI's response and analysis
        """
        try:
            if conversation_id not in self.active_conversations:
                raise ValueError(f"Conversation {conversation_id} not found")
            
            context = self.active_conversations[conversation_id]
            
            # Add caller's message to conversation history
            caller_turn = ConversationTurn(
                speaker='caller',
                message=caller_message,
                timestamp=datetime.now(timezone.utc),
                confidence=transcription_confidence
            )
            context.turns.append(caller_turn)
            
            # Generate LLM prompt based on conversation state and history
            prompt = self._build_conversation_prompt(context)
            
            # Call Ollama LLM
            llm_output = await self._call_ollama(prompt, context)
            
            # Parse LLM response
            response = self._parse_llm_response(llm_output, context)
            
            # Add AI response to conversation history
            ai_turn = ConversationTurn(
                speaker='ai',
                message=response.text,
                timestamp=datetime.now(timezone.utc),
                confidence=response.confidence,
                metadata={
                    'incident_type': response.incident_type,
                    'should_escalate': response.should_escalate,
                    'extracted_info': response.extracted_info
                }
            )
            context.turns.append(ai_turn)
            
            # Update conversation state and extracted information
            context.state = response.conversation_state
            context.extracted_info.update(response.extracted_info)
            context.confidence_score = min(context.confidence_score, response.confidence)
            context.updated_at = datetime.now(timezone.utc)
            
            if response.incident_type:
                context.incident_type = response.incident_type
            
            # Track escalation triggers
            if response.should_escalate:
                escalation_reason = response.metadata.get('escalation_reason', 'Unknown')
                if escalation_reason not in context.escalation_triggers:
                    context.escalation_triggers.append(escalation_reason)
            
            logger.info(f"Processed input for conversation {conversation_id}: "
                       f"State={context.state.value}, Confidence={response.confidence:.2f}")
            
            return response
            
        except Exception as e:
            logger.error(f"Failed to process caller input for conversation {conversation_id}: {e}")
            raise
    
    def _build_conversation_prompt(self, context: ConversationContext) -> str:
        """
        Build conversation prompt for LLM based on current context
        
        Args:
            context: Current conversation context
            
        Returns:
            Formatted prompt string
        """
        try:
            # Build conversation history
            history = []
            for turn in context.turns[-10:]:  # Last 10 turns for context
                speaker = "Caller" if turn.speaker == 'caller' else "AI Dispatcher"
                history.append(f"{speaker}: {turn.message}")
            
            conversation_history = "\n".join(history)
            
            # Build extracted info summary
            info_summary = []
            for key, value in context.extracted_info.items():
                if value:
                    info_summary.append(f"- {key}: {value}")
            
            extracted_info_text = "\n".join(info_summary) if info_summary else "None extracted yet"
            
            # Build current state context
            state_context = {
                ConversationState.INITIATED: "The call just started. Greet the caller and ask about their security concern.",
                ConversationState.GATHERING_INFO: "You're gathering information. Ask specific follow-up questions based on what you know.",
                ConversationState.PROCESSING_REQUEST: "You have enough info. Summarize and explain next steps.",
                ConversationState.ESCALATING: "You're preparing to escalate to a human operator.",
                ConversationState.COMPLETED: "The conversation is wrapping up."
            }.get(context.state, "Continue the conversation naturally.")
            
            prompt = f"""{self.system_prompt}

CURRENT CONVERSATION STATE: {context.state.value}
STATE GUIDANCE: {state_context}

PROPERTY ID: {context.property_id or 'Unknown'}
CONVERSATION HISTORY:
{conversation_history}

INFORMATION EXTRACTED SO FAR:
{extracted_info_text}

RESPONSE FORMAT: You must respond with valid JSON in this exact format:
{{
    "response_text": "Your spoken response to the caller",
    "confidence": 0.85,
    "should_escalate": false,
    "incident_type": "noise_complaint",
    "extracted_info": {{
        "caller_name": "John Smith",
        "callback_number": "555-123-4567",
        "unit_number": "Apt 5B",
        "incident_details": "Loud music from upstairs"
    }},
    "suggested_actions": ["notify_guard", "contact_property_manager"],
    "conversation_state": "gathering_info",
    "escalation_reason": null
}}

Generate your response now:"""

            return prompt
            
        except Exception as e:
            logger.error(f"Error building conversation prompt: {e}")
            raise
    
    async def _call_ollama(
        self,
        prompt: str,
        context: ConversationContext,
        model: Optional[str] = None
    ) -> str:
        """
        Make API call to Ollama LLM
        
        Args:
            prompt: Input prompt for LLM
            context: Conversation context
            model: Model to use (defaults to configured model)
            
        Returns:
            Raw LLM response text
        """
        try:
            model_name = model or self.default_model
            config = self.model_configs.get(model_name, self.model_configs[self.default_model])
            
            data = {
                'model': model_name,
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': config['temperature'],
                    'top_p': config['top_p'],
                    'top_k': config['top_k'],
                    'num_predict': config['num_predict'],
                    'repeat_penalty': config['repeat_penalty']
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/generate",
                    json=data,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        llm_response = result.get('response', '')
                        
                        logger.debug(f"LLM response received for conversation {context.conversation_id}")
                        return llm_response
                    else:
                        error_text = await response.text()
                        raise Exception(f"Ollama API error: {response.status} - {error_text}")
                        
        except asyncio.TimeoutError:
            logger.error(f"Ollama API timeout for conversation {context.conversation_id}")
            raise Exception("LLM response timeout - escalating to human operator")
        except Exception as e:
            logger.error(f"Ollama API call failed for conversation {context.conversation_id}: {e}")
            raise
    
    def _parse_llm_response(self, llm_output: str, context: ConversationContext) -> LLMResponse:
        """
        Parse LLM JSON response into structured format
        
        Args:
            llm_output: Raw LLM response
            context: Conversation context
            
        Returns:
            Parsed LLMResponse object
        """
        try:
            # Try to extract JSON from the response
            json_start = llm_output.find('{')
            json_end = llm_output.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("No JSON found in LLM response")
            
            json_text = llm_output[json_start:json_end]
            parsed = json.loads(json_text)
            
            # Validate required fields and set defaults
            response_text = parsed.get('response_text', 'I apologize, but I need to transfer you to a human operator.')
            confidence = max(0.0, min(1.0, parsed.get('confidence', 0.5)))
            should_escalate = parsed.get('should_escalate', True)  # Default to escalate if parsing issues
            
            # Parse conversation state
            state_str = parsed.get('conversation_state', 'gathering_info')
            try:
                conversation_state = ConversationState(state_str)
            except ValueError:
                conversation_state = ConversationState.GATHERING_INFO
            
            # Parse extracted info
            extracted_info = parsed.get('extracted_info', {})
            if not isinstance(extracted_info, dict):
                extracted_info = {}
            
            # Parse suggested actions
            suggested_actions = parsed.get('suggested_actions', [])
            if not isinstance(suggested_actions, list):
                suggested_actions = []
            
            response = LLMResponse(
                text=response_text,
                confidence=confidence,
                should_escalate=should_escalate,
                incident_type=parsed.get('incident_type'),
                extracted_info=extracted_info,
                suggested_actions=suggested_actions,
                conversation_state=conversation_state,
                metadata={
                    'raw_response': llm_output,
                    'escalation_reason': parsed.get('escalation_reason')
                }
            )
            
            logger.debug(f"Successfully parsed LLM response for conversation {context.conversation_id}")
            return response
            
        except Exception as e:
            logger.error(f"Failed to parse LLM response for conversation {context.conversation_id}: {e}")
            
            # Return fallback response that escalates to human
            return LLMResponse(
                text="I'm having trouble processing your request. Let me connect you with a human operator who can assist you better.",
                confidence=0.0,
                should_escalate=True,
                incident_type=None,
                extracted_info={},
                suggested_actions=['escalate_to_human'],
                conversation_state=ConversationState.ESCALATING,
                metadata={
                    'parse_error': str(e),
                    'raw_response': llm_output,
                    'escalation_reason': 'LLM response parsing failed'
                }
            )
    
    async def get_conversation_summary(self, conversation_id: str) -> Dict[str, Any]:
        """
        Generate a summary of the conversation for incident reporting
        
        Args:
            conversation_id: Conversation identifier
            
        Returns:
            Conversation summary dictionary
        """
        try:
            if conversation_id not in self.active_conversations:
                raise ValueError(f"Conversation {conversation_id} not found")
            
            context = self.active_conversations[conversation_id]
            
            # Build summary prompt
            conversation_text = []
            for turn in context.turns:
                speaker = "Caller" if turn.speaker == 'caller' else "AI"
                conversation_text.append(f"{speaker}: {turn.message}")
            
            summary_prompt = f"""Analyze this security dispatch conversation and provide a structured summary:

{chr(10).join(conversation_text)}

Provide a JSON summary with:
- Brief incident description
- Key information extracted
- Recommended actions taken
- Urgency level assessment
- Whether human intervention was needed

Format as valid JSON."""

            # Get summary from LLM
            summary_response = await self._call_ollama(summary_prompt, context)
            
            try:
                summary_data = json.loads(summary_response)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                summary_data = {
                    'incident_description': f"Conversation with {len(context.turns)} exchanges",
                    'extracted_info': context.extracted_info,
                    'final_state': context.state.value,
                    'escalated': len(context.escalation_triggers) > 0
                }
            
            # Add metadata
            summary_data.update({
                'conversation_id': conversation_id,
                'call_sid': context.call_sid,
                'duration_minutes': (context.updated_at - context.created_at).total_seconds() / 60,
                'turn_count': len(context.turns),
                'confidence_score': context.confidence_score,
                'escalation_triggers': context.escalation_triggers,
                'created_at': context.created_at.isoformat(),
                'completed_at': context.updated_at.isoformat()
            })
            
            logger.info(f"Generated conversation summary for {conversation_id}")
            return summary_data
            
        except Exception as e:
            logger.error(f"Failed to generate conversation summary for {conversation_id}: {e}")
            raise
    
    def get_conversation(self, conversation_id: str) -> Optional[ConversationContext]:
        """
        Get conversation context by ID
        
        Args:
            conversation_id: Conversation identifier
            
        Returns:
            ConversationContext or None if not found
        """
        return self.active_conversations.get(conversation_id)
    
    def get_active_conversations(self) -> Dict[str, ConversationContext]:
        """
        Get all active conversations
        
        Returns:
            Dictionary of active conversations
        """
        return self.active_conversations.copy()
    
    async def end_conversation(self, conversation_id: str) -> Dict[str, Any]:
        """
        End a conversation and generate final summary
        
        Args:
            conversation_id: Conversation identifier
            
        Returns:
            Final conversation summary
        """
        try:
            if conversation_id not in self.active_conversations:
                raise ValueError(f"Conversation {conversation_id} not found")
            
            context = self.active_conversations[conversation_id]
            context.state = ConversationState.COMPLETED
            context.updated_at = datetime.now(timezone.utc)
            
            # Generate final summary
            summary = await self.get_conversation_summary(conversation_id)
            
            # Remove from active conversations
            del self.active_conversations[conversation_id]
            
            logger.info(f"Ended conversation: {conversation_id}")
            return summary
            
        except Exception as e:
            logger.error(f"Failed to end conversation {conversation_id}: {e}")
            raise
    
    async def test_model_availability(self, model: Optional[str] = None) -> bool:
        """
        Test if the specified model is available and responding
        
        Args:
            model: Model name to test (defaults to default model)
            
        Returns:
            True if model is available and responding
        """
        try:
            test_model = model or self.default_model
            
            test_prompt = "Respond with 'OK' if you can understand this message."
            
            data = {
                'model': test_model,
                'prompt': test_prompt,
                'stream': False,
                'options': {'num_predict': 10}
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/generate",
                    json=data,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        response_text = result.get('response', '').strip().lower()
                        
                        is_working = 'ok' in response_text
                        logger.info(f"Model {test_model} availability test: {'PASSED' if is_working else 'FAILED'}")
                        return is_working
                    else:
                        logger.error(f"Model {test_model} test failed with status: {response.status}")
                        return False
                        
        except Exception as e:
            logger.error(f"Model availability test failed for {test_model}: {e}")
            return False

# Global instance for use across the application
ollama_service = OllamaService()
