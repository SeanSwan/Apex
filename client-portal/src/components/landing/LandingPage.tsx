// client-portal/src/components/landing/LandingPage.tsx
/**
 * APEX AI - Simplified Landing Page with Direct Access
 * ==================================================
 * 
 * Simple landing page with two direct access options:
 * - Client Portal: Direct login for property managers
 * - Defense APEX AI Site: Main company homepage for employees
 * 
 * Features:
 * - Same video background and professional styling
 * - Two clear, direct call-to-action buttons
 * - No complex modal navigation - simple and intuitive
 * - Direct routing without unnecessary steps
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, ChevronRight, Building2 } from 'lucide-react';
import { ClientLoginModal } from '../modals';
import type { User } from '../../types/client.types';

// ===========================
// MAIN LANDING PAGE COMPONENT
// ===========================

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showClientLogin, setShowClientLogin] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize component
  useEffect(() => {
    // Set loaded immediately since no video to load
    setIsLoaded(true);
  }, []);

  // ===========================
  // DIRECT ACTION HANDLERS
  // ===========================

  const handleClientPortalAccess = () => {
    setShowClientLogin(true);
  };

  const handleDefenseApexSite = () => {
    // Redirect to Frontend application login page for proper authentication flow
    window.location.href = 'http://localhost:3000/login';
  };

  const handleClientLoginSuccess = async (user: User) => {
    console.log('🎯 LandingPage: Login success callback triggered for user:', user);
    console.log('🎯 LandingPage: Closing modal and preparing navigation...');
    
    setShowClientLogin(false);
    
    // ENHANCED: Wait for complete authentication state synchronization
    const waitForFullAuthState = () => {
      return new Promise<void>((resolve) => {
        let attempts = 0;
        const maxAttempts = 100; // 5 seconds max
        
        const checkAuthState = async () => {
          attempts++;
          
          try {
            // Check localStorage
            const token = localStorage.getItem('aegis_access_token');
            const userData = localStorage.getItem('aegis_user_data');
            
            if (!token || !userData) {
              if (attempts < maxAttempts) {
                setTimeout(checkAuthState, 50);
                return;
              } else {
                console.warn('🎯 LandingPage: Auth state timeout - localStorage not ready');
                resolve(); // Proceed anyway
                return;
              }
            }
            
            // Check AuthService state
            const { AuthService } = await import('@/services/authService');
            const serviceAuthenticated = AuthService.isAuthenticated();
            const serviceSessionValid = AuthService.isSessionValid();
            
            if (serviceAuthenticated && serviceSessionValid) {
              console.log('🎯 LandingPage: Complete auth state confirmed - localStorage + AuthService ready');
              resolve();
            } else if (attempts < maxAttempts) {
              console.log('🎯 LandingPage: Waiting for AuthService state sync... Attempt:', attempts);
              setTimeout(checkAuthState, 50);
            } else {
              console.warn('🎯 LandingPage: Auth state timeout - AuthService not synchronized');
              resolve(); // Proceed anyway
            }
            
          } catch (error) {
            console.warn('🎯 LandingPage: Auth state check error:', error);
            if (attempts < maxAttempts) {
              setTimeout(checkAuthState, 50);
            } else {
              resolve(); // Proceed anyway
            }
          }
        };
        
        checkAuthState();
      });
    };
    
    try {
      // Wait for complete auth state with timeout
      await Promise.race([
        waitForFullAuthState(),
        new Promise<void>((resolve) => 
          setTimeout(() => {
            console.warn('🎯 LandingPage: Auth state wait timeout, proceeding with navigation');
            resolve();
          }, 10000) // 10 second absolute timeout
        )
      ]);
      
      // Additional React state flush
      const { flushSync } = await import('react-dom');
      flushSync(() => {
        // Force any pending state updates
      });
      
      // Small additional delay to ensure React Router is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🎯 LandingPage: All auth state confirmed, executing navigation to /client-portal/dashboard');
      navigate('/client-portal/dashboard');
      
    } catch (error) {
      console.error('🎯 LandingPage: Auth state confirmation failed:', error);
      // Fallback - navigate anyway after delay
      setTimeout(() => {
        console.log('🎯 LandingPage: Fallback navigation to /client-portal/dashboard');
        navigate('/client-portal/dashboard');
      }, 500);
    }
  };

  const handleCloseModal = () => {
    setShowClientLogin(false);
  };

  // ===========================
  // RENDER HELPERS
  // ===========================

  const renderHeader = () => (
    <div className="text-center mb-16">
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center mr-4 glow-cyan glow-pulse">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div className="text-left">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-wide text-glow-teal">
            APEX IQ SECURITY AI PLATFORM
          </h1>
          <p className="text-cyan-400 text-lg md:text-xl font-medium tracking-widest mt-2 text-glow-cyan">
            DEFENSE INTERNATIONAL
          </p>
        </div>
      </div>
      
      <h2 className="text-xl md:text-2xl text-gray-300 font-medium mb-4">
        AI-Powered Security Operations & Management System
      </h2>
      <p className="text-gray-400 text-lg max-w-2xl mx-auto">
        Choose your access portal below
      </p>
    </div>
  );

  const renderAccessOptions = () => (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* CLIENT PORTAL ACCESS */}
        <div className="bg-black/40 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-8 hover:border-cyan-400/50 transition-all duration-300 hover:transform hover:scale-[1.02] group tech-border hover-glow-cyan">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 glow-cyan glow-pulse">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-cyan-400 mb-2 text-glow-teal">
              CLIENT PORTAL
            </h3>
            <p className="text-cyan-300 text-sm uppercase tracking-wide">
              PROPERTY MANAGERS & STAKEHOLDERS
            </p>
          </div>
          
          {/* Description */}
          <p className="text-gray-300 text-center mb-8 text-lg leading-relaxed">
            Secure access for property managers and security stakeholders to view analytics, 
            incident reports, and security intelligence.
          </p>
          
          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-black/20 rounded-lg p-4 border border-cyan-500/20">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mb-2"></div>
              <p className="text-gray-300 text-sm">Executive Dashboard</p>
            </div>
            <div className="bg-black/20 rounded-lg p-4 border border-cyan-500/20">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mb-2"></div>
              <p className="text-gray-300 text-sm">Incident Reports</p>
            </div>
            <div className="bg-black/20 rounded-lg p-4 border border-cyan-500/20">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mb-2"></div>
              <p className="text-gray-300 text-sm">Evidence Locker</p>
            </div>
            <div className="bg-black/20 rounded-lg p-4 border border-cyan-500/20">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mb-2"></div>
              <p className="text-gray-300 text-sm">Analytics & KPIs</p>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="text-center">
            <button 
              onClick={handleClientPortalAccess}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 flex items-center mx-auto hover-glow-cyan glow-pulse-fast text-lg"
            >
              Access Client Portal
              <ChevronRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-gray-400 text-sm mt-3">
              Secure login with your property manager credentials
            </p>
          </div>
        </div>

        {/* DEFENSE APEX AI SITE */}
        <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-[1.02] group tech-border hover-glow-teal">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 glow-teal glow-pulse">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-purple-400 mb-2 text-glow-teal">
              DEFENSE APEX AI SITE
            </h3>
            <p className="text-purple-300 text-sm uppercase tracking-wide">
              COMPANY EMPLOYEES & OPERATIONS
            </p>
          </div>
          
          {/* Description */}
          <p className="text-gray-300 text-center mb-8 text-lg leading-relaxed">
            Main company homepage for dispatchers, administrators, guards, and operations staff. 
            Access the full AI-powered security operations platform.
          </p>
          
          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20">
              <div className="w-2 h-2 bg-purple-400 rounded-full mb-2"></div>
              <p className="text-gray-300 text-sm">Live AI Monitoring</p>
            </div>
            <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20">
              <div className="w-2 h-2 bg-purple-400 rounded-full mb-2"></div>
              <p className="text-gray-300 text-sm">Guard Operations</p>
            </div>
            <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20">
              <div className="w-2 h-2 bg-purple-400 rounded-full mb-2"></div>
              <p className="text-gray-300 text-sm">Admin Dashboard</p>
            </div>
            <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20">
              <div className="w-2 h-2 bg-purple-400 rounded-full mb-2"></div>
              <p className="text-gray-300 text-sm">Report Builder</p>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="text-center">
            <button 
              onClick={handleDefenseApexSite}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-purple-400 hover:to-pink-500 transition-all duration-200 flex items-center mx-auto hover-glow-teal glow-pulse-fast text-lg"
            >
              Enter Defense Site
              <ChevronRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-gray-400 text-sm mt-3">
              Main operations platform with movie backgrounds
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFooter = () => (
    <div className="text-center mt-16 pt-8 border-t border-gray-600/30">
      <p className="text-gray-400 text-sm mb-2">
        © 2025 APEX AI Security Platform - Defense International
      </p>
      <p className="text-gray-500 text-xs">
        Enterprise AI-Powered Security Solutions
      </p>
    </div>
  );

  // ===========================
  // MAIN COMPONENT RENDER
  // ===========================

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Professional Background with Video Fallback */}
      <div className="absolute inset-0 z-0">
        {/* Video temporarily disabled - no video files available */}
        {/* 
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-0"
          onLoadedData={() => {
            setIsLoaded(true);
            // Show video when loaded
            if (videoRef.current) videoRef.current.style.opacity = '1';
          }}
          onError={() => {
            // Hide video on error, fallback will show
            if (videoRef.current) videoRef.current.style.display = 'none';
            setIsLoaded(true);
          }}
        >
          <source src="/video/security-background.mp4" type="video/mp4" />
          <source src="/video/security-background.webm" type="video/webm" />
        </video>
        */}
        
        {/* Video Overlay */}
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50"></div>
      </div>

      {/* Professional Fallback Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-black to-gray-800">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpolygon points='50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px'
          }}></div>
        </div>
        
        {/* Additional Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-purple-900/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 container mx-auto px-6 py-12 flex flex-col justify-center">
          
          {/* Header Section */}
          {renderHeader()}
          
          {/* Main Access Options */}
          {renderAccessOptions()}
          
          {/* Footer */}
          {renderFooter()}
        </div>
      </div>
      
      {/* Client Login Modal */}
      <ClientLoginModal
        isOpen={showClientLogin}
        onClose={handleCloseModal}
        onLoginSuccess={handleClientLoginSuccess}
        backgroundVideoRef={videoRef}
      />

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg">Loading APEX AI Platform...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ===========================
// RESPONSIVE UTILITIES
// ===========================

export const MobileLandingPage: React.FC = () => {
  return (
    <div className="md:hidden">
      <LandingPage />
    </div>
  );
};

export const DesktopLandingPage: React.FC = () => {
  return (
    <div className="hidden md:block">
      <LandingPage />
    </div>
  );
};

// ===========================
// EXPORTS
// ===========================

export default LandingPage;
