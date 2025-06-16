/**
 * APEX AI ALERT SYSTEM - PROACTIVE INTELLIGENCE BACKEND
 * ====================================================
 * Master Prompt v29.4-APEX Implementation
 * 
 * Features:
 * - AI Co-Pilot: Next best action recommendations
 * - Threat Vector Analysis: Connected alerts correlation
 * - Dynamic Risk Scoring: Context-aware severity assessment
 * - Real-time WebSocket integration
 * - External Service Integration: Email, Push Notifications
 */

import express from 'express';
import { getIO, emitSocketEvent } from '../../src/socket.js';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// ==================================================
// EXTERNAL SERVICE INTEGRATIONS
// ==================================================
import emailService from '../../services/external/emailService.mjs';
import pushNotificationService from '../../services/external/pushNotificationService.mjs';

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
 * DYNAMIC RISK SCORING ENGINE
 * ==========================
 * Core algorithm for Proactive Intelligence
 */
const calculateDynamicRiskScore = (detection, cameraZone, currentTime) => {
  // Base risk by detection type
  const detectionRiskMap = {
    'person': 3.0,
    'weapon': 9.5,
    'vehicle': 2.0,
    'suspicious_behavior': 6.0,
    'loitering': 4.0,
    'intrusion': 8.0
  };

  // Zone sensitivity multiplier
  const zoneSensitivityMap = {
    'public': 1.0,
    'restricted': 2.5,
    'high_security': 4.0,
    'critical_infrastructure': 5.0
  };

  // Time-based risk multiplier
  const hour = new Date(currentTime).getHours();
  const timeMultiplier = (hour >= 22 || hour <= 6) ? 2.0 : // Night hours
                        (hour >= 18 || hour <= 8) ? 1.5 : // Evening/early morning
                        1.0; // Business hours

  // Confidence factor
  const confidenceMultiplier = detection.confidence;

  // Calculate final risk score
  const baseRisk = detectionRiskMap[detection.detection_type] || 3.0;
  const zoneMultiplier = zoneSensitivityMap[cameraZone?.sensitivity_level] || 1.0;
  
  const finalScore = Math.min(10.0, baseRisk * zoneMultiplier * timeMultiplier * confidenceMultiplier);
  
  return {
    risk_score: Math.round(finalScore * 10) / 10,
    risk_breakdown: {
      base_detection_risk: baseRisk,
      zone_multiplier: zoneMultiplier,
      time_multiplier: timeMultiplier,
      confidence_factor: confidenceMultiplier
    },
    risk_level: finalScore >= 8.0 ? 'critical' :
                finalScore >= 6.0 ? 'high' :
                finalScore >= 4.0 ? 'medium' : 'low'
  };
};

/**
 * AI CO-PILOT: NEXT BEST ACTION GENERATOR
 * ======================================
 * Recommends optimal response actions based on context
 */
const generateNextBestAction = async (alert, availableGuards, cameraCapabilities) => {
  const actions = [];
  
  // High risk scenarios - immediate action required
  if (alert.risk_score >= 8.0) {
    // Find nearest available guard
    const nearestGuard = availableGuards
      .filter(g => g.status === 'on_duty')
      .sort((a, b) => a.distance_to_alert - b.distance_to_alert)[0];
    
    if (nearestGuard) {
      actions.push({
        action_type: 'dispatch_guard',
        priority: 'emergency',
        description: `Dispatch ${nearestGuard.name} (${Math.round(nearestGuard.distance_to_alert)}m away)`,
        estimated_time: Math.ceil(nearestGuard.distance_to_alert / 2), // 2m/s walking speed
        confidence: 0.95
      });
    }
    
    // Voice deterrent for weapon/intrusion
    if (['weapon', 'intrusion'].includes(alert.detection_details.detection_type) && cameraCapabilities.supports_audio) {
      actions.push({
        action_type: 'ai_voice_deterrent',
        priority: 'immediate',
        description: 'Deploy AI voice warning system',
        estimated_time: 5,
        confidence: 0.85
      });
    }
  }
  
  // Medium risk - verification and monitoring
  else if (alert.risk_score >= 4.0) {
    actions.push({
      action_type: 'enhanced_monitoring',
      priority: 'high',
      description: 'Enable enhanced AI monitoring and zoom tracking',
      estimated_time: 10,
      confidence: 0.90
    });
    
    if (cameraCapabilities.supports_ptz) {
      actions.push({
        action_type: 'digital_zoom',
        priority: 'normal', 
        description: 'Focus camera on detection area for verification',
        estimated_time: 5,
        confidence: 0.88
      });
    }
  }
  
  // Low risk - passive monitoring
  else {
    actions.push({
      action_type: 'monitor',
      priority: 'low',
      description: 'Continue passive monitoring with AI analysis',
      estimated_time: 0,
      confidence: 0.95
    });
  }
  
  return actions.sort((a, b) => b.confidence - a.confidence);
};

