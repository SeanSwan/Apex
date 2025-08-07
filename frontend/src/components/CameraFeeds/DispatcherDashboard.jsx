/**
 * APEX AI DISPATCHER DASHBOARD
 * ============================
 * Professional security dispatcher interface with live camera feeds
 * 
 * Features:
 * - Live DVR/IP camera integration
 * - Real-time alert overlays on actual video feeds
 * - Professional dispatcher controls
 * - Camera management and configuration
 * - Alert coordination with spatial audio and voice response
 */

import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import CameraGrid, { GRID_LAYOUTS } from './CameraGrid'
import AlertManager from '../VisualAlerts/AlertManager'
import AudioAlertController from '../VisualAlerts/AudioAlertController'
import VoiceResponsePanel from '../VisualAlerts/VoiceResponsePanel'
import { useSocket } from '../../hooks/useSocket'

// Default camera configurations (examples for common DVR types)
const DEFAULT_CAMERAS = [
  {
    id: 'CAM-01',
    name: 'Front Entrance',
    streamUrl: 'http://192.168.1.100:8080/video',
    streamType: 'http',
    position: { x: 50, y: 50 },
    enabled: true
  },
  {
    id: 'CAM-02', 
    name: 'Parking Lot',
    streamUrl: 'http://192.168.1.101:8080/video',
    streamType: 'mjpeg',
    position: { x: 400, y: 50 },
    enabled: true
  },
  {
    id: 'CAM-03',
    name: 'Lobby Area',
    streamUrl: 'http://192.168.1.102:8080/video',
    streamType: 'http',
    position: { x: 800, y: 50 },
    enabled: true
  },
  {
    id: 'CAM-04',
    name: 'Rear Exit',
    streamUrl: 'http://192.168.1.103:8080/video',
    streamType: 'http',
    position: { x: 1200, y: 50 },
    enabled: true
  }
]

// Styled components
const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #FFFFFF;
  overflow: hidden;
`

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.8);
  border-bottom: 1px solid rgba(0, 255, 136, 0.3);
  
  .title {
    display: flex;
    align-items: center;
    gap: 12px;
    
    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #00FF88;
    }
    
    .subtitle {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }
  }
  
  .controls {
    display: flex;
    gap: 12px;
    align-items: center;
  }
`

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: ${props => {
    switch(props.$status) {
      case 'online': return 'rgba(0, 255, 136, 0.2)'
      case 'alert': return 'rgba(255, 68, 68, 0.2)'
      case 'warning': return 'rgba(255, 140, 0, 0.2)'
      default: return 'rgba(255, 255, 255, 0.1)'
    }
  }};
  border: 1px solid ${props => {
    switch(props.$status) {
      case 'online': return '#00FF88'
      case 'alert': return '#FF4444'
      case 'warning': return '#FF8C00'
      default: return 'rgba(255, 255, 255, 0.2)'
    }
  }};
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const MainContent = styled.div`
  display: flex;
  flex: 1;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
`

const CameraSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
`

const SectionHeader = styled.div`
  padding: 12px 16px;
  background: rgba(0, 255, 136, 0.1);
  border-bottom: 1px solid rgba(0, 255, 136, 0.2);
  
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #00FF88;
  }
  
  .info {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
  }
`

const CameraContent = styled.div`
  flex: 1;
  padding: 8px;
  overflow: hidden;
`

const ControlPanel = styled.div`
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 136, 0.6);
    border-radius: 2px;
  }
`

const ConfigButton = styled.button`
  padding: 8px 16px;
  background: rgba(0, 255, 136, 0.2);
  border: 1px solid #00FF88;
  border-radius: 6px;
  color: #00FF88;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 255, 136, 0.3);
  }
`

const QuickActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

const ActionButton = styled.button`
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.4);
  }
