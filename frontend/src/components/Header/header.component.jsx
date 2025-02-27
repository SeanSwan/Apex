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

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth(); // Accessing user from AuthContext

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const rolesInclude = (roles) => {
    return user && roles.includes(user.role);
  };

  return (
    <HeaderContainer>
      <LogoContainer>
        <Link to="/">
          <img src={Logo} alt="Company Logo" />
        </Link>
      </LogoContainer>
      <HamburgerMenu onClick={toggleMobileMenu}>
        <div />
        <div />
        <div />
      </HamburgerMenu>
      <NavLinks>
        <Link to="/">Home</Link>
        <Link to="/object-detection">Object Detection</Link>
        <Link to="/dispatch">Dispatch</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/admin-dashboard">Admin Dashboard</Link>
        <Link to="/property-search">Property Search</Link>
        <Link to="/payroll">Payroll</Link>
        <Link to="/reports">Reports</Link>
        {!config.useProtectedRoutes && <Link to="/schedule">Schedule</Link>}
        {!config.useProtectedRoutes && <Link to="/communication">Communication</Link>}
        {!config.useProtectedRoutes && <Link to="/property-search">Property Search</Link>}
        {/* {!config.useProtectedRoutes && <Link to="/dashboard">Dashboard</Link>} */}
        {/* {!config.useProtectedRoutes && <Link to="/payroll">Payroll</Link>} */}
        {!config.useProtectedRoutes && <Link to="/reports">Reports</Link>}
        {/* {!config.useProtectedRoutes && <Link to="/admin-dashboard">Admin Dashboard</Link>} */}
        {!config.useProtectedRoutes && <Link to="/admin/user-management">User Management</Link>}
        {config.useProtectedRoutes && rolesInclude(['supervisor', 'admin']) && <Link to="/schedule">Schedule</Link>}
        {config.useProtectedRoutes && rolesInclude(['guard', 'supervisor', 'admin']) && <Link to="/communication">Communication</Link>}
        {/* {config.useProtectedRoutes && rolesInclude(['supervisor', 'admin']) && <Link to="/property-search">Property Search</Link>} */}
        {config.useProtectedRoutes && rolesInclude(['guard', 'supervisor', 'admin']) && <Link to="/time-clock">Time Clock</Link>}
        {/* {config.useProtectedRoutes && rolesInclude(['payroll', 'admin']) && <Link to="/payroll">Payroll</Link>} */}
        {/* {config.useProtectedRoutes && rolesInclude(['supervisor', 'admin']) && <Link to="/reports">Reports</Link>} */}
        {config.useProtectedRoutes && rolesInclude(['admin']) && <Link to="/admin-dashboard">Admin Dashboard</Link>}
        {config.useProtectedRoutes && rolesInclude(['admin']) && <Link to="/admin/user-management">User Management</Link>}
      </NavLinks>
      {isMobileMenuOpen && (
        <MobileMenu>
          <Link to="/" onClick={toggleMobileMenu}>Home</Link>
          <Link to="/object-detection" onClick={toggleMobileMenu}>Object Detection</Link>
          {!config.useProtectedRoutes && <Link to="/schedule" onClick={toggleMobileMenu}>Schedule</Link>}
          {!config.useProtectedRoutes && <Link to="/communication" onClick={toggleMobileMenu}>Communication</Link>}
          {!config.useProtectedRoutes && <Link to="/property-search" onClick={toggleMobileMenu}>Property Search</Link>}
          {!config.useProtectedRoutes && <Link to="/time-clock" onClick={toggleMobileMenu}>Time Clock</Link>}
          {!config.useProtectedRoutes && <Link to="/payroll" onClick={toggleMobileMenu}>Payroll</Link>}
          {!config.useProtectedRoutes && <Link to="/reports" onClick={toggleMobileMenu}>Reports</Link>}
          {!config.useProtectedRoutes && <Link to="/admin-dashboard" onClick={toggleMobileMenu}>Admin Dashboard</Link>}
          {!config.useProtectedRoutes && <Link to="/admin/user-management" onClick={toggleMobileMenu}>User Management</Link>}
          {config.useProtectedRoutes && rolesInclude(['supervisor', 'admin']) && <Link to="/schedule" onClick={toggleMobileMenu}>Schedule</Link>}
          {config.useProtectedRoutes && rolesInclude(['guard', 'supervisor', 'admin']) && <Link to="/communication" onClick={toggleMobileMenu}>Communication</Link>}
          {config.useProtectedRoutes && rolesInclude(['supervisor', 'admin']) && <Link to="/property-search" onClick={toggleMobileMenu}>Property Search</Link>}
          {config.useProtectedRoutes && rolesInclude(['guard', 'supervisor', 'admin']) && <Link to="/time-clock" onClick={toggleMobileMenu}>Time Clock</Link>}
          {config.useProtectedRoutes && rolesInclude(['payroll', 'admin']) && <Link to="/payroll" onClick={toggleMobileMenu}>Payroll</Link>}
          {config.useProtectedRoutes && rolesInclude(['supervisor', 'admin']) && <Link to="/reports" onClick={toggleMobileMenu}>Reports</Link>}
          {config.useProtectedRoutes && rolesInclude(['admin']) && <Link to="/admin-dashboard" onClick={toggleMobileMenu}>Admin Dashboard</Link>}
          {config.useProtectedRoutes && rolesInclude(['admin']) && <Link to="/admin/user-management" onClick={toggleMobileMenu}>User Management</Link>}
        </MobileMenu>
      )}
    </HeaderContainer>
  );
};

export default Header;