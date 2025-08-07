/**
 * APEX AI FACE MANAGEMENT DASHBOARD
 * =================================
 * Complete face recognition management interface
 * 
 * Features:
 * - Face enrollment and management
 * - Real-time detection monitoring
 * - Analytics and reporting
 * - Bulk upload capabilities
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Users,
  UserPlus,
  Camera,
  AlertTriangle,
  BarChart3,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Eye,
  Settings
} from 'lucide-react';

// Import sub-components
import FaceEnrollment from './FaceEnrollment';
import FaceProfileList from './FaceProfileList';
import FaceDetectionLog from './FaceDetectionLog';
import FaceAnalytics from './FaceAnalytics';
import BulkFaceUpload from './BulkFaceUpload';

// Styled Components
const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.black} 0%, ${props => props.theme.colors.gray[900]} 100%);
  color: ${props => props.theme.colors.white};
  font-family: ${props => props.theme.typography.fontFamily.primary};
`;

const Header = styled.div`
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem 2rem;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${props => props.theme.colors.gold[500]}40;
  
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: ${props => props.theme.typography.fontFamily.primary};
  
  svg {
    color: ${props => props.theme.colors.gold[500]};
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const ActionButton = styled.button`
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid ${props => props.theme.colors.gold[500]}40;
  color: ${props => props.theme.colors.white};
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  font-family: ${props => props.theme.typography.fontFamily.primary};
  
  &:hover {
    background: rgba(0, 0, 0, 0.3);
    border-color: ${props => props.theme.colors.gold[500]};
    transform: translateY(-1px);
  }
  
  &.primary {
    background: ${props => props.theme.colors.gold[500]};
    border-color: ${props => props.theme.colors.gold[500]};
    color: ${props => props.theme.colors.black};
    
    &:hover {
      background: ${props => props.theme.colors.gold[400]};
    }
  }
  
  &.danger {
    background: ${props => props.theme.colors.destructive.DEFAULT};
    border-color: ${props => props.theme.colors.destructive.DEFAULT};
    
    &:hover {
      background: #dc2626;
    }
  }
`;

const StatsBar = styled.div`
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.gold[500]}40;
`;

const StatCard = styled.div`
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.theme.colors.gold[500]}20;
  font-family: ${props => props.theme.typography.fontFamily.primary};
  
  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .stat-title {
    font-size: 0.875rem;
    opacity: 0.8;
    margin: 0;
  }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    color: ${props => props.theme.colors.gold[400]};
  }
  
  .stat-change {
    font-size: 0.75rem;
    margin-top: 0.25rem;
    
    &.positive {
      color: ${props => props.theme.colors.gold[500]};
    }
    
    &.negative {
      color: ${props => props.theme.colors.destructive.DEFAULT};
    }
  }
`;

const TabsContainer = styled.div`
  background: rgba(0, 0, 0, 0.1);
  padding: 0 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const TabsList = styled.div`
  display: flex;
  gap: 0;
`;

const Tab = styled.button`
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  font-family: ${props => props.theme.typography.fontFamily.primary};
  
  &:hover {
    color: ${props => props.theme.colors.white};
    background: rgba(0, 0, 0, 0.1);
  }
  
  &.active {
    color: ${props => props.theme.colors.white};
    border-bottom-color: ${props => props.theme.colors.gold[500]};
    background: rgba(0, 0, 0, 0.2);
  }
`;

const ContentArea = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const TabContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
`;

const AlertBanner = styled.div`
  background: rgba(239, 68, 68, 0.9);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid ${props => props.theme.colors.gold[500]}40;
  font-family: ${props => props.theme.typography.fontFamily.primary};
  
  .alert-icon {
    color: ${props => props.theme.colors.white};
  }
  
  .alert-text {
    flex: 1;
    font-weight: 500;
  }
  
  .alert-action {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid ${props => props.theme.colors.gold[500]}40;
    color: ${props => props.theme.colors.white};
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    
    &:hover {
      background: rgba(0, 0, 0, 0.3);
      border-color: ${props => props.theme.colors.gold[500]};
    }
  }
`;

// Tab definitions
const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'profiles', label: 'Face Profiles', icon: Users },
  { id: 'enroll', label: 'Enroll Faces', icon: UserPlus },
  { id: 'detections', label: 'Live Detections', icon: Eye },
  { id: 'bulk-upload', label: 'Bulk Upload', icon: Upload },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export interface FaceManagementDashboardProps {
  className?: string;
}

const FaceManagementDashboard: React.FC<FaceManagementDashboardProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalFaces: 0,
    activeFaces: 0,
    todayDetections: 0,
    unknownDetections: 0,
    alertsGenerated: 0,
    systemStatus: 'online'
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load face recognition statistics
      const response = await fetch('/api/faces/analytics/summary');
      const data = await response.json();
      
      if (data.success) {
        // Process analytics data
        const profileSummary = data.analytics.profile_summary || [];
        const detectionTrends = data.analytics.detection_trends || [];
        
        const totalFaces = profileSummary.reduce((sum, item) => sum + item.count, 0);
        const activeFaces = profileSummary
          .filter(item => item.status === 'active')
          .reduce((sum, item) => sum + item.count, 0);
        
        const todayDetections = detectionTrends.length > 0 
          ? detectionTrends[0].total_detections 
          : 0;
        
        const unknownDetections = detectionTrends.length > 0 
          ? detectionTrends[0].unknown_detections 
          : 0;
        
        setStats({
          totalFaces,
          activeFaces,
          todayDetections,
          unknownDetections,
          alertsGenerated: 0, // Will be loaded from alerts API
          systemStatus: 'online'
        });
      }
      
      // Load recent face-related alerts
      const alertsResponse = await fetch('/api/ai-alerts?limit=5&alert_type=unknown_person_face,security_threat');
      const alertsData = await alertsResponse.json();
      
      if (alertsData.success) {
        setRecentAlerts(alertsData.alerts || []);
      }
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setStats(prev => ({ ...prev, systemStatus: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <FaceAnalytics stats={stats} recentAlerts={recentAlerts} />;
      case 'profiles':
        return <FaceProfileList onRefresh={handleRefresh} />;
      case 'enroll':
        return <FaceEnrollment onSuccess={handleRefresh} />;
      case 'detections':
        return <FaceDetectionLog />;
      case 'bulk-upload':
        return <BulkFaceUpload onSuccess={handleRefresh} />;
      case 'settings':
        return <div>Settings component coming soon...</div>;
      default:
        return <div>Tab content not found</div>;
    }
  };

  const hasRecentSecurityAlerts = recentAlerts.some(
    alert => alert.priority === 'critical' || alert.alert_type === 'security_threat'
  );

  return (
    <DashboardContainer className={className}>
      {/* Security Alert Banner */}
      {hasRecentSecurityAlerts && (
        <AlertBanner>
          <AlertTriangle className="alert-icon" size={20} />
          <span className="alert-text">
            Security Alert: {recentAlerts.filter(a => a.priority === 'critical').length} critical face recognition alerts require attention
          </span>
          <button 
            className="alert-action"
            onClick={() => setActiveTab('detections')}
          >
            View Alerts
          </button>
        </AlertBanner>
      )}
      
      {/* Header */}
      <Header>
        <Title>
          <Shield size={24} />
          Face Recognition Management
        </Title>
        <HeaderActions>
          <ActionButton onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw size={16} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </ActionButton>
          <ActionButton 
            className="primary" 
            onClick={() => setActiveTab('enroll')}
          >
            <UserPlus size={16} />
            Enroll Face
          </ActionButton>
        </HeaderActions>
      </Header>
      
      {/* Statistics Bar */}
      <StatsBar>
        <StatCard>
          <div className="stat-header">
            <h3 className="stat-title">Total Face Profiles</h3>
            <Users size={20} style={{ opacity: 0.7 }} />
          </div>
          <p className="stat-value">{stats.totalFaces.toLocaleString()}</p>
          <p className="stat-change positive">+{stats.activeFaces} active</p>
        </StatCard>
        
        <StatCard>
          <div className="stat-header">
            <h3 className="stat-title">Today's Detections</h3>
            <Camera size={20} style={{ opacity: 0.7 }} />
          </div>
          <p className="stat-value">{stats.todayDetections.toLocaleString()}</p>
          <p className="stat-change">{stats.unknownDetections} unknown</p>
        </StatCard>
        
        <StatCard>
          <div className="stat-header">
            <h3 className="stat-title">Security Alerts</h3>
            <AlertTriangle size={20} style={{ opacity: 0.7 }} />
          </div>
          <p className="stat-value">{recentAlerts.length}</p>
          <p className="stat-change">
            {recentAlerts.filter(a => a.priority === 'critical').length} critical
          </p>
        </StatCard>
        
        <StatCard>
          <div className="stat-header">
            <h3 className="stat-title">System Status</h3>
            <Eye size={20} style={{ opacity: 0.7 }} />
          </div>
          <p className="stat-value" style={{ 
            color: stats.systemStatus === 'online' ? props => props.theme ? props.theme.colors.gold[500] : '#FFD700' : props => props.theme ? props.theme.colors.destructive.DEFAULT : '#ef4444'
          }}>
            {stats.systemStatus.toUpperCase()}
          </p>
          <p className="stat-change">Face Recognition Engine</p>
        </StatCard>
      </StatsBar>
      
      {/* Navigation Tabs */}
      <TabsContainer>
        <TabsList>
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <Tab
                key={tab.id}
                className={activeTab === tab.id ? 'active' : ''}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent size={16} />
                {tab.label}
              </Tab>
            );
          })}
        </TabsList>
      </TabsContainer>
      
      {/* Content Area */}
      <ContentArea>
        <TabContent>
          {renderTabContent()}
        </TabContent>
      </ContentArea>
    </DashboardContainer>
  );
};

export default FaceManagementDashboard;