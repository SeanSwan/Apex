/**
 * APEX AI TIER 2 VISUAL ALERTS DEMO
 * =================================
 * Demonstration component showing integration of all TIER 2 visual alert components
 * This serves as both a demo and integration test for the alert system
 */

import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import {
  AlertManager,
  BlinkingBorderOverlay,
  AudioAlertController,
  VoiceResponsePanel,
  ThreatLevels,
  THREAT_COLORS
} from '../VisualAlerts'

// Demo container
const DemoContainer = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 2px,
        rgba(0, 255, 136, 0.1) 2px,
        rgba(0, 255, 136, 0.1) 4px
      ),
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 255, 136, 0.1) 2px,
        rgba(0, 255, 136, 0.1) 4px
      );
    opacity: 0.3;
    pointer-events: none;
  }
`

const DemoHeader = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #00FF88;
  border-radius: 12px;
  padding: 16px 24px;
  
  text-align: center;
  color: #FFFFFF;
  font-family: 'Segoe UI', sans-serif;
  
  z-index: 10000;
  
  h1 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 700;
    color: #00FF88;
  }
  
  p {
    margin: 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
  }
`

const SimulatedCameraView = styled.div`
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  
  &::before {
    content: '🎥';
    font-size: 24px;
    margin-right: 8px;
  }
`

const DemoControls = styled.div`
  position: fixed;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  
  display: flex;
  gap: 12px;
  
  z-index: 9999;
`

const DemoButton = styled.button`
  padding: 8px 16px;
  background: rgba(0, 255, 136, 0.2);
  border: 1px solid #00FF88;
  border-radius: 8px;
  color: #00FF88;
  
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 255, 136, 0.3);
  }
`

