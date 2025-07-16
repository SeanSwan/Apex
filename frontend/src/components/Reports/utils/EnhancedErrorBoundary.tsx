/**
 * Enhanced Error Boundary for Reports Components
 * Production-ready error handling with graceful degradation
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import styled from 'styled-components';

// Error boundary styled components
const ErrorContainer = styled.div`
  padding: 2rem;
  margin: 1rem 0;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  text-align: center;
`;

const ErrorTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #ef4444;
  font-size: 1.125rem;
  font-weight: 600;
`;

const ErrorMessage = styled.p`
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #dc2626;
`;

const ErrorDetails = styled.details`
  margin-top: 1rem;
  text-align: left;
  
  summary {
    cursor: pointer;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: #b91c1c;
    
    &:hover {
      color: #ef4444;
    }
  }
`;

const ErrorStack = styled.pre`
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
  color: #7f1d1d;
  max-height: 200px;
  overflow-y: auto;
`;

const RetryButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 1rem;
  
  &:hover {
    background-color: #dc2626;
  }
  
  &:focus {
    outline: 2px solid #ef4444;
    outline-offset: 2px;
  }
`;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class EnhancedErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    console.error('🚨 Enhanced Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      componentName: this.props.componentName || 'Unknown Component',
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString()
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to external error monitoring service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, you would send this to your error monitoring service
    // For now, we'll just log it comprehensively
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      componentName: this.props.componentName,
      retryCount: this.state.retryCount
    };

    // You can integrate with services like Sentry, LogRocket, etc.
    console.error('Error Report:', errorReport);
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorContainer role="alert">
          <ErrorTitle>
            ⚠️ Component Error
            {this.props.componentName && ` in ${this.props.componentName}`}
          </ErrorTitle>
          
          <ErrorMessage>
            Something went wrong while rendering this component. 
            {this.state.retryCount > 0 && ` (Retry attempt: ${this.state.retryCount})`}
          </ErrorMessage>

          {this.state.error && (
            <ErrorMessage>
              <strong>Error:</strong> {this.state.error.message}
            </ErrorMessage>
          )}

          {this.props.enableRetry && this.state.retryCount < this.maxRetries && (
            <RetryButton onClick={this.handleRetry}>
              Try Again ({this.maxRetries - this.state.retryCount} attempts left)
            </RetryButton>
          )}

          {this.state.retryCount >= this.maxRetries && (
            <ErrorMessage>
              <strong>Maximum retry attempts reached.</strong> Please refresh the page or contact support.
            </ErrorMessage>
          )}

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <ErrorDetails>
              <summary>Developer Details</summary>
              <ErrorStack>
                <strong>Error Stack:</strong>
                {this.state.error.stack}
                
                {this.state.errorInfo && (
                  <>
                    <br /><br />
                    <strong>Component Stack:</strong>
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </ErrorStack>
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;

/**
 * HOC for wrapping components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary 
      {...errorBoundaryProps}
      componentName={Component.displayName || Component.name}
    >
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Hook for handling async errors in components
 */
export const useAsyncError = () => {
  const [, setError] = React.useState();
  return React.useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    [setError]
  );
};

/**
 * Utility function for safe async operations
 */
export function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T,
  onError?: (error: Error) => void
): Promise<T | undefined> {
  return operation()
    .then(result => result)
    .catch((error: Error) => {
      console.error('Safe async operation failed:', error);
      if (onError) {
        onError(error);
      }
      return fallback;
    });
}

/**
 * React Query-style error boundary for data fetching
 */
export const DataErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => (
  <EnhancedErrorBoundary
    componentName="DataErrorBoundary"
    enableRetry={true}
    fallback={fallback}
  >
    {children}
  </EnhancedErrorBoundary>
);
