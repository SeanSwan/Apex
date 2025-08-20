// client-portal/src/components/layout/Navigation.tsx
/**
 * APEX AI - Aegis Client Portal Professional Navigation
 * ===================================================
 * 
 * Mission-critical sidebar navigation component for the Aegis Client Portal.
 * Provides professional navigation with role-based access control, active
 * state management, and responsive design patterns.
 * 
 * Features:
 * - Role-based navigation with permission checking
 * - Active route highlighting and navigation state
 * - Collapsible sidebar with smooth animations
 * - Professional APEX AI branding integration
 * - Badge notifications and status indicators
 * - Mobile-responsive navigation drawer
 * - Accessibility-compliant navigation patterns
 */

import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  AlertTriangle,
  Archive,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  FileText,
  Activity
} from 'lucide-react';
import { useAuth, usePermission, useUserDisplay } from '../auth/AuthProvider';
import { MenuItem, ClientPermissions } from '../../types/client.types';

// ===========================
// COMPONENT INTERFACES
// ===========================

interface NavigationProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onMobileClose?: () => void;
}

interface NavItemProps {
  item: MenuItem;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}

interface NavSectionProps {
  title: string;
  children: React.ReactNode;
  collapsed: boolean;
}

// ===========================
// NAVIGATION MENU CONFIGURATION
// ===========================

const NAVIGATION_MENU: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: '/dashboard',
    permission: 'dashboard'
  },
  {
    key: 'incidents',
    label: 'Incidents',
    icon: <AlertTriangle className="w-5 h-5" />,
    path: '/incidents',
    permission: 'incidents',
    badge: 'new' // Could be dynamic
  },
  {
    key: 'evidence',
    label: 'Evidence Locker',
    icon: <Archive className="w-5 h-5" />,
    path: '/evidence',
    permission: 'evidence'
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    path: '/analytics',
    permission: 'analytics'
  }
];

const SETTINGS_MENU: MenuItem[] = [
  {
    key: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    path: '/settings',
    permission: 'settings'
  }
];

// Additional menu items for admin users
const ADMIN_MENU: MenuItem[] = [
  {
    key: 'users',
    label: 'User Management',
    icon: <Users className="w-5 h-5" />,
    path: '/users',
    permission: 'settings' // Admins typically have settings permission
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: <FileText className="w-5 h-5" />,
    path: '/reports',
    permission: 'analytics'
  },
  {
    key: 'system',
    label: 'System Status',
    icon: <Activity className="w-5 h-5" />,
    path: '/system',
    permission: 'settings'
  }
];

// ===========================
// NAVIGATION ITEM COMPONENT
// ===========================

const NavItem: React.FC<NavItemProps> = ({ item, isActive, collapsed, onClick }) => {
  const renderBadge = () => {
    if (!item.badge) return null;

    if (typeof item.badge === 'string') {
      return (
        <span className="apex-nav-item-badge apex-badge-primary">
          {item.badge}
        </span>
      );
    }

    if (typeof item.badge === 'number' && item.badge > 0) {
      return (
        <span className="apex-nav-item-badge apex-badge-error">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      );
    }

    return null;
  };

  return (
    <button
      onClick={onClick}
      className={`apex-nav-item ${isActive ? 'active' : ''}`}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="apex-nav-item-icon">
        {item.icon}
      </span>
      
      {!collapsed && (
        <>
          <span className="apex-nav-item-text">
            {item.label}
          </span>
          {renderBadge()}
        </>
      )}
    </button>
  );
};

// ===========================
// NAVIGATION SECTION COMPONENT
// ===========================

const NavSection: React.FC<NavSectionProps> = ({ title, children, collapsed }) => {
  if (collapsed) {
    return (
      <div className="apex-nav-section">
        {children}
      </div>
    );
  }

  return (
    <div className="apex-nav-section">
      <h3 className="apex-nav-section-title">
        {title}
      </h3>
      {children}
    </div>
  );
};

// ===========================
// MAIN NAVIGATION COMPONENT
// ===========================

