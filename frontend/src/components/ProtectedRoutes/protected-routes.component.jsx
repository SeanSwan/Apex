import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ roles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    // Optionally, return a loading spinner or placeholder
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    // User is not authenticated
    return <Navigate to="/login" replace />;
  }

  if (roles && Array.isArray(roles) && roles.length > 0) {
    if (!user.role || !roles.includes(user.role)) {
      // User does not have the required role
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // User is authenticated and has the required role (if roles are specified)
  return <Outlet />;
};

export default ProtectedRoute;