// APEX AI LIVE MONITORING - STATUS BAR COMPONENT
// Top and secondary status bars showing system status and statistics

import React, { memo } from 'react';
import styled from 'styled-components';
import { 
  Monitor,
  Camera, 
  AlertTriangle, 
  Eye 
} from 'lucide-react';
import { StatusBarProps } from '../types';
import { StatusIndicator, Section } from '../shared/StyledComponents';

// Styled Components for Status Bars
const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  background: rgba(20, 20, 20, 0.95);
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(10px);
  height: 60px;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #FFD700;
    margin: 0;
  }
  
  .property-count {
    font-size: 0.9rem;
    color: #B0B0B0;
    background: rgba(255, 215, 0, 0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 215, 0, 0.3);
  }
`;

const StatusSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  font-size: 0.9rem;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #E0E0E0;
`;

const SecondaryBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  background: rgba(15, 15, 15, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
  height: 50px;
`;

const InfoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  color: #B0B0B0;
`;

const SwitchIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #B0B0B0;
  font-size: 0.8rem;
  
  .timer {
    color: #FFD700;
    font-weight: 600;
  }
`;

// Status Bar Component
const StatusBar: React.FC<StatusBarProps> = memo(({
  streamingStatus,
  stats,
  properties,
  currentLayout,
  currentQuality,
  currentPage,
  totalPages,
  autoSwitchTimer
}) => {
  return (
    <>
      {/* Top Navigation Bar */}
      <TopBar>
        <LogoSection>
          <Monitor size={24} color="#FFD700" />
          <h1>Apex Live Monitoring</h1>
          <div className="property-count">
            {properties.length} Properties • {stats.total} Cameras
          </div>
        </LogoSection>
        
        <StatusSection>
          <StatusItem>
            <StatusIndicator $status={streamingStatus === 'connected' ? 'online' : 'offline'} />
            Streaming: {streamingStatus}
          </StatusItem>
          
          <StatusItem>
            <Camera size={16} />
            {stats.online}/{stats.total} Online
          </StatusItem>
          
          <StatusItem>
            <AlertTriangle size={16} />
            {stats.alerts} Active Alerts
          </StatusItem>
          
          <StatusItem>
            <Eye size={16} />
            {stats.faceDetections} Face Detections
          </StatusItem>
        </StatusSection>
      </TopBar>

      {/* Secondary Status Bar */}
      <SecondaryBar>
        <InfoSection>
          <span>Layout: {currentLayout.toUpperCase()}</span>
          <span>Quality: {currentQuality.toUpperCase()}</span>
          <span>Page: {currentPage + 1}/{totalPages}</span>
        </InfoSection>
        
        <InfoSection>
          {autoSwitchTimer !== undefined && autoSwitchTimer > 0 && (
            <SwitchIndicator>
              Next switch in: <span className="timer">{autoSwitchTimer}s</span>
            </SwitchIndicator>
          )}
        </InfoSection>
      </SecondaryBar>
    </>
  );
});

StatusBar.displayName = 'StatusBar';

export { StatusBar };
