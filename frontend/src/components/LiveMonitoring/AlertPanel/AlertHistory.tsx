// APEX AI LIVE MONITORING - ALERT HISTORY COMPONENT
// Historical alerts viewer with pagination and search functionality

import React, { memo, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { 
  History, 
  ChevronDown, 
  Loader2,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { AlertHistoryProps, SecurityAlert } from '../types';
import { ControlButton, customScrollbar, LoadingSpinner } from '../shared/StyledComponents';
import { AlertCard } from './AlertCard';

// Styled Components for Alert History
const HistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(15, 15, 15, 0.5);
  border-radius: 8px;
  overflow: hidden;
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 215, 0, 0.05);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HeaderTitle = styled.h4`
  margin: 0;
  color: #FFD700;
  font-size: 0.9rem;
  font-weight: 600;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const HistoryContent = styled.div`
  flex: 1;
  overflow-y: auto;
  ${customScrollbar}
`;

const AlertSection = styled.div`
  padding: 0.5rem 1rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #B0B0B0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 0.5rem;
  
  .date {
    color: #FFD700;
  }
  
  .count {
    color: #888;
    font-weight: 400;
  }
`;

const AlertGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const LoadMoreContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const LoadMoreButton = styled(ControlButton)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.8rem;
`;

const EmptyHistory = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  color: #666;
  text-align: center;
  flex: 1;
  
  .icon {
    font-size: 2.5rem;
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
    font-size: 0.85rem;
    line-height: 1.4;
    max-width: 300px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #B0B0B0;
  font-size: 0.85rem;
  gap: 1rem;
`;

// Alert History Component
const AlertHistory: React.FC<AlertHistoryProps> = memo(({
  alerts,
  cameras,
  onAlertSelect,
  onLoadMore,
  hasMore,
  isLoading
}) => {
  // Group alerts by date
  const groupedAlerts = useMemo(() => {
    const groups: { [date: string]: SecurityAlert[] } = {};
    
    alerts.forEach(alert => {
      const date = new Date(alert.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(alert);
    });
    
    // Sort groups by date (newest first) and sort alerts within each group
    const sortedGroups = Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .map(([date, groupAlerts]) => ({
        date,
        alerts: groupAlerts.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      }));
    
    return sortedGroups;
  }, [alerts]);

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  }, []);

  // Get alert statistics for header
  const alertStats = useMemo(() => {
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length
    };
  }, [alerts]);

  // Event handlers
  const handleAlertSelect = useCallback((alert: SecurityAlert) => {
    onAlertSelect(alert);
  }, [onAlertSelect]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      onLoadMore();
    }
  }, [isLoading, hasMore, onLoadMore]);

  const handleExportHistory = useCallback(() => {
    // Generate CSV export of alert history
    const headers = [
      'Alert ID', 'Timestamp', 'Type', 'Severity', 'Camera', 'Location', 
      'Description', 'Status', 'Confidence'
    ];
    
    const csvData = alerts.map(alert => [
      alert.alert_id,
      new Date(alert.timestamp).toLocaleString(),
      alert.alert_type.replace(/_/g, ' '),
      alert.severity,
      alert.camera_name,
      alert.location,
      alert.description,
      alert.status,
      Math.round(alert.confidence * 100) + '%'
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `alert_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [alerts]);

  // Render loading state
  if (isLoading && alerts.length === 0) {
    return (
      <HistoryContainer>
        <HistoryHeader>
          <HeaderLeft>
            <History size={16} />
            <HeaderTitle>Alert History</HeaderTitle>
          </HeaderLeft>
        </HistoryHeader>
        
        <LoadingContainer>
          <LoadingSpinner />
          Loading alert history...
        </LoadingContainer>
      </HistoryContainer>
    );
  }

  // Render empty state
  if (alerts.length === 0) {
    return (
      <HistoryContainer>
        <HistoryHeader>
          <HeaderLeft>
            <History size={16} />
            <HeaderTitle>Alert History</HeaderTitle>
          </HeaderLeft>
        </HistoryHeader>
        
        <EmptyHistory>
          <div className="icon">
            <History />
          </div>
          <div className="title">No Alert History</div>
          <div className="description">
            No historical alerts are available. Alert history will appear here 
            as the system processes security events over time.
          </div>
        </EmptyHistory>
      </HistoryContainer>
    );
  }

  return (
    <HistoryContainer>
      <HistoryHeader>
        <HeaderLeft>
          <History size={16} />
          <HeaderTitle>
            Alert History ({alertStats.total})
          </HeaderTitle>
        </HeaderLeft>
        
        <HeaderActions>
          <ControlButton onClick={handleExportHistory}>
            <Download size={12} />
            Export
          </ControlButton>
        </HeaderActions>
      </HistoryHeader>

      <HistoryContent>
        {groupedAlerts.map(({ date, alerts: groupAlerts }) => (
          <AlertSection key={date}>
            <SectionHeader>
              <Calendar size={14} />
              <span className="date">{formatDate(date)}</span>
              <span className="count">({groupAlerts.length} alerts)</span>
            </SectionHeader>
            
            <AlertGroup>
              {groupAlerts.map(alert => {
                const camera = cameras.find(c => c.camera_id === alert.camera_id);
                return (
                  <AlertCard
                    key={alert.alert_id}
                    alert={alert}
                    camera={camera}
                    onSelect={handleAlertSelect}
                    onAcknowledge={() => {}} // History alerts can't be acknowledged
                    onDismiss={() => {}} // History alerts can't be dismissed
                    isSelected={false}
                  />
                );
              })}
            </AlertGroup>
          </AlertSection>
        ))}
        
        {hasMore && (
          <LoadMoreContainer>
            <LoadMoreButton onClick={handleLoadMore} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  Load More History
                </>
              )}
            </LoadMoreButton>
          </LoadMoreContainer>
        )}
      </HistoryContent>
    </HistoryContainer>
  );
});

AlertHistory.displayName = 'AlertHistory';

export { AlertHistory };
