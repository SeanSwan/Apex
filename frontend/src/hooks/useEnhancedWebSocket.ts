// APEX AI ENHANCED WEBSOCKET HOOK - SINGLETON WRAPPER
// ===================================================
// Thin React wrapper around singleton WebSocket manager
// Immune to React StrictMode and component lifecycle issues

import { useCallback, useEffect, useRef, useState, createContext, useContext } from 'react';
import { 
  webSocketManager, 
  MESSAGE_TYPES
} from '../services/webSocketManager';
import type { 
  WebSocketConfig, 
  ConnectionStats, 
  StreamRequest 
} from '../services/webSocketManager';

// Re-export types and constants for compatibility
export { MESSAGE_TYPES } from '../services/webSocketManager';
export type { WebSocketConfig, ConnectionStats, StreamRequest };

// Additional interface definitions
export interface AIDetection {
  detection_id: string;
  timestamp: string;
  detection_type: 'person' | 'vehicle' | 'weapon' | 'package' | 'animal';
  confidence: number;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  alert_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface FaceDetection {
  face_id: string;
  timestamp: string;
  person_id?: string;
  name?: string;
  confidence: number;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  is_known: boolean;
  threat_level: 'safe' | 'unknown' | 'watch_list' | 'threat';
}

// Enhanced WebSocket Hook - Singleton Wrapper (StrictMode Safe)
export const useEnhancedWebSocket = (config?: Partial<WebSocketConfig>) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStats['status']>('disconnected');
  const [stats, setStats] = useState<ConnectionStats>({
    status: 'disconnected',
    messagesReceived: 0,
    messagesSent: 0,
    reconnectAttempts: 0
  });
  
  // Refs to store handlers and prevent recreation
  const componentHandlers = useRef<Map<string, Function>>(new Map());
  const statsUpdateHandlerRef = useRef<() => void>();
  const statusUpdateHandlerRef = useRef<(data: any) => void>();

  // Configure the singleton manager if config provided
  useEffect(() => {
    if (config) {
      webSocketManager.configure(config);
    }
  }, [config]);

  // Update stats and status from singleton
  const updateStats = useCallback(() => {
    const managerStats = webSocketManager.getStats();
    setStats(managerStats);
    setConnectionStatus(managerStats.status);
  }, []);

  const handleStatusUpdate = useCallback((data: any) => {
    updateStats();
  }, [updateStats]);

  // Store refs
  statsUpdateHandlerRef.current = updateStats;
  statusUpdateHandlerRef.current = handleStatusUpdate;

  // Initialize stats on component mount - NO DEPENDENCIES
  useEffect(() => {
    // Initial stats update when component mounts
    const managerStats = webSocketManager.getStats();
    setStats(managerStats);
    setConnectionStatus(managerStats.status);
  }, []); // EMPTY DEPENDENCY ARRAY to prevent infinite loop

  // Subscribe to singleton events on mount - STRICTMODE RESILIENT
  useEffect(() => {
    // Subscribe to connection events with current refs
    const connectHandler = statusUpdateHandlerRef.current!;
    const authenticatedHandler = statusUpdateHandlerRef.current!;
    const disconnectHandler = statusUpdateHandlerRef.current!;
    const errorHandler = statusUpdateHandlerRef.current!;
    
    webSocketManager.on('connect', connectHandler);
    webSocketManager.on('authenticated', authenticatedHandler);
    webSocketManager.on('disconnect', disconnectHandler);
    webSocketManager.on('error', errorHandler);
    
    // Cleanup on unmount - ONLY unsubscribe the specific handlers we added
    return () => {
      webSocketManager.off('connect', connectHandler);
      webSocketManager.off('authenticated', authenticatedHandler);
      webSocketManager.off('disconnect', disconnectHandler);
      webSocketManager.off('error', errorHandler);
      
      // Unsubscribe all component-specific handlers
      componentHandlers.current.forEach((handler, event) => {
        webSocketManager.off(event, handler);
      });
      componentHandlers.current.clear();
    };
  }, []); // EMPTY DEPENDENCY ARRAY - no dependencies to prevent re-runs

  // Public interface functions
  const connect = useCallback(() => {
    webSocketManager.connect();
  }, []);

  const disconnect = useCallback(() => {
    webSocketManager.disconnect();
  }, []);

  const onMessage = useCallback((messageType: string, handler: Function) => {
    // Remove old handler if exists
    const oldHandler = componentHandlers.current.get(messageType);
    if (oldHandler) {
      webSocketManager.off(messageType, oldHandler);
    }
    
    // Add new handler
    componentHandlers.current.set(messageType, handler);
    webSocketManager.on(messageType, handler);
  }, []);

  const offMessage = useCallback((messageType: string) => {
    const handler = componentHandlers.current.get(messageType);
    if (handler) {
      webSocketManager.off(messageType, handler);
      componentHandlers.current.delete(messageType);
    }
  }, []);

  const sendMessage = useCallback((messageType: string, data: any, trackRequest: boolean = false) => {
    const success = webSocketManager.emit(messageType, data);
    if (success) {
      // Update stats after successful send
      setTimeout(() => updateStats(), 0);
      return trackRequest ? webSocketManager.generateRequestId() : null;
    }
    return null;
  }, [updateStats]);

  // Specialized methods
  const startStream = useCallback((streamRequest: StreamRequest) => {
    return webSocketManager.startStream(streamRequest);
  }, []);

  const stopStream = useCallback((camera_id: string, quality?: string) => {
    return webSocketManager.stopStream(camera_id, quality);
  }, []);

  const changeStreamQuality = useCallback((camera_id: string, new_quality: string) => {
    return webSocketManager.changeStreamQuality(camera_id, new_quality);
  }, []);

  const subscribeToCamera = useCallback((camera_id: string) => {
    return webSocketManager.subscribeToCamera(camera_id);
  }, []);

  const unsubscribeFromCamera = useCallback((camera_id: string) => {
    return webSocketManager.unsubscribeFromCamera(camera_id);
  }, []);

  const generateRequestId = useCallback(() => {
    return webSocketManager.generateRequestId();
  }, []);

  // Return hook interface - same as before for compatibility
  return {
    connectionStatus,
    stats,
    isConnected: webSocketManager.isConnected(),
    isAuthenticated: webSocketManager.isAuthenticated(),
    
    connect,
    disconnect,
    
    onMessage,
    offMessage,
    sendMessage,
    
    startStream,
    stopStream,
    changeStreamQuality,
    subscribeToCamera,
    unsubscribeFromCamera,
    
    generateRequestId
  };
};

// Default configuration - now using the singleton
export const DEFAULT_WEBSOCKET_CONFIG: WebSocketConfig = {
  serverUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 2000,
  heartbeatInterval: 30000
};

// Context for sharing WebSocket instance (now uses singleton)
export const WebSocketContext = createContext<ReturnType<typeof useEnhancedWebSocket> | null>(null);

// Hook to use WebSocket context
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

// Direct access to singleton for advanced use cases
export { webSocketManager } from '../services/webSocketManager';
