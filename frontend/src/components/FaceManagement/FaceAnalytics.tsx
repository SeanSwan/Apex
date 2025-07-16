/**
 * APEX AI FACE ANALYTICS COMPONENT
 * ================================
 * Comprehensive analytics dashboard for face recognition system
 * 
 * Features:
 * - Detection trends and statistics
 * - Camera performance analytics
 * - Top detected faces
 * - System health monitoring
 * - Interactive charts and graphs
 * - Export capabilities
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import {
  BarChart3,
  TrendingUp,
  Camera,
  Users,
  Eye,
  AlertTriangle,
  Clock,
  Activity,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  PieChart,
  Target,
  Zap,
  Shield,
  CheckCircle2,
  XCircle,
  Loader
} from 'lucide-react';

// Styled Components
const AnalyticsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Title = styled.h2`
  color: white;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

const TimeRangeSelect = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 0.5rem 1rem;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #4ade80;
  }
  
  option {
    background: #1f2937;
    color: white;
  }
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.primary {
    background: #4ade80;
    border-color: #4ade80;
    
    &:hover:not(:disabled) {
      background: #22c55e;
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 1rem;
`;

const StatTitle = styled.h3`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.primary {
    background: rgba(74, 222, 128, 0.2);
    color: #4ade80;
  }
  
  &.secondary {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }
  
  &.warning {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }
  
  &.danger {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
`;

const StatValue = styled.div`
  color: white;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const StatChange = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  
  &.positive {
    color: #4ade80;
  }
  
  &.negative {
    color: #ef4444;
  }
  
  &.neutral {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const ChartsSection = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ChartTitle = styled.h3`
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartBody = styled.div`
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  
  .placeholder {
    text-align: center;
    
    .placeholder-icon {
      margin-bottom: 1rem;
      opacity: 0.5;
    }
    
    .placeholder-text {
      font-size: 0.9rem;
    }
  }
`;

const TableSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TableCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const TableTitle = styled.h3`
  color: white;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Table = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const TableRowLabel = styled.div`
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
`;

const TableRowValue = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  text-align: right;
`;

const TableRowBadge = styled.div`
  background: rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  min-width: 60px;
  
  &.success {
    background: rgba(74, 222, 128, 0.2);
    color: #4ade80;
  }
  
  &.warning {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }
  
  &.danger {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.5rem;
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(to right, #3b82f6, #4ade80);
    transition: width 0.3s ease;
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.6);
  gap: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(255, 255, 255, 0.6);
  
  .icon {
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  h3 {
    color: white;
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
  }
  
  p {
    margin: 0;
    font-size: 0.9rem;
  }
`;

// Interface
export interface FaceAnalyticsProps {
  stats?: {
    totalFaces: number;
    activeFaces: number;
    todayDetections: number;
    unknownDetections: number;
    alertsGenerated: number;
    systemStatus: string;
  };
  recentAlerts?: any[];
  className?: string;
}

const FaceAnalytics: React.FC<FaceAnalyticsProps> = ({ 
  stats: propStats, 
  recentAlerts = [], 
  className 
}) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [refreshing, setRefreshing] = useState(false);
  
  // Load analytics data
  const loadAnalytics = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const response = await fetch(`/api/faces/analytics/summary?days=${timeRange}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      }
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);
  
  // Load analytics on mount and time range change
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalytics(false);
  }, [loadAnalytics]);
  
  // Handle export
  const handleExport = useCallback(() => {
    // TODO: Implement analytics export
    console.log('Export analytics');
  }, []);
  
  // Calculate derived statistics
  const derivedStats = useMemo(() => {
    if (!analytics) return null;
    
    const trends = analytics.detection_trends || [];
    const profiles = analytics.profile_summary || [];
    const cameras = analytics.camera_activity || [];
    
    const totalDetections = trends.reduce((sum, day) => sum + day.total_detections, 0);
    const knownDetections = trends.reduce((sum, day) => sum + day.known_detections, 0);
    const unknownDetections = trends.reduce((sum, day) => sum + day.unknown_detections, 0);
    const activeCameras = cameras.length;
    const avgConfidence = cameras.reduce((sum, cam) => sum + parseFloat(cam.avg_confidence || 0), 0) / Math.max(cameras.length, 1);
    
    const totalProfiles = profiles.reduce((sum, profile) => sum + profile.count, 0);
    const activeProfiles = profiles.find(p => p.status === 'active')?.count || 0;
    
    // Calculate trends (compare first and last day)
    const firstDay = trends[trends.length - 1];
    const lastDay = trends[0];
    const detectionTrend = firstDay && lastDay ? 
      ((lastDay.total_detections - firstDay.total_detections) / Math.max(firstDay.total_detections, 1)) * 100 : 0;
    
    return {
      totalDetections,
      knownDetections,
      unknownDetections,
      activeCameras,
      avgConfidence,
      totalProfiles,
      activeProfiles,
      detectionTrend,
      unknownRate: totalDetections > 0 ? (unknownDetections / totalDetections) * 100 : 0,
      systemHealth: avgConfidence > 0.7 ? 'Excellent' : avgConfidence > 0.5 ? 'Good' : 'Needs Attention'
    };
  }, [analytics]);
  
  if (loading) {
    return (
      <LoadingState>
        <Loader size={24} className="animate-spin" />
        Loading analytics...
      </LoadingState>
    );
  }
  
  if (!analytics || !derivedStats) {
    return (
      <EmptyState>
        <div className="icon">
          <BarChart3 size={48} />
        </div>
        <h3>No Analytics Data</h3>
        <p>Analytics will be available once face detection data is collected.</p>
      </EmptyState>
    );
  }
  
  return (
    <AnalyticsContainer className={className}>
      <Header>
        <Title>
          <BarChart3 size={20} />
          Face Recognition Analytics
        </Title>
        
        <HeaderActions>
          <TimeRangeSelect
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </TimeRangeSelect>
          
          <ActionButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </ActionButton>
          
          <ActionButton className="primary" onClick={handleExport}>
            <Download size={16} />
            Export
          </ActionButton>
        </HeaderActions>
      </Header>
      
      {/* Key Statistics */}
      <StatsGrid>
        <StatCard>
          <StatHeader>
            <StatTitle>Total Detections</StatTitle>
            <StatIcon className="primary">
              <Eye size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{derivedStats.totalDetections.toLocaleString()}</StatValue>
          <StatChange className={derivedStats.detectionTrend > 0 ? 'positive' : 'negative'}>
            <TrendingUp size={16} />
            {Math.abs(derivedStats.detectionTrend).toFixed(1)}% vs previous period
          </StatChange>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <StatTitle>Recognition Rate</StatTitle>
            <StatIcon className="secondary">
              <Target size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>
            {derivedStats.totalDetections > 0 ? 
              ((derivedStats.knownDetections / derivedStats.totalDetections) * 100).toFixed(1) : 0}%
          </StatValue>
          <StatChange className="neutral">
            {derivedStats.knownDetections.toLocaleString()} known faces detected
          </StatChange>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <StatTitle>Active Cameras</StatTitle>
            <StatIcon className="secondary">
              <Camera size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{derivedStats.activeCameras}</StatValue>
          <StatChange className="neutral">
            {analytics.camera_activity.filter(c => c.total_detections > 0).length} with recent activity
          </StatChange>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <StatTitle>System Health</StatTitle>
            <StatIcon className={derivedStats.avgConfidence > 0.7 ? 'primary' : 'warning'}>
              {derivedStats.avgConfidence > 0.7 ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            </StatIcon>
          </StatHeader>
          <StatValue>{(derivedStats.avgConfidence * 100).toFixed(1)}%</StatValue>
          <StatChange className={derivedStats.avgConfidence > 0.7 ? 'positive' : 'warning'}>
            {derivedStats.systemHealth} performance
          </StatChange>
        </StatCard>
      </StatsGrid>
      
      {/* Charts Section */}
      <ChartsSection>
        <ChartCard>
          <ChartHeader>
            <ChartTitle>
              <Activity size={18} />
              Detection Trends
            </ChartTitle>
          </ChartHeader>
          <ChartBody>
            <div className="placeholder">
              <div className="placeholder-icon">
                <BarChart3 size={48} />
              </div>
              <div className="placeholder-text">
                Interactive chart visualization would display here<br />
                (Requires chart library integration)
              </div>
            </div>
          </ChartBody>
        </ChartCard>
        
        <ChartCard>
          <ChartHeader>
            <ChartTitle>
              <PieChart size={18} />
              Detection Distribution
            </ChartTitle>
          </ChartHeader>
          <ChartBody>
            <div className="placeholder">
              <div className="placeholder-icon">
                <PieChart size={48} />
              </div>
              <div className="placeholder-text">
                Known vs Unknown<br />
                Distribution Chart
              </div>
            </div>
          </ChartBody>
        </ChartCard>
      </ChartsSection>
      
      {/* Tables Section */}
      <TableSection>
        <TableCard>
          <TableHeader>
            <TableTitle>
              <Users size={18} />
              Top Detected Faces
            </TableTitle>
          </TableHeader>
          <Table>
            {analytics.top_detected_faces.slice(0, 5).map((face, index) => (
              <TableRow key={face.name + index}>
                <TableRowLabel>{face.name}</TableRowLabel>
                <TableRowValue>{face.detection_count} detections</TableRowValue>
                <TableRowBadge className="success">
                  {(face.avg_confidence * 100).toFixed(0)}%
                </TableRowBadge>
              </TableRow>
            ))}
            {analytics.top_detected_faces.length === 0 && (
              <TableRow>
                <TableRowLabel style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.6 }}>
                  No detection data available
                </TableRowLabel>
              </TableRow>
            )}
          </Table>
        </TableCard>
        
        <TableCard>
          <TableHeader>
            <TableTitle>
              <Camera size={18} />
              Camera Performance
            </TableTitle>
          </TableHeader>
          <Table>
            {analytics.camera_activity.slice(0, 5).map((camera, index) => (
              <TableRow key={camera.camera_id + index}>
                <TableRowLabel>{camera.camera_name || camera.camera_id}</TableRowLabel>
                <TableRowValue>{camera.total_detections} detections</TableRowValue>
                <TableRowBadge 
                  className={
                    camera.avg_confidence > 0.8 ? 'success' : 
                    camera.avg_confidence > 0.6 ? 'warning' : 'danger'
                  }
                >
                  {(camera.avg_confidence * 100).toFixed(0)}%
                </TableRowBadge>
              </TableRow>
            ))}
            {analytics.camera_activity.length === 0 && (
              <TableRow>
                <TableRowLabel style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.6 }}>
                  No camera data available
                </TableRowLabel>
              </TableRow>
            )}
          </Table>
        </TableCard>
      </TableSection>
      
      {/* Additional Metrics */}
      <StatsGrid>
        <StatCard>
          <StatHeader>
            <StatTitle>Face Profiles</StatTitle>
            <StatIcon className="secondary">
              <Users size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{derivedStats.totalProfiles}</StatValue>
          <StatChange className="neutral">
            {derivedStats.activeProfiles} active profiles
          </StatChange>
          <ProgressBar>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${derivedStats.totalProfiles > 0 ? (derivedStats.activeProfiles / derivedStats.totalProfiles) * 100 : 0}%` 
              }} 
            />
          </ProgressBar>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <StatTitle>Unknown Detection Rate</StatTitle>
            <StatIcon className={derivedStats.unknownRate > 20 ? 'warning' : 'primary'}>
              <UserX size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{derivedStats.unknownRate.toFixed(1)}%</StatValue>
          <StatChange className={derivedStats.unknownRate > 20 ? 'warning' : 'positive'}>
            {derivedStats.unknownDetections.toLocaleString()} unknown detections
          </StatChange>
          <ProgressBar>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${derivedStats.unknownRate}%`,
                background: derivedStats.unknownRate > 20 ? '#f59e0b' : '#4ade80'
              }} 
            />
          </ProgressBar>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <StatTitle>Recent Alerts</StatTitle>
            <StatIcon className="danger">
              <AlertTriangle size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{recentAlerts.length}</StatValue>
          <StatChange className="neutral">
            {recentAlerts.filter(a => a.priority === 'critical').length} critical alerts
          </StatChange>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <StatTitle>Processing Speed</StatTitle>
            <StatIcon className="primary">
              <Zap size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>
            {analytics.detection_trends.length > 0 ? 
              Math.round(analytics.detection_trends[0]?.avg_processing_time || 0) : 0}ms
          </StatValue>
          <StatChange className="positive">
            Average detection time
          </StatChange>
        </StatCard>
      </StatsGrid>
    </AnalyticsContainer>
  );
};

export default FaceAnalytics;
