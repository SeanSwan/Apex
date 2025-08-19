// backend/routes/client/v1/settings.mjs
/**
 * APEX AI - Settings Management API for Aegis Client Portal
 * =========================================================
 * 
 * Comprehensive settings management system for client portal users
 * including user preferences, notification settings, security options,
 * and system configuration.
 * 
 * Features:
 * - User profile and preference management
 * - Notification settings with granular controls
 * - Security settings and password management
 * - Multi-user team management for client organizations
 * - System preferences and customization options
 * - Audit logging for all setting changes
 * 
 * Security: Multi-tenant isolation with role-based access
 * Performance: Optimized queries with caching and validation
 */

import express from 'express';
import bcrypt from 'bcrypt';
import { authenticateClient, requirePermission, auditClientAction } from '../../../middleware/clientAuth.mjs';
import { 
  getClientUserProfile,
  updateClientUserProfile,
  getClientNotificationSettings,
  updateClientNotificationSettings,
  getClientTeamMembers,
  inviteClientTeamMember,
  updateClientTeamMember,
  removeClientTeamMember,
  getClientSecuritySettings,
  updateClientSecuritySettings,
  changeClientUserPassword,
  getClientSystemPreferences,
  updateClientSystemPreferences,
  logClientPortalActivity,
  validateClientEmail,
  checkClientPermissions
} from '../../../database.mjs';
import { rateLimit } from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// ===========================
// RATE LIMITING
// ===========================

const settingsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: {
    error: 'Too many settings requests',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordChangeLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 password changes per hour
  message: {
    error: 'Too many password change attempts',
    retryAfter: '1 hour'
  }
});

// ===========================
// USER PROFILE MANAGEMENT
// ===========================

/**
 * GET /api/client/v1/settings/profile
 * 
 * Get current user's profile information and preferences
 */
router.get('/profile',
  settingsRateLimit,
  authenticateClient,
  auditClientAction('profile_accessed'),
  async (req, res) => {
    try {
      const { clientId } = req.client;
      const userId = req.user.id;

      const profile = await getClientUserProfile(clientId, userId);

      await logClientPortalActivity(
        clientId,
        userId,
        'profile_viewed',
        'Accessed user profile settings'
      );

      res.json({
        success: true,
        data: {
          profile: {
            id: profile.id,
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            role: profile.role,
            permissions: profile.permissions,
            lastLogin: profile.lastLogin,
            createdAt: profile.createdAt,
            preferences: profile.preferences || {},
            settings: profile.settings || {}
          }
        }
      });

    } catch (error) {
      console.error('Profile retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user profile'
      });
    }
  }
);

/**
 * PUT /api/client/v1/settings/profile
 * 
 * Update current user's profile information
 */
router.put('/profile',
  settingsRateLimit,
  authenticateClient,
  [
    body('firstName').optional().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
    body('lastName').optional().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
    body('preferences').optional().isObject().withMessage('Preferences must be an object'),
    body('settings').optional().isObject().withMessage('Settings must be an object')
  ],
  auditClientAction('profile_update_attempted'),
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { clientId } = req.client;
      const userId = req.user.id;
      const {
        firstName,
        lastName,
        preferences = {},
        settings = {}
      } = req.body;

      // Update profile
      const updatedProfile = await updateClientUserProfile(clientId, userId, {
        firstName,
        lastName,
        preferences,
        settings
      });

      await logClientPortalActivity(
        clientId,
        userId,
        'profile_updated',
        'Updated user profile settings',
        { 
          changes: {
            firstName: firstName !== undefined,
            lastName: lastName !== undefined,
            preferences: Object.keys(preferences).length > 0,
            settings: Object.keys(settings).length > 0
          }
        }
      );

      res.json({
        success: true,
        data: {
          profile: updatedProfile,
          message: 'Profile updated successfully'
        }
      });

    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user profile'
      });
    }
  }
);

// ===========================
// NOTIFICATION SETTINGS
// ===========================

/**
 * GET /api/client/v1/settings/notifications
 * 
 * Get user's notification preferences and settings
 */
