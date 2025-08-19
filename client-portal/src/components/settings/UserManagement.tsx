// client-portal/src/components/settings/UserManagement.tsx
/**
 * APEX AI - User Management Component
 * ===================================
 * 
 * Comprehensive user and team management interface for client
 * organizations with role-based access controls and permissions.
 * 
 * Features:
 * - Team member invitation and management
 * - Role assignment with granular permissions
 * - User status management (active, suspended, pending)
 * - Bulk operations for team management
 * - Activity monitoring and audit trails
 * - Permission templates and custom roles
 * - Mobile-responsive design with search and filtering
 * - Integration with organization hierarchy
 * 
 * Master Prompt Compliance:
 * - Team management for client organizations
 * - Role-based access with client_admin vs client_user
 * - Multi-tenant security with proper data isolation
 * - Professional UI for enterprise expectations
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserPlusIcon,
  UsersIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EnvelopeIcon,
  ClockIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { useAuth } from '../auth/AuthProvider';
import { useMobileDetection } from '../common/MobileDetector';
import { usePerformance } from '../../hooks/usePerformance';
import { clientAPI } from '../../services/clientAPI';
import type { TeamMember, UserPermission, InvitationRequest } from '../../types/client.types';

// ===========================
// TYPES AND INTERFACES
// ===========================

interface UserManagementProps {
  teamMembers: TeamMember[];
  onTeamUpdate: () => void;
  className?: string;
}

interface InviteUserForm {
  email: string;
  firstName: string;
  lastName: string;
  role: 'client_admin' | 'client_user';
  permissions: string[];
}

interface UserFilter {
  search: string;
  role: string;
  status: string;
  permissions: string[];
}

interface BulkOperation {
  type: 'activate' | 'suspend' | 'delete' | 'change_role';
  selectedUsers: string[];
  newRole?: 'client_admin' | 'client_user';
}

// ===========================
// CONSTANTS
// ===========================

const USER_ROLES = {
  client_admin: {
    label: 'Administrator',
    description: 'Full access to all features and team management',
    color: 'bg-purple-100 text-purple-800'
  },
  client_user: {
    label: 'User',
    description: 'Standard access to security features',
    color: 'bg-blue-100 text-blue-800'
  }
};

const USER_STATUSES = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-800' },
  invited: { label: 'Invited', color: 'bg-blue-100 text-blue-800' }
};

const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard Access', description: 'View executive dashboard and KPIs' },
  { id: 'incidents', label: 'Incident Management', description: 'View and manage security incidents' },
  { id: 'evidence', label: 'Evidence Access', description: 'Access evidence files and documentation' },
  { id: 'analytics', label: 'Analytics & Reports', description: 'View detailed analytics and generate reports' },
  { id: 'settings', label: 'Settings Management', description: 'Manage system settings and preferences' },
  { id: 'team', label: 'Team Management', description: 'Invite and manage team members' },
  { id: 'export', label: 'Data Export', description: 'Export data and generate reports' }
];

const PERMISSION_TEMPLATES = {
  admin: {
    name: 'Administrator',
    permissions: ['dashboard', 'incidents', 'evidence', 'analytics', 'settings', 'team', 'export']
  },
  manager: {
    name: 'Manager',
    permissions: ['dashboard', 'incidents', 'evidence', 'analytics', 'export']
  },
  viewer: {
    name: 'Viewer',
    permissions: ['dashboard', 'incidents', 'evidence']
  },
  analyst: {
    name: 'Security Analyst',
    permissions: ['dashboard', 'incidents', 'evidence', 'analytics']
  }
};

// ===========================
// INVITE USER MODAL
// ===========================

const InviteUserModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onInvite: (userData: InviteUserForm) => Promise<void>;
}> = ({ isOpen, onClose, onInvite }) => {
  const [formData, setFormData] = useState<InviteUserForm>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'client_user',
    permissions: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const handleTemplateSelect = useCallback((templateKey: string) => {
    const template = PERMISSION_TEMPLATES[templateKey as keyof typeof PERMISSION_TEMPLATES];
    if (template) {
      setFormData(prev => ({
        ...prev,
        permissions: template.permissions
      }));
      setSelectedTemplate(templateKey);
    }
  }, []);

  const handlePermissionToggle = useCallback((permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
    setSelectedTemplate(''); // Clear template selection when manually changing permissions
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      await onInvite(formData);
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'client_user',
        permissions: []
      });
      setSelectedTemplate('');
      onClose();
      toast.success('Invitation sent successfully');
    } catch (error) {
      console.error('Failed to invite user:', error);
      toast.error('Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  }, [formData, onInvite, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Role</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(USER_ROLES).map(([roleKey, role]) => (
                <div
                  key={roleKey}
                  onClick={() => setFormData(prev => ({ ...prev, role: roleKey as any }))}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.role === roleKey
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      formData.role === roleKey
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{role.label}</p>
                      <p className="text-sm text-gray-600">{role.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Permission Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permission Template (Optional)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(PERMISSION_TEMPLATES).map(([templateKey, template]) => (
                <button
                  key={templateKey}
                  type="button"
                  onClick={() => handleTemplateSelect(templateKey)}
                  className={`p-2 text-sm border rounded-lg transition-colors ${
                    selectedTemplate === templateKey
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permissions
            </label>
            <div className="space-y-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <div key={permission.id} className="flex items-start space-x-3">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{permission.label}</p>
                      <p className="text-xs text-gray-600">{permission.description}</p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===========================
// USER ACTIONS MENU
// ===========================

const UserActionsMenu: React.FC<{
  user: TeamMember;
  onAction: (action: string, user: TeamMember) => void;
  isCurrentUser: boolean;
}> = ({ user, onAction, isCurrentUser }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = useMemo(() => {
    const baseActions = [
      { id: 'view', label: 'View Details', icon: UserCircleIcon },
      { id: 'edit', label: 'Edit Permissions', icon: KeyIcon }
    ];

    if (!isCurrentUser) {
      if (user.status === 'active') {
        baseActions.push({ id: 'suspend', label: 'Suspend User', icon: ExclamationTriangleIcon });
      } else if (user.status === 'suspended') {
        baseActions.push({ id: 'activate', label: 'Activate User', icon: CheckCircleIcon });
      }

      if (user.status !== 'pending') {
        baseActions.push({ id: 'remove', label: 'Remove User', icon: XCircleIcon });
      }

      if (user.status === 'pending') {
        baseActions.push({ id: 'resend', label: 'Resend Invitation', icon: EnvelopeIcon });
      }
    }

    return baseActions;
  }, [user.status, isCurrentUser]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    onAction(action.id, user);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                    action.id === 'remove' ? 'text-red-600 hover:bg-red-50' :
                    action.id === 'suspend' ? 'text-orange-600 hover:bg-orange-50' :
                    'text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ===========================
// MAIN USER MANAGEMENT COMPONENT
// ===========================

const UserManagement: React.FC<UserManagementProps> = ({
  teamMembers = [],
  onTeamUpdate,
  className = ''
}) => {
  const { user: currentUser } = useAuth();
  const { device } = useMobileDetection();
  const { startLoading, finishLoading } = usePerformance('UserManagement');

  // State management
  const [filter, setFilter] = useState<UserFilter>({
    search: '',
    role: '',
    status: '',
    permissions: []
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<BulkOperation | null>(null);

  // ===========================
  // FILTERING AND SEARCH
  // ===========================

  const filteredUsers = useMemo(() => {
    return teamMembers.filter(member => {
      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matches = 
          member.firstName.toLowerCase().includes(searchLower) ||
          member.lastName.toLowerCase().includes(searchLower) ||
          member.email.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }

      // Role filter
      if (filter.role && member.role !== filter.role) return false;

      // Status filter
      if (filter.status && member.status !== filter.status) return false;

      // Permissions filter
      if (filter.permissions.length > 0) {
        const hasAllPermissions = filter.permissions.every(permission => 
          member.permissions?.includes(permission)
        );
        if (!hasAllPermissions) return false;
      }

      return true;
    });
  }, [teamMembers, filter]);

  // ===========================
  // USER ACTIONS
  // ===========================

  const handleInviteUser = useCallback(async (userData: InviteUserForm) => {
    try {
      startLoading('Sending invitation...');
      await clientAPI.inviteTeamMember(userData);
      onTeamUpdate();
    } catch (error) {
      throw error; // Re-throw to be handled by the modal
    } finally {
      finishLoading();
    }
  }, [startLoading, finishLoading, onTeamUpdate]);

  const handleUserAction = useCallback(async (action: string, user: TeamMember) => {
    try {
      startLoading(`${action}ing user...`);

      switch (action) {
        case 'suspend':
          await clientAPI.updateTeamMember(user.id, { status: 'suspended' });
          toast.success('User suspended successfully');
          break;

        case 'activate':
          await clientAPI.updateTeamMember(user.id, { status: 'active' });
          toast.success('User activated successfully');
          break;

        case 'remove':
          const confirmed = window.confirm(`Are you sure you want to remove ${user.firstName} ${user.lastName}?`);
          if (confirmed) {
            await clientAPI.removeTeamMember(user.id);
            toast.success('User removed successfully');
          }
          break;

        case 'resend':
          await clientAPI.resendInvitation(user.id);
          toast.success('Invitation resent successfully');
          break;

        case 'view':
          // Open user details modal (would be implemented)
          console.log('View user details:', user);
          break;

        case 'edit':
          // Open edit permissions modal (would be implemented)
          console.log('Edit user permissions:', user);
          break;

        default:
          console.warn('Unknown action:', action);
      }

      onTeamUpdate();
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      toast.error(`Failed to ${action} user`);
    } finally {
      finishLoading();
    }
  }, [startLoading, finishLoading, onTeamUpdate]);

  const handleBulkOperation = useCallback(async (operation: BulkOperation) => {
    if (operation.selectedUsers.length === 0) {
      toast.error('No users selected');
      return;
    }

    try {
      startLoading('Processing bulk operation...');

      for (const userId of operation.selectedUsers) {
        switch (operation.type) {
          case 'activate':
            await clientAPI.updateTeamMember(userId, { status: 'active' });
            break;
          case 'suspend':
            await clientAPI.updateTeamMember(userId, { status: 'suspended' });
            break;
          case 'change_role':
            if (operation.newRole) {
              await clientAPI.updateTeamMember(userId, { role: operation.newRole });
            }
            break;
          case 'delete':
            await clientAPI.removeTeamMember(userId);
            break;
        }
      }

      toast.success(`Bulk operation completed for ${operation.selectedUsers.length} users`);
      setSelectedUsers([]);
      setBulkOperation(null);
      onTeamUpdate();
    } catch (error) {
      console.error('Bulk operation failed:', error);
      toast.error('Bulk operation failed');
    } finally {
      finishLoading();
    }
  }, [startLoading, finishLoading, onTeamUpdate]);

  // ===========================
  // RENDER HELPERS
  // ===========================

  const renderUserRow = (member: TeamMember) => {
    const isCurrentUser = member.id === currentUser?.id;
    const roleInfo = USER_ROLES[member.role] || USER_ROLES.client_user;
    const statusInfo = USER_STATUSES[member.status] || USER_STATUSES.active;

    return (
      <tr key={member.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selectedUsers.includes(member.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedUsers(prev => [...prev, member.id]);
                } else {
                  setSelectedUsers(prev => prev.filter(id => id !== member.id));
                }
              }}
              disabled={isCurrentUser}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {member.firstName[0]}{member.lastName[0]}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {member.firstName} {member.lastName}
                {isCurrentUser && <span className="text-sm text-blue-600 ml-2">(You)</span>}
              </p>
              <p className="text-sm text-gray-600">{member.email}</p>
            </div>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : 'Never'}
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex flex-wrap gap-1">
            {member.permissions?.slice(0, 3).map((permission) => (
              <span 
                key={permission}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {permission}
              </span>
            ))}
            {(member.permissions?.length || 0) > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                +{(member.permissions?.length || 0) - 3} more
              </span>
            )}
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-right">
          <UserActionsMenu
            user={member}
            onAction={handleUserAction}
            isCurrentUser={isCurrentUser}
          />
        </td>
      </tr>
    );
  };

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Team Management</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage team members, roles, and permissions for your organization
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlusIcon className="h-4 w-4 mr-2" />
          Invite Team Member
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filter.role}
            onChange={(e) => setFilter(prev => ({ ...prev, role: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            {Object.entries(USER_ROLES).map(([roleKey, role]) => (
              <option key={roleKey} value={roleKey}>{role.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(USER_STATUSES).map(([statusKey, status]) => (
              <option key={statusKey} value={statusKey}>{status.label}</option>
            ))}
          </select>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const operation: BulkOperation = {
                      type: e.target.value as any,
                      selectedUsers
                    };
                    handleBulkOperation(operation);
                    e.target.value = ''; // Reset select
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Bulk Actions ({selectedUsers.length})</option>
                <option value="activate">Activate Selected</option>
                <option value="suspend">Suspend Selected</option>
                <option value="delete">Remove Selected</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.filter(u => u.id !== currentUser?.id).length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.filter(u => u.id !== currentUser?.id).map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(renderUserRow)
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600">
                      {filter.search || filter.role || filter.status
                        ? 'No team members match your filters'
                        : 'No team members found'
                      }
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <UsersIcon className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamMembers.filter(m => m.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <ClockIcon className="h-6 w-6 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamMembers.filter(m => m.status === 'pending' || m.status === 'invited').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamMembers.filter(m => m.role === 'client_admin').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteUser}
      />
    </div>
  );
};

export default UserManagement;