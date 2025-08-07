// APEX AI LIVE MONITORING - ALERT PANEL COMPONENT
// Main alert panel container with real-time alert management and WebSocket integration

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { 
  AlertTriangle, 
  Bell, 
  BellOff, 
  Filter, 
  ChevronRight, 
  ChevronDown,
  X,
  Eye 
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { useEnhancedWebSocket, MESSAGE_TYPES } from '../../../hooks/useEnhancedWebSocket';
import { AlertPanelProps, SecurityAlert, AlertFilters } from '../types';
import { ControlButton, Section, customScrollbar } from '../shared/StyledComponents';
import { AlertList } from './AlertList';
import { AlertFilters as AlertFiltersComponent } from './AlertFilters';
import { AlertSounds } from './AlertSounds';

// Styled Components for Alert Panel
const AlertPanelContainer = styled.div<{ $isVisible: boolean; $isCollapsed: boolean }>`
  position: relative;
  width: ${props => props.$isVisible ? (props.$isCollapsed ? '60px' : '400px') : '0px'};
  height: 100%;
  background: rgba(20, 20, 20, 0.95);
  border-left: 1px solid rgba(255, 215, 0, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;
  backdrop-filter: blur(10px);
  
  ${props => !props.$isVisible && 'border: none;'}
`;

const AlertHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 215, 0, 0.1);
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  min-height: 60px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AlertTitle = styled.h3`
  margin: 0;
  color: #FFD700;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AlertCounter = styled.span<{ $severity: 'low' | 'medium' | 'high' | 'critical' }>`
  background: ${props => {
    switch(props.$severity) {
      case 'critical': return 'rgba(239, 68, 68, 0.2)';
      case 'high': return 'rgba(245, 158, 11, 0.2)';
      case 'medium': return 'rgba(59, 130, 246, 0.2)';
      case 'low': return 'rgba(34, 197, 94, 0.2)';
      default: return 'rgba(107, 114, 128, 0.2)';
    }
  }};
  color: ${props => {
    switch(props.$severity) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#22C55E';
      default: return '#6B7280';
    }
  }};
  border: 1px solid ${props => {
    switch(props.$severity) {
      case 'critical': return 'rgba(239, 68, 68, 0.3)';
      case 'high': return 'rgba(245, 158, 11, 0.3)';
      case 'medium': return 'rgba(59, 130, 246, 0.3)';
      case 'low': return 'rgba(34, 197, 94, 0.3)';
      default: return 'rgba(107, 114, 128, 0.3)';
    }
  }};
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
`;

const AlertContent = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 120px);
  overflow: hidden;
`;

const FiltersSection = styled.div<{ $isExpanded: boolean }>`
  max-height: ${props => props.$isExpanded ? '200px' : '0px'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  border-bottom: ${props => props.$isExpanded ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'};
`;

const AlertListSection = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ToggleButton = styled.button`
  position: absolute;
  top: 50%;
  left: -12px;
  transform: translateY(-50%);
  width: 24px;
  height: 48px;
  background: rgba(255, 215, 0, 0.9);
  border: none;
  border-radius: 12px 0 0 12px;
  color: #000;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #FFD700;
    left: -8px;
  }
`;

const CollapseButton = styled(ControlButton)`
  padding: 0.25rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  color: #666;
  text-align: center;
  flex: 1;
  
  .icon {
    font-size: 2rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  .title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #888;
  }
  
  .description {
    font-size: 0.8rem;
    line-height: 1.4;
    max-width: 280px;
  }
`;

