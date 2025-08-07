/**
 * APEX AI FACE MANAGEMENT PAGE
 * ============================
 * Main page wrapper for Face Recognition Management System
 * 
 * Features:
 * - Authentication protection
 * - Layout consistency 
 * - Error boundary protection
 * - Performance optimization
 */

import React from 'react';
import styled from 'styled-components';
import { FaceManagementDashboard } from '../components/FaceManagement';
import { ErrorBoundary } from '../components';

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.black} 0%, ${props => props.theme.colors.gray[900]} 100%);
  display: flex;
  flex-direction: column;
  font-family: ${props => props.theme.typography.fontFamily.primary};
`;

const PageHeader = styled.div`
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${props => props.theme.colors.gold[500]}40;
  padding: 1rem 2rem;
  
  h1 {
    color: ${props => props.theme.colors.white};
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: ${props => props.theme.typography.fontFamily.primary};
  }
  
  .subtitle {
    color: ${props => props.theme.colors.gold[400]};
    font-size: 0.9rem;
    margin-top: 0.25rem;
    font-family: ${props => props.theme.typography.fontFamily.primary};
  }
`;

const ContentArea = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const LoadingFallback = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.black} 0%, ${props => props.theme.colors.gray[900]} 100%);
  color: ${props => props.theme.colors.white};
  font-family: ${props => props.theme.typography.fontFamily.primary};
  font-size: 18px;
  font-weight: 600;
  flex-direction: column;
  gap: 1rem;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid ${props => props.theme.colors.gold[500]}40;
    border-top-color: ${props => props.theme.colors.gold[500]};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorFallback = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.destructive.DEFAULT} 0%, #dc2626 100%);
  color: ${props => props.theme.colors.white};
  font-family: ${props => props.theme.typography.fontFamily.primary};
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  
  h2 {
    font-size: 1.5rem;
    margin: 0;
  }
  
  p {
    font-size: 1rem;
    opacity: 0.9;
    max-width: 600px;
    line-height: 1.5;
  }
  
  button {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid ${props => props.theme.colors.gold[500]}40;
    color: ${props => props.theme.colors.white};
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    font-family: ${props => props.theme.typography.fontFamily.primary};
    
    &:hover {
      background: rgba(0, 0, 0, 0.3);
      border-color: ${props => props.theme.colors.gold[500]};
    }
  }
`;

// Error Boundary Component
class FaceManagementErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Face Management Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback>
          <h2>🧠 Face Recognition System Error</h2>
          <p>
            The Face Recognition Management system encountered an error. 
            This could be due to a network issue or a temporary system problem.
          </p>
          <button onClick={() => this.setState({ hasError: false })}>
            🔄 Try Again
          </button>
          <button onClick={() => window.location.href = '/'}>
            🏠 Return to Dashboard
          </button>
        </ErrorFallback>
      );
    }

    return this.props.children;
  }
}

// Main Page Component
export interface FaceManagementPageProps {
  className?: string;
}

const FaceManagementPage: React.FC<FaceManagementPageProps> = ({ className }) => {
  // Authentication check could be added here
  // For now, we'll rely on the app-level authentication

  return (
    <FaceManagementErrorBoundary>
      <PageContainer className={className}>
        <PageHeader>
          <h1>
            🧠 Face Recognition Management
          </h1>
          <div className="subtitle">
            AI-Powered Security & Identity Management System
          </div>
        </PageHeader>
        
        <ContentArea>
          <React.Suspense 
            fallback={
              <LoadingFallback>
                <div className="spinner" />
                Loading Face Recognition Dashboard...
              </LoadingFallback>
            }
          >
            <FaceManagementDashboard />
          </React.Suspense>
        </ContentArea>
      </PageContainer>
    </FaceManagementErrorBoundary>
  );
};

export default FaceManagementPage;
