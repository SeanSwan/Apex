// client-portal/src/components/auth/AuthProvider.tsx
/**
 * APEX AI - Aegis Client Portal Authentication Provider
 * ===================================================
 * 
 * Mission-critical authentication context provider that manages all authentication 
 * state and operations for the client portal. This component wraps the entire 
 * application and provides secure authentication context to all child components.
 * 
 * Features:
 * - Secure user session management
 * - Automatic session validation and refresh
 * - Comprehensive error handling with user feedback
 * - Loading states for all authentication operations
 * - Clean logout and session cleanup
 * - TypeScript-first with complete type safety
 */

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback,
  useMemo,
  ReactNode 
} from 'react';
import { toast } from 'react-hot-toast';
import { AuthService } from '../../services/authService';
import { 
  User, 
  LoginCredentials,
  ClientPermissions,
  ClientSession 
} from '../../types/client.types';

// ===========================
// AUTHENTICATION CONTEXT TYPES
// ===========================

interface AuthContextValue {
  // Authentication State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  
  // Authentication Operations
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  
  // User Operations
  getCurrentUser: () => Promise<User | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  getActiveSessions: () => Promise<ClientSession[]>;
  
  // Utility Functions
  hasPermission: (permission: keyof ClientPermissions) => boolean;
  isAdmin: () => boolean;
  getUserDisplayName: () => string;
  getUserInitials: () => string;
  forceLogout: (reason?: string) => void;
  
