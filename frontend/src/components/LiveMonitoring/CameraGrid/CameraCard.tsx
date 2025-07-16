// APEX AI LIVE MONITORING - CAMERA CARD COMPONENT
// Individual camera display with video stream, overlays, and controls

import React, { memo, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Camera, 
  Volume2, 
  Maximize2, 
  Target 
} from 'lucide-react';
import { Button } from '../../ui/button';
import { CameraCardProps } from '../types';
import { StatusBadge, LoadingSpinner, alertGlow } from '../shared/StyledComponents';
import { DetectionOverlay } from './DetectionOverlay';

// Styled Components for Camera Card
const CameraContainer = styled.div<{ 
  $alertLevel?: string; 
  $isSelected?: boolean;
  $hasFaceDetection?: boolean;
}>`
  position: relative;
  background: rgba(30, 30, 30, 0.9);
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16/9;
  transition: all 0.3s ease;
  cursor: pointer;
  
  border: 2px solid ${props => {
    if (props.$alertLevel === 'critical') return '#EF4444';
    if (props.$alertLevel === 'high') return '#F59E0B';
    if (props.$alertLevel === 'medium') return '#3B82F6';
    if (props.$hasFaceDetection) return '#10B981';
    if (props.$isSelected) return '#FFD700';
    return 'rgba(255, 215, 0, 0.3)';
  }};
  
  ${props => props.$alertLevel === 'critical' && `
    animation: ${alertGlow} 2s infinite;
  `}
  
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    z-index: 10;
    
    .camera-controls {
      opacity: 1;
    }
  }
`;

const CameraHeader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%);
  padding: 0.5rem;
  z-index: 2;
`;

const CameraInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 0.75rem;
  
  .camera-details {
    .name {
      font-weight: 600;
      color: #FFD700;
      margin-bottom: 0.125rem;
    }
    
    .location {
      font-size: 0.7rem;
      color: #B0B0B0;
    }
  }
`;

const CameraControls = styled.div`
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  .control-btn {
    padding: 0.25rem;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 4px;
    color: #FFD700;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    
    &:hover {
      background: rgba(255, 215, 0, 0.2);
      border-color: #FFD700;
    }
  }
`;

const StatusBadges = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
`;

const VideoFrame = styled.div`
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PlaceholderContent = styled.div`
  color: #666;
  text-align: center;
  font-size: 0.8rem;
  
  .icon {
    margin-bottom: 0.5rem;
  }
  
  .property-name {
    font-size: 0.7rem;
    margin-top: 0.25rem;
    color: #888;
  }
`;

const LoadingContent = styled.div`
  color: #FFD700;
  text-align: center;
  font-size: 0.8rem;
`;

// Main Camera Card Component
const CameraCard: React.FC<CameraCardProps> = memo(({
  camera,
  isSelected,
  onSelect,
  gridLayout
}) => {
  // Memoized event handlers
  const handleClick = useCallback(() => {
    onSelect(camera.camera_id);
  }, [camera.camera_id, onSelect]);

  const handleZoom = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Zoom clicked for camera:', camera.camera_id);
    // Implement zoom functionality
  }, [camera.camera_id]);

  const handleAudio = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Audio clicked for camera:', camera.camera_id);
    // Implement audio toggle functionality
  }, [camera.camera_id]);

  const handleFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Fullscreen clicked for camera:', camera.camera_id);
    // Implement fullscreen functionality
  }, [camera.camera_id]);

  // Determine alert level from AI detections
  const alertLevel = camera.ai_detections?.[0]?.alert_level;
  const hasFaceDetection = !!(camera.face_detections && camera.face_detections.length > 0);

  // Render video content based on camera status
  const renderVideoContent = () => {
    switch (camera.status) {
      case 'loading':
        return (
          <LoadingContent>
            <LoadingSpinner />
            Connecting...
          </LoadingContent>
        );
        
      case 'online':
        return (
          <>
            {camera.stream_url ? (
              <video
                src={camera.stream_url}
                autoPlay
                muted
                playsInline
              />
            ) : (
              <PlaceholderContent>
                <div className="icon">
                  <Camera size={24} color="#666" />
                </div>
                <div>Live: {camera.name}</div>
                <div className="property-name">
                  {camera.property_name}
                </div>
              </PlaceholderContent>
            )}
            
            {/* AI Detection Overlays */}
            <DetectionOverlay
              aiDetections={camera.ai_detections}
              faceDetections={camera.face_detections}
              isSelected={isSelected}
            />
          </>
        );
        
      default:
        return (
          <PlaceholderContent>
            <div className="icon">
              <Camera size={24} color="#666" />
            </div>
            <div>Camera Offline</div>
            <div className="property-name">
              {camera.location}
            </div>
          </PlaceholderContent>
        );
    }
  };

  return (
    <CameraContainer
      $alertLevel={alertLevel}
      $isSelected={isSelected}
      $hasFaceDetection={hasFaceDetection}
      onClick={handleClick}
    >
      <CameraHeader>
        <CameraInfo>
          <div className="camera-details">
            <div className="name">{camera.name}</div>
            <div className="location">{camera.location}</div>
          </div>
          
          <CameraControls className="camera-controls">
            {camera.capabilities.supports_zoom && (
              <button className="control-btn" onClick={handleZoom}>
                <Target size={12} />
              </button>
            )}
            {camera.capabilities.supports_audio && (
              <button className="control-btn" onClick={handleAudio}>
                <Volume2 size={12} />
              </button>
            )}
            <button className="control-btn" onClick={handleFullscreen}>
              <Maximize2 size={12} />
            </button>
          </CameraControls>
        </CameraInfo>
        
        <StatusBadges>
          {camera.ai_detections && camera.ai_detections.length > 0 && (
            <StatusBadge $type="ai">AI Detect</StatusBadge>
          )}
          {camera.face_detections && camera.face_detections.length > 0 && (
            <StatusBadge $type="face">Face ID</StatusBadge>
          )}
          {camera.priority >= 8 && (
            <StatusBadge $type="priority">Priority</StatusBadge>
          )}
          {camera.status === 'online' && (
            <StatusBadge $type="recording">REC</StatusBadge>
          )}
        </StatusBadges>
      </CameraHeader>

      <VideoFrame>
        {renderVideoContent()}
      </VideoFrame>
    </CameraContainer>
  );
});

CameraCard.displayName = 'CameraCard';

export { CameraCard };
