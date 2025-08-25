// apex_ai_desktop_app/src/components/VideoStream/VideoStreamBridge.tsx
/**
 * VIDEO STREAM BRIDGE COMPONENT
 * =============================
 * Core component that bridges Python video capture system to React frontend
 * Provides real-time video streaming with WebSocket integration
 * 
 * MASTER PROMPT v54.6 COMPLIANCE:
 * - TypeScript with proper interfaces and type safety
 * - WebSocket-based video streaming
 * - Integration with existing AI detection system
 * - Support for screen capture and RTSP streams
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';

// ===========================
// TYPES & INTERFACES
// ===========================

interface VideoSource {
  id: string;
  name: string;
  type: 'screen_capture' | 'rtsp' | 'webcam' | 'file';
  url?: string;
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  active: boolean;
  lastFrame?: string;
}

interface VideoFrame {
  source_id: string;
  frame_data: string; // Base64 encoded image
  timestamp: number;
  metadata?: {
    detections?: any[];
    faces?: any[];
    threats?: any[];
  };
}

interface VideoStreamBridgeProps {
  onFrameReceived?: (frame: VideoFrame) => void;
  onDetectionReceived?: (detection: any) => void;
  onSourceStatusChange?: (sourceId: string, status: 'connected' | 'disconnected' | 'error') => void;
  autoStart?: boolean;
  enableAI?: boolean;
}

interface WebSocketMessage {
  type: 'video_frame' | 'detection' | 'status' | 'error' | 'sources_list';
  data: any;
}

// ===========================
// STYLED COMPONENTS
// ===========================

const BridgeContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const StatusOverlay = styled.div<{ visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.spacing.md};
  display: ${({ visible }) => visible ? 'flex' : 'none'};
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const StatusIndicator = styled.div<{ status: 'connected' | 'disconnected' | 'error' | 'connecting' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ status, theme }) => {
    switch (status) {
      case 'connected': return theme.colors.success;
      case 'connecting': return theme.colors.warning;
      case 'disconnected': return theme.colors.textMuted;
      case 'error': return theme.colors.error;
      default: return theme.colors.border;
    }
  }};
  color: ${({ theme }) => theme.colors.background};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  position: relative;
  
  /* Status icon using CSS content */
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: currentColor;
    margin-right: 4px;
    display: inline-block;
  }
