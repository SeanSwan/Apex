// APEX AI GUARD OPERATIONS DASHBOARD
// Master Prompt v29.1-APEX Implementation
// Phase 2B: Guard Operations & Dispatch Interface

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { 
  Shield, 
  Users, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Navigation, 
  Clock, 
  AlertTriangle,
  Radio,
  Map,
  Target,
  Activity,
  Send,
  FileText,
  Eye,
  MapIcon
} from 'lucide-react';

// Import existing components
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';

// Types for Guard Operations
interface GuardLocation {
  guard_id: string;
  lat: number;
  lng: number;
  timestamp: string;
  accuracy: number;
}

interface Incident {
  incident_id: string;
  timestamp: string;
  location: { lat: number; lng: number };
  type: 'security' | 'maintenance' | 'medical' | 'fire' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  reported_by: string;
  assigned_guard?: string;
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  notes: string[];
}

interface DispatchMessage {
  message_id: string;
  timestamp: string;
  from: string;
  to: string[];
  type: 'alert' | 'instruction' | 'update' | 'request';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subject: string;
  content: string;
  acknowledged_by: string[];
  attachments?: string[];
}

// Styled Components
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background-color: #0a0a0a;
    color: #ffffff;
    overflow: hidden;
  }
`;

const DashboardContainer = styled.div`
  display: grid;
  grid-template-rows: 60px 1fr;
  height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  background: rgba(20, 20, 20, 0.95);
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(10px);
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #FFD700;
    margin: 0;
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 1rem;
  padding: 1rem;
  height: calc(100vh - 60px);
  overflow: hidden;
`;

const LeftPanel = styled.div`
  display: grid;
  grid-template-rows: 1fr 300px;
  gap: 1rem;
