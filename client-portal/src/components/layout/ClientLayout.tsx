// client-portal/src/components/layout/ClientLayout.tsx
/**
 * APEX AI - Aegis Client Portal Main Application Layout
 * ===================================================
 * 
 * Mission-critical main application shell that provides the complete layout
 * infrastructure for the Aegis Client Portal. This component orchestrates
 * the entire user interface including navigation, routing, and responsive design.
 * 
 * Features:
 * - Professional grid-based layout with header, sidebar, and main content
 * - Protected routing with authentication integration
 * - Responsive design with mobile navigation drawer
 * - User profile management and logout functionality
 * - Breadcrumb navigation system
 * - Loading states and error boundaries
 * - Accessibility-compliant navigation patterns
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Bell, 
  Settings, 
  LogOut, 
  User,
  ChevronDown,
  Home,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth, useUserDisplay } from '../auth/AuthProvider';
import { Navigation } from './Navigation';
import { BreadcrumbItem } from '../../types/client.types';

// ===========================
// COMPONENT INTERFACES
// ===========================

interface ClientLayoutProps {
  children?: React.ReactNode;
}

interface HeaderProps {
  isMobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
  breadcrumbs: BreadcrumbItem[];
  userMenuOpen: boolean;
  onUserMenuToggle: () => void;
  onLogout: () => void;
}

interface MobileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// ===========================
// BREADCRUMB CONFIGURATION
// ===========================

const ROUTE_BREADCRUMBS: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [
    { label: 'Dashboard', path: '/dashboard', icon: <Home className="w-4 h-4" /> }
  ],
  '/incidents': [
    { label: 'Dashboard', path: '/dashboard', icon: <Home className="w-4 h-4" /> },
    { label: 'Incidents' }
  ],
  '/evidence': [
    { label: 'Dashboard', path: '/dashboard', icon: <Home className="w-4 h-4" /> },
    { label: 'Evidence Locker' }
  ],
  '/analytics': [
    { label: 'Dashboard', path: '/dashboard', icon: <Home className="w-4 h-4" /> },
    { label: 'Analytics' }
  ],
  '/settings': [
    { label: 'Dashboard', path: '/dashboard', icon: <Home className="w-4 h-4" /> },
    { label: 'Settings' }
  ]
};

// ===========================
// HEADER COMPONENT
// ===========================

const Header: React.FC<HeaderProps> = ({ 
  isMobileMenuOpen, 
  onMobileMenuToggle, 
  breadcrumbs,
  userMenuOpen,
  onUserMenuToggle,
  onLogout 
}) => {
  const { displayName, initials, email, role, clientName } = useUserDisplay();

  const renderBreadcrumbs = () => {
    if (breadcrumbs.length === 0) return null;

    return (
      <nav className="hidden md:flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            {crumb.path ? (
              <a 
                href={crumb.path}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                {crumb.icon}
                <span>{crumb.label}</span>
              </a>
            ) : (
              <div className="flex items-center space-x-1 text-gray-900 font-medium">
                {crumb.icon}
                <span>{crumb.label}</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  };

  const renderUserMenu = () => (
    <div className="relative">
      <button
        onClick={onUserMenuToggle}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        aria-label="User menu"
        aria-expanded={userMenuOpen}
      >
        <div className="apex-nav-user-avatar">
          {initials}
        </div>
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">{displayName}</span>
          <span className="text-xs text-gray-500">{clientName}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
          userMenuOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* User Menu Dropdown */}
      {userMenuOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 apex-fade-in">
          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="apex-nav-user-avatar">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{email}</p>
                <p className="text-xs text-blue-600 font-medium capitalize">{role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              onClick={() => {
                onUserMenuToggle();
                // Handle profile navigation
              }}
            >
              <User className="w-4 h-4 mr-3 text-gray-400" />
              View Profile
            </button>
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              onClick={() => {
                onUserMenuToggle();
                // Handle settings navigation
              }}
            >
              <Settings className="w-4 h-4 mr-3 text-gray-400" />
              Settings
            </button>
          </div>

          <div className="border-t border-gray-200">
            <button
              onClick={() => {
                onUserMenuToggle();
                onLogout();
              }}
              className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="apex-header">
      <div className="apex-header-content">
        {/* Left Side - Mobile Menu + Breadcrumbs */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Mobile Menu Button */}
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Breadcrumbs */}
          {renderBreadcrumbs()}
        </div>

        {/* Right Side - Notifications + User Menu */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          {renderUserMenu()}
        </div>
      </div>
    </header>
  );
};

// ===========================
// MOBILE OVERLAY COMPONENT
// ===========================

const MobileOverlay: React.FC<MobileOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      onClick={onClose}
      aria-hidden="true"
    />
  );
};

// ===========================
// MAIN LAYOUT COMPONENT
// ===========================

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  // ===========================
  // HOOKS & STATE
  // ===========================
  
  const { logout, isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ===========================
  // COMPUTED VALUES
  // ===========================

  const breadcrumbs = useMemo(() => {
    return ROUTE_BREADCRUMBS[location.pathname] || [];
  }, [location.pathname]);

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleUserMenuToggle = useCallback(() => {
    setUserMenuOpen(prev => !prev);
  }, []);

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout');
    }
  }, [logout, navigate]);

  // ===========================
  // EFFECTS
  // ===========================

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && !(event.target as Element).closest('[aria-expanded="true"]')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
        if (userMenuOpen) {
          setUserMenuOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, userMenuOpen]);

  // ===========================
  // LOADING STATE
  // ===========================

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="apex-loading apex-loading-lg mb-4"></div>
          <p className="text-gray-600">Loading Aegis Client Portal...</p>
        </div>
      </div>
    );
  }

  // ===========================
  // UNAUTHENTICATED STATE
  // ===========================

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please log in to access the client portal.</p>
          <button
            onClick={() => navigate('/login')}
            className="apex-btn apex-btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <div className={`apex-app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Overlay */}
      <MobileOverlay 
        isOpen={isMobileMenuOpen} 
        onClose={handleMobileMenuClose} 
      />

      {/* Sidebar Navigation */}
      <aside 
        className={`apex-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        aria-label="Main navigation"
      >
        <Navigation 
          collapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
          onMobileClose={handleMobileMenuClose}
        />
      </aside>

      {/* Header */}
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={handleMobileMenuToggle}
        breadcrumbs={breadcrumbs}
        userMenuOpen={userMenuOpen}
        onUserMenuToggle={handleUserMenuToggle}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="apex-main" role="main">
        <div className="apex-main-content apex-fade-in">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

// ===========================
// ERROR BOUNDARY WRAPPER
// ===========================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LayoutErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Layout Error:', error, errorInfo);
    toast.error('An error occurred in the application layout');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We're sorry, but something went wrong with the application layout.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="apex-btn apex-btn-primary"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ===========================
// WRAPPED EXPORT WITH ERROR BOUNDARY
// ===========================

export const ClientLayoutWithErrorBoundary: React.FC<ClientLayoutProps> = (props) => {
  return (
    <LayoutErrorBoundary>
      <ClientLayout {...props} />
    </LayoutErrorBoundary>
  );
};

export default ClientLayout;