/**
 * THREAT VECTOR ANALYSIS
 * =====================
 * Correlate related alerts to identify threat patterns
 */
const analyzeThreatVector = async (newAlert) => {
  // Look for related alerts in the last 30 minutes
  const timeWindow = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
  
  const relatedAlertsQuery = `
    SELECT * FROM ai_alerts_log 
    WHERE timestamp >= $1 
    AND camera_id IN (
      SELECT camera_id FROM camera_zones 
      WHERE zone_id = (
        SELECT zone_id FROM camera_zones WHERE camera_id = $2
      )
    )
    ORDER BY timestamp DESC
  `;
  
  try {
    const result = await pool.query(relatedAlertsQuery, [timeWindow, newAlert.camera_id]);
    const relatedAlerts = result.rows;
    
    if (relatedAlerts.length > 1) {
      // Create threat vector
      const threatVector = {
        vector_id: `tv_${Date.now()}`,
        alert_ids: relatedAlerts.map(a => a.alert_id),
        pattern_type: identifyThreatPattern(relatedAlerts),
        escalation_factor: calculateEscalationFactor(relatedAlerts),
        timeline: relatedAlerts.map(a => ({
          alert_id: a.alert_id,
          timestamp: a.timestamp,
          camera_id: a.camera_id,
          detection_type: a.detection_details.detection_type
        }))
      };
      
      // Store threat vector
      await pool.query(
        'INSERT INTO threat_vectors (vector_id, data, created_at) VALUES ($1, $2, $3)',
        [threatVector.vector_id, JSON.stringify(threatVector), new Date()]
      );
      
      return threatVector;
    }
  } catch (error) {
    console.error('Threat vector analysis error:', error);
  }
  
  return null;
};

const identifyThreatPattern = (alerts) => {
  const types = alerts.map(a => a.detection_details?.detection_type).filter(Boolean);
  const uniqueTypes = [...new Set(types)];
  
  if (uniqueTypes.includes('weapon')) return 'armed_threat';
  if (uniqueTypes.includes('intrusion')) return 'breach_attempt';
  if (types.filter(t => t === 'person').length > 2) return 'coordinated_activity';
  if (uniqueTypes.includes('loitering')) return 'surveillance_pattern';
  
  return 'general_security_event';
};

const calculateEscalationFactor = (alerts) => {
  const baseEscalation = alerts.length * 0.2;
  const timeSpread = (new Date(alerts[0].timestamp) - new Date(alerts[alerts.length - 1].timestamp)) / (1000 * 60);
  const rapidEscalation = timeSpread < 10 ? 1.5 : 1.0; // Events within 10 minutes
  
  return Math.min(3.0, baseEscalation * rapidEscalation);
};

/**
 * POST /api/ai-alerts/{id}/acknowledge
 * Enhanced alert acknowledgment with Proactive Intelligence
 */