`;

const MapContainer = styled.div`
  background: rgba(30, 30, 30, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  overflow: hidden;
  position: relative;
`;

const MapHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  background: rgba(255, 215, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    color: #FFD700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const MapView = styled.div`
  height: calc(100% - 60px);
  background: #2a2a2a;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 1.1rem;
  
  .map-placeholder {
    text-align: center;
    
    .icon {
      margin-bottom: 1rem;
    }
  }
`;

const MapOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
`;

const GuardMarker = styled.div<{ status: string; x: number; y: number }>`
  position: absolute;
  left: ${props => props.x}%;
  top: ${props => props.y}%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => {
    switch(props.status) {
      case 'on_duty': return '#22C55E';
      case 'responding': return '#F59E0B';
      case 'break': return '#3B82F6';
      default: return '#6B7280';
    }
  }};
  border: 3px solid rgba(255, 255, 255, 0.8);
  pointer-events: auto;
  cursor: pointer;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { 
      box-shadow: 0 0 0 0 ${props => {
        switch(props.status) {
          case 'on_duty': return 'rgba(34, 197, 94, 0.7)';
          case 'responding': return 'rgba(245, 158, 11, 0.7)';
          case 'break': return 'rgba(59, 130, 246, 0.7)';
          default: return 'rgba(107, 114, 128, 0.7)';
        }
      }};
    }
    50% { 
      box-shadow: 0 0 0 6px ${props => {
        switch(props.status) {
          case 'on_duty': return 'rgba(34, 197, 94, 0)';
          case 'responding': return 'rgba(245, 158, 11, 0)';
          case 'break': return 'rgba(59, 130, 246, 0)';
          default: return 'rgba(107, 114, 128, 0)';
        }
      }};
    }
  }
`;

const AlertMarker = styled.div<{ priority: string; x: number; y: number }>`
  position: absolute;
  left: ${props => props.x}%;
  top: ${props => props.y}%;
  width: 16px;
  height: 16px;
  background: ${props => {
    switch(props.priority) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      default: return '#6B7280';
    }
  }};
  border-radius: 50%;
  pointer-events: auto;
  cursor: pointer;
  animation: blink 1s infinite;
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.3; }
  }
`;

const IncidentPanel = styled.div`
  background: rgba(30, 30, 30, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const IncidentHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  background: rgba(255, 215, 0, 0.1);
  
  h3 {
    margin: 0;
    color: #FFD700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const IncidentList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
`;

const IncidentItem = styled.div<{ severity: string }>`
  background: rgba(40, 40, 40, 0.9);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-left: 4px solid ${props => {
    switch(props.severity) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      default: return '#6B7280';
    }
  }};
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background: rgba(50, 50, 50, 0.9);
    transform: translateX(2px);
  }
  
  .incident-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    
    .type {
      font-weight: 600;
      color: #FFD700;
      text-transform: capitalize;
    }
    
    .time {
      font-size: 0.8rem;
      color: #B0B0B0;
    }
  }
  
  .description {
    font-size: 0.9rem;
    color: #E0E0E0;
    margin-bottom: 0.5rem;
  }
  
  .status-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .status {
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 500;
      background: rgba(107, 114, 128, 0.2);
      color: #9CA3AF;
    }
  }
`;

const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  overflow: hidden;
`;

const GuardStatusPanel = styled.div`
  background: rgba(30, 30, 30, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  padding: 1rem;
  height: 350px;
  display: flex;
  flex-direction: column;
  
  h3 {
    margin: 0 0 1rem 0;
    color: #FFD700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const GuardList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const GuardCard = styled.div<{ status: string }>`
  background: rgba(40, 40, 40, 0.7);
  border-radius: 8px;
  padding: 1rem;
  border-left: 3px solid ${props => {
    switch(props.status) {
      case 'on_duty': return '#22C55E';
      case 'responding': return '#F59E0B';
      case 'break': return '#3B82F6';
      default: return '#6B7280';
    }
  }};
  
  .guard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    
    .name {
      font-weight: 600;
      color: #E0E0E0;
    }
    
    .actions {
      display: flex;
      gap: 0.5rem;
    }
  }
  
  .guard-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: #B0B0B0;
    
    .info-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  }
  
  .quick-actions {
    margin-top: 0.5rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
`;

const ActionButton = styled.button<{ variant: 'primary' | 'secondary' | 'danger' | 'success' }>`
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  background: ${props => {
    switch(props.variant) {
      case 'primary': return '#FFD700';
      case 'secondary': return 'rgba(255, 255, 255, 0.1)';
      case 'danger': return '#EF4444';
      case 'success': return '#22C55E';
    }
  }};
  
  color: ${props => {
    switch(props.variant) {
      case 'primary': return '#000';
      case 'secondary': return '#fff';
      case 'danger': return '#fff';
      case 'success': return '#fff';
    }
  }};
  
  &:hover {
    transform: translateY(-1px);
    opacity: 0.9;
  }
`;

const DispatchPanel = styled.div`
  background: rgba(30, 30, 30, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  
  h3 {
    margin: 0 0 1rem 0;
    color: #FFD700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const MessageComposer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  
  .composer-header {
    display: flex;
    gap: 0.5rem;
    
    select {
      background: rgba(40, 40, 40, 0.9);
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 6px;
      color: #E0E0E0;
      padding: 0.5rem;
      font-size: 0.8rem;
    }
  }
  
  textarea {
    background: rgba(40, 40, 40, 0.9);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 6px;
    color: #E0E0E0;
    padding: 0.75rem;
    resize: vertical;
    min-height: 80px;
    font-size: 0.9rem;
    
    &::placeholder {
      color: #666;
    }
  }
  
  .send-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const MessageHistory = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MessageItem = styled.div<{ priority: string; isOutgoing: boolean }>`
  background: ${props => props.isOutgoing ? 'rgba(255, 215, 0, 0.1)' : 'rgba(40, 40, 40, 0.9)'};
  border: 1px solid ${props => {
    switch(props.priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  border-radius: 8px;
  padding: 0.75rem;
  margin-left: ${props => props.isOutgoing ? '20%' : '0'};
  margin-right: ${props => props.isOutgoing ? '0' : '20%'};
  
  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.8rem;
    
    .sender {
      font-weight: 600;
      color: #FFD700;
    }
    
    .time {
      color: #B0B0B0;
    }
  }
  
  .content {
    font-size: 0.9rem;
    color: #E0E0E0;
    line-height: 1.4;
  }
  
  .acknowledgments {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #666;
  }
`;

// Main Component
const GuardOperationsDashboard: React.FC = () => {
  const { toast } = useToast();
  
  // State management
  const [guards, setGuards] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [messages, setMessages] = useState<DispatchMessage[]>([]);
  const [selectedGuards, setSelectedGuards] = useState<string[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [messagePriority, setMessagePriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [guardLocations] = useState<Record<string, GuardLocation>>({});

  // Initialize demo data
  useEffect(() => {
    // Demo guards
    setGuards([
      {
        guard_id: 'guard_001',
        name: 'Marcus Johnson',
        status: 'on_duty',
        assigned_zone: 'Zone A',
        post: 'Main Entrance',
        last_check_in: new Date().toISOString(),
        active_alerts: 0,
        phone: '+1-555-0101',
        location: { lat: 40.7128, lng: -74.0060 }
      },
      {
        guard_id: 'guard_002', 
        name: 'Sarah Williams',
        status: 'responding',
        assigned_zone: 'Zone B',
        post: 'Parking Garage',
        last_check_in: new Date(Date.now() - 300000).toISOString(),
        active_alerts: 1,
        phone: '+1-555-0102',
        location: { lat: 40.7130, lng: -74.0062 }
      },
      {
        guard_id: 'guard_003',
        name: 'David Chen',
        status: 'break',
        assigned_zone: 'Zone C',
        post: 'Rooftop Patrol',
        last_check_in: new Date(Date.now() - 600000).toISOString(),
        active_alerts: 0,
        phone: '+1-555-0103',
        location: { lat: 40.7126, lng: -74.0058 }
      },
      {
        guard_id: 'guard_004',
        name: 'Lisa Martinez',
        status: 'on_duty',
        assigned_zone: 'Zone D',
        post: 'Elevator Bank',
        last_check_in: new Date(Date.now() - 120000).toISOString(),
        active_alerts: 0,
        phone: '+1-555-0104',
        location: { lat: 40.7132, lng: -74.0056 }
      }
    ]);

    // Demo incidents
    setIncidents([
      {
        incident_id: 'inc_001',
        timestamp: new Date().toISOString(),
        location: { lat: 40.7128, lng: -74.0060 },
        type: 'security',
        severity: 'high',
        description: 'Unauthorized access attempt at main entrance',
        reported_by: 'AI Detection System',
        assigned_guard: 'guard_001',
        status: 'investigating',
        notes: ['Guard dispatched', 'Reviewing camera footage']
      },
      {
        incident_id: 'inc_002',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        location: { lat: 40.7130, lng: -74.0062 },
        type: 'maintenance',
        severity: 'medium',
        description: 'Broken light in parking garage Level B',
        reported_by: 'Guard Patrol',
        status: 'open',
        notes: ['Maintenance request submitted']
      },
      {
        incident_id: 'inc_003',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        location: { lat: 40.7126, lng: -74.0058 },
        type: 'security',
        severity: 'low',
        description: 'Suspicious individual loitering near building',
        reported_by: 'Resident',
        status: 'resolved',
        notes: ['Individual identified as delivery driver', 'No further action required']
      }
    ]);

    // Demo messages
    setMessages([
      {
        message_id: 'msg_001',
        timestamp: new Date().toISOString(),
        from: 'Dispatch',
        to: ['guard_001'],
        type: 'alert',
        priority: 'high',
        subject: 'Unauthorized Access Alert',
        content: 'AI system detected unauthorized access attempt at main entrance. Please investigate immediately.',
        acknowledged_by: ['guard_001']
      },
      {
        message_id: 'msg_002',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        from: 'guard_002',
        to: ['Dispatch'],
        type: 'update',
        priority: 'normal',
        subject: 'Patrol Update',
        content: 'Completed rounds of parking garage levels A and B. All clear. Broken light noted on Level B.',
        acknowledged_by: ['Dispatch']
      }
    ]);
  }, []);

  // Event handlers
  const handleGuardSelection = useCallback((guardId: string, selected: boolean) => {
    setSelectedGuards(prev => 
      selected 
        ? [...prev, guardId]
        : prev.filter(id => id !== guardId)
    );
  }, []);

  const handleDispatchGuard = useCallback((guardId: string, incidentId: string) => {
    setIncidents(prev => prev.map(incident => 
      incident.incident_id === incidentId 
        ? { ...incident, assigned_guard: guardId, status: 'investigating' }
        : incident
    ));

    setGuards(prev => prev.map(guard => 
      guard.guard_id === guardId 
        ? { ...guard, status: 'responding', active_alerts: guard.active_alerts + 1 }
        : guard
    ));

    toast({
      title: "Guard Dispatched",
      description: `${guards.find(g => g.guard_id === guardId)?.name} dispatched to incident.`,
      variant: "default"
    });
  }, [guards, toast]);

  const handleSendMessage = useCallback(() => {
    if (!messageContent.trim() || selectedGuards.length === 0) {
      toast({
        title: "Message Error",
        description: "Please select guards and enter a message.",
        variant: "destructive"
      });
      return;
    }

    const newMessage: DispatchMessage = {
      message_id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      from: 'Dispatch',
      to: selectedGuards,
      type: 'instruction',
      priority: messagePriority,
      subject: 'Dispatch Instruction',
      content: messageContent,
      acknowledged_by: []
    };

    setMessages(prev => [newMessage, ...prev]);
    setMessageContent('');
    setSelectedGuards([]);
    
    toast({
      title: "Message Sent",
      description: `Message sent to ${selectedGuards.length} guard(s).`,
      variant: "default"
    });
  }, [messageContent, selectedGuards, messagePriority, toast]);

  const handleCallGuard = useCallback((guardId: string) => {
    const guard = guards.find(g => g.guard_id === guardId);
    if (guard) {
      toast({
        title: "Calling Guard",
        description: `Initiating call to ${guard.name} at ${guard.phone}`,
        variant: "default"
      });
    }
  }, [guards, toast]);

  const handleEmergencyBroadcast = useCallback(() => {
    const emergencyMessage: DispatchMessage = {
      message_id: `emg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      from: 'Dispatch',
      to: guards.map(g => g.guard_id),
      type: 'alert',
      priority: 'urgent',
      subject: 'EMERGENCY ALERT',
      content: 'Emergency situation detected. All guards report status immediately.',
      acknowledged_by: []
    };

    setMessages(prev => [emergencyMessage, ...prev]);
    
    toast({
      title: "Emergency Broadcast Sent",
      description: "Emergency alert sent to all guards.",
      variant: "destructive"
    });
  }, [guards, toast]);

  // Computed values
  const onDutyGuards = useMemo(() => 
    guards.filter(g => g.status === 'on_duty' || g.status === 'responding').length, 
    [guards]
  );
  
  const openIncidents = useMemo(() => 
    incidents.filter(i => i.status === 'open' || i.status === 'investigating').length, 
    [incidents]
  );

  return (
    <ThemeProvider theme={{}}>
      <GlobalStyle />
      <DashboardContainer>
        {/* Top Navigation Bar */}
        <TopBar>
          <LogoSection>
            <Shield size={24} color="#FFD700" />
            <h1>Guard Operations Center</h1>
          </LogoSection>
          
          <QuickActions>
            <Button 
              variant="outline" 
              onClick={handleEmergencyBroadcast}
              style={{ background: '#EF4444', color: 'white', border: 'none' }}
            >
              <AlertTriangle size={16} />
              Emergency Broadcast
            </Button>
            <Button variant="outline">
              <Phone size={16} />
              Call Log
            </Button>
            <Button variant="outline">
              <FileText size={16} />
              Reports
            </Button>
          </QuickActions>
        </TopBar>

        {/* Main Dashboard Content */}
        <MainContent>
          {/* Left Panel - Map and Incidents */}
          <LeftPanel>
            {/* Interactive Map */}
            <MapContainer>
              <MapHeader>
                <h3>
                  <Map size={20} />
                  Property Map - Live Positions
                </h3>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                  <span>{onDutyGuards} Guards Active</span>
                  <span>{openIncidents} Open Incidents</span>
                </div>
              </MapHeader>
              
              <MapView>
                {/* Map Placeholder */}
                <div className="map-placeholder">
                  <div className="icon">
                    <MapIcon size={64} color="#666" />
                  </div>
                  <div>Interactive Property Map</div>
                  <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Guard positions and incident locations displayed here
                  </div>
                </div>
                
                {/* Guard Position Overlays */}
                <MapOverlay>
                  {guards.map((guard, index) => (
                    <GuardMarker
                      key={guard.guard_id}
                      status={guard.status}
                      x={20 + (index * 15)}
                      y={30 + (index * 10)}
                      title={`${guard.name} - ${guard.status}`}
                    />
                  ))}
                  
                  {/* Incident Markers */}
                  {incidents.filter(i => i.status !== 'resolved').map((incident, index) => (
                    <AlertMarker
                      key={incident.incident_id}
                      priority={incident.severity}
                      x={60 + (index * 5)}
                      y={20 + (index * 15)}
                      title={incident.description}
                    />
                  ))}
                </MapOverlay>
              </MapView>
            </MapContainer>

            {/* Incident Management */}
            <IncidentPanel>
              <IncidentHeader>
                <h3>
                  <AlertTriangle size={20} />
                  Active Incidents ({openIncidents})
                </h3>
              </IncidentHeader>
              
              <IncidentList>
                {incidents.map((incident) => (
                  <IncidentItem 
                    key={incident.incident_id} 
                    severity={incident.severity}
                  >
                    <div className="incident-header">
                      <span className="type">{incident.type} - {incident.severity}</span>
                      <span className="time">
                        {new Date(incident.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="description">{incident.description}</div>
                    
                    <div className="status-actions">
                      <div className="status">{incident.status}</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {incident.status === 'open' && (
                          <ActionButton 
                            variant="primary"
                            onClick={() => handleDispatchGuard(guards[0]?.guard_id, incident.incident_id)}
                          >
                            <Navigation size={12} />
                            Dispatch
                          </ActionButton>
                        )}
                        <ActionButton variant="secondary">
                          <Eye size={12} />
                          View
                        </ActionButton>
                      </div>
                    </div>
                  </IncidentItem>
                ))}
              </IncidentList>
            </IncidentPanel>
          </LeftPanel>

          {/* Right Panel - Guards and Communication */}
          <RightPanel>
            {/* Guard Status */}
            <GuardStatusPanel>
              <h3>
                <Users size={20} />
                Guard Status ({onDutyGuards} active)
              </h3>
              
              <GuardList>
                {guards.map((guard) => (
                  <GuardCard key={guard.guard_id} status={guard.status}>
                    <div className="guard-header">
                      <span className="name">{guard.name}</span>
                      <div className="actions">
                        <input
                          type="checkbox"
                          checked={selectedGuards.includes(guard.guard_id)}
                          onChange={(e) => handleGuardSelection(guard.guard_id, e.target.checked)}
                          title="Select for messaging"
                        />
                      </div>
                    </div>
                    
                    <div className="guard-info">
                      <div className="info-item">
                        <MapPin size={12} />
                        {guard.assigned_zone}
                      </div>
                      <div className="info-item">
                        <Clock size={12} />
                        {new Date(guard.last_check_in).toLocaleTimeString()}
                      </div>
                      <div className="info-item">
                        <Activity size={12} />
                        {guard.status.replace('_', ' ')}
                      </div>
                      <div className="info-item">
                        <Target size={12} />
                        {guard.post}
                      </div>
                    </div>
                    
                    <div className="quick-actions">
                      <ActionButton 
                        variant="primary"
                        onClick={() => handleCallGuard(guard.guard_id)}
                      >
                        <Phone size={10} />
                        Call
                      </ActionButton>
                      <ActionButton variant="secondary">
                        <MessageSquare size={10} />
                        Message
                      </ActionButton>
                      <ActionButton variant="secondary">
                        <Navigation size={10} />
                        Locate
                      </ActionButton>
                    </div>
                  </GuardCard>
                ))}
              </GuardList>
            </GuardStatusPanel>

            {/* Dispatch Communication */}
            <DispatchPanel>
              <h3>
                <Radio size={20} />
                Dispatch Communication
              </h3>
              
              <MessageComposer>
                <div className="composer-header">
                  <select 
                    value={messagePriority} 
                    onChange={(e) => setMessagePriority(e.target.value as any)}
                  >
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <span style={{ fontSize: '0.8rem', color: '#B0B0B0' }}>
                    {selectedGuards.length} guard(s) selected
                  </span>
                </div>
                
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Enter dispatch message..."
                />
                
                <div className="send-actions">
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>
                    Select guards above to send message
                  </span>
                  <ActionButton 
                    variant="primary"
                    onClick={handleSendMessage}
                  >
                    <Send size={12} />
                    Send Message
                  </ActionButton>
                </div>
              </MessageComposer>
              
              <MessageHistory>
                {messages.map((message) => (
                  <MessageItem
                    key={message.message_id}
                    priority={message.priority}
                    isOutgoing={message.from === 'Dispatch'}
                  >
                    <div className="message-header">
                      <span className="sender">{message.from}</span>
                      <span className="time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="content">{message.content}</div>
                    
                    {message.acknowledged_by.length > 0 && (
                      <div className="acknowledgments">
                        ✓ Acknowledged by {message.acknowledged_by.length} recipient(s)
                      </div>
                    )}
                  </MessageItem>
                ))}
              </MessageHistory>
            </DispatchPanel>
          </RightPanel>
        </MainContent>
      </DashboardContainer>
    </ThemeProvider>
  );
};

export default GuardOperationsDashboard;