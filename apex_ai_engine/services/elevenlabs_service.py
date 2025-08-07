"""
ELEVENLABS SERVICE - MASTER PROMPT v52.0
=========================================
ElevenLabs integration service for high-quality text-to-speech
Handles voice synthesis for Voice AI Dispatcher

Features:
- High-quality voice synthesis
- Multiple voice models and styles
- Real-time streaming TTS
- Custom voice cloning
- Emotion and tone control
- Voice stability settings
- Production-grade error handling
- Comprehensive logging and monitoring
"""

import os
import asyncio
import logging
import json
import aiohttp
import io
from typing import Optional, Dict, Any, List, AsyncGenerator
from datetime import datetime, timezone
from dataclasses import dataclass
import base64

# Set up logging
logger = logging.getLogger(__name__)

@dataclass
class VoiceSettings:
    """Voice configuration settings"""
    stability: float = 0.75  # 0.0-1.0, higher = more stable/consistent
    similarity_boost: float = 0.8  # 0.0-1.0, higher = more similar to original
    style: float = 0.5  # 0.0-1.0, style enhancement
    use_speaker_boost: bool = True

@dataclass
class TTSResult:
    """Text-to-speech result"""
    audio_data: bytes
    voice_id: str
    text: str
    settings: VoiceSettings
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

