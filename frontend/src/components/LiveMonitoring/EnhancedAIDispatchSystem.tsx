/**
 * ENHANCED AI DISPATCH SYSTEM - APEX AI SECURITY PLATFORM
 * =========================================================
 * 
 * Production-ready AI alert processing and dispatch coordination system
 * Master Prompt v29.1-APEX Implementation
 * 
 * Features:
 * - Real-time AI alert acknowledgment with database sync
 * - Advanced guard dispatch with GPS coordination
 * - RTSP camera digital zoom integration
 * - AI voice response system with TTS
 * - Comprehensive error handling and logging
 * - WebSocket real-time updates
 */

import React, { useState, useCallback, useRef } from 'react';
import { useToast } from '../../hooks/use-toast';
import { io, Socket } from 'socket.io-client';

// Import required types from parent component
interface AIDetection {
  detection_id: string;
  timestamp: string;
  camera_id: string;
  detection_type: string;
  confidence: number;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  alert_level: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
}

// Enhanced types for AI dispatch system
interface EnhancedAIAlert {
  alert_id: string;
  timestamp: string;
  camera_id: string;
  alert_type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detection_details: AIDetection;
  actions_required: string[];
  status: 'pending' | 'acknowledged' | 'dispatched' | 'resolved';
  assigned_guard?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  response_time?: number;
  escalation_level: number;
  metadata: {
    confidence_score: number;
    threat_assessment: string;
    suggested_actions: string[];
    estimated_response_time: number;
  };
}

interface DispatchRequest {
  alert_id: string;
  guard_id: string;
  priority: 'normal' | 'urgent' | 'emergency';
  estimated_arrival: string;
  route_optimization: boolean;
  backup_required: boolean;
  special_instructions?: string;
}

interface AIVoiceCommand {
  camera_id: string;
  message: string;
  voice_type: 'warning' | 'instruction' | 'deterrent';
  repeat_count: number;
  volume_level: number;
  language: string;
}

