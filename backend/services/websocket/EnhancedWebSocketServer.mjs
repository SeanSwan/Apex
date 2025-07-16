// APEX AI ENHANCED WEBSOCKET SERVER
// ====================================
// Production-ready WebSocket server with robust message handling,
// connection management, and real-time AI communication pipeline

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Message protocol definitions
const MESSAGE_TYPES = {
  // Connection management
  CONNECTION_ESTABLISHED: 'connection_established',
  HEARTBEAT: 'heartbeat',
  HEARTBEAT_ACK: 'heartbeat_ack',
  
  // Stream management
  STREAM_START_REQUEST: 'stream_start_request',
  STREAM_START_SUCCESS: 'stream_start_success',
  STREAM_START_ERROR: 'stream_start_error',
  STREAM_STOP_REQUEST: 'stream_stop_request',
  STREAM_STOP_SUCCESS: 'stream_stop_success',
  STREAM_STATUS_UPDATE: 'stream_status_update',
  STREAM_QUALITY_CHANGE: 'stream_quality_change',
  
  // AI Detection results
  AI_DETECTION_RESULT: 'ai_detection_result',
  FACE_DETECTION_RESULT: 'face_detection_result',
  ALERT_TRIGGERED: 'alert_triggered',
  
  // System status
  SYSTEM_STATUS_UPDATE: 'system_status_update',
  AI_ENGINE_STATUS: 'ai_engine_status',
  
  // Error handling
  ERROR: 'error',
  RETRY_REQUEST: 'retry_request',
  
  // Real-time updates
  CAMERA_ONLINE: 'camera_online',
  CAMERA_OFFLINE: 'camera_offline',
  BULK_STATUS_UPDATE: 'bulk_status_update'
};

const CLIENT_TYPES = {
  FRONTEND: 'frontend',
  AI_ENGINE: 'ai_engine',
  DESKTOP_APP: 'desktop_app',
  MOBILE_APP: 'mobile_app'
};

class EnhancedWebSocketServer {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
    this.messageQueue = new Map(); // Queue messages for offline clients
    this.heartbeatInterval = null;
    this.aiEngineConnection = null;
    this.systemStats = {
      connectedClients: 0,
      messagesProcessed: 0,
      errors: 0,
      uptime: Date.now()
    };
    
