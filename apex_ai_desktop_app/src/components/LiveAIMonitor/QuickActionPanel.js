/**
 * QUICK ACTION PANEL COMPONENT
 * ===========================
 * Rapid response actions for security personnel
 * Features: Voice responses, snapshots, emergency actions, call monitoring controls
 * 
 * Enhanced with Voice AI dispatcher integration and human intervention controls
 */

import React, { useState } from 'react';
import styled from 'styled-components';

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const PanelSection = styled.div`
  background-color: ${props => props.theme.colors.backgroundLight};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
`;

const SectionTitle = styled.h4`
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing.sm};
`;

const ActionButton = styled.button`
  background: ${props => {
    if (props.variant === 'emergency') return props.theme.colors.error;
    if (props.variant === 'warning') return props.theme.colors.warning;
    if (props.variant === 'primary') return props.theme.colors.primary;
    return props.theme.colors.backgroundCard;
  }};
  color: ${props => {
    if (props.variant === 'emergency' || props.variant === 'warning' || props.variant === 'primary') {
      return props.theme.colors.background;
    }
    return props.theme.colors.text;
  }};
  border: 1px solid ${props => {
    if (props.variant === 'emergency') return props.theme.colors.error;
    if (props.variant === 'warning') return props.theme.colors.warning;
    if (props.variant === 'primary') return props.theme.colors.primary;
    return props.theme.colors.border;
  }};
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  min-height: 60px;
  justify-content: center;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.sm};
    opacity: 0.9;
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const VoiceButton = styled(ActionButton)`
  grid-column: span 2;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.colors.primaryDark} 100%);
  color: ${props => props.theme.colors.background};
  border: none;
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover:before {
    left: 100%;
  }
`;

const StatusDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.sm};
  border: 1px solid ${props => props.theme.colors.border};
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.textSecondary};
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const StatusDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.status) {
      case 'active': return props.theme.colors.success;
      case 'busy': return props.theme.colors.warning;
      case 'offline': return props.theme.colors.error;
      default: return props.theme.colors.textMuted;
    }
  }};
`;

const CameraSelector = styled.select`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.backgroundCard};
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  margin-bottom: ${props => props.theme.spacing.sm};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const LastActionDisplay = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.textMuted};
  padding: ${props => props.theme.spacing.xs};
  background-color: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.sm};
  border: 1px solid ${props => props.theme.colors.border};
  margin-top: ${props => props.theme.spacing.sm};
`;

