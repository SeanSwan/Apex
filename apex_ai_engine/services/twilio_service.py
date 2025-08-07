"""
TWILIO SERVICE - MASTER PROMPT v52.0
====================================
Twilio integration service for Voice AI Dispatcher
Handles programmable voice calls, WebRTC streams, and call management

Features:
- Inbound/outbound call handling
- Real-time audio streaming
- Call recording and transcription
- Conference calls and call routing
- WebHook event processing
- Production-grade error handling
- Comprehensive logging and monitoring
"""

import os
import asyncio
import logging
from typing import Optional, Dict, Any, List, Callable
from datetime import datetime, timezone
import json
from twilio.rest import Client
from twilio.twiml import VoiceResponse
from twilio.base.exceptions import TwilioException
import requests

# Set up logging
logger = logging.getLogger(__name__)

class TwilioService:
    """
    Comprehensive Twilio integration service for Voice AI Dispatcher
    """
    
    def __init__(self):
        """Initialize Twilio service with credentials and configuration"""
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.phone_number = os.getenv('TWILIO_PHONE_NUMBER')  # Our main dispatch number
        self.webhook_base_url = os.getenv('WEBHOOK_BASE_URL', 'https://your-domain.com')
        
        if not all([self.account_sid, self.auth_token, self.phone_number]):
            raise ValueError("Missing required Twilio credentials in environment variables")
            
        self.client = Client(self.account_sid, self.auth_token)
        self.active_calls: Dict[str, Dict[str, Any]] = {}
        self.call_handlers: Dict[str, Callable] = {}
        
        logger.info("TwilioService initialized successfully")
    
    async def create_outbound_call(
        self,
        to_number: str,
        from_number: Optional[str] = None,
        call_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create an outbound call for police/emergency services
        
        Args:
            to_number: Destination phone number (E.164 format)
            from_number: Source phone number (defaults to main dispatch number)
            call_context: Additional context for the call
            
        Returns:
            Dict containing call information and Twilio Call SID
        """
        try:
            from_number = from_number or self.phone_number
            
            # Create TwiML for outbound call
            twiml_url = f"{self.webhook_base_url}/api/voice/twiml/outbound"
            
            call = self.client.calls.create(
                to=to_number,
                from_=from_number,
                url=twiml_url,
                method='POST',
                record=True,  # Always record for compliance
                recording_status_callback=f"{self.webhook_base_url}/api/voice/recording-status",
                status_callback=f"{self.webhook_base_url}/api/voice/status",
                status_callback_method='POST',
                status_callback_event=['initiated', 'ringing', 'answered', 'completed']
            )
            
            call_info = {
                'call_sid': call.sid,
                'to_number': to_number,
                'from_number': from_number,
                'status': call.status,
                'direction': 'outbound',
                'created_at': datetime.now(timezone.utc).isoformat(),
                'context': call_context or {}
            }
            
            self.active_calls[call.sid] = call_info
            
            logger.info(f"Outbound call created: {call.sid} to {to_number}")
            return call_info
            
        except TwilioException as e:
            logger.error(f"Failed to create outbound call to {to_number}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating outbound call: {e}")
            raise
    
    def generate_inbound_twiml(
        self,
        call_sid: str,
        from_number: str,
        property_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate TwiML for inbound call handling by Voice AI
        
        Args:
            call_sid: Twilio Call SID
            from_number: Caller's phone number
            property_context: Property information if available
            
        Returns:
            TwiML XML string for call handling
        """
        try:
            response = VoiceResponse()
            
            # Initial greeting
            response.say(
                "Thank you for calling APEX AI Security. "
                "Your call is being handled by our AI dispatcher. "
                "Please hold while we connect you.",
                voice='alice',
                language='en-US'
            )
            
            # Pause for system preparation
            response.pause(length=2)
            
            # Start WebSocket stream for real-time processing
            start = response.start()
            start.stream(
                url=f"wss://{self.webhook_base_url.replace('https://', '')}/api/voice/stream",
                track='both_tracks'  # Capture both caller and AI audio
            )
            
            # Initial AI response
            response.say(
                "Hello, I'm the APEX AI security dispatcher. "
                "I'm here to help you with your security concern. "
                "Can you please tell me the nature of your emergency or inquiry?",
                voice='alice',
                language='en-US'
            )
            
            # Gather caller input with timeout
            gather = response.gather(
                input='speech',
                timeout=10,
                speech_timeout='auto',
                action=f"{self.webhook_base_url}/api/voice/process-speech",
                method='POST',
                language='en-US'
            )
            
            # Fallback if no input received
            response.say(
                "I didn't hear anything. Let me transfer you to a human operator.",
                voice='alice',
                language='en-US'
            )
            
            # Redirect to human operator
            response.redirect(f"{self.webhook_base_url}/api/voice/human-takeover")
            
            # Store call context
            call_info = {
                'call_sid': call_sid,
                'from_number': from_number,
                'direction': 'inbound',
                'status': 'in_progress',
                'ai_handling': True,
                'started_at': datetime.now(timezone.utc).isoformat(),
                'property_context': property_context or {}
            }
            
            self.active_calls[call_sid] = call_info
            
            logger.info(f"Generated TwiML for inbound call: {call_sid} from {from_number}")
            return str(response)
            
        except Exception as e:
            logger.error(f"Error generating TwiML for call {call_sid}: {e}")
            # Fallback TwiML
            response = VoiceResponse()
            response.say(
                "We're experiencing technical difficulties. "
                "Please hold while we transfer you to a human operator.",
                voice='alice'
            )
            response.redirect(f"{self.webhook_base_url}/api/voice/human-takeover")
            return str(response)
    
    def generate_ai_response_twiml(
        self,
        ai_response_text: str,
        continue_conversation: bool = True,
        transfer_to_human: bool = False
    ) -> str:
        """
        Generate TwiML for AI response during conversation
        
        Args:
            ai_response_text: Text for AI to speak
            continue_conversation: Whether to continue listening
            transfer_to_human: Whether to transfer to human operator
            
        Returns:
            TwiML XML string
        """
        try:
            response = VoiceResponse()
            
            # AI speaks the response
            response.say(
                ai_response_text,
                voice='alice',
                language='en-US'
            )
            
            if transfer_to_human:
                # Transfer to human operator
                response.say(
                    "Let me transfer you to a human operator who can assist you further.",
                    voice='alice',
                    language='en-US'
                )
                response.redirect(f"{self.webhook_base_url}/api/voice/human-takeover")
                
            elif continue_conversation:
                # Continue conversation - gather more input
                gather = response.gather(
                    input='speech',
                    timeout=10,
                    speech_timeout='auto',
                    action=f"{self.webhook_base_url}/api/voice/process-speech",
                    method='POST',
                    language='en-US'
                )
                
                # Timeout fallback
                response.say(
                    "I didn't hear anything. Is there anything else I can help you with?",
                    voice='alice',
                    language='en-US'
                )
                
                # Final gather attempt
                final_gather = response.gather(
                    input='speech',
                    timeout=5,
                    speech_timeout='auto',
                    action=f"{self.webhook_base_url}/api/voice/process-speech",
                    method='POST',
                    language='en-US'
                )
                
                # End call gracefully
                response.say(
                    "Thank you for calling APEX AI Security. Have a great day!",
                    voice='alice',
                    language='en-US'
                )
                response.hangup()
            else:
                # End conversation
                response.say(
                    "Thank you for calling APEX AI Security. Have a great day!",
                    voice='alice',
                    language='en-US'
                )
                response.hangup()
            
            return str(response)
            
        except Exception as e:
            logger.error(f"Error generating AI response TwiML: {e}")
            # Fallback
            response = VoiceResponse()
            response.say("I'm experiencing technical difficulties. Transferring you now.")
            response.redirect(f"{self.webhook_base_url}/api/voice/human-takeover")
            return str(response)
    
    def generate_human_takeover_twiml(self, operator_number: str) -> str:
        """
        Generate TwiML for transferring call to human operator
        
        Args:
            operator_number: Phone number of human operator
            
        Returns:
            TwiML XML string for call transfer
        """
        try:
            response = VoiceResponse()
            
            response.say(
                "Connecting you to a human operator. Please hold.",
                voice='alice',
                language='en-US'
            )
            
            # Dial human operator
            dial = response.dial(
                timeout=30,
                action=f"{self.webhook_base_url}/api/voice/transfer-status",
                method='POST'
            )
            dial.number(operator_number)
            
            # Fallback if operator doesn't answer
            response.say(
                "I'm sorry, but no operators are currently available. "
                "Please call back during business hours or leave a message.",
                voice='alice',
                language='en-US'
            )
            
            # Could add voicemail functionality here
            response.hangup()
            
            return str(response)
            
        except Exception as e:
            logger.error(f"Error generating human takeover TwiML: {e}")
            response = VoiceResponse()
            response.say("We're experiencing technical difficulties. Please call back later.")
            response.hangup()
            return str(response)
    
    async def handle_call_status_update(
        self,
        call_sid: str,
        status: str,
        duration: Optional[int] = None
    ) -> None:
        """
        Handle call status updates from Twilio webhooks
        
        Args:
            call_sid: Twilio Call SID
            status: New call status
            duration: Call duration in seconds (if completed)
        """
        try:
            if call_sid in self.active_calls:
                self.active_calls[call_sid]['status'] = status
                self.active_calls[call_sid]['updated_at'] = datetime.now(timezone.utc).isoformat()
                
                if duration is not None:
                    self.active_calls[call_sid]['duration_seconds'] = duration
                
                # If call is completed, move to archive
                if status in ['completed', 'failed', 'busy', 'no-answer', 'canceled']:
                    call_info = self.active_calls.pop(call_sid)
                    logger.info(f"Call {call_sid} completed with status: {status}")
                    
                    # Here you would typically save to database
                    # await self.save_call_log(call_info)
                
                logger.debug(f"Updated call {call_sid} status to: {status}")
            else:
                logger.warning(f"Received status update for unknown call: {call_sid}")
                
        except Exception as e:
            logger.error(f"Error handling call status update: {e}")
    
    async def get_call_recordings(self, call_sid: str) -> List[Dict[str, Any]]:
        """
        Retrieve call recordings for a specific call
        
        Args:
            call_sid: Twilio Call SID
            
        Returns:
            List of recording information
        """
        try:
            recordings = self.client.recordings.list(call_sid=call_sid)
            
            recording_list = []
            for recording in recordings:
                recording_info = {
                    'recording_sid': recording.sid,
                    'call_sid': recording.call_sid,
                    'duration': recording.duration,
                    'url': f"https://api.twilio.com{recording.uri.replace('.json', '.mp3')}",
                    'created_at': recording.date_created.isoformat() if recording.date_created else None
                }
                recording_list.append(recording_info)
            
            logger.info(f"Retrieved {len(recording_list)} recordings for call {call_sid}")
            return recording_list
            
        except TwilioException as e:
            logger.error(f"Failed to retrieve recordings for call {call_sid}: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error retrieving recordings: {e}")
            return []
    
    async def download_recording(self, recording_url: str, local_path: str) -> bool:
        """
        Download a call recording to local storage
        
        Args:
            recording_url: Twilio recording URL
            local_path: Local file path to save recording
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Use Twilio credentials for authenticated download
            response = requests.get(
                recording_url,
                auth=(self.account_sid, self.auth_token),
                stream=True
            )
            response.raise_for_status()
            
            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            logger.info(f"Recording downloaded successfully to: {local_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to download recording: {e}")
            return False
    
    def get_active_calls(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all currently active calls
        
        Returns:
            Dictionary of active calls
        """
        return self.active_calls.copy()
    
    def get_call_info(self, call_sid: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a specific call
        
        Args:
            call_sid: Twilio Call SID
            
        Returns:
            Call information or None if not found
        """
        return self.active_calls.get(call_sid)
    
    async def end_call(self, call_sid: str) -> bool:
        """
        Terminate an active call
        
        Args:
            call_sid: Twilio Call SID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            call = self.client.calls(call_sid).update(status='completed')
            logger.info(f"Call {call_sid} terminated successfully")
            return True
            
        except TwilioException as e:
            logger.error(f"Failed to terminate call {call_sid}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error terminating call: {e}")
            return False

# Global instance for use across the application
twilio_service = TwilioService()
