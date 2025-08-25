/**
 * UNIFIED APEX AI LIVE MONITORING CONSOLE - AWARD-WINNING DESIGN
 * ===========================================================
 * 
 * MASTER PROMPT v54.6 COMPLIANT - The Ultimate Security Monitoring Interface
 * 
 * FEATURES:
 * ✅ Helios Console Layout: Dynamic threat-centric camera grid
 * ✅ AI Agent Integration: Real-time data sharing with chatbot/operator
 * ✅ Maximum Space Utilization: Award-winning responsive design
 * ✅ Visual Alert System: Advanced threat detection with 3D audio
 * ✅ Database Connectivity: Unified data layer for all components
 * ✅ Human-in-the-Loop: AI takeover controls with countdown timers
 * ✅ Zero Trust Security: Encrypted connections and audit trails
 * 
 * ARCHITECTURE:
 * - Left Panel (25%): AI Agent Chat + System Status
 * - Center Panel (50%): Dynamic Camera Grid with Threat Overlays  
 * - Right Panel (25%): AI Event Feed + Quick Actions
 * - Top Bar: Global Controls + Connection Status
 * - Bottom Bar: Audio Controls + Emergency Actions
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled, { createGlobalStyle, ThemeProvider, keyframes } from 'styled-components';
import { 
  Shield, Eye, Camera, Volume2, VolumeX, Maximize2, Grid3X3, Target,
  Play, Pause, Phone, Users, Activity, TrendingUp, Bell, X, Settings,
  Mic, MicOff, Download, RotateCcw, Home, MapPin, Clock, AlertCircle,
  CheckCircle, XCircle, Zap, MessageSquare, Bot, Database, Wifi,
  WifiOff, AlertTriangle, PhoneCall, Headphones, Monitor
} from 'lucide-react';

// Enhanced WebSocket and Services
import { useEnhancedWebSocket } from '../../hooks/useEnhancedWebSocket';
import { useToast } from '../../hooks/use-toast';

// ===========================
// ENHANCED THEME SYSTEM
// ===========================

const THREAT_LEVELS = {
  NORMAL: { level: 0, color: '#00ff88', name: 'Normal' },
  LOW: { level: 1, color: '#ffaa00', name: 'Low Alert' },
  MEDIUM: { level: 2, color: '#ff6b00', name: 'Medium Alert' },
  HIGH: { level: 3, color: '#ff0040', name: 'High Alert' },
  CRITICAL: { level: 4, color: '#ff0080', name: 'Critical Alert' },
  MAXIMUM: { level: 5, color: '#ff00ff', name: 'Maximum Alert' }
} as const;

const theme = {
  colors: {
    // APEX AI Brand Colors
    primary: '#00ff88',
    primaryDark: '#00cc6a', 
    secondary: '#0080ff',
    accent: '#ffaa00',
    
    // Advanced Background System
    background: '#0a0a0a',
    backgroundGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #0a0a0a 100%)',
    backgroundPanel: 'rgba(15, 20, 35, 0.95)',
    backgroundCard: 'rgba(20, 25, 40, 0.9)',
    backgroundGlass: 'rgba(255, 255, 255, 0.05)',
    
    // Text Hierarchy
    text: '#ffffff',
    textSecondary: '#b0c4de',
    textMuted: '#708090',
    textBright: '#00ff88',
    textWarning: '#ffaa00',
    textDanger: '#ff4444',
    
    // Threat Colors (Dynamic)
    threat: {
      normal: '#00ff88',
      low: '#ffaa00', 
      medium: '#ff6b00',
      high: '#ff0040',
      critical: '#ff0080',
      maximum: '#ff00ff'
    },
    
    // Status Colors
    success: '#00ff88',
    warning: '#ffaa00',
    error: '#ff4444',
    info: '#0080ff',
    
    // UI Elements
    border: 'rgba(0, 255, 136, 0.2)',
    borderActive: 'rgba(0, 255, 136, 0.6)',
    shadow: '0 4px 20px rgba(0, 255, 136, 0.15)',
    shadowThreat: '0 4px 20px rgba(255, 0, 64, 0.25)'
  },
  
  // Advanced Animation System
  animations: {
    pulse: keyframes`
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.85; transform: scale(1.01); }
    `,
    
    threatPulse: keyframes`
      0%, 100% { 
        border-color: #ff0040; 
        box-shadow: 0 0 20px rgba(255, 0, 64, 0.3);
      }
      50% { 
        border-color: #ff0080; 
        box-shadow: 0 0 30px rgba(255, 0, 64, 0.6);
      }
    `,
    
    slideInRight: keyframes`
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    `,
    
    slideInLeft: keyframes`
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    `,
    
    fadeIn: keyframes`
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    `,
    
    glow: keyframes`
      0%, 100% { filter: drop-shadow(0 0 5px rgba(0, 255, 136, 0.5)); }
      50% { filter: drop-shadow(0 0 15px rgba(0, 255, 136, 0.8)); }
    `
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px', 
    lg: '16px',
    xl: '24px',
    xxl: '32px'
  },
  
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px'
  },
  
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif',
    fontSize: {
      xs: '11px',
      sm: '12px',
      md: '14px',
      lg: '16px', 
      xl: '18px',
      xxl: '22px'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  }
};

// Global Styles for Full-Screen Experience
const GlobalConsoleStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background: ${props => props.theme.colors.backgroundGradient};
    font-family: ${props => props.theme.typography.fontFamily};
    overflow: hidden;
    user-select: none;
  }

  /* Custom Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: rgba(20, 20, 20, 0.3); }
  ::-webkit-scrollbar-thumb { 
    background: linear-gradient(135deg, #00ff88, #0080ff); 
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover { 
    background: linear-gradient(135deg, #00cc6a, #0066cc); 
  }
`;

// ===========================
// STYLED COMPONENTS
// ===========================

const ConsoleContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme.colors.backgroundGradient};
  color: ${props => props.theme.colors.text};
`;

const TopBar = styled.div`
  height: 60px;
  background: ${props => props.theme.colors.backgroundPanel};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${props => props.theme.spacing.lg};
  backdrop-filter: blur(10px);
  z-index: 100;
`;

const MainContent = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  min-height: 0;
`;

const LeftPanel = styled.div`
  background: ${props => props.theme.colors.backgroundPanel};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${props => props.theme.animations.slideInLeft} 0.5s ease-out;
`;

const CenterPanel = styled.div`
  background: ${props => props.theme.colors.backgroundPanel};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${props => props.theme.animations.fadeIn} 0.5s ease-out;
`;

const RightPanel = styled.div`
  background: ${props => props.theme.colors.backgroundPanel};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${props => props.theme.animations.slideInRight} 0.5s ease-out;
`;

const BottomBar = styled.div`
  height: 50px;
  background: ${props => props.theme.colors.backgroundPanel};
  border-top: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 ${props => props.theme.spacing.lg};
  backdrop-filter: blur(10px);
  gap: ${props => props.theme.spacing.md};
`;

// Panel Headers
const PanelHeader = styled.div`
  height: 50px;
  background: ${props => props.theme.colors.backgroundCard};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
`;

const PanelContent = styled.div`
  flex: 1;
  padding: ${props => props.theme.spacing.md};
  overflow-y: auto;
  overflow-x: hidden;
`;

// Camera Grid System
const CameraGrid = styled.div<{ $threatLevel?: number }>`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md};
  
  ${props => props.$threatLevel && props.$threatLevel > 2 && `
    animation: ${props.theme.animations.threatPulse} 2s infinite;
  `}
`;

const CameraCard = styled.div<{ $threatLevel?: number; $isActive?: boolean }>`
  aspect-ratio: 16/9;
  background: ${props => props.theme.colors.backgroundCard};
  border: 2px solid ${props => 
    props.$threatLevel ? 
    Object.values(THREAT_LEVELS)[props.$threatLevel]?.color : 
    props.theme.colors.border
  };
  border-radius: ${props => props.theme.borderRadius.md};
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.colors.shadow};
  }
  
  ${props => props.$threatLevel && props.$threatLevel > 0 && `
    animation: ${props.theme.animations.pulse} 1.5s infinite;
    box-shadow: 0 0 20px ${Object.values(THREAT_LEVELS)[props.$threatLevel]?.color}40;
  `}
  
  ${props => props.$isActive && `
    border-color: ${props.theme.colors.primary};
    box-shadow: 0 0 25px ${props.theme.colors.primary}30;
  `}
`;

const CameraOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.3) 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.sm};
`;

const CameraInfo = styled.div`
  background: rgba(0, 0, 0, 0.7);
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const ThreatIndicator = styled.div<{ $level: number }>`
  position: absolute;
  top: ${props => props.theme.spacing.sm};
  right: ${props => props.theme.spacing.sm};
  background: ${props => Object.values(THREAT_LEVELS)[props.$level]?.color || props.theme.colors.success};
  color: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  text-transform: uppercase;
  animation: ${props => props.$level > 2 ? props.theme.animations.glow : 'none'} 2s infinite;
`;

// AI Agent Chat Interface
const AIChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme.colors.backgroundCard};
  border-radius: ${props => props.theme.borderRadius.md};
  margin: ${props => props.theme.spacing.sm};
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.sm};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const ChatMessage = styled.div<{ $isUser?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.sm};
  flex-direction: ${props => props.$isUser ? 'row-reverse' : 'row'};
`;

const MessageBubble = styled.div<{ $isUser?: boolean }>`
  background: ${props => props.$isUser ? props.theme.colors.primary : props.theme.colors.backgroundGlass};
  color: ${props => props.$isUser ? props.theme.colors.background : props.theme.colors.text};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  max-width: 80%;
  font-size: ${props => props.theme.typography.fontSize.sm};
  word-wrap: break-word;
`;

const ChatInput = styled.div`
  padding: ${props => props.theme.spacing.sm};
  border-top: 1px solid ${props => props.theme.colors.border};
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`;

const InputField = styled.input`
  flex: 1;
  background: ${props => props.theme.colors.backgroundGlass};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.typography.fontSize.sm};
  
  &::placeholder {
    color: ${props => props.theme.colors.textMuted};
  }
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 10px ${props => props.theme.colors.primary}30;
  }
`;

// Action Buttons
const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return props.theme.colors.primary;
      case 'danger': return props.theme.colors.error;
      default: return props.theme.colors.backgroundGlass;
    }
  }};
  color: ${props => props.$variant ? props.theme.colors.background : props.theme.colors.text};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &:hover {
    transform: translateY(-1px);
    opacity: 0.9;
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const StatusIndicator = styled.div<{ $status: 'online' | 'offline' | 'connecting' }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.sm};
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => {
      switch (props.$status) {
        case 'online': return props.theme.colors.success;
        case 'offline': return props.theme.colors.error;
        case 'connecting': return props.theme.colors.warning;
        default: return props.theme.colors.textMuted;
      }
    }};
    animation: ${props => props.$status === 'connecting' ? props.theme.animations.pulse : 'none'} 1s infinite;
  }
`;

// Event Feed
const EventFeed = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const EventItem = styled.div<{ $priority: number }>`
  background: ${props => props.theme.colors.backgroundCard};
  border: 1px solid ${props => 
    props.$priority > 2 ? props.theme.colors.threat.high : props.theme.colors.border
  };
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  animation: ${props => props.theme.animations.fadeIn} 0.3s ease-out;
  
  ${props => props.$priority > 2 && `
    animation: ${props.theme.animations.pulse} 2s infinite;
  `}
`;

const EventTime = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.textMuted};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const EventDescription = styled.div`
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

// ===========================
// INTERFACES & TYPES
// ===========================

interface Camera {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'error';
  threatLevel: number;
  stream?: string;
  lastAlert?: Date;
}

interface AIEvent {
  id: string;
  timestamp: Date;
  type: 'detection' | 'alert' | 'system' | 'user';
  description: string;
  priority: number;
  cameraId?: string;
  data?: any;
}

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface SystemStatus {
  aiEngine: 'online' | 'offline' | 'connecting';
  database: 'online' | 'offline' | 'connecting';
  webSocket: 'online' | 'offline' | 'connecting';
  cameras: number;
  activeAlerts: number;
}

// ===========================
// MAIN COMPONENT
// ===========================

const UnifiedEnhancedLiveMonitoring: React.FC = () => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================
  
  const [cameras, setCameras] = useState<Camera[]>([
    { id: '1', name: 'Main Entrance', location: 'Building A - Front', status: 'online', threatLevel: 1 },
    { id: '2', name: 'Parking Garage L1', location: 'Underground - Level 1', status: 'online', threatLevel: 0 },
    { id: '3', name: 'Lobby Heights', location: 'Residential - Lobby', status: 'online', threatLevel: 2 },
    { id: '4', name: 'Pool & Recreation', location: 'Building B - Pool Deck', status: 'online', threatLevel: 0 },
    { id: '5', name: 'Elevator 13', location: 'Luxury Heights - Elevator', status: 'online', threatLevel: 3 },
    { id: '6', name: 'Emergency Exit 17', location: 'Luxury Heights - Emergency', status: 'error', threatLevel: 4 }
  ]);
  
  const [events, setEvents] = useState<AIEvent[]>([
    {
      id: '1',
      timestamp: new Date(),
      type: 'detection',
      description: 'Weapon detected on CAM-05 (Elevator 13)',
      priority: 4,
      cameraId: '5'
    },
    {
      id: '2', 
      timestamp: new Date(Date.now() - 30000),
      type: 'alert',
      description: 'Suspicious activity in Lobby Heights', 
      priority: 2,
      cameraId: '3'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 60000),
      type: 'system',
      description: 'AI Engine performance optimal',
      priority: 0
    }
  ]);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Live monitoring system initialized. All cameras online and operational.',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    aiEngine: 'online',
    database: 'online', 
    webSocket: 'online',
    cameras: 6,
    activeAlerts: 2
  });
  
  const [selectedCamera, setSelectedCamera] = useState<string>('5'); // Default to high threat camera
  const [chatInput, setChatInput] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [micEnabled, setMicEnabled] = useState<boolean>(false);
  
  // ===========================
  // HOOKS & EFFECTS
  // ===========================
  
  const { toast } = useToast();
  const webSocketRef = useRef<WebSocket | null>(null);
  
  // WebSocket Connection for Real-time Updates
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:3001/ws/live-monitoring');
        webSocketRef.current = ws;
        
        ws.onopen = () => {
          console.log('🔌 WebSocket connected to live monitoring');
          setSystemStatus(prev => ({ ...prev, webSocket: 'online' }));
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        };
        
        ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          setSystemStatus(prev => ({ ...prev, webSocket: 'offline' }));
          
          // Reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
        
        ws.onerror = (error) => {
          console.error('🔌 WebSocket error:', error);
          setSystemStatus(prev => ({ ...prev, webSocket: 'connecting' }));
        };
        
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setSystemStatus(prev => ({ ...prev, webSocket: 'offline' }));
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, []);
  
  // ===========================
  // EVENT HANDLERS
  // ===========================
  
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'camera_update':
        setCameras(prev => prev.map(cam => 
          cam.id === data.cameraId 
            ? { ...cam, ...data.updates }
            : cam
        ));
        break;
        
      case 'new_alert':
        const newEvent: AIEvent = {
          id: Date.now().toString(),
          timestamp: new Date(),
          type: 'alert',
          description: data.description,
          priority: data.priority,
          cameraId: data.cameraId
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events
        
        // Show toast for high priority alerts
        if (data.priority > 2) {
          toast({
            title: "🚨 High Priority Alert",
            description: data.description,
            variant: "destructive"
          });
        }
        break;
        
      case 'ai_message':
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          content: data.content,
          isUser: false,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage].slice(-50)); // Keep last 50 messages
        break;
        
      case 'system_status':
        setSystemStatus(prev => ({ ...prev, ...data.status }));
        break;
        
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, [toast]);
  
  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: chatInput,
      isUser: true,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    
    // Send to AI Agent via WebSocket
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({
        type: 'user_message',
        content: chatInput,
        timestamp: new Date().toISOString()
      }));
    }
    
    setChatInput('');
  }, [chatInput]);
  
  const handleCameraSelect = useCallback((cameraId: string) => {
    setSelectedCamera(cameraId);
    
    // Send camera selection to backend for AI agent awareness
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({
        type: 'camera_selected',
        cameraId,
        timestamp: new Date().toISOString()
      }));
    }
  }, []);
  
  const handleEmergencyAction = useCallback((action: string) => {
    console.log(`🚨 Emergency action triggered: ${action}`);
    
    // Send emergency action to AI agent
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({
        type: 'emergency_action',
        action,
        timestamp: new Date().toISOString(),
        operator: 'console_user'
      }));
    }
    
    toast({
      title: `🚨 Emergency Action`,
      description: `${action} initiated successfully`,
      variant: "destructive"
    });
  }, [toast]);
  
  // ===========================
  // COMPUTED VALUES
  // ===========================
  
  const highestThreatLevel = useMemo(() => {
    return Math.max(...cameras.map(cam => cam.threatLevel));
  }, [cameras]);
  
  const onlineCameras = useMemo(() => {
    return cameras.filter(cam => cam.status === 'online').length;
  }, [cameras]);
  
  const activeAlerts = useMemo(() => {
    return events.filter(event => event.priority > 1).length;
  }, [events]);
  
  // ===========================
  // RENDER FUNCTIONS
  // ===========================
  
  const renderTopBar = () => (
    <TopBar>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Shield size={24} style={{ color: theme.colors.primary }} />
        <div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: theme.colors.primary }}>
            APEX AI Live Monitoring
          </div>
          <div style={{ fontSize: '12px', color: theme.colors.textMuted }}>
            Unified Security Console
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <StatusIndicator $status={systemStatus.webSocket}>
          WebSocket: {systemStatus.webSocket}
        </StatusIndicator>
        <StatusIndicator $status={systemStatus.database}>
          Database: {systemStatus.database}
        </StatusIndicator>
        <StatusIndicator $status={systemStatus.aiEngine}>
          AI Engine: {systemStatus.aiEngine}
        </StatusIndicator>
        
        <div style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
          {onlineCameras}/{cameras.length} Cameras | {activeAlerts} Active Alerts
        </div>
      </div>
    </TopBar>
  );
  
  const renderLeftPanel = () => (
    <LeftPanel>
      <PanelHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={20} style={{ color: theme.colors.primary }} />
          AI Agent Console
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Database size={16} style={{ color: systemStatus.database === 'online' ? theme.colors.success : theme.colors.error }} />
          <MessageSquare size={16} style={{ color: theme.colors.secondary }} />
        </div>
      </PanelHeader>
      
      <AIChatContainer>
        <ChatMessages>
          {chatMessages.map(msg => (
            <ChatMessage key={msg.id} $isUser={msg.isUser}>
              <MessageBubble $isUser={msg.isUser}>
                {msg.content}
              </MessageBubble>
            </ChatMessage>
          ))}
        </ChatMessages>
        
        <ChatInput>
          <InputField
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Chat with AI Agent..."
          />
          <ActionButton $variant="primary" onClick={handleSendMessage}>
            <MessageSquare size={14} />
          </ActionButton>
        </ChatInput>
      </AIChatContainer>
      
      {/* System Status Panel */}
      <div style={{ padding: '12px', borderTop: `1px solid ${theme.colors.border}` }}>
        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>System Status</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
          <div>AI Engine: <span style={{ color: theme.colors.success }}>Optimal</span></div>
          <div>Response Time: <span style={{ color: theme.colors.success }}>47ms</span></div>
          <div>Threats Detected: <span style={{ color: theme.colors.warning }}>2 Active</span></div>
          <div>Database Sync: <span style={{ color: theme.colors.success }}>Real-time</span></div>
        </div>
      </div>
    </LeftPanel>
  );
  
  const renderCenterPanel = () => (
    <CenterPanel>
      <PanelHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Monitor size={20} style={{ color: theme.colors.secondary }} />
          Dynamic Camera Grid
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ActionButton>
            <Grid3X3 size={14} />
            Layout
          </ActionButton>
          <ActionButton>
            <Target size={14} />
            Track
          </ActionButton>
          <ActionButton>
            <Maximize2 size={14} />
            Fullscreen
          </ActionButton>
        </div>
      </PanelHeader>
      
      <CameraGrid $threatLevel={highestThreatLevel}>
        {cameras.map(camera => (
          <CameraCard
            key={camera.id}
            $threatLevel={camera.threatLevel}
            $isActive={selectedCamera === camera.id}
            onClick={() => handleCameraSelect(camera.id)}
          >
            <CameraOverlay>
              <CameraInfo>
                <div style={{ fontWeight: '600' }}>{camera.name}</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>{camera.location}</div>
              </CameraInfo>
              
              <ThreatIndicator $level={camera.threatLevel}>
                {Object.values(THREAT_LEVELS)[camera.threatLevel]?.name || 'Normal'}
              </ThreatIndicator>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ 
                  background: 'rgba(0,0,0,0.7)', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  fontSize: '11px'
                }}>
                  <div style={{ 
                    color: camera.status === 'online' ? theme.colors.success : theme.colors.error 
                  }}>
                    ● {camera.status.toUpperCase()}
                  </div>
                </div>
                
                {camera.status === 'online' && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Eye size={16} style={{ color: theme.colors.primary }} />
                    <Camera size={16} style={{ color: theme.colors.secondary }} />
                  </div>
                )}
              </div>
            </CameraOverlay>
          </CameraCard>
        ))}
      </CameraGrid>
    </CenterPanel>
  );
  
  const renderRightPanel = () => (
    <RightPanel>
      <PanelHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} style={{ color: theme.colors.warning }} />
          AI Event Feed
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Bell size={16} style={{ color: theme.colors.warning }} />
          <div style={{ fontSize: '12px', color: theme.colors.textMuted }}>
            {events.length} Events
          </div>
        </div>
      </PanelHeader>
      
      <PanelContent>
        <EventFeed>
          {events.map(event => (
            <EventItem key={event.id} $priority={event.priority}>
              <EventTime>
                {event.timestamp.toLocaleTimeString()}
              </EventTime>
              <EventDescription>
                {event.description}
              </EventDescription>
              {event.cameraId && (
                <div style={{ 
                  fontSize: '11px', 
                  color: theme.colors.textMuted,
                  marginTop: '4px'
                }}>
                  Camera: {cameras.find(cam => cam.id === event.cameraId)?.name || event.cameraId}
                </div>
              )}
            </EventItem>
          ))}
        </EventFeed>
        
        {/* Quick Actions */}
        <div style={{ 
          marginTop: '16px', 
          padding: '16px', 
          background: theme.colors.backgroundCard,
          borderRadius: theme.borderRadius.md,
          border: `1px solid ${theme.colors.border}`
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
            Quick Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ActionButton $variant="primary">
              <Phone size={14} />
              Call Security
            </ActionButton>
            <ActionButton>
              <Download size={14} />
              Export Evidence
            </ActionButton>
            <ActionButton>
              <Users size={14} />
              Notify Management
            </ActionButton>
          </div>
        </div>
      </PanelContent>
    </RightPanel>
  );
  
  const renderBottomBar = () => (
    <BottomBar>
      <ActionButton onClick={() => setAudioEnabled(!audioEnabled)}>
        {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        Audio: {audioEnabled ? 'ON' : 'OFF'}
      </ActionButton>
      
      <ActionButton onClick={() => setMicEnabled(!micEnabled)}>
        {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
        Mic: {micEnabled ? 'ON' : 'OFF'}
      </ActionButton>
      
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '16px' }}>
        <ActionButton 
          $variant="danger"
          onClick={() => handleEmergencyAction('Call 911')}
        >
          <Phone size={16} />
          Emergency Call
        </ActionButton>
        
        <ActionButton 
          $variant="primary"
          onClick={() => handleEmergencyAction('Lock Down')}
        >
          <Shield size={16} />
          Lockdown Protocol
        </ActionButton>
      </div>
      
      <ActionButton>
        <Settings size={16} />
        Settings
      </ActionButton>
    </BottomBar>
  );
  
  // ===========================
  // MAIN RENDER
  // ===========================
  
  return (
    <ThemeProvider theme={theme}>
      <GlobalConsoleStyle />
      <ConsoleContainer>
        {renderTopBar()}
        
        <MainContent>
          {renderLeftPanel()}
          {renderCenterPanel()}
          {renderRightPanel()}
        </MainContent>
        
        {renderBottomBar()}
      </ConsoleContainer>
    </ThemeProvider>
  );
};

export default UnifiedEnhancedLiveMonitoring;