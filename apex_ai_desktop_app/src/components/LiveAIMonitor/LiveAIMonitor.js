/**
 * LIVE AI MONITOR - MAIN COMPONENT WITH SPRINT 4 INTEGRATION
 * =========================================================
 * Enhanced core component for real-time AI-powered security monitoring
 * Features: Camera grid, AI detection overlays, event feed, quick actions
 * 
 * SPRINT 4 ENHANCEMENTS:
 * - Visual Alert System with blinking borders and threat overlays
 * - Spatial Audio Alert Controller with 3D positioning
 * - AI Conversation Management with 2-way voice communication
 * - Master Threat Detection Coordination
 * - Enhanced WebSocket integration with AI engine
 */

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import CameraGrid from './CameraGrid';
import AIEventFeed from './AIEventFeed';
import QuickActionPanel from './QuickActionPanel';

// SPRINT 4: Import Alert System Components
import AlertManager from '../VisualAlerts/AlertManager';
import AudioAlertController from '../AudioControls/AudioAlertController';
import VoiceResponsePanel from '../AudioControls/VoiceResponsePanel';

const MonitorContainer = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 320px 320px;
  grid-template-rows: 1fr auto;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background};
  
  /* Sprint 4: Responsive layout for alert systems */
  @media (max-width: 1400px) {
    grid-template-columns: 1fr 320px;
    grid-template-rows: 1fr auto auto;
  }
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto auto auto;
  }
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

// SPRINT 4: Alert System Panels
const AlertSystemPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  grid-row: 1 / -1;
  min-height: 0;
  
  @media (max-width: 1400px) {
    grid-row: auto;
    grid-column: 1 / -1;
  }
`;

const VoiceControlContainer = styled.div`
  background-color: ${props => props.theme.colors.backgroundCard};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  max-height: 500px;
  
  ${props => !props.expanded && `
    height: 200px;
  `}
