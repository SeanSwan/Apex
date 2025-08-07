/**
 * LIVE AI MONITOR - MAIN COMPONENT WITH SPRINT 4 + FACE DETECTION INTEGRATION
 * ==========================================================================
 * Enhanced core component for real-time AI-powered security monitoring
 * Features: Camera grid, AI detection overlays, event feed, quick actions
 * 
 * SPRINT 4 ENHANCEMENTS:
 * - Visual Alert System with blinking borders and threat overlays
 * - Spatial Audio Alert Controller with 3D positioning
 * - AI Conversation Management with 2-way voice communication
 * - Master Threat Detection Coordination
 * - Enhanced WebSocket integration with AI engine
 *
 * PHASE 1 FACE DETECTION ENHANCEMENTS:
 * - Real-time face detection and recognition
 * - Person identification and classification
 * - Face-based alert generation and management
 * - Integration with video input manager
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

// PHASE 1: Import Face Detection Components
import VideoInputManager from '../VideoInput/VideoInputManager';
import PersonTypeIndicator from '../FaceDetection/PersonTypeIndicator';

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
  
  // PHASE 1: Face Detection state management
  const [faceDetections, setFaceDetections] = useState([]);
  const [faceAlerts, setFaceAlerts] = useState([]);
  const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(true);
  const [recognizedPersons, setRecognizedPersons] = useState([]);
  const [unknownPersons, setUnknownPersons] = useState([]);
  const [faceDetectionStats, setFaceDetectionStats] = useState({
    totalDetections: 0,
    knownPersons: 0,
    unknownPersons: 0,
    blacklistedDetections: 0,
    vipDetections: 0,
    alertsGenerated: 0
  });
  const [selectedFaceDetection, setSelectedFaceDetection] = useState(null);
  
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
  
  // PHASE 1: Face Detection Event Handlers
  const handleFaceDetection = (faceData) => {
    console.log('🧠 Face detection received:', faceData);
    
    const faceDetection = {
      id: `face_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      camera_id: faceData.camera_id,
      person_name: faceData.person_name,
      person_type: faceData.person_type,
      confidence: faceData.confidence,
      is_match: faceData.is_match,
      face_location: faceData.face_location,
      bounding_box: faceData.bounding_box,
      face_quality_score: faceData.face_quality_score,
      access_level: faceData.access_level,
      alert_recommended: faceData.alert_recommended,
      timestamp: faceData.timestamp || new Date().toISOString(),
      detection_id: faceData.detection_id
    };
    
    setFaceDetections(prev => [faceDetection, ...prev.slice(0, 49)]); // Keep last 50
    
    // Update statistics
    setFaceDetectionStats(prev => ({
      ...prev,
      totalDetections: prev.totalDetections + 1,
      knownPersons: faceData.is_match ? prev.knownPersons + 1 : prev.knownPersons,
      unknownPersons: !faceData.is_match ? prev.unknownPersons + 1 : prev.unknownPersons,
      alertsGenerated: faceData.alert_recommended ? prev.alertsGenerated + 1 : prev.alertsGenerated
    }));
    
    // Add to event feed if alert recommended
    if (faceData.alert_recommended) {
      setAlerts(prev => [{
        id: faceDetection.id,
        type: 'face_alert',
        message: `${faceData.is_match ? 'Known' : 'Unknown'} person detected: ${faceData.person_name}`,
        timestamp: faceDetection.timestamp,
        severity: faceData.person_type === 'blacklist' ? 'critical' : 'medium',
        camera_id: faceData.camera_id,
        face_data: faceDetection
      }, ...prev.slice(0, 49)]);
    }
  };
  
  const handleFaceAlert = (alertData) => {
    console.log('🚨 Face alert received:', alertData);
    
    const faceAlert = {
      id: `face_alert_${Date.now()}`,
      alert_type: alertData.alert_type,
      person_data: alertData.person_data,
      camera_id: alertData.camera_id,
      timestamp: alertData.timestamp,
      priority: alertData.priority,
      recommended_actions: alertData.recommended_actions,
      alert_message: alertData.alert_message
    };
    
    setFaceAlerts(prev => [faceAlert, ...prev.slice(0, 29)]); // Keep last 30
    
    // Add to main alerts
    setAlerts(prev => [{
      id: faceAlert.id,
      type: 'face_alert',
      message: faceAlert.alert_message,
      timestamp: faceAlert.timestamp,
      severity: faceAlert.priority,
      camera_id: faceAlert.camera_id
    }, ...prev.slice(0, 49)]);
  };
  
  const handlePersonRecognized = (personData) => {
    console.log('👤 Person recognized:', personData);
    
    setRecognizedPersons(prev => {
      const existingIndex = prev.findIndex(p => p.face_id === personData.face_id);
      if (existingIndex >= 0) {
        // Update existing person
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          last_seen: personData.timestamp,
          detection_count: updated[existingIndex].detection_count + 1
        };
        return updated;
      } else {
        // Add new person
        return [{
          face_id: personData.face_id,
          person_name: personData.person_name,
          person_type: personData.person_type,
          confidence: personData.confidence,
          camera_id: personData.camera_id,
          first_seen: personData.timestamp,
          last_seen: personData.timestamp,
          detection_count: 1
        }, ...prev.slice(0, 19)];
      }
    });
  };
  
  const handleUnknownPersonDetected = (personData) => {
    console.log('❓ Unknown person detected:', personData);
    
    setUnknownPersons(prev => [{
      id: `unknown_${Date.now()}`,
      camera_id: personData.camera_id,
      face_location: personData.face_location,
      face_quality_score: personData.face_quality_score,
      timestamp: personData.timestamp,
      alert_recommended: personData.alert_recommended
    }, ...prev.slice(0, 19)]);
  };
  
  const handleFaceDetectionStats = (statsData) => {
    console.log('📊 Face detection stats:', statsData);
    setFaceDetectionStats(statsData);
  };
  
  const handleBlacklistAlert = (alertData) => {
    console.log('🚫 Blacklist alert:', alertData);
    
    setFaceDetectionStats(prev => ({
      ...prev,
      blacklistedDetections: prev.blacklistedDetections + 1
    }));
    
    // High priority alert
    setAlerts(prev => [{
      id: `blacklist_${Date.now()}`,
      type: 'blacklist_alert',
      message: `CRITICAL: Blacklisted individual detected - ${alertData.person_name}`,
      timestamp: alertData.timestamp,
      severity: 'critical',
      camera_id: alertData.camera_id
    }, ...prev.slice(0, 49)]);
  };
  
  const handleVIPDetection = (vipData) => {
    console.log('⭐ VIP detection:', vipData);
    
    setFaceDetectionStats(prev => ({
      ...prev,
      vipDetections: prev.vipDetections + 1
    }));
    
    setAlerts(prev => [{
      id: `vip_${Date.now()}`,
      type: 'vip_detection',
      message: `VIP detected: ${vipData.person_name}`,
      timestamp: vipData.timestamp,
      severity: 'low',
      camera_id: vipData.camera_id
    }, ...prev.slice(0, 49)]);
  };
  
  const handleFaceDetectionClick = (faceDetection, cameraId) => {
    console.log('🎯 Face detection clicked:', faceDetection, cameraId);
    setSelectedFaceDetection(faceDetection);
    
    // Focus camera if not already focused
    const camera = activeCameras.find(cam => cam.id === cameraId);
    if (camera) {
      handleCameraFocus(camera);
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
      
      // PHASE 1: Face Detection Events
      case 'face_detection':
        handleFaceDetection(message.data);
        break;
        
      case 'face_alert':
        handleFaceAlert(message.data);
        break;
        
      case 'person_recognized':
        handlePersonRecognized(message.data);
        break;
        
      case 'unknown_person_detected':
        handleUnknownPersonDetected(message.data);
        break;
        
      case 'face_detection_stats':
        handleFaceDetectionStats(message.data);
        break;
        
      case 'blacklist_alert':
        handleBlacklistAlert(message.data);
        break;
        
      case 'vip_detection':
        handleVIPDetection(message.data);
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
            faceDetections={faceDetections} // Phase 1 Enhancement
            onCameraFocus={handleCameraFocus}
            onFaceDetection={handleFaceDetectionClick} // Phase 1 Enhancement
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
