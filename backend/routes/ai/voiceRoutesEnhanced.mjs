/**
 * VOICE AI DISPATCHER ROUTES - MASTER PROMPT v52.0 (ENHANCED)
 * ==========================================================
 * Revolutionary Voice AI Dispatcher API endpoints
 * Enhanced integration with new database models:
 * - CallLog model with proper field names
 * - StandardOperatingProcedure model integration
 * - ContactList model for automated notifications
 * 
 * Features:
 * - Twilio webhook handling for inbound calls
 * - Real-time call management and monitoring
 * - Voice-generated incident creation
 * - Human takeover capabilities
 * - Call transcription and recording management
 * - Standard Operating Procedures (SOP) management
 * - Emergency services dispatch integration
 * - MCP Server communication for AI Agent coordination
 */

import express from 'express';
import { getIO, emitSocketEvent } from '../../src/socket.js';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import twilio from 'twilio';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import apiValidationService from '../../services/apiValidationService.mjs';

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

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioClient = twilio(accountSid, authToken);

// Middleware to parse Twilio webhooks
router.use(express.urlencoded({ extended: false }));

/**
 * API VALIDATION & SYSTEM HEALTH ENDPOINTS - MASTER PROMPT v52.0
 * ===============================================================
 * Enhanced Voice AI system monitoring and API validation endpoints
 * 
 * Features:
 * - Real-time API connectivity status
 * - System health monitoring
 * - Configuration validation
 * - Circuit breaker status
 * - Voice AI readiness assessment
 */

/**
 * GET /api/voice/system/status
 * Get comprehensive system status including all APIs
 */