router.get('/notifications',
  settingsRateLimit,
  authenticateClient,
  auditClientAction('notification_settings_accessed'),
  async (req, res) => {
    try {
      const { clientId } = req.client;
      const userId = req.user.id;

      const notificationSettings = await getClientNotificationSettings(clientId, userId);

      res.json({
        success: true,
        data: {
          notifications: notificationSettings || {
            email: {
              enabled: true,
              incidents: {
                critical: true,
                high: true,
                medium: false,
                low: false
              },
              evidence: {
                newFiles: true,
                updates: false
              },
              system: {
                maintenance: true,
                updates: false,
                reports: true
              }
            },
            push: {
              enabled: false,
              incidents: {
                critical: true,
                high: false,
                medium: false,
                low: false
              }
            },
            sms: {
              enabled: false,
              incidents: {
                critical: false,
                high: false,
                medium: false,
                low: false
              }
            },
            preferences: {
              frequency: 'immediate', // immediate, hourly, daily
              quietHours: {
                enabled: false,
                start: '22:00',
                end: '08:00'
              },
              timezone: 'America/Los_Angeles'
            }
          }
        }
      });

    } catch (error) {
      console.error('Notification settings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve notification settings'
      });
    }
  }
);

/**
 * PUT /api/client/v1/settings/notifications
 * 
 * Update user's notification preferences
 */
router.put('/notifications',
  settingsRateLimit,
  authenticateClient,
  [
    body('email').optional().isObject().withMessage('Email settings must be an object'),
    body('push').optional().isObject().withMessage('Push settings must be an object'),
    body('sms').optional().isObject().withMessage('SMS settings must be an object'),
    body('preferences').optional().isObject().withMessage('Preferences must be an object')
  ],
  auditClientAction('notification_settings_update_attempted'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { clientId } = req.client;
      const userId = req.user.id;
      const notificationSettings = req.body;

      const updatedSettings = await updateClientNotificationSettings(
        clientId, 
        userId, 
        notificationSettings
      );

      await logClientPortalActivity(
        clientId,
        userId,
        'notification_settings_updated',
        'Updated notification preferences',
        { settingsChanged: Object.keys(notificationSettings) }
      );

      res.json({
        success: true,
        data: {
          notifications: updatedSettings,
          message: 'Notification settings updated successfully'
        }
      });

    } catch (error) {
      console.error('Notification update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update notification settings'
      });
    }
  }
);

// ===========================
// TEAM MANAGEMENT
// ===========================

/**
 * GET /api/client/v1/settings/team
 * 
 * Get team members for the client organization
 * Requires admin role for full access
 */
router.get('/team',
  settingsRateLimit,
  authenticateClient,
  requirePermission('settings'),
  auditClientAction('team_settings_accessed'),
  async (req, res) => {
    try {
      const { clientId } = req.client;
      const userId = req.user.id;

      // Check if user has admin role for full team access
      const isAdmin = req.user.role === 'client_admin';
      
      const teamMembers = await getClientTeamMembers(clientId, isAdmin ? null : userId);

      res.json({
        success: true,
        data: {
          teamMembers: teamMembers.map(member => ({
            id: member.id,
            email: member.email,
            firstName: member.firstName,
            lastName: member.lastName,
            role: member.role,
            permissions: member.permissions,
            status: member.status,
            lastLogin: member.lastLogin,
            createdAt: member.createdAt,
            ...(isAdmin && {
              invitedBy: member.invitedBy,
              inviteAcceptedAt: member.inviteAcceptedAt
            })
          })),
          canManageTeam: isAdmin,
          currentUser: userId
        }
      });

    } catch (error) {
      console.error('Team retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve team members'
      });
    }
  }
);

/**
 * POST /api/client/v1/settings/team/invite
 * 
 * Invite a new team member to the client organization
 * Requires admin role
 */
router.post('/team/invite',
  settingsRateLimit,
  authenticateClient,
  requirePermission('settings'),
  [
    body('email').isEmail().withMessage('Valid email address required'),
    body('firstName').isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
    body('lastName').isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
    body('role').isIn(['client_admin', 'client_user']).withMessage('Valid role required'),
    body('permissions').optional().isArray().withMessage('Permissions must be an array')
  ],
  auditClientAction('team_invite_attempted'),
  async (req, res) => {
    try {
      // Check admin role
      if (req.user.role !== 'client_admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin role required to invite team members'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { clientId } = req.client;
      const userId = req.user.id;
      const {
        email,
        firstName,
        lastName,
        role,
        permissions = []
      } = req.body;

      // Check if email already exists
      const existingUser = await validateClientEmail(email, clientId);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      const invitation = await inviteClientTeamMember(clientId, {
        email,
        firstName,
        lastName,
        role,
        permissions,
        invitedBy: userId
      });

      await logClientPortalActivity(
        clientId,
        userId,
        'team_member_invited',
        `Invited new team member: ${email}`,
        { email, role, permissions }
      );

      res.json({
        success: true,
        data: {
          invitation,
          message: 'Team member invited successfully'
        }
      });

    } catch (error) {
      console.error('Team invitation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to invite team member'
      });
    }
  }
);

