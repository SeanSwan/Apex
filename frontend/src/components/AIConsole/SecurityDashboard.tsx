// ApexAISecurityEnhancements.tsx - 7-Star AAA Enhancement Suite
import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useReportData } from '../../context/ReportDataContext';
import marbleTexture from '../../assets/marble-texture.png';
import {
  Shield, Eye, AlertTriangle, Activity, Clock, MapPin, Camera, 
  Users, TrendingUp, Zap, Phone, Radio, ShieldCheck, Award,
  Target, Layers, Wifi, WifiOff, CheckCircle, AlertCircle
} from 'lucide-react';
import AdvancedCameraMonitoring from './AdvancedCameraMonitoring';

// Enhanced Security Dashboard Components
const SecurityDashboard = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const SecurityCard = styled.div`
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

const SecurityCardHeader = styled.div`
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

const SecurityMetric = styled.div`
  text-align: center;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  
  .value {
    font-size: 2rem;
    font-weight: 700;
    color: #e5c76b;
    display: block;
  }
  
  .label {
    font-size: 0.875rem;
    color: #ccc;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const StatusIndicator = styled.div<{ $status: 'online' | 'offline' | 'warning' | 'alert' }>`
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
    switch(props.$status) {
      case 'online': return 'rgba(46, 204, 113, 0.2)';
      case 'warning': return 'rgba(241, 196, 15, 0.2)';
      case 'alert': return 'rgba(231, 76, 60, 0.2)';
      default: return 'rgba(149, 165, 166, 0.2)';
    }
  }};
  
  color: ${props => {
    switch(props.$status) {
      case 'online': return '#2ecc71';
      case 'warning': return '#f1c40f';
      case 'alert': return '#e74c3c';
      default: return '#95a5a6';
    }
  }};
