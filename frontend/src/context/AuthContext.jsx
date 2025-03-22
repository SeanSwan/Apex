import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the AuthContext
export const AuthContext = createContext();

// Base URL for the backend API
const API_BASE_URL = 'http://localhost:5000/api/auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
          // Validate token with the backend
          try {
            const response = await axios.get(`${API_BASE_URL}/validate-token`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setUser(response.data.user);
          } catch (error) {
            console.warn('Token validation failed:', error.response?.data?.message || error.message);
            // Clear invalid data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Register a new user
  const register = async (newUser) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, newUser);
      console.log('Registration successful:', response.data.message);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      throw error;
    }
  };

  // Log in an existing user
  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
      const userData = response.data.user;
      const token = response.data.token;

      // Save user and token to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);

      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      throw error;
    }
  };

  // Log out the current user
  const logout = () => {
    try {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout failed:', error.message);
    }
  };

  // Update user profile
  const updateProfile = async (updatedData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.put(`${API_BASE_URL}/profile`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update local storage and state with new user data
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Profile update failed:', error.response?.data || error.message);
      throw error;
    }
  };

  // Check if user has a specific role or any of multiple roles
  const hasRole = (roles) => {
    if (!user || !user.role) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    
    return user.role === roles;
  };

  // Role-specific checks based on our enhanced role system
  const isAdmin = () => {
    const adminRoles = ['super_admin', 'admin_cto', 'admin_ceo', 'admin_cfo'];
    return hasRole(adminRoles);
  };

  const isManager = () => {
    return hasRole('manager') || isAdmin();
  };

  const isGuard = () => {
    return hasRole('guard');
  };

  const isClient = () => {
    return hasRole('client');
  };

  // Get authentication token
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // Setup request interceptor for axios
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle 401 Unauthorized errors (expired token)
        if (error.response && error.response.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        error,
        login, 
        register, 
        logout,
        updateProfile,
        hasRole,
        isAdmin,
        isManager,
        isGuard,
        isClient,
        getToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);