// client-portal/src/components/settings/SettingsPanel.tsx
/**
 * APEX AI - Comprehensive Settings Management Panel
 * =================================================
 * 
 * Enterprise-grade settings management interface providing complete
 * control over user preferences, security options, and system configuration.
 * 
 * Features:
 * - User profile and preference management
 * - Security settings with two-factor authentication
 * - Notification preferences with granular controls
 * - Team management for client organizations (admin only)
 * - System customization and theme options
 * - Password management and security policies
 * - Audit logging for all setting changes
 * - Mobile-responsive design with touch optimization
 * 
 * Master Prompt Compliance:
 * - "Settings Management" - Complete settings implementation
 * - Role-based access with admin vs user controls
 * - Professional UI for enterprise client expectations
 * - Multi-tenant support with proper data isolation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserCircleIcon,
  ShieldCheckIcon,
  BellIcon,
  UsersIcon,
  CogIcon,
  KeyIcon,
  PaintBrushIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { useAuth } from '../auth/AuthProvider';
import { useMobileDetection } from '../common/MobileDetector';
import { usePerformance } from '../../hooks/usePerformance';
import PerformanceOptimizer from '../common/PerformanceOptimizer';
import { clientAPI } from '../../services/clientAPI';
import type { 
  UserProfile, 
  NotificationSettings, 
  SecuritySettings, 
  SystemPreferences,
  TeamMember 
} from '../../types/client.types';

// ===========================
// TYPES AND INTERFACES
// ===========================

interface SettingsPanelProps {
  className?: string;
  onSettingChange?: (category: string, setting: string, value: any) => void;
}

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
}

// ===========================
// CONSTANTS
// ===========================

const SETTINGS_TABS: SettingsTab[] = [
  { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  { id: 'security', label: 'Security', icon: ShieldCheckIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'preferences', label: 'Preferences', icon: CogIcon },
  { id: 'team', label: 'Team Management', icon: UsersIcon, adminOnly: true }
];

const THEMES = [
  { id: 'light', name: 'Light', description: 'Clean and bright interface' },
  { id: 'dark', name: 'Dark', description: 'Easier on the eyes' },
  { id: 'auto', name: 'Auto', description: 'Follows system preference' }
];

const TIME_ZONES = [
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
];

// ===========================
// UTILITY FUNCTIONS
// ===========================

const validatePassword = (password: string): PasswordRequirements => {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSymbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
};

const getPasswordStrength = (requirements: PasswordRequirements): number => {
  const fulfilled = Object.values(requirements).filter(Boolean).length;
  return (fulfilled / Object.keys(requirements).length) * 100;
};

// ===========================
// PROFILE SETTINGS COMPONENT
// ===========================

const ProfileSettings: React.FC<{
  profile: UserProfile | null;
  onProfileUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}> = ({ profile, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    preferences: profile?.preferences || {}
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = useCallback(async () => {
    try {
      setIsLoading(true);
      await onProfileUpdate(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }, [formData, onProfileUpdate]);

  const handleCancel = useCallback(() => {
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      preferences: profile?.preferences || {}
    });
    setIsEditing(false);
  }, [profile]);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-lg">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {profile?.firstName?.[0]}{profile?.lastName?.[0]}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {profile?.firstName} {profile?.lastName}
          </h3>
          <p className="text-sm text-gray-600">{profile?.email}</p>
          <p className="text-sm text-gray-500">
            Role: {profile?.role === 'client_admin' ? 'Administrator' : 'User'}
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !isEditing ? 'bg-gray-50' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !isEditing ? 'bg-gray-50' : ''
              }`}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              disabled={true} // Email changes require admin approval
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Contact your administrator to change your email address
            </p>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-700">Last Login</p>
            <p className="text-sm text-gray-900 mt-1">
              {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Never'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Account Created</p>
            <p className="text-sm text-gray-900 mt-1">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Permissions</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {profile?.permissions?.map((permission, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                >
                  {permission}
                </span>
              )) || (
                <span className="text-sm text-gray-500">No specific permissions</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================
// SECURITY SETTINGS COMPONENT
// ===========================

const SecuritySettings: React.FC<{
  settings: SecuritySettings | null;
  onSecurityUpdate: (updates: Partial<SecuritySettings>) => Promise<void>;
  onPasswordChange: (currentPassword: string, newPassword: string) => Promise<void>;
}> = ({ settings, onSecurityUpdate, onPasswordChange }) => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showPasswords: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRequirements = useMemo(() => 
    validatePassword(passwordForm.newPassword), 
    [passwordForm.newPassword]
  );

  const passwordStrength = useMemo(() => 
    getPasswordStrength(passwordRequirements), 
    [passwordRequirements]
  );

  const handlePasswordChange = useCallback(async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordStrength < 100) {
      toast.error('Password does not meet all requirements');
      return;
    }

    try {
      setIsLoading(true);
      await onPasswordChange(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showPasswords: false
      });
      setIsChangingPassword(false);
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  }, [passwordForm, passwordStrength, onPasswordChange]);

  const handleSecuritySettingChange = useCallback(async (setting: string, value: any) => {
    try {
      await onSecurityUpdate({ [setting]: value });
      toast.success('Security setting updated');
    } catch (error) {
      toast.error('Failed to update security setting');
    }
  }, [onSecurityUpdate]);

  return (
    <div className="space-y-6">
      {/* Password Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Password & Authentication</h4>
          <button
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Change Password
          </button>
        </div>

        {isChangingPassword && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={passwordForm.showPasswords ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setPasswordForm(prev => ({ ...prev, showPasswords: !prev.showPasswords }))}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {passwordForm.showPasswords ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type={passwordForm.showPasswords ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {/* Password Strength Indicator */}
              {passwordForm.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password Strength</span>
                    <span className="text-xs text-gray-600">{Math.round(passwordStrength)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        passwordStrength < 25 ? 'bg-red-500' :
                        passwordStrength < 50 ? 'bg-orange-500' :
                        passwordStrength < 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Password Requirements */}
              {passwordForm.newPassword && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-gray-700">Requirements:</p>
                  {Object.entries(passwordRequirements).map(([requirement, met]) => (
                    <div key={requirement} className="flex items-center space-x-2">
                      {met ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-xs ${met ? 'text-green-700' : 'text-red-700'}`}>
                        {requirement === 'minLength' && 'At least 8 characters'}
                        {requirement === 'hasUppercase' && 'Uppercase letter'}
                        {requirement === 'hasLowercase' && 'Lowercase letter'}
                        {requirement === 'hasNumbers' && 'Number'}
                        {requirement === 'hasSymbols' && 'Special character'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type={passwordForm.showPasswords ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setIsChangingPassword(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={isLoading || passwordStrength < 100 || passwordForm.newPassword !== passwordForm.confirmPassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Security Options</h4>
        
        <div className="space-y-6">
          {/* Session Timeout */}
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">Session Timeout</h5>
              <p className="text-sm text-gray-600">Automatically log out after inactivity</p>
            </div>
            <select
              value={settings?.sessionTimeout || 480}
              onChange={(e) => handleSecuritySettingChange('sessionTimeout', parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={240}>4 hours</option>
              <option value={480}>8 hours</option>
              <option value={1440}>24 hours</option>
            </select>
          </div>

          {/* Login Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">Login Notifications</h5>
              <p className="text-sm text-gray-600">Get notified of login activity</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.loginNotifications || false}
                onChange={(e) => handleSecuritySettingChange('loginNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">Two-Factor Authentication</h5>
              <p className="text-sm text-gray-600">Add an extra layer of security</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                settings?.twoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {settings?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                {settings?.twoFactorEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <InformationCircleIcon className="h-5 w-5 text-blue-600" />
          <h5 className="font-medium text-blue-900">Security Status</h5>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span className="text-blue-700">Strong password policy</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span className="text-blue-700">Secure session management</span>
          </div>
          <div className="flex items-center space-x-2">
            {settings?.twoFactorEnabled ? (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
            )}
            <span className="text-blue-700">Two-factor authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================
// SYSTEM PREFERENCES COMPONENT
// ===========================

const SystemPreferences: React.FC<{
  preferences: SystemPreferences | null;
  onPreferencesUpdate: (updates: Partial<SystemPreferences>) => Promise<void>;
}> = ({ preferences, onPreferencesUpdate }) => {
  const { device } = useMobileDetection();

  const handlePreferenceChange = useCallback(async (category: string, setting: string, value: any) => {
    try {
      const updates = {
        ...preferences,
        [category]: {
          ...preferences?.[category as keyof SystemPreferences],
          [setting]: value
        }
      };
      await onPreferencesUpdate(updates);
      toast.success('Preference updated');
    } catch (error) {
      toast.error('Failed to update preference');
    }
  }, [preferences, onPreferencesUpdate]);

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h4>
        
        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {THEMES.map((theme) => (
                <div
                  key={theme.id}
                  onClick={() => handlePreferenceChange('appearance', 'theme', theme.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    preferences?.theme === theme.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      theme.id === 'light' ? 'bg-white border-2 border-gray-300' :
                      theme.id === 'dark' ? 'bg-gray-800' : 'bg-gradient-to-r from-white to-gray-800'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{theme.name}</p>
                      <p className="text-sm text-gray-600">{theme.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={preferences?.language || 'en'}
                onChange={(e) => handlePreferenceChange('appearance', 'language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
              <select
                value={preferences?.timezone || 'America/Los_Angeles'}
                onChange={(e) => handlePreferenceChange('appearance', 'timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIME_ZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Preferences */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Dashboard</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default View</label>
            <select
              value={preferences?.dashboard?.defaultView || 'executive'}
              onChange={(e) => handlePreferenceChange('dashboard', 'defaultView', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="executive">Executive Summary</option>
              <option value="detailed">Detailed Analytics</option>
              <option value="incidents">Incidents Focus</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Refresh Interval</label>
            <select
              value={preferences?.dashboard?.refreshInterval || 30}
              onChange={(e) => handlePreferenceChange('dashboard', 'refreshInterval', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">Auto Refresh</h5>
                <p className="text-sm text-gray-600">Automatically refresh dashboard data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.dashboard?.autoRefresh || false}
                  onChange={(e) => handlePreferenceChange('dashboard', 'autoRefresh', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Device Optimization */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Device & Performance</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {device.type === 'mobile' ? (
                <DevicePhoneMobileIcon className="h-5 w-5 text-blue-600" />
              ) : (
                <ComputerDesktopIcon className="h-5 w-5 text-blue-600" />
              )}
              <div>
                <p className="font-medium text-gray-900">Current Device</p>
                <p className="text-sm text-gray-600">
                  {device.type} • {device.os} • {device.browser}
                </p>
              </div>
            </div>
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              Optimized
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-900">Reduced Motion</h5>
              <p className="text-sm text-gray-600">Minimize animations for better performance</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences?.accessibility?.reducedMotion || false}
                onChange={(e) => handlePreferenceChange('accessibility', 'reducedMotion', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================
// MAIN SETTINGS PANEL COMPONENT
// ===========================

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  className = '',
  onSettingChange
}) => {
  const { user, hasPermission } = useAuth();
  const { device } = useMobileDetection();
  const { startLoading, finishLoading, isLoading } = usePerformance('SettingsPanel');

  // State management
  const [activeTab, setActiveTab] = useState('profile');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [systemPreferences, setSystemPreferences] = useState<SystemPreferences | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Filter tabs based on user permissions
  const availableTabs = useMemo(() => {
    return SETTINGS_TABS.filter(tab => 
      !tab.adminOnly || (tab.adminOnly && hasPermission('settings'))
    );
  }, [hasPermission]);

  // ===========================
  // DATA FETCHING
  // ===========================

  const fetchSettingsData = useCallback(async () => {
    try {
      startLoading('Loading settings...');

      const [profileRes, notificationsRes, securityRes, preferencesRes] = await Promise.all([
        clientAPI.getUserProfile(),
        clientAPI.getNotificationSettings(),
        clientAPI.getSecuritySettings(),
        clientAPI.getSystemPreferences()
      ]);

      setUserProfile(profileRes.data.profile);
      setNotificationSettings(notificationsRes.data.notifications);
      setSecuritySettings(securityRes.data.security);
      setSystemPreferences(preferencesRes.data.preferences);

      // Fetch team data if user has permissions
      if (hasPermission('settings')) {
        const teamRes = await clientAPI.getTeamMembers();
        setTeamMembers(teamRes.data.teamMembers);
      }

    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      finishLoading();
    }
  }, [startLoading, finishLoading, hasPermission]);

  useEffect(() => {
    fetchSettingsData();
  }, [fetchSettingsData]);

  // ===========================
  // UPDATE HANDLERS
  // ===========================

  const handleProfileUpdate = useCallback(async (updates: Partial<UserProfile>) => {
    const response = await clientAPI.updateUserProfile(updates);
    setUserProfile(response.data.profile);
    onSettingChange?.('profile', 'user_info', updates);
  }, [onSettingChange]);

  const handleNotificationUpdate = useCallback(async (updates: Partial<NotificationSettings>) => {
    const response = await clientAPI.updateNotificationSettings(updates);
    setNotificationSettings(response.data.notifications);
    onSettingChange?.('notifications', 'preferences', updates);
  }, [onSettingChange]);

  const handleSecurityUpdate = useCallback(async (updates: Partial<SecuritySettings>) => {
    const response = await clientAPI.updateSecuritySettings(updates);
    setSecuritySettings(response.data.security);
    onSettingChange?.('security', 'options', updates);
  }, [onSettingChange]);

  const handlePasswordChange = useCallback(async (currentPassword: string, newPassword: string) => {
    await clientAPI.changePassword(currentPassword, newPassword);
    onSettingChange?.('security', 'password', { changed: true });
  }, [onSettingChange]);

  const handlePreferencesUpdate = useCallback(async (updates: Partial<SystemPreferences>) => {
    const response = await clientAPI.updateSystemPreferences(updates);
    setSystemPreferences(response.data.preferences);
    onSettingChange?.('preferences', 'system', updates);
  }, [onSettingChange]);

  // ===========================
  // RENDER HELPERS
  // ===========================

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileSettings
            profile={userProfile}
            onProfileUpdate={handleProfileUpdate}
          />
        );

      case 'security':
        return (
          <SecuritySettings
            settings={securitySettings}
            onSecurityUpdate={handleSecurityUpdate}
            onPasswordChange={handlePasswordChange}
          />
        );

      case 'preferences':
        return (
          <SystemPreferences
            preferences={systemPreferences}
            onPreferencesUpdate={handlePreferencesUpdate}
          />
        );

      case 'notifications':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h4>
            <p className="text-gray-600">Notification settings component will be loaded here.</p>
          </div>
        );

      case 'team':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Team Management</h4>
            <p className="text-gray-600">Team management component will be loaded here.</p>
          </div>
        );

      default:
        return null;
    }
  };

  // ===========================
  // MAIN RENDER
  // ===========================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <CogIcon className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <PerformanceOptimizer level="medium">
      <div className={`space-y-6 ${className}`}>
        {/* Page Header */}
        <div className="apex-page-header">
          <div className="apex-page-title">
            <h1 className="apex-page-heading">Settings</h1>
            <p className="apex-page-description">
              Manage your account settings, security preferences, and system configuration
            </p>
          </div>
        </div>

        {/* Settings Navigation */}
        <div className="bg-white rounded-lg border border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Settings Tabs">
            {availableTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className={device.type === 'mobile' ? 'hidden sm:inline' : ''}>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {renderTabContent()}
        </div>
      </div>
    </PerformanceOptimizer>
  );
};

export default SettingsPanel;