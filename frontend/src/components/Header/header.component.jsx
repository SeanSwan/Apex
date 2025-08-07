// File: frontend/src/components/Header/header.component.jsx

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { FontSelector } from '../Admin/FontSelector';
import Logo from '../../assets/Logo.png';
import config from '../../../config';

// REFINED PROFESSIONAL CYBERPUNK COLOR PALETTE - Matching homepage theme
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
  cardBg: 'rgba(0, 0, 0, 0.95)', // Professional black
  
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
  
  // Legacy compatibility
  gold: '#14B8A6', // Map to primary teal
  lightGold: '#2DD4BF', // Map to light teal
  silver: '#C0C0C0',
  lightSilver: '#E8E8E8',
  transparent: 'rgba(0, 0, 0, 0)'
};

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const shimmer = keyframes`
  0% { background-position: -100% 0; }
  100% { background-position: 100% 0; }
`;

// Main header container using CSS Grid
const HeaderContainer = styled.header`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  background: linear-gradient(135deg, ${colors.black} 0%, ${colors.gray900} 50%, ${colors.black} 100%);
  border-bottom: 1px solid ${colors.primary};
  box-shadow: 
    0 2px 10px rgba(0, 0, 0, 0.5),
    0 0 20px ${colors.primaryGlow};
  padding: 0.5rem 2rem;
  height: 70px;
  width: 100%;
  position: fixed;
  top: 0;
  z-index: 999;
  animation: ${fadeIn} 0.5s ease-in-out;
  font-family: ${props => props.theme.typography.fontFamily.primary};
  backdrop-filter: blur(10px);

  @media (max-width: 1200px) {
    padding: 0.5rem 1.5rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: auto auto;
    padding: 0.5rem 1rem;
  }

  @media (max-width: 480px) {
    height: 60px;
    padding: 0.5rem 0.75rem;
  }

  @media (min-width: 2560px) {
    height: 80px;
    padding: 0.5rem 3rem;
  }
`;

// Logo container with animation
const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  transition: transform 0.3s ease;
  font-family: ${props => props.theme.typography.fontFamily.primary};

  &:hover {
    transform: scale(1.05);
  }
  
  img {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    border: 2px solid ${colors.primary};
    transition: all 0.3s ease;
    background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
    padding: 2px;
    
    &:hover {
      border-color: ${colors.primaryLight};
      box-shadow: 0 0 20px ${colors.primaryGlow};
      transform: rotate(5deg);
    }
  }

  @media (min-width: 2560px) {
    img {
      width: 60px;
      height: 60px;
    }
  }

  @media (max-width: 480px) {
    img {
      width: 40px;
      height: 40px;
    }
  }
`;

// Navigation links with CSS grid for desktop
const NavLinks = styled.nav`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, max-content));
  gap: 0.5rem;
  justify-content: center;
  margin: 0 1rem;
  font-family: ${props => props.theme.typography.fontFamily.primary};

  @media (max-width: 768px) {
    display: none;
  }
`;

// Individual nav link with fancy hover effect
const NavLink = styled(Link)`
  position: relative;
  color: ${colors.white};
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
  border-radius: 6px;
  overflow: hidden;
  font-family: ${props => props.theme.typography.fontFamily.primary};
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight});
    transition: all 0.3s ease;
    transform: translateX(-50%);
    box-shadow: 0 0 10px ${colors.primaryGlow};
  }
  
  &:hover {
    color: ${colors.primary};
    text-shadow: 0 0 8px ${colors.textGlow};
    background: rgba(20, 184, 166, 0.05);
    
    &::before {
      width: 100%;
    }
  }
  
  &.active {
    color: ${colors.primary};
    background: rgba(20, 184, 166, 0.1);
    text-shadow: 0 0 8px ${colors.textGlow};
    
    &::before {
      width: 100%;
    }
  }

  /* Appear animation for each link with delay based on position */
  animation: ${slideIn} 0.3s ease-out forwards;
  animation-delay: calc(0.05s * var(--index, 0));
