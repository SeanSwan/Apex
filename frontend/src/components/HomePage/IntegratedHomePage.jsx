// APEX IQ SECURITY AI PLATFORM - INTEGRATED HOMEPAGE
// Award-winning iridescent teal theme with holographic animations
// Master Prompt v36.0-APEX Implementation

import React from 'react';
import { motion } from 'framer-motion';
import securityVideo from '../../assets/security.mp4';
import '../../styles/holographicAnimations.css';

// AWARD-WINNING PROFESSIONAL CYBERPUNK COLOR PALETTE
const colors = {
  // REFINED PRIMARY SYSTEM - More professional, less "rainbow"
  primary: '#14B8A6',        // Main teal - professional
  primaryLight: '#2DD4BF',   // Light teal accent
  primaryDark: '#0D9488',    // Dark teal for depth
  
  // SOPHISTICATED ACCENT SYSTEM
  accent: '#8B5CF6',         // Professional purple
  accentSecondary: '#EC4899', // Refined pink - less intense
  success: '#10B981',        // Professional green
  warning: '#F59E0B',        // Professional amber
  
  // NEUTRAL PROFESSIONAL TONES
  white: '#FFFFFF',
  black: '#000000',
  darkBg: '#0A0A0A',
  cardBg: 'rgba(0, 0, 0, 0.95)', // Back to black as requested
  
  // SUBTLE GLOW EFFECTS - Much more refined
  primaryGlow: 'rgba(20, 184, 166, 0.3)', // Reduced intensity
  accentGlow: 'rgba(139, 92, 246, 0.25)', // More subtle
  textGlow: 'rgba(20, 184, 166, 0.4)',   // Refined text glow
  
  // PROFESSIONAL GRAYS
  gray100: '#F8FAFC',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',
};

// Module Card Component with enhanced styling
function ModuleCard(props) {
  const { title, description, features, href, status, priority } = props;
  
  function getPriorityColor() {
    switch(priority) {
      case 'ready': return colors.success;
      case 'high': return colors.primary;
      case 'medium': return colors.accent;
      case 'future': return colors.gray500;
      default: return colors.primary;
    }
  }
  
  function getPriorityGlow() {
    switch(priority) {
      case 'ready': return `0 0 15px rgba(16, 185, 129, 0.2), 0 0 30px rgba(16, 185, 129, 0.1)`;
      case 'high': return `0 0 15px ${colors.primaryGlow}`;
      case 'medium': return `0 0 15px ${colors.accentGlow}`;
      case 'future': return 'none';
      default: return `0 0 15px ${colors.primaryGlow}`;
    }
  }

  const isClickable = priority !== 'future';

  function handleClick() {
    if (isClickable) {
      window.location.href = href;
    }
  }

  function handleMouseEnter(e) {
    if (isClickable) {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = getPriorityGlow();
      e.currentTarget.style.borderColor = getPriorityColor();
      
      // Subtle professional glow effect
      if (priority !== 'future') {
        e.currentTarget.style.background = `
          linear-gradient(135deg, 
            ${colors.cardBg} 0%, 
            rgba(20, 184, 166, 0.02) 50%,
            ${colors.cardBg} 100%
          )
        `;
      }
    }
  }

  function handleMouseLeave(e) {
    if (isClickable) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.background = colors.cardBg;
      e.currentTarget.style.borderColor = getPriorityColor();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{
        background: colors.cardBg,
        border: `1px solid ${getPriorityColor()}`,
        borderRadius: '16px',
        padding: '2rem',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: priority === 'future' ? 0.7 : 1,
        backdropFilter: 'blur(20px)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ 
          margin: '0 0 0.5rem 0', 
          fontSize: '1.3rem', 
          color: isClickable ? colors.primary : colors.gray500,
          fontWeight: '600',
          fontFamily: 'Orbitron, sans-serif',
          textShadow: isClickable ? `0 0 8px ${colors.textGlow}` : 'none',
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
        color: colors.gray300, 
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
        color: colors.gray400,
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
          background: 'rgba(71, 85, 105, 0.15)',
          borderRadius: '8px',
          border: '1px solid rgba(100, 116, 139, 0.2)',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: colors.gray500
        }}>
          Coming in Phase 3
        </div>
      )}
    </motion.div>
  );
}

