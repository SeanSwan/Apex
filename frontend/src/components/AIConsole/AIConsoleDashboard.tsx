// AIConsoleDashboard.tsx - Operational Security Monitoring for Apex AI Platform
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SecurityDashboard from './SecurityDashboard';
import marbleTexture from '../../assets/marble-texture.png';
import {
  Shield, Eye, Activity, TrendingUp, Settings, Users, Camera,
  AlertTriangle, Bell, Radio, Clock, Command
} from 'lucide-react';

// AI Console Layout Components
const ConsoleContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  min-height: 100vh;
  color: #FAF0E6;
`;

const ConsoleHeader = styled.div`
  background-image: url(${marbleTexture});
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(229, 199, 107, 0.3);
  margin-bottom: 2rem;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 1;
  }
  
  & > * {
    position: relative;
    z-index: 2;
  }
`;

const ConsoleTitle = styled.h1`
  color: #e5c76b;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ConsoleSubtitle = styled.p`
  color: #ccc;
  font-size: 1.125rem;
  margin: 0;
  font-weight: 400;
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(229, 199, 107, 0.2);
`;

const StatusGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ccc;
  font-size: 0.875rem;
  
  .status-value {
    color: #e5c76b;
    font-weight: 600;
  }
  
  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #2ecc71;
    
    &.warning { background-color: #f1c40f; }
    &.alert { background-color: #e74c3c; }
  }
`;

const ConsoleNav = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid rgba(229, 199, 107, 0.2);
  padding-bottom: 1rem;
`;

const NavButton = styled.button<{ $active?: boolean }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  background: ${props => props.$active ? 'rgba(229, 199, 107, 0.2)' : 'rgba(0, 0, 0, 0.4)'};
  color: ${props => props.$active ? '#e5c76b' : '#ccc'};
  border: 1px solid ${props => props.$active ? 'rgba(229, 199, 107, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: rgba(229, 199, 107, 0.15);
    color: #e5c76b;
  }
`;

interface AIConsoleDashboardProps {
  className?: string;
}

/**
 * AI Console Dashboard - Operational Security Monitoring
 * 
 * This is the CORRECT location for elite security monitoring features:
 * - Live Security Status & Camera Monitoring
 * - AI Analytics & Detection Metrics  
 * - Guard Operations & Dispatch Management
 * - Threat Assessment & Response
 * - Real-time Activity Monitoring
 * 
 * This is FOR OPERATIONAL STAFF, not client reports.
 */
