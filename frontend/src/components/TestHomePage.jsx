// Simple test component to verify routing
import React from 'react';

const TestHomePage = () => {
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      backgroundColor: '#000',
      color: '#fff',
      minHeight: '100vh',
      paddingTop: '100px' // Account for header
    }}>
      <h1 style={{ color: '#D4AF37', fontSize: '2rem', marginBottom: '1rem' }}>
        🚀 ROUTING TEST SUCCESS!
      </h1>
      
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
        If you can see this page, routing is working correctly.
      </p>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>Navigation Test:</h2>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/" style={{ color: '#D4AF37', textDecoration: 'underline' }}>
            Home
          </a>
          <a href="/reports/new" style={{ color: '#D4AF37', textDecoration: 'underline' }}>
            Enhanced Reports
          </a>
          <a href="/reports/legacy" style={{ color: '#D4AF37', textDecoration: 'underline' }}>
            Legacy Reports
          </a>
          <a href="/live-monitoring" style={{ color: '#D4AF37', textDecoration: 'underline' }}>
            Live Monitoring
          </a>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: '8px' }}>
        <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>Debug Info:</h3>
        <p>Current URL: {window.location.href}</p>
        <p>Current Pathname: {window.location.pathname}</p>
        <p>Timestamp: {new Date().toLocaleString()}</p>
      </div>
      
      <button 
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        style={{
          marginTop: '2rem',
          padding: '10px 20px',
          backgroundColor: '#D4AF37',
          color: '#000',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        Clear Storage & Reload
      </button>
    </div>
  );
};

export default TestHomePage;