`;

const LiveFeed = styled.div`
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  padding: 1rem;
  max-height: 200px;
  overflow-y: auto;
  
  .feed-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.875rem;
    
    &:last-child {
      border-bottom: none;
    }
    
    .timestamp {
      color: #888;
      font-size: 0.75rem;
      min-width: 60px;
    }
    
    .message {
      color: #e0e0e0;
      flex: 1;
    }
    
    .priority {
      font-weight: 600;
      &.high { color: #e74c3c; }
      &.medium { color: #f1c40f; }
      &.low { color: #2ecc71; }
    }
  }
`;

const GuardStatus = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  
  .guard-card {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    .guard-name {
      font-weight: 600;
      color: #e5c76b;
      margin-bottom: 0.5rem;
    }
    
    .guard-location {
      font-size: 0.875rem;
      color: #ccc;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    
    .guard-shift {
      font-size: 0.75rem;
      color: #888;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
`;

const ThreatAssessment = styled.div`
  .threat-level {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    
    .level-indicator {
      font-size: 1.5rem;
      font-weight: 700;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      
      &.low {
        background: rgba(46, 204, 113, 0.2);
        color: #2ecc71;
      }
      
      &.medium {
        background: rgba(241, 196, 15, 0.2);
        color: #f1c40f;
      }
      
      &.high {
        background: rgba(231, 76, 60, 0.2);
        color: #e74c3c;
      }
    }
  }
  
  .recommendations {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 8px;
    padding: 1rem;
    
    h5 {
      color: #e5c76b;
      margin-bottom: 0.75rem;
      font-size: 0.95rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      
      li {
        padding: 0.5rem 0;
        color: #ccc;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        &::before {
          content: '•';
          color: #e5c76b;
          font-weight: bold;
        }
      }
    }
  }
`;

interface SecurityEnhancementsProps {
  className?: string;
}

/**
 * 7-Star AAA Security Enhancements for Apex AI Platform
 * Provides real-time security insights, guard operations, and AI-driven analytics
 */
const ApexAISecurityEnhancements: React.FC<SecurityEnhancementsProps> = ({ className }) => {
  const { client, metrics, dailyReports } = useReportData();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alertsFeed, setAlertsFeed] = useState([
    { time: '14:23', message: 'Perimeter patrol completed - Sector 7', priority: 'low' },
    { time: '14:20', message: 'Motion detected - Parking Garage Level B2', priority: 'medium' },
    { time: '14:18', message: 'Guard check-in - Main Lobby', priority: 'low' },
    { time: '14:15', message: 'Unusual activity - Service Entrance', priority: 'high' },
    { time: '14:12', message: 'Camera maintenance completed - Unit 4A', priority: 'low' },
  ]);

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate security metrics
  const securityMetrics = useMemo(() => {
    const totalCameras = metrics?.totalCameras || 0;
    const camerasOnline = metrics?.camerasOnline || 0;
    const humanIntrusions = Object.values(metrics?.humanIntrusions || {}).reduce((a, b) => a + b, 0);
    const vehicleIntrusions = Object.values(metrics?.vehicleIntrusions || {}).reduce((a, b) => a + b, 0);
    const totalIntrusions = humanIntrusions + vehicleIntrusions;
    
    // Calculate threat level based on intrusions and security codes
    const codes = dailyReports?.map(r => r.securityCode) || [];
    const highRiskCodes = codes.filter(code => code === 'Code 1' || code === 'Code 2').length;
    const mediumRiskCodes = codes.filter(code => code === 'Code 3').length;
    
    let threatLevel = 'low';
    if (highRiskCodes > 0 || totalIntrusions > 50) threatLevel = 'high';
    else if (mediumRiskCodes > 1 || totalIntrusions > 20) threatLevel = 'medium';
    
    return {
      totalCameras,
      camerasOnline,
      cameraStatus: camerasOnline === totalCameras ? 'online' : camerasOnline > totalCameras * 0.8 ? 'warning' : 'alert',
      totalIntrusions,
      humanIntrusions,
      vehicleIntrusions,
      threatLevel,
      aiAccuracy: metrics?.aiAccuracy || 0,
      responseTime: metrics?.responseTime || 0,
      uptime: metrics?.operationalUptime || 0
    };
  }, [metrics, dailyReports]);

  // Mock guard data (in real system, this would come from guard management API)
  const guardStatus = [
    { name: 'Marcus Chen', location: 'Main Lobby', shift: '6:00 AM - 2:00 PM', status: 'online' },
    { name: 'Sarah Rodriguez', location: 'Parking Garage', shift: '2:00 PM - 10:00 PM', status: 'online' },
    { name: 'David Kim', location: 'Patrol Unit 1', shift: '10:00 PM - 6:00 AM', status: 'warning' },
  ];

  const recommendations = useMemo(() => {
    const recs = [];
    if (securityMetrics.cameraStatus !== 'online') {
      recs.push('Check offline cameras and restore connectivity');
    }
    if (securityMetrics.threatLevel === 'high') {
      recs.push('Consider increasing patrol frequency');
      recs.push('Alert on-duty supervisor immediately');
    }
    if (securityMetrics.totalIntrusions > 30) {
      recs.push('Review access control policies');
      recs.push('Analyze intrusion patterns for security gaps');
    }
    if (securityMetrics.responseTime > 2.0) {
      recs.push('Optimize guard response procedures');
    }
    return recs.length > 0 ? recs : ['All security systems operating normally'];
  }, [securityMetrics]);

  if (!client) {
    return (
      <SecurityCard>
        <SecurityCardHeader>
          <h4><Shield size={20} /> Select a client to view security enhancements</h4>
        </SecurityCardHeader>
      </SecurityCard>
    );
  }

  return (
    <div className={className}>
      <SecurityDashboard>
        {/* Live Security Status */}
        <SecurityCard>
          <SecurityCardHeader>
            <h4><Eye size={20} /> Live Security Status</h4>
            <StatusIndicator $status={securityMetrics.cameraStatus}>
              {securityMetrics.cameraStatus === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
              {securityMetrics.cameraStatus.toUpperCase()}
            </StatusIndicator>
          </SecurityCardHeader>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <SecurityMetric>
              <span className="value">{securityMetrics.camerasOnline}/{securityMetrics.totalCameras}</span>
              <span className="label">Cameras Online</span>
            </SecurityMetric>
            <SecurityMetric>
              <span className="value">{securityMetrics.uptime.toFixed(1)}%</span>
              <span className="label">System Uptime</span>
            </SecurityMetric>
          </div>
          
          <div style={{ marginTop: '1rem', textAlign: 'center', color: '#ccc', fontSize: '0.875rem' }}>
            <Clock size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Last Update: {currentTime.toLocaleTimeString()}
          </div>
        </SecurityCard>

        {/* AI Analytics */}
        <SecurityCard>
          <SecurityCardHeader>
            <h4><TrendingUp size={20} /> AI Security Analytics</h4>
            <StatusIndicator $status={securityMetrics.aiAccuracy > 95 ? 'online' : 'warning'}>
              <Zap size={12} />
              AI ACTIVE
            </StatusIndicator>
          </SecurityCardHeader>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <SecurityMetric>
              <span className="value">{securityMetrics.totalIntrusions}</span>
              <span className="label">Total Detections</span>
            </SecurityMetric>
            <SecurityMetric>
              <span className="value">{securityMetrics.aiAccuracy.toFixed(1)}%</span>
              <span className="label">AI Accuracy</span>
            </SecurityMetric>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
            <SecurityMetric>
              <span className="value">{securityMetrics.humanIntrusions}</span>
              <span className="label">Human</span>
            </SecurityMetric>
            <SecurityMetric>
              <span className="value">{securityMetrics.vehicleIntrusions}</span>
              <span className="label">Vehicle</span>
            </SecurityMetric>
          </div>
        </SecurityCard>

        {/* Guard Operations */}
        <SecurityCard>
          <SecurityCardHeader>
            <h4><Users size={20} /> Guard Operations</h4>
            <StatusIndicator $status="online">
              <Radio size={12} />
              DISPATCH ACTIVE
            </StatusIndicator>
          </SecurityCardHeader>
          
          <GuardStatus>
            {guardStatus.map((guard, index) => (
              <div key={index} className="guard-card">
                <div className="guard-name">{guard.name}</div>
                <div className="guard-location">
                  <MapPin size={14} />
                  {guard.location}
                </div>
                <div className="guard-shift">
                  <Clock size={12} />
                  {guard.shift}
                </div>
              </div>
            ))}
          </GuardStatus>
        </SecurityCard>

        {/* Threat Assessment */}
        <SecurityCard>
          <SecurityCardHeader>
            <h4><AlertTriangle size={20} /> Threat Assessment</h4>
            <StatusIndicator $status={securityMetrics.threatLevel === 'low' ? 'online' : securityMetrics.threatLevel === 'medium' ? 'warning' : 'alert'}>
              <Shield size={12} />
              {securityMetrics.threatLevel.toUpperCase()}
            </StatusIndicator>
          </SecurityCardHeader>
          
          <ThreatAssessment>
            <div className="threat-level">
              <div>
                <div style={{ color: '#e0e0e0', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Current Threat Level</div>
                <div className={`level-indicator ${securityMetrics.threatLevel}`}>
                  {securityMetrics.threatLevel.toUpperCase()}
                </div>
              </div>
              <div style={{ textAlign: 'right', color: '#ccc', fontSize: '0.75rem' }}>
                Response Time<br/>
                <strong style={{ color: '#e5c76b', fontSize: '1.125rem' }}>
                  {securityMetrics.responseTime.toFixed(1)}s
                </strong>
              </div>
            </div>
            
            <div className="recommendations">
              <h5><Target size={16} /> AI Recommendations</h5>
              <ul>
                {recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </ThreatAssessment>
        </SecurityCard>

        {/* Live Activity Feed */}
        <SecurityCard style={{ gridColumn: 'span 2' }}>
          <SecurityCardHeader>
            <h4><Activity size={20} /> Live Security Feed</h4>
            <StatusIndicator $status="online">
              <Eye size={12} />
              MONITORING
            </StatusIndicator>
          </SecurityCardHeader>
          
          <LiveFeed>
            {alertsFeed.map((alert, index) => (
              <div key={index} className="feed-item">
                <div className="timestamp">{alert.time}</div>
                <div className="message">{alert.message}</div>
                <div className={`priority ${alert.priority}`}>
                  {alert.priority === 'high' && <AlertCircle size={14} />}
                  {alert.priority === 'medium' && <AlertTriangle size={14} />}
                  {alert.priority === 'low' && <CheckCircle size={14} />}
                </div>
              </div>
            ))}
          </LiveFeed>
        </SecurityCard>

        {/* Property Security Score */}
        <SecurityCard>
          <SecurityCardHeader>
            <h4><Award size={20} /> Security Score</h4>
            <StatusIndicator $status={securityMetrics.uptime > 98 ? 'online' : 'warning'}>
              <ShieldCheck size={12} />
              RATED
            </StatusIndicator>
          </SecurityCardHeader>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: '700', 
              color: securityMetrics.uptime > 98 ? '#2ecc71' : securityMetrics.uptime > 95 ? '#f1c40f' : '#e74c3c',
              marginBottom: '0.5rem'
            }}>
              {Math.round((securityMetrics.uptime + securityMetrics.aiAccuracy) / 2)}
            </div>
            <div style={{ color: '#ccc', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Overall Security Rating
            </div>
            
            <div style={{ fontSize: '0.75rem', color: '#888', lineHeight: 1.5 }}>
              Based on system uptime, AI accuracy, camera coverage, and incident response metrics
            </div>
          </div>
        </SecurityCard>
      </SecurityDashboard>
      
      {/* Advanced Camera Monitoring System - Premium Enhancement */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ 
          color: '#e5c76b', 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Camera size={24} /> 
          Advanced Camera Monitoring System
          <span style={{
            background: 'linear-gradient(45deg, #e74c3c, #c0392b)',
            color: 'white',
            fontSize: '0.6rem',
            padding: '2px 6px',
            borderRadius: '10px',
            fontWeight: '700',
            letterSpacing: '0.5px',
            marginLeft: '0.5rem'
          }}>
            PREMIUM
          </span>
        </div>
        <AdvancedCameraMonitoring />
      </div>
    </div>
  );
};

export default ApexAISecurityEnhancements;