/**
 * APEX AI BLINKING BORDER OVERLAY - TIER 2 VISUAL ALERTS
 * =====================================================
 * Professional animated border overlay for threat detection alerts
 * 
 * Features:
 * - Dynamic threat-level specific animations and colors
 * - Real-time confidence indicators and zone identification
 * - Performance-optimized GPU-accelerated animations
 * - Responsive design for multiple monitor configurations
 * - Professional security dispatcher interface styling
 */

import React, { useState, useEffect, useRef, useMemo } from 'react'
import styled, { keyframes, css } from 'styled-components'

// Threat level color configurations
export const THREAT_COLORS = {
  SAFE: {
    primary: '#00FF88',
    secondary: '#00CC6A',
    glow: '0, 255, 136',
    name: 'SAFE'
  },
  LOW: {
    primary: '#FFD700',
    secondary: '#FFC107',
    glow: '255, 215, 0',
    name: 'LOW THREAT'
  },
  MEDIUM: {
    primary: '#FF8C00',
    secondary: '#FF7043',
    glow: '255, 140, 0',
    name: 'MEDIUM THREAT'
  },
  HIGH: {
    primary: '#FF4444',
    secondary: '#FF6B6B',
    glow: '255, 68, 68',
    name: 'HIGH THREAT'
  },
  CRITICAL: {
    primary: '#FF0000',
    secondary: '#FF3333',
    glow: '255, 0, 0',
    name: 'CRITICAL'
  },
  WEAPON: {
    primary: '#CC0000',
    secondary: '#FF0000',
    glow: '204, 0, 0',
    name: 'WEAPON DETECTED'
  }
}

// Animation keyframes for different threat levels
const pulseGlow = keyframes`
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.02);
  }
`

const rapidBlink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
`

const urgentFlash = keyframes`
  0%, 100% { 
    opacity: 1;
    box-shadow: inset 0 0 0 3px var(--primary-color),
                0 0 20px rgba(var(--glow-color), 0.6),
                0 0 40px rgba(var(--glow-color), 0.4);
  }
  25% { 
    opacity: 0.2;
    box-shadow: inset 0 0 0 1px var(--primary-color),
                0 0 5px rgba(var(--glow-color), 0.2);
  }
  75% { 
    opacity: 1;
    box-shadow: inset 0 0 0 5px var(--primary-color),
                0 0 30px rgba(var(--glow-color), 0.8),
                0 0 60px rgba(var(--glow-color), 0.6);
  }
`

const criticalAlert = keyframes`
  0% { 
    opacity: 1;
    transform: scale(1);
    box-shadow: inset 0 0 0 4px var(--primary-color),
                0 0 25px rgba(var(--glow-color), 0.8),
                0 0 50px rgba(var(--glow-color), 0.6);
  }
  20% { 
    opacity: 0.1;
    transform: scale(0.98);
    box-shadow: inset 0 0 0 1px var(--primary-color);
  }
  40% { 
    opacity: 1;
    transform: scale(1.03);
    box-shadow: inset 0 0 0 6px var(--primary-color),
                0 0 40px rgba(var(--glow-color), 1),
                0 0 80px rgba(var(--glow-color), 0.8);
  }
  60% { 
    opacity: 0.2;
    transform: scale(0.99);
    box-shadow: inset 0 0 0 2px var(--primary-color);
  }
  100% { 
    opacity: 1;
    transform: scale(1);
    box-shadow: inset 0 0 0 4px var(--primary-color),
                0 0 25px rgba(var(--glow-color), 0.8),
                0 0 50px rgba(var(--glow-color), 0.6);
  }