`;

// Hamburger menu icon with animation
const HamburgerMenu = styled.button`
  display: none;
  background: none;
  border: none;
  width: 35px;
  height: 30px;
  position: relative;
  cursor: pointer;
  z-index: 1000;
  
  span {
    display: block;
    position: absolute;
    height: 3px;
    width: 100%;
    background: ${colors.primary};
    border-radius: 3px;
    opacity: 1;
    left: 0;
    transform: rotate(0deg);
    transition: 0.25s ease-in-out;
    box-shadow: 0 0 8px ${colors.primaryGlow};
    
    &:nth-child(1) {
      top: 0px;
    }
    
    &:nth-child(2), &:nth-child(3) {
      top: 10px;
    }
    
    &:nth-child(4) {
      top: 20px;
    }
  }
  
  ${props => props.$isOpen && css`
    span:nth-child(1) {
      top: 10px;
      width: 0%;
      left: 50%;
    }
    
    span:nth-child(2) {
      transform: rotate(45deg);
    }
    
    span:nth-child(3) {
      transform: rotate(-45deg);
    }
    
    span:nth-child(4) {
      top: 10px;
      width: 0%;
      left: 50%;
    }
  `}
  
  @media (max-width: 768px) {
    display: block;
    justify-self: end;
  }
`;

// Mobile menu with animation
const MobileMenu = styled.div`
  display: none;
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.95);
  z-index: 998;
  overflow-y: auto;
  flex-direction: column;
  padding: 1rem;
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
  font-family: ${props => props.theme.typography.fontFamily.primary};

  ${props => props.$isOpen && css`
    transform: translateX(0);
  `}

  @media (max-width: 768px) {
    display: flex;
    height: calc(100vh - 70px);
  }

  @media (max-width: 480px) {
    top: 60px;
    height: calc(100vh - 60px);
  }
`;

// Mobile nav links with animation
const MobileNavLink = styled(Link)`
  color: ${colors.white};
  text-decoration: none;
  padding: 1rem;
  margin: 0.5rem 0;
  font-size: 1.1rem;
  border-left: 3px solid transparent;
  transition: all 0.3s ease;
  animation: ${slideIn} 0.3s ease-out forwards;
  animation-delay: calc(0.05s * var(--index, 0));
  font-family: ${props => props.theme.typography.fontFamily.primary};
  border-radius: 0 8px 8px 0;
  
  &:hover, &.active {
    color: ${colors.primary};
    border-left: 3px solid ${colors.primary};
    background: linear-gradient(90deg, rgba(20, 184, 166, 0.1), transparent);
    padding-left: 1.5rem;
    text-shadow: 0 0 8px ${colors.textGlow};
    box-shadow: inset 0 0 20px rgba(20, 184, 166, 0.05);
  }
  
  &:active {
    background: linear-gradient(90deg, rgba(20, 184, 166, 0.2), transparent);
  }
`;

// Auth buttons container
const AuthButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-self: end;
  gap: 1rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

// Settings button for font selector
const SettingsButton = styled.button`
  background: none;
  border: 2px solid ${colors.primary};
  border-radius: 8px;
  color: ${colors.primary};
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  position: relative;
  font-family: ${props => props.theme.typography.fontFamily.primary};
  
  &:hover {
    background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
    color: ${colors.white};
    transform: rotate(90deg) scale(1.1);
    box-shadow: 0 0 20px ${colors.primaryGlow};
    border-color: ${colors.primaryLight};
  }
  
  &:active {
    transform: rotate(90deg) scale(0.95);
  }
`;

// Font selector popover
const FontSelectorPopover = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  z-index: ${props => props.theme?.zIndex?.popover || 1060};
  display: ${props => props.$isOpen ? 'block' : 'none'};
  animation: ${props => props.$isOpen ? 'fadeInDown' : 'none'} 0.2s ease-out;

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// User info display
const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-right: 1rem;
  animation: ${fadeIn} 0.5s ease-in-out;
  font-family: ${props => props.theme.typography.fontFamily.primary};
  
  .user-name {
    margin-right: 0.75rem;
    font-weight: 600;
    color: ${colors.white};
    text-shadow: 0 0 6px ${colors.textGlow};
  }
  
  .user-role {
    font-size: 0.8rem;
    background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%);
    background-size: 200% 100%;
    animation: ${shimmer} 3s infinite linear;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    color: ${colors.white};
    font-weight: 600;
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.3),
      0 0 15px ${colors.primaryGlow};
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

// Login/Logout button
const AuthButton = styled(Link)`
  display: inline-block;
  background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%);
  color: ${colors.white};
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.25rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 0 15px ${colors.primaryGlow};
  font-family: ${props => props.theme.typography.fontFamily.primary};
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 4px 15px rgba(0, 0, 0, 0.4),
      0 0 25px ${colors.primaryGlow};
    background: linear-gradient(135deg, ${colors.primaryLight} 0%, ${colors.primary} 100%);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.3),
      0 0 15px ${colors.primaryGlow};
  }
