// APEX AI SECURITY PLATFORM - INTEGRATED HOMEPAGE
// Combines original branding with new platform modules
// Master Prompt v29.1-APEX Implementation

import React from 'react';
import { motion } from 'framer-motion';
import securityVideo from '../../assets/security.mp4';

// Color palette matching header component
const colors = {
  gold: '#D4AF37', // Primary color
  lightGold: '#F4D160', // Lighter gold for hover effects
  black: '#000000', // Secondary color
  darkBlack: '#0A0A0A', // Slightly lighter black for contrast
  silver: '#C0C0C0', // Tertiary color
  lightSilver: '#E8E8E8', // Lighter silver for hover effects
  white: '#FFFFFF', // For text and contrast
};

// Module Card Component with enhanced styling
function ModuleCard(props) {
  const { title, description, features, href, status, priority } = props;
  
  function getPriorityColor() {
    switch(priority) {
      case 'ready': return '#22C55E';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'future': return '#6B7280';
      default: return '#3B82F6';
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
      e.currentTarget.style.boxShadow = `0 8px 25px rgba(${
        priority === 'ready' ? '34, 197, 94' :
        priority === 'high' ? '239, 68, 68' :
        priority === 'medium' ? '245, 158, 11' : '59, 130, 246'
      }, 0.3)`;
    }
  }

  function handleMouseLeave(e) {
    if (isClickable) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{
        background: 'rgba(30, 30, 30, 0.95)',
        border: `1px solid ${getPriorityColor()}`,
        borderRadius: '16px',
        padding: '2rem',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        opacity: priority === 'future' ? 0.8 : 1,
        backdropFilter: 'blur(10px)',
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ 
          margin: '0 0 0.5rem 0', 
          fontSize: '1.3rem', 
          color: colors.gold,
          fontWeight: '600',
          fontFamily: 'Orbitron, sans-serif'
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
        color: colors.lightSilver, 
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
        color: colors.silver,
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

      {/* Enhanced Gradient Overlay for better text readability */}
      <div 
        className="absolute top-0 left-0 w-full h-full z-5"
        style={{
          background: `
            linear-gradient(
              135deg, 
              rgba(0, 0, 0, 0.85) 0%, 
              rgba(0, 0, 0, 0.75) 25%,
              rgba(10, 10, 10, 0.8) 50%,
              rgba(0, 0, 0, 0.75) 75%,
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
                width: '64px',
                height: '64px',
                background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.lightGold} 100%)`,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                color: colors.black,
                boxShadow: `0 8px 25px rgba(212, 175, 55, 0.4)`
              }}
            >
              🛡️
            </motion.div>
            <div>
              <motion.h1 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{ 
                  margin: 0, 
                  fontSize: '3rem', 
                  fontWeight: '700', 
                  color: colors.gold,
                  fontFamily: 'Orbitron, sans-serif',
                  textShadow: `2px 2px 4px rgba(0, 0, 0, 0.8)`,
                  lineHeight: '1.1'
                }}
              >
                APEX AI Security Platform
              </motion.h1>
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                style={{
                  fontSize: '1rem',
                  color: colors.silver,
                  marginTop: '0.5rem',
                  fontFamily: 'Orbitron, sans-serif',
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
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
              color: colors.lightSilver, 
              margin: 0,
              maxWidth: '700px',
              textShadow: `1px 1px 2px rgba(0, 0, 0, 0.8)`,
              lineHeight: '1.4'
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
              color: colors.silver, 
              margin: '1rem 0 0 0',
              maxWidth: '600px',
              textShadow: `1px 1px 2px rgba(0, 0, 0, 0.8)`
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

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          style={{ 
            marginTop: '2rem', 
            textAlign: 'center', 
            color: colors.silver,
            fontSize: '0.9rem',
            textShadow: `1px 1px 2px rgba(0, 0, 0, 0.8)`
          }}
        >
          <p style={{ margin: '0.5rem 0' }}>Master Prompt v29.1-APEX Implementation</p>
          <p style={{ margin: '0.5rem 0', color: colors.gold }}>
            Revolutionizing Security Operations with Cutting-Edge AI Technology
          </p>
        </motion.div>
      </div>
    </div>
  );
}
