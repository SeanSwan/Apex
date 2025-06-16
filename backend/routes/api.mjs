/**
 * APEX AI PLATFORM - MAIN API ROUTER
 * ==================================
 * Master Prompt v29.4-APEX Implementation
 * 
 * Integrates all AI and security system routes:
 * - AI Alert Management (Proactive Intelligence)
 * - Enhanced Guard Dispatch System
 * - Camera Control & RTSP Integration
 * - AI Services (TTS, Executive Briefings)
 * - Route Optimization & GPS Coordination
 * - Notifications & Security Events
 */

import { Router } from 'express';
import { getUsers } from '../controllers/userController.mjs';

// Import existing routes
import clientRoutes from './clientRoutes.mjs';
import authRoutes from './authRoutes.mjs';
import reportRoutes from './reportRoutes.mjs';
import detectionRoutes from './detectionRoutes.mjs';

// Import new AI system routes
import aiAlertRoutes from './ai/alertRoutes.mjs';
import aiDispatchRoutes from './ai/dispatchRoutes.mjs';
import aiCameraRoutes from './ai/cameraRoutes.mjs';
import aiServicesRoutes from './ai/aiServicesRoutes.mjs';
import aiRoutingRoutes from './ai/routingRoutes.mjs';
import aiNotificationRoutes from './ai/notificationRoutes.mjs';

const router = Router();

// ========================================
// LEGACY/EXISTING ROUTES
// ========================================

// User management
router.get('/users', getUsers);

// Client management
router.use('/clients', clientRoutes);

// Authentication
router.use('/auth', authRoutes);

// Reports
router.use('/reports', reportRoutes);

// Basic detections (legacy)
router.use('/detections', detectionRoutes);

// ========================================
// APEX AI SYSTEM ROUTES (NEW)
// ========================================

// AI Alert Management with Proactive Intelligence
// Features: Dynamic Risk Scoring, Threat Vector Analysis, AI Co-Pilot
router.use('/ai-alerts', aiAlertRoutes);

// Enhanced Guard Dispatch System
// Features: GPS coordination, route optimization, push notifications
router.use('/dispatch', aiDispatchRoutes);

// Camera Control & RTSP Integration
// Features: Digital zoom, PTZ control, AI voice response, audio output
router.use('/cameras', aiCameraRoutes);

// AI Services & Intelligence
// Features: TTS, executive briefings, AI model management
router.use('/ai', aiServicesRoutes);

// Route Optimization & GPS
// Features: Real-time routing, ETA calculation, emergency routes
router.use('/routing', aiRoutingRoutes);

// Notifications & Security Events
// Features: Push notifications, SMS alerts, security event logging
router.use('/notifications', aiNotificationRoutes);
router.use('/security', aiNotificationRoutes);

// ========================================
// API HEALTH CHECK & STATUS
// ========================================

router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '29.4-APEX',
    features: {
      proactive_intelligence: true,
      ai_copilot: true,
      threat_vector_analysis: true,
      dynamic_risk_scoring: true,
      enhanced_dispatch: true,
      camera_control: true,
      voice_synthesis: true,
      route_optimization: true,
      push_notifications: true,
      security_logging: true
    },
    message: 'APEX AI Security Platform - Proactive Intelligence Active'
  });
});

router.get('/status', async (req, res) => {
  try {
    // This would check actual system status in production
    const systemStatus = {
      api_server: 'online',
      database: 'connected', 
      ai_inference: 'active',
      websockets: 'connected',
      camera_systems: 'monitoring',
      guard_network: 'active',
      notification_service: 'operational'
    };

    res.json({
      success: true,
      system_status: systemStatus,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'System status check failed',
      details: error.message
    });
  }
});

export default router;