// Main demo component
const Tier2VisualAlertsDemo = () => {
  const [demoAlerts, setDemoAlerts] = useState([])
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  
  // Simulated camera positions
  const cameraPositions = [
    { id: 'CAM-01', x: 50, y: 50, width: 300, height: 200, label: 'FRONT ENTRANCE' },
    { id: 'CAM-02', x: 400, y: 50, width: 300, height: 200, label: 'PARKING LOT' },
    { id: 'CAM-03', x: 800, y: 50, width: 300, height: 200, label: 'LOBBY AREA' },
    { id: 'CAM-04', x: 1200, y: 50, width: 300, height: 200, label: 'REAR EXIT' },
    { id: 'CAM-05', x: 50, y: 350, width: 300, height: 200, label: 'STAIRWELL A' },
    { id: 'CAM-06', x: 400, y: 350, width: 300, height: 200, label: 'ELEVATOR' },
    { id: 'CAM-07', x: 800, y: 350, width: 300, height: 200, label: 'ROOF ACCESS' },
    { id: 'CAM-08', x: 1200, y: 350, width: 300, height: 200, label: 'STORAGE' }
  ]
  
  // Demo threat scenarios
  const threatScenarios = [
    {
      name: 'Weapon Detected',
      threats: [
        {
          zoneId: 'CAM-01',
          threatLevel: 'WEAPON',
          threatType: 'Weapon Detection',
          confidence: 95,
          position: cameraPositions[0]
        }
      ]
    },
    {
      name: 'Multiple Threats',
      threats: [
        {
          zoneId: 'CAM-02',
          threatLevel: 'HIGH',
          threatType: 'Trespassing',
          confidence: 87,
          position: cameraPositions[1]
        },
        {
          zoneId: 'CAM-05',
          threatLevel: 'MEDIUM',
          threatType: 'Package Theft',
          confidence: 72,
          position: cameraPositions[4]
        },
        {
          zoneId: 'CAM-07',
          threatLevel: 'CRITICAL',
          threatType: 'Violence Detected',
          confidence: 91,
          position: cameraPositions[6]
        }
      ]
    },
    {
      name: 'Low Level Alerts',
      threats: [
        {
          zoneId: 'CAM-03',
          threatLevel: 'LOW',
          threatType: 'Loitering',
          confidence: 65,
          position: cameraPositions[2]
        },
        {
          zoneId: 'CAM-06',
          threatLevel: 'SAFE',
          threatType: 'Normal Activity',
          confidence: 45,
          position: cameraPositions[5]
        }
      ]
    }
  ]
  
  // Trigger demo scenario
  const triggerScenario = (scenarioIndex) => {
    const scenario = threatScenarios[scenarioIndex]
    if (!scenario) return
    
    // Clear existing alerts
    setDemoAlerts([])
    
    // Add new alerts with slight delays for effect
    scenario.threats.forEach((threat, index) => {
      setTimeout(() => {
        setDemoAlerts(prev => [...prev, {
          ...threat,
          id: `demo_alert_${Date.now()}_${index}`,
          timestamp: Date.now()
        }])
      }, index * 500)
    })
    
    console.log(`🎭 Demo scenario triggered: ${scenario.name}`)
  }
  
  // Clear all alerts
  const clearAllAlerts = () => {
    setDemoAlerts([])
    console.log('🧹 All demo alerts cleared')
  }
  
  // Auto-clear alerts after timeout
  useEffect(() => {
    demoAlerts.forEach(alert => {
      const timeout = setTimeout(() => {
        setDemoAlerts(prev => prev.filter(a => a.id !== alert.id))
      }, 15000)
      
      return () => clearTimeout(timeout)
    })
  }, [demoAlerts])
  
  // Handle alert interaction
  const handleAlertClick = (alertData) => {
    console.log('🖱️ Alert clicked:', alertData)
  }
  
  return (
    <DemoContainer>
      {/* Demo header */}
      <DemoHeader>
        <h1>🚨 APEX AI TIER 2 VISUAL ALERTS SYSTEM</h1>
        <p>Professional Security Alert Demonstration</p>
      </DemoHeader>
      
      {/* Demo controls */}
      <DemoControls>
        <DemoButton onClick={() => triggerScenario(0)}>
          🔫 Weapon Alert
        </DemoButton>
        <DemoButton onClick={() => triggerScenario(1)}>
          ⚠️ Multiple Threats
        </DemoButton>
        <DemoButton onClick={() => triggerScenario(2)}>
          👁️ Low Level Alerts
        </DemoButton>
        <DemoButton onClick={clearAllAlerts}>
          🧹 Clear All
        </DemoButton>
        <DemoButton onClick={() => setIsAudioEnabled(!isAudioEnabled)}>
          {isAudioEnabled ? '🔊' : '🔇'} Audio
        </DemoButton>
        <DemoButton onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}>
          {isVoiceEnabled ? '🗣️' : '🤐'} Voice
        </DemoButton>
      </DemoControls>
      
      {/* Simulated camera views */}
      {cameraPositions.map(camera => (
        <SimulatedCameraView
          key={camera.id}
          style={{
            left: camera.x,
            top: camera.y,
            width: camera.width,
            height: camera.height
          }}
        >
          {camera.id} - {camera.label}
        </SimulatedCameraView>
      ))}
      
      {/* Alert Manager - coordinates all alerts */}
      <AlertManager
        enableAudio={isAudioEnabled}
        enableVisual={true}
        showControlPanel={true}
        maxAlerts={16}
        onAlertInteraction={handleAlertClick}
      />
      
      {/* Individual alert overlays (managed by AlertManager) */}
      {demoAlerts.map(alert => (
        <BlinkingBorderOverlay
          key={alert.id}
          zoneId={alert.zoneId}
          threatLevel={alert.threatLevel}
          threatType={alert.threatType}
          confidence={alert.confidence}
          position={{
            x: alert.position.x,
            y: alert.position.y,
            width: alert.position.width,
            height: alert.position.height
          }}
          intensity={alert.threatLevel === 'WEAPON' ? 2 : 1}
          showIndicator={true}
          showConfidence={true}
          showZoneId={true}
          isActive={true}
          onAlertClick={handleAlertClick}
        />
      ))}
      
      {/* Audio control system */}
      <AudioAlertController
        isEnabled={isAudioEnabled}
        showVisualization={true}
        showControls={true}
        onVolumeChange={(volume) => console.log('🔊 Volume:', volume)}
        onDeviceChange={(device) => console.log('🎧 Device:', device)}
        onModeChange={(mode) => console.log('🎯 Mode:', mode)}
      />
      
      {/* AI voice conversation panel */}
      <VoiceResponsePanel
        isEnabled={isVoiceEnabled}
        showTranscript={true}
        autoSave={true}
        onConversationStart={(data) => console.log('🗣️ Conversation started:', data)}
        onConversationEnd={(data) => console.log('🛑 Conversation ended:', data)}
        onScriptSelect={(script) => console.log('📜 Script selected:', script)}
      />
    </DemoContainer>
  )
}

export default Tier2VisualAlertsDemo