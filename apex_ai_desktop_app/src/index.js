/**
 * APEX AI DESKTOP MONITOR - REACT ENTRY POINT
 * ==========================================
 * Main entry point for the React application
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('🚀 Apex AI Desktop Monitor - React App Started');
