/**
 * APEX AI STREAMING SERVER - RTSP TO WEB PIPELINE
 * ==============================================
 * Handles 300+ RTSP camera feeds with adaptive quality streaming
 * Generates multiple resolutions for different UI tiers
 * Integrates with AI detection pipeline
 */

import express from 'express';
import { spawn } from 'child_process';
import WebSocket, { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ApexStreamingServer {
  constructor() {
    this.activeStreams = new Map(); // Track active FFmpeg processes
    this.streamClients = new Map(); // Track connected clients per stream
    this.streamDirectory = path.join(__dirname, '../../public/streams');
    this.wsServer = null;
    
    // Ensure streams directory exists
    if (!fs.existsSync(this.streamDirectory)) {
      fs.mkdirSync(this.streamDirectory, { recursive: true });
    }
    
    // Stream quality tiers for adaptive streaming
    this.streamTiers = {
      thumbnail: { width: 160, height: 120, fps: 2, bitrate: '50k' },
      preview: { width: 640, height: 480, fps: 5, bitrate: '200k' },
      standard: { width: 1280, height: 720, fps: 15, bitrate: '1000k' },
      hd: { width: 1920, height: 1080, fps: 30, bitrate: '2500k' }
    };
  }

  /**
   * Initialize WebSocket server for real-time stream control
   */
  initializeWebSocket(server) {
    this.wsServer = new WebSocketServer({ server });
    
    this.wsServer.on('connection', (ws) => {
      console.log('🔌 New stream client connected');
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleStreamRequest(ws, message);
        } catch (error) {
          console.error('❌ Invalid WebSocket message:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('🔌 Stream client disconnected');
        this.cleanupClientStreams(ws);
      });
    });
  }

  /**
   * Handle stream requests from frontend
   */
  async handleStreamRequest(ws, message) {
    const { action, camera_id, quality = 'thumbnail', rtsp_url } = message;
    
    switch (action) {
      case 'start_stream':
        await this.startCameraStream(camera_id, rtsp_url, quality);
        ws.send(JSON.stringify({
          type: 'stream_started',
          camera_id,
          quality,
          stream_url: `/streams/${camera_id}_${quality}.m3u8`
        }));
        break;
        
      case 'stop_stream':
        await this.stopCameraStream(camera_id, quality);
        ws.send(JSON.stringify({
          type: 'stream_stopped',
          camera_id,
          quality
        }));
        break;
        
      case 'change_quality':
        await this.changeStreamQuality(camera_id, quality);
        ws.send(JSON.stringify({
          type: 'quality_changed',
          camera_id,
          new_quality: quality,
          stream_url: `/streams/${camera_id}_${quality}.m3u8`
        }));
        break;
        
      case 'request_snapshot':
        const snapshotPath = await this.captureSnapshot(camera_id, rtsp_url);
        ws.send(JSON.stringify({
          type: 'snapshot_ready',
          camera_id,
          snapshot_url: snapshotPath
        }));
        break;
    }
  }

  /**
   * Start RTSP to HLS conversion for a camera
   */
  async startCameraStream(cameraId, rtspUrl, quality = 'thumbnail') {
    const streamKey = `${cameraId}_${quality}`;
    
    // Don't start if already running
    if (this.activeStreams.has(streamKey)) {
      console.log(`⚡ Stream ${streamKey} already active`);
      return;
    }

    const config = this.streamTiers[quality];
    const outputPath = path.join(this.streamDirectory, `${streamKey}.m3u8`);
    const segmentPath = path.join(this.streamDirectory, `${streamKey}_%03d.ts`);

    // FFmpeg command for RTSP to HLS conversion
    const ffmpegArgs = [
      '-i', rtspUrl,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'zerolatency',
      '-s', `${config.width}x${config.height}`,
      '-r', config.fps.toString(),
      '-b:v', config.bitrate,
      '-maxrate', config.bitrate,
      '-bufsize', config.bitrate,
      '-f', 'hls',
      '-hls_time', '2',
      '-hls_list_size', '3',
      '-hls_flags', 'delete_segments',
      '-hls_segment_filename', segmentPath,
      outputPath
    ];

    console.log(`🎥 Starting stream: ${streamKey}`);
    console.log(`📡 RTSP URL: ${rtspUrl}`);
    console.log(`🎬 Output: ${outputPath}`);

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
    
    ffmpegProcess.stdout.on('data', (data) => {
      // console.log(`📊 FFmpeg stdout (${streamKey}):`, data.toString());
    });

    ffmpegProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('frame=')) {
        // Stream is working, send periodic status
        this.broadcastStreamStatus(cameraId, quality, 'active');
      }
    });

    ffmpegProcess.on('close', (code) => {
      console.log(`❌ Stream ${streamKey} ended with code ${code}`);
      this.activeStreams.delete(streamKey);
      this.broadcastStreamStatus(cameraId, quality, 'stopped');
    });

    ffmpegProcess.on('error', (error) => {
      console.error(`❌ FFmpeg error for ${streamKey}:`, error);
      this.activeStreams.delete(streamKey);
      this.broadcastStreamStatus(cameraId, quality, 'error');
    });

    // Store process reference
    this.activeStreams.set(streamKey, {
      process: ffmpegProcess,
      camera_id: cameraId,
      quality,
      rtsp_url: rtspUrl,
      started_at: new Date(),
      output_path: outputPath
    });

    return outputPath;
  }

  /**
   * Stop a camera stream
   */
  async stopCameraStream(cameraId, quality) {
    const streamKey = `${cameraId}_${quality}`;
    const stream = this.activeStreams.get(streamKey);
    
    if (stream) {
      console.log(`⏹️ Stopping stream: ${streamKey}`);
      stream.process.kill('SIGTERM');
      this.activeStreams.delete(streamKey);
      
      // Cleanup output files
      try {
        const outputDir = path.dirname(stream.output_path);
        const files = fs.readdirSync(outputDir);
        files.forEach(file => {
          if (file.startsWith(`${streamKey}.`) || file.startsWith(`${streamKey}_`)) {
            fs.unlinkSync(path.join(outputDir, file));
          }
        });
      } catch (error) {
        console.error('❌ Cleanup error:', error);
      }
    }
  }

  /**
   * Change stream quality for a camera
   */
  async changeStreamQuality(cameraId, newQuality) {
    // Stop all existing qualities for this camera
    for (const quality of Object.keys(this.streamTiers)) {
      await this.stopCameraStream(cameraId, quality);
    }
    
    // Start new quality stream
    const stream = Array.from(this.activeStreams.values())
      .find(s => s.camera_id === cameraId);
    
    if (stream) {
      await this.startCameraStream(cameraId, stream.rtsp_url, newQuality);
    }
  }

  /**
   * Capture a snapshot from RTSP stream
   */
  async captureSnapshot(cameraId, rtspUrl) {
    const snapshotPath = path.join(this.streamDirectory, `${cameraId}_snapshot.jpg`);
    
    return new Promise((resolve, reject) => {
      const ffmpegArgs = [
        '-i', rtspUrl,
        '-vframes', '1',
        '-q:v', '2',
        '-y', // Overwrite output file
        snapshotPath
      ];

      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
      
      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          resolve(`/streams/${cameraId}_snapshot.jpg`);
        } else {
          reject(new Error(`Snapshot failed with code ${code}`));
        }
      });

      ffmpegProcess.on('error', reject);
    });
  }

  /**
   * Broadcast stream status to connected clients
   */
  broadcastStreamStatus(cameraId, quality, status) {
    if (this.wsServer) {
      const message = JSON.stringify({
        type: 'stream_status',
        camera_id: cameraId,
        quality,
        status,
        timestamp: new Date().toISOString()
      });

      this.wsServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  /**
   * Cleanup streams for disconnected client
   */
  cleanupClientStreams(ws) {
    // In a full implementation, you'd track which streams belong to which clients
    // For now, keep all streams running as they might be shared
  }

  /**
   * Get stream statistics
   */
  getStreamStats() {
    const stats = {
      active_streams: this.activeStreams.size,
      streams: []
    };

    this.activeStreams.forEach((stream, key) => {
      stats.streams.push({
        stream_key: key,
        camera_id: stream.camera_id,
        quality: stream.quality,
        uptime: Date.now() - stream.started_at.getTime(),
        output_path: stream.output_path
      });
    });

    return stats;
  }

  /**
   * Auto-start demo streams for development
   */
  async startDemoStreams() {
    console.log('🎬 Starting demo streams...');
    
    // Demo RTSP URLs (you can use these public test streams)
    const demoStreams = [
      {
        camera_id: 'cam_entrance_1',
        rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
        name: 'Main Entrance'
      },
      {
        camera_id: 'cam_parking_1', 
        rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
        name: 'Parking Garage'
      },
      {
        camera_id: 'cam_elevator_1',
        rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
        name: 'Elevator Bank'
      },
      {
        camera_id: 'cam_rooftop_1',
        rtsp_url: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov',
        name: 'Rooftop Access'
      }
    ];

    for (const stream of demoStreams) {
      try {
        await this.startCameraStream(stream.camera_id, stream.rtsp_url, 'thumbnail');
        console.log(`✅ Demo stream started: ${stream.name}`);
      } catch (error) {
        console.error(`❌ Failed to start demo stream ${stream.name}:`, error);
      }
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down streaming server...');
    
    // Stop all active streams
    for (const [streamKey, stream] of this.activeStreams) {
      console.log(`⏹️ Stopping stream: ${streamKey}`);
      stream.process.kill('SIGTERM');
    }
    
    this.activeStreams.clear();
    
    if (this.wsServer) {
      this.wsServer.close();
    }
  }
}

export default ApexStreamingServer;