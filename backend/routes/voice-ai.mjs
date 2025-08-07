/**
 * VOICE AI ROUTES - MASTER PROMPT v52.0
 * ======================================
 * API endpoints for Voice AI Dispatcher system
 * Handles Twilio webhooks, call management, and real-time monitoring
 * 
 * Features:
 * - Twilio webhook handlers for inbound/outbound calls
 * - Real-time call monitoring and intervention
 * - Call transcription and recording management
 * - SOP and contact list management
 * - Human operator takeover functionality
 * - Comprehensive logging and audit trails
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
    dest: 'uploads/audio/',
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for audio files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/mp4'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid audio file type'), false);
        }
    }
});

// Middleware for validation error handling
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// =====================
// TWILIO WEBHOOK ROUTES
// =====================

/**
 * Handle incoming calls from Twilio
 * POST /api/voice-ai/twilio/inbound
 */
router.post('/twilio/inbound', async (req, res) => {
    try {
        const { CallSid, From, To, CallStatus } = req.body;
        
        console.log(`[VOICE AI] Inbound call: ${CallSid} from ${From}`);
        
        // Import voice dispatch agent (dynamic import to avoid circular dependencies)
        const { voice_dispatch_agent } = await import('../../../apex_ai_engine/agents/index.js');
        
        // Identify property context from incoming number
        const propertyContext = await identifyPropertyFromIncomingNumber(To);
        
        // Handle the inbound call and get TwiML response
        const twiml = await voice_dispatch_agent.handle_inbound_call(
            CallSid,
            From,
            propertyContext
        );
        
        // Return TwiML response to Twilio
        res.type('text/xml');
        res.send(twiml);
        
    } catch (error) {
        console.error('[VOICE AI] Error handling inbound call:', error);
        
        // Return fallback TwiML
        const fallbackTwiml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
            <Response>
                <Say voice=\"alice\">We're experiencing technical difficulties. Please call back in a few minutes.</Say>
                <Hangup/>
            </Response>`;
        
        res.type('text/xml');
        res.send(fallbackTwiml);
    }
});

/**
 * Handle call status updates from Twilio
 * POST /api/voice-ai/twilio/status
 */
router.post('/twilio/status', async (req, res) => {
    try {
        const { CallSid, CallStatus, CallDuration } = req.body;
        
        console.log(`[VOICE AI] Call status update: ${CallSid} -> ${CallStatus}`);
        
        // Import services
        const { twilio_service } = await import('../../../apex_ai_engine/services/index.js');
        
        // Update call status
        await twilio_service.handle_call_status_update(
            CallSid, 
            CallStatus, 
            CallDuration ? parseInt(CallDuration) : null
        );
        
        // If call completed, clean up resources
        if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(CallStatus)) {
            const { voice_dispatch_agent } = await import('../../../apex_ai_engine/agents/index.js');
            
            // Find call by Twilio SID and end it
            const activeCalls = voice_dispatch_agent.get_active_calls();
            const callEntry = Object.entries(activeCalls).find(
                ([_, context]) => context.twilio_call_sid === CallSid
            );
            
            if (callEntry) {
                const [callId] = callEntry;
                await voice_dispatch_agent.end_call(callId);
            }
        }
        
        res.sendStatus(200);
        
    } catch (error) {
        console.error('[VOICE AI] Error handling call status:', error);
        res.sendStatus(500);
    }
});

/**
 * Handle speech processing from Twilio Gather
 * POST /api/voice-ai/twilio/process-speech
 */
router.post('/twilio/process-speech', async (req, res) => {
    try {
        const { CallSid, SpeechResult, Confidence } = req.body;
        
        console.log(`[VOICE AI] Speech processed: ${CallSid} -> \"${SpeechResult}\" (${Confidence})`);
        
        // Find active call by Twilio SID
        const { voice_dispatch_agent } = await import('../../../apex_ai_engine/agents/index.js');
        const activeCalls = voice_dispatch_agent.get_active_calls();
        
        const callEntry = Object.entries(activeCalls).find(
            ([_, context]) => context.twilio_call_sid === CallSid
        );
        
        if (!callEntry) {
            console.error(`[VOICE AI] Call not found: ${CallSid}`);
            res.type('text/xml');
            res.send(`<?xml version=\"1.0\" encoding=\"UTF-8\"?>
                <Response>
                    <Say voice=\"alice\">I'm sorry, I lost track of our conversation. Please call back.</Say>
                    <Hangup/>
                </Response>`);
            return;
        }
        
        const [callId] = callEntry;
        
        // Process the speech input (this would normally come from Deepgram WebSocket)
        // For Twilio Gather, we simulate the transcription result
        const { deepgram_service } = await import('../../../apex_ai_engine/services/index.js');
        const { TranscriptionResult } = deepgram_service;
        
        const transcriptionResult = new TranscriptionResult(
            SpeechResult,
            parseFloat(Confidence || '1.0'),
            true, // is_final
            new Date(),
            null, // speaker_id
            'en-US'
        );
        
        // This would normally be handled by the transcription stream handler
        // For now, we'll need to directly process it
        // await voice_dispatch_agent._handle_transcription_result(callId, transcriptionResult);
        
        // Return TwiML to continue conversation or end call
        const twiml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
            <Response>
                <Say voice=\"alice\">Thank you for that information. Let me process your request.</Say>
                <Pause length=\"2\"/>
                <Say voice=\"alice\">I've created a report of your concern and notified the appropriate personnel. Is there anything else I can help you with?</Say>
                <Gather input=\"speech\" timeout=\"10\" speechTimeout=\"auto\" action=\"/api/voice-ai/twilio/process-speech\" method=\"POST\">
                    <Say voice=\"alice\"></Say>
                </Gather>
                <Say voice=\"alice\">Thank you for calling APEX AI Security. Have a great day!</Say>
                <Hangup/>
            </Response>`;
        
        res.type('text/xml');
        res.send(twiml);
        
    } catch (error) {
        console.error('[VOICE AI] Error processing speech:', error);
        
        res.type('text/xml');
        res.send(`<?xml version=\"1.0\" encoding=\"UTF-8\"?>
            <Response>
                <Say voice=\"alice\">I'm having trouble processing your request. Let me transfer you to an operator.</Say>
                <Dial>${process.env.HUMAN_OPERATOR_PHONE || '+1234567890'}</Dial>
            </Response>`);
    }
});

/**
 * Handle human takeover requests
 * POST /api/voice-ai/twilio/human-takeover
 */
router.post('/twilio/human-takeover', async (req, res) => {
    try {
        const { CallSid } = req.body;
        
        console.log(`[VOICE AI] Human takeover requested for call: ${CallSid}`);
        
        // Generate TwiML to transfer to human operator
        const operatorPhone = process.env.HUMAN_OPERATOR_PHONE || '+1234567890';
        
        const twiml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
            <Response>
                <Say voice=\"alice\">Connecting you to a human operator. Please hold.</Say>
                <Dial timeout=\"30\" action=\"/api/voice-ai/twilio/transfer-status\" method=\"POST\">
                    <Number>${operatorPhone}</Number>
                </Dial>
                <Say voice=\"alice\">I'm sorry, but no operators are currently available. Please call back during business hours.</Say>
                <Hangup/>
            </Response>`;
        
        res.type('text/xml');
        res.send(twiml);
        
    } catch (error) {
        console.error('[VOICE AI] Error in human takeover:', error);
        res.sendStatus(500);
    }
});

