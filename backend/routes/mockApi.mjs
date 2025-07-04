/**
 * MOCK API ROUTES - FOR DEVELOPMENT WITHOUT DATABASE
 * =================================================
 * Provides API endpoints using mock data for development
 */

import express from 'express';
import { mockDataService } from '../services/mock/mockData.mjs';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await mockDataService.healthCheck();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// User endpoints
router.get('/users', async (req, res) => {
  try {
    const users = await mockDataService.getUsers();
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await mockDataService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Property endpoints
router.get('/properties', async (req, res) => {
  try {
    const properties = await mockDataService.getProperties();
    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Camera endpoints
router.get('/cameras', async (req, res) => {
  try {
    const cameras = await mockDataService.getCameras();
    res.json({
      success: true,
      data: cameras
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/cameras/:id', async (req, res) => {
  try {
    const camera = await mockDataService.getCameraById(req.params.id);
    if (!camera) {
      return res.status(404).json({
        success: false,
        error: 'Camera not found'
      });
    }
    res.json({
      success: true,
      data: camera
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// AI Alert endpoints
router.get('/ai-alerts', async (req, res) => {
  try {
    const alerts = await mockDataService.getAIAlerts();
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/ai-alerts', async (req, res) => {
  try {
    const alert = await mockDataService.createAIAlert(req.body);
    res.status(201).json({
      success: true,
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/ai-alerts/:id', async (req, res) => {
  try {
    const alert = await mockDataService.updateAIAlert(req.params.id, req.body);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }
    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Report endpoints
router.get('/reports', async (req, res) => {
  try {
    const reports = await mockDataService.getReports();
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Demo endpoint for testing
router.get('/demo-status', async (req, res) => {
  res.json({
    success: true,
    message: 'Apex AI Demo Mode - Database not required!',
    timestamp: new Date().toISOString(),
    demo_features: [
      'Mock user authentication',
      'Simulated camera feeds',
      'AI detection simulation',
      'Real-time WebSocket communication',
      'Complete API endpoints'
    ]
  });
});

export default router;
