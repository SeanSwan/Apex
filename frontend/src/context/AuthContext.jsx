// File: frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';

// Create the AuthContext
export const AuthContext = createContext();

// Base URL for the backend API - Keep in case other parts use it
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/auth';
console.log("Using API Base URL:", API_BASE_URL);

// Helper functions for localStorage (keep as they are)
const safeGetLocalStorage = (key) => { /* ... keep original implementation ... */ };
const safeSetLocalStorage = (key, value) => { /* ... keep original implementation ... */ };
const safeRemoveLocalStorage = (key) => { /* ... keep original implementation ... */ };


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start loading true
  const [error, setError] = useState(null);
  const initRan = useRef(false); // Ref for StrictMode check

  // --- Initialization Effect (MODIFIED) ---
  useEffect(() => {
    // StrictMode check (improved)
    if (initRan.current === true && import.meta.env.MODE === 'development') {
      return;
    }
    initRan.current = true;

    const initializeAuth = async () => {
      console.warn("!!! AUTHENTICATION OVERRIDDEN FOR LOCAL REPORT BUILDER MODE !!!");
      console.log("AuthContext: Initializing in forced authentication mode.");

      // --- Force Fake Authentication Start ---
      const mockUser = {
        id: 'local-report-user-001',
        username: 'ReportBuilderUser',
        // Use a role that likely grants all necessary permissions within the ReportBuilder
        // and any child components that might check roles.
        role: 'super_admin', // Or another role that ReportBuilder expects/needs
        email: 'report@builder.local',
        firstName: 'Report', // Add any other fields components might display
        lastName: 'User',
        // Add other fields expected by your components or context consumers
      };

      // Directly set the user state to the mock user
      setUser(mockUser);

      // Set loading to false immediately, bypassing any backend checks
      setLoading(false);

      // Clear any potential errors
      setError(null);

      console.log("AuthContext: Forced mock user state set:", mockUser);
      console.log("AuthContext: Bypassing token validation and localStorage check.");

      // --- IMPORTANT: Stop execution here ---
      return;
      // --- Force Fake Authentication End ---

      /* --- Original Initialization Logic (IS NOW UNREACHABLE) ---
      setLoading(true);
      setError(null);
      const token = safeGetLocalStorage('token');
      const storedUserJson = safeGetLocalStorage('user');

      if (token && storedUserJson) {
        console.log('AuthContext: Found token and user in localStorage. Validating...');
        try {
          const response = await axios.get(`${API_BASE_URL}/validate-token`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data && response.data.user) {
            // ... original validation success logic ...
          } else {
            // ... original unexpected response handling ...
          }
        } catch (validationError) {
          // ... original validation error handling ...
        }
      } else {
        console.log('AuthContext: No token/user found in localStorage.');
        setUser(null);
      }
      setLoading(false);
      --- End of Original Logic --- */
    };

    // Run the modified initialization function
    initializeAuth();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array


  // --- Axios Interceptors ---
  // Keep interceptors. They might try to add a non-existent token,
  // or handle 401s if ReportBuilder makes calls to protected backend endpoints
  // (which would fail without a valid token from a real login).
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = safeGetLocalStorage('token'); // Might be null or fake
        // Only add if token exists and URL matches base API pattern
        if (token && config.url && config.url.startsWith(API_BASE_URL.replace('/api/auth', '/api'))) {
          config.headers.Authorization = `Bearer ${token}`;
          // console.log("Interceptor: Added fake/null token to request for", config.url);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const isUnauthorized = error.response?.status === 401;
        // Avoid triggering logout on validation/login URLs themselves
        const isNotAuthUrl = !error.config.url?.includes('/api/auth/');

        // In bypass mode, a 401 might just mean the backend correctly rejected
        // an API call because there's no valid session. We probably DON'T want
        // to clear our fake user state in this case. Just log it.
        if (isUnauthorized && isNotAuthUrl) {
          console.warn('Axios Interceptor: Received 401 Unauthorized (Backend likely rejected API call due to missing real session). Ignoring in bypass mode.');
          // Original logout logic is commented out:
          // setUser(null);
          // safeRemoveLocalStorage('user');
          // safeRemoveLocalStorage('token');
          // setError('Backend authentication required for this action.');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []); // Run once on mount


  // --- Auth Actions (Mostly Ignored/Warn) ---
  // Keep function signatures to avoid breaking components that might import them,
  // but make them no-ops or just log warnings in this bypass mode.

  const register = async (newUser) => {
    console.warn("Register function called in bypass mode. Action skipped.");
    setError("Registration is disabled in this mode.");
    // Simulate failure or do nothing
    throw new Error("Registration disabled");
  };

  const login = async (username, password) => {
    console.warn("Login function called in bypass mode. Action skipped.");
    setError("Login is disabled in this mode.");
    // Simulate failure or do nothing
    throw new Error("Login disabled");
  };

  const logout = () => {
    console.warn("Logout function called in bypass mode. Clearing fake user state.");
    // Clear the fake state if logout is somehow triggered
    setUser(null);
    setError(null);
    safeRemoveLocalStorage('user'); // Remove any potentially stored fake user
    safeRemoveLocalStorage('token'); // Remove any potentially stored fake token
    // Optional: Redirect to /login (which now goes back to /reports/new)
    // window.location.href = '/login';
  };

  const updateProfile = async (updatedData) => {
    console.warn("UpdateProfile function called in bypass mode. Action skipped.");
    setError("Profile updates are disabled in this mode.");
    // Simulate failure or do nothing
    throw new Error("Profile update disabled");
  };

  // --- Role Checks (Work with Fake User) ---
  const hasRole = (roles) => {
    // This function now operates on the potentially fake 'user' state
    if (!user || !user.role) return false;
    const userRoles = Array.isArray(user.role) ? user.role : [user.role];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    // Check if any of the user's roles match any of the required roles
    return requiredRoles.some(required => userRoles.includes(required));
  };

  const ROLES = { // Keep roles definition
    SUPER_ADMIN: 'super_admin', ADMIN_CEO: 'admin_ceo', ADMIN_CTO: 'admin_cto',
    ADMIN_CFO: 'admin_cfo', MANAGER: 'manager', DISPATCHER: 'dispatcher',
    GUARD: 'guard', CLIENT: 'client', PAYROLL: 'payroll', USER: 'user',
  };

  // Helper role functions using the updated hasRole
  const isAdmin = () => hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN_CEO, ROLES.ADMIN_CTO, ROLES.ADMIN_CFO]);
  const isManager = () => hasRole([ROLES.MANAGER]) || isAdmin();
  const isDispatcher = () => hasRole([ROLES.DISPATCHER]) || isManager();
  const isGuard = () => hasRole(ROLES.GUARD);
  const isClient = () => hasRole(ROLES.CLIENT);

  const getToken = () => {
    // Might return null or a fake token if one was set earlier (currently commented out)
    return safeGetLocalStorage('token');
  };

  // --- Context Value ---
  // Provide the state and functions to consumers
  const authContextValue = {
    user, // The fake user object
    loading, // Will be false shortly after mount
    error,
    login, // No-op version
    register, // No-op version
    logout, // Clears fake state version
    updateProfile, // No-op version
    hasRole, // Works with fake user
    isAdmin, // Works with fake user
    isManager, // Works with fake user
    isDispatcher, // Works with fake user
    isGuard, // Works with fake user
    isClient, // Works with fake user
    getToken, // Returns null or fake token
    ROLES,
    isAuthenticated: !!user && !loading, // Will be true shortly after mount
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext - unchanged
export const useAuth = () => useContext(AuthContext);