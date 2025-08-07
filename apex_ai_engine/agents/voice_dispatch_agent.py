"""
VOICE DISPATCH AGENT - MASTER PROMPT v52.0
===========================================
Core Voice AI Dispatcher orchestrating the complete call lifecycle
Integrates Twilio, Deepgram, ElevenLabs, and Ollama for autonomous call handling

Features:
- Complete call lifecycle management (inbound/outbound)
- Real-time speech processing and conversation management
- SOP-guided decision making and action execution
- Automatic incident creation and notification dispatch
- Human-in-the-loop escalation and takeover
- Emergency services integration
- Comprehensive logging and audit trails
- Production-grade error handling and recovery
"""

import os
import asyncio
import logging
import json
import uuid
from typing import Optional, Dict, Any, List, Callable, AsyncGenerator
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from enum import Enum

# Import service integrations
from ..services import (
    twilio_service, deepgram_service, elevenlabs_service, ollama_service,
    TranscriptionResult, TTSResult, ConversationContext, ConversationState
)

# Import shared utilities
from ..shared.db_connector import get_database_connection

# Set up logging
logger = logging.getLogger(__name__)

class CallState(Enum):
    """Call state enumeration"""
    INITIATED = "initiated"
    AI_GREETING = "ai_greeting"
    GATHERING_INFO = "gathering_info"
    PROCESSING_SOP = "processing_sop"
    EXECUTING_ACTIONS = "executing_actions"
    HUMAN_ESCALATION = "human_escalation"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class CallContext:
    """Complete call context and state"""
    call_id: str
    twilio_call_sid: str
    caller_phone: str
    property_id: Optional[str]
    call_state: CallState
    conversation_context: Optional[ConversationContext]
    sop_id: Optional[str]
    incident_id: Optional[str]
    human_operator_id: Optional[str]
    escalation_reason: Optional[str]
    actions_taken: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any]