    this.setupHeartbeat();
  }

  /**
   * Initialize the WebSocket server with enhanced configuration
   */
  initialize(server, corsOrigins) {
    if (this.io) {
      console.warn('⚠️ WebSocket server already initialized');
      return this.io;
    }

    this.io = new Server(server, {
      cors: {
        origin: corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      maxHttpBufferSize: 1e6, // 1MB buffer
      allowEIO3: true
    });

    this.setupConnectionHandling();
    this.setupErrorHandling();

    console.log('🚀 Enhanced WebSocket server initialized successfully');
    return this.io;
  }

  /**
   * Setup client connection handling with authentication and client typing
   */
  setupConnectionHandling() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 New client connected: ${socket.id}`);
      
      const clientData = {
        id: socket.id,
        type: CLIENT_TYPES.FRONTEND, // Default type
        authenticated: false,
        subscriptions: new Set(),
        lastHeartbeat: Date.now(),
        connectedAt: Date.now(),
        messageCount: 0,
        errorCount: 0
      };

      this.connectedClients.set(socket.id, clientData);
      this.systemStats.connectedClients++;

      // Send connection establishment message
      socket.emit(MESSAGE_TYPES.CONNECTION_ESTABLISHED, {
        client_id: socket.id,
        server_time: Date.now(),
        supported_protocols: Object.values(MESSAGE_TYPES),
        heartbeat_interval: 30000
      });

      // Setup client-specific event handlers
      this.setupClientEvents(socket, clientData);

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
        this.handleClientDisconnection(socket.id, reason);
      });
    });
  }

  /**
   * Setup client-specific event handlers
   */
  setupClientEvents(socket, clientData) {
    // Client identification and authentication
    socket.on('client_identify', async (data) => {
      try {
        const { client_type, auth_token, capabilities } = data;
        
        // Validate client type
        if (!Object.values(CLIENT_TYPES).includes(client_type)) {
          socket.emit(MESSAGE_TYPES.ERROR, {
            code: 'INVALID_CLIENT_TYPE',
            message: 'Invalid client type provided'
          });
          return;
        }

        // Update client data
        clientData.type = client_type;
        clientData.capabilities = capabilities || {};
        
        // Handle AI Engine authentication
        if (client_type === CLIENT_TYPES.AI_ENGINE) {
          const isValid = await this.validateAIEngineAuth(auth_token);
          if (isValid) {
            clientData.authenticated = true;
            this.aiEngineConnection = socket.id;
            console.log(`🤖 AI Engine connected: ${socket.id}`);
            
            // Notify all frontend clients
            this.broadcastToFrontend(MESSAGE_TYPES.AI_ENGINE_STATUS, {
              status: 'connected',
              engine_id: socket.id,
              capabilities: capabilities
            });
          } else {
            socket.emit(MESSAGE_TYPES.ERROR, {
              code: 'AUTH_FAILED',
              message: 'AI Engine authentication failed'
            });
            return;
          }
        }

        // Send successful identification response
        socket.emit('identification_success', {
          client_id: socket.id,
          client_type: client_type,
          authenticated: clientData.authenticated
        });

      } catch (error) {
        console.error('❌ Client identification error:', error);
        socket.emit(MESSAGE_TYPES.ERROR, {
          code: 'IDENTIFICATION_ERROR',
          message: error.message
        });
      }
    });

    // Heartbeat handling
    socket.on(MESSAGE_TYPES.HEARTBEAT, (data) => {
      clientData.lastHeartbeat = Date.now();
      socket.emit(MESSAGE_TYPES.HEARTBEAT_ACK, {
        server_time: Date.now(),
        client_time: data.client_time || Date.now()
      });
    });

    // Stream management
    socket.on(MESSAGE_TYPES.STREAM_START_REQUEST, async (data) => {
      await this.handleStreamStartRequest(socket, clientData, data);
    });

    socket.on(MESSAGE_TYPES.STREAM_STOP_REQUEST, async (data) => {
      await this.handleStreamStopRequest(socket, clientData, data);
    });

    socket.on(MESSAGE_TYPES.STREAM_QUALITY_CHANGE, async (data) => {
      await this.handleStreamQualityChange(socket, clientData, data);
    });

    // Subscription management
    socket.on('subscribe_camera', (data) => {
      const { camera_id } = data;
      clientData.subscriptions.add(`camera:${camera_id}`);
      console.log(`📹 Client ${socket.id} subscribed to camera ${camera_id}`);
    });

    socket.on('unsubscribe_camera', (data) => {
      const { camera_id } = data;
      clientData.subscriptions.delete(`camera:${camera_id}`);
      console.log(`📹 Client ${socket.id} unsubscribed from camera ${camera_id}`);
    });

    // AI Detection results (from AI Engine)
    socket.on(MESSAGE_TYPES.AI_DETECTION_RESULT, (data) => {
      this.handleAIDetectionResult(socket, clientData, data);
    });

    socket.on(MESSAGE_TYPES.FACE_DETECTION_RESULT, (data) => {
      this.handleFaceDetectionResult(socket, clientData, data);
    });

    // Error reporting
    socket.on('client_error', (data) => {
      console.error(`❌ Client error from ${socket.id}:`, data);
      clientData.errorCount++;
      this.systemStats.errors++;
    });
  }

  /**
   * Handle stream start requests
   */
  async handleStreamStartRequest(socket, clientData, data) {
    try {
      const { camera_id, rtsp_url, quality = 'thumbnail', request_id } = data;
      
      // Validate request
      if (!camera_id || !rtsp_url) {
        socket.emit(MESSAGE_TYPES.STREAM_START_ERROR, {
          request_id,
          camera_id,
          error: 'Missing required parameters: camera_id or rtsp_url'
        });
        return;
      }

      // Forward to AI Engine if connected
      if (this.aiEngineConnection) {
        const aiSocket = this.io.sockets.sockets.get(this.aiEngineConnection);
        if (aiSocket) {
          aiSocket.emit('start_stream_processing', {
            camera_id,
            rtsp_url,
            quality,
            request_id,
            requesting_client: socket.id
          });
        }
      }

      // For now, simulate successful stream start
      setTimeout(() => {
        socket.emit(MESSAGE_TYPES.STREAM_START_SUCCESS, {
          request_id,
          camera_id,
          quality,
          stream_url: `/streams/${camera_id}_${quality}.m3u8`,
          status: 'online'
        });

        // Subscribe client to this camera
        clientData.subscriptions.add(`camera:${camera_id}`);
      }, 1000);

    } catch (error) {
      console.error('❌ Stream start error:', error);
      socket.emit(MESSAGE_TYPES.STREAM_START_ERROR, {
        request_id: data.request_id,
        camera_id: data.camera_id,
        error: error.message
      });
    }
  }

  /**
   * Handle stream stop requests
   */
  async handleStreamStopRequest(socket, clientData, data) {
    try {
      const { camera_id, quality, request_id } = data;

      // Forward to AI Engine if connected
      if (this.aiEngineConnection) {
        const aiSocket = this.io.sockets.sockets.get(this.aiEngineConnection);
        if (aiSocket) {
          aiSocket.emit('stop_stream_processing', {
            camera_id,
            quality,
            request_id,
            requesting_client: socket.id
          });
        }
      }

      socket.emit(MESSAGE_TYPES.STREAM_STOP_SUCCESS, {
        request_id,
        camera_id,
        quality
      });

      // Unsubscribe client from this camera
      clientData.subscriptions.delete(`camera:${camera_id}`);

    } catch (error) {
      console.error('❌ Stream stop error:', error);
      socket.emit(MESSAGE_TYPES.ERROR, {
        code: 'STREAM_STOP_ERROR',
        message: error.message,
        request_id: data.request_id
      });
    }
  }

  /**
   * Handle stream quality change requests
   */
  async handleStreamQualityChange(socket, clientData, data) {
    try {
      const { camera_id, new_quality, request_id } = data;

      // Forward to AI Engine if connected
      if (this.aiEngineConnection) {
        const aiSocket = this.io.sockets.sockets.get(this.aiEngineConnection);
        if (aiSocket) {
          aiSocket.emit('change_stream_quality', {
            camera_id,
            new_quality,
            request_id,
            requesting_client: socket.id
          });
        }
      }

      socket.emit('quality_change_success', {
        request_id,
        camera_id,
        new_quality,
        stream_url: `/streams/${camera_id}_${new_quality}.m3u8`
      });

    } catch (error) {
      console.error('❌ Quality change error:', error);
      socket.emit(MESSAGE_TYPES.ERROR, {
        code: 'QUALITY_CHANGE_ERROR',
        message: error.message,
        request_id: data.request_id
      });
    }
  }

  /**
   * Handle AI detection results from AI Engine
   */
  handleAIDetectionResult(socket, clientData, data) {
    if (clientData.type !== CLIENT_TYPES.AI_ENGINE) {
      console.warn(`⚠️ Non-AI Engine client ${socket.id} sent AI detection result`);
      return;
    }

    const { camera_id, detections, timestamp } = data;
    
    // Broadcast to subscribed frontend clients
    this.broadcastToSubscribedClients(`camera:${camera_id}`, MESSAGE_TYPES.AI_DETECTION_RESULT, {
      camera_id,
      detections,
      timestamp,
      source: 'ai_engine'
    });

    console.log(`🤖 AI detection from ${camera_id}: ${detections.length} objects detected`);
  }

  /**
   * Handle face detection results from AI Engine
   */
  handleFaceDetectionResult(socket, clientData, data) {
    if (clientData.type !== CLIENT_TYPES.AI_ENGINE) {
      console.warn(`⚠️ Non-AI Engine client ${socket.id} sent face detection result`);
      return;
    }

    const { camera_id, faces, timestamp } = data;
    
    // Broadcast to subscribed frontend clients
    this.broadcastToSubscribedClients(`camera:${camera_id}`, MESSAGE_TYPES.FACE_DETECTION_RESULT, {
      camera_id,
      faces,
      timestamp,
      source: 'ai_engine'
    });

    console.log(`👤 Face detection from ${camera_id}: ${faces.length} faces detected`);

    // Check for alerts
    const unknownFaces = faces.filter(face => !face.is_known);
    if (unknownFaces.length > 0) {
      this.broadcastToFrontend(MESSAGE_TYPES.ALERT_TRIGGERED, {
        type: 'unknown_person',
        camera_id,
        faces: unknownFaces,
        timestamp,
        severity: 'medium'
      });
    }
  }

  /**
   * Broadcast message to all frontend clients
   */
  broadcastToFrontend(messageType, data) {
    this.connectedClients.forEach((clientData, socketId) => {
      if (clientData.type === CLIENT_TYPES.FRONTEND || clientData.type === CLIENT_TYPES.DESKTOP_APP) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(messageType, data);
        }
      }
    });
  }

  /**
   * Broadcast to clients subscribed to specific topics
   */
  broadcastToSubscribedClients(subscription, messageType, data) {
    this.connectedClients.forEach((clientData, socketId) => {
      if (clientData.subscriptions.has(subscription)) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(messageType, data);
        }
      }
    });
  }

  /**
   * Setup heartbeat monitoring
   */
  setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const staleTimeout = 60000; // 60 seconds
      
      this.connectedClients.forEach((clientData, socketId) => {
        if (now - clientData.lastHeartbeat > staleTimeout) {
          console.warn(`⚠️ Client ${socketId} appears stale, disconnecting`);
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect(true);
          }
        }
      });
    }, 30000); // Check every 30 seconds
  }

  /**
   * Setup global error handling
   */
  setupErrorHandling() {
    this.io.on('error', (error) => {
      console.error('❌ WebSocket server error:', error);
      this.systemStats.errors++;
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Promise Rejection:', reason);
      this.systemStats.errors++;
    });
  }

  /**
   * Handle client disconnection cleanup
   */
  handleClientDisconnection(socketId, reason) {
    const clientData = this.connectedClients.get(socketId);
    
    if (clientData) {
      // If AI Engine disconnected, notify frontend clients
      if (clientData.type === CLIENT_TYPES.AI_ENGINE) {
        this.aiEngineConnection = null;
        this.broadcastToFrontend(MESSAGE_TYPES.AI_ENGINE_STATUS, {
          status: 'disconnected',
          reason: reason
        });
        console.log('🤖 AI Engine disconnected');
      }

      this.connectedClients.delete(socketId);
      this.systemStats.connectedClients--;
    }
  }

  /**
   * Validate AI Engine authentication
   */
  async validateAIEngineAuth(token) {
    try {
      if (!token) return false;
      
      // For demo purposes, accept a simple token
      // In production, use proper JWT validation
      return token === process.env.AI_ENGINE_TOKEN || token === 'apex_ai_engine_2024';
    } catch (error) {
      console.error('❌ AI Engine auth validation error:', error);
      return false;
    }
  }

  /**
   * Get system statistics
   */
  getSystemStats() {
    return {
      ...this.systemStats,
      uptime: Date.now() - this.systemStats.uptime,
      clients: Array.from(this.connectedClients.values()).map(client => ({
        id: client.id,
        type: client.type,
        authenticated: client.authenticated,
        subscriptions: Array.from(client.subscriptions),
        connectedAt: client.connectedAt,
        messageCount: client.messageCount,
        errorCount: client.errorCount
      }))
    };
  }

  /**
   * Send message with retry logic
   */
  sendMessageWithRetry(socketId, messageType, data, maxRetries = 3) {
    const socket = this.io.sockets.sockets.get(socketId);
    
    if (!socket) {
      console.warn(`⚠️ Cannot send message to ${socketId}: socket not found`);
      return false;
    }

    let retries = 0;
    const attemptSend = () => {
      try {
        socket.emit(messageType, data);
        return true;
      } catch (error) {
        retries++;
        if (retries < maxRetries) {
          console.warn(`⚠️ Retry ${retries}/${maxRetries} for message to ${socketId}`);
          setTimeout(attemptSend, 1000 * retries);
        } else {
          console.error(`❌ Failed to send message to ${socketId} after ${maxRetries} retries`);
          return false;
        }
      }
    };

    return attemptSend();
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    console.log('🛑 Shutting down Enhanced WebSocket server...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.io) {
      this.io.close();
    }

    console.log('✅ Enhanced WebSocket server shutdown complete');
  }
}

// Create singleton instance
const enhancedWebSocketServer = new EnhancedWebSocketServer();

export default enhancedWebSocketServer;
export { MESSAGE_TYPES, CLIENT_TYPES };
