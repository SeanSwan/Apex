// backend/src/socket.js
import { Server } from 'socket.io';
import http from 'http';

// Create a singleton pattern for Socket.io
class SocketService {
  static instance;
  io = null;

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
      console.log('A user connected', socket.id);
      
      // Handle client events
      socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
      });
      
      // Add more socket event handlers as needed
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });

    console.log('Socket.io initialized successfully');
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

export default socketService;