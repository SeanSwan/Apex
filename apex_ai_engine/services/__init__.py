"""
APEX AI SERVICES MODULE - MASTER PROMPT v52.0
==============================================
External service integrations for Voice AI Dispatcher

This module provides production-ready integrations with:
- Twilio: Programmable voice and call management
- Deepgram: Real-time speech-to-text transcription  
- ElevenLabs: High-quality text-to-speech synthesis
- Ollama: Local LLM for conversation management

All services include:
- Comprehensive error handling
- Asynchronous operation support
- Production logging and monitoring
- Configuration management
- Rate limiting and retry logic
"""

from .twilio_service import twilio_service, TwilioService
from .deepgram_service import deepgram_service, DeepgramService, TranscriptionResult
from .elevenlabs_service import elevenlabs_service, ElevenLabsService, VoiceSettings, TTSResult
from .ollama_service import (
    ollama_service, 
    OllamaService, 
    ConversationContext, 
    ConversationTurn,
    ConversationState,
    LLMResponse
)

__all__ = [
    # Service instances (singleton pattern)
    'twilio_service',
    'deepgram_service', 
    'elevenlabs_service',
    'ollama_service',
    
    # Service classes
    'TwilioService',
    'DeepgramService',
    'ElevenLabsService', 
    'OllamaService',
    
    # Data structures
    'TranscriptionResult',
    'VoiceSettings',
    'TTSResult',
    'ConversationContext',
    'ConversationTurn',
    'ConversationState',
    'LLMResponse'
]

# Version information
__version__ = '1.0.0'
__author__ = 'APEX AI Development Team'
__description__ = 'Voice AI Dispatcher Service Integrations'