class ElevenLabsService:
    """
    Comprehensive ElevenLabs integration service for Voice AI Dispatcher
    """
    
    def __init__(self):
        """Initialize ElevenLabs service with API credentials"""
        self.api_key = os.getenv('ELEVENLABS_API_KEY')
        self.base_url = "https://api.elevenlabs.io/v1"
        
        if not self.api_key:
            raise ValueError("Missing ELEVENLABS_API_KEY environment variable")
        
        self.headers = {
            'Accept': 'audio/mpeg',
            'xi-api-key': self.api_key,
            'Content-Type': 'application/json'
        }
        
        # Pre-configured voices for different scenarios
        self.voice_profiles = {
            'dispatcher_female': {
                'voice_id': 'EXAVITQu4vr4xnSDxMaL',  # Bella - Professional female
                'settings': VoiceSettings(stability=0.85, similarity_boost=0.75, style=0.3),
                'description': 'Professional, calm female dispatcher voice'
            },
            'dispatcher_male': {
                'voice_id': 'ErXwobaYiN019PkySvjV',  # Antoni - Professional male
                'settings': VoiceSettings(stability=0.80, similarity_boost=0.80, style=0.4),
                'description': 'Professional, authoritative male dispatcher voice'
            },
            'emergency_female': {
                'voice_id': 'EXAVITQu4vr4xnSDxMaL',  # Bella with emergency settings
                'settings': VoiceSettings(stability=0.90, similarity_boost=0.85, style=0.6),
                'description': 'Emergency response female voice - urgent but controlled'
            },
            'emergency_male': {
                'voice_id': 'ErXwobaYiN019PkySvjV',  # Antoni with emergency settings
                'settings': VoiceSettings(stability=0.85, similarity_boost=0.85, style=0.7),
                'description': 'Emergency response male voice - urgent but controlled'
            },
            'calm_reassuring': {
                'voice_id': 'ThT5KcBeYPX3keUQqHPh',  # Dorothy - Calm and reassuring
                'settings': VoiceSettings(stability=0.95, similarity_boost=0.70, style=0.2),
                'description': 'Calm, reassuring voice for de-escalation'
            }
        }
        
        # Default voice for general use
        self.default_voice_profile = 'dispatcher_female'
        
        self.active_streams: Dict[str, Dict[str, Any]] = {}
        
        logger.info("ElevenLabsService initialized successfully")
    
    async def text_to_speech(
        self,
        text: str,
        voice_profile: str = None,
        custom_voice_id: str = None,
        custom_settings: Optional[VoiceSettings] = None,
        output_format: str = 'mp3_44100_128'
    ) -> TTSResult:
        """
        Convert text to speech using ElevenLabs API
        
        Args:
            text: Text to convert to speech
            voice_profile: Pre-configured voice profile name
            custom_voice_id: Custom voice ID (overrides profile)
            custom_settings: Custom voice settings (overrides profile)
            output_format: Audio output format
            
        Returns:
            TTSResult with audio data and metadata
        """
        try:
            # Determine voice configuration
            if custom_voice_id and custom_settings:
                voice_id = custom_voice_id
                settings = custom_settings
            else:
                profile_name = voice_profile or self.default_voice_profile
                if profile_name not in self.voice_profiles:
                    raise ValueError(f"Unknown voice profile: {profile_name}")
                
                profile = self.voice_profiles[profile_name]
                voice_id = profile['voice_id']
                settings = custom_settings or profile['settings']
            
            # Prepare request data
            data = {
                'text': text,
                'model_id': 'eleven_multilingual_v2',  # Latest multilingual model
                'voice_settings': {
                    'stability': settings.stability,
                    'similarity_boost': settings.similarity_boost,
                    'style': settings.style,
                    'use_speaker_boost': settings.use_speaker_boost
                }
            }
            
            # Set output format in headers
            headers = self.headers.copy()
            if output_format != 'mp3_44100_128':
                headers['Accept'] = f'audio/{output_format}'
            
            url = f"{self.base_url}/text-to-speech/{voice_id}"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=data) as response:
                    if response.status == 200:
                        audio_data = await response.read()
                        
                        result = TTSResult(
                            audio_data=audio_data,
                            voice_id=voice_id,
                            text=text,
                            settings=settings,
                            timestamp=datetime.now(timezone.utc),
                            metadata={
                                'output_format': output_format,
                                'audio_size': len(audio_data),
                                'voice_profile': voice_profile,
                                'model_id': 'eleven_multilingual_v2'
                            }
                        )
                        
                        logger.info(f"Generated TTS for text: '{text[:50]}...' "
                                  f"({len(audio_data)} bytes)")
                        return result
                    else:
                        error_text = await response.text()
                        raise Exception(f"ElevenLabs API error: {response.status} - {error_text}")
                        
        except Exception as e:
            logger.error(f"Failed to generate TTS for text '{text[:50]}...': {e}")
            raise
    
    async def stream_text_to_speech(
        self,
        text: str,
        voice_profile: str = None,
        custom_voice_id: str = None,
        custom_settings: Optional[VoiceSettings] = None,
        chunk_size: int = 8192
    ) -> AsyncGenerator[bytes, None]:
        """
        Stream text-to-speech audio in chunks for real-time playback
        
        Args:
            text: Text to convert to speech
            voice_profile: Pre-configured voice profile name
            custom_voice_id: Custom voice ID
            custom_settings: Custom voice settings
            chunk_size: Size of audio chunks to yield
            
        Yields:
            Audio data chunks
        """
        try:
            # Determine voice configuration (same logic as text_to_speech)
            if custom_voice_id and custom_settings:
                voice_id = custom_voice_id
                settings = custom_settings
            else:
                profile_name = voice_profile or self.default_voice_profile
                if profile_name not in self.voice_profiles:
                    raise ValueError(f"Unknown voice profile: {profile_name}")
                
                profile = self.voice_profiles[profile_name]
                voice_id = profile['voice_id']
                settings = custom_settings or profile['settings']
            
            # Prepare request data for streaming
            data = {
                'text': text,
                'model_id': 'eleven_multilingual_v2',
                'voice_settings': {
                    'stability': settings.stability,
                    'similarity_boost': settings.similarity_boost,
                    'style': settings.style,
                    'use_speaker_boost': settings.use_speaker_boost
                }
            }
            
            url = f"{self.base_url}/text-to-speech/{voice_id}/stream"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=self.headers, json=data) as response:
                    if response.status == 200:
                        logger.info(f"Started streaming TTS for text: '{text[:50]}...'")
                        
                        async for chunk in response.content.iter_chunked(chunk_size):
                            if chunk:
                                yield chunk
                                
                        logger.debug(f"Completed streaming TTS for text: '{text[:50]}...'")
                    else:
                        error_text = await response.text()
                        raise Exception(f"ElevenLabs streaming API error: {response.status} - {error_text}")
                        
        except Exception as e:
            logger.error(f"Failed to stream TTS for text '{text[:50]}...': {e}")
            raise
    
    async def get_available_voices(self) -> List[Dict[str, Any]]:
        """
        Get list of available voices from ElevenLabs
        
        Returns:
            List of voice information
        """
        try:
            url = f"{self.base_url}/voices"
            headers = {'xi-api-key': self.api_key}
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        voices = data.get('voices', [])
                        
                        logger.info(f"Retrieved {len(voices)} available voices")
                        return voices
                    else:
                        error_text = await response.text()
                        raise Exception(f"Failed to get voices: {response.status} - {error_text}")
                        
        except Exception as e:
            logger.error(f"Error retrieving available voices: {e}")
            raise
    
    async def get_voice_info(self, voice_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific voice
        
        Args:
            voice_id: ElevenLabs voice ID
            
        Returns:
            Voice information and settings
        """
        try:
            url = f"{self.base_url}/voices/{voice_id}"
            headers = {'xi-api-key': self.api_key}
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        voice_info = await response.json()
                        logger.debug(f"Retrieved info for voice: {voice_id}")
                        return voice_info
                    else:
                        error_text = await response.text()
                        raise Exception(f"Failed to get voice info: {response.status} - {error_text}")
                        
        except Exception as e:
            logger.error(f"Error retrieving voice info for {voice_id}: {e}")
            raise
    
    async def create_emergency_announcement(
        self,
        emergency_text: str,
        urgency_level: str = 'high'
    ) -> TTSResult:
        """
        Create emergency announcement with appropriate voice settings
        
        Args:
            emergency_text: Emergency message text
            urgency_level: 'low', 'medium', 'high', 'critical'
            
        Returns:
            TTSResult with emergency announcement audio
        """
        try:
            # Choose voice profile based on urgency
            if urgency_level in ['high', 'critical']:
                voice_profile = 'emergency_female'
            else:
                voice_profile = 'dispatcher_female'
            
            # Adjust settings for urgency
            settings = self.voice_profiles[voice_profile]['settings']
            
            if urgency_level == 'critical':
                # Maximum clarity and authority for critical emergencies
                settings = VoiceSettings(
                    stability=0.95,
                    similarity_boost=0.90,
                    style=0.8,
                    use_speaker_boost=True
                )
            elif urgency_level == 'high':
                # High urgency but controlled
                settings = VoiceSettings(
                    stability=0.90,
                    similarity_boost=0.85,
                    style=0.6,
                    use_speaker_boost=True
                )
            
            # Add emergency formatting to text if needed
            formatted_text = self._format_emergency_text(emergency_text, urgency_level)
            
            result = await self.text_to_speech(
                text=formatted_text,
                voice_profile=voice_profile,
                custom_settings=settings
            )
            
            result.metadata['emergency_level'] = urgency_level
            result.metadata['formatted_text'] = formatted_text
            
            logger.info(f"Created emergency announcement: {urgency_level} urgency")
            return result
            
        except Exception as e:
            logger.error(f"Failed to create emergency announcement: {e}")
            raise
    
    def _format_emergency_text(self, text: str, urgency_level: str) -> str:
        """
        Format text for emergency announcements with appropriate pacing
        
        Args:
            text: Original emergency text
            urgency_level: Level of urgency
            
        Returns:
            Formatted text with SSML-like pauses and emphasis
        """
        if urgency_level == 'critical':
            # Add pauses for emphasis and clarity
            formatted = f"ATTENTION. {text}. I repeat: {text}."
        elif urgency_level == 'high':
            formatted = f"Attention: {text}."
        else:
            formatted = text
        
        return formatted
    
    def get_voice_profiles(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all available voice profiles and their configurations
        
        Returns:
            Dictionary of voice profiles
        """
        return self.voice_profiles.copy()
    
    def add_custom_voice_profile(
        self,
        profile_name: str,
        voice_id: str,
        settings: VoiceSettings,
        description: str
    ) -> None:
        """
        Add a custom voice profile for specific use cases
        
        Args:
            profile_name: Name for the new profile
            voice_id: ElevenLabs voice ID
            settings: Voice settings configuration
            description: Description of when to use this profile
        """
        self.voice_profiles[profile_name] = {
            'voice_id': voice_id,
            'settings': settings,
            'description': description
        }
        
        logger.info(f"Added custom voice profile: {profile_name}")
    
    async def save_audio_to_file(
        self,
        audio_data: bytes,
        file_path: str,
        format: str = 'mp3'
    ) -> bool:
        """
        Save audio data to file
        
        Args:
            audio_data: Audio data bytes
            file_path: Output file path
            format: Audio format (mp3, wav, etc.)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with open(file_path, 'wb') as f:
                f.write(audio_data)
            
            logger.info(f"Saved audio to file: {file_path} ({len(audio_data)} bytes)")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save audio to {file_path}: {e}")
            return False
    
    async def test_voice_quality(
        self,
        test_text: str = "This is a test of the APEX AI security dispatch system.",
        voice_profile: str = None
    ) -> TTSResult:
        """
        Test voice quality with a standard phrase
        
        Args:
            test_text: Text to use for testing
            voice_profile: Voice profile to test
            
        Returns:
            TTSResult for quality evaluation
        """
        try:
            profile_name = voice_profile or self.default_voice_profile
            result = await self.text_to_speech(
                text=test_text,
                voice_profile=profile_name
            )
            
            logger.info(f"Voice quality test completed for profile: {profile_name}")
            return result
            
        except Exception as e:
            logger.error(f"Voice quality test failed: {e}")
            raise

# Global instance for use across the application
elevenlabs_service = ElevenLabsService()
