/**
 * APEX AI STREAMING INTEGRATION SERVER
 * ===================================
 * Main server that integrates streaming, AI detection, and real-time communication
 * Handles 300+ camera feeds with face detection and alert processing
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import ApexStreamingServer from '../services/streaming/streamingServer.mjs';
import ApexFaceDetectionService from '../services/ai/faceDetectionService.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ApexStreamingIntegrationServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: ["http://localhost:3000", "http://localhost:5173"],
        methods: ["GET", "POST"]
      }
    });
    
    this.streamingServer = new ApexStreamingServer();
    this.faceDetectionService = new ApexFaceDetectionService();
    
    this.connectedClients = new Map();
    this.frameProcessingQueue = [];
    this.isProcessingFrames = false;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.startFrameProcessing();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    // Serve stream files
    this.app.use('/streams', express.static(path.join(__dirname, '../public/streams')));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        streaming_server: 'active',
        face_detection: this.faceDetectionService.isModelLoaded ? 'active' : 'loading',
        connected_clients: this.connectedClients.size,
        uptime: process.uptime()
      });
    });

    // Stream management endpoints
    this.app.post('/api/streams/start', async (req, res) => {
      const { camera_id, rtsp_url, quality = 'thumbnail' } = req.body;
      
      try {
        const streamUrl = await this.streamingServer.startCameraStream(camera_id, rtsp_url, quality);
        
        res.json({
          success: true,
          camera_id,
          stream_url: `/streams/${camera_id}_${quality}.m3u8`,
          message: 'Stream started successfully'
        });
        
        // Notify clients
        this.io.emit('stream_started', {
          camera_id,
          quality,
          stream_url: `/streams/${camera_id}_${quality}.m3u8`
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to start stream',
          details: error.message
        });
      }
    });

    this.app.post('/api/streams/stop', async (req, res) => {
      const { camera_id, quality } = req.body;
      
      try {
        await this.streamingServer.stopCameraStream(camera_id, quality);
        
        res.json({
          success: true,
          camera_id,
          message: 'Stream stopped successfully'
        });
        
        // Notify clients
        this.io.emit('stream_stopped', { camera_id, quality });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to stop stream',
          details: error.message
        });
      }
    });

    // Face detection endpoints
    this.app.get('/api/faces/stats', async (req, res) => {
      try {
        const stats = await this.faceDetectionService.getFaceStats();
        res.json({ success: true, stats });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to get face stats',
          details: error.message
        });
      }
    });

    this.app.post('/api/faces/add-person', async (req, res) => {
      try {
        const personId = await this.faceDetectionService.addKnownPerson(req.body);
        res.json({
          success: true,
          person_id: personId,
          message: 'Person added successfully'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to add person',
          details: error.message
        });
      }
    });

    this.app.get('/api/faces/search', async (req, res) => {
      const { query, limit } = req.query;
      
      try {
        const results = await this.faceDetectionService.searchPersons(query, parseInt(limit) || 20);
        res.json({ success: true, results });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to search persons',
          details: error.message
        });
      }
    });

    // Stream stats
    this.app.get('/api/streams/stats', (req, res) => {
      const stats = this.streamingServer.getStreamStats();
      res.json({
        success: true,
        ...stats,
        face_detection_queue: this.frameProcessingQueue.length
      });
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);
      
      this.connectedClients.set(socket.id, {
        connected_at: new Date(),
        subscribed_cameras: new Set()
      });

      // Handle stream requests
      socket.on('start_stream', async (data) => {
        const { camera_id, rtsp_url, quality = 'thumbnail' } = data;
        
        try {
          await this.streamingServer.startCameraStream(camera_id, rtsp_url, quality);
          
          socket.emit('stream_started', {
            camera_id,
            quality,
            stream_url: `/streams/${camera_id}_${quality}.m3u8`
          });
          
          // Subscribe client to this camera
          this.connectedClients.get(socket.id)?.subscribed_cameras.add(camera_id);
          
          // Start AI processing for this camera
          this.scheduleFrameProcessing(camera_id);
          
        } catch (error) {
          socket.emit('stream_error', {
            camera_id,
            error: error.message
          });
        }
      });

      socket.on('stop_stream', async (data) => {
        const { camera_id, quality } = data;
        
        try {
          await this.streamingServer.stopCameraStream(camera_id, quality);
          
          socket.emit('stream_stopped', { camera_id, quality });
          
          // Unsubscribe client from this camera
          this.connectedClients.get(socket.id)?.subscribed_cameras.delete(camera_id);
          
        } catch (error) {
          socket.emit('stream_error', {
            camera_id,
            error: error.message
          });
        }
      });

      socket.on('change_quality', async (data) => {
        const { camera_id, quality } = data;
        
        try {
          await this.streamingServer.changeStreamQuality(camera_id, quality);
          
          socket.emit('quality_changed', {
            camera_id,
            quality,
            stream_url: `/streams/${camera_id}_${quality}.m3u8`
          });
          
        } catch (error) {
          socket.emit('stream_error', {
            camera_id,
            error: error.message
          });
        }
      });

      socket.on('request_snapshot', async (data) => {
        const { camera_id, rtsp_url } = data;
        
        try {
          const snapshotUrl = await this.streamingServer.captureSnapshot(camera_id, rtsp_url);
          
          socket.emit('snapshot_ready', {
            camera_id,
            snapshot_url: snapshotUrl
          });
          
        } catch (error) {
          socket.emit('snapshot_error', {
            camera_id,
            error: error.message
          });
        }
      });

      // Client disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });
    });

    // Initialize streaming server WebSocket integration
    this.streamingServer.initializeWebSocket(this.server);
  }

  /**
   * Schedule frame processing for AI detection
   */
  scheduleFrameProcessing(cameraId) {
    // Add camera to processing schedule (every 2 seconds for demo)
    const processInterval = setInterval(() => {
      this.addFrameToProcessingQueue(cameraId);
    }, 2000);

    // Store interval for cleanup
    if (!this.cameraProcessingIntervals) {
      this.cameraProcessingIntervals = new Map();
    }
    
    // Clear existing interval if any
    if (this.cameraProcessingIntervals.has(cameraId)) {
      clearInterval(this.cameraProcessingIntervals.get(cameraId));
    }
    
    this.cameraProcessingIntervals.set(cameraId, processInterval);
  }

  /**
   * Add frame to AI processing queue
   */
  addFrameToProcessingQueue(cameraId) {
    // For demo, we'll simulate frame capture
    const frameData = {
      camera_id: cameraId,
      image_data: null, // In production, this would be actual frame data
      timestamp: Date.now()
    };

    this.frameProcessingQueue.push(frameData);
  }

  /**
   * Start frame processing worker
   */
  startFrameProcessing() {
    if (this.isProcessingFrames) return;
    
    this.isProcessingFrames = true;
    
    const processNext = async () => {
      if (this.frameProcessingQueue.length === 0) {
        setTimeout(processNext, 100);
        return;
      }
      
      const frameData = this.frameProcessingQueue.shift();
      
      try {
        const result = await this.faceDetectionService.processFrame(frameData);
        
        if (result && result.detections.length > 0) {
          // Emit face detections to subscribed clients
          this.emitFaceDetections(result);
        }
        
      } catch (error) {
        console.error('❌ Frame processing error:', error);
      }
      
      // Process next frame immediately
      setImmediate(processNext);
    };
    
    processNext();
    console.log('🎬 Frame processing worker started');
  }

  /**
   * Emit face detections to clients
   */
  emitFaceDetections(result) {
    const { camera_id, detections } = result;
    
    // Send to all clients subscribed to this camera
    this.connectedClients.forEach((clientData, socketId) => {
      if (clientData.subscribed_cameras.has(camera_id)) {
        this.io.to(socketId).emit('face_detection', {
          camera_id,
          detections,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Also broadcast to general face detection listeners
    this.io.emit('ai_detection', {
      type: 'face_detection',
      camera_id,
      detections,
      timestamp: new Date().toISOString()
    });
    
    console.log(`👤 Emitted ${detections.length} face detections for camera ${camera_id}`);
  }

  /**
   * Start the integrated server
   */
  async start(port = 5001) {
    try {
      // Start demo streams
      await this.streamingServer.startDemoStreams();
      
      this.server.listen(port, () => {
        console.log(`🚀 APEX Streaming Integration Server running on port ${port}`);
        console.log(`📡 WebSocket endpoint: ws://localhost:${port}/socket.io/`);
        console.log(`🎥 Stream endpoint: http://localhost:${port}/streams/`);
        console.log(`🔗 Health check: http://localhost:${port}/health`);
      });
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down APEX Streaming Integration Server...');
    
    // Stop frame processing
    this.isProcessingFrames = false;
    this.frameProcessingQueue = [];
    
    // Clear camera processing intervals
    if (this.cameraProcessingIntervals) {
      this.cameraProcessingIntervals.forEach((interval) => {
        clearInterval(interval);
      });
      this.cameraProcessingIntervals.clear();
    }
    
    // Shutdown services
    await this.streamingServer.shutdown();
    await this.faceDetectionService.shutdown();
    
    // Close server
    this.server.close();
    
    console.log('✅ Server shutdown complete');
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ApexStreamingIntegrationServer();
  
  server.start(5001).catch(error => {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  });
  
  // Graceful shutdown on signals
  process.on('SIGINT', async () => {
    await server.shutdown();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await server.shutdown();
    process.exit(0);
  });
}

export default ApexStreamingIntegrationServer;