// Enhanced AI Dispatch System Hook
export const useEnhancedAIDispatchSystem = () => {
  const { toast } = useToast();
  const [processingStates, setProcessingStates] = useState<Record<string, boolean>>({});
  
  // Get socket connection from window global if available
  const getSocketConnection = () => {
    return (window as any).socketConnection || null;
  };

  /**
   * ENHANCED AI ALERT ACKNOWLEDGMENT SYSTEM
   * =======================================
   * Production-ready alert acknowledgment with full backend integration
   */
  const handleEnhancedAcknowledgeAlert = useCallback(async (alertId: string, operatorId: string) => {
    try {
      // Set processing state
      setProcessingStates(prev => ({ ...prev, [alertId]: true }));

      // Start performance timer
      const startTime = performance.now();

      // 1. Immediate UI update for responsiveness
      const acknowledgmentTime = new Date().toISOString();
      
      // 2. Backend API call for database persistence
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          acknowledged_by: operatorId,
          acknowledged_at: acknowledgmentTime,
          operator_station: window.location.hostname,
          browser_info: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const alertData = await response.json();

      // 3. Real-time WebSocket notification to all connected clients
      const socket = getSocketConnection();
      if (socket) {
        socket.emit('alert_acknowledged', {
          alert_id: alertId,
          acknowledged_by: operatorId,
          acknowledged_at: acknowledgmentTime,
          response_time: performance.now() - startTime
        });
      }

      // 4. Trigger automated workflows based on alert priority
      if (alertData.priority === 'critical' || alertData.priority === 'high') {
        // Auto-escalate high priority alerts
        await handleAutoEscalation(alertId, alertData);
      }

      // 5. Update local state and UI
      setAlerts(prev => prev.map(alert => 
        alert.alert_id === alertId 
          ? { 
              ...alert, 
              status: 'acknowledged',
              acknowledged_by: operatorId,
              acknowledged_at: acknowledgmentTime,
              response_time: performance.now() - startTime
            }
          : alert
      ));

      // 6. Analytics and logging
      await logSecurityEvent('alert_acknowledged', {
        alert_id: alertId,
        operator_id: operatorId,
        response_time_ms: performance.now() - startTime,
        alert_priority: alertData.priority,
        timestamp: acknowledgmentTime
      });

      // 7. Success notification
      toast({
        title: "🛡️ Alert Acknowledged",
        description: `Alert ${alertId.slice(-8)} acknowledged successfully. Response time: ${Math.round(performance.now() - startTime)}ms`,
        variant: "default"
      });

      // 8. Return success status for chaining
      return {
        success: true,
        alert_id: alertId,
        response_time: performance.now() - startTime
      };

    } catch (error) {
      console.error('Enhanced acknowledge alert error:', error);
      
      // Error recovery - revert UI state
      setAlerts(prev => prev.map(alert => 
        alert.alert_id === alertId 
          ? { ...alert, status: 'pending' }
          : alert
      ));

      // Error notification with retry option
      toast({
        title: "❌ Acknowledgment Failed", 
        description: `Failed to acknowledge alert: ${error.message}. Please try again.`,
        variant: "destructive",
        action: (
          <button 
            onClick={() => handleEnhancedAcknowledgeAlert(alertId, operatorId)}
            className="btn-retry"
          >
            Retry
          </button>
        )
      });

      return { success: false, error: error.message };
    } finally {
      // Clear processing state
      setProcessingStates(prev => ({ ...prev, [alertId]: false }));
    }
  }, [toast]);

  /**
   * ENHANCED GUARD DISPATCH SYSTEM
   * ==============================
   * Real-time guard dispatch with GPS coordination and route optimization
   */
  const handleEnhancedDispatchGuard = useCallback(async (alertId: string, guardId: string, dispatchOptions: Partial<DispatchRequest> = {}) => {
    try {
      setProcessingStates(prev => ({ ...prev, [`dispatch_${alertId}`]: true }));
      const startTime = performance.now();

      // 1. Get real-time guard location and availability
      const guardStatus = await fetchGuardRealTimeStatus(guardId);
      if (!guardStatus.available) {
        throw new Error(`Guard ${guardStatus.name} is not available for dispatch`);
      }

      // 2. Calculate optimal route and ETA
      const routeData = await calculateOptimalRoute(
        guardStatus.current_location,
        alertId,
        dispatchOptions.route_optimization !== false
      );

      // 3. Create dispatch request
      const dispatchRequest: DispatchRequest = {
        alert_id: alertId,
        guard_id: guardId,
        priority: dispatchOptions.priority || 'normal',
        estimated_arrival: routeData.eta,
        route_optimization: dispatchOptions.route_optimization !== false,
        backup_required: dispatchOptions.backup_required || false,
        special_instructions: dispatchOptions.special_instructions
      };

      // 4. Backend dispatch API call
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dispatch/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dispatchRequest)
      });

      if (!response.ok) {
        throw new Error(`Dispatch failed: ${response.statusText}`);
      }

      const dispatchData = await response.json();

      // 5. Real-time WebSocket updates
      const socket = getSocketConnection();
      if (socket) {
        socket.emit('guard_dispatched', {
          ...dispatchRequest,
          dispatch_id: dispatchData.dispatch_id,
          timestamp: new Date().toISOString()
        });
      }

      // 6. Send push notification to guard mobile app
      await sendGuardNotification(guardId, {
        type: 'dispatch',
        alert_id: alertId,
        priority: dispatchRequest.priority,
        location: routeData.destination,
        estimated_arrival: routeData.eta,
        special_instructions: dispatchRequest.special_instructions
      });

      // 7. Update local state
      setAlerts(prev => prev.map(alert => 
        alert.alert_id === alertId 
          ? { ...alert, status: 'dispatched', assigned_guard: guardId }
          : alert
      ));

      setGuards(prev => prev.map(guard => 
        guard.guard_id === guardId 
          ? { 
              ...guard, 
              status: 'responding', 
              active_alerts: guard.active_alerts + 1,
              last_dispatch: new Date().toISOString()
            }
          : guard
      ));

      // 8. Auto-backup dispatch for critical alerts
      if (dispatchOptions.backup_required || dispatchRequest.priority === 'emergency') {
        await handleBackupDispatch(alertId, guardId);
      }

      // 9. Success notification with ETA
      toast({
        title: "🚀 Guard Dispatched",
        description: `${guardStatus.name} dispatched to ${alertId.slice(-8)}. ETA: ${routeData.eta_formatted}`,
        variant: "default"
      });

      return {
        success: true,
        dispatch_id: dispatchData.dispatch_id,
        eta: routeData.eta,
        route: routeData.route
      };

    } catch (error) {
      console.error('Enhanced dispatch error:', error);
      
      toast({
        title: "❌ Dispatch Failed",
        description: `Failed to dispatch guard: ${error.message}`,
        variant: "destructive"
      });

      return { success: false, error: error.message };
    } finally {
      setProcessingStates(prev => ({ ...prev, [`dispatch_${alertId}`]: false }));
    }
  }, [toast]);

  /**
   * ENHANCED DIGITAL ZOOM SYSTEM
   * ============================
   * RTSP camera digital zoom with AI-guided focus
   */
  const handleEnhancedDigitalZoom = useCallback(async (cameraId: string, detection: AIDetection, zoomLevel: number = 2) => {
    try {
      setProcessingStates(prev => ({ ...prev, [`zoom_${cameraId}`]: true }));

      // 1. Validate camera availability
      const cameraStatus = await validateCameraStatus(cameraId);
      if (!cameraStatus.supports_ptz) {
        throw new Error('Camera does not support PTZ operations');
      }

      // 2. Calculate optimal zoom parameters
      const zoomParams = calculateZoomParameters(detection.bounding_box, zoomLevel);

      // 3. Send RTSP zoom command
      const zoomResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cameras/${cameraId}/zoom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'digital_zoom',
          parameters: zoomParams,
          detection_context: {
            detection_id: detection.detection_id,
            confidence: detection.confidence,
            detection_type: detection.detection_type
          }
        })
      });

      if (!zoomResponse.ok) {
        throw new Error(`Zoom command failed: ${zoomResponse.statusText}`);
      }

      // 4. Real-time camera control via WebSocket
      const socket = getSocketConnection();
      if (socket) {
        socket.emit('camera_zoom_request', {
          camera_id: cameraId,
          zoom_params: zoomParams,
          detection_context: detection
        });
      }

      // 5. Start enhanced monitoring on zoomed area
      await enableEnhancedMonitoring(cameraId, detection.detection_type);

      // 6. Success notification
      toast({
        title: "🔍 Digital Zoom Activated",
        description: `Enhanced view of ${detection.detection_type} at ${Math.round(detection.confidence * 100)}% confidence`,
        variant: "default"
      });

      return { success: true, zoom_level: zoomLevel };

    } catch (error) {
      console.error('Enhanced digital zoom error:', error);
      
      toast({
        title: "❌ Zoom Failed",
        description: `Digital zoom failed: ${error.message}`,
        variant: "destructive"
      });

      return { success: false, error: error.message };
    } finally {
      setProcessingStates(prev => ({ ...prev, [`zoom_${cameraId}`]: false }));
    }
  }, [toast]);

  /**
   * ENHANCED AI VOICE RESPONSE SYSTEM
   * =================================
   * AI-powered voice warnings with TTS and speaker integration
   */
  const handleEnhancedAIVoiceResponse = useCallback(async (cameraId: string, message: string, voiceOptions: Partial<AIVoiceCommand> = {}) => {
    try {
      setProcessingStates(prev => ({ ...prev, [`voice_${cameraId}`]: true }));

      // 1. Validate camera audio capabilities
      const audioCapabilities = await validateCameraAudio(cameraId);
      if (!audioCapabilities.supports_audio_output) {
        throw new Error('Camera does not support audio output');
      }

      // 2. Prepare voice command with AI enhancement
      const voiceCommand: AIVoiceCommand = {
        camera_id: cameraId,
        message: message,
        voice_type: voiceOptions.voice_type || 'warning',
        repeat_count: voiceOptions.repeat_count || 1,
        volume_level: voiceOptions.volume_level || 80,
        language: voiceOptions.language || 'en-US'
      };

      // 3. Generate TTS audio with AI voice synthesis
      const ttsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          text: message,
          voice_type: voiceCommand.voice_type,
          language: voiceCommand.language,
          speed: 1.0,
          pitch: 0.0
        })
      });

      if (!ttsResponse.ok) {
        throw new Error(`TTS generation failed: ${ttsResponse.statusText}`);
      }

      const audioData = await ttsResponse.blob();

      // 4. Send audio to camera speakers
      const speakerResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cameras/${cameraId}/audio/play`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: new FormData().append('audio', audioData)
      });

      if (!speakerResponse.ok) {
        throw new Error(`Audio playback failed: ${speakerResponse.statusText}`);
      }

      // 5. Real-time notification via WebSocket
      const socket = getSocketConnection();
      if (socket) {
        socket.emit('ai_voice_activated', {
          camera_id: cameraId,
          message: message,
          voice_type: voiceCommand.voice_type,
          timestamp: new Date().toISOString()
        });
      }

      // 6. Log voice intervention
      await logSecurityEvent('ai_voice_intervention', {
        camera_id: cameraId,
        message: message,
        voice_type: voiceCommand.voice_type,
        timestamp: new Date().toISOString()
      });

      // 7. Success notification
      toast({
        title: "🔊 AI Voice Response Sent",
        description: `Voice message delivered through ${cameraId}: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
        variant: "default"
      });

      return { success: true, message_sent: message };

    } catch (error) {
      console.error('Enhanced AI voice response error:', error);
      
      toast({
        title: "❌ Voice Response Failed",
        description: `AI voice response failed: ${error.message}`,
        variant: "destructive"
      });

      return { success: false, error: error.message };
    } finally {
      setProcessingStates(prev => ({ ...prev, [`voice_${cameraId}`]: false }));
    }
  }, [toast]);

  // Helper functions for enhanced functionality
  const handleAutoEscalation = async (alertId: string, alertData: any) => {
    // Auto-escalation logic for high priority alerts
    if (alertData.priority === 'critical') {
      await handleEnhancedDispatchGuard(alertId, 'nearest_available', { 
        priority: 'emergency',
        backup_required: true 
      });
    }
  };

  const fetchGuardRealTimeStatus = async (guardId: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/guards/${guardId}/status`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return response.json();
  };

  const calculateOptimalRoute = async (origin: any, alertId: string, optimize: boolean) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/routing/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ origin, alert_id: alertId, optimize })
    });
    return response.json();
  };

  const sendGuardNotification = async (guardId: string, notification: any) => {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/notifications/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ guard_id: guardId, ...notification })
    });
  };

  const logSecurityEvent = async (eventType: string, eventData: any) => {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/security/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ event_type: eventType, ...eventData })
    });
  };

  return {
    handleEnhancedAcknowledgeAlert,
    handleEnhancedDispatchGuard,
    handleEnhancedDigitalZoom,
    handleEnhancedAIVoiceResponse,
    processingStates
  };
};