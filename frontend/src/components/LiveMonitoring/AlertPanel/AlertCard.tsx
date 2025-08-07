// APEX AI LIVE MONITORING - ALERT CARD COMPONENT
// Individual security alert display with actions and severity styling

import React, { memo, useCallback } from 'react';
import styled from 'styled-components';
import { 
  AlertTriangle, 
  Camera, 
  Eye, 
  Check, 
  X, 
  Clock,
  MapPin,
  User,
  Shield
} from 'lucide-react';
import { AlertCardProps, SecurityAlert } from '../types';
import { StatusBadge, alertGlow } from '../shared/StyledComponents';

// Styled Components for Alert Card
const CardContainer = styled.div<{ 
  $severity: SecurityAlert['severity'];
  $status: SecurityAlert['status'];
  $isSelected: boolean;
}>`
  background: rgba(30, 30, 30, 0.9);
  border-radius: 8px;
  border: 2px solid ${props => {
    if (props.$isSelected) return '#FFD700';
    switch(props.$severity) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#22C55E';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: ${props => props.$status === 'active' ? 1 : 0.7};
  
  ${props => props.$severity === 'critical' && props.$status === 'active' && `
    animation: ${alertGlow} 2s infinite;
  `}
  
  &:hover {
    background: rgba(40, 40, 40, 0.9);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
`;

const AlertInfo = styled.div`
  flex: 1;
`;

const AlertType = styled.div<{ $severity: SecurityAlert['severity'] }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.85rem;
  color: ${props => {
    switch(props.$severity) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#22C55E';
      default: return '#E0E0E0';
    }
  }};
  margin-bottom: 0.25rem;
  
  .icon {
    flex-shrink: 0;
  }
`;

const AlertDescription = styled.div`
  color: #E0E0E0;
  font-size: 0.8rem;
  line-height: 1.3;
  margin-bottom: 0.5rem;
`;

const AlertMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.7rem;
  color: #B0B0B0;
  margin-bottom: 0.75rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  .icon {
    opacity: 0.7;
  }
`;

const AlertActions = styled.div`
  display: flex;
  gap: 0.5rem;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  
  ${CardContainer}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button<{ $variant: 'view' | 'acknowledge' | 'dismiss' }>`
  padding: 0.25rem 0.5rem;
  border: 1px solid;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
  
  ${props => {
    switch(props.$variant) {
      case 'view':
        return `
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
          color: #3B82F6;
          
          &:hover {
            background: rgba(59, 130, 246, 0.2);
            border-color: #3B82F6;
          }
        `;
      case 'acknowledge':
        return `
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.3);
          color: #22C55E;
          
          &:hover {
            background: rgba(34, 197, 94, 0.2);
            border-color: #22C55E;
          }
        `;
      case 'dismiss':
        return `
          background: rgba(107, 114, 128, 0.1);
          border-color: rgba(107, 114, 128, 0.3);
          color: #6B7280;
          
          &:hover {
            background: rgba(107, 114, 128, 0.2);
            border-color: #6B7280;
          }
        `;
      default:
        return '';
    }
  }}
`;

const StatusBadges = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
`;

const ConfidenceBadge = styled.span<{ $confidence: number }>`
  font-size: 0.6rem;
  padding: 0.125rem 0.375rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: ${props => props.$confidence >= 0.8 ? '#22C55E' : props.$confidence >= 0.6 ? '#F59E0B' : '#EF4444'};
  border: 1px solid ${props => 
    props.$confidence >= 0.8 ? 'rgba(34, 197, 94, 0.3)' : 
    props.$confidence >= 0.6 ? 'rgba(245, 158, 11, 0.3)' : 
    'rgba(239, 68, 68, 0.3)'
  };
`;

// Alert Card Component
const AlertCard: React.FC<AlertCardProps> = memo(({
  alert,
  camera,
  onSelect,
  onAcknowledge,
  onDismiss,
  isSelected
}) => {
  // Memoized event handlers
  const handleClick = useCallback(() => {
    onSelect(alert);
  }, [alert, onSelect]);

  const handleAcknowledge = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAcknowledge(alert.alert_id);
  }, [alert.alert_id, onAcknowledge]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(alert.alert_id);
  }, [alert.alert_id, onDismiss]);

  const handleView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(alert);
  }, [alert, onSelect]);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }, []);

  // Get alert type icon
  const getAlertIcon = useCallback((alertType: SecurityAlert['alert_type']) => {
    switch (alertType) {
      case 'weapon_detected':
        return <Shield size={14} />;
      case 'unknown_person':
        return <User size={14} />;
      case 'suspicious_activity':
        return <Eye size={14} />;
      case 'perimeter_breach':
        return <AlertTriangle size={14} />;
      case 'loitering_detected':
        return <Clock size={14} />;
      default:
        return <AlertTriangle size={14} />;
    }
  }, []);

  // Format alert type for display
  const formatAlertType = useCallback((alertType: SecurityAlert['alert_type']) => {
    return alertType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  return (
    <CardContainer
      $severity={alert.severity}
      $status={alert.status}
      $isSelected={isSelected}
      onClick={handleClick}
    >
      <CardHeader>
        <AlertInfo>
          <AlertType $severity={alert.severity}>
            <span className="icon">{getAlertIcon(alert.alert_type)}</span>
            {formatAlertType(alert.alert_type)}
          </AlertType>
          
          <StatusBadges>
            <StatusBadge $type={alert.severity === 'critical' ? 'alert' : 'priority'}>
              {alert.severity.toUpperCase()}
            </StatusBadge>
            {alert.status === 'acknowledged' && (
              <StatusBadge $type="face">
                ACK
              </StatusBadge>
            )}
            <ConfidenceBadge $confidence={alert.confidence}>
              {Math.round(alert.confidence * 100)}%
            </ConfidenceBadge>
          </StatusBadges>
        </AlertInfo>
      </CardHeader>

      <AlertDescription>
        {alert.description}
      </AlertDescription>

      <AlertMeta>
        <MetaItem>
          <Camera size={12} className="icon" />
          {camera?.name || alert.camera_id}
        </MetaItem>
        
        <MetaItem>
          <MapPin size={12} className="icon" />
          {camera?.location || alert.location}
        </MetaItem>
        
        <MetaItem>
          <Clock size={12} className="icon" />
          {formatTimestamp(alert.timestamp)}
        </MetaItem>
      </AlertMeta>

      <AlertActions>
        <ActionButton $variant="view" onClick={handleView}>
          <Eye size={12} />
          View
        </ActionButton>
        
        {alert.status === 'active' && (
          <>
            <ActionButton $variant="acknowledge" onClick={handleAcknowledge}>
              <Check size={12} />
              ACK
            </ActionButton>
            
            <ActionButton $variant="dismiss" onClick={handleDismiss}>
              <X size={12} />
              Dismiss
            </ActionButton>
          </>
        )}
      </AlertActions>
    </CardContainer>
  );
});

AlertCard.displayName = 'AlertCard';

export { AlertCard };
