/**
 * AI EVENT FEED COMPONENT
 * ======================
 * Real-time feed of AI detections, alerts, and security events
 * Displays events with priority, timestamps, and action buttons
 */

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const FeedContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const FeedHeader = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.backgroundLight};
`;

const FeedTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`;

const FeedStats = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.textSecondary};
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const StatBadge = styled.span`
  background-color: ${props => {
    switch (props.type) {
      case 'alerts': return props.theme.colors.error;
      case 'detections': return props.theme.colors.primary;
      case 'active': return props.theme.colors.success;
      default: return props.theme.colors.textMuted;
    }
  }};
  color: white;
  padding: 2px 6px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  min-width: 20px;
  text-align: center;
`;

const FeedContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.sm};
`;

const EventItem = styled.div`
  background-color: ${props => props.theme.colors.backgroundLight};
  border: 1px solid ${props => {
    switch (props.priority) {
      case 'critical': return props.theme.colors.error;
      case 'high': return props.theme.colors.warning;
      case 'medium': return props.theme.colors.primary;
      default: return props.theme.colors.border;
    }
  }};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    transform: translateX(2px);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const EventHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const EventType = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text};
`;

const EventIcon = styled.span`
  font-size: 16px;
`;

const EventTime = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.textMuted};
`;

const EventDetails = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const EventLocation = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const PriorityBadge = styled.div`
  background-color: ${props => {
    switch (props.priority) {
      case 'critical': return props.theme.colors.error;
      case 'high': return props.theme.colors.warning;
      case 'medium': return props.theme.colors.primary;
      default: return props.theme.colors.textMuted;
    }
  }};
  color: white;
  padding: 2px 6px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 10px;
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  text-transform: uppercase;
`;

const EmptyFeed = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: ${props => props.theme.colors.textMuted};
  font-size: ${props => props.theme.typography.fontSize.sm};
  gap: ${props => props.theme.spacing.sm};
`;

const FilterButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.sm};
`;

const FilterButton = styled.button`
  background: ${props => props.active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.active ? props.theme.colors.background : props.theme.colors.textSecondary};
  border: 1px solid ${props => props.active ? props.theme.colors.primary : props.theme.colors.border};
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? props.theme.colors.primaryDark : 'rgba(255, 255, 255, 0.1)'};
  }
`;

