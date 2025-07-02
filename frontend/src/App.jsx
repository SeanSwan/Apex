// APEX AI SECURITY PLATFORM - MAIN APPLICATION ROUTER
// Master Prompt v29.1-APEX Implementation
// CLEAN JAVASCRIPT VERSION - NO TYPESCRIPT

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.scss';

// Enhanced Report Builder (Phase 1 - COMPLETED)
import { EnhancedReportBuilder } from './components/Reports';
import ReportBuilder from './pages/ReportBuilder';
import DetailedReportPage from './pages/DetailedReportPage';

// AI Infrastructure & Live Monitoring (Phase 2A)
import { LiveMonitoringDashboard, EnhancedLiveMonitoring } from './components';

// Guard Operations & Dispatch (Phase 2B)  
import { GuardOperationsDashboard } from './components';

// Company Admin Dashboard (Phase 2B)
import { CompanyAdminDashboard } from './components';

// Guard Mobile App Interface (Phase 2C)
import { GuardMobileApp } from './components';

// AI Console - Elite Security Operations (Phase 2A - CORRECTED ARCHITECTURE)
import { AIConsoleDashboard } from './components';

// Existing Pages
import UnauthorizedPage from './pages/UnauthorizedPage.component';

// Components
import { Header, IntegratedHomePage, TestHomePage, ErrorBoundary } from './components';

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
                
                {/* Platform Landing Page - RESTORED ORIGINAL HOMEPAGE */}
                <Route path="/" element={<IntegratedHomePage />} />
                <Route path="/test" element={<TestHomePage />} />
                
                {/* Phase 2A: AI Infrastructure & Live Monitoring */}
                <Route path="/live-monitoring" element={<EnhancedLiveMonitoring />} />
                <Route path="/live-monitoring/legacy" element={<LiveMonitoringDashboard />} />
                
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
                
                {/* === AI CONSOLE - ELITE SECURITY OPERATIONS === */}
                <Route path="/ai-console" element={<AIConsoleDashboard />} />
                
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
