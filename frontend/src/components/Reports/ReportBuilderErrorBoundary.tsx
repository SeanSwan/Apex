// ReportBuilderErrorBoundary.tsx - Error Boundary Component
// Provides error handling and recovery for report builder components

import React, { Component, ReactNode } from 'react';
import { ErrorContainer } from './ReportBuilder.styles';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error boundary component for the report builder
 * Catches JavaScript errors and provides fallback UI
 */
export class ReportBuilderErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error for debugging
    console.error('Report Builder Error Boundary Caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // You could also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorContainer>
          <h2>🚨 Report Builder Error</h2>
          <p>Something went wrong while rendering this component.</p>
          
          {this.state.error && (
            <details style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              backgroundColor: '#2a2a2a',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                Error Details (Click to expand)
              </summary>
              <div>
                <strong>Error:</strong> {this.state.error.message}
              </div>
              {this.state.error.stack && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>Stack Trace:</strong>
                  <pre style={{ 
                    fontSize: '0.8rem', 
                    overflow: 'auto', 
                    maxHeight: '200px',
                    backgroundColor: '#1a1a1a',
                    padding: '0.5rem',
                    borderRadius: '4px'
                  }}>
                    {this.state.error.stack}
                  </pre>
                </div>
              )}
            </details>
          )}
          
          <div style={{ 
            marginTop: '1.5rem', 
            display: 'flex', 
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={this.handleReset}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#FFD700',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Try Again
            </button>
            <button 
              onClick={this.handleReload}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Reload Page
            </button>
          </div>
          
          <div style={{ 
            marginTop: '1rem', 
            fontSize: '0.8rem', 
            color: '#888' 
          }}>
            If this error persists, please contact support with the error details above.
          </div>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ReportBuilderErrorBoundary;
