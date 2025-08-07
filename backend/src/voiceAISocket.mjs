/**
 * VOICE AI WEBSOCKET HANDLERS - MASTER PROMPT v52.0
 * ==================================================
 * Real-time WebSocket communication for Voice AI Dispatcher
 * Handles live call monitoring, transcription streaming, and human intervention
 * 
 * Features:
 * - Real-time call status updates
 * - Live transcription streaming
 * - Human takeover controls
 * - Call metrics and monitoring
 * - Emergency escalation alerts
 * - System status monitoring
 */

import callManagementService from '../services/call-management.mjs';

let voiceAINamespace = null;
let connectedClients = new Map();

/**
 * Initialize Voice AI WebSocket namespace and handlers
 */
export function initializeVoiceAIWebSocket(io) {
    // Create dedicated namespace for Voice AI communications
    voiceAINamespace = io.of('/voice-ai');
    
    voiceAINamespace.on('connection', (socket) => {
        console.log(`[VOICE AI WS] Client connected: ${socket.id}`);
        
        // Store client information
        connectedClients.set(socket.id, {
            socketId: socket.id,
            userRole: null,
            subscribedCalls: new Set(),
            connectedAt: new Date(),
            lastActivity: new Date()
        });
        
        // Handle client authentication
        socket.on('authenticate', handleAuthentication);
        
        // Handle call monitoring subscriptions
        socket.on('subscribe_to_call', handleCallSubscription);
        socket.on('unsubscribe_from_call', handleCallUnsubscription);
        socket.on('subscribe_to_all_calls', handleAllCallsSubscription);
        
        // Handle human intervention controls
        socket.on('request_takeover', handleTakeoverRequest);
        socket.on('approve_takeover', handleTakeoverApproval);
        socket.on('end_call', handleEndCall);
        
        // Handle real-time monitoring requests
        socket.on('get_active_calls', handleGetActiveCalls);
        socket.on('get_call_details', handleGetCallDetails);
        socket.on('get_system_metrics', handleGetSystemMetrics);
        
        // Handle transcription commands
        socket.on('request_transcript', handleTranscriptRequest);
        
        // Handle emergency controls
        socket.on('emergency_escalate', handleEmergencyEscalation);
        socket.on('emergency_shutdown', handleEmergencyShutdown);
        
        // Handle client disconnect
        socket.on('disconnect', handleDisconnect);
        
        // Update last activity
        socket.onAny(() => {
            const client = connectedClients.get(socket.id);
            if (client) {
                client.lastActivity = new Date();
            }
        });
        
        // Send initial system status
        socket.emit('system_status', {
            type: 'connection_established',
            timestamp: new Date().toISOString(),
            server_version: '52.0',
            features: ['real_time_calls', 'live_transcription', 'human_takeover', 'emergency_controls']
        });
    });
    
    // Set up call management service event listeners
    setupCallManagementListeners();
    
    console.log('[VOICE AI WS] WebSocket namespace initialized successfully');
}

/**
 * Set up listeners for call management service events
 */
function setupCallManagementListeners() {
    // Broadcast call updates to subscribed clients
    callManagementService.on('broadcastUpdate', (updatePayload) => {
        broadcastToSubscribedClients(updatePayload.sessionId, 'call_update', updatePayload);
    });
    
    // Broadcast call started events
    callManagementService.on('callStarted', (session) => {
        broadcastToAllClients('call_started', {
            sessionId: session.sessionId,
            callId: session.callId,
            callerPhone: session.callerPhone,
            propertyId: session.propertyId,
            startTime: session.startTime.toISOString()
        });
    });
    
    // Broadcast call ended events
    callManagementService.on('callEnded', (session) => {
        broadcastToAllClients('call_ended', {
            sessionId: session.sessionId,
            callId: session.callId,
            endTime: session.endTime.toISOString(),
            duration: session.duration,
            endReason: session.endReason
        });
    });
}

/**
 * Handle client authentication
 */
