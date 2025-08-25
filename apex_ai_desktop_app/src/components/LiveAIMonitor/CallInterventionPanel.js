/**
 * CALL INTERVENTION PANEL COMPONENT
 * ================================
 * Human takeover controls for Voice AI dispatcher calls
 * Features: Countdown timers, veto controls, smooth handoff capabilities
 * 
 * Integration with LiveCallMonitor for seamless human oversight
 */

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

// ===========================
// STYLED COMPONENTS
// ===========================

const PanelContainer = styled.div`
  background-color: ${props => props.theme.colors.backgroundCard};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  
  ${props => props.isActive && `
    border-color: ${props.theme.colors.warning};
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
  `}
`;

const PanelHeader = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.isActive ? 'rgba(245, 158, 11, 0.1)' : props.theme.colors.backgroundLight};
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

const InterventionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  
  ${props => props.mode === 'countdown' && `
    background-color: rgba(245, 158, 11, 0.1);
    color: ${props.theme.colors.warning};
    border: 1px solid ${props.theme.colors.warning};
  `}
  
  ${props => props.mode === 'active' && `
    background-color: rgba(239, 68, 68, 0.1);
    color: ${props.theme.colors.error};
    border: 1px solid ${props.theme.colors.error};
  `}
  
  ${props => props.mode === 'standby' && `
    background-color: rgba(107, 114, 128, 0.1);
    color: ${props.theme.colors.textMuted};
    border: 1px solid ${props.theme.colors.border};
  `}
`;

const PanelContent = styled.div`
  padding: ${props => props.theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const CountdownSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.backgroundLight};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  
  ${props => props.isActive && `
    background-color: rgba(245, 158, 11, 0.05);
    border-color: ${props.theme.colors.warning};
  `}
`;

const CountdownTimer = styled.div`
  font-size: 3rem;
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => {
    if (props.seconds <= 5) return props.theme.colors.error;
    if (props.seconds <= 10) return props.theme.colors.warning;
    return props.theme.colors.primary;
  }};
  font-family: 'Monaco', 'Menlo', monospace;
  text-align: center;
  line-height: 1;
`;

const CountdownMessage = styled.div`
  text-align: center;
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text};
  line-height: 1.4;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  width: 100%;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  min-height: 48px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  &:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const VetoButton = styled(ActionButton)`
  background-color: ${props => props.theme.colors.error};
  color: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.theme.colors.error};
  font-size: ${props => props.theme.typography.fontSize.md};
  
  &:not(:disabled):hover {
    background-color: ${props => props.theme.colors.errorDark || '#dc2626'};
    border-color: ${props => props.theme.colors.errorDark || '#dc2626'};
  }
`;

const TakeoverButton = styled(ActionButton)`
  background-color: ${props => props.theme.colors.warning};
  color: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.theme.colors.warning};
  
  &:not(:disabled):hover {
    background-color: ${props => props.theme.colors.warningDark || '#d97706'};
    border-color: ${props => props.theme.colors.warningDark || '#d97706'};
  }
`;

const StandbyButton = styled(ActionButton)`
  background-color: ${props => props.theme.colors.backgroundCard};
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};
  
  &:not(:disabled):hover {
    background-color: ${props => props.theme.colors.backgroundLight};
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: ${props => props.theme.colors.border};
  border-radius: 3px;
  overflow: hidden;
  margin-top: ${props => props.theme.spacing.sm};
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: ${props => {
    if (props.percentage <= 20) return props.theme.colors.error;
    if (props.percentage <= 50) return props.theme.colors.warning;
    return props.theme.colors.primary;
  }};
  width: ${props => props.percentage}%;
  transition: width 0.1s ease, background-color 0.3s ease;
`;

const TriggerInfo = styled.div`
  background-color: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
`;

const TriggerTitle = styled.h4`
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`;

const TriggerReason = styled.div`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const TriggerDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DetailLabel = styled.span`
  color: ${props => props.theme.colors.textMuted};
  text-transform: uppercase;
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
`;

const DetailValue = styled.span`
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const StandbyMessage = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.textMuted};
  font-size: ${props => props.theme.typography.fontSize.sm};
  line-height: 1.6;
