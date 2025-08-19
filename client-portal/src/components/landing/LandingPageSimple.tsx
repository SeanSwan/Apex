// client-portal/src/components/landing/LandingPageSimple.tsx
import React, { useState } from 'react';
import { Shield, Users, ChevronRight, Building2 } from 'lucide-react';

export const LandingPageSimple: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const handleClientPortalAccess = () => {
    setShowLogin(true);
  };

  const handleDefenseApexSite = () => {
    // Check if the main frontend is running on port 5173 or other ports
    const mainSiteUrl = 'http://localhost:5173';
    
    // For now, redirect to the main site
    // In a real implementation, this would show an employee login form
    const confirmed = confirm(
      'Redirecting to Defense APEX AI Employee Site.\n\n' +
      'This will take you to the main business platform for employees, guards, and operations staff.\n\n' +
      'Click OK to continue or Cancel to stay here.'
    );
    
    if (confirmed) {
      window.open(mainSiteUrl, '_blank');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/client/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Store token and redirect to dashboard
        localStorage.setItem('aegis_access_token', result.data.accessToken);
        localStorage.setItem('aegis_user_data', JSON.stringify(result.data.user));
        window.location.href = '/client-portal/dashboard';
      } else {
        alert('Login failed: ' + result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: Unable to connect to server');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex flex-col">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpolygon points='50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 container mx-auto px-6 py-12 flex flex-col justify-center">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center mr-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-white tracking-wide">
                APEX AI SECURITY PLATFORM
              </h1>
              <p className="text-cyan-400 text-lg md:text-xl font-medium tracking-widest mt-2">
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

        {/* Access Options */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* CLIENT PORTAL ACCESS */}
            <div className="bg-black/40 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-8 hover:border-cyan-400/50 transition-all duration-300 hover:transform hover:scale-[1.02] group">
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-cyan-400 mb-2">
                  CLIENT PORTAL
                </h3>
                <p className="text-cyan-300 text-sm uppercase tracking-wide">
                  PROPERTY MANAGERS & STAKEHOLDERS
                </p>
              </div>
              
              <p className="text-gray-300 text-center mb-8 text-lg leading-relaxed">
                Secure access for property managers and security stakeholders to view analytics, 
                incident reports, and security intelligence.
              </p>
              
              <div className="text-center">
                <button 
                  onClick={handleClientPortalAccess}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 flex items-center mx-auto text-lg"
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
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:scale-[1.02] group">
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-purple-400 mb-2">
                  DEFENSE APEX AI SITE
                </h3>
                <p className="text-purple-300 text-sm uppercase tracking-wide">
                  COMPANY EMPLOYEES & OPERATIONS
                </p>
              </div>
              
              <p className="text-gray-300 text-center mb-8 text-lg leading-relaxed">
                Main company homepage for dispatchers, administrators, guards, and operations staff. 
                Access the full AI-powered security operations platform.
              </p>
              
              <div className="text-center">
                <button 
                  onClick={handleDefenseApexSite}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-purple-400 hover:to-pink-500 transition-all duration-200 flex items-center mx-auto text-lg"
                >
                  Enter Defense Site
                  <ChevronRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-gray-400 text-sm mt-3">
                  Employee access with authentication
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-gray-600/30">
          <p className="text-gray-400 text-sm mb-2">
            © 2025 APEX AI Security Platform - Defense International
          </p>
          <p className="text-gray-500 text-xs">
            Enterprise AI-Powered Security Solutions
          </p>
        </div>
      </div>
      
      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
          <div className="bg-gray-900 border border-cyan-500/30 rounded-xl p-8 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Client Portal Login</h2>
              <p className="text-gray-400">Enter your credentials to access the portal</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                  placeholder="sarah.johnson@luxeapartments.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                  placeholder="Demo123!"
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all"
                >
                  Login
                </button>
              </div>
            </form>
            
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm font-medium">Demo Credentials:</p>
              <p className="text-blue-200 text-xs">Email: sarah.johnson@luxeapartments.com</p>
              <p className="text-blue-200 text-xs">Password: Demo123!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPageSimple;
