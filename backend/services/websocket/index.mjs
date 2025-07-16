// APEX AI WEBSOCKET INTEGRATION
// =============================
// Integration layer for Enhanced WebSocket Server with existing backend

import enhancedWebSocketServer, { MESSAGE_TYPES, CLIENT_TYPES } from './EnhancedWebSocketServer.mjs';

/**
 * Initialize and integrate Enhanced WebSocket Server with existing backend
 */
export const initializeEnhancedWebSocket = (server, corsOrigins) => {
  try {
    // Initialize the enhanced WebSocket server
    const io = enhancedWebSocketServer.initialize(server, corsOrigins);
    
    console.log('🚀 Enhanced WebSocket integration initialized');
    
    // Return methods for external use
    return {
      // Server instance
      getServer: () => enhancedWebSocketServer,
      getIO: () => io,
      
      // Broadcasting methods
      broadcastToFrontend: (messageType, data) => {
        enhancedWebSocketServer.broadcastToFrontend(messageType, data);
      },
      
      broadcastToSubscribed: (subscription, messageType, data) => {
        enhancedWebSocketServer.broadcastToSubscribedClients(subscription, messageType, data);
      },
      
      // System information
      getStats: () => enhancedWebSocketServer.getSystemStats(),
      
      // Message types for external use
      MESSAGE_TYPES,
      CLIENT_TYPES,
      
      // Utility methods
      sendMessage: (socketId, messageType, data) => {
        return enhancedWebSocketServer.sendMessageWithRetry(socketId, messageType, data);
      }
    };
    
  } catch (error) {
    console.error('❌ Enhanced WebSocket integration failed:', error);
    throw error;
  }
};

/**
 * Legacy compatibility wrapper
 * Maintains compatibility with existing socket.js usage
 */
export const initializeSocketIO = (server, allowedOrigins) => {
  console.log('🔄 Using Enhanced WebSocket Server (legacy compatibility mode)');
  
  const enhancedWS = initializeEnhancedWebSocket(server, allowedOrigins);
  
  // Return legacy-compatible interface
  return enhancedWS.getIO();
};

export const getIO = () => {
  return enhancedWebSocketServer.io;
};

export const emitSocketEvent = (event, data) => {
  enhancedWebSocketServer.broadcastToFrontend(event, data);
};

// Export enhanced server for direct access
export { enhancedWebSocketServer };
export default enhancedWebSocketServer;
