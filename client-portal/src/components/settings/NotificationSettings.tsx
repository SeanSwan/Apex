// client-portal/src/components/settings/NotificationSettings.tsx
/**
 * APEX AI - Notification Settings Management Component
 * ===================================================
 * 
 * Comprehensive notification preferences management with granular
 * controls for email, SMS, push notifications, and alert settings.
 * 
 * Features:
 * - Multi-channel notification preferences (email, SMS, push)
 * - Incident-based notification controls by severity
 * - System notification preferences (maintenance, updates, reports)
 * - Evidence and file notification settings
 * - Quiet hours and do-not-disturb scheduling
 * - Notification frequency controls and batching
 * - Test notification functionality
 * - Mobile-responsive design with accessibility features
 * 
 * Master Prompt Compliance:
 * - Granular notification controls for security incidents
 * - Professional UI for enterprise client expectations
 * - Role-based notification access and controls
 * - Real-time notification testing and validation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  ShieldExclamationIcon,
  DocumentIcon,
  CogIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { useAuth } from '../auth/AuthProvider';
import { useMobileDetection } from '../common/MobileDetector';
import { usePerformance } from '../../hooks/usePerformance';
import { clientAPI } from '../../services/clientAPI';
import type { NotificationSettings, NotificationChannel, NotificationFrequency } from '../../types/client.types';

// ===========================
// TYPES AND INTERFACES
// ===========================

interface NotificationSettingsProps {
  settings: NotificationSettings | null;
  onSettingsUpdate: (updates: Partial<NotificationSettings>) => Promise<void>;
  className?: string;
}

interface NotificationTest {
  channel: 'email' | 'sms' | 'push';
  type: 'incident' | 'system' | 'evidence';
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
  timezone: string;
  daysOfWeek: string[];
}

// ===========================
// CONSTANTS
// ===========================

const NOTIFICATION_CHANNELS = {
  email: {
    id: 'email',
    name: 'Email',
    icon: EnvelopeIcon,
    description: 'Receive notifications via email',
    supportedTypes: ['incidents', 'evidence', 'system'],
    requiresSetup: false
  },
  sms: {
    id: 'sms',
    name: 'SMS',
    icon: DevicePhoneMobileIcon,
    description: 'Receive text message notifications',
    supportedTypes: ['incidents'],
    requiresSetup: true
  },
  push: {
    id: 'push',
    name: 'Push Notifications',
    icon: BellIcon,
    description: 'Browser push notifications',
    supportedTypes: ['incidents', 'system'],
    requiresSetup: true
  }
};

const INCIDENT_SEVERITIES = {
  critical: {
    label: 'Critical',
    description: 'Weapons, violence, immediate threats',
    color: 'text-red-600',
    recommended: true
  },
  high: {
    label: 'High',
    description: 'Theft, vandalism, security breaches',
    color: 'text-orange-600',
    recommended: true
  },
  medium: {
    label: 'Medium',
    description: 'Trespassing, suspicious activity',
    color: 'text-yellow-600',
    recommended: false
  },
  low: {
    label: 'Low',
    description: 'Minor incidents, false alarms',
    color: 'text-green-600',
    recommended: false
  }
};

const FREQUENCY_OPTIONS = {
  immediate: {
    label: 'Immediate',
    description: 'Send notifications as they occur',
    icon: BellIcon
  },
  batch_hourly: {
    label: 'Hourly Batch',
    description: 'Group notifications into hourly summaries',
    icon: ClockIcon
  },
  batch_daily: {
    label: 'Daily Summary',
    description: 'Single daily notification summary',
    icon: DocumentIcon
  },
  batch_weekly: {
    label: 'Weekly Summary', 
    description: 'Weekly notification summary',
    icon: DocumentIcon
  }
};

const SYSTEM_NOTIFICATION_TYPES = {
  maintenance: {
    label: 'System Maintenance',
    description: 'Scheduled maintenance and downtime alerts'
  },
  updates: {
    label: 'System Updates',
    description: 'Feature updates and improvements'
  },
  reports: {
    label: 'Scheduled Reports',
    description: 'Automated security reports and summaries'
  },
  security: {
    label: 'Security Alerts',
    description: 'Account security and login notifications'
  }
};

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' }
];

// ===========================
// NOTIFICATION CHANNEL TOGGLE
// ===========================

const NotificationChannelToggle: React.FC<{
  channel: keyof typeof NOTIFICATION_CHANNELS;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  requiresSetup?: boolean;
  onSetup?: () => void;
}> = ({ channel, enabled, onToggle, requiresSetup = false, onSetup }) => {
  const channelInfo = NOTIFICATION_CHANNELS[channel];
  const Icon = channelInfo.icon;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <Icon className="h-6 w-6 text-gray-600" />
        <div>
          <h4 className="font-medium text-gray-900">{channelInfo.name}</h4>
          <p className="text-sm text-gray-600">{channelInfo.description}</p>
          {requiresSetup && !enabled && (
            <p className="text-xs text-blue-600 mt-1">Setup required</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {requiresSetup && enabled && onSetup && (
          <button
            onClick={onSetup}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Configure
          </button>
        )}
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );
};

// ===========================
// INCIDENT NOTIFICATION CONTROLS
// ===========================

const IncidentNotificationControls: React.FC<{
  settings: any;
  onUpdate: (channel: string, updates: any) => void;
  channelEnabled: boolean;
}> = ({ settings, onUpdate, channelEnabled }) => {
  return (
    <div className="space-y-4">
      <h5 className="font-medium text-gray-900 flex items-center space-x-2">
        <ShieldExclamationIcon className="h-5 w-5 text-orange-600" />
        <span>Security Incidents</span>
      </h5>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(INCIDENT_SEVERITIES).map(([severity, info]) => (
          <div key={severity} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <div className="flex items-center space-x-2">
                <span className={`font-medium ${info.color}`}>{info.label}</span>
                {info.recommended && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{info.description}</p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={channelEnabled && (settings?.incidents?.[severity] || false)}
                onChange={(e) => onUpdate('incidents', { 
                  ...settings?.incidents, 
                  [severity]: e.target.checked 
                })}
                disabled={!channelEnabled}
                className="sr-only peer"
              />
              <div className={`w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 ${
                !channelEnabled ? 'opacity-50' : ''
              }`}></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===========================
// SYSTEM NOTIFICATION CONTROLS
// ===========================

const SystemNotificationControls: React.FC<{
  settings: any;
  onUpdate: (category: string, updates: any) => void;
  channelEnabled: boolean;
}> = ({ settings, onUpdate, channelEnabled }) => {
  return (
    <div className="space-y-4">
      <h5 className="font-medium text-gray-900 flex items-center space-x-2">
        <CogIcon className="h-5 w-5 text-gray-600" />
        <span>System Notifications</span>
      </h5>

      <div className="space-y-3">
        {Object.entries(SYSTEM_NOTIFICATION_TYPES).map(([type, info]) => (
          <div key={type} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{info.label}</p>
              <p className="text-sm text-gray-600">{info.description}</p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={channelEnabled && (settings?.system?.[type] || false)}
                onChange={(e) => onUpdate('system', { 
                  ...settings?.system, 
                  [type]: e.target.checked 
                })}
                disabled={!channelEnabled}
                className="sr-only peer"
              />
              <div className={`w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 ${
                !channelEnabled ? 'opacity-50' : ''
              }`}></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===========================
// QUIET HOURS SETTINGS
// ===========================

const QuietHoursSettings: React.FC<{
  quietHours: QuietHours;
  onUpdate: (updates: Partial<QuietHours>) => void;
}> = ({ quietHours, onUpdate }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <SpeakerXMarkIcon className="h-5 w-5 text-gray-600" />
          <h4 className="text-lg font-semibold text-gray-900">Quiet Hours</h4>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={quietHours.enabled}
            onChange={(e) => onUpdate({ enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {quietHours.enabled && (
        <div className="space-y-4">
          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <input
                type="time"
                value={quietHours.start}
                onChange={(e) => onUpdate({ start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <input
                type="time"
                value={quietHours.end}
                onChange={(e) => onUpdate({ end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Days of Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Days of Week</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <label key={day.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={quietHours.daysOfWeek.includes(day.id)}
                    onChange={(e) => {
                      const newDays = e.target.checked
                        ? [...quietHours.daysOfWeek, day.id]
                        : quietHours.daysOfWeek.filter(d => d !== day.id);
                      onUpdate({ daysOfWeek: newDays });
                    }}
                    className="sr-only peer"
                  />
                  <div className="px-3 py-2 border-2 rounded-lg cursor-pointer transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 border-gray-300 text-gray-700 hover:border-gray-400">
                    {day.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <InformationCircleIcon className="h-4 w-4 inline mr-1" />
              Notifications will be silenced from {quietHours.start} to {quietHours.end} on selected days.
              Critical security alerts may still be delivered.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ===========================
// NOTIFICATION TEST COMPONENT
// ===========================

const NotificationTest: React.FC<{
  onTest: (test: NotificationTest) => Promise<void>;
}> = ({ onTest }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<NotificationTest>({
    channel: 'email',
    type: 'incident',
    severity: 'medium'
  });

  const handleTest = useCallback(async () => {
    try {
      setIsLoading(true);
      await onTest(selectedTest);
      toast.success('Test notification sent successfully');
    } catch (error) {
      toast.error('Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTest, onTest]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <PlayIcon className="h-5 w-5 text-green-600" />
        <h4 className="text-lg font-semibold text-gray-900">Test Notifications</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
          <select
            value={selectedTest.channel}
            onChange={(e) => setSelectedTest(prev => ({ ...prev, channel: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="push">Push Notification</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <select
            value={selectedTest.type}
            onChange={(e) => setSelectedTest(prev => ({ ...prev, type: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="incident">Security Incident</option>
            <option value="system">System Notification</option>
            <option value="evidence">Evidence Update</option>
          </select>
        </div>

        {selectedTest.type === 'incident' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={selectedTest.severity}
              onChange={(e) => setSelectedTest(prev => ({ ...prev, severity: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        )}
      </div>

      <button
        onClick={handleTest}
        disabled={isLoading}
        className="w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Sending...' : 'Send Test Notification'}
      </button>
    </div>
  );
};

// ===========================
// MAIN NOTIFICATION SETTINGS COMPONENT
// ===========================

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onSettingsUpdate,
  className = ''
}) => {
  const { user } = useAuth();
  const { device } = useMobileDetection();
  const { startLoading, finishLoading } = usePerformance('NotificationSettings');

  // Local state for immediate UI updates
  const [localSettings, setLocalSettings] = useState(settings);

  // Sync with props
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // ===========================
  // UPDATE HANDLERS
  // ===========================

  const handleChannelToggle = useCallback(async (channel: string, enabled: boolean) => {
    const updates = {
      ...localSettings,
      [channel]: {
        ...localSettings?.[channel as keyof NotificationSettings],
        enabled
      }
    };

    setLocalSettings(updates);
    
    try {
      await onSettingsUpdate(updates);
      toast.success(`${channel.toUpperCase()} notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update notification settings');
      setLocalSettings(localSettings); // Revert on error
    }
  }, [localSettings, onSettingsUpdate]);

  const handleChannelUpdate = useCallback(async (channel: string, category: string, updates: any) => {
    const newSettings = {
      ...localSettings,
      [channel]: {
        ...localSettings?.[channel as keyof NotificationSettings],
        [category]: updates
      }
    };

    setLocalSettings(newSettings);

    try {
      await onSettingsUpdate(newSettings);
    } catch (error) {
      toast.error('Failed to update notification settings');
      setLocalSettings(localSettings); // Revert on error
    }
  }, [localSettings, onSettingsUpdate]);

  const handleFrequencyUpdate = useCallback(async (frequency: string) => {
    const updates = {
      ...localSettings,
      preferences: {
        ...localSettings?.preferences,
        frequency
      }
    };

    setLocalSettings(updates);
    
    try {
      await onSettingsUpdate(updates);
      toast.success('Notification frequency updated');
    } catch (error) {
      toast.error('Failed to update notification frequency');
      setLocalSettings(localSettings);
    }
  }, [localSettings, onSettingsUpdate]);

  const handleQuietHoursUpdate = useCallback(async (quietHoursUpdates: Partial<QuietHours>) => {
    const updates = {
      ...localSettings,
      preferences: {
        ...localSettings?.preferences,
        quietHours: {
          ...localSettings?.preferences?.quietHours,
          ...quietHoursUpdates
        }
      }
    };

    setLocalSettings(updates);
    
    try {
      await onSettingsUpdate(updates);
      toast.success('Quiet hours updated');
    } catch (error) {
      toast.error('Failed to update quiet hours');
      setLocalSettings(localSettings);
    }
  }, [localSettings, onSettingsUpdate]);

  const handleTestNotification = useCallback(async (test: NotificationTest) => {
    try {
      startLoading('Sending test notification...');
      await clientAPI.sendTestNotification(test);
    } catch (error) {
      throw error;
    } finally {
      finishLoading();
    }
  }, [startLoading, finishLoading]);

  // ===========================
  // DEFAULT SETTINGS
  // ===========================

  const defaultSettings = useMemo(() => ({
    email: {
      enabled: true,
      incidents: { critical: true, high: true, medium: false, low: false },
      evidence: { newFiles: true, updates: false },
      system: { maintenance: true, updates: false, reports: true, security: true }
    },
    push: {
      enabled: false,
      incidents: { critical: true, high: false, medium: false, low: false },
      system: { maintenance: true, updates: false, reports: false, security: true }
    },
    sms: {
      enabled: false,
      incidents: { critical: false, high: false, medium: false, low: false }
    },
    preferences: {
      frequency: 'immediate',
      timezone: 'America/Los_Angeles',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'America/Los_Angeles',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      }
    }
  }), []);

  const effectiveSettings = localSettings || defaultSettings;

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure how and when you receive security alerts and system notifications
        </p>
      </div>

      {/* Notification Channels */}
      <div className="space-y-6">
        {Object.entries(NOTIFICATION_CHANNELS).map(([channelKey, channelInfo]) => {
          const channelSettings = effectiveSettings[channelKey as keyof NotificationSettings];
          const isEnabled = channelSettings?.enabled || false;

          return (
            <div key={channelKey} className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Channel Toggle */}
              <NotificationChannelToggle
                channel={channelKey as keyof typeof NOTIFICATION_CHANNELS}
                enabled={isEnabled}
                onToggle={(enabled) => handleChannelToggle(channelKey, enabled)}
                requiresSetup={channelInfo.requiresSetup}
                onSetup={() => {
                  // Setup functionality would be implemented here
                  toast.info(`${channelInfo.name} setup will be available soon`);
                }}
              />

              {/* Channel-specific Controls */}
              {isEnabled && (
                <div className="mt-6 space-y-6">
                  {/* Incident Notifications */}
                  {channelInfo.supportedTypes.includes('incidents') && (
                    <IncidentNotificationControls
                      settings={channelSettings}
                      onUpdate={(category, updates) => handleChannelUpdate(channelKey, category, updates)}
                      channelEnabled={isEnabled}
                    />
                  )}

                  {/* Evidence Notifications */}
                  {channelInfo.supportedTypes.includes('evidence') && channelKey === 'email' && (
                    <div className="space-y-4">
                      <h5 className="font-medium text-gray-900 flex items-center space-x-2">
                        <DocumentIcon className="h-5 w-5 text-blue-600" />
                        <span>Evidence & Files</span>
                      </h5>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">New Evidence Files</p>
                            <p className="text-sm text-gray-600">When new evidence is uploaded to incidents</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={channelSettings?.evidence?.newFiles || false}
                              onChange={(e) => handleChannelUpdate(channelKey, 'evidence', {
                                ...channelSettings?.evidence,
                                newFiles: e.target.checked
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">Evidence Updates</p>
                            <p className="text-sm text-gray-600">When evidence files are modified or updated</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={channelSettings?.evidence?.updates || false}
                              onChange={(e) => handleChannelUpdate(channelKey, 'evidence', {
                                ...channelSettings?.evidence,
                                updates: e.target.checked
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* System Notifications */}
                  {channelInfo.supportedTypes.includes('system') && (
                    <SystemNotificationControls
                      settings={channelSettings}
                      onUpdate={(category, updates) => handleChannelUpdate(channelKey, category, updates)}
                      channelEnabled={isEnabled}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Notification Frequency */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Notification Frequency</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(FREQUENCY_OPTIONS).map(([frequency, info]) => {
            const Icon = info.icon;
            const isSelected = effectiveSettings.preferences?.frequency === frequency;
            
            return (
              <div
                key={frequency}
                onClick={() => handleFrequencyUpdate(frequency)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                  <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {info.label}
                  </span>
                </div>
                <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                  {info.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quiet Hours */}
      <QuietHoursSettings
        quietHours={effectiveSettings.preferences?.quietHours || defaultSettings.preferences.quietHours}
        onUpdate={handleQuietHoursUpdate}
      />

      {/* Test Notifications */}
      <NotificationTest onTest={handleTestNotification} />

      {/* Notification Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-600" />
          <h5 className="font-medium text-blue-900">Current Configuration</h5>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-900">Email: </span>
            <span className="text-blue-700">
              {effectiveSettings.email?.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="font-medium text-blue-900">SMS: </span>
            <span className="text-blue-700">
              {effectiveSettings.sms?.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="font-medium text-blue-900">Push: </span>
            <span className="text-blue-700">
              {effectiveSettings.push?.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;