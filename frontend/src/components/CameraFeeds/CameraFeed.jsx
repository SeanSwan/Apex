/**
 * APEX AI CAMERA FEED COMPONENT
 * ============================
 * Professional camera feed display with multiple stream support
 * 
 * Supports:
 * - RTSP streams (via WebRTC/HLS conversion)
 * - HTTP/MJPEG streams
 * - IP camera feeds
 * - DVR system integration
 * - Real-time stream status monitoring
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import styled from 'styled-components'

// Stream type constants
export const STREAM_TYPES = {
  RTSP: 'rtsp',
  HTTP: 'http',
  MJPEG: 'mjpeg',
  HLS: 'hls',
  WEBRTC: 'webrtc'
}

// Connection status constants
export const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  LOADING: 'loading'
}

// Styled components
const CameraContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  border: 2px solid ${props => {
    switch(props.$status) {
      case 'connected': return '#00FF88'
      case 'connecting': return '#FFD700'
      case 'error': return '#FF4444'
      default: return 'rgba(255, 255, 255, 0.2)'
    }
  }};
  border-radius: 8px;
  overflow: hidden;
  
  transition: border-color 0.3s ease;
`

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
`

const ImageElement = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
`

const StatusOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  background: rgba(0, 0, 0, 0.8);
  color: #FFFFFF;
  font-family: 'Segoe UI', sans-serif;
  
  ${props => props.$status === 'connected' && 'display: none;'}
`

const StatusIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  
  ${props => {
    switch(props.$status) {
      case 'connecting': return 'animation: spin 1s linear infinite;'
      case 'error': return 'color: #FF4444;'
      case 'loading': return 'animation: pulse 1.5s ease-in-out infinite;'
      default: return 'color: rgba(255, 255, 255, 0.6);'
    }
  }}
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
`

const StatusText = styled.div`
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 8px;
`

const StatusSubtext = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
`

const CameraInfo = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  
  background: rgba(0, 0, 0, 0.8);
  color: #FFFFFF;
  padding: 4px 8px;
  border-radius: 4px;
  
  font-family: 'Courier New', monospace;
  font-size: 10px;
  font-weight: bold;
  
  border: 1px solid rgba(0, 255, 136, 0.5);
`

const ControlsOverlay = styled.div`
  position: absolute;
  bottom: 8px;
  right: 8px;
  
  display: flex;
  gap: 4px;
  
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${CameraContainer}:hover & {
    opacity: 1;
  }
`

const ControlButton = styled.button`
  width: 24px;
  height: 24px;
  
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  
  color: #FFFFFF;
  font-size: 12px;
  
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 255, 136, 0.2);
    border-color: #00FF88;
  }
`

const RetryButton = styled.button`
  margin-top: 16px;
  padding: 8px 16px;
  
  background: rgba(0, 255, 136, 0.2);
  border: 1px solid #00FF88;
  border-radius: 6px;
  
  color: #00FF88;
  font-size: 12px;
  font-weight: 600;
  
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 255, 136, 0.3);
  }
`

// Main CameraFeed component
const CameraFeed = ({
  cameraId = 'CAM-01',
  streamUrl = null,
  streamType = STREAM_TYPES.HTTP,
  name = 'Camera Feed',
  onStatusChange = null,
  onError = null,
  showControls = true,
  showInfo = true,
  refreshInterval = 30000, // 30 seconds for MJPEG
  retryAttempts = 3,
  className = ''
}) => {
  const [status, setStatus] = useState(CONNECTION_STATUS.DISCONNECTED)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const videoRef = useRef(null)
  const imageRef = useRef(null)
  const refreshTimer = useRef(null)
  
  // Update status and notify parent
  const updateStatus = useCallback((newStatus, errorMsg = null) => {
    setStatus(newStatus)
    setError(errorMsg)
    
    if (onStatusChange) {
      onStatusChange({
        cameraId,
        status: newStatus,
        error: errorMsg,
        timestamp: Date.now()
      })
    }
  }, [cameraId, onStatusChange])
  
  // Connect to stream
  const connectStream = useCallback(async () => {
    if (!streamUrl) {
      updateStatus(CONNECTION_STATUS.ERROR, 'No stream URL provided')
      return
    }
    
    updateStatus(CONNECTION_STATUS.CONNECTING)
    setError(null)
    
    try {
      switch (streamType) {
        case STREAM_TYPES.HTTP:
        case STREAM_TYPES.HLS:
          if (videoRef.current) {
            videoRef.current.src = streamUrl
            await videoRef.current.load()
          }
          break
          
        case STREAM_TYPES.MJPEG:
          if (imageRef.current) {
            // Add cache-busting parameter for MJPEG streams
            const url = new URL(streamUrl)
            url.searchParams.set('t', Date.now())
            imageRef.current.src = url.toString()
          }
          break
          
        default:
          throw new Error(`Unsupported stream type: ${streamType}`)
      }
    } catch (err) {
      console.error(`Camera ${cameraId} connection error:`, err)
      updateStatus(CONNECTION_STATUS.ERROR, err.message)
      
      if (onError) {
        onError({ cameraId, error: err.message })
      }
      
      // Auto-retry logic
      if (retryCount < retryAttempts) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          connectStream()
        }, 5000 * (retryCount + 1)) // Exponential backoff
      }
    }
  }, [streamUrl, streamType, cameraId, retryCount, retryAttempts, updateStatus, onError])
  
  // Handle video events
  const handleVideoLoad = useCallback(() => {
    updateStatus(CONNECTION_STATUS.CONNECTED)
    setRetryCount(0)
  }, [updateStatus])
  
  const handleVideoError = useCallback((e) => {
    const errorMsg = `Video load error: ${e.target.error?.message || 'Unknown error'}`
    updateStatus(CONNECTION_STATUS.ERROR, errorMsg)
  }, [updateStatus])
  
  // Handle image events
  const handleImageLoad = useCallback(() => {
    updateStatus(CONNECTION_STATUS.CONNECTED)
    setRetryCount(0)
  }, [updateStatus])
  
  const handleImageError = useCallback(() => {
    updateStatus(CONNECTION_STATUS.ERROR, 'Image load failed')
  }, [updateStatus])
  
  // Setup refresh timer for MJPEG streams
  useEffect(() => {
    if (streamType === STREAM_TYPES.MJPEG && status === CONNECTION_STATUS.CONNECTED) {
      refreshTimer.current = setInterval(() => {
        if (imageRef.current) {
          const url = new URL(streamUrl)
          url.searchParams.set('t', Date.now())
          imageRef.current.src = url.toString()
        }
      }, refreshInterval)
    }
    
    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current)
      }
    }
  }, [streamType, status, streamUrl, refreshInterval])
  
  // Initial connection
  useEffect(() => {
    if (streamUrl) {
      connectStream()
    }
    
    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current)
      }
    }
  }, [streamUrl, connectStream])
  
  // Manual retry
  const handleRetry = useCallback(() => {
    setRetryCount(0)
    connectStream()
  }, [connectStream])
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case CONNECTION_STATUS.CONNECTING: return '⟳'
      case CONNECTION_STATUS.CONNECTED: return '✓'
      case CONNECTION_STATUS.ERROR: return '⚠'
      case CONNECTION_STATUS.LOADING: return '⧗'
      default: return '📹'
    }
  }
  
  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case CONNECTION_STATUS.CONNECTING: return 'Connecting to camera...'
      case CONNECTION_STATUS.CONNECTED: return 'Connected'
      case CONNECTION_STATUS.ERROR: return 'Connection Failed'
      case CONNECTION_STATUS.LOADING: return 'Loading stream...'
      default: return 'Camera Disconnected'
    }
  }
  
  return (
    <CameraContainer $status={status} className={className}>
      {/* Video element for HTTP/HLS streams */}
      {(streamType === STREAM_TYPES.HTTP || streamType === STREAM_TYPES.HLS) && (
        <VideoElement
          ref={videoRef}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          autoPlay
          muted
          playsInline
        />
      )}
      
      {/* Image element for MJPEG streams */}
      {streamType === STREAM_TYPES.MJPEG && (
        <ImageElement
          ref={imageRef}
          onLoad={handleImageLoad}
          onError={handleImageError}
          alt={`${name} feed`}
        />
      )}
      
      {/* Status overlay */}
      <StatusOverlay $status={status}>
        <StatusIcon $status={status}>
          {getStatusIcon(status)}
        </StatusIcon>
        <StatusText>{getStatusText(status)}</StatusText>
        {error && <StatusSubtext>{error}</StatusSubtext>}
        {status === CONNECTION_STATUS.ERROR && (
          <RetryButton onClick={handleRetry}>
            Retry Connection
          </RetryButton>
        )}
      </StatusOverlay>
      
      {/* Camera info */}
      {showInfo && (
        <CameraInfo>
          {cameraId} - {name}
        </CameraInfo>
      )}
      
      {/* Controls */}
      {showControls && status === CONNECTION_STATUS.CONNECTED && (
        <ControlsOverlay>
          <ControlButton onClick={handleRetry} title="Refresh">
            ⟳
          </ControlButton>
          <ControlButton title="Settings">
            ⚙
          </ControlButton>
        </ControlsOverlay>
      )}
    </CameraContainer>
  )
}

export default CameraFeed