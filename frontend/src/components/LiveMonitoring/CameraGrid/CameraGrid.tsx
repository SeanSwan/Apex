// APEX AI LIVE MONITORING - CAMERA GRID COMPONENT
// Grid layout manager with pagination and dynamic sizing

import React, { memo, useMemo } from 'react';
import styled from 'styled-components';
import { CameraGridProps } from '../types';
import { CameraCard } from './CameraCard';
import { customScrollbar } from '../shared/StyledComponents';

// Styled Components for Camera Grid
const GridContainer = styled.div`
  flex: 1;
  padding: 1rem;
  overflow: hidden;
`;

const Grid = styled.div<{ $layout: string }>`
  display: grid;
  gap: 0.5rem;
  height: 100%;
  overflow-y: auto;
  
  grid-template-columns: ${props => {
    switch(props.$layout) {
      case '4x4': return 'repeat(4, 1fr)';
      case '6x6': return 'repeat(6, 1fr)';
      case '8x8': return 'repeat(8, 1fr)';
      case '10x10': return 'repeat(10, 1fr)';
      case '12x12': return 'repeat(12, 1fr)';
      default: return 'repeat(6, 1fr)';
    }
  }};
  
  ${customScrollbar}
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #666;
  text-align: center;
  
  .icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  .title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #888;
  }
  
  .description {
    font-size: 0.9rem;
    max-width: 400px;
    line-height: 1.5;
  }
`;

// Camera Grid Component
const CameraGrid: React.FC<CameraGridProps> = memo(({
  cameras,
  gridConfig,
  selectedCamera,
  onCameraSelect
}) => {
  // Memoized grid size calculation
  const gridSize = useMemo(() => {
    switch(gridConfig.layout) {
      case '4x4': return 16;
      case '6x6': return 36;
      case '8x8': return 64;
      case '10x10': return 100;
      case '12x12': return 144;
      default: return 36;
    }
  }, [gridConfig.layout]);

  // Memoized visible cameras (limited to grid size)
  const visibleCameras = useMemo(() => {
    return cameras.slice(0, gridSize);
  }, [cameras, gridSize]);

  // Show empty state if no cameras
  if (cameras.length === 0) {
    return (
      <GridContainer>
        <Grid $layout={gridConfig.layout}>
          <EmptyState>
            <div className="icon">📹</div>
            <div className="title">No Cameras Available</div>
            <div className="description">
              No camera feeds are currently available. Check your camera configuration 
              or contact your system administrator.
            </div>
          </EmptyState>
        </Grid>
      </GridContainer>
    );
  }

  return (
    <GridContainer>
      <Grid $layout={gridConfig.layout}>
        {visibleCameras.map((camera) => (
          <CameraCard
            key={camera.camera_id}
            camera={camera}
            isSelected={selectedCamera === camera.camera_id}
            onSelect={onCameraSelect}
            gridLayout={gridConfig.layout}
          />
        ))}
      </Grid>
    </GridContainer>
  );
});

CameraGrid.displayName = 'CameraGrid';

export { CameraGrid };
