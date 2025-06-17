// APEX AI GUARD MOBILE APP INTERFACE
// Master Prompt v29.1-APEX Implementation
// Phase 2C: Standing Guard Mobile App / Web Interface

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  Camera, 
  MapPin, 
  Phone, 
  CheckCircle,
  XCircle,
  Radio,
  Navigation,
  FileText,
  Upload,
  User,
  Settings,
  Battery,
  Wifi,
  Signal,
  Eye,
  Target,
  Activity,
  Timer,
  Bell,
  Send,
  Mic,
  Video,
  Image as ImageIcon,
  Home,
  List,
  PlusCircle,
  RefreshCw,
  Power,
  Calendar,
  Edit
} from 'lucide-react';

// Import existing components
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';

// Types for Guard Mobile App
interface GuardProfile {
  guard_id: string;
  name: string;
  employee_id: string;
  post_assignment: string;
  zone: string;
  shift_start: string;
  shift_end: string;
  status: 'clocked_in' | 'clocked_out' | 'on_break' | 'responding';
}

interface AIAlert {
  alert_id: string;
  timestamp: string;
  camera_location: string;
  alert_type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  requires_response: boolean;
  ai_snapshot?: string;
  location_details: string;
}

interface DispatchMessage {
  message_id: string;
  timestamp: string;
  from: string;
  subject: string;
  content: string;
  priority: 'normal' | 'high' | 'urgent';
  requires_acknowledgment: boolean;
  acknowledged: boolean;
}

interface IncidentReport {
  incident_id: string;
  timestamp: string;
  location: string;
  type: 'security' | 'maintenance' | 'medical' | 'fire' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  photos: string[];
  status: 'draft' | 'submitted' | 'under_review';
}

interface CheckInPoint {
  checkpoint_id: string;
  name: string;
  location: string;
  required_checks: string[];
  last_check_in?: string;
  qr_code?: string;
  nfc_enabled: boolean;
}

// Styled Components for Mobile-First Design
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    background-color: #0a0a0a;
    color: #ffffff;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  * {
    box-sizing: border-box;
  }
`;

const MobileContainer = styled.div`
  max-width: 430px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  
  @media (max-width: 430px) {
    max-width: 100%;
  }
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: rgba(20, 20, 20, 0.9);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  font-size: 0.8rem;
  height: 44px;
  
  .left-indicators {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #E0E0E0;
  }
  
  .right-indicators {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #E0E0E0;
  }
`;

const Header = styled.div`
  background: rgba(20, 20, 20, 0.95);
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
  
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    
    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #FFD700;
      font-weight: 700;
      font-size: 1.1rem;
    }
    
    .emergency-btn {
      background: #EF4444;
      color: white;
      border: none;
      border-radius: 20px;
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  }
  
  .guard-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .guard-info {
      .name {
        font-weight: 600;
        color: #E0E0E0;
        margin-bottom: 0.25rem;
      }
      
      .assignment {
        font-size: 0.8rem;
        color: #B0B0B0;
      }
    }
    
    .clock-status {
      text-align: right;
      
      .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 500;
        text-transform: uppercase;
        margin-bottom: 0.25rem;
        display: inline-block;
      }
      
      .shift-time {
        font-size: 0.8rem;
        color: #B0B0B0;
      }
    }
  }
`;

const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px; /* Space for bottom navigation */
`;

const BottomNavigation = styled.div`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  background: rgba(20, 20, 20, 0.95);
  border-top: 1px solid rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(10px);
  display: flex;
  height: 80px;
  
  @media (max-width: 430px) {
    left: 0;
    transform: none;
  }
`;

