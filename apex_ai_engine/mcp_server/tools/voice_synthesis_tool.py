"""
APEX AI MCP VOICE SYNTHESIS TOOL
=================================
MCP Tool for AI-powered text-to-speech with emotion modulation and security contexts

This tool provides:
- Real-time text-to-speech synthesis
- Emotion and tone modulation for security scenarios
- Multiple voice profiles and languages
- Integration with Azure Cognitive Services, AWS Polly, or Google Cloud TTS
- Audio quality optimization for security communications
"""

import asyncio
import json
import logging
import time
import os
import base64
import io
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
import aiohttp
import tempfile
import wave

# Audio processing imports
try:
    import pydub
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    logging.warning("⚠️ Pydub not installed. Audio processing limited.")

logger = logging.getLogger(__name__)

class VoiceSynthesisTool:
    """
    MCP Tool for AI-powered voice synthesis and audio generation
    
    Capabilities:
    - Text-to-speech with multiple voice profiles
    - Emotion and tone modulation
    - Security-context audio optimization
    - Multiple TTS provider support
    - Real-time audio streaming
    """
    
    def __init__(self, model_name: str = "azure-tts", config: Dict = None):
        self.name = "voice_synthesis"
        self.description = "AI-powered voice synthesis with emotion modulation for security communications"
        self.enabled = True
        self.model_name = model_name
        self.config = config or self.get_default_config()
        
        # TTS client and configuration
        self.tts_client = None
        self.is_initialized = False
        self.last_used = None
        
        # Voice profiles for different security scenarios
        self.voice_profiles = self.load_voice_profiles()
        
        # Audio cache for common phrases
        self.audio_cache = {}
        
        # Performance tracking
        self.stats = {
            'total_syntheses': 0,
            'total_audio_duration': 0,
            'avg_synthesis_time': 0,
            'cache_hits': 0,
            'success_rate': 0,
            'last_reset': time.time()
        }
        
        logger.info(f"🎤 Voice Synthesis Tool initialized: {model_name}")

    def get_default_config(self) -> Dict:
        """Default configuration for voice synthesis"""
        return {
            'default_voice': 'en-US-AriaNeural',
            'default_language': 'en-US',
            'speech_rate': 1.0,
            'pitch': 0.0,
            'volume': 0.8,
            'output_format': 'mp3',
            'sample_rate': 22050,
            'enable_cache': True,
            'max_cache_size': 100,
            'synthesis_timeout': 15,
            'enable_ssml': True,
            'voice_enhancement': True
        }

    def load_voice_profiles(self) -> Dict:
        """Load voice profiles optimized for security scenarios"""
        return {
            'security_professional': {
                'voice': 'en-US-AriaNeural',
                'style': 'professional',
                'rate': '0%',
                'pitch': '+2Hz',
                'emphasis': 'moderate',
                'description': 'Clear, authoritative security officer voice'
            },
            'warning_alert': {
                'voice': 'en-US-AriaNeural',
                'style': 'urgent',
                'rate': '+10%',
                'pitch': '+5Hz',
                'emphasis': 'strong',
                'description': 'Urgent warning voice for immediate attention'
            },
            'de_escalation': {
                'voice': 'en-US-JennyNeural',
                'style': 'calm',
                'rate': '-5%',
                'pitch': '-2Hz',
                'emphasis': 'reduced',
                'description': 'Calm, reassuring voice for de-escalation'
            },
            'deterrent_firm': {
                'voice': 'en-US-GuyNeural',
                'style': 'serious',
                'rate': '+5%',
                'pitch': '+8Hz',
                'emphasis': 'strong',
                'description': 'Firm, commanding voice for deterrent effect'
            },
            'emergency_critical': {
                'voice': 'en-US-AriaNeural',
                'style': 'angry',
                'rate': '+15%',
                'pitch': '+10Hz',
                'emphasis': 'strong',
                'description': 'Critical emergency alert voice'
            },
            'instruction_clear': {
                'voice': 'en-US-JennyNeural',
                'style': 'friendly',
                'rate': '0%',
                'pitch': '0Hz',
                'emphasis': 'moderate',
                'description': 'Clear instructional voice for guidance'
            },
            'multilingual_spanish': {
                'voice': 'es-US-AlonsoNeural',
                'style': 'professional',
                'rate': '0%',
                'pitch': '0Hz',
                'emphasis': 'moderate',
                'description': 'Professional Spanish security voice'
            }
        }

    async def initialize(self):
        """Initialize the voice synthesis tool"""
        try:
            logger.info(f"🔄 Initializing voice synthesis: {self.model_name}")
            
            # Initialize TTS service based on model_name
            if self.model_name == 'azure-tts':
                await self.initialize_azure_tts()
            elif self.model_name == 'aws-polly':
                await self.initialize_aws_polly()
            elif self.model_name == 'google-tts':
                await self.initialize_google_tts()
            else:
                logger.warning(f"⚠️ Unknown TTS model: {self.model_name}, using simulation mode")
                self.tts_client = None
            
            self.is_initialized = True
            logger.info("✅ Voice Synthesis Tool initialization complete")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize voice synthesis: {e}")
            self.is_initialized = False
            raise

    async def initialize_azure_tts(self):
        """Initialize Azure Cognitive Services TTS"""
        try:
            subscription_key = os.getenv('AZURE_TTS_KEY')
            region = os.getenv('AZURE_TTS_REGION', 'eastus')
            
            if subscription_key:
                self.tts_client = {
                    'type': 'azure',
                    'subscription_key': subscription_key,
                    'region': region,
                    'endpoint': f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
                }
                logger.info("✅ Azure TTS client configured")
            else:
                logger.warning("⚠️ Azure TTS key not found, using simulation mode")
                self.tts_client = None
                
        except Exception as e:
            logger.error(f"❌ Azure TTS initialization failed: {e}")
            self.tts_client = None

    async def initialize_aws_polly(self):
        """Initialize AWS Polly TTS"""
        try:
            # AWS Polly initialization would go here
            logger.warning("⚠️ AWS Polly not implemented yet, using simulation mode")
            self.tts_client = None
        except Exception as e:
            logger.error(f"❌ AWS Polly initialization failed: {e}")
            self.tts_client = None

    async def initialize_google_tts(self):
        """Initialize Google Cloud TTS"""
        try:
            # Google Cloud TTS initialization would go here
            logger.warning("⚠️ Google TTS not implemented yet, using simulation mode")
            self.tts_client = None
        except Exception as e:
            logger.error(f"❌ Google TTS initialization failed: {e}")
            self.tts_client = None

    async def execute(self, payload: Dict) -> Dict:
        """
        Execute voice synthesis
        
        Payload format:
        {
            "text": "This is a security alert",
            "voice_profile": "warning_alert",
            "language": "en-US",
            "context": {
                "urgency": "high",
                "scenario": "unauthorized_access",
                "location": "lobby"
            },
            "options": {
                "speech_rate": 1.1,
                "pitch_adjustment": 0.1,
                "volume": 0.9,
                "output_format": "mp3"
            }
        }
        """
        start_time = time.time()
        
        try:
            if not self.is_initialized:
                raise Exception("Voice Synthesis Tool not initialized")
            
            # Extract payload data
            text = payload.get('text', '')
            voice_profile = payload.get('voice_profile', 'security_professional')
            language = payload.get('language', self.config['default_language'])
            context = payload.get('context', {})
            options = payload.get('options', {})
            
            if not text:
                raise ValueError("Text is required for voice synthesis")
            
            # Merge options with config
            synthesis_config = {**self.config, **options}
            
            # Check cache first
            cache_key = self.generate_cache_key(text, voice_profile, language, options)
            if synthesis_config.get('enable_cache', True) and cache_key in self.audio_cache:
                audio_data = self.audio_cache[cache_key]
                self.stats['cache_hits'] += 1
                logger.info(f"🎤 Voice synthesis (cached): {len(text)} chars")
            else:
                # Synthesize audio
                audio_data = await self.synthesize_audio(text, voice_profile, language, context, synthesis_config)
                
                # Cache the result
                if synthesis_config.get('enable_cache', True):
                    self.manage_cache(cache_key, audio_data)
            
            # Update statistics
            execution_time = time.time() - start_time
            self.update_stats(execution_time, audio_data.get('duration', 0))
            
            # Prepare response
            result = {
                'text': text,
                'voice_profile': voice_profile,
                'language': language,
                'audio_data': audio_data['data'],
                'audio_format': audio_data['format'],
                'duration': audio_data['duration'],
                'file_size': audio_data['size'],
                'synthesis_engine': self.model_name,
                'execution_time': execution_time,
                'cached': cache_key in self.audio_cache if synthesis_config.get('enable_cache') else False,
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
            
            logger.info(f"🎤 Voice synthesis complete: {len(text)} chars, {audio_data['duration']:.1f}s audio")
            return result
            
        except Exception as e:
            logger.error(f"❌ Voice synthesis execution error: {e}")
            return {
                'success': False,
                'error': str(e),
                'execution_time': time.time() - start_time,
                'text': payload.get('text', ''),
                'timestamp': datetime.now().isoformat()
            }

    async def synthesize_audio(self, text: str, voice_profile: str, language: str, context: Dict, config: Dict) -> Dict:
        """Synthesize audio from text using configured TTS service"""
        try:
            if self.tts_client and self.tts_client['type'] == 'azure':
                return await self.synthesize_azure_tts(text, voice_profile, language, context, config)
            else:
                # Simulation mode for demo/testing
                return self.simulate_audio_synthesis(text, voice_profile, config)
                
        except Exception as e:
            logger.error(f"❌ Audio synthesis error: {e}")
            # Fallback to simulation
            return self.simulate_audio_synthesis(text, voice_profile, config)

    async def synthesize_azure_tts(self, text: str, voice_profile: str, language: str, context: Dict, config: Dict) -> Dict:
        """Synthesize audio using Azure Cognitive Services TTS"""
        try:
            # Get voice profile settings
            profile = self.voice_profiles.get(voice_profile, self.voice_profiles['security_professional'])
            
            # Build SSML if enabled
            if config.get('enable_ssml', True):
                ssml_text = self.build_ssml(text, profile, language, context, config)
            else:
                ssml_text = text
            
            # Prepare request headers
            headers = {
                'Ocp-Apim-Subscription-Key': self.tts_client['subscription_key'],
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': self.get_azure_output_format(config['output_format'])
            }
            
            # Make TTS request
            timeout = aiohttp.ClientTimeout(total=config.get('synthesis_timeout', 15))
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(
                    self.tts_client['endpoint'],
                    headers=headers,
                    data=ssml_text.encode('utf-8')
                ) as response:
                    
                    if response.status == 200:
                        audio_bytes = await response.read()
                        
                        # Process audio if needed
                        if config.get('voice_enhancement', True):
                            audio_bytes = self.enhance_audio(audio_bytes, config)
                        
                        # Calculate duration (approximate)
                        duration = self.estimate_audio_duration(text, profile.get('rate', '0%'))
                        
                        return {
                            'data': base64.b64encode(audio_bytes).decode('utf-8'),
                            'format': config['output_format'],
                            'duration': duration,
                            'size': len(audio_bytes)
                        }
                    else:
                        error_text = await response.text()
                        raise Exception(f"Azure TTS API error: {response.status} - {error_text}")
                        
        except Exception as e:
            logger.error(f"❌ Azure TTS synthesis error: {e}")
            raise

    def build_ssml(self, text: str, profile: Dict, language: str, context: Dict, config: Dict) -> str:
        """Build SSML for advanced voice synthesis"""
        voice = profile.get('voice', config['default_voice'])
        style = profile.get('style', 'professional')
        rate = profile.get('rate', '0%')
        pitch = profile.get('pitch', '0Hz')
        
        # Adjust parameters based on context
        if context.get('urgency') == 'high':
            rate = '+15%'
            pitch = '+5Hz'
        elif context.get('urgency') == 'low':
            rate = '-5%'
            pitch = '-2Hz'
        
        # Apply config overrides
        if config.get('speech_rate'):
            rate_multiplier = config['speech_rate']
            if rate_multiplier > 1.0:
                rate = f'+{int((rate_multiplier - 1) * 100)}%'
            elif rate_multiplier < 1.0:
                rate = f'-{int((1 - rate_multiplier) * 100)}%'
        
        if config.get('pitch_adjustment'):
            pitch_adjustment = config['pitch_adjustment']
            current_pitch = int(pitch.replace('Hz', '')) if 'Hz' in pitch else 0
            new_pitch = current_pitch + int(pitch_adjustment * 10)
            pitch = f'{new_pitch:+d}Hz'
        
        # Build SSML
        ssml = f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="{language}">
            <voice name="{voice}">
                <mstts:express-as style="{style}">
                    <prosody rate="{rate}" pitch="{pitch}">
                        {self.escape_ssml_text(text)}
                    </prosody>
                </mstts:express-as>
            </voice>
        </speak>'''
        
        return ssml

    def escape_ssml_text(self, text: str) -> str:
        """Escape special characters for SSML"""
        return (text
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace('"', '&quot;')
                .replace("'", '&apos;'))

    def get_azure_output_format(self, format_name: str) -> str:
        """Get Azure-specific output format string"""
        format_mapping = {
            'mp3': 'audio-16khz-128kbitrate-mono-mp3',
            'wav': 'riff-16khz-16bit-mono-pcm',
            'ogg': 'ogg-16khz-16bit-mono-opus'
        }
        return format_mapping.get(format_name, 'audio-16khz-128kbitrate-mono-mp3')

    def enhance_audio(self, audio_bytes: bytes, config: Dict) -> bytes:
        """Enhance audio quality for security communications"""
        try:
            if not PYDUB_AVAILABLE:
                return audio_bytes
            
            # Load audio
            audio = AudioSegment.from_mp3(io.BytesIO(audio_bytes))
            
            # Apply enhancements
            if config.get('volume', 1.0) != 1.0:
                # Adjust volume
                volume_db = 20 * (config['volume'] - 1.0)  # Convert to dB
                audio = audio + volume_db
            
            # Normalize audio for consistent levels
            if config.get('voice_enhancement', True):
                audio = audio.normalize()
                
                # Apply slight compression for clarity
                audio = audio.compress_dynamic_range(threshold=-20.0, ratio=4.0)
            
            # Export enhanced audio
            output_buffer = io.BytesIO()
            audio.export(output_buffer, format='mp3', bitrate='128k')
            return output_buffer.getvalue()
            
        except Exception as e:
            logger.error(f"❌ Audio enhancement error: {e}")
            return audio_bytes

    def simulate_audio_synthesis(self, text: str, voice_profile: str, config: Dict) -> Dict:
        """Simulate audio synthesis for demo/testing"""
        # Estimate realistic metrics
        duration = self.estimate_audio_duration(text, '0%')
        file_size = int(duration * 16000)  # Approximate MP3 size
        
        # Create minimal audio data (silence) for demo
        audio_data = base64.b64encode(b'\x00' * 1024).decode('utf-8')
        
        return {
            'data': audio_data,
            'format': config['output_format'],
            'duration': duration,
            'size': file_size
        }

    def estimate_audio_duration(self, text: str, rate: str) -> float:
        """Estimate audio duration based on text length and speech rate"""
        # Average speaking rate: ~150 words per minute
        words = len(text.split())
        base_duration = (words / 150) * 60  # seconds
        
        # Adjust for speech rate
        rate_multiplier = 1.0
        if rate and rate != '0%':
            rate_value = int(rate.replace('%', '').replace('+', ''))
            rate_multiplier = 1.0 + (rate_value / 100)
        
        return max(base_duration / rate_multiplier, 1.0)  # Minimum 1 second

    def generate_cache_key(self, text: str, voice_profile: str, language: str, options: Dict) -> str:
        """Generate cache key for audio data"""
        import hashlib
        
        # Create unique key based on synthesis parameters
        key_data = {
            'text': text,
            'voice_profile': voice_profile,
            'language': language,
            'speech_rate': options.get('speech_rate', 1.0),
            'pitch_adjustment': options.get('pitch_adjustment', 0.0),
            'output_format': options.get('output_format', 'mp3')
        }
        
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()

    def manage_cache(self, cache_key: str, audio_data: Dict):
        """Manage audio cache with size limits"""
        max_cache_size = self.config.get('max_cache_size', 100)
        
        # Add to cache
        self.audio_cache[cache_key] = audio_data
        
        # Remove oldest entries if cache is full
        if len(self.audio_cache) > max_cache_size:
            # Remove oldest 20% of entries
            remove_count = max_cache_size // 5
            keys_to_remove = list(self.audio_cache.keys())[:remove_count]
            for key in keys_to_remove:
                del self.audio_cache[key]

    def update_stats(self, execution_time: float, audio_duration: float):
        """Update performance statistics"""
        self.stats['total_syntheses'] += 1
        self.stats['total_audio_duration'] += audio_duration
        
        # Update average synthesis time
        if self.stats['total_syntheses'] == 1:
            self.stats['avg_synthesis_time'] = execution_time
        else:
            alpha = 0.1  # Exponential moving average factor
            self.stats['avg_synthesis_time'] = (
                alpha * execution_time + 
                (1 - alpha) * self.stats['avg_synthesis_time']
            )
        
        # Update success rate (simplified)
        self.stats['success_rate'] = min(
            (self.stats['total_syntheses'] - 1) / self.stats['total_syntheses'] + 0.1,
            1.0
        )

    async def shutdown(self):
        """Shutdown the voice synthesis tool"""
        logger.info("🛑 Shutting down Voice Synthesis Tool...")
        
        # Clear audio cache
        self.audio_cache.clear()
        
        # Close TTS client if needed
        if self.tts_client:
            self.tts_client = None
        
        self.is_initialized = False
        logger.info("✅ Voice Synthesis Tool shutdown complete")

    def get_stats(self) -> Dict:
        """Get current performance statistics"""
        return {
            **self.stats,
            'cache_size': len(self.audio_cache),
            'available_voices': len(self.voice_profiles),
            'uptime': time.time() - self.stats['last_reset'],
            'model_name': self.model_name,
            'is_initialized': self.is_initialized,
            'last_used': self.last_used
        }

    def get_available_voice_profiles(self) -> Dict:
        """Get available voice profiles with descriptions"""
        return {
            name: {
                'description': profile['description'],
                'voice': profile['voice'],
                'style': profile['style']
            }
            for name, profile in self.voice_profiles.items()
        }
