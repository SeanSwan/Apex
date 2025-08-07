/**
 * APEX AI ALERT MANAGER - TIER 2 MASTER COORDINATOR
 * ================================================
 * Professional alert coordination system for visual and audio alerts
 * 
 * Features:
 * - Manages multiple simultaneous visual alerts across monitors
 * - Coordinates with spatial audio system
 * - Real-time threat prioritization and alert escalation
 * - Multi-zone alert tracking and positioning
 * - Professional dispatcher interface integration
 * - Performance-optimized for real-time operation
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import styled from 'styled-components'
import { useSocket } from '../../hooks/useSocket'
import BlinkingBorderOverlay, { ThreatLevels, THREAT_COLORS } from './BlinkingBorderOverlay'

// Alert management configurations
const ALERT_CONFIG = {
  MAX_SIMULTANEOUS_ALERTS: 16,
  ALERT_TIMEOUT: {
    SAFE: 5000,
    LOW: 10000,
    MEDIUM: 15000,
    HIGH: 30000,
    CRITICAL: 60000,
    WEAPON: 120000
  },
  PRIORITY_WEIGHTS: {
    SAFE: 1,
    LOW: 2,
    MEDIUM: 4,
    HIGH: 8,
    CRITICAL: 16,
    WEAPON: 32
  },
  AUDIO_COORDINATION: {
    SAFE: { volume: 0.3, spatial: false },
    LOW: { volume: 0.5, spatial: true },
    MEDIUM: { volume: 0.7, spatial: true },
    HIGH: { volume: 0.85, spatial: true },
    CRITICAL: { volume: 0.95, spatial: true },
    WEAPON: { volume: 1.0, spatial: true }
  }
}

// Alert statistics tracking
const ALERT_STATS_INITIAL = {
  totalAlerts: 0,
  activeAlerts: 0,
  alertsByLevel: {
    SAFE: 0,
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
    WEAPON: 0
  },
  alertsByZone: {},
  averageConfidence: 0,
  lastAlertTime: null,
  alertFrequency: 0
}

// Styled components for professional interface
const AlertManagerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 8888;
  
  will-change: auto;
  transform: translateZ(0);
`

const AlertControlPanel = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 12px;
  
  padding: 16px;
  min-width: 280px;
  
  pointer-events: auto;
  z-index: 9998;
  
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #FFFFFF;
  
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 4px 16px rgba(0, 255, 136, 0.1);
  
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${props => props.$isCollapsed && `
    transform: translateX(calc(100% - 60px));
    
    &:hover {
      transform: translateX(0);
    }
  `}
`

const AlertStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
  
  font-size: 11px;
  font-weight: 600;
`

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border-left: 3px solid ${props => props.$color || '#00FF88'};
`

const ActiveAlertsList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  
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
    
    &:hover {
      background: rgba(0, 255, 136, 0.8);
    }
  }
`

const AlertItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  font-size: 10px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &:last-child {
    border-bottom: none;
  }
`

const AlertLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  
  .zone {
    font-family: 'Courier New', monospace;
    font-weight: bold;
    color: ${props => props.$color || '#00FF88'};
  }
  
  .threat {
    font-weight: 600;
    text-transform: uppercase;
  }
`

const AlertTimer = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.7);
`

const ToggleButton = styled.button`
  position: absolute;
  left: -40px;
  top: 16px;
  
  width: 32px;
  height: 32px;
  
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 8px;
  
  color: #00FF88;
  font-size: 14px;
  
  cursor: pointer;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(0, 255, 136, 0.1);
    border-color: rgba(0, 255, 136, 0.6);
  }
  
  transition: all 0.2s ease;
`

// Main AlertManager component
const AlertManager = ({
  enableAudio = true,
  enableVisual = true,
  showControlPanel = true,
  maxAlerts = ALERT_CONFIG.MAX_SIMULTANEOUS_ALERTS,
  onAlertInteraction = null,
  monitorConfiguration = null
}) => {
  const socket = useSocket()
  
  // State management
  const [activeAlerts, setActiveAlerts] = useState(new Map())
  const [alertStats, setAlertStats] = useState(ALERT_STATS_INITIAL)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [audioContext, setAudioContext] = useState(null)
  
  // Refs for performance optimization
  const alertTimeouts = useRef(new Map())
  const alertPriorityQueue = useRef([])
  const lastStatsUpdate = useRef(Date.now())
  
  // Audio system initialization
  useEffect(() => {
    if (enableAudio && !audioContext) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        setAudioContext(ctx)
      } catch (error) {
        console.warn('🔇 Audio context initialization failed:', error)
      }
    }
  }, [enableAudio, audioContext])
  
  // Socket event handlers for real-time alerts
  useEffect(() => {
    if (!socket || !enableVisual) return
    
    const handleVisualAlert = (alertData) => {
      createVisualAlert(alertData)
    }
    
    const handleAudioAlert = (alertData) => {
      if (enableAudio) {
        playAudioAlert(alertData)
      }
    }
    
    const handleThreatAlert = (alertData) => {
      createVisualAlert(alertData)
      if (enableAudio) {
        playAudioAlert(alertData)
      }
    }
    
    const handleClearAlerts = (data) => {
      if (data.zoneId) {
        clearZoneAlerts(data.zoneId)
      } else {
        clearAllAlerts()
      }
    }
    
    // Register socket listeners
    socket.on('visual_alert', handleVisualAlert)
    socket.on('audio_alert', handleAudioAlert)
    socket.on('threat_alert', handleThreatAlert)
    socket.on('clear_visual_alerts', handleClearAlerts)
    
    return () => {
      socket.off('visual_alert', handleVisualAlert)
      socket.off('audio_alert', handleAudioAlert)
      socket.off('threat_alert', handleThreatAlert)
      socket.off('clear_visual_alerts', handleClearAlerts)
    }
  }, [socket, enableVisual, enableAudio])
  
  // Create new visual alert
  const createVisualAlert = useCallback((alertData) => {
    const {
      alert_id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      zone_id = 'UNKNOWN',
      threat_type = 'UNKNOWN',
      threat_level = 'LOW',
      confidence = 75,
      position = { x: 100, y: 100, width: 320, height: 240 },
      timestamp = Date.now(),
      custom_label = null,
      monitor_id = 0
    } = alertData
    
    // Validate threat level
    const validThreatLevel = ThreatLevels[threat_level] || ThreatLevels.LOW
    
    // Check if we're at max alerts - remove lowest priority if needed
    if (activeAlerts.size >= maxAlerts) {
      removeLowestPriorityAlert()
    }
    
    // Create alert object
    const newAlert = {
      id: alert_id,
      zoneId: zone_id,
      threatType: threat_type,
      threatLevel: validThreatLevel,
      confidence: Math.min(100, Math.max(0, confidence)),
      position,
      timestamp,
      customLabel: custom_label,
      monitorId: monitor_id,
      intensity: calculateIntensity(validThreatLevel, confidence),
      createdAt: Date.now()
    }
    
    // Add to active alerts
    setActiveAlerts(prev => new Map(prev.set(alert_id, newAlert)))
    
    // Set automatic removal timeout
    const timeout = ALERT_CONFIG.ALERT_TIMEOUT[validThreatLevel] || 10000
    const timeoutId = setTimeout(() => {
      removeAlert(alert_id)
    }, timeout)
    
    alertTimeouts.current.set(alert_id, timeoutId)
    
    // Update statistics
    updateAlertStats(newAlert, 'add')
    
    console.log(`🚨 Visual alert created: ${zone_id} - ${validThreatLevel} (${confidence}%)`)
  }, [activeAlerts.size, maxAlerts])
  
  // Remove specific alert
  const removeAlert = useCallback((alertId) => {
    setActiveAlerts(prev => {
      const newMap = new Map(prev)
      const alert = newMap.get(alertId)
      if (alert) {
        updateAlertStats(alert, 'remove')
        newMap.delete(alertId)
      }
      return newMap
    })
    
    // Clear timeout
    const timeoutId = alertTimeouts.current.get(alertId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      alertTimeouts.current.delete(alertId)
    }
  }, [])
  
  // Remove lowest priority alert when at max capacity
  const removeLowestPriorityAlert = useCallback(() => {
    let lowestPriority = Infinity
    let lowestAlertId = null
    
    activeAlerts.forEach((alert, id) => {
      const priority = ALERT_CONFIG.PRIORITY_WEIGHTS[alert.threatLevel] || 1
      if (priority < lowestPriority) {
        lowestPriority = priority
        lowestAlertId = id
      }
    })
    
    if (lowestAlertId) {
      removeAlert(lowestAlertId)
    }
  }, [activeAlerts, removeAlert])
  
  // Clear alerts for specific zone
  const clearZoneAlerts = useCallback((zoneId) => {
    activeAlerts.forEach((alert, id) => {
      if (alert.zoneId === zoneId) {
        removeAlert(id)
      }
    })
  }, [activeAlerts, removeAlert])
  
  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    alertTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId))
    alertTimeouts.current.clear()
    setActiveAlerts(new Map())
    setAlertStats(ALERT_STATS_INITIAL)
  }, [])
  
  // Calculate alert intensity based on threat level and confidence
  const calculateIntensity = useCallback((threatLevel, confidence) => {
    const baseIntensity = ALERT_CONFIG.PRIORITY_WEIGHTS[threatLevel] / 8
    const confidenceMultiplier = confidence / 100
    return Math.min(2, baseIntensity * confidenceMultiplier)
  }, [])
  
  // Play audio alert (placeholder for spatial audio integration)
  const playAudioAlert = useCallback((alertData) => {
    if (!audioContext || !enableAudio) return
    
    const { threat_level = 'LOW', zone_id = 'UNKNOWN' } = alertData
    const audioConfig = ALERT_CONFIG.AUDIO_COORDINATION[threat_level]
    
    console.log(`🔊 Audio alert: ${zone_id} - ${threat_level} (volume: ${audioConfig.volume})`)
  }, [audioContext, enableAudio])
  
  // Update alert statistics
  const updateAlertStats = useCallback((alert, action) => {
    setAlertStats(prev => {
      const newStats = { ...prev }
      
      if (action === 'add') {
        newStats.totalAlerts += 1
        newStats.activeAlerts += 1
        newStats.alertsByLevel[alert.threatLevel] += 1
        newStats.alertsByZone[alert.zoneId] = (newStats.alertsByZone[alert.zoneId] || 0) + 1
        newStats.lastAlertTime = alert.timestamp
        
        // Calculate average confidence
        const totalConfidence = Array.from(activeAlerts.values())
          .reduce((sum, a) => sum + a.confidence, alert.confidence)
        newStats.averageConfidence = Math.round(totalConfidence / (activeAlerts.size + 1))
        
      } else if (action === 'remove') {
        newStats.activeAlerts = Math.max(0, newStats.activeAlerts - 1)
        
        // Recalculate average confidence
        if (activeAlerts.size > 1) {
          const totalConfidence = Array.from(activeAlerts.values())
            .filter(a => a.id !== alert.id)
            .reduce((sum, a) => sum + a.confidence, 0)
          newStats.averageConfidence = Math.round(totalConfidence / (activeAlerts.size - 1))
        } else {
          newStats.averageConfidence = 0
        }
      }
      
      return newStats
    })
  }, [activeAlerts])
  
  // Handle alert interaction
  const handleAlertClick = useCallback((alertData) => {
    if (onAlertInteraction) {
      onAlertInteraction(alertData)
    }
    
    console.log('🖱️ Alert clicked:', alertData)
  }, [onAlertInteraction])
  
  // Memoized alert arrays for performance
  const alertsArray = useMemo(() => 
    Array.from(activeAlerts.values()).sort((a, b) => 
      ALERT_CONFIG.PRIORITY_WEIGHTS[b.threatLevel] - ALERT_CONFIG.PRIORITY_WEIGHTS[a.threatLevel]
    ),
    [activeAlerts]
  )
  
  // Format time for display
  const formatAlertTime = useCallback((timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h`
  }, [])
  
  return (
    <AlertManagerContainer>
      {/* Visual alert overlays */}
      {enableVisual && alertsArray.map(alert => (
        <BlinkingBorderOverlay
          key={alert.id}
          zoneId={alert.zoneId}
          threatLevel={alert.threatLevel}
          threatType={alert.threatType}
          confidence={alert.confidence}
          position={alert.position}
          intensity={alert.intensity}
          customLabel={alert.customLabel}
          isActive={true}
          showIndicator={true}
          showConfidence={true}
          showZoneId={true}
          onAlertClick={handleAlertClick}
          monitorId={alert.monitorId}
        />
      ))}
      
      {/* Control panel */}
      {showControlPanel && (
        <AlertControlPanel $isCollapsed={isPanelCollapsed}>
          <ToggleButton onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}>
            {isPanelCollapsed ? '▶' : '◀'}
          </ToggleButton>
          
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '14px', 
            fontWeight: '700',
            color: '#00FF88'
          }}>
            🚨 ALERT MANAGER
          </h3>
          
          {/* Statistics */}
          <AlertStats>
            <StatItem $color="#00FF88">
              <span>ACTIVE</span>
              <strong>{alertStats.activeAlerts}</strong>
            </StatItem>
            <StatItem $color="#FFD700">
              <span>TOTAL</span>
              <strong>{alertStats.totalAlerts}</strong>
            </StatItem>
            <StatItem $color="#FF8C00">
              <span>AVG CONF</span>
              <strong>{alertStats.averageConfidence}%</strong>
            </StatItem>
            <StatItem $color="#FF4444">
              <span>ZONES</span>
              <strong>{Object.keys(alertStats.alertsByZone).length}</strong>
            </StatItem>
          </AlertStats>
          
          {/* Active alerts list */}
          {alertsArray.length > 0 && (
            <>
              <h4 style={{ 
                margin: '8px 0 4px 0', 
                fontSize: '11px', 
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                ACTIVE ALERTS
              </h4>
              
              <ActiveAlertsList>
                {alertsArray.map(alert => (
                  <AlertItem key={alert.id}>
                    <AlertLabel $color={THREAT_COLORS[alert.threatLevel]?.primary}>
                      <span className="zone">{alert.zoneId}</span>
                      <span className="threat">{alert.threatLevel}</span>
                      <span>({alert.confidence}%)</span>
                    </AlertLabel>
                    <AlertTimer>
                      {formatAlertTime(alert.createdAt)}
                    </AlertTimer>
                  </AlertItem>
                ))}
              </ActiveAlertsList>
            </>
          )}
          
          {/* Quick actions */}
          <div style={{ 
            marginTop: '12px', 
            display: 'flex', 
            gap: '8px'
          }}>
            <button
              onClick={clearAllAlerts}
              style={{
                flex: 1,
                padding: '6px 12px',
                background: 'rgba(255, 68, 68, 0.2)',
                border: '1px solid #FF4444',
                borderRadius: '6px',
                color: '#FF4444',
                fontSize: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              CLEAR ALL
            </button>
          </div>
        </AlertControlPanel>
      )}
    </AlertManagerContainer>
  )
}

export default AlertManager

export { ALERT_CONFIG, ALERT_STATS_INITIAL }