const NavItem = styled.button<{ active: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: ${props => props.active ? '#FFD700' : '#B0B0B0'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.5rem;
  
  &:active {
    transform: scale(0.95);
  }
  
  .nav-icon {
    margin-bottom: 0.25rem;
  }
`;

const PageContainer = styled.div`
  padding: 1rem;
  min-height: calc(100vh - 160px);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h3 {
    margin: 0;
    color: #FFD700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
  }
`;

const Card = styled.div<{ priority?: string; variant?: string }>`
  background: rgba(30, 30, 30, 0.9);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid ${props => {
    if (props.priority === 'critical') return '#EF4444';
    if (props.priority === 'high') return '#F59E0B';
    if (props.priority === 'medium') return '#3B82F6';
    if (props.variant === 'success') return '#22C55E';
    return 'rgba(255, 215, 0, 0.3)';
  }};
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    
    .title {
      font-weight: 600;
      color: #E0E0E0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .timestamp {
      font-size: 0.8rem;
      color: #B0B0B0;
    }
  }
  
  .card-content {
    color: #B0B0B0;
    line-height: 1.4;
    margin-bottom: 0.75rem;
  }
  
  .card-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
`;

const ActionButton = styled.button<{ variant: 'primary' | 'secondary' | 'danger' | 'success' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
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
  
  &:active {
    transform: scale(0.95);
  }
`;

const AlertBadge = styled.div<{ priority: string }>`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => {
    switch(props.priority) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      default: return '#3B82F6';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  color: white;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const ClockInCard = styled.div<{ clockedIn: boolean }>`
  background: ${props => props.clockedIn ? 
    'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%)' :
    'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)'
  };
  border: 1px solid ${props => props.clockedIn ? '#22C55E' : '#EF4444'};
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 2rem;
  
  .clock-display {
    font-size: 2.5rem;
    font-weight: 700;
    color: #E0E0E0;
    margin-bottom: 0.5rem;
    font-family: 'Monaco', 'Menlo', monospace;
  }
  
  .status-text {
    font-size: 1rem;
    color: ${props => props.clockedIn ? '#22C55E' : '#EF4444'};
    font-weight: 600;
    margin-bottom: 1rem;
  }
  
  .clock-button {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid ${props => props.clockedIn ? '#EF4444' : '#22C55E'};
    background: ${props => props.clockedIn ? '#EF4444' : '#22C55E'};
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:active {
      transform: scale(0.95);
    }
  }
`;

const MessageComposer = styled.div`
  background: rgba(40, 40, 40, 0.9);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  
  textarea {
    width: 100%;
    background: rgba(60, 60, 60, 0.5);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 8px;
    color: #E0E0E0;
    padding: 0.75rem;
    resize: vertical;
    min-height: 80px;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    
    &::placeholder {
      color: #666;
    }
  }
  
  .composer-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .attachment-buttons {
      display: flex;
      gap: 0.5rem;
    }
  }
