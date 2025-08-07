/**
 * VIDEO INPUT MANAGER COMPONENT
 * =============================
 * Main interface for configuring and managing video sources with face detection
 * Supports both DVR screen capture and RTSP stream configuration
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ManagerContainer = styled.div`
  padding: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.medium};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.md};
  border-bottom: 2px solid ${props => props.theme.colors.border};
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fontSizes.xl};
  font-weight: 600;
  margin: 0;
`;

const StatusBadge = styled.div`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.fontSizes.sm};
  font-weight: 500;
  background-color: ${props => props.active ? props.theme.colors.success : props.theme.colors.warning};
  color: ${props => props.theme.colors.background};
`;

const ControlsSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ControlPanel = styled.div`
  background-color: ${props => props.theme.colors.surfaceLight};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const PanelTitle = styled.h3`
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fontSizes.lg};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ConfigCard = styled.div`
  background-color: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.active ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: ${props => props.theme.shadows.medium};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const CardTitle = styled.h4`
  color: ${props => props.theme.colors.text};
  margin: 0;
  font-size: ${props => props.theme.fontSizes.md};
`;

const FaceDetectionToggle = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.enabled ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)'};
  border-radius: ${props => props.theme.borderRadius.sm};
`;

const Button = styled.button`
  background-color: ${props => props.variant === 'primary' ? props.theme.colors.primary : props.theme.colors.secondary};
  color: ${props => props.theme.colors.background};
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.fontSizes.md};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
`;

const StatCard = styled.div`
  background-color: ${props => props.theme.colors.surfaceLight};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  text-align: center;
`;

const StatValue = styled.div`
  font-size: ${props => props.theme.fontSizes.xl};
  font-weight: 600;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.textSecondary};
`;

const VideoInputManager = ({ onConfigChange, initialConfig = {} }) => {
  const [videoSources, setVideoSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(true);
  const [systemStats, setSystemStats] = useState({
    totalSources: 0,
    activeSources: 0,
    faceDetectionActive: 0,
    totalDetections: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Initialize video input manager on component mount
  useEffect(() => {
    loadVideoSources();
    startStatsPolling();
  }, []);

  const loadVideoSources = async () => {
    try {
      setIsLoading(true);
      
      // API call to get video sources
      const response = await fetch('/api/video-input/sources');
      if (response.ok) {
        const sources = await response.json();
        setVideoSources(sources);
      }
    } catch (error) {
      console.error('Failed to load video sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startStatsPolling = () => {
    const pollStats = async () => {
      try {
        const response = await fetch('/api/video-input/stats');
        if (response.ok) {
          const stats = await response.json();
          setSystemStats(stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollStats, 2000);
    pollStats(); // Initial call

    return () => clearInterval(interval);
  };

  const handleAddSource = (sourceType) => {
    // Navigate to appropriate configuration wizard
    if (sourceType === 'dvr') {
      // Open DVR setup wizard
      setSelectedSource({ type: 'dvr', isNew: true });
    } else if (sourceType === 'rtsp') {
      // Open RTSP configuration panel
      setSelectedSource({ type: 'rtsp', isNew: true });
    }
  };

  const handleToggleFaceDetection = async (sourceId, enabled) => {
    try {
      const response = await fetch(`/api/video-input/sources/${sourceId}/face-detection`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        // Update local state
        setVideoSources(sources => 
          sources.map(source => 
            source.id === sourceId 
              ? { ...source, faceDetectionEnabled: enabled }
              : source
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle face detection:', error);
    }
  };

  const handleSourceActivation = async (sourceId, activate) => {
    try {
      const endpoint = activate ? 'start' : 'stop';
      const response = await fetch(`/api/video-input/sources/${sourceId}/${endpoint}`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadVideoSources(); // Refresh sources
      }
    } catch (error) {
      console.error(`Failed to ${activate ? 'start' : 'stop'} source:`, error);
    }
  };

  return (
    <ManagerContainer>
      <Header>
        <Title>🎥 Video Input Manager</Title>
        <StatusBadge active={systemStats.activeSources > 0}>
          {systemStats.activeSources > 0 ? 'ACTIVE' : 'INACTIVE'}
        </StatusBadge>
      </Header>

      <ControlsSection>
        <ControlPanel>
          <PanelTitle>
            📺 DVR Screen Capture
          </PanelTitle>
          <p>Capture video from DVR monitors and screens with automatic region detection.</p>
          <Button 
            variant="primary" 
            onClick={() => handleAddSource('dvr')}
            disabled={isLoading}
          >
            Add DVR Source
          </Button>
        </ControlPanel>

        <ControlPanel>
          <PanelTitle>
            📡 RTSP Streams
          </PanelTitle>
          <p>Connect directly to IP cameras and network video recorders via RTSP.</p>
          <Button 
            variant="primary" 
            onClick={() => handleAddSource('rtsp')}
            disabled={isLoading}
          >
            Add RTSP Stream
          </Button>
        </ControlPanel>
      </ControlsSection>

      <ConfigGrid>
        {videoSources.map(source => (
          <ConfigCard 
            key={source.id} 
            active={source.isActive}
            onClick={() => setSelectedSource(source)}
          >
            <CardHeader>
              <CardTitle>{source.name}</CardTitle>
              <StatusBadge active={source.isActive}>
                {source.isActive ? 'ON' : 'OFF'}
              </StatusBadge>
            </CardHeader>
            
            <div>
              <strong>Type:</strong> {source.type === 'dvr' ? 'DVR Screen' : 'RTSP Stream'}
            </div>
            <div>
              <strong>Location:</strong> {source.location}
            </div>
            <div>
              <strong>FPS:</strong> {source.currentFps || 0} / {source.targetFps}
            </div>

            <FaceDetectionToggle enabled={source.faceDetectionEnabled}>
              <span>🧠 Face Detection:</span>
              <label>
                <input
                  type="checkbox"
                  checked={source.faceDetectionEnabled}
                  onChange={(e) => handleToggleFaceDetection(source.id, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                />
                {source.faceDetectionEnabled ? 'Enabled' : 'Disabled'}
              </label>
            </FaceDetectionToggle>

            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <Button
                variant={source.isActive ? 'secondary' : 'primary'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSourceActivation(source.id, !source.isActive);
                }}
              >
                {source.isActive ? 'Stop' : 'Start'}
              </Button>
            </div>
          </ConfigCard>
        ))}
      </ConfigGrid>

      <StatsContainer>
        <StatCard>
          <StatValue>{systemStats.totalSources}</StatValue>
          <StatLabel>Total Sources</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{systemStats.activeSources}</StatValue>
          <StatLabel>Active Sources</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{systemStats.faceDetectionActive}</StatValue>
          <StatLabel>Face Detection Active</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{systemStats.totalDetections}</StatValue>
          <StatLabel>Total Detections</StatLabel>
        </StatCard>
      </StatsContainer>
    </ManagerContainer>
  );
};

export default VideoInputManager;
