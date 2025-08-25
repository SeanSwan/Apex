import React, { useState, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { motion } from 'framer-motion';
import securityVideo from '../assets/security.mp4';
import '../styles/holographicAnimations.css';

// APEX AI COLORS - Match the homepage
const colors = {
  primary: '#14B8A6',
  primaryLight: '#2DD4BF',
  primaryDark: '#0D9488',
  accent: '#8B5CF6',
  white: '#FFFFFF',
  black: '#000000',
  darkBg: '#0A0A0A',
  cardBg: 'rgba(0, 0, 0, 0.95)',
  primaryGlow: 'rgba(20, 184, 166, 0.3)',
  textGlow: 'rgba(20, 184, 166, 0.4)',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
};

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ 
    username: 'sarah.johnson@luxeapartments.com', 
    password: 'Demo123!' 
  });
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    // If user is already logged in, redirect to live monitoring
    return <Navigate to="/live-monitoring" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Simple demo authentication bypass
      if (
        (credentials.username === 'sarah.johnson@luxeapartments.com' || 
         credentials.username === 'admin' || 
         credentials.username === 'demo') &&
        (credentials.password === 'Demo123!' || 
         credentials.password === 'admin' || 
         credentials.password === 'demo')
      ) {
        // Create a mock user for demo
        const mockUser = {
          id: 'demo-user-001',
          username: credentials.username,
          email: credentials.username.includes('@') ? credentials.username : 'demo@example.com',
          role: 'admin',
          firstName: 'Demo',
          lastName: 'User'
        };
        
        // Store in localStorage for demo
        localStorage.setItem('token', 'demo-token-123');
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        // Navigate to live monitoring
        navigate('/live-monitoring');
        return;
      }
      
      // Try real authentication as fallback
      await login(credentials.username, credentials.password);
      navigate('/live-monitoring');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid credentials. Try: admin/admin or demo/demo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ 
      background: colors.black 
    }}>
      {/* Video Background - Same as homepage */}
      <video
        autoPlay
        loop
        muted
        className="absolute top-0 left-0 min-w-full min-h-full object-cover z-0"
        style={{ opacity: 0.4 }}
      >
        <source src={securityVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Professional Gradient Overlay */}
      <div 
        className="absolute top-0 left-0 w-full h-full z-5"
        style={{
          background: `
            linear-gradient(
              135deg, 
              rgba(0, 0, 0, 0.85) 0%, 
              rgba(15, 23, 42, 0.02) 15%,
              rgba(0, 0, 0, 0.75) 25%,
              rgba(20, 184, 166, 0.01) 50%,
              rgba(0, 0, 0, 0.75) 75%,
              rgba(15, 23, 42, 0.02) 85%,
              rgba(0, 0, 0, 0.85) 100%
            )
          `
        }}
      />

      {/* Content Overlay */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {/* Logo Section */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ textAlign: 'center', marginBottom: '2rem' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: colors.white,
                  background: `
                    linear-gradient(135deg, 
                      ${colors.primary} 0%, 
                      ${colors.primaryLight} 50%, 
                      ${colors.accent} 100%
                    )
                  `,
                  boxShadow: `
                    0 0 20px ${colors.primaryGlow},
                    0 8px 32px rgba(0, 0, 0, 0.4)
                  `,
                }}
              >
                🛡️
              </motion.div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '1.8rem', 
                fontWeight: '700', 
                fontFamily: 'Orbitron, sans-serif',
                background: `linear-gradient(180deg, 
                  #E8E8E8 0%, 
                  #F5F5F5 25%, 
                  #FFFFFF 50%, 
                  #D3D3D3 75%, 
                  #A9A9A9 100%
                )`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: `
                  0 1px 0 rgba(255, 255, 255, 0.4),
                  0 -1px 0 rgba(0, 0, 0, 0.2),
                  0 0 15px rgba(192, 192, 192, 0.3)
                `,
                color: '#C0C0C0',
              }}>
                APEX AI
              </h1>
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: colors.primaryLight,
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              textShadow: `0 0 8px ${colors.primaryGlow}`,
              marginBottom: '0.5rem'
            }}>
              Defense Operations Console
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: colors.gray400,
              textShadow: `1px 1px 2px rgba(0, 0, 0, 0.8)`
            }}>
              Secure Access Portal
            </div>
          </motion.div>

          {/* Login Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            onSubmit={handleSubmit}
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.primary}`,
              borderRadius: '16px',
              padding: '2rem',
              backdropFilter: 'blur(20px)',
              boxShadow: `
                0 0 20px ${colors.primaryGlow},
                0 8px 32px rgba(0, 0, 0, 0.4)
              `
            }}
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  color: '#EF4444',
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}
              >
                {error}
              </motion.div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="username" 
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: colors.gray300,
                  marginBottom: '0.5rem',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Username / Email
              </label>
              <Input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: `1px solid ${colors.primary}`,
                  borderRadius: '8px',
                  color: colors.white,
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primaryLight;
                  e.target.style.boxShadow = `0 0 10px ${colors.primaryGlow}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label 
                htmlFor="password" 
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: colors.gray300,
                  marginBottom: '0.5rem',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Password
              </label>
              <Input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: `1px solid ${colors.primary}`,
                  borderRadius: '8px',
                  color: colors.white,
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primaryLight;
                  e.target.style.boxShadow = `0 0 10px ${colors.primaryGlow}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: `
                  linear-gradient(135deg, 
                    ${colors.primary} 0%, 
                    ${colors.primaryLight} 100%
                  )
                `,
                border: 'none',
                borderRadius: '8px',
                color: colors.white,
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: `0 4px 12px ${colors.primaryGlow}`,
                fontFamily: 'Inter, sans-serif',
                opacity: isLoading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = `0 6px 20px ${colors.primaryGlow}`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = `0 4px 12px ${colors.primaryGlow}`;
                }
              }}
            >
              {isLoading ? 'Authenticating...' : 'Access Defense Console'}
            </Button>

            {/* Demo Credentials Helper */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(20, 184, 166, 0.05)',
                border: '1px solid rgba(20, 184, 166, 0.2)',
                borderRadius: '8px',
                textAlign: 'center'
              }}
            >
              <div style={{
                fontSize: '0.8rem',
                color: colors.primaryLight,
                fontWeight: '600',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Demo Credentials
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: colors.gray300,
                lineHeight: '1.4'
              }}>
                <strong>Quick Access:</strong> admin / admin<br/>
                <strong>Demo Mode:</strong> demo / demo<br/>
                <strong>Full Demo:</strong> sarah.johnson@luxeapartments.com / Demo123!
              </div>
            </motion.div>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;