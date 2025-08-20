// client-portal/src/App.tsx
/**
 * APEX AI - Main Application with Landing Page and Dual Access
 * ==========================================================
 * 
 * Updated routing structure:
 * - / : Landing page with platform selection
 * - /client-portal/* : Aegis Client Portal for property managers
 * - /app : Main operations console (placeholder for now)
 * 
 * Features:
 * - Landing page with dual access options
 * - Protected routing with authentication guards
 * - Lazy loading with suspense boundaries  
 * - Error boundaries for production stability
 * - Professional loading states and transitions
 * - Route-based code splitting for performance
 */

import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './components/auth/AuthProvider';
import { ClientLayout } from './components/layout/ClientLayout';
import { ErrorBoundary, PageErrorBoundary } from './components/common/ErrorBoundary';
import { 
  FullPageLoading, 
  PageLoading, 
  DashboardSkeleton,
  IncidentListSkeleton 
} from './components/common/LoadingSpinner';

// ===========================
// LAZY LOADED COMPONENTS
// ===========================

// Landing Page & Main App
const LandingPage = lazy(() => import('./components/landing/LandingPage')); // Real landing page
const MainAppPlaceholder = lazy(() => import('./components/app/MainAppPlaceholder'));

// Note: Authentication now handled via modal system on landing page

// Main Page Components
const ExecutiveDashboard = lazy(() => import('./components/dashboard/ExecutiveDashboard'));
const IncidentsPage = lazy(() => import('./components/incidents/IncidentsPage'));
const EvidenceLockerPage = lazy(() => import('./components/evidence/EvidenceLockerPage'));

// Future Components (placeholders for now)
const AnalyticsPage = lazy(() => Promise.resolve({
  default: () => (
    <div className="space-y-6">
      <div className="apex-page-header">
        <div className="apex-page-title">
          <h1 className="apex-page-heading">Analytics</h1>
          <p className="apex-page-description">
            Advanced security analytics and reporting dashboard
          </p>
        </div>
      </div>
      <div className="apex-main-panel">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
          <p className="text-gray-600">Coming soon - Advanced security analytics and reporting</p>
        </div>
      </div>
    </div>
  )
}));

const SettingsPage = lazy(() => Promise.resolve({
  default: () => (
    <div className="space-y-6">
      <div className="apex-page-header">
        <div className="apex-page-title">
          <h1 className="apex-page-heading">Settings</h1>
          <p className="apex-page-description">
            Account settings and system configuration
          </p>
        </div>
      </div>
      <div className="apex-main-panel">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚙️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Settings Panel</h3>
          <p className="text-gray-600">Coming soon - Account and system settings</p>
        </div>
      </div>
    </div>
  )
}));

// ===========================
// ROUTE LOADING COMPONENTS
// ===========================

const DashboardLoading = () => (
  <div className="space-y-6">
    <div className="apex-page-header animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-96"></div>
    </div>
    <DashboardSkeleton />
  </div>
);

const IncidentsLoading = () => (
  <div className="space-y-6">
    <div className="apex-page-header animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-96"></div>
    </div>
    <IncidentListSkeleton />
  </div>
);

