import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/Logo.png';
import config from '../../../config';

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: radial-gradient(circle, rgba(50, 50, 50, 1) 0%, rgba(25, 25, 25, 1) 100%);
  padding: 0 20px;
  height: 60px;
  color: #fff;
  width: 100%;
  position: fixed;
  top: 0;
  z-index: 999;

  @media (max-width: 600px) {
    padding: 0 10px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  img {
    width: 50px;
    height: 50px;
  }
`;

const NavLinks = styled.nav`
  display: flex;
  align-items: center;

  a {
    color: #fff;
    text-decoration: none;
    margin: 0 15px;
    transition: color 0.3s ease;

    &:hover {
      color: #00b6ff;
    }
  }

  @media (max-width: 600px) {
    display: none;
  }
`;

const HamburgerMenu = styled.div`
  display: none;
  width: 30px;
  height: 25px;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;

  div {
    height: 3px;
    background-color: #fff;
  }

  @media (max-width: 600px) {
    display: flex;
  }
`;

const MobileMenu = styled.div`
  display: none;
  position: fixed;
  background-color: #1a1a1a;
  top: 60px;
  left: 0;
  right: 0;
  padding: 20px;
  flex-direction: column;
  align-items: flex-start;

  a {
    color: #fff;
    margin-bottom: 15px;
    width: 100%;
    text-align: left;
  }

  @media (max-width: 600px) {
    display: flex;
  }
`;

const AuthButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  
  a, button {
    color: #fff;
    background: none;
    border: 1px solid #00b6ff;
    border-radius: 4px;
    padding: 6px 12px;
    margin-left: 15px;
    cursor: pointer;
    text-decoration: none;
    font-size: 14px;
    transition: all 0.3s ease;
    
    &:hover {
      background-color: #00b6ff;
      color: #1a1a1a;
    }
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  margin-left: 15px;
  
  .user-name {
    margin-right: 10px;
    font-weight: 500;
  }
  
  .user-role {
    font-size: 12px;
    background-color: #00b6ff;
    padding: 2px 6px;
    border-radius: 4px;
    color: #1a1a1a;
  }
`;

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isAdmin, isManager, isGuard, isClient } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    // Optionally redirect to home or login page
  };

  // Format role for display
  const formatRole = (role) => {
    if (!role) return '';
    
    if (role.startsWith('admin_')) {
      return role.replace('admin_', 'Admin (').concat(')');
    }
    
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Map for which links should be visible to which roles
  const linkVisibility = {
    // Always visible links (no authentication required)
    home: () => true,
    objectDetection: () => true,
    
    // Admin-only links
    adminDashboard: () => isAdmin(),
    userManagement: () => isAdmin(),
    systemSettings: () => isAdmin(),
    
    // Manager/Admin links
    reports: () => isManager() || isAdmin(),
    schedule: () => isManager() || isAdmin() || isGuard(),
    
    // Client links
    propertyInfo: () => isClient() || isManager() || isAdmin(),
    clientReports: () => isClient() || isManager() || isAdmin(),
    
    // Guard links
    timeClockPage: () => isGuard() || isManager() || isAdmin(),
    patrols: () => isGuard() || isManager() || isAdmin(),
    dailyReports: () => isGuard() || isManager() || isAdmin(),
    dispatch: () => isGuard() || isManager() || isAdmin(),
    
    // General authenticated links
    dashboard: () => !!user,
    propertySearch: () => isManager() || isAdmin() || isGuard(),
    payroll: () => isManager() || isAdmin(),
    communication: () => !!user
  };

  // Show all links in development mode if protection is disabled
  const shouldShowLink = (linkKey) => {
    if (!config.useProtectedRoutes) return true;
    return linkVisibility[linkKey]();
  };

  return (
    <HeaderContainer>
      <LogoContainer>
        <Link to="/">
          <img src={Logo} alt="Defense Security" />
        </Link>
      </LogoContainer>
      
      <HamburgerMenu onClick={toggleMobileMenu}>
        <div />
        <div />
        <div />
      </HamburgerMenu>
      
      <NavLinks>
        {/* Always visible */}
        <Link to="/">Home</Link>
        <Link to="/object-detection">Object Detection</Link>
        
        {/* Authenticated routes */}
        {shouldShowLink('dashboard') && <Link to="/dashboard">Dashboard</Link>}
        
        {/* Admin routes */}
        {shouldShowLink('adminDashboard') && <Link to="/admin-dashboard">Admin Dashboard</Link>}
        {shouldShowLink('userManagement') && <Link to="/admin/user-management">User Management</Link>}
        {shouldShowLink('systemSettings') && <Link to="/admin/system-settings">System Settings</Link>}
        
        {/* Manager/Admin routes */}
        {shouldShowLink('schedule') && <Link to="/schedule">Schedule</Link>}
        {shouldShowLink('reports') && <Link to="/reports">Reports</Link>}
        {shouldShowLink('payroll') && <Link to="/payroll">Payroll</Link>}
        
        {/* Guard routes */}
        {shouldShowLink('timeClockPage') && <Link to="/time-clock">Time Clock</Link>}
        {shouldShowLink('patrols') && <Link to="/patrols">Patrols</Link>}
        {shouldShowLink('dailyReports') && <Link to="/daily-reports">Daily Reports</Link>}
        {shouldShowLink('dispatch') && <Link to="/dispatch">Dispatch</Link>}
        
        {/* Client routes */}
        {shouldShowLink('propertyInfo') && <Link to="/property-info">My Properties</Link>}
        {shouldShowLink('clientReports') && <Link to="/client-reports">Property Reports</Link>}
        
        {/* General routes */}
        {shouldShowLink('propertySearch') && <Link to="/property-search">Property Search</Link>}
        {shouldShowLink('communication') && <Link to="/communication">Communication</Link>}
      </NavLinks>
      
      {isMobileMenuOpen && (
        <MobileMenu>
          {/* Always visible */}
          <Link to="/" onClick={toggleMobileMenu}>Home</Link>
          <Link to="/object-detection" onClick={toggleMobileMenu}>Object Detection</Link>
          
          {/* Authenticated routes */}
          {shouldShowLink('dashboard') && <Link to="/dashboard" onClick={toggleMobileMenu}>Dashboard</Link>}
          
          {/* Admin routes */}
          {shouldShowLink('adminDashboard') && <Link to="/admin-dashboard" onClick={toggleMobileMenu}>Admin Dashboard</Link>}
          {shouldShowLink('userManagement') && <Link to="/admin/user-management" onClick={toggleMobileMenu}>User Management</Link>}
          {shouldShowLink('systemSettings') && <Link to="/admin/system-settings" onClick={toggleMobileMenu}>System Settings</Link>}
          
          {/* Manager/Admin routes */}
          {shouldShowLink('schedule') && <Link to="/schedule" onClick={toggleMobileMenu}>Schedule</Link>}
          {shouldShowLink('reports') && <Link to="/reports" onClick={toggleMobileMenu}>Reports</Link>}
          {shouldShowLink('payroll') && <Link to="/payroll" onClick={toggleMobileMenu}>Payroll</Link>}
          
          {/* Guard routes */}
          {shouldShowLink('timeClockPage') && <Link to="/time-clock" onClick={toggleMobileMenu}>Time Clock</Link>}
          {shouldShowLink('patrols') && <Link to="/patrols" onClick={toggleMobileMenu}>Patrols</Link>}
          {shouldShowLink('dailyReports') && <Link to="/daily-reports" onClick={toggleMobileMenu}>Daily Reports</Link>}
          {shouldShowLink('dispatch') && <Link to="/dispatch" onClick={toggleMobileMenu}>Dispatch</Link>}
          
          {/* Client routes */}
          {shouldShowLink('propertyInfo') && <Link to="/property-info" onClick={toggleMobileMenu}>My Properties</Link>}
          {shouldShowLink('clientReports') && <Link to="/client-reports" onClick={toggleMobileMenu}>Property Reports</Link>}
          
          {/* General routes */}
          {shouldShowLink('propertySearch') && <Link to="/property-search" onClick={toggleMobileMenu}>Property Search</Link>}
          {shouldShowLink('communication') && <Link to="/communication" onClick={toggleMobileMenu}>Communication</Link>}
          
          {/* Auth links */}
          {user ? (
            <Link to="#" onClick={() => { handleLogout(); toggleMobileMenu(); }}>Logout</Link>
          ) : (
            <Link to="/login" onClick={toggleMobileMenu}>Login</Link>
          )}
        </MobileMenu>
      )}
      
      {/* Auth buttons for desktop view */}
      <AuthButtonsContainer>
        {user ? (
          <>
            <UserInfo>
              <span className="user-name">{user.first_name || user.username}</span>
              <span className="user-role">{formatRole(user.role)}</span>
            </UserInfo>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </AuthButtonsContainer>
    </HeaderContainer>
  );
};

export default Header;