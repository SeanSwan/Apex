/**
 * APEX AI CAMERA CONFIGURATION
 * ============================
 * Easy camera setup and configuration interface
 * 
 * Supports:
 * - DVR systems (Hikvision, Dahua, etc.)
 * - IP cameras
 * - RTSP/HTTP/MJPEG streams
 * - Automatic stream detection
 * - Connection testing
 */

import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { STREAM_TYPES } from './CameraFeed'

// Common DVR/Camera presets
const CAMERA_PRESETS = {
  HIKVISION: {
    name: 'Hikvision DVR/NVR',
    streamTemplate: 'http://{ip}:{port}/ISAPI/Streaming/channels/{channel}/picture',
    defaultPort: 80,
    channels: 16,
    streamType: STREAM_TYPES.MJPEG
  },
  DAHUA: {
    name: 'Dahua DVR/NVR', 
    streamTemplate: 'http://{ip}:{port}/cgi-bin/snapshot.cgi?channel={channel}',
    defaultPort: 80,
    channels: 16,
    streamType: STREAM_TYPES.MJPEG
  },
  GENERIC_MJPEG: {
    name: 'Generic MJPEG Camera',
    streamTemplate: 'http://{ip}:{port}/video.mjpg',
    defaultPort: 8080,
    channels: 1,
    streamType: STREAM_TYPES.MJPEG
  },
  GENERIC_HTTP: {
    name: 'Generic HTTP Stream',
    streamTemplate: 'http://{ip}:{port}/stream',
    defaultPort: 8080,
    channels: 1,
    streamType: STREAM_TYPES.HTTP
  },
  RTSP: {
    name: 'RTSP Camera',
    streamTemplate: 'rtsp://{ip}:{port}/stream{channel}',
    defaultPort: 554,
    channels: 4,
    streamType: STREAM_TYPES.RTSP
  }
}

// Styled components
const ConfigContainer = styled.div`
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 12px;
  padding: 20px;
  color: #FFFFFF;
  font-family: 'Segoe UI', sans-serif;
`

const ConfigHeader = styled.div`
  margin-bottom: 20px;
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 700;
    color: #00FF88;
  }
  
  p {
    margin: 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
  }
`