/**
 * PUT /api/client/v1/settings/team/:memberId
 * 
 * Update team member role and permissions
 * Requires admin role
 */
router.put('/team/:memberId',
  settingsRateLimit,
  authenticateClient,
  requirePermission('settings'),
  [
    body('role').optional().isIn(['client_admin', 'client_user']).withMessage('Valid role required'),
    body('permissions').optional().isArray().withMessage('Permissions must be an array'),
    body('status').optional().isIn(['active', 'suspended']).withMessage('Valid status required')
  ],
  auditClientAction('team_member_update_attempted'),
  async (req, res) => {
    try {
      // Check admin role
      if (req.user.role !== 'client_admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin role required to update team members'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { clientId } = req.client;
      const userId = req.user.id;
      const { memberId } = req.params;
      const updates = req.body;

      // Prevent self-demotion from admin
      if (memberId === userId && updates.role === 'client_user') {
        return res.status(400).json({
          success: false,
          error: 'Cannot demote yourself from admin role'
        });
      }

      const updatedMember = await updateClientTeamMember(clientId, memberId, updates);

      await logClientPortalActivity(
        clientId,
        userId,
        'team_member_updated',
        `Updated team member: ${updatedMember.email}`,
        { memberId, updates: Object.keys(updates) }
      );

      res.json({
        success: true,
        data: {
          member: updatedMember,
          message: 'Team member updated successfully'
        }
      });

    } catch (error) {
      console.error('Team update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update team member'
      });
    }
  }
);

/**
 * DELETE /api/client/v1/settings/team/:memberId
 * 
 * Remove team member from the organization
 * Requires admin role
 */
router.delete('/team/:memberId',
  settingsRateLimit,
  authenticateClient,
  requirePermission('settings'),
  auditClientAction('team_member_removal_attempted'),
  async (req, res) => {
    try {
      // Check admin role
      if (req.user.role !== 'client_admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin role required to remove team members'
        });
      }

      const { clientId } = req.client;
      const userId = req.user.id;
      const { memberId } = req.params;

      // Prevent self-removal
      if (memberId === userId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot remove yourself from the team'
        });
      }

      const removedMember = await removeClientTeamMember(clientId, memberId);

      await logClientPortalActivity(
        clientId,
        userId,
        'team_member_removed',
        `Removed team member: ${removedMember.email}`,
        { memberId }
      );

      res.json({
        success: true,
        data: {
          message: 'Team member removed successfully'
        }
      });

    } catch (error) {
      console.error('Team removal error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove team member'
      });
    }
  }
);

// ===========================
// SECURITY SETTINGS
// ===========================

/**
 * GET /api/client/v1/settings/security
 * 
 * Get current user's security settings and preferences
 */
router.get('/security',
  settingsRateLimit,
  authenticateClient,
  auditClientAction('security_settings_accessed'),
  async (req, res) => {
    try {
      const { clientId } = req.client;
      const userId = req.user.id;

      const securitySettings = await getClientSecuritySettings(clientId, userId);

      res.json({
        success: true,
        data: {
          security: securitySettings || {
            sessionTimeout: 480, // 8 hours in minutes
            requirePasswordChange: false,
            twoFactorEnabled: false,
            loginNotifications: true,
            ipWhitelist: [],
            deviceTrust: {
              enabled: false,
              trustedDevices: []
            },
            passwordPolicy: {
              minimumLength: 8,
              requireNumbers: true,
              requireSymbols: true,
              requireUppercase: true,
              requireLowercase: true
            }
          }
        }
      });

    } catch (error) {
      console.error('Security settings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve security settings'
      });
    }
  }
);

/**
 * PUT /api/client/v1/settings/security
 * 
 * Update user's security settings
 */
