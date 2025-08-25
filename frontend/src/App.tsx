// APEX AI SECURITY PLATFORM - MAIN APPLICATION ROUTER
// Master Prompt v29.1-APEX Implementation
// CLEAN TYPESCRIPT VERSION

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FontProvider } from './contexts/FontContext';
import './App.scss';

// Enhanced Report Builder (Phase 1 - COMPLETED)
import { EnhancedReportBuilder } from './components/Reports';
import ReportBuilder from './pages/ReportBuilder';
import DetailedReportPage from './pages/DetailedReportPage';

// AI Infrastructure & Live Monitoring (Phase 2A - LAZY LOADED TO PREVENT WEBSOCKET INITIALIZATION)
const LiveMonitoringDashboard = lazy(() => import('./components/LiveMonitoring/LiveMonitoringDashboard'));
const EnhancedLiveMonitoring = lazy(() => import('./components/LiveMonitoring/EnhancedLiveMonitoring'));
const LiveMonitoringContainer = lazy(() => import('./components/LiveMonitoring/LiveMonitoringContainer'));

// TIER 2 Visual Alerts System (Phase 3 - LAZY LOADED)
const Tier2VisualAlertsPage = lazy(() => import('./pages/Tier2VisualAlertsPage'));

// Dispatcher Dashboard - Real Camera Integration (Phase 3B - LAZY LOADED)
const DispatcherDashboard = lazy(() => import('./components/CameraFeeds/DispatcherDashboard'));

// Face Recognition Management System (Phase 2C - LAZY LOADED)
const FaceManagementPage = lazy(() => import('./pages/FaceManagementPage'));

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
import LoginPage from './pages/LoginPage.component';

// Components
import { Header, IntegratedHomePage, TestHomePage, ErrorBoundary } from './components';

// Context
import { AuthProvider } from './context/AuthContext.jsx';
import { Toaster } from './components/ui/toaster';

const App: React.FC = () => {
  // NOTE: WebSocket initialization moved to module level to avoid StrictMode issues
  // See webSocketManager.ts for automatic connection initialization

  return (
    <ErrorBoundary>
      <FontProvider>
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
                
                {/* Phase 2A: AI Infrastructure & Live Monitoring - LAZY LOADED */}
                <Route path="/live-monitoring" element={
                  <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', color: '#fff'}}>Loading Live Monitoring...</div>}>
                    <LiveMonitoringContainer />
                  </Suspense>
                } />
                <Route path="/live-monitoring/enhanced" element={
                  <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', color: '#fff'}}>Loading Enhanced Live Monitoring...</div>}>
                    <EnhancedLiveMonitoring />
                  </Suspense>
                } />
                <Route path="/live-monitoring/legacy" element={
                  <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', color: '#fff'}}>Loading Live Monitoring Dashboard...</div>}>
                    <LiveMonitoringDashboard />
                  </Suspense>
                } />
                
                {/* Phase 2B: Guard Operations & Dispatch */}
                <Route path="/guard-operations" element={<GuardOperationsDashboard />} />
                
                {/* Phase 2B: Company Admin Dashboard */}
                <Route path="/admin" element={<CompanyAdminDashboard />} />
                <Route path="/admin/*" element={<CompanyAdminDashboard />} />
                
                {/* Phase 2C: Guard Mobile App */}
                <Route path="/guard-mobile" element={<GuardMobileApp />} />
                
                {/* Face Recognition Management System */}
                <Route path="/face-management" element={
                  <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', fontFamily: 'Segoe UI', fontSize: '18px', fontWeight: '600'}}>🧠 Loading Face Recognition System...</div>}>
                    <FaceManagementPage />
                  </Suspense>
                } />
                
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
                
                {/* Defense App Login */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* === AI CONSOLE - ELITE SECURITY OPERATIONS === */}
                <Route path="/ai-console" element={<AIConsoleDashboard />} />
                
                {/* === TIER 2 VISUAL ALERTS SYSTEM === */}
                <Route path="/visual-alerts" element={
                  <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000', color: '#00FF88', fontFamily: 'Segoe UI', fontSize: '18px', fontWeight: '700'}}>🚨 Loading TIER 2 Visual Alerts...</div>}>
                    <Tier2VisualAlertsPage />
                  </Suspense>
                } />
                
                {/* === DISPATCHER DASHBOARD - REAL CAMERA INTEGRATION === */}
                <Route path="/dispatcher" element={
                  <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a', color: '#00FF88', fontFamily: 'Segoe UI', fontSize: '18px', fontWeight: '700'}}>📹 Loading Dispatcher Dashboard...</div>}>
                    <DispatcherDashboard />
                  </Suspense>
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
      </FontProvider>
    </ErrorBoundary>
  );
};

export default App;
