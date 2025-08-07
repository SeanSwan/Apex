// APEX AI LIVE MONITORING - ALERT LIST COMPONENT
// Scrollable list of security alerts with real-time updates

import React, { memo, useMemo } from 'react';
import styled from 'styled-components';
import { AlertListProps } from '../types';
import { customScrollbar } from '../shared/StyledComponents';
import { AlertCard } from './AlertCard';

// Styled Components for Alert List
const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  ${customScrollbar}
`;

const AlertListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.8rem;
  color: #B0B0B0;
  font-weight: 500;
`;

const SortInfo = styled.div`
  font-size: 0.7rem;
  color: #666;
`;

const AlertCount = styled.div`
  font-size: 0.7rem;
  color: #888;
`;

// Alert List Component
const AlertList: React.FC<AlertListProps> = memo(({
  alerts,
  cameras,
  onAlertSelect,
  onAlertAcknowledge,
  onAlertDismiss,
  selectedAlertId
}) => {
  // Sort alerts by priority: critical > high > medium > low, then by timestamp (newest first)
  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      // First sort by status (active alerts first)
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      
      // Then by severity
      const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      // Finally by timestamp (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [alerts]);

  // Get camera data for each alert
  const alertsWithCameras = useMemo(() => {
    return sortedAlerts.map(alert => ({
      alert,
      camera: cameras.find(c => c.camera_id === alert.camera_id)
    }));
  }, [sortedAlerts, cameras]);

  // Alert statistics for header
  const alertStats = useMemo(() => {
    const activeCount = alerts.filter(a => a.status === 'active').length;
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const highCount = alerts.filter(a => a.severity === 'high').length;
    
    return { activeCount, criticalCount, highCount };
  }, [alerts]);

  return (
    <>
      <ListHeader>
        <div>
          Latest Alerts
          <SortInfo>
            Sorted by severity & time
          </SortInfo>
        </div>
        <AlertCount>
          {alertStats.activeCount} active
          {alertStats.criticalCount > 0 && (
            <span style={{ color: '#EF4444', marginLeft: '0.5rem' }}>
              ({alertStats.criticalCount} critical)
            </span>
          )}
        </AlertCount>
      </ListHeader>
      
      <ListContainer>
        <AlertListContainer>
          {alertsWithCameras.map(({ alert, camera }) => (
            <AlertCard
              key={alert.alert_id}
              alert={alert}
              camera={camera}
              onSelect={onAlertSelect}
              onAcknowledge={onAlertAcknowledge}
              onDismiss={onAlertDismiss}
              isSelected={selectedAlertId === alert.alert_id}
            />
          ))}
        </AlertListContainer>
      </ListContainer>
    </>
  );
});

AlertList.displayName = 'AlertList';

export { AlertList };
