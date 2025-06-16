/**
 * ENHANCED GUARD DISPATCH SYSTEM - APEX AI
 * ========================================
 * Master Prompt v29.4-APEX Implementation
 * 
 * Features:
 * - Real-time guard dispatch with GPS coordination
 * - Route optimization and ETA calculation
 * - Push notifications to guard mobile apps
 * - Backup dispatch for critical alerts
 * - Performance tracking and analytics
 * - External Service Integration: GPS, Push Notifications, Email
 */

import express from 'express';
import { getIO, emitSocketEvent } from '../../src/socket.js';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// ==================================================
// EXTERNAL SERVICE INTEGRATIONS
// ==================================================
import gpsRoutingService from '../../services/external/gpsRoutingService.mjs';
import pushNotificationService from '../../services/external/pushNotificationService.mjs';
import emailService from '../../services/external/emailService.mjs';

dotenv.config();
const router = express.Router();

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
});

/**
 * ROUTE OPTIMIZATION ENGINE
 * ========================
 * Calculate optimal routes and ETAs using external GPS service
 */
const calculateOptimalRoute = async (guardLocation, alertLocation, optimize = true) => {
  try {
    // Use external GPS routing service for accurate routes
    const route = await gpsRoutingService.calculateRoute(
      guardLocation,
      alertLocation,
      { mode: 'walking', optimize }
    );
    
    // Add buffer time for assessment and response
    const bufferTime = 120; // 2 minutes
    const totalEtaSeconds = route.duration_seconds + bufferTime;
    
    return {
      distance_meters: route.distance_meters,
      eta_seconds: totalEtaSeconds,
      eta_formatted: formatETA(totalEtaSeconds),
      route_type: route.provider || 'calculated',
      walking_time: route.duration_seconds,
      buffer_time: bufferTime,
      polyline: route.polyline,
      steps: route.steps,
      provider: route.provider
    };
  } catch (error) {
    console.error('Route calculation error:', error);
    // Fallback to simple calculation
    const distance = calculateDistance(
      guardLocation.latitude,
      guardLocation.longitude,
      alertLocation.latitude,
      alertLocation.longitude
    );
    
    const walkingSpeed = 1.4; // meters per second
    const etaSeconds = Math.ceil(distance / walkingSpeed);
    const bufferTime = 120;
    
    return {
      distance_meters: Math.round(distance),
      eta_seconds: etaSeconds + bufferTime,
      eta_formatted: formatETA(etaSeconds + bufferTime),
      route_type: 'fallback',
      walking_time: etaSeconds,
      buffer_time: bufferTime,
      error: error.message
    };
  }
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

const formatETA = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.ceil((seconds % 3600) / 60)}m`;
};

/**
 * GUARD AVAILABILITY ENGINE
 * ========================
 * Find optimal guards using GPS service and database
 */
const findOptimalGuard = async (alertLocation, alertPriority, requiredSkills = []) => {
  try {
    // First, use GPS service to find nearby guards
    const nearbyGuards = await gpsRoutingService.findNearestGuards(
      alertLocation,
      5000, // 5km radius
      [] // No exclusions
    );
    
    if (nearbyGuards.length === 0) {
      // Fallback to database query if GPS service doesn't have guard locations
      const guardQuery = `
        SELECT 
          g.*,
          ST_Distance_Sphere(
            ST_MakePoint(g.last_known_longitude, g.last_known_latitude),
            ST_MakePoint($1, $2)
          ) as distance_to_alert,
          CASE 
            WHEN g.status = 'on_duty' THEN 1
            WHEN g.status = 'available' THEN 2
            ELSE 3
          END as priority_score
        FROM guards g 
        WHERE g.status IN ('on_duty', 'available')
        AND g.active_alerts < 3
        ORDER BY 
          priority_score ASC,
          distance_to_alert ASC,
          g.experience_level DESC
        LIMIT 5
      `;
      
      const result = await pool.query(guardQuery, [
        alertLocation.longitude,
        alertLocation.latitude
      ]);
      
      if (result.rows.length === 0) {
        throw new Error('No available guards found');
      }
      
      const optimalGuard = result.rows[0];
      return {
        guard: optimalGuard,
        alternatives: result.rows.slice(1),
        selection_reason: generateSelectionReason(optimalGuard, alertPriority)
      };
    }
    
    // Use GPS service results
    const bestGuard = nearbyGuards[0];
    
    // Get full guard details from database
    const guardQuery = 'SELECT * FROM guards WHERE guard_id = $1';
    const guardResult = await pool.query(guardQuery, [bestGuard.guard_id]);
    
    if (guardResult.rows.length === 0) {
      throw new Error('Selected guard not found in database');
    }
    
    return {
      guard: {
        ...guardResult.rows[0],
        distance_to_alert: bestGuard.route_distance,
        estimated_travel_time: bestGuard.estimated_travel_time
      },
      alternatives: nearbyGuards.slice(1),
      selection_reason: `Nearest available guard (${Math.round(bestGuard.route_distance)}m away, ${Math.round(bestGuard.estimated_travel_time / 60)}min ETA)`
    };
    
  } catch (error) {
    console.error('Guard selection error:', error);
    throw error;
  }
};

const generateSelectionReason = (guard, alertPriority) => {
  const reasons = [];
  
  if (guard.distance_to_alert < 100) {
    reasons.push('closest available');
  }
  
  if (guard.status === 'on_duty') {
    reasons.push('currently on duty');
  }
  
  if (guard.experience_level === 'senior') {
    reasons.push('senior experience level');
  }
  
  if (guard.active_alerts === 0) {
    reasons.push('no active assignments');
  }
  
  return reasons.join(', ') || 'available for dispatch';
};

/**
 * PUSH NOTIFICATION SYSTEM
 * ========================
 * Send real-time notifications using external service
 */
const sendGuardPushNotification = async (guardId, notificationData) => {
  try {
    // Get guard's device tokens from database
    const deviceQuery = 'SELECT device_tokens FROM guard_devices WHERE guard_id = $1';
    const deviceResult = await pool.query(deviceQuery, [guardId]);
    
    let deviceTokens = [];
    
    if (deviceResult.rows.length > 0) {
      deviceTokens = deviceResult.rows[0].device_tokens;
    } else {
      console.warn(`No device tokens found for guard ${guardId} - using mock tokens`);
      // Mock device tokens for testing
      deviceTokens = [{ token: `mock_token_${guardId}`, platform: 'android' }];
    }
    
    // Prepare notification payload
    const notification = {
      title: getNotificationTitle(notificationData.type, notificationData.priority),
      body: notificationData.message || notificationData.description,
      data: {
        alert_id: notificationData.alert_id,
        priority: notificationData.priority,
        location: notificationData.location,
        timestamp: new Date().toISOString(),
        action_required: notificationData.type
      },
      priority: notificationData.priority === 'emergency' ? 'high' : 'normal'
    };
    
    // Send via external push notification service
    const pushResult = await pushNotificationService.sendToGuard(
      guardId,
      notification,
      deviceTokens
    );
    
    // Store notification in database
    await pool.query(
      'INSERT INTO guard_notifications (guard_id, notification_data, sent_at) VALUES ($1, $2, $3)',
      [guardId, JSON.stringify(notification), new Date()]
    );
    
    // Also send via WebSocket for real-time delivery
    emitSocketEvent('guard_notification', {
      guard_id: guardId,
      notification: notification,
      push_result: pushResult
    });
    
    return pushResult;
    
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
};

const getNotificationTitle = (type, priority) => {
  const titles = {
    dispatch: priority === 'emergency' ? '🚨 EMERGENCY DISPATCH' : '📱 New Alert Assignment',
    backup: '🚁 Backup Required',
    status_update: '📊 Status Update Required',
    shift_change: '⏰ Shift Change'
  };
  
  return titles[type] || '📢 Security Alert';
};

/**
 * POST /api/dispatch/send
 * Enhanced guard dispatch with AI optimization
 */
router.post('/send', async (req, res) => {
  const { 
    alert_id, 
    guard_id, 
    priority = 'normal', 
    route_optimization = true,
    backup_required = false,
    special_instructions 
  } = req.body;
  
  try {
    // Generate unique dispatch ID
    const dispatchId = `dispatch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Get alert details
    const alertQuery = 'SELECT * FROM ai_alerts_log WHERE alert_id = $1';
    const alertResult = await pool.query(alertQuery, [alert_id]);
    
    if (alertResult.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    const alert = alertResult.rows[0];
    
    // Get alert location from camera zone
    const locationQuery = `
      SELECT cz.*, c.name as camera_name
      FROM camera_zones cz
      JOIN cameras c ON c.camera_id = cz.camera_id
      WHERE cz.camera_id = $1
    `;
    const locationResult = await pool.query(locationQuery, [alert.camera_id]);
    const alertLocation = locationResult.rows[0];
    
    if (!alertLocation) {
      return res.status(400).json({ error: 'Alert location not found' });
    }
    
    // Get or find optimal guard
    let targetGuard;
    if (guard_id && guard_id !== 'nearest_available') {
      const guardQuery = 'SELECT * FROM guards WHERE guard_id = $1';
      const guardResult = await pool.query(guardQuery, [guard_id]);
      
      if (guardResult.rows.length === 0) {
        return res.status(404).json({ error: 'Guard not found' });
      }
      
      targetGuard = { guard: guardResult.rows[0] };
    } else {
      // Find optimal guard automatically
      targetGuard = await findOptimalGuard(alertLocation, priority);
    }
    
    // Calculate route and ETA
    const guardLocation = {
      latitude: targetGuard.guard.last_known_latitude,
      longitude: targetGuard.guard.last_known_longitude
    };
    
    const routeData = await calculateOptimalRoute(
      guardLocation,
      alertLocation,
      route_optimization
    );
    
    // Create dispatch record
    const dispatchData = {
      dispatch_id: dispatchId,
      alert_id,
      guard_id: targetGuard.guard.guard_id,
      priority,
      status: 'dispatched',
      estimated_arrival: new Date(Date.now() + routeData.eta_seconds * 1000).toISOString(),
      route_data: routeData,
      special_instructions,
      backup_required,
      created_at: new Date(),
      created_by: req.user?.user_id || 'system'
    };
    
    // Store dispatch in database
    const insertQuery = `
      INSERT INTO guard_dispatches (
        dispatch_id, alert_id, guard_id, priority, status, estimated_arrival,
        route_data, special_instructions, backup_required, created_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const insertResult = await pool.query(insertQuery, [
      dispatchData.dispatch_id,
      dispatchData.alert_id,
      dispatchData.guard_id,
      dispatchData.priority,
      dispatchData.status,
      dispatchData.estimated_arrival,
      JSON.stringify(dispatchData.route_data),
      dispatchData.special_instructions,
      dispatchData.backup_required,
      dispatchData.created_at,
      dispatchData.created_by
    ]);
    
    // Update guard status
    await pool.query(
      'UPDATE guards SET status = $1, active_alerts = active_alerts + 1, last_dispatch = $2 WHERE guard_id = $3',
      ['responding', new Date(), targetGuard.guard.guard_id]
    );
    
    // Update alert status
    await pool.query(
      'UPDATE ai_alerts_log SET status = $1, assigned_guard = $2 WHERE alert_id = $3',
      ['dispatched', targetGuard.guard.guard_id, alert_id]
    );
    
    // Send push notification to guard
    const notificationResult = await sendGuardPushNotification(targetGuard.guard.guard_id, {
      type: 'dispatch',
      priority,
      alert_id,
      message: `Respond to ${alert.alert_type} at ${alertLocation.camera_name}`,
      description: alert.description,
      location: alertLocation,
      eta: routeData.eta_formatted,
      special_instructions
    });
    
    // Real-time WebSocket updates
    emitSocketEvent('guard_dispatched', {
      dispatch_id: dispatchId,
      guard_id: targetGuard.guard.guard_id,
      guard_name: targetGuard.guard.name,
      alert_id,
      priority,
      eta: routeData.eta_formatted,
      location: alertLocation.camera_name
    });
    
    // Handle backup dispatch if required
    if (backup_required && priority === 'emergency') {
      setTimeout(async () => {
        try {
          const backupGuard = await findOptimalGuard(alertLocation, 'backup');
          if (backupGuard.alternatives.length > 0) {
            // Dispatch backup guard
            await handleBackupDispatch(alert_id, backupGuard.alternatives[0].guard_id, dispatchId);
          }
        } catch (error) {
          console.error('Backup dispatch error:', error);
        }
      }, 30000); // 30 second delay for backup
    }
    
    // Log security event
    await pool.query(
      'INSERT INTO security_events (event_type, event_data, timestamp) VALUES ($1, $2, $3)',
      [
        'guard_dispatched',
        JSON.stringify({
          dispatch_id: dispatchId,
          guard_id: targetGuard.guard.guard_id,
          alert_id,
          priority,
          eta_seconds: routeData.eta_seconds
        }),
        new Date()
      ]
    );
    
    res.status(201).json({
      success: true,
      dispatch: insertResult.rows[0],
      guard: {
        id: targetGuard.guard.guard_id,
        name: targetGuard.guard.name,
        selection_reason: targetGuard.selection_reason
      },
      route: routeData,
      notification: notificationResult,
      message: `Guard ${targetGuard.guard.name} dispatched successfully. ETA: ${routeData.eta_formatted}`
    });
    
  } catch (error) {
    console.error('Dispatch error:', error);
    res.status(500).json({
      error: 'Failed to dispatch guard',
      details: error.message
    });
  }
});

/**
 * Handle backup dispatch for critical situations
 */
const handleBackupDispatch = async (alertId, backupGuardId, primaryDispatchId) => {
  try {
    // Similar to main dispatch but marked as backup
    const backupDispatchId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Get alert and location details
    const alertQuery = 'SELECT * FROM ai_alerts_log WHERE alert_id = $1';
    const alertResult = await pool.query(alertQuery, [alertId]);
    const alert = alertResult.rows[0];
    
    // Create backup dispatch record
    await pool.query(
      `INSERT INTO guard_dispatches (
        dispatch_id, alert_id, guard_id, priority, status, 
        backup_for_dispatch, created_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        backupDispatchId,
        alertId,
        backupGuardId,
        'backup',
        'dispatched',
        primaryDispatchId,
        new Date(),
        'system'
      ]
    );
    
    // Send backup notification
    await sendGuardPushNotification(backupGuardId, {
      type: 'backup',
      priority: 'emergency',
      alert_id: alertId,
      message: 'Backup support required',
      description: `Backup needed for ${alert.alert_type}`
    });
    
    emitSocketEvent('backup_dispatched', {
      backup_dispatch_id: backupDispatchId,
      primary_dispatch_id: primaryDispatchId,
      guard_id: backupGuardId,
      alert_id: alertId
    });
    
  } catch (error) {
    console.error('Backup dispatch error:', error);
  }
};

