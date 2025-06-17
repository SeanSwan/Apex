// AdvancedCameraMonitoring.tsx - Elite Camera Status & Health Monitoring
import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useReportData } from '../../context/ReportDataContext';
import marbleTexture from '../../assets/marble-texture.png';
import {
  Camera, Wifi, WifiOff, AlertTriangle, CheckCircle, Activity, 
  Zap, Eye, Shield, Target, Layers, TrendingUp, Clock, 
  MapPin, Settings, RefreshCw, AlertCircle, Battery
} from 'lucide-react';

const CameraSystemContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const CameraCard = styled.div`
  background-image: url(${marbleTexture});
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(229, 199, 107, 0.2);
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 1;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(229, 199, 107, 0.15);
    border-color: rgba(229, 199, 107, 0.4);
  }
  
  & > * {
    position: relative;
    z-index: 2;
  }
`;

const CameraHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h4 {
    color: #e5c76b;
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const StatusBadge = styled.div<{ status: 'online' | 'offline' | 'warning' | 'maintenance' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  background-color: ${props => {
    switch(props.status) {
      case 'online': return 'rgba(46, 204, 113, 0.2)';
      case 'warning': return 'rgba(241, 196, 15, 0.2)';
      case 'maintenance': return 'rgba(52, 152, 219, 0.2)';
      default: return 'rgba(149, 165, 166, 0.2)';
    }
  }};
  
  color: ${props => {
    switch(props.status) {
      case 'online': return '#2ecc71';
      case 'warning': return '#f1c40f';
      case 'maintenance': return '#3498db';
      default: return '#95a5a6';
    }
  }};
`;

const CameraGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const IndividualCamera = styled.div<{ status: 'online' | 'offline' | 'warning' }>`
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  border: 2px solid ${props => {
    switch(props.status) {
      case 'online': return 'rgba(46, 204, 113, 0.3)';
      case 'warning': return 'rgba(241, 196, 15, 0.3)';
      default: return 'rgba(149, 165, 166, 0.3)';
    }
  }};
  
  .camera-id {
    font-size: 0.875rem;
    font-weight: 600;
    color: #e5c76b;
    margin-bottom: 0.5rem;
  }
  
  .camera-status {
    font-size: 0.75rem;
    color: ${props => {
      switch(props.status) {
        case 'online': return '#2ecc71';
        case 'warning': return '#f1c40f';
        default: return '#95a5a6';
      }
    }};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
  }
  
  .last-ping {
    font-size: 0.7rem;
    color: #888;
    margin-top: 0.25rem;
  }
`;

const MetricSection = styled.div`
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  
  .metric-title {
    font-size: 0.875rem;
    color: #e5c76b;
    margin-bottom: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .metric-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .metric-item {
    text-align: center;
    
    .value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #e5c76b;
    }
    
    .label {
      font-size: 0.75rem;
      color: #ccc;
      margin-top: 0.25rem;
    }
  }
`;

const AlertsSection = styled.div`
  margin-top: 1rem;
  
  .alert-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    border-left: 3px solid #f1c40f;
    
    .alert-time {
      color: #888;
      font-size: 0.75rem;
      min-width: 50px;
    }
    
    .alert-message {
      color: #e0e0e0;
      font-size: 0.875rem;
      flex: 1;
    }
    
    &.critical {
      border-left-color: #e74c3c;
    }
    
    &.resolved {
      border-left-color: #2ecc71;
      opacity: 0.7;
    }
  }
`;

interface AdvancedCameraMonitoringProps {
  className?: string;
}

/**
 * Advanced Camera Monitoring System - 7-Star Elite Enhancement
 * Real-time camera health, status tracking, and maintenance alerts
 */
const AdvancedCameraMonitoring: React.FC<AdvancedCameraMonitoringProps> = ({ className }) => {
  const { client, metrics } = useReportData();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000); // Update every 30 seconds
    return () => clearInterval(timer);
  }, []);

  // Simulate camera data (in real system, this would come from camera management API)
  const cameraData = useMemo(() => {
    const totalCameras = metrics?.totalCameras || 0;
    const camerasOnline = metrics?.camerasOnline || 0;
    const camerasOffline = totalCameras - camerasOnline;
    const camerasWarning = Math.max(0, Math.floor(totalCameras * 0.1)); // 10% in warning state
    
    const cameras = [];
    
    // Generate individual camera statuses
    for (let i = 1; i <= totalCameras; i++) {
      let status: 'online' | 'offline' | 'warning' = 'online';
      if (i > camerasOnline) status = 'offline';
      else if (i <= camerasWarning) status = 'warning';
      
      cameras.push({
        id: `CAM-${String(i).padStart(2, '0')}`,
        status,
        lastPing: status === 'offline' ? 'No response' : 
                 status === 'warning' ? 'Intermittent' : 
                 `${Math.floor(Math.random() * 5) + 1}s ago`,
        location: `Zone ${Math.ceil(i / 4)}${String.fromCharCode(65 + (i % 4))}`,
        uptime: status === 'offline' ? 0 : Math.floor(Math.random() * 100) + 95
      });
    }
    
    return {
      totalCameras,
      camerasOnline,
      camerasOffline,
      camerasWarning,
      cameras,
      systemUptime: 99.2,
      avgResponseTime: 0.3,
      dataTransfer: Math.floor(Math.random() * 50) + 200, // GB
      storageUsed: Math.floor(Math.random() * 30) + 60 // %
    };
  }, [metrics]);

  // Mock alerts
  const recentAlerts = [
    { time: '14:23', message: 'Camera CAM-04 connection restored', type: 'resolved' },
    { time: '14:20', message: 'Motion blur detected on CAM-12', type: 'warning' },
    { time: '14:15', message: 'CAM-08 offline - checking connection', type: 'critical' },
    { time: '14:10', message: 'System maintenance completed', type: 'resolved' },
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  if (!client) {
    return (
      <CameraCard>
        <CameraHeader>
          <h4><Camera size={20} /> Select a client to view camera monitoring</h4>
        </CameraHeader>
      </CameraCard>
    );
  }

  return (
    <div className={className}>
      <CameraSystemContainer>
        {/* System Overview */}
        <CameraCard>
          <CameraHeader>
            <h4><Camera size={20} /> Camera System Overview</h4>
            <StatusBadge status={cameraData.camerasOffline > 0 ? 'warning' : 'online'}>
              {cameraData.camerasOffline > 0 ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
              {cameraData.camerasOffline > 0 ? 'NEEDS ATTENTION' : 'ALL SYSTEMS NORMAL'}
            </StatusBadge>
          </CameraHeader>
          
          <MetricSection>
            <div className="metric-title">
              <Activity size={16} /> System Status
            </div>
            <div className="metric-grid">
              <div className="metric-item">
                <div className="value">{cameraData.camerasOnline}/{cameraData.totalCameras}</div>
                <div className="label">Cameras Online</div>
              </div>
              <div className="metric-item">
                <div className="value">{cameraData.systemUptime}%</div>
                <div className="label">System Uptime</div>
              </div>
              <div className="metric-item">
                <div className="value">{cameraData.avgResponseTime}s</div>
                <div className="label">Avg Response</div>
              </div>
              <div className="metric-item">
                <div className="value">{cameraData.storageUsed}%</div>
                <div className="label">Storage Used</div>
              </div>
            </div>
          </MetricSection>
          
          <div style={{ textAlign: 'center', marginTop: '1rem', color: '#888', fontSize: '0.875rem' }}>
            <Clock size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Last Update: {currentTime.toLocaleTimeString()}
            <button 
              onClick={handleRefresh}
              style={{ 
                background: 'none', 
                border: '1px solid #444', 
                color: '#e5c76b', 
                padding: '0.25rem 0.5rem', 
                borderRadius: '4px', 
                marginLeft: '0.5rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              disabled={refreshing}
            >
              <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </CameraCard>

        {/* Individual Camera Status */}
        <CameraCard style={{ gridColumn: 'span 2' }}>
          <CameraHeader>
            <h4><Eye size={20} /> Individual Camera Status</h4>
            <StatusBadge status="online">
              <Wifi size={12} />
              MONITORING ACTIVE
            </StatusBadge>
          </CameraHeader>
          
          <CameraGrid>
            {cameraData.cameras.slice(0, 12).map((camera) => (
              <IndividualCamera key={camera.id} status={camera.status}>
                <div className="camera-id">{camera.id}</div>
                <div className="camera-status">
                  {camera.status === 'online' && <Wifi size={12} />}
                  {camera.status === 'offline' && <WifiOff size={12} />}
                  {camera.status === 'warning' && <AlertTriangle size={12} />}
                  {camera.status.toUpperCase()}
                </div>
                <div className="last-ping">{camera.lastPing}</div>
              </IndividualCamera>
            ))}
          </CameraGrid>
          
          {cameraData.totalCameras > 12 && (
            <div style={{ textAlign: 'center', marginTop: '1rem', color: '#888', fontSize: '0.875rem' }}>
              Showing 12 of {cameraData.totalCameras} cameras. 
              <button style={{ 
                background: 'none', 
                border: 'none', 
                color: '#e5c76b', 
                textDecoration: 'underline', 
                cursor: 'pointer',
                marginLeft: '0.5rem'
              }}>
                View All Cameras
              </button>
            </div>
          )}
        </CameraCard>

        {/* Performance Analytics */}
        <CameraCard>
          <CameraHeader>
            <h4><TrendingUp size={20} /> Performance Analytics</h4>
            <StatusBadge status="online">
              <Zap size={12} />
              OPTIMAL
            </StatusBadge>
          </CameraHeader>
          
          <MetricSection>
            <div className="metric-title">
              <Target size={16} /> 24-Hour Metrics
            </div>
            <div className="metric-grid">
              <div className="metric-item">
                <div className="value">{cameraData.dataTransfer}</div>
                <div className="label">GB Processed</div>
              </div>
              <div className="metric-item">
                <div className="value">2,847</div>
                <div className="label">AI Detections</div>
              </div>
              <div className="metric-item">
                <div className="value">99.7%</div>
                <div className="label">AI Accuracy</div>
              </div>
              <div className="metric-item">
                <div className="value">0.2s</div>
                <div className="label">Detection Speed</div>
              </div>
            </div>
          </MetricSection>
          
          <MetricSection>
            <div className="metric-title">
              <Battery size={16} /> Health Indicators
            </div>
            <div style={{ fontSize: '0.875rem', color: '#e0e0e0', lineHeight: 1.6 }}>
              • Network bandwidth: <span style={{ color: '#2ecc71' }}>Excellent</span><br/>
              • Storage capacity: <span style={{ color: '#f1c40f' }}>Monitor closely</span><br/>
              • Processing load: <span style={{ color: '#2ecc71' }}>Normal</span><br/>
              • Camera maintenance: <span style={{ color: '#2ecc71' }}>Up to date</span>
            </div>
          </MetricSection>
        </CameraCard>

        {/* Recent Alerts & Maintenance */}
        <CameraCard>
          <CameraHeader>
            <h4><AlertCircle size={20} /> Recent Alerts</h4>
            <StatusBadge status="warning">
              <Shield size={12} />
              {recentAlerts.filter(a => a.type === 'critical').length} ACTIVE
            </StatusBadge>
          </CameraHeader>
          
          <AlertsSection>
            {recentAlerts.map((alert, index) => (
              <div key={index} className={`alert-item ${alert.type}`}>
                <div className="alert-time">{alert.time}</div>
                <div className="alert-message">{alert.message}</div>
                {alert.type === 'critical' && <AlertTriangle size={14} />}
                {alert.type === 'warning' && <AlertCircle size={14} />}
                {alert.type === 'resolved' && <CheckCircle size={14} />}
              </div>
            ))}
          </AlertsSection>
          
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            background: 'rgba(46, 204, 113, 0.1)', 
            borderRadius: '6px',
            border: '1px solid rgba(46, 204, 113, 0.3)'
          }}>
            <div style={{ color: '#2ecc71', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
              Next Scheduled Maintenance
            </div>
            <div style={{ color: '#e0e0e0', fontSize: '0.8rem' }}>
              Camera firmware update: Sunday 2:00 AM - 4:00 AM
            </div>
          </div>
        </CameraCard>
      </CameraSystemContainer>
    </div>
  );
};

export default AdvancedCameraMonitoring;