`;

const ControlsPanel = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  ${({ variant, theme }) => {
    switch (variant) {
      case 'primary':
        return `
          background-color: ${theme.colors.primary};
          color: ${theme.colors.background};
          &:hover { background-color: ${theme.colors.primaryDark}; }
        `;
      case 'danger':
        return `
          background-color: ${theme.colors.error};
          color: ${theme.colors.background};
          &:hover { background-color: #dc2626; }
        `;
      default:
        return `
          background-color: ${theme.colors.backgroundLight};
          color: ${theme.colors.text};
          border: 1px solid ${theme.colors.border};
          &:hover { background-color: ${theme.colors.backgroundCard}; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const VideoCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #000;
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const DebugPanel = styled.div<{ visible: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.9);
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.spacing.sm};
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  display: ${({ visible }) => visible ? 'block' : 'none'};
  max-height: 200px;
  overflow-y: auto;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const LogEntry = styled.div<{ level: 'info' | 'warn' | 'error' }>`
  color: ${({ level, theme }) => {
    switch (level) {
      case 'error': return theme.colors.error;
      case 'warn': return theme.colors.warning;
      default: return theme.colors.textMuted;
    }
  }};
  margin-bottom: 2px;
`;

// ===========================
// MAIN COMPONENT
// ===========================

const VideoStreamBridge: React.FC<VideoStreamBridgeProps> = ({
  onFrameReceived,
  onDetectionReceived,
  onSourceStatusChange,
  autoStart = true,
  enableAI = true
}) => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [availableSources, setAvailableSources] = useState<VideoSource[]>([]);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [debugLogs, setDebugLogs] = useState<Array<{ timestamp: number; level: 'info' | 'warn' | 'error'; message: string }>>([]);
  const [frameCount, setFrameCount] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fpsCounterRef = useRef<{ lastTime: number; frames: number }>({ lastTime: Date.now(), frames: 0 });
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add debug log entry
  const addDebugLog = useCallback((level: 'info' | 'warn' | 'error', message: string) => {
    setDebugLogs(prev => [
      ...prev.slice(-50), // Keep only last 50 logs
      { timestamp: Date.now(), level, message }
    ]);
  }, []);

  // Calculate FPS
  const updateFPS = useCallback(() => {
    const now = Date.now();
    const elapsed = now - fpsCounterRef.current.lastTime;
    
    if (elapsed >= 1000) {
      setFps(fpsCounterRef.current.frames);
      fpsCounterRef.current.frames = 0;
      fpsCounterRef.current.lastTime = now;
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    addDebugLog('info', 'Attempting to connect to video stream server...');

    try {
      // Connect to Python AI Engine WebSocket
      wsRef.current = new WebSocket('ws://localhost:8765/video-stream');

      wsRef.current.onopen = () => {
        setConnectionStatus('connected');
        addDebugLog('info', 'Connected to video stream server');
        
        // Request available video sources
        wsRef.current?.send(JSON.stringify({
          type: 'get_sources',
          data: {}
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          addDebugLog('error', `Failed to parse WebSocket message: ${error}`);
        }
      };

      wsRef.current.onclose = () => {
        setConnectionStatus('disconnected');
        addDebugLog('warn', 'Disconnected from video stream server');
        
        // Auto-reconnect after 3 seconds
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (connectionStatus !== 'connected') {
            connect();
          }
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        setConnectionStatus('error');
        addDebugLog('error', `WebSocket error: ${error}`);
      };

    } catch (error) {
      setConnectionStatus('error');
      addDebugLog('error', `Connection failed: ${error}`);
    }
  }, [connectionStatus, addDebugLog]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'sources_list':
        setAvailableSources(message.data.sources || []);
        addDebugLog('info', `Received ${message.data.sources?.length || 0} video sources`);
        break;

      case 'video_frame':
        handleVideoFrame(message.data);
        break;

      case 'detection':
        addDebugLog('info', `Detection: ${message.data.type} (confidence: ${message.data.confidence})`);
        onDetectionReceived?.(message.data);
        break;

      case 'status':
        const { source_id, status } = message.data;
        addDebugLog('info', `Source ${source_id} status: ${status}`);
        onSourceStatusChange?.(source_id, status);
        break;

      case 'error':
        addDebugLog('error', `Server error: ${message.data.message}`);
        break;

      default:
        addDebugLog('warn', `Unknown message type: ${message.type}`);
    }
  }, [onDetectionReceived, onSourceStatusChange, addDebugLog]);

  // Handle incoming video frame
  const handleVideoFrame = useCallback((frameData: VideoFrame) => {
    try {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Create image from base64 data
      const img = new Image();
      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the frame
        ctx.drawImage(img, 0, 0);
        
        // Draw detection overlays if available
        if (frameData.metadata?.detections) {
          drawDetections(ctx, frameData.metadata.detections, img.width, img.height);
        }

        // Update frame counter
        setFrameCount(prev => prev + 1);
        fpsCounterRef.current.frames++;
        updateFPS();

        // Notify parent component
        onFrameReceived?.(frameData);
      };
      
      img.src = `data:image/jpeg;base64,${frameData.frame_data}`;
      
    } catch (error) {
      addDebugLog('error', `Failed to process video frame: ${error}`);
    }
  }, [onFrameReceived, updateFPS, addDebugLog]);

  // Draw AI detection overlays
  const drawDetections = useCallback((
    ctx: CanvasRenderingContext2D, 
    detections: any[], 
    width: number, 
    height: number
  ) => {
    detections.forEach(detection => {
      const { bbox, class_name, confidence } = detection;
      if (!bbox) return;

      // Convert normalized coordinates to pixel coordinates
      const x = bbox.x * width;
      const y = bbox.y * height;
      const w = bbox.width * width;
      const h = bbox.height * height;

      // Draw bounding box
      ctx.strokeStyle = getDetectionColor(class_name);
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      // Draw label background
      const label = `${class_name} (${(confidence * 100).toFixed(1)}%)`;
      ctx.font = '14px Arial';
      const labelWidth = ctx.measureText(label).width;
      
      ctx.fillStyle = getDetectionColor(class_name);
      ctx.fillRect(x, y - 25, labelWidth + 10, 25);

      // Draw label text
      ctx.fillStyle = '#fff';
      ctx.fillText(label, x + 5, y - 8);
    });
  }, []);

  // Get color for detection type
  const getDetectionColor = useCallback((className: string): string => {
    switch (className.toLowerCase()) {
      case 'person': return '#00ff88';
      case 'weapon': return '#ff4444';
      case 'gun': return '#ff0000';
      case 'knife': return '#ff6600';
      case 'face': return '#00aaff';
      default: return '#ffaa00';
    }
  }, []);

  // Start video source
  const startVideoSource = useCallback((sourceId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addDebugLog('error', 'Not connected to video stream server');
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'start_source',
      data: { 
        source_id: sourceId,
        enable_ai: enableAI,
        detection_types: ['person', 'weapon', 'face']
      }
    }));

    setActiveSources(prev => [...prev.filter(id => id !== sourceId), sourceId]);
    addDebugLog('info', `Starting video source: ${sourceId}`);
  }, [enableAI, addDebugLog]);

  // Stop video source
  const stopVideoSource = useCallback((sourceId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: 'stop_source',
      data: { source_id: sourceId }
    }));

    setActiveSources(prev => prev.filter(id => id !== sourceId));
    addDebugLog('info', `Stopped video source: ${sourceId}`);
  }, [addDebugLog]);

  // Quick start screen capture
  const quickStartScreenCapture = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addDebugLog('error', 'Not connected to video stream server');
      return;
    }

    // Create screen capture source
    const screenSource: VideoSource = {
      id: 'screen_main',
      name: 'Main Screen Capture',
      type: 'screen_capture',
      active: false,
      region: { x: 0, y: 0, width: 1920, height: 1080 }
    };

    wsRef.current.send(JSON.stringify({
      type: 'create_screen_source',
      data: screenSource
    }));

    addDebugLog('info', 'Creating main screen capture source...');
  }, [addDebugLog]);

  // Initialize connection
  useEffect(() => {
    if (autoStart) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [autoStart, connect]);

  return (
    <BridgeContainer
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <VideoCanvas ref={canvasRef} />
      
      <StatusOverlay visible={showControls}>
        <StatusIndicator status={connectionStatus}>
          {connectionStatus.toUpperCase()}
          {connectionStatus === 'connected' && (
            <span style={{ marginLeft: '8px' }}>
              {fps} FPS | {frameCount} frames
            </span>
          )}
        </StatusIndicator>
        
        <ControlsPanel>
          {connectionStatus === 'disconnected' && (
            <Button variant="primary" onClick={connect}>
              🔌 Connect
            </Button>
          )}
          
          {connectionStatus === 'connected' && (
            <>
              <Button onClick={quickStartScreenCapture}>
                🖥️ Screen Capture
              </Button>
              
              <Button onClick={() => setShowDebug(!showDebug)}>
                🐛 Debug
              </Button>
              
              {activeSources.length > 0 && (
                <Button 
                  variant="danger" 
                  onClick={() => activeSources.forEach(stopVideoSource)}
                >
                  ⏹️ Stop All
                </Button>
              )}
            </>
          )}
        </ControlsPanel>
      </StatusOverlay>

      <DebugPanel visible={showDebug}>
        {debugLogs.slice(-20).map((log, index) => (
          <LogEntry key={index} level={log.level}>
            [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
          </LogEntry>
        ))}
      </DebugPanel>
    </BridgeContainer>
  );
};

export default VideoStreamBridge;