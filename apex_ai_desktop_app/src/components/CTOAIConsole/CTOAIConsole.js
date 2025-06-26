/**
 * CTO AI CONSOLE COMPONENT
 * ========================
 * Configuration and management interface for AI system
 * Features: Camera management, AI model selection, rule configuration
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ConsoleContainer = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background};
`;

const Sidebar = styled.div`
  background-color: ${props => props.theme.colors.backgroundCard};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const SidebarTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const NavButton = styled.button`
  background: ${props => props.active ? props.theme.colors.primary : 'transparent'};
  color: ${props => props.active ? props.theme.colors.background : props.theme.colors.text};
  border: 1px solid ${props => props.active ? props.theme.colors.primary : props.theme.colors.border};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};

  &:hover {
    background: ${props => props.active ? props.theme.colors.primaryDark : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const MainContent = styled.div`
  background-color: ${props => props.theme.colors.backgroundCard};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  overflow-y: auto;
`;

const ContentTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const FormSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const SectionTitle = styled.h4`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  padding-bottom: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${props => props.theme.spacing.md};
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text};
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.backgroundLight};
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textMuted};
  }
`;

const Select = styled.select`
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.backgroundLight};
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Button = styled.button`
  background: ${props => {
    if (props.variant === 'danger') return props.theme.colors.error;
    if (props.variant === 'secondary') return 'transparent';
    return props.theme.colors.primary;
  }};
  color: ${props => {
    if (props.variant === 'secondary') return props.theme.colors.text;
    return props.theme.colors.background;
  }};
  border: 1px solid ${props => {
    if (props.variant === 'danger') return props.theme.colors.error;
    if (props.variant === 'secondary') return props.theme.colors.border;
    return props.theme.colors.primary;
  }};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${props => props.theme.spacing.md};
`;

const TableHeader = styled.thead`
  background-color: ${props => props.theme.colors.backgroundLight};
`;

const TableHeaderCell = styled.th`
  padding: ${props => props.theme.spacing.sm};
  text-align: left;
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.02);
  }
`;

const TableCell = styled.td`
  padding: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};
`;

const StatusIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  background-color: ${props => {
    switch (props.status) {
      case 'active': return props.theme.colors.success;
      case 'inactive': return props.theme.colors.textMuted;
      case 'error': return props.theme.colors.error;
      default: return props.theme.colors.warning;
    }
  }};
  color: white;
`;

const StatCard = styled.div`
  background-color: ${props => props.theme.colors.backgroundLight};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  text-align: center;
`;

const StatValue = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.textSecondary};
`;

function CTOAIConsole() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [cameras, setCameras] = useState([]);
  const [aiModels, setAIModels] = useState([]);
  const [aiRules, setAIRules] = useState({});
  const [systemStats, setSystemStats] = useState({});

  // Navigation sections
  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'cameras', label: 'Camera Management', icon: '📹' },
    { id: 'models', label: 'AI Models', icon: '🧠' },
    { id: 'rules', label: 'AI Rules & Zones', icon: '⚙️' },
    { id: 'system', label: 'System Settings', icon: '🔧' }
  ];

  // Initialize demo data
  useEffect(() => {
    initializeDemoData();
  }, []);

  const initializeDemoData = () => {
    // Demo cameras
    setCameras([
      {
        id: 'cam_entrance_1',
        name: 'Main Entrance',
        rtspUrl: 'rtsp://demo.example.com/stream1',
        location: 'Building A - Ground Floor',
        status: 'active',
        aiEnabled: true,
        resolution: '1920x1080',
        fps: 30
      },
      {
        id: 'cam_parking_1',
        name: 'Parking Garage',
        rtspUrl: 'rtsp://demo.example.com/stream2',
        location: 'Underground Parking',
        status: 'active',
        aiEnabled: true,
        resolution: '1920x1080',
        fps: 25
      },
      {
        id: 'cam_elevator_1',
        name: 'Elevator Bank',
        rtspUrl: 'rtsp://demo.example.com/stream3',
        location: 'Building A - Lobby',
        status: 'inactive',
        aiEnabled: false,
        resolution: '1280x720',
        fps: 15
      }
    ]);

    // Demo AI models
    setAIModels([
      {
        id: 'yolov8_person_v1',
        name: 'YOLOv8 Person Detection v1.0',
        type: 'person_detection',
        status: 'active',
        accuracy: 94.2,
        lastTrained: '2024-12-15',
        filePath: '/models/yolov8_person_v1.pt'
      },
      {
        id: 'yolov8_general_v2',
        name: 'YOLOv8 General Objects v2.1',
        type: 'object_detection',
        status: 'inactive',
        accuracy: 91.8,
        lastTrained: '2024-12-10',
        filePath: '/models/yolov8_general_v2.pt'
      }
    ]);

    // Demo AI rules
    setAIRules({
      loitering: {
        enabled: true,
        timeThreshold: 30, // seconds
        zones: ['entrance', 'elevator'],
        priority: 'medium'
      },
      zoneBreach: {
        enabled: true,
        restrictedZones: ['server_room', 'executive_area'],
        priority: 'high'
      },
      unknownPerson: {
        enabled: true,
        alertThreshold: 0.8,
        priority: 'high'
      }
    });

    // Demo system stats
    setSystemStats({
      totalCameras: 6,
      activeCameras: 4,
      aiProcessingLoad: 67,
      alertsToday: 12,
      detectionsToday: 156,
      systemUptime: '7 days, 14 hours'
    });
  };

  const renderDashboard = () => (
    <div>
      <ContentTitle>📊 AI System Dashboard</ContentTitle>
      
      <FormGrid style={{ marginBottom: '2rem' }}>
        <StatCard>
          <StatValue>{systemStats.activeCameras}/{systemStats.totalCameras}</StatValue>
          <StatLabel>Active Cameras</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{systemStats.aiProcessingLoad}%</StatValue>
          <StatLabel>AI Processing Load</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{systemStats.alertsToday}</StatValue>
          <StatLabel>Alerts Today</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{systemStats.detectionsToday}</StatValue>
          <StatLabel>Detections Today</StatLabel>
        </StatCard>
      </FormGrid>

      <FormSection>
        <SectionTitle>System Status</SectionTitle>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <StatusIndicator status="active">AI Engine: Running</StatusIndicator>
          <StatusIndicator status="active">Database: Connected</StatusIndicator>
          <StatusIndicator status="active">Streaming: Active</StatusIndicator>
          <div style={{ marginLeft: 'auto', color: '#888', fontSize: '14px' }}>
            Uptime: {systemStats.systemUptime}
          </div>
        </div>
      </FormSection>
    </div>
  );

  const renderCameraManagement = () => (
    <div>
      <ContentTitle>📹 Camera Management</ContentTitle>
      
      <FormSection>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <SectionTitle style={{ margin: 0 }}>Camera List</SectionTitle>
          <Button>+ Add Camera</Button>
        </div>
        
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Location</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>AI Enabled</TableHeaderCell>
              <TableHeaderCell>Resolution</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </tr>
          </TableHeader>
          <tbody>
            {cameras.map(camera => (
              <TableRow key={camera.id}>
                <TableCell>{camera.name}</TableCell>
                <TableCell>{camera.location}</TableCell>
                <TableCell>
                  <StatusIndicator status={camera.status}>
                    {camera.status}
                  </StatusIndicator>
                </TableCell>
                <TableCell>{camera.aiEnabled ? '✅' : '❌'}</TableCell>
                <TableCell>{camera.resolution}</TableCell>
                <TableCell>
                  <Button variant="secondary" style={{ marginRight: '8px', padding: '4px 8px', fontSize: '12px' }}>
                    Edit
                  </Button>
                  <Button variant="danger" style={{ padding: '4px 8px', fontSize: '12px' }}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </FormSection>
    </div>
  );

  const renderAIModels = () => (
    <div>
      <ContentTitle>🧠 AI Model Management</ContentTitle>
      
      <FormSection>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <SectionTitle style={{ margin: 0 }}>Available Models</SectionTitle>
          <Button>📤 Upload Model</Button>
        </div>
        
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>Model Name</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Accuracy</TableHeaderCell>
              <TableHeaderCell>Last Trained</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </tr>
          </TableHeader>
          <tbody>
            {aiModels.map(model => (
              <TableRow key={model.id}>
                <TableCell>{model.name}</TableCell>
                <TableCell>{model.type}</TableCell>
                <TableCell>
                  <StatusIndicator status={model.status}>
                    {model.status}
                  </StatusIndicator>
                </TableCell>
                <TableCell>{model.accuracy}%</TableCell>
                <TableCell>{model.lastTrained}</TableCell>
                <TableCell>
                  <Button 
                    variant={model.status === 'active' ? 'secondary' : 'primary'}
                    style={{ marginRight: '8px', padding: '4px 8px', fontSize: '12px' }}
                  >
                    {model.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="danger" style={{ padding: '4px 8px', fontSize: '12px' }}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </FormSection>
    </div>
  );

  const renderAIRules = () => (
    <div>
      <ContentTitle>⚙️ AI Rules & Detection Zones</ContentTitle>
      
      <FormSection>
        <SectionTitle>Loitering Detection</SectionTitle>
        <FormGrid>
          <FormField>
            <Label>Enable Loitering Detection</Label>
            <Select value={aiRules.loitering?.enabled ? 'true' : 'false'}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </Select>
          </FormField>
          <FormField>
            <Label>Time Threshold (seconds)</Label>
            <Input 
              type="number" 
              value={aiRules.loitering?.timeThreshold || 30}
              placeholder="30"
            />
          </FormField>
          <FormField>
            <Label>Alert Priority</Label>
            <Select value={aiRules.loitering?.priority || 'medium'}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection>
        <SectionTitle>Zone Breach Detection</SectionTitle>
        <FormGrid>
          <FormField>
            <Label>Enable Zone Breach Detection</Label>
            <Select value={aiRules.zoneBreach?.enabled ? 'true' : 'false'}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </Select>
          </FormField>
          <FormField>
            <Label>Alert Priority</Label>
            <Select value={aiRules.zoneBreach?.priority || 'high'}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection>
        <SectionTitle>Unknown Person Detection</SectionTitle>
        <FormGrid>
          <FormField>
            <Label>Enable Unknown Person Alerts</Label>
            <Select value={aiRules.unknownPerson?.enabled ? 'true' : 'false'}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </Select>
          </FormField>
          <FormField>
            <Label>Confidence Threshold</Label>
            <Input 
              type="number" 
              step="0.1"
              min="0"
              max="1"
              value={aiRules.unknownPerson?.alertThreshold || 0.8}
              placeholder="0.8"
            />
          </FormField>
          <FormField>
            <Label>Alert Priority</Label>
            <Select value={aiRules.unknownPerson?.priority || 'high'}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </FormField>
        </FormGrid>
      </FormSection>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <Button onClick={() => console.log('Saving AI rules...')}>
          💾 Save Configuration
        </Button>
        <Button variant="secondary">
          🔄 Reset to Defaults
        </Button>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div>
      <ContentTitle>🔧 System Settings</ContentTitle>
      
      <FormSection>
        <SectionTitle>AI Processing Settings</SectionTitle>
        <FormGrid>
          <FormField>
            <Label>Processing Threads</Label>
            <Select>
              <option value="1">1 Thread</option>
              <option value="2">2 Threads</option>
              <option value="4" selected>4 Threads</option>
              <option value="8">8 Threads</option>
            </Select>
          </FormField>
          <FormField>
            <Label>GPU Acceleration</Label>
            <Select>
              <option value="enabled" selected>Enabled (CUDA)</option>
              <option value="disabled">Disabled (CPU Only)</option>
            </Select>
          </FormField>
          <FormField>
            <Label>Detection Interval (ms)</Label>
            <Input type="number" value="100" placeholder="100" />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection>
        <SectionTitle>Storage & Retention</SectionTitle>
        <FormGrid>
          <FormField>
            <Label>Alert Retention (days)</Label>
            <Input type="number" value="30" placeholder="30" />
          </FormField>
          <FormField>
            <Label>Video Archive (days)</Label>
            <Input type="number" value="7" placeholder="7" />
          </FormField>
          <FormField>
            <Label>Database Cleanup</Label>
            <Select>
              <option value="auto" selected>Automatic</option>
              <option value="manual">Manual</option>
            </Select>
          </FormField>
        </FormGrid>
      </FormSection>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <Button>💾 Save Settings</Button>
        <Button variant="secondary">🔄 Reset to Defaults</Button>
        <Button variant="danger">🗑️ Clear All Data</Button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard();
      case 'cameras': return renderCameraManagement();
      case 'models': return renderAIModels();
      case 'rules': return renderAIRules();
      case 'system': return renderSystemSettings();
      default: return renderDashboard();
    }
  };

  return (
    <ConsoleContainer>
      <Sidebar>
        <SidebarTitle>⚙️ AI Console</SidebarTitle>
        {sections.map(section => (
          <NavButton
            key={section.id}
            active={activeSection === section.id}
            onClick={() => setActiveSection(section.id)}
          >
            <span>{section.icon}</span>
            {section.label}
          </NavButton>
        ))}
      </Sidebar>

      <MainContent>
        {renderContent()}
      </MainContent>
    </ConsoleContainer>
  );
}

export default CTOAIConsole;
