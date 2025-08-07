// APEX AI LIVE MONITORING DASHBOARD - PRODUCTION READY
// Master Prompt v37.0-APEX Implementation
// Phase 2A: Complete Live Monitoring with Visual Alerts, DVR Integration & Professional Controls

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { 
  Camera, 
  AlertTriangle, 
  Users, 
  Volume2, 
  Maximize2, 
  WifiOff,
  Shield,
  Navigation,
  Eye,
  Target,
  Radio,
  Settings,
  Activity,
  Play,
  Pause,
  VolumeX,
  Mic,
  MicOff,
  Monitor,
  Zap,
  Power,
  RotateCcw
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

// Import existing components
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';

// Import enhanced AI dispatch system
import { useEnhancedAIDispatchSystem } from './EnhancedAIDispatchSystem';

// Import Visual Alerts components with functionality
import { 
  BlinkingBorderOverlay, 
  AlertManager, 
  ThreatLevels, 
  THREAT_COLORS 
} from '../VisualAlerts';

// Import holographic animations
import '../../styles/holographicAnimations.css';

// Enhanced Camera Stream Interface
interface EnhancedCameraStream {
  camera_id: string;
  name: string;
  location: string;
  rtsp_url: string;
  status: 'online' | 'offline' | 'error' | 'connecting';
  last_frame?: string;
  ai_overlays?: AIDetection[];
  guard_zone?: string;
  dvr_connected: boolean;
  feed_url?: string;
  stream_quality: 'high' | 'medium' | 'low';
  capabilities: {
    supports_ptz: boolean;
    supports_digital_zoom: boolean;
    supports_audio_output: boolean;
    supports_presets: boolean;
    supports_recording: boolean;
    supports_audio_input: boolean;
  };
  audio_enabled: boolean;
  recording_enabled: boolean;
  ai_monitoring_enabled: boolean;
}

// AI Detection and Alert Types
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
  acknowledged_by?: string;
  acknowledged_at?: string;
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

interface VisualAlert {
  id: string;
  zoneId: string;
  threatLevel: keyof typeof ThreatLevels;
  threatType: string;
  confidence: number;
  position: { x: number; y: number; width: number; height: number };
  timestamp: number;
  cameraId: string;
}

// PROFESSIONAL TEAL THEME - Matching Homepage Exactly
const colors = {
  primary: '#14B8A6',        // Main teal - professional
  primaryLight: '#2DD4BF',   // Light teal accent
  primaryDark: '#0D9488',    // Dark teal for depth
  accent: '#8B5CF6',         // Professional purple
  success: '#10B981',        // Professional green
  warning: '#F59E0B',        // Professional amber
  danger: '#EF4444',         // Professional red
  white: '#FFFFFF',
  black: '#000000',
  darkBg: '#0A0A0A',
  cardBg: 'rgba(0, 0, 0, 0.95)',
  primaryGlow: 'rgba(20, 184, 166, 0.3)',
  textGlow: 'rgba(20, 184, 166, 0.4)',
  gray100: '#F8FAFC',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',
};

// Styled Components with Enhanced Design
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background-color: ${colors.darkBg};
    color: ${colors.white};
    overflow: hidden;
  }