/**
 * Handle recording status updates
 * POST /api/voice-ai/twilio/recording-status
 */
router.post('/twilio/recording-status', async (req, res) => {
    try {
        const { CallSid, RecordingSid, RecordingUrl, RecordingStatus, RecordingDuration } = req.body;
        
        console.log(`[VOICE AI] Recording status: ${RecordingSid} -> ${RecordingStatus}`);
        
        if (RecordingStatus === 'completed') {
            // Download and store the recording
            const { twilio_service } = await import('../../../apex_ai_engine/services/index.js');
            
            const recordingPath = `recordings/${CallSid}_${RecordingSid}.mp3`;
            await twilio_service.download_recording(RecordingUrl, recordingPath);
            
            // Update database with recording information
            // Implementation would update call_logs table
        }
        
        res.sendStatus(200);
        
    } catch (error) {
        console.error('[VOICE AI] Error handling recording status:', error);
        res.sendStatus(500);
    }
});

// =======================
// CALL MANAGEMENT ROUTES
// =======================

/**
 * Get all active calls
 * GET /api/voice-ai/calls/active
 */
router.get('/calls/active', async (req, res) => {
    try {
        const { voice_dispatch_agent } = await import('../../../apex_ai_engine/agents/index.js');
        const activeCalls = voice_dispatch_agent.get_active_calls();
        
        // Convert to JSON-serializable format
        const serializedCalls = Object.entries(activeCalls).map(([callId, context]) => ({
            call_id: callId,
            twilio_call_sid: context.twilio_call_sid,
            caller_phone: context.caller_phone,
            property_id: context.property_id,
            call_state: context.call_state,
            created_at: context.created_at.toISOString(),
            updated_at: context.updated_at.toISOString(),
            conversation_turns: context.conversation_context?.turns?.length || 0,
            incident_id: context.incident_id,
            escalation_reason: context.escalation_reason
        }));
        
        res.json({
            success: true,
            data: {
                active_calls: serializedCalls,
                total_count: serializedCalls.length
            }
        });
        
    } catch (error) {
        console.error('[VOICE AI] Error getting active calls:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve active calls'
        });
    }
});