function QuickActionPanel({ 
  activeCameras = [], 
  focusedCamera,
  activeCalls = [],
  interventionRequest = null,
  onCallAction,
  onInterventionAction
}) {
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(focusedCamera?.id || '');
  const [callMonitorExpanded, setCallMonitorExpanded] = useState(false);

  // Voice response options for demo
  const voiceResponses = [
    '🔊 "Security, please respond to the main entrance."',
    '🔊 "Unknown individual detected, investigating."',
    '🔊 "All clear, continuing patrol."',
    '🔊 "Requesting backup at current location."',
    '🔊 "False alarm, situation resolved."'
  ];

  // Update selected camera when focused camera changes
  React.useEffect(() => {
    if (focusedCamera?.id) {
      setSelectedCamera(focusedCamera.id);
    }
  }, [focusedCamera]);

  const performAction = async (actionType, actionData = {}) => {
    setIsPerformingAction(true);
    
    try {
      let result;
      const targetCamera = selectedCamera || focusedCamera?.id || activeCameras[0]?.id;
      
      switch (actionType) {
        case 'voice_response':
          if (window.electronAPI) {
            result = await window.electronAPI.playVoiceResponse(actionData.voiceLine);
          }
          setLastAction({
            type: 'Voice Response',
            details: actionData.voiceLine,
            camera: targetCamera,
            timestamp: new Date()
          });
          break;
          
        case 'capture_snapshot':
          if (window.electronAPI && targetCamera) {
            result = await window.electronAPI.captureSnapshot(targetCamera);
          }
          setLastAction({
            type: 'Snapshot Captured',
            details: `Camera: ${getCameraName(targetCamera)}`,
            camera: targetCamera,
            timestamp: new Date()
          });
          break;
          
        case 'emergency_alert':
          // In production, this would trigger real emergency protocols
          setLastAction({
            type: 'Emergency Alert',
            details: 'Alert sent to all personnel',
            camera: targetCamera,
            timestamp: new Date()
          });
          break;
          
        case 'false_alarm':
          setLastAction({
            type: 'False Alarm',
            details: 'Event marked as false positive',
            camera: targetCamera,
            timestamp: new Date()
          });
          break;
          
        case 'request_backup':
          setLastAction({
            type: 'Backup Requested',
            details: 'Dispatch notified',
            camera: targetCamera,
            timestamp: new Date()
          });
          break;
          
        case 'lock_doors':
          setLastAction({
            type: 'Security Lockdown',
            details: 'Facility doors secured',
            camera: targetCamera,
            timestamp: new Date()
          });
          break;
          
        case 'call_monitor_toggle':
          setCallMonitorExpanded(!callMonitorExpanded);
          setLastAction({
            type: 'Call Monitor',
            details: callMonitorExpanded ? 'Monitor collapsed' : 'Monitor expanded',
            camera: null,
            timestamp: new Date()
          });
          break;
          
        case 'call_intervention':
          if (onInterventionAction) {
            onInterventionAction(actionData.action, actionData.call);
          }
          setLastAction({
            type: 'Call Intervention',
            details: `${actionData.action}: ${actionData.call?.callerNumber || 'Unknown caller'}`,
            camera: null,
            timestamp: new Date()
          });
          break;
          
        case 'call_action':
          if (onCallAction) {
            onCallAction(actionData.action, actionData.call);
          }
          setLastAction({
            type: 'Call Action',
            details: `${actionData.action}: ${actionData.call?.callerNumber || 'Unknown caller'}`,
            camera: null,
            timestamp: new Date()
          });
          break;
          
        default:
          console.warn('Unknown action type:', actionType);
      }
      
      console.log('✅ Action completed:', actionType, result);
      
    } catch (error) {
      console.error('❌ Action failed:', error);
      setLastAction({
        type: 'Action Failed',
        details: error.message,
        camera: targetCamera,
        timestamp: new Date()
      });
    } finally {
      setIsPerformingAction(false);
    }
  };

  const getCameraName = (cameraId) => {
    const camera = activeCameras.find(cam => cam.id === cameraId);
    return camera ? camera.name : cameraId;
  };

  const getRandomVoiceResponse = () => {
    return voiceResponses[Math.floor(Math.random() * voiceResponses.length)];
  };

  // Call monitoring helper functions
  const hasActiveCalls = activeCalls && activeCalls.length > 0;
  const hasInterventionRequest = interventionRequest !== null;
  
  const handleCallAction = (action, call = null) => {
    const targetCall = call || (activeCalls && activeCalls[0]);
    performAction('call_action', { action, call: targetCall });
  };
  
  const handleInterventionAction = (action, call = null) => {
    const targetCall = call || interventionRequest;
    performAction('call_intervention', { action, call: targetCall });
  };

  return (
    <PanelContainer>
      {/* Camera Selection */}
      <PanelSection>
        <SectionTitle>📹 Target Camera</SectionTitle>
        <CameraSelector
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
        >
          <option value="">Select Camera</option>
          {activeCameras.map(camera => (
            <option key={camera.id} value={camera.id}>
              {camera.name}
            </option>
          ))}
        </CameraSelector>
        
        <StatusDisplay>
          <StatusIndicator>
            <StatusDot status="active" />
            <span>AI Active</span>
          </StatusIndicator>
          <span>{activeCameras.length} Cameras</span>
        </StatusDisplay>
      </PanelSection>

      {/* Voice Response - WOW FEATURE */}
      <PanelSection>
        <SectionTitle>🎤 AI Voice Response</SectionTitle>
        <VoiceButton
          onClick={() => performAction('voice_response', { 
            voiceLine: getRandomVoiceResponse() 
          })}
          disabled={isPerformingAction}
        >
          <span style={{ fontSize: '20px' }}>🔊</span>
          Broadcast AI Response
        </VoiceButton>
        
        <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', marginTop: '4px' }}>
          Simulated AI voice communication
        </div>
      </PanelSection>

      {/* Quick Actions */}
      <PanelSection>
        <SectionTitle>⚡ Quick Actions</SectionTitle>
        <ActionGrid>
          <ActionButton
            onClick={() => performAction('capture_snapshot')}
            disabled={isPerformingAction || !selectedCamera}
            variant="primary"
          >
            <span style={{ fontSize: '16px' }}>📸</span>
            Snapshot
          </ActionButton>
          
          <ActionButton
            onClick={() => performAction('false_alarm')}
            disabled={isPerformingAction}
          >
            <span style={{ fontSize: '16px' }}>✅</span>
            False Alarm
          </ActionButton>
          
          <ActionButton
            onClick={() => performAction('request_backup')}
            disabled={isPerformingAction}
            variant="warning"
          >
            <span style={{ fontSize: '16px' }}>🚨</span>
            Request Backup
          </ActionButton>
          
          <ActionButton
            onClick={() => performAction('lock_doors')}
            disabled={isPerformingAction}
            variant="emergency"
          >
            <span style={{ fontSize: '16px' }}>🔒</span>
            Lockdown
          </ActionButton>
        </ActionGrid>
      </PanelSection>

      {/* Voice AI Call Controls */}
      <PanelSection>
        <SectionTitle>
          📞 Voice AI Calls
          {hasActiveCalls && (
            <span style={{ 
              fontSize: '10px', 
              backgroundColor: '#10b981', 
              color: 'white', 
              padding: '2px 6px', 
              borderRadius: '10px',
              marginLeft: '8px'
            }}>
              {activeCalls.length} ACTIVE
            </span>
          )}
        </SectionTitle>
        
        {hasActiveCalls ? (
          <ActionGrid>
            <ActionButton
              onClick={() => handleCallAction('monitor')}
              disabled={isPerformingAction}
              variant="primary"
            >
              <span style={{ fontSize: '16px' }}>👁️</span>
              Monitor Call
            </ActionButton>
            
            <ActionButton
              onClick={() => handleCallAction('transcript')}
              disabled={isPerformingAction}
            >
              <span style={{ fontSize: '16px' }}>📝</span>
              View Transcript
            </ActionButton>
            
            {hasInterventionRequest ? (
              <ActionButton
                onClick={() => handleInterventionAction('takeover')}
                disabled={isPerformingAction}
                variant="warning"
              >
                <span style={{ fontSize: '16px' }}>🎯</span>
                Take Over
              </ActionButton>
            ) : (
              <ActionButton
                onClick={() => handleCallAction('request_intervention')}
                disabled={isPerformingAction}
                variant="warning"
              >
                <span style={{ fontSize: '16px' }}>🆘</span>
                Request Help
              </ActionButton>
            )}
            
            <ActionButton
              onClick={() => handleCallAction('end_call')}
              disabled={isPerformingAction}
              variant="emergency"
            >
              <span style={{ fontSize: '16px' }}>📞</span>
              End Call
            </ActionButton>
          </ActionGrid>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#666',
            fontSize: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            📞 No active Voice AI calls<br />
            <span style={{ fontSize: '10px' }}>System ready to receive calls</span>
          </div>
        )}
        
        {hasInterventionRequest && (
          <div style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#f59e0b',
            textAlign: 'center'
          }}>
            ⚠️ Human intervention requested
          </div>
        )}
      </PanelSection>

      {/* Emergency Actions */}
      <PanelSection>
        <SectionTitle>🚨 Emergency Response</SectionTitle>
        <ActionButton
          onClick={() => performAction('emergency_alert')}
          disabled={isPerformingAction}
          variant="emergency"
          style={{ width: '100%', minHeight: '50px' }}
        >
          <span style={{ fontSize: '18px' }}>🚨</span>
          EMERGENCY ALERT
        </ActionButton>
      </PanelSection>

      {/* Last Action Display */}
      {lastAction && (
        <LastActionDisplay>
          <strong>Last Action:</strong> {lastAction.type}<br />
          <span>{lastAction.details}</span><br />
          <span style={{ fontSize: '10px' }}>
            {lastAction.timestamp.toLocaleTimeString()}
          </span>
        </LastActionDisplay>
      )}
    </PanelContainer>
  );
}

export default QuickActionPanel;