  // Error State
  error: string | null;
  clearError: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

// ===========================
// AUTHENTICATION CONTEXT
// ===========================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ===========================
// AUTHENTICATION PROVIDER COMPONENT
// ===========================

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ===========================
  // UTILITY FUNCTIONS
  // ===========================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: any, defaultMessage: string) => {
    const errorMessage = error?.message || error?.response?.data?.message || defaultMessage;
    setError(errorMessage);
    toast.error(errorMessage);
    console.error('Auth Error:', error);
  }, []);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // ===========================
  // AUTHENTICATION OPERATIONS
  // ===========================

  const login = useCallback(async (credentials: LoginCredentials, rememberMe: boolean = false): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 AuthProvider: Starting login process for:', credentials.email);
      const loggedInUser = await AuthService.login(credentials, rememberMe);
      console.log('🔐 AuthProvider: Login successful, setting user state:', loggedInUser);
      
      // CRITICAL FIX: Use React 18 flushSync for immediate state updates
      const { flushSync } = await import('react-dom');
      
      // Synchronously update all authentication state
      flushSync(() => {
        setUser(loggedInUser);
        setIsLoading(false);
        setError(null);
      });
      
      // Additional verification that state is updated
      console.log('🔐 AuthProvider: State update complete, auth status:', !!loggedInUser);
      
    } catch (error: any) {
      console.error('🔐 AuthProvider: Login failed:', error);
      setIsLoading(false);
      handleError(error, 'Login failed. Please check your credentials and try again.');
      throw error; // Re-throw to allow form handling
    }
  }, [handleError]);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await AuthService.logout();
      clearAuthState();
      
    } catch (error: any) {
      // Still clear auth state even if backend logout fails
      clearAuthState();
      console.warn('Logout warning:', error);
    }
  }, [clearAuthState]);

  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
      return currentUser;
      
    } catch (error: any) {
      clearAuthState();
      handleError(error, 'Failed to retrieve user session');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearAuthState]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const success = await AuthService.refreshToken();
      
      if (success) {
        // Re-fetch user data after successful token refresh
        const refreshedUser = await AuthService.getCurrentUser();
        setUser(refreshedUser);
        return true;
      } else {
        // Token refresh failed, clear auth state
        clearAuthState();
        return false;
      }
      
    } catch (error: any) {
      clearAuthState();
      console.error('Session refresh failed:', error);
      return false;
    }
  }, [clearAuthState]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await AuthService.changePassword(currentPassword, newPassword);
      
    } catch (error: any) {
      handleError(error, 'Failed to change password');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const getActiveSessions = useCallback(async (): Promise<ClientSession[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const sessions = await AuthService.getActiveSessions();
      return sessions;
      
    } catch (error: any) {
      handleError(error, 'Failed to retrieve active sessions');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const forceLogout = useCallback((reason?: string): void => {
    clearAuthState();
    AuthService.forceLogout(reason);
  }, [clearAuthState]);

  // ===========================
  // UTILITY FUNCTIONS
  // ===========================

  const hasPermission = useCallback((permission: keyof ClientPermissions): boolean => {
    return AuthService.hasPermission(permission);
  }, []);

  const isAdmin = useCallback((): boolean => {
    return AuthService.isAdmin();
  }, []);

  const getUserDisplayName = useCallback((): string => {
    return AuthService.getUserDisplayName();
  }, []);

  const getUserInitials = useCallback((): string => {
    return AuthService.getUserInitials();
  }, []);

  // ===========================
  // SESSION INITIALIZATION & MANAGEMENT
  // ===========================

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      setIsInitializing(true);
      
      try {
        // ENHANCED: Check localStorage first for immediate state setting
        const cachedUser = AuthService.getCachedUser();
        const hasValidToken = AuthService.isAuthenticated() && AuthService.isSessionValid();
        
        if (cachedUser && hasValidToken) {
          console.log('🔄 AuthProvider: Found valid cached session, setting user immediately');
          
          // Use flushSync for immediate state update
          const { flushSync } = await import('react-dom');
          flushSync(() => {
            setUser(cachedUser); // Set user immediately from cache
          });
          
          // Then verify with server in background
          try {
            const currentUser = await AuthService.getCurrentUser();
            if (currentUser && JSON.stringify(currentUser) !== JSON.stringify(cachedUser)) {
              flushSync(() => {
                setUser(currentUser); // Update if server data differs
              });
            }
          } catch (error) {
            console.warn('Server verification failed, keeping cached user:', error);
          }
        } else if (AuthService.isAuthenticated()) {
          // Try to refresh the session
          const refreshSuccess = await refreshSession();
          if (!refreshSuccess) {
            clearAuthState();
          }
        }
      } catch (error: any) {
        console.warn('Auth initialization warning:', error);
        clearAuthState();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [refreshSession, clearAuthState]);

  // Session refresh timer - check every 30 minutes
  useEffect(() => {
    if (!user) return;

    const sessionCheckInterval = setInterval(async () => {
      if (AuthService.isAuthenticated()) {
        if (!AuthService.isSessionValid()) {
          // Session expired, try to refresh
          const refreshSuccess = await refreshSession();
          if (!refreshSuccess) {
            forceLogout('Your session has expired. Please log in again.');
          }
        }
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(sessionCheckInterval);
  }, [user, refreshSession, forceLogout]);

  // Handle visibility change (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        if (AuthService.isAuthenticated() && !AuthService.isSessionValid()) {
          const refreshSuccess = await refreshSession();
          if (!refreshSuccess) {
            forceLogout('Your session expired while you were away. Please log in again.');
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, refreshSession, forceLogout]);

  // ===========================
  // CONTEXT VALUE MEMOIZATION
  // ===========================

  const contextValue = useMemo<AuthContextValue>(() => {
    // ENHANCED: More robust authentication state calculation
    const computedIsAuthenticated = (
      !!user && 
      AuthService.isAuthenticated() && 
      AuthService.isSessionValid()
    );
    
    return {
      // Authentication State
      user,
      isAuthenticated: computedIsAuthenticated,
      isLoading,
      isInitializing,
      error,
      
      // Authentication Operations
      login,
      logout,
      refreshSession,
      getCurrentUser,
      changePassword,
      getActiveSessions,
      
      // Utility Functions
      hasPermission,
      isAdmin,
      getUserDisplayName,
      getUserInitials,
      forceLogout,
      clearError
    };
  }, [
    user,
    isLoading,
    isInitializing,
    error,
    login,
    logout,
    refreshSession,
    getCurrentUser,
    changePassword,
    getActiveSessions,
    hasPermission,
    isAdmin,
    getUserDisplayName,
    getUserInitials,
    forceLogout,
    clearError
  ]);

  // ===========================
  // COMPONENT RENDER
  // ===========================

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ===========================
// CUSTOM HOOK FOR USING AUTH CONTEXT
// ===========================

/**
 * Custom hook to access authentication context
 * 
 * @returns AuthContextValue - Complete authentication context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure you have wrapped your app with <AuthProvider>.'
    );
  }
  
  return context;
};

// ===========================
// ADDITIONAL UTILITY HOOKS
// ===========================

/**
 * Hook to check if user has specific permission
 * 
 * @param permission - Permission to check
 * @returns boolean - True if user has permission
 */
export const usePermission = (permission: keyof ClientPermissions): boolean => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

/**
 * Hook to check if current user is admin
 * 
 * @returns boolean - True if user is admin
 */
export const useIsAdmin = (): boolean => {
  const { isAdmin } = useAuth();
  return isAdmin();
};

/**
 * Hook to get user display information
 * 
 * @returns Object with user display utilities
 */
export const useUserDisplay = () => {
  const { getUserDisplayName, getUserInitials, user } = useAuth();
  
  return {
    displayName: getUserDisplayName(),
    initials: getUserInitials(),
    email: user?.email || '',
    role: user?.role || 'client_user',
    clientName: user?.clientName || ''
  };
};

// ===========================
// AUTHENTICATION GUARD COMPONENT
// ===========================

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requirePermission?: keyof ClientPermissions;
  requireAdmin?: boolean;
}

/**
 * Component to protect routes/components that require authentication
 * 
 * @param children - Components to render if authenticated
 * @param fallback - Component to render if not authenticated
 * @param requirePermission - Specific permission required
 * @param requireAdmin - Whether admin role is required
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = null,
  requirePermission,
  requireAdmin = false
}) => {
  const { isAuthenticated, isInitializing, hasPermission, isAdmin } = useAuth();
  
  // Show nothing while initializing
  if (isInitializing) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }
  
  // Check authentication
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }
  
  // Check admin requirement
  if (requireAdmin && !isAdmin()) {
    return <div className="p-4 text-center text-red-600">
      Access denied. Admin privileges required.
    </div>;
  }
  
  // Check specific permission
  if (requirePermission && !hasPermission(requirePermission)) {
    return <div className="p-4 text-center text-red-600">
      Access denied. Required permission: {requirePermission}
    </div>;
  }
  
  return <>{children}</>;
};

export default AuthProvider;