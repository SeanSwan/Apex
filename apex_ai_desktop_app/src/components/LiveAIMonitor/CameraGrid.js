/**
 * CAMERA GRID COMPONENT
 * ====================
 * Displays multiple video streams with AI detection overlays
 * Supports grid view, focus view, and investigation modes
 */

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

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
  font-weight: ${props => props.theme.typography.fontWeight.medium};
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

function CameraGrid({ cameras, viewMode, focusedCamera, detections, onCameraFocus }) {
  const [loadedVideos, setLoadedVideos] = useState(new Set());
  const [videoErrors, setVideoErrors] = useState(new Set());
  const videoRefs = useRef({});

  // Filter cameras based on view mode
  const displayCameras = viewMode === 'focus' && focusedCamera 
    ? [focusedCamera] 
    : cameras;

  // Get detections for a specific camera
  const getCameraDetections = (cameraId) => {
    return detections
      .filter(detection => detection.camera_id === cameraId)
      .slice(0, 10); // Show only recent detections
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
        const hasAlert = cameraDetections.some(d => 
          d.threat_level === 'threat' || d.alert_type === 'high_priority'
        );
        const isLoaded = loadedVideos.has(camera.id);
        const hasError = videoErrors.has(camera.id);
        const isFocused = focusedCamera?.id === camera.id;

        return (
          <CameraContainer
            key={camera.id}
            focused={isFocused}
            hasAlert={hasAlert}
            viewMode={viewMode}
            onClick={() => onCameraFocus && onCameraFocus(camera)}
          >
            {/* Video Stream */}
            {!hasError ? (
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

            {/* Placeholder for loading/error states */}
            {(!isLoaded || hasError) && (
              <VideoPlaceholder>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  {hasError ? '⚠️' : '📹'}
                </div>
                <div>{camera.name}</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  {hasError ? 'Connection Error' : 'Connecting...'}
                </div>
              </VideoPlaceholder>
            )}

            {/* Camera Overlay */}
            <CameraOverlay>
              <CameraInfo>
                {camera.name}
              </CameraInfo>
              
              <StatusIndicator status={camera.status} />

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
            </CameraOverlay>
          </CameraContainer>
        );
      })}
    </GridContainer>
  );
}

export default CameraGrid;
