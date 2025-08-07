/**
 * CALL MANAGEMENT SERVICE - MASTER PROMPT v52.0
 * ==============================================
 * Backend service for managing Voice AI call lifecycle
 * Provides business logic layer between routes and AI agents
 * 
 * Features:
 * - Call lifecycle management and tracking
 * - Database integration for call logs and incidents
 * - Real-time event broadcasting via WebSocket
 * - SOP and contact list management
 * - Notification and escalation handling
 * - Comprehensive audit logging
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

class CallManagementService extends EventEmitter {
    constructor() {
        super();
        this.activeCallSessions = new Map();
        this.callMetrics = {
            totalCalls: 0,
            aiHandledCalls: 0,
            humanEscalations: 0,
            averageCallDuration: 0,
            successfulResolutions: 0
        };
    }

    /**
     * Initialize a new call session
     */
    async initializeCallSession(callData) {
        try {
            const sessionId = uuidv4();
            const session = {
                sessionId,
                callId: callData.call_id,
                twilioCallSid: callData.twilio_call_sid,
                callerPhone: callData.caller_phone,
                propertyId: callData.property_id,
                status: 'active',
                startTime: new Date(),
                events: [],
                metadata: callData.metadata || {}
            };

            this.activeCallSessions.set(sessionId, session);
            
            // Broadcast call started event
            this.emit('callStarted', session);
            this.broadcastCallUpdate(session, 'call_started');

            // Update metrics
            this.callMetrics.totalCalls++;
            
            return session;
        } catch (error) {
            console.error('[CALL MGMT] Error initializing call session:', error);
            throw error;
        }
    }

    /**
     * Update call session with new event
     */
    async updateCallSession(sessionId, eventType, eventData) {
        try {
            const session = this.activeCallSessions.get(sessionId);
            if (!session) {
                throw new Error(`Call session ${sessionId} not found`);
            }

            const event = {
                type: eventType,
                timestamp: new Date(),
                data: eventData
            };

            session.events.push(event);
            session.lastUpdate = new Date();

            // Handle specific event types
            switch (eventType) {
                case 'ai_response':
                    session.aiResponseCount = (session.aiResponseCount || 0) + 1;
                    break;
                case 'human_escalation':
                    session.status = 'escalated';
                    session.escalationReason = eventData.reason;
                    this.callMetrics.humanEscalations++;
                    break;
                case 'incident_created':
                    session.incidentId = eventData.incident_id;
                    break;
                case 'call_completed':
                    session.status = 'completed';
                    session.endTime = new Date();
                    session.duration = session.endTime - session.startTime;
                    this.callMetrics.successfulResolutions++;
                    break;
            }

            // Broadcast update
            this.broadcastCallUpdate(session, eventType, eventData);
            
            return session;
        } catch (error) {
            console.error('[CALL MGMT] Error updating call session:', error);
            throw error;
        }
    }

    /**
     * End call session and generate summary
     */
    async endCallSession(sessionId, reason = 'completed') {
        try {
            const session = this.activeCallSessions.get(sessionId);
            if (!session) {
                return null;
            }

            session.status = 'ended';
            session.endTime = new Date();
            session.duration = session.endTime - session.startTime;
            session.endReason = reason;

            // Generate call summary
            const summary = this.generateCallSummary(session);
            
            // Archive the session
            await this.archiveCallSession(session);
            
            // Remove from active sessions
            this.activeCallSessions.delete(sessionId);
            
            // Broadcast call ended event
            this.emit('callEnded', session);
            this.broadcastCallUpdate(session, 'call_ended', { summary });

            // Update average call duration
            this.updateAverageCallDuration();
            
            return summary;
        } catch (error) {
            console.error('[CALL MGMT] Error ending call session:', error);
            throw error;
        }
    }

    /**
     * Get all active call sessions
     */
    getActiveCallSessions() {
        return Array.from(this.activeCallSessions.values());
    }

    /**
     * Get specific call session
     */
    getCallSession(sessionId) {
        return this.activeCallSessions.get(sessionId);
    }

    /**
     * Get call metrics
     */
    getCallMetrics() {
        return {
            ...this.callMetrics,
            activeCalls: this.activeCallSessions.size,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate call summary
     */
    generateCallSummary(session) {
        const durationMinutes = session.duration ? Math.round(session.duration / 60000) : 0;
        
        return {
            sessionId: session.sessionId,
            callId: session.callId,
            twilioCallSid: session.twilioCallSid,
            callerPhone: session.callerPhone,
            propertyId: session.propertyId,
            duration: durationMinutes,
            totalEvents: session.events.length,
            aiResponseCount: session.aiResponseCount || 0,
            escalated: session.status === 'escalated',
            escalationReason: session.escalationReason,
            incidentCreated: !!session.incidentId,
            incidentId: session.incidentId,
            startTime: session.startTime.toISOString(),
            endTime: session.endTime?.toISOString(),
            endReason: session.endReason,
            events: session.events.map(event => ({
                type: event.type,
                timestamp: event.timestamp.toISOString(),
                data: event.data
            }))
        };
    }

    /**
     * Archive call session to database
     */
    async archiveCallSession(session) {
        try {
            // This would save the session to database
            // Implementation depends on your database schema
            console.log(`[CALL MGMT] Archiving call session: ${session.sessionId}`);
            
            // Placeholder for database save operation
            // await db.callSessions.create(session);
            
        } catch (error) {
            console.error('[CALL MGMT] Error archiving call session:', error);
            throw error;
        }
    }

    /**
     * Update average call duration metric
     */
    updateAverageCallDuration() {
        // This would typically query the database for recent call durations
        // For now, we'll use a simple estimate
        const recentSessions = Array.from(this.activeCallSessions.values())
            .filter(session => session.duration)
            .slice(-50); // Last 50 sessions

        if (recentSessions.length > 0) {
            const totalDuration = recentSessions.reduce((sum, session) => sum + session.duration, 0);
            this.callMetrics.averageCallDuration = Math.round(totalDuration / recentSessions.length / 1000); // seconds
        }
    }

    /**
     * Broadcast call update via WebSocket
     */
    broadcastCallUpdate(session, eventType, eventData = null) {
        try {
            const updatePayload = {
                type: 'call_update',
                sessionId: session.sessionId,
                callId: session.callId,
                eventType,
                eventData,
                session: {
                    sessionId: session.sessionId,
                    callId: session.callId,
                    twilioCallSid: session.twilioCallSid,
                    callerPhone: session.callerPhone,
                    propertyId: session.propertyId,
                    status: session.status,
                    startTime: session.startTime.toISOString(),
                    lastUpdate: session.lastUpdate?.toISOString(),
                    aiResponseCount: session.aiResponseCount || 0,
                    escalationReason: session.escalationReason,
                    incidentId: session.incidentId
                },
                timestamp: new Date().toISOString()
            };

            // Emit for WebSocket broadcasting
            this.emit('broadcastUpdate', updatePayload);
            
        } catch (error) {
            console.error('[CALL MGMT] Error broadcasting call update:', error);
        }
    }

    /**
     * Search call sessions by criteria
     */
    searchCallSessions(criteria) {
        const sessions = Array.from(this.activeCallSessions.values());
        
        return sessions.filter(session => {
            if (criteria.propertyId && session.propertyId !== criteria.propertyId) return false;
            if (criteria.status && session.status !== criteria.status) return false;
            if (criteria.callerPhone && !session.callerPhone.includes(criteria.callerPhone)) return false;
            if (criteria.incidentId && session.incidentId !== criteria.incidentId) return false;
            return true;
        });
    }

    /**
     * Force end all active calls (emergency shutdown)
     */
    async emergencyShutdown() {
        try {
            console.log('[CALL MGMT] Emergency shutdown initiated');
            
            const activeSessions = Array.from(this.activeCallSessions.values());
            const endPromises = activeSessions.map(session => 
                this.endCallSession(session.sessionId, 'emergency_shutdown')
            );
            
            await Promise.all(endPromises);
            
            console.log(`[CALL MGMT] Emergency shutdown completed. Ended ${activeSessions.length} calls.`);
            
        } catch (error) {
            console.error('[CALL MGMT] Error during emergency shutdown:', error);
            throw error;
        }
    }
}

// Create singleton instance
const callManagementService = new CallManagementService();

export default callManagementService;
export { CallManagementService };
