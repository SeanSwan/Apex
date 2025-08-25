/**
 * CAMERA GRID COMPONENT (ENHANCED FOR REAL VIDEO STREAMING)
 * ========================================================
 * Displays multiple video streams with AI detection overlays
 * Supports grid view, focus view, and investigation modes
 * Enhanced with face detection overlays and person identification (Phase 1)
 * 
 * MASTER PROMPT v54.6 ENHANCEMENTS:
 * - Real video streaming via VideoStreamBridge integration
 * - Live AI detection with YOLO model support
 * - WebSocket-based video frame processing
 * - Dynamic video source configuration
 * - Professional production-ready video handling
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';

// Import face detection components (Phase 1 Enhancement)
import FaceOverlayComponent from '../FaceDetection/FaceOverlayComponent';
import PersonTypeIndicator from '../FaceDetection/PersonTypeIndicator';

// Import video streaming components (Master Prompt v54.6)
import VideoStreamBridge from '../VideoStream/VideoStreamBridge';
import VideoSourceManager from '../VideoStream/VideoSourceManager';

const GridContainer = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md};
  grid-template-columns: ${props => {
    const count = props.cameraCount;
    if (props.viewMode === 'focus') return '1fr';
    if (count <= 2) return 'repeat(2, 1fr)';
    if (count <= 4) return 'repeat(2, 1fr)';
    if (count <= 6) return 'repeat(3, 1fr)';
    return 'repeat(4, 1fr)';
  }};
  grid-template-rows: ${props => {
    const count = props.cameraCount;
    if (props.viewMode === 'focus') return '1fr';
    if (count <= 2) return '1fr';
    if (count <= 4) return 'repeat(2, 1fr)';
    if (count <= 9) return 'repeat(3, 1fr)';
    return 'repeat(4, 1fr)';
  }};
`;

const CameraContainer = styled.div`
  position: relative;
  background-color: #000;
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
  border: 2px solid ${props => {
    if (props.focused) return props.theme.colors.primary;
    if (props.hasAlert) return props.theme.colors.error;
    if (props.hasFaceDetection) return '#4CAF50'; // Green for face detection active
    return props.theme.colors.border;
  }};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.focused ? props.theme.colors.primary : props.theme.colors.borderLight};
    transform: ${props => props.viewMode === 'grid' ? 'scale(1.02)' : 'none'};
  }
`;

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #000;
`;

// Enhanced video streaming container (Master Prompt v54.6)
const VideoStreamContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #000;
`;

// Video source setup overlay
const VideoSetupOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  z-index: 100;
  gap: ${props => props.theme.spacing.md};
`;

const SetupButton = styled.button`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.background};
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};

  &:hover {
    background-color: ${props => props.theme.colors.primaryDark};
    transform: translateY(-1px);
  }
`;

// Live streaming status indicator
const StreamStatus = styled.div`
  position: absolute;
  bottom: ${props => props.theme.spacing.sm};
  right: ${props => props.theme.spacing.sm};
  background: rgba(0, 0, 0, 0.8);
  color: ${props => props.theme.colors.text};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  z-index: 20;
`;

const StreamIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.status) {
      case 'streaming': return '#00ff88';
      case 'connecting': return '#ffaa00';
      case 'error': return '#ff4444';
      default: return '#666666';
    }
  }};
  animation: ${props => props.status === 'streaming' ? 'pulse 2s ease-in-out infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const VideoPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: linear-gradient(45deg, #1a1a1a 25%, transparent 25%), 
              linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #1a1a1a 75%), 
              linear-gradient(-45deg, transparent 75%, #1a1a1a 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  color: ${props => props.theme.colors.textMuted};
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

const CameraOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
`;

const CameraInfo = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.sm};
  left: ${props => props.theme.spacing.sm};
  background: rgba(0, 0, 0, 0.8);
  color: ${props => props.theme.colors.text};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
`;

// Face detection overlay components (Phase 1 Enhancement)
const FaceDetectionOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 15;
`;

// Face detection status indicator
const FaceDetectionStatus = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  font-size: 11px;
  color: ${props => props.active ? '#4CAF50' : '#9E9E9E'};
  border: 1px solid ${props => props.active ? '#4CAF50' : '#9E9E9E'};
`;

// Person count indicator
const PersonCountIndicator = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 20;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  font-size: 12px;
  color: #FFFFFF;
  font-weight: 500;
  display: ${props => props.count > 0 ? 'block' : 'none'};
`;

// Face detection info panel
const FaceInfoPanel = styled.div`
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  z-index: 20;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  padding: 8px;
  display: ${props => props.visible ? 'block' : 'none'};
  max-height: 80px;
  overflow-y: auto;
`;

// Face detection list
const FaceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FaceItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #FFFFFF;
`;

const StatusIndicator = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.sm};
  right: ${props => props.theme.spacing.sm};
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.status) {
      case 'active': return props.theme.colors.success;
      case 'connecting': return props.theme.colors.warning;
      case 'error': return props.theme.colors.error;
      default: return props.theme.colors.textMuted;
    }
  }};
  animation: ${props => props.status === 'connecting' ? 'pulse 1.5s ease-in-out infinite' : 'none'};
`;

const DetectionOverlay = styled.div`
  position: absolute;
  border: 2px solid ${props => {
    switch (props.type) {
      case 'person': return props.theme.colors.primary;
      case 'unknown_person': return props.theme.colors.warning;
      case 'threat': return props.theme.colors.error;
      default: return props.theme.colors.secondary;
    }
  }};
  background: rgba(0, 255, 136, 0.1);
  border-radius: 2px;
  top: ${props => props.y * 100}%;
  left: ${props => props.x * 100}%;
  width: ${props => props.width * 100}%;
  height: ${props => props.height * 100}%;
  transition: all 0.2s ease;
`;

const DetectionLabel = styled.div`
  position: absolute;
  top: -20px;
  left: 0;
  background: ${props => {
    switch (props.type) {
      case 'person': return props.theme.colors.primary;
      case 'unknown_person': return props.theme.colors.warning;
      case 'threat': return props.theme.colors.error;
      default: return props.theme.colors.secondary;
    }
  }};
  color: ${props => props.theme.colors.background};
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  white-space: nowrap;
`;

const EmptyGridMessage = styled.div`
  grid-column: 1 / -1;
  grid-row: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: ${props => props.theme.colors.textMuted};
  font-size: ${props => props.theme.typography.fontSize.lg};
  gap: ${props => props.theme.spacing.md};
`;

function CameraGrid({ 
  cameras, 
  viewMode, 
  focusedCamera, 
  detections, 
  onCameraFocus, 
  faceDetections = [], 
  onFaceDetection = null,
  // New props for video streaming (Master Prompt v54.6)
  enableRealTimeStreaming = true,
  onVideoFrameReceived = null,
  onDetectionReceived = null 
}) {
  const [loadedVideos, setLoadedVideos] = useState(new Set());
  const [videoErrors, setVideoErrors] = useState(new Set());
  const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(true);
  const [showFaceInfo, setShowFaceInfo] = useState({});
  const videoRefs = useRef({});
  
  // Enhanced state for real video streaming (Master Prompt v54.6)
  const [videoSources, setVideoSources] = useState(new Map());
  const [streamingStatus, setStreamingStatus] = useState(new Map());
  const [showVideoSetup, setShowVideoSetup] = useState(new Map());
  const [liveDetections, setLiveDetections] = useState(new Map());
  const [frameCount, setFrameCount] = useState(new Map());

  // Filter cameras based on view mode
  const displayCameras = viewMode === 'focus' && focusedCamera 
    ? [focusedCamera] 
    : cameras;

  // Enhanced video frame handler (Master Prompt v54.6)
  const handleVideoFrame = useCallback((cameraId, frame) => {
    // Update frame count
    setFrameCount(prev => new Map(prev.set(cameraId, (prev.get(cameraId) || 0) + 1)));
    
    // Process AI detections from frame metadata
    if (frame.metadata?.detections) {
      const detections = frame.metadata.detections.map(detection => ({
        ...detection,
        camera_id: cameraId,
        timestamp: frame.timestamp,
        id: `${cameraId}_${frame.timestamp}_${detection.class_name}`
      }));
      
      setLiveDetections(prev => new Map(prev.set(cameraId, detections)));
      
      // Notify parent component
      if (onDetectionReceived) {
        detections.forEach(detection => onDetectionReceived(detection));
      }
    }
    
    // Notify parent component of frame received
    if (onVideoFrameReceived) {
      onVideoFrameReceived(cameraId, frame);
    }
  }, [onVideoFrameReceived, onDetectionReceived]);

  // Handle video source status changes
  const handleSourceStatusChange = useCallback((cameraId, sourceId, status) => {
    setStreamingStatus(prev => new Map(prev.set(cameraId, status)));
    
    // Update camera status
    if (status === 'connected') {
      setLoadedVideos(prev => new Set([...prev, cameraId]));
      setVideoErrors(prev => {
        const newSet = new Set(prev);
        newSet.delete(cameraId);
        return newSet;
      });
    } else if (status === 'error') {
      setVideoErrors(prev => new Set([...prev, cameraId]));
      setLoadedVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(cameraId);
        return newSet;
      });
    }
  }, []);

  // Setup video source for camera
  const setupVideoSource = useCallback((camera, videoSource) => {
    setVideoSources(prev => new Map(prev.set(camera.id, videoSource)));
    setShowVideoSetup(prev => new Map(prev.set(camera.id, false)));
  }, []);

  // Get combined detections (legacy + live)
  const getCombinedDetections = useCallback((cameraId) => {
    const legacyDetections = detections.filter(detection => detection.camera_id === cameraId);
    const liveDetections = Array.from(liveDetections.get(cameraId) || []);
    
    // Combine and deduplicate
    const allDetections = [...legacyDetections, ...liveDetections];
    return allDetections
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 10); // Show only recent detections
  }, [detections, liveDetections]);

  // Get detections for a specific camera (Enhanced)
  const getCameraDetections = (cameraId) => {
    return getCombinedDetections(cameraId);
  };

  // Get face detections for a specific camera (Phase 1 Enhancement)
  const getCameraFaceDetections = (cameraId) => {
    return faceDetections
      .filter(detection => detection.camera_id === cameraId)
      .slice(0, 5); // Show only recent face detections
  };

  // Handle face detection events (Phase 1 Enhancement)
  const handleFaceClick = (faceDetection, cameraId) => {
    if (onFaceDetection) {
      onFaceDetection(faceDetection, cameraId);
    }
    
    // Toggle face info panel
    setShowFaceInfo(prev => ({
      ...prev,
      [cameraId]: !prev[cameraId]
    }));
  };

  // Count faces by type for a camera
  const getFaceStats = (cameraId) => {
    const faces = getCameraFaceDetections(cameraId);
    return {
      total: faces.length,
      known: faces.filter(f => f.is_match).length,
      unknown: faces.filter(f => !f.is_match).length,
      alerts: faces.filter(f => f.alert_recommended).length
    };
  };

  const handleVideoLoad = (cameraId) => {
    setLoadedVideos(prev => new Set([...prev, cameraId]));
    setVideoErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(cameraId);
      return newSet;
    });
  };

  const handleVideoError = (cameraId, error) => {
    console.error(`❌ Video error for camera ${cameraId}:`, error);
    setVideoErrors(prev => new Set([...prev, cameraId]));
    setLoadedVideos(prev => {
      const newSet = new Set(prev);
      newSet.delete(cameraId);
      return newSet;
    });
  };

  const getDetectionLabel = (detection) => {
    if (detection.threat_level === 'threat') return 'THREAT';
    if (detection.threat_level === 'unknown') return 'UNKNOWN';
    if (detection.is_known === false) return 'UNIDENTIFIED';
    return `${detection.type?.toUpperCase() || 'OBJECT'} ${Math.round(detection.confidence * 100)}%`;
  };

  if (!cameras || cameras.length === 0) {
    return (
      <GridContainer>
        <EmptyGridMessage>
          <span style={{ fontSize: '48px' }}>📹</span>
          <div>No cameras available</div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Connect cameras to start monitoring
          </div>
        </EmptyGridMessage>
      </GridContainer>
    );
  }

  return (
    <GridContainer 
      cameraCount={displayCameras.length} 
      viewMode={viewMode}
    >
      {displayCameras.map(camera => {
        const cameraDetections = getCameraDetections(camera.id);
        const faceDetections = getCameraFaceDetections(camera.id); // Phase 1 Enhancement
        const faceStats = getFaceStats(camera.id); // Phase 1 Enhancement
        const hasAlert = cameraDetections.some(d => 
          d.threat_level === 'threat' || d.alert_type === 'high_priority'
        );
        const hasFaceAlert = faceDetections.some(f => f.alert_recommended); // Phase 1 Enhancement
        const isLoaded = loadedVideos.has(camera.id);
        const hasError = videoErrors.has(camera.id);
        const isFocused = focusedCamera?.id === camera.id;

        return (
          <CameraContainer
            key={camera.id}
            focused={isFocused}
            hasAlert={hasAlert || hasFaceAlert} // Include face alerts
            hasFaceDetection={faceDetectionEnabled && faceStats.total > 0} // Phase 1 Enhancement
            viewMode={viewMode}
            onClick={() => onCameraFocus && onCameraFocus(camera)}
          >
            {/* Enhanced Video Stream with Real-Time AI (Master Prompt v54.6) */}
            {enableRealTimeStreaming && videoSources.has(camera.id) ? (
              <VideoStreamContainer>
                <VideoStreamBridge
                  key={camera.id}
                  onFrameReceived={(frame) => handleVideoFrame(camera.id, frame)}
                  onDetectionReceived={(detection) => {
                    if (onDetectionReceived) {
                      onDetectionReceived({ ...detection, camera_id: camera.id });
                    }
                  }}
                  onSourceStatusChange={(sourceId, status) => 
                    handleSourceStatusChange(camera.id, sourceId, status)
                  }
                  autoStart={true}
                  enableAI={true}
                />
                
                {/* Live Streaming Status */}
                <StreamStatus>
                  <StreamIndicator status={streamingStatus.get(camera.id) || 'disconnected'} />
                  LIVE {streamingStatus.get(camera.id) === 'connected' ? 
                    `• ${frameCount.get(camera.id) || 0} frames` : 
                    `• ${streamingStatus.get(camera.id) || 'disconnected'}`.toUpperCase()
                  }
                </StreamStatus>
              </VideoStreamContainer>
            ) : (
              <>
                {/* Fallback: Traditional Video Element */}
                {!hasError && camera.rtspUrl ? (
                  <VideoElement
                    ref={el => videoRefs.current[camera.id] = el}
                    autoPlay
                    muted
                    loop
                    playsInline
                    onLoadedData={() => handleVideoLoad(camera.id)}
                    onError={(e) => handleVideoError(camera.id, e)}
                    style={{ display: isLoaded ? 'block' : 'none' }}
                  >
                    <source src={camera.rtspUrl} type="application/x-mpegURL" />
                    <source src="/demo-videos/sample-feed.mp4" type="video/mp4" />
                  </VideoElement>
                ) : null}

                {/* Video Setup Overlay */}
                {(!videoSources.has(camera.id) && enableRealTimeStreaming) && (
                  <VideoSetupOverlay>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📹</div>
                    <div style={{ color: '#fff', marginBottom: '16px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold' }}>{camera.name}</div>
                      <div style={{ fontSize: '14px', opacity: 0.8 }}>No video source configured</div>
                    </div>
                    <SetupButton onClick={() => setShowVideoSetup(prev => new Map(prev.set(camera.id, true)))}>
                      🚀 Setup Video Source
                    </SetupButton>
                  </VideoSetupOverlay>
                )}

                {/* Traditional Placeholder for loading/error states */}
                {(!isLoaded || hasError) && !showVideoSetup.get(camera.id) && (
                  <VideoPlaceholder>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                      {hasError ? '⚠️' : '📹'}
                    </div>
                    <div>{camera.name}</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      {hasError ? 'Connection Error' : 'Connecting...'}
                    </div>
                    {enableRealTimeStreaming && (
                      <SetupButton 
                        style={{ marginTop: '16px', padding: '8px 16px', fontSize: '12px' }}
                        onClick={() => setShowVideoSetup(prev => new Map(prev.set(camera.id, true)))}
                      >
                        🔧 Configure Video
                      </SetupButton>
                    )}
                  </VideoPlaceholder>
                )}
              </>
            )}

            {/* Camera Overlay */}
            <CameraOverlay>
              <CameraInfo>
                {camera.name}
              </CameraInfo>
              
              <StatusIndicator status={camera.status} />

              {/* Face Detection Status Indicator (Phase 1 Enhancement) */}
              {faceDetectionEnabled && (
                <FaceDetectionStatus active={faceStats.total > 0}>
                  🧠 {faceStats.total > 0 ? `${faceStats.total} faces` : 'No faces'}
                </FaceDetectionStatus>
              )}

              {/* Person Count Indicator (Phase 1 Enhancement) */}
              <PersonCountIndicator count={faceStats.total}>
                👥 {faceStats.total} {faceStats.total === 1 ? 'person' : 'people'}
              </PersonCountIndicator>

              {/* AI Detection Overlays */}
              {cameraDetections.map((detection, index) => (
                <DetectionOverlay
                  key={`${detection.id || index}-${detection.timestamp}`}
                  type={detection.type}
                  x={detection.bounding_box?.x || 0}
                  y={detection.bounding_box?.y || 0}
                  width={detection.bounding_box?.width || 0.1}
                  height={detection.bounding_box?.height || 0.1}
                >
                  <DetectionLabel type={detection.type}>
                    {getDetectionLabel(detection)}
                  </DetectionLabel>
                </DetectionOverlay>
              ))}

              {/* Face Detection Overlay (Phase 1 Enhancement) */}
              {faceDetectionEnabled && faceDetections.length > 0 && (
                <FaceDetectionOverlay>
                  <FaceOverlayComponent
                    faceDetections={faceDetections}
                    frameSize={{ width: 1920, height: 1080 }}
                    containerSize={{ 
                      width: videoRefs.current[camera.id]?.clientWidth || 640, 
                      height: videoRefs.current[camera.id]?.clientHeight || 360 
                    }}
                    overlayConfig={{
                      showBoundingBox: true,
                      showPersonName: true,
                      showConfidence: true,
                      showPersonTypeBadge: true,
                      showQualityIndicator: false,
                      animateAlerts: true
                    }}
                    onFaceClick={(faceDetection) => handleFaceClick(faceDetection, camera.id)}
                  />
                </FaceDetectionOverlay>
              )}

              {/* Face Detection Info Panel (Phase 1 Enhancement) */}
              <FaceInfoPanel visible={showFaceInfo[camera.id] && faceDetections.length > 0}>
                <FaceList>
                  {faceDetections.slice(0, 3).map((face, index) => (
                    <FaceItem key={index}>
                      <PersonTypeIndicator
                        personType={face.person_type}
                        personName={face.person_name}
                        confidence={face.confidence}
                        isMatch={face.is_match}
                        accessLevel={face.access_level}
                        alertRecommended={face.alert_recommended}
                        size="small"
                        showConfidence={true}
                        showAccessLevel={true}
                      />
                    </FaceItem>
                  ))}
                  {faceDetections.length > 3 && (
                    <div style={{ fontSize: '10px', color: '#999', textAlign: 'center' }}>
                      +{faceDetections.length - 3} more
                    </div>
                  )}
                </FaceList>
              </FaceInfoPanel>
            </CameraOverlay>
          </CameraContainer>
        );
      })}
      
      {/* Video Source Manager Modals (Master Prompt v54.6) */}
      {Array.from(showVideoSetup.entries()).map(([cameraId, show]) => {
        if (!show) return null;
        
        const camera = cameras.find(c => c.id === cameraId);
        if (!camera) return null;
        
        return (
          <VideoSetupModal key={`setup-${cameraId}`}>
            <VideoSetupContent>
              <VideoSetupHeader>
                <h3>📹 Setup Video Source for {camera.name}</h3>
                <CloseButton onClick={() => setShowVideoSetup(prev => new Map(prev.set(cameraId, false)))}>
                  ❌
                </CloseButton>
              </VideoSetupHeader>
              
              <VideoSourceManager
                onSourceSelected={(source) => setupVideoSource(camera, source)}
                onSourceTested={(source, success) => {
                  console.log(`Video source test for ${camera.name}:`, success ? 'Success' : 'Failed');
                }}
              />
            </VideoSetupContent>
          </VideoSetupModal>
        );
      })}
    </GridContainer>
  );
}

// Additional styled components for video setup modal
const VideoSetupModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing.lg};
`;

const VideoSetupContent = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.lg};
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${props => props.theme.shadows.lg};
`;

const VideoSetupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  h3 {
    margin: 0;
    color: ${props => props.theme.colors.text};
    font-size: ${props => props.theme.typography.fontSize.lg};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: ${props => props.theme.typography.fontSize.lg};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.textMuted};
  
  &:hover {
    color: ${props => props.theme.colors.text};
  }
`;

export default CameraGrid;