`;

// Logout button as a standard button
const LogoutButton = styled.button`
  display: inline-block;
  background: transparent;
  color: ${colors.primary};
  border: 2px solid ${colors.primary};
  border-radius: 8px;
  padding: 0.45rem 1.25rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: ${props => props.theme.typography.fontFamily.primary};
  text-shadow: 0 0 6px ${colors.textGlow};
  
  &:hover {
    background: linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight});
    color: ${colors.white};
    box-shadow: 0 0 20px ${colors.primaryGlow};
    transform: translateY(-1px);
    text-shadow: none;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

// Dropdown menu container
const NavDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button`
  color: ${colors.white};
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
  border-radius: 6px;
  overflow: hidden;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-family: ${props => props.theme.typography.fontFamily.primary};
  
  &:hover {
    color: ${colors.primary};
    text-shadow: 0 0 8px ${colors.textGlow};
    background: rgba(20, 184, 166, 0.05);
  }
  
  &::after {
    content: '▼';
    font-size: 0.7em;
    margin-left: 0.5rem;
    transition: transform 0.3s ease;
    color: ${colors.primary};
  }
  
  ${props => props.$isOpen && css`
    color: ${colors.primary};
    text-shadow: 0 0 8px ${colors.textGlow};
    background: rgba(20, 184, 166, 0.1);
    
    &::after {
      transform: rotate(180deg);
    }
  `}
`;

const DropdownContent = styled.div`
  display: ${props => (props.$isOpen ? 'block' : 'none')};
  position: absolute;
  background: linear-gradient(135deg, ${colors.black} 0%, ${colors.gray900} 100%);
  min-width: 180px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 20px ${colors.primaryGlow};
  z-index: 1;
  border-radius: 8px;
  border: 1px solid ${colors.primary};
  animation: ${fadeIn} 0.2s ease-in-out;
  font-family: ${props => props.theme.typography.fontFamily.primary};
  backdrop-filter: blur(10px);
  
  a {
    color: ${colors.white};
    padding: 0.75rem 1rem;
    text-decoration: none;
    display: block;
    transition: all 0.3s ease;
    border-radius: 6px;
    margin: 0.25rem;
    
    &:hover {
      background: linear-gradient(90deg, rgba(20, 184, 166, 0.1), rgba(20, 184, 166, 0.05));
      color: ${colors.primary};
      text-shadow: 0 0 8px ${colors.textGlow};
      box-shadow: inset 0 0 20px rgba(20, 184, 166, 0.05);
    }
  }
`;