`;

// Main Component
const GuardMobileApp: React.FC = () => {
  const { toast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState('home');
  const [guardProfile] = useState<GuardProfile>({
    guard_id: 'guard_001',
    name: 'Marcus Johnson',
    employee_id: 'EMP001',
    post_assignment: 'Main Entrance - Building A',
    zone: 'Zone A',
    shift_start: '08:00',
    shift_end: '20:00',
    status: 'clocked_in'
  });
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [aiAlerts, setAIAlerts] = useState<AIAlert[]>([]);
  const [messages, setMessages] = useState<DispatchMessage[]>([]);
  const [incidentDrafts, setIncidentDrafts] = useState<IncidentReport[]>([]);
  const [checkPoints, setCheckPoints] = useState<CheckInPoint[]>([]);
  const [messageContent, setMessageContent] = useState('');

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize demo data
  useEffect(() => {
    // Demo AI alerts
    setAIAlerts([
      {
        alert_id: 'alert_001',
        timestamp: new Date().toISOString(),
        camera_location: 'Main Entrance Camera 1',
        alert_type: 'Person Detection',
        priority: 'medium',
        description: 'Unidentified person detected in restricted area after hours',
        requires_response: true,
        location_details: 'Building A - Main Lobby'
      },
      {
        alert_id: 'alert_002',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        camera_location: 'Parking Garage Camera 3',
        alert_type: 'Vehicle Detection',
        priority: 'low',
        description: 'Vehicle without permit detected in reserved parking',
        requires_response: false,
        location_details: 'Underground Parking Level B'
      }
    ]);

    // Demo messages
    setMessages([
      {
        message_id: 'msg_001',
        timestamp: new Date().toISOString(),
        from: 'Dispatch',
        subject: 'Patrol Route Update',
        content: 'Please include additional check of the rooftop access door during your next patrol round.',
        priority: 'normal',
        requires_acknowledgment: true,
        acknowledged: false
      },
      {
        message_id: 'msg_002',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        from: 'Operations Manager',
        subject: 'Shift Change Reminder',
        content: 'Remember to brief the night shift guard about the ongoing maintenance work in the east wing.',
        priority: 'high',
        requires_acknowledgment: true,
        acknowledged: true
      }
    ]);

    // Demo check points
    setCheckPoints([
      {
        checkpoint_id: 'cp_001',
        name: 'Main Entrance',
        location: 'Building A Lobby',
        required_checks: ['Door locks', 'Visitor log', 'Emergency exits'],
        nfc_enabled: true
      },
      {
        checkpoint_id: 'cp_002',
        name: 'Parking Garage',
        location: 'Underground Level B',
        required_checks: ['Vehicle access', 'Lighting', 'Emergency systems'],
        nfc_enabled: true
      }
    ]);
  }, []);

  // Event handlers
  const handleClockInOut = useCallback(() => {
    const newStatus = guardProfile.status === 'clocked_in' ? 'clocked_out' : 'clocked_in';
    
    toast({
      title: newStatus === 'clocked_in' ? 'Clocked In' : 'Clocked Out',
      description: `Successfully ${newStatus.replace('_', ' ')} at ${currentTime.toLocaleTimeString()}`,
      variant: "default"
    });
  }, [guardProfile.status, currentTime, toast]);

  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    setAIAlerts(prev => prev.filter(alert => alert.alert_id !== alertId));
    
    toast({
      title: "Alert Acknowledged",
      description: "Alert has been acknowledged and logged.",
      variant: "default"
    });
  }, [toast]);

  const handleRespondToAlert = useCallback((alertId: string) => {
    toast({
      title: "Response Logged",
      description: "Your response to the alert has been logged. Dispatch has been notified.",
      variant: "default"
    });
  }, [toast]);

  const handleAcknowledgeMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.message_id === messageId 
        ? { ...msg, acknowledged: true }
        : msg
    ));
    
    toast({
      title: "Message Acknowledged",
      description: "Message acknowledgment sent to dispatch.",
      variant: "default"
    });
  }, [toast]);

  const handleSendMessage = useCallback(() => {
    if (!messageContent.trim()) return;
    
    toast({
      title: "Message Sent",
      description: "Your message has been sent to dispatch.",
      variant: "default"
    });
    
    setMessageContent('');
  }, [messageContent, toast]);

  const handleCheckIn = useCallback((checkpointId: string) => {
    setCheckPoints(prev => prev.map(cp => 
      cp.checkpoint_id === checkpointId 
        ? { ...cp, last_check_in: new Date().toISOString() }
        : cp
    ));
    
    toast({
      title: "Check-in Recorded",
      description: "Checkpoint visit has been logged successfully.",
      variant: "default"
    });
  }, [toast]);

  // Computed values
  const pendingAlerts = useMemo(() => aiAlerts.length, [aiAlerts]);
  const unreadMessages = useMemo(() => 
    messages.filter(msg => msg.requires_acknowledgment && !msg.acknowledged).length, 
    [messages]
  );

  // Status badge styling
  const getStatusBadgeStyle = (status: string) => {
    switch(status) {
      case 'clocked_in':
        return { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' };
      case 'clocked_out':
        return { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' };
      case 'on_break':
        return { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B' };
      default:
        return { backgroundColor: 'rgba(107, 114, 128, 0.2)', color: '#9CA3AF' };
    }
  };

  // Tab navigation items
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: pendingAlerts },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <PageContainer>
            {/* Clock In/Out Section */}
            <ClockInCard clockedIn={guardProfile.status === 'clocked_in'}>
              <div className="clock-display">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="status-text">
                {guardProfile.status === 'clocked_in' ? 'ON DUTY' : 'OFF DUTY'}
              </div>
              <button className="clock-button" onClick={handleClockInOut}>
                <Clock size={24} />
              </button>
            </ClockInCard>

            {/* Quick Status Overview */}
            <SectionHeader>
              <h3>
                <Activity size={20} />
                Quick Status
              </h3>
            </SectionHeader>

            <Card variant="success">
              <div className="card-header">
                <div className="title">
                  <Target size={16} />
                  Current Assignment
                </div>
              </div>
              <div className="card-content">
                <strong>{guardProfile.post_assignment}</strong><br />
                Zone: {guardProfile.zone}<br />
                Shift: {guardProfile.shift_start} - {guardProfile.shift_end}
              </div>
            </Card>

            {/* Recent Check-ins */}
            <SectionHeader>
              <h3>
                <MapPin size={20} />
                Patrol Check-ins
              </h3>
            </SectionHeader>

            {checkPoints.map(checkpoint => (
              <Card key={checkpoint.checkpoint_id}>
                <div className="card-header">
                  <div className="title">
                    <MapPin size={16} />
                    {checkpoint.name}
                  </div>
                  <div className="timestamp">
                    {checkpoint.last_check_in ? 
                      new Date(checkpoint.last_check_in).toLocaleTimeString() : 
                      'Not visited'
                    }
                  </div>
                </div>
                <div className="card-content">
                  Location: {checkpoint.location}<br />
                  Checks: {checkpoint.required_checks.join(', ')}
                </div>
                <div className="card-actions">
                  <ActionButton 
                    variant="primary" 
                    onClick={() => handleCheckIn(checkpoint.checkpoint_id)}
                  >
                    <CheckCircle size={14} />
                    Check In
                  </ActionButton>
                </div>
              </Card>
            ))}
          </PageContainer>
        );

      case 'alerts':
        return (
          <PageContainer>
            <SectionHeader>
              <h3>
                <AlertTriangle size={20} />
                AI Security Alerts
              </h3>
              <span style={{ fontSize: '0.9rem', color: '#B0B0B0' }}>
                {pendingAlerts} pending
              </span>
            </SectionHeader>

            {aiAlerts.map(alert => (
              <Card key={alert.alert_id} priority={alert.priority}>
                <div className="card-header">
                  <div className="title">
                    <Camera size={16} />
                    {alert.alert_type}
                  </div>
                  <div className="timestamp">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="card-content">
                  <strong>Location:</strong> {alert.location_details}<br />
                  <strong>Camera:</strong> {alert.camera_location}<br />
                  {alert.description}
                </div>
                <div className="card-actions">
                  <ActionButton 
                    variant="primary" 
                    onClick={() => handleAcknowledgeAlert(alert.alert_id)}
                  >
                    <Eye size={14} />
                    Acknowledge
                  </ActionButton>
                  {alert.requires_response && (
                    <ActionButton 
                      variant="secondary" 
                      onClick={() => handleRespondToAlert(alert.alert_id)}
                    >
                      <Navigation size={14} />
                      Respond
                    </ActionButton>
                  )}
                </div>
              </Card>
            ))}

            {aiAlerts.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#666',
                fontStyle: 'italic'
              }}>
                No active alerts. System monitoring...
              </div>
            )}
          </PageContainer>
        );

      case 'messages':
        return (
          <PageContainer>
            <SectionHeader>
              <h3>
                <MessageSquare size={20} />
                Dispatch Messages
              </h3>
            </SectionHeader>

            {/* Message Composer */}
            <MessageComposer>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Send message to dispatch..."
              />
              <div className="composer-actions">
                <div className="attachment-buttons">
                  <ActionButton variant="secondary">
                    <ImageIcon size={14} />
                  </ActionButton>
                  <ActionButton variant="secondary">
                    <Camera size={14} />
                  </ActionButton>
                  <ActionButton variant="secondary">
                    <Mic size={14} />
                  </ActionButton>
                </div>
                <ActionButton variant="primary" onClick={handleSendMessage}>
                  <Send size={14} />
                  Send
                </ActionButton>
              </div>
            </MessageComposer>

            {/* Message List */}
            {messages.map(message => (
              <Card key={message.message_id} priority={message.priority}>
                <div className="card-header">
                  <div className="title">
                    <Radio size={16} />
                    {message.subject}
                  </div>
                  <div className="timestamp">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="card-content">
                  <strong>From:</strong> {message.from}<br />
                  {message.content}
                </div>
                {message.requires_acknowledgment && !message.acknowledged && (
                  <div className="card-actions">
                    <ActionButton 
                      variant="primary" 
                      onClick={() => handleAcknowledgeMessage(message.message_id)}
                    >
                      <CheckCircle size={14} />
                      Acknowledge
                    </ActionButton>
                  </div>
                )}
                {message.acknowledged && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#22C55E', 
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <CheckCircle size={12} />
                    Acknowledged
                  </div>
                )}
              </Card>
            ))}
          </PageContainer>
        );

      case 'reports':
        return (
          <PageContainer>
            <SectionHeader>
              <h3>
                <FileText size={20} />
                Incident Reports
              </h3>
              <ActionButton variant="primary">
                <PlusCircle size={16} />
                New Report
              </ActionButton>
            </SectionHeader>

            <Card>
              <div className="card-header">
                <div className="title">
                  <Upload size={16} />
                  Quick Report
                </div>
              </div>
              <div className="card-content">
                Create a quick incident report with photos and description.
              </div>
              <div className="card-actions">
                <ActionButton variant="primary">
                  <Camera size={14} />
                  Photo Report
                </ActionButton>
                <ActionButton variant="secondary">
                  <FileText size={14} />
                  Text Report
                </ActionButton>
              </div>
            </Card>

            {/* Draft Reports */}
            {incidentDrafts.map(report => (
              <Card key={report.incident_id}>
                <div className="card-header">
                  <div className="title">
                    <FileText size={16} />
                    {report.type.toUpperCase()} - {report.severity}
                  </div>
                  <div className="timestamp">
                    {new Date(report.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="card-content">
                  <strong>Location:</strong> {report.location}<br />
                  {report.description}
                </div>
                <div className="card-actions">
                  <ActionButton variant="primary">
                    <Edit size={14} />
                    Edit
                  </ActionButton>
                  <ActionButton variant="success">
                    <Send size={14} />
                    Submit
                  </ActionButton>
                </div>
              </Card>
            ))}

            {incidentDrafts.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#666',
                fontStyle: 'italic'
              }}>
                No draft reports. Tap &quot;New Report&quot; to create one.
              </div>
            )}
          </PageContainer>
        );

      case 'profile':
        return (
          <PageContainer>
            <SectionHeader>
              <h3>
                <User size={20} />
                Guard Profile
              </h3>
              <ActionButton variant="secondary">
                <Settings size={16} />
                Settings
              </ActionButton>
            </SectionHeader>

            <Card>
              <div className="card-header">
                <div className="title">
                  <Shield size={16} />
                  Personal Information
                </div>
              </div>
              <div className="card-content">
                <strong>Name:</strong> {guardProfile.name}<br />
                <strong>Employee ID:</strong> {guardProfile.employee_id}<br />
                <strong>Current Assignment:</strong> {guardProfile.post_assignment}<br />
                <strong>Zone:</strong> {guardProfile.zone}
              </div>
            </Card>

            <Card>
              <div className="card-header">
                <div className="title">
                  <Calendar size={16} />
                  Current Shift
                </div>
              </div>
              <div className="card-content">
                <strong>Shift Time:</strong> {guardProfile.shift_start} - {guardProfile.shift_end}<br />
                <strong>Status:</strong> <span style={getStatusBadgeStyle(guardProfile.status)}>
                  {guardProfile.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </Card>

            <Card>
              <div className="card-header">
                <div className="title">
                  <Phone size={16} />
                  Emergency Contacts
                </div>
              </div>
              <div className="card-content">
                <strong>Dispatch:</strong> +1-555-DISPATCH<br />
                <strong>Security Operations:</strong> +1-555-SECURITY<br />
                <strong>Emergency Services:</strong> 911
              </div>
              <div className="card-actions">
                <ActionButton variant="danger">
                  <Phone size={14} />
                  Emergency Call
                </ActionButton>
              </div>
            </Card>
          </PageContainer>
        );

      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <ThemeProvider theme={{}}>
      <GlobalStyle />
      <MobileContainer>
        {/* Mobile Status Bar */}
        <StatusBar>
          <div className="left-indicators">
            <span>09:41</span>
          </div>
          <div className="right-indicators">
            <Signal size={14} />
            <Wifi size={14} />
            <Battery size={14} />
            <span>85%</span>
          </div>
        </StatusBar>

        {/* App Header */}
        <Header>
          <div className="header-top">
            <div className="logo">
              <Shield size={20} />
              Apex Guard
            </div>
            <button className="emergency-btn">
              <AlertTriangle size={14} />
              EMERGENCY
            </button>
          </div>
          
          <div className="guard-status">
            <div className="guard-info">
              <div className="name">{guardProfile.name}</div>
              <div className="assignment">{guardProfile.post_assignment}</div>
            </div>
            <div className="clock-status">
              <div 
                className="status-badge" 
                style={getStatusBadgeStyle(guardProfile.status)}
              >
                {guardProfile.status.replace('_', ' ')}
              </div>
              <div className="shift-time">
                {guardProfile.shift_start} - {guardProfile.shift_end}
              </div>
            </div>
          </div>
        </Header>

        {/* Main Content */}
        <MainContent>
          {renderContent()}
        </MainContent>

        {/* Bottom Navigation */}
        <BottomNavigation>
          {navItems.map(item => (
            <NavItem
              key={item.id}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            >
              <div style={{ position: 'relative' }}>
                <item.icon size={20} className="nav-icon" />
                {item.badge && item.badge > 0 && (
                  <AlertBadge priority={item.id === 'alerts' ? 'high' : 'medium'}>
                    {item.badge}
                  </AlertBadge>
                )}
              </div>
              {item.label}
            </NavItem>
          ))}
        </BottomNavigation>
      </MobileContainer>
    </ThemeProvider>
  );
};

export default GuardMobileApp;