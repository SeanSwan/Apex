"""
APEX AI MCP CONVERSATION TOOL
=============================
MCP Tool for AI-driven suspect interaction and dynamic response generation

This tool provides:
- LLM integration for intelligent conversation
- Security-focused response generation
- Escalation logic based on situation assessment
- Integration with pre-approved security scripts
- Context-aware conversation management
"""

import asyncio
import json
import logging
import time
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
import aiohttp
import openai

logger = logging.getLogger(__name__)

class ConversationTool:
    """
    MCP Tool for AI-powered conversation and suspect interaction
    
    Capabilities:
    - Dynamic response generation using LLMs
    - Security-focused conversation management
    - Escalation logic and threat assessment
    - Integration with security script templates
    - Context retention and conversation flow
    """
    
    def __init__(self, model_name: str = "gpt-3.5-turbo", config: Dict = None):
        self.name = "conversation"
        self.description = "AI-powered conversation system for security interactions"
        self.enabled = True
        self.model_name = model_name
        self.config = config or self.get_default_config()
        
        # LLM client
        self.client = None
        self.is_initialized = False
        self.last_used = None
        
        # Conversation state management
        self.active_conversations = {}
        self.security_scripts = {}
        
        # Performance tracking
        self.stats = {
            'total_conversations': 0,
            'total_responses': 0,
            'avg_response_time': 0,
            'escalation_count': 0,
            'success_rate': 0,
            'last_reset': time.time()
        }
        
        logger.info(f"💬 Conversation Tool initialized: {model_name}")

    def get_default_config(self) -> Dict:
        """Default configuration for conversation tool"""
        return {
            'max_tokens': 150,
            'temperature': 0.7,
            'response_timeout': 10,
            'max_conversation_length': 10,
            'enable_escalation': True,
            'security_mode': True,
            'context_window': 5,
            'profanity_filter': True
        }

    async def initialize(self):
        """Initialize the conversation tool with LLM client"""
        try:
            logger.info(f"🔄 Initializing conversation model: {self.model_name}")
            
            # Initialize OpenAI client (or other LLM provider)
            api_key = os.getenv('OPENAI_API_KEY')
            if api_key:
                openai.api_key = api_key
                self.client = openai
                logger.info("✅ OpenAI client initialized")
            else:
                logger.warning("⚠️ No OpenAI API key found, using simulation mode")
                self.client = None
            
            # Load security scripts
            await self.load_security_scripts()
            
            self.is_initialized = True
            logger.info("✅ Conversation Tool initialization complete")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize conversation tool: {e}")
            self.is_initialized = False
            raise

    async def load_security_scripts(self):
        """Load pre-approved security conversation scripts"""
        try:
            # Default security scripts for various scenarios
            self.security_scripts = {
                'general_greeting': {
                    'template': "Hello. This is a security system. Please identify yourself if you are authorized to be in this area.",
                    'tone': 'professional',
                    'escalation_level': 1
                },
                'loitering_warning': {
                    'template': "You have been in this area for an extended period. If you require assistance, please contact security. Otherwise, please move to authorized areas.",
                    'tone': 'firm',
                    'escalation_level': 2
                },
                'unauthorized_access': {
                    'template': "This is a restricted area. You are not authorized to be here. Please exit immediately or security will be dispatched.",
                    'tone': 'authoritative',
                    'escalation_level': 3
                },
                'weapon_detected': {
                    'template': "A weapon has been detected. Drop any weapons immediately and place your hands where they can be seen. Law enforcement has been contacted.",
                    'tone': 'urgent',
                    'escalation_level': 5
                },
                'compliance_request': {
                    'template': "Please comply with security instructions. Your cooperation is required for the safety of all occupants.",
                    'tone': 'firm',
                    'escalation_level': 2
                },
                'final_warning': {
                    'template': "This is your final warning. Security personnel are responding. Any aggressive behavior will result in immediate law enforcement involvement.",
                    'tone': 'stern',
                    'escalation_level': 4
                },
                'emergency_evacuation': {
                    'template': "This is an emergency. Please evacuate the building immediately using the nearest exit. Follow all posted evacuation procedures.",
                    'tone': 'urgent',
                    'escalation_level': 5
                },
                'after_hours_challenge': {
                    'template': "This building is closed. If you are authorized personnel, please present your credentials to the nearest security camera or contact the security desk.",
                    'tone': 'professional',
                    'escalation_level': 2
                }
            }
            
            logger.info(f"📚 Loaded {len(self.security_scripts)} security script templates")
            
        except Exception as e:
            logger.error(f"❌ Failed to load security scripts: {e}")

    async def execute(self, payload: Dict) -> Dict:
        """
        Execute conversation interaction
        
        Payload format:
        {
            "conversation_id": "conv_12345",
            "camera_id": "camera_001",
            "situation_context": {
                "threat_level": "medium",
                "detection_type": "unauthorized_person",
                "location": "lobby",
                "time_of_day": "after_hours"
            },
            "input_text": "Who are you?",
            "interaction_type": "response|initiate|escalate",
            "options": {
                "use_script": "general_greeting",
                "enable_ai_generation": true,
                "max_escalation_level": 3
            }
        }
        """
        start_time = time.time()
        
        try:
            if not self.is_initialized:
                raise Exception("Conversation Tool not initialized")
            
            # Extract payload data
            conversation_id = payload.get('conversation_id', f"conv_{int(time.time())}")
            camera_id = payload.get('camera_id', 'unknown')
            situation_context = payload.get('situation_context', {})
            input_text = payload.get('input_text', '')
            interaction_type = payload.get('interaction_type', 'response')
            options = payload.get('options', {})
            
            # Merge options with config
            conversation_config = {**self.config, **options}
            
            # Get or create conversation context
            conversation = self.get_conversation_context(conversation_id, camera_id, situation_context)
            
            # Generate response based on interaction type
            if interaction_type == 'initiate':
                response = await self.initiate_conversation(conversation, conversation_config)
            elif interaction_type == 'escalate':
                response = await self.escalate_conversation(conversation, conversation_config)
            else:
                response = await self.generate_response(conversation, input_text, conversation_config)
            
            # Update conversation context
            self.update_conversation_context(conversation_id, input_text, response)
            
            # Update statistics
            execution_time = time.time() - start_time
            self.update_stats(execution_time, conversation['escalation_level'])
            
            # Prepare response
            result = {
                'conversation_id': conversation_id,
                'camera_id': camera_id,
                'response_text': response['text'],
                'response_tone': response['tone'],
                'escalation_level': response['escalation_level'],
                'recommended_actions': response.get('recommended_actions', []),
                'conversation_length': len(conversation['history']),
                'requires_human_intervention': response.get('requires_human_intervention', False),
                'execution_time': execution_time,
                'timestamp': datetime.now().isoformat(),
                'success': True
            }
            
            logger.info(f"💬 Conversation response generated: {conversation_id} (escalation: {response['escalation_level']})")
            return result
            
        except Exception as e:
            logger.error(f"❌ Conversation execution error: {e}")
            return {
                'success': False,
                'error': str(e),
                'execution_time': time.time() - start_time,
                'conversation_id': payload.get('conversation_id', 'unknown'),
                'timestamp': datetime.now().isoformat()
            }

    def get_conversation_context(self, conversation_id: str, camera_id: str, situation_context: Dict) -> Dict:
        """Get or create conversation context"""
        if conversation_id not in self.active_conversations:
            self.active_conversations[conversation_id] = {
                'conversation_id': conversation_id,
                'camera_id': camera_id,
                'start_time': datetime.now().isoformat(),
                'situation_context': situation_context,
                'escalation_level': 1,
                'history': [],
                'last_interaction': time.time(),
                'total_exchanges': 0
            }
        
        return self.active_conversations[conversation_id]

    async def initiate_conversation(self, conversation: Dict, config: Dict) -> Dict:
        """Initiate a new conversation based on situation context"""
        try:
            situation = conversation['situation_context']
            threat_level = situation.get('threat_level', 'low')
            detection_type = situation.get('detection_type', 'person')
            location = situation.get('location', 'area')
            
            # Select appropriate script based on context
            script_key = self.select_initial_script(situation)
            
            if config.get('enable_ai_generation', True) and self.client:
                # Generate AI response with context
                response_text = await self.generate_ai_response(
                    conversation,
                    '',  # No input for initiation
                    script_key,
                    config
                )
            else:
                # Use pre-approved script
                script = self.security_scripts.get(script_key, self.security_scripts['general_greeting'])
                response_text = script['template']
            
            # Determine response characteristics
            escalation_level = min(self.get_threat_escalation_level(threat_level), config.get('max_escalation_level', 3))
            tone = self.get_response_tone(escalation_level)
            
            response = {
                'text': response_text,
                'tone': tone,
                'escalation_level': escalation_level,
                'script_used': script_key,
                'recommended_actions': self.get_recommended_actions(escalation_level, situation),
                'requires_human_intervention': escalation_level >= 4
            }
            
            conversation['escalation_level'] = escalation_level
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Conversation initiation error: {e}")
            return self.get_fallback_response(1)

    async def generate_response(self, conversation: Dict, input_text: str, config: Dict) -> Dict:
        """Generate response to user input"""
        try:
            # Analyze input for escalation triggers
            escalation_needed = self.analyze_input_for_escalation(input_text, conversation)
            
            if escalation_needed:
                conversation['escalation_level'] = min(conversation['escalation_level'] + 1, 5)
            
            # Generate response
            if config.get('enable_ai_generation', True) and self.client:
                response_text = await self.generate_ai_response(
                    conversation,
                    input_text,
                    None,  # Let AI choose approach
                    config
                )
            else:
                # Use rule-based response
                response_text = self.generate_rule_based_response(conversation, input_text)
            
            # Determine response characteristics
            escalation_level = conversation['escalation_level']
            tone = self.get_response_tone(escalation_level)
            
            response = {
                'text': response_text,
                'tone': tone,
                'escalation_level': escalation_level,
                'recommended_actions': self.get_recommended_actions(escalation_level, conversation['situation_context']),
                'requires_human_intervention': escalation_level >= 4
            }
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Response generation error: {e}")
            return self.get_fallback_response(conversation.get('escalation_level', 2))

    async def escalate_conversation(self, conversation: Dict, config: Dict) -> Dict:
        """Escalate conversation to higher threat level"""
        try:
            # Increase escalation level
            conversation['escalation_level'] = min(conversation['escalation_level'] + 1, 5)
            escalation_level = conversation['escalation_level']
            
            # Select escalation script
            if escalation_level >= 4:
                script_key = 'final_warning'
            elif escalation_level >= 3:
                script_key = 'unauthorized_access'
            else:
                script_key = 'compliance_request'
            
            # Generate escalated response
            if config.get('enable_ai_generation', True) and self.client:
                response_text = await self.generate_ai_response(
                    conversation,
                    '',  # No specific input for escalation
                    script_key,
                    config
                )
            else:
                script = self.security_scripts.get(script_key)
                response_text = script['template'] if script else "Please comply with security instructions."
            
            response = {
                'text': response_text,
                'tone': 'stern' if escalation_level >= 3 else 'firm',
                'escalation_level': escalation_level,
                'script_used': script_key,
                'recommended_actions': self.get_recommended_actions(escalation_level, conversation['situation_context']),
                'requires_human_intervention': escalation_level >= 4
            }
            
            self.stats['escalation_count'] += 1
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Escalation error: {e}")
            return self.get_fallback_response(conversation.get('escalation_level', 3))

    async def generate_ai_response(self, conversation: Dict, input_text: str, script_key: Optional[str], config: Dict) -> str:
        """Generate AI response using LLM"""
        try:
            if not self.client:
                # Fallback to script-based response
                if script_key and script_key in self.security_scripts:
                    return self.security_scripts[script_key]['template']
                return "Please identify yourself and state your business."
            
            # Build conversation context
            context = self.build_conversation_context(conversation, script_key)
            
            # Create messages for LLM
            messages = [
                {"role": "system", "content": context},
                {"role": "user", "content": input_text or "Initiate security interaction"}
            ]
            
            # Add conversation history
            for exchange in conversation['history'][-config.get('context_window', 5):]:
                messages.append({"role": "assistant", "content": exchange.get('response', '')})
                if exchange.get('input'):
                    messages.append({"role": "user", "content": exchange['input']})
            
            # Generate response
            response = await openai.ChatCompletion.acreate(
                model=self.model_name,
                messages=messages,
                max_tokens=config['max_tokens'],
                temperature=config['temperature'],
                timeout=config['response_timeout']
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Apply profanity filter if enabled
            if config.get('profanity_filter', True):
                response_text = self.apply_profanity_filter(response_text)
            
            return response_text
            
        except Exception as e:
            logger.error(f"❌ AI response generation error: {e}")
            # Fallback to script-based response
            if script_key and script_key in self.security_scripts:
                return self.security_scripts[script_key]['template']
            return "Please comply with security protocols."

    def build_conversation_context(self, conversation: Dict, script_key: Optional[str]) -> str:
        """Build context prompt for LLM"""
        situation = conversation['situation_context']
        escalation_level = conversation['escalation_level']
        
        context = f"""You are an AI security system managing a security interaction. 

SITUATION CONTEXT:
- Location: {situation.get('location', 'secure area')}
- Threat Level: {situation.get('threat_level', 'unknown')}
- Detection: {situation.get('detection_type', 'person detected')}
- Time: {situation.get('time_of_day', 'unknown')}
- Current Escalation Level: {escalation_level}/5

GUIDELINES:
- Be professional but firm
- Prioritize safety and security
- De-escalate when possible, escalate when necessary  
- Keep responses concise (under 100 words)
- Use clear, authoritative language
- Never make threats or use offensive language
- Request identification and compliance with security protocols

ESCALATION LEVELS:
- Level 1-2: Professional, informational
- Level 3: Firm, requiring compliance
- Level 4: Stern warning, security dispatch
- Level 5: Final warning, law enforcement involved

"""
        
        if script_key and script_key in self.security_scripts:
            script = self.security_scripts[script_key]
            context += f"\nRECOMMENDED APPROACH: {script['template']}\nTONE: {script['tone']}\n"
        
        context += "\nRespond appropriately to the situation while maintaining security protocols."
        
        return context

    def select_initial_script(self, situation: Dict) -> str:
        """Select appropriate initial script based on situation"""
        detection_type = situation.get('detection_type', '')
        threat_level = situation.get('threat_level', 'low')
        time_of_day = situation.get('time_of_day', '')
        
        # High priority selections
        if 'weapon' in detection_type:
            return 'weapon_detected'
        elif threat_level == 'critical':
            return 'unauthorized_access'
        elif 'after_hours' in time_of_day:
            return 'after_hours_challenge'
        elif 'loitering' in detection_type:
            return 'loitering_warning'
        else:
            return 'general_greeting'

    def analyze_input_for_escalation(self, input_text: str, conversation: Dict) -> bool:
        """Analyze input text for escalation triggers"""
        if not input_text:
            return False
        
        input_lower = input_text.lower()
        
        # Escalation triggers
        escalation_triggers = [
            'no', 'won\'t', 'don\'t', 'refuse', 'leave me alone',
            'mind your business', 'shut up', 'go away',
            'threat', 'kill', 'hurt', 'damage'
        ]
        
        return any(trigger in input_lower for trigger in escalation_triggers)

    def generate_rule_based_response(self, conversation: Dict, input_text: str) -> str:
        """Generate rule-based response when AI is not available"""
        escalation_level = conversation['escalation_level']
        input_lower = input_text.lower() if input_text else ''
        
        # Simple rule-based responses
        if any(word in input_lower for word in ['help', 'lost', 'confused']):
            return "If you need assistance, please contact security at the front desk or use the emergency phone."
        
        elif any(word in input_lower for word in ['authorized', 'permission', 'allowed']):
            return "Please present your credentials or identification to verify authorization."
        
        elif escalation_level >= 3:
            return self.security_scripts['compliance_request']['template']
        
        else:
            return self.security_scripts['general_greeting']['template']

    def get_threat_escalation_level(self, threat_level: str) -> int:
        """Convert threat level to escalation level"""
        mapping = {
            'safe': 1,
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 4
        }
        return mapping.get(threat_level, 2)

    def get_response_tone(self, escalation_level: int) -> str:
        """Get appropriate tone for escalation level"""
        tone_mapping = {
            1: 'professional',
            2: 'firm',
            3: 'authoritative',
            4: 'stern',
            5: 'urgent'
        }
        return tone_mapping.get(escalation_level, 'professional')

    def get_recommended_actions(self, escalation_level: int, situation: Dict) -> List[str]:
        """Get recommended actions for escalation level"""
        actions = []
        
        if escalation_level >= 4:
            actions.extend([
                "Dispatch security personnel immediately",
                "Prepare for law enforcement contact",
                "Maintain visual monitoring"
            ])
        elif escalation_level >= 3:
            actions.extend([
                "Alert security supervisor",
                "Increase camera monitoring",
                "Prepare for potential dispatch"
            ])
        elif escalation_level >= 2:
            actions.extend([
                "Continue monitoring",
                "Log interaction details"
            ])
        
        # Situation-specific actions
        if 'weapon' in situation.get('detection_type', ''):
            actions.append("PRIORITY: Contact law enforcement immediately")
        
        if 'after_hours' in situation.get('time_of_day', ''):
            actions.append("Verify after-hours authorization")
        
        return actions

    def get_fallback_response(self, escalation_level: int) -> Dict:
        """Get fallback response when generation fails"""
        fallback_texts = {
            1: "Please identify yourself if you are authorized to be in this area.",
            2: "This area is under security monitoring. Please comply with all instructions.",
            3: "You must comply with security protocols. Please exit the area if unauthorized.",
            4: "This is a final warning. Security personnel are responding.",
            5: "Emergency protocols activated. Remain where you are."
        }
        
        return {
            'text': fallback_texts.get(escalation_level, fallback_texts[2]),
            'tone': self.get_response_tone(escalation_level),
            'escalation_level': escalation_level,
            'requires_human_intervention': escalation_level >= 4
        }

    def apply_profanity_filter(self, text: str) -> str:
        """Apply basic profanity filter to response"""
        # Simple word replacement - in production, use more sophisticated filtering
        replacements = {
            # Add profanity filtering as needed
        }
        
        filtered_text = text
        for bad_word, replacement in replacements.items():
            filtered_text = filtered_text.replace(bad_word, replacement)
        
        return filtered_text

    def update_conversation_context(self, conversation_id: str, input_text: str, response: Dict):
        """Update conversation context with new exchange"""
        if conversation_id in self.active_conversations:
            conversation = self.active_conversations[conversation_id]
            
            # Add exchange to history
            exchange = {
                'timestamp': datetime.now().isoformat(),
                'input': input_text,
                'response': response['text'],
                'escalation_level': response['escalation_level']
            }
            
            conversation['history'].append(exchange)
            conversation['last_interaction'] = time.time()
            conversation['total_exchanges'] += 1
            
            # Limit history size
            max_history = self.config.get('max_conversation_length', 10)
            if len(conversation['history']) > max_history:
                conversation['history'] = conversation['history'][-max_history:]

    def update_stats(self, execution_time: float, escalation_level: int):
        """Update performance statistics"""
        self.stats['total_responses'] += 1
        
        # Update average response time
        if self.stats['total_responses'] == 1:
            self.stats['avg_response_time'] = execution_time
        else:
            alpha = 0.1  # Exponential moving average factor
            self.stats['avg_response_time'] = (
                alpha * execution_time + 
                (1 - alpha) * self.stats['avg_response_time']
            )
        
        # Update success rate (simplified)
        self.stats['success_rate'] = min(
            (self.stats['total_responses'] - 1) / self.stats['total_responses'] + 0.1,
            1.0
        )

    async def shutdown(self):
        """Shutdown the conversation tool"""
        logger.info("🛑 Shutting down Conversation Tool...")
        
        # Clear active conversations
        self.active_conversations.clear()
        
        # Close LLM client if needed
        if self.client:
            self.client = None
        
        self.is_initialized = False
        logger.info("✅ Conversation Tool shutdown complete")

    def get_stats(self) -> Dict:
        """Get current performance statistics"""
        return {
            **self.stats,
            'active_conversations': len(self.active_conversations),
            'uptime': time.time() - self.stats['last_reset'],
            'model_name': self.model_name,
            'is_initialized': self.is_initialized,
            'last_used': self.last_used
        }
