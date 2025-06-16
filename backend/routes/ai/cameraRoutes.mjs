/**
 * ENHANCED CAMERA CONTROL SYSTEM - APEX AI
 * ========================================
 * Master Prompt v29.4-APEX Implementation
 * 
 * Features:
 * - RTSP camera digital zoom with AI-guided focus
 * - AI voice response system with TTS integration
 * - PTZ camera control commands
 * - Audio output and speaker integration
 * - Real-time camera capability management
 * - External Service Integration: TTS for voice warnings
 */

import express from 'express';
import { getIO, emitSocketEvent } from '../../src/socket.js';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
// Using built-in fetch (Node.js 18+)

// ==================================================
// EXTERNAL SERVICE INTEGRATIONS
// ==================================================
import ttsService from '../../services/external/ttsService.mjs';

dotenv.config();
const router = express.Router();

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
});

/**
 * CAMERA CAPABILITY VALIDATION
 * ============================
 * Validate camera features before executing commands
 */
const validateCameraCapabilities = async (cameraId, requiredCapabilities = []) => {
  try {
    const query = 'SELECT * FROM cameras WHERE camera_id = $1';
    const result = await pool.query(query, [cameraId]);
    
    if (result.rows.length === 0) {
      throw new Error('Camera not found');
    }
    
    const camera = result.rows[0];
    const capabilities = camera.capabilities || {};
    
    // Check if camera is online
    if (camera.status !== 'online') {
      throw new Error(`Camera is ${camera.status}`);
    }
    
    // Validate required capabilities
    for (const capability of requiredCapabilities) {
      if (!capabilities[capability]) {
        throw new Error(`Camera does not support ${capability}`);
      }
    }
    
    return {
      camera,
      capabilities,
      rtsp_url: camera.rtsp_url,
      control_url: camera.control_url
    };
    
  } catch (error) {
    console.error('Camera capability validation error:', error);
    throw error;
  }
};

/**
 * AI-GUIDED ZOOM PARAMETER CALCULATION
 * ===================================
 * Calculate optimal zoom parameters based on AI detection
 */
const calculateZoomParameters = (boundingBox, zoomLevel = 2, frameSize = { width: 1920, height: 1080 }) => {
  // Convert normalized coordinates to pixel coordinates
  const centerX = (boundingBox.x + boundingBox.width / 2) * frameSize.width;
  const centerY = (boundingBox.y + boundingBox.height / 2) * frameSize.height;
  
  // Calculate zoom region size
  const zoomWidth = Math.max(boundingBox.width * frameSize.width * zoomLevel, 200);
  const zoomHeight = Math.max(boundingBox.height * frameSize.height * zoomLevel, 150);
  
  // Ensure zoom region stays within frame bounds
  const minX = Math.max(0, centerX - zoomWidth / 2);
  const minY = Math.max(0, centerY - zoomHeight / 2);
  const maxX = Math.min(frameSize.width, minX + zoomWidth);
  const maxY = Math.min(frameSize.height, minY + zoomHeight);
  
  return {
    center_x: Math.round(centerX),
    center_y: Math.round(centerY),
    zoom_region: {
      x: Math.round(minX),
      y: Math.round(minY),
      width: Math.round(maxX - minX),
      height: Math.round(maxY - minY)
    },
    zoom_factor: zoomLevel,
    focus_area: {
      normalized: boundingBox,
      pixel: {
        x: Math.round(boundingBox.x * frameSize.width),
        y: Math.round(boundingBox.y * frameSize.height),
        width: Math.round(boundingBox.width * frameSize.width),
        height: Math.round(boundingBox.height * frameSize.height)
      }
    }
  };
};

/**
 * RTSP CAMERA CONTROL INTERFACE
 * =============================
 * Send PTZ commands to RTSP cameras
 */
const sendCameraCommand = async (camera, command, parameters) => {
  try {
    if (!camera.control_url) {
      throw new Error('Camera control URL not configured');
    }
    
    const controlPayload = {
      command: command,
      parameters: parameters,
      timestamp: new Date().toISOString(),
      camera_id: camera.camera_id
    };
    
    // Send command to camera control endpoint
    const response = await fetch(camera.control_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CAMERA_API_TOKEN}` // Camera system auth
      },
      body: JSON.stringify(controlPayload)
    });
    
    if (!response.ok) {
      throw new Error(`Camera control failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Log camera command
    await pool.query(
      'INSERT INTO camera_command_log (camera_id, command, parameters, response, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [
        camera.camera_id,
        command,
        JSON.stringify(parameters),
        JSON.stringify(result),
        new Date()
      ]
    );
    
    return result;
    
  } catch (error) {
    console.error('Camera command error:', error);
    throw error;
  }
};

