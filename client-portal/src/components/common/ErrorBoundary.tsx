// client-portal/src/components/common/ErrorBoundary.tsx
/**
 * Production-Grade Error Boundary Component
 * =========================================
 * 
 * Comprehensive error boundary that catches JavaScript errors anywhere in the
 * component tree, logs errors for debugging, and displays professional fallback UI.
 * 
 * Features:
 * - Comprehensive error catching and logging
 * - Professional fallback UI with recovery options
 * - Error reporting integration for production
 * - Different error states for different error types
 * - User-friendly error messages and actions
 * - Development vs production error handling
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  BugAntIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';

// ===========================
// INTERFACES & TYPES
// ===========================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number | boolean | null | undefined>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  eventId?: string;
}

interface ErrorDisplayProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  level: 'page' | 'component' | 'critical';
  onRetry: () => void;
  onReportError: () => void;
}

// ===========================
// ERROR CLASSIFICATION
// ===========================

const classifyError = (error: Error): {
  type: 'network' | 'auth' | 'render' | 'chunk' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
} => {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return { type: 'network', severity: 'medium', recoverable: true };
  }

  // Authentication errors
  if (message.includes('unauthorized') || message.includes('auth') || message.includes('token')) {
    return { type: 'auth', severity: 'high', recoverable: true };
  }

  // Chunk loading errors (common in production with code splitting)
  if (message.includes('loading chunk') || message.includes('chunk') || stack.includes('webpack')) {
    return { type: 'chunk', severity: 'medium', recoverable: true };
  }

  // Render errors
  if (stack.includes('react') || stack.includes('render') || message.includes('element type')) {
    return { type: 'render', severity: 'high', recoverable: false };
  }

  // Unknown errors
  return { type: 'unknown', severity: 'critical', recoverable: false };
};

// ===========================
// ERROR DISPLAY COMPONENT
// ===========================

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  errorInfo,
  errorId,
  level,
  onRetry,
  onReportError
}) => {
  const isDevelopment = import.meta.env.DEV;
  const classification = error ? classifyError(error) : { type: 'unknown', severity: 'critical', recoverable: false };

  const getErrorIcon = () => {
    switch (classification.type) {
      case 'network':
        return <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />;
      case 'auth':
        return <ShieldExclamationIcon className="h-12 w-12 text-red-500" />;
      case 'chunk':
        return <ArrowPathIcon className="h-12 w-12 text-blue-500" />;
      default:
        return <BugAntIcon className="h-12 w-12 text-red-500" />;
    }
  };

  const getErrorMessage = () => {
    switch (classification.type) {
      case 'network':
        return {
          title: 'Connection Problem',
          description: 'Unable to connect to our servers. Please check your internet connection and try again.',
          action: 'Retry Connection'
        };
      case 'auth':
        return {
          title: 'Authentication Error',
          description: 'Your session has expired or there was an authentication problem. Please log in again.',
          action: 'Go to Login'
        };
      case 'chunk':
        return {
          title: 'Loading Error',
          description: 'Failed to load application resources. This usually resolves with a page refresh.',
          action: 'Refresh Page'
        };
      default:
        return {
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred. Our team has been notified and is working on a fix.',
          action: 'Try Again'
        };
    }
  };

  const { title, description, action } = getErrorMessage();

  const handlePrimaryAction = () => {
    switch (classification.type) {
      case 'auth':
        window.location.href = '/login';
        break;
      case 'chunk':
        window.location.reload();
        break;
      default:
        onRetry();
        break;
    }
  };

  const handleSecondaryAction = () => {
    if (level === 'page' || level === 'critical') {
      window.location.href = '/dashboard';
    } else {
      onRetry();
    }
  };

  return (
    <div className={`
      flex items-center justify-center p-8
      ${level === 'critical' ? 'min-h-screen bg-gray-50' : 'min-h-96'}
    `}>
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          {getErrorIcon()}
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{description}</p>

        {/* Error ID */}
        <div className="text-xs text-gray-400 mb-6 font-mono">
          Error ID: {errorId}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handlePrimaryAction}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            {action}
          </button>

          {(level === 'page' || level === 'critical') && (
            <button
              onClick={handleSecondaryAction}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <HomeIcon className="h-4 w-4 mr-2" />
              Go to Dashboard
            </button>
          )}

          <button
            onClick={onReportError}
            className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Report this error
          </button>
        </div>

        {/* Development Error Details */}
        {isDevelopment && error && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
              Development Error Details
            </summary>
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-xs">
              <div className="font-semibold text-red-800 mb-2">Error:</div>
              <pre className="text-red-700 whitespace-pre-wrap mb-4">{error.message}</pre>
              
              {error.stack && (
                <>
                  <div className="font-semibold text-red-800 mb-2">Stack Trace:</div>
                  <pre className="text-red-600 whitespace-pre-wrap mb-4 text-xs">{error.stack}</pre>
                </>
              )}
              
              {errorInfo?.componentStack && (
                <>
                  <div className="font-semibold text-red-800 mb-2">Component Stack:</div>
                  <pre className="text-red-600 whitespace-pre-wrap text-xs">{errorInfo.componentStack}</pre>
                </>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

// ===========================
// MAIN ERROR BOUNDARY COMPONENT
// ===========================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    const { errorId } = this.state;

    // Update state with error info
    this.setState({ errorInfo });

    // Log error to console
    console.group(`🚨 Error Boundary Caught Error [${level.toUpperCase()}]`);
    console.error('Error ID:', errorId);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Call custom error handler
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }

    // Report to error tracking service in production
    if (import.meta.env.PROD) {
      this.reportError(error, errorInfo, errorId);
    }

    // Auto-retry for recoverable errors
    const classification = classifyError(error);
    if (classification.recoverable && level === 'component') {
      this.scheduleRetry();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if props changed (for retry functionality)
    if (hasError && prevProps.children !== this.props.children) {
      if (resetOnPropsChange) {
        this.resetErrorBoundary();
      }
    }

    // Reset error state if reset keys changed
    if (hasError && resetKeys && prevProps.resetKeys !== resetKeys) {
      const hasResetKeyChanged = resetKeys.some((resetKey, idx) => {
        return prevProps.resetKeys?.[idx] !== resetKey;
      });
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private scheduleRetry = () => {
    // Auto-retry after 5 seconds for component-level errors
    this.retryTimeoutId = window.setTimeout(() => {
      console.log('🔄 Auto-retrying failed component...');
      this.resetErrorBoundary();
    }, 5000);
  };

  private reportError = async (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    try {
      // In a real application, you would send this to your error reporting service
      // Example: Sentry, LogRocket, Bugsnag, etc.
      
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('user_id') || 'anonymous',
        level: this.props.level || 'component',
        
        // Additional context
        buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
        environment: import.meta.env.MODE
      };

      // Example: Send to your error reporting API
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });

      console.log('Error report prepared:', errorReport);
      
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private resetErrorBoundary = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleRetry = () => {
    console.log('🔄 Manual retry triggered');
    this.resetErrorBoundary();
  };

  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    if (error && errorInfo) {
      // Open email client with error report
      const subject = encodeURIComponent(`Aegis Portal Error Report - ${errorId}`);
      const body = encodeURIComponent(`
Error ID: ${errorId}
Time: ${new Date().toISOString()}
Page: ${window.location.href}

Error Message:
${error.message}

Please describe what you were doing when this error occurred:
[Your description here]

Technical Details:
${error.stack}
      `);
      
      window.open(`mailto:support@apexai.com?subject=${subject}&body=${body}`);
    }
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback, level = 'component' } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Use default error display
      return (
        <ErrorDisplay
          error={error}
          errorInfo={errorInfo}
          errorId={errorId}
          level={level}
          onRetry={this.handleRetry}
          onReportError={this.handleReportError}
        />
      );
    }

    return children;
  }
}

// ===========================
// CONVENIENCE HOOKS & COMPONENTS
// ===========================

/**
 * Hook for programmatically triggering error boundary
 */
export const useErrorHandler = () => {
  return React.useCallback((error: Error, errorInfo?: { componentStack?: string }) => {
    // Throw error to be caught by nearest error boundary
    throw error;
  }, []);
};

/**
 * Higher-order component for wrapping components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Specialized error boundaries for different use cases
 */
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page" resetOnPropsChange>
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="component" resetOnPropsChange>
    {children}
  </ErrorBoundary>
);

export const CriticalErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="critical">
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;