/**
 * LIVE AI MONITOR - MAIN COMPONENT
 * ================================
 * Core component for real-time AI-powered security monitoring
 * Features: Camera grid, AI detection overlays, event feed, quick actions
 */

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import CameraGrid from './CameraGrid';
import AIEventFeed from './AIEventFeed';
import QuickActionPanel from './QuickActionPanel';

const MonitorContainer = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 320px;
  grid-template-rows: 1fr auto;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background};
`;

const MainViewArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  min-height: 0; /* Allow grid item to shrink */
`;

const CameraGridContainer = styled.div`
  flex: 1;
  background-color: ${props => props.theme.colors.backgroundCard};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  position: relative;
`;

const ViewControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.backgroundLight};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const ViewModeSelector = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`;

const ViewModeButton = styled.button`
  background: ${props => props.active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.active ? props.theme.colors.background : props.theme.colors.text};
  border: 1px solid ${props => props.active ? props.theme.colors.primary : props.theme.colors.border};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? props.theme.colors.primaryDark : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.textSecondary};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.status) {
      case 'connected': return props.theme.colors.success;
      case 'connecting': return props.theme.colors.warning;
      case 'error': return props.theme.colors.error;
      default: return props.theme.colors.textMuted;
    }
  }};
  animation: ${props => props.status === 'connecting' ? 'pulse 1.5s ease-in-out infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  grid-row: 1 / -1; /* Span full height */
  min-height: 0;
`;

const AIEventContainer = styled.div`
  flex: 1;
  background-color: ${props => props.theme.colors.backgroundCard};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const QuickActionContainer = styled.div`
  background-color: ${props => props.theme.colors.backgroundCard};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  padding: ${props => props.theme.spacing.md};
`;

function LiveAIMonitor() {
  const [viewMode, setViewMode] = useState('grid'); // grid, focus, investigation
  const [activeCameras, setActiveCameras] = useState([]);
  const [aiStatus, setAIStatus] = useState('connecting');
  const [detections, setDetections] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [focusedCamera, setFocusedCamera] = useState(null);
  
  // Demo cameras configuration
  const demoCameras = [
    {
      id: 'cam_entrance_1',
      name: 'Main Entrance',
      rtspUrl: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
      location: 'Building A - Ground Floor',
      status: 'active'
    },
    {
      id: 'cam_parking_1',
      name: 'Parking Garage',
      rtspUrl: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
      location: 'Underground Parking',
      status: 'active'
    },
    {
      id: 'cam_elevator_1',
      name: 'Elevator Bank',
      rtspUrl: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
      location: 'Building A - Lobby',
      status: 'active'
    },
    {
      id: 'cam_rooftop_1',
      name: 'Rooftop Access',
      rtspUrl: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
      location: 'Building A - Roof',
      status: 'active'
    },
    {
      id: 'cam_hallway_1',
      name: 'East Hallway',
      rtspUrl: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
      location: 'Building A - Floor 2',
      status: 'active'
    },
    {
      id: 'cam_stairwell_1',
      name: 'Emergency Stairwell',
      rtspUrl: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
      location: 'Building A - Stairwell B',
      status: 'active'
    }
  ];

  // Initialize component
  useEffect(() => {
    initializeMonitor();
    
    // Set up AI engine event listeners
    if (window.electronAPI) {
      window.electronAPI.onAIEngineMessage(handleAIMessage);
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAIEngineListener();
      }
    };
  }, []);

  const initializeMonitor = async () => {
    console.log('🎥 Initializing Live AI Monitor...');
    
    try {
      // Start demo cameras
      setActiveCameras(demoCameras);
      
      // Start camera streams via Electron API
      for (const camera of demoCameras) {
        if (window.electronAPI) {
          await window.electronAPI.startCameraStream(camera);
        }
      }
      
      setAIStatus('connected');
      console.log('✅ Live AI Monitor initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize monitor:', error);
      setAIStatus('error');
    }
  };

  const handleAIMessage = (message) => {
    switch (message.type) {
      case 'detection':
        handleDetection(message.data);
        break;
      
      case 'alert':
        handleAlert(message.data);
        break;
      
      case 'camera_status':
        handleCameraStatus(message.data);
        break;
      
      default:
        console.log('📝 Unhandled AI message:', message);
    }
  };

  const handleDetection = (detection) => {
    setDetections(prev => [detection, ...prev.slice(0, 99)]); // Keep last 100 detections
  };

  const handleAlert = (alert) => {
    setAlerts(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
  };

  const handleCameraStatus = (status) => {
    setActiveCameras(prev => 
      prev.map(camera => 
        camera.id === status.camera_id 
          ? { ...camera, status: status.status }
          : camera
      )
    );
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    
    if (mode === 'focus' && !focusedCamera && activeCameras.length > 0) {
      setFocusedCamera(activeCameras[0]);
    }
  };

  const handleCameraFocus = (camera) => {
    setFocusedCamera(camera);
    setViewMode('focus');
  };

  const getStatusText = () => {
    switch (aiStatus) {
      case 'connected': return `AI Active • ${activeCameras.length} Cameras`;
      case 'connecting': return 'Connecting to AI Engine...';
      case 'error': return 'AI Engine Error';
      default: return 'AI Engine Offline';
    }
  };

  return (
    <MonitorContainer>
      <MainViewArea>
        <ViewControls>
          <ViewModeSelector>
            <ViewModeButton 
              active={viewMode === 'grid'} 
              onClick={() => handleViewModeChange('grid')}
            >
              🔳 Grid View
            </ViewModeButton>
            <ViewModeButton 
              active={viewMode === 'focus'} 
              onClick={() => handleViewModeChange('focus')}
            >
              🎯 Focus View
            </ViewModeButton>
            <ViewModeButton 
              active={viewMode === 'investigation'} 
              onClick={() => handleViewModeChange('investigation')}
            >
              🔍 Investigation
            </ViewModeButton>
          </ViewModeSelector>
          
          <StatusIndicator>
            <StatusDot status={aiStatus} />
            {getStatusText()}
          </StatusIndicator>
        </ViewControls>

        <CameraGridContainer>
          <CameraGrid
            cameras={activeCameras}
            viewMode={viewMode}
            focusedCamera={focusedCamera}
            detections={detections}
            onCameraFocus={handleCameraFocus}
          />
        </CameraGridContainer>
      </MainViewArea>

      <SidePanel>
        <AIEventContainer>
          <AIEventFeed
            alerts={alerts}
            detections={detections}
            onEventClick={(event) => {
              // Handle event click - focus camera, show details, etc.
              if (event.camera_id) {
                const camera = activeCameras.find(cam => cam.id === event.camera_id);
                if (camera) {
                  handleCameraFocus(camera);
                }
              }
            }}
          />
        </AIEventContainer>
        
        <QuickActionContainer>
          <QuickActionPanel
            activeCameras={activeCameras}
            focusedCamera={focusedCamera}
          />
        </QuickActionContainer>
      </SidePanel>
    </MonitorContainer>
  );
}

export default LiveAIMonitor;