`;

const AudioControlContainer = styled.div`
  background-color: ${props => props.theme.colors.backgroundCard};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  max-height: 400px;
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
  
  // SPRINT 4: Enhanced state management
  const [visualAlerts, setVisualAlerts] = useState([]);
  const [audioAlerts, setAudioAlerts] = useState([]);
  const [activeConversations, setActiveConversations] = useState([]);
  const [threatAlerts, setThreatAlerts] = useState([]);
  const [sprint4Status, setSprint4Status] = useState({
    visualAlerts: false,
    spatialAudio: false,
    aiConversation: false,
    masterCoordinator: false
  });
  const [audioControlsExpanded, setAudioControlsExpanded] = useState(false);
  const [voiceControlExpanded, setVoiceControlExpanded] = useState(false);
  const [alertStats, setAlertStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  
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
      
      // SPRINT 4: Visual Alert Events
      case 'visual_alert':
        handleVisualAlert(message.data);
        break;
        
      case 'visual_overlay_data':
        handleVisualOverlayData(message.data);
        break;
        
      case 'visual_stats':
        handleVisualStats(message.data);
        break;
      
      // SPRINT 4: Audio Alert Events
      case 'audio_alert':
        handleAudioAlert(message.data);
        break;
        
      case 'audio_stats':
        handleAudioStats(message.data);
        break;
      
      // SPRINT 4: AI Conversation Events
      case 'ai_conversation_started':
        handleConversationStarted(message.data);
        break;
        
      case 'conversation_started':
        handleConversationEvent('started', message.data);
        break;
        
      case 'conversation_stopped':
        handleConversationEvent('stopped', message.data);
        break;
        
      case 'active_conversations':
        setActiveConversations(message.data || []);
        break;
        
      case 'conversation_history':
        // Handle conversation history if needed
        break;
      
      // SPRINT 4: Master Threat Alert
      case 'threat_alert':
        handleThreatAlert(message.data);
        break;
        
      // SPRINT 4: AI Engine Status
      case 'ai_engine_status':
        handleAIEngineStatus(message.data);
        break;
        
      case 'ai_status_update':
        handleAIStatusUpdate(message.data);
        break;
      
      default:
        console.log('📝 Unhandled AI message:', message);
    }
  };

  // SPRINT 4: Enhanced event handlers
  const handleVisualAlert = (alertData) => {
    console.log('🎨 Visual alert received:', alertData);
    
    const visualAlert = {
      alertId: alertData.alert_id,
      zoneId: alertData.zone_id,
      region: alertData.overlay_data?.alerts?.[0]?.region || { x: 0, y: 0, width: 100, height: 100 },
      threatLevel: alertData.threat_data?.threat_level || 'MEDIUM',
      threatType: alertData.threat_data?.type || 'unknown',
      description: alertData.threat_data?.description || 'Threat detected',
      confidence: alertData.threat_data?.confidence || 0.5,
      timestamp: new Date().toISOString(),
      isVisible: true,
      opacity: 0.8
    };
    
    setVisualAlerts(prev => {
      // Remove existing alert for same zone
      const filtered = prev.filter(alert => alert.zoneId !== visualAlert.zoneId);
      return [...filtered, visualAlert];
    });
    
    // Also add to main alerts for event feed
    setAlerts(prev => [{
      id: visualAlert.alertId,
      type: 'visual_alert',
      message: `Visual alert: ${visualAlert.description}`,
      timestamp: visualAlert.timestamp,
      severity: visualAlert.threatLevel.toLowerCase(),
      camera_id: alertData.threat_data?.camera_id
    }, ...prev.slice(0, 49)]);
  };
  
  const handleVisualOverlayData = (overlayData) => {
    console.log('📋 Visual overlay data received:', overlayData);
    // Process overlay data for specific monitors if needed
  };
  
  const handleVisualStats = (stats) => {
    console.log('📊 Visual stats received:', stats);
    // Update visual alert statistics
  };
  
  const handleAudioAlert = (alertData) => {
    console.log('🔊 Audio alert received:', alertData);
    
    const audioAlert = {
      alertId: alertData.alert_id,
      zoneId: alertData.zone_id,
      threatType: alertData.threat_type,
      threatLevel: alertData.threat_level,
      timestamp: new Date().toISOString(),
      audioStats: alertData.audio_stats
    };
    
    setAudioAlerts(prev => [audioAlert, ...prev.slice(0, 19)]); // Keep last 20
    
    // Add to main alerts for event feed
    setAlerts(prev => [{
      id: audioAlert.alertId,
      type: 'audio_alert',
      message: `Audio alert: ${audioAlert.threatType} (${audioAlert.threatLevel})`,
      timestamp: audioAlert.timestamp,
      severity: audioAlert.threatLevel.toLowerCase()
    }, ...prev.slice(0, 49)]);
  };
  
  const handleAudioStats = (stats) => {
    console.log('📊 Audio stats received:', stats);
    // Update audio alert statistics
  };
  
  const handleConversationStarted = (conversationData) => {
    console.log('🎙️ AI conversation started:', conversationData);
    
    const conversation = {
      id: conversationData.conversation_id,
      zoneId: conversationData.zone_id,
      threatType: conversationData.threat_type,
      threatLevel: conversationData.threat_level,
      timestamp: new Date().toISOString(),
      status: 'active'
    };
    
    setActiveConversations(prev => [conversation, ...prev]);
    
    // Add to main alerts for event feed
    setAlerts(prev => [{
      id: conversation.id,
      type: 'ai_conversation',
      message: `AI conversation started: ${conversation.threatType} (${conversation.threatLevel})`,
      timestamp: conversation.timestamp,
      severity: conversation.threatLevel.toLowerCase()
    }, ...prev.slice(0, 49)]);
    
    // Expand voice control panel when conversation starts
    setVoiceControlExpanded(true);
  };
  
  const handleConversationEvent = (eventType, data) => {
    console.log(`🎙️ Conversation ${eventType}:`, data);
    
    if (eventType === 'stopped') {
      setActiveConversations(prev => 
        prev.filter(conv => conv.id !== data.conversation_id)
      );
      
      // Collapse voice control if no active conversations
      setActiveConversations(current => {
        if (current.length <= 1) {
          setVoiceControlExpanded(false);
        }
        return current.filter(conv => conv.id !== data.conversation_id);
      });
    }
  };
  
  const handleThreatAlert = (alertData) => {
    console.log('🚨 Master threat alert received:', alertData);
    
    const threatAlert = {
      id: `threat_${Date.now()}`,
      alertType: alertData.alert_type,
      threatLevel: alertData.threat_level,
      zoneId: alertData.zone_id,
      cameraId: alertData.camera_id,
      description: alertData.description,
      confidence: alertData.confidence,
      timestamp: alertData.timestamp,
      enginesTriggered: alertData.engines_triggered
    };
    
    setThreatAlerts(prev => [threatAlert, ...prev.slice(0, 29)]); // Keep last 30
    
    // Add to main alerts for event feed with high priority
    setAlerts(prev => [{
      id: threatAlert.id,
      type: 'threat_alert',
      message: `${threatAlert.alertType}: ${threatAlert.description}`,
      timestamp: threatAlert.timestamp,
      severity: threatAlert.threatLevel.toLowerCase(),
      camera_id: threatAlert.cameraId
    }, ...prev.slice(0, 49)]);
    
    // Update alert statistics
    setAlertStats(prev => ({
      ...prev,
      total: prev.total + 1,
      [threatAlert.threatLevel.toLowerCase()]: prev[threatAlert.threatLevel.toLowerCase()] + 1
    }));
    
    // Focus camera if not already focused
    if (viewMode !== 'focus' && threatAlert.cameraId) {
      const camera = activeCameras.find(cam => cam.id === threatAlert.cameraId);
      if (camera) {
        handleCameraFocus(camera);
      }
    }
  };
  
  const handleAIEngineStatus = (statusData) => {
    console.log('🤖 AI Engine status:', statusData);
    
    setSprint4Status({
      visualAlerts: statusData.connected && statusData.sprint4_engines?.visual_alerts,
      spatialAudio: statusData.connected && statusData.sprint4_engines?.spatial_audio,
      aiConversation: statusData.connected && statusData.sprint4_engines?.ai_conversation,
      masterCoordinator: statusData.connected && statusData.sprint4_engines?.master_coordinator
    });
    
    setAIStatus(statusData.connected ? 'connected' : 'disconnected');
  };
  
  const handleAIStatusUpdate = (statusData) => {
    console.log('📊 AI Status update:', statusData);
    
    if (statusData.sprint4_engines) {
      setSprint4Status(prev => ({
        ...prev,
        ...statusData.sprint4_engines
      }));
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