router.post('/:id/acknowledge', async (req, res) => {
  const { id: alertId } = req.params;
  const { acknowledged_by, acknowledged_at, operator_station, browser_info } = req.body;
  
  try {
    // Get alert details
    const alertQuery = 'SELECT * FROM ai_alerts_log WHERE alert_id = $1';
    const alertResult = await pool.query(alertQuery, [alertId]);
    
    if (alertResult.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    const alert = alertResult.rows[0];
    
    // Update alert status
    const updateQuery = `
      UPDATE ai_alerts_log 
      SET status = 'acknowledged',
          acknowledged_by = $1,
          acknowledged_at = $2,
          operator_metadata = $3
      WHERE alert_id = $4
      RETURNING *
    `;
    
    const metadata = {
      operator_station,
      browser_info,
      acknowledgment_time: new Date().toISOString()
    };
    
    const result = await pool.query(updateQuery, [
      acknowledged_by,
      acknowledged_at,
      JSON.stringify(metadata),
      alertId
    ]);
    
    const updatedAlert = result.rows[0];
    
    // Real-time WebSocket notification
    emitSocketEvent('alert_acknowledged', {
      alert_id: alertId,
      acknowledged_by,
      acknowledged_at,
      metadata
    });
    
    // Log security event
    await pool.query(
      'INSERT INTO security_events (event_type, event_data, timestamp) VALUES ($1, $2, $3)',
      ['alert_acknowledged', JSON.stringify({ alert_id: alertId, acknowledged_by }), new Date()]
    );
    
    res.json({
      success: true,
      alert: updatedAlert,
      message: 'Alert acknowledged successfully'
    });
    
  } catch (error) {
    console.error('Alert acknowledgment error:', error);
    res.status(500).json({ 
      error: 'Failed to acknowledge alert',
      details: error.message 
    });
  }
});

/**
 * POST /api/ai-alerts/create
 * Create new AI alert with Proactive Intelligence analysis
 */
router.post('/create', async (req, res) => {
  const { detection_data, camera_id, alert_type } = req.body;
  
  try {
    // Generate unique alert ID
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Get camera zone information
    const zoneQuery = 'SELECT * FROM camera_zones WHERE camera_id = $1';
    const zoneResult = await pool.query(zoneQuery, [camera_id]);
    const cameraZone = zoneResult.rows[0];
    
    // Calculate Dynamic Risk Score
    const riskAnalysis = calculateDynamicRiskScore(
      detection_data,
      cameraZone,
      new Date()
    );
    
    // Get available guards for AI Co-Pilot
    const guardsQuery = `
      SELECT g.*, 
        ST_Distance_Sphere(
          ST_MakePoint(g.last_known_longitude, g.last_known_latitude),
          ST_MakePoint($1, $2)
        ) as distance_to_alert
      FROM guards g 
      WHERE g.status IN ('on_duty', 'available')
      ORDER BY distance_to_alert ASC
    `;
    
    const guardsResult = await pool.query(guardsQuery, [
      cameraZone?.longitude || 0,
      cameraZone?.latitude || 0
    ]);
    
    // Get camera capabilities
    const cameraQuery = 'SELECT capabilities FROM cameras WHERE camera_id = $1';
    const cameraResult = await pool.query(cameraQuery, [camera_id]);
    const cameraCapabilities = cameraResult.rows[0]?.capabilities || {};
    
    // Generate Next Best Actions (AI Co-Pilot)
    const alert = {
      alert_id: alertId,
      camera_id,
      detection_details: detection_data,
      risk_score: riskAnalysis.risk_score
    };
    
    const nextBestActions = await generateNextBestAction(
      alert,
      guardsResult.rows,
      cameraCapabilities
    );
    
    // Analyze Threat Vector
    const threatVector = await analyzeThreatVector(alert);
    
    // Create comprehensive alert object
    const enhancedAlert = {
      alert_id: alertId,
      timestamp: new Date().toISOString(),
      camera_id,
      alert_type,
      priority: riskAnalysis.risk_level,
      description: `${detection_data.detection_type} detected with ${Math.round(detection_data.confidence * 100)}% confidence`,
      detection_details: detection_data,
      risk_analysis: riskAnalysis,
      ai_copilot_actions: nextBestActions,
      threat_vector_id: threatVector?.vector_id || null,
      status: 'pending',
      created_at: new Date()
    };
    
    // Store alert in database
    const insertQuery = `
      INSERT INTO ai_alerts_log (
        alert_id, timestamp, camera_id, alert_type, priority, description,
        detection_details, risk_analysis, ai_copilot_actions, threat_vector_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const insertResult = await pool.query(insertQuery, [
      enhancedAlert.alert_id,
      enhancedAlert.timestamp,
      enhancedAlert.camera_id,
      enhancedAlert.alert_type,
      enhancedAlert.priority,
      enhancedAlert.description,
      JSON.stringify(enhancedAlert.detection_details),
      JSON.stringify(enhancedAlert.risk_analysis),
      JSON.stringify(enhancedAlert.ai_copilot_actions),
      enhancedAlert.threat_vector_id,
      enhancedAlert.status
    ]);
    
    // Real-time WebSocket broadcast
    emitSocketEvent('ai_alert_created', enhancedAlert);
    
    // Auto-execute high priority actions with external services
    if (riskAnalysis.risk_score >= 8.0) {
      // Real-time WebSocket notification
      emitSocketEvent('critical_alert', {
        alert_id: alertId,
        risk_score: riskAnalysis.risk_score,
        suggested_actions: nextBestActions
      });
      
      // Send email alert to executives for critical incidents
      try {
        const executiveEmails = process.env.EXECUTIVE_EMAILS?.split(',') || ['admin@apexai-security.com'];
        await emailService.sendIncidentAlert({
          incident_id: alertId,
          incident_type: detection_data.detection_type,
          severity: riskAnalysis.risk_level,
          location: cameraZone?.zone_name || `Camera ${camera_id}`,
          timestamp: new Date().toISOString(),
          description: enhancedAlert.description,
          assigned_guard: null // Will be set when dispatched
        }, executiveEmails);
        
        console.log(`📧 Critical incident email sent for alert ${alertId}`);
      } catch (emailError) {
        console.error('Failed to send critical incident email:', emailError);
      }
      
      // Emergency broadcast to all available guards for weapon/intrusion alerts
      if (['weapon', 'intrusion'].includes(detection_data.detection_type)) {
        try {
          await pushNotificationService.sendEmergencyBroadcast({
            title: '🚨 EMERGENCY ALERT',
            body: `${detection_data.detection_type.toUpperCase()} detected at ${cameraZone?.zone_name || `Camera ${camera_id}`}`,
            data: {
              alert_id: alertId,
              priority: 'emergency',
              action_required: 'respond_immediately',
              location: cameraZone?.zone_name || `Camera ${camera_id}`,
              detection_type: detection_data.detection_type
            }
          });
          
          console.log(`📱 Emergency broadcast sent for ${detection_data.detection_type} alert`);
        } catch (pushError) {
          console.error('Failed to send emergency broadcast:', pushError);
        }
      }
    }
    
    res.status(201).json({
      success: true,
      alert: enhancedAlert,
      message: 'AI alert created with Proactive Intelligence analysis'
    });
    
  } catch (error) {
    console.error('AI alert creation error:', error);
    res.status(500).json({
      error: 'Failed to create AI alert',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-alerts
 * Retrieve AI alerts with Proactive Intelligence metadata
 */
router.get('/', async (req, res) => {
  const { limit = 50, status, priority, camera_id } = req.query;
  
  try {
    let query = 'SELECT * FROM ai_alerts_log WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }
    
    if (priority) {
      paramCount++;
      query += ` AND priority = $${paramCount}`;
      params.push(priority);
    }
    
    if (camera_id) {
      paramCount++;
      query += ` AND camera_id = $${paramCount}`;
      params.push(camera_id);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $${paramCount + 1}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      alerts: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Fetch alerts error:', error);
    res.status(500).json({
      error: 'Failed to fetch alerts',
      details: error.message
    });
  }
});

/**
 * GET /api/ai-alerts/threat-vectors
 * Retrieve threat vector analysis
 */
router.get('/threat-vectors', async (req, res) => {
  try {
    const query = `
      SELECT tv.*, 
        COUNT(aal.alert_id) as alert_count
      FROM threat_vectors tv
      LEFT JOIN ai_alerts_log aal ON aal.threat_vector_id = tv.vector_id
      WHERE tv.created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY tv.vector_id, tv.data, tv.created_at
      ORDER BY tv.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      threat_vectors: result.rows
    });
    
  } catch (error) {
    console.error('Threat vectors fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch threat vectors',
      details: error.message
    });
  }
});

export default router;