// File: frontend/src/components/ProtectedRoutes/protected-routes.component.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
// config import might not exist or be needed if always bypassing based on context
// import config from '../../../config';

// Helper function to check roles - ensures consistency
const checkUserRole = (userRole, requiredRoles) => {
  if (!userRole) return false;
  const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const userRolesArray = Array.isArray(userRole) ? userRole : [userRole];

  return rolesToCheck.some(required => {
    // Handle special 'admin' case if needed (matches any admin_* role)
    if (required === 'admin' && userRolesArray.some(ur => ur.startsWith('admin_'))) {
      return true;
    }
    // Direct match
    return userRolesArray.includes(required);
  });
};

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated } = useContext(AuthContext); // Use isAuthenticated flag from context

  // Show loading state while auth context is initializing (even if it's faked)
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {/* Simple loading indicator */}
        <div>Loading Authentication...</div>
        {/* Or use a spinner like before */}
        {/* <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div> */}
      </div>
    );
  }

  // If protection is disabled via config (optional check)
  // if (config && !config.useProtectedRoutes) {
  //   return children;
  // }

  // Use the isAuthenticated flag provided by the (potentially faked) context
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login.');
    // In the refactored App.jsx, /login redirects to /reports/new,
    // but redirecting explicitly might be cleaner if /login route behavior changes later.
    // If you are absolutely sure /login always goes to reports, you could redirect there directly.
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, check if the (potentially fake) user has it
  if (requiredRole && user) {
    const hasRequiredRole = checkUserRole(user.role, requiredRole);

    if (!hasRequiredRole) {
      console.log(`ProtectedRoute: User role '${user.role}' does not meet required role(s) '${requiredRole}'. Redirecting to unauthorized.`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If authenticated (even if faked) and role checks pass (or no role required), render the component
  return children;
};

export default ProtectedRoute;