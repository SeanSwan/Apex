/**
 * STATUS BAR COMPONENT
 * ===================
 * Bottom status bar showing system health, AI engine status, and quick info
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const StatusBarContainer = styled.div`
  width: 100%;
  height: 32px;
  background-color: ${props => props.theme.colors.backgroundLight};
  border-top: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.textSecondary};
  position: relative;
  z-index: 1000;
`;

const StatusSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  padding: 2px 4px;
  border-radius: 2px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.clickable ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  }
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.status) {
      case 'connected': 
      case 'active': 
      case 'running': return props.theme.colors.success;
      case 'connecting': 
      case 'loading': return props.theme.colors.warning;
      case 'disconnected': 
      case 'error': 
      case 'stopped': return props.theme.colors.error;
      default: return props.theme.colors.textMuted;
    }
  }};
  animation: ${props => {
    if (props.status === 'connecting' || props.status === 'loading') {
      return 'pulse 1.5s ease-in-out infinite';
    }
    return 'none';
  }};

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const AppVersion = styled.div`
  color: ${props => props.theme.colors.textMuted};
  font-size: 10px;
`;

const MemoryUsage = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${props => props.theme.colors.textMuted};
`;

const MemoryBar = styled.div`
  width: 40px;
  height: 4px;
  background-color: ${props => props.theme.colors.border};
  border-radius: 2px;
  overflow: hidden;
`;

const MemoryFill = styled.div`
  height: 100%;
  background-color: ${props => {
    if (props.percentage > 80) return props.theme.colors.error;
    if (props.percentage > 60) return props.theme.colors.warning;
    return props.theme.colors.success;
  }};
  width: ${props => props.percentage}%;
  transition: all 0.3s ease;
`;

const TimeDisplay = styled.div`
  font-family: 'Courier New', monospace;
  color: ${props => props.theme.colors.textSecondary};
`;

function StatusBar({ appInfo, aiEngineStatus }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [detectionCount, setDetectionCount] = useState(0);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulate memory usage monitoring
  useEffect(() => {
    const updateMemory = () => {
      // In a real app, you'd get actual memory usage
      setMemoryUsage(45 + Math.random() * 30); // 45-75% range
    };

    updateMemory();
    const timer = setInterval(updateMemory, 5000);
    return () => clearInterval(timer);
  }, []);

  // Simulate detection counter
  useEffect(() => {
    if (aiEngineStatus === 'connected') {
      const timer = setInterval(() => {
        setDetectionCount(prev => prev + Math.floor(Math.random() * 3));
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [aiEngineStatus]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getAIStatusText = () => {
    switch (aiEngineStatus) {
      case 'connected': return 'AI Online';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'AI Offline';
      default: return 'AI Unknown';
    }
  };

  const getDatabaseStatus = () => {
    // In a real app, you'd check actual database connectivity
    return appInfo?.pythonAIEngineRunning ? 'connected' : 'disconnected';
  };

  const getStreamingStatus = () => {
    // In a real app, you'd check streaming server status
    return appInfo?.wsServerRunning ? 'active' : 'stopped';
  };

  return (
    <StatusBarContainer>
      <StatusSection>
        {/* AI Engine Status */}
        <StatusItem clickable>
          <StatusDot status={aiEngineStatus} />
          <span>{getAIStatusText()}</span>
        </StatusItem>

        {/* Database Status */}
        <StatusItem>
          <StatusDot status={getDatabaseStatus()} />
          <span>Database</span>
        </StatusItem>

        {/* Streaming Status */}
        <StatusItem>
          <StatusDot status={getStreamingStatus()} />
          <span>Streaming</span>
        </StatusItem>

        {/* Detection Counter */}
        {aiEngineStatus === 'connected' && (
          <StatusItem>
            <span>🎯</span>
            <span>{detectionCount} detections</span>
          </StatusItem>
        )}
      </StatusSection>

      <StatusSection>
        {/* Memory Usage */}
        <StatusItem>
          <MemoryUsage>
            <span>Memory:</span>
            <MemoryBar>
              <MemoryFill percentage={memoryUsage} />
            </MemoryBar>
            <span>{Math.round(memoryUsage)}%</span>
          </MemoryUsage>
        </StatusItem>

        {/* App Version */}
        {appInfo && (
          <StatusItem>
            <AppVersion>
              v{appInfo.version} • {appInfo.platform}
            </AppVersion>
          </StatusItem>
        )}

        {/* Current Time */}
        <StatusItem>
          <TimeDisplay>
            {formatTime(currentTime)}
          </TimeDisplay>
        </StatusItem>
      </StatusSection>
    </StatusBarContainer>
  );
}

export default StatusBar;
