// client-portal/src/components/app/MainAppPlaceholder.tsx
/**
 * APEX AI - Main Application Placeholder
 * ====================================
 * 
 * Placeholder component for the main APEX AI application.
 * This will be replaced with the actual dispatch console/monitoring app
 * when ready for production integration.
 * 
 * Features:
 * - Professional placeholder design
 * - Coming soon messaging
 * - Back to landing page navigation
 * - Same visual theme as the platform
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, ArrowLeft, Shield, Settings, Camera, Phone } from 'lucide-react';

export const MainAppPlaceholder: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToLanding = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Header */}
        <div className="p-6">
          <button
            onClick={handleBackToLanding}
            className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Platform Selection
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-4xl mx-auto">
            
            {/* APEX AI Logo */}
            <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mr-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wide">
                  APEX AI
                </h1>
                <p className="text-cyan-400 text-lg font-medium tracking-widest">
                  OPERATIONS CONSOLE
                </p>
              </div>
            </div>

            {/* Coming Soon Message */}
            <div className="bg-black/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-12 mb-8">
              <div className="text-6xl mb-6">🚧</div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Operations Console Coming Soon
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                The main APEX AI operations console is currently in development. 
                This will include live monitoring, dispatch coordination, and system administration.
              </p>

              {/* Feature Preview */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <Monitor className="w-8 h-8 text-cyan-400 mb-3 mx-auto" />
                  <h3 className="text-white font-semibold mb-2">Live Monitoring</h3>
                  <p className="text-gray-400 text-sm">Real-time AI video analysis</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <Phone className="w-8 h-8 text-green-400 mb-3 mx-auto" />
                  <h3 className="text-white font-semibold mb-2">Voice Dispatch</h3>
                  <p className="text-gray-400 text-sm">AI-powered call handling</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <Camera className="w-8 h-8 text-purple-400 mb-3 mx-auto" />
                  <h3 className="text-white font-semibold mb-2">Guard Coordination</h3>
                  <p className="text-gray-400 text-sm">Real-time team management</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <Settings className="w-8 h-8 text-orange-400 mb-3 mx-auto" />
                  <h3 className="text-white font-semibold mb-2">Administration</h3>
                  <p className="text-gray-400 text-sm">System configuration</p>
                </div>
              </div>

              {/* Development Status */}
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-blue-400 font-semibold mb-2">Development Status</h3>
                <div className="space-y-2 text-left">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-300">Client Portal - Complete ✅</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-gray-300">Backend Infrastructure - In Progress 🔄</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                    <span className="text-gray-300">Operations Console - Planned 📋</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                    <span className="text-gray-300">AI Integration - Planned 📋</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleBackToLanding}
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors duration-200"
              >
                Return to Platform Selection
              </button>
              <button
                onClick={() => navigate('/client-portal/login')}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold transition-all duration-200"
              >
                Try Client Portal Instead
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 APEX AI Security Platform - Defense International
          </p>
        </div>
      </div>
    </div>
  );
};

export default MainAppPlaceholder;