// APEX AI LIVE MONITORING DASHBOARD
// Master Prompt v29.1-APEX Implementation
// Phase 2A: Live Monitoring Interface

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { 
  Camera, 
  AlertTriangle, 
  Users, 
  MapPin, 
  Zap, 
  Volume2, 
  Maximize2, 
  Settings,
  Wifi,
  WifiOff,
  Activity,
  Shield,
  Phone,
  MessageSquare,
  Navigation,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
  Target,
  Radio
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

// Import existing components
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';

// Types for AI monitoring
interface AIDetection {
  detection_id: string;
  timestamp: string;
  camera_id: string;
  detection_type: string;
  confidence: number;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  alert_level: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
}

interface AIAlert {
  alert_id: string;
  timestamp: string;
  camera_id: string;
  alert_type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detection_details: AIDetection;
  actions_required: string[];
  status: 'pending' | 'acknowledged' | 'dispatched' | 'resolved';
  assigned_guard?: string;
}

interface CameraStream {
  camera_id: string;
  name: string;
  location: string;
  rtsp_url: string;
  status: 'online' | 'offline' | 'error';
  last_frame?: string; // base64 image
  ai_overlays?: AIDetection[];
  guard_zone?: string;
}

interface GuardStatus {
  guard_id: string;
  name: string;
  status: 'on_duty' | 'off_duty' | 'break' | 'responding';
  location?: { lat: number; lng: number };
  assigned_zone: string;
  last_check_in: string;
  active_alerts: number;
}

// Styled Components
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background-color: #0a0a0a;
    color: #ffffff;
    overflow: hidden;
  }
`;

const DashboardContainer = styled.div`
  display: grid;
  grid-template-rows: 60px 1fr;
  height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  background: rgba(20, 20, 20, 0.95);
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(10px);
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
`;

const StatusIndicators = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const StatusItem = styled.div<{ status: 'online' | 'offline' | 'warning' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
  
  .indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => 
      props.status === 'online' ? '#10B981' : 
      props.status === 'warning' ? '#F59E0B' : '#EF4444'
    };
    animation: ${props => props.status === 'online' ? 'pulse 2s infinite' : 'none'};
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  padding: 1rem;
  height: calc(100vh - 60px);
  overflow: hidden;
`;

const CameraGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1rem;
  height: 100%;
  overflow-y: auto;
  padding-right: 0.5rem;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.5);
    border-radius: 3px;
  }
`;

const CameraFeed = styled.div<{ alertLevel?: string }>`
  position: relative;
  background: rgba(30, 30, 30, 0.9);
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid ${props => {
    switch(props.alertLevel) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B'; 
      case 'medium': return '#3B82F6';
      default: return 'rgba(255, 215, 0, 0.3)';
    }
  }};
  transition: all 0.3s ease;
  height: 300px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
`;

const CameraHeader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%);
  padding: 1rem;
  z-index: 2;
  
  .camera-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    
    .name {
      font-weight: 600;
      color: #FFD700;
    }
    
    .location {
      font-size: 0.85rem;
      color: #B0B0B0;
    }
  }
  
  .status-badges {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
`;

const StatusBadge = styled.span<{ type: 'ai' | 'recording' | 'guard' | 'alert' }>`
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  background: ${props => {
    switch(props.type) {
      case 'ai': return 'rgba(34, 197, 94, 0.2)';
      case 'recording': return 'rgba(239, 68, 68, 0.2)';
      case 'guard': return 'rgba(59, 130, 246, 0.2)';
      case 'alert': return 'rgba(245, 158, 11, 0.2)';
    }
  }};
  color: ${props => {
    switch(props.type) {
      case 'ai': return '#22C55E';
      case 'recording': return '#EF4444';
      case 'guard': return '#3B82F6';
      case 'alert': return '#F59E0B';
    }
  }};
  border: 1px solid ${props => {
    switch(props.type) {
      case 'ai': return 'rgba(34, 197, 94, 0.3)';
      case 'recording': return 'rgba(239, 68, 68, 0.3)';
      case 'guard': return 'rgba(59, 130, 246, 0.3)';
      case 'alert': return 'rgba(245, 158, 11, 0.3)';
    }
  }};
`;

const VideoFrame = styled.div`
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .placeholder {
    color: #666;
    text-align: center;
    
    .icon {
      margin-bottom: 0.5rem;
    }
  }
`;

const AIOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
`;

const DetectionBox = styled.div<{ 
  x: number; 
  y: number; 
  width: number; 
  height: number; 
  type: string; 
  confidence: number 
}>`
  position: absolute;
  left: ${props => props.x * 100}%;
  top: ${props => props.y * 100}%;
  width: ${props => props.width * 100}%;
  height: ${props => props.height * 100}%;
  border: 2px solid ${props => {
    switch(props.type) {
      case 'person': return '#22C55E';
      case 'weapon': return '#EF4444';
      case 'vehicle': return '#3B82F6';
      default: return '#F59E0B';
    }
  }};
  border-radius: 4px;
  
  &::after {
    content: '${props => props.type}: ${props => Math.round(props.confidence * 100)}%';
    position: absolute;
    top: -25px;
    left: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.7rem;
    white-space: nowrap;
  }
`;

const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  overflow: hidden;
`;

const AlertFeed = styled.div`
  flex: 1;
  background: rgba(30, 30, 30, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const AlertHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  background: rgba(255, 215, 0, 0.1);
  
  h3 {
    margin: 0;
    color: #FFD700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const AlertList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.5);
    border-radius: 3px;
  }
`;

const AlertItem = styled.div<{ priority: string; status: string }>`
  background: rgba(40, 40, 40, 0.9);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-left: 4px solid ${props => {
    switch(props.priority) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      default: return '#6B7280';
    }
  }};
  transition: all 0.2s ease;
  cursor: pointer;
  opacity: ${props => props.status === 'resolved' ? 0.7 : 1};
  
  &:hover {
    background: rgba(50, 50, 50, 0.9);
    transform: translateX(2px);
  }
  
  .alert-header {
    display: flex;
    justify-content: between;
    align-items: center;
    margin-bottom: 0.5rem;
    
    .type {
      font-weight: 600;
      color: #FFD700;
    }
    
    .time {
      font-size: 0.8rem;
      color: #B0B0B0;
    }
  }
  
  .description {
    font-size: 0.9rem;
    color: #E0E0E0;
    margin-bottom: 0.5rem;
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
`;