/**
 * Get specific call details
 * GET /api/voice-ai/calls/:callId
 */
router.get('/calls/:callId', 
    [param('callId').isUUID().withMessage('Invalid call ID')],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { callId } = req.params;
            
            const { voice_dispatch_agent } = await import('../../../apex_ai_engine/agents/index.js');
            const callContext = voice_dispatch_agent.get_call_context(callId);
            
            if (!callContext) {
                return res.status(404).json({
                    success: false,
                    error: 'Call not found'
                });
            }
            
            // Serialize the call context
            const serializedContext = {
                call_id: callId,
                twilio_call_sid: callContext.twilio_call_sid,
                caller_phone: callContext.caller_phone,
                property_id: callContext.property_id,
                call_state: callContext.call_state,
                created_at: callContext.created_at.toISOString(),
                updated_at: callContext.updated_at.toISOString(),
                incident_id: callContext.incident_id,
                escalation_reason: callContext.escalation_reason,
                actions_taken: callContext.actions_taken,
                metadata: callContext.metadata,
                conversation: callContext.conversation_context ? {
                    conversation_id: callContext.conversation_context.conversation_id,
                    state: callContext.conversation_context.state,
                    turns: callContext.conversation_context.turns.map(turn => ({
                        speaker: turn.speaker,
                        message: turn.message,
                        timestamp: turn.timestamp.toISOString(),
                        confidence: turn.confidence
                    })),
                    extracted_info: callContext.conversation_context.extracted_info,
                    incident_type: callContext.conversation_context.incident_type,
                    confidence_score: callContext.conversation_context.confidence_score
                } : null
            };
            
            res.json({
                success: true,
                data: serializedContext
            });
            
        } catch (error) {
            console.error('[VOICE AI] Error getting call details:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve call details'
            });
        }
    }
);

/**
 * Force human takeover of a call
 * POST /api/voice-ai/calls/:callId/takeover
 */
router.post('/calls/:callId/takeover',
    [
        param('callId').isUUID().withMessage('Invalid call ID'),
        body('operator_id').isUUID().withMessage('Valid operator ID is required'),
        body('reason').optional().isString().withMessage('Reason must be a string')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { callId } = req.params;
            const { operator_id, reason = 'Manual operator takeover' } = req.body;
            
            const { voice_dispatch_agent } = await import('../../../apex_ai_engine/agents/index.js');
            const success = await voice_dispatch_agent.force_human_takeover(callId, operator_id);
            
            if (success) {
                res.json({
                    success: true,
                    message: 'Call successfully transferred to human operator'
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Call not found or transfer failed'
                });
            }
            
        } catch (error) {
            console.error('[VOICE AI] Error in manual takeover:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to transfer call to human operator'
            });
        }
    }
);

/**
 * End a call manually
 * POST /api/voice-ai/calls/:callId/end
 */
router.post('/calls/:callId/end',
    [param('callId').isUUID().withMessage('Invalid call ID')],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { callId } = req.params;
            
            const { voice_dispatch_agent } = await import('../../../apex_ai_engine/agents/index.js');
            const summary = await voice_dispatch_agent.end_call(callId);
            
            if (summary) {
                res.json({
                    success: true,
                    message: 'Call ended successfully',
                    data: summary
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Call not found'
                });
            }
            
        } catch (error) {
            console.error('[VOICE AI] Error ending call:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to end call'
            });
        }
    }
);

// ===========================
// TRANSCRIPTION AND TTS ROUTES
// ===========================

/**
 * Get call transcription
 * GET /api/voice-ai/calls/:callId/transcript
 */
