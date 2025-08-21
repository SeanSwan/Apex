// client-portal/src/components/layout/EnhancedNavigation.tsx
/**
 * APEX AI - Enhanced Client Portal Navigation
 * ==========================================
 * 
 * Competitive-grade navigation with features property managers expect:
 * - Document Management
 * - Communication Tools
 * - Support Center
 * - Reports & Analytics
 * - User Management
 * - Activity Timeline
 * - Quick Actions
 */

import React, { useMemo, useState } from 'react';
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
  Activity,
  MessageSquare,
  HelpCircle,
  Download,
  Bell,
  Calendar,
  CreditCard,
  Building,
  Camera,
  Phone,
  Mail,
  Clock,
  Folder,
  Zap,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { useAuth, usePermission, useUserDisplay } from '../auth/AuthProvider';
import { MenuItem, ClientPermissions } from '../../types/client.types';

// =================================
// ENHANCED MENU CONFIGURATION
// =================================

interface MenuSection {
  title: string;
  items: MenuItem[];
  priority: 'high' | 'medium' | 'low';
}

const CORE_NAVIGATION: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: '/dashboard',
    permission: 'dashboard',
    description: 'Overview & KPIs'
  },
  {
    key: 'incidents',
    label: 'Security Incidents', 
    icon: <AlertTriangle className="w-5 h-5" />,
    path: '/incidents',
    permission: 'incidents',
    badge: 'new',
    description: 'View & manage incidents'
  },
  {
    key: 'evidence',
    label: 'Evidence Locker',
    icon: <Archive className="w-5 h-5" />,
    path: '/evidence',
    permission: 'evidence',
    description: 'Secure file storage'
  }
];

const ANALYTICS_MENU: MenuItem[] = [
  {
    key: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    path: '/analytics',
    permission: 'analytics',
    description: 'Detailed reports'
  },
  {
    key: 'reports',
    label: 'Custom Reports',
    icon: <FileText className="w-5 h-5" />,
    path: '/reports',
    permission: 'analytics',
    description: 'Generate custom reports'
  },
  {
    key: 'trends',
    label: 'Trend Analysis',
    icon: <TrendingUp className="w-5 h-5" />,
    path: '/trends', 
    permission: 'analytics',
    description: 'Security trends & patterns'
  }
];

const COMMUNICATION_MENU: MenuItem[] = [
  {
    key: 'messages',
    label: 'Messages',
    icon: <MessageSquare className="w-5 h-5" />,
    path: '/messages',
    permission: 'dashboard',
    badge: 3,
    description: 'Chat with security team'
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: <Bell className="w-5 h-5" />,
    path: '/notifications',
    permission: 'dashboard',
    description: 'Alert preferences'
  },
  {
    key: 'activity',
    label: 'Activity Feed',
    icon: <Activity className="w-5 h-5" />,
    path: '/activity',
    permission: 'dashboard',
    description: 'Recent system activity'
  }
];

const PROPERTY_MANAGEMENT: MenuItem[] = [
  {
    key: 'properties',
    label: 'My Properties',
    icon: <Building className="w-5 h-5" />,
    path: '/properties',
    permission: 'dashboard',
    description: 'Manage property details'
  },
  {
    key: 'cameras',
    label: 'Camera Status',
    icon: <Camera className="w-5 h-5" />,
    path: '/cameras',
    permission: 'dashboard',
    description: 'Monitor camera health'
  },
  {
    key: 'zones',
    label: 'Security Zones',
    icon: <MapPin className="w-5 h-5" />,
    path: '/zones',
    permission: 'dashboard',
    description: 'Configure monitoring areas'
  }
];

const DOCUMENTS_MENU: MenuItem[] = [
  {
    key: 'documents',
    label: 'Document Center',
    icon: <Folder className="w-5 h-5" />,
    path: '/documents',
    permission: 'dashboard',
    description: 'Shared files & docs'
  },
  {
    key: 'contracts',
    label: 'Service Contracts',
    icon: <FileText className="w-5 h-5" />,
    path: '/contracts',
    permission: 'dashboard',
    description: 'View service agreements'
  },
  {
    key: 'downloads',
    label: 'Downloads',
    icon: <Download className="w-5 h-5" />,
    path: '/downloads',
    permission: 'dashboard',
    description: 'Download reports & files'
  }
];