router.put('/security',
  settingsRateLimit,
  authenticateClient,
  [
    body('sessionTimeout').optional().isInt({ min: 30, max: 1440 }).withMessage('Session timeout must be 30-1440 minutes'),
    body('loginNotifications').optional().isBoolean().withMessage('Login notifications must be boolean'),
    body('twoFactorEnabled').optional().isBoolean().withMessage('Two factor setting must be boolean')
  ],
  auditClientAction('security_settings_update_attempted'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { clientId } = req.client;
      const userId = req.user.id;
      const securityUpdates = req.body;

      const updatedSettings = await updateClientSecuritySettings(
        clientId, 
        userId, 
        securityUpdates
      );

      await logClientPortalActivity(
        clientId,
        userId,
        'security_settings_updated',
        'Updated security preferences',
        { settingsChanged: Object.keys(securityUpdates) }
      );

      res.json({
        success: true,
        data: {
          security: updatedSettings,
          message: 'Security settings updated successfully'
        }
      });

    } catch (error) {
      console.error('Security update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update security settings'
      });
    }
  }
);

/**
 * POST /api/client/v1/settings/change-password
 * 
 * Change user's password with current password verification
 */
router.post('/change-password',
  passwordChangeLimit,
  authenticateClient,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
  ],
  auditClientAction('password_change_attempted'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { clientId } = req.client;
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      const result = await changeClientUserPassword(
        clientId, 
        userId, 
        currentPassword, 
        newPassword
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error || 'Failed to change password'
        });
      }

      await logClientPortalActivity(
        clientId,
        userId,
        'password_changed',
        'Successfully changed account password'
      );

      res.json({
        success: true,
        data: {
          message: 'Password changed successfully'
        }
      });

    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  }
);

// ===========================
// SYSTEM PREFERENCES
// ===========================

/**
 * GET /api/client/v1/settings/preferences
 * 
 * Get system preferences and customization options
 */
router.get('/preferences',
  settingsRateLimit,
  authenticateClient,
  auditClientAction('system_preferences_accessed'),
  async (req, res) => {
    try {
      const { clientId } = req.client;
      const userId = req.user.id;

      const preferences = await getClientSystemPreferences(clientId, userId);

      res.json({
        success: true,
        data: {
          preferences: preferences || {
            theme: 'light', // light, dark, auto
            language: 'en',
            timezone: 'America/Los_Angeles',
            dateFormat: 'MM/dd/yyyy',
            timeFormat: '12h', // 12h, 24h
            dashboard: {
              defaultView: 'executive',
              refreshInterval: 30, // seconds
              autoRefresh: true,
              compactMode: false
            },
            incidents: {
              defaultFilter: 'all',
              pageSize: 25,
              defaultSort: 'createdAt',
              sortOrder: 'desc'
            },
            evidence: {
              viewMode: 'grid', // grid, list
              thumbnailSize: 'medium',
              autoPlay: false
            }
          }
        }
      });

    } catch (error) {
      console.error('Preferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve system preferences'
      });
    }
  }
);

/**
 * PUT /api/client/v1/settings/preferences
 * 
 * Update system preferences and customization options
 */
router.put('/preferences',
  settingsRateLimit,
  authenticateClient,
  [
    body('theme').optional().isIn(['light', 'dark', 'auto']).withMessage('Valid theme required'),
    body('language').optional().isLength({ min: 2, max: 5 }).withMessage('Valid language code required'),
    body('timezone').optional().isString().withMessage('Valid timezone required'),
    body('dateFormat').optional().isString().withMessage('Valid date format required'),
    body('timeFormat').optional().isIn(['12h', '24h']).withMessage('Valid time format required')
  ],
  auditClientAction('system_preferences_update_attempted'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { clientId } = req.client;
      const userId = req.user.id;
      const preferenceUpdates = req.body;

      const updatedPreferences = await updateClientSystemPreferences(
        clientId, 
        userId, 
        preferenceUpdates
      );

      await logClientPortalActivity(
        clientId,
        userId,
        'system_preferences_updated',
        'Updated system preferences',
        { preferencesChanged: Object.keys(preferenceUpdates) }
      );

      res.json({
        success: true,
        data: {
          preferences: updatedPreferences,
          message: 'System preferences updated successfully'
        }
      });

    } catch (error) {
      console.error('Preferences update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update system preferences'
      });
    }
  }
);

export default router;