// Main Header component
const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isFontSelectorOpen, setIsFontSelectorOpen] = useState(false);
  const { user, logout, isAdmin, isManager, isGuard, isClient } = useAuth();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
      setIsFontSelectorOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
  };

  const toggleDropdown = (e, dropdown) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const toggleFontSelector = (e) => {
    e.stopPropagation();
    setIsFontSelectorOpen(!isFontSelectorOpen);
    // Close other dropdowns when opening font selector
    setActiveDropdown(null);
  };

  // Format role for display
  const formatRole = (role) => {
    if (!role) return '';
    
    if (role.startsWith('admin_')) {
      return role.replace('admin_', 'Admin (').concat(')');
    }
    
    if (role === 'super_admin') return 'Administrator';
    
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Show all links in development mode if protection is disabled
  const shouldShowLink = (key) => {
    if (!config.useProtectedRoutes) return true;
    
    switch(key) {
      // Always visible links (no authentication required)
      case 'home':
      case 'objectDetection':
        return true;
      
      // Admin-only links
      case 'adminDashboard':
      case 'userManagement':
      case 'systemSettings':
        return isAdmin();
      
      // Manager/Admin links
      case 'reports':
      case 'schedule':
        return isManager() || isAdmin();
      
      // Client links
      case 'propertyInfo':
      case 'clientReports':
        return isClient() || isManager() || isAdmin();
      
      // Guard links
      case 'timeClockPage':
      case 'patrols':
      case 'dailyReports':
      case 'dispatch':
        return isGuard() || isManager() || isAdmin();
      
      // General authenticated links
      case 'dashboard':
        return !!user;
      case 'propertySearch':
        return isManager() || isAdmin() || isGuard();
      case 'payroll':
        return isManager() || isAdmin();
      case 'communication':
        return !!user;
      
      default:
        return false;
    }
  };

  // Check if route is active
  const isRouteActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Group links for dropdowns
  const adminLinks = [
    { path: '/admin-dashboard', label: 'Admin Dashboard', key: 'adminDashboard' },
    { path: '/admin/user-management', label: 'User Management', key: 'userManagement' },
    { path: '/admin/system-settings', label: 'System Settings', key: 'systemSettings' }
  ];

  const operationsLinks = [
    { path: '/schedule', label: 'Schedule', key: 'schedule' },
    { path: '/dispatch', label: 'Dispatch', key: 'dispatch' },
    { path: '/time-clock', label: 'Time Clock', key: 'timeClockPage' },
    { path: '/patrols', label: 'Patrols', key: 'patrols' }
  ];

  const reportLinks = [
    { path: '/reports', label: 'Reports', key: 'reports' },
    { path: '/daily-reports', label: 'Daily Reports', key: 'dailyReports' },
    { path: '/client-reports', label: 'Property Reports', key: 'clientReports' }
  ];
  
  const propertyLinks = [
    { path: '/property-info', label: 'My Properties', key: 'propertyInfo' },
    { path: '/property-search', label: 'Property Search', key: 'propertySearch' }
  ];
  
  // Check if any links in a group should be shown
  const shouldShowGroup = (links) => {
    return links.some(link => shouldShowLink(link.key));
  };

  return (
    <HeaderContainer>
      <LogoContainer>
        <Link to="/">
          <img src={Logo} alt="Defense Security" />
        </Link>
      </LogoContainer>
      
      <NavLinks>
        {/* Standard Nav Links */}
        <NavLink to="/" className={location.pathname === '/' ? 'active' : ''} style={{ '--index': 0 }}>
          Home
        </NavLink>
        
        <NavLink 
          to="/live-monitoring" 
          className={location.pathname === '/live-monitoring' ? 'active' : ''} 
          style={{ '--index': 1 }}
        >
          Live Monitoring
        </NavLink>
        
        <NavLink 
          to="/guard-operations" 
          className={location.pathname === '/guard-operations' ? 'active' : ''} 
          style={{ '--index': 2 }}
        >
          Guard Ops
        </NavLink>
        
        <NavLink 
          to="/reports/new" 
          className={location.pathname.startsWith('/reports') ? 'active' : ''} 
          style={{ '--index': 3 }}
        >
          Reports
        </NavLink>
        
        <NavLink 
          to="/face-management" 
          className={location.pathname === '/face-management' ? 'active' : ''} 
          style={{ '--index': 4 }}
        >
          🧠 Face Recognition
        </NavLink>
        
        {/* Admin Dropdown */}
        <NavDropdown>
          <DropdownButton 
            $isOpen={activeDropdown === 'admin'} 
            onClick={(e) => toggleDropdown(e, 'admin')}
          >
            Admin
          </DropdownButton>
          <DropdownContent $isOpen={activeDropdown === 'admin'}>
            <Link 
              to="/admin"
              onClick={() => setActiveDropdown(null)}
            >
              Admin Dashboard
            </Link>
            <Link 
              to="/guard-mobile"
              onClick={() => setActiveDropdown(null)}
            >
              Guard Mobile
            </Link>
            <Link 
              to="/ai-console"
              onClick={() => setActiveDropdown(null)}
            >
              AI Console
            </Link>
            <Link 
              to="/visual-alerts"
              onClick={() => setActiveDropdown(null)}
            >
              Visual Alerts Demo
            </Link>
            <Link 
              to="/dispatcher"
              onClick={() => setActiveDropdown(null)}
            >
              Camera Dispatcher
            </Link>
          </DropdownContent>
        </NavDropdown>
        

      </NavLinks>
      
      {/* Hamburger Menu */}
      <HamburgerMenu $isOpen={isMobileMenuOpen} onClick={toggleMobileMenu}>
        <span />
        <span />
        <span />
        <span />
      </HamburgerMenu>
      
      {/* Mobile Menu */}
      <MobileMenu $isOpen={isMobileMenuOpen}>
        <MobileNavLink to="/" style={{ '--index': 0 }}>Home</MobileNavLink>
        <MobileNavLink to="/live-monitoring" style={{ '--index': 1 }}>Live Monitoring</MobileNavLink>
        <MobileNavLink to="/guard-operations" style={{ '--index': 2 }}>Guard Operations</MobileNavLink>
        <MobileNavLink to="/reports/new" style={{ '--index': 3 }}>Reports</MobileNavLink>
        <MobileNavLink to="/face-management" style={{ '--index': 4 }}>🧠 Face Recognition</MobileNavLink>
        
        {/* Admin Section */}
        <div style={{ 
          padding: '1rem', 
          borderBottom: `1px solid ${colors.primary}`,
          color: colors.primary,
          marginTop: '1rem',
          textShadow: `0 0 8px ${colors.textGlow}`,
          fontWeight: '600'
        }}>
          Admin
        </div>
        <MobileNavLink to="/admin" style={{ '--index': 4 }}>Admin Dashboard</MobileNavLink>
        <MobileNavLink to="/guard-mobile" style={{ '--index': 5 }}>Guard Mobile</MobileNavLink>
        <MobileNavLink to="/ai-console" style={{ '--index': 6 }}>AI Console</MobileNavLink>
        <MobileNavLink to="/visual-alerts" style={{ '--index': 7 }}>Visual Alerts Demo</MobileNavLink>
        <MobileNavLink to="/dispatcher" style={{ '--index': 8 }}>Camera Dispatcher</MobileNavLink>
        
        {/* Auth Links for Mobile */}
        <div style={{ 
          marginTop: 'auto', 
          borderTop: `1px solid ${colors.primary}`, 
          paddingTop: '1rem',
          display: 'flex',
          justifyContent: 'center'
        }}>
          {user ? (
            <>
              <div style={{ 
                padding: '0.5rem 1rem', 
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(20, 184, 166, 0.05))',
                border: `1px solid ${colors.primary}`,
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                backdropFilter: 'blur(10px)'
              }}>
                <span style={{ color: colors.white, marginBottom: '0.5rem' }}>
                  {user.first_name || user.username}
                </span>
                <span style={{ 
                  fontSize: '0.8rem',
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                  color: colors.white,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  boxShadow: `0 0 15px ${colors.primaryGlow}`,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {formatRole(user.role)}
                </span>
              </div>
              <button 
                style={{ 
                  background: 'transparent',
                  border: `2px solid ${colors.primary}`,
                  borderRadius: '8px',
                  color: colors.primary,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 'bold',
                  marginTop: '1rem',
                  cursor: 'pointer',
                  width: '100%',
                  textShadow: `0 0 8px ${colors.textGlow}`,
                  transition: 'all 0.3s ease'
                }} 
                onClick={() => { 
                  handleLogout(); 
                  setIsMobileMenuOpen(false); 
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                color: colors.white,
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 'bold',
                textDecoration: 'none',
                width: '100%',
                textAlign: 'center',
                boxShadow: `0 0 20px ${colors.primaryGlow}`,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      </MobileMenu>
      
      {/* Auth buttons for desktop view */}
      <AuthButtonsContainer>
        {/* Font Selector Settings */}
        <div style={{ position: 'relative' }}>
          <SettingsButton
            onClick={toggleFontSelector}
            title="Font Settings"
            type="button"
          >
            ⚙️
          </SettingsButton>
          <FontSelectorPopover $isOpen={isFontSelectorOpen}>
            <FontSelector
              onFontChange={() => {
                // Optional: Close popover after font change
                setTimeout(() => setIsFontSelectorOpen(false), 500);
              }}
            />
          </FontSelectorPopover>
        </div>

        {user ? (
          <>
            <UserInfo>
              <span className="user-name">{user.first_name || user.username}</span>
              <span className="user-role">{formatRole(user.role)}</span>
            </UserInfo>
            <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
          </>
        ) : (
          <AuthButton to="/login">Login</AuthButton>
        )}
      </AuthButtonsContainer>
    </HeaderContainer>
  );
};

export default Header;