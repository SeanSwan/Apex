// APEX AI LIVE MONITORING - ENHANCED CAMERA GRID COMPONENT
// Grid layout manager with interactive setup and stream testing capabilities

import React, { memo, useMemo, useState, useCallback } from 'react';
import styled from 'styled-components';
import { CameraGridProps } from '../types';
import { CameraCard } from './CameraCard';
import { customScrollbar } from '../shared/StyledComponents';

// Enhanced Styled Components for Camera Grid
const GridContainer = styled.div`
  flex: 1;
  padding: 1rem;
  overflow: hidden;
  position: relative;
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

// Enhanced Empty State with Interactive Setup
const EmptyState = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #666;
  text-align: center;
  min-height: 400px;
  
  .icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    opacity: 0.7;
    background: linear-gradient(135deg, #00ff88, #0080ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #fff;
  }
  
  .description {
    font-size: 1rem;
    max-width: 500px;
    line-height: 1.6;
    margin-bottom: 2rem;
    color: #ccc;
  }
`;

// Interactive Setup Panel
const SetupPanel = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  backdrop-filter: blur(10px);
  
  .setup-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .setup-description {
    color: #ccc;
    margin-bottom: 2rem;
    text-align: center;
    font-size: 0.9rem;
    line-height: 1.5;
  }
`;

// Quick Setup Options Grid
const QuickSetupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const SetupOption = styled.button<{ $variant?: 'primary' | 'secondary' | 'demo' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  border: 2px solid ${props => {
    switch(props.$variant) {
      case 'primary': return '#00ff88';
      case 'demo': return '#0080ff';
      default: return 'rgba(255, 255, 255, 0.2)';
    }
  }};
  border-radius: 8px;
  background: ${props => {
    switch(props.$variant) {
      case 'primary': return 'rgba(0, 255, 136, 0.1)';
      case 'demo': return 'rgba(0, 128, 255, 0.1)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  
  &:hover {
    background: ${props => {
      switch(props.$variant) {
        case 'primary': return 'rgba(0, 255, 136, 0.2)';
        case 'demo': return 'rgba(0, 128, 255, 0.2)';
        default: return 'rgba(255, 255, 255, 0.1)';
      }
    }};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
  
  .setup-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
  
  .setup-label {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  .setup-desc {
    font-size: 0.8rem;
    color: #ccc;
    text-align: center;
    line-height: 1.4;
  }
`;

// Demo Setup Actions
const DemoActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$variant === 'primary' ? `
    background: linear-gradient(135deg, #00ff88, #00cc6a);
    color: #000;
    
    &:hover {
      background: linear-gradient(135deg, #00cc6a, #00aa55);
      transform: translateY(-1px);
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `}
`;

// Quick Test Stream Component
const QuickTestStream = styled.div`
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  
  .test-title {
    color: #00ff88;
    font-weight: 600;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }
  
  .test-description {
    color: #ccc;
    font-size: 0.8rem;
    margin-bottom: 1rem;
    line-height: 1.4;
  }
  
  .test-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
`;

const TestButton = styled.button<{ $active?: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.$active ? '#00ff88' : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 4px;
  background: ${props => props.$active ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  color: ${props => props.$active ? '#00ff88' : '#ccc'};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 255, 136, 0.1);
    border-color: #00ff88;
    color: #00ff88;
  }
`;