function AIEventFeed({ alerts = [], detections = [], onEventClick }) {
  const [filter, setFilter] = useState('all'); // all, alerts, detections
  const [autoScroll, setAutoScroll] = useState(true);
  const feedContentRef = useRef(null);

  // Combine and sort events by timestamp
  const allEvents = React.useMemo(() => {
    const combinedEvents = [
      ...alerts.map(alert => ({ ...alert, eventType: 'alert' })),
      ...detections.map(detection => ({ ...detection, eventType: 'detection' }))
    ];

    return combinedEvents
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 100); // Limit to 100 most recent events
  }, [alerts, detections]);

  // Filter events based on selected filter
  const filteredEvents = React.useMemo(() => {
    switch (filter) {
      case 'alerts':
        return allEvents.filter(event => event.eventType === 'alert');
      case 'detections':
        return allEvents.filter(event => event.eventType === 'detection');
      default:
        return allEvents;
    }
  }, [allEvents, filter]);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && feedContentRef.current) {
      feedContentRef.current.scrollTop = 0; // Scroll to top since newest events are at top
    }
  }, [filteredEvents, autoScroll]);

  const getEventIcon = (event) => {
    if (event.eventType === 'alert') {
      switch (event.alert_type) {
        case 'threat_person': return '🚨';
        case 'unknown_person': return '👤';
        case 'loitering': return '⏰';
        case 'zone_breach': return '🚧';
        case 'face_alert': return '🔍';
        default: return '⚠️';
      }
    } else {
      switch (event.type) {
        case 'person': return '👤';
        case 'face': return '👤';
        case 'vehicle': return '🚗';
        case 'object': return '📦';
        default: return '🎯';
      }
    }
  };

  const getEventTitle = (event) => {
    if (event.eventType === 'alert') {
      return event.description || event.alert_type?.replace('_', ' ').toUpperCase() || 'Security Alert';
    } else {
      const confidence = event.confidence ? ` (${Math.round(event.confidence * 100)}%)` : '';
      return `${event.type?.toUpperCase() || 'DETECTION'} DETECTED${confidence}`;
    }
  };

  const getEventDetails = (event) => {
    if (event.eventType === 'alert') {
      return event.details || 'Security alert triggered by AI monitoring system';
    } else {
      const details = [];
      if (event.is_known !== undefined) {
        details.push(event.is_known ? 'Known Person' : 'Unknown Person');
      }
      if (event.threat_level) {
        details.push(`Threat Level: ${event.threat_level}`);
      }
      if (event.similarity_score) {
        details.push(`Match: ${Math.round(event.similarity_score * 100)}%`);
      }
      return details.join(' • ') || 'AI detection event';
    }
  };

  const getCameraName = (cameraId) => {
    // In a real app, this would map camera IDs to names
    const cameraNames = {
      'cam_entrance_1': 'Main Entrance',
      'cam_parking_1': 'Parking Garage',
      'cam_elevator_1': 'Elevator Bank',
      'cam_rooftop_1': 'Rooftop Access',
      'cam_hallway_1': 'East Hallway',
      'cam_stairwell_1': 'Emergency Stairwell'
    };
    return cameraNames[cameraId] || cameraId;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now - eventTime;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return eventTime.toLocaleDateString();
  };

  const getEventPriority = (event) => {
    if (event.eventType === 'alert') {
      return event.priority || 'medium';
    } else {
      if (event.threat_level === 'threat') return 'critical';
      if (event.threat_level === 'unknown' || !event.is_known) return 'high';
      return 'low';
    }
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const alertCount = alerts.length;
    const detectionCount = detections.length;
    const activeCameras = new Set([...alerts, ...detections].map(e => e.camera_id)).size;
    
    return {
      alerts: alertCount,
      detections: detectionCount,
      active: activeCameras
    };
  }, [alerts, detections]);

  return (
    <FeedContainer>
      <FeedHeader>
        <FeedTitle>🧠 AI Event Feed</FeedTitle>
        <FeedStats>
          <StatItem>
            <StatBadge type="alerts">{stats.alerts}</StatBadge>
            Alerts
          </StatItem>
          <StatItem>
            <StatBadge type="detections">{stats.detections}</StatBadge>
            Detections
          </StatItem>
          <StatItem>
            <StatBadge type="active">{stats.active}</StatBadge>
            Cameras
          </StatItem>
        </FeedStats>
        
        <FilterButtons>
          <FilterButton 
            active={filter === 'all'} 
            onClick={() => setFilter('all')}
          >
            All
          </FilterButton>
          <FilterButton 
            active={filter === 'alerts'} 
            onClick={() => setFilter('alerts')}
          >
            Alerts
          </FilterButton>
          <FilterButton 
            active={filter === 'detections'} 
            onClick={() => setFilter('detections')}
          >
            Detections
          </FilterButton>
        </FilterButtons>
      </FeedHeader>

      <FeedContent ref={feedContentRef}>
        {filteredEvents.length === 0 ? (
          <EmptyFeed>
            <span style={{ fontSize: '32px' }}>🤖</span>
            <div>No {filter === 'all' ? 'events' : filter} yet</div>
            <div style={{ fontSize: '12px' }}>AI monitoring is active and ready</div>
          </EmptyFeed>
        ) : (
          filteredEvents.map((event, index) => {
            const eventId = event.id || event.alert_id || event.face_id || `${event.eventType}-${index}`;
            const priority = getEventPriority(event);
            
            return (
              <EventItem
                key={eventId}
                priority={priority}
                onClick={() => onEventClick && onEventClick(event)}
              >
                <EventHeader>
                  <EventType>
                    <EventIcon>{getEventIcon(event)}</EventIcon>
                    {getEventTitle(event)}
                  </EventType>
                  <EventTime>
                    {formatTimeAgo(event.timestamp)}
                  </EventTime>
                </EventHeader>
                
                <EventDetails>
                  {getEventDetails(event)}
                </EventDetails>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <EventLocation>
                    📍 {getCameraName(event.camera_id)}
                  </EventLocation>
                  <PriorityBadge priority={priority}>
                    {priority}
                  </PriorityBadge>
                </div>
              </EventItem>
            );
          })
        )}
      </FeedContent>
    </FeedContainer>
  );
}

export default AIEventFeed;
