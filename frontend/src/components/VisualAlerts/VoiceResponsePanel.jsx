/**
 * APEX AI VOICE RESPONSE PANEL - TIER 2 AI CONVERSATION
 * =====================================================
 * Professional dispatcher interface for AI-powered suspect interaction
 * 
 * Features:
 * - Real-time conversation control and monitoring
 * - Pre-defined security scripts and dynamic responses
 * - Live audio transcription and conversation history
 * - AI de-escalation management
 * - Professional security communication protocols
 * - Integration with threat detection system
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import { useSocket } from '../../hooks/useSocket'
import { THREAT_COLORS } from './BlinkingBorderOverlay'

// Conversation configuration
const CONVERSATION_CONFIG = {
  MAX_CONVERSATION_DURATION: 300000, // 5 minutes
  TRANSCRIPT_BUFFER_SIZE: 1000,
  AUTO_SAVE_INTERVAL: 10000, // 10 seconds
  VOICE_RECOGNITION_TIMEOUT: 5000,
  AI_RESPONSE_TIMEOUT: 3000
}

// Pre-defined security scripts
const SECURITY_SCRIPTS = {
  GREETING: {
    id: 'greeting',
    name: 'Initial Contact',
    text: 'Hello, this is building security. Please identify yourself and state your business.',
    tone: 'professional',
    duration: 5
  },
  TRESPASSING: {
    id: 'trespassing',
    name: 'Trespassing Warning',
    text: 'You are currently in a restricted area. Please exit immediately or security will be contacted.',
    tone: 'firm',
    duration: 6
  },
  PACKAGE_THEFT: {
    id: 'package_theft',
    name: 'Package Inquiry',
    text: 'We notice you near the package area. Are you a resident picking up your delivery?',
    tone: 'inquisitive',
    duration: 5
  },
  WEAPON_DETECTED: {
    id: 'weapon_detected',
    name: 'WEAPON PROTOCOL',
    text: 'Security alert. Please remain calm and keep your hands visible. Security is responding.',
    tone: 'authoritative',
    duration: 7
  },
  DE_ESCALATION: {
    id: 'de_escalation',
    name: 'De-escalation',
    text: "Let's talk about this calmly. What can we do to resolve this situation peacefully?",
    tone: 'calm',
    duration: 6
  },
  FINAL_WARNING: {
    id: 'final_warning',
    name: 'Final Warning',
    text: 'This is your final warning. Leave the premises immediately or law enforcement will be contacted.',
    tone: 'authoritative',
    duration: 8
  }
}

// Animation keyframes
const voiceWave = keyframes`
  0%, 100% { transform: scaleY(0.5); opacity: 0.6; }
  50% { transform: scaleY(1.2); opacity: 1; }
`

const recordingPulse = keyframes`
  0%, 100% { 
    background: #FF4444;
    box-shadow: 0 0 10px rgba(255, 68, 68, 0.6);
  }
  50% { 
    background: #FF6666;
    box-shadow: 0 0 20px rgba(255, 68, 68, 0.9);
  }
`

const aiProcessing = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

// Styled components
const VoiceControlContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 16px;
  
  padding: 20px;
  width: 380px;
  max-height: 500px;
  
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #FFFFFF;
  
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.5),
    0 6px 20px rgba(0, 255, 136, 0.1);
  
  z-index: 9996;
  
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${props => props.$isCollapsed && `
    transform: translateY(calc(100% - 60px));
    
    &:hover {
      transform: translateY(0);
    }
  `}
`

const VoiceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  
  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: #00FF88;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`

const ConversationStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  .status {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .active {
    background: rgba(0, 255, 136, 0.2);
    color: #00FF88;
    border: 1px solid #00FF88;
  }
  
  .inactive {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .recording {
    background: rgba(255, 68, 68, 0.2);
    color: #FF4444;
    border: 1px solid #FF4444;
    animation: ${recordingPulse} 1.5s ease-in-out infinite;
  }
`

const ScriptSelector = styled.div`
  margin-bottom: 16px;
  
  label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 8px;
  }
  
  select {
    width: 100%;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #FFFFFF;
    font-size: 11px;
    
    option {
      background: rgba(0, 0, 0, 0.9);
      color: #FFFFFF;
    }
    
    &:focus {
      border-color: #00FF88;
      outline: none;
    }
  }
`

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
`

const ActionButton = styled.button`
  padding: 10px 16px;
  background: ${props => {
    if (props.$variant === 'primary') return 'rgba(0, 255, 136, 0.2)'
    if (props.$variant === 'danger') return 'rgba(255, 68, 68, 0.2)'
    if (props.$variant === 'warning') return 'rgba(255, 140, 0, 0.2)'
    return 'rgba(255, 255, 255, 0.05)'
  }};
  
  border: 1px solid ${props => {
    if (props.$variant === 'primary') return '#00FF88'
    if (props.$variant === 'danger') return '#FF4444'
    if (props.$variant === 'warning') return '#FF8C00'
    return 'rgba(255, 255, 255, 0.2)'
  }};
  
  border-radius: 8px;
  color: ${props => {
    if (props.$variant === 'primary') return '#00FF88'
    if (props.$variant === 'danger') return '#FF4444'
    if (props.$variant === 'warning') return '#FF8C00'
    return '#FFFFFF'
  }};
  
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  cursor: pointer;
  transition: all 0.2s ease;
  
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  
  &:hover:not(:disabled) {
    background: ${props => {
      if (props.$variant === 'primary') return 'rgba(0, 255, 136, 0.3)'
      if (props.$variant === 'danger') return 'rgba(255, 68, 68, 0.3)'
      if (props.$variant === 'warning') return 'rgba(255, 140, 0, 0.3)'
      return 'rgba(255, 255, 255, 0.1)'
    }};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .icon {
    font-size: 12px;
  }
`

const VoiceVisualizer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 40px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  margin: 12px 0;
  padding: 8px;
`

const VoiceBar = styled.div`
  width: 3px;
  background: ${props => props.$active ? '#00FF88' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 2px;
  height: ${props => props.$height || 20}%;
  
  animation: ${props => props.$active ? voiceWave : 'none'} 
             ${props => (props.$index * 0.1) + 0.5}s ease-in-out infinite;
  
  transition: all 0.2s ease;
`

const TranscriptContainer = styled.div`
  max-height: 150px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px;
  margin: 12px 0;
  
  font-family: 'Courier New', monospace;
  font-size: 10px;
  line-height: 1.4;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 136, 0.6);
    border-radius: 2px;
    
    &:hover {
      background: rgba(0, 255, 136, 0.8);
    }
  }
`

const TranscriptMessage = styled.div`
  margin-bottom: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  border-left: 3px solid ${props => props.$type === 'ai' ? '#00FF88' : '#FF8C00'};
  background: ${props => props.$type === 'ai' 
    ? 'rgba(0, 255, 136, 0.1)' 
    : 'rgba(255, 140, 0, 0.1)'};
  
  .timestamp {
    font-size: 8px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 2px;
  }
  
  .speaker {
    font-weight: 700;
    color: ${props => props.$type === 'ai' ? '#00FF88' : '#FF8C00'};
    text-transform: uppercase;
    font-size: 9px;
    margin-bottom: 2px;
  }
  
  .message {
    color: #FFFFFF;
  }
`

const AIProcessingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 8px;
  margin: 8px 0;
  
  .spinner {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(0, 255, 136, 0.3);
    border-top: 2px solid #00FF88;
    border-radius: 50%;
    animation: ${aiProcessing} 1s linear infinite;
  }
  
  .text {
    font-size: 10px;
    color: #00FF88;
    font-weight: 600;
  }
`

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #00FF88;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #FFFFFF;
  }
`

// Main component
const VoiceResponsePanel = ({
  isEnabled = true,
  showTranscript = true,
  autoSave = true,
  onConversationStart = null,
  onConversationEnd = null,
  onScriptSelect = null
}) => {
  const socket = useSocket()
  
  // State management
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [conversationActive, setConversationActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [selectedScript, setSelectedScript] = useState('')
  const [transcript, setTranscript] = useState([])
  const [voiceLevels, setVoiceLevels] = useState(Array(16).fill(0))
  const [conversationId, setConversationId] = useState(null)
  const [conversationDuration, setConversationDuration] = useState(0)
  
  // Refs
  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])
  const conversationTimer = useRef(null)
  const transcriptRef = useRef(null)
  
  // Socket event handlers
  useEffect(() => {
    if (!socket) return
    
    const handleConversationStarted = (data) => {
      setConversationActive(true)
      setConversationId(data.conversation_id)
      startConversationTimer()
      addTranscriptMessage('ai', 'AI System', 'Conversation initiated.')
    }
    
    const handleConversationStopped = (data) => {
      setConversationActive(false)
      setIsRecording(false)
      setIsAIProcessing(false)
      stopConversationTimer()
      addTranscriptMessage('ai', 'AI System', 'Conversation ended.')
    }
    
    const handleAIResponse = (data) => {
      setIsAIProcessing(false)
      addTranscriptMessage('ai', 'AI Assistant', data.message)
    }
    
    const handleVoiceRecognition = (data) => {
      addTranscriptMessage('human', 'Suspect', data.transcription)
    }
    
    socket.on('ai_conversation_started', handleConversationStarted)
    socket.on('conversation_stopped', handleConversationStopped)
    socket.on('ai_response', handleAIResponse)
    socket.on('voice_recognition', handleVoiceRecognition)
    
    return () => {
      socket.off('ai_conversation_started', handleConversationStarted)
      socket.off('conversation_stopped', handleConversationStopped)
      socket.off('ai_response', handleAIResponse)
      socket.off('voice_recognition', handleVoiceRecognition)
    }
  }, [socket])
  
  // Start conversation
  const startConversation = useCallback((scriptId = null) => {
    if (!socket || conversationActive) return
    
    const script = scriptId ? SECURITY_SCRIPTS[scriptId] : null
    
    socket.emit('start_conversation', {
      script_id: scriptId,
      script_text: script?.text,
      threat_level: 'MEDIUM',
      zone_id: 'MAIN_LOBBY',
      timestamp: Date.now()
    })
    
    if (onConversationStart) {
      onConversationStart({ scriptId, script })
    }
    
    console.log('🗣️ Starting AI conversation with script:', scriptId)
  }, [socket, conversationActive, onConversationStart])
  
  // Stop conversation
  const stopConversation = useCallback(() => {
    if (!socket || !conversationActive) return
    
    socket.emit('stop_conversation', {
      conversation_id: conversationId,
      timestamp: Date.now()
    })
    
    if (onConversationEnd) {
      onConversationEnd({ conversationId, duration: conversationDuration })
    }
    
    console.log('🛑 Stopping AI conversation')
  }, [socket, conversationActive, conversationId, conversationDuration, onConversationEnd])
  
  // Send pre-defined script
  const sendScript = useCallback((scriptId) => {
    if (!socket || !conversationActive) return
    
    const script = SECURITY_SCRIPTS[scriptId]
    if (!script) return
    
    socket.emit('send_script', {
      conversation_id: conversationId,
      script_id: scriptId,
      script_text: script.text,
      tone: script.tone,
      timestamp: Date.now()
    })
    
    addTranscriptMessage('ai', 'AI Assistant', script.text)
    setIsAIProcessing(true)
    
    if (onScriptSelect) {
      onScriptSelect(script)
    }
    
    console.log('📜 Sending script:', script.name)
  }, [socket, conversationActive, conversationId, onScriptSelect])
  
  // Start conversation timer
  const startConversationTimer = useCallback(() => {
    conversationTimer.current = setInterval(() => {
      setConversationDuration(prev => prev + 1)
    }, 1000)
  }, [])
  
  // Stop conversation timer
  const stopConversationTimer = useCallback(() => {
    if (conversationTimer.current) {
      clearInterval(conversationTimer.current)
      conversationTimer.current = null
    }
  }, [])
  
  // Add message to transcript
  const addTranscriptMessage = useCallback((type, speaker, message) => {
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      speaker,
      message,
      timestamp: new Date().toLocaleTimeString()
    }
    
    setTranscript(prev => {
      const updated = [...prev, newMessage]
      return updated.slice(-CONVERSATION_CONFIG.TRANSCRIPT_BUFFER_SIZE)
    })
    
    // Auto-scroll to bottom
    setTimeout(() => {
      if (transcriptRef.current) {
        transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
      }
    }, 100)
  }, [])
  
  // Format conversation duration
  const formatDuration = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])
  
  // Handle script selection
  const handleScriptChange = useCallback((scriptId) => {
    setSelectedScript(scriptId)
  }, [])
  
  // Send selected script
  const handleSendScript = useCallback(() => {
    if (selectedScript) {
      sendScript(selectedScript)
    }
  }, [selectedScript, sendScript])
  
  // Generate voice level visualization
  const updateVoiceLevels = useCallback(() => {
    if (isRecording || conversationActive) {
      setVoiceLevels(prev => prev.map(() => Math.random() * 100))
    } else {
      setVoiceLevels(Array(16).fill(0))
    }
  }, [isRecording, conversationActive])
  
  // Update voice levels periodically
  useEffect(() => {
    const interval = setInterval(updateVoiceLevels, 200)
    return () => clearInterval(interval)
  }, [updateVoiceLevels])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConversationTimer()
      if (conversationActive) {
        stopConversation()
      }
    }
  }, [])
  
  if (!isEnabled) return null
  
  return (
    <VoiceControlContainer $isCollapsed={isCollapsed}>
      <VoiceHeader>
        <h3>
          🗣️ AI CONVERSATION
          <ConversationStatus>
            <div className={`status ${
              conversationActive ? 'active' : 
              isRecording ? 'recording' : 'inactive'
            }`}>
              {conversationActive ? `ACTIVE ${formatDuration(conversationDuration)}` : 
               isRecording ? 'RECORDING' : 'STANDBY'}
            </div>
          </ConversationStatus>
        </h3>
        <ToggleButton onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? '▲' : '▼'}
        </ToggleButton>
      </VoiceHeader>
      
      {/* Script selector */}
      <ScriptSelector>
        <label>SECURITY SCRIPT</label>
        <select 
          value={selectedScript} 
          onChange={(e) => handleScriptChange(e.target.value)}
          disabled={!conversationActive}
        >
          <option value="">Select a script...</option>
          {Object.entries(SECURITY_SCRIPTS).map(([key, script]) => (
            <option key={key} value={key}>
              {script.name} ({script.duration}s)
            </option>
          ))}
        </select>
      </ScriptSelector>
      
      {/* Action buttons */}
      <ActionButtons>
        {!conversationActive ? (
          <>
            <ActionButton
              $variant="primary"
              onClick={() => startConversation()}
            >
              <span className="icon">▶</span>
              START CONVERSATION
            </ActionButton>
            <ActionButton
              $variant="warning"
              onClick={() => startConversation(selectedScript)}
              disabled={!selectedScript}
            >
              <span className="icon">📜</span>
              START WITH SCRIPT
            </ActionButton>
          </>
        ) : (
          <>
            <ActionButton
              $variant="primary"
              onClick={handleSendScript}
              disabled={!selectedScript}
            >
              <span className="icon">📤</span>
              SEND SCRIPT
            </ActionButton>
            <ActionButton
              $variant="danger"
              onClick={stopConversation}
            >
              <span className="icon">⏹</span>
              END CONVERSATION
            </ActionButton>
          </>
        )}
      </ActionButtons>
      
      {/* Voice visualizer */}
      <VoiceVisualizer>
        {voiceLevels.map((level, index) => (
          <VoiceBar
            key={index}
            $height={level}
            $active={conversationActive || isRecording}
            $index={index}
          />
        ))}
      </VoiceVisualizer>
      
      {/* AI processing indicator */}
      {isAIProcessing && (
        <AIProcessingIndicator>
          <div className="spinner"></div>
          <div className="text">AI GENERATING RESPONSE...</div>
        </AIProcessingIndicator>
      )}
      
      {/* Conversation transcript */}
      {showTranscript && transcript.length > 0 && (
        <TranscriptContainer ref={transcriptRef}>
          {transcript.map(message => (
            <TranscriptMessage key={message.id} $type={message.type}>
              <div className="timestamp">{message.timestamp}</div>
              <div className="speaker">{message.speaker}</div>
              <div className="message">{message.message}</div>
            </TranscriptMessage>
          ))}
        </TranscriptContainer>
      )}
    </VoiceControlContainer>
  )
}

export default VoiceResponsePanel

// Export security scripts for external use
export { SECURITY_SCRIPTS, CONVERSATION_CONFIG }