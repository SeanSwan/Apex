/**
 * VOICE RESPONSE PANEL - REACT COMPONENT
 * ======================================
 * Operator controls for AI-powered 2-way voice communication system
 * Provides interface for managing AI conversations with detected persons
 * 
 * Features:
 * - Active conversation monitoring
 * - Manual conversation control
 * - Pre-defined script selection
 * - Dynamic response override
 * - Conversation history
 * - Escalation controls
 * 
 * Priority: P1 HIGH - Critical for AI conversation management
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components';

// Styled components
const PanelContainer = styled.div`
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid #333;
  border-radius: 12px;
  padding: 16px;
  min-width: 400px;
  max-width: 500px;
  backdrop-filter: blur(10px);
  
  .section {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #333;
    
    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
  }
  
  .section-title {
    color: #00ff88;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const ConversationStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 12px;
  
  .status-info {
    .conversation-id {
      color: #ffffff;
      font-size: 12px;
      font-family: monospace;
    }
    
    .conversation-details {
      color: #b0b0b0;
      font-size: 11px;
      margin-top: 2px;
    }
  }
  
  .status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: ${props => 
        props.status === 'speaking' ? '#00ff88' :
        props.status === 'listening' ? '#0080ff' :
        props.status === 'processing' ? '#ffaa00' :
        props.status === 'escalated' ? '#ff4400' :
        '#666666'
      };
      
      ${props => (props.status === 'speaking' || props.status === 'listening') && `
        animation: pulse 1.5s infinite;
      `}
    }
    
    .status-text {
      color: ${props => 
        props.status === 'speaking' ? '#00ff88' :
        props.status === 'listening' ? '#0080ff' :
        props.status === 'processing' ? '#ffaa00' :
        props.status === 'escalated' ? '#ff4400' :
        '#888888'
      };
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 600;
    }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

const ActiveConversationsList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #333;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #666;
    border-radius: 2px;
  }
`;

const ConversationItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.selected && `
    border-color: #00ff88;
    background: rgba(0, 255, 136, 0.1);
  `}
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #666;
  }
  
  .conversation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    
    .conversation-type {
      color: ${props => 
        props.threatLevel === 'CRITICAL' ? '#ff0000' :
        props.threatLevel === 'HIGH' ? '#ff8500' :
        props.threatLevel === 'MEDIUM' ? '#ffff00' :
        '#00ffff'
      };
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .conversation-duration {
      color: #888;
      font-size: 10px;
      font-family: monospace;
    }
  }
  
  .conversation-location {
    color: #b0b0b0;
    font-size: 10px;
    margin-bottom: 2px;
  }
  
  .conversation-state {
    color: #888;
    font-size: 10px;
  }
`;

const ControlButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
`;

const ControlButton = styled.button`
  background: ${props => 
    props.variant === 'primary' ? '#00ff88' :
    props.variant === 'danger' ? '#ff4400' :
    props.variant === 'warning' ? '#ffaa00' :
    'transparent'
  };
  border: 1px solid ${props => 
    props.variant === 'primary' ? '#00ff88' :
    props.variant === 'danger' ? '#ff4400' :
    props.variant === 'warning' ? '#ffaa00' :
    '#666'
  };
  color: ${props => 
    props.variant === 'primary' ? '#000' :
    props.variant === 'danger' ? '#fff' :
    props.variant === 'warning' ? '#000' :
    '#fff'
  };
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => 
      props.variant === 'primary' ? '#00cc6a' :
      props.variant === 'danger' ? '#dd3300' :
      props.variant === 'warning' ? '#cc8800' :
      'rgba(255, 255, 255, 0.1)'
    };
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .button-icon {
    margin-right: 4px;
  }
`;

const ScriptSelector = styled.div`
  .script-select {
    width: 100%;
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 8px 12px;
    color: #ffffff;
    font-size: 12px;
    margin-bottom: 8px;
    outline: none;
    
    &:focus {
      border-color: #00ff88;
    }
    
    option {
      background: #1a1a1a;
      color: #ffffff;
    }
  }
  
  .script-preview {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    padding: 8px;
    font-size: 11px;
    color: #b0b0b0;
    max-height: 80px;
    overflow-y: auto;
    margin-bottom: 8px;
  }
`;

const MessageHistory = styled.div`
  max-height: 300px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  padding: 8px;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #333;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #666;
    border-radius: 2px;
  }
`;

const MessageItem = styled.div`
  margin-bottom: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  background: ${props => props.speaker === 'ai' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(0, 128, 255, 0.1)'};
  border-left: 3px solid ${props => props.speaker === 'ai' ? '#00ff88' : '#0080ff'};
  
  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
    
    .speaker {
      color: ${props => props.speaker === 'ai' ? '#00ff88' : '#0080ff'};
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .timestamp {
      color: #888;
      font-size: 9px;
      font-family: monospace;
    }
  }
  
  .message-content {
    color: #ffffff;
    font-size: 11px;
    line-height: 1.4;
  }
`;

const CustomResponseInput = styled.div`
  .response-textarea {
    width: 100%;
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 8px 12px;
    color: #ffffff;
    font-size: 12px;
    min-height: 60px;
    resize: vertical;
    outline: none;
    
    &:focus {
      border-color: #00ff88;
    }
    
    &::placeholder {
      color: #666;
    }
  }
  
  .character-count {
    text-align: right;
    font-size: 10px;
    color: #888;
    margin-top: 4px;
  }
`;

// Pre-defined conversation scripts
const CONVERSATION_SCRIPTS = {
  'warning_low': "Hello, this is APEX Security. Please be aware that you are in a monitored area and follow all posted guidelines.",
  'warning_medium': "Attention, this is APEX Security. We have detected unusual activity. Please ensure you are authorized to be in this location.",
  'warning_high': "This is APEX Security with an urgent message. You are in a restricted area. Please exit immediately.",
  'warning_critical': "IMMEDIATE SECURITY ALERT: Stop all activity and remain where you are. Security personnel are responding.",
  
  'inquiry_general': "Excuse me, this is APEX Security. May I ask what brings you to this area?",
  'inquiry_identification': "For security purposes, could you please identify yourself to the nearest security personnel?",
  
  'deescalation_medium': "I understand there may be some confusion. Everyone's safety is our priority. How can I help resolve this?",
  'deescalation_high': "I can see this is stressful. Let's work together to resolve this calmly and safely.",
  
  'instruction_exit': "Please exit the area immediately through the nearest marked exit for your safety.",
  'instruction_compliance': "Please remain calm and follow all security instructions for everyone's safety.",
  
  'emergency_weapon': "STOP. Drop any weapons immediately and put your hands where I can see them. Do not move.",
  'emergency_violence': "STOP all aggressive behavior immediately. Separate yourselves and remain calm."
};

// Main component
const VoiceResponsePanel = ({
  websocketUrl = 'ws://localhost:8765',
  onConversationStart,
  onConversationEnd,
  onMessageSent,
  className,
  style,
  ...props
}) => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [activeConversations, setActiveConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [selectedScript, setSelectedScript] = useState('');
  const [customResponse, setCustomResponse] = useState('');
  const [conversationStats, setConversationStats] = useState({
    total: 0,
    active: 0,
    successful: 0,
    escalated: 0
  });
  
  // Refs
  const websocketRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // WebSocket connection
  useEffect(() => {
    connectWebSocket();
    return () => disconnectWebSocket();
  }, [websocketUrl]);
  
  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);
  
  const connectWebSocket = useCallback(() => {
    try {
      if (websocketRef.current?.readyState === WebSocket.OPEN) return;
      
      websocketRef.current = new WebSocket(websocketUrl);
      
      websocketRef.current.onopen = () => {
        setIsConnected(true);
        console.log('✅ Voice panel connected to WebSocket');
        
        // Request current conversation data
        sendWebSocketMessage({
          type: 'get_active_conversations'
        });
      };
      
      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      websocketRef.current.onclose = () => {
        setIsConnected(false);
        console.log('🔌 Voice panel WebSocket closed');
        setTimeout(connectWebSocket, 5000);
      };
      
      websocketRef.current.onerror = (error) => {
        console.error('Voice panel WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Failed to connect voice panel WebSocket:', error);
    }
  }, [websocketUrl]);
  
  const disconnectWebSocket = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setIsConnected(false);
  }, []);
  
  const sendWebSocketMessage = useCallback((message) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    }
  }, []);
  
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'active_conversations':
        setActiveConversations(data.conversations || []);
        break;
        
      case 'conversation_started':
        setActiveConversations(prev => [...prev, data.conversation]);
        if (onConversationStart) {
          onConversationStart(data.conversation);
        }
        break;
        
      case 'conversation_ended':
        setActiveConversations(prev => 
          prev.filter(conv => conv.session_id !== data.session_id)
        );
        if (selectedConversation?.session_id === data.session_id) {
          setSelectedConversation(null);
          setConversationMessages([]);
        }
        if (onConversationEnd) {
          onConversationEnd(data);
        }
        break;
        
      case 'conversation_message':
        if (selectedConversation?.session_id === data.session_id) {
          setConversationMessages(prev => [...prev, data.message]);
        }
        break;
        
      case 'conversation_state_update':
        setActiveConversations(prev => 
          prev.map(conv => 
            conv.session_id === data.session_id 
              ? { ...conv, state: data.state }
              : conv
          )
        );
        if (selectedConversation?.session_id === data.session_id) {
          setSelectedConversation(prev => ({ ...prev, state: data.state }));
        }
        break;
        
      case 'conversation_statistics':
        setConversationStats(data.stats);
        break;
        
      default:
        console.log('Unknown voice message type:', data.type);
    }
  }, [selectedConversation, onConversationStart, onConversationEnd]);
  
  // Conversation control functions
  const startManualConversation = useCallback((triggerData) => {
    sendWebSocketMessage({
      type: 'start_conversation',
      trigger_data: triggerData
    });
  }, [sendWebSocketMessage]);
  
  const selectConversation = useCallback((conversation) => {
    setSelectedConversation(conversation);
    
    // Request conversation messages
    sendWebSocketMessage({
      type: 'get_conversation_messages',
      session_id: conversation.session_id
    });
  }, [sendWebSocketMessage]);
  
  const sendScriptedResponse = useCallback(() => {
    if (!selectedConversation || !selectedScript) return;
    
    const scriptText = CONVERSATION_SCRIPTS[selectedScript];
    if (!scriptText) return;
    
    sendWebSocketMessage({
      type: 'send_ai_response',
      session_id: selectedConversation.session_id,
      message: scriptText,
      response_type: 'scripted'
    });
    
    if (onMessageSent) {
      onMessageSent({
        session_id: selectedConversation.session_id,
        message: scriptText,
        type: 'scripted'
      });
    }
    
    setSelectedScript('');
  }, [selectedConversation, selectedScript, sendWebSocketMessage, onMessageSent]);
  
  const sendCustomResponse = useCallback(() => {
    if (!selectedConversation || !customResponse.trim()) return;
    
    sendWebSocketMessage({
      type: 'send_ai_response',
      session_id: selectedConversation.session_id,
      message: customResponse.trim(),
      response_type: 'custom'
    });
    
    if (onMessageSent) {
      onMessageSent({
        session_id: selectedConversation.session_id,
        message: customResponse.trim(),
        type: 'custom'
      });
    }
    
    setCustomResponse('');
  }, [selectedConversation, customResponse, sendWebSocketMessage, onMessageSent]);
  
  const escalateConversation = useCallback((reason = 'manual_escalation') => {
    if (!selectedConversation) return;
    
    sendWebSocketMessage({
      type: 'escalate_conversation',
      session_id: selectedConversation.session_id,
      reason
    });
  }, [selectedConversation, sendWebSocketMessage]);
  
  const stopConversation = useCallback(() => {
    if (!selectedConversation) return;
    
    sendWebSocketMessage({
      type: 'stop_conversation',
      session_id: selectedConversation.session_id
    });
  }, [selectedConversation, sendWebSocketMessage]);
  
  // Format duration helper
  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // Script categories for organization
  const scriptCategories = useMemo(() => {
    return {
      'Warning Messages': [
        { value: 'warning_low', label: 'Low Priority Warning' },
        { value: 'warning_medium', label: 'Medium Priority Warning' },
        { value: 'warning_high', label: 'High Priority Warning' },
        { value: 'warning_critical', label: 'Critical Warning' }
      ],
      'Inquiries': [
        { value: 'inquiry_general', label: 'General Inquiry' },
        { value: 'inquiry_identification', label: 'ID Request' }
      ],
      'De-escalation': [
        { value: 'deescalation_medium', label: 'Medium De-escalation' },
        { value: 'deescalation_high', label: 'High De-escalation' }
      ],
      'Instructions': [
        { value: 'instruction_exit', label: 'Exit Instruction' },
        { value: 'instruction_compliance', label: 'Compliance Request' }
      ],
      'Emergency': [
        { value: 'emergency_weapon', label: 'Weapon Emergency' },
        { value: 'emergency_violence', label: 'Violence Emergency' }
      ]
    };
  }, []);
  
  return (
    <PanelContainer className={className} style={style} {...props}>
      {/* Connection Status */}
      <div className="section">
        <div className="section-title">
          🎙️ Voice Communication
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: isConnected ? '#00ff88' : '#ff4400' 
          }} />
        </div>
        
        <div style={{ 
          fontSize: '11px', 
          color: isConnected ? '#00ff88' : '#ff4400',
          marginBottom: '8px'
        }}>
          {isConnected ? 'Connected to AI Voice System' : 'Disconnected'}
        </div>
        
        <div style={{ 
          fontSize: '10px', 
          color: '#888',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Active: {conversationStats.active}</span>
          <span>Total: {conversationStats.total}</span>
          <span>Success: {conversationStats.successful}</span>
          <span>Escalated: {conversationStats.escalated}</span>
        </div>
      </div>
      
      {/* Active Conversations */}
      <div className="section">
        <div className="section-title">Active Conversations ({activeConversations.length})</div>
        
        <ActiveConversationsList>
          {activeConversations.length === 0 ? (
            <div style={{ color: '#888', fontSize: '11px', textAlign: 'center', padding: '20px 0' }}>
              No active conversations
            </div>
          ) : (
            activeConversations.map(conversation => (
              <ConversationItem
                key={conversation.session_id}
                selected={selectedConversation?.session_id === conversation.session_id}
                threatLevel={conversation.threat_level}
                onClick={() => selectConversation(conversation)}
              >
                <div className="conversation-header">
                  <div className="conversation-type">
                    {conversation.conversation_type} - {conversation.threat_level}
                  </div>
                  <div className="conversation-duration">
                    {formatDuration(conversation.duration)}
                  </div>
                </div>
                <div className="conversation-location">
                  📍 {conversation.location} (Camera: {conversation.camera_id})
                </div>
                <div className="conversation-state">
                  State: {conversation.state} | Messages: {conversation.message_count}
                </div>
              </ConversationItem>
            ))
          )}
        </ActiveConversationsList>
      </div>
      
      {/* Selected Conversation Controls */}
      {selectedConversation && (
        <>
          <div className="section">
            <div className="section-title">
              Conversation Control - {selectedConversation.session_id.slice(-8)}
            </div>
            
            <ConversationStatus status={selectedConversation.state}>
              <div className="status-info">
                <div className="conversation-id">
                  ID: {selectedConversation.session_id}
                </div>
                <div className="conversation-details">
                  {selectedConversation.conversation_type} | {selectedConversation.threat_level} | {selectedConversation.location}
                </div>
              </div>
              <div className="status-indicator">
                <div className="status-dot" />
                <div className="status-text">{selectedConversation.state}</div>
              </div>
            </ConversationStatus>
            
            <ControlButtons>
              <ControlButton
                variant="warning"
                onClick={() => escalateConversation()}
                disabled={selectedConversation.state === 'escalated'}
              >
                <span className="button-icon">⚠️</span>
                Escalate
              </ControlButton>
              
              <ControlButton
                variant="danger"
                onClick={stopConversation}
                disabled={selectedConversation.state === 'completed'}
              >
                <span className="button-icon">🛑</span>
                Stop
              </ControlButton>
              
              <ControlButton
                onClick={() => sendWebSocketMessage({
                  type: 'get_conversation_messages',
                  session_id: selectedConversation.session_id
                })}
              >
                <span className="button-icon">🔄</span>
                Refresh
              </ControlButton>
            </ControlButtons>
          </div>
          
          {/* Script Selector */}
          <div className="section">
            <div className="section-title">Pre-defined Scripts</div>
            
            <ScriptSelector>
              <select
                className="script-select"
                value={selectedScript}
                onChange={(e) => setSelectedScript(e.target.value)}
              >
                <option value="">Select a script...</option>
                {Object.entries(scriptCategories).map(([category, scripts]) => (
                  <optgroup key={category} label={category}>
                    {scripts.map(script => (
                      <option key={script.value} value={script.value}>
                        {script.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              
              {selectedScript && (
                <div className="script-preview">
                  {CONVERSATION_SCRIPTS[selectedScript]}
                </div>
              )}
              
              <ControlButton
                variant="primary"
                onClick={sendScriptedResponse}
                disabled={!selectedScript || selectedConversation.state !== 'waiting_response'}
              >
                Send Script
              </ControlButton>
            </ScriptSelector>
          </div>
          
          {/* Custom Response */}
          <div className="section">
            <div className="section-title">Custom Response</div>
            
            <CustomResponseInput>
              <textarea
                className="response-textarea"
                placeholder="Type a custom response..."
                value={customResponse}
                onChange={(e) => setCustomResponse(e.target.value)}
                maxLength={200}
              />
              <div className="character-count">
                {customResponse.length}/200 characters
              </div>
              
              <ControlButton
                variant="primary"
                onClick={sendCustomResponse}
                disabled={!customResponse.trim() || selectedConversation.state !== 'waiting_response'}
                style={{ marginTop: '8px' }}
              >
                Send Custom Response
              </ControlButton>
            </CustomResponseInput>
          </div>
          
          {/* Message History */}
          <div className="section">
            <div className="section-title">Conversation History</div>
            
            <MessageHistory>
              {conversationMessages.length === 0 ? (
                <div style={{ color: '#888', fontSize: '11px', textAlign: 'center' }}>
                  No messages yet
                </div>
              ) : (
                conversationMessages.map((message, index) => (
                  <MessageItem key={index} speaker={message.speaker}>
                    <div className="message-header">
                      <div className="speaker">
                        {message.speaker === 'ai' ? 'Security AI' : 'Person'}
                      </div>
                      <div className="timestamp">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="message-content">
                      {message.content}
                    </div>
                  </MessageItem>
                ))
              )}
              <div ref={messagesEndRef} />
            </MessageHistory>
          </div>
        </>
      )}
    </PanelContainer>
  );
};

export default VoiceResponsePanel;

// Export conversation scripts for external use
export { CONVERSATION_SCRIPTS };