const EvidenceLoading = () => (
  <div className="space-y-6">
    <div className="apex-page-header animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-96"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 animate-pulse">
          <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
          <div className="p-4">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const GenericLoading = () => <PageLoading message="Loading page..." />;

// ===========================
// ROUTE PROTECTION COMPONENT
// ===========================

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  permission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/client-portal/login',
  permission
}) => {
  const { isAuthenticated, isInitializing, user, hasPermission, isLoading } = useAuth();
  const location = useLocation();
  const [authStateStable, setAuthStateStable] = useState(false);
  const [authServiceReady, setAuthServiceReady] = useState(false);

  console.log('🚼 ProtectedRoute: Location:', location.pathname, 'RequireAuth:', requireAuth, 'IsAuthenticated:', isAuthenticated, 'IsInitializing:', isInitializing, 'IsLoading:', isLoading);

  // ENHANCED: Multiple-layer authentication state validation
  const storageToken = typeof window !== 'undefined' ? localStorage.getItem('aegis_access_token') : null;
  const storageUser = typeof window !== 'undefined' ? localStorage.getItem('aegis_user_data') : null;
  const hasStoredAuth = !!(storageToken && storageUser);
  
  useEffect(() => {
    // Wait for AuthService state to stabilize
    const checkAuthState = async () => {
      try {
        const { AuthService } = await import('@/services/authService');
        const serviceAuthenticated = AuthService.isAuthenticated();
        const serviceSessionValid = AuthService.isSessionValid();
        
        console.log('🚼 ProtectedRoute: AuthService check - Authenticated:', serviceAuthenticated, 'Session Valid:', serviceSessionValid);
        
        // State is stable when React state matches AuthService state
        const stateMatches = (
          (isAuthenticated && serviceAuthenticated && serviceSessionValid) ||
          (!isAuthenticated && (!serviceAuthenticated || !serviceSessionValid))
        );
        
        setAuthStateStable(stateMatches);
        setAuthServiceReady(true);
        
      } catch (error) {
        console.warn('🚼 ProtectedRoute: AuthService check failed:', error);
        setAuthServiceReady(true); // Proceed anyway
        setAuthStateStable(true); // Assume stable on error
      }
    };
    
    if (!isInitializing && !isLoading) {
      checkAuthState();
    }
  }, [isAuthenticated, isInitializing, isLoading]);

  // Show loading while checking authentication OR during login process OR while state stabilizes
  if (isInitializing || isLoading || !authServiceReady) {
    console.log('🚼 ProtectedRoute: Still initializing, loading, or stabilizing auth state');
    return <FullPageLoading variant="auth" title="Authenticating" subtitle="Please wait..." />;
  }

  // If we have stored auth but React state hasn't caught up yet, show loading briefly
  if (requireAuth && !isAuthenticated && hasStoredAuth && !authStateStable) {
    console.log('🚼 ProtectedRoute: Auth in storage but React state not synchronized, showing loading');
    return <FullPageLoading variant="auth" title="Authenticating" subtitle="Synchronizing session..." />;
  }

  // If auth state is not stable yet but we should be authenticated, wait a bit more
  if (requireAuth && hasStoredAuth && !authStateStable) {
    console.log('🚼 ProtectedRoute: Waiting for auth state to stabilize');
    return <FullPageLoading variant="auth" title="Authenticating" subtitle="Finalizing authentication..." />;
  }

  // Redirect to landing page if authentication required but user not authenticated
  if (requireAuth && !isAuthenticated && !hasStoredAuth) {
    console.log('🚼 ProtectedRoute: Auth required but not authenticated, redirecting to landing page');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Don't redirect authenticated users if they're accessing non-auth routes
  if (!requireAuth && isAuthenticated && location.pathname === '/') {
    // Only redirect from landing page, not from other non-auth routes
    const from = location.state?.from?.pathname || '/client-portal/dashboard';
    console.log('🚼 ProtectedRoute: Authenticated user on landing page, redirecting to:', from);
    return <Navigate to={from} replace />;
  }

  // Check permissions if specified
  if (permission && user && !hasPermission(permission as any)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// ===========================
// CLIENT PORTAL APP LAYOUT
// ===========================

const ClientPortalApp: React.FC = () => {
  return (
    <ErrorBoundary level="critical">
      <ClientLayout>
        <Routes>
          {/* Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              <PageErrorBoundary>
                <Suspense fallback={<DashboardLoading />}>
                  <ExecutiveDashboard />
                </Suspense>
              </PageErrorBoundary>
            }
          />

          {/* Incidents Route */}
          <Route
            path="/incidents"
            element={
              <ProtectedRoute permission="incidents">
                <PageErrorBoundary>
                  <Suspense fallback={<IncidentsLoading />}>
                    <IncidentsPage />
                  </Suspense>
                </PageErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Evidence Route */}
          <Route
            path="/evidence"
            element={
              <ProtectedRoute permission="evidence">
                <PageErrorBoundary>
                  <Suspense fallback={<EvidenceLoading />}>
                    <EvidenceLockerPage />
                  </Suspense>
                </PageErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Analytics Route */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute permission="analytics">
                <PageErrorBoundary>
                  <Suspense fallback={<GenericLoading />}>
                    <AnalyticsPage />
                  </Suspense>
                </PageErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Settings Route */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute permission="settings">
                <PageErrorBoundary>
                  <Suspense fallback={<GenericLoading />}>
                    <SettingsPage />
                  </Suspense>
                </PageErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Default redirect to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 Not Found for client portal */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
                  <p className="text-gray-600 mb-4">
                    The page you're looking for doesn't exist in the client portal.
                  </p>
                  <div className="space-x-4">
                    <button
                      onClick={() => window.history.back()}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Go Back
                    </button>
                    <button
                      onClick={() => window.location.href = '/client-portal/dashboard'}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            }
          />
        </Routes>
      </ClientLayout>
    </ErrorBoundary>
  );
};

// ===========================
// MAIN APP COMPONENT
// ===========================

const App: React.FC = () => {
  return (
    <ErrorBoundary level="critical">
      <Routes>
        {/* Landing Page */}
        <Route
          path="/"
          element={
            <ErrorBoundary level="page">
              <Suspense fallback={<FullPageLoading title="APEX AI" subtitle="Loading platform..." />}>
                <LandingPage />
              </Suspense>
            </ErrorBoundary>
          }
        />

        {/* Main App Route (Placeholder) */}
        <Route
          path="/app"
          element={
            <ErrorBoundary level="page">
              <Suspense fallback={<FullPageLoading title="APEX AI" subtitle="Loading operations console..." />}>
                <MainAppPlaceholder />
              </Suspense>
            </ErrorBoundary>
          }
        />

        {/* Legacy login redirects */}
        <Route
          path="/login"
          element={<Navigate to="/" replace />}
        />
        
        <Route
          path="/client-login"
          element={<Navigate to="/" replace />}
        />

        {/* Client Portal Login - Redirect to Landing Page */}
        <Route
          path="/client-portal/login"
          element={<Navigate to="/" replace />}
        />

        {/* All Client Portal Routes */}
        <Route
          path="/client-portal/*"
          element={
            <ProtectedRoute requireAuth={true}>
              <ClientPortalApp />
            </ProtectedRoute>
          }
        />

        {/* Fallback for unknown routes */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🌐</div>
                <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
                <p className="text-gray-400 mb-4">
                  The page you're looking for doesn't exist.
                </p>
                <div className="space-x-4">
                  <button
                    onClick={() => window.location.href = '/'}
                    className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
                  >
                    Return Home
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Access Portal
                  </button>
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
};

// ===========================
// PERFORMANCE OPTIMIZATION
// ===========================

// Preload critical routes for better performance
if (typeof window !== 'undefined') {
  // Preload landing page components after 1 second
  setTimeout(() => {
    import('./components/landing/LandingPage').catch(() => {
      // Ignore preload errors
    });
  }, 1000);

  // Preload client portal after 3 seconds
  setTimeout(() => {
    import('./components/dashboard/ExecutiveDashboard').catch(() => {
      // Ignore preload errors
    });
  }, 3000);

  // Preload main app placeholder after 5 seconds
  setTimeout(() => {
    import('./components/app/MainAppPlaceholder').catch(() => {
      // Ignore preload errors  
    });
  }, 5000);
}

export default App;