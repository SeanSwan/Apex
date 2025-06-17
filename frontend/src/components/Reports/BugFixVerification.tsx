// BugFixVerification.tsx - Comprehensive test component
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useReportData } from '../../context/ReportDataContext';
import marbleTexture from '../../assets/marble-texture.png';

const VerificationContainer = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.9);
  color: #00ff00;
  padding: 1rem;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  max-width: 300px;
  z-index: 9999;
  border: 1px solid #00ff00;
`;

const StatusItem = styled.div<{ status: 'good' | 'warning' | 'error' }>`
  color: ${props => {
    switch(props.status) {
      case 'good': return '#00ff00';
      case 'warning': return '#ffaa00';
      case 'error': return '#ff0000';
      default: return '#ffffff';
    }
  }};
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusIcon = styled.span<{ status: 'good' | 'warning' | 'error' }>`
  &::before {
    content: '${props => {
      switch(props.status) {
        case 'good': return '✅';
        case 'warning': return '⚠️';
        case 'error': return '❌';
        default: return '❓';
      }
    }}';
  }
`;

const TestButton = styled.button`
  background: #0070f3;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  margin-top: 8px;
  width: 100%;
`;

/**
 * Comprehensive verification component to test all bug fixes
 */
const BugFixVerification: React.FC = () => {
  const [showVerification, setShowVerification] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  const {
    client,
    metrics,
    themeSettings,
    dailyReports,
    chartDataURL,
    signature,
    contactEmail
  } = useReportData();

  // Refresh verification every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  if (!showVerification) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: '#0070f3',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 9999
        }}
        onClick={() => setShowVerification(true)}
      >
        🐛 Show Debug
      </div>
    );
  }

  // Helper function to get status icon
  const getStatusIcon = (status: 'good' | 'warning' | 'error'): string => {
    switch(status) {
      case 'good': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  // Check various conditions
  const hasClient = !!client;
  const hasMetrics = !!metrics && Object.keys(metrics).length > 0;
  const hasTheme = !!themeSettings;
  const hasBackgroundImage = !!(themeSettings?.backgroundImage || themeSettings?.headerImage);
  const hasReports = !!(dailyReports && dailyReports.length > 0);
  const hasChart = !!chartDataURL;
  const hasSignature = !!signature && signature.length > 0;
  const hasContactEmail = !!contactEmail && contactEmail.length > 0;
  const isMarbleTextureLoaded = !!marbleTexture && marbleTexture.length > 0;
  
  // Check for security company email (should be it@defenseic.com)
  const hasCorrectSecurityEmail = contactEmail === 'it@defenseic.com';
  const hasWrongClientEmail = client?.contactEmail && contactEmail === client.contactEmail;
  
  // Check camera synchronization
  const clientCameras = client?.cameras || 0;
  const metricsCameras = metrics?.totalCameras || 0;
  const isCameraSynced = clientCameras > 0 && clientCameras === metricsCameras;

  return (
    <VerificationContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <strong>🐛 AAA Status</strong>
        <button 
          onClick={() => setShowVerification(false)}
          style={{ background: 'none', border: 'none', color: '#00ff00', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ fontSize: '10px', marginBottom: '8px', color: '#888' }}>
        Last check: {new Date(lastUpdate).toLocaleTimeString()}
      </div>

      <StatusItem status={hasClient ? 'good' : 'error'}>
        <span>{getStatusIcon(hasClient ? 'good' : 'error')}</span>
        <span>Client Selected: {client?.name || 'None'}</span>
      </StatusItem>

      <StatusItem status={hasCorrectSecurityEmail ? 'good' : 'warning'}>
        <span>{getStatusIcon(hasCorrectSecurityEmail ? 'good' : 'warning')}</span>
        <span>Security Email: {hasCorrectSecurityEmail ? 'Correct' : 'Wrong'}</span>
      </StatusItem>
      
      <StatusItem status={hasWrongClientEmail ? 'warning' : 'good'}>
        <span>{getStatusIcon(hasWrongClientEmail ? 'warning' : 'good')}</span>
        <span>Email Source: {hasWrongClientEmail ? 'Client (wrong)' : 'Security Co (correct)'}</span>
      </StatusItem>

      <StatusItem status={hasContactEmail ? 'good' : 'warning'}>
        <span>{getStatusIcon(hasContactEmail ? 'good' : 'warning')}</span>
        <span>Contact Email: {contactEmail || 'Empty'}</span>
      </StatusItem>

      <StatusItem status={hasSignature ? 'good' : 'warning'}>
        <span>{getStatusIcon(hasSignature ? 'good' : 'warning')}</span>
        <span>Signature: {signature || 'Empty'}</span>
      </StatusItem>

      <StatusItem status={hasMetrics ? 'good' : 'error'}>
        <span>{getStatusIcon(hasMetrics ? 'good' : 'error')}</span>
        <span>Metrics Data: {hasMetrics ? 'Loaded' : 'Missing'}</span>
      </StatusItem>

      <StatusItem status={hasReports ? 'good' : 'error'}>
        <span>{getStatusIcon(hasReports ? 'good' : 'error')}</span>
        <span>Daily Reports: {dailyReports?.length || 0} items</span>
      </StatusItem>

      <StatusItem status={hasTheme ? 'good' : 'error'}>
        <span>{getStatusIcon(hasTheme ? 'good' : 'error')}</span>
        <span>Theme Settings: {hasTheme ? 'Loaded' : 'Missing'}</span>
      </StatusItem>

      <StatusItem status={isMarbleTextureLoaded ? 'good' : 'error'}>
        <span>{getStatusIcon(isMarbleTextureLoaded ? 'good' : 'error')}</span>
        <span>Marble Texture: {isMarbleTextureLoaded ? 'Loaded' : 'Missing'}</span>
      </StatusItem>

      <StatusItem status={hasBackgroundImage ? 'good' : 'warning'}>
        <span>{getStatusIcon(hasBackgroundImage ? 'good' : 'warning')}</span>
        <span>Background Image: {hasBackgroundImage ? 'Set' : 'Default'}</span>
      </StatusItem>

      <StatusItem status={isCameraSynced ? 'good' : (clientCameras > 0 ? 'warning' : 'good')}>
        <span>{getStatusIcon(isCameraSynced ? 'good' : (clientCameras > 0 ? 'warning' : 'good'))}</span>
        <span>Camera Sync: {clientCameras}→{metricsCameras} {isCameraSynced ? 'OK' : 'Mismatch'}</span>
      </StatusItem>

      <StatusItem status={hasChart ? 'good' : 'warning'}>
        <span>{getStatusIcon(hasChart ? 'good' : 'warning')}</span>
        <span>Chart Data: {hasChart ? 'Generated' : 'Missing'}</span>
      </StatusItem>

      <TestButton 
        onClick={() => {
          console.log('🔍 Full AAA Debug:', {
            client,
            metrics,
            themeSettings,
            dailyReports,
            chartDataURL,
            signature,
            contactEmail,
            marbleTexture,
            securityEmailCheck: {
              contactEmail,
              clientEmail: client?.contactEmail,
              hasCorrectSecurityEmail,
              hasWrongClientEmail
            },
            cameraSyncCheck: {
              clientCameras,
              metricsCameras,
              isSynced: isCameraSynced
            }
          });
        }}
      >
        Log AAA Context
      </TestButton>
    </VerificationContainer>
  );
};

export default BugFixVerification;
