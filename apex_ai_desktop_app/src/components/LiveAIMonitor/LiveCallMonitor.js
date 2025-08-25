/**
 * LIVE CALL MONITOR COMPONENT
 * ==========================
 * Real-time monitoring of Voice AI dispatcher calls with human oversight
 * Features: Live transcripts, call controls, human intervention capability
 * 
 * Integration with existing LiveAIMonitor ecosystem
 */

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

// Using emoji icons to match existing component patterns
// No external dependencies required

// ===========================
// STYLED COMPONENTS
// ===========================

const MonitorContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme.colors.backgroundCard};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
`;

const MonitorHeader = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.backgroundLight};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const CallStatus = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  
  ${props => props.status === 'active' && `
    background-color: rgba(34, 197, 94, 0.1);
    color: ${props.theme.colors.success};
    border: 1px solid ${props.theme.colors.success};
  `}
  
  ${props => props.status === 'ringing' && `
    background-color: rgba(245, 158, 11, 0.1);
    color: ${props.theme.colors.warning};
    border: 1px solid ${props.theme.colors.warning};
  `}
  
  ${props => props.status === 'inactive' && `
    background-color: rgba(107, 114, 128, 0.1);
    color: ${props.theme.colors.textMuted};
    border: 1px solid ${props.theme.colors.border};
  `}
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.status) {
      case 'active': return props.theme.colors.success;
      case 'ringing': return props.theme.colors.warning;
      default: return props.theme.colors.textMuted;
    }
  }};
  animation: ${props => props.status === 'ringing' ? 'pulse 1.5s ease-in-out infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

const MonitorContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ActiveCallPanel = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.background};
`;

const CallInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const InfoLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
`;

const InfoValue = styled.span`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const CallTimer = styled.div`
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.primary};
  font-family: 'Monaco', 'Menlo', monospace;
`;

const TranscriptContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TranscriptHeader = styled.div`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.backgroundLight};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TranscriptTitle = styled.h4`
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const TranscriptControls = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
`;

const ControlButton = styled.button`
  background: transparent;
  border: 1px solid ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text};
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.xs};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.backgroundLight};
    border-color: ${props => props.theme.colors.primary};
  }

  &.active {
    background-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.background};
    border-color: ${props => props.theme.colors.primary};
  }
`;

const TranscriptContent = styled.div`
  flex: 1;
  padding: ${props => props.theme.spacing.md};
  overflow-y: auto;
  background-color: ${props => props.theme.colors.background};
`;

const TranscriptEntry = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => {
    if (props.speaker === 'ai') return 'rgba(59, 130, 246, 0.1)';
    if (props.speaker === 'caller') return 'rgba(107, 114, 128, 0.1)';
    return props.theme.colors.backgroundLight;
  }};
  border-left: 3px solid ${props => {
    if (props.speaker === 'ai') return props.theme.colors.primary;
    if (props.speaker === 'caller') return props.theme.colors.textMuted;
    return props.theme.colors.border;
  }};
`;

const TranscriptSpeaker = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => {
    if (props.speaker === 'ai') return props.theme.colors.primary;
    if (props.speaker === 'caller') return props.theme.colors.textSecondary;
    return props.theme.colors.textMuted;
  }};
  margin-bottom: ${props => props.theme.spacing.xs};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const TranscriptText = styled.div`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text};
  line-height: 1.5;
  
  ${props => props.isLive && `
    color: ${props.theme.colors.primary};
    font-weight: ${props.theme.typography.fontWeight.medium};
  `}
`;

const TranscriptTimestamp = styled.span`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.textMuted};
  font-family: 'Monaco', 'Menlo', monospace;
`;

const NoCallsMessage = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: ${props => props.theme.colors.textMuted};
  font-size: ${props => props.theme.typography.fontSize.sm};
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.xl};
`;

const LiveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.error};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  
  &:before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: ${props => props.theme.colors.error};
    animation: pulse 1s ease-in-out infinite;
  }
`;

// ===========================
// MAIN COMPONENT
// ===========================

