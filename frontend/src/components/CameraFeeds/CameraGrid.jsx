/**
 * APEX AI CAMERA GRID COMPONENT
 * =============================
 * Professional multi-camera grid layout for dispatcher interface
 * 
 * Features:
 * - Responsive grid layouts (1x1, 2x2, 3x3, 4x4)
 * - Camera feed management
 * - Alert overlay integration
 * - Full-screen camera selection
 * - Professional dispatcher controls
 */

import React, { useState, useCallback, useMemo } from 'react'
import styled from 'styled-components'
import CameraFeed from './CameraFeed'
import BlinkingBorderOverlay from '../VisualAlerts/BlinkingBorderOverlay'

// Grid layout configurations
export const GRID_LAYOUTS = {
  SINGLE: { rows: 1, cols: 1, name: '1x1' },
  QUAD: { rows: 2, cols: 2, name: '2x2' },
  NINE: { rows: 3, cols: 3, name: '3x3' },
  SIXTEEN: { rows: 4, cols: 4, name: '4x4' }
}

// Styled components
const GridContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: #0a0a0a;
  border-radius: 8px;
  overflow: hidden;
`

const CameraGrid = styled.div`
  display: grid;
  grid-template-rows: repeat(${props => props.$rows}, 1fr);
  grid-template-columns: repeat(${props => props.$cols}, 1fr);
  gap: 2px;
  width: 100%;
  height: 100%;
  background: #1a1a1a;
`

const CameraSlot = styled.div`
  position: relative;
  background: #2a2a2a;
  border-radius: 4px;
  overflow: hidden;
  
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
    z-index: 10;
  }
  
  ${props => props.$isSelected && `
    border: 2px solid #00FF88;
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
  `}
`

const EmptySlot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  color: rgba(255, 255, 255, 0.4);
  font-family: 'Segoe UI', sans-serif;
  font-size: 14px;
  text-align: center;
  
  .icon {
    font-size: 32px;
    margin-bottom: 8px;
    opacity: 0.6;
  }
  
  .text {
    font-weight: 500;
  }
  
  .subtext {
    font-size: 12px;
    margin-top: 4px;
    opacity: 0.7;
  }
`

const AlertOverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 100;
`

const GridControls = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  
  display: flex;
  gap: 8px;
  
  z-index: 200;
`

const LayoutButton = styled.button`
  padding: 6px 12px;
  
  background: ${props => props.$active 
    ? 'rgba(0, 255, 136, 0.2)' 
    : 'rgba(0, 0, 0, 0.8)'};
  border: 1px solid ${props => props.$active 
    ? '#00FF88' 
    : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 6px;
  
  color: ${props => props.$active ? '#00FF88' : '#FFFFFF'};
  font-size: 10px;
  font-weight: 600;
  font-family: 'Segoe UI', sans-serif;
  
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$active 
      ? 'rgba(0, 255, 136, 0.3)' 
      : 'rgba(255, 255, 255, 0.1)'};
  }
`

const CameraStatus = styled.div`
  position: absolute;
  bottom: 12px;
  left: 12px;
  
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  color: #FFFFFF;
  font-size: 11px;
  font-family: 'Segoe UI', sans-serif;
  
  z-index: 200;
`

// Main CameraGrid component
const CameraGridComponent = ({
  cameras = [],
  layout = GRID_LAYOUTS.QUAD,
  alerts = [],
  onCameraSelect = null,
  onLayoutChange = null,
  selectedCamera = null,
  showControls = true,
  className = ''
}) => {
  const [currentLayout, setCurrentLayout] = useState(layout)
  const [cameraStatuses, setCameraStatuses] = useState({})
  
  // Calculate total slots in grid
  const totalSlots = currentLayout.rows * currentLayout.cols
  
  // Handle layout change
  const handleLayoutChange = useCallback((newLayout) => {
    setCurrentLayout(newLayout)
    if (onLayoutChange) {
      onLayoutChange(newLayout)
    }
  }, [onLayoutChange])
  
  // Handle camera status updates
  const handleCameraStatusChange = useCallback((statusData) => {
    setCameraStatuses(prev => ({
      ...prev,
      [statusData.cameraId]: statusData
    }))
  }, [])
  
  // Handle camera selection
  const handleCameraClick = useCallback((camera) => {
    if (onCameraSelect) {
      onCameraSelect(camera)
    }
  }, [onCameraSelect])
  
  // Get alerts for specific camera
  const getAlertsForCamera = useCallback((cameraId) => {
    return alerts.filter(alert => alert.zoneId === cameraId)
  }, [alerts])
  
  // Calculate connected cameras count
  const connectedCount = useMemo(() => {
    return Object.values(cameraStatuses).filter(
      status => status.status === 'connected'
    ).length
  }, [cameraStatuses])
  
  // Render camera slots
  const renderCameraSlots = () => {
    const slots = []
    
    for (let i = 0; i < totalSlots; i++) {
      const camera = cameras[i]
      const isSelected = selectedCamera && camera && camera.id === selectedCamera.id
      const cameraAlerts = camera ? getAlertsForCamera(camera.id) : []
      
      slots.push(
        <CameraSlot
          key={i}
          $isSelected={isSelected}
          onClick={() => camera && handleCameraClick(camera)}
        >
          {camera ? (
            <>
              <CameraFeed
                cameraId={camera.id}
                streamUrl={camera.streamUrl}
                streamType={camera.streamType}
                name={camera.name}
                onStatusChange={handleCameraStatusChange}
                showControls={true}
                showInfo={true}
              />
              
              {/* Alert overlays for this camera */}
              {cameraAlerts.map(alert => (
                <AlertOverlayContainer key={alert.id}>
                  <BlinkingBorderOverlay
                    zoneId={alert.zoneId}
                    threatLevel={alert.threatLevel}
                    threatType={alert.threatType}
                    confidence={alert.confidence}
                    position={{
                      x: 0,
                      y: 0,
                      width: '100%',
                      height: '100%'
                    }}
                    intensity={alert.intensity}
                    showIndicator={true}
                    showConfidence={true}
                    showZoneId={false} // Camera ID already shown
                    isActive={true}
                  />
                </AlertOverlayContainer>
              ))}
            </>
          ) : (
            <EmptySlot>
              <div className="icon">📹</div>
              <div className="text">No Camera</div>
              <div className="subtext">Slot {i + 1}</div>
            </EmptySlot>
          )}
        </CameraSlot>
      )
    }
    
    return slots
  }
  
  return (
    <GridContainer className={className}>
      {/* Layout controls */}
      {showControls && (
        <GridControls>
          {Object.entries(GRID_LAYOUTS).map(([key, layoutConfig]) => (
            <LayoutButton
              key={key}
              $active={currentLayout === layoutConfig}
              onClick={() => handleLayoutChange(layoutConfig)}
            >
              {layoutConfig.name}
            </LayoutButton>
          ))}
        </GridControls>
      )}
      
      {/* Camera status */}
      <CameraStatus>
        📹 {connectedCount}/{cameras.length} Connected
        {alerts.length > 0 && (
          <span style={{ color: '#FF4444', marginLeft: '12px' }}>
            🚨 {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
          </span>
        )}
      </CameraStatus>
      
      {/* Camera grid */}
      <CameraGrid $rows={currentLayout.rows} $cols={currentLayout.cols}>
        {renderCameraSlots()}
      </CameraGrid>
    </GridContainer>
  )
}

export default CameraGridComponent