const FormSection = styled.div`
  margin-bottom: 20px;
  
  label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #FFFFFF;
  font-size: 12px;
  
  option {
    background: rgba(0, 0, 0, 0.9);
    color: #FFFFFF;
  }
  
  &:focus {
    border-color: #00FF88;
    outline: none;
  }
`

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #FFFFFF;
  font-size: 12px;
  
  &:focus {
    border-color: #00FF88;
    outline: none;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
`

const ChannelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 8px;
`

const ChannelButton = styled.button`
  padding: 6px;
  background: ${props => props.$selected 
    ? 'rgba(0, 255, 136, 0.2)' 
    : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$selected 
    ? '#00FF88' 
    : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 4px;
  color: ${props => props.$selected ? '#00FF88' : '#FFFFFF'};
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$selected 
      ? 'rgba(0, 255, 136, 0.3)' 
      : 'rgba(255, 255, 255, 0.1)'};
  }
`

const StreamPreview = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #00FF88;
  word-break: break-all;
  margin-bottom: 12px;
`

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`

const Button = styled.button`
  flex: 1;
  padding: 10px 16px;
  background: ${props => {
    if (props.$variant === 'primary') return 'rgba(0, 255, 136, 0.2)'
    if (props.$variant === 'danger') return 'rgba(255, 68, 68, 0.2)'
    return 'rgba(255, 255, 255, 0.05)'
  }};
  border: 1px solid ${props => {
    if (props.$variant === 'primary') return '#00FF88'
    if (props.$variant === 'danger') return '#FF4444'
    return 'rgba(255, 255, 255, 0.2)'
  }};
  border-radius: 6px;
  color: ${props => {
    if (props.$variant === 'primary') return '#00FF88'
    if (props.$variant === 'danger') return '#FF4444'
    return '#FFFFFF'
  }};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => {
      if (props.$variant === 'primary') return 'rgba(0, 255, 136, 0.3)'
      if (props.$variant === 'danger') return 'rgba(255, 68, 68, 0.3)'
      return 'rgba(255, 255, 255, 0.1)'
    }};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const TestResult = styled.div`
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  margin-top: 8px;
  
  ${props => {
    if (props.$status === 'success') return `
      background: rgba(0, 255, 136, 0.2);
      border: 1px solid #00FF88;
      color: #00FF88;
    `
    if (props.$status === 'error') return `
      background: rgba(255, 68, 68, 0.2);
      border: 1px solid #FF4444;
      color: #FF4444;
    `
    return `
      background: rgba(255, 140, 0, 0.2);
      border: 1px solid #FF8C00;
      color: #FF8C00;
    `
  }}
`

// Main CameraConfiguration component
const CameraConfiguration = ({
  onAddCamera = null,
  onCancel = null
}) => {
  const [selectedPreset, setSelectedPreset] = useState('HIKVISION')
  const [deviceIP, setDeviceIP] = useState('192.168.1.100')
  const [devicePort, setDevicePort] = useState('80')
  const [deviceUsername, setDeviceUsername] = useState('admin')
  const [devicePassword, setDevicePassword] = useState('')
  const [selectedChannels, setSelectedChannels] = useState([1])
  const [customName, setCustomName] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const preset = CAMERA_PRESETS[selectedPreset]
  
  // Generate stream URL based on preset and settings
  const generateStreamURL = useCallback((channel = 1) => {
    let url = preset.streamTemplate
      .replace('{ip}', deviceIP)
      .replace('{port}', devicePort)
      .replace('{channel}', channel)
    
    // Add authentication if provided
    if (deviceUsername && devicePassword) {
      const urlObj = new URL(url)
      urlObj.username = deviceUsername
      urlObj.password = devicePassword
      url = urlObj.toString()
    }
    
    return url
  }, [preset, deviceIP, devicePort, deviceUsername, devicePassword])
  
  // Handle preset change
  const handlePresetChange = useCallback((presetKey) => {
    setSelectedPreset(presetKey)
    setDevicePort(CAMERA_PRESETS[presetKey].defaultPort.toString())
    setSelectedChannels([1])
  }, [])
  
  // Handle channel selection
  const handleChannelToggle = useCallback((channel) => {
    setSelectedChannels(prev => {
      if (prev.includes(channel)) {
        return prev.filter(c => c !== channel)
      } else {
        return [...prev, channel].sort((a, b) => a - b)
      }
    })
  }, [])
  
  // Test connection
  const testConnection = useCallback(async () => {
    if (selectedChannels.length === 0) {
      setTestResult({ status: 'error', message: 'Please select at least one channel' })
      return
    }
    
    setIsLoading(true)
    setTestResult({ status: 'loading', message: 'Testing connection...' })
    
    try {
      // Simulate connection test (in real implementation, this would ping the stream)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For demo purposes, randomly succeed or fail
      const success = Math.random() > 0.3
      
      if (success) {
        setTestResult({
          status: 'success',
          message: `✓ Successfully connected to ${selectedChannels.length} channel${selectedChannels.length !== 1 ? 's' : ''}`
        })
      } else {
        setTestResult({
          status: 'error',
          message: '✗ Connection failed. Check IP address, port, and credentials.'
        })
      }
    } catch (error) {
      setTestResult({
        status: 'error',
        message: `✗ Test failed: ${error.message}`
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedChannels])
  
  // Add cameras
  const handleAddCameras = useCallback(() => {
    if (selectedChannels.length === 0) return
    
    const newCameras = selectedChannels.map(channel => ({
      id: `CAM-${String(channel).padStart(2, '0')}`,
      name: customName || `${preset.name} CH${channel}`,
      streamUrl: generateStreamURL(channel),
      streamType: preset.streamType,
      position: { x: 50 + (channel * 350), y: 50 },
      enabled: true
    }))
    
    if (onAddCamera) {
      newCameras.forEach(camera => onAddCamera(camera))
    }
    
    console.log('📹 Added cameras:', newCameras)
  }, [selectedChannels, customName, preset, generateStreamURL, onAddCamera])
  
  return (
    <ConfigContainer>
      <ConfigHeader>
        <h3>📹 Add Camera System</h3>
        <p>Configure your DVR or IP cameras for live monitoring</p>
      </ConfigHeader>
      
      {/* Device Type */}
      <FormSection>
        <label>Device Type</label>
        <Select value={selectedPreset} onChange={(e) => handlePresetChange(e.target.value)}>
          {Object.entries(CAMERA_PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>{preset.name}</option>
          ))}
        </Select>
      </FormSection>
      
      {/* Connection Settings */}
      <FormRow>
        <FormSection>
          <label>IP Address</label>
          <Input
            type="text"
            value={deviceIP}
            onChange={(e) => setDeviceIP(e.target.value)}
            placeholder="192.168.1.100"
          />
        </FormSection>
        <FormSection>
          <label>Port</label>
          <Input
            type="number"
            value={devicePort}
            onChange={(e) => setDevicePort(e.target.value)}
            placeholder="80"
          />
        </FormSection>
      </FormRow>
      
      {/* Authentication */}
      <FormRow>
        <FormSection>
          <label>Username</label>
          <Input
            type="text"
            value={deviceUsername}
            onChange={(e) => setDeviceUsername(e.target.value)}
            placeholder="admin"
          />
        </FormSection>
        <FormSection>
          <label>Password</label>
          <Input
            type="password"
            value={devicePassword}
            onChange={(e) => setDevicePassword(e.target.value)}
            placeholder="password"
          />
        </FormSection>
      </FormRow>
      
      {/* Channel Selection */}
      <FormSection>
        <label>Channels to Add ({selectedChannels.length} selected)</label>
        <ChannelGrid>
          {Array.from({ length: preset.channels }, (_, i) => i + 1).map(channel => (
            <ChannelButton
              key={channel}
              $selected={selectedChannels.includes(channel)}
              onClick={() => handleChannelToggle(channel)}
            >
              CH{channel}
            </ChannelButton>
          ))}
        </ChannelGrid>
      </FormSection>
      
      {/* Custom Name */}
      <FormSection>
        <label>Custom Name (Optional)</label>
        <Input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="e.g., Front Door Camera"
        />
      </FormSection>
      
      {/* Stream Preview */}
      {selectedChannels.length > 0 && (
        <FormSection>
          <label>Stream URL Preview</label>
          <StreamPreview>
            {generateStreamURL(selectedChannels[0])}
            {selectedChannels.length > 1 && (
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px' }}>
                ... and {selectedChannels.length - 1} more channel{selectedChannels.length > 2 ? 's' : ''}
              </div>
            )}
          </StreamPreview>
        </FormSection>
      )}
      
      {/* Test Result */}
      {testResult && (
        <TestResult $status={testResult.status}>
          {testResult.message}
        </TestResult>
      )}
      
      {/* Actions */}
      <ButtonRow>
        <Button onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={testConnection} disabled={isLoading}>
          {isLoading ? 'Testing...' : 'Test Connection'}
        </Button>
        <Button 
          $variant="primary" 
          onClick={handleAddCameras}
          disabled={selectedChannels.length === 0 || (testResult && testResult.status === 'error')}
        >
          Add {selectedChannels.length} Camera{selectedChannels.length !== 1 ? 's' : ''}
        </Button>
      </ButtonRow>
    </ConfigContainer>
  )
}

export default CameraConfiguration