// Enhanced Camera Grid Component
const CameraGrid: React.FC<CameraGridProps & {
  onQuickSetup?: (setupType: string) => void;
  onTestStream?: (streamType: string) => void;
}> = memo(({
  cameras,
  gridConfig,
  selectedCamera,
  onCameraSelect,
  onQuickSetup,
  onTestStream
}) => {
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [testingStream, setTestingStream] = useState<string | null>(null);

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

  // Quick setup handlers
  const handleQuickSetup = useCallback((setupType: string) => {
    onQuickSetup?.(setupType);
    setShowQuickSetup(false);
  }, [onQuickSetup]);

  const handleTestStream = useCallback(async (streamType: string) => {
    setTestingStream(streamType);
    onTestStream?.(streamType);
    
    // Simulate test duration
    setTimeout(() => {
      setTestingStream(null);
    }, 3000);
  }, [onTestStream]);

  // Show enhanced empty state if no cameras
  if (cameras.length === 0) {
    return (
      <GridContainer>
        <Grid $layout={gridConfig.layout}>
          <EmptyState>
            <div className="icon">🎥</div>
            <div className="title">Ready to Start Monitoring</div>
            <div className="description">
              Get started with live video monitoring in seconds. Choose from demo cameras,
              connect your own streams, or test with sample video feeds.
            </div>
            
            {!showQuickSetup ? (
              <DemoActions>
                <ActionButton 
                  $variant="primary" 
                  onClick={() => handleQuickSetup('demo')}
                >
                  🚀 Load Demo Cameras
                </ActionButton>
                <ActionButton onClick={() => setShowQuickSetup(true)}>
                  ⚙️ Setup Video Sources
                </ActionButton>
              </DemoActions>
            ) : (
              <SetupPanel>
                <div className="setup-title">Quick Video Setup</div>
                <div className="setup-description">
                  Choose how you'd like to start monitoring. All options include 
                  real-time AI detection and professional monitoring tools.
                </div>
                
                <QuickSetupGrid>
                  <SetupOption 
                    $variant="demo"
                    onClick={() => handleQuickSetup('demo')}
                  >
                    <div className="setup-icon">📊</div>
                    <div className="setup-label">Demo Cameras</div>
                    <div className="setup-desc">
                      Load sample camera feeds with simulated activity for testing
                    </div>
                  </SetupOption>
                  
                  <SetupOption 
                    $variant="primary"
                    onClick={() => handleQuickSetup('screen')}
                  >
                    <div className="setup-icon">🖥️</div>
                    <div className="setup-label">Screen Capture</div>
                    <div className="setup-desc">
                      Monitor your desktop or specific applications
                    </div>
                  </SetupOption>
                  
                  <SetupOption onClick={() => handleQuickSetup('rtsp')}>
                    <div className="setup-icon">📡</div>
                    <div className="setup-label">IP Camera</div>
                    <div className="setup-desc">
                      Connect network cameras via RTSP streams
                    </div>
                  </SetupOption>
                  
                  <SetupOption onClick={() => handleQuickSetup('webcam')}>
                    <div className="setup-icon">📹</div>
                    <div className="setup-label">Webcam</div>
                    <div className="setup-desc">
                      Use built-in or USB cameras for monitoring
                    </div>
                  </SetupOption>
                </QuickSetupGrid>
                
                <QuickTestStream>
                  <div className="test-title">🧪 Quick Stream Tests</div>
                  <div className="test-description">
                    Test different stream types instantly without full setup
                  </div>
                  <div className="test-actions">
                    <TestButton 
                      $active={testingStream === 'demo_feed'}
                      onClick={() => handleTestStream('demo_feed')}
                      disabled={testingStream === 'demo_feed'}
                    >
                      {testingStream === 'demo_feed' ? '🔄 Testing...' : '📺 Test Demo Feed'}
                    </TestButton>
                    <TestButton 
                      $active={testingStream === 'screen_test'}
                      onClick={() => handleTestStream('screen_test')}
                      disabled={testingStream === 'screen_test'}
                    >
                      {testingStream === 'screen_test' ? '🔄 Testing...' : '🖥️ Test Screen Capture'}
                    </TestButton>
                    <TestButton 
                      $active={testingStream === 'webcam_test'}
                      onClick={() => handleTestStream('webcam_test')}
                      disabled={testingStream === 'webcam_test'}
                    >
                      {testingStream === 'webcam_test' ? '🔄 Testing...' : '📹 Test Webcam'}
                    </TestButton>
                  </div>
                </QuickTestStream>
                
                <DemoActions style={{ marginTop: '1.5rem' }}>
                  <ActionButton onClick={() => setShowQuickSetup(false)}>
                    ← Back
                  </ActionButton>
                  <ActionButton $variant="primary" onClick={() => handleQuickSetup('demo')}>
                    🚀 Start with Demo
                  </ActionButton>
                </DemoActions>
              </SetupPanel>
            )}
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