export const Navigation: React.FC<NavigationProps> = ({
  collapsed = false,
  onToggle,
  onMobileClose
}) => {
  // ===========================
  // HOOKS & STATE
  // ===========================

  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { displayName, initials, clientName } = useUserDisplay();

  // Get all permissions at the top level (React hooks rules)
  const hasIncidentsPermission = usePermission('incidents');
  const hasEvidencePermission = usePermission('evidence');
  const hasAnalyticsPermission = usePermission('analytics');
  const hasSettingsPermission = usePermission('settings');
  const hasDashboardPermission = usePermission('dashboard');

  // ===========================
  // PERMISSION FILTERING
  // ===========================

  const hasPermission = (permission: keyof ClientPermissions | undefined): boolean => {
    if (!permission) return true;
    
    // Use the pre-fetched permission values instead of calling hook
    switch (permission) {
      case 'incidents': return hasIncidentsPermission;
      case 'evidence': return hasEvidencePermission;
      case 'analytics': return hasAnalyticsPermission;
      case 'settings': return hasSettingsPermission;
      case 'dashboard': return hasDashboardPermission;
      default: return true;
    }
  };

  const filteredMainMenu = useMemo(() => {
    return NAVIGATION_MENU.filter(item => hasPermission(item.permission));
  }, [hasIncidentsPermission, hasEvidencePermission, hasAnalyticsPermission, hasDashboardPermission]);

  const filteredSettingsMenu = useMemo(() => {
    return SETTINGS_MENU.filter(item => hasPermission(item.permission));
  }, [hasSettingsPermission]);

  const filteredAdminMenu = useMemo(() => {
    if (!isAdmin()) return [];
    return ADMIN_MENU.filter(item => hasPermission(item.permission));
  }, [isAdmin, hasSettingsPermission, hasAnalyticsPermission]);

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleNavigation = (path: string) => {
    navigate(path);
    onMobileClose?.(); // Close mobile menu after navigation
  };

  const handleToggle = () => {
    onToggle?.();
  };

  // ===========================
  // RENDER HELPERS
  // ===========================

  const isActiveRoute = (path: string): boolean => {
    return location.pathname === path;
  };

  const renderNavItems = (items: MenuItem[]) => {
    return items.map(item => (
      <NavItem
        key={item.key}
        item={item}
        isActive={isActiveRoute(item.path!)}
        collapsed={collapsed}
        onClick={() => handleNavigation(item.path!)}
      />
    ));
  };

  const renderLogo = () => (
    <div className="apex-nav-header">
      <div className="apex-nav-logo">
        <div className="apex-nav-logo-icon">
          <Shield className="h-6 w-6 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="apex-nav-logo-text">APEX AI</span>
            <span className="text-xs text-gray-500 font-medium">Aegis Portal</span>
          </div>
        )}
      </div>
      
      {/* Desktop Toggle Button */}
      {onToggle && (
        <button
          onClick={handleToggle}
          className="hidden md:flex p-1.5 rounded-md hover:bg-gray-100 transition-colors duration-200 ml-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      )}
    </div>
  );

  const renderUserSection = () => (
    <div className="apex-nav-user">
      <div className="apex-nav-user-info">
        <div className="apex-nav-user-avatar">
          {initials}
        </div>
        {!collapsed && (
          <div className="apex-nav-user-details">
            <div className="apex-nav-user-name">
              {displayName}
            </div>
            <div className="apex-nav-user-role">
              {clientName}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <nav className="apex-nav" aria-label="Main navigation">
      {/* Logo Header */}
      {renderLogo()}

      {/* Navigation Menu */}
      <div className="apex-nav-menu">
        {/* Main Navigation */}
        <NavSection title="Main Menu" collapsed={collapsed}>
          {renderNavItems(filteredMainMenu)}
        </NavSection>

        {/* Admin Menu (if admin) */}
        {filteredAdminMenu.length > 0 && (
          <NavSection title="Administration" collapsed={collapsed}>
            {renderNavItems(filteredAdminMenu)}
          </NavSection>
        )}

        {/* Settings Menu */}
        {filteredSettingsMenu.length > 0 && (
          <NavSection title="Settings" collapsed={collapsed}>
            {renderNavItems(filteredSettingsMenu)}
          </NavSection>
        )}
      </div>

      {/* User Section */}
      {renderUserSection()}
    </nav>
  );
};

// ===========================
// NAVIGATION HOOK FOR EXTERNAL USE
// ===========================

/**
 * Custom hook to manage navigation state and operations
 */
export const useNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navigateToPath = (path: string) => {
    navigate(path);
  };
  
  const isCurrentPath = (path: string): boolean => {
    return location.pathname === path;
  };
  
  const getCurrentSection = (): string => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/incidents')) return 'incidents';
    if (path.startsWith('/evidence')) return 'evidence';
    if (path.startsWith('/analytics')) return 'analytics';
    if (path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/users')) return 'users';
    if (path.startsWith('/reports')) return 'reports';
    if (path.startsWith('/system')) return 'system';
    return 'dashboard'; // default
  };
  
  return {
    currentPath: location.pathname,
    navigateToPath,
    isCurrentPath,
    getCurrentSection
  };
};

// ===========================
// NAVIGATION UTILS
// ===========================

/**
 * Utility function to get menu item by key
 */
export const getMenuItemByKey = (key: string): MenuItem | undefined => {
  const allMenus = [...NAVIGATION_MENU, ...SETTINGS_MENU, ...ADMIN_MENU];
  return allMenus.find(item => item.key === key);
};

/**
 * Utility function to get active menu item
 */
export const getActiveMenuItem = (pathname: string): MenuItem | undefined => {
  const allMenus = [...NAVIGATION_MENU, ...SETTINGS_MENU, ...ADMIN_MENU];
  return allMenus.find(item => item.path === pathname);
};

/**
 * Utility function to check if user has access to specific menu item
 * Note: This should be used inside a component that already has permission hooks
 */
export const canAccessMenuItem = (item: MenuItem, permissions: Partial<ClientPermissions>): boolean => {
  if (!item.permission) return true;
  return permissions[item.permission] || false;
};

export default Navigation;