`

// Main DispatcherDashboard component
const DispatcherDashboard = () => {
  const socket = useSocket()
  
  // State management
  const [cameras, setCameras] = useState(DEFAULT_CAMERAS)
  const [alerts, setAlerts] = useState([])
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [systemStatus, setSystemStatus] = useState('online')
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [gridLayout, setGridLayout] = useState(GRID_LAYOUTS.QUAD)
  
  // Socket event handlers
  useEffect(() => {
    if (!socket) return
    
    const handleThreatAlert = (alertData) => {
      // Create alert that will overlay on the appropriate camera
      const newAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        zoneId: alertData.zone_id,
        threatLevel: alertData.threat_level,
        threatType: alertData.threat_type,
        confidence: alertData.confidence,
        timestamp: Date.now(),
        intensity: alertData.threat_level === 'WEAPON' ? 2 : 1
      }
      
      setAlerts(prev => [...prev, newAlert])
      
      // Auto-remove after timeout
      setTimeout(() => {
        setAlerts(prev => prev.filter(alert => alert.id !== newAlert.id))
      }, 15000)
      
      console.log('🚨 Real-time alert received:', newAlert)
    }
    
    socket.on('threat_alert', handleThreatAlert)
    socket.on('visual_alert', handleThreatAlert)
    
    return () => {
      socket.off('threat_alert', handleThreatAlert)
      socket.off('visual_alert', handleThreatAlert)
    }
  }, [socket])
  
  // Handle camera selection
  const handleCameraSelect = useCallback((camera) => {
    setSelectedCamera(camera)
    console.log('📹 Camera selected:', camera)
  }, [])
  
  // Handle layout change
  const handleLayoutChange = useCallback((layout) => {
    setGridLayout(layout)
    console.log('🔲 Layout changed:', layout.name)
  }, [])
  
  // Add new camera
  const addCamera = useCallback(() => {
    const newCamera = {
      id: `CAM-${String(cameras.length + 1).padStart(2, '0')}`,
      name: `Camera ${cameras.length + 1}`,
      streamUrl: 'http://192.168.1.104:8080/video',
      streamType: 'http',
      position: { x: 100, y: 100 },
      enabled: true
    }
    
    setCameras(prev => [...prev, newCamera])
  }, [cameras.length])
  
  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([])
  }, [])
  
  // Test alert
  const triggerTestAlert = useCallback(() => {
    const testAlert = {
      id: `test_alert_${Date.now()}`,
      zoneId: 'CAM-01',
      threatLevel: 'HIGH',
      threatType: 'Test Alert',
      confidence: 85,
      timestamp: Date.now(),
      intensity: 1.5
    }
    
    setAlerts(prev => [...prev, testAlert])
    
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== testAlert.id))
    }, 10000)
  }, [])
  
  // Calculate system status
  const activeAlerts = alerts.length
  const currentStatus = activeAlerts > 0 ? 'alert' : 'online'
  
  return (
    <DashboardContainer>
      {/* Dashboard Header */}
      <DashboardHeader>
        <div className="title">
          <h1>🏢 APEX AI Security Dispatcher</h1>
          <div className="subtitle">
            Real-time camera monitoring with AI threat detection
          </div>
        </div>
        
        <div className="controls">
          <StatusBadge $status={currentStatus}>
            {currentStatus === 'online' ? '✓' : '🚨'} 
            {currentStatus === 'online' ? 'System Online' : `${activeAlerts} Active Alert${activeAlerts !== 1 ? 's' : ''}`}
          </StatusBadge>
          
          <QuickActions>
            <ActionButton onClick={triggerTestAlert}>
              🧪 Test Alert
            </ActionButton>
            <ActionButton onClick={clearAllAlerts}>
              🧹 Clear Alerts
            </ActionButton>
            <ActionButton onClick={addCamera}>
              ➕ Add Camera
            </ActionButton>
          </QuickActions>
        </div>
      </DashboardHeader>
      
      {/* Main Content */}
      <MainContent>
        {/* Camera Section */}
        <CameraSection>
          <SectionHeader>
            <h3>📹 Live Camera Feeds</h3>
            <div className="info">
              {cameras.length} camera{cameras.length !== 1 ? 's' : ''} configured | {gridLayout.name} layout
            </div>
          </SectionHeader>
          
          <CameraContent>
            <CameraGrid
              cameras={cameras}
              layout={gridLayout}
              alerts={alerts}
              onCameraSelect={handleCameraSelect}
              onLayoutChange={handleLayoutChange}
              selectedCamera={selectedCamera}
              showControls={true}
            />
          </CameraContent>
        </CameraSection>
        
        {/* Control Panel */}
        <ControlPanel>
          {/* Alert Manager */}
          <AlertManager
            enableAudio={isAudioEnabled}
            enableVisual={true}
            showControlPanel={true}
            maxAlerts={16}
            onAlertInteraction={(alert) => console.log('Alert interaction:', alert)}
          />
          
          {/* Audio Controller */}
          <AudioAlertController
            isEnabled={isAudioEnabled}
            showVisualization={true}
            showControls={true}
            onVolumeChange={(volume) => console.log('Volume changed:', volume)}
            onDeviceChange={(device) => console.log('Audio device changed:', device)}
            onModeChange={(mode) => console.log('Audio mode changed:', mode)}
          />
          
          {/* Voice Response Panel */}
          <VoiceResponsePanel
            isEnabled={isVoiceEnabled}
            showTranscript={true}
            autoSave={true}
            onConversationStart={(data) => console.log('Conversation started:', data)}
            onConversationEnd={(data) => console.log('Conversation ended:', data)}
            onScriptSelect={(script) => console.log('Script selected:', script)}
          />
        </ControlPanel>
      </MainContent>
    </DashboardContainer>
  )
}

export default DispatcherDashboard