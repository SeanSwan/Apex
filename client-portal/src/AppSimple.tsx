// client-portal/src/AppSimple.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Simplified imports
const LandingPageSimple = lazy(() => import('./components/landing/LandingPageSimple'));

// Simple placeholder for the client portal dashboard
const DashboardPlaceholder = () => (
  <div className="min-h-screen bg-gray-100 p-8">
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">🎉 APEX AI Client Portal Dashboard</h1>
        <p className="text-gray-600 mb-6">
          Congratulations! You've successfully logged into the client portal.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📊 Total Incidents</h3>
            <p className="text-3xl font-bold text-blue-600">127</p>
            <p className="text-sm text-blue-600">Last 30 days</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">🚨 Critical Alerts</h3>
            <p className="text-3xl font-bold text-red-600">8</p>
            <p className="text-sm text-red-600">Requires attention</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Resolution Rate</h3>
            <p className="text-3xl font-bold text-green-600">92%</p>
            <p className="text-sm text-green-600">Above target</p>
          </div>
        </div>
        <div className="mt-8">
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Landing Page
          </button>
        </div>
      </div>
    </div>
  </div>
);

const AppSimple: React.FC = () => {
  return (
    <Routes>
      {/* Landing Page */}
      <Route
        path="/"
        element={
          <Suspense fallback={
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
              <div className="text-white text-xl">Loading APEX AI Platform...</div>
            </div>
          }>
            <LandingPageSimple />
          </Suspense>
        }
      />
      
      {/* Client Portal Dashboard */}
      <Route
        path="/client-portal/dashboard"
        element={<DashboardPlaceholder />}
      />
      
      {/* Fallback for unknown routes */}
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-2xl font-bold mb-4">🌐 Page Not Found</h1>
              <p className="text-gray-400 mb-4">The page you're looking for doesn't exist.</p>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return Home
              </button>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default AppSimple;
