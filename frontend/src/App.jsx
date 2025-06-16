// APEX AI SECURITY PLATFORM - MAIN APPLICATION ROUTER
// Master Prompt v29.1-APEX Implementation
// Updated App.jsx with Full Platform Architecture

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.scss';

// Enhanced Report Builder (Phase 1 - COMPLETED)
import EnhancedReportBuilder from './components/Reports/EnhancedReportBuilder';
import ReportBuilder from './pages/ReportBuilder'; // Legacy fallback
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
import ErrorBoundary from './components/ErrorBoundary/error-boundry.component';

// Context
import { AuthProvider } from './context/AuthContext';
import { Toaster } from './components/ui/toaster';

// Platform Landing Page Component
const PlatformLanding: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '1rem', 
          marginBottom: '1rem' 
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#FFD700',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#000'
          }}>
            🛡️
          </div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#FFD700' 
          }}>
            APEX AI Security Platform
          </h1>
        </div>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#B0B0B0', 
          margin: 0,
          maxWidth: '600px'
        }}>
          AI-Powered Security Operations & Guard Management System
        </p>
      </div>

      {/* Module Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        maxWidth: '1200px',
        width: '100%'
      }}>
        
        {/* Live AI Monitoring */}
        <ModuleCard
          title="🔴 Live AI Monitoring"
          description="Real-time AI-powered video monitoring with threat detection and guard dispatch"
          features={["Multi-camera feeds", "AI detection overlays", "Real-time alerts", "Guard coordination"]}
          href="/live-monitoring"
          status="Phase 2A - AI Infrastructure"
          priority="high"
        />

        {/* Guard Operations */}
        <ModuleCard
          title="📡 Guard Operations"
          description="Central dispatch and guard coordination with real-time communication"
          features={["Guard dispatch", "Property mapping", "Incident management", "Real-time messaging"]}
          href="/guard-operations"
          status="Phase 2B - Operations"
          priority="high"
        />

        {/* Admin Dashboard */}
        <ModuleCard
          title="⚙️ Admin Dashboard"
          description="Company administration for CEO, CFO, Operations Manager, and Account Managers"
          features={["User management", "Client management", "Guard scheduling", "Analytics & reporting"]}
          href="/admin"
          status="Phase 2B - Administration"
          priority="medium"
        />

        {/* Enhanced Reports */}
        <ModuleCard
          title="📊 Enhanced Report Builder"
          description="AI-enhanced reporting system with advanced analytics and client delivery"
          features={["Smart templates", "Data visualization", "PDF generation", "Client delivery"]}
          href="/reports/new"
          status="Phase 1 - COMPLETED ✅"
          priority="ready"
        />

        {/* Guard Mobile App */}
        <ModuleCard
          title="📱 Guard Mobile App"
          description="Mobile interface for standing guards with AI alerts and incident reporting"
          features={["Time clock", "AI alert reception", "Incident reporting", "Dispatch communication"]}
          href="/guard-mobile"
          status="Phase 2C - Mobile Interface"
          priority="medium"
        />

        {/* AI Console (Future) */}
        <ModuleCard
          title="🤖 AI Training Console"
          description="YOLO model training and AI system management for technical administrators"
          features={["Model training", "Dataset management", "Performance analytics", "System configuration"]}
          href="/ai-console"
          status="Phase 3 - Advanced AI (Coming Soon)"
          priority="future"
        />
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: '3rem', 
        textAlign: 'center', 
        color: '#666',
        fontSize: '0.9rem'
      }}>
        <p>Master Prompt v29.1-APEX Implementation</p>
        <p>Transforming Security Operations with AI-Augmented Guard Services</p>
      </div>
    </div>
  );
};

// Module Card Component
interface ModuleCardProps {
  title: string;
  description: string;
  features: string[];
  href: string;
  status: string;
  priority: 'ready' | 'high' | 'medium' | 'future';
}

const ModuleCard: React.FC<ModuleCardProps> = ({ 
  title, 
  description, 
  features, 
  href, 
  status, 
  priority 
}) => {
  const getPriorityColor = () => {
    switch(priority) {
      case 'ready': return '#22C55E';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'future': return '#6B7280';
      default: return '#3B82F6';
    }
  };

  const isClickable = priority !== 'future';

  return (
    <div
      style={{
        background: 'rgba(30, 30, 30, 0.9)',
        border: `1px solid ${getPriorityColor()}`,
        borderRadius: '16px',
        padding: '2rem',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        opacity: priority === 'future' ? 0.7 : 1
      }}
      onClick={() => {
        if (isClickable) {
          window.location.href = href;
        }
      }}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 8px 25px rgba(${
            priority === 'ready' ? '34, 197, 94' :
            priority === 'high' ? '239, 68, 68' :
            priority === 'medium' ? '245, 158, 11' : '59, 130, 246'
          }, 0.3)`;
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ 
          margin: '0 0 0.5rem 0', 
          fontSize: '1.3rem', 
          color: '#FFD700',
          fontWeight: '600'
        }}>
          {title}
        </h3>
        <div style={{
          fontSize: '0.8rem',
          color: getPriorityColor(),
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {status}
        </div>
      </div>
      
      <p style={{ 
        color: '#E0E0E0', 
        lineHeight: '1.5', 
        marginBottom: '1.5rem',
        fontSize: '0.95rem'
      }}>
        {description}
      </p>
      
      <ul style={{ 
        listStyle: 'none', 
        padding: 0, 
        margin: 0,
        color: '#B0B0B0',
        fontSize: '0.9rem'
      }}>
        {features.map((feature, index) => (
          <li key={index} style={{ 
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ color: getPriorityColor() }}>•</span>
            {feature}
          </li>
        ))}
      </ul>

      {!isClickable && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'rgba(107, 114, 128, 0.2)',
          borderRadius: '8px',
          border: '1px solid rgba(107, 114, 128, 0.3)',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#9CA3AF'
        }}>
          Coming in Phase 3
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <div className="content-container">
              <Routes>
                {/* === MAIN PLATFORM ROUTES === */}
                
                {/* Platform Landing Page */}
                <Route path="/" element={<PlatformLanding />} />
                
                {/* Phase 2A: AI Infrastructure & Live Monitoring */}
                <Route path="/live-monitoring" element={<LiveMonitoringDashboard />} />
                
                {/* Phase 2B: Guard Operations & Dispatch */}
                <Route path="/guard-operations" element={<GuardOperationsDashboard />} />
                
                {/* Phase 2B: Company Admin Dashboard */}
                <Route path="/admin" element={<CompanyAdminDashboard />} />
                <Route path="/admin/*" element={<CompanyAdminDashboard />} />
                
                {/* Phase 2C: Guard Mobile App Interface */}
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
                        Advanced AI model training and system management interface
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