/**
 * APEX AI DESKTOP - ADMIN DASHBOARD COMPONENT
 * ===========================================
 * Executive dashboard for admin oversight and system monitoring
 * Features: Real-time metrics, system health, property management, AI performance
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import EnhancedCard from './EnhancedCard';
import { 
  Shield,
  ShieldCheck,
  Clock,
  Image as ImageIcon,
  AlertTriangle,
  TrendingUp,
  Eye,
  ArrowDownTray,
  Bolt,
  ChartBar,
  Calendar,
  Building2,
  Users,
  Activity,
  Settings,
  Zap,
  FileImage,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

// ===========================
// STYLED COMPONENTS
// ===========================

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.backgroundLight};
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
`;

const HeaderControls = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  align-items: center;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.backgroundCard};
  color: ${props => props.theme.colors.text};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.backgroundLight};
    border-color: ${props => props.theme.colors.primary};
  }

  ${props => props.isLoading && `
    opacity: 0.7;
    pointer-events: none;
  `}
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 14px;
  font-weight: 500;
  
  ${props => props.status === 'healthy' && `
    background: rgba(34, 197, 94, 0.1);
    color: ${props.theme.colors.success};
  `}
  
  ${props => props.status === 'warning' && `
    background: rgba(245, 158, 11, 0.1);
    color: ${props.theme.colors.warning};
  `}
  
  ${props => props.status === 'error' && `
    background: rgba(239, 68, 68, 0.1);
    color: ${props.theme.colors.error};
  `}
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.lg};
  overflow-y: auto;
  flex: 1;
`;

const ErrorMessage = styled.div`
  padding: ${props => props.theme.spacing.lg};
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid ${props => props.theme.colors.error};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.error};
  display: flex;
  align-items: center;
  gap: 12px;
  margin: ${props => props.theme.spacing.lg};
`;

const LoadingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
  gap: 16px;
  color: ${props => props.theme.colors.textMuted};
`;

const SpinIcon = styled.div`
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// ===========================
// MAIN COMPONENT
// ===========================

const AdminDashboard = () => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [dashboardData, setDashboardData] = useState({
    systemHealth: {
      value: '98.7%',
      change: 0.3,
      trend: 'up',
      details: [
        { label: 'Cameras Online', value: '47/48', status: 'good' },
        { label: 'AI Systems', value: 'Optimal', status: 'good' },
        { label: 'Network', value: 'Stable', status: 'good' },
        { label: 'Database', value: 'Connected', status: 'good' }
      ]
    },
    responseTime: {
      value: '1.2s',
      change: -15.8,
      trend: 'up',
      details: [
        { label: 'Avg API Response', value: '890ms', status: 'good' },
        { label: 'AI Processing', value: '340ms', status: 'good' },
        { label: 'Database Query', value: '120ms', status: 'good' }
      ]
    },
    aiConfidence: {
      value: '94.2%',
      change: 2.1,
      trend: 'up',
      details: [
        { label: 'Person Detection', value: '96.8%', status: 'good' },
        { label: 'Object Recognition', value: '93.1%', status: 'good' },
        { label: 'Threat Analysis', value: '92.7%', status: 'good' }
      ]
    },
    activeIncidents: {
      value: '7',
      change: -22.2,
      trend: 'up',
      details: [
        { label: 'Critical', value: '0', status: 'good' },
        { label: 'High Priority', value: '2', status: 'warning' },
        { label: 'Medium Priority', value: '3', status: 'good' },
        { label: 'Low Priority', value: '2', status: 'good' }
      ]
    },
    evidenceManagement: {
      value: '156',
      change: 8.4,
      trend: 'up',
      details: [
        { label: 'Video Files', value: '89', status: 'good' },
        { label: 'Images', value: '45', status: 'good' },
        { label: 'Audio Records', value: '22', status: 'good' }
      ]
    },
    propertyStats: {
      value: '12',
      change: 0,
      trend: 'neutral',
      details: [
        { label: 'Active Properties', value: '12', status: 'good' },
        { label: 'Cameras Total', value: '48', status: 'good' },
        { label: 'Avg Uptime', value: '99.1%', status: 'good' }
      ]
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState('healthy');

  // Sample preview data for charts
  const samplePreviewData = {
    chartData: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: Math.floor(Math.random() * 20) + 80,
      label: `${Math.floor(Math.random() * 20) + 80}%`
    })),
    additionalInfo: 'Data collected over the last 7 days'
  };

  // ===========================
  // DATA FETCHING
  // ===========================

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      
      // Simulate API call for now - in real implementation, this would fetch from backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, we'll use mock data with some randomization to simulate real-time updates
      setDashboardData(prevData => ({
        ...prevData,
        systemHealth: {
          ...prevData.systemHealth,
          value: `${(97 + Math.random() * 2).toFixed(1)}%`,
          change: (Math.random() * 2 - 1).toFixed(1)
        },
        responseTime: {
          ...prevData.responseTime,
          value: `${(1 + Math.random() * 0.5).toFixed(1)}s`,
          change: (Math.random() * 20 - 10).toFixed(1)
        },
        aiConfidence: {
          ...prevData.aiConfidence,
          value: `${(92 + Math.random() * 6).toFixed(1)}%`,
          change: (Math.random() * 4 - 2).toFixed(1)
        },
        activeIncidents: {
          ...prevData.activeIncidents,
          value: Math.floor(Math.random() * 15).toString()
        }
      }));
      
      setLastUpdated(new Date());
      setSystemStatus('healthy');
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
      setSystemStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleCardClick = (cardType) => {
    console.log(`Card clicked: ${cardType}`);
    // In real implementation, this would navigate to detailed views
  };

  const handleQuickAction = (action) => {
    console.log(`Quick action: ${action}`);
    // In real implementation, this would trigger specific actions
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  // ===========================
  // RENDER HELPERS
  // ===========================

  const getSystemStatusIcon = () => {
    switch (systemStatus) {
      case 'healthy': return <ShieldCheck size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'error': return <AlertTriangle size={16} />;
      default: return <Shield size={16} />;
    }
  };

  // ===========================
  // MAIN RENDER
  // ===========================

  if (error) {
    return (
      <DashboardContainer>
        <DashboardHeader>
          <Title>
            <Shield size={32} />
            Admin Dashboard
          </Title>
        </DashboardHeader>
        
        <ErrorMessage>
          <AlertTriangle size={20} />
          <div>
            <strong>Dashboard Error:</strong> {error}
            <div style={{ marginTop: '8px' }}>
              <button 
                onClick={handleRefresh}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'inherit', 
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                Try refreshing the dashboard
              </button>
            </div>
          </div>
        </ErrorMessage>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <DashboardHeader>
        <Title>
          <Shield size={32} />
          Admin Dashboard
        </Title>
        
        <HeaderControls>
          <div style={{ fontSize: '14px', color: '#888' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          
          <StatusIndicator status={systemStatus}>
            {getSystemStatusIcon()}
            System {systemStatus === 'healthy' ? 'Healthy' : systemStatus}
          </StatusIndicator>
          
          <RefreshButton onClick={handleRefresh} isLoading={isLoading}>
            <SpinIcon style={{ animationPlayState: isLoading ? 'running' : 'paused' }}>
              <RefreshCw size={16} />
            </SpinIcon>
            Refresh
          </RefreshButton>
        </HeaderControls>
      </DashboardHeader>

      {isLoading && (
        <LoadingOverlay>
          <SpinIcon>
            <RefreshCw size={32} />
          </SpinIcon>
          <div>Loading dashboard data...</div>
        </LoadingOverlay>
      )}

      {!isLoading && (
        <DashboardGrid>
          {/* System Health Card */}
          <EnhancedCard
            title="System Health"
            icon={<Shield className="w-6 h-6" />}
            solidIcon={<ShieldCheck className="w-6 h-6" />}
            data={{
              ...dashboardData.systemHealth,
              previewData: {
                ...samplePreviewData,
                chartData: Array.from({ length: 7 }, (_, i) => ({
                  date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  value: Math.floor(Math.random() * 3) + 97,
                  label: `${Math.floor(Math.random() * 3) + 97}%`
                }))
              },
              quickActions: [
                {
                  label: 'Details',
                  action: 'system_details',
                  icon: <Eye className="w-3 h-3" />,
                  variant: 'primary'
                },
                {
                  label: 'Diagnose',
                  action: 'system_diagnose',
                  icon: <Settings className="w-3 h-3" />,
                  variant: 'secondary'
                }
              ]
            }}
            theme="success"
            onClick={() => handleCardClick('system_health')}
            onQuickAction={(action) => handleQuickAction(action)}
            showPreview={true}
          />

          {/* Response Time Card - COMPLETING THE INCOMPLETE CODE! */}
          <EnhancedCard
            title="Avg Response Time"
            icon={<Clock className="w-6 h-6" />}
            solidIcon={<Clock className="w-6 h-6" />}
            data={{
              ...dashboardData.responseTime,
              previewData: {
                ...samplePreviewData,
                chartData: Array.from({ length: 7 }, (_, i) => ({
                  date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  value: Math.floor(Math.random() * 60) + 90,
                  label: `${Math.floor(Math.random() * 60) + 90}s`
                }))
              },
              quickActions: [
                {
                  label: 'Improve',
                  action: 'improve_response',
                  icon: <TrendingUp className="w-3 h-3" />,
                  variant: 'success'
                },
                {
                  label: 'History',
                  action: 'response_history',
                  icon: <Calendar className="w-3 h-3" />,
                  variant: 'secondary'  // THIS COMPLETES THE INCOMPLETE CODE!
                }
              ]
            }}
            theme="primary"
            onClick={() => handleCardClick('response_time')}
            onQuickAction={(action) => handleQuickAction(action)}
            showPreview={true}
          />

          {/* AI Confidence Card */}
          <EnhancedCard
            title="AI Confidence"
            icon={<Zap className="w-6 h-6" />}
            solidIcon={<Bolt className="w-6 h-6" />}
            data={{
              ...dashboardData.aiConfidence,
              previewData: {
                ...samplePreviewData,
                chartData: Array.from({ length: 7 }, (_, i) => ({
                  date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  value: Math.floor(Math.random() * 10) + 90,
                  label: `${Math.floor(Math.random() * 10) + 90}%`
                }))
              },
              quickActions: [
                {
                  label: 'Optimize',
                  action: 'optimize_ai',
                  icon: <Bolt className="w-3 h-3" />,
                  variant: 'success'
                },
                {
                  label: 'Analysis',
                  action: 'ai_analysis',
                  icon: <ChartBar className="w-3 h-3" />,
                  variant: 'primary'
                }
              ]
            }}
            theme="purple"
            onClick={() => handleCardClick('ai_confidence')}
            onQuickAction={(action) => handleQuickAction(action)}
            showPreview={true}
          />

          {/* Active Incidents Card */}
          <EnhancedCard
            title="Active Incidents"
            icon={<AlertTriangle className="w-6 h-6" />}
            solidIcon={<AlertTriangle className="w-6 h-6" />}
            data={{
              ...dashboardData.activeIncidents,
              previewData: {
                ...samplePreviewData,
                chartData: Array.from({ length: 7 }, (_, i) => ({
                  date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  value: Math.floor(Math.random() * 15) + 5,
                  label: `${Math.floor(Math.random() * 15) + 5}`
                }))
              },
              quickActions: [
                {
                  label: 'View All',
                  action: 'view_incidents',
                  icon: <Eye className="w-3 h-3" />,
                  variant: 'primary'
                },
                {
                  label: 'Filter',
                  action: 'filter_incidents',
                  icon: <Filter className="w-3 h-3" />,
                  variant: 'secondary'
                }
              ]
            }}
            theme="warning"
            onClick={() => handleCardClick('active_incidents')}
            onQuickAction={(action) => handleQuickAction(action)}
            showPreview={true}
          />

          {/* Evidence Management Card */}
          <EnhancedCard
            title="Evidence Files"
            icon={<FileImage className="w-6 h-6" />}
            solidIcon={<ImageIcon className="w-6 h-6" />}
            data={{
              ...dashboardData.evidenceManagement,
              previewData: {
                ...samplePreviewData,
                chartData: Array.from({ length: 7 }, (_, i) => ({
                  date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  value: Math.floor(Math.random() * 50) + 100,
                  label: `${Math.floor(Math.random() * 50) + 100}`
                }))
              },
              distribution: [
                { label: 'Video Files', value: 89, percentage: 57, color: '#3b82f6' },
                { label: 'Images', value: 45, percentage: 29, color: '#10b981' },
                { label: 'Audio', value: 22, percentage: 14, color: '#f59e0b' }
              ],
              quickActions: [
                {
                  label: 'Browse',
                  action: 'browse_evidence',
                  icon: <Eye className="w-3 h-3" />,
                  variant: 'primary'
                },
                {
                  label: 'Export',
                  action: 'export_evidence',
                  icon: <ArrowDownTray className="w-3 h-3" />,
                  variant: 'secondary'
                }
              ]
            }}
            theme="info"
            onClick={() => handleCardClick('evidence')}
            onQuickAction={(action) => handleQuickAction(action)}
            showPreview={true}
          />

          {/* Property Statistics Card */}
          <EnhancedCard
            title="Property Overview"
            icon={<Building2 className="w-6 h-6" />}
            solidIcon={<Building2 className="w-6 h-6" />}
            data={{
              ...dashboardData.propertyStats,
              previewData: {
                ...samplePreviewData,
                chartData: Array.from({ length: 7 }, (_, i) => ({
                  date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  value: 12,
                  label: '12 properties'
                }))
              },
              quickActions: [
                {
                  label: 'Manage',
                  action: 'manage_properties',
                  icon: <Settings className="w-3 h-3" />,
                  variant: 'primary'
                },
                {
                  label: 'Add New',
                  action: 'add_property',
                  icon: <Building2 className="w-3 h-3" />,
                  variant: 'success'
                }
              ]
            }}
            theme="info"
            onClick={() => handleCardClick('properties')}
            onQuickAction={(action) => handleQuickAction(action)}
            showPreview={true}
          />
        </DashboardGrid>
      )}
    </DashboardContainer>
  );
};

export default AdminDashboard;