function LiveCallMonitor({ 
  activeCalls = [], 
  onCallSelect, 
  onTakeoverRequest,
  className = '',
  expanded = false 
}) {
  const [selectedCall, setSelectedCall] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [callTimer, setCallTimer] = useState('00:00');
  const transcriptRef = useRef(null);

  // Select the first active call automatically
  useEffect(() => {
    if (activeCalls.length > 0 && !selectedCall) {
      setSelectedCall(activeCalls[0]);
    } else if (activeCalls.length === 0) {
      setSelectedCall(null);
    }
  }, [activeCalls, selectedCall]);

  // Update call timer
  useEffect(() => {
    if (selectedCall && selectedCall.status === 'active') {
      const interval = setInterval(() => {
        const startTime = new Date(selectedCall.startTime);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setCallTimer(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [selectedCall]);

  // Auto-scroll transcript
  useEffect(() => {
    if (autoScroll && transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [selectedCall?.transcript, autoScroll]);

  const handleCallSelect = (call) => {
    setSelectedCall(call);
    if (onCallSelect) {
      onCallSelect(call);
    }
  };

  const handleTakeoverRequest = () => {
    if (selectedCall && onTakeoverRequest) {
      onTakeoverRequest(selectedCall);
    }
  };

  const formatPhoneNumber = (number) => {
    if (!number) return 'Unknown';
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return number;
  };

  const getCallStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active Call';
      case 'ringing': return 'Incoming Call';
      case 'ending': return 'Call Ending';
      default: return 'No Active Calls';
    }
  };

  const currentStatus = activeCalls.length > 0 ? activeCalls[0].status : 'inactive';

  return (
    <MonitorContainer className={className}>
      <MonitorHeader>
        <HeaderTitle>
          📞 Voice AI Monitor
          {selectedCall && (
            <CallTimer>{callTimer}</CallTimer>
          )}
        </HeaderTitle>
        
        <CallStatus status={currentStatus}>
          <StatusDot status={currentStatus} />
          {getCallStatusText(currentStatus)}
          {activeCalls.length > 1 && ` (+${activeCalls.length - 1} more)`}
        </CallStatus>
      </MonitorHeader>

      <MonitorContent>
        {selectedCall ? (
          <>
            <ActiveCallPanel>
              <CallInfo>
                <InfoItem>
                  <InfoLabel>Caller</InfoLabel>
                  <InfoValue>{formatPhoneNumber(selectedCall.callerNumber)}</InfoValue>
                </InfoItem>
                
                <InfoItem>
                  <InfoLabel>Property</InfoLabel>
                  <InfoValue>{selectedCall.propertyName || 'Unknown Property'}</InfoValue>
                </InfoItem>
                
                <InfoItem>
                  <InfoLabel>Incident Type</InfoLabel>
                  <InfoValue>{selectedCall.incidentType || 'General Inquiry'}</InfoValue>
                </InfoItem>
                
                <InfoItem>
                  <InfoLabel>AI Confidence</InfoLabel>
                  <InfoValue>{selectedCall.aiConfidence ? `${Math.round(selectedCall.aiConfidence * 100)}%` : 'N/A'}</InfoValue>
                </InfoItem>
              </CallInfo>
              
              {selectedCall.status === 'active' && (
                <LiveIndicator>
                  🔴 LIVE CALL IN PROGRESS
                </LiveIndicator>
              )}
            </ActiveCallPanel>

            <TranscriptContainer>
              <TranscriptHeader>
                <TranscriptTitle>📝 Live Transcript</TranscriptTitle>
                
                <TranscriptControls>
                  <ControlButton 
                    className={autoScroll ? 'active' : ''}
                    onClick={() => setAutoScroll(!autoScroll)}
                    title="Auto-scroll to latest"
                  >
                    📄
                  </ControlButton>
                  
                  <ControlButton
                    className={showTimestamps ? 'active' : ''}
                    onClick={() => setShowTimestamps(!showTimestamps)}
                    title="Show timestamps"
                  >
                    🕐
                  </ControlButton>
                  
                  <ControlButton
                    onClick={handleTakeoverRequest}
                    title="Request human takeover"
                    style={{ color: '#f59e0b', borderColor: '#f59e0b' }}
                  >
                    🎯 TAKEOVER
                  </ControlButton>
                </TranscriptControls>
              </TranscriptHeader>

              <TranscriptContent ref={transcriptRef}>
                {selectedCall.transcript && selectedCall.transcript.length > 0 ? (
                  selectedCall.transcript.map((entry, index) => (
                    <TranscriptEntry key={index} speaker={entry.speaker}>
                      <TranscriptSpeaker speaker={entry.speaker}>
                        {entry.speaker === 'ai' ? '🤖 APEX AI' : '📞 Caller'}
                        {showTimestamps && (
                          <TranscriptTimestamp>
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </TranscriptTimestamp>
                        )}
                      </TranscriptSpeaker>
                      <TranscriptText isLive={index === selectedCall.transcript.length - 1 && selectedCall.status === 'active'}>
                        {entry.text}
                      </TranscriptText>
                    </TranscriptEntry>
                  ))
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#888', 
                    fontSize: '14px',
                    marginTop: '20px'
                  }}>
                    📝 Transcript will appear here when call begins...
                  </div>
                )}
              </TranscriptContent>
            </TranscriptContainer>
          </>
        ) : (
          <NoCallsMessage>
            <span style={{ fontSize: '48px' }}>📞</span>
            <div>No Active Voice AI Calls</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Voice AI Dispatcher is ready to receive calls
            </div>
          </NoCallsMessage>
        )}
      </MonitorContent>
    </MonitorContainer>
  );
}

export default LiveCallMonitor;
