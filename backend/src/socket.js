// backend/src/socket.js
// ENHANCED FOR SPRINT 4 INTEGRATION
// WebSocket service for relaying AI engine alerts to frontend clients

import { Server } from 'socket.io';
import http from 'http';
import WebSocket from 'ws';

// Create a singleton pattern for Socket.io
class SocketService {
  static instance;
  io = null;
  aiEngineWS = null;
  isConnectedToAI = false;
  aiEnginePort = 8765;
  reconnectInterval = 5000; // 5 seconds
  messageQueue = [];

  constructor() {
    // Private constructor to enforce singleton
  }

  static getInstance() {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  initialize(server, allowedOrigin) {
    if (this.io) {
      console.warn('Socket.io already initialized');
      return this.io;
    }

    this.io = new Server(server, {
      cors: {
        origin: allowedOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket) => {
      console.log('🔌 Frontend client connected:', socket.id);
      
      // Send current AI engine status
      socket.emit('ai_engine_status', {
        connected: this.isConnectedToAI,
        timestamp: new Date().toISOString()
      });
      
      // Handle frontend to AI engine commands
      this.setupFrontendHandlers(socket);
      
      socket.on('disconnect', () => {
        console.log('🔌 Frontend client disconnected:', socket.id);
      });
      
      socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });
    });

    // Initialize connection to AI engine
    this.connectToAIEngine();

    console.log('✅ Socket.io initialized with Sprint 4 integration');
    return this.io;
  }

  getIO() {
    if (!this.io) {
      console.warn('Socket.io not initialized yet. Call initialize() first.');
      throw new Error('Socket.io not initialized');
    }
    return this.io;
  }

  emit(event, data) {
    if (!this.io) {
      console.warn('Socket.io not initialized yet. Call initialize() first.');
      return;
    }
    this.io.emit(event, data);
  }

