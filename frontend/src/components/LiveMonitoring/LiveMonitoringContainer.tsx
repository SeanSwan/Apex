// APEX AI LIVE MONITORING - MAIN CONTAINER COMPONENT
// Main orchestrator component - replaces massive EnhancedLiveMonitoring.tsx
// Features: WebSocket management, state orchestration, modular architecture

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { useToast } from '../../hooks/use-toast';
import { useEnhancedWebSocket, DEFAULT_WEBSOCKET_CONFIG, MESSAGE_TYPES, webSocketManager } from '../../hooks/useEnhancedWebSocket';

// Import modular components
import { StatusBar } from './StatusBar';
import { ControlsBar } from './ControlsBar';
import { CameraGrid } from './CameraGrid';
import { AlertPanel } from './AlertPanel';

// Import types
import {
  CameraFeed,
  GridConfig,
  StreamingMessage,
  MonitoringStats,
  Property,
  SecurityAlert
} from './types';

// === WEBSOCKET INITIALIZATION - MODULE LEVEL (STRICTMODE IMMUNE) ===
// Initialize WebSocket connection when this component module loads
// This happens only when navigating to Live Monitoring (lazy-loaded)
// Completely independent of React lifecycle
console.log('🚀 [COMPONENT] LiveMonitoringContainer loaded - initializing WebSocket...');

// Initialize WebSocket connection immediately at module level
if (!webSocketManager.isConnected() && webSocketManager.getStats().status === 'disconnected') {
  webSocketManager.connect();
} else if (webSocketManager.isConnected()) {
  console.log('🚀 [COMPONENT] WebSocket already connected');
}

// Global style for full-screen monitoring
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background-color: #0a0a0a;
    color: #ffffff;
    overflow: hidden;
  }
`;

// Main container styled components
const DashboardContainer = styled.div`
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
`;

const MainContent = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
`;

const FooterBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 2rem;
  background: rgba(15, 15, 15, 0.9);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.8rem;
  color: #B0B0B0;
  height: 40px;