const AIConsoleDashboard: React.FC<AIConsoleDashboardProps> = ({ className }) => {
  const [activeSection, setActiveSection] = useState<string>('security');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus] = useState({
    aiStatus: 'online',
    guardDispatch: 'active', 
    cameras: { online: 24, total: 26 },
    alerts: 3,
    uptime: 99.7
  });

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sections = [
    { id: 'security', label: 'Security Dashboard', icon: Shield },
    { id: 'monitoring', label: 'Live Monitoring', icon: Eye },
    { id: 'analytics', label: 'AI Analytics', icon: TrendingUp },
    { id: 'guards', label: 'Guard Operations', icon: Users },
    { id: 'alerts', label: 'Alert Management', icon: Bell },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <ConsoleContainer className={className}>
      <ConsoleHeader>
        <ConsoleTitle>
          <Command size={32} />
          Apex AI Console
          <span style={{
            background: 'linear-gradient(45deg, #e74c3c, #c0392b)',
            color: 'white',
            fontSize: '0.7rem',
            padding: '4px 8px',
            borderRadius: '12px',
            fontWeight: '700',
            letterSpacing: '0.5px',
            marginLeft: '0.5rem'
          }}>
            OPERATIONAL
          </span>
        </ConsoleTitle>
        <ConsoleSubtitle>
          Elite Security Operations & AI-Augmented Monitoring Platform
        </ConsoleSubtitle>
      </ConsoleHeader>

      <StatusBar>
        <StatusGroup>
          <StatusItem>
            <div className="status-indicator" />
            <span>AI Engine: <span className="status-value">ACTIVE</span></span>
          </StatusItem>
          <StatusItem>
            <Radio size={16} />
            <span>Dispatch: <span className="status-value">ONLINE</span></span>
          </StatusItem>
          <StatusItem>
            <Camera size={16} />
            <span>Cameras: <span className="status-value">{systemStatus.cameras.online}/{systemStatus.cameras.total}</span></span>
          </StatusItem>
          <StatusItem>
            <AlertTriangle size={16} />
            <span>Active Alerts: <span className="status-value">{systemStatus.alerts}</span></span>
          </StatusItem>
        </StatusGroup>
        
        <StatusGroup>
          <StatusItem>
            <Activity size={16} />
            <span>Uptime: <span className="status-value">{systemStatus.uptime}%</span></span>
          </StatusItem>
          <StatusItem>
            <Clock size={16} />
            <span className="status-value">{currentTime.toLocaleTimeString()}</span>
          </StatusItem>
        </StatusGroup>
      </StatusBar>

      <ConsoleNav>
        {sections.map(section => {
          const IconComponent = section.icon;
          return (
            <NavButton
              key={section.id}
              $active={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
            >
              <IconComponent size={16} />
              {section.label}
            </NavButton>
          );
        })}
      </ConsoleNav>

      {/* Console Content */}
      <div>
        {activeSection === 'security' && (
          <div>
            <div style={{ 
              color: '#e5c76b', 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Shield size={24} />
              Elite Security Dashboard
              <span style={{
                background: 'linear-gradient(45deg, #2ecc71, #27ae60)',
                color: 'white',
                fontSize: '0.6rem',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                marginLeft: '0.5rem'
              }}>
                LIVE
              </span>
            </div>
            <SecurityDashboard />
          </div>
        )}

        {activeSection === 'monitoring' && (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            background: 'rgba(0, 0, 0, 0.4)', 
            borderRadius: '12px',
            border: '1px solid rgba(229, 199, 107, 0.2)'
          }}>
            <Eye size={48} style={{ color: '#e5c76b', marginBottom: '1rem' }} />
            <h3 style={{ color: '#e5c76b', marginBottom: '0.5rem' }}>Live Monitoring Console</h3>
            <p style={{ color: '#ccc' }}>Multi-camera live feed interface will be implemented here</p>
          </div>
        )}

        {activeSection === 'analytics' && (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            background: 'rgba(0, 0, 0, 0.4)', 
            borderRadius: '12px',
            border: '1px solid rgba(229, 199, 107, 0.2)'
          }}>
            <TrendingUp size={48} style={{ color: '#e5c76b', marginBottom: '1rem' }} />
            <h3 style={{ color: '#e5c76b', marginBottom: '0.5rem' }}>AI Analytics Center</h3>
            <p style={{ color: '#ccc' }}>Advanced AI performance metrics and analytics dashboard</p>
          </div>
        )}

        {activeSection === 'guards' && (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            background: 'rgba(0, 0, 0, 0.4)', 
            borderRadius: '12px',
            border: '1px solid rgba(229, 199, 107, 0.2)'
          }}>
            <Users size={48} style={{ color: '#e5c76b', marginBottom: '1rem' }} />
            <h3 style={{ color: '#e5c76b', marginBottom: '0.5rem' }}>Guard Operations Command</h3>
            <p style={{ color: '#ccc' }}>Guard dispatch, scheduling, and communication management</p>
          </div>
        )}

        {activeSection === 'alerts' && (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            background: 'rgba(0, 0, 0, 0.4)', 
            borderRadius: '12px',
            border: '1px solid rgba(229, 199, 107, 0.2)'
          }}>
            <Bell size={48} style={{ color: '#e5c76b', marginBottom: '1rem' }} />
            <h3 style={{ color: '#e5c76b', marginBottom: '0.5rem' }}>Alert Management System</h3>
            <p style={{ color: '#ccc' }}>Real-time alert processing, escalation, and response coordination</p>
          </div>
        )}

        {activeSection === 'settings' && (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            background: 'rgba(0, 0, 0, 0.4)', 
            borderRadius: '12px',
            border: '1px solid rgba(229, 199, 107, 0.2)'
          }}>
            <Settings size={48} style={{ color: '#e5c76b', marginBottom: '1rem' }} />
            <h3 style={{ color: '#e5c76b', marginBottom: '0.5rem' }}>System Configuration</h3>
            <p style={{ color: '#ccc' }}>AI model settings, camera configuration, and system preferences</p>
          </div>
        )}
      </div>
    </ConsoleContainer>
  );
};

export default AIConsoleDashboard;