// File: frontend/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.scss';

// Pages
import HomePage from './pages/HomePage.component';
import LoginPage from './pages/LoginPage.component';
import DashboardPage from './pages/DashboardPage.component';
import AdminDashboard from './pages/AdminDashboard.component';
import DispatchPage from './pages/DispatchPage.component';
import UnauthorizedPage from './pages/UnauthorizedPage.component';
import SchedulePage from './pages/SchedulePage.component';
import TimeClockPage from './pages/TimeClockPage.component';
import PropertyGuardSearchPage from './pages/PropertyGuardSearchPage';
import UserManagement from './pages/UserManagement.component';
import PayrollPage from './pages/PayrollPage.component';
import DetailedReportPage from './pages/DetailedReportPage';
import ReportBuilder from './pages/ReportBuilder';

// Import placeholder pages for routes that don't have components yet
// You'll need to create these basic components
const ObjectDetectionPage = () => <div className="page-container"><h1>Object Detection</h1><p>This feature is coming soon.</p></div>;
const SystemSettingsPage = () => <div className="page-container"><h1>System Settings</h1><p>System configuration options will be available here.</p></div>;
const PatrolsPage = () => <div className="page-container"><h1>Patrols</h1><p>Patrol management features are coming soon.</p></div>;
const PropertyInfoPage = () => <div className="page-container"><h1>Property Information</h1><p>Property details will be displayed here.</p></div>;
const ClientReportsPage = () => <div className="page-container"><h1>Client Reports</h1><p>Client-specific reports will be available here.</p></div>;
const CommunicationPage = () => <div className="page-container"><h1>Communication</h1><p>Messaging features will be available here.</p></div>;
const PropertySearchPage = () => <div className="page-container"><h1>Property Search</h1><p>Search properties and related information.</p></div>;

// Components
import Header from './components/Header/header.component';
import ProtectedRoute from './components/ProtectedRoutes/protected-routes.component';
import ErrorBoundary from './components/ErrorBoundary/error-boundry.component';

// Context
import { AuthProvider } from './context/AuthContext';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <Header />
            <div className="content-container">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Object Detection - Added as public route */}
                <Route path="/object-detection" element={<ObjectDetectionPage />} />

                {/* User Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Admin Routes */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute requiredRole={['super_admin', 'admin_ceo', 'admin_cto', 'admin_cfo']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/admin/user-management"
                  element={
                    <ProtectedRoute requiredRole={['super_admin', 'admin_ceo', 'admin_cto', 'admin_cfo']}>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/admin/system-settings"
                  element={
                    <ProtectedRoute requiredRole={['super_admin', 'admin_ceo', 'admin_cto', 'admin_cfo']}>
                      <SystemSettingsPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Operations Routes */}
                <Route
                  path="/dispatch"
                  element={
                    <ProtectedRoute requiredRole={['super_admin', 'admin_ceo', 'admin_cto', 'admin_cfo', 'dispatcher', 'manager']}>
                      <DispatchPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/schedule"
                  element={
                    <ProtectedRoute>
                      <SchedulePage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/time-clock"
                  element={
                    <ProtectedRoute>
                      <TimeClockPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/patrols"
                  element={
                    <ProtectedRoute>
                      <PatrolsPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Report Routes */}
                <Route
                  path="/reports/new"
                  element={
                    <ProtectedRoute>
                      <ReportBuilder />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/reports/:id"
                  element={
                    <ProtectedRoute>
                      <DetailedReportPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/reports/new" replace />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/daily-reports"
                  element={
                    <ProtectedRoute>
                      <Navigate to="/reports" replace />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/client-reports"
                  element={
                    <ProtectedRoute>
                      <ClientReportsPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Property Management */}
                <Route
                  path="/property-guard-search"
                  element={
                    <ProtectedRoute requiredRole={['super_admin', 'admin_ceo', 'admin_cto', 'admin_cfo', 'manager']}>
                      <PropertyGuardSearchPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/property-search"
                  element={
                    <ProtectedRoute>
                      <PropertySearchPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/property-info"
                  element={
                    <ProtectedRoute>
                      <PropertyInfoPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Finance Routes */}
                <Route
                  path="/payroll"
                  element={
                    <ProtectedRoute requiredRole={['super_admin', 'admin_ceo', 'admin_cto', 'admin_cfo', 'payroll']}>
                      <PayrollPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Communication */}
                <Route
                  path="/communication"
                  element={
                    <ProtectedRoute>
                      <CommunicationPage />
                    </ProtectedRoute>
                  }
                />

                {/* Redirect unknown routes to home */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;