router.get('/system/status', async (req, res) => {
  try {
    const { force_refresh } = req.query;
    const systemStatus = await apiValidationService.getSystemStatus(force_refresh === 'true');
    
    res.json({
      success: true,
      system_status: systemStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ System status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/voice/system/health/{service}
 * Get specific API service health status
 */
router.get('/system/health/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const { force_refresh } = req.query;
    
    const validServices = ['twilio', 'deepgram', 'elevenlabs', 'ollama', 'database'];
    if (!validServices.includes(service)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service name',
        valid_services: validServices
      });
    }
    
    const serviceStatus = await apiValidationService.getApiStatus(service, force_refresh === 'true');
    
    res.json({
      success: true,
      service,
      status: serviceStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ ${req.params.service} health check error:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to check ${req.params.service} health`,
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/voice/system/configuration
 * Validate API configuration completeness
 */
router.get('/system/configuration', async (req, res) => {
  try {
    const configStatus = apiValidationService.validateApiConfiguration();
    
    res.json({
      success: true,
      configuration_status: configStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Configuration validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate configuration',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/voice/system/readiness
 * Get Voice AI system readiness for operations
 */
router.get('/system/readiness', async (req, res) => {
  try {
    const readinessStatus = await apiValidationService.getVoiceAIReadiness();
    
    res.json({
      success: true,
      readiness: readinessStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Readiness check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check system readiness',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/voice/system/circuit-breakers
 * Get circuit breaker status for all services
 */
router.get('/system/circuit-breakers', async (req, res) => {
  try {
    const circuitStatus = apiValidationService.getCircuitBreakerStatus();
    
    res.json({
      success: true,
      circuit_breakers: circuitStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Circuit breaker status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get circuit breaker status',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/voice/system/circuit-breakers/{service}/reset
 * Manually reset circuit breaker for a service
 */
router.post('/system/circuit-breakers/:service/reset', async (req, res) => {
  try {
    const { service } = req.params;
    const success = apiValidationService.resetCircuitBreakerManually(service);
    
    if (success) {
      res.json({
        success: true,
        message: `Circuit breaker reset for ${service}`,
        service,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Service ${service} not found`,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error(`❌ Circuit breaker reset error for ${req.params.service}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to reset circuit breaker for ${req.params.service}`,
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/voice/system/essential
 * Get essential services status (database + ollama only) for quick checks
 */
router.get('/system/essential', async (req, res) => {
  try {
    const essentialStatus = await apiValidationService.getEssentialStatus();
    
    res.json({
      success: true,
      essential_services: essentialStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Essential services check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check essential services',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/voice/system/test-connection
 * Test connection to specific API service with detailed diagnostics
 */
router.post('/system/test-connection', async (req, res) => {
  try {
    const { service, config } = req.body;
    
    if (!service) {
      return res.status(400).json({
        success: false,
        error: 'Service parameter is required'
      });
    }
    
    const testResult = await apiValidationService.getApiStatus(service, true);
    
    // Emit real-time update for UI
    emitSocketEvent('api_test_result', {
      service,
      result: testResult,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      service,
      test_result: testResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Connection test error:', error);
    
    const errorResult = {
      service: req.body.service,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    // Emit error result for UI
    emitSocketEvent('api_test_result', {
      service: req.body.service,
      result: errorResult,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      error: 'Connection test failed',
      test_result: errorResult,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * WebSocket subscription endpoint for real-time API status updates
 * This allows frontend components to subscribe to API status changes
 */
router.post('/system/subscribe', async (req, res) => {
  try {
    const { client_id } = req.body;
    
    // Subscribe to API status changes
    const unsubscribe = apiValidationService.subscribe((notification) => {
      // Emit to specific client or broadcast
      emitSocketEvent('api_status_change', {
        ...notification,
        client_id
      });
    });
    
    // Store unsubscribe function for cleanup (in production, use Redis or similar)
    // For now, just confirm subscription
    res.json({
      success: true,
      message: 'Subscribed to API status updates',
      client_id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to API updates',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * TWILIO WEBHOOK HANDLERS - ENHANCED DATABASE INTEGRATION
 * =======================================================
 * Handle inbound calls and call status updates with proper model fields
 */

/**
 * POST /api/voice/webhook/incoming
 * Twilio webhook for incoming calls - Enhanced with new database schema
 */
router.post('/webhook/incoming', async (req, res) => {
  try {
    const {
      CallSid,
      From: callerPhone,
      To: twilioNumber,
      CallStatus,
      Direction
    } = req.body;

    console.log(`📞 Incoming call: ${CallSid} from ${callerPhone}`);

    // Create TwiML response to answer and start processing
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Initial greeting with Voice AI Dispatcher branding
    twiml.say({
      voice: 'Polly.Joanna',
      language: 'en-US'
    }, 'Hello, this is APEX AI Security Dispatch. How may I assist you with your security concern?');
    
    // Start call recording with enhanced settings
    twiml.record({
      action: '/api/voice/webhook/recording',
      method: 'POST',
      transcribe: true,
      transcribeCallback: '/api/voice/webhook/transcription',
      maxLength: parseInt(process.env.VOICE_AI_MAX_CALL_DURATION) || 600,
      playBeep: false,
      recordingStatusCallback: '/api/voice/webhook/recording-status'
    });
    
    // Gather speech input with enhanced settings
    const gather = twiml.gather({
      input: 'speech',
      action: '/api/voice/webhook/speech',
      method: 'POST',
      speechTimeout: 'auto',
      enhanced: true,
      speechModel: 'phone_call',
      language: 'en-US'
    });
    
    gather.say({
      voice: 'Polly.Joanna'
    }, 'Please describe the nature of your security concern. Take your time.');
    
    // Fallback if no speech detected
    twiml.say('I didn\\'t hear a response. Please speak clearly and describe your concern.');
    twiml.redirect('/api/voice/webhook/speech');

    // Create call log in database using new schema
    const callId = uuidv4();
    
    try {
      await pool.query(`
        INSERT INTO call_logs (
          call_id, 
          twilio_call_sid, 
          caller_phone, 
          call_direction, 
          call_status,
          call_start_time, 
          ai_confidence_score,
          processing_status,
          full_transcript,
          extracted_information,
          ai_actions_taken,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        callId,
        CallSid,
        callerPhone,
        'inbound',
        'in_progress',
        new Date(),
        0.0,
        'processing',
        JSON.stringify([]),
        JSON.stringify({
          incident_type: null,
          location: null,
          urgency_level: null,
          caller_callback: callerPhone,
          additional_details: {}
        }),
        JSON.stringify({
          notifications_sent: [],
          guard_dispatched: false,
          police_called: false,
          incident_created: false
        }),
        new Date(),
        new Date()
      ]);
      
      console.log(`📋 Call log created: ${callId}`);
    } catch (dbError) {
      console.error('❌ Database call log error:', dbError);
    }

    // Notify Voice AI Agent via WebSocket and MCP
    const callData = {
      call_id: callId,
      twilio_call_sid: CallSid,
      caller_phone: callerPhone,
      status: 'in_progress',
      timestamp: new Date().toISOString()
    };

    // Real-time WebSocket notification
    emitSocketEvent('voice_call_incoming', callData);
    
    // Notify MCP Server for AI Agent processing
    try {
      await notifyMCPServer('voice_call_started', callData);
    } catch (mcpError) {
      console.error('⚠️ MCP notification error:', mcpError.message);
    }

    // Send TwiML response
    res.type('text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('❌ Incoming call webhook error:', error);
    
    // Error fallback TwiML
    const errorTwiml = new twilio.twiml.VoiceResponse();
    errorTwiml.say('I\\'m sorry, there\\'s a technical issue. Please call back in a moment or contact emergency services if this is urgent.');
    errorTwiml.hangup();
    
    res.type('text/xml');
    res.send(errorTwiml.toString());
  }
});

/**
 * POST /api/voice/webhook/speech
 * Handle speech input from caller - Enhanced with SOP integration
 */
router.post('/webhook/speech', async (req, res) => {
  try {
    const {
      CallSid,
      SpeechResult,
      Confidence,
      From: callerPhone
    } = req.body;

    console.log(`🎤 Speech received: ${SpeechResult} (${Confidence}% confidence)`);

    // Get call from database using new schema
    const callQuery = await pool.query(
      'SELECT * FROM call_logs WHERE twilio_call_sid = $1',
      [CallSid]
    );
    
    if (callQuery.rows.length === 0) {
      throw new Error(`Call not found: ${CallSid}`);
    }
    
    const call = callQuery.rows[0];

    // Update transcript in database using new JSON field structure
    const currentTranscript = call.full_transcript || [];
    const transcriptEntry = {
      timestamp: new Date().toISOString(),
      speaker: 'caller',
      message: SpeechResult,
      confidence: parseFloat(Confidence) / 100,
      sequence: currentTranscript.length + 1
    };
    
    currentTranscript.push(transcriptEntry);

    // Extract information from speech for incident classification
    const extractedInfo = await extractIncidentInformation(SpeechResult, call.extracted_information);
    
    // Update call log with new transcript and extracted information
    await pool.query(`
      UPDATE call_logs SET 
        full_transcript = $1, 
        extracted_information = $2,
        ai_confidence_score = $3,
        processing_status = $4,
        updated_at = $5 
      WHERE call_id = $6
    `, [
      JSON.stringify(currentTranscript),
      JSON.stringify(extractedInfo),
      parseFloat(Confidence) / 100,
      'analyzing',
      new Date(),
      call.call_id
    ]);

    // Notify Voice AI Agent for processing via MCP
    const speechData = {
      call_id: call.call_id,
      twilio_call_sid: CallSid,
      transcript: SpeechResult,
      confidence: parseFloat(Confidence) / 100,
      extracted_information: extractedInfo,
      timestamp: new Date().toISOString()
    };

    emitSocketEvent('voice_speech_received', speechData);
    
    try {
      await notifyMCPServer('voice_speech_processing', speechData);
    } catch (mcpError) {
      console.error('⚠️ MCP speech processing error:', mcpError.message);
    }

    // Get appropriate Standard Operating Procedure
    const sop = await getApplicableSOP(extractedInfo);
    let aiResponse;
    
    if (sop) {
      // Use SOP-driven response
      aiResponse = await generateSOPResponse(sop, extractedInfo, currentTranscript);
      
      // Update call log with SOP reference
      await pool.query(
        'UPDATE call_logs SET sop_id = $1 WHERE call_id = $2',
        [sop.sop_id, call.call_id]
      );
    } else {
      // Use general AI response
      aiResponse = await generateAIResponse(call, SpeechResult);
    }

    // Create TwiML response
    const twiml = new twilio.twiml.VoiceResponse();
    
    twiml.say({
      voice: 'Polly.Joanna'
    }, aiResponse);
    
    // Continue gathering speech or complete call based on information completeness
    if (shouldContinueGathering(extractedInfo, currentTranscript)) {
      const gather = twiml.gather({
        input: 'speech',
        action: '/api/voice/webhook/speech',
        method: 'POST',
        speechTimeout: 'auto',
        enhanced: true
      });
      
      gather.say('Is there anything else I should know about this situation?');
    } else {
      // Complete the call and create incident
      twiml.redirect('/api/voice/webhook/complete');
    }

    res.type('text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('❌ Speech webhook error:', error);
    
    const errorTwiml = new twilio.twiml.VoiceResponse();
    errorTwiml.say('I\\'m processing your request. Please hold on while I gather the necessary information.');
    errorTwiml.redirect('/api/voice/webhook/speech');
    
    res.type('text/xml');
    res.send(errorTwiml.toString());
  }
});

/**
 * POST /api/voice/webhook/complete
 * Complete the call and create incident - Enhanced with SOP automation
 */
router.post('/webhook/complete', async (req, res) => {
  try {
    const { CallSid } = req.body;

    // Get call from database
    const callQuery = await pool.query(
      `SELECT cl.*, sop.* FROM call_logs cl 
       LEFT JOIN standard_operating_procedures sop ON cl.sop_id = sop.sop_id 
       WHERE cl.twilio_call_sid = $1`,
      [CallSid]
    );
    
    if (callQuery.rows.length > 0) {
      const call = callQuery.rows[0];
      
      // Create incident from call using enhanced process
      const incidentId = await createIncidentFromCall(call);
      
      if (incidentId) {
        // Update call log with completion status
        await pool.query(`
          UPDATE call_logs SET 
            call_status = $1, 
            incident_id = $2,
            call_end_time = $3,
            call_duration_seconds = EXTRACT(EPOCH FROM ($3 - call_start_time))::INTEGER,
            processing_status = $4,
            updated_at = $5
          WHERE call_id = $6
        `, [
          'completed', 
          incidentId, 
          new Date(),
          'completed',
          new Date(),
          call.call_id
        ]);
        
        // Execute SOP automated actions if available
        if (call.sop_id) {
          await executeSopActions(call, incidentId);
        }
        
        // Final message to caller
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say({
          voice: 'Polly.Joanna'
        }, `Thank you for your report. I've created incident number ${incidentId.slice(-8)} and initiated the appropriate response procedures. You may receive a follow-up call if additional information is needed. Have a safe day.`);
        twiml.hangup();
        
        res.type('text/xml');
        res.send(twiml.toString());
        
        return;
      }
    }
    
    // Fallback completion
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Thank you for calling APEX AI Security. Your report has been received and appropriate action will be taken.');
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('❌ Call completion error:', error);
    
    const errorTwiml = new twilio.twiml.VoiceResponse();
    errorTwiml.say('Thank you for calling. Your report has been received and will be processed.');
    errorTwiml.hangup();
    
    res.type('text/xml');
    res.send(errorTwiml.toString());
  }
});

/**
 * ENHANCED CALL MANAGEMENT API ENDPOINTS
 * ======================================
 * Manage active calls with new database schema
 */

/**
 * GET /api/voice/calls/active
 * Get all active voice calls with enhanced details
 */
router.get('/calls/active', async (req, res) => {
  try {
    const query = `
      SELECT 
        cl.*,
        i.incident_number,
        i.priority,
        i.status as incident_status,
        sop.title as sop_title,
        sop.incident_type as sop_incident_type,
        p.name as property_name
      FROM call_logs cl
      LEFT JOIN incidents i ON i.id = cl.incident_id
      LEFT JOIN standard_operating_procedures sop ON cl.sop_id = sop.sop_id
      LEFT JOIN properties p ON cl.property_id = p.property_id
      WHERE cl.call_status IN ('in_progress', 'ai_handling', 'human_takeover')
      ORDER BY cl.call_start_time DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      active_calls: result.rows,
      total_active: result.rows.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Get active calls error:', error);
    res.status(500).json({
      error: 'Failed to get active calls',
      details: error.message
    });
  }
});

/**
 * POST /api/voice/calls/{call_id}/takeover
 * Human dispatcher takes over the call - Enhanced with MCP notification
 */
router.post('/calls/:call_id/takeover', async (req, res) => {
  const { call_id } = req.params;
  const { dispatcher_id, reason } = req.body;
  
  try {
    // Update call log with takeover information
    await pool.query(`
      UPDATE call_logs SET 
        human_takeover = TRUE,
        human_takeover_time = $1,
        takeover_reason = $2,
        call_status = $3,
        processing_status = $4,
        updated_at = $5
      WHERE call_id = $6
    `, [
      new Date(),
      reason || 'Manual intervention',
      'human_takeover',
      'human_controlled',
      new Date(),
      call_id
    ]);
    
    // Get call details for notifications
    const callQuery = await pool.query(
      'SELECT * FROM call_logs WHERE call_id = $1',
      [call_id]
    );
    
    if (callQuery.rows.length > 0) {
      const call = callQuery.rows[0];
      
      const takeoverData = {
        call_id,
        twilio_call_sid: call.twilio_call_sid,
        dispatcher_id,
        reason,
        timestamp: new Date().toISOString()
      };
      
      // Notify via WebSocket for real-time UI updates
      emitSocketEvent('voice_call_takeover', takeoverData);
      
      // Notify MCP Server to stop AI processing
      try {
        await notifyMCPServer('voice_call_takeover', takeoverData);
      } catch (mcpError) {
        console.error('⚠️ MCP takeover notification error:', mcpError.message);
      }
      
      res.json({
        success: true,
        message: 'Call takeover initiated successfully',
        call_id,
        twilio_call_sid: call.twilio_call_sid,
        takeover_time: new Date().toISOString()
      });
    } else {
      res.status(404).json({ error: 'Call not found' });
    }
    
  } catch (error) {
    console.error('❌ Call takeover error:', error);
    res.status(500).json({
      error: 'Failed to takeover call',
      details: error.message
    });
  }
});

/**
 * ENHANCED SOP MANAGEMENT ENDPOINTS
 * ==================================
 * Manage Standard Operating Procedures with new database schema
 */

/**
 * GET /api/voice/sop
 * Get Standard Operating Procedures with enhanced filtering
 */
router.get('/sop', async (req, res) => {
  try {
    const { property_id, incident_type, is_active } = req.query;
    
    let query = `
      SELECT sop.*, p.name as property_name, cl.name as contact_list_name
      FROM standard_operating_procedures sop
      LEFT JOIN properties p ON sop.property_id = p.property_id
      LEFT JOIN contact_lists cl ON sop.contact_list_id = cl.contact_list_id
      WHERE 1=1
    `;
    const params = [];
    
    if (property_id) {
      params.push(property_id);
      query += ` AND sop.property_id = $${params.length}`;
    }
    
    if (incident_type) {
      params.push(incident_type);
      query += ` AND sop.incident_type = $${params.length}`;
    }
    
    if (is_active !== undefined) {
      params.push(is_active === 'true');
      query += ` AND sop.is_active = $${params.length}`;
    }
    
    query += ' ORDER BY sop.property_id, sop.incident_type, sop.priority_level DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      sops: result.rows,
      total: result.rows.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Get SOPs error:', error);
    res.status(500).json({
      error: 'Failed to get SOPs',
      details: error.message
    });
  }
});

/**
 * ENHANCED HELPER FUNCTIONS
 * =========================
 * Supporting functions with new database schema integration
 */

/**
 * Notify MCP Server of voice events
 */
async function notifyMCPServer(eventType, data) {
  try {
    const mcpUrl = process.env.MCP_API_BASE || 'http://localhost:8766/mcp';
    
    await axios.post(`${mcpUrl}/voice-event`, {
      event_type: eventType,
      data: data,
      timestamp: new Date().toISOString()
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 MCP notification sent: ${eventType}`);
  } catch (error) {
    console.error(`❌ MCP notification failed for ${eventType}:`, error.message);
    throw error;
  }
}

/**
 * Extract incident information from speech using AI processing
 */
async function extractIncidentInformation(speechText, currentInfo) {
  try {
    const extracted = { ...currentInfo };
    const lowerText = speechText.toLowerCase();
    
    // Extract incident type
    if (!extracted.incident_type) {
      if (lowerText.includes('emergency') || lowerText.includes('urgent')) {
        extracted.incident_type = 'emergency';
        extracted.urgency_level = 'critical';
      } else if (lowerText.includes('security') || lowerText.includes('suspicious')) {
        extracted.incident_type = 'security_incident';
        extracted.urgency_level = 'high';
      } else if (lowerText.includes('noise') || lowerText.includes('loud')) {
        extracted.incident_type = 'noise_complaint';
        extracted.urgency_level = 'medium';
      } else if (lowerText.includes('lock') || lowerText.includes('locked')) {
        extracted.incident_type = 'lockout';
        extracted.urgency_level = 'low';
      }
    }
    
    // Extract location information
    const locationMatch = lowerText.match(/(?:unit|apartment|room|floor|building)\s*([0-9a-z\-]+)/i);
    if (locationMatch && !extracted.location) {
      extracted.location = locationMatch[0];
    }
    
    // Extract additional details
    if (speechText.length > 20) {
      extracted.additional_details.description = speechText;
      extracted.additional_details.word_count = speechText.split(' ').length;
    }
    
    return extracted;
  } catch (error) {
    console.error('❌ Information extraction error:', error);
    return currentInfo;
  }
}

/**
 * Get applicable Standard Operating Procedure for incident
 */
async function getApplicableSOP(extractedInfo) {
  try {
    if (!extractedInfo.incident_type) return null;
    
    const sopQuery = await pool.query(`
      SELECT * FROM standard_operating_procedures 
      WHERE incident_type = $1 AND is_active = TRUE 
      ORDER BY priority_level DESC 
      LIMIT 1
    `, [extractedInfo.incident_type]);
    
    return sopQuery.rows.length > 0 ? sopQuery.rows[0] : null;
  } catch (error) {
    console.error('❌ SOP retrieval error:', error);
    return null;
  }
}

/**
 * Generate SOP-driven response
 */
async function generateSOPResponse(sop, extractedInfo, transcript) {
  try {
    const conversationFlow = sop.conversation_flow || {};
    const responses = conversationFlow.responses || {};
    
    // Use SOP-specific response based on incident type
    if (responses[extractedInfo.incident_type]) {
      return responses[extractedInfo.incident_type];
    }
    
    // Fallback to general SOP greeting
    return conversationFlow.greeting || 
           'Thank you for providing that information. I am processing your request according to our procedures.';
    
  } catch (error) {
    console.error('❌ SOP response generation error:', error);
    return 'I understand your concern and am processing your request.';
  }
}

/**
 * Execute SOP automated actions
 */
async function executeSopActions(call, incidentId) {
  try {
    const automatedActions = call.automated_actions || {};
    const actionsExecuted = [];
    
    // Send notifications if configured
    if (automatedActions.notifications && automatedActions.notifications.length > 0) {
      for (const notification of automatedActions.notifications) {
        await sendNotification(notification, call, incidentId);
        actionsExecuted.push(`notification_${notification.type}`);
      }
    }
    
    // Dispatch guard if configured
    if (automatedActions.guard_dispatch) {
      await dispatchGuard(call, incidentId);
      actionsExecuted.push('guard_dispatched');
    }
    
    // Update call log with executed actions
    const updatedActions = {
      ...JSON.parse(call.ai_actions_taken || '{}'),
      sop_actions_executed: actionsExecuted,
      sop_execution_time: new Date().toISOString()
    };
    
    await pool.query(
      'UPDATE call_logs SET ai_actions_taken = $1 WHERE call_id = $2',
      [JSON.stringify(updatedActions), call.call_id]
    );
    
    console.log(`✅ SOP actions executed for call ${call.call_id}:`, actionsExecuted);
    
  } catch (error) {
    console.error('❌ SOP action execution error:', error);
  }
}

/**
 * Determine if call should continue gathering information
 */
function shouldContinueGathering(extractedInfo, transcript) {
  try {
    // Continue if critical information is missing
    if (!extractedInfo.incident_type || !extractedInfo.location) {
      return transcript.length < 8; // Max 8 exchanges
    }
    
    // Continue for emergency situations to gather more details
    if (extractedInfo.urgency_level === 'critical') {
      return transcript.length < 5;
    }
    
    // Stop gathering for simple incidents with sufficient info
    return transcript.length < 3;
    
  } catch (error) {
    console.error('❌ Gathering decision error:', error);
    return false;
  }
}

/**
 * Enhanced AI response generation
 */
async function generateAIResponse(call, speechInput) {
  try {
    const input = speechInput.toLowerCase();
    
    if (input.includes('emergency') || input.includes('urgent')) {
      return 'I understand this is urgent. I\\'m processing your emergency request immediately. Can you confirm your exact location within the property?';
    } else if (input.includes('noise') || input.includes('loud')) {
      return 'I understand there\\'s a noise disturbance. Can you tell me which unit or specific area this is coming from, and what type of noise you\\'re hearing?';
    } else if (input.includes('security') || input.includes('suspicious')) {
      return 'Thank you for reporting this security concern. Can you describe what you observed, when it occurred, and the specific location?';
    } else if (input.includes('lock') || input.includes('locked out')) {
      return 'I can help coordinate lockout assistance. Can you confirm your unit number and have identification ready for verification?';
    } else {
      return 'I understand your concern. Can you provide more specific details about the situation, including the location and what you observed?';
    }
    
  } catch (error) {
    console.error('❌ AI response generation error:', error);
    return 'I\\'m here to help with your security concern. Please provide more details about the situation.';
  }
}

/**
 * Create incident from call with enhanced database integration
 */
async function createIncidentFromCall(call) {
  try {
    const extractedInfo = call.extracted_information || {};
    const transcript = call.full_transcript || [];
    
    // Generate incident details
    const incidentId = uuidv4();
    const incidentNumber = `VA${Date.now().toString().slice(-6)}`;
    
    const callerMessages = transcript
      .filter(entry => entry.speaker === 'caller')
      .map(entry => entry.message)
      .join(' ');
    
    // Determine incident details from extracted information
    const incidentType = extractedInfo.incident_type || 'general_inquiry';
    const priority = extractedInfo.urgency_level || 'medium';
    const location = extractedInfo.location || 'Unknown location';
    
    // Create incident with comprehensive data
    await pool.query(`
      INSERT INTO incidents (
        id, incident_number, title, description, incident_type,
        priority, reported_at, location, reported_by,
        caller_phone, caller_name, status,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
    `, [
      incidentId,
      incidentNumber,
      `Voice AI: ${incidentType}`,
      callerMessages.substring(0, 500) || 'Voice call incident',
      incidentType,
      priority,
      call.call_start_time,
      location,
      'voice_ai_system',
      call.caller_phone,
      extractedInfo.caller_name || null,
      'open',
      new Date(),
      new Date()
    ]);
    
    // Emit notification for real-time updates
    emitSocketEvent('voice_incident_created', {
      incident_id: incidentId,
      incident_number: incidentNumber,
      call_id: call.call_id,
      incident_type: incidentType,
      priority,
      caller_phone: call.caller_phone,
      location,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Incident created from voice call: ${incidentNumber}`);
    return incidentId;
    
  } catch (error) {
    console.error('❌ Voice incident creation error:', error);
    return null;
  }
}

// Placeholder functions for SOP actions (to be implemented based on requirements)
async function sendNotification(notification, call, incidentId) {
  console.log(`📧 Sending notification: ${notification.type} for incident ${incidentId}`);
}

async function dispatchGuard(call, incidentId) {
  console.log(`👮 Dispatching guard for incident ${incidentId}`);
}

export default router;