  // SPRINT 4: AI Engine Connection Management
  connectToAIEngine() {
    const wsUrl = `ws://localhost:${this.aiEnginePort}`;
    console.log(`🤖 Attempting to connect to AI Engine at ${wsUrl}...`);

    try {
      this.aiEngineWS = new WebSocket(wsUrl);

      this.aiEngineWS.on('open', () => {
        console.log('✅ Connected to AI Engine successfully');
        this.isConnectedToAI = true;
        
        // Notify all frontend clients
        this.io.emit('ai_engine_status', {
          connected: true,
          timestamp: new Date().toISOString()
        });

        // Send any queued messages
        this.flushMessageQueue();
      });

      this.aiEngineWS.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleAIEngineMessage(message);
        } catch (error) {
          console.error('❌ Error parsing AI engine message:', error);
        }
      });

      this.aiEngineWS.on('close', () => {
        console.log('⚠️ Connection to AI Engine closed');
        this.isConnectedToAI = false;
        
        // Notify frontend clients
        this.io.emit('ai_engine_status', {
          connected: false,
          timestamp: new Date().toISOString()
        });

        // Attempt to reconnect
        setTimeout(() => {
          this.connectToAIEngine();
        }, this.reconnectInterval);
      });

      this.aiEngineWS.on('error', (error) => {
        console.error('❌ AI Engine WebSocket error:', error.message);
        this.isConnectedToAI = false;
        
        // Attempt to reconnect
        setTimeout(() => {
          this.connectToAIEngine();
        }, this.reconnectInterval);
      });

    } catch (error) {
      console.error('❌ Failed to create AI Engine WebSocket:', error);
      
      // Retry connection
      setTimeout(() => {
        this.connectToAIEngine();
      }, this.reconnectInterval);
    }
  }

  // SPRINT 4: Handle messages from AI Engine and relay to frontend
  handleAIEngineMessage(message) {
    const { type, data } = message;
    
    console.log(`📨 Received from AI Engine: ${type}`);

    switch (type) {
      // Sprint 4: Visual Alert Events
      case 'visual_alert':
        this.io.emit('visual_alert', {
          alert_id: data.alert_id,
          zone_id: data.zone_id,
          overlay_data: data.overlay_data,
          threat_data: data.threat_data,
          timestamp: new Date().toISOString()
        });
        break;

      // Sprint 4: Audio Alert Events
      case 'audio_alert':
        this.io.emit('audio_alert', {
          alert_id: data.alert_id,
          zone_id: data.zone_id,
          threat_type: data.threat_type,
          threat_level: data.threat_level,
          audio_stats: data.audio_stats,
          timestamp: new Date().toISOString()
        });
        break;

      // Sprint 4: AI Conversation Events
      case 'ai_conversation_started':
        this.io.emit('ai_conversation_started', {
          conversation_id: data.conversation_id,
          zone_id: data.zone_id,
          threat_type: data.threat_type,
          threat_level: data.threat_level,
          timestamp: new Date().toISOString()
        });
        break;

      case 'conversation_started':
        this.io.emit('conversation_started', data);
        break;

      case 'conversation_stopped':
        this.io.emit('conversation_stopped', data);
        break;

      // Sprint 4: Master Threat Alert
      case 'threat_alert':
        this.io.emit('threat_alert', {
          alert_type: data.alert_type,
          threat_level: data.threat_level,
          zone_id: data.zone_id,
          camera_id: data.camera_id,
          description: data.description,
          confidence: data.confidence,
          engines_triggered: data.engines_triggered,
          timestamp: data.timestamp
        });
        break;

      // Existing events
      case 'object_detection':
        this.io.emit('object_detection', data);
        break;

      case 'face_detection':
        this.io.emit('face_detection', data);
        break;

      case 'camera_status':
        this.io.emit('camera_status', data);
        break;

      case 'status':
        this.io.emit('ai_status_update', data);
        break;

      case 'enhanced_snapshot_ready':
        this.io.emit('enhanced_snapshot_ready', data);
        break;

      // Sprint 4: Statistics events
      case 'visual_stats':
        this.io.emit('visual_stats', data);
        break;

      case 'audio_stats':
        this.io.emit('audio_stats', data);
        break;

      case 'active_conversations':
        this.io.emit('active_conversations', data);
        break;

      case 'conversation_history':
        this.io.emit('conversation_history', data);
        break;

      case 'visual_overlay_data':
        this.io.emit('visual_overlay_data', data);
        break;

      case 'error':
        this.io.emit('ai_engine_error', data);
        break;

      default:
        console.log(`📨 Relaying unknown message type: ${type}`);
        this.io.emit(type, data);
        break;
    }
  }

  // SPRINT 4: Setup handlers for frontend commands to AI engine
  setupFrontendHandlers(socket) {
    // Camera control commands
    socket.on('start_camera', (data) => {
      this.sendToAIEngine('start_camera', data);
    });

    socket.on('stop_camera', (data) => {
      this.sendToAIEngine('stop_camera', data);
    });

    socket.on('capture_snapshot', (data) => {
      this.sendToAIEngine('capture_snapshot', data);
    });

    // AI engine status commands
    socket.on('get_status', () => {
      this.sendToAIEngine('get_status', {});
    });

    socket.on('configure_rules', (data) => {
      this.sendToAIEngine('configure_rules', data);
    });

    // Face recognition commands
    socket.on('reload_known_faces', () => {
      this.sendToAIEngine('reload_known_faces', {});
    });

    socket.on('get_face_stats', () => {
      this.sendToAIEngine('get_face_stats', {});
    });

    // Sprint 4: Visual Alert Commands
    socket.on('get_visual_overlay', (data) => {
      this.sendToAIEngine('get_visual_overlay', data);
    });

    socket.on('clear_visual_alerts', (data) => {
      this.sendToAIEngine('clear_visual_alerts', data);
    });

    socket.on('get_visual_stats', () => {
      this.sendToAIEngine('get_visual_stats', {});
    });

    // Sprint 4: Audio Alert Commands
    socket.on('set_audio_volume', (data) => {
      this.sendToAIEngine('set_audio_volume', data);
    });

    socket.on('stop_audio_alerts', () => {
      this.sendToAIEngine('stop_audio_alerts', {});
    });

    socket.on('get_audio_stats', () => {
      this.sendToAIEngine('get_audio_stats', {});
    });

    // Sprint 4: AI Conversation Commands
    socket.on('start_conversation', (data) => {
      this.sendToAIEngine('start_conversation', data);
    });

    socket.on('stop_conversation', (data) => {
      this.sendToAIEngine('stop_conversation', data);
    });

    socket.on('get_active_conversations', () => {
      this.sendToAIEngine('get_active_conversations', {});
    });

    socket.on('get_conversation_history', (data) => {
      this.sendToAIEngine('get_conversation_history', data);
    });

    console.log(`✅ Frontend handlers setup for client: ${socket.id}`);
  }

  // Send command to AI engine with error handling
  sendToAIEngine(command, data) {
    const message = {
      command,
      data
    };

    if (this.isConnectedToAI && this.aiEngineWS && this.aiEngineWS.readyState === WebSocket.OPEN) {
      try {
        this.aiEngineWS.send(JSON.stringify(message));
        console.log(`📤 Sent to AI Engine: ${command}`);
      } catch (error) {
        console.error(`❌ Error sending to AI Engine: ${error.message}`);
        // Queue message for retry
        this.messageQueue.push(message);
      }
    } else {
      console.log(`📋 Queuing message for AI Engine: ${command}`);
      this.messageQueue.push(message);
    }
  }

  // Flush queued messages when connection is restored
  flushMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`📤 Flushing ${this.messageQueue.length} queued messages`);
      
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        try {
          this.aiEngineWS.send(JSON.stringify(message));
        } catch (error) {
          console.error(`❌ Error flushing message: ${error.message}`);
          // Put message back at front of queue
          this.messageQueue.unshift(message);
          break;
        }
      }
    }
  }
}

// Export a single instance of the service
const socketService = SocketService.getInstance();

// Export the functions
export const initializeSocketIO = (server, allowedOrigin) => {
  return socketService.initialize(server, allowedOrigin);
};

export const getIO = () => {
  return socketService.getIO();
};

export const emitSocketEvent = (event, data) => {
  socketService.emit(event, data);
};

// SPRINT 4: New export functions for AI engine integration
export const sendToAIEngine = (command, data) => {
  socketService.sendToAIEngine(command, data);
};

export const isConnectedToAI = () => {
  return socketService.isConnectedToAI;
};

export const getAIEngineStatus = () => {
  return {
    connected: socketService.isConnectedToAI,
    queuedMessages: socketService.messageQueue.length,
    timestamp: new Date().toISOString()
  };
};

// SPRINT 4: Direct event emitters for Sprint 4 features
export const emitVisualAlert = (alertData) => {
  socketService.io.emit('visual_alert', alertData);
};

export const emitAudioAlert = (alertData) => {
  socketService.io.emit('audio_alert', alertData);
};

export const emitThreatAlert = (alertData) => {
  socketService.io.emit('threat_alert', alertData);
};

export const emitConversationEvent = (eventType, data) => {
  socketService.io.emit(eventType, data);
};

export default socketService;