/**
 * APEX AI TIER 2 VISUAL ALERTS PAGE
 * =================================
 * Professional demonstration page for TIER 2 visual alert system
 * Showcases all alert components in a realistic security environment
 */

import React, { useEffect } from 'react'
import styled from 'styled-components'
import { Tier2VisualAlertsDemo } from '../components/VisualAlerts'
import { WebSocketProvider } from '../hooks/WebSocketProvider'

// Page container with professional styling
const AlertsPageContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background: #000000;
  position: relative;
  overflow: hidden;
  
  /* Ensure full screen coverage */
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
`

const PageHeader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.7) 70%,
    transparent 100%
  );
  
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  
  z-index: 10001;
  
  .title {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #00FF88;
    
    display: flex;
    align-items: center;
    gap: 12px;
    
    .icon {
      font-size: 24px;
    }
  }
  
  .nav-controls {
    display: flex;
    align-items: center;
    gap: 16px;
  }
`

const NavButton = styled.button`
  padding: 8px 16px;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 8px;
  color: #00FF88;
  
  font-family: 'Segoe UI', sans-serif;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 255, 136, 0.2);
    border-color: rgba(0, 255, 136, 0.6);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #00FF88;
    box-shadow: 0 0 10px rgba(0, 255, 136, 0.6);
    
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { 
      opacity: 1;
      transform: scale(1);
    }
    50% { 
      opacity: 0.7;
      transform: scale(1.1);
    }
  }
`

const InstructionsOverlay = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 12px;
  
  padding: 16px 24px;
  max-width: 600px;
  
  font-family: 'Segoe UI', sans-serif;
  color: #FFFFFF;
  text-align: center;
  
  z-index: 10002;
  
  h4 {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 700;
    color: #00FF88;
  }
  
  p {
    margin: 0;
    font-size: 11px;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .controls {
    margin-top: 12px;
    display: flex;
    justify-content: center;
    gap: 12px;
    
    .key {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      padding: 2px 6px;
      font-family: 'Courier New', monospace;
      font-size: 10px;
      font-weight: 700;
    }
  }
`

// Main page component
const Tier2VisualAlertsPage: React.FC = () => {
  // Set document title
  useEffect(() => {
    const originalTitle = document.title
    document.title = 'APEX AI - TIER 2 Visual Alerts Demo'
    
    return () => {
      document.title = originalTitle
    }
  }, [])
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // ESC to exit
      if (event.key === 'Escape') {
        handleExit()
      }
      
      // F11 for fullscreen
      if (event.key === 'F11') {
        event.preventDefault()
        toggleFullscreen()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [])
  
  const handleExit = () => {
    // Navigate back to main application
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }
  
  const handleHelp = () => {
    alert(`APEX AI TIER 2 VISUAL ALERTS DEMO

DEMO CONTROLS:
• Weapon Alert - Triggers high-priority weapon detection scenario
• Multiple Threats - Shows multiple simultaneous alerts
• Low Level Alerts - Demonstrates normal activity monitoring
• Clear All - Removes all active alerts
• Audio Toggle - Enable/disable spatial audio
• Voice Toggle - Enable/disable AI conversation system

KEYBOARD SHORTCUTS:
• ESC - Exit demo
• F11 - Toggle fullscreen

ALERT FEATURES:
• Professional animated borders with threat-level colors
• Real-time audio positioning based on zone location
• AI conversation system with security scripts
• Multi-monitor support with zone tracking
• Professional dispatcher control interfaces

This demo showcases the TIER 2 visual alert system designed for professional security operations.`)
  }
  
  return (
    <WebSocketProvider>
      <AlertsPageContainer>
        {/* Page header with navigation */}
        <PageHeader>
          <div className="title">
            <span className="icon">🚨</span>
            APEX AI - TIER 2 VISUAL ALERTS DEMO
          </div>
          
          <div className="nav-controls">
            <StatusIndicator>
              <div className="status-dot"></div>
              SYSTEM ACTIVE
            </StatusIndicator>
            
            <NavButton onClick={handleHelp}>
              📖 HELP
            </NavButton>
            
            <NavButton onClick={toggleFullscreen}>
              🔳 FULLSCREEN
            </NavButton>
            
            <NavButton onClick={handleExit}>
              ◀ EXIT DEMO
            </NavButton>
          </div>
        </PageHeader>
        
        {/* Main demo component */}
        <Tier2VisualAlertsDemo />
        
        {/* Instructions overlay */}
        <InstructionsOverlay>
          <h4>🎮 DEMO INSTRUCTIONS</h4>
          <p>
            Use the demo controls at the top to trigger different threat scenarios. 
            Watch the professional visual alerts, spatial audio positioning, and AI conversation system in action.
          </p>
          <div className="controls">
            <span>Press <span className="key">ESC</span> to exit</span>
            <span>Press <span className="key">F11</span> for fullscreen</span>
            <span>Click <span className="key">HELP</span> for detailed information</span>
          </div>
        </InstructionsOverlay>
      </AlertsPageContainer>
    </WebSocketProvider>
  )
}

export default Tier2VisualAlertsPage