// APEX AI SINGLETON WEBSOCKET MANAGER
// ===========================================
// Single, persistent WebSocket instance for entire application
// Immune to React component lifecycle and StrictMode issues

import io, { Socket } from 'socket.io-client';

// Message types - imported from the original hook
export const MESSAGE_TYPES = {
  CONNECTION_ESTABLISHED: 'connection_established',
  HEARTBEAT: 'heartbeat',
  HEARTBEAT_ACK: 'heartbeat_ack',
  
  STREAM_START_REQUEST: 'stream_start_request',
  STREAM_START_SUCCESS: 'stream_start_success',
  STREAM_START_ERROR: 'stream_start_error',
  STREAM_STOP_REQUEST: 'stream_stop_request',
  STREAM_STOP_SUCCESS: 'stream_stop_success',
  STREAM_STATUS_UPDATE: 'stream_status_update',
  STREAM_QUALITY_CHANGE: 'stream_quality_change',
  
  AI_DETECTION_RESULT: 'ai_detection_result',
  FACE_DETECTION_RESULT: 'face_detection_result',
  ALERT_TRIGGERED: 'alert_triggered',
  
  SYSTEM_STATUS_UPDATE: 'system_status_update',
  AI_ENGINE_STATUS: 'ai_engine_status',
  
  ERROR: 'error',
  CAMERA_ONLINE: 'camera_online',
  CAMERA_OFFLINE: 'camera_offline'
};

export interface WebSocketConfig {
  serverUrl: string;
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
}

export interface ConnectionStats {
  status: 'disconnected' | 'connecting' | 'connected' | 'authenticated';
  messagesReceived: number;
  messagesSent: number;
  reconnectAttempts: number;
  lastError?: string;
  connectedAt?: number;
  latency?: number;
}

export interface StreamRequest {
  camera_id: string;
  rtsp_url: string;
  quality?: 'thumbnail' | 'preview' | 'standard' | 'hd';
}

// Event handler type
type EventHandler = (...args: any[]) => void;

class WebSocketManager {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private stats: ConnectionStats;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private reconnectAttempts = 0;
  private isManualDisconnect = false;
  private isConnecting = false;

  constructor() {
    // Default configuration
    this.config = {
      serverUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelay: 2000,
      heartbeatInterval: 30000
    };

    this.stats = {
      status: 'disconnected',
      messagesReceived: 0,
      messagesSent: 0,
      reconnectAttempts: 0
    };
  }