async function handleAuthentication(socket, data) {
    try {
        const { token, userRole } = data;
        
        // Validate authentication token (implementation depends on your auth system)
        const isValid = await validateAuthToken(token);
        
        if (isValid) {
            const client = connectedClients.get(socket.id);
            if (client) {
                client.userRole = userRole;
                
                socket.emit('authentication_result', {
                    success: true,
                    userRole: userRole,
                    permissions: getUserPermissions(userRole),
                    timestamp: new Date().toISOString()
                });
                
                console.log(`[VOICE AI WS] Client ${socket.id} authenticated as ${userRole}`);
            }
        } else {
            socket.emit('authentication_result', {
                success: false,
                error: 'Invalid authentication token',
                timestamp: new Date().toISOString()
            });
            
            // Disconnect unauthorized client
            socket.disconnect(true);
        }
        
    } catch (error) {
        console.error('[VOICE AI WS] Authentication error:', error);
        socket.emit('authentication_result', {
            success: false,
            error: 'Authentication failed',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Handle call subscription requests
 */
async function handleCallSubscription(socket, data) {
    try {
        const { callId } = data;
        const client = connectedClients.get(socket.id);
        
        if (!client) {
            socket.emit('subscription_error', { error: 'Client not found' });
            return;
        }
        
        // Check permissions
        if (!hasPermission(client.userRole, 'monitor_calls')) {
            socket.emit('subscription_error', { error: 'Insufficient permissions' });
            return;
        }
        
        client.subscribedCalls.add(callId);
        
        // Join room for this specific call
        socket.join(`call_${callId}`);
        
        socket.emit('subscription_confirmed', {
            callId: callId,
            timestamp: new Date().toISOString()
        });
        
        // Send current call details if available
        const callSession = callManagementService.getCallSession(callId);
        if (callSession) {
            socket.emit('call_details', {
                callId: callId,
                session: callSession,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`[VOICE AI WS] Client ${socket.id} subscribed to call ${callId}`);
        
    } catch (error) {
        console.error('[VOICE AI WS] Call subscription error:', error);
        socket.emit('subscription_error', { error: 'Failed to subscribe to call' });
    }
}

/**
 * Handle call unsubscription requests
 */
async function handleCallUnsubscription(socket, data) {
    try {
        const { callId } = data;
        const client = connectedClients.get(socket.id);
        
        if (client) {
            client.subscribedCalls.delete(callId);
            socket.leave(`call_${callId}`);
            
            socket.emit('unsubscription_confirmed', {
                callId: callId,
                timestamp: new Date().toISOString()
            });
            
            console.log(`[VOICE AI WS] Client ${socket.id} unsubscribed from call ${callId}`);
        }
        
    } catch (error) {
        console.error('[VOICE AI WS] Call unsubscription error:', error);
    }
}

/**
 * Handle subscription to all calls
 */
async function handleAllCallsSubscription(socket, data) {
    try {
        const client = connectedClients.get(socket.id);
        
        if (!client) {
            socket.emit('subscription_error', { error: 'Client not found' });
            return;
        }
        
        // Check permissions
        if (!hasPermission(client.userRole, 'monitor_all_calls')) {
            socket.emit('subscription_error', { error: 'Insufficient permissions' });
            return;
        }
        
        // Join global calls room
        socket.join('all_calls');
        
        socket.emit('all_calls_subscription_confirmed', {
            timestamp: new Date().toISOString()
        });
        
        // Send current active calls
        const activeCalls = callManagementService.getActiveCallSessions();
        socket.emit('active_calls_update', {
            calls: activeCalls,
            count: activeCalls.length,
            timestamp: new Date().toISOString()
        });
        
        console.log(`[VOICE AI WS] Client ${socket.id} subscribed to all calls`);
        
    } catch (error) {
        console.error('[VOICE AI WS] All calls subscription error:', error);
        socket.emit('subscription_error', { error: 'Failed to subscribe to all calls' });
    }
}

/**
 * Handle takeover requests
 */
async function handleTakeoverRequest(socket, data) {
    try {
        const { callId, reason } = data;
        const client = connectedClients.get(socket.id);
        
        if (!client) {
            socket.emit('takeover_error', { error: 'Client not found' });
            return;
        }
        
        // Check permissions
        if (!hasPermission(client.userRole, 'takeover_calls')) {
            socket.emit('takeover_error', { error: 'Insufficient permissions' });
            return;
        }
        
        // Get Voice Dispatch Agent
        const { voice_dispatch_agent } = await import('../../../apex_ai_engine/agents/index.js');
        
        // Attempt takeover
        const success = await voice_dispatch_agent.force_human_takeover(callId, socket.id);
        
        if (success) {
            socket.emit('takeover_success', {
                callId: callId,
                operatorId: socket.id,
                reason: reason,
                timestamp: new Date().toISOString()
            });
            
            // Broadcast takeover to other clients monitoring this call
            socket.to(`call_${callId}`).emit('call_takeover', {
                callId: callId,
                operatorId: socket.id,
                reason: reason,
                timestamp: new Date().toISOString()
            });
            
            console.log(`[VOICE AI WS] Call ${callId} taken over by ${socket.id}`);
        } else {
            socket.emit('takeover_error', { error: 'Failed to take over call' });
        }
        
    } catch (error) {
        console.error('[VOICE AI WS] Takeover request error:', error);
        socket.emit('takeover_error', { error: 'Takeover request failed' });
    }
}

/**
 * Handle active calls requests
 */
async function handleGetActiveCalls(socket, data) {
    try {
        const client = connectedClients.get(socket.id);
        
        if (!client || !hasPermission(client.userRole, 'view_calls')) {
            socket.emit('access_denied', { error: 'Insufficient permissions' });
            return;
        }
        
        const activeCalls = callManagementService.getActiveCallSessions();
        const metrics = callManagementService.getCallMetrics();
        
        socket.emit('active_calls_response', {
            calls: activeCalls,
            metrics: metrics,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[VOICE AI WS] Get active calls error:', error);
        socket.emit('error', { message: 'Failed to retrieve active calls' });
    }
}

/**
 * Handle call details requests
 */
async function handleGetCallDetails(socket, data) {
    try {
        const { callId } = data;
        const client = connectedClients.get(socket.id);
        
        if (!client || !hasPermission(client.userRole, 'view_call_details')) {
            socket.emit('access_denied', { error: 'Insufficient permissions' });
            return;
        }
        
        // Get Voice Dispatch Agent
        const { voice_dispatch_agent } = await import('../../../apex_ai_engine/agents/index.js');
        const callContext = voice_dispatch_agent.get_call_context(callId);
        
        if (callContext) {
            socket.emit('call_details_response', {
                callId: callId,
                context: callContext,
                timestamp: new Date().toISOString()
            });
        } else {
            socket.emit('call_not_found', { callId: callId });
        }
        
    } catch (error) {
        console.error('[VOICE AI WS] Get call details error:', error);
        socket.emit('error', { message: 'Failed to retrieve call details' });
    }
}

/**
 * Handle system metrics requests
 */
async function handleGetSystemMetrics(socket, data) {
    try {
        const client = connectedClients.get(socket.id);
        
        if (!client || !hasPermission(client.userRole, 'view_metrics')) {
            socket.emit('access_denied', { error: 'Insufficient permissions' });
            return;
        }
        
        const metrics = callManagementService.getCallMetrics();
        const systemStatus = {
            connectedClients: connectedClients.size,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            timestamp: new Date().toISOString()
        };
        
        socket.emit('system_metrics_response', {
            callMetrics: metrics,
            systemStatus: systemStatus
        });
        
    } catch (error) {
        console.error('[VOICE AI WS] Get system metrics error:', error);
        socket.emit('error', { message: 'Failed to retrieve system metrics' });
    }
}

/**
 * Handle emergency escalation
 */
async function handleEmergencyEscalation(socket, data) {
    try {
        const { callId, emergencyType, details } = data;
        const client = connectedClients.get(socket.id);
        
        if (!client || !hasPermission(client.userRole, 'emergency_escalate')) {
            socket.emit('access_denied', { error: 'Insufficient permissions' });
            return;
        }
        
        // Log emergency escalation
        console.log(`[VOICE AI WS] EMERGENCY ESCALATION: ${emergencyType} for call ${callId} by ${socket.id}`);
        
        // Broadcast emergency alert to all authorized clients
        broadcastToAuthorizedClients('emergency_alert', {
            callId: callId,
            emergencyType: emergencyType,
            details: details,
            escalatedBy: socket.id,
            timestamp: new Date().toISOString()
        }, 'handle_emergencies');
        
        socket.emit('emergency_escalation_confirmed', {
            callId: callId,
            emergencyType: emergencyType,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[VOICE AI WS] Emergency escalation error:', error);
        socket.emit('error', { message: 'Emergency escalation failed' });
    }
}

/**
 * Handle client disconnect
 */
function handleDisconnect(socket) {
    console.log(`[VOICE AI WS] Client disconnected: ${socket.id}`);
    
    // Clean up client data
    connectedClients.delete(socket.id);
    
    // Leave all rooms
    socket.rooms.forEach(room => {
        if (room !== socket.id) {
            socket.leave(room);
        }
    });
}

/**
 * Broadcast message to clients subscribed to a specific call
 */
function broadcastToSubscribedClients(callId, eventType, data) {
    if (voiceAINamespace) {
        voiceAINamespace.to(`call_${callId}`).emit(eventType, data);
    }
}

/**
 * Broadcast message to all connected clients
 */
function broadcastToAllClients(eventType, data) {
    if (voiceAINamespace) {
        voiceAINamespace.to('all_calls').emit(eventType, data);
    }
}

/**
 * Broadcast message to authorized clients only
 */
function broadcastToAuthorizedClients(eventType, data, requiredPermission) {
    if (!voiceAINamespace) return;
    
    connectedClients.forEach((client, socketId) => {
        if (hasPermission(client.userRole, requiredPermission)) {
            voiceAINamespace.to(socketId).emit(eventType, data);
        }
    });
}

/**
 * Validate authentication token (placeholder implementation)
 */
async function validateAuthToken(token) {
    // This would integrate with your authentication system
    // For now, return true for demo purposes
    return true;
}

/**
 * Get user permissions based on role
 */
function getUserPermissions(userRole) {
    const permissions = {
        admin: ['monitor_calls', 'monitor_all_calls', 'takeover_calls', 'view_calls', 'view_call_details', 'view_metrics', 'emergency_escalate', 'handle_emergencies'],
        supervisor: ['monitor_calls', 'monitor_all_calls', 'takeover_calls', 'view_calls', 'view_call_details', 'view_metrics', 'emergency_escalate'],
        dispatcher: ['monitor_calls', 'takeover_calls', 'view_calls', 'view_call_details', 'emergency_escalate'],
        guard: ['view_calls'],
        readonly: ['view_calls']
    };
    
    return permissions[userRole] || [];
}

/**
 * Check if user has specific permission
 */
function hasPermission(userRole, permission) {
    const userPermissions = getUserPermissions(userRole);
    return userPermissions.includes(permission);
}

/**
 * Get connected clients count
 */
export function getConnectedClientsCount() {
    return connectedClients.size;
}

/**
 * Get Voice AI namespace status
 */
export function getVoiceAINamespaceStatus() {
    return {
        initialized: !!voiceAINamespace,
        connectedClients: connectedClients.size,
        namespaceId: voiceAINamespace?.name || null
    };
}

/**
 * Emergency shutdown all Voice AI connections
 */
export async function emergencyShutdownVoiceAI() {
    try {
        console.log('[VOICE AI WS] Emergency shutdown initiated');
        
        // Notify all clients
        broadcastToAllClients('emergency_shutdown', {
            message: 'Voice AI system is shutting down',
            timestamp: new Date().toISOString()
        });
        
        // Disconnect all clients
        connectedClients.forEach((client, socketId) => {
            const socket = voiceAINamespace.sockets.get(socketId);
            if (socket) {
                socket.disconnect(true);
            }
        });
        
        // Clear client map
        connectedClients.clear();
        
        console.log('[VOICE AI WS] Emergency shutdown completed');
        
    } catch (error) {
        console.error('[VOICE AI WS] Emergency shutdown error:', error);
        throw error;
    }
}
