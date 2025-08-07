/**
 * APEX AI AUDIO ALERT CONTROLLER - TIER 2 SPATIAL AUDIO
 * =====================================================
 * Professional audio control interface for spatial threat alerts
 * 
 * Features:
 * - 3D spatial audio positioning based on threat location
 * - Volume and tone controls for different threat levels
 * - Real-time audio visualization and meters
 * - Professional dispatcher interface
 * - Integration with visual alert system
 * - Hardware audio device management
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { useSocket } from '../../hooks/useSocket'
import { THREAT_COLORS } from './BlinkingBorderOverlay'

// Audio configuration constants
const AUDIO_CONFIG = {
  SAMPLE_RATE: 44100,
  BUFFER_SIZE: 4096,
  MAX_CHANNELS: 8,
  SPATIAL_RANGE: 10,
  TONE_FREQUENCIES: {
    SAFE: [440, 554],
    LOW: [523, 659],
    MEDIUM: [659, 831],
    HIGH: [831, 1047],
    CRITICAL: [1047, 1319],
    WEAPON: [1319, 1661]
  },
  VOLUME_LEVELS: {
    SAFE: 0.3,
    LOW: 0.5,
    MEDIUM: 0.7,
    HIGH: 0.85,
    CRITICAL: 0.95,
    WEAPON: 1.0
  }
}

// Audio visualization animations
const audioWave = keyframes`
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
`

const volumeMeter = keyframes`
  0% { height: 20%; }
  50% { height: 80%; }
  100% { height: 20%; }
`

const spatialPulse = keyframes`
  0%, 100% { 
    transform: scale(1);
    opacity: 0.6;
  }
  50% { 
    transform: scale(1.2);
    opacity: 1;
  }
`

// Styled components
const AudioControlContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 16px;
  
  padding: 20px;
  min-width: 320px;
  max-width: 400px;
  
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #FFFFFF;
  
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.5),
    0 6px 20px rgba(0, 255, 136, 0.1);
  
  z-index: 9997;
  
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${props => props.$isCollapsed && `
    transform: translateY(calc(100% - 60px));
    
    &:hover {
      transform: translateY(0);
    }
  `}
`

const AudioHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  
  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: #00FF88;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`

const StatusIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$active ? '#00FF88' : '#666'};
  animation: ${props => props.$active ? spatialPulse : 'none'} 2s ease-in-out infinite;
`

const VolumeSection = styled.div`
  margin-bottom: 16px;
  
  label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 8px;
  }
`

const VolumeSlider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #00FF88;
    cursor: pointer;
    border: 2px solid rgba(0, 0, 0, 0.8);
    box-shadow: 0 2px 8px rgba(0, 255, 136, 0.4);
  }
  
  &::-webkit-slider-track {
    height: 6px;
    background: linear-gradient(
      90deg,
      rgba(0, 255, 136, 0.3) 0%,
      rgba(0, 255, 136, 0.6) ${props => props.value || 0}%,
      rgba(255, 255, 255, 0.1) ${props => props.value || 0}%
    );
    border-radius: 3px;
  }
`

const SpatialVisualization = styled.div`
  position: relative;
  width: 100%;
  height: 120px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin: 12px 0;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    background: #00FF88;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.6);
  }
  
  &::after {
    content: 'DISPATCHER';
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 8px;
    font-weight: 700;
    color: #00FF88;
    letter-spacing: 0.5px;
  }
`

const SpatialThreat = styled.div`
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$color || '#FF4444'};
  box-shadow: 0 0 15px ${props => props.$color || '#FF4444'};
  
  left: ${props => props.$x || 50}%;
  top: ${props => props.$y || 50}%;
  transform: translate(-50%, -50%);
  
  animation: ${spatialPulse} ${props => props.$pulseSpeed || 2}s ease-in-out infinite;
  
  &::after {
    content: attr(data-label);
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 8px;
    font-weight: 700;
    color: ${props => props.$color || '#FF4444'};
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }
`

const AudioMeter = styled.div`
  display: flex;
  align-items: end;
  gap: 2px;
  height: 40px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  margin: 8px 0;
`

const MeterBar = styled.div`
  width: 4px;
  background: linear-gradient(
    to top,
    #00FF88 0%,
    #FFD700 60%,
    #FF4444 90%
  );
  border-radius: 2px;
  opacity: ${props => props.$active ? 1 : 0.2};
  height: ${props => props.$height || 20}%;
  
  animation: ${props => props.$active ? volumeMeter : 'none'} 
             ${props => props.$speed || 1}s ease-in-out infinite;
  
  transition: all 0.2s ease;
`

const ControlGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 12px 0;
`

const ControlButton = styled.button`
  padding: 8px 12px;
  background: ${props => props.$active 
    ? 'rgba(0, 255, 136, 0.2)' 
    : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$active 
    ? '#00FF88' 
    : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 8px;
  color: ${props => props.$active ? '#00FF88' : '#FFFFFF'};
  
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$active 
      ? 'rgba(0, 255, 136, 0.3)' 
      : 'rgba(255, 255, 255, 0.1)'};
    border-color: ${props => props.$active 
      ? '#00FF88' 
      : 'rgba(255, 255, 255, 0.4)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const DeviceSelector = styled.select`
  width: 100%;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #FFFFFF;
  font-size: 10px;
  
  option {
    background: rgba(0, 0, 0, 0.9);
    color: #FFFFFF;
  }
`

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #00FF88;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #FFFFFF;
  }
`

// Main component
const AudioAlertController = ({
  isEnabled = true,
  showVisualization = true,
  showControls = true,
  onVolumeChange = null,
  onDeviceChange = null,
  onModeChange = null
}) => {
  const socket = useSocket()
  
  // State management
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [masterVolume, setMasterVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [spatialMode, setSpatialMode] = useState(true)
  const [audioDevices, setAudioDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState('')
  const [activeThreats, setActiveThreats] = useState([])
  const [audioMeters, setAudioMeters] = useState(Array(8).fill(0))
  const [isAudioActive, setIsAudioActive] = useState(false)
  
  // Audio context and nodes
  const audioContext = useRef(null)
  const gainNode = useRef(null)
  const spatialPanner = useRef(null)
  
  // Initialize audio system
  useEffect(() => {
    if (isEnabled) {
      initializeAudio()
      enumerateAudioDevices()
    }
    
    return () => {
      if (audioContext.current) {
        audioContext.current.close()
      }
    }
  }, [isEnabled])
  
  // Socket event handlers
  useEffect(() => {
    if (!socket) return
    
    const handleAudioAlert = (data) => {
      playPositionalAlert(data)
    }
    
    const handleAudioStats = (data) => {
      updateAudioVisualization(data)
    }
    
    socket.on('audio_alert', handleAudioAlert)
    socket.on('audio_stats', handleAudioStats)
    
    return () => {
      socket.off('audio_alert', handleAudioAlert)
      socket.off('audio_stats', handleAudioStats)
    }
  }, [socket])
  
  // Initialize Web Audio API
  const initializeAudio = useCallback(async () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioContext.current = ctx
      
      // Create gain node for volume control
      gainNode.current = ctx.createGain()
      gainNode.current.gain.value = masterVolume / 100
      
      // Create spatial panner for 3D audio
      if (ctx.createPanner) {
        spatialPanner.current = ctx.createPanner()
        spatialPanner.current.panningModel = 'HRTF'
        spatialPanner.current.distanceModel = 'exponential'
        spatialPanner.current.refDistance = 1
        spatialPanner.current.maxDistance = AUDIO_CONFIG.SPATIAL_RANGE
      }
      
      console.log('🔊 Audio system initialized successfully')
    } catch (error) {
      console.error('❌ Audio initialization failed:', error)
    }
  }, [masterVolume])
  
  // Get available audio devices
  const enumerateAudioDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput')
      setAudioDevices(audioOutputs)
      
      if (audioOutputs.length > 0 && !selectedDevice) {
        setSelectedDevice(audioOutputs[0].deviceId)
      }
    } catch (error) {
      console.error('❌ Device enumeration failed:', error)
    }
  }, [selectedDevice])
  
  // Play positional audio alert
  const playPositionalAlert = useCallback((alertData) => {
    if (!audioContext.current || isMuted) return
    
    const {
      threat_level = 'LOW',
      zone_position = { x: 0.5, y: 0.5 },
      zone_id = 'UNKNOWN'
    } = alertData
    
    const frequencies = AUDIO_CONFIG.TONE_FREQUENCIES[threat_level] || [440, 554]
    const volume = AUDIO_CONFIG.VOLUME_LEVELS[threat_level] || 0.5
    
    // Create oscillators for dual-tone alert
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.current.createOscillator()
      const envelope = audioContext.current.createGain()
      
      oscillator.frequency.setValueAtTime(freq, audioContext.current.currentTime)
      oscillator.type = 'sine'
      
      // Set spatial position
      if (spatialPanner.current && spatialMode) {
        const x = (zone_position.x - 0.5) * AUDIO_CONFIG.SPATIAL_RANGE
        const y = (zone_position.y - 0.5) * AUDIO_CONFIG.SPATIAL_RANGE
        spatialPanner.current.positionX.setValueAtTime(x, audioContext.current.currentTime)
        spatialPanner.current.positionY.setValueAtTime(y, audioContext.current.currentTime)
        spatialPanner.current.positionZ.setValueAtTime(0, audioContext.current.currentTime)
      }
      
      // Create envelope for smooth attack/decay
      envelope.gain.setValueAtTime(0, audioContext.current.currentTime)
      envelope.gain.linearRampToValueAtTime(volume * (masterVolume / 100), audioContext.current.currentTime + 0.1)
      envelope.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 1.5)
      
      // Connect audio graph
      oscillator.connect(envelope)
      if (spatialPanner.current && spatialMode) {
        envelope.connect(spatialPanner.current)
        spatialPanner.current.connect(gainNode.current)
      } else {
        envelope.connect(gainNode.current)
      }
      gainNode.current.connect(audioContext.current.destination)
      
      // Play the alert
      oscillator.start(audioContext.current.currentTime)
      oscillator.stop(audioContext.current.currentTime + 1.5)
    })
    
    // Update visualization
    setIsAudioActive(true)
    setTimeout(() => setIsAudioActive(false), 1500)
    
    // Add threat to spatial visualization
    const newThreat = {
      id: `threat_${Date.now()}`,
      x: zone_position.x * 100,
      y: zone_position.y * 100,
      color: THREAT_COLORS[threat_level]?.primary || '#FF4444',
      level: threat_level,
      zoneId: zone_id
    }
    
    setActiveThreats(prev => [...prev.slice(-4), newThreat])
    
    console.log(`🔊 Spatial audio alert: ${zone_id} - ${threat_level}`)
  }, [audioContext, spatialPanner, gainNode, spatialMode, masterVolume, isMuted])
  
  // Update audio visualization
  const updateAudioVisualization = useCallback((stats) => {
    const { audio_levels = [], active_channels = 0 } = stats
    setAudioMeters(audio_levels.slice(0, 8))
    setIsAudioActive(active_channels > 0)
  }, [])
  
  // Handle volume change
  const handleVolumeChange = useCallback((value) => {
    setMasterVolume(value)
    if (gainNode.current) {
      gainNode.current.gain.value = value / 100
    }
    if (onVolumeChange) {
      onVolumeChange(value)
    }
  }, [onVolumeChange])
  
  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    setIsMuted(!isMuted)
    if (gainNode.current) {
      gainNode.current.gain.value = isMuted ? masterVolume / 100 : 0
    }
  }, [isMuted, masterVolume])
  
  // Handle spatial mode toggle
  const handleSpatialToggle = useCallback(() => {
    setSpatialMode(!spatialMode)
    if (onModeChange) {
      onModeChange({ spatial: !spatialMode })
    }
  }, [spatialMode, onModeChange])
  
  // Handle device selection
  const handleDeviceChange = useCallback((deviceId) => {
    setSelectedDevice(deviceId)
    if (onDeviceChange) {
      onDeviceChange(deviceId)
    }
  }, [onDeviceChange])
  
  if (!isEnabled) return null
  
  return (
    <AudioControlContainer $isCollapsed={isCollapsed}>
      <AudioHeader>
        <h3>
          🔊 SPATIAL AUDIO
          <StatusIndicator $active={isAudioActive} />
        </h3>
        <ToggleButton onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? '▲' : '▼'}
        </ToggleButton>
      </AudioHeader>
      
      <VolumeSection>
        <label>MASTER VOLUME ({masterVolume}%)</label>
        <VolumeSlider
          type="range"
          min="0"
          max="100"
          value={masterVolume}
          onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
        />
      </VolumeSection>
      
      <AudioMeter>
        {audioMeters.map((level, index) => (
          <MeterBar
            key={index}
            $height={level}
            $active={level > 0}
            $speed={1 + (level / 100)}
          />
        ))}
      </AudioMeter>
      
      {showVisualization && (
        <SpatialVisualization>
          {activeThreats.map(threat => (
            <SpatialThreat
              key={threat.id}
              $x={threat.x}
              $y={threat.y}
              $color={threat.color}
              data-label={threat.zoneId.slice(-2)}
              $pulseSpeed={threat.level === 'WEAPON' ? 0.5 : 1.5}
            />
          ))}
        </SpatialVisualization>
      )}
      
      {showControls && (
        <ControlGrid>
          <ControlButton
            $active={!isMuted}
            onClick={handleMuteToggle}
          >
            {isMuted ? '🔇 MUTED' : '🔊 AUDIO ON'}
          </ControlButton>
          
          <ControlButton
            $active={spatialMode}
            onClick={handleSpatialToggle}
          >
            {spatialMode ? '🎯 3D MODE' : '📻 MONO'}
          </ControlButton>
        </ControlGrid>
      )}
      
      <VolumeSection>
        <label>OUTPUT DEVICE</label>
        <DeviceSelector
          value={selectedDevice}
          onChange={(e) => handleDeviceChange(e.target.value)}
        >
          {audioDevices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Audio Device ${device.deviceId.slice(0, 8)}`}
            </option>
          ))}
        </DeviceSelector>
      </VolumeSection>
    </AudioControlContainer>
  )
}

export default AudioAlertController

export { AUDIO_CONFIG }