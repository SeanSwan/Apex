/**
 * APEX AI SECURITY PLATFORM - PUSH NOTIFICATION SERVICE
 * ======================================================
 * Firebase FCM and APNs integration for guard mobile apps
 */

import admin from 'firebase-admin';
import apn from 'apn';
import axios from 'axios';

class PushNotificationService {
  constructor() {
    this.fcm = null;
    this.apns = null;
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      // Initialize Firebase Admin SDK
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        });
        
        this.fcm = admin.messaging();
        console.log('✅ Firebase FCM initialized');
      }

      // Initialize Apple Push Notification service
      if (process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID) {
        this.apns = new apn.Provider({
          token: {
            key: process.env.APNS_PRIVATE_KEY,
            keyId: process.env.APNS_KEY_ID,
            teamId: process.env.APNS_TEAM_ID
          },
          production: process.env.NODE_ENV === 'production'
        });
        console.log('✅ Apple Push Notifications initialized');
      }

      this.initialized = true;
      
    } catch (error) {
      console.error('Push notification service initialization error:', error);
      this.initialized = false;
    }
  }

  /**
   * Send push notification to guard
   * @param {string} guardId - Target guard ID
   * @param {Object} notification - Notification data
   * @param {Array} deviceTokens - Device tokens for the guard
   */
  async sendToGuard(guardId, notification, deviceTokens) {
    if (!this.initialized) {
      console.warn('Push notification service not initialized');
      return { success: false, error: 'Service not initialized' };
    }

    const results = {
      android_sent: 0,
      ios_sent: 0,
      failed: 0,
      errors: []
    };

    // Send to Android devices (Firebase FCM)
    const androidTokens = deviceTokens.filter(token => token.platform === 'android');
    if (androidTokens.length > 0 && this.fcm) {
      try {
        const androidResult = await this.sendAndroidNotification(androidTokens.map(t => t.token), notification);
        results.android_sent = androidResult.successCount;
        results.failed += androidResult.failureCount;
      } catch (error) {
        console.error('Android notification error:', error);
        results.errors.push({ platform: 'android', error: error.message });
      }
    }

    // Send to iOS devices (APNs)
    const iosTokens = deviceTokens.filter(token => token.platform === 'ios');
    if (iosTokens.length > 0 && this.apns) {
      try {
        const iosResult = await this.sendIOSNotification(iosTokens.map(t => t.token), notification);
        results.ios_sent = iosResult.sent.length;
        results.failed += iosResult.failed.length;
        if (iosResult.failed.length > 0) {
          results.errors.push({ platform: 'ios', failures: iosResult.failed });
        }
      } catch (error) {
        console.error('iOS notification error:', error);
        results.errors.push({ platform: 'ios', error: error.message });
      }
    }

    // Log notification attempt
    console.log(`📱 Push notification sent to guard ${guardId}: ${results.android_sent + results.ios_sent} successful, ${results.failed} failed`);

    return {
      success: (results.android_sent + results.ios_sent) > 0,
      ...results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send Android notification via Firebase FCM
   */
  async sendAndroidNotification(tokens, notification) {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        alert_id: notification.data?.alert_id || '',
        priority: notification.data?.priority || 'normal',
        action_required: notification.data?.action_required || '',
        timestamp: new Date().toISOString(),
        ...notification.data
      },
      android: {
        notification: {
          priority: notification.priority === 'emergency' ? 'high' : 'normal',
          sound: notification.priority === 'emergency' ? 'emergency_alert' : 'default',
          channel_id: this.getAndroidChannelId(notification.priority),
          color: this.getNotificationColor(notification.priority)
        },
        priority: notification.priority === 'emergency' ? 'high' : 'normal'
      },
      tokens: tokens
    };

    try {
      const response = await this.fcm.sendMulticast(message);
      return response;
    } catch (error) {
      console.error('FCM send error:', error);
      throw error;
    }
  }

  /**
   * Send iOS notification via APNs
   */
  async sendIOSNotification(tokens, notification) {
    const apnNotification = new apn.Notification({
      alert: {
        title: notification.title,
        body: notification.body
      },
      badge: 1,
      sound: notification.priority === 'emergency' ? 'emergency_alert.caf' : 'default',
      priority: notification.priority === 'emergency' ? 10 : 5,
      category: this.getIOSCategory(notification.data?.action_required),
      payload: {
        alert_id: notification.data?.alert_id || '',
        priority: notification.data?.priority || 'normal',
        timestamp: new Date().toISOString(),
        ...notification.data
      }
    });

    apnNotification.topic = process.env.IOS_BUNDLE_ID || 'com.apex.guard.app';

    try {
      const results = await this.apns.send(apnNotification, tokens);
      return results;
    } catch (error) {
      console.error('APNs send error:', error);
      throw error;
    }
  }

  /**
   * Send emergency alert to all available guards
   */
  async sendEmergencyBroadcast(notification, excludeGuardIds = []) {
    try {
      // This would query the database for all active guard device tokens
      // For now, using mock implementation
      
      console.log('🚨 EMERGENCY BROADCAST:', notification.title);
      
      // Mock implementation - replace with actual database query
      const mockGuardTokens = [
        { guard_id: 'guard_001', tokens: [{ token: 'mock_token_1', platform: 'android' }] },
        { guard_id: 'guard_002', tokens: [{ token: 'mock_token_2', platform: 'ios' }] }
      ];

      const results = [];
      
      for (const guard of mockGuardTokens) {
        if (!excludeGuardIds.includes(guard.guard_id)) {
          const result = await this.sendToGuard(guard.guard_id, notification, guard.tokens);
          results.push({ guard_id: guard.guard_id, ...result });
        }
      }

      return {
        success: true,
        broadcast_results: results,
        total_guards_notified: results.filter(r => r.success).length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Emergency broadcast error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Send scheduled reminder notifications
   */
  async sendScheduledReminders() {
    const reminders = [
      {
        type: 'shift_start',
        title: 'Shift Starting Soon',
        body: 'Your shift starts in 15 minutes. Please prepare to clock in.',
        data: { action_required: 'clock_in' }
      },
      {
        type: 'patrol_due',
        title: 'Patrol Round Due',
        body: 'Time for your scheduled patrol round.',
        data: { action_required: 'start_patrol' }
      },
      {
        type: 'incident_follow_up',
        title: 'Incident Follow-up Required',
        body: 'Please submit final report for recent incident.',
        data: { action_required: 'submit_report' }
      }
    ];

    // Implementation would check database for scheduled reminders
    console.log('📅 Scheduled reminder check completed');
    
    return {
      success: true,
      reminders_sent: 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get Android notification channel ID based on priority
   */
  getAndroidChannelId(priority) {
    switch (priority) {
      case 'emergency': return 'emergency_alerts';
      case 'high': return 'high_priority_alerts';
      case 'normal': return 'general_notifications';
      default: return 'default_channel';
    }
  }

  /**
   * Get notification color based on priority
   */
  getNotificationColor(priority) {
    switch (priority) {
      case 'emergency': return '#FF0000';
      case 'high': return '#FF8C00';
      case 'normal': return '#4CAF50';
      default: return '#2196F3';
    }
  }

  /**
   * Get iOS notification category for interactive notifications
   */
  getIOSCategory(actionRequired) {
    switch (actionRequired) {
      case 'respond_to_alert': return 'ALERT_RESPONSE';
      case 'clock_in': return 'SHIFT_MANAGEMENT';
      case 'submit_report': return 'INCIDENT_REPORT';
      default: return 'GENERAL_NOTIFICATION';
    }
  }

  /**
   * Register device token for a guard
   */
  async registerDeviceToken(guardId, deviceToken, platform, appVersion) {
    try {
      // This would store in database - mock implementation for now
      console.log(`📱 Device registered for guard ${guardId}: ${platform} device`);
      
      return {
        success: true,
        guard_id: guardId,
        platform: platform,
        registered_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Device registration error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove device token (when guard logs out or uninstalls app)
   */
  async removeDeviceToken(guardId, deviceToken) {
    try {
      // This would remove from database - mock implementation for now
      console.log(`📱 Device token removed for guard ${guardId}`);
      
      return {
        success: true,
        guard_id: guardId,
        removed_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Device token removal error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get service health status
   */
  async getServiceHealth() {
    return {
      fcm_initialized: !!this.fcm,
      apns_initialized: !!this.apns,
      service_status: this.initialized ? 'healthy' : 'error',
      last_check: new Date().toISOString()
    };
  }
}

export default new PushNotificationService();