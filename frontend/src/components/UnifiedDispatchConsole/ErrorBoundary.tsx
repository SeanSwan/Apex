/**
 * ERROR BOUNDARY COMPONENT - MASTER PROMPT v52.0
 * ==============================================
 * Comprehensive React Error Boundary for Voice AI Dispatcher
 * 
 * Features:
 * - Graceful error handling and user-friendly error displays
 * - Error reporting and logging
 * - Fallback UI components for different error types
 * - Recovery mechanisms and retry functionality
 * - Development vs production error display modes
 * - Component stack trace preservation
 * - Error categorization (network, component, system)
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Wifi, Shield } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  errorCategory?: 'network' | 'component' | 'system' | 'voice';
  componentName?: string;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  lastErrorTime: number | null;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      lastErrorTime: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('📋 Error Info:', errorInfo);

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Report error to parent handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (if available)
    this.reportError(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorReport = {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        context: {
          component: this.props.componentName || 'Unknown',
          category: this.props.errorCategory || 'component',
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          errorId: this.state.errorId
        },
        system: {
          retryCount: this.state.retryCount,
          lastErrorTime: this.state.lastErrorTime
        }
      };

      // Log to console for development
      console.log('📊 Error Report:', errorReport);

      // In production, send to error tracking service
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/system/error-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(errorReport)
        }).catch(err => {
          console.error('Failed to report error to backend:', err);
        });
      }
    } catch (reportingError) {
      console.error('Error while reporting error:', reportingError);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount >= 3) {
      console.warn('⚠️ Maximum retry attempts reached');
      return;
    }

    console.log(`🔄 Retrying component... (Attempt ${this.state.retryCount + 1}/3)`);
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const bugReport = {
      error: this.state.error?.message,
      component: this.props.componentName,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString()
    };

    // Create a pre-filled bug report (could open email client or issue tracker)
    const subject = encodeURIComponent(`Bug Report - ${this.props.componentName || 'Component'} Error`);
    const body = encodeURIComponent(`Error ID: ${this.state.errorId}\nComponent: ${this.props.componentName}\nError: ${this.state.error?.message}\nTime: ${new Date().toLocaleString()}\n\nSteps to reproduce:\n1. \n2. \n3. `);
    
    window.open(`mailto:support@apex-ai.com?subject=${subject}&body=${body}`);
  };

  private getErrorIcon = () => {
    switch (this.props.errorCategory) {
      case 'network':
        return <Wifi className="w-8 h-8 text-red-400" />;
      case 'voice':
        return <Shield className="w-8 h-8 text-red-400" />;
      case 'system':
        return <AlertTriangle className="w-8 h-8 text-red-400" />;
      default:
        return <Bug className="w-8 h-8 text-red-400" />;
    }
  };

  private getErrorTitle = () => {
    switch (this.props.errorCategory) {
      case 'network':
        return 'Network Connection Error';
      case 'voice':
        return 'Voice AI Service Error';
      case 'system':
        return 'System Error';
      default:
        return 'Component Error';
    }
  };

  private getErrorDescription = () => {
    const componentName = this.props.componentName || 'component';
    
    switch (this.props.errorCategory) {
      case 'network':
        return `Unable to connect to the server. Please check your internet connection and try again.`;
      case 'voice':
        return `The Voice AI service encountered an error. Voice calls may be temporarily unavailable.`;
      case 'system':
        return `A system-level error occurred. Our team has been notified and is working on a fix.`;
      default:
        return `The ${componentName} encountered an unexpected error. Please try refreshing or contact support if the problem persists.`;
    }
  };

  render() {
    if (this.state.hasError) {
      // Show custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className={`flex items-center justify-center min-h-96 bg-gray-900 rounded-lg border border-red-700 ${this.props.className || ''}`}>
          <div className="text-center p-8 max-w-md mx-auto">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              {this.getErrorIcon()}
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-semibold text-white mb-2">
              {this.getErrorTitle()}
            </h2>

            {/* Error Description */}
            <p className="text-gray-300 mb-6">
              {this.getErrorDescription()}
            </p>

            {/* Error Details (Development Mode) */}
            {(process.env.NODE_ENV === 'development' || this.props.showErrorDetails) && this.state.error && (
              <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-medium text-red-400 mb-2">Error Details:</h3>
                <div className="text-xs text-gray-300 font-mono overflow-auto">
                  <p><strong>Message:</strong> {this.state.error.message}</p>
                  {this.state.errorId && (
                    <p><strong>Error ID:</strong> {this.state.errorId}</p>
                  )}
                  {this.props.componentName && (
                    <p><strong>Component:</strong> {this.props.componentName}</p>
                  )}
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-red-400">Stack Trace</summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-32 bg-gray-900 p-2 rounded">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {/* Retry Button */}
              {this.state.retryCount < 3 && (
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  aria-label="Retry loading component"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
              )}

              {/* Go Home Button */}
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                aria-label="Go to home page"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </button>

              {/* Report Bug Button */}
              <button
                onClick={this.handleReportBug}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                aria-label="Report this bug"
              >
                <Bug className="w-4 h-4" />
                <span>Report Bug</span>
              </button>
            </div>

            {/* Retry Limit Warning */}
            {this.state.retryCount >= 3 && (
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-300">
                  Maximum retry attempts reached. Please refresh the page or contact support.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * HOC for wrapping components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
};

/**
 * Hook for manual error boundary triggering
 */
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: string) => {
    // This will be caught by the nearest error boundary
    throw new Error(`${error.message}${errorInfo ? ` - ${errorInfo}` : ''}`);
  };
};