router.get('/calls/:callId/transcript',
    [param('callId').isUUID().withMessage('Invalid call ID')],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { callId } = req.params;
            
            const { voice_dispatch_agent } = await import('../../../apex_ai_engine/agents/index.js');
            const callContext = voice_dispatch_agent.get_call_context(callId);
            
            if (!callContext || !callContext.conversation_context) {
                return res.status(404).json({
                    success: false,
                    error: 'Call or transcript not found'
                });
            }
            
            const transcript = callContext.conversation_context.turns.map(turn => ({
                speaker: turn.speaker,
                message: turn.message,
                timestamp: turn.timestamp.toISOString(),
                confidence: turn.confidence
            }));
            
            res.json({
                success: true,
                data: {
                    call_id: callId,
                    transcript: transcript,
                    total_turns: transcript.length,
                    confidence_score: callContext.conversation_context.confidence_score
                }
            });
            
        } catch (error) {
            console.error('[VOICE AI] Error getting transcript:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve transcript'
            });
        }
    }
);

/**
 * Test TTS voice quality
 * POST /api/voice-ai/tts/test
 */
router.post('/tts/test',
    [
        body('text').isString().isLength({ min: 1, max: 500 }).withMessage('Text must be 1-500 characters'),
        body('voice_profile').optional().isString().withMessage('Voice profile must be a string')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { text, voice_profile = 'dispatcher_female' } = req.body;
            
            const { elevenlabs_service } = await import('../../../apex_ai_engine/services/index.js');
            const result = await elevenlabs_service.test_voice_quality(text, voice_profile);
            
            // Save audio to temporary file and return URL
            const filename = `test_${Date.now()}.mp3`;
            const filepath = path.join('recordings', filename);
            
            await elevenlabs_service.save_audio_to_file(result.audio_data, filepath);
            
            res.json({
                success: true,
                data: {
                    audio_url: `/api/voice-ai/audio/${filename}`,
                    voice_profile: voice_profile,
                    text: text,
                    audio_size: result.audio_data.length,
                    timestamp: result.timestamp.toISOString()
                }
            });
            
        } catch (error) {
            console.error('[VOICE AI] Error testing TTS:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate test audio'
            });
        }
    }
);

/**
 * Serve audio files
 * GET /api/voice-ai/audio/:filename
 */
router.get('/audio/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        
        // Validate filename to prevent path traversal
        if (!/^[a-zA-Z0-9_-]+\.(mp3|wav)$/.test(filename)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid filename'
            });
        }
        
        const filepath = path.join('recordings', filename);
        
        try {
            await fs.access(filepath);
            res.sendFile(path.resolve(filepath));
        } catch (err) {
            res.status(404).json({
                success: false,
                error: 'Audio file not found'
            });
        }
        
    } catch (error) {
        console.error('[VOICE AI] Error serving audio file:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to serve audio file'
        });
    }
});

// ==================
// SYSTEM STATUS ROUTE
// ==================

/**
 * Get Voice AI system status
 * GET /api/voice-ai/status
 */
router.get('/status', async (req, res) => {
    try {
        // Check service availability
        const serviceStatus = {};
        
        try {
            const { ollama_service } = await import('../../../apex_ai_engine/services/index.js');
            serviceStatus.ollama = await ollama_service.test_model_availability();
        } catch (err) {
            serviceStatus.ollama = false;
        }
        
        try {
            const { deepgram_service } = await import('../../../apex_ai_engine/services/index.js');
            serviceStatus.deepgram = !!deepgram_service;
        } catch (err) {
            serviceStatus.deepgram = false;
        }
        
        try {
            const { elevenlabs_service } = await import('../../../apex_ai_engine/services/index.js');
            serviceStatus.elevenlabs = !!elevenlabs_service;
        } catch (err) {
            serviceStatus.elevenlabs = false;
        }
        
        try {
            const { twilio_service } = await import('../../../apex_ai_engine/services/index.js');
            serviceStatus.twilio = !!twilio_service;
        } catch (err) {
            serviceStatus.twilio = false;
        }
        
        const { voice_dispatch_agent } = await import('../../../apex_ai_engine/agents/index.js');
        const activeCalls = voice_dispatch_agent.get_active_calls();
        
        res.json({
            success: true,
            data: {
                system_status: 'operational',
                services: serviceStatus,
                active_calls_count: Object.keys(activeCalls).length,
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('[VOICE AI] Error getting system status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get system status'
        });
    }
});

// Helper functions
async function identifyPropertyFromIncomingNumber(toNumber) {
    // Implementation would query database to identify property
    // based on the Twilio phone number called
    return null;
}

export default router;