`;

// Main Live Monitoring Container Component
const LiveMonitoringContainer: React.FC = () => {
  const { toast } = useToast();
  
  // Enhanced WebSocket connection with stable config
  const websocketConfig = useMemo(() => ({
    serverUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
    heartbeatInterval: 30000
  }), []);
  
  const websocket = useEnhancedWebSocket(websocketConfig);
  
  // State management
  const [cameraFeeds, setCameraFeeds] = useState<CameraFeed[]>([]);
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    layout: '6x6',
    auto_switch: false,
    switch_interval: 30,
    display_mode: 'all',
    quality: 'thumbnail'
  });
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProperty, setFilterProperty] = useState('all');
  const [autoSwitchTimer, setAutoSwitchTimer] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Alert management state
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [alertPanelVisible, setAlertPanelVisible] = useState(false);
  
  // Refs
  const autoSwitchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cameraFeedsInitializedRef = useRef(false);

  // Utility functions
  const getGridSize = useCallback((layout: string): number => {
    switch(layout) {
      case '4x4': return 16;
      case '6x6': return 36;
      case '8x8': return 64;
      case '10x10': return 100;
      case '12x12': return 144;
      default: return 36;
    }
  }, []);

  // Generate demo alerts for testing
  const generateDemoAlerts = useCallback((cameras: CameraFeed[]) => {
    const alertTypes: SecurityAlert['alert_type'][] = [
      'unknown_person', 'suspicious_activity', 'weapon_detected', 
      'perimeter_breach', 'loitering_detected', 'ai_detection', 'face_detection'
    ];
    
    const severities: SecurityAlert['severity'][] = ['low', 'medium', 'high', 'critical'];
    const statuses: SecurityAlert['status'][] = ['active', 'acknowledged', 'dismissed'];
    
    const demoAlerts: SecurityAlert[] = [];
    const now = Date.now();
    
    // Generate 8-12 demo alerts
    const numAlerts = Math.floor(Math.random() * 5) + 8;
    
    for (let i = 0; i < numAlerts; i++) {
      const camera = cameras[Math.floor(Math.random() * Math.min(cameras.length, 6))];
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const status = i < 3 ? 'active' : statuses[Math.floor(Math.random() * statuses.length)];
      
      // Create timestamps from last 24 hours
      const hoursAgo = Math.random() * 24;
      const timestamp = new Date(now - (hoursAgo * 60 * 60 * 1000)).toISOString();
      
      const alert: SecurityAlert = {
        alert_id: `demo_alert_${i}_${Date.now()}`,
        timestamp,
        alert_type: alertType,
        severity,
        camera_id: camera.camera_id,
        camera_name: camera.name,
        location: camera.location,
        property_name: camera.property_name,
        description: generateAlertDescription(alertType, severity, camera.name),
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
        status,
        ...(status === 'acknowledged' && {
          acknowledged_by: 'Demo User',
          acknowledged_at: new Date(now - Math.random() * 3600000).toISOString()
        })
      };
      
      demoAlerts.push(alert);
    }
    
    // Sort by timestamp (newest first)
    demoAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setAlerts(demoAlerts);
  }, []);
  
  // Generate alert descriptions
  const generateAlertDescription = useCallback((type: SecurityAlert['alert_type'], severity: SecurityAlert['severity'], cameraName: string) => {
    const descriptions = {
      'unknown_person': [
        `Unidentified individual detected at ${cameraName}`,
        `Unknown person spotted in restricted area`,
        `Unauthorized personnel detected`
      ],
      'suspicious_activity': [
        `Suspicious behavior patterns observed`,
        `Unusual movement detected at ${cameraName}`,
        `Potential security concern identified`
      ],
      'weapon_detected': [
        `Potential weapon identified at ${cameraName}`,
        `Security threat: possible weapon detected`,
        `Weapon detection alert - immediate attention required`
      ],
      'perimeter_breach': [
        `Perimeter security breach detected`,
        `Unauthorized access to restricted area`,
        `Security boundary violation`
      ],
      'loitering_detected': [
        `Extended loitering detected at ${cameraName}`,
        `Individual remaining in area beyond normal time`,
        `Potential loitering security concern`
      ],
      'ai_detection': [
        `AI system detected anomaly at ${cameraName}`,
        `Automated detection alert`,
        `AI analysis flagged unusual activity`
      ],
      'face_detection': [
        `Face recognition alert at ${cameraName}`,
        `Known individual detected`,
        `Person of interest identified`
      ]
    };
    
    const typeDescriptions = descriptions[type] || descriptions['suspicious_activity'];
    const baseDescription = typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
    
    const severityPrefix = severity === 'critical' ? 'CRITICAL: ' : 
                          severity === 'high' ? 'HIGH PRIORITY: ' : '';
    
    return severityPrefix + baseDescription;
  }, []);

  // Initialize camera feeds function (SINGLE DECLARATION)
  const initializeCameraFeeds = useCallback(() => {
    const demoFeeds: CameraFeed[] = [
      {
        camera_id: 'cam_entrance_1',
        name: 'Main Entrance',
        location: 'Building A - Lobby',
        property_id: 'prop_001',
        property_name: 'Luxury Heights',
        rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
        status: 'loading',
        priority: 9,
        zone: 'Zone A',
        capabilities: {
          supports_ptz: true,
          supports_audio: true,
          supports_night_vision: true,
          supports_zoom: true
        }
      },
      {
        camera_id: 'cam_parking_1',
        name: 'Parking Garage',
        location: 'Underground Level 1',
        property_id: 'prop_001',
        property_name: 'Luxury Heights',
        rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
        status: 'loading',
        priority: 6,
        zone: 'Zone B',
        capabilities: {
          supports_ptz: false,
          supports_audio: false,
          supports_night_vision: true,
          supports_zoom: false
        }
      },
      {
        camera_id: 'cam_elevator_1',
        name: 'Elevator Bank',
        location: 'Building A - Floor 1',
        property_id: 'prop_001',
        property_name: 'Luxury Heights',
        rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
        status: 'loading',
        priority: 7,
        zone: 'Zone A',
        capabilities: {
          supports_ptz: false,
          supports_audio: true,
          supports_night_vision: false,
          supports_zoom: true
        }
      },
      {
        camera_id: 'cam_rooftop_1',
        name: 'Rooftop Access',
        location: 'Building A - Roof',
        property_id: 'prop_001',
        property_name: 'Luxury Heights',
        rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
        status: 'offline',
        priority: 8,
        zone: 'Zone C',
        capabilities: {
          supports_ptz: true,
          supports_audio: true,
          supports_night_vision: true,
          supports_zoom: true
        }
      }
    ];

    // Generate additional cameras for demo (up to grid size)
    const gridSize = getGridSize(gridConfig.layout);
    const additionalCameras = Math.max(0, gridSize - demoFeeds.length);
    
    for (let i = 0; i < additionalCameras; i++) {
      const cameraNum = demoFeeds.length + i + 1;
      demoFeeds.push({
        camera_id: `cam_demo_${cameraNum}`,
        name: `Camera ${cameraNum}`,
        location: `Location ${cameraNum}`,
        property_id: `prop_${Math.floor(i / 10) + 2}`,
        property_name: i < 10 ? 'Metro Business' : 'Corporate Plaza',
        rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
        status: Math.random() > 0.2 ? 'loading' : 'offline',
        priority: Math.floor(Math.random() * 10) + 1,
        zone: `Zone ${String.fromCharCode(65 + (i % 5))}`,
        capabilities: {
          supports_ptz: Math.random() > 0.5,
          supports_audio: Math.random() > 0.5,
          supports_night_vision: Math.random() > 0.3,
          supports_zoom: Math.random() > 0.5
        }
      });
    }

    setCameraFeeds(demoFeeds);
    
    // Start streams for visible cameras using enhanced WebSocket
    demoFeeds.slice(0, gridSize).forEach(camera => {
      if (camera.status === 'loading') {
        websocket.startStream({
          camera_id: camera.camera_id,
          rtsp_url: camera.rtsp_url,
          quality: gridConfig.quality
        });
      }
    });
  }, [gridConfig.layout, gridConfig.quality, websocket, getGridSize]);
  
  // Enhanced WebSocket message handlers - STABILIZED with useRef to prevent recreation
  const toastRef = useRef(toast);
  toastRef.current = toast; // Update ref with current toast function

  const handleAIDetectionMessage = useRef((data: any) => {
    const { camera_id, detections, timestamp } = data;
    
    setCameraFeeds(prev => prev.map(camera => 
      camera.camera_id === camera_id 
        ? { 
            ...camera, 
            ai_detections: [detections[0], ...(camera.ai_detections || []).slice(0, 4)]
          }
        : camera
    ));
    
    console.log(`🤖 AI detection from ${camera_id}: ${detections.length} objects detected`);
  });

  const handleFaceDetectionMessage = useRef((data: any) => {
    const { camera_id, faces, timestamp } = data;
    
    setCameraFeeds(prev => prev.map(camera => 
      camera.camera_id === camera_id 
        ? { 
            ...camera, 
            face_detections: [faces[0], ...(camera.face_detections || []).slice(0, 4)]
          }
        : camera
    ));
    
    console.log(`👤 Face detection from ${camera_id}: ${faces.length} faces detected`);
  });

  const handleStreamStartSuccess = useRef((data: any) => {
    const { camera_id, stream_url, status } = data;
    
    setCameraFeeds(prev => prev.map(camera => 
      camera.camera_id === camera_id 
        ? { ...camera, status: 'online', stream_url }
        : camera
    ));
    
    console.log(`🎥 Stream started successfully for ${camera_id}`);
  });

  const handleStreamStatusUpdate = useRef((data: any) => {
    const { camera_id, status } = data;
    
    setCameraFeeds(prev => prev.map(camera => 
      camera.camera_id === camera_id 
        ? { ...camera, status }
        : camera
    ));
  });

  const handleAIEngineStatus = useRef((data: any) => {
    const { status, engine_id } = data;
    
    if (status === 'connected') {
      toastRef.current({
        title: "🤖 AI Engine Connected",
        description: "Real-time AI processing is now available.",
      });
    } else if (status === 'disconnected') {
      toastRef.current({
        title: "⚠️ AI Engine Disconnected",
        description: "AI processing temporarily unavailable.",
        variant: "destructive"
      });
    }
  });

  const handleAlertTriggered = useRef((data: any) => {
    const { type, camera_id, severity, alert_data } = data;
    
    // Create new SecurityAlert from WebSocket data
    const newAlert: SecurityAlert = {
      alert_id: `alert_${camera_id}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      alert_type: type as SecurityAlert['alert_type'],
      severity: severity as SecurityAlert['severity'],
      camera_id: camera_id,
      camera_name: alert_data?.camera_name || camera_id,
      location: alert_data?.location || 'Unknown Location',
      property_name: alert_data?.property_name || 'Unknown Property',
      description: alert_data?.description || `${type.replace('_', ' ').toUpperCase()} detected`,
      confidence: alert_data?.confidence || 0.85,
      status: 'active',
      metadata: alert_data
    };
    
    // Add alert to state
    setAlerts(prev => [newAlert, ...prev.slice(0, 99)]); // Keep last 100 alerts
    
    // Show toast notification
    toastRef.current({
      title: `🚨 ${type.replace('_', ' ').toUpperCase()} Alert`,
      description: `Alert on ${newAlert.camera_name} - ${newAlert.location}`,
      variant: severity === 'high' || severity === 'critical' ? 'destructive' : 'default'
    });
    
    // Auto-show alert panel for critical alerts
    if (severity === 'critical') {
      setAlertPanelVisible(true);
    }
  });

  // Initialize WebSocket message handlers - FIXED: Stable dependencies only
  useEffect(() => {
    // Handle connection status changes
    if (websocket.isAuthenticated && !cameraFeedsInitializedRef.current) {
      cameraFeedsInitializedRef.current = true;
      
      // Initialize camera feeds when connected - call directly to avoid dependency loop
      const demoFeeds: CameraFeed[] = [
        {
          camera_id: 'cam_entrance_1',
          name: 'Main Entrance',
          location: 'Building A - Lobby',
          property_id: 'prop_001',
          property_name: 'Luxury Heights',
          rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
          status: 'loading',
          priority: 9,
          zone: 'Zone A',
          capabilities: {
            supports_ptz: true,
            supports_audio: true,
            supports_night_vision: true,
            supports_zoom: true
          }
        },
        {
          camera_id: 'cam_parking_1',
          name: 'Parking Garage',
          location: 'Underground Level 1',
          property_id: 'prop_001',
          property_name: 'Luxury Heights',
          rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
          status: 'loading',
          priority: 6,
          zone: 'Zone B',
          capabilities: {
            supports_ptz: false,
            supports_audio: false,
            supports_night_vision: true,
            supports_zoom: false
          }
        }
      ];
      
      // Generate additional cameras for grid
      const gridSize = 36; // Default 6x6
      const additionalCameras = Math.max(0, gridSize - demoFeeds.length);
      
      for (let i = 0; i < additionalCameras; i++) {
        const cameraNum = demoFeeds.length + i + 1;
        demoFeeds.push({
          camera_id: `cam_demo_${cameraNum}`,
          name: `Camera ${cameraNum}`,
          location: `Location ${cameraNum}`,
          property_id: `prop_${Math.floor(i / 10) + 2}`,
          property_name: i < 10 ? 'Metro Business' : 'Corporate Plaza',
          rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
          status: Math.random() > 0.2 ? 'loading' : 'offline',
          priority: Math.floor(Math.random() * 10) + 1,
          zone: `Zone ${String.fromCharCode(65 + (i % 5))}`,
          capabilities: {
            supports_ptz: Math.random() > 0.5,
            supports_audio: Math.random() > 0.5,
            supports_night_vision: Math.random() > 0.3,
            supports_zoom: Math.random() > 0.5
          }
        });
      }
      
      setCameraFeeds(demoFeeds);
      
      // Generate demo alerts for testing
      generateDemoAlerts(demoFeeds);
      
      // Start streams for visible cameras
      demoFeeds.slice(0, gridSize).forEach(camera => {
        if (camera.status === 'loading') {
          websocket.startStream({
            camera_id: camera.camera_id,
            rtsp_url: camera.rtsp_url,
            quality: 'thumbnail'
          });
        }
      });
    }
  }, [websocket.isAuthenticated]); // ONLY isAuthenticated dependency to prevent loops

  // Setup WebSocket message handlers (separate effect to prevent reconnection loops)
  useEffect(() => {
    // Setup message handlers using stable refs
    websocket.onMessage(MESSAGE_TYPES.AI_DETECTION_RESULT, handleAIDetectionMessage.current);
    websocket.onMessage(MESSAGE_TYPES.FACE_DETECTION_RESULT, handleFaceDetectionMessage.current);
    websocket.onMessage(MESSAGE_TYPES.STREAM_START_SUCCESS, handleStreamStartSuccess.current);
    websocket.onMessage(MESSAGE_TYPES.STREAM_STATUS_UPDATE, handleStreamStatusUpdate.current);
    websocket.onMessage(MESSAGE_TYPES.AI_ENGINE_STATUS, handleAIEngineStatus.current);
    websocket.onMessage(MESSAGE_TYPES.ALERT_TRIGGERED, handleAlertTriggered.current);
    
    return () => {
      // Cleanup message handlers
      websocket.offMessage(MESSAGE_TYPES.AI_DETECTION_RESULT);
      websocket.offMessage(MESSAGE_TYPES.FACE_DETECTION_RESULT);
      websocket.offMessage(MESSAGE_TYPES.STREAM_START_SUCCESS);
      websocket.offMessage(MESSAGE_TYPES.STREAM_STATUS_UPDATE);
      websocket.offMessage(MESSAGE_TYPES.AI_ENGINE_STATUS);
      websocket.offMessage(MESSAGE_TYPES.ALERT_TRIGGERED);
    };
  }, [websocket]); // Only websocket dependency now

  // Camera filtering and pagination - FIXED: Using useMemo to prevent hooks order issues
  const visibleCameras = useMemo(() => {
    let filtered = cameraFeeds;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(camera =>
        camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        camera.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        camera.camera_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply property filter
    if (filterProperty !== 'all') {
      filtered = filtered.filter(camera => camera.property_id === filterProperty);
    }

    // Apply display mode filter
    switch (gridConfig.display_mode) {
      case 'online':
        filtered = filtered.filter(camera => camera.status === 'online');
        break;
      case 'alerts':
        filtered = filtered.filter(camera => 
          (camera.ai_detections && camera.ai_detections.length > 0) ||
          (camera.face_detections && camera.face_detections.length > 0)
        );
        break;
      case 'priority':
        filtered = filtered.filter(camera => camera.priority >= 8);
        break;
    }

    return filtered;
  }, [cameraFeeds, searchTerm, filterProperty, gridConfig.display_mode]);

  // Memoized derived data - FIXED: Moved before useEffect to ensure stable hook order
  const gridSize = useMemo(() => getGridSize(gridConfig.layout), [gridConfig.layout, getGridSize]);
  const totalPages = useMemo(() => Math.ceil(visibleCameras.length / gridSize), [visibleCameras.length, gridSize]);
  const currentPageCameras = useMemo(() => visibleCameras.slice(
    currentPage * gridSize,
    (currentPage + 1) * gridSize
  ), [visibleCameras, currentPage, gridSize]);

  const stats: MonitoringStats = useMemo(() => {
    const online = cameraFeeds.filter(c => c.status === 'online').length;
    const alerts = cameraFeeds.filter(c => 
      (c.ai_detections && c.ai_detections.length > 0) ||
      (c.face_detections && c.face_detections.length > 0)
    ).length;
    const faceDetections = cameraFeeds.reduce((sum, c) => 
      sum + (c.face_detections?.length || 0), 0
    );
    
    return { online, alerts, faceDetections, total: cameraFeeds.length };
  }, [cameraFeeds]);

  const properties: Property[] = useMemo(() => {
    const uniqueProperties = Array.from(new Set(
      cameraFeeds.map(c => c.property_id)
    ));
    return uniqueProperties.map(id => {
      const camera = cameraFeeds.find(c => c.property_id === id);
      return {
        id,
        name: camera?.property_name || id,
        count: cameraFeeds.filter(c => c.property_id === id).length
      };
    });
  }, [cameraFeeds]);

  // Auto-switch timer management
  useEffect(() => {
    if (gridConfig.auto_switch) {
      autoSwitchIntervalRef.current = setInterval(() => {
        setAutoSwitchTimer(prev => {
          if (prev <= 1) {
            // Move to next page
            setCurrentPage(prevPage => (prevPage + 1) % totalPages);
            return gridConfig.switch_interval;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (autoSwitchIntervalRef.current) {
        clearInterval(autoSwitchIntervalRef.current);
        autoSwitchIntervalRef.current = null;
      }
      setAutoSwitchTimer(0);
    }

    return () => {
      if (autoSwitchIntervalRef.current) {
        clearInterval(autoSwitchIntervalRef.current);
      }
    };
  }, [gridConfig.auto_switch, gridConfig.switch_interval, totalPages]);

  // Event handlers
  const handleLayoutChange = useCallback((layout: string) => {
    setGridConfig(prev => ({ ...prev, layout }));
    setCurrentPage(0); // Reset to first page when layout changes
  }, []);

  const handleAutoSwitchToggle = useCallback(() => {
    setGridConfig(prev => ({ ...prev, auto_switch: !prev.auto_switch }));
  }, []);

  const handleQualityChange = useCallback((quality: string) => {
    setGridConfig(prev => ({ ...prev, quality }));
  }, []);

  const handleDisplayModeChange = useCallback((display_mode: string) => {
    setGridConfig(prev => ({ ...prev, display_mode }));
    setCurrentPage(0); // Reset to first page when filter changes
  }, []);

  const handleSwitchIntervalChange = useCallback((switch_interval: number) => {
    setGridConfig(prev => ({ ...prev, switch_interval }));
    setAutoSwitchTimer(switch_interval); // Reset timer
  }, []);

  const handleCameraSelect = useCallback((camera_id: string | null) => {
    setSelectedCamera(camera_id);
  }, []);

  // Alert management handlers
  const handleAlertAcknowledge = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.alert_id === alertId 
        ? { ...alert, status: 'acknowledged' as const, acknowledged_at: new Date().toISOString() }
        : alert
    ));
    
    // Send acknowledgment to backend if needed
    websocket.emit('alert_acknowledge', { alert_id: alertId });
  }, [websocket]);

  const handleAlertDismiss = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.alert_id === alertId 
        ? { ...alert, status: 'dismissed' as const }
        : alert
    ));
    
    // Send dismissal to backend if needed
    websocket.emit('alert_dismiss', { alert_id: alertId });
  }, [websocket]);

  const handleToggleAlertPanel = useCallback(() => {
    setAlertPanelVisible(prev => !prev);
  }, []);

  return (
    <ThemeProvider theme={{}}>
      <GlobalStyle />
      <DashboardContainer>
        {/* Status Bars */}
        <StatusBar
          streamingStatus={websocket.isAuthenticated ? 'connected' : websocket.isConnected ? 'connecting' : 'disconnected'}
          stats={stats}
          properties={properties}
          currentLayout={gridConfig.layout}
          currentQuality={gridConfig.quality}
          currentPage={currentPage}
          totalPages={totalPages}
          autoSwitchTimer={gridConfig.auto_switch ? autoSwitchTimer : undefined}
        />

        {/* Controls Bar */}
        <ControlsBar
          gridConfig={gridConfig}
          properties={properties}
          searchTerm={searchTerm}
          filterProperty={filterProperty}
          onLayoutChange={handleLayoutChange}
          onAutoSwitchToggle={handleAutoSwitchToggle}
          onQualityChange={handleQualityChange}
          onDisplayModeChange={handleDisplayModeChange}
          onSwitchIntervalChange={handleSwitchIntervalChange}
          onSearchChange={setSearchTerm}
          onFilterPropertyChange={setFilterProperty}
        />

        {/* Main Content */}
        <MainContent>
          <CameraGrid
            cameras={currentPageCameras}
            gridConfig={gridConfig}
            selectedCamera={selectedCamera}
            onCameraSelect={handleCameraSelect}
            onQualityChange={handleQualityChange}
          />
          
          <AlertPanel
            alerts={alerts}
            cameras={cameraFeeds}
            properties={properties}
            selectedCamera={selectedCamera}
            onCameraSelect={handleCameraSelect}
            onAlertAcknowledge={handleAlertAcknowledge}
            onAlertDismiss={handleAlertDismiss}
            isVisible={alertPanelVisible}
            onToggleVisibility={handleToggleAlertPanel}
          />
        </MainContent>

        {/* Footer */}
        <FooterBar>
          <div>
            Showing {currentPageCameras.length} of {visibleCameras.length} cameras
          </div>
          <div>
            APEX AI Live Monitoring v2.0 • Enhanced Modular Architecture
          </div>
          <div>
            {currentPage + 1} / {totalPages} pages
          </div>
        </FooterBar>
      </DashboardContainer>
    </ThemeProvider>
  );
};

export default LiveMonitoringContainer;