/**
 * POST /api/cameras/{camera_id}/zoom
 * Enhanced digital zoom with AI-guided focus
 */
router.post('/:camera_id/zoom', async (req, res) => {
  const { camera_id } = req.params;
  const { action, parameters, detection_context } = req.body;
  
  try {
    // Validate camera capabilities
    const cameraData = await validateCameraCapabilities(camera_id, ['supports_ptz', 'supports_digital_zoom']);
    
    let zoomParams;
    
    if (action === 'digital_zoom' && detection_context) {
      // AI-guided zoom based on detection
      zoomParams = calculateZoomParameters(
        detection_context.bounding_box,
        parameters.zoom_level || 2
      );
    } else if (action === 'manual_zoom') {
      // Manual zoom control
      zoomParams = parameters;
    } else {
      return res.status(400).json({ error: 'Invalid zoom action or missing detection context' });
    }
    
    // Execute zoom command
    const commandResult = await sendCameraCommand(cameraData.camera, 'digital_zoom', zoomParams);
    
    // Real-time WebSocket notification
    emitSocketEvent('camera_zoom_activated', {
      camera_id,
      zoom_params: zoomParams,
      detection_context,
      timestamp: new Date().toISOString()
    });
    
    // Enhanced monitoring activation
    if (detection_context) {
      await activateEnhancedMonitoring(camera_id, detection_context.detection_type);
    }
    
    res.json({
      success: true,
      camera_id,
      zoom_parameters: zoomParams,
      command_result: commandResult,
      message: 'Digital zoom activated successfully'
    });
    
  } catch (error) {
    console.error('Camera zoom error:', error);
    res.status(500).json({
      error: 'Failed to activate digital zoom',
      details: error.message
    });
  }
});

/**
 * POST /api/cameras/{camera_id}/ptz
 * Pan-Tilt-Zoom camera control
 */
router.post('/:camera_id/ptz', async (req, res) => {
  const { camera_id } = req.params;
  const { action, direction, speed = 50, duration = 1000 } = req.body;
  
  try {
    const cameraData = await validateCameraCapabilities(camera_id, ['supports_ptz']);
    
    const ptzParams = {
      action, // 'pan', 'tilt', 'zoom', 'stop'
      direction, // 'left', 'right', 'up', 'down', 'in', 'out'
      speed: Math.max(1, Math.min(100, speed)), // 1-100%
      duration: Math.max(100, Math.min(10000, duration)) // 100ms-10s
    };
    
    const commandResult = await sendCameraCommand(cameraData.camera, 'ptz_control', ptzParams);
    
    emitSocketEvent('camera_ptz_command', {
      camera_id,
      ptz_params: ptzParams,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      camera_id,
      ptz_command: ptzParams,
      command_result: commandResult,
      message: `PTZ ${action} command executed`
    });
    
  } catch (error) {
    console.error('PTZ control error:', error);
    res.status(500).json({
      error: 'Failed to execute PTZ command',
      details: error.message
    });
  }
});

/**
 * POST /api/cameras/{camera_id}/voice-response
 * AI Voice Response with TTS integration
 */
router.post('/:camera_id/voice-response', async (req, res) => {
  const { camera_id } = req.params;
  const { message_type, custom_message, voice_options = {} } = req.body;
  
  try {
    const cameraData = await validateCameraCapabilities(camera_id, ['supports_audio_output']);
    
    // Predefined security messages
    const securityMessages = {
      'security_alert': 'Security alert. Please identify yourself.',
      'unauthorized_access': 'You are being monitored. Exit the premises immediately.',
      'weapon_detected': 'Attention: You are in a monitored security zone. Please remain calm and cooperate.',
      'intrusion_warning': 'This is a restricted area. Please leave now.',
      'general_warning': 'Warning: Suspicious activity detected.',
      'emergency_response': 'Emergency services have been contacted.'
    };
    
    // Get message text
    let messageText;
    if (custom_message) {
      messageText = custom_message;
    } else if (securityMessages[message_type]) {
      messageText = securityMessages[message_type];
    } else {
      return res.status(400).json({ error: 'Invalid message type or missing custom message' });
    }
    
    // Generate TTS audio using external service
    const audioBuffer = await ttsService.generateSpeech(messageText, {
      rate: voice_options.rate || 'medium',
      pitch: voice_options.pitch || 'medium',
      voice: voice_options.voice || 'default'
    });
    
    // Stream audio to camera speakers
    const streamResult = await ttsService.streamToCamera(camera_id, audioBuffer);
    
    // Log AI voice intervention
    await pool.query(
      'INSERT INTO camera_audio_log (camera_id, audio_type, message_text, tts_options, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [
        camera_id, 
        'ai_voice_response', 
        messageText, 
        JSON.stringify(voice_options), 
        new Date()
      ]
    );
    
    // Real-time WebSocket notification
    emitSocketEvent('ai_voice_response_sent', {
      camera_id,
      message_type,
      message_text: messageText,
      stream_result: streamResult,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      camera_id,
      message_type,
      message_text: messageText,
      tts_result: {
        audio_generated: true,
        audio_duration: streamResult.audio_duration,
        stream_success: streamResult.success
      },
      message: 'AI voice response sent to camera speakers'
    });
    
  } catch (error) {
    console.error('AI voice response error:', error);
    res.status(500).json({
      error: 'Failed to send AI voice response',
      details: error.message
    });
  }
});

