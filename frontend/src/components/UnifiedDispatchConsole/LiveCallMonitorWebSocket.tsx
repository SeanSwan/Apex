/**
 * WEBSOCKET-INTEGRATED LIVE CALL MONITOR - MASTER PROMPT v52.0 (FIXED)
 * =====================================================================
 * Real-time voice call monitoring with direct WebSocket integration
 * FIXED: Updated to use correct webSocketManager API methods
 * 
 * Features:
 * - Direct WebSocket communication for real-time updates
 * - Integrated CallInterventionPanel with WebSocket callbacks
 * - Live call transcription display with real-time streaming
 * - Performance monitoring and connection resilience
 * - Enhanced error handling and retry logic
 * - Accessibility compliance and responsive design
 * - Audio notifications and visual indicators
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Phone, PhoneCall, PhoneOff, User, Clock, AlertTriangle, Shield, FileText, 
  Mic, MicOff, RefreshCw, Volume2, VolumeX, Wifi, WifiOff, Activity, XCircle 
} from 'lucide-react';
import { webSocketManager, MESSAGE_TYPES } from '../../services/webSocketManager';
import CallInterventionPanelWebSocket from './CallInterventionPanelWebSocket';
import ErrorBoundary from './ErrorBoundary';
import { LiveCallMonitorSkeleton, LoadingSpinner } from './LoadingSkeletons';

interface CallTranscriptEntry {
  timestamp: string;
  speaker: 'caller' | 'ai';
  message: string;
  confidence?: number;
}

interface VoiceCall {
  call_id: string;
  twilio_call_sid: string;
  caller_phone: string;
  call_type: string;
  status: string;
  started_at: string;
  duration_seconds: number;
  transcript: CallTranscriptEntry[];
  ai_responses: string[];
  incident_created: boolean;
  incident_id?: string;
  human_takeover: boolean;
  takeover_time?: string;
  confidence_score: number;
}

interface LiveCallMonitorWebSocketProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxRetries?: number;
  enableAudio?: boolean;
  accessibilityMode?: boolean;
  showInterventionPanel?: boolean;
  onCallUpdated?: (call: VoiceCall) => void;
  onTakeoverComplete?: (callId: string) => void;
  onEscalationComplete?: (callId: string) => void;
}

interface CallStats {
  totalCalls: number;
  activeCalls: number;
  completedCalls: number;
  averageCallDuration: number;
  humanTakeovers: number;
  emergencyEscalations: number;
}

const LiveCallMonitorWebSocket: React.FC<LiveCallMonitorWebSocketProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 5000,
  maxRetries = 5,
  enableAudio = true,
  accessibilityMode = false,
  showInterventionPanel = true,
  onCallUpdated,
  onTakeoverComplete,
  onEscalationComplete
}) => {
  // State management
  const [activeCalls, setActiveCalls] = useState<VoiceCall[]>([]);
  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [voiceAIConnected, setVoiceAIConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(enableAudio);
  const [callStats, setCallStats] = useState<CallStats>({
    totalCalls: 0,
    activeCalls: 0,
    completedCalls: 0,
    averageCallDuration: 0,
    humanTakeovers: 0,
    emergencyEscalations: 0
  });

  // Refs for lifecycle management
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Constants
  const MAX_RETRIES = maxRetries;
  const RETRY_DELAY = 2000;

  // WebSocket event handlers
  const handleWebSocketEvent = useCallback((eventType: string) => {
    return (data: any) => {
      if (!mountedRef.current) return;

      console.log('[LIVE CALL MONITOR WS] Received event:', eventType, data);

      switch (eventType) {
        case 'voice_ai_connected':
          setVoiceAIConnected(true);
          setError(null);
          setRetryCount(0);
          setIsRetrying(false);
          setLoading(false);
          break;

        case 'voice_ai_authenticated':
          setVoiceAIConnected(true);
          setError(null);
          setRetryCount(0);
          // Request initial active calls
          webSocketManager.getActiveCalls();
          break;

        case 'voice_ai_disconnected':
          setVoiceAIConnected(false);
          setLoading(true);
          if (retryCount < MAX_RETRIES) {
            scheduleReconnection();
          }
          break;

        case MESSAGE_TYPES.VOICE_CALL_STARTED:
          handleCallStarted(data);
          break;

        case MESSAGE_TYPES.VOICE_CALL_ENDED:
          handleCallEnded(data);
          break;

        case MESSAGE_TYPES.VOICE_CALL_UPDATE:
          handleCallUpdated(data);
          break;

        case MESSAGE_TYPES.VOICE_TRANSCRIPTION:
          handleTranscriptionUpdate(data);
          break;

        case MESSAGE_TYPES.VOICE_HUMAN_TAKEOVER:
          handleTakeoverComplete(data);
          break;

        case MESSAGE_TYPES.VOICE_EMERGENCY_ALERT:
          handleEmergencyAlert(data);
          break;

        case 'voice_active_calls_update':
          handleActiveCallsUpdate(data);
          break;

        case MESSAGE_TYPES.ERROR:
        case 'voice_ai_error':
          handleWebSocketError(data);
          break;

        default:
          console.log('[LIVE CALL MONITOR WS] Unhandled event type:', eventType);
      }
    };
  }, [retryCount]);

  const handleConnectionStatus = useCallback(() => {
    if (!mountedRef.current) return;

    const mainConnected = webSocketManager.isConnected();
    const voiceConnected = webSocketManager.isVoiceAIConnected();
    const authenticated = webSocketManager.isVoiceAIAuthenticated();
    
    setIsConnected(mainConnected);
    setVoiceAIConnected(voiceConnected && authenticated);
    
    if (voiceConnected && authenticated && !loading) {
      // Periodically refresh active calls
      if (autoRefresh && !refreshIntervalRef.current) {
        refreshIntervalRef.current = setInterval(() => {
          webSocketManager.getActiveCalls();
        }, refreshInterval);
      }
    }
  }, [loading, autoRefresh, refreshInterval]);

  // Call event handlers
  const handleCallStarted = useCallback((data: any) => {
    const newCall: VoiceCall = {
      call_id: data.sessionId || data.callId || data.call_id,
      twilio_call_sid: data.callSid || data.twilio_call_sid || '',
      caller_phone: data.callerPhone || data.caller_phone || 'Unknown',
      call_type: data.callType || 'inbound',
      status: 'active',
      started_at: data.startTime || data.started_at || new Date().toISOString(),
      duration_seconds: 0,
      transcript: [],
      ai_responses: [],
      incident_created: false,
      human_takeover: false,
      confidence_score: 1.0
    };

    setActiveCalls(prev => {
      const exists = prev.find(call => call.call_id === newCall.call_id);
      if (exists) return prev;
      return [...prev, newCall];
    });

    setCallStats(prev => ({
      ...prev,
      totalCalls: prev.totalCalls + 1,
      activeCalls: prev.activeCalls + 1
    }));

    if (audioEnabled) {
      playNotificationSound('call_started');
    }

    console.log('[LIVE CALL MONITOR] New call started:', newCall.call_id);
  }, [audioEnabled]);

  const handleCallEnded = useCallback((data: any) => {
    const callId = data.sessionId || data.callId || data.call_id;
    
    setActiveCalls(prev => prev.filter(call => call.call_id !== callId));
    
    setCallStats(prev => ({
      ...prev,
      activeCalls: Math.max(0, prev.activeCalls - 1),
      completedCalls: prev.completedCalls + 1
    }));

    if (selectedCall?.call_id === callId) {
      setSelectedCall(null);
    }

    console.log('[LIVE CALL MONITOR] Call ended:', callId);
  }, [selectedCall]);

  const handleCallUpdated = useCallback((data: any) => {
    const callId = data.sessionId || data.callId || data.call_id;
    
    setActiveCalls(prev => prev.map(call => {
      if (call.call_id === callId) {
        const updatedCall = {
          ...call,
          status: data.status || call.status,
          duration_seconds: data.duration || call.duration_seconds,
          confidence_score: data.confidence || call.confidence_score,
          incident_created: data.incidentCreated || call.incident_created,
          incident_id: data.incidentId || call.incident_id
        };
        
        if (selectedCall?.call_id === callId) {
          setSelectedCall(updatedCall);
        }
        
        onCallUpdated?.(updatedCall);
        return updatedCall;
      }
      return call;
    }));

    console.log('[LIVE CALL MONITOR] Call updated:', callId);
  }, [selectedCall, onCallUpdated]);

  const handleTranscriptionUpdate = useCallback((data: any) => {
    const callId = data.sessionId || data.callId || data.call_id;
    const transcriptEntry: CallTranscriptEntry = {
      timestamp: data.timestamp || new Date().toISOString(),
      speaker: data.speaker || 'caller',
      message: data.message || data.text || '',
      confidence: data.confidence
    };

    setActiveCalls(prev => prev.map(call => {
      if (call.call_id === callId) {
        const updatedCall = {
          ...call,
          transcript: [...call.transcript, transcriptEntry]
        };
        
        if (selectedCall?.call_id === callId) {
          setSelectedCall(updatedCall);
        }
        
        return updatedCall;
      }
      return call;
    }));

    console.log('[LIVE CALL MONITOR] Transcript updated:', callId);
  }, [selectedCall]);

  const handleTakeoverComplete = useCallback((data: any) => {
    const callId = data.sessionId || data.callId || data.call_id;
    
    setActiveCalls(prev => prev.map(call => {
      if (call.call_id === callId) {
        const updatedCall = {
          ...call,
          human_takeover: true,
          takeover_time: data.timestamp || new Date().toISOString()
        };
        
        if (selectedCall?.call_id === callId) {
          setSelectedCall(updatedCall);
        }
        
        return updatedCall;
      }
      return call;
    }));

    setCallStats(prev => ({
      ...prev,
      humanTakeovers: prev.humanTakeovers + 1
    }));

    onTakeoverComplete?.(callId);
    
    if (audioEnabled) {
      playNotificationSound('takeover_complete');
    }

    console.log('[LIVE CALL MONITOR] Takeover completed:', callId);
  }, [selectedCall, onTakeoverComplete, audioEnabled]);

  const handleEmergencyAlert = useCallback((data: any) => {
    setCallStats(prev => ({
      ...prev,
      emergencyEscalations: prev.emergencyEscalations + 1
    }));

    onEscalationComplete?.(data.callId);
    
    if (audioEnabled) {
      playNotificationSound('emergency_alert');
    }

    console.log('[LIVE CALL MONITOR] Emergency alert:', data);
  }, [onEscalationComplete, audioEnabled]);

  const handleActiveCallsUpdate = useCallback((data: any) => {
    if (data.calls && Array.isArray(data.calls)) {
      const calls: VoiceCall[] = data.calls.map((call: any) => ({
        call_id: call.call_id || call.sessionId || call.callId,
        twilio_call_sid: call.twilio_call_sid || call.callSid || '',
        caller_phone: call.caller_phone || call.callerPhone || 'Unknown',
        call_type: call.call_type || 'inbound',
        status: call.status || 'active',
        started_at: call.started_at || call.startTime || new Date().toISOString(),
        duration_seconds: call.duration_seconds || 0,
        transcript: call.transcript || [],
        ai_responses: call.ai_responses || [],
        incident_created: call.incident_created || false,
        incident_id: call.incident_id,
        human_takeover: call.human_takeover || false,
        takeover_time: call.takeover_time,
        confidence_score: call.confidence_score || 1.0
      }));

      setActiveCalls(calls);
      setCallStats(prev => ({
        ...prev,
        activeCalls: calls.length
      }));
      
      console.log('[LIVE CALL MONITOR] Active calls updated:', calls.length);
    }
  }, []);

  const handleWebSocketError = useCallback((data: any) => {
    setError(data.message || 'WebSocket communication error');
    console.error('[LIVE CALL MONITOR WS] Error:', data);
  }, []);

  // Utility functions
  const scheduleReconnection = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    setIsRetrying(true);
    
    retryTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setRetryCount(prev => prev + 1);
        console.log(`[LIVE CALL MONITOR WS] Attempting reconnection (${retryCount + 1}/${MAX_RETRIES})`);
        initializeWebSocket();
      }
    }, RETRY_DELAY * (retryCount + 1));
  }, [retryCount]);

  const playNotificationSound = (type: 'call_started' | 'takeover_complete' | 'emergency_alert') => {
    if (!audioEnabled || !audioContextRef.current) return;
    
    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      switch (type) {
        case 'call_started':
          oscillator.frequency.value = 800;
          gainNode.gain.value = 0.1;
          break;
        case 'takeover_complete':
          oscillator.frequency.value = 600;
          gainNode.gain.value = 0.15;
          break;
        case 'emergency_alert':
          oscillator.frequency.value = 1000;
          gainNode.gain.value = 0.2;
          break;
      }
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.2);
      
    } catch (error) {
      console.warn('[LIVE CALL MONITOR] Audio notification failed:', error);
    }
  };

  const requestActiveCalls = useCallback(() => {
    if (!voiceAIConnected) return;
    
    try {
      webSocketManager.getActiveCalls();
    } catch (error) {
      console.error('[LIVE CALL MONITOR] Failed to request active calls:', error);
    }
  }, [voiceAIConnected]);

  const initializeWebSocket = useCallback(() => {
    try {
      // Initialize audio context if enabled
      if (audioEnabled && !audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Subscribe to all Voice AI WebSocket events using correct webSocketManager API
      webSocketManager.on('voice_ai_connected', handleWebSocketEvent('voice_ai_connected'));
      webSocketManager.on('voice_ai_authenticated', handleWebSocketEvent('voice_ai_authenticated'));
      webSocketManager.on('voice_ai_disconnected', handleWebSocketEvent('voice_ai_disconnected'));
      webSocketManager.on('voice_ai_error', handleWebSocketEvent('voice_ai_error'));
      webSocketManager.on(MESSAGE_TYPES.VOICE_CALL_STARTED, handleWebSocketEvent(MESSAGE_TYPES.VOICE_CALL_STARTED));
      webSocketManager.on(MESSAGE_TYPES.VOICE_CALL_ENDED, handleWebSocketEvent(MESSAGE_TYPES.VOICE_CALL_ENDED));
      webSocketManager.on(MESSAGE_TYPES.VOICE_CALL_UPDATE, handleWebSocketEvent(MESSAGE_TYPES.VOICE_CALL_UPDATE));
      webSocketManager.on(MESSAGE_TYPES.VOICE_TRANSCRIPTION, handleWebSocketEvent(MESSAGE_TYPES.VOICE_TRANSCRIPTION));
      webSocketManager.on(MESSAGE_TYPES.VOICE_HUMAN_TAKEOVER, handleWebSocketEvent(MESSAGE_TYPES.VOICE_HUMAN_TAKEOVER));
      webSocketManager.on(MESSAGE_TYPES.VOICE_EMERGENCY_ALERT, handleWebSocketEvent(MESSAGE_TYPES.VOICE_EMERGENCY_ALERT));
      webSocketManager.on('voice_active_calls_update', handleWebSocketEvent('voice_active_calls_update'));
      webSocketManager.on(MESSAGE_TYPES.ERROR, handleWebSocketEvent(MESSAGE_TYPES.ERROR));
      
      // Set up connection status monitoring
      const statusInterval = setInterval(handleConnectionStatus, 1000);
      
      // Connect to Voice AI if not already connected
      if (!webSocketManager.isVoiceAIConnected()) {
        webSocketManager.connectVoiceAI('demo_token', 'dispatcher');
      }
      
      // Initial status check
      handleConnectionStatus();
      
      return () => clearInterval(statusInterval);
      
    } catch (error) {
      console.error('[LIVE CALL MONITOR WS] Initialization error:', error);
      setError('Failed to initialize WebSocket connection');
      setLoading(false);
    }
  }, [audioEnabled, handleWebSocketEvent, handleConnectionStatus]);

  // Effect for mounting and cleanup
  useEffect(() => {
    mountedRef.current = true;
    const cleanup = initializeWebSocket();

    return () => {
      mountedRef.current = false;
      
      // Clean up timeouts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // Clean up status monitoring
      if (cleanup) {
        cleanup();
      }
      
      // Unsubscribe from WebSocket events
      webSocketManager.off('voice_ai_connected', handleWebSocketEvent('voice_ai_connected'));
      webSocketManager.off('voice_ai_authenticated', handleWebSocketEvent('voice_ai_authenticated'));
      webSocketManager.off('voice_ai_disconnected', handleWebSocketEvent('voice_ai_disconnected'));
      webSocketManager.off('voice_ai_error', handleWebSocketEvent('voice_ai_error'));
      webSocketManager.off(MESSAGE_TYPES.VOICE_CALL_STARTED, handleWebSocketEvent(MESSAGE_TYPES.VOICE_CALL_STARTED));
      webSocketManager.off(MESSAGE_TYPES.VOICE_CALL_ENDED, handleWebSocketEvent(MESSAGE_TYPES.VOICE_CALL_ENDED));
      webSocketManager.off(MESSAGE_TYPES.VOICE_CALL_UPDATE, handleWebSocketEvent(MESSAGE_TYPES.VOICE_CALL_UPDATE));
      webSocketManager.off(MESSAGE_TYPES.VOICE_TRANSCRIPTION, handleWebSocketEvent(MESSAGE_TYPES.VOICE_TRANSCRIPTION));
      webSocketManager.off(MESSAGE_TYPES.VOICE_HUMAN_TAKEOVER, handleWebSocketEvent(MESSAGE_TYPES.VOICE_HUMAN_TAKEOVER));
      webSocketManager.off(MESSAGE_TYPES.VOICE_EMERGENCY_ALERT, handleWebSocketEvent(MESSAGE_TYPES.VOICE_EMERGENCY_ALERT));
      webSocketManager.off('voice_active_calls_update', handleWebSocketEvent('voice_active_calls_update'));
      webSocketManager.off(MESSAGE_TYPES.ERROR, handleWebSocketEvent(MESSAGE_TYPES.ERROR));
    };
  }, [initializeWebSocket, handleWebSocketEvent]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedCall?.transcript]);

  // Memoized calculations
  const callStatusInfo = useMemo(() => {
    const active = activeCalls.length;
    const takeovers = activeCalls.filter(call => call.human_takeover).length;
    const incidents = activeCalls.filter(call => call.incident_created).length;
    
    return { active, takeovers, incidents };
  }, [activeCalls]);

  // Helper functions
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallStatusColor = (status: string, humanTakeover: boolean): string => {
    if (humanTakeover) return 'text-orange-400';
    switch (status.toLowerCase()) {
      case 'active':
      case 'connected':
        return 'text-green-400';
      case 'ringing':
        return 'text-blue-400';
      case 'ended':
        return 'text-gray-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getCallStatusIcon = (status: string, humanTakeover: boolean) => {
    if (humanTakeover) return <User className="w-4 h-4" />;
    switch (status.toLowerCase()) {
      case 'active':
      case 'connected':
        return <Phone className="w-4 h-4" />;
      case 'ringing':
        return <PhoneCall className="w-4 h-4" />;
      default:
        return <PhoneOff className="w-4 h-4" />;
    }
  };

  // Loading state
  if (loading && !isRetrying) {
    return (
      <ErrorBoundary>
        <LiveCallMonitorSkeleton className={className} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
        {/* Header with enhanced connection status */}
        <div className="border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Phone className="w-6 h-6 text-green-400" />
                <span>Live Call Monitor</span>
              </h1>
              
              {/* Connection Status Indicators */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                voiceAIConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
              }`}>
                {voiceAIConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span>{voiceAIConnected ? 'Voice AI Connected' : isRetrying ? 'Reconnecting...' : 'Disconnected'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Quick Stats */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-gray-400">
                  Active: <span className="text-green-400 font-medium">{callStatusInfo.active}</span>
                </div>
                <div className="text-gray-400">
                  Takeovers: <span className="text-orange-400 font-medium">{callStatusInfo.takeovers}</span>
                </div>
                <div className="text-gray-400">
                  Incidents: <span className="text-yellow-400 font-medium">{callStatusInfo.incidents}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={requestActiveCalls}
                  disabled={!voiceAIConnected || loading}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:cursor-not-allowed"
                  title="Refresh calls"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    audioEnabled ? 'text-green-400 bg-green-900/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                  title={`${audioEnabled ? 'Disable' : 'Enable'} audio notifications`}
                >
                  {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg flex items-center justify-between">
            <span className="text-red-300 text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex h-96">
          {/* Call List */}
          <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-gray-300">Active Calls</h2>
                {isRetrying && (
                  <Activity className="w-4 h-4 text-orange-400 animate-pulse" />
                )}
              </div>
              
              {activeCalls.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No active calls</p>
                  {!voiceAIConnected && (
                    <p className="text-xs mt-2 text-red-400">Waiting for Voice AI connection...</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {activeCalls.map((call) => (
                    <div
                      key={call.call_id}
                      onClick={() => setSelectedCall(call)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                        selectedCall?.call_id === call.call_id
                          ? 'bg-green-900/30 border-green-700'
                          : 'bg-gray-800 hover:bg-gray-750 border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={getCallStatusColor(call.status, call.human_takeover)}>
                            {getCallStatusIcon(call.status, call.human_takeover)}
                          </div>
                          <span className="text-sm font-medium text-white">
                            {formatPhoneNumber(call.caller_phone)}
                          </span>
                        </div>
                        {call.incident_created && (
                          <Shield className="w-4 h-4 text-yellow-400" title="Incident created" />
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className={getCallStatusColor(call.status, call.human_takeover)}>
                          {call.human_takeover ? 'Human Takeover' : call.status.replace('_', ' ')}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(call.duration_seconds)}</span>
                        </div>
                      </div>
                      
                      {call.transcript.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 truncate">
                          Last: {call.transcript[call.transcript.length - 1]?.message?.substring(0, 40)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Call Details */}
          <div className="flex-1 flex flex-col">
            {selectedCall ? (
              <>
                {/* Call Header */}
                <div className="border-b border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-white">
                        Call from {formatPhoneNumber(selectedCall.caller_phone)}
                      </h2>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <div className={getCallStatusColor(selectedCall.status, selectedCall.human_takeover)}>
                            {getCallStatusIcon(selectedCall.status, selectedCall.human_takeover)}
                          </div>
                          <span className={getCallStatusColor(selectedCall.status, selectedCall.human_takeover)}>
                            {selectedCall.human_takeover ? 'Human Takeover' : selectedCall.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(selectedCall.duration_seconds)}</span>
                        </div>
                        {selectedCall.incident_created && (
                          <div className="flex items-center space-x-1 text-yellow-400">
                            <Shield className="w-4 h-4" />
                            <span>Incident Created</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transcript */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Live Transcript</h3>
                  {selectedCall.transcript.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Waiting for conversation...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCall.transcript.map((entry, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            entry.speaker === 'caller'
                              ? 'bg-blue-900/30 border border-blue-700 ml-0 mr-8'
                              : 'bg-green-900/30 border border-green-700 ml-8 mr-0'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                entry.speaker === 'caller' ? 'bg-blue-400' : 'bg-green-400'
                              }`}></div>
                              <span className={`text-xs font-medium ${
                                entry.speaker === 'caller' ? 'text-blue-300' : 'text-green-300'
                              }`}>
                                {entry.speaker === 'caller' ? 'Caller' : 'AI Dispatcher'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                              {entry.confidence && (
                                <span>Confidence: {Math.round(entry.confidence * 100)}%</span>
                              )}
                              <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-200">{entry.message}</p>
                        </div>
                      ))}
                      <div ref={transcriptEndRef} />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <PhoneCall className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a call to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Integrated Call Intervention Panel */}
        {showInterventionPanel && selectedCall && (
          <div className="border-t border-gray-700">
            <CallInterventionPanelWebSocket
              callId={selectedCall.call_id}
              isCallActive={selectedCall.status === 'active' && !selectedCall.human_takeover}
              className="rounded-none border-0"
              onStatusUpdate={(status) => {
                console.log('[LIVE CALL MONITOR] Intervention status:', status);
              }}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default LiveCallMonitorWebSocket;
export type { LiveCallMonitorWebSocketProps, VoiceCall, CallTranscriptEntry };
