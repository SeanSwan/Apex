/**
 * BLINKING BORDER OVERLAY - REACT COMPONENT
 * =========================================
 * Hardware-accelerated overlay component for real-time border animation
 * Renders dynamic visual alerts with optimized performance
 * 
 * Features:
 * - Hardware-accelerated CSS animations
 * - Multiple threat level indicators
 * - Dynamic color and pattern support
 * - Performance optimized for real-time updates
 * - Responsive to threat data changes
 * 
 * Priority: P1 HIGH - Critical visual component for dispatcher alerts
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';

// Alert pattern animations
const solidBorder = keyframes`
  0% { opacity: 1; }
  100% { opacity: 1; }
`;

const slowBlink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
`;

const fastBlink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
`;

const pulse = keyframes`
  0% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 0.3; transform: scale(1); }
`;

const strobe = keyframes`
  0% { opacity: 0; }
  10% { opacity: 1; }
  20% { opacity: 0; }
  100% { opacity: 0; }
`;

const gradientPulse = keyframes`
  0% { 
    opacity: 0.2; 
    transform: scale(1);
    filter: hue-rotate(0deg);
  }
  50% { 
    opacity: 1; 
    transform: scale(1.02);
    filter: hue-rotate(30deg);
  }
  100% { 
    opacity: 0.2; 
    transform: scale(1);
    filter: hue-rotate(0deg);
  }
`;

const heartbeat = keyframes`
  0% { opacity: 0.1; transform: scale(1); }
  12.5% { opacity: 1; transform: scale(1.05); }
  25% { opacity: 0.1; transform: scale(1); }
  37.5% { opacity: 1; transform: scale(1.03); }
  50% { opacity: 0.1; transform: scale(1); }
  100% { opacity: 0.1; transform: scale(1); }
`;

const breathing = keyframes`
  0% { opacity: 0.4; transform: scale(0.98); }
  37.5% { opacity: 0.8; transform: scale(1.01); }
  62.5% { opacity: 0.8; transform: scale(1.01); }
  100% { opacity: 0.4; transform: scale(0.98); }
`;

const emergencyFlash = keyframes`
  0% { opacity: 0; transform: scale(1); filter: brightness(1); }
  20% { opacity: 1; transform: scale(1.05); filter: brightness(1.2); }
  100% { opacity: 0; transform: scale(1); filter: brightness(1); }
`;

const wave = keyframes`
  0% { opacity: 0.2; transform: scale(0.98); filter: hue-rotate(0deg); }
  33% { opacity: 1; transform: scale(1.01); filter: hue-rotate(15deg); }
  66% { opacity: 0.6; transform: scale(1); filter: hue-rotate(10deg); }
  100% { opacity: 0.2; transform: scale(0.98); filter: hue-rotate(0deg); }
`;

// Animation mapping
const getAnimationForPattern = (patternType, threatLevel) => {
  const animations = {
    'solid': css`animation: none;`,
    'slow_blink': css`animation: ${slowBlink} 2s infinite;`,
    'fast_blink': css`animation: ${fastBlink} 0.6s infinite;`,
    'pulse': css`animation: ${pulse} 3s infinite ease-in-out;`,
    'strobe': css`animation: ${strobe} 0.2s infinite;`,
    'gradient_pulse': css`animation: ${gradientPulse} 4s infinite ease-in-out;`,
    'heartbeat': css`animation: ${heartbeat} 1.2s infinite;`,
    'breathing': css`animation: ${breathing} 4s infinite ease-in-out;`,
    'emergency_flash': css`animation: ${emergencyFlash} 0.1s infinite;`,
    'wave': css`animation: ${wave} 2.5s infinite ease-in-out;`
  };
  
  return animations[patternType] || animations['pulse'];
};

// Styled components
const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
  overflow: hidden;
`;

const AlertBorder = styled.div`
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
  transition: all 0.1s ease-out;
  
  /* Base border styling */
  border-style: solid;
  border-color: ${props => props.borderColor || '#ff0000'};
  border-width: ${props => props.borderWidth || '4px'};
  
  /* Dynamic positioning */
  left: ${props => props.region?.x || 0}px;
  top: ${props => props.region?.y || 0}px;
  width: ${props => props.region?.width || 100}px;
  height: ${props => props.region?.height || 100}px;
  
  /* Visibility */
  opacity: ${props => props.opacity || 1};
  visibility: ${props => props.isVisible ? 'visible' : 'hidden'};
  
  /* Pattern animation */
  ${props => getAnimationForPattern(props.patternType, props.threatLevel)}
  
  /* Hardware acceleration */
  will-change: opacity, transform, filter;
  transform: translateZ(0);
  
  /* Glow effect for high priority threats */
  ${props => (props.threatLevel === 'CRITICAL' || props.threatLevel === 'HIGH') && css`
    box-shadow: 
      0 0 10px ${props.borderColor || '#ff0000'},
      0 0 20px ${props.borderColor || '#ff0000'}40,
      inset 0 0 10px ${props.borderColor || '#ff0000'}20;
  `}
  
  /* Enhanced visibility for critical threats */
  ${props => props.threatLevel === 'CRITICAL' && css`
    border-width: ${parseInt(props.borderWidth || '4') + 2}px;
    filter: brightness(1.2) saturate(1.3);
  `}
