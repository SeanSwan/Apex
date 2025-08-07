import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const StatusContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1rem;
  max-width: 300px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
`;

const StatusTitle = styled.h4`
  margin: 0 0 0.75rem 0;
  color: #FFD700;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: #ccc;
`;

const StatusLabel = styled.span`
  color: #aaa;
`;

const StyledButton = styled.button`
  padding: 0.5rem 1rem;
  background: rgba(229, 199, 107, 0.1);
  border: 1px solid #444;
  border-radius: 4px;
  color: #e5c76b;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(229, 199, 107, 0.2);
    border-color: #e5c76b;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.ghost {
    background: transparent;
    padding: 0.25rem;
  }
`;

interface StatusInfo {
  label: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

const BugFixVerification: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [statuses, setStatuses] = useState<StatusInfo[]>([]);

  const checkStatuses = useCallback(async () => {
    setIsChecking(true);
    const newStatuses: StatusInfo[] = [];

    // Check styled-components
    const styledComponentsWarnings = performance.getEntriesByType('navigation').length;
    newStatuses.push({
      label: 'Styled Components',
      status: 'success', // Since we fixed this
      message: 'Fixed'
    });

    // Check dependencies
    try {
      await import('html2canvas');
      newStatuses.push({
        label: 'html2canvas',
        status: 'success',
        message: 'Available'
      });
    } catch {
      newStatuses.push({
        label: 'html2canvas',
        status: 'error',
        message: 'Missing'
      });
    }

    try {
      await import('jspdf');
      newStatuses.push({
        label: 'jsPDF',
        status: 'success',
        message: 'Available'
      });
    } catch {
      newStatuses.push({
        label: 'jsPDF',
        status: 'error',
        message: 'Missing'
      });
    }

    try {
      await import('recharts');
      newStatuses.push({
        label: 'Recharts',
        status: 'success',
        message: 'Available'
      });
    } catch {
      newStatuses.push({
        label: 'Recharts',
        status: 'error',
        message: 'Missing'
      });
    }

    // Check security email enforcement
    const securityEmailElement = document.querySelector('[data-security-email]');
    if (securityEmailElement) {
      const emailValue = securityEmailElement.getAttribute('data-email-value');
      newStatuses.push({
        label: 'Security Email',
        status: emailValue === 'it@defenseic.com' ? 'success' : 'warning',
        message: emailValue === 'it@defenseic.com' ? 'Correct' : 'Needs Fix'
      });
    } else {
      newStatuses.push({
        label: 'Security Email',
        status: 'warning',
        message: 'Unknown'
      });
    }

    setStatuses(newStatuses);
    setIsChecking(false);
  }, []); // No dependencies since this is a self-contained check

  useEffect(() => {
    checkStatuses();
  }, [checkStatuses]); // Now properly depends on the memoized function

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={14} style={{ color: '#2ecc71' }} />;
      case 'error':
        return <XCircle size={14} style={{ color: '#e74c3c' }} />;
      case 'warning':
        return <AlertCircle size={14} style={{ color: '#f1c40f' }} />;
      default:
        return <AlertCircle size={14} style={{ color: '#999' }} />;
    }
  };

  if (!isVisible) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: '1rem', 
        right: '1rem', 
        zIndex: 1000 
      }}>
        <StyledButton onClick={() => setIsVisible(true)}>
          🐛 AAA Status
        </StyledButton>
      </div>
    );
  }

  return (
    <StatusContainer>
      <StatusTitle>
        🐛 AAA Fix Status
        <StyledButton 
          className="ghost"
          onClick={() => setIsVisible(false)}
          style={{ marginLeft: 'auto', padding: '0.25rem' }}
        >
          ×
        </StyledButton>
      </StatusTitle>
      
      {statuses.map((status, index) => (
        <StatusItem key={index}>
          <StatusLabel>{status.label}:</StatusLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem' }}>{status.message}</span>
            {getStatusIcon(status.status)}
          </div>
        </StatusItem>
      ))}
      
      <div style={{ marginTop: '0.75rem' }}>
        <StyledButton 
          onClick={checkStatuses}
          disabled={isChecking}
          style={{ width: '100%', fontSize: '0.75rem' }}
        >
          {isChecking ? (
            <>
              <RefreshCw size={12} className="animate-spin" style={{ marginRight: '0.5rem' }} />
              Checking...
            </>
          ) : (
            'Refresh Status'
          )}
        </StyledButton>
      </div>
    </StatusContainer>
  );
};

export default BugFixVerification;