`;

const DashboardContainer = styled.div`
  display: grid;
  grid-template-rows: 60px 50px 1fr;
  height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  background: rgba(20, 20, 20, 0.95);
  border-bottom: 1px solid ${colors.primary};
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(20, 184, 166, 0.1);
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${colors.primary};
    margin: 0;
    text-shadow: 0 0 8px ${colors.textGlow};
    font-family: 'Orbitron', sans-serif;
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
  background: rgba(20, 184, 166, 0.1);
  border: 1px solid rgba(20, 184, 166, 0.2);
  font-size: 0.9rem;
  transition: all 0.3s ease;
  
  .indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => 
      props.status === 'online' ? colors.success : 
      props.status === 'warning' ? colors.warning : colors.danger
    };
    animation: ${props => props.status === 'online' ? 'pulse 2s infinite' : 'none'};
    box-shadow: ${props => 
      props.status === 'online' ? `0 0 8px ${colors.success}` : 
      props.status === 'warning' ? `0 0 8px ${colors.warning}` : `0 0 8px ${colors.danger}`
    };
  }
  
  &:hover {
    background: rgba(20, 184, 166, 0.15);
    border-color: ${colors.primary};
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// ENHANCED CONTROL BAR FOR PHYSICAL CONTROLS
const ControlBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  background: rgba(15, 15, 15, 0.95);
  border-bottom: 1px solid rgba(20, 184, 166, 0.2);
  backdrop-filter: blur(5px);
`;

const ControlSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ControlButton = styled.button<{ active?: boolean; variant?: 'primary' | 'warning' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${props => {
    if (props.variant === 'danger') return colors.danger;
    if (props.variant === 'warning') return colors.warning;
    return props.active ? colors.primary : colors.gray600;
  }};
  background: ${props => {
    if (props.variant === 'danger') return `linear-gradient(135deg, ${colors.danger}, #FF6B6B)`;
    if (props.variant === 'warning') return `linear-gradient(135deg, ${colors.warning}, #FBBF24)`;
    return props.active 
      ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`
      : 'rgba(20, 184, 166, 0.1)';
  }};
  color: ${props => props.active || props.variant ? colors.white : colors.primary};
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px ${props => {
      if (props.variant === 'danger') return 'rgba(239, 68, 68, 0.3)';
      if (props.variant === 'warning') return 'rgba(245, 158, 11, 0.3)';
      return colors.primaryGlow;
    }};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  padding: 1rem;
  height: calc(100vh - 110px);
  overflow: hidden;
`;

const CameraGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1rem;
  height: 100%;
  overflow-y: auto;
  padding-right: 0.5rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
    border-radius: 3px;
    box-shadow: 0 0 5px ${colors.primaryGlow};
  }
`;

const CameraFeed = styled.div<{ alertLevel?: string; hasAlert?: boolean; isRecording?: boolean; dvr_connected?: boolean }>`
  position: relative;
  background: ${colors.cardBg};
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid ${props => {
    if (props.hasAlert) {
      switch(props.alertLevel) {
        case 'WEAPON': return colors.danger;
        case 'CRITICAL': return colors.danger;
        case 'HIGH': return colors.warning;
        case 'MEDIUM': return colors.accent;
        case 'LOW': return colors.primary;
        default: return colors.primary;
      }
    }
    return props.dvr_connected ? colors.success : colors.primary;
  }};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 300px;
  backdrop-filter: blur(10px);
  
  ${props => props.isRecording && `
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
    &::before {
      content: 'REC';
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: ${colors.danger};
      color: ${colors.white};
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: bold;
      z-index: 10;
      animation: blink 1s infinite;
    }
    
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.5; }
    }
  `}
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => 
      props.hasAlert 
        ? `0 8px 32px rgba(239, 68, 68, 0.3), 0 0 20px ${colors.primaryGlow}`
        : `0 8px 25px rgba(0, 0, 0, 0.3), 0 0 15px ${colors.primaryGlow}`
    };
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
      color: ${colors.primary};
      text-shadow: 0 0 8px ${colors.textGlow};
      font-family: 'Orbitron', sans-serif;
    }
    
    .location {
      font-size: 0.85rem;
      color: ${colors.gray300};
    }
  }
  
  .status-badges {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }
`;

const StatusBadge = styled.span<{ type: 'ai' | 'recording' | 'guard' | 'alert' | 'dvr' | 'audio' }>`
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
      case 'dvr': return 'rgba(16, 185, 129, 0.2)';
      case 'audio': return 'rgba(139, 92, 246, 0.2)';
    }
  }};
  color: ${props => {
    switch(props.type) {
      case 'ai': return '#22C55E';
      case 'recording': return '#EF4444';
      case 'guard': return '#3B82F6';
      case 'alert': return '#F59E0B';
      case 'dvr': return '#10B981';
      case 'audio': return '#8B5CF6';
    }
  }};
  border: 1px solid ${props => {
    switch(props.type) {
      case 'ai': return 'rgba(34, 197, 94, 0.3)';
      case 'recording': return 'rgba(239, 68, 68, 0.3)';
      case 'guard': return 'rgba(59, 130, 246, 0.3)';
      case 'alert': return 'rgba(245, 158, 11, 0.3)';
      case 'dvr': return 'rgba(16, 185, 129, 0.3)';
      case 'audio': return 'rgba(139, 92, 246, 0.3)';
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
  
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CameraControlsOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%);
  padding: 1rem;
  z-index: 3;
  
  .controls-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }
  
  .control-group {
    display: flex;
    gap: 0.25rem;
  }
`;

const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  overflow: hidden;
  min-width: 350px;
  max-width: 400px;
  
  @media (max-width: 1400px) {
    min-width: 320px;
    max-width: 320px;
  }
  
  @media (max-width: 1200px) {
    min-width: 300px;
    max-width: 300px;
  }
`;

const AlertFeed = styled.div`
  flex: 1;
  background: ${colors.cardBg};
  border-radius: 12px;
  border: 1px solid ${colors.primary};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(20, 184, 166, 0.1);
  min-height: 400px;
  max-height: calc(100vh - 250px);
`;

const AlertHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${colors.primary};
  background: rgba(20, 184, 166, 0.1);
  backdrop-filter: blur(5px);
  
  h3 {
    margin: 0;
    color: ${colors.primary};
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: 'Orbitron', sans-serif;
    text-shadow: 0 0 8px ${colors.textGlow};
  }
`;

const AlertList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(20, 184, 166, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
    border-radius: 4px;
    box-shadow: 0 0 5px ${colors.primaryGlow};
  }
`;

const AlertItem = styled.div<{ priority: string; status: string }>`
  background: rgba(30, 30, 30, 0.95);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-left: 4px solid ${props => {
    switch(props.priority) {
      case 'critical': return colors.danger;
      case 'high': return colors.warning;
      case 'medium': return colors.accent;
      case 'low': return colors.primary;
      default: return colors.gray500;
    }
  }};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  opacity: ${props => props.status === 'resolved' ? 0.7 : 1};
  backdrop-filter: blur(5px);
  border: 1px solid rgba(20, 184, 166, 0.1);
  
  &:hover {
    background: rgba(20, 184, 166, 0.05);
    transform: translateX(4px) translateY(-2px);
    border-color: ${colors.primary};
    box-shadow: 0 4px 15px rgba(20, 184, 166, 0.2);
  }
  
  .alert-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    
    .type {
      font-weight: 600;
      color: ${colors.primary};
      font-family: 'Orbitron', sans-serif;
    }
    
    .time {
      font-size: 0.8rem;
      color: ${colors.gray400};
    }
  }
  
  .description {
    font-size: 0.9rem;
    color: ${colors.gray200};
    margin-bottom: 0.5rem;
    line-height: 1.4;
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  background: ${props => {
    switch(props.variant) {
      case 'primary': return `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`;
      case 'secondary': return 'rgba(20, 184, 166, 0.1)';
      case 'danger': return `linear-gradient(135deg, ${colors.danger}, #FF6B6B)`;
    }
  }};
  
  color: ${props => {
    switch(props.variant) {
      case 'primary': return colors.white;
      case 'secondary': return colors.primary;
      case 'danger': return colors.white;
    }
  }};
  
  border: 1px solid ${props => {
    switch(props.variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.primary;
      case 'danger': return colors.danger;
    }
  }};
  
  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: ${props => {
      switch(props.variant) {
        case 'primary': return `0 4px 15px ${colors.primaryGlow}`;
        case 'secondary': return `0 4px 15px ${colors.primaryGlow}`;
        case 'danger': return '0 4px 15px rgba(239, 68, 68, 0.3)';
      }
    }};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const GuardPanel = styled.div`
  background: ${colors.cardBg};
  border-radius: 12px;
  border: 1px solid ${colors.primary};
  padding: 1rem;
  height: 300px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(20, 184, 166, 0.1);
  
  h3 {
    margin: 0 0 1rem 0;
    color: ${colors.primary};
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: 'Orbitron', sans-serif;
    text-shadow: 0 0 8px ${colors.textGlow};
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
  background: rgba(30, 30, 30, 0.8);
  border-radius: 8px;
  border-left: 3px solid ${props => {
    switch(props.status) {
      case 'on_duty': return colors.success;
      case 'responding': return colors.warning;
      case 'break': return colors.accent;
      default: return colors.gray500;
    }
  }};
  border: 1px solid rgba(20, 184, 166, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(20, 184, 166, 0.05);
    border-color: ${colors.primary};
    transform: translateX(2px);
  }
  
  .guard-info {
    .name {
      font-weight: 500;
      color: ${colors.gray100};
      font-family: 'Orbitron', sans-serif;
    }
    
    .zone {
      font-size: 0.8rem;
      color: ${colors.gray400};
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

// MAIN COMPONENT
const EnhancedLiveMonitoringDashboard: React.FC = () => {
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  
  // Enhanced AI dispatch system
  const {
    handleEnhancedAcknowledgeAlert,
    handleEnhancedDispatchGuard,
    handleEnhancedDigitalZoom,
    handleEnhancedAIVoiceResponse,
    processingStates
  } = useEnhancedAIDispatchSystem();
  
  // State management
  const [cameraStreams, setCameraStreams] = useState<EnhancedCameraStream[]>([]);
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [guards, setGuards] = useState<GuardStatus[]>([]);
  const [aiSystemStatus, setAISystemStatus] = useState({
    model_loaded: false,
    active_streams: 0,
    processing: false
  });
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  // Visual Alerts State
  const [visualAlerts, setVisualAlerts] = useState<VisualAlert[]>([]);
  const [alertManagerEnabled, setAlertManagerEnabled] = useState(true);
  
  // Camera Feed Management
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [cameraFeeds, setCameraFeeds] = useState<Record<string, string>>({});
  
  // System Control States
  const [systemControls, setSystemControls] = useState({
    masterAI: true,
    recording: false,
    audioMonitoring: true,
    autoDispatch: false,
    enhanced_mode: false
  });

  // Initialize enhanced demo data
  useEffect(() => {
    // Enhanced demo camera streams with full capabilities
    setCameraStreams([
      {
        camera_id: 'cam_entrance_1',
        name: 'Main Entrance',
        location: 'Building A - Lobby',
        rtsp_url: 'rtsp://demo.url/stream1',
        status: 'online',
        guard_zone: 'Zone A',
        dvr_connected: false,
        feed_url: undefined,
        stream_quality: 'high',
        capabilities: {
          supports_ptz: true,
          supports_digital_zoom: true,
          supports_audio_output: true,
          supports_presets: true,
          supports_recording: true,
          supports_audio_input: true
        },
        audio_enabled: true,
        recording_enabled: false,
        ai_monitoring_enabled: true
      },
      {
        camera_id: 'cam_parking_1',
        name: 'Parking Garage',
        location: 'Underground Level 1',
        rtsp_url: 'rtsp://demo.url/stream2', 
        status: 'online',
        guard_zone: 'Zone B',
        dvr_connected: true,
        feed_url: '/demo-feed-parking',
        stream_quality: 'medium',
        capabilities: {
          supports_ptz: true,
          supports_digital_zoom: true,
          supports_audio_output: false,
          supports_presets: true,
          supports_recording: true,
          supports_audio_input: false
        },
        audio_enabled: false,
        recording_enabled: true,
        ai_monitoring_enabled: true
      },
      {
        camera_id: 'cam_elevator_1',
        name: 'Elevator Bank',
        location: 'Building A - Floor 1',
        rtsp_url: 'rtsp://demo.url/stream3',
        status: 'online',
        guard_zone: 'Zone A',
        dvr_connected: false,
        feed_url: undefined,
        stream_quality: 'high',
        capabilities: {
          supports_ptz: false,
          supports_digital_zoom: true,
          supports_audio_output: true,
          supports_presets: false,
          supports_recording: true,
          supports_audio_input: true
        },
        audio_enabled: true,
        recording_enabled: false,
        ai_monitoring_enabled: true
      },
      {
        camera_id: 'cam_rooftop_1',
        name: 'Rooftop Access',
        location: 'Building A - Roof',
        rtsp_url: 'rtsp://demo.url/stream4',
        status: 'offline',
        guard_zone: 'Zone C',
        dvr_connected: false,
        feed_url: undefined,
        stream_quality: 'low',
        capabilities: {
          supports_ptz: true,
          supports_digital_zoom: true,
          supports_audio_output: true,
          supports_presets: true,
          supports_recording: true,
          supports_audio_input: true
        },
        audio_enabled: false,
        recording_enabled: false,
        ai_monitoring_enabled: false
      }
    ]);

    // Demo guards with enhanced status
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

  // Enhanced DVR Stream Connection Functions
  const connectDVRStream = useCallback(async (cameraId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/cameras/${cameraId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stream_type: 'dvr', auto_detect: true })
      });
      
      if (response.ok) {
        const result = await response.json();
        setCameraFeeds(prev => ({ ...prev, [cameraId]: result.stream_url }));
        
        setCameraStreams(prev => prev.map(stream => 
          stream.camera_id === cameraId 
            ? { ...stream, feed_url: result.stream_url, dvr_connected: true, status: 'online' }
            : stream
        ));
        
        toast({
          title: "✅ DVR Connected",
          description: `Camera ${cameraId} DVR stream connected successfully`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('DVR connection error:', error);
      toast({
        title: "❌ DVR Connection Failed",
        description: `Failed to connect DVR stream for camera ${cameraId}`,
        variant: "destructive"
      });
    }
  }, [toast]);

  const toggleDVRStream = useCallback(async (cameraId: string) => {
    const stream = cameraStreams.find(s => s.camera_id === cameraId);
    if (stream?.dvr_connected) {
      setCameraStreams(prev => prev.map(s => 
        s.camera_id === cameraId 
          ? { ...s, dvr_connected: false, feed_url: undefined }
          : s
      ));
    } else {
      await connectDVRStream(cameraId);
    }
  }, [cameraStreams, connectDVRStream]);

  const simulateCameraFeed = useCallback((cameraId: string) => {
    createDemoVisualAlert(cameraId);
    
    setCameraStreams(prev => prev.map(stream => 
      stream.camera_id === cameraId 
        ? { ...stream, feed_url: '/demo-feed', status: 'online', dvr_connected: true }
        : stream
    ));
    
    toast({
      title: "🎬 Demo Feed Activated",
      description: `Simulated camera feed for ${cameraId} with AI alert`,
      variant: "default"
    });
  }, [toast]);

  // Enhanced System Control Functions
  const toggleSystemControl = useCallback((controlType: keyof typeof systemControls) => {
    setSystemControls(prev => {
      const newState = { ...prev, [controlType]: !prev[controlType] };
      
      // Send control command to backend
      fetch('http://localhost:5000/api/ai/system-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ control: controlType, enabled: newState[controlType] })
      }).catch(error => console.log('System control update failed:', error));
      
      toast({
        title: `${controlType.replace('_', ' ').toUpperCase()} ${newState[controlType] ? 'ENABLED' : 'DISABLED'}`,
        description: `System control updated successfully`,
        variant: "default"
      });
      
      return newState;
    });
  }, [toast]);

  const emergencyShutdown = useCallback(() => {
    setSystemControls({
      masterAI: false,
      recording: false,
      audioMonitoring: false,
      autoDispatch: false,
      enhanced_mode: false
    });
    
    toast({
      title: "🚨 EMERGENCY SHUTDOWN",
      description: "All AI systems have been disabled",
      variant: "destructive"
    });
  }, [toast]);

  // Camera Control Functions
  const toggleCameraRecording = useCallback((cameraId: string) => {
    setCameraStreams(prev => prev.map(stream => 
      stream.camera_id === cameraId 
        ? { ...stream, recording_enabled: !stream.recording_enabled }
        : stream
    ));
  }, []);

  const toggleCameraAudio = useCallback((cameraId: string) => {
    setCameraStreams(prev => prev.map(stream => 
      stream.camera_id === cameraId 
        ? { ...stream, audio_enabled: !stream.audio_enabled }
        : stream
    ));
  }, []);

  // Enhanced Visual Alert Management
  const createVisualAlert = useCallback((alertData: Partial<VisualAlert>) => {
    const newAlert: VisualAlert = {
      id: `visual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      zoneId: alertData.zoneId || 'CAM-01',
      threatLevel: alertData.threatLevel || 'LOW',
      threatType: alertData.threatType || 'Detection',
      confidence: alertData.confidence || 75,
      position: alertData.position || { x: 0, y: 0, width: 100, height: 100 },
      timestamp: Date.now(),
      cameraId: alertData.cameraId || '',
    };
    
    setVisualAlerts(prev => [...prev, newAlert]);
    
    const timeout = {
      'WEAPON': 120000,
      'CRITICAL': 60000,
      'HIGH': 30000,
      'MEDIUM': 15000,
      'LOW': 10000,
      'SAFE': 5000
    }[newAlert.threatLevel] || 10000;
    
    setTimeout(() => {
      setVisualAlerts(prev => prev.filter(alert => alert.id !== newAlert.id));
    }, timeout);
    
    return newAlert;
  }, []);

  const createDemoVisualAlert = useCallback((cameraId: string) => {
    const demoAlerts = [
      { threatLevel: 'HIGH' as const, threatType: 'Person Detected', confidence: 87 },
      { threatLevel: 'MEDIUM' as const, threatType: 'Package Theft', confidence: 72 },
      { threatLevel: 'CRITICAL' as const, threatType: 'Violence Detected', confidence: 93 },
      { threatLevel: 'WEAPON' as const, threatType: 'Weapon Detected', confidence: 95 }
    ];
    
    const randomAlert = demoAlerts[Math.floor(Math.random() * demoAlerts.length)];
    const stream = cameraStreams.find(s => s.camera_id === cameraId);
    
    if (stream) {
      createVisualAlert({
        zoneId: stream.camera_id,
        threatLevel: randomAlert.threatLevel,
        threatType: randomAlert.threatType,
        confidence: randomAlert.confidence,
        position: { x: 0, y: 0, width: 100, height: 100 },
        cameraId: stream.camera_id
      });
    }
  }, [cameraStreams, createVisualAlert]);

  // Other existing functions... (handleAcknowledgeAlert, handleDispatchGuard, etc.)
  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    const operatorId = localStorage.getItem('user_id') || 'operator_001';
    const result = await handleEnhancedAcknowledgeAlert(alertId, operatorId);
    
    if (result.success) {
      setAlerts(prev => prev.map(alert => 
        alert.alert_id === alertId 
          ? { 
              ...alert, 
              status: 'acknowledged',
              acknowledged_by: operatorId,
              acknowledged_at: new Date().toISOString()
            }
          : alert
      ));
    }
  }, [handleEnhancedAcknowledgeAlert]);

  const handleDispatchGuard = useCallback(async (alertId: string, guardId?: string) => {
    const targetGuardId = guardId || guards.find(g => g.status === 'on_duty')?.guard_id;
    if (!targetGuardId) {
      toast({
        title: "❌ No Available Guards",
        description: "No guards are currently available for dispatch.",
        variant: "destructive"
      });
      return;
    }

    const result = await handleEnhancedDispatchGuard(alertId, targetGuardId, {
      priority: alerts.find(a => a.alert_id === alertId)?.priority === 'critical' ? 'emergency' : 'normal',
      route_optimization: true,
      backup_required: alerts.find(a => a.alert_id === alertId)?.priority === 'critical'
    });
    
    if (result.success) {
      setAlerts(prev => prev.map(alert => 
        alert.alert_id === alertId 
          ? { ...alert, status: 'dispatched', assigned_guard: targetGuardId }
          : alert
      ));
      
      setGuards(prev => prev.map(guard => 
        guard.guard_id === targetGuardId 
          ? { ...guard, status: 'responding', active_alerts: guard.active_alerts + 1 }
          : guard
      ));
    }
  }, [handleEnhancedDispatchGuard, guards, alerts, toast]);

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
        {/* Visual Alert Manager - Professional Integration */}
        {alertManagerEnabled && (
          <AlertManager
            enableAudio={systemControls.audioMonitoring}
            enableVisual={true}
            showControlPanel={true}
            maxAlerts={16}
            onAlertInteraction={(alertData) => {
              console.log('🚨 Alert interaction:', alertData);
            }}
          />
        )}

        {/* Visual Alert Overlays for Camera Feeds */}
        {visualAlerts.map(alert => (
          <BlinkingBorderOverlay
            key={alert.id}
            zoneId={alert.zoneId}
            threatLevel={alert.threatLevel}
            threatType={alert.threatType}
            confidence={alert.confidence}
            position={alert.position}
            intensity={alert.threatLevel === 'WEAPON' ? 2 : 1}
            showIndicator={true}
            showConfidence={true}
            showZoneId={true}
            isActive={true}
            onAlertClick={(alertData) => {
              console.log('🖱️ Visual alert clicked:', alertData);
            }}
          />
        ))}

        {/* Top Navigation Bar */}
        <TopBar>
          <LogoSection>
            <Shield size={24} color={colors.primary} />
            <h1>APEX AI Live Monitoring</h1>
          </LogoSection>
          
          <StatusIndicators>
            <StatusItem status={connectionStatus === 'connected' ? 'online' : 'offline'}>
              <div className="indicator" />
              AI System: {connectionStatus}
            </StatusItem>
            
            <StatusItem status={alertManagerEnabled ? 'online' : 'offline'}>
              <Activity size={16} />
              Visual Alerts: {alertManagerEnabled ? 'ON' : 'OFF'}
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

        {/* Enhanced Physical Control Bar */}
        <ControlBar>
          <ControlSection>
            <ControlButton 
              active={systemControls.masterAI}
              onClick={() => toggleSystemControl('masterAI')}
            >
              <Zap size={16} />
              Master AI: {systemControls.masterAI ? 'ON' : 'OFF'}
            </ControlButton>
            
            <ControlButton 
              active={systemControls.recording}
              onClick={() => toggleSystemControl('recording')}
              variant={systemControls.recording ? 'warning' : undefined}
            >
              {systemControls.recording ? <Pause size={16} /> : <Play size={16} />}
              Recording: {systemControls.recording ? 'ON' : 'OFF'}
            </ControlButton>
            
            <ControlButton 
              active={systemControls.audioMonitoring}
              onClick={() => toggleSystemControl('audioMonitoring')}
            >
              {systemControls.audioMonitoring ? <Volume2 size={16} /> : <VolumeX size={16} />}
              Audio: {systemControls.audioMonitoring ? 'ON' : 'OFF'}
            </ControlButton>
          </ControlSection>
          
          <ControlSection>
            <ControlButton 
              active={systemControls.autoDispatch}
              onClick={() => toggleSystemControl('autoDispatch')}
              variant={systemControls.autoDispatch ? 'warning' : undefined}
            >
              <Navigation size={16} />
              Auto-Dispatch: {systemControls.autoDispatch ? 'ON' : 'OFF'}
            </ControlButton>
            
            <ControlButton 
              active={systemControls.enhanced_mode}
              onClick={() => toggleSystemControl('enhanced_mode')}
            >
              <Monitor size={16} />
              Enhanced Mode: {systemControls.enhanced_mode ? 'ON' : 'OFF'}
            </ControlButton>
            
            <ControlButton 
              onClick={emergencyShutdown}
              variant="danger"
            >
              <Power size={16} />
              Emergency Stop
            </ControlButton>
          </ControlSection>
        </ControlBar>

        {/* Main Dashboard Content */}
        <MainContent>
          {/* Enhanced Camera Grid */}
          <CameraGrid>
            {cameraStreams.map((stream) => {
              const hasActiveAlert = alerts.some(alert => 
                alert.camera_id === stream.camera_id && alert.status === 'pending'
              );
              const alertLevel = hasActiveAlert ? 
                alerts.find(alert => alert.camera_id === stream.camera_id)?.priority : 
                undefined;
              
              const hasVisualAlert = visualAlerts.some(alert => alert.cameraId === stream.camera_id);
              const visualAlert = visualAlerts.find(alert => alert.cameraId === stream.camera_id);

              return (
                <CameraFeed 
                  key={stream.camera_id} 
                  alertLevel={alertLevel || visualAlert?.threatLevel} 
                  hasAlert={hasActiveAlert || hasVisualAlert}
                  isRecording={stream.recording_enabled}
                  dvr_connected={stream.dvr_connected}
                >
                  <CameraHeader>
                    <div className="camera-info">
                      <div>
                        <div className="name">{stream.name}</div>
                        <div className="location">{stream.location}</div>
                      </div>
                    </div>
                    
                    <div className="status-badges">
                      {stream.status === 'online' && stream.ai_monitoring_enabled && (
                        <StatusBadge type="ai">AI Active</StatusBadge>
                      )}
                      {stream.dvr_connected && <StatusBadge type="dvr">DVR</StatusBadge>}
                      {stream.recording_enabled && <StatusBadge type="recording">REC</StatusBadge>}
                      {stream.audio_enabled && <StatusBadge type="audio">Audio</StatusBadge>}
                      {(hasActiveAlert || hasVisualAlert) && (
                        <StatusBadge type="alert">
                          {visualAlert?.threatLevel || alertLevel || 'Alert'}
                        </StatusBadge>
                      )}
                      <StatusBadge type="guard">{stream.guard_zone}</StatusBadge>
                    </div>
                  </CameraHeader>

                  <VideoFrame>
                    {stream.status === 'online' ? (
                      <>
                        {stream.feed_url ? (
                          <video
                            autoPlay
                            muted
                            onError={(e) => {
                              console.log(`Camera feed error for ${stream.camera_id}:`, e);
                              setVideoErrors(prev => ({ ...prev, [stream.camera_id]: true }));
                            }}
                            onLoadStart={() => {
                              setVideoErrors(prev => ({ ...prev, [stream.camera_id]: false }));
                            }}
                          >
                            <source src={stream.feed_url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            border: `1px solid ${colors.primary}`,
                            borderRadius: '4px'
                          }}>
                            <Camera size={48} color={colors.primary} style={{ marginBottom: '1rem' }} />
                            
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.primary }}>
                                {stream.name}
                              </div>
                              <div style={{ fontSize: '0.9rem', color: colors.gray400, marginTop: '0.5rem' }}>
                                {stream.status.toUpperCase()} • Ready for DVR Connection
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => connectDVRStream(stream.camera_id)}
                                style={{
                                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                                  color: colors.white,
                                  border: 'none',
                                  fontSize: '0.8rem',
                                  padding: '0.4rem 0.8rem'
                                }}
                              >
                                Connect DVR
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => simulateCameraFeed(stream.camera_id)}
                                style={{
                                  background: 'rgba(20, 184, 166, 0.1)',
                                  color: colors.primary,
                                  border: `1px solid ${colors.primary}`,
                                  fontSize: '0.8rem',
                                  padding: '0.4rem 0.8rem'
                                }}
                              >
                                Demo Feed + Alert
                              </Button>
                            </div>
                            
                            <div style={{
                              position: 'absolute',
                              bottom: '0.5rem',
                              right: '0.5rem',
                              fontSize: '0.7rem',
                              color: colors.gray500,
                              background: 'rgba(0, 0, 0, 0.7)',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px'
                            }}>
                              {videoErrors[stream.camera_id] ? 'Connection Error' : 'Ready for Stream'}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '1rem',
                        color: colors.gray500 
                      }}>
                        <WifiOff size={48} />
                        <div>Camera Offline</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDVRStream(stream.camera_id)}
                          style={{ color: colors.warning, border: `1px solid ${colors.warning}` }}
                        >
                          <RotateCcw size={14} />
                          Retry Connection
                        </Button>
                      </div>
                    )}
                  </VideoFrame>

                  {/* Enhanced Camera Controls Overlay */}
                  <CameraControlsOverlay>
                    <div className="controls-row">
                      <div className="control-group">
                        {stream.capabilities.supports_digital_zoom && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => createDemoVisualAlert(stream.camera_id)}
                            title="AI-Enhanced Digital Zoom"
                            style={{ color: colors.primary, border: `1px solid ${colors.primary}` }}
                          >
                            <Maximize2 size={14} />
                          </Button>
                        )}
                        
                        {stream.capabilities.supports_audio_output && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleCameraAudio(stream.camera_id)}
                            title="Toggle Audio Output"
                            style={{ 
                              color: stream.audio_enabled ? colors.success : colors.gray500,
                              border: `1px solid ${stream.audio_enabled ? colors.success : colors.gray500}`
                            }}
                          >
                            {stream.audio_enabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                          </Button>
                        )}
                        
                        {stream.capabilities.supports_recording && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleCameraRecording(stream.camera_id)}
                            title="Toggle Recording"
                            style={{ 
                              color: stream.recording_enabled ? colors.danger : colors.gray500,
                              border: `1px solid ${stream.recording_enabled ? colors.danger : colors.gray500}`
                            }}
                          >
                            {stream.recording_enabled ? <Pause size={14} /> : <Play size={14} />}
                          </Button>
                        )}
                      </div>
                      
                      <div className="control-group">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleDVRStream(stream.camera_id)}
                          title="Toggle DVR Stream Connection"
                          style={{ 
                            color: stream.dvr_connected ? colors.success : colors.gray500,
                            border: `1px solid ${stream.dvr_connected ? colors.success : colors.gray500}`
                          }}
                        >
                          <Activity size={14} />
                        </Button>
                      </div>
                    </div>
                  </CameraControlsOverlay>
                </CameraFeed>
              );
            })}
          </CameraGrid>

          {/* Enhanced Right Panel */}
          <RightPanel>
            {/* Alert Feed */}
            <AlertFeed>
              <AlertHeader>
                <h3>
                  <AlertTriangle size={20} />
                  Live Alerts ({pendingAlerts} pending)
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAlertManagerEnabled(!alertManagerEnabled)}
                    title="Toggle Visual Alert System"
                    style={{ 
                      color: alertManagerEnabled ? colors.success : colors.gray500,
                      border: `1px solid ${alertManagerEnabled ? colors.success : colors.gray500}`
                    }}
                  >
                    <Settings size={12} />
                  </Button>
                </div>
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
                            disabled={processingStates[alert.alert_id]}
                          >
                            {processingStates[alert.alert_id] ? (
                              <div className="animate-spin w-3 h-3 border border-black rounded-full border-t-transparent" />
                            ) : (
                              <Eye size={12} />
                            )}
                            Acknowledge
                          </ActionButton>
                          <ActionButton 
                            variant="secondary"
                            onClick={() => handleDispatchGuard(alert.alert_id)}
                            disabled={processingStates[`dispatch_${alert.alert_id}`]}
                          >
                            {processingStates[`dispatch_${alert.alert_id}`] ? (
                              <div className="animate-spin w-3 h-3 border border-white rounded-full border-t-transparent" />
                            ) : (
                              <Navigation size={12} />
                            )}
                            Dispatch
                          </ActionButton>
                        </>
                      )}
                      
                      {alert.status === 'acknowledged' && (
                        <ActionButton 
                          variant="secondary"
                          onClick={() => handleDispatchGuard(alert.alert_id)}
                          disabled={processingStates[`dispatch_${alert.alert_id}`]}
                        >
                          {processingStates[`dispatch_${alert.alert_id}`] ? (
                            <div className="animate-spin w-3 h-3 border border-white rounded-full border-t-transparent" />
                          ) : (
                            <Radio size={12} />
                          )}
                          Dispatch Guard
                        </ActionButton>
                      )}
                      
                      {alert.status === 'dispatched' && (
                        <span style={{ color: colors.warning, fontSize: '0.8rem' }}>
                          ⏱ Guard En Route
                        </span>
                      )}
                    </div>
                  </AlertItem>
                ))}
                
                {alerts.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    color: colors.gray500, 
                    padding: '2rem',
                    fontStyle: 'italic'
                  }}>
                    No alerts at this time. System monitoring...
                  </div>
                )}
              </AlertList>
            </AlertFeed>

            {/* Enhanced Guard Status Panel */}
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
                          background: colors.warning, 
                          color: colors.black,
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

export default EnhancedLiveMonitoringDashboard;
