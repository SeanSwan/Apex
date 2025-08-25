// apex_ai_desktop_app/src/components/AIConversation/AIConversationPanel.tsx
/**
 * AI CONVERSATION PANEL COMPONENT
 * ===============================
 * Conversational AI assistant interface that sees all system data
 * Provides intelligent help, system queries, and operational guidance
 * 
 * MASTER PROMPT v54.6 COMPLIANCE:
 * - TypeScript with proper interfaces and type safety
 * - Styled Components integration for consistent theming
 * - Real-time chat with conversation_agent.py backend
 * - System knowledge integration for comprehensive assistance
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';

// ===========================
// TYPES & INTERFACES
// ===========================

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    context?: string[];
    systemData?: any;
    confidence?: number;
    sources?: string[];
  };
}

interface SystemContext {
  activeAlerts?: number;
  connectedCameras?: number;
  recentIncidents?: any[];
  systemStatus?: string;
  userRole?: string;
  currentProperty?: string;
}

interface AIConversationPanelProps {
  systemContext?: SystemContext;
  onActionRequest?: (action: string, params: any) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  userId?: string;
  userRole?: string;
}

interface TypingIndicatorProps {
  visible: boolean;
}

// ===========================
// STYLED COMPONENTS
// ===========================

const ConversationContainer = styled.div<{ expanded: boolean }>`
  display: flex;
  flex-direction: column;
  height: ${({ expanded }) => expanded ? '70vh' : '400px'};
  width: ${({ expanded }) => expanded ? '500px' : '350px'};
  background-color: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  position: relative;
  transition: all 0.3s ease;
  z-index: 1000;
`;

const ConversationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg} ${({ theme }) => theme.borderRadius.lg} 0 0;
`;

const HeaderTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  &::before {
    content: '🤖';
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }
`;

const HeaderControls = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const ControlButton = styled.button<{ variant?: 'primary' | 'secondary' | 'minimize' }>`
  padding: ${({ theme }) => theme.spacing.xs};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  
  ${({ variant, theme }) => {
    switch (variant) {
      case 'primary':
        return `
          background-color: ${theme.colors.primary};
          color: ${theme.colors.background};
          &:hover { background-color: ${theme.colors.primaryDark}; }
        `;
      case 'minimize':
        return `
          background-color: ${theme.colors.warning};
          color: ${theme.colors.background};
          &:hover { background-color: #d97706; }
        `;
      default:
        return `
          background-color: ${theme.colors.backgroundCard};
          color: ${theme.colors.text};
          border: 1px solid ${theme.colors.border};
          &:hover { background-color: ${theme.colors.background}; }
        `;
    }
  }}
`;

const StatusIndicator = styled.div<{ status: 'online' | 'connecting' | 'offline' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ status, theme }) => {
    switch (status) {
      case 'online': return theme.colors.success;
      case 'connecting': return theme.colors.warning;
      default: return theme.colors.error;
    }
  }};
  animation: ${({ status }) => status === 'connecting' ? 'pulse 1.5s ease-in-out infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};
`;

const MessageBubble = styled.div<{ type: 'user' | 'assistant' | 'system' }>`
  max-width: 80%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.4;
  word-wrap: break-word;
  align-self: ${({ type }) => type === 'user' ? 'flex-end' : 'flex-start'};
  
  ${({ type, theme }) => {
    switch (type) {
      case 'user':
        return `
          background-color: ${theme.colors.primary};
          color: ${theme.colors.background};
        `;
      case 'system':
        return `
          background-color: ${theme.colors.warning}20;
          color: ${theme.colors.warning};
          border: 1px solid ${theme.colors.warning}40;
          font-style: italic;
        `;
      default:
        return `
          background-color: ${theme.colors.backgroundCard};
          color: ${theme.colors.text};
          border: 1px solid ${theme.colors.border};
        `;
    }
  }}
`;

const MessageMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: ${({ theme }) => theme.spacing.xs};
  text-align: right;
`;

const MessageSources = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  border-top: 1px solid ${({ theme }) => theme.colors.border}40;
  padding-top: ${({ theme }) => theme.spacing.xs};
`;

const TypingIndicator = styled.div<TypingIndicatorProps>`
  display: ${({ visible }) => visible ? 'flex' : 'none'};
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.backgroundCard};
  color: ${({ theme }) => theme.colors.textMuted};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  align-self: flex-start;
  max-width: 80%;
`;

const TypingDots = styled.div`
  display: flex;
  gap: 2px;
  
  & > div {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.colors.textMuted};
    animation: typing 1.4s ease-in-out infinite;
  }
  
  & > div:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  & > div:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes typing {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.5;
    }
    30% {
      transform: translateY(-8px);
      opacity: 1;
    }
  }
`;

const InputContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  border-radius: 0 0 ${({ theme }) => theme.borderRadius.lg} ${({ theme }) => theme.borderRadius.lg};
`;

const MessageInput = styled.textarea`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-family: ${({ theme }) => theme.typography.fontFamily};
  resize: none;
  min-height: 40px;
  max-height: 120px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}25;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const SendButton = styled.button<{ disabled?: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme, disabled }) => disabled ? theme.colors.border : theme.colors.primary};
  color: ${({ theme }) => theme.colors.background};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};

  &:hover {
    background-color: ${({ theme, disabled }) => disabled ? theme.colors.border : theme.colors.primaryDark};
  }
`;

const QuickActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border}40;
`;

const QuickActionButton = styled.button`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.backgroundCard};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.background};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const WelcomeMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.6;
`;

// ===========================
// MAIN COMPONENT
// ===========================

const AIConversationPanel: React.FC<AIConversationPanelProps> = ({
  systemContext,
  onActionRequest,
  isExpanded = false,
  onToggleExpanded,
  userId = 'user_001',
  userRole = 'admin'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'connecting' | 'offline'>('offline');
  const [conversationId, setConversationId] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Quick action suggestions
  const quickActions = [
    "📊 System status overview",
    "🚨 Recent security alerts",
    "📹 Camera connectivity",
    "👥 Active incidents",
    "🔧 How to configure video sources",
    "📈 Performance metrics",
    "🛡️ Security recommendations"
  ];

  // Initialize WebSocket connection
  const initializeConnection = useCallback(() => {
    setConnectionStatus('connecting');
    
    try {
      // Connect to conversation_agent.py via backend API
      wsRef.current = new WebSocket('ws://localhost:5001/api/ai/conversation');
      
      wsRef.current.onopen = () => {
        setConnectionStatus('online');
        
        // Send initial system context
        const initMessage = {
          type: 'init',
          user_id: userId,
          user_role: userRole,
          system_context: systemContext,
          conversation_id: conversationId || `conv_${Date.now()}`
        };
        
        wsRef.current?.send(JSON.stringify(initMessage));
        
        if (!conversationId) {
          setConversationId(initMessage.conversation_id);
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          handleAIResponse(response);
        } catch (error) {
          console.error('Failed to parse AI response:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        setConnectionStatus('offline');
        setIsTyping(false);
        
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
          if (connectionStatus !== 'online') {
            initializeConnection();
          }
        }, 5000);
      };
      
      wsRef.current.onerror = () => {
        setConnectionStatus('offline');
        setIsTyping(false);
      };
      
    } catch (error) {
      console.error('Failed to initialize AI conversation:', error);
      setConnectionStatus('offline');
    }
  }, [userId, userRole, systemContext, conversationId, connectionStatus]);

  // Handle AI response
  const handleAIResponse = useCallback((response: any) => {
    setIsTyping(false);
    
    if (response.type === 'message') {
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        metadata: {
          confidence: response.confidence,
          sources: response.sources,
          context: response.context
        }
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } else if (response.type === 'action_request') {
      // Handle action requests (e.g., "show camera feed", "generate report")
      if (onActionRequest) {
        onActionRequest(response.action, response.params);
      }
      
      // Add system message about the action
      const actionMessage: ChatMessage = {
        id: `action_${Date.now()}`,
        type: 'system',
        content: `Executing: ${response.action}`,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, actionMessage]);
    } else if (response.type === 'typing') {
      setIsTyping(response.typing);
    }
  }, [onActionRequest]);

  // Send message to AI
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || connectionStatus !== 'online') return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: content.trim(),
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    // Send to AI
    const message = {
      type: 'message',
      content: content.trim(),
      conversation_id: conversationId,
      user_id: userId,
      system_context: systemContext,
      timestamp: Date.now()
    };
    
    wsRef.current?.send(JSON.stringify(message));
  }, [connectionStatus, conversationId, userId, systemContext]);

  // Handle quick action click
  const handleQuickAction = useCallback((action: string) => {
    sendMessage(action);
  }, [sendMessage]);

  // Handle input key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  }, [inputMessage, sendMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Initialize connection on mount
  useEffect(() => {
    initializeConnection();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [initializeConnection]);

  // Update system context
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && systemContext) {
      const contextUpdate = {
        type: 'context_update',
        system_context: systemContext,
        conversation_id: conversationId
      };
      
      wsRef.current.send(JSON.stringify(contextUpdate));
    }
  }, [systemContext, conversationId]);

  return (
    <ConversationContainer expanded={isExpanded}>
      <ConversationHeader>
        <HeaderTitle>APEX AI Assistant</HeaderTitle>
        <HeaderControls>
          <StatusIndicator status={connectionStatus} />
          <ControlButton 
            variant="secondary"
            onClick={onToggleExpanded}
            title={isExpanded ? "Minimize" : "Expand"}
          >
            {isExpanded ? '🔽' : '🔼'}
          </ControlButton>
        </HeaderControls>
      </ConversationHeader>

      <MessagesContainer>
        {messages.length === 0 && (
          <WelcomeMessage>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>👋</div>
            <div>
              <strong>Welcome to APEX AI Assistant!</strong>
            </div>
            <div style={{ marginTop: '8px' }}>
              I have access to all your security system data and can help with:
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              • System status and alerts • Camera management • Incident analysis • 
              Configuration guidance • Performance insights • Security recommendations
            </div>
          </WelcomeMessage>
        )}
        
        {messages.map(message => (
          <div key={message.id}>
            <MessageBubble type={message.type}>
              {message.content}
              {message.metadata?.sources && (
                <MessageSources>
                  📚 Sources: {message.metadata.sources.join(', ')}
                </MessageSources>
              )}
            </MessageBubble>
            <MessageMeta>
              {new Date(message.timestamp).toLocaleTimeString()}
              {message.metadata?.confidence && (
                <span style={{ marginLeft: '8px' }}>
                  • {Math.round(message.metadata.confidence * 100)}% confidence
                </span>
              )}
            </MessageMeta>
          </div>
        ))}
        
        <TypingIndicator visible={isTyping}>
          <span>AI is thinking</span>
          <TypingDots>
            <div></div>
            <div></div>
            <div></div>
          </TypingDots>
        </TypingIndicator>
        
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {messages.length === 0 && (
        <QuickActions>
          {quickActions.map((action, index) => (
            <QuickActionButton 
              key={index}
              onClick={() => handleQuickAction(action)}
            >
              {action}
            </QuickActionButton>
          ))}
        </QuickActions>
      )}

      <InputContainer>
        <MessageInput
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            connectionStatus === 'online' 
              ? "Ask me anything about your security system..." 
              : "Connecting to AI assistant..."
          }
          disabled={connectionStatus !== 'online'}
        />
        <SendButton 
          onClick={() => sendMessage(inputMessage)}
          disabled={!inputMessage.trim() || connectionStatus !== 'online'}
        >
          📤 Send
        </SendButton>
      </InputContainer>
    </ConversationContainer>
  );
};

export default AIConversationPanel;