// Alert Panel Component
const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts,
  cameras,
  properties,
  selectedCamera,
  onCameraSelect,
  onAlertAcknowledge,
  onAlertDismiss,
  isVisible,
  onToggleVisibility
}) => {
  const { toast } = useToast();
  const websocket = useEnhancedWebSocket();
  
  // State management
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [volume, setVolume] = useState(70);
  const [filters, setFilters] = useState<AlertFilters>({
    alertType: 'all',
    severity: 'all',
    status: 'all',
    camera: 'all',
    property: 'all',
    timeRange: '24h'
  });

  // Refs for WebSocket handlers
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // WebSocket message handlers for alerts - using refs for stability
  const handleNewAlert = useRef((data: any) => {
    const { type, camera_id, severity, alert_data } = data;
    
    // Show toast notification for critical/high alerts
    if (severity === 'critical' || severity === 'high') {
      toastRef.current({
        title: `🚨 ${type.replace('_', ' ').toUpperCase()}`,
        description: `Alert on ${alert_data?.location || camera_id}`,
        variant: severity === 'critical' ? 'destructive' : 'default'
      });
    }
    
    console.log(`🚨 New ${type} alert (${severity}) on camera ${camera_id}`);
  });

  const handleAlertUpdate = useRef((data: any) => {
    const { alert_id, status } = data;
    console.log(`📝 Alert ${alert_id} status updated to ${status}`);
  });

  // Setup WebSocket handlers
  useEffect(() => {
    websocket.onMessage(MESSAGE_TYPES.ALERT_TRIGGERED, handleNewAlert.current);
    websocket.onMessage('alert_status_update', handleAlertUpdate.current);
    
    return () => {
      websocket.offMessage(MESSAGE_TYPES.ALERT_TRIGGERED);
      websocket.offMessage('alert_status_update');
    };
  }, [websocket]);

  // Filter alerts based on current filters
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // Filter by alert type
      if (filters.alertType !== 'all' && alert.alert_type !== filters.alertType) {
        return false;
      }
      
      // Filter by severity
      if (filters.severity !== 'all' && alert.severity !== filters.severity) {
        return false;
      }
      
      // Filter by status
      if (filters.status !== 'all' && alert.status !== filters.status) {
        return false;
      }
      
      // Filter by camera
      if (filters.camera !== 'all' && alert.camera_id !== filters.camera) {
        return false;
      }
      
      // Filter by property
      if (filters.property !== 'all' && !cameras.find(c => c.camera_id === alert.camera_id && c.property_id === filters.property)) {
        return false;
      }
      
      // Filter by time range
      if (filters.timeRange !== 'all') {
        const alertTime = new Date(alert.timestamp).getTime();
        const now = Date.now();
        const timeRanges = {
          '1h': 1000 * 60 * 60,
          '6h': 1000 * 60 * 60 * 6,
          '24h': 1000 * 60 * 60 * 24,
          '7d': 1000 * 60 * 60 * 24 * 7
        };
        
        const range = timeRanges[filters.timeRange as keyof typeof timeRanges];
        if (now - alertTime > range) {
          return false;
        }
      }
      
      return true;
    });
  }, [alerts, filters, cameras]);

  // Alert statistics
  const alertStats = useMemo(() => {
    const stats = {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
      active: alerts.filter(a => a.status === 'active').length
    };
    return stats;
  }, [alerts]);

  // Event handlers
  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const handleToggleFilters = useCallback(() => {
    setFiltersExpanded(prev => !prev);
  }, []);

  const handleAlertSelect = useCallback((alert: SecurityAlert) => {
    setSelectedAlertId(alert.alert_id);
    // Focus camera when alert is selected
    onCameraSelect(alert.camera_id);
  }, [onCameraSelect]);

  const handleSoundsToggle = useCallback(() => {
    setSoundsEnabled(prev => !prev);
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
  }, []);

  // Get current alert for sound notifications
  const currentAlert = useMemo(() => {
    return alerts.find(a => a.status === 'active' && (a.severity === 'critical' || a.severity === 'high'));
  }, [alerts]);

  if (!isVisible) {
    return (
      <ToggleButton onClick={onToggleVisibility}>
        <ChevronRight size={14} />
      </ToggleButton>
    );
  }

  return (
    <AlertPanelContainer $isVisible={isVisible} $isCollapsed={isCollapsed}>
      <ToggleButton onClick={onToggleVisibility}>
        <X size={14} />
      </ToggleButton>
      
      {!isCollapsed && (
        <>
          <AlertHeader>
            <HeaderLeft>
              <AlertTriangle size={20} color="#FFD700" />
              <AlertTitle>
                Security Alerts
                {alertStats.active > 0 && (
                  <AlertCounter $severity="critical">
                    {alertStats.active}
                  </AlertCounter>
                )}
              </AlertTitle>
            </HeaderLeft>
            
            <HeaderRight>
              <ControlButton
                $active={filtersExpanded}
                onClick={handleToggleFilters}
              >
                <Filter size={14} />
              </ControlButton>
              
              <AlertSounds
                isEnabled={soundsEnabled}
                volume={volume}
                onToggle={handleSoundsToggle}
                onVolumeChange={handleVolumeChange}
                currentAlert={currentAlert}
              />
              
              <CollapseButton onClick={handleToggleCollapse}>
                <ChevronRight size={14} />
              </CollapseButton>
            </HeaderRight>
          </AlertHeader>

          <AlertContent>
            <FiltersSection $isExpanded={filtersExpanded}>
              <AlertFiltersComponent
                filters={filters}
                properties={properties}
                cameras={cameras}
                onFiltersChange={setFilters}
                totalAlerts={alerts.length}
                filteredCount={filteredAlerts.length}
              />
            </FiltersSection>

            <AlertListSection>
              {filteredAlerts.length > 0 ? (
                <AlertList
                  alerts={filteredAlerts}
                  cameras={cameras}
                  onAlertSelect={handleAlertSelect}
                  onAlertAcknowledge={onAlertAcknowledge}
                  onAlertDismiss={onAlertDismiss}
                  selectedAlertId={selectedAlertId}
                />
              ) : (
                <EmptyState>
                  <div className="icon">
                    {filters.alertType !== 'all' || filters.severity !== 'all' || filters.status !== 'all' ? (
                      <Filter />
                    ) : (
                      <Bell />
                    )}
                  </div>
                  <div className="title">
                    {filters.alertType !== 'all' || filters.severity !== 'all' || filters.status !== 'all' 
                      ? 'No Matching Alerts' 
                      : 'No Active Alerts'
                    }
                  </div>
                  <div className="description">
                    {filters.alertType !== 'all' || filters.severity !== 'all' || filters.status !== 'all' 
                      ? 'No alerts match the current filter criteria. Try adjusting your filters.'
                      : 'All systems are operating normally. New alerts will appear here automatically.'
                    }
                  </div>
                </EmptyState>
              )}
            </AlertListSection>
          </AlertContent>
        </>
      )}
      
      {isCollapsed && (
        <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <ControlButton onClick={handleToggleCollapse}>
            <ChevronDown size={16} />
          </ControlButton>
          {alertStats.active > 0 && (
            <AlertCounter $severity="critical" style={{ transform: 'rotate(-90deg)' }}>
              {alertStats.active}
            </AlertCounter>
          )}
          <ControlButton onClick={handleSoundsToggle}>
            {soundsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
          </ControlButton>
        </div>
      )}
    </AlertPanelContainer>
  );
};

export { AlertPanel };