// Main Integrated Homepage Component
export default function IntegratedHomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ 
      paddingTop: '70px', // Account for fixed header
      background: colors.black 
    }}>
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        className="absolute top-0 left-0 min-w-full min-h-full object-cover z-0"
        style={{ opacity: 0.3 }}
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
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        
        {/* Hero Section */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '1rem', 
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
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
                  0 8px 32px rgba(0, 0, 0, 0.4),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `,
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Subtle animated accent */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(45deg, transparent, ${colors.primaryGlow}, transparent)`,
                animation: 'shimmer 3s ease-in-out infinite',
                borderRadius: '18px'
              }} />
              🛡️
            </motion.div>
            <div>
              <motion.h1 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{ 
                  margin: 0, 
                  fontSize: '3.2rem', 
                  fontWeight: '700', 
                  fontFamily: 'Orbitron, sans-serif',
                  lineHeight: '1.1',
                  // ELEGANT SILVER CHROME - More refined and less boxy
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
                  // Refined chrome text shadows - less harsh
                  textShadow: `
                    0 1px 0 rgba(255, 255, 255, 0.4),
                    0 -1px 0 rgba(0, 0, 0, 0.2),
                    0 0 15px rgba(192, 192, 192, 0.3)
                  `,
                  // Fallback for browsers without gradient text support
                  color: '#C0C0C0',
                  // Remove the drop-shadow that was making it boxy
                  filter: 'none'
                }}
              >
                APEX IQ SECURITY AI PLATFORM
              </motion.h1>
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                style={{
                  fontSize: '1rem',
                  color: colors.primaryLight,
                  marginTop: '0.5rem',
                  fontFamily: 'Orbitron, sans-serif',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  textShadow: `0 0 8px ${colors.primaryGlow}`,
                  fontWeight: '400',
                  opacity: 0.9
                }}
              >
                Defense International
              </motion.div>
            </div>
          </div>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{ 
              fontSize: '1.3rem', 
              color: colors.gray200, 
              margin: 0,
              maxWidth: '750px',
              textShadow: `1px 1px 2px rgba(0, 0, 0, 0.8)`,
              lineHeight: '1.4',
              fontWeight: '400'
            }}
          >
            AI-Powered Security Operations & Guard Management System
          </motion.p>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{ 
              fontSize: '1rem', 
              color: colors.gray400, 
              margin: '1rem 0 0 0',
              maxWidth: '650px',
              textShadow: `1px 1px 2px rgba(0, 0, 0, 0.8)`,
              fontWeight: '400',
              letterSpacing: '0.3px'
            }}
          >
            Transforming Security Operations with AI-Augmented Guard Services
          </motion.p>
        </motion.div>

        {/* Module Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem',
            maxWidth: '1400px',
            width: '100%',
            marginBottom: '2rem'
          }}
        >
          
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
            description="Mobile app for standing guards with AI alerts and incident reporting"
            features={["Time clock", "AI alert reception", "Incident reporting", "Dispatch communication"]}
            href="/guard-mobile"
            status="Phase 2C - Mobile App"
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
        </motion.div>

        {/* Professional Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          style={{ 
            marginTop: '3rem', 
            textAlign: 'center', 
            fontSize: '0.9rem',
            textShadow: `1px 1px 2px rgba(0, 0, 0, 0.8)`
          }}
        >
          <p style={{ 
            margin: '0.5rem 0',
            color: colors.gray400,
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.5px',
            fontSize: '0.85rem'
          }}>
            Master Prompt v36.0-APEX Implementation
          </p>
          <motion.p 
            style={{ 
              margin: '0.5rem 0', 
              fontSize: '1rem',
              fontWeight: '500',
              color: colors.primary,
              textShadow: `0 0 6px ${colors.textGlow}`,
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Revolutionizing Security Operations with Cutting-Edge AI Technology
          </motion.p>
          
          {/* Professional Accent Line */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '150px', opacity: 0.4 }}
            transition={{ duration: 1.2, delay: 1.5 }}
            style={{
              height: '1px',
              margin: '1rem auto',
              background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
              borderRadius: '1px'
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
