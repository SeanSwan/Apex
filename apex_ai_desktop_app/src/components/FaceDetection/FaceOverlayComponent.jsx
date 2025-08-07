/**
 * FACE OVERLAY COMPONENT
 * ======================
 * Real-time face detection overlay for video feeds
 * Displays face bounding boxes, person identification, and status indicators
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
`;

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const FaceOverlayComponent = ({ 
  faceDetections = [], 
  frameSize = { width: 1920, height: 1080 }, 
  containerSize = { width: 640, height: 360 },
  overlayConfig = {},
  onFaceClick = null 
}) => {
  const canvasRef = useRef(null);
  const [animationFrame, setAnimationFrame] = useState(null);

  // Default overlay configuration
  const defaultConfig = {
    showBoundingBox: true,
    showPersonName: true,
    showConfidence: true,
    showPersonTypeBadge: true,
    showQualityIndicator: false,
    animateAlerts: true,
    fontFamily: 'Arial, sans-serif',
    fontSize: 14,
    boxThickness: 2,
    ...overlayConfig
  };

  // Person type colors
  const personTypeColors = {
    resident: { primary: '#00FF00', secondary: '#00C800', background: 'rgba(0, 255, 0, 0.2)' },
    staff: { primary: '#FF8000', secondary: '#FF6400', background: 'rgba(255, 128, 0, 0.2)' },
    worker: { primary: '#FFA500', secondary: '#FF8C00', background: 'rgba(255, 165, 0, 0.2)' },
    visitor: { primary: '#FFFF00', secondary: '#E6E600', background: 'rgba(255, 255, 0, 0.2)' },
    contractor: { primary: '#FF8C00', secondary: '#FF7800', background: 'rgba(255, 140, 0, 0.2)' },
    vip: { primary: '#FF00FF', secondary: '#C800C8', background: 'rgba(255, 0, 255, 0.2)' },
    blacklist: { primary: '#FF0000', secondary: '#C80000', background: 'rgba(255, 0, 0, 0.4)' },
    unknown: { primary: '#FF0000', secondary: '#C80000', background: 'rgba(255, 0, 0, 0.3)' }
  };

  // Calculate scale factors
  const scaleX = containerSize.width / frameSize.width;
  const scaleY = containerSize.height / frameSize.height;

  useEffect(() => {
    drawOverlays();
  }, [faceDetections, containerSize, frameSize, defaultConfig]);

  useEffect(() => {
    // Cleanup animation frame on unmount
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [animationFrame]);

  const drawOverlays = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = containerSize.width;
    canvas.height = containerSize.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each face detection
    faceDetections.forEach((detection, index) => {
      drawFaceDetection(ctx, detection, index);
    });
  };

  const drawFaceDetection = (ctx, detection, index) => {
    const { face_location, person_name, person_type, confidence, is_match, alert_recommended, face_quality_score } = detection;
    
    if (!face_location) return;

    // Scale coordinates to container size
    const x = face_location.left * scaleX;
    const y = face_location.top * scaleY;
    const width = (face_location.right - face_location.left) * scaleX;
    const height = (face_location.bottom - face_location.top) * scaleY;

    // Get colors for person type
    const colors = personTypeColors[person_type] || personTypeColors.unknown;
    
    // Adjust thickness for alerts
    const boxThickness = defaultConfig.boxThickness + (alert_recommended ? 2 : 0);
    
    // Draw bounding box
    if (defaultConfig.showBoundingBox) {
      drawBoundingBox(ctx, x, y, width, height, colors, boxThickness, alert_recommended);
    }

    // Draw person type badge
    if (defaultConfig.showPersonTypeBadge) {
      drawPersonTypeBadge(ctx, x + width - 20, y + 20, person_type, colors);
    }

    // Draw name and confidence label
    if (defaultConfig.showPersonName || defaultConfig.showConfidence) {
      drawFaceLabel(ctx, x, y - 10, person_name, confidence, is_match, colors);
    }

    // Draw quality indicator for low-quality faces
    if (defaultConfig.showQualityIndicator && face_quality_score < 0.7) {
      drawQualityIndicator(ctx, x, y + height + 5, face_quality_score);
    }

    // Draw alert animation if needed
    if (alert_recommended && defaultConfig.animateAlerts) {
      drawAlertAnimation(ctx, x, y, width, height, colors);
    }
  };

  const drawBoundingBox = (ctx, x, y, width, height, colors, thickness, isAlert) => {
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = thickness;
    ctx.setLineDash([]);
    
    // Draw main bounding box
    ctx.strokeRect(x, y, width, height);
    
    // Draw alert border if needed
    if (isAlert) {
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x - 3, y - 3, width + 6, height + 6);
      ctx.setLineDash([]);
    }
  };

  const drawPersonTypeBadge = (ctx, x, y, personType, colors) => {
    const badgeSymbols = {
      resident: 'R',
      staff: 'S',
      worker: 'W',
      visitor: 'V',
      contractor: 'C',
      vip: '★',
      blacklist: '!',
      unknown: '?'
    };

    const symbol = badgeSymbols[personType] || '?';
    const radius = 12;

    // Draw badge background circle
    ctx.fillStyle = colors.secondary;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Draw badge border
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw symbol
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, x, y);
  };

  const drawFaceLabel = (ctx, x, y, personName, confidence, isMatch, colors) => {
    // Prepare label text
    let labelText;
    if (isMatch) {
      if (defaultConfig.showConfidence) {
        labelText = `${personName} (${(confidence * 100).toFixed(0)}%)`;
      } else {
        labelText = personName;
      }
    } else {
      labelText = 'Unknown';
    }

    // Set font
    ctx.font = `${defaultConfig.fontSize}px ${defaultConfig.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Measure text
    const textMetrics = ctx.measureText(labelText);
    const textWidth = textMetrics.width;
    const textHeight = defaultConfig.fontSize;

    // Draw background rectangle
    const padding = 4;
    const bgX = x - padding;
    const bgY = y - textHeight - padding * 2;
    const bgWidth = textWidth + padding * 2;
    const bgHeight = textHeight + padding * 2;

    ctx.fillStyle = colors.background;
    ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

    // Draw border
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 1;
    ctx.strokeRect(bgX, bgY, bgWidth, bgHeight);

    // Draw text
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(labelText, x, y - textHeight - padding);
  };

  const drawQualityIndicator = (ctx, x, y, qualityScore) => {
    const barWidth = 30;
    const barHeight = 4;
    const fillWidth = barWidth * qualityScore;

    // Quality color
    let color;
    if (qualityScore < 0.4) {
      color = '#FF0000'; // Red
    } else if (qualityScore < 0.7) {
      color = '#FFFF00'; // Yellow
    } else {
      color = '#00FF00'; // Green
    }

    // Draw background bar
    ctx.fillStyle = '#666666';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Draw quality fill
    if (fillWidth > 0) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, fillWidth, barHeight);
    }

    // Draw quality text
    ctx.fillStyle = color;
    ctx.font = '10px Arial';
    ctx.fillText(`Q: ${qualityScore.toFixed(1)}`, x, y + barHeight + 12);
  };

  const drawAlertAnimation = (ctx, x, y, width, height, colors) => {
    // Simple pulsing alert animation
    const time = Date.now() / 1000;
    const pulseAlpha = 0.3 + 0.3 * Math.sin(time * 4); // Pulse between 0.3 and 0.6

    ctx.fillStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
    ctx.fillRect(x - 5, y - 5, width + 10, height + 10);
  };

  const handleCanvasClick = (event) => {
    if (!onFaceClick) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Check if click is on any face detection
    faceDetections.forEach((detection, index) => {
      const { face_location } = detection;
      if (!face_location) return;

      const x = face_location.left * scaleX;
      const y = face_location.top * scaleY;
      const width = (face_location.right - face_location.left) * scaleX;
      const height = (face_location.bottom - face_location.top) * scaleY;

      if (clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height) {
        onFaceClick(detection, index);
      }
    });
  };

  return (
    <OverlayContainer>
      <Canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ pointerEvents: onFaceClick ? 'auto' : 'none' }}
      />
    </OverlayContainer>
  );
};

export default FaceOverlayComponent;
