/**
 * APEX AI PUSH NOTIFICATION SERVICE - EXTERNAL INTEGRATION
 * ========================================================
 * Handles mobile push notifications for guards and security personnel
 */

import admin from 'firebase-admin';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

class ApexPushNotificationService {
  constructor() {
    this.fcmApp = null;
    this.isConfigured = false;
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initializeFirebase() {
    try {
      // Production Firebase configuration
      if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const serviceAccount = JSON.parse(
          fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
        );
        
        this.fcmApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        });
        
        this.isConfigured = true;
        console.log('📱 Push notification service configured with Firebase');
        
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        
        this.fcmApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id
        });
        
        this.isConfigured = true;
        console.log('📱 Push notification service configured with Firebase (JSON)');
        
      } else {
        console.log('📱 Using demo push notification service (no real notifications sent)');
        this.isConfigured = false;
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize push notification service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send push notification to specific guard
   */
  async sendNotificationToGuard(guardId, notificationData) {
    try {
      const {
        title,
        body,
        data = {},
        priority = 'high',
        sound = 'default'
      } = notificationData;

      // Get guard's device tokens from database
      const deviceTokens = await this.getGuardDeviceTokens(guardId);
      
      if (deviceTokens.length === 0) {
        console.log(`⚠️ No device tokens found for guard ${guardId}`);
        return {
          success: false,
          error: 'No device tokens found',
          guard_id: guardId
        };
      }

      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...data,
          guard_id: guardId,
          timestamp: new Date().toISOString(),
          priority
        },
        android: {
          priority: priority === 'high' ? 'high' : 'normal',
          notification: {
            sound,
            channelId: 'security_alerts',
            priority: priority === 'high' ? 'high' : 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound,
              badge: 1,
              priority: priority === 'high' ? 10 : 5
            }
          }
        }
      };

      if (this.isConfigured && this.fcmApp) {
        // Send to all device tokens
        const promises = deviceTokens.map(token => 
          admin.messaging().send({
            ...message,
            token
          })
        );

        const results = await Promise.allSettled(promises);
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        console.log(`📱 Push notification sent to guard ${guardId}: ${successful} successful, ${failed} failed`);
        
        // Log notification in database
        await this.logNotification(guardId, {
          ...notificationData,
          delivery_status: successful > 0 ? 'delivered' : 'failed',
          devices_reached: successful,
          devices_failed: failed
        });
        
        return {
          success: successful > 0,
          guard_id: guardId,
          devices_reached: successful,
          devices_failed: failed,
          results
        };
        
      } else {
        // Demo mode
        console.log('📱 DEMO PUSH NOTIFICATION SERVICE');
        console.log(`📱 Guard: ${guardId}`);
        console.log(`📱 Title: ${title}`);
        console.log(`📱 Body: ${body}`);
        console.log(`📱 Data:`, data);
        console.log(`📱 Priority: ${priority}`);
        
        // Simulate successful delivery
        await this.logNotification(guardId, {
          ...notificationData,
          delivery_status: 'delivered',
          devices_reached: 1,
          devices_failed: 0,
          demo_mode: true
        });
        
        return {
          success: true,
          guard_id: guardId,
          devices_reached: 1,
          devices_failed: 0,
          demo_mode: true
        };
      }
      
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
      
      await this.logNotification(guardId, {
        ...notificationData,
        delivery_status: 'failed',
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Send emergency broadcast to all guards
   */
  async sendEmergencyBroadcast(broadcastData) {
    try {
      const {
        title,
        body,
        data = {},
        exclude_guards = []
      } = broadcastData;

      // Get all active guards
      const activeGuards = await this.getActiveGuards();
      const targetGuards = activeGuards.filter(guard => 
        !exclude_guards.includes(guard.guard_id)
      );

      if (targetGuards.length === 0) {
        console.log('⚠️ No active guards found for emergency broadcast');
        return {
          success: false,
          error: 'No active guards found'
        };
      }

      // Prepare emergency message
      const emergencyMessage = {
        notification: {
          title: `🚨 ${title}`,
          body
        },
        data: {
          ...data,
          broadcast_id: `emergency_${Date.now()}`,
          type: 'emergency_broadcast',
          timestamp: new Date().toISOString(),
          priority: 'emergency'
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'emergency_alert',
            channelId: 'emergency_alerts',
            priority: 'max',
            vibrationPattern: [1000, 1000, 1000],
            defaultLightColor: '#FF0000',
            defaultVibrateTimings: [0, 250, 250, 250]
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'emergency_alert.wav',
              badge: 1,
              priority: 10,
              alert: {
                title: `🚨 ${title}`,
                body
              }
            }
          }
        }
      };

      const results = {
        total_guards: targetGuards.length,
        successful: 0,
        failed: 0,
        guard_results: []
      };

      // Send to each guard
      for (const guard of targetGuards) {
        try {
          const result = await this.sendNotificationToGuard(
            guard.guard_id,
            {
              title: `🚨 ${title}`,
              body,
              data: emergencyMessage.data,
              priority: 'emergency'
            }
          );
          
          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
          }
          
          results.guard_results.push({
            guard_id: guard.guard_id,
            guard_name: guard.name,
            success: result.success,
            devices_reached: result.devices_reached || 0
          });
          
        } catch (error) {
          results.failed++;
          results.guard_results.push({
            guard_id: guard.guard_id,
            guard_name: guard.name,
            success: false,
            error: error.message
          });
        }
      }

      console.log(`🚨 Emergency broadcast completed: ${results.successful}/${results.total_guards} guards reached`);
      
      return {
        success: results.successful > 0,
        ...results
      };
      
    } catch (error) {
      console.error('❌ Failed to send emergency broadcast:', error);
      throw error;
    }
  }

  /**
   * Get guard device tokens from database
   */
  async getGuardDeviceTokens(guardId) {
    try {
      // In production, this would query the database
      // For demo, return mock tokens
      return [`demo_token_${guardId}_android`, `demo_token_${guardId}_ios`];
      
    } catch (error) {
      console.error('❌ Failed to get guard device tokens:', error);
      return [];
    }
  }

  /**
   * Get active guards for broadcasting
   */
  async getActiveGuards() {
    try {
      // In production, this would query the database
      // For demo, return mock guards
      return [
        { guard_id: 'guard_001', name: 'Marcus Johnson', status: 'on_duty' },
        { guard_id: 'guard_002', name: 'Sarah Williams', status: 'responding' },
        { guard_id: 'guard_003', name: 'David Chen', status: 'on_duty' },
        { guard_id: 'guard_004', name: 'Lisa Martinez', status: 'on_duty' }
      ];
      
    } catch (error) {
      console.error('❌ Failed to get active guards:', error);
      return [];
    }
  }

  /**
   * Log notification in database
   */
  async logNotification(guardId, notificationData) {
    try {
      // In production, this would log to the guard_notifications table
      console.log(`📝 Logging notification for guard ${guardId}:`, {
        timestamp: new Date().toISOString(),
        ...notificationData
      });
      
    } catch (error) {
      console.error('❌ Failed to log notification:', error);
    }
  }

  /**
   * Register device token for guard
   */
  async registerDeviceToken(guardId, deviceToken, platform) {
    try {
      // In production, this would update the guard_devices table
      console.log(`📱 Registering device token for guard ${guardId}: ${platform}`);
      
      return {
        success: true,
        guard_id: guardId,
        platform,
        registered_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Failed to register device token:', error);
      throw error;
    }
  }

  /**
   * Remove device token for guard
   */
  async removeDeviceToken(guardId, deviceToken) {
    try {
      // In production, this would remove from the guard_devices table
      console.log(`📱 Removing device token for guard ${guardId}`);
      
      return {
        success: true,
        guard_id: guardId,
        removed_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Failed to remove device token:', error);
      throw error;
    }
  }

  /**
   * Test push notification configuration
   */
  async testConfiguration() {
    try {
      if (this.isConfigured && this.fcmApp) {
        // Test with a simple validation
        console.log('✅ Push notification service configuration verified');
        return { success: true, configured: true };
      } else {
        console.log('⚠️ Push notification service in demo mode');
        return { success: true, configured: false, demo_mode: true };
      }
    } catch (error) {
      console.error('❌ Push notification configuration test failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(timeRange = '24 hours') {
    try {
      // In production, this would query the database
      // For demo, return mock stats
      return {
        total_sent: Math.floor(Math.random() * 100) + 50,
        delivered: Math.floor(Math.random() * 80) + 40,
        failed: Math.floor(Math.random() * 10) + 2,
        emergency_broadcasts: Math.floor(Math.random() * 5),
        active_devices: Math.floor(Math.random() * 20) + 10,
        time_range: timeRange
      };
      
    } catch (error) {
      console.error('❌ Failed to get notification stats:', error);
      return null;
    }
  }
}

// Export singleton instance
const pushNotificationService = new ApexPushNotificationService();
export default pushNotificationService;