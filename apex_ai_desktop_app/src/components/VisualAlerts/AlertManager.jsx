/**
 * ALERT MANAGER - REACT COMPONENT
 * ===============================
 * Master component that coordinates visual and audio alerts
 * Connects to AI engine and manages alert lifecycle
 * 
 * Features:
 * - Real-time WebSocket connection to AI engine
 * - Visual alert coordination and management
 * - Audio alert triggering and control
 * - Alert history and statistics
 * - Performance monitoring and optimization
 * - Multi-zone alert handling
 * - Face detection alert integration (Phase 1 Enhancement)
 * 
 * Priority: P1 HIGH - Central alert coordination system
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import BlinkingBorderOverlay, { useVisualAlerts, ThreatColors, PatternTypes } from './BlinkingBorderOverlay';

// PHASE 1: Import face detection components
import PersonTypeIndicator from '../FaceDetection/PersonTypeIndicator';

// Styled components
const AlertManagerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const AlertControlPanel = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px;
  min-width: 250px;
  z-index: 2000;
  backdrop-filter: blur(10px);
  
  ${props => !props.visible && `
    opacity: 0;
    pointer-events: none;
    transform: translateX(100%);
  `}
  
  transition: all 0.3s ease;
`;

const AlertStats = styled.div`
  color: #ffffff;
  font-size: 12px;
  margin-bottom: 8px;
  
  .stat-row {
    display: flex;
    justify-content: space-between;
    margin: 2px 0;
  }
  
  .stat-label {
    color: #b0b0b0;
  }
  
  .stat-value {
    color: #00ff88;
    font-weight: 600;
  }
  
  .critical-count {
    color: #ff0000;
  }
  
  .high-count {
    color: #ff8500;
  }
`;

const AlertList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  margin-top: 8px;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: #333;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #666;
    border-radius: 2px;
  }
`;

const AlertItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid ${props => props.borderColor || '#888'};
  padding: 6px 8px;
  margin: 4px 0;
  border-radius: 4px;
  font-size: 11px;
  
  .alert-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }
  
  .alert-type {
    color: ${props => props.borderColor || '#888'};
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .alert-level {
    background: ${props => props.borderColor || '#888'};
    color: ${props => props.textColor || '#ffffff'};
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 9px;
  }
  
  .alert-description {
    color: #b0b0b0;
    margin: 2px 0;
  }
  
  .alert-metadata {
    color: #808080;
    font-size: 10px;
  }
`;

const ControlButton = styled.button`
  background: ${props => props.active ? '#00ff88' : 'transparent'};
  border: 1px solid ${props => props.active ? '#00ff88' : '#666'};
  color: ${props => props.active ? '#000' : '#fff'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  margin: 2px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? '#00cc6a' : 'rgba(255, 255, 255, 0.1)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Alert sound effects (Web Audio API)
class AlertAudioEngine {
  constructor() {
    this.audioContext = null;
    this.isEnabled = true;
    this.volume = 0.3;
    this.sounds = {};
    
    this.initAudioContext();
  }
  
  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }
  
  playThreatSound(threatLevel, threatType) {
    if (!this.isEnabled || !this.audioContext) return;
    
    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    const soundConfig = this.getSoundConfig(threatLevel, threatType);
    this.generateAndPlayTone(soundConfig);
  }
  
  getSoundConfig(threatLevel, threatType) {
    const configs = {
      'CRITICAL': {
        frequency: 800,
        duration: 0.5,
        pattern: 'strobe',
        volume: 0.5
      },
      'HIGH': {
        frequency: 600,
        duration: 0.3,
        pattern: 'double_beep',
        volume: 0.4
      },
      'MEDIUM': {
        frequency: 400,
        duration: 0.2,
        pattern: 'single_beep',
        volume: 0.3
      },
      'LOW': {
        frequency: 300,
        duration: 0.15,
        pattern: 'soft_beep',
        volume: 0.2
      }
    };
    
    return configs[threatLevel] || configs['MEDIUM'];
  }
  
  generateAndPlayTone({ frequency, duration, pattern, volume }) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';
    
    // Volume envelope
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume * this.volume, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
  
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
  
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

// Main Alert Manager Component
const AlertManager = ({
  websocketUrl = 'ws://localhost:8765',
  enableAudio = true,
  enableVisualAlerts = true,
  showControlPanel = true,
  maxAlerts = 50,
  autoExpireAlerts = true,
  alertExpireTime = 300000, // 5 minutes
  className,
  style,
  onAlert,
  onAlertExpire,
  children,
  ...props
}) => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [alertStats, setAlertStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    active: 0
  });
  const [audioEnabled, setAudioEnabled] = useState(enableAudio);
  const [visualEnabled, setVisualEnabled] = useState(enableVisualAlerts);
  const [controlPanelVisible, setControlPanelVisible] = useState(false);
  const [alertHistory, setAlertHistory] = useState([]);
  
  // PHASE 1: Face Detection alert state
  const [faceAlerts, setFaceAlerts] = useState([]);
  const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(true);
  const [faceAlertStats, setFaceAlertStats] = useState({
    totalFaceAlerts: 0,
    knownPersons: 0,
    unknownPersons: 0,
    blacklistAlerts: 0,
    vipAlerts: 0
  });
  
  // Refs
  const websocketRef = useRef(null);
  const audioEngineRef = useRef(null);
  const alertTimeoutsRef = useRef(new Map());
  
  // Custom hooks
  const {
    alerts,
    addAlert,
    removeAlert,
    clearAllAlerts,
    updateAlert,
    alertCount
  } = useVisualAlerts();
  
  // Initialize audio engine
  useEffect(() => {
    if (enableAudio) {
      audioEngineRef.current = new AlertAudioEngine();
    }
    
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current = null;
      }
    };
  }, [enableAudio]);
  
  // WebSocket connection management
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      disconnectWebSocket();
    };
  }, [websocketUrl]);
  
  const connectWebSocket = useCallback(() => {
    try {
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        return; // Already connected
      }
      
      setConnectionStatus('connecting');
      websocketRef.current = new WebSocket(websocketUrl);
      
      websocketRef.current.onopen = () => {
        console.log('✅ Connected to AI Engine WebSocket');
        setIsConnected(true);
        setConnectionStatus('connected');
        
        // Send initial configuration
        sendWebSocketMessage({
          type: 'configure_alerts',
          config: {
            visual_alerts: visualEnabled,
            audio_alerts: audioEnabled,
            max_alerts: maxAlerts
          }
        });
      };
      
      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      websocketRef.current.onclose = () => {
        console.log('🔌 WebSocket connection closed');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt reconnection after delay
        setTimeout(() => {
          if (websocketRef.current?.readyState !== WebSocket.OPEN) {
            connectWebSocket();
          }
        }, 5000);
      };
      
      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [websocketUrl, visualEnabled, audioEnabled, maxAlerts]);
  
  const disconnectWebSocket = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);
  
  const sendWebSocketMessage = useCallback((message) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    }
  }, []);
  
  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'threat_detection':
        handleThreatDetection(data.data);
        break;
        
      case 'face_detection':
        handleFaceDetection(data.data);
        break;
        
      case 'alert_update':
        handleAlertUpdate(data.data);
        break;
        
      case 'system_status':
        // Handle system status updates
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  }, []);
  
  // Handle threat detection from AI engine
  const handleThreatDetection = useCallback((threatData) => {
    const { detection } = threatData;
    
    if (!detection) return;
    
    // Create alert object
    const alert = {
      alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      zoneId: detection.metadata?.camera_id || 'unknown',
      region: convertBboxToRegion(detection.bbox),
      threatLevel: detection.threat_level || 'MEDIUM',
      threatType: detection.type || 'unknown',
      description: detection.description || 'Threat detected',
      confidence: detection.confidence || 0.5,
      timestamp: new Date().toISOString(),
      metadata: detection.metadata || {},
      patternType: getPatternForThreat(detection.threat_level, detection.type),
      isVisible: true,
      opacity: Math.max(0.6, detection.confidence || 0.5)
    };
    
    // Add visual alert
    if (visualEnabled) {
      addAlert(alert);
    }
    
    // Play audio alert
    if (audioEnabled && audioEngineRef.current) {
      audioEngineRef.current.playThreatSound(alert.threatLevel, alert.threatType);
    }
    
    // Add to history
    setAlertHistory(prev => [{
      ...alert,
      action: 'created'
    }, ...prev.slice(0, 99)]); // Keep last 100
    
    // Set auto-expire timer
    if (autoExpireAlerts) {
      const timeoutId = setTimeout(() => {
        removeAlert(alert.alertId);
        if (onAlertExpire) {
          onAlertExpire(alert);
        }
      }, alertExpireTime);
      
      alertTimeoutsRef.current.set(alert.alertId, timeoutId);
    }
    
    // Update statistics
    updateAlertStatistics();
    
    // Call external handler
    if (onAlert) {
      onAlert(alert);
    }
    
    console.log(`🚨 New ${alert.threatLevel} threat: ${alert.threatType}`, alert);
    
  }, [visualEnabled, audioEnabled, addAlert, removeAlert, autoExpireAlerts, alertExpireTime, onAlert, onAlertExpire]);
  
  // Handle face detection (can trigger alerts for unknown/blacklisted persons)
  const handleFaceDetection = useCallback((faceData) => {
    // Only create alerts for blacklisted or unknown persons in restricted areas
    if (faceData.person_type === 'blacklist' || 
        (faceData.person_type === 'unknown' && faceData.zone && 
         ['executive', 'server_room', 'storage'].includes(faceData.zone))) {
      
      const alert = {
        alertId: `face_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        zoneId: faceData.camera_id || 'unknown',
        region: convertFaceLocationToRegion(faceData.face_location),
        threatLevel: faceData.person_type === 'blacklist' ? 'CRITICAL' : 'HIGH',
        threatType: 'unauthorized_person',
        description: faceData.person_type === 'blacklist' 
          ? `Blacklisted person: ${faceData.person_name}`
          : `Unknown person in restricted area`,
        confidence: faceData.confidence || 0.8,
        timestamp: new Date().toISOString(),
        metadata: faceData,
        patternType: faceData.person_type === 'blacklist' ? 'emergency_flash' : 'fast_blink',
        isVisible: true,
        opacity: 0.9
      };
      
      if (visualEnabled) {
        addAlert(alert);
      }
      
      if (audioEnabled && audioEngineRef.current) {
        audioEngineRef.current.playThreatSound(alert.threatLevel, alert.threatType);
      }
    }
  }, [visualEnabled, audioEnabled, addAlert]);
  
  // Handle alert updates
  const handleAlertUpdate = useCallback((updateData) => {
    if (updateData.action === 'clear' && updateData.alertId) {
      removeAlert(updateData.alertId);
      
      // Clear timeout
      const timeoutId = alertTimeoutsRef.current.get(updateData.alertId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        alertTimeoutsRef.current.delete(updateData.alertId);
      }
    } else if (updateData.action === 'update' && updateData.alertId) {
      updateAlert(updateData.alertId, updateData.updates);
    }
  }, [removeAlert, updateAlert]);
  
  // Utility functions
  const convertBboxToRegion = (bbox) => {
    if (!bbox || !Array.isArray(bbox) || bbox.length < 4) {
      return { x: 0, y: 0, width: 100, height: 100 };
    }
    
    const [x1, y1, x2, y2] = bbox;
    return {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1)
    };
  };
  
  const convertFaceLocationToRegion = (faceLocation) => {
    if (!faceLocation) {
      return { x: 0, y: 0, width: 100, height: 100 };
    }
    
    const { top, right, bottom, left } = faceLocation;
    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top
    };
  };
  
  const getPatternForThreat = (threatLevel, threatType) => {
    const patternMap = {
      'CRITICAL': PatternTypes.EMERGENCY_FLASH,
      'HIGH': PatternTypes.FAST_BLINK,
      'MEDIUM': PatternTypes.PULSE,
      'LOW': PatternTypes.BREATHING
    };
    
    // Special patterns for specific threat types
    if (threatType === 'weapon' && threatLevel === 'CRITICAL') {
      return PatternTypes.STROBE;
    } else if (threatType === 'violence' && threatLevel !== 'LOW') {
      return PatternTypes.HEARTBEAT;
    } else if (threatType === 'transient_activity') {
      return PatternTypes.BREATHING;
    }
    
    return patternMap[threatLevel] || PatternTypes.PULSE;
  };
  
  const updateAlertStatistics = useCallback(() => {
    const stats = alerts.reduce((acc, alert) => {
      acc.total++;
      acc.active++;
      
      switch (alert.threatLevel) {
        case 'CRITICAL':
          acc.critical++;
          break;
        case 'HIGH':
          acc.high++;
          break;
        case 'MEDIUM':
          acc.medium++;
          break;
        case 'LOW':
          acc.low++;
          break;
      }
      
      return acc;
    }, { total: 0, critical: 0, high: 0, medium: 0, low: 0, active: 0 });
    
    setAlertStats(stats);
  }, [alerts]);
  
  // Update stats when alerts change
  useEffect(() => {
    updateAlertStatistics();
  }, [updateAlertStatistics]);
  
  // Control functions
  const toggleAudio = useCallback(() => {
    const newEnabled = !audioEnabled;
    setAudioEnabled(newEnabled);
    
    if (audioEngineRef.current) {
      audioEngineRef.current.setEnabled(newEnabled);
    }
    
    sendWebSocketMessage({
      type: 'update_config',
      config: { audio_alerts: newEnabled }
    });
  }, [audioEnabled, sendWebSocketMessage]);
  
  const toggleVisual = useCallback(() => {
    const newEnabled = !visualEnabled;
    setVisualEnabled(newEnabled);
    
    if (!newEnabled) {
      clearAllAlerts();
    }
    
    sendWebSocketMessage({
      type: 'update_config',
      config: { visual_alerts: newEnabled }
    });
  }, [visualEnabled, clearAllAlerts, sendWebSocketMessage]);
  
  const clearAllAlertsWithConfirm = useCallback(() => {
    if (window.confirm(`Clear all ${alertCount} active alerts?`)) {
      clearAllAlerts();
      
      // Clear all timeouts
      alertTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      alertTimeoutsRef.current.clear();
      
      // Notify server
      sendWebSocketMessage({
        type: 'clear_all_alerts'
      });
    }
  }, [alertCount, clearAllAlerts, sendWebSocketMessage]);
  
  // Render alert history items
  const renderAlertHistory = useMemo(() => {
    return alertHistory.slice(0, 10).map((alert, index) => (
      <AlertItem
        key={`${alert.alertId}-${index}`}
        borderColor={ThreatColors[alert.threatLevel] || ThreatColors.MEDIUM}
        textColor={alert.threatLevel === 'MEDIUM' ? '#000' : '#fff'}
      >
        <div className=\"alert-header\">
          <span className=\"alert-type\">{alert.threatType}</span>
          <span className=\"alert-level\">{alert.threatLevel}</span>
        </div>
        <div className=\"alert-description\">{alert.description}</div>
        <div className=\"alert-metadata\">
          Zone: {alert.zoneId} | Confidence: {(alert.confidence * 100).toFixed(0)}%
        </div>
      </AlertItem>
    ));
  }, [alertHistory]);
  
  return (
    <AlertManagerContainer
      className={className}
      style={style}
      onMouseEnter={() => setControlPanelVisible(true)}
      onMouseLeave={() => setControlPanelVisible(false)}
      {...props}
    >
      {/* Visual Alert Overlay */}
      {visualEnabled && (
        <BlinkingBorderOverlay
          alerts={alerts}
          showLabels={true}
          enableGlow={true}
          onAlertClick={(alert) => {
            console.log('Alert clicked:', alert);
            // Could open alert details modal
          }}
        />
      )}
      
      {/* Control Panel */}
      {showControlPanel && (
        <AlertControlPanel visible={controlPanelVisible}>
          <AlertStats>
            <div className=\"stat-row\">
              <span className=\"stat-label\">Connection:</span>
              <span className={`stat-value ${isConnected ? '' : 'critical-count'}`}>
                {connectionStatus.toUpperCase()}
              </span>
            </div>
            <div className=\"stat-row\">
              <span className=\"stat-label\">Active Alerts:</span>
              <span className=\"stat-value\">{alertStats.active}</span>
            </div>
            <div className=\"stat-row\">
              <span className=\"stat-label\">Critical:</span>
              <span className=\"critical-count\">{alertStats.critical}</span>
            </div>
            <div className=\"stat-row\">
              <span className=\"stat-label\">High:</span>
              <span className=\"high-count\">{alertStats.high}</span>
            </div>
            <div className=\"stat-row\">
              <span className=\"stat-label\">Medium:</span>
              <span className=\"stat-value\">{alertStats.medium}</span>
            </div>
            <div className=\"stat-row\">
              <span className=\"stat-label\">Low:</span>
              <span className=\"stat-value\">{alertStats.low}</span>
            </div>
          </AlertStats>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
            <ControlButton 
              active={audioEnabled} 
              onClick={toggleAudio}
              title=\"Toggle Audio Alerts\"
            >
              🔊 Audio
            </ControlButton>
            <ControlButton 
              active={visualEnabled} 
              onClick={toggleVisual}
              title=\"Toggle Visual Alerts\"
            >
              👁️ Visual
            </ControlButton>
            <ControlButton 
              onClick={clearAllAlertsWithConfirm}
              disabled={alertCount === 0}
              title=\"Clear All Alerts\"
            >
              🧹 Clear
            </ControlButton>
            <ControlButton 
              active={isConnected}
              onClick={isConnected ? disconnectWebSocket : connectWebSocket}
              title={isConnected ? 'Disconnect' : 'Reconnect'}
            >
              {isConnected ? '🔌 Disconnect' : '🔄 Reconnect'}
            </ControlButton>
          </div>
          
          {/* Recent Alerts */}
          <div style={{ borderTop: '1px solid #333', paddingTop: '8px' }}>
            <div style={{ color: '#b0b0b0', fontSize: '11px', marginBottom: '4px' }}>
              Recent Alerts
            </div>
            <AlertList>
              {renderAlertHistory}
            </AlertList>
          </div>
        </AlertControlPanel>
      )}
      
      {/* Child components */}
      {children}
    </AlertManagerContainer>
  );
};

export default AlertManager;

// Export utility components and hooks
export { BlinkingBorderOverlay, useVisualAlerts, ThreatColors, PatternTypes };