const ActionButton = styled.button<{ variant: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: ${props => {
    switch(props.variant) {
      case 'primary': return '#FFD700';
      case 'secondary': return 'rgba(255, 255, 255, 0.1)';
      case 'danger': return '#EF4444';
    }
  }};
  
  color: ${props => {
    switch(props.variant) {
      case 'primary': return '#000';
      case 'secondary': return '#fff';
      case 'danger': return '#fff';
    }
  }};
  
  &:hover {
    transform: translateY(-1px);
    opacity: 0.9;
  }
`;

const GuardPanel = styled.div`
  background: rgba(30, 30, 30, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  padding: 1rem;
  height: 300px;
  
  h3 {
    margin: 0 0 1rem 0;
    color: #FFD700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const GuardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: calc(100% - 2rem);
  overflow-y: auto;
`;

const GuardItem = styled.div<{ status: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(40, 40, 40, 0.7);
  border-radius: 8px;
  border-left: 3px solid ${props => {
    switch(props.status) {
      case 'on_duty': return '#22C55E';
      case 'responding': return '#F59E0B';
      case 'break': return '#3B82F6';
      default: return '#6B7280';
    }
  }};
  
  .guard-info {
    .name {
      font-weight: 500;
      color: #E0E0E0;
    }
    
    .zone {
      font-size: 0.8rem;
      color: #B0B0B0;
    }
  }
  
  .guard-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 500;
      background: ${props => {
        switch(props.status) {
          case 'on_duty': return 'rgba(34, 197, 94, 0.2)';
          case 'responding': return 'rgba(245, 158, 11, 0.2)';
          case 'break': return 'rgba(59, 130, 246, 0.2)';
          default: return 'rgba(107, 114, 128, 0.2)';
        }
      }};
      color: ${props => {
        switch(props.status) {
          case 'on_duty': return '#22C55E';
          case 'responding': return '#F59E0B';
          case 'break': return '#3B82F6';
          default: return '#9CA3AF';
        }
      }};
    }
  }
`;

// Main Component
const LiveMonitoringDashboard: React.FC = () => {
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  
  // State management
  const [cameraStreams, setCameraStreams] = useState<CameraStream[]>([]);
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [guards, setGuards] = useState<GuardStatus[]>([]);
  const [aiSystemStatus, setAISystemStatus] = useState({
    model_loaded: false,
    active_streams: 0,
    processing: false
  });
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Initialize demo data
  useEffect(() => {
    // Demo camera streams
    setCameraStreams([
      {
        camera_id: 'cam_entrance_1',
        name: 'Main Entrance',
        location: 'Building A - Lobby',
        rtsp_url: 'rtsp://demo.url/stream1',
        status: 'online',
        guard_zone: 'Zone A'
      },
      {
        camera_id: 'cam_parking_1',
        name: 'Parking Garage',
        location: 'Underground Level 1',
        rtsp_url: 'rtsp://demo.url/stream2', 
        status: 'online',
        guard_zone: 'Zone B'
      },
      {
        camera_id: 'cam_elevator_1',
        name: 'Elevator Bank',
        location: 'Building A - Floor 1',
        rtsp_url: 'rtsp://demo.url/stream3',
        status: 'online',
        guard_zone: 'Zone A'
      },
      {
        camera_id: 'cam_rooftop_1',
        name: 'Rooftop Access',
        location: 'Building A - Roof',
        rtsp_url: 'rtsp://demo.url/stream4',
        status: 'offline',
        guard_zone: 'Zone C'
      }
    ]);

    // Demo guards
    setGuards([
      {
        guard_id: 'guard_001',
        name: 'Marcus Johnson',
        status: 'on_duty',
        assigned_zone: 'Zone A',
        last_check_in: new Date().toISOString(),
        active_alerts: 0
      },
      {
        guard_id: 'guard_002', 
        name: 'Sarah Williams',
        status: 'responding',
        assigned_zone: 'Zone B',
        last_check_in: new Date(Date.now() - 300000).toISOString(),
        active_alerts: 1
      },
      {
        guard_id: 'guard_003',
        name: 'David Chen',
        status: 'break',
        assigned_zone: 'Zone C',
        last_check_in: new Date(Date.now() - 600000).toISOString(),
        active_alerts: 0
      }
    ]);

    // Demo alerts
    setAlerts([
      {
        alert_id: 'alert_001',
        timestamp: new Date().toISOString(),
        camera_id: 'cam_entrance_1',
        alert_type: 'person_detection',
        priority: 'medium',
        description: 'Person detected in restricted area after hours',
        detection_details: {
          detection_id: 'det_001',
          timestamp: new Date().toISOString(),
          camera_id: 'cam_entrance_1',
          detection_type: 'person',
          confidence: 0.87,
          bounding_box: { x: 0.3, y: 0.2, width: 0.2, height: 0.4 },
          alert_level: 'medium',
          metadata: { zone: 'entrance' }
        },
        actions_required: ['dispatch_guard', 'verify_identity'],
        status: 'pending'
      }
    ]);
  }, []);

  // WebSocket connection
  useEffect(() => {
    const connectToAIServer = () => {
      socketRef.current = io('http://localhost:5001');
      
      socketRef.current.on('connect', () => {
        setConnectionStatus('connected');
        toast({
          title: "AI System Connected",
          description: "Live monitoring is now active.",
          variant: "default"
        });
      });

      socketRef.current.on('disconnect', () => {
        setConnectionStatus('disconnected');
      });

      socketRef.current.on('ai_detection', (detection: AIDetection) => {
        // Update camera overlay with new detection
        setCameraStreams(prev => prev.map(stream => 
          stream.camera_id === detection.camera_id 
            ? { ...stream, ai_overlays: [detection] }
            : stream
        ));
      });

      socketRef.current.on('ai_alert', (alert: AIAlert) => {
        setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
        
        // Show toast for high priority alerts
        if (alert.priority === 'high' || alert.priority === 'critical') {
          toast({
            title: `${alert.priority.toUpperCase()} Alert`,
            description: alert.description,
            variant: "destructive"
          });
        }
      });

      socketRef.current.on('model_loaded', (data) => {
        setAISystemStatus(prev => ({ ...prev, model_loaded: true }));
      });
    };

    connectToAIServer();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [toast]);

  // Event handlers
  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.alert_id === alertId 
        ? { ...alert, status: 'acknowledged' }
        : alert
    ));
    
    toast({
      title: "Alert Acknowledged",
      description: "Alert has been acknowledged by operator.",
      variant: "default"
    });
  }, [toast]);

  const handleDispatchGuard = useCallback((alertId: string, guardId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.alert_id === alertId 
        ? { ...alert, status: 'dispatched', assigned_guard: guardId }
        : alert
    ));
    
    setGuards(prev => prev.map(guard => 
      guard.guard_id === guardId 
        ? { ...guard, status: 'responding', active_alerts: guard.active_alerts + 1 }
        : guard
    ));
    
    toast({
      title: "Guard Dispatched",
      description: "Guard has been dispatched to investigate alert.",
      variant: "default"
    });
  }, [toast]);

  const handleDigitalZoom = useCallback((cameraId: string, detection: AIDetection) => {
    // Simulate digital zoom request
    if (socketRef.current) {
      socketRef.current.emit('request_digital_zoom', {
        camera_id: cameraId,
        bounding_box: detection.bounding_box
      });
    }
    
    toast({
      title: "Digital Zoom Activated",
      description: "Enhanced view of detected object requested.",
      variant: "default"
    });
  }, [toast]);

  const handleAIVoiceResponse = useCallback((cameraId: string, message: string) => {
    // Simulate AI voice response
    if (socketRef.current) {
      socketRef.current.emit('trigger_voice_response', {
        camera_id: cameraId,
        message: message
      });
    }
    
    toast({
      title: "AI Voice Response Sent",
      description: `Sent: "${message}"`,
      variant: "default"
    });
  }, [toast]);

  // Memoized computed values
  const onlineStreams = useMemo(() => 
    cameraStreams.filter(stream => stream.status === 'online').length, 
    [cameraStreams]
  );
  
  const activeGuards = useMemo(() => 
    guards.filter(guard => guard.status === 'on_duty' || guard.status === 'responding').length, 
    [guards]
  );
  
  const pendingAlerts = useMemo(() => 
    alerts.filter(alert => alert.status === 'pending').length, 
    [alerts]
  );

  return (
    <ThemeProvider theme={{}}>
      <GlobalStyle />
      <DashboardContainer>
        {/* Top Navigation Bar */}
        <TopBar>
          <LogoSection>
            <Shield size={24} color="#FFD700" />
            <h1>APEX AI Live Monitoring</h1>
          </LogoSection>
          
          <StatusIndicators>
            <StatusItem status={connectionStatus === 'connected' ? 'online' : 'offline'}>
              <div className="indicator" />
              AI System: {connectionStatus}
            </StatusItem>
            
            <StatusItem status={onlineStreams > 0 ? 'online' : 'offline'}>
              <Camera size={16} />
              {onlineStreams}/{cameraStreams.length} Cameras
            </StatusItem>
            
            <StatusItem status={activeGuards > 0 ? 'online' : 'offline'}>
              <Users size={16} />
              {activeGuards} Guards Active
            </StatusItem>
            
            <StatusItem status={pendingAlerts > 0 ? 'warning' : 'online'}>
              <AlertTriangle size={16} />
              {pendingAlerts} Alerts
            </StatusItem>
          </StatusIndicators>
        </TopBar>

        {/* Main Dashboard Content */}
        <MainContent>
          {/* Camera Grid */}
          <CameraGrid>
            {cameraStreams.map((stream) => {
              const hasActiveAlert = alerts.some(alert => 
                alert.camera_id === stream.camera_id && alert.status === 'pending'
              );
              const alertLevel = hasActiveAlert ? 
                alerts.find(alert => alert.camera_id === stream.camera_id)?.priority : 
                undefined;

              return (
                <CameraFeed key={stream.camera_id} alertLevel={alertLevel}>
                  <CameraHeader>
                    <div className="camera-info">
                      <div>
                        <div className="name">{stream.name}</div>
                        <div className="location">{stream.location}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDigitalZoom(stream.camera_id, alerts[0]?.detection_details)}
                        >
                          <Maximize2 size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleAIVoiceResponse(stream.camera_id, "This area is under surveillance. Please identify yourself.")}
                        >
                          <Volume2 size={14} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="status-badges">
                      {stream.status === 'online' && <StatusBadge type="ai">AI Active</StatusBadge>}
                      {hasActiveAlert && <StatusBadge type="alert">Alert</StatusBadge>}
                      <StatusBadge type="guard">{stream.guard_zone}</StatusBadge>
                    </div>
                  </CameraHeader>

                  <VideoFrame>
                    {stream.status === 'online' ? (
                      <>
                        {/* Placeholder for video stream */}
                        <div className="placeholder">
                          <div className="icon">
                            <Camera size={48} color="#666" />
                          </div>
                          <div>Live Stream: {stream.name}</div>
                          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            {stream.status.toUpperCase()}
                          </div>
                        </div>
                        
                        {/* AI Detection Overlays */}
                        {stream.ai_overlays && (
                          <AIOverlay>
                            {stream.ai_overlays.map((detection, index) => (
                              <DetectionBox
                                key={`${detection.detection_id}_${index}`}
                                x={detection.bounding_box.x}
                                y={detection.bounding_box.y}
                                width={detection.bounding_box.width}
                                height={detection.bounding_box.height}
                                type={detection.detection_type}
                                confidence={detection.confidence}
                              />
                            ))}
                          </AIOverlay>
                        )}
                      </>
                    ) : (
                      <div className="placeholder">
                        <div className="icon">
                          <WifiOff size={48} color="#666" />
                        </div>
                        <div>Camera Offline</div>
                      </div>
                    )}
                  </VideoFrame>
                </CameraFeed>
              );
            })}
          </CameraGrid>

          {/* Right Panel */}
          <RightPanel>
            {/* Alert Feed */}
            <AlertFeed>
              <AlertHeader>
                <h3>
                  <AlertTriangle size={20} />
                  Live Alerts ({pendingAlerts} pending)
                </h3>
              </AlertHeader>
              
              <AlertList>
                {alerts.map((alert) => (
                  <AlertItem 
                    key={alert.alert_id} 
                    priority={alert.priority}
                    status={alert.status}
                  >
                    <div className="alert-header">
                      <span className="type">{alert.alert_type.replace('_', ' ').toUpperCase()}</span>
                      <span className="time">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="description">{alert.description}</div>
                    
                    <div className="actions">
                      {alert.status === 'pending' && (
                        <>
                          <ActionButton 
                            variant="primary"
                            onClick={() => handleAcknowledgeAlert(alert.alert_id)}
                          >
                            <Eye size={12} />
                            Acknowledge
                          </ActionButton>
                          <ActionButton 
                            variant="secondary"
                            onClick={() => handleDispatchGuard(alert.alert_id, guards[0]?.guard_id)}
                          >
                            <Navigation size={12} />
                            Dispatch
                          </ActionButton>
                          <ActionButton 
                            variant="secondary"
                            onClick={() => handleDigitalZoom(alert.camera_id, alert.detection_details)}
                          >
                            <Target size={12} />
                            Zoom
                          </ActionButton>
                        </>
                      )}
                      
                      {alert.status === 'acknowledged' && (
                        <ActionButton 
                          variant="secondary"
                          onClick={() => handleDispatchGuard(alert.alert_id, guards[0]?.guard_id)}
                        >
                          <Radio size={12} />
                          Dispatch Guard
                        </ActionButton>
                      )}
                      
                      {alert.status === 'dispatched' && (
                        <span style={{ color: '#F59E0B', fontSize: '0.8rem' }}>
                          ⏱ Guard En Route
                        </span>
                      )}
                    </div>
                  </AlertItem>
                ))}
                
                {alerts.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#666', 
                    padding: '2rem',
                    fontStyle: 'italic'
                  }}>
                    No alerts at this time. System monitoring...
                  </div>
                )}
              </AlertList>
            </AlertFeed>

            {/* Guard Status Panel */}
            <GuardPanel>
              <h3>
                <Users size={20} />
                Guard Status
              </h3>
              
              <GuardList>
                {guards.map((guard) => (
                  <GuardItem key={guard.guard_id} status={guard.status}>
                    <div className="guard-info">
                      <div className="name">{guard.name}</div>
                      <div className="zone">{guard.assigned_zone}</div>
                    </div>
                    
                    <div className="guard-status">
                      <div className="status-badge">
                        {guard.status.replace('_', ' ')}
                      </div>
                      {guard.active_alerts > 0 && (
                        <span style={{ 
                          background: '#F59E0B', 
                          color: '#000',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}>
                          {guard.active_alerts}
                        </span>
                      )}
                    </div>
                  </GuardItem>
                ))}
              </GuardList>
            </GuardPanel>
          </RightPanel>
        </MainContent>
      </DashboardContainer>
    </ThemeProvider>
  );
};

export default LiveMonitoringDashboard;