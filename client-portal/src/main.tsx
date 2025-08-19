// client-portal/src/main.tsx
/**
 * APEX AI - Aegis Client Portal Application Entry Point
 * ===================================================
 * 
 * Production-ready entry point that initializes the React application with
 * comprehensive error handling, performance monitoring, and provider setup.
 * 
 * Features:
 * - React 18 Concurrent Rendering with Strict Mode
 * - Global error boundaries and crash reporting
 * - Hot Toast notifications system
 * - Authentication and routing providers
 * - Performance monitoring and analytics
 * - Production-optimized CSS imports
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './components/auth/AuthProvider';
import './styles/global.css';

// ===========================
// ENVIRONMENT CONFIGURATION
// ===========================

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Enhanced logging for development
if (isDevelopment) {
  console.log('%c🚀 APEX AI - Aegis Client Portal', 'color: #2563eb; font-size: 16px; font-weight: bold;');
  console.log('%c⚡ Development Mode Active', 'color: #059669; font-size: 12px;');
  console.log('Environment:', import.meta.env);
}

// ===========================
// GLOBAL ERROR HANDLING
// ===========================

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  if (isProduction) {
    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(event.reason);
  }
  
  // Show user-friendly error message
  if (typeof event.reason === 'string') {
    import('react-hot-toast').then(({ toast }) => {
      toast.error('An unexpected error occurred. Please refresh the page.');
    });
  }
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  console.error('Global JavaScript error:', event.error);
  
  if (isProduction) {
    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(event.error);
  }
});

// ===========================
// PERFORMANCE MONITORING
// ===========================

// Web Vitals monitoring disabled for now
// TODO: Install web-vitals package if performance monitoring is needed
if (isProduction) {
  console.log('Production mode - performance monitoring available but disabled');
  // Uncomment below if web-vitals package is installed:
  // import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
  //   function sendToAnalytics(metric: any) {
  //     console.log('Performance metric:', metric);
  //   }
  //   getCLS(sendToAnalytics);
  //   getFID(sendToAnalytics);
  //   getFCP(sendToAnalytics);
  //   getLCP(sendToAnalytics);
  //   getTTFB(sendToAnalytics);
  // }).catch((error) => {
  //   console.warn('Web Vitals could not be loaded:', error);
  // });
}

// ===========================
// TOAST NOTIFICATION CONFIGURATION
// ===========================

const toasterConfig = {
  position: 'top-right' as const,
  duration: 4000,
  gutter: 8,
  toastOptions: {
    // Default styling for all toasts
    style: {
      background: '#ffffff',
      color: '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      maxWidth: '400px'
    },
    // Success toast styling
    success: {
      iconTheme: {
        primary: '#10b981',
        secondary: '#ffffff'
      },
      style: {
        border: '1px solid #d1fae5',
        background: '#f0fdf4'
      }
    },
    // Error toast styling  
    error: {
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff'
      },
      style: {
        border: '1px solid #fecaca',
        background: '#fef2f2'
      }
    },
    // Loading toast styling
    loading: {
      iconTheme: {
        primary: '#3b82f6',
        secondary: '#ffffff'
      },
      style: {
        border: '1px solid #bfdbfe',
        background: '#eff6ff'
      }
    }
  }
};

// ===========================
// APPLICATION PROVIDERS
// ===========================

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <React.StrictMode>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          {children}
          <Toaster {...toasterConfig} />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

// ===========================
// APPLICATION INITIALIZATION
// ===========================

const initializeApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error(
      'Root element not found. Make sure you have a <div id="root"></div> in your HTML.'
    );
  }

  // Create React 18 root with concurrent features
  const root = ReactDOM.createRoot(rootElement);

  // Render the application
  root.render(
    <AppProviders>
      <App />
    </AppProviders>
  );

  // Development mode enhancements
  if (isDevelopment) {
    // Enable React DevTools profiler
    if (typeof window !== 'undefined') {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook && typeof hook === 'object') {
        hook.onCommitFiberRoot = (
          id: any,
          root: any,
          priorityLevel: any
        ) => {
          // Custom profiling logic could go here
        };
      }
    }

    console.log('%c✅ Application initialized successfully', 'color: #059669; font-weight: bold;');
  }

  return root;
};

// ===========================
// STARTUP SEQUENCE
// ===========================

// Initialize the application
try {
  const root = initializeApp();
  
  // Hot Module Replacement (HMR) setup for development
  if (isDevelopment && import.meta.hot) {
    import.meta.hot.accept();
    
    // Preserve authentication state during HMR
    import.meta.hot.accept('./App', () => {
      console.log('🔄 Hot reloading App component...');
    });
  }
  
  // Production startup logging
  if (isProduction) {
    console.log('🚀 Aegis Client Portal loaded successfully');
  }
  
} catch (error) {
  console.error('❌ Failed to initialize application:', error);
  
  // Fallback error display
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      background-color: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        text-align: center;
        max-width: 400px;
      ">
        <h1 style="color: #dc2626; margin-bottom: 1rem;">Application Error</h1>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">
          Failed to load the Aegis Client Portal. Please refresh the page or contact support.
        </p>
        <button 
          onclick="window.location.reload()" 
          style="
            background: #2563eb;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
          "
        >
          Reload Application
        </button>
      </div>
    </div>
  `;
  
  // Report error in production
  if (isProduction) {
    // Send to error reporting service
    // Example: Sentry.captureException(error);
  }
}

// ===========================
// DEVELOPMENT UTILITIES
// ===========================

if (isDevelopment) {
  // Expose useful debugging utilities in development
  (window as any).__AEGIS_DEBUG__ = {
    version: '1.0.0',
    environment: import.meta.env,
    buildTime: new Date().toISOString(),
    
    // Debug utilities
    clearStorage: () => {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ All storage cleared');
    },
    
    getAuthToken: () => {
      const token = localStorage.getItem('aegis_access_token');
      console.log('Current auth token:', token);
      return token;
    },
    
    toggleDarkMode: () => {
      document.documentElement.classList.toggle('dark');
      console.log('🌓 Dark mode toggled');
    }
  };
  
  console.log('🛠️ Debug utilities available at window.__AEGIS_DEBUG__');
}