`;

// ===========================
// MAIN COMPONENT
// ===========================

function CallInterventionPanel({ 
  interventionRequest = null,
  onVeto,
  onTakeover,
  onStandby,
  className = '',
  countdownDuration = 15 // seconds
}) {
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [mode, setMode] = useState('standby'); // standby, countdown, active
  const intervalRef = useRef(null);

  // Handle intervention request
  useEffect(() => {
    if (interventionRequest && !isCountdownActive) {
      startCountdown();
    } else if (!interventionRequest && isCountdownActive) {
      stopCountdown();
    }
  }, [interventionRequest, isCountdownActive]);

  const startCountdown = () => {
    setCountdownSeconds(countdownDuration);
    setIsCountdownActive(true);
    setMode('countdown');
    
    intervalRef.current = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          // Auto-takeover when countdown reaches 0
          handleAutoTakeover();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopCountdown = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsCountdownActive(false);
    setCountdownSeconds(0);
    setMode('standby');
  };

  const handleVeto = () => {
    stopCountdown();
    if (onVeto) {
      onVeto(interventionRequest);
    }
  };

  const handleTakeover = () => {
    stopCountdown();
    setMode('active');
    if (onTakeover) {
      onTakeover(interventionRequest);
    }
  };

  const handleAutoTakeover = () => {
    stopCountdown();
    setMode('active');
    if (onTakeover) {
      onTakeover(interventionRequest, true); // true indicates auto-takeover
    }
  };

  const handleStandby = () => {
    setMode('standby');
    if (onStandby) {
      onStandby();
    }
  };

  const getStatusText = () => {
    switch (mode) {
      case 'countdown': return 'Intervention Pending';
      case 'active': return 'Human Override Active';
      default: return 'AI Autonomous Mode';
    }
  };

  const getProgressPercentage = () => {
    if (!isCountdownActive) return 0;
    return (countdownSeconds / countdownDuration) * 100;
  };

  const formatTime = (seconds) => {
    return seconds.toString().padStart(2, '0');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <PanelContainer className={className} isActive={isCountdownActive}>
      <PanelHeader isActive={isCountdownActive}>
        <HeaderTitle>
          🎯 Human Intervention
        </HeaderTitle>
        
        <InterventionStatus mode={mode}>
          {getStatusText()}
        </InterventionStatus>
      </PanelHeader>

      <PanelContent>
        {isCountdownActive && interventionRequest ? (
          <>
            <CountdownSection isActive={true}>
              <CountdownTimer seconds={countdownSeconds}>
                {formatTime(countdownSeconds)}
              </CountdownTimer>
              
              <CountdownMessage>
                <strong>AI requesting human intervention</strong><br />
                Call will be automatically transferred to human operator
              </CountdownMessage>
              
              <ProgressBar>
                <ProgressFill percentage={getProgressPercentage()} />
              </ProgressBar>
              
              <ActionButtons>
                <VetoButton onClick={handleVeto}>
                  🚫 VETO
                </VetoButton>
                <TakeoverButton onClick={handleTakeover}>
                  🎯 TAKEOVER NOW
                </TakeoverButton>
              </ActionButtons>
            </CountdownSection>

            <TriggerInfo>
              <TriggerTitle>🔍 Intervention Trigger</TriggerTitle>
              <TriggerReason>
                {interventionRequest.reason || 'AI confidence below threshold for complex situation'}
              </TriggerReason>
              
              <TriggerDetails>
                <DetailItem>
                  <DetailLabel>Confidence</DetailLabel>
                  <DetailValue>
                    {interventionRequest.aiConfidence ? 
                      `${Math.round(interventionRequest.aiConfidence * 100)}%` : 
                      'Low'
                    }
                  </DetailValue>
                </DetailItem>
                
                <DetailItem>
                  <DetailLabel>Situation</DetailLabel>
                  <DetailValue>
                    {interventionRequest.situationType || 'Complex Inquiry'}
                  </DetailValue>
                </DetailItem>
                
                <DetailItem>
                  <DetailLabel>Call Duration</DetailLabel>
                  <DetailValue>
                    {interventionRequest.callDuration || '00:00'}
                  </DetailValue>
                </DetailItem>
                
                <DetailItem>
                  <DetailLabel>Priority</DetailLabel>
                  <DetailValue>
                    {interventionRequest.priority || 'Standard'}
                  </DetailValue>
                </DetailItem>
              </TriggerDetails>
            </TriggerInfo>
          </>
        ) : mode === 'active' ? (
          <>
            <CountdownSection isActive={false}>
              <div style={{ 
                fontSize: '2rem', 
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                👤
              </div>
              
              <CountdownMessage>
                <strong>Human operator in control</strong><br />
                Call has been successfully transferred to human oversight
              </CountdownMessage>
              
              <ActionButtons>
                <StandbyButton onClick={handleStandby}>
                  🤖 Return to AI Mode
                </StandbyButton>
              </ActionButtons>
            </CountdownSection>
          </>
        ) : (
          <StandbyMessage>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <div><strong>AI Autonomous Mode Active</strong></div>
            <div>
              Voice AI is handling all calls autonomously. Human intervention 
              will be requested automatically when complex situations arise.
            </div>
            <div style={{ 
              marginTop: '16px', 
              fontSize: '12px', 
              color: '#666' 
            }}>
              Intervention threshold: {countdownDuration} second countdown
            </div>
          </StandbyMessage>
        )}
      </PanelContent>
    </PanelContainer>
  );
}

export default CallInterventionPanel;