`

const weaponDetected = keyframes`
  0%, 100% { 
    opacity: 1;
    transform: scale(1) rotate(0deg);
    box-shadow: inset 0 0 0 5px var(--primary-color),
                inset 0 0 0 8px var(--secondary-color),
                0 0 30px rgba(var(--glow-color), 1),
                0 0 60px rgba(var(--glow-color), 0.8),
                0 0 90px rgba(var(--glow-color), 0.6);
  }
  12.5% { 
    opacity: 0.1;
    transform: scale(0.95) rotate(-0.5deg);
    box-shadow: inset 0 0 0 1px var(--primary-color);
  }
  25% { 
    opacity: 1;
    transform: scale(1.05) rotate(0.5deg);
    box-shadow: inset 0 0 0 7px var(--primary-color),
                inset 0 0 0 10px var(--secondary-color),
                0 0 50px rgba(var(--glow-color), 1),
                0 0 100px rgba(var(--glow-color), 0.9);
  }
  37.5% { 
    opacity: 0.1;
    transform: scale(0.95) rotate(-0.5deg);
  }
  50% { 
    opacity: 1;
    transform: scale(1.02) rotate(0deg);
  }
  62.5% { 
    opacity: 0.1;
    transform: scale(0.98) rotate(0.5deg);
  }
  75% { 
    opacity: 1;
    transform: scale(1.03) rotate(-0.5deg);
  }
  87.5% { 
    opacity: 0.1;
    transform: scale(0.97) rotate(0.5deg);
  }
`

// Animation configurations for each threat level
export const getAnimationConfig = (threatLevel, intensity = 1) => {
  const configs = {
    SAFE: {
      animation: pulseGlow,
      duration: '3s',
      timing: 'ease-in-out',
      iteration: 'infinite'
    },
    LOW: {
      animation: pulseGlow,
      duration: `${2 / intensity}s`,
      timing: 'ease-in-out',
      iteration: 'infinite'
    },
    MEDIUM: {
      animation: rapidBlink,
      duration: `${1.5 / intensity}s`,
      timing: 'ease-in-out',
      iteration: 'infinite'
    },
    HIGH: {
      animation: urgentFlash,
      duration: `${1 / intensity}s`,
      timing: 'cubic-bezier(0.4, 0, 0.6, 1)',
      iteration: 'infinite'
    },
    CRITICAL: {
      animation: criticalAlert,
      duration: `${0.8 / intensity}s`,
      timing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      iteration: 'infinite'
    },
    WEAPON: {
      animation: weaponDetected,
      duration: `${0.6 / intensity}s`,
      timing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      iteration: 'infinite'
    }
  }
  
  return configs[threatLevel] || configs.SAFE
}

// Styled overlay container
const OverlayContainer = styled.div`
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  will-change: transform, opacity;
  
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
  
  left: ${props => props.$left || 0}px;
  top: ${props => props.$top || 0}px;
  width: ${props => props.$width || 320}px;
  height: ${props => props.$height || 240}px;
  
  --primary-color: ${props => THREAT_COLORS[props.$threatLevel]?.primary || THREAT_COLORS.SAFE.primary};
  --secondary-color: ${props => THREAT_COLORS[props.$threatLevel]?.secondary || THREAT_COLORS.SAFE.secondary};
  --glow-color: ${props => THREAT_COLORS[props.$threatLevel]?.glow || THREAT_COLORS.SAFE.glow};
  
  ${props => {
    const config = getAnimationConfig(props.$threatLevel, props.$intensity)
    return css`
      animation: ${config.animation} ${config.duration} ${config.timing} ${config.iteration};
    `
  }}
  
  border: 3px solid var(--primary-color);
  border-radius: 8px;
  
  box-shadow: 
    inset 0 0 0 2px var(--primary-color),
    0 0 20px rgba(var(--glow-color), 0.6),
    0 0 40px rgba(var(--glow-color), 0.4),
    0 0 60px rgba(var(--glow-color), 0.2);
  
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${props => props.$threatLevel === 'WEAPON' && css`
    filter: drop-shadow(0 0 10px rgba(var(--glow-color), 0.8));
  `}
  
  @media (max-width: 1200px) {
    border-width: 2px;
    border-radius: 6px;
  }