/**
 * GET /api/dispatch/status/{dispatch_id}
 * Get dispatch status and tracking information
 */
router.get('/status/:dispatch_id', async (req, res) => {
  const { dispatch_id } = req.params;
  
  try {
    const query = `
      SELECT 
        gd.*,
        g.name as guard_name,
        g.last_known_latitude,
        g.last_known_longitude,
        g.status as guard_status,
        aal.alert_type,
        aal.priority as alert_priority
      FROM guard_dispatches gd
      JOIN guards g ON g.guard_id = gd.guard_id
      JOIN ai_alerts_log aal ON aal.alert_id = gd.alert_id
      WHERE gd.dispatch_id = $1
    `;
    
    const result = await pool.query(query, [dispatch_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dispatch not found' });
    }
    
    const dispatch = result.rows[0];
    
    // Calculate real-time ETA update
    if (dispatch.guard_status === 'responding') {
      // Recalculate ETA based on current position
      // This would integrate with real-time GPS tracking
    }
    
    res.json({
      success: true,
      dispatch: dispatch
    });
    
  } catch (error) {
    console.error('Dispatch status error:', error);
    res.status(500).json({
      error: 'Failed to get dispatch status',
      details: error.message
    });
  }
});

/**
 * POST /api/dispatch/{dispatch_id}/update
 * Update dispatch status (guard arrival, completion, etc.)
 */
router.post('/:dispatch_id/update', async (req, res) => {
  const { dispatch_id } = req.params;
  const { status, guard_location, notes, completion_time } = req.body;
  
  try {
    const updateQuery = `
      UPDATE guard_dispatches 
      SET status = $1, 
          guard_location = $2,
          status_notes = $3,
          updated_at = $4,
          completion_time = $5
      WHERE dispatch_id = $6
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [
      status,
      guard_location ? JSON.stringify(guard_location) : null,
      notes,
      new Date(),
      completion_time || null,
      dispatch_id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dispatch not found' });
    }
    
    const updatedDispatch = result.rows[0];
    
    // Real-time updates
    emitSocketEvent('dispatch_updated', {
      dispatch_id,
      status,
      guard_location,
      timestamp: new Date().toISOString()
    });
    
    // If dispatch completed, update guard status
    if (status === 'completed' || status === 'resolved') {
      await pool.query(
        'UPDATE guards SET status = $1, active_alerts = GREATEST(0, active_alerts - 1) WHERE guard_id = $2',
        ['on_duty', updatedDispatch.guard_id]
      );
      
      // Update alert status
      await pool.query(
        'UPDATE ai_alerts_log SET status = $1 WHERE alert_id = $2',
        ['resolved', updatedDispatch.alert_id]
      );
    }
    
    res.json({
      success: true,
      dispatch: updatedDispatch,
      message: `Dispatch status updated to ${status}`
    });
    
  } catch (error) {
    console.error('Dispatch update error:', error);
    res.status(500).json({
      error: 'Failed to update dispatch',
      details: error.message
    });
  }
});

/**
 * GET /api/dispatch/active
 * Get all active dispatches for monitoring
 */
router.get('/active', async (req, res) => {
  try {
    const query = `
      SELECT 
        gd.*,
        g.name as guard_name,
        g.last_known_latitude,
        g.last_known_longitude,
        aal.alert_type,
        aal.priority,
        aal.description,
        cz.camera_name
      FROM guard_dispatches gd
      JOIN guards g ON g.guard_id = gd.guard_id
      JOIN ai_alerts_log aal ON aal.alert_id = gd.alert_id
      LEFT JOIN camera_zones cz ON cz.camera_id = aal.camera_id
      WHERE gd.status IN ('dispatched', 'en_route', 'on_scene')
      ORDER BY gd.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      active_dispatches: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Active dispatches error:', error);
    res.status(500).json({
      error: 'Failed to get active dispatches',
      details: error.message
    });
  }
});

export default router;