  // Update configuration
  public configure(newConfig: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current connection stats
  public getStats(): ConnectionStats {
    return { ...this.stats };
  }

  // Check if connected
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Check if authenticated
  public isAuthenticated(): boolean {
    return this.stats.status === 'authenticated';
  }

  // Generate unique request ID
  public generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Connect to WebSocket server
  public connect(): void {
    if (this.socket?.connected) {
      console.log('🔌 [SINGLETON] WebSocket already connected');
      return;
    }

    if (this.stats.status === 'connecting') {
      console.log('🔌 [SINGLETON] WebSocket connection already in progress');
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('🔌 [SINGLETON] Connection attempt already in progress');
      return;
    }

    this.isManualDisconnect = false;
    this.isConnecting = true;
    this.stats.status = 'connecting';
    this.reconnectAttempts++;

    console.log('🔌 [SINGLETON] Connecting to WebSocket server...');

    this.socket = io(this.config.serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      autoConnect: true,
      reconnection: false, // We handle reconnection manually
    });

    // Connection successful
    this.socket.on('connect', () => {
      this.isConnecting = false;
      console.log('✅ [SINGLETON] WebSocket connected');
      this.stats.status = 'connected';
      this.stats.connectedAt = Date.now();
      this.stats.lastError = undefined;
      this.reconnectAttempts = 0;

      // Send client identification
      this.socket?.emit('client_identify', {
        client_type: 'frontend',
        capabilities: {
          live_monitoring: true,
          ai_detections: true,
          face_recognition: true,
          real_time_alerts: true
        },
        version: '2.0.0'
      });

      this.startHeartbeat();
      this.emitToHandlers('connect', {});
    });

    // Authentication successful
    this.socket.on('identification_success', (data) => {
      console.log('🔐 [SINGLETON] Client authenticated:', data);
      this.stats.status = 'authenticated';
      this.emitToHandlers('authenticated', data);
    });

    // Connection established
    this.socket.on(MESSAGE_TYPES.CONNECTION_ESTABLISHED, (data) => {
      console.log('🔐 [SINGLETON] Connection established:', data);
      this.emitToHandlers(MESSAGE_TYPES.CONNECTION_ESTABLISHED, data);
    });

    // Heartbeat handling
    this.socket.on(MESSAGE_TYPES.HEARTBEAT_ACK, (data) => {
      const latency = Date.now() - data.client_time;
      this.stats.latency = latency;
      this.emitToHandlers(MESSAGE_TYPES.HEARTBEAT_ACK, data);
    });

    // Register handlers for all message types
    Object.values(MESSAGE_TYPES).forEach(messageType => {
      this.socket?.on(messageType, (data) => {
        this.stats.messagesReceived++;
        this.emitToHandlers(messageType, data);
      });
    });

    // Error handling
    this.socket.on('error', (error) => {
      this.isConnecting = false;
      console.error('❌ [SINGLETON] WebSocket error:', error);
      this.stats.lastError = error.toString();
      this.emitToHandlers('error', error);
    });

    // Disconnection handling
    this.socket.on('disconnect', (reason) => {
      this.isConnecting = false;
      console.log('🔌 [SINGLETON] WebSocket disconnected:', reason);
      this.stats.status = 'disconnected';
      this.stopHeartbeat();
      this.emitToHandlers('disconnect', { reason });

      // Auto-reconnect if not manual disconnect
      if (this.config.autoReconnect && !this.isManualDisconnect && reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });
  }

  // Disconnect from WebSocket server
  public disconnect(): void {
    console.log('🔌 [SINGLETON] Disconnecting from WebSocket server');
    this.isManualDisconnect = true;
    this.isConnecting = false;
    
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.stats.status = 'disconnected';
    this.emitToHandlers('disconnect', { reason: 'manual' });
  }

  // Subscribe to events
  public on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  // Unsubscribe from events
  public off(event: string, handler?: EventHandler): void {
    if (!this.eventHandlers.has(event)) return;
    
    if (handler) {
      this.eventHandlers.get(event)!.delete(handler);
    } else {
      // Remove all handlers for this event
      this.eventHandlers.get(event)!.clear();
    }
  }

  // Send message
  public emit(messageType: string, data: any): boolean {
    if (!this.socket?.connected) {
      console.warn('⚠️ [SINGLETON] Cannot send message: not connected');
      return false;
    }

    try {
      this.socket.emit(messageType, data);
      this.stats.messagesSent++;
      return true;
    } catch (error) {
      console.error('❌ [SINGLETON] Failed to send message:', error);
      this.stats.lastError = error.toString();
      return false;
    }
  }

  // Specialized stream methods
  public startStream(streamRequest: StreamRequest): boolean {
    return this.emit(MESSAGE_TYPES.STREAM_START_REQUEST, streamRequest);
  }

  public stopStream(camera_id: string, quality?: string): boolean {
    return this.emit(MESSAGE_TYPES.STREAM_STOP_REQUEST, { camera_id, quality });
  }

  public changeStreamQuality(camera_id: string, new_quality: string): boolean {
    return this.emit(MESSAGE_TYPES.STREAM_QUALITY_CHANGE, { camera_id, new_quality });
  }

  public subscribeToCamera(camera_id: string): boolean {
    return this.emit('subscribe_camera', { camera_id });
  }

  public unsubscribeFromCamera(camera_id: string): boolean {
    return this.emit('unsubscribe_camera', { camera_id });
  }

  // Private methods
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit(MESSAGE_TYPES.HEARTBEAT, {
          client_time: Date.now()
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.log('🔌 [SINGLETON] Max reconnection attempts reached');
      return;
    }
    
    const delay = this.config.reconnectDelay * Math.pow(2, Math.min(this.reconnectAttempts, 5));
    
    console.log(`🔌 [SINGLETON] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (!this.isManualDisconnect) {
        this.connect();
      }
    }, delay);
  }

  private emitToHandlers(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ [SINGLETON] Error in event handler for ${event}:`, error);
        }
      });
    }
  }
}

// Create and export the singleton instance
export const webSocketManager = new WebSocketManager();

// NOTE: Auto-initialization removed to prevent unnecessary connections
// WebSocket will initialize only when Live Monitoring components are loaded
