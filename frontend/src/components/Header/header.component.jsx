// File: frontend/src/components/Header/header.component.jsx

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/Logo.png';
import config from '../../../config';

// Color palette
const colors = {
  gold: '#D4AF37', // Primary color
  lightGold: '#F4D160', // Lighter gold for hover effects
  black: '#000000', // Secondary color
  darkBlack: '#0A0A0A', // Slightly lighter black for contrast
  silver: '#C0C0C0', // Tertiary color
  lightSilver: '#E8E8E8', // Lighter silver for hover effects
  white: '#FFFFFF', // For text and contrast
  transparent: 'rgba(0, 0, 0, 0)' // For animations
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
  background: linear-gradient(to right, ${colors.black}, ${colors.darkBlack});
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  padding: 0.5rem 2rem;
  height: 70px;
  width: 100%;
  position: fixed;
  top: 0;
  z-index: 999;
  animation: ${fadeIn} 0.5s ease-in-out;

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

  &:hover {
    transform: scale(1.05);
  }
  
  img {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    border: 2px solid ${colors.gold};
    transition: all 0.3s ease;
    
    &:hover {
      border-color: ${colors.lightGold};
      box-shadow: 0 0 15px ${colors.gold};
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
  border-radius: 4px;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background-color: ${colors.gold};
    transition: all 0.3s ease;
    transform: translateX(-50%);
  }
  
  &:hover {
    color: ${colors.gold};
    
    &::before {
      width: 100%;
    }
  }
  
  &.active {
    color: ${colors.gold};
    background-color: rgba(212, 175, 55, 0.1);
    
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
    background: ${colors.gold};
    border-radius: 3px;
    opacity: 1;
    left: 0;
    transform: rotate(0deg);
    transition: 0.25s ease-in-out;
    
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
  
  &:hover, &.active {
    color: ${colors.gold};
    border-left: 3px solid ${colors.gold};
    background-color: rgba(212, 175, 55, 0.1);
    padding-left: 1.5rem;
  }
  
  &:active {
    background-color: rgba(212, 175, 55, 0.2);
  }
`;

// Auth buttons container
const AuthButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-self: end;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

// User info display
const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-right: 1rem;
  animation: ${fadeIn} 0.5s ease-in-out;
  
  .user-name {
    margin-right: 0.75rem;
    font-weight: 600;
    color: ${colors.white};
  }
  
  .user-role {
    font-size: 0.8rem;
    background: linear-gradient(135deg, ${colors.gold} 0%, ${colors.lightGold} 100%);
    background-size: 200% 100%;
    animation: ${shimmer} 2s infinite linear;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    color: ${colors.black};
    font-weight: 600;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
`;

// Login/Logout button
const AuthButton = styled(Link)`
  display: inline-block;
  background: linear-gradient(135deg, ${colors.gold} 0%, ${colors.lightGold} 100%);
  color: ${colors.black};
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1.25rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    background: linear-gradient(135deg, ${colors.lightGold} 0%, ${colors.gold} 100%);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.2);
  }
`;

// Logout button as a standard button
const LogoutButton = styled.button`
  display: inline-block;
  background: transparent;
  color: ${colors.gold};
  border: 2px solid ${colors.gold};
  border-radius: 4px;
  padding: 0.45rem 1.25rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${colors.gold};
    color: ${colors.black};
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
  border-radius: 4px;
  overflow: hidden;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    color: ${colors.gold};
  }
  
  &::after {
    content: '▼';
    font-size: 0.7em;
    margin-left: 0.5rem;
    transition: transform 0.3s ease;
  }
  
  ${props => props.$isOpen && css`
    color: ${colors.gold};
    
    &::after {
      transform: rotate(180deg);
    }
  `}
`;

const DropdownContent = styled.div`
  display: ${props => (props.$isOpen ? 'block' : 'none')};
  position: absolute;
  background-color: ${colors.black};
  min-width: 160px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 1;
  border-radius: 4px;
  border: 1px solid ${colors.gold};
  animation: ${fadeIn} 0.2s ease-in-out;
  
  a {
    color: ${colors.white};
    padding: 0.75rem 1rem;
    text-decoration: none;
    display: block;
    transition: all 0.2s ease;
    
    &:hover {
      background-color: rgba(212, 175, 55, 0.1);
      color: ${colors.gold};
    }
  }
`;

// Main Header component
const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
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
        
        {shouldShowLink('dashboard') && (
          <NavLink 
            to="/dashboard" 
            className={location.pathname === '/dashboard' ? 'active' : ''} 
            style={{ '--index': 1 }}
          >
            Dashboard
          </NavLink>
        )}
        
        <NavLink 
          to="/object-detection" 
          className={location.pathname === '/object-detection' ? 'active' : ''} 
          style={{ '--index': 2 }}
        >
          Detection
        </NavLink>
        
        {/* Admin Dropdown */}
        {shouldShowGroup(adminLinks) && (
          <NavDropdown>
            <DropdownButton 
              $isOpen={activeDropdown === 'admin'} 
              onClick={(e) => toggleDropdown(e, 'admin')}
            >
              Admin
            </DropdownButton>
            <DropdownContent $isOpen={activeDropdown === 'admin'}>
              {adminLinks.map((link) => (
                shouldShowLink(link.key) && (
                  <Link 
                    key={link.path} 
                    to={link.path}
                    onClick={() => setActiveDropdown(null)}
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </DropdownContent>
          </NavDropdown>
        )}
        
        {/* Operations Dropdown */}
        {shouldShowGroup(operationsLinks) && (
          <NavDropdown>
            <DropdownButton 
              $isOpen={activeDropdown === 'operations'} 
              onClick={(e) => toggleDropdown(e, 'operations')}
            >
              Operations
            </DropdownButton>
            <DropdownContent $isOpen={activeDropdown === 'operations'}>
              {operationsLinks.map((link) => (
                shouldShowLink(link.key) && (
                  <Link 
                    key={link.path} 
                    to={link.path}
                    onClick={() => setActiveDropdown(null)}
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </DropdownContent>
          </NavDropdown>
        )}
        
        {/* Reports Dropdown */}
        {shouldShowGroup(reportLinks) && (
          <NavDropdown>
            <DropdownButton 
              $isOpen={activeDropdown === 'reports'} 
              onClick={(e) => toggleDropdown(e, 'reports')}
            >
              Reports
            </DropdownButton>
            <DropdownContent $isOpen={activeDropdown === 'reports'}>
              {reportLinks.map((link) => (
                shouldShowLink(link.key) && (
                  <Link 
                    key={link.path} 
                    to={link.path}
                    onClick={() => setActiveDropdown(null)}
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </DropdownContent>
          </NavDropdown>
        )}
        
        {/* Properties Dropdown */}
        {shouldShowGroup(propertyLinks) && (
          <NavDropdown>
            <DropdownButton 
              $isOpen={activeDropdown === 'properties'} 
              onClick={(e) => toggleDropdown(e, 'properties')}
            >
              Properties
            </DropdownButton>
            <DropdownContent $isOpen={activeDropdown === 'properties'}>
              {propertyLinks.map((link) => (
                shouldShowLink(link.key) && (
                  <Link 
                    key={link.path} 
                    to={link.path}
                    onClick={() => setActiveDropdown(null)}
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </DropdownContent>
          </NavDropdown>
        )}
        
        {/* Standalone Links */}
        {shouldShowLink('payroll') && (
          <NavLink 
            to="/payroll" 
            className={location.pathname === '/payroll' ? 'active' : ''} 
            style={{ '--index': 7 }}
          >
            Payroll
          </NavLink>
        )}
        
        {shouldShowLink('communication') && (
          <NavLink 
            to="/communication" 
            className={location.pathname === '/communication' ? 'active' : ''} 
            style={{ '--index': 8 }}
          >
            Messages
          </NavLink>
        )}
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
        
        {shouldShowLink('dashboard') && (
          <MobileNavLink to="/dashboard" style={{ '--index': 1 }}>Dashboard</MobileNavLink>
        )}
        
        <MobileNavLink to="/object-detection" style={{ '--index': 2 }}>Object Detection</MobileNavLink>
        
        {/* Admin Section */}
        {shouldShowGroup(adminLinks) && (
          <>
            <div style={{ 
              padding: '1rem', 
              borderBottom: `1px solid ${colors.gold}`, 
              color: colors.gold,
              marginTop: '1rem'
            }}>
              Admin
            </div>
            {adminLinks.map((link, index) => (
              shouldShowLink(link.key) && (
                <MobileNavLink 
                  key={link.path} 
                  to={link.path} 
                  style={{ '--index': index + 3 }}
                >
                  {link.label}
                </MobileNavLink>
              )
            ))}
          </>
        )}
        
        {/* Operations Section */}
        {shouldShowGroup(operationsLinks) && (
          <>
            <div style={{ 
              padding: '1rem', 
              borderBottom: `1px solid ${colors.gold}`, 
              color: colors.gold,
              marginTop: '1rem'
            }}>
              Operations
            </div>
            {operationsLinks.map((link, index) => (
              shouldShowLink(link.key) && (
                <MobileNavLink 
                  key={link.path} 
                  to={link.path} 
                  style={{ '--index': index + 6 }}
                >
                  {link.label}
                </MobileNavLink>
              )
            ))}
          </>
        )}
        
        {/* Reports Section */}
        {shouldShowGroup(reportLinks) && (
          <>
            <div style={{ 
              padding: '1rem', 
              borderBottom: `1px solid ${colors.gold}`, 
              color: colors.gold,
              marginTop: '1rem'
            }}>
              Reports
            </div>
            {reportLinks.map((link, index) => (
              shouldShowLink(link.key) && (
                <MobileNavLink 
                  key={link.path} 
                  to={link.path} 
                  style={{ '--index': index + 10 }}
                >
                  {link.label}
                </MobileNavLink>
              )
            ))}
          </>
        )}
        
        {/* Properties Section */}
        {shouldShowGroup(propertyLinks) && (
          <>
            <div style={{ 
              padding: '1rem', 
              borderBottom: `1px solid ${colors.gold}`, 
              color: colors.gold,
              marginTop: '1rem'
            }}>
              Properties
            </div>
            {propertyLinks.map((link, index) => (
              shouldShowLink(link.key) && (
                <MobileNavLink 
                  key={link.path} 
                  to={link.path} 
                  style={{ '--index': index + 13 }}
                >
                  {link.label}
                </MobileNavLink>
              )
            ))}
          </>
        )}
        
        {/* Additional Links */}
        {shouldShowLink('payroll') && (
          <MobileNavLink to="/payroll" style={{ '--index': 15 }}>Payroll</MobileNavLink>
        )}
        
        {shouldShowLink('communication') && (
          <MobileNavLink to="/communication" style={{ '--index': 16 }}>Messages</MobileNavLink>
        )}
        
        {/* Auth Links for Mobile */}
        <div style={{ 
          marginTop: 'auto', 
          borderTop: `1px solid ${colors.gold}`, 
          paddingTop: '1rem',
          display: 'flex',
          justifyContent: 'center'
        }}>
          {user ? (
            <>
              <div style={{ 
                padding: '0.5rem 1rem', 
                borderRadius: '4px',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%'
              }}>
                <span style={{ color: colors.white, marginBottom: '0.5rem' }}>
                  {user.first_name || user.username}
                </span>
                <span style={{ 
                  fontSize: '0.8rem',
                  backgroundColor: colors.gold,
                  color: colors.black,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px'
                }}>
                  {formatRole(user.role)}
                </span>
              </div>
              <button 
                style={{ 
                  backgroundColor: 'transparent',
                  border: `2px solid ${colors.gold}`,
                  borderRadius: '4px',
                  color: colors.gold,
                  padding: '0.75rem 1.5rem',
                  fontWeight: 'bold',
                  marginTop: '1rem',
                  cursor: 'pointer',
                  width: '100%'
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
                backgroundColor: colors.gold,
                color: colors.black,
                padding: '0.75rem 1.5rem',
                borderRadius: '4px',
                fontWeight: 'bold',
                textDecoration: 'none',
                width: '100%',
                textAlign: 'center'
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