/**
 * POST /api/cameras/{camera_id}/audio/play
 * Play pre-recorded audio through camera speakers
 */
router.post('/:camera_id/audio/play', async (req, res) => {
  const { camera_id } = req.params;
  
  try {
    const cameraData = await validateCameraCapabilities(camera_id, ['supports_audio_output']);
    
    // Handle audio file upload
    const audioData = req.body; // Assuming audio data is in request body
    
    if (!audioData) {
      return res.status(400).json({ error: 'No audio data provided' });
    }
    
    // Prepare audio playback parameters
    const audioParams = {
      audio_format: 'wav', // Default format
      volume: 80, // Default volume
      repeat_count: 1,
      priority: 'high'
    };
    
    // Send audio to camera speakers
    const playbackResult = await sendCameraCommand(cameraData.camera, 'audio_playback', {
      ...audioParams,
      audio_data: audioData
    });
    
    // Log audio intervention
    await pool.query(
      'INSERT INTO camera_audio_log (camera_id, audio_type, parameters, timestamp) VALUES ($1, $2, $3, $4)',
      [camera_id, 'speaker_playback', JSON.stringify(audioParams), new Date()]
    );
    
    emitSocketEvent('camera_audio_played', {
      camera_id,
      audio_params: audioParams,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      camera_id,
      playback_result: playbackResult,
      message: 'Audio played through camera speakers'
    });
    
  } catch (error) {
    console.error('Camera audio playback error:', error);
    res.status(500).json({
      error: 'Failed to play audio',
      details: error.message
    });
  }
});

/**
 * POST /api/cameras/{camera_id}/preset
 * Save or load camera preset positions
 */
router.post('/:camera_id/preset', async (req, res) => {
  const { camera_id } = req.params;
  const { action, preset_id, preset_name } = req.body;
  
  try {
    const cameraData = await validateCameraCapabilities(camera_id, ['supports_presets']);
    
    if (action === 'save') {
      // Save current position as preset
      const presetParams = {
        preset_id: preset_id || `preset_${Date.now()}`,
        preset_name: preset_name || `Preset ${new Date().toLocaleString()}`,
        save_current_position: true
      };
      
      const result = await sendCameraCommand(cameraData.camera, 'save_preset', presetParams);
      
      // Store preset in database
      await pool.query(
        'INSERT INTO camera_presets (camera_id, preset_id, preset_name, created_at) VALUES ($1, $2, $3, $4)',
        [camera_id, presetParams.preset_id, presetParams.preset_name, new Date()]
      );
      
      res.json({
        success: true,
        preset: presetParams,
        message: 'Camera preset saved successfully'
      });
      
    } else if (action === 'load') {
      // Load existing preset
      const result = await sendCameraCommand(cameraData.camera, 'load_preset', { preset_id });
      
      res.json({
        success: true,
        preset_id,
        command_result: result,
        message: 'Camera preset loaded successfully'
      });
      
    } else {
      res.status(400).json({ error: 'Invalid preset action' });
    }
    
  } catch (error) {
    console.error('Camera preset error:', error);
    res.status(500).json({
      error: 'Failed to handle camera preset',
      details: error.message
    });
  }
});

/**
 * GET /api/cameras/{camera_id}/status
 * Get real-time camera status and capabilities
 */
