/**
 * LIVE CALL MONITOR - MASTER PROMPT v52.0 (ENHANCED)
 * ==================================================
 * Real-time voice call monitoring interface for human supervisors
 * Enhanced with error boundaries, loading states, and accessibility
 * 
 * Features:
 * - Live call transcription display
 * - Real-time AI response monitoring
 * - Call progress tracking
 * - Incident creation status
 * - Human takeover controls
 * - Emergency escalation indicators
 * - Error boundary integration
 * - Loading skeleton states
 * - Full accessibility compliance
 * - Responsive design optimization
 * - Performance monitoring
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Phone, PhoneCall, PhoneOff, User, Clock, AlertTriangle, Shield, FileText, Mic, MicOff, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import io from 'socket.io-client';
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

const LiveCallMonitor: React.FC<LiveCallMonitorProps> = ({
  className = '',
  onTakeoverCall,
  onEscalateCall,
  autoRefresh = true,
  refreshInterval = 30000,
  maxRetries = 3,
  enableAudio = true,
  accessibilityMode = false
}) => {
  const [activeCalls, setActiveCalls] = useState<VoiceCall[]>([]);
  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(enableAudio);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    connectionTime: 0,
    messageLatency: 0,
    reconnectCount: 0,
    lastPingTime: 0
  });
  
  const socketRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const connectionStartTime = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize WebSocket connection and load active calls
  useEffect(() => {
    initializeVoiceMonitoring();
    loadActiveCalls();

    // Auto-refresh interval
    let refreshIntervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      refreshIntervalId = setInterval(() => {
        if (isConnected) {
          loadActiveCalls();
        }
      }, refreshInterval);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [autoRefresh, refreshInterval]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedCall?.transcript]);

  const initializeVoiceMonitoring = useCallback(() => {
    try {
      connectionStartTime.current = Date.now();
      setError(null);
      setIsRetrying(false);
      
      // Connect to WebSocket for real-time updates
      socketRef.current = io('/', {
        transports: ['websocket'],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: maxRetries
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Voice monitoring WebSocket connected');
        const connectionTime = Date.now() - connectionStartTime.current;
        setPerformanceMetrics(prev => ({ 
          ...prev, 
          connectionTime,
          reconnectCount: retryCount
        }));
        setIsConnected(true);
        setRetryCount(0);
        setError(null);
        announceToScreenReader('Voice monitoring connected');
      });

      socketRef.current.on('disconnect', (reason: string) => {
        console.log('❌ Voice monitoring WebSocket disconnected:', reason);
        setIsConnected(false);
        announceToScreenReader('Voice monitoring disconnected');
        
        // Auto-retry connection if not manually disconnected
        if (reason !== 'io client disconnect' && retryCount < maxRetries) {
          scheduleRetry();
        }
      });

      socketRef.current.on('connect_error', (error: Error) => {
        console.error('❌ Voice monitoring connection error:', error);
        setError(`Connection failed: ${error.message}`);
        announceToScreenReader('Voice monitoring connection failed');
        
        if (retryCount < maxRetries) {
          scheduleRetry();
        }
      });

      // Listen for voice call events
      socketRef.current.on('voice_call_incoming', handleIncomingCall);
      socketRef.current.on('voice_speech_received', handleSpeechReceived);
      socketRef.current.on('voice_incident_created', handleIncidentCreated);
      socketRef.current.on('voice_call_takeover', handleCallTakeover);
      socketRef.current.on('voice_recording_complete', handleRecordingComplete);

      // Performance monitoring
      socketRef.current.on('pong', (latency: number) => {
        setPerformanceMetrics(prev => ({ 
          ...prev, 
          messageLatency: latency,
          lastPingTime: Date.now()
        }));
      });

    } catch (err) {
      console.error('❌ Voice monitoring initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize voice monitoring';
      setError(errorMessage);
      announceToScreenReader(`Error: ${errorMessage}`);
    }
  }, [maxRetries, retryCount]);

  const loadActiveCalls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('/api/voice/calls/active', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to load active calls: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setActiveCalls(data.active_calls || []);
      
      // Auto-select first call if none selected
      if (!selectedCall && data.active_calls.length > 0) {
        setSelectedCall(data.active_calls[0]);
        announceToScreenReader(`${data.active_calls.length} active calls loaded`);
      } else if (data.active_calls.length === 0) {
        announceToScreenReader('No active calls');
      }
      
    } catch (err) {
      console.error('❌ Load active calls error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load active calls';
      setError(errorMessage);
      announceToScreenReader(`Error loading calls: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [selectedCall]);

  // Utility functions
  const scheduleRetry = useCallback(() => {
    if (retryCount >= maxRetries) {
      setError(`Maximum retry attempts (${maxRetries}) reached`);
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff
    
    retryTimeoutRef.current = setTimeout(() => {
      console.log(`🔄 Retrying voice monitoring connection (${retryCount + 1}/${maxRetries})`);
      initializeVoiceMonitoring();
    }, delay);
  }, [retryCount, maxRetries, initializeVoiceMonitoring]);

  const announceToScreenReader = useCallback((message: string) => {
    if (!accessibilityMode) return;
    
    // Create a temporary element for screen reader announcements
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [accessibilityMode]);

  const playNotificationSound = useCallback(() => {
    if (!audioEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.3);
    } catch (err) {
      console.warn('Could not play notification sound:', err);
    }
  }, [audioEnabled]);

  const handleTakeoverCall = useCallback((callId: string) => {
    try {
      announceToScreenReader('Taking over call');
      if (onTakeoverCall) {
        onTakeoverCall(callId);
      }
    } catch (err) {
      console.error('Error during call takeover:', err);
      announceToScreenReader('Failed to take over call');
    }
  }, [onTakeoverCall, announceToScreenReader]);

  const handleEscalateCall = useCallback((callId: string) => {
    try {
      announceToScreenReader('Escalating call');
      playNotificationSound();
      if (onEscalateCall) {
        onEscalateCall(callId);
      }
    } catch (err) {
      console.error('Error during call escalation:', err);
      announceToScreenReader('Failed to escalate call');
    }
  }, [onEscalateCall, announceToScreenReader, playNotificationSound]);

  const handleRetryConnection = useCallback(() => {
    setRetryCount(0);
    setError(null);
    initializeVoiceMonitoring();
  }, [initializeVoiceMonitoring]);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => !prev);
    announceToScreenReader(`Audio notifications ${!audioEnabled ? 'enabled' : 'disabled'}`);
  }, [audioEnabled, announceToScreenReader]);

  const handleIncomingCall = useCallback((callData: any) => {
    console.log('📞 New incoming call:', callData);
    
    const newCall: VoiceCall = {
      call_id: callData.call_id,
      twilio_call_sid: callData.twilio_call_sid,
      caller_phone: callData.caller_phone,
      call_type: 'general_inquiry',
      status: callData.status,
      started_at: callData.timestamp,
      duration_seconds: 0,
      transcript: [],
      ai_responses: [],
      incident_created: false,
      human_takeover: false,
      confidence_score: 0.0
    };
    
    setActiveCalls(prev => [newCall, ...prev]);
    
    // Auto-select new call
    if (!selectedCall) {
      setSelectedCall(newCall);
    }
    
    // Accessibility and audio notifications
    announceToScreenReader(`New incoming call from ${formatPhoneNumber(callData.caller_phone)}`);
    playNotificationSound();
  }, [selectedCall, announceToScreenReader, playNotificationSound]);

  const handleSpeechReceived = useCallback((speechData: any) => {
    console.log('🎤 Speech received:', speechData);
    
    const newTranscriptEntry: CallTranscriptEntry = {
      timestamp: speechData.timestamp,
      speaker: 'caller' as const,
      message: speechData.transcript,
      confidence: speechData.confidence
    };
    
    setActiveCalls(prev => prev.map(call => {
      if (call.call_id === speechData.call_id) {
        return {
          ...call,
          transcript: [...call.transcript, newTranscriptEntry]
        };
      }
      return call;
    }));
    
    // Update selected call if it matches
    if (selectedCall?.call_id === speechData.call_id) {
      setSelectedCall(prev => prev ? {
        ...prev,
        transcript: [...prev.transcript, newTranscriptEntry]
      } : null);
      
      // Announce new speech for accessibility (only for selected call)
      if (accessibilityMode) {
        announceToScreenReader(`Caller said: ${speechData.transcript}`);
      }
    }
  }, [selectedCall, accessibilityMode, announceToScreenReader]);

  const handleIncidentCreated = useCallback((incidentData: any) => {
    console.log('📋 Incident created from call:', incidentData);
    
    setActiveCalls(prev => prev.map(call => {
      if (call.call_id === incidentData.call_id) {
        return {
          ...call,
          incident_created: true,
          incident_id: incidentData.incident_id
        };
      }
      return call;
    }));
    
    if (selectedCall?.call_id === incidentData.call_id) {
      setSelectedCall(prev => prev ? {
        ...prev,
        incident_created: true,
        incident_id: incidentData.incident_id
      } : null);
    }
    
    announceToScreenReader('Incident created from call');
  }, [selectedCall, announceToScreenReader]);

  const handleCallTakeover = useCallback((takeoverData: any) => {
    console.log('👤 Call takeover:', takeoverData);
    
    setActiveCalls(prev => prev.map(call => {
      if (call.call_id === takeoverData.call_id) {
        return {
          ...call,
          human_takeover: true,
          takeover_time: takeoverData.timestamp
        };
      }
      return call;
    }));
    
    if (selectedCall?.call_id === takeoverData.call_id) {
      setSelectedCall(prev => prev ? {
        ...prev,
        human_takeover: true,
        takeover_time: takeoverData.timestamp
      } : null);
    }
    
    announceToScreenReader('Call taken over by human operator');
  }, [selectedCall, announceToScreenReader]);

  const handleRecordingComplete = useCallback((recordingData: any) => {
    console.log('🎙️ Recording completed:', recordingData);
    announceToScreenReader('Call recording completed');
  }, [announceToScreenReader]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone: string): string => {
    // Simple phone number formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getCallStatusColor = (status: string, humanTakeover: boolean): string => {
    if (humanTakeover) return 'text-orange-400';
    
    switch (status) {
      case 'answered':
      case 'in_progress':
        return 'text-green-400';
      case 'gathering_info':
        return 'text-blue-400';
      case 'creating_incident':
        return 'text-yellow-400';
      case 'completed':
        return 'text-gray-400';
      default:
        return 'text-gray-300';
    }
  };

  const getCallStatusIcon = (status: string, humanTakeover: boolean) => {
    if (humanTakeover) return <User className="w-4 h-4" />;
    
    switch (status) {
      case 'answered':
      case 'in_progress':
        return <Phone className="w-4 h-4" />;
      case 'gathering_info':
        return <Mic className="w-4 h-4" />;
      case 'creating_incident':
        return <FileText className="w-4 h-4" />;
      case 'completed':
        return <PhoneOff className="w-4 h-4" />;
      default:
        return <Phone className="w-4 h-4" />;
    }
  };

  // Memoized computed values
  const connectionStatus = useMemo(() => {
    if (isRetrying) return 'Reconnecting...';
    if (isConnected) return 'Connected';
    if (error) return 'Error';
    return 'Disconnected';
  }, [isConnected, isRetrying, error]);

  const connectionStatusColor = useMemo(() => {
    if (isRetrying) return 'bg-yellow-900 text-yellow-300';
    if (isConnected) return 'bg-green-900 text-green-300';
    if (error) return 'bg-red-900 text-red-300';
    return 'bg-gray-900 text-gray-300';
  }, [isConnected, isRetrying, error]);

  // Loading state
  if (loading && !error) {
    return <LiveCallMonitorSkeleton className={className} />;
  }

  // Error boundary fallback
  const errorFallback = error ? (
    <div className={`bg-gray-900 rounded-lg border border-red-700 p-6 ${className}`}>
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Voice Monitoring Error</h3>
        <p className="text-red-300 mb-4">{error}</p>
        
        {retryCount < maxRetries && (
          <div className="flex justify-center space-x-3">
            <button
              onClick={handleRetryConnection}
              disabled={isRetrying}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              aria-label="Retry connection"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Retrying...' : 'Retry Connection'}</span>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              aria-label="Reload page"
            >
              Reload Page
            </button>
          </div>
        )}
        
        {retryCount >= maxRetries && (
          <div className="mt-4 p-3 bg-orange-900/20 border border-orange-700 rounded-lg">
            <p className="text-sm text-orange-300">
              Maximum retry attempts reached. Please check your connection and refresh the page.
            </p>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <ErrorBoundary
      componentName="LiveCallMonitor"
      errorCategory="voice"
      className={className}
      fallback={errorFallback}
    >
      <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`} role="region" aria-label="Live call monitoring interface">
        {/* Header */}
        <div className="border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <PhoneCall className="w-6 h-6 text-green-400" aria-hidden="true" />
              <h1 className="text-xl font-semibold text-white">Live Call Monitor</h1>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${connectionStatusColor}`} role="status" aria-label={`Connection status: ${connectionStatus}`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400' : isRetrying ? 'bg-yellow-400' : 'bg-red-400'
                } ${isRetrying ? 'animate-pulse' : ''}`} aria-hidden="true"></div>
                <span>{connectionStatus}</span>
              </div>
              
              {/* Performance indicator (development mode) */}
              {process.env.NODE_ENV === 'development' && performanceMetrics.messageLatency > 0 && (
                <div className="text-xs text-gray-500" title={`Latency: ${performanceMetrics.messageLatency}ms`}>
                  {performanceMetrics.messageLatency}ms
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Audio toggle */}
              <button
                onClick={toggleAudio}
                className={`p-2 rounded-lg transition-colors ${
                  audioEnabled 
                    ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                aria-label={`${audioEnabled ? 'Disable' : 'Enable'} audio notifications`}
                title={`${audioEnabled ? 'Disable' : 'Enable'} audio notifications`}
              >
                {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              
              {/* Call count */}
              <div className="text-sm text-gray-400" role="status" aria-live="polite">
                {activeCalls.length} active call{activeCalls.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-96" role="main">
          {/* Call List */}
          <div className="w-1/3 border-r border-gray-700 overflow-y-auto" role="complementary" aria-label="Active calls list">
            <div className="p-3">
              <h2 className="text-sm font-medium text-gray-300 mb-3">Active Calls</h2>
              {activeCalls.length === 0 ? (
                <div className="text-center py-8 text-gray-500" role="status">
                  <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                  <p>No active calls</p>
                </div>
              ) : (
                <div className="space-y-2" role="list" aria-label="Active calls">
                  {activeCalls.map((call) => (
                    <div
                      key={call.call_id}
                      onClick={() => setSelectedCall(call)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedCall(call);
                        }
                      }}
                      role="listitem button"
                      tabIndex={0}
                      aria-selected={selectedCall?.call_id === call.call_id}
                      aria-label={`Call from ${formatPhoneNumber(call.caller_phone)}, status: ${call.human_takeover ? 'Human takeover' : call.status}, duration: ${formatDuration(call.duration_seconds)}`}
                      className={`p-3 rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        selectedCall?.call_id === call.call_id
                          ? 'bg-green-900/30 border border-green-700'
                          : 'bg-gray-800 hover:bg-gray-750 border border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={getCallStatusColor(call.status, call.human_takeover)} aria-hidden="true">
                            {getCallStatusIcon(call.status, call.human_takeover)}
                          </div>
                          <span className="text-sm font-medium text-white">
                            {formatPhoneNumber(call.caller_phone)}
                          </span>
                        </div>
                        {call.incident_created && (
                          <Shield className="w-4 h-4 text-yellow-400" aria-label="Incident created" title="Incident created" />
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
          <div className="flex-1 flex flex-col" role="main" aria-label="Call details">
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
                    
                    <div className="flex space-x-2" role="group" aria-label="Call actions">
                      {!selectedCall.human_takeover && (
                        <button
                          onClick={() => handleTakeoverCall(selectedCall.call_id)}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 focus:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white rounded-lg flex items-center space-x-2 transition-colors"
                          aria-label="Take over this call"
                        >
                          <User className="w-4 h-4" aria-hidden="true" />
                          <span>Take Over</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleEscalateCall(selectedCall.call_id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 focus:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-white rounded-lg flex items-center space-x-2 transition-colors"
                        aria-label="Escalate this call to emergency services"
                      >
                        <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                        <span>Escalate</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transcript */}
                <div className="flex-1 overflow-y-auto p-4" role="log" aria-label="Call transcript" aria-live="polite">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Live Transcript</h3>
                  {selectedCall.transcript.length === 0 ? (
                    <div className="text-center py-8 text-gray-500" role="status">
                      <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                      <p>Waiting for conversation...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCall.transcript.map((entry, index) => (
                        <div
                          key={index}
                          role="article"
                          aria-label={`${entry.speaker === 'caller' ? 'Caller' : 'AI Dispatcher'} said: ${entry.message}`}
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
              <div className="flex-1 flex items-center justify-center text-gray-500" role="status">
                <div className="text-center">
                  <PhoneCall className="w-12 h-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                  <p>Select a call to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default LiveCallMonitor;
