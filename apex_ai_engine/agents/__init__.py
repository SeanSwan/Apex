"""
APEX AI AGENTS PACKAGE
======================
Specialized AI agents for the APEX AI security monitoring system

This package contains all the specialized AI agents:
- VisionAgent: Video input management and frame processing
- DetectionAgent: AI threat detection and classification  
- AlertingAgent: Multi-modal alert generation and coordination
- ConversationAgent: AI-powered voice communication and de-escalation
- DataAgent: Data management, logging, and evidence archival

Each agent operates independently but coordinates through the MCP Server
to provide comprehensive security monitoring capabilities.
"""

from .vision_agent import VisionAgent
from .detection_agent import DetectionAgent  
from .alerting_agent import AlertingAgent
from .conversation_agent import ConversationAgent
from .data_agent import DataAgent
from .voice_dispatch_agent import voice_dispatch_agent, VoiceDispatchAgent

__all__ = [
    'VisionAgent',
    'DetectionAgent', 
    'AlertingAgent',
    'ConversationAgent',
    'DataAgent',
    'voice_dispatch_agent',
    'VoiceDispatchAgent'
]

__version__ = "42.1.0"