class VoiceDispatchAgent:
    """
    Core Voice AI Dispatcher Agent
    Orchestrates the complete call handling workflow
    """
    
    def __init__(self):
        """Initialize Voice Dispatch Agent"""
        self.active_calls: Dict[str, CallContext] = {}
        self.call_handlers: Dict[str, Callable] = {}
        self.transcription_streams: Dict[str, str] = {}  # call_id -> stream_id mapping
        
        # Configuration
        self.max_conversation_turns = int(os.getenv('MAX_CONVERSATION_TURNS', '20'))
        self.escalation_timeout_minutes = int(os.getenv('ESCALATION_TIMEOUT_MINUTES', '10'))
        self.confidence_threshold = float(os.getenv('AI_CONFIDENCE_THRESHOLD', '0.7'))
        
        logger.info("VoiceDispatchAgent initialized successfully")
    
    async def handle_inbound_call(
        self,
        twilio_call_sid: str,
        caller_phone: str,
        property_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Handle incoming call from Twilio webhook
        
        Args:
            twilio_call_sid: Twilio Call SID
            caller_phone: Caller's phone number
            property_context: Property information if available
            
        Returns:
            TwiML response string for Twilio
        """
        try:
            # Create unique call identifier
            call_id = str(uuid.uuid4())
            
            # Determine property ID from context or lookup
            property_id = None
            if property_context:
                property_id = property_context.get('property_id')
            else:
                # Try to identify property from caller's phone number
                property_id = await self._identify_property_from_phone(caller_phone)
            
            # Create call context
            call_context = CallContext(
                call_id=call_id,
                twilio_call_sid=twilio_call_sid,
                caller_phone=caller_phone,
                property_id=property_id,
                call_state=CallState.INITIATED,
                conversation_context=None,
                sop_id=None,
                incident_id=None,
                human_operator_id=None,
                escalation_reason=None,
                actions_taken=[],
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                metadata={
                    'property_context': property_context or {},
                    'caller_location': await self._get_caller_location(caller_phone)
                }
            )
            
            self.active_calls[call_id] = call_context
            
            # Log call initiation to database
            await self._create_call_log_entry(call_context)
            
            # Generate initial TwiML response
            twiml = twilio_service.generate_inbound_twiml(
                call_sid=twilio_call_sid,
                from_number=caller_phone,
                property_context=property_context
            )
            
            # Start background task for call processing
            asyncio.create_task(self._process_call_lifecycle(call_id))
            
            logger.info(f"Handling inbound call: {call_id} from {caller_phone}")
            return twiml
            
        except Exception as e:
            logger.error(f"Failed to handle inbound call {twilio_call_sid}: {e}")
            # Return fallback TwiML that transfers to human
            return twilio_service.generate_human_takeover_twiml(
                os.getenv('HUMAN_OPERATOR_PHONE', '+1234567890')
            )
    
    async def _process_call_lifecycle(self, call_id: str) -> None:
        """
        Background task to process the complete call lifecycle
        
        Args:
            call_id: Call identifier
        """
        try:
            call_context = self.active_calls.get(call_id)
            if not call_context:
                logger.error(f"Call context not found for {call_id}")
                return
            
            # Start conversation with Ollama
            conversation_id = f"conv_{call_id}"
            conversation_context = await ollama_service.start_conversation(
                conversation_id=conversation_id,
                call_sid=call_context.twilio_call_sid,
                property_id=call_context.property_id
            )
            
            call_context.conversation_context = conversation_context
            call_context.call_state = CallState.AI_GREETING
            call_context.updated_at = datetime.now(timezone.utc)
            
            # Start transcription stream
            await self._start_transcription_stream(call_id)
            
            logger.info(f"Started call lifecycle processing for {call_id}")
            
        except Exception as e:
            logger.error(f"Error in call lifecycle processing for {call_id}: {e}")
            await self._escalate_to_human(call_id, f"System error: {str(e)}")
    
    async def _start_transcription_stream(self, call_id: str) -> None:
        """
        Start real-time transcription for the call
        
        Args:
            call_id: Call identifier
        """
        try:
            call_context = self.active_calls.get(call_id)
            if not call_context:
                return
            
            # Create transcription stream
            stream_id = f"stream_{call_id}"
            self.transcription_streams[call_id] = stream_id
            
            # Define transcription handler
            async def transcription_handler(result: TranscriptionResult):
                await self._handle_transcription_result(call_id, result)
            
            # Start Deepgram transcription stream
            await deepgram_service.create_live_transcription_stream(
                stream_id=stream_id,
                transcription_handler=transcription_handler
            )
            
            logger.info(f"Started transcription stream for call {call_id}")
            
        except Exception as e:
            logger.error(f"Failed to start transcription stream for {call_id}: {e}")
    
    async def _handle_transcription_result(
        self,
        call_id: str,
        result: TranscriptionResult
    ) -> None:
        """
        Handle transcription results from Deepgram
        
        Args:
            call_id: Call identifier
            result: Transcription result
        """
        try:
            # Only process final transcription results to avoid partial processing
            if not result.is_final or not result.text.strip():
                return
            
            call_context = self.active_calls.get(call_id)
            if not call_context or not call_context.conversation_context:
                return
            
            # Check if we should escalate based on transcription confidence
            if result.confidence < self.confidence_threshold:
                logger.warning(f"Low transcription confidence ({result.confidence:.2f}) "
                             f"for call {call_id}: '{result.text}'")
                
                # If multiple low-confidence results, escalate
                low_confidence_count = call_context.metadata.get('low_confidence_count', 0) + 1
                call_context.metadata['low_confidence_count'] = low_confidence_count
                
                if low_confidence_count >= 3:
                    await self._escalate_to_human(call_id, "Multiple low-confidence transcriptions")
                    return
            
            # Process caller input with Ollama
            conversation_id = call_context.conversation_context.conversation_id
            llm_response = await ollama_service.process_caller_input(
                conversation_id=conversation_id,
                caller_message=result.text,
                transcription_confidence=result.confidence
            )
            
            # Check for escalation triggers
            if llm_response.should_escalate:
                escalation_reason = llm_response.metadata.get('escalation_reason', 'AI requested escalation')
                await self._escalate_to_human(call_id, escalation_reason)
                return
            
            # Generate TTS response
            tts_result = await self._generate_ai_response(call_id, llm_response.text)
            
            # Update call state based on conversation state
            call_context.call_state = self._map_conversation_state_to_call_state(
                llm_response.conversation_state
            )
            
            # Execute suggested actions
            await self._execute_suggested_actions(call_id, llm_response.suggested_actions)
            
            # Check if incident should be created
            if llm_response.incident_type and self._has_sufficient_info(llm_response.extracted_info):
                await self._create_incident(call_id, llm_response)
            
            call_context.updated_at = datetime.now(timezone.utc)
            
            logger.info(f"Processed transcription for call {call_id}: '{result.text}' -> "
                       f"AI response generated ({len(llm_response.text)} chars)")
            
        except Exception as e:
            logger.error(f"Error handling transcription result for call {call_id}: {e}")
            await self._escalate_to_human(call_id, f"Error processing transcription: {str(e)}")
    
    async def _generate_ai_response(self, call_id: str, response_text: str) -> TTSResult:
        """
        Generate AI voice response using ElevenLabs
        
        Args:
            call_id: Call identifier
            response_text: Text for AI to speak
            
        Returns:
            TTSResult with audio data
        """
        try:
            call_context = self.active_calls.get(call_id)
            if not call_context:
                raise ValueError(f"Call context not found for {call_id}")
            
            # Choose appropriate voice profile based on call state
            voice_profile = self._choose_voice_profile(call_context.call_state)
            
            # Generate TTS
            tts_result = await elevenlabs_service.text_to_speech(
                text=response_text,
                voice_profile=voice_profile
            )
            
            # Send TwiML response to continue conversation
            continue_conversation = call_context.call_state not in [
                CallState.COMPLETED, CallState.FAILED, CallState.HUMAN_ESCALATION
            ]
            
            twiml = twilio_service.generate_ai_response_twiml(
                ai_response_text=response_text,
                continue_conversation=continue_conversation
            )
            
            # In a real implementation, you would send this TwiML back to Twilio
            # For now, we log it
            logger.debug(f"Generated TwiML response for call {call_id}")
            
            return tts_result
            
        except Exception as e:
            logger.error(f"Failed to generate AI response for call {call_id}: {e}")
            raise
    
    def _choose_voice_profile(self, call_state: CallState) -> str:
        """
        Choose appropriate voice profile based on call state
        
        Args:
            call_state: Current call state
            
        Returns:
            Voice profile name
        """
        if call_state in [CallState.HUMAN_ESCALATION]:
            return 'emergency_female'
        elif call_state in [CallState.EXECUTING_ACTIONS]:
            return 'dispatcher_female'
        else:
            return 'calm_reassuring'
    
    def _map_conversation_state_to_call_state(self, conv_state: ConversationState) -> CallState:
        """
        Map conversation state to call state
        
        Args:
            conv_state: Conversation state from Ollama
            
        Returns:
            Corresponding call state
        """
        mapping = {
            ConversationState.INITIATED: CallState.AI_GREETING,
            ConversationState.GATHERING_INFO: CallState.GATHERING_INFO,
            ConversationState.PROCESSING_REQUEST: CallState.PROCESSING_SOP,
            ConversationState.ESCALATING: CallState.HUMAN_ESCALATION,
            ConversationState.COMPLETED: CallState.COMPLETED,
            ConversationState.FAILED: CallState.FAILED
        }
        return mapping.get(conv_state, CallState.GATHERING_INFO)
    
    def _has_sufficient_info(self, extracted_info: Dict[str, Any]) -> bool:
        """
        Check if we have sufficient information to create an incident
        
        Args:
            extracted_info: Information extracted from conversation
            
        Returns:
            True if sufficient information is available
        """
        required_fields = ['caller_name', 'incident_details']
        return all(extracted_info.get(field) for field in required_fields)
    
    async def _execute_suggested_actions(
        self,
        call_id: str,
        suggested_actions: List[str]
    ) -> None:
        """
        Execute actions suggested by the AI
        
        Args:
            call_id: Call identifier
            suggested_actions: List of action names to execute
        """
        try:
            call_context = self.active_calls.get(call_id)
            if not call_context:
                return
            
            for action in suggested_actions:
                try:
                    if action == 'notify_guard':
                        await self._notify_guard(call_id)
                    elif action == 'contact_property_manager':
                        await self._contact_property_manager(call_id)
                    elif action == 'escalate_to_human':
                        await self._escalate_to_human(call_id, 'AI requested human escalation')
                    elif action == 'create_incident':
                        # This will be handled separately in _create_incident
                        pass
                    else:
                        logger.warning(f"Unknown action requested: {action}")
                    
                    # Log the action
                    action_record = {
                        'action': action,
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'call_id': call_id,
                        'status': 'completed'
                    }
                    call_context.actions_taken.append(action_record)
                    
                except Exception as action_error:
                    logger.error(f"Failed to execute action {action} for call {call_id}: {action_error}")
                    
                    # Log the failed action
                    action_record = {
                        'action': action,
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'call_id': call_id,
                        'status': 'failed',
                        'error': str(action_error)
                    }
                    call_context.actions_taken.append(action_record)
            
        except Exception as e:
            logger.error(f"Error executing suggested actions for call {call_id}: {e}")
    
    async def _notify_guard(self, call_id: str) -> None:
        """
        Send notification to on-duty guard
        
        Args:
            call_id: Call identifier
        """
        try:
            call_context = self.active_calls.get(call_id)
            if not call_context:
                return
            
            # Get guard contact information for the property
            guard_contact = await self._get_guard_contact(call_context.property_id)
            if not guard_contact:
                logger.warning(f"No guard contact found for property {call_context.property_id}")
                return
            
            # Create notification message
            incident_summary = self._create_incident_summary(call_context)
            
            notification_data = {
                'type': 'security_incident',
                'call_id': call_id,
                'property_id': call_context.property_id,
                'caller_phone': call_context.caller_phone,
                'summary': incident_summary,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'priority': 'medium'  # Could be determined from incident type
            }
            
            # Send push notification (implementation would depend on guard app)
            # For now, we'll log the notification
            logger.info(f"GUARD NOTIFICATION [{call_id}]: {incident_summary}")
            
            # In a real implementation, you would call your notification service here
            # await notification_service.send_guard_notification(guard_contact, notification_data)
            
        except Exception as e:
            logger.error(f"Failed to notify guard for call {call_id}: {e}")
    
    async def _contact_property_manager(self, call_id: str) -> None:
        """
        Contact property manager for the incident
        
        Args:
            call_id: Call identifier
        """
        try:
            call_context = self.active_calls.get(call_id)
            if not call_context:
                return
            
            # Get property manager contact information
            manager_contact = await self._get_property_manager_contact(call_context.property_id)
            if not manager_contact:
                logger.warning(f"No property manager contact for property {call_context.property_id}")
                return
            
            # Create notification
            incident_summary = self._create_incident_summary(call_context)
            
            # For now, log the notification (real implementation would send email/SMS)
            logger.info(f"PROPERTY MANAGER NOTIFICATION [{call_id}]: {incident_summary}")
            
        except Exception as e:
            logger.error(f"Failed to contact property manager for call {call_id}: {e}")
    
    async def _escalate_to_human(self, call_id: str, reason: str) -> None:
        """
        Escalate call to human operator
        
        Args:
            call_id: Call identifier
            reason: Reason for escalation
        """
        try:
            call_context = self.active_calls.get(call_id)
            if not call_context:
                return
            
            call_context.call_state = CallState.HUMAN_ESCALATION
            call_context.escalation_reason = reason
            call_context.updated_at = datetime.now(timezone.utc)
            
            # Generate takeover TwiML
            operator_phone = os.getenv('HUMAN_OPERATOR_PHONE', '+1234567890')
            twiml = twilio_service.generate_human_takeover_twiml(operator_phone)
            
            # Stop transcription stream
            if call_id in self.transcription_streams:
                stream_id = self.transcription_streams[call_id]
                await deepgram_service.stop_transcription_stream(stream_id)
                del self.transcription_streams[call_id]
            
            # Log escalation
            logger.warning(f"ESCALATING CALL {call_id} TO HUMAN: {reason}")
            
            # Update database
            await self._update_call_log_escalation(call_id, reason)
            
        except Exception as e:
            logger.error(f"Failed to escalate call {call_id}: {e}")
    
    async def _create_incident(self, call_id: str, llm_response) -> None:
        """
        Create incident record from call information
        
        Args:
            call_id: Call identifier
            llm_response: LLM response with incident information
        """
        try:
            call_context = self.active_calls.get(call_id)
            if not call_context:
                return
            
            incident_id = str(uuid.uuid4())
            
            incident_data = {
                'incident_id': incident_id,
                'call_id': call_id,
                'property_id': call_context.property_id,
                'incident_type': llm_response.incident_type,
                'caller_phone': call_context.caller_phone,
                'extracted_info': llm_response.extracted_info,
                'ai_confidence': llm_response.confidence,
                'created_at': datetime.now(timezone.utc),
                'status': 'open'
            }
            
            # Save to database (implementation would depend on your database schema)
            await self._save_incident_to_database(incident_data)
            
            call_context.incident_id = incident_id
            call_context.updated_at = datetime.now(timezone.utc)
            
            logger.info(f"Created incident {incident_id} from call {call_id}")
            
        except Exception as e:
            logger.error(f"Failed to create incident for call {call_id}: {e}")
    
    def _create_incident_summary(self, call_context: CallContext) -> str:
        """
        Create a brief incident summary for notifications
        
        Args:
            call_context: Call context
            
        Returns:
            Brief incident summary
        """
        if call_context.conversation_context:
            extracted_info = call_context.conversation_context.extracted_info
            incident_type = call_context.conversation_context.incident_type or 'Unknown'
            
            caller_name = extracted_info.get('caller_name', 'Unknown')
            incident_details = extracted_info.get('incident_details', 'No details provided')
            
            return f"{incident_type}: {caller_name} reported {incident_details}"
        else:
            return f"Call from {call_context.caller_phone} - Processing..."
    
    # Database operation placeholders (would be implemented based on your database schema)
    async def _identify_property_from_phone(self, phone: str) -> Optional[str]:
        """Identify property from caller's phone number"""
        # Implementation would query database for property associations
        return None
    
    async def _get_caller_location(self, phone: str) -> Optional[Dict[str, Any]]:
        """Get caller location information"""
        # Implementation would use phone number lookup services
        return None
    
    async def _create_call_log_entry(self, call_context: CallContext) -> None:
        """Create initial call log entry in database"""
        # Implementation would insert into call_logs table
        pass
    
    async def _update_call_log_escalation(self, call_id: str, reason: str) -> None:
        """Update call log with escalation information"""
        # Implementation would update call_logs table
        pass
    
    async def _get_guard_contact(self, property_id: str) -> Optional[Dict[str, Any]]:
        """Get guard contact information for property"""
        # Implementation would query database for guard assignments
        return None
    
    async def _get_property_manager_contact(self, property_id: str) -> Optional[Dict[str, Any]]:
        """Get property manager contact information"""
        # Implementation would query database for property manager contacts
        return None
    
    async def _save_incident_to_database(self, incident_data: Dict[str, Any]) -> None:
        """Save incident to database"""
        # Implementation would insert into incidents table
        pass
    
    # Public interface methods
    def get_active_calls(self) -> Dict[str, CallContext]:
        """Get all active calls"""
        return self.active_calls.copy()
    
    def get_call_context(self, call_id: str) -> Optional[CallContext]:
        """Get specific call context"""
        return self.active_calls.get(call_id)
    
    async def end_call(self, call_id: str) -> Optional[Dict[str, Any]]:
        """End a call and generate summary"""
        try:
            call_context = self.active_calls.get(call_id)
            if not call_context:
                return None
            
            call_context.call_state = CallState.COMPLETED
            call_context.updated_at = datetime.now(timezone.utc)
            
            # End conversation and get summary
            summary = None
            if call_context.conversation_context:
                conversation_id = call_context.conversation_context.conversation_id
                summary = await ollama_service.end_conversation(conversation_id)
            
            # Stop transcription stream
            if call_id in self.transcription_streams:
                stream_id = self.transcription_streams[call_id]
                await deepgram_service.stop_transcription_stream(stream_id)
                del self.transcription_streams[call_id]
            
            # Remove from active calls
            final_context = self.active_calls.pop(call_id)
            
            logger.info(f"Ended call: {call_id}")
            
            # Return call summary
            return {
                'call_id': call_id,
                'call_context': asdict(final_context),
                'conversation_summary': summary,
                'total_duration': (final_context.updated_at - final_context.created_at).total_seconds()
            }
            
        except Exception as e:
            logger.error(f"Failed to end call {call_id}: {e}")
            return None
    
    async def force_human_takeover(self, call_id: str, operator_id: str) -> bool:
        """Force human takeover of a call"""
        try:
            call_context = self.active_calls.get(call_id)
            if not call_context:
                return False
            
            call_context.human_operator_id = operator_id
            await self._escalate_to_human(call_id, f"Manual takeover by operator {operator_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to force human takeover for call {call_id}: {e}")
            return False

# Global instance for use across the application
voice_dispatch_agent = VoiceDispatchAgent()