const SUPPORT_MENU: MenuItem[] = [
  {
    key: 'support',
    label: 'Help Center',
    icon: <HelpCircle className="w-5 h-5" />,
    path: '/support',
    permission: 'dashboard',
    description: 'Get help & support'
  },
  {
    key: 'contact',
    label: 'Contact Support',
    icon: <Phone className="w-5 h-5" />,
    path: '/contact',
    permission: 'dashboard',
    description: '24/7 support access'
  },
  {
    key: 'training',
    label: 'Training Materials',
    icon: <Zap className="w-5 h-5" />,
    path: '/training',
    permission: 'dashboard',
    description: 'Platform tutorials'
  }
];

const ADMIN_MENU: MenuItem[] = [
  {
    key: 'users',
    label: 'Team Members',
    icon: <Users className="w-5 h-5" />,
    path: '/users',
    permission: 'settings',
    description: 'Manage team access'
  },
  {
    key: 'billing',
    label: 'Billing & Usage',
    icon: <CreditCard className="w-5 h-5" />,
    path: '/billing',
    permission: 'settings',
    description: 'Service billing info'
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    path: '/settings',
    permission: 'settings',
    description: 'Account preferences'
  }
];

// =================================
// QUICK ACTIONS
// =================================

const QUICK_ACTIONS = [
  {
    key: 'emergency',
    label: 'Emergency Contact',
    icon: <Phone className="w-4 h-4" />,
    action: 'emergency',
    urgent: true
  },
  {
    key: 'new-message',
    label: 'Message Security Team',
    icon: <MessageSquare className="w-4 h-4" />,
    action: 'message'
  },
  {
    key: 'download-report',
    label: 'Download Report',
    icon: <Download className="w-4 h-4" />,
    action: 'download'
  },
  {
    key: 'schedule-call',
    label: 'Schedule Call',
    icon: <Calendar className="w-4 h-4" />,
    action: 'schedule'
  }
];

// =================================
// ENHANCED COMPONENTS
// =================================

interface EnhancedNavItemProps {
  item: MenuItem;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}

const EnhancedNavItem: React.FC<EnhancedNavItemProps> = ({ 
  item, 
  isActive, 
  collapsed, 
  onClick 
}) => {
  const renderBadge = () => {
    if (!item.badge) return null;

    const badgeContent = typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge;
    const badgeClass = typeof item.badge === 'string' ? 'bg-blue-500' : 'bg-red-500';

    return (
      <span className={`ml-auto px-2 py-0.5 text-xs font-semibold text-white rounded-full ${badgeClass}`}>
        {badgeContent}
      </span>
    );
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center p-3 rounded-lg transition-all duration-200 group
        ${isActive 
          ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
      title={collapsed ? item.label : undefined}
    >
      <span className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
        {item.icon}
      </span>
      
      {!collapsed && (
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">
              {item.label}
            </span>
            {renderBadge()}
          </div>
          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {item.description}
            </p>
          )}
        </div>
      )}
    </button>
  );
};

