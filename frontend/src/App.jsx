// APEX AI SECURITY PLATFORM - MAIN APPLICATION ROUTER
// Master Prompt v29.1-APEX Implementation
// CLEAN JAVASCRIPT VERSION - NO TYPESCRIPT

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.scss';

// Enhanced Report Builder (Phase 1 - COMPLETED)
import EnhancedReportBuilder from './components/Reports/EnhancedReportBuilder';
import ReportBuilder from './pages/ReportBuilder';
import DetailedReportPage from './pages/DetailedReportPage';

// AI Infrastructure & Live Monitoring (Phase 2A)
import LiveMonitoringDashboard from './components/LiveMonitoring/LiveMonitoringDashboard';

// Guard Operations & Dispatch (Phase 2B)  
import GuardOperationsDashboard from './components/GuardOperations/GuardOperationsDashboard';

// Company Admin Dashboard (Phase 2B)
import CompanyAdminDashboard from './components/AdminDashboard/CompanyAdminDashboard';

// Guard Mobile App Interface (Phase 2C)
import GuardMobileApp from './components/GuardMobile/GuardMobileApp';

// Existing Pages
import UnauthorizedPage from './pages/UnauthorizedPage.component';

// Components
import Header from './components/Header/header.component';
import IntegratedHomePage from './components/HomePage';
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
                {/* === MAIN PLATFORM ROUTES === */}
                
                {/* Platform Landing Page */}
                <Route path="/" element={<IntegratedHomePage />} />
                
                {/* Phase 2A: AI Infrastructure & Live Monitoring */}
                <Route path="/live-monitoring" element={<LiveMonitoringDashboard />} />
                
                {/* Phase 2B: Guard Operations & Dispatch */}
                <Route path="/guard-operations" element={<GuardOperationsDashboard />} />
                
                {/* Phase 2B: Company Admin Dashboard */}
                <Route path="/admin" element={<CompanyAdminDashboard />} />
                <Route path="/admin/*" element={<CompanyAdminDashboard />} />
                
                {/* Phase 2C: Guard Mobile App */}
                <Route path="/guard-mobile" element={<GuardMobileApp />} />
                
                {/* === REPORT BUILDER ROUTES (Phase 1 - COMPLETED) === */}
                
                {/* Enhanced Report Builder - Primary */}
                <Route path="/reports/new" element={<EnhancedReportBuilder />} />
                
                {/* Legacy Report Builder - Fallback */}
                <Route path="/reports/legacy" element={<ReportBuilder />} />
                
                {/* Detailed Report Page */}
                <Route path="/reports/:id" element={<DetailedReportPage />} />
                
                {/* Report Builder Redirects */}
                <Route path="/reports" element={<Navigate to="/reports/new" replace />} />
                <Route path="/daily-reports" element={<Navigate to="/reports/new" replace />} />
                
                {/* === LEGACY ROUTE REDIRECTS === */}
                
                {/* Redirect old dashboard routes to appropriate new modules */}
                <Route path="/dashboard" element={<Navigate to="/live-monitoring" replace />} />
                <Route path="/dispatch" element={<Navigate to="/guard-operations" replace />} />
                <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
                
                {/* Redirect login to platform landing */}
                <Route path="/login" element={<Navigate to="/" replace />} />
                
                {/* === AI CONSOLE (Phase 3 - Future) === */}
                <Route path="/ai-console" element={
                  <div style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '2rem'
                  }}>
                    <div>
                      <h1 style={{ color: '#FFD700', marginBottom: '1rem' }}>🤖 AI Training Console</h1>
                      <p style={{ color: '#B0B0B0', marginBottom: '2rem' }}>
                        Advanced AI model training and system management
                      </p>
                      <p style={{ color: '#666' }}>
                        This module will be available in Phase 3 - Advanced AI Features
                      </p>
                      <button 
                        onClick={() => window.history.back()}
                        style={{
                          marginTop: '2rem',
                          padding: '0.75rem 1.5rem',
                          background: '#FFD700',
                          color: '#000',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        ← Back to Platform
                      </button>
                    </div>
                  </div>
                } />
                
                {/* === ERROR HANDLING === */}
                
                {/* Unauthorized page */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                
                {/* Catch-all route - redirect to platform landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
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
