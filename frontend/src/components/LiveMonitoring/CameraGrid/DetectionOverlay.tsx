// APEX AI LIVE MONITORING - DETECTION OVERLAY COMPONENT
// AI and face detection bounding box overlays for camera feeds

import React, { memo } from 'react';
import styled from 'styled-components';
import { DetectionOverlayProps, AIDetection, FaceDetection } from '../types';

// Styled Components for Detection Overlays
const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
`;

const DetectionBox = styled.div<{ 
  x: number; 
  y: number; 
  width: number; 
  height: number; 
  type: string; 
  confidence: number;
  isSelected?: boolean;
}>`
  position: absolute;
  left: ${props => props.x * 100}%;
  top: ${props => props.y * 100}%;
  width: ${props => props.width * 100}%;
  height: ${props => props.height * 100}%;
  border: 2px solid ${props => {
    switch(props.type) {
      case 'person': return '#22C55E';
      case 'face': return '#3B82F6';
      case 'weapon': return '#EF4444';
      case 'vehicle': return '#F59E0B';
      case 'package': return '#9333EA';
      case 'animal': return '#EC4899';
      default: return '#9333EA';
    }
  }};
  border-radius: 4px;
  ${props => props.isSelected && 'box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);'}
  
  &::after {
    content: '${props => props.type}: ${props => Math.round(props.confidence * 100)}%';
    position: absolute;
    top: -20px;
    left: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.6rem;
    white-space: nowrap;
    font-weight: 500;
  }
`;

// Detection Overlay Component
const DetectionOverlay: React.FC<DetectionOverlayProps> = memo(({
  aiDetections = [],
  faceDetections = [],
  isSelected = false
}) => {
  // Don't render if no detections
  if (!aiDetections.length && !faceDetections.length) {
    return null;
  }

  return (
    <OverlayContainer>
      {/* AI Detection Boxes */}
      {aiDetections.map((detection: AIDetection, index: number) => (
        <DetectionBox
          key={`ai_${detection.detection_id}_${index}`}
          x={detection.bounding_box.x}
          y={detection.bounding_box.y}
          width={detection.bounding_box.width}
          height={detection.bounding_box.height}
          type={detection.detection_type}
          confidence={detection.confidence}
          isSelected={isSelected}
        />
      ))}
      
      {/* Face Detection Boxes */}
      {faceDetections.map((detection: FaceDetection, index: number) => (
        <DetectionBox
          key={`face_${detection.face_id}_${index}`}
          x={detection.bounding_box.x}
          y={detection.bounding_box.y}
          width={detection.bounding_box.width}
          height={detection.bounding_box.height}
          type={detection.name ? `face: ${detection.name}` : 'face: unknown'}
          confidence={detection.confidence}
          isSelected={isSelected}
        />
      ))}
    </OverlayContainer>
  );
});

DetectionOverlay.displayName = 'DetectionOverlay';

export { DetectionOverlay };