`;

const ThreatLabel = styled.div`
  position: absolute;
  top: -30px;
  left: 0;
  background: ${props => props.backgroundColor || '#000000'}dd;
  color: ${props => props.textColor || '#ffffff'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  opacity: ${props => props.showLabel ? 1 : 0};
  transition: opacity 0.2s ease;
  
  /* Ensure visibility */
  z-index: 1001;
  pointer-events: none;
  
  /* Glow for critical threats */
  ${props => props.threatLevel === 'CRITICAL' && css`
    background: #ff0000dd;
    text-shadow: 0 0 4px #ffffff;
    box-shadow: 0 0 8px #ff000080;
  `}
`;

// Threat level color mapping
const getThreatColors = (threatLevel) => {
  const colorMap = {
    'CRITICAL': '#ff0000',  // Bright Red
    'HIGH': '#ff8500',      // Orange
    'MEDIUM': '#ffff00',    // Yellow
    'LOW': '#00ffff',       // Cyan
    'default': '#808080'    // Gray
  };
  
  return colorMap[threatLevel] || colorMap['default'];
};

// Main component
const BlinkingBorderOverlay = ({
  alerts = [],
  showLabels = true,
  enableGlow = true,
  className,
  style,
  onAlertClick,
  ...props
}) => {
  const containerRef = useRef(null);
  const [visibleAlerts, setVisibleAlerts] = useState([]);
  
  // Filter and process alerts
  const processedAlerts = useMemo(() => {
    return alerts.filter(alert => alert && alert.region).map(alert => ({
      ...alert,
      borderColor: getThreatColors(alert.threatLevel),
      borderWidth: `${Math.max(2, Math.min(10, (alert.confidence || 0.5) * 8))}px`,
      opacity: Math.max(0.3, Math.min(1, alert.opacity || alert.confidence || 0.8))
    }));
  }, [alerts]);
  
  // Update visible alerts with smooth transitions
  useEffect(() => {
    setVisibleAlerts(processedAlerts);
  }, [processedAlerts]);
  
  // Handle alert click events
  const handleAlertClick = useCallback((alert, event) => {
    if (onAlertClick && typeof onAlertClick === 'function') {
      event.stopPropagation();
      onAlertClick(alert);
    }
  }, [onAlertClick]);
  
  // Performance optimization: memoize individual alert components
  const AlertComponent = React.memo(({ alert, index }) => (
    <React.Fragment key={alert.alertId || `alert-${index}`}>
      <AlertBorder
        region={alert.region}
        borderColor={alert.borderColor}
        borderWidth={alert.borderWidth}
        opacity={alert.opacity}
        isVisible={alert.isVisible !== false}
        patternType={alert.patternType || 'pulse'}
        threatLevel={alert.threatLevel}
        onClick={(e) => handleAlertClick(alert, e)}
        data-alert-id={alert.alertId}
        data-threat-type={alert.threatType}
        data-threat-level={alert.threatLevel}
      />
      
      {showLabels && alert.description && (
        <ThreatLabel
          backgroundColor={alert.borderColor}
          textColor={alert.threatLevel === 'MEDIUM' ? '#000000' : '#ffffff'}
          showLabel={alert.isVisible !== false}
          threatLevel={alert.threatLevel}
          style={{
            left: (alert.region?.x || 0) + 'px',
            top: (alert.region?.y || 0) - 30 + 'px'
          }}
        >
          {alert.threatType || 'Threat'}: {alert.threatLevel}
        </ThreatLabel>
      )}
    </React.Fragment>
  ));
  
  // Early return if no alerts
  if (!visibleAlerts.length) {
    return null;
  }
  
  return (
    <OverlayContainer
      ref={containerRef}
      className={className}
      style={style}
      role=\"alert\"
      aria-live=\"polite\"
      aria-label={`${visibleAlerts.length} active security alert${visibleAlerts.length > 1 ? 's' : ''}`}
      {...props}
    >
      {visibleAlerts.map((alert, index) => (
        <AlertComponent
          key={alert.alertId || `alert-${index}`}
          alert={alert}
          index={index}
        />
      ))}
    </OverlayContainer>
  );
};

// Performance optimizations
BlinkingBorderOverlay.displayName = 'BlinkingBorderOverlay';

// Default props
BlinkingBorderOverlay.defaultProps = {
  alerts: [],
  showLabels: true,
  enableGlow: true
};

// Prop types (using comments for documentation)
/*
PropTypes:
- alerts: Array of alert objects with structure:
  {
    alertId: string,
    region: { x, y, width, height },
    threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
    threatType: string,
    description: string,
    confidence: number (0-1),
    opacity: number (0-1),
    isVisible: boolean,
    patternType: string,
    borderColor: string (optional),
    borderWidth: string (optional)
  }
- showLabels: boolean - Whether to show threat labels
- enableGlow: boolean - Whether to enable glow effects
- onAlertClick: function - Callback when alert is clicked
- className: string - Additional CSS class
- style: object - Additional inline styles
*/

export default BlinkingBorderOverlay;

// Export additional utilities
export const ThreatColors = {
  CRITICAL: '#ff0000',
  HIGH: '#ff8500', 
  MEDIUM: '#ffff00',
  LOW: '#00ffff'
};

export const PatternTypes = {
  SOLID: 'solid',
  SLOW_BLINK: 'slow_blink',
  FAST_BLINK: 'fast_blink',
  PULSE: 'pulse',
  STROBE: 'strobe',
  GRADIENT_PULSE: 'gradient_pulse',
  HEARTBEAT: 'heartbeat',
  BREATHING: 'breathing',
  EMERGENCY_FLASH: 'emergency_flash',
  WAVE: 'wave'
};

// Hook for managing alert state
export const useVisualAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  
  const addAlert = useCallback((alertData) => {
    setAlerts(prevAlerts => {
      // Remove existing alert for same zone if exists
      const filteredAlerts = prevAlerts.filter(alert => alert.zoneId !== alertData.zoneId);
      return [...filteredAlerts, alertData];
    });
  }, []);
  
  const removeAlert = useCallback((alertId) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.alertId !== alertId));
  }, []);
  
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);
  
  const updateAlert = useCallback((alertId, updates) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.alertId === alertId 
          ? { ...alert, ...updates }
          : alert
      )
    );
  }, []);
  
  return {
    alerts,
    addAlert,
    removeAlert,
    clearAllAlerts,
    updateAlert,
    alertCount: alerts.length
  };
};
