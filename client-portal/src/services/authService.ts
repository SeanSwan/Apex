// client-portal/src/services/authService.ts
/**
 * Client Portal Authentication Service
 * ====================================
 * Handles all authentication-related operations for the Aegis Client Portal
 * including login, logout, session management, and user profile operations
 */

import axios, { AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import {
  User,
  LoginCredentials,
  AuthResponse,
  ApiResponse,
  ClientSession
} from '../types/client.types';

// ===========================
// CONFIGURATION & CONSTANTS
// ===========================

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const CLIENT_API_BASE = `${API_BASE_URL}/client/v1`;

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'aegis_access_token',
  USER_DATA: 'aegis_user_data',
  LAST_ACTIVITY: 'aegis_last_activity',
  REMEMBER_EMAIL: 'aegis_remember_email'
} as const;

// ===========================
// AXIOS CONFIGURATION
// ===========================

const authApi = axios.create({
  baseURL: CLIENT_API_BASE,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ===========================
// UTILITY FUNCTIONS
// ===========================

const getAccessToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

const setAccessToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
};

const removeAccessToken = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
};

const getUserData = (): User | null => {
  const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData) as User;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    return null;
  }
};

const setUserData = (user: User): void => {
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
};

const removeUserData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
};

const updateLastActivity = (): void => {
  localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
};

const clearAuthData = (): void => {
  removeAccessToken();
  removeUserData();
  localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
  
  Cookies.remove('client_session_token', { 
    path: '/', 
    secure: import.meta.env.PROD 
  });
};

const handleAuthError = async (message: string): Promise<void> => {
  clearAuthData();
  toast.error(message);
  
  // Redirect to landing page instead of /login since /login redirects to /
  if (window.location.pathname !== '/') {
    window.location.href = '/';
  }
};

// ===========================
// MAIN AUTHENTICATION SERVICE
// ===========================

export class AuthService {
  static async login(credentials: LoginCredentials, rememberMe: boolean = false): Promise<User> {
    try {
      console.log('🔑 AuthService: Attempting login for:', credentials.email);
      
      const response: AxiosResponse<AuthResponse> = await authApi.post('/auth/login', {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password
      });

      console.log('🔑 AuthService: Login response received:', response.status, response.data.success);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Login failed');
      }

      const { user, accessToken } = response.data.data;
      console.log('🔑 AuthService: Login data extracted - User:', user.email, 'Token length:', accessToken?.length);

      // Store authentication data
      setAccessToken(accessToken);
      setUserData(user);
      updateLastActivity();
      
      console.log('🔑 AuthService: Authentication data stored successfully');

      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, credentials.email.toLowerCase().trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL);
      }

      toast.success(`Welcome back, ${user.firstName}!`);
      
      // Verify data was stored correctly
      const storedToken = getAccessToken();
      const storedUser = getUserData();
      console.log('🔑 AuthService: Verification - Token stored:', !!storedToken, 'User stored:', !!storedUser);
      
      return user;

    } catch (error: any) {
      console.error('🔑 AuthService: Login failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  static async logout(): Promise<void> {
    try {
      await authApi.post('/auth/logout');
    } catch (error) {
      console.warn('Backend logout failed, proceeding with local cleanup:', error);
    } finally {
      clearAuthData();
      toast.success('Logged out successfully');
      
      // Redirect to landing page instead of /login
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const cachedUser = getUserData();
      const token = getAccessToken();
      
      if (!token) {
        return null;
      }

      const response: AxiosResponse<ApiResponse<{ user: User }>> = await authApi.get('/auth/profile');
      
      if (!response.data.success || !response.data.data) {
        await handleAuthError('Invalid session');
        return null;
      }

      const user = response.data.data.user;
      
      if (!cachedUser || JSON.stringify(cachedUser) !== JSON.stringify(user)) {
        setUserData(user);
      }
      
      updateLastActivity();
      return user;

    } catch (error: any) {
      if (error.response?.status === 401) {
        await handleAuthError('Session expired');
      } else {
        console.error('Error fetching current user:', error);
      }
      return null;
    }
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await authApi.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Password change failed');
      }

      toast.success('Password changed successfully');
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  static async getActiveSessions(): Promise<ClientSession[]> {
    try {
      const response: AxiosResponse<ApiResponse<{ sessions: ClientSession[] }>> = await authApi.get('/auth/sessions');
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to fetch sessions');
      }

      return response.data.data.sessions;
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch sessions';
      console.error('Error fetching sessions:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  static async refreshToken(): Promise<boolean> {
    try {
      const response = await authApi.post('/auth/refresh');
      
      if (response.data.success && response.data.data.accessToken) {
        setAccessToken(response.data.data.accessToken);
        updateLastActivity();
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // ===========================
  // UTILITY METHODS
  // ===========================

  static isAuthenticated(): boolean {
    const token = getAccessToken();
    const userData = getUserData();
    const isAuth = !!(token && userData);
    console.log('🔍 AuthService: isAuthenticated check - Token:', !!token, 'UserData:', !!userData, 'Result:', isAuth);
    return isAuth;
  }

  static getCachedUser(): User | null {
    return getUserData();
  }

  static hasPermission(permission: keyof User['permissions']): boolean {
    const user = getUserData();
    return user?.permissions[permission] ?? false;
  }

  static isAdmin(): boolean {
    const user = getUserData();
    return user?.role === 'client_admin';
  }

  static getRememberedEmail(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL);
  }

  static clearRememberedEmail(): void {
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL);
  }

  static isSessionValid(): boolean {
    const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    if (!lastActivity) return false;
    
    const lastActivityTime = parseInt(lastActivity, 10);
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    
    return (now - lastActivityTime) < twoHours;
  }

  static getUserDisplayName(): string {
    const user = getUserData();
    if (!user) return 'Unknown User';
    return `${user.firstName} ${user.lastName}`.trim();
  }

  static getUserInitials(): string {
    const user = getUserData();
    if (!user) return 'U';
    return `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase();
  }

  static forceLogout(reason?: string): void {
    clearAuthData();
    if (reason) {
      toast.error(reason);
    }
    // Redirect to landing page instead of /login
    window.location.href = '/';
  }
}

// Request interceptor
authApi.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await handleAuthError('Session expired. Please log in again.');
    }
    return Promise.reject(error);
  }
);

// Auto session management
if (typeof window !== 'undefined') {
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  const throttleActivity = (() => {
    let timeout: NodeJS.Timeout | null = null;
    return () => {
      if (timeout) return;
      
      timeout = setTimeout(() => {
        if (AuthService.isAuthenticated()) {
          updateLastActivity();
        }
        timeout = null;
      }, 60000);
    };
  })();
  
  activityEvents.forEach(event => {
    document.addEventListener(event, throttleActivity, true);
  });
  
  window.addEventListener('focus', () => {
    if (AuthService.isAuthenticated() && !AuthService.isSessionValid()) {
      AuthService.forceLogout('Session expired due to inactivity');
    }
  });
}

export { AuthService as default };
