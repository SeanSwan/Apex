/**
 * ENHANCED LIVE CALL MONITOR - MASTER PROMPT v52.0 (VOICE AI INTEGRATION)
 * =======================================================================
 * Real-time voice call monitoring interface for human supervisors
 * Enhanced with Voice AI WebSocket integration, error boundaries, and accessibility
 * 
 * Features:
 * - Real-time Voice AI call monitoring via WebSocket
 * - Live call transcription display
 * - Human takeover controls with one-click intervention
 * - Emergency escalation with audio alerts
 * - Call progress tracking and incident creation status
 * - Comprehensive error handling and retry logic
 * - Full accessibility compliance (WCAG AA)
 * - Performance monitoring and metrics
 * - Audio notifications for critical events
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Phone, PhoneCall, PhoneOff, User, Clock, AlertTriangle, Shield, 
  FileText, Mic, MicOff, RefreshCw, Volume2, VolumeX, ChevronRight 
} from 'lucide-react';
import { 
  webSocketManager, 
  MESSAGE_TYPES, 
  type VoiceAICall, 
  type CallTranscription, 
  type VoiceAIMetrics 
} from '../../services/webSocketManager';
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
  property_id?: string;
  call_state: string;
  created_at: string;
  updated_at: string;
  conversation_turns?: number;
  incident_id?: string;
  escalation_reason?: string;
  transcript?: CallTranscriptEntry[];
  confidence_score?: number;
  duration_seconds?: number;
}

interface LiveCallMonitorProps {
  className?: string;
  onTakeoverCall?: (callId: string) => void;
  onEscalateCall?: (callId: string) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxRetries?: number;
  enableAudio?: boolean;
  accessibilityMode?: boolean;
}

interface PerformanceMetrics {
  connectionTime: number;
  messageLatency: number;
  reconnectCount: number;
  lastPingTime: number;
}

const EnhancedLiveCallMonitor: React.FC<LiveCallMonitorProps> = ({
  className = '',
  onTakeoverCall,
  onEscalateCall,
  autoRefresh = true,
  refreshInterval = 30000,
  maxRetries = 3,
  enableAudio = true,
  accessibilityMode = false
}) => {
  // State management
  const [activeCalls, setActiveCalls] = useState<VoiceCall[]>([]);
  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);
  const [voiceAIMetrics, setVoiceAIMetrics] = useState<VoiceAIMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(enableAudio);
  const [transcriptionUpdates, setTranscriptionUpdates] = useState<Map<string, CallTranscriptEntry[]>>(new Map());
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    connectionTime: 0,
    messageLatency: 0,
    reconnectCount: 0,
    lastPingTime: 0
  });

  // Refs
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const connectionStartTime = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const subscribedCalls = useRef<Set<string>>(new Set());

  // Initialize Voice AI WebSocket connection
  const connectToVoiceAI = useCallback(() => {
    if (webSocketManager.isVoiceAIConnected()) {
      console.log('🎤 [LIVE CALL MONITOR] Already connected to Voice AI');
      return;
    }

    setLoading(true);
    setError(null);
    connectionStartTime.current = Date.now();

    // Connect to Voice AI WebSocket
    webSocketManager.connectVoiceAI('demo-token', 'dispatcher'); // In real app, use actual auth
  }, []);

  // Set up Voice AI event listeners
  useEffect(() => {
    const handleVoiceAIConnected = () => {
      console.log('🎤 [LIVE CALL MONITOR] Voice AI connected');
      setIsConnected(true);
      setPerformanceMetrics(prev => ({
        ...prev,
        connectionTime: Date.now() - connectionStartTime.current,
        reconnectCount: prev.reconnectCount + 1
      }));
    };

    const handleVoiceAIAuthenticated = (data: any) => {
      console.log('🔐 [LIVE CALL MONITOR] Voice AI authenticated:', data);
      setIsAuthenticated(true);
      setLoading(false);
      
      // Subscribe to all calls
      webSocketManager.subscribeToAllCalls();
      
      // Get initial active calls and metrics
      webSocketManager.getActiveCalls();
      webSocketManager.getSystemMetrics();
    };

    const handleVoiceAIAuthFailed = (data: any) => {
      console.error('❌ [LIVE CALL MONITOR] Voice AI auth failed:', data);
      setError(`Authentication failed: ${data.error}`);
      setLoading(false);
    };

    const handleVoiceAIDisconnected = (data: any) => {
      console.log('🎤 [LIVE CALL MONITOR] Voice AI disconnected:', data.reason);
      setIsConnected(false);
      setIsAuthenticated(false);
      subscribedCalls.current.clear();
      
      if (data.reason !== 'manual' && retryCount < maxRetries) {
        setIsRetrying(true);
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          connectToVoiceAI();
        }, Math.pow(2, retryCount) * 1000);
      }
    };

    const handleCallStarted = (data: any) => {
      console.log('📞 [LIVE CALL MONITOR] Call started:', data);
      // Add to active calls if not already present
      setActiveCalls(prev => {
        const exists = prev.find(call => call.call_id === data.callId);
        if (!exists) {
          return [...prev, {
            call_id: data.callId,
            twilio_call_sid: data.twilioCallSid || '',
            caller_phone: data.callerPhone || '',
            property_id: data.propertyId,
            call_state: 'initiated',
            created_at: data.startTime,
            updated_at: data.startTime,
            conversation_turns: 0
          }];
        }
        return prev;
      });
      
      // Subscribe to this specific call for detailed updates
      if (data.callId) {
        webSocketManager.subscribeToCall(data.callId);
        subscribedCalls.current.add(data.callId);
      }
    };

    const handleCallEnded = (data: any) => {
      console.log('📞 [LIVE CALL MONITOR] Call ended:', data);
      // Remove from active calls
      setActiveCalls(prev => prev.filter(call => call.call_id !== data.callId));
      
      // Unsubscribe from call updates
      if (data.callId && subscribedCalls.current.has(data.callId)) {
        webSocketManager.unsubscribeFromCall(data.callId);
        subscribedCalls.current.delete(data.callId);
      }
      
      // Clear selected call if it was the ended one
      if (selectedCall?.call_id === data.callId) {
        setSelectedCall(null);
      }
      
      // Clear transcription updates for this call
      setTranscriptionUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.callId);
        return newMap;
      });
    };

    const handleCallUpdate = (data: any) => {
      console.log('📞 [LIVE CALL MONITOR] Call update:', data);
      // Update call in active calls list
      setActiveCalls(prev => prev.map(call => 
        call.call_id === data.sessionId ? {
          ...call,
          call_state: data.session?.status || call.call_state,
          updated_at: data.timestamp,
          conversation_turns: data.session?.aiResponseCount || call.conversation_turns,
          escalation_reason: data.session?.escalationReason,
          incident_id: data.session?.incidentId
        } : call
      ));
      
      // Update selected call if it's the updated one
      if (selectedCall?.call_id === data.sessionId) {
        setSelectedCall(prev => prev ? {
          ...prev,
          call_state: data.session?.status || prev.call_state,
          updated_at: data.timestamp,
          conversation_turns: data.session?.aiResponseCount || prev.conversation_turns,
          escalation_reason: data.session?.escalationReason,
          incident_id: data.session?.incidentId
        } : null);
      }
    };

    const handleTranscriptionUpdate = (data: CallTranscription) => {
      console.log('💬 [LIVE CALL MONITOR] Transcription update:', data);
      // Add to transcription updates for the specific call
      setTranscriptionUpdates(prev => {
        const newMap = new Map(prev);
        const existingTranscripts = newMap.get(data.call_id) || [];
        newMap.set(data.call_id, [...existingTranscripts, {
          timestamp: data.timestamp,
          speaker: data.speaker,
          message: data.message,
          confidence: data.confidence
        }]);
        return newMap;
      });
    };

    const handleHumanTakeover = (data: any) => {
      console.log('👤 [LIVE CALL MONITOR] Human takeover:', data);
      // Update call status to indicate human takeover
      setActiveCalls(prev => prev.map(call => 
        call.call_id === data.callId ? {
          ...call,
          call_state: 'human_takeover',
          escalation_reason: data.reason,
          updated_at: data.timestamp
        } : call
      ));
      
      // Update selected call
      if (selectedCall?.call_id === data.callId) {
        setSelectedCall(prev => prev ? {
          ...prev,
          call_state: 'human_takeover',
          escalation_reason: data.reason,
          updated_at: data.timestamp
        } : null);
      }
    };

    const handleEmergencyAlert = (data: any) => {
      console.log('🚨 [LIVE CALL MONITOR] Emergency alert:', data);
      // Handle emergency alerts (could trigger notifications, sounds, etc.)
      if (audioEnabled && audioContextRef.current) {
        // Play emergency sound
        playEmergencySound();
      }
      
      // Update call with emergency status
      setActiveCalls(prev => prev.map(call => 
        call.call_id === data.callId ? {
          ...call,
          call_state: 'emergency',
          escalation_reason: `EMERGENCY: ${data.emergencyType}`,
          updated_at: data.timestamp
        } : call
      ));
    };

    const handleActiveCallsUpdate = (data: any) => {
      console.log('📋 [LIVE CALL MONITOR] Active calls update:', data);
      if (data.calls && Array.isArray(data.calls)) {
        setActiveCalls(data.calls.map((call: any) => ({
          call_id: call.call_id,
          twilio_call_sid: call.twilio_call_sid,
          caller_phone: call.caller_phone,
          property_id: call.property_id,
          call_state: call.call_state,
          created_at: call.created_at,
          updated_at: call.updated_at,
          conversation_turns: call.conversation_turns,
          incident_id: call.incident_id,
          escalation_reason: call.escalation_reason
        })));
      }
      
      if (data.metrics) {
        setVoiceAIMetrics(data.metrics);
      }
    };

    const handleSystemMetrics = (data: any) => {
      if (data.callMetrics) {
        setVoiceAIMetrics(data.callMetrics);
      }
    };

    const handleVoiceAIError = (error: any) => {
      console.error('❌ [LIVE CALL MONITOR] Voice AI error:', error);
      setError(`Voice AI error: ${error.message || error}`);
    };

    // Register event listeners
    webSocketManager.on('voice_ai_connected', handleVoiceAIConnected);
    webSocketManager.on('voice_ai_authenticated', handleVoiceAIAuthenticated);
    webSocketManager.on('voice_ai_auth_failed', handleVoiceAIAuthFailed);
    webSocketManager.on('voice_ai_disconnected', handleVoiceAIDisconnected);
    webSocketManager.on(MESSAGE_TYPES.VOICE_CALL_STARTED, handleCallStarted);
    webSocketManager.on(MESSAGE_TYPES.VOICE_CALL_ENDED, handleCallEnded);
    webSocketManager.on(MESSAGE_TYPES.VOICE_CALL_UPDATE, handleCallUpdate);
    webSocketManager.on(MESSAGE_TYPES.VOICE_TRANSCRIPTION, handleTranscriptionUpdate);
    webSocketManager.on(MESSAGE_TYPES.VOICE_HUMAN_TAKEOVER, handleHumanTakeover);
    webSocketManager.on(MESSAGE_TYPES.VOICE_EMERGENCY_ALERT, handleEmergencyAlert);
    webSocketManager.on('voice_active_calls_update', handleActiveCallsUpdate);
    webSocketManager.on('system_metrics_response', handleSystemMetrics);
    webSocketManager.on('voice_ai_error', handleVoiceAIError);

    // Cleanup function
    return () => {
      webSocketManager.off('voice_ai_connected', handleVoiceAIConnected);
      webSocketManager.off('voice_ai_authenticated', handleVoiceAIAuthenticated);
      webSocketManager.off('voice_ai_auth_failed', handleVoiceAIAuthFailed);
      webSocketManager.off('voice_ai_disconnected', handleVoiceAIDisconnected);
      webSocketManager.off(MESSAGE_TYPES.VOICE_CALL_STARTED, handleCallStarted);
      webSocketManager.off(MESSAGE_TYPES.VOICE_CALL_ENDED, handleCallEnded);
      webSocketManager.off(MESSAGE_TYPES.VOICE_CALL_UPDATE, handleCallUpdate);
      webSocketManager.off(MESSAGE_TYPES.VOICE_TRANSCRIPTION, handleTranscriptionUpdate);
      webSocketManager.off(MESSAGE_TYPES.VOICE_HUMAN_TAKEOVER, handleHumanTakeover);
      webSocketManager.off(MESSAGE_TYPES.VOICE_EMERGENCY_ALERT, handleEmergencyAlert);
      webSocketManager.off('voice_active_calls_update', handleActiveCallsUpdate);
      webSocketManager.off('system_metrics_response', handleSystemMetrics);
      webSocketManager.off('voice_ai_error', handleVoiceAIError);
    };
  }, [retryCount, maxRetries, selectedCall, audioEnabled, connectToVoiceAI]);

  // Initialize connection on component mount
  useEffect(() => {
    connectToVoiceAI();
    
    // Cleanup on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      // Unsubscribe from all calls
      subscribedCalls.current.forEach(callId => {
        webSocketManager.unsubscribeFromCall(callId);
      });
      subscribedCalls.current.clear();
      
      // Disconnect Voice AI if component unmounts
      webSocketManager.disconnectVoiceAI();
    };
  }, [connectToVoiceAI]);

  // Auto-refresh active calls and metrics
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;

    const interval = setInterval(() => {
      webSocketManager.getActiveCalls();
      webSocketManager.getSystemMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isAuthenticated]);

  // Handle call takeover
  const handleTakeover = useCallback((callId: string, reason?: string) => {
    const success = webSocketManager.requestTakeover(callId, reason);
    if (success) {
      console.log(`🎯 [LIVE CALL MONITOR] Takeover requested for call: ${callId}`);
      onTakeoverCall?.(callId);
    } else {
      setError('Failed to request call takeover. Please check connection.');
    }
  }, [onTakeoverCall]);

  // Handle call escalation
  const handleEscalation = useCallback((callId: string, emergencyType: string, details?: string) => {
    const success = webSocketManager.emergencyEscalate(callId, emergencyType, details);
    if (success) {
      console.log(`🚨 [LIVE CALL MONITOR] Emergency escalation for call: ${callId}`);
      onEscalateCall?.(callId);
    } else {
      setError('Failed to escalate call. Please check connection.');
    }
  }, [onEscalateCall]);

  // Handle manual call termination
  const handleEndCall = useCallback((callId: string, reason?: string) => {
    const success = webSocketManager.endCall(callId, reason);
    if (success) {
      console.log(`📞 [LIVE CALL MONITOR] End call requested: ${callId}`);
    } else {
      setError('Failed to end call. Please check connection.');
    }
  }, []);

  // Get call transcript
  const handleGetTranscript = useCallback((callId: string) => {
    const success = webSocketManager.requestTranscript(callId);
    if (!success) {
      setError('Failed to request transcript. Please check connection.');
    }
  }, []);

  // Play emergency sound
  const playEmergencySound = useCallback(() => {
    if (!audioEnabled || !audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.5);
    } catch (error) {
      console.error('Failed to play emergency sound:', error);
    }
  }, [audioEnabled]);

  // Initialize audio context
  useEffect(() => {
    if (audioEnabled && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
        setAudioEnabled(false);
      }
    }
  }, [audioEnabled]);

  // Scroll to bottom of transcript when new messages arrive
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptionUpdates, selectedCall]);

  // Get transcript for selected call
  const currentTranscript = useMemo(() => {
    if (!selectedCall) return [];
    
    // Combine stored transcript with live updates
    const storedTranscript = selectedCall.transcript || [];
    const liveUpdates = transcriptionUpdates.get(selectedCall.call_id) || [];
    
    // Merge and sort by timestamp
    const allTranscripts = [...storedTranscript, ...liveUpdates];
    return allTranscripts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [selectedCall, transcriptionUpdates]);

  // Connection status indicator
  const connectionStatus = useMemo(() => {
    if (loading) return { status: 'connecting', color: 'text-yellow-500', icon: RefreshCw };
    if (!isConnected) return { status: 'disconnected', color: 'text-red-500', icon: PhoneOff };
    if (!isAuthenticated) return { status: 'authenticating', color: 'text-yellow-500', icon: Shield };
    return { status: 'connected', color: 'text-green-500', icon: Phone };
  }, [loading, isConnected, isAuthenticated]);

  // Format duration helper
  const formatDuration = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Format phone number helper
  const formatPhoneNumber = useCallback((phone: string) => {
    if (!phone) return 'Unknown';
    // Simple US phone number formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const number = cleaned.slice(1);
      return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }, []);

  // Handle retry connection
  const handleRetryConnection = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
    setError(null);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    connectToVoiceAI();
  }, [connectToVoiceAI]);

  // Handle audio toggle
  const handleAudioToggle = useCallback(() => {
    setAudioEnabled(prev => !prev);
  }, []);

  // Handle call selection
  const handleCallSelection = useCallback((call: VoiceCall) => {
    setSelectedCall(call);
    // Request detailed transcript for this call
    handleGetTranscript(call.call_id);
  }, [handleGetTranscript]);

  // Show loading state
  if (loading) {
    return (
      <ErrorBoundary>
        <div className={`live-call-monitor ${className}`}>
          <LiveCallMonitorSkeleton />
        </div>
      </ErrorBoundary>
    );
  }

  // Show error state with retry
  if (error && !isConnected) {
    return (
      <ErrorBoundary>
        <div className={`live-call-monitor error-state ${className}`}>
          <div className="error-container">
            <AlertTriangle className="error-icon" />
            <h3>Connection Error</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button
                onClick={handleRetryConnection}
                disabled={isRetrying}
                className="retry-button"
                aria-label="Retry connection"
              >
                {isRetrying ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Retry Connection
                  </>
                )}
              </button>
              {retryCount >= maxRetries && (
                <p className="max-retries-notice">
                  Maximum retry attempts reached. Please check your connection.
                </p>
              )}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div 
        className={`live-call-monitor ${className}`} 
        role="region" 
        aria-label="Live Call Monitor"
      >
        {/* Header with connection status and metrics */}
        <div className="monitor-header">
          <div className="header-left">
            <h2 className="monitor-title">
              <Phone className="title-icon" />
              Live Call Monitor
            </h2>
            <div className="connection-status">
              <connectionStatus.icon 
                className={`status-icon ${connectionStatus.color}`} 
                size={16}
              />
              <span className={`status-text ${connectionStatus.color}`}>
                {connectionStatus.status.charAt(0).toUpperCase() + connectionStatus.status.slice(1)}
              </span>
              {performanceMetrics.latency > 0 && (
                <span className="latency-indicator">
                  ({performanceMetrics.latency}ms)
                </span>
              )}
            </div>
          </div>
          
          <div className="header-right">
            {voiceAIMetrics && (
              <div className="metrics-summary">
                <div className="metric">
                  <span className="metric-label">Active:</span>
                  <span className="metric-value">{voiceAIMetrics.activeCalls}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Total:</span>
                  <span className="metric-value">{voiceAIMetrics.totalCalls}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">AI Handled:</span>
                  <span className="metric-value">
                    {voiceAIMetrics.totalCalls > 0 
                      ? Math.round((voiceAIMetrics.aiHandledCalls / voiceAIMetrics.totalCalls) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            )}
            
            <div className="header-controls">
              <button
                onClick={handleAudioToggle}
                className={`audio-toggle ${audioEnabled ? 'enabled' : 'disabled'}`}
                aria-label={`${audioEnabled ? 'Disable' : 'Enable'} audio notifications`}
                title={`${audioEnabled ? 'Disable' : 'Enable'} audio notifications`}
              >
                {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              
              <button
                onClick={() => {
                  webSocketManager.getActiveCalls();
                  webSocketManager.getSystemMetrics();
                }}
                className="refresh-button"
                aria-label="Refresh data"
                title="Refresh active calls and metrics"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="monitor-content">
          {/* Active calls list */}
          <div className="calls-panel">
            <div className="panel-header">
              <h3>Active Calls ({activeCalls.length})</h3>
            </div>
            
            <div className="calls-list">
              {activeCalls.length === 0 ? (
                <div className="no-calls">
                  <PhoneOff className="no-calls-icon" />
                  <p>No active calls</p>
                  <small>Calls will appear here when they start</small>
                </div>
              ) : (
                activeCalls.map((call) => (
                  <div
                    key={call.call_id}
                    className={`call-item ${
                      selectedCall?.call_id === call.call_id ? 'selected' : ''
                    } ${
                      call.call_state === 'emergency' ? 'emergency' : ''
                    } ${
                      call.escalation_reason ? 'escalated' : ''
                    }`}
                    onClick={() => handleCallSelection(call)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCallSelection(call);
                      }
                    }}
                    aria-label={`Call from ${formatPhoneNumber(call.caller_phone)}, status: ${call.call_state}`}
                  >
                    <div className="call-header">
                      <div className="call-info">
                        <PhoneCall className="call-icon" size={16} />
                        <span className="caller-phone">
                          {formatPhoneNumber(call.caller_phone)}
                        </span>
                      </div>
                      
                      <div className="call-status">
                        <span className={`status-badge ${call.call_state}`}>
                          {call.call_state.replace('_', ' ').toUpperCase()}
                        </span>
                        <ChevronRight size={16} className="select-icon" />
                      </div>
                    </div>
                    
                    <div className="call-details">
                      <div className="call-meta">
                        <Clock size={12} />
                        <span className="call-time">
                          {new Date(call.created_at).toLocaleTimeString()}
                        </span>
                        
                        {call.conversation_turns && call.conversation_turns > 0 && (
                          <>
                            <span className="separator">•</span>
                            <span className="turns-count">
                              {call.conversation_turns} exchanges
                            </span>
                          </>
                        )}
                        
                        {call.property_id && (
                          <>
                            <span className="separator">•</span>
                            <span className="property-id">
                              Property: {call.property_id.slice(-6)}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {call.escalation_reason && (
                        <div className="escalation-reason">
                          <AlertTriangle size={12} />
                          <span>{call.escalation_reason}</span>
                        </div>
                      )}
                      
                      {call.incident_id && (
                        <div className="incident-info">
                          <FileText size={12} />
                          <span>Incident: {call.incident_id.slice(-8)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Call details and transcript */}
          {selectedCall ? (
            <div className="call-details-panel">
              <div className="panel-header">
                <h3>Call Details</h3>
                <div className="call-actions">
                  {selectedCall.call_state !== 'human_takeover' && 
                   selectedCall.call_state !== 'completed' && 
                   selectedCall.call_state !== 'emergency' && (
                    <button
                      onClick={() => handleTakeover(selectedCall.call_id, 'Manual operator intervention')}
                      className="takeover-button"
                      aria-label="Take over call"
                      title="Transfer call to human operator"
                    >
                      <User size={16} />
                      Take Over
                    </button>
                  )}
                  
                  {selectedCall.call_state !== 'completed' && (
                    <button
                      onClick={() => handleEscalation(selectedCall.call_id, 'priority', 'Manual priority escalation')}
                      className="escalate-button"
                      aria-label="Escalate call"
                      title="Escalate as priority emergency"
                    >
                      <AlertTriangle size={16} />
                      Escalate
                    </button>
                  )}
                  
                  {(selectedCall.call_state === 'human_takeover' || 
                    selectedCall.call_state === 'emergency') && (
                    <button
                      onClick={() => handleEndCall(selectedCall.call_id, 'Manual termination by operator')}
                      className="end-call-button"
                      aria-label="End call"
                      title="Terminate call"
                    >
                      <PhoneOff size={16} />
                      End Call
                    </button>
                  )}
                </div>
              </div>
              
              <div className="call-info-details">
                <div className="info-grid">
                  <div className="info-item">
                    <label>Caller:</label>
                    <span>{formatPhoneNumber(selectedCall.caller_phone)}</span>
                  </div>
                  
                  <div className="info-item">
                    <label>Status:</label>
                    <span className={`status-badge ${selectedCall.call_state}`}>
                      {selectedCall.call_state.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <label>Started:</label>
                    <span>{new Date(selectedCall.created_at).toLocaleString()}</span>
                  </div>
                  
                  <div className="info-item">
                    <label>Duration:</label>
                    <span>
                      {selectedCall.duration_seconds 
                        ? formatDuration(selectedCall.duration_seconds)
                        : 'In progress'
                      }
                    </span>
                  </div>
                  
                  {selectedCall.property_id && (
                    <div className="info-item">
                      <label>Property:</label>
                      <span>{selectedCall.property_id}</span>
                    </div>
                  )}
                  
                  {selectedCall.incident_id && (
                    <div className="info-item">
                      <label>Incident:</label>
                      <span>{selectedCall.incident_id}</span>
                    </div>
                  )}
                  
                  {selectedCall.confidence_score !== undefined && (
                    <div className="info-item">
                      <label>AI Confidence:</label>
                      <span className={`confidence-score ${
                        selectedCall.confidence_score > 0.8 ? 'high' :
                        selectedCall.confidence_score > 0.6 ? 'medium' : 'low'
                      }`}>
                        {Math.round(selectedCall.confidence_score * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Live transcript */}
              <div className="transcript-section">
                <div className="transcript-header">
                  <h4>Live Transcript</h4>
                  <span className="transcript-count">
                    {currentTranscript.length} messages
                  </span>
                </div>
                
                <div 
                  className="transcript-container"
                  role="log"
                  aria-label="Call transcript"
                  aria-live="polite"
                >
                  {currentTranscript.length === 0 ? (
                    <div className="no-transcript">
                      <Mic className="no-transcript-icon" />
                      <p>No transcript available</p>
                      <small>Conversation will appear here as it happens</small>
                    </div>
                  ) : (
                    <div className="transcript-messages">
                      {currentTranscript.map((entry, index) => (
                        <div
                          key={`${entry.timestamp}-${index}`}
                          className={`transcript-message ${entry.speaker}`}
                        >
                          <div className="message-header">
                            <span className="speaker">
                              {entry.speaker === 'caller' ? 'Caller' : 'AI Dispatcher'}
                            </span>
                            <span className="timestamp">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </span>
                            {entry.confidence !== undefined && (
                              <span className={`confidence ${
                                entry.confidence > 0.8 ? 'high' :
                                entry.confidence > 0.6 ? 'medium' : 'low'
                              }`}>
                                {Math.round(entry.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          <div className="message-content">
                            {entry.message}
                          </div>
                        </div>
                      ))}
                      <div ref={transcriptEndRef} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <PhoneCall className="no-selection-icon" />
              <h3>Select a Call</h3>
              <p>Choose a call from the list to view details and transcript</p>
            </div>
          )}
        </div>
        
        {/* Error notification */}
        {error && isConnected && (
          <div className="error-notification" role="alert">
            <AlertTriangle size={16} />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="dismiss-error"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default EnhancedLiveCallMonitor;