router.get('/:camera_id/status', async (req, res) => {
  const { camera_id } = req.params;
  
  try {
    const query = `
      SELECT 
        c.*,
        COUNT(aal.alert_id) as active_alerts,
        MAX(aal.timestamp) as last_alert_time
      FROM cameras c
      LEFT JOIN ai_alerts_log aal ON aal.camera_id = c.camera_id 
        AND aal.status IN ('pending', 'acknowledged')
      WHERE c.camera_id = $1
      GROUP BY c.camera_id
    `;
    
    const result = await pool.query(query, [camera_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Camera not found' });
    }
    
    const camera = result.rows[0];
    
    // Get recent commands
    const commandsQuery = `
      SELECT * FROM camera_command_log 
      WHERE camera_id = $1 
      ORDER BY timestamp DESC 
      LIMIT 10
    `;
    
    const commandsResult = await pool.query(commandsQuery, [camera_id]);
    
    res.json({
      success: true,
      camera: {
        ...camera,
        recent_commands: commandsResult.rows
      }
    });
    
  } catch (error) {
    console.error('Camera status error:', error);
    res.status(500).json({
      error: 'Failed to get camera status',
      details: error.message
    });
  }
});

/**
 * Helper function: Activate enhanced monitoring
 */
const activateEnhancedMonitoring = async (cameraId, detectionType) => {
  try {
    // Increase AI processing frequency for this camera
    emitSocketEvent('enhanced_monitoring_activated', {
      camera_id: cameraId,
      detection_type: detectionType,
      monitoring_level: 'enhanced',
      duration_seconds: 300, // 5 minutes
      timestamp: new Date().toISOString()
    });
    
    // Log enhanced monitoring activation
    await pool.query(
      'INSERT INTO camera_monitoring_log (camera_id, monitoring_type, detection_context, activated_at) VALUES ($1, $2, $3, $4)',
      [cameraId, 'enhanced', detectionType, new Date()]
    );
    
  } catch (error) {
    console.error('Enhanced monitoring activation error:', error);
  }
};

/**
 * POST /api/cameras/{camera_id}/monitoring/enhance
 * Manually activate enhanced monitoring
 */
router.post('/:camera_id/monitoring/enhance', async (req, res) => {
  const { camera_id } = req.params;
  const { detection_type, duration_minutes = 5 } = req.body;
  
  try {
    await activateEnhancedMonitoring(camera_id, detection_type);
    
    res.json({
      success: true,
      camera_id,
      monitoring_level: 'enhanced',
      duration_minutes,
      message: 'Enhanced monitoring activated'
    });
    
  } catch (error) {
    console.error('Enhanced monitoring error:', error);
    res.status(500).json({
      error: 'Failed to activate enhanced monitoring',
      details: error.message
    });
  }
});

/**
 * GET /api/cameras/voice-messages
 * Get available TTS voice message templates
 */
router.get('/voice-messages', async (req, res) => {
  try {
    const messageTemplates = {
      security_messages: {
        'security_alert': 'Security alert. Please identify yourself.',
        'unauthorized_access': 'You are being monitored. Exit the premises immediately.',
        'weapon_detected': 'Attention: You are in a monitored security zone. Please remain calm and cooperate.',
        'intrusion_warning': 'This is a restricted area. Please leave now.',
        'general_warning': 'Warning: Suspicious activity detected.',
        'emergency_response': 'Emergency services have been contacted.'
      },
      voice_options: {
        rates: ['slow', 'medium', 'fast'],
        pitches: ['low', 'medium', 'high'],
        voices: ['default', 'authoritative', 'calm']
      },
      tts_status: await ttsService.getServiceHealth()
    };
    
    res.json({
      success: true,
      templates: messageTemplates,
      message: 'Voice message templates retrieved successfully'
    });
    
  } catch (error) {
    console.error('Voice messages template error:', error);
    res.status(500).json({
      error: 'Failed to get voice message templates',
      details: error.message
    });
  }
});

/**
 * GET /api/cameras
 * Get all cameras with status and capabilities
 */
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*,
        COUNT(aal.alert_id) as active_alerts,
        MAX(aal.timestamp) as last_alert_time
      FROM cameras c
      LEFT JOIN ai_alerts_log aal ON aal.camera_id = c.camera_id 
        AND aal.status IN ('pending', 'acknowledged')
      GROUP BY c.camera_id
      ORDER BY c.name
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      cameras: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Cameras list error:', error);
    res.status(500).json({
      error: 'Failed to get cameras list',
      details: error.message
    });
  }
});

export default router;