interface NavSectionProps {
  title: string;
  children: React.ReactNode;
  collapsed: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const NavSection: React.FC<NavSectionProps> = ({ 
  title, 
  children, 
  collapsed, 
  priority = 'medium' 
}) => {
  const [isExpanded, setIsExpanded] = useState(priority === 'high');

  if (collapsed) {
    return <div className="space-y-1">{children}</div>;
  }

  return (
    <div className="py-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
      >
        <span>{title}</span>
        <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
      </button>
      
      {isExpanded && (
        <div className="mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

interface QuickActionsProps {
  collapsed: boolean;
  onAction: (action: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ collapsed, onAction }) => {
  if (collapsed) return null;

  return (
    <div className="p-3 border-t border-gray-200">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Quick Actions
      </h4>
      <div className="space-y-1">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.key}
            onClick={() => onAction(action.action)}
            className={`
              w-full flex items-center p-2 rounded-md text-sm transition-colors
              ${action.urgent 
                ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            {action.icon}
            <span className="ml-2">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// =================================
// MAIN ENHANCED NAVIGATION
// =================================

interface EnhancedNavigationProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onMobileClose?: () => void;
}

export const EnhancedNavigation: React.FC<EnhancedNavigationProps> = ({
  collapsed = false,
  onToggle,
  onMobileClose
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { displayName, initials, clientName } = useUserDisplay();

  // Permission hooks
  const hasIncidentsPermission = usePermission('incidents');
  const hasEvidencePermission = usePermission('evidence');
  const hasAnalyticsPermission = usePermission('analytics');
  const hasSettingsPermission = usePermission('settings');
  const hasDashboardPermission = usePermission('dashboard');

  const hasPermission = (permission: keyof ClientPermissions | undefined): boolean => {
    if (!permission) return true;
    
    switch (permission) {
      case 'incidents': return hasIncidentsPermission;
      case 'evidence': return hasEvidencePermission;
      case 'analytics': return hasAnalyticsPermission;
      case 'settings': return hasSettingsPermission;
      case 'dashboard': return hasDashboardPermission;
      default: return true;
    }
  };

  // Filter menus based on permissions
  const sections: MenuSection[] = useMemo(() => {
    const allSections = [
      { title: 'Core', items: CORE_NAVIGATION, priority: 'high' as const },
      { title: 'Analytics & Reports', items: ANALYTICS_MENU, priority: 'high' as const },
      { title: 'Communication', items: COMMUNICATION_MENU, priority: 'medium' as const },
      { title: 'Property Management', items: PROPERTY_MANAGEMENT, priority: 'medium' as const },
      { title: 'Documents', items: DOCUMENTS_MENU, priority: 'medium' as const },
      { title: 'Support', items: SUPPORT_MENU, priority: 'low' as const },
    ];

    // Add admin section if user is admin
    if (isAdmin()) {
      allSections.push({ 
        title: 'Administration', 
        items: ADMIN_MENU, 
        priority: 'medium' as const 
      });
    }

    // Filter items based on permissions
    return allSections.map(section => ({
      ...section,
      items: section.items.filter(item => hasPermission(item.permission))
    })).filter(section => section.items.length > 0);
  }, [isAdmin, hasIncidentsPermission, hasEvidencePermission, hasAnalyticsPermission, hasSettingsPermission, hasDashboardPermission]);

  const handleNavigation = (path: string) => {
    navigate(path);
    onMobileClose?.();
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'emergency':
        window.open('tel:911', '_self');
        break;
      case 'message':
        handleNavigation('/messages');
        break;
      case 'download':
        handleNavigation('/downloads');
        break;
      case 'schedule':
        handleNavigation('/contact');
        break;
    }
  };

  const isActiveRoute = (path: string): boolean => {
    return location.pathname === path;
  };

  const renderLogo = () => (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">APEX AI</h1>
              <p className="text-xs text-gray-500">Aegis Client Portal</p>
            </div>
          )}
        </div>
        
        {!collapsed && onToggle && (
          <button
            onClick={onToggle}
            className="ml-auto p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );

  const renderUserSection = () => (
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {initials}
        </div>
        {!collapsed && (
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {clientName}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <nav className={`bg-white border-r border-gray-200 flex flex-col h-full ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
      {/* Logo */}
      {renderLogo()}

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4">
        {sections.map(section => (
          <NavSection
            key={section.title}
            title={section.title}
            collapsed={collapsed}
            priority={section.priority}
          >
            {section.items.map(item => (
              <EnhancedNavItem
                key={item.key}
                item={item}
                isActive={isActiveRoute(item.path!)}
                collapsed={collapsed}
                onClick={() => handleNavigation(item.path!)}
              />
            ))}
          </NavSection>
        ))}
      </div>

      {/* Quick Actions */}
      <QuickActions collapsed={collapsed} onAction={handleQuickAction} />

      {/* User Section */}
      {renderUserSection()}
    </nav>
  );
};

export default EnhancedNavigation;
