/**
 * AUDIO ALERT CONTROLLER - REACT COMPONENT
 * ========================================
 * UI component for managing spatial audio alert system settings
 * Controls volume, channels, spatial positioning, and audio preferences
 * 
 * Features:
 * - Master volume control
 * - Per-threat-level volume adjustment
 * - Spatial audio zone mapping
 * - Audio device selection
 * - Real-time audio testing
 * - Performance monitoring
 * 
 * Priority: P1 HIGH - Essential audio system control interface
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components';

// Styled components
const ControllerContainer = styled.div`
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #333;
  border-radius: 12px;
  padding: 16px;
  min-width: 320px;
  max-width: 400px;
  backdrop-filter: blur(10px);
  
  .section {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #333;
    
    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
  }
  
  .section-title {
    color: #00ff88;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const VolumeControl = styled.div`
  .volume-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 8px 0;
    
    .volume-label {
      color: #b0b0b0;
      font-size: 12px;
      min-width: 80px;
    }
    
    .volume-slider {
      flex: 1;
      margin: 0 12px;
      height: 4px;
      background: #333;
      border-radius: 2px;
      position: relative;
      cursor: pointer;
      
      .volume-fill {
        height: 100%;
        background: linear-gradient(90deg, #00ff88, #00cc6a);
        border-radius: 2px;
        transition: width 0.1s ease;
      }
      
      .volume-handle {
        position: absolute;
        top: -6px;
        width: 16px;
        height: 16px;
        background: #00ff88;
        border-radius: 50%;
        cursor: grab;
        transform: translateX(-50%);
        
        &:active {
          cursor: grabbing;
          transform: translateX(-50%) scale(1.2);
        }
      }
    }
    
    .volume-value {
      color: #ffffff;
      font-size: 11px;
      min-width: 35px;
      text-align: right;
      font-family: monospace;
    }
  }
`;

const AudioDeviceSelector = styled.div`
  .device-select {
    width: 100%;
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 8px 12px;
    color: #ffffff;
    font-size: 12px;
    outline: none;
    
    &:focus {
      border-color: #00ff88;
    }
    
    option {
      background: #1a1a1a;
      color: #ffffff;
    }
  }
`;

const SpatialZoneMapping = styled.div`
  .zone-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin: 12px 0;
  }
  
  .zone-cell {
    aspect-ratio: 1;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #888;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    
    &.active {
      background: #00ff8820;
      border-color: #00ff88;
      color: #00ff88;
    }
    
    &.playing {
      background: #ff440020;
      border-color: #ff4400;
      color: #ff4400;
      animation: pulse 1s infinite;
    }
    
    &:hover {
      background: #333;
      border-color: #666;
    }
    
    .zone-label {
      font-size: 8px;
      text-align: center;
      line-height: 1.2;
    }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const ControlButton = styled.button`
  background: ${props => props.active ? '#00ff88' : 'transparent'};
  border: 1px solid ${props => props.active ? '#00ff88' : '#666'};
  color: ${props => props.active ? '#000' : '#fff'};
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  margin: 2px 4px 2px 0;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? '#00cc6a' : 'rgba(255, 255, 255, 0.1)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.status === 'connected' ? '#00ff88' : 
                         props.status === 'error' ? '#ff4400' : '#666'};
  }
  
  .status-text {
    color: ${props => props.status === 'connected' ? '#00ff88' : 
                      props.status === 'error' ? '#ff4400' : '#888'};
  }
`;

const AudioMetrics = styled.div`
  .metric-row {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    margin: 4px 0;
    
    .metric-label {
      color: #888;
    }
    
    .metric-value {
      color: #fff;
      font-family: monospace;
    }
  }
`;

// Test tone frequencies for different threat levels
const TEST_TONES = {
  'CRITICAL': 800,
  'HIGH': 600,
  'MEDIUM': 450,
  'LOW': 350
};

// Spatial zone layout (3x3 grid representing monitoring area)
const SPATIAL_ZONES = [
  { id: 'nw', label: 'NW', position: { x: -1, y: 1 } },
  { id: 'n', label: 'N', position: { x: 0, y: 1 } },
  { id: 'ne', label: 'NE', position: { x: 1, y: 1 } },
  { id: 'w', label: 'W', position: { x: -1, y: 0 } },
  { id: 'center', label: 'CTR', position: { x: 0, y: 0 } },
  { id: 'e', label: 'E', position: { x: 1, y: 0 } },
  { id: 'sw', label: 'SW', position: { x: -1, y: -1 } },
  { id: 's', label: 'S', position: { x: 0, y: -1 } },
  { id: 'se', label: 'SE', position: { x: 1, y: -1 } }
];

// Web Audio API wrapper for testing
class AudioTestEngine {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
    this.activeOscillators = new Map();
  }
  
  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return false;
    }
  }
  
  async playTestTone(frequency, duration = 1000, volume = 0.3) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.audioContext) return null;
    
    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';
    
    // Volume envelope
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    
    oscillator.start(now);
    oscillator.stop(now + duration / 1000);
    
    const toneId = Date.now();
    this.activeOscillators.set(toneId, oscillator);
    
    // Clean up after tone ends
    setTimeout(() => {
      this.activeOscillators.delete(toneId);
    }, duration);
    
    return toneId;
  }
  
  stopAllTones() {
    this.activeOscillators.forEach(oscillator => {
      try {
        oscillator.stop();
      } catch (error) {
        // Oscillator might already be stopped
      }
    });
    this.activeOscillators.clear();
  }
}

// Main component
const AudioAlertController = ({
  websocketUrl = 'ws://localhost:8765',
  onVolumeChange,
  onConfigUpdate,
  className,
  style,
  ...props
}) => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [threatVolumes, setThreatVolumes] = useState({
    'CRITICAL': 1.0,
    'HIGH': 0.8,
    'MEDIUM': 0.6,
    'LOW': 0.4
  });
  const [selectedZone, setSelectedZone] = useState(null);
  const [playingZones, setPlayingZones] = useState(new Set());
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('default');
  const [audioMetrics, setAudioMetrics] = useState({
    activeAlerts: 0,
    alertsPlayed: 0,
    avgProcessingTime: 0,
    bufferUnderruns: 0
  });
  
  // Refs
  const websocketRef = useRef(null);
  const audioEngineRef = useRef(new AudioTestEngine());
  const volumeSliderRefs = useRef({});
  
  // Initialize audio engine
  useEffect(() => {
    audioEngineRef.current.initialize();
  }, []);
  
  // WebSocket connection
  useEffect(() => {
    connectWebSocket();
    return () => disconnectWebSocket();
  }, [websocketUrl]);
  
  // Enumerate audio devices
  useEffect(() => {
    enumerateAudioDevices();
  }, []);
  
  const connectWebSocket = useCallback(() => {
    try {
      if (websocketRef.current?.readyState === WebSocket.OPEN) return;
      
      websocketRef.current = new WebSocket(websocketUrl);
      
      websocketRef.current.onopen = () => {
        setIsConnected(true);
        console.log('✅ Audio controller connected to WebSocket');
        
        // Send initial audio configuration
        sendAudioConfig();
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
        setIsConnected(false);
        console.log('🔌 Audio controller WebSocket closed');
        
        // Attempt reconnection
        setTimeout(connectWebSocket, 5000);
      };
      
      websocketRef.current.onerror = (error) => {
        console.error('Audio controller WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Failed to connect audio controller WebSocket:', error);
    }
  }, [websocketUrl]);
  
  const disconnectWebSocket = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setIsConnected(false);
  }, []);
  
  const sendWebSocketMessage = useCallback((message) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    }
  }, []);
  
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'audio_metrics':
        setAudioMetrics(data.data);
        break;
        
      case 'audio_config_response':
        // Handle audio configuration response
        break;
        
      default:
        console.log('Unknown audio message type:', data.type);
    }
  }, []);
  
  const sendAudioConfig = useCallback(() => {
    const config = {
      enabled: audioEnabled,
      masterVolume,
      threatVolumes,
      selectedDevice,
      spatialMapping: SPATIAL_ZONES.reduce((acc, zone) => {
        acc[zone.id] = zone.position;
        return acc;
      }, {})
    };
    
    sendWebSocketMessage({
      type: 'update_audio_config',
      config
    });
    
    if (onConfigUpdate) {
      onConfigUpdate(config);
    }
  }, [audioEnabled, masterVolume, threatVolumes, selectedDevice, sendWebSocketMessage, onConfigUpdate]);
  
  // Send config updates when values change
  useEffect(() => {
    if (isConnected) {
      sendAudioConfig();
    }
  }, [audioEnabled, masterVolume, threatVolumes, selectedDevice, isConnected, sendAudioConfig]);
  
  const enumerateAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
      
      setAudioDevices([
        { deviceId: 'default', label: 'Default Audio Device' },
        ...audioOutputs.map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Audio Device ${device.deviceId.slice(0, 8)}`
        }))
      ]);
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error);
    }
  };
  
  // Volume control handlers
  const handleMasterVolumeChange = useCallback((newVolume) => {
    setMasterVolume(newVolume);
    
    if (onVolumeChange) {
      onVolumeChange('master', newVolume);
    }
  }, [onVolumeChange]);
  
  const handleThreatVolumeChange = useCallback((threatLevel, newVolume) => {
    setThreatVolumes(prev => ({
      ...prev,
      [threatLevel]: newVolume
    }));
    
    if (onVolumeChange) {
      onVolumeChange(threatLevel, newVolume);
    }
  }, [onVolumeChange]);
  
  // Test tone functions
  const playTestTone = useCallback(async (threatLevel, zoneId = null) => {
    const frequency = TEST_TONES[threatLevel] || 440;
    const volume = masterVolume * (threatVolumes[threatLevel] || 0.5);
    
    if (zoneId) {
      setPlayingZones(prev => new Set([...prev, zoneId]));
      
      // Clear playing state after tone duration
      setTimeout(() => {
        setPlayingZones(prev => {
          const newSet = new Set(prev);
          newSet.delete(zoneId);
          return newSet;
        });
      }, 1000);
    }
    
    await audioEngineRef.current.playTestTone(frequency, 1000, volume);
    
    // Send test tone command to backend
    sendWebSocketMessage({
      type: 'play_test_tone',
      threatLevel,
      zoneId,
      frequency,
      volume
    });
  }, [masterVolume, threatVolumes, sendWebSocketMessage]);
  
  const testSpatialZone = useCallback((zoneId) => {
    setSelectedZone(zoneId);
    playTestTone('MEDIUM', zoneId);
    
    // Clear selection after a moment
    setTimeout(() => setSelectedZone(null), 2000);
  }, [playTestTone]);
  
  const stopAllTestTones = useCallback(() => {
    audioEngineRef.current.stopAllTones();
    setPlayingZones(new Set());
    setSelectedZone(null);
    
    sendWebSocketMessage({
      type: 'stop_all_test_tones'
    });
  }, [sendWebSocketMessage]);
  
  // Volume slider component
  const VolumeSlider = React.memo(({ label, value, onChange, color = '#00ff88' }) => {
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef(null);
    
    const handleMouseDown = useCallback((e) => {
      setIsDragging(true);
      handleMouseMove(e);
    }, []);
    
    const handleMouseMove = useCallback((e) => {
      if (!sliderRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      
      onChange(percentage);
    }, [onChange]);
    
    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);
    
    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp]);
    
    return (
      <div className="volume-row">
        <div className="volume-label">{label}</div>
        <div 
          className="volume-slider" 
          ref={sliderRef}
          onMouseDown={handleMouseDown}
        >
          <div 
            className="volume-fill" 
            style={{ 
              width: `${value * 100}%`,
              background: `linear-gradient(90deg, ${color}, ${color}dd)`
            }}
          />
          <div 
            className="volume-handle" 
            style={{ 
              left: `${value * 100}%`,
              background: color
            }}
          />
        </div>
        <div className="volume-value">{Math.round(value * 100)}%</div>
      </div>
    );
  });
  
  return (
    <ControllerContainer className={className} style={style} {...props}>
      {/* Audio System Status */}
      <div className="section">
        <div className="section-title">Audio System</div>
        
        <StatusIndicator status={isConnected ? 'connected' : 'disconnected'}>
          <div className="status-dot" />
          <div className="status-text">
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </StatusIndicator>
        
        <div style={{ marginTop: '12px' }}>
          <ControlButton 
            active={audioEnabled}
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? '🔊 Enabled' : '🔇 Disabled'}
          </ControlButton>
          
          <ControlButton onClick={stopAllTestTones}>
            🛑 Stop All
          </ControlButton>
        </div>
      </div>
      
      {/* Volume Controls */}
      <div className="section">
        <div className="section-title">Volume Controls</div>
        
        <VolumeControl>
          <VolumeSlider
            label="Master"
            value={masterVolume}
            onChange={handleMasterVolumeChange}
            color="#00ff88"
          />
          
          <VolumeSlider
            label="Critical"
            value={threatVolumes.CRITICAL}
            onChange={(v) => handleThreatVolumeChange('CRITICAL', v)}
            color="#ff0000"
          />
          
          <VolumeSlider
            label="High"
            value={threatVolumes.HIGH}
            onChange={(v) => handleThreatVolumeChange('HIGH', v)}
            color="#ff8500"
          />
          
          <VolumeSlider
            label="Medium"
            value={threatVolumes.MEDIUM}
            onChange={(v) => handleThreatVolumeChange('MEDIUM', v)}
            color="#ffff00"
          />
          
          <VolumeSlider
            label="Low"
            value={threatVolumes.LOW}
            onChange={(v) => handleThreatVolumeChange('LOW', v)}
            color="#00ffff"
          />
        </VolumeControl>
        
        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap' }}>
          {Object.keys(TEST_TONES).map(level => (
            <ControlButton
              key={level}
              onClick={() => playTestTone(level)}
              style={{ fontSize: '10px' }}
            >
              Test {level}
            </ControlButton>
          ))}
        </div>
      </div>
      
      {/* Spatial Zone Mapping */}
      <div className="section">
        <div className="section-title">Spatial Zones</div>
        
        <SpatialZoneMapping>
          <div className="zone-grid">
            {SPATIAL_ZONES.map(zone => (
              <div
                key={zone.id}
                className={`zone-cell ${selectedZone === zone.id ? 'active' : ''} ${playingZones.has(zone.id) ? 'playing' : ''}`}
                onClick={() => testSpatialZone(zone.id)}
                title={`Test zone ${zone.label}`}
              >
                <div className="zone-label">{zone.label}</div>
              </div>
            ))}
          </div>
          
          <div style={{ fontSize: '10px', color: '#888', textAlign: 'center' }}>
            Click zones to test spatial audio positioning
          </div>
        </SpatialZoneMapping>
      </div>
      
      {/* Audio Device Selection */}
      <div className="section">
        <div className="section-title">Audio Device</div>
        
        <AudioDeviceSelector>
          <select
            className="device-select"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            {audioDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </AudioDeviceSelector>
      </div>
      
      {/* Audio Metrics */}
      <div className="section">
        <div className="section-title">Audio Metrics</div>
        
        <AudioMetrics>
          <div className="metric-row">
            <span className="metric-label">Active Alerts:</span>
            <span className="metric-value">{audioMetrics.activeAlerts}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Alerts Played:</span>
            <span className="metric-value">{audioMetrics.alertsPlayed}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Avg Process Time:</span>
            <span className="metric-value">{audioMetrics.avgProcessingTime.toFixed(2)}ms</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Buffer Issues:</span>
            <span className="metric-value">{audioMetrics.bufferUnderruns}</span>
          </div>
        </AudioMetrics>
      </div>
    </ControllerContainer>
  );
};

export default AudioAlertController;

// Export utility functions
export { AudioTestEngine, TEST_TONES, SPATIAL_ZONES };
