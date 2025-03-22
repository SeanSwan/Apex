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

                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Reports Routes */}
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
                
                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole={['admin_ceo', 'admin_cto', 'admin_cfo', 'super_admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dispatch"
                  element={
                    <ProtectedRoute requiredRole="dispatcher">
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
                  path="/timeclock"
                  element={
                    <ProtectedRoute>
                      <TimeClockPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/property-guard-search"
                  element={
                    <ProtectedRoute requiredRole={['admin_ceo', 'admin_cto', 'admin_cfo', 'super_admin']}>
                      <PropertyGuardSearchPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute requiredRole={['admin_ceo', 'admin_cto', 'admin_cfo', 'super_admin']}>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payroll"
                  element={
                    <ProtectedRoute requiredRole={['admin_ceo', 'admin_cto', 'admin_cfo', 'super_admin']}>
                      <PayrollPage />
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