/**
 * WEBSOCKET-INTEGRATED CALL INTERVENTION PANEL - MASTER PROMPT v52.0 (FIXED)
 * =============================================================================
 * Enhanced CallInterventionPanel with direct WebSocket integration
 * FIXED: Updated to use correct webSocketManager API methods
 * 
 * Features:
 * - Direct WebSocket communication for takeover requests
 * - Real-time call status updates
 * - WebSocket connection monitoring
 * - Enhanced error handling and retry logic
 * - Live feedback from backend systems
 * - Emergency escalation with immediate backend acknowledgment
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Phone, PhoneCall, PhoneOff, User, AlertTriangle, 
  Shield, Clock, Mic, MicOff, Volume2, VolumeX,
  Settings, CheckCircle, XCircle, Play, Pause,
  Wifi, WifiOff, Activity, AlertCircle
} from 'lucide-react';
import { webSocketManager, MESSAGE_TYPES } from '../../services/webSocketManager';

interface CallInterventionPanelProps {
  callId?: string;
  isCallActive?: boolean;
  className?: string;
  onStatusUpdate?: (status: CallInterventionStatus) => void;
  autoConnect?: boolean;
  reconnectOnFailure?: boolean;
}

interface CallInterventionStatus {
  connected: boolean;
  callId?: string;
  isProcessing: boolean;
  lastAction?: string;
  error?: string;
}

interface TakeoverReason {
  id: string;
  label: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface EscalationType {
  id: string;
  label: string;
  description: string;
  action: string;
}

const CallInterventionPanelWebSocket: React.FC<CallInterventionPanelProps> = ({
  callId,
  isCallActive = false,
  className = '',
  onStatusUpdate,
  autoConnect = true,
  reconnectOnFailure = true
}) => {
  // State management
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTakeoverModal, setShowTakeoverModal] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [selectedEscalation, setSelectedEscalation] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [voiceAIConnected, setVoiceAIConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [callControls, setCallControls] = useState({
    muted: false,
    recording: true,
    volume: 75
  });

  // Refs
  const mountedRef = useRef(true);
  const connectionRetryRef = useRef<NodeJS.Timeout | null>(null);

  // Constants
  const MAX_CONNECTION_ATTEMPTS = 5;
  const RETRY_DELAY = 2000;

  const takeoverReasons: TakeoverReason[] = [
    {
      id: 'emergency_situation',
      label: 'Emergency Situation',
      description: 'Caller is reporting a life-threatening emergency',
      priority: 'critical'
    },
    {
      id: 'ai_confusion',
      label: 'AI Confusion',
      description: 'AI is having difficulty understanding the caller',
      priority: 'high'
    },
    {
      id: 'complex_situation',
      label: 'Complex Situation',
      description: 'Situation requires human judgment and nuanced response',
      priority: 'medium'
    },
    {
      id: 'caller_request',
      label: 'Caller Request',
      description: 'Caller specifically requested to speak with a human',
      priority: 'medium'
    },
    {
      id: 'quality_concerns',
      label: 'Quality Concerns',
      description: 'Call quality or technical issues affecting conversation',
      priority: 'low'
    },
    {
      id: 'policy_violation',
      label: 'Policy Violation',
      description: 'Situation may involve policy or legal considerations',
      priority: 'high'
    },
    {
      id: 'custom',
      label: 'Custom Reason',
      description: 'Specify a custom reason for takeover',
      priority: 'medium'
    }
  ];

  const escalationTypes: EscalationType[] = [
    {
      id: 'emergency_services',
      label: 'Emergency Services',
      description: 'Immediately contact 911/emergency services',
      action: 'Call 911'
    },
    {
      id: 'police_non_emergency',
      label: 'Police (Non-Emergency)',
      description: 'Contact local police non-emergency line',
      action: 'Call Police'
    },
    {
      id: 'supervisor',
      label: 'Supervisor Escalation',
      description: 'Escalate to security supervisor',
      action: 'Alert Supervisor'
    },
    {
      id: 'property_manager',
      label: 'Property Manager',
      description: 'Contact property management immediately',
      action: 'Call Manager'
    },
    {
      id: 'guard_backup',
      label: 'Additional Guards',
      description: 'Dispatch additional security personnel',
      action: 'Dispatch Backup'
    },
    {
      id: 'technical_support',
      label: 'Technical Support',
      description: 'Contact technical support for system issues',
      action: 'Tech Support'
    }
  ];

  // WebSocket event handlers
  const handleConnectionStatus = useCallback(() => {
    if (!mountedRef.current) return;

    const mainConnected = webSocketManager.isConnected();
    const voiceConnected = webSocketManager.isVoiceAIConnected();
    const authenticated = webSocketManager.isVoiceAIAuthenticated();
    
    setWsConnected(mainConnected);
    setVoiceAIConnected(voiceConnected && authenticated);
    
    // Update parent component
    onStatusUpdate?.({
      connected: voiceConnected && authenticated,
      callId,
      isProcessing,
      error: lastError
    });
  }, [callId, isProcessing, lastError, onStatusUpdate]);

  const handleVoiceAIEvent = useCallback((eventType: string) => {
    return (data: any) => {
      if (!mountedRef.current) return;

      console.log('[CALL INTERVENTION WS] Received Voice AI event:', eventType, data);

      switch (eventType) {
        case 'voice_ai_connected':
          setVoiceAIConnected(true);
          setLastError(null);
          break;

        case 'voice_ai_authenticated':
          setVoiceAIConnected(true);
          setConnectionAttempts(0);
          setLastError(null);
          break;

        case 'voice_ai_disconnected':
          setVoiceAIConnected(false);
          if (reconnectOnFailure && connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
            scheduleReconnection();
          }
          break;

        case 'voice_ai_error':
          setLastError(data.message || 'Voice AI WebSocket error');
          break;

        case 'voice_ai_auth_failed':
          setLastError(data.error || 'Voice AI authentication failed');
          setIsProcessing(false);
          break;

        // Handle takeover responses
        case MESSAGE_TYPES.VOICE_HUMAN_TAKEOVER:
          if (data.sessionId === callId || data.callId === callId) {
            setIsProcessing(false);
            setShowTakeoverModal(false);
            setSelectedReason('');
            setCustomReason('');
            setLastError(null);
            console.log('Takeover completed successfully:', data);
          }
          break;

        // Handle emergency alerts
        case MESSAGE_TYPES.VOICE_EMERGENCY_ALERT:
          if (data.callId === callId) {
            setIsProcessing(false);
            setShowEscalationModal(false);
            setSelectedEscalation('');
            setLastError(null);
            console.log('Emergency escalation completed:', data);
          }
          break;

        case MESSAGE_TYPES.ERROR:
          setLastError(data.message || 'WebSocket error occurred');
          setIsProcessing(false);
          break;

        default:
          console.log('[CALL INTERVENTION WS] Unhandled Voice AI event:', eventType);
      }
    };
  }, [callId, reconnectOnFailure, connectionAttempts]);

  const scheduleReconnection = useCallback(() => {
    if (connectionRetryRef.current) {
      clearTimeout(connectionRetryRef.current);
    }
    
    connectionRetryRef.current = setTimeout(() => {
      if (mountedRef.current && connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
        setConnectionAttempts(prev => prev + 1);
        console.log(`[CALL INTERVENTION WS] Attempting Voice AI reconnection (${connectionAttempts + 1}/${MAX_CONNECTION_ATTEMPTS})`);
        initializeWebSocket();
      }
    }, RETRY_DELAY * (connectionAttempts + 1));
  }, [connectionAttempts]);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    try {
      // Set up Voice AI event listeners using the correct webSocketManager API
      webSocketManager.on('voice_ai_connected', handleVoiceAIEvent('voice_ai_connected'));
      webSocketManager.on('voice_ai_authenticated', handleVoiceAIEvent('voice_ai_authenticated'));
      webSocketManager.on('voice_ai_disconnected', handleVoiceAIEvent('voice_ai_disconnected'));
      webSocketManager.on('voice_ai_error', handleVoiceAIEvent('voice_ai_error'));
      webSocketManager.on('voice_ai_auth_failed', handleVoiceAIEvent('voice_ai_auth_failed'));
      
      // Listen for Voice AI specific events
      webSocketManager.on(MESSAGE_TYPES.VOICE_HUMAN_TAKEOVER, handleVoiceAIEvent(MESSAGE_TYPES.VOICE_HUMAN_TAKEOVER));
      webSocketManager.on(MESSAGE_TYPES.VOICE_EMERGENCY_ALERT, handleVoiceAIEvent(MESSAGE_TYPES.VOICE_EMERGENCY_ALERT));
      webSocketManager.on(MESSAGE_TYPES.ERROR, handleVoiceAIEvent(MESSAGE_TYPES.ERROR));
      
      // Monitor connection status
      const statusInterval = setInterval(handleConnectionStatus, 1000);
      
      // Connect to Voice AI if not already connected
      if (!webSocketManager.isVoiceAIConnected()) {
        webSocketManager.connectVoiceAI('demo_token', 'dispatcher');
      }
      
      // Initial status check
      handleConnectionStatus();
      
      // Clean up interval on unmount
      return () => clearInterval(statusInterval);
      
    } catch (error) {
      console.error('[CALL INTERVENTION WS] Initialization error:', error);
      setLastError('Failed to initialize WebSocket connection');
    }
  }, [handleVoiceAIEvent, handleConnectionStatus]);

  // Effect for mounting and cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    let cleanup: (() => void) | undefined;
    
    if (autoConnect) {
      cleanup = initializeWebSocket();
    }

    return () => {
      mountedRef.current = false;
      
      // Clean up timeout
      if (connectionRetryRef.current) {
        clearTimeout(connectionRetryRef.current);
      }
      
      // Clean up status interval
      if (cleanup) {
        cleanup();
      }
      
      // Unsubscribe from WebSocket events
      webSocketManager.off('voice_ai_connected', handleVoiceAIEvent('voice_ai_connected'));
      webSocketManager.off('voice_ai_authenticated', handleVoiceAIEvent('voice_ai_authenticated'));
      webSocketManager.off('voice_ai_disconnected', handleVoiceAIEvent('voice_ai_disconnected'));
      webSocketManager.off('voice_ai_error', handleVoiceAIEvent('voice_ai_error'));
      webSocketManager.off('voice_ai_auth_failed', handleVoiceAIEvent('voice_ai_auth_failed'));
      webSocketManager.off(MESSAGE_TYPES.VOICE_HUMAN_TAKEOVER, handleVoiceAIEvent(MESSAGE_TYPES.VOICE_HUMAN_TAKEOVER));
      webSocketManager.off(MESSAGE_TYPES.VOICE_EMERGENCY_ALERT, handleVoiceAIEvent(MESSAGE_TYPES.VOICE_EMERGENCY_ALERT));
      webSocketManager.off(MESSAGE_TYPES.ERROR, handleVoiceAIEvent(MESSAGE_TYPES.ERROR));
    };
  }, [autoConnect, initializeWebSocket, handleVoiceAIEvent]);

  // Action handlers with correct WebSocket integration
  const handleTakeoverClick = () => {
    if (!callId) {
      setLastError('No active call to take over');
      return;
    }
    if (!voiceAIConnected) {
      setLastError('Voice AI WebSocket not connected');
      return;
    }
    setShowTakeoverModal(true);
  };

  const handleEscalationClick = () => {
    if (!callId) {
      setLastError('No active call to escalate');
      return;
    }
    if (!voiceAIConnected) {
      setLastError('Voice AI WebSocket not connected');
      return;
    }
    setShowEscalationModal(true);
  };

  const handleConfirmTakeover = async () => {
    if (!callId || !selectedReason) return;

    setIsProcessing(true);
    setLastError(null);
    
    try {
      const reason = selectedReason === 'custom' ? customReason : 
        takeoverReasons.find(r => r.id === selectedReason)?.label || selectedReason;
      
      // Use the correct webSocketManager method
      const success = webSocketManager.requestTakeover(callId, reason);
      
      if (!success) {
        throw new Error('Failed to send takeover request - WebSocket not connected');
      }
      
      console.log('[CALL INTERVENTION] Takeover request sent for call:', callId);
      
      // The response will be handled by the Voice AI event handlers
      
    } catch (error) {
      console.error('[CALL INTERVENTION] Takeover error:', error);
      setLastError(error instanceof Error ? error.message : 'Failed to take over call');
      setIsProcessing(false);
    }
  };

  const handleConfirmEscalation = async () => {
    if (!callId || !selectedEscalation) return;

    setIsProcessing(true);
    setLastError(null);
    
    try {
      const escalationDetails = escalationTypes.find(e => e.id === selectedEscalation)?.description || '';
      
      // Use the correct webSocketManager method
      const success = webSocketManager.emergencyEscalate(callId, selectedEscalation, escalationDetails);
      
      if (!success) {
        throw new Error('Failed to send emergency escalation - WebSocket not connected');
      }
      
      console.log('[CALL INTERVENTION] Emergency escalation sent for call:', callId);
      
      // The response will be handled by the Voice AI event handlers
      
    } catch (error) {
      console.error('[CALL INTERVENTION] Escalation error:', error);
      setLastError(error instanceof Error ? error.message : 'Failed to escalate call');
      setIsProcessing(false);
    }
  };

  const handleEndCall = async () => {
    if (!callId) return;
    
    const confirmed = window.confirm('Are you sure you want to end this call?');
    if (!confirmed) return;

    setIsProcessing(true);
    setLastError(null);
    
    try {
      // Use the correct webSocketManager method
      const success = webSocketManager.endCall(callId, 'Manual termination by dispatcher');
      
      if (!success) {
        throw new Error('Failed to send end call request - WebSocket not connected');
      }
      
      console.log('[CALL INTERVENTION] End call request sent for call:', callId);
      
    } catch (error) {
      console.error('[CALL INTERVENTION] End call error:', error);
      setLastError(error instanceof Error ? error.message : 'Failed to end call');
      setIsProcessing(false);
    }
  };

  const toggleMute = () => {
    setCallControls(prev => ({ ...prev, muted: !prev.muted }));
  };

  const toggleRecording = () => {
    setCallControls(prev => ({ ...prev, recording: !prev.recording }));
  };

  const handleVolumeChange = (volume: number) => {
    setCallControls(prev => ({ ...prev, volume }));
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-900/20 border-red-700';
      case 'high': return 'text-orange-400 bg-orange-900/20 border-orange-700';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'low': return 'text-blue-400 bg-blue-900/20 border-blue-700';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-700';
    }
  };

  return (
    <>
      <div className={`bg-gray-900 rounded-lg border border-gray-700 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Call Intervention</h3>
            <div className={`px-2 py-1 rounded-full text-xs ${
              isCallActive ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'
            }`}>
              {isCallActive ? 'Active Call' : 'No Active Call'}
            </div>
            {/* WebSocket Connection Status */}
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
              voiceAIConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            }`}>
              {voiceAIConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{voiceAIConnected ? 'Voice AI Connected' : 'Voice AI Disconnected'}</span>
            </div>
          </div>
          {callId && (
            <div className="text-sm text-gray-400">
              Call ID: {callId.slice(-8)}
            </div>
          )}
        </div>

        {/* Error Display */}
        {lastError && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-sm">{lastError}</span>
            <button
              onClick={() => setLastError(null)}
              className="text-red-400 hover:text-red-300 ml-auto"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleTakeoverClick}
            disabled={!isCallActive || isProcessing || !voiceAIConnected}
            className={`px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
              isCallActive && !isProcessing && voiceAIConnected
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Take Over Call</span>
          </button>

          <button
            onClick={handleEscalationClick}
            disabled={!isCallActive || isProcessing || !voiceAIConnected}
            className={`px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
              isCallActive && !isProcessing && voiceAIConnected
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Escalate Call</span>
          </button>
        </div>

        {/* Call Controls */}
        {isCallActive && (
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Call Controls</h4>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={toggleMute}
                className={`px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  callControls.muted
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {callControls.muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span className="text-sm">{callControls.muted ? 'Unmute' : 'Mute'}</span>
              </button>

              <button
                onClick={toggleRecording}
                className={`px-3 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  callControls.recording
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {callControls.recording ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span className="text-sm">{callControls.recording ? 'Recording' : 'Stopped'}</span>
              </button>
            </div>

            {/* Volume Control */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Volume</span>
                <span className="text-sm text-gray-400">{callControls.volume}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <VolumeX className="w-4 h-4 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={callControls.volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <Volume2 className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Emergency End Call */}
            <button
              onClick={handleEndCall}
              disabled={isProcessing || !voiceAIConnected}
              className="w-full px-4 py-2 bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>
        )}

        {/* Enhanced Status Indicators */}
        <div className="border-t border-gray-700 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">System Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Main WebSocket</span>
              <div className="flex items-center space-x-1">
                {wsConnected ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400">Disconnected</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Voice AI System</span>
              <div className="flex items-center space-x-1">
                {voiceAIConnected ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Active</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400">Inactive</span>
                    {connectionAttempts > 0 && (
                      <span className="text-yellow-400">({connectionAttempts}/{MAX_CONNECTION_ATTEMPTS})</span>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Emergency Services</span>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Ready</span>
              </div>
            </div>
            {isProcessing && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Processing Request</span>
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4 text-orange-400 animate-pulse" />
                  <span className="text-orange-400">Please wait...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Connection Retry Button */}
        {!voiceAIConnected && connectionAttempts >= MAX_CONNECTION_ATTEMPTS && (
          <div className="border-t border-gray-700 pt-4 mt-4">
            <button
              onClick={() => {
                setConnectionAttempts(0);
                setLastError(null);
                initializeWebSocket();
              }}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Wifi className="w-4 h-4" />
              <span>Retry Voice AI Connection</span>
            </button>
          </div>
        )}
      </div>

      {/* Takeover Modal - Enhanced with WebSocket indicators */}
      {showTakeoverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-600 p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Take Over Call</h3>
              <div className="flex items-center space-x-2">
                {voiceAIConnected ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <button
                  onClick={() => setShowTakeoverModal(false)}
                  disabled={isProcessing}
                  className="text-gray-400 hover:text-white disabled:cursor-not-allowed"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <p className="text-gray-300 mb-4">
              Select a reason for taking over the AI call. This will be sent via Voice AI WebSocket and logged for quality assurance.
            </p>

            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {takeoverReasons.map((reason) => (
                <label
                  key={reason.id}
                  className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedReason === reason.id
                      ? 'bg-orange-900/30 border-orange-600'
                      : 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                  }`}
                >
                  <input
                    type="radio"
                    name="takeoverReason"
                    value={reason.id}
                    checked={selectedReason === reason.id}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    disabled={isProcessing}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white">{reason.label}</span>
                        <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(reason.priority)}`}>
                          {reason.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{reason.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {selectedReason === 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom Reason
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Describe the reason for taking over the call..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                  rows={3}
                />
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowTakeoverModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTakeover}
                disabled={!selectedReason || (selectedReason === 'custom' && !customReason.trim()) || isProcessing || !voiceAIConnected}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Take Over Call</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Modal - Enhanced with WebSocket indicators */}
      {showEscalationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-600 p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Escalate Call</h3>
              <div className="flex items-center space-x-2">
                {voiceAIConnected ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <button
                  onClick={() => setShowEscalationModal(false)}
                  disabled={isProcessing}
                  className="text-gray-400 hover:text-white disabled:cursor-not-allowed"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <p className="text-gray-300 mb-4">
              Select the appropriate escalation action. This will immediately initiate the selected response via Voice AI WebSocket.
            </p>

            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {escalationTypes.map((escalation) => (
                <label
                  key={escalation.id}
                  className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedEscalation === escalation.id
                      ? 'bg-red-900/30 border-red-600'
                      : 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                  }`}
                >
                  <input
                    type="radio"
                    name="escalationType"
                    value={escalation.id}
                    checked={selectedEscalation === escalation.id}
                    onChange={(e) => setSelectedEscalation(e.target.value)}
                    disabled={isProcessing}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">{escalation.label}</span>
                        <span className="px-2 py-1 bg-red-900 text-red-300 rounded-full text-xs">
                          {escalation.action}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{escalation.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowEscalationModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEscalation}
                disabled={!selectedEscalation || isProcessing || !voiceAIConnected}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Escalating...</span>
                  </>
                ) : (
                  <span>Escalate Now</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CallInterventionPanelWebSocket;
export type { CallInterventionPanelProps, CallInterventionStatus };