`

// Threat level indicator
const ThreatIndicator = styled.div`
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  
  background: linear-gradient(135deg, 
    rgba(var(--glow-color), 0.9) 0%, 
    rgba(var(--glow-color), 0.7) 100%);
  
  color: #FFFFFF;
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid var(--primary-color);
  
  box-shadow: 
    0 2px 8px rgba(var(--glow-color), 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  
  backdrop-filter: blur(4px);
  
  animation: ${pulseGlow} 2s ease-in-out infinite;
  
  z-index: 10000;
  pointer-events: none;
  
  @media (max-width: 1200px) {
    font-size: 10px;
    padding: 3px 10px;
    top: -30px;
  }
`

// Confidence meter
const ConfidenceMeter = styled.div`
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  
  display: flex;
  align-items: center;
  gap: 6px;
  
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(var(--glow-color), 0.3);
  
  font-family: 'Segoe UI', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: #FFFFFF;
  
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
`

const ConfidenceBar = styled.div`
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    width: ${props => props.$confidence || 0}%;
    height: 100%;
    background: linear-gradient(90deg, 
      var(--primary-color) 0%, 
      var(--secondary-color) 100%);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
`

// Zone identifier
const ZoneIdentifier = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  
  background: rgba(0, 0, 0, 0.9);
  color: var(--primary-color);
  
  font-family: 'Courier New', monospace;
  font-size: 9px;
  font-weight: bold;
  
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--primary-color);
  
  text-shadow: 0 0 4px rgba(var(--glow-color), 0.6);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
`

// Main component
const BlinkingBorderOverlay = ({
  zoneId = 'CAM-01',
  threatLevel = 'SAFE',
  threatType = 'None',
  confidence = 85,
  position = { x: 100, y: 100, width: 320, height: 240 },
  intensity = 1,
  showIndicator = true,
  showConfidence = true,
  showZoneId = true,
  customLabel = null,
  isActive = true,
  onAlertClick = null,
  monitorId = 0
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const overlayRef = useRef(null)
  
  // Smooth entrance animation
  useEffect(() => {
    if (isActive) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isActive])
  
  // Memoized threat color configuration
  const threatConfig = useMemo(() => 
    THREAT_COLORS[threatLevel] || THREAT_COLORS.SAFE,
    [threatLevel]
  )
  
  // Handle click events if specified
  const handleClick = () => {
    if (onAlertClick) {
      onAlertClick({
        zoneId,
        threatLevel,
        threatType,
        confidence,
        position,
        timestamp: Date.now()
      })
    }
  }
  
  if (!isVisible) return null
  
  return (
    <OverlayContainer
      ref={overlayRef}
      $left={position.x}
      $top={position.y}
      $width={position.width}
      $height={position.height}
      $threatLevel={threatLevel}
      $intensity={intensity}
      onClick={onAlertClick ? handleClick : undefined}
      style={{
        pointerEvents: onAlertClick ? 'auto' : 'none',
        cursor: onAlertClick ? 'pointer' : 'default'
      }}
    >
      {/* Zone identifier */}
      {showZoneId && (
        <ZoneIdentifier>
          {zoneId}
        </ZoneIdentifier>
      )}
      
      {/* Threat level indicator */}
      {showIndicator && (
        <ThreatIndicator>
          {customLabel || threatConfig.name}
        </ThreatIndicator>
      )}
      
      {/* Confidence meter */}
      {showConfidence && confidence > 0 && (
        <ConfidenceMeter>
          <span>{confidence}%</span>
          <ConfidenceBar $confidence={confidence} />
        </ConfidenceMeter>
      )}
    </OverlayContainer>
  )
}

export default BlinkingBorderOverlay

// Export type definitions
export const ThreatLevels = {
  SAFE: 'SAFE',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM', 
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
  WEAPON: 'WEAPON'
}