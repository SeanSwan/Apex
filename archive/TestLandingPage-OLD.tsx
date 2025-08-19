// TEST: Simple landing page verification
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const TestLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-800 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-8">🚨 LANDING PAGE TEST 🚨</h1>
        <h2 className="text-4xl mb-8">APEX AI PLATFORM</h2>
        <p className="text-xl mb-8">If you see this, the landing page routing is working!</p>
        
        <div className="space-y-4">
          <button
            onClick={() => navigate('/client-portal/login')}
            className="block w-full bg-blue-600 text-white px-8 py-4 rounded-lg text-xl font-bold"
          >
            🏢 TEST: Go to Client Portal
          </button>
          
          <button
            onClick={() => navigate('/app')}
            className="block w-full bg-purple-600 text-white px-8 py-4 rounded-lg text-xl font-bold"
          >
            🖥️ TEST: Go to Operations App
          </button>
        </div>
        
        <p className="text-sm mt-8 text-red-400">
          This is a temporary test page. The real landing page will load after this test passes.
        </p>
      </div>
    </div>
  );
};

export default TestLandingPage;