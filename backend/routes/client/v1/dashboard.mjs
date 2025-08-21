// backend/routes/client/v1/dashboard.mjs
/**
 * WORKING CLIENT PORTAL DASHBOARD API ROUTES
 * ==========================================
 * Simple, working dashboard endpoints for immediate testing
 */

import express from 'express';

const router = express.Router();

// Simple authentication check
const simpleAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'MISSING_TOKEN',
      message: 'Authentication required'
    });
  }
  
  const token = authHeader.substring(7);
  
  // Simple token validation
  if (!token || !token.startsWith('demo-token-')) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    });
  }
  
  // Set mock user for authenticated requests
  req.user = {
    id: 1,
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@luxeapartments.com',
    clientName: 'Luxe Apartments',
    clientId: 1,
    permissions: ['incidents', 'evidence', 'analytics', 'settings'],
    isVIP: true
  };
  
  req.client = {
    id: 1,
    name: 'Luxe Apartments',
    cameras: 24,
    isVIP: true,
    isActive: true
  };
  
  next();
};

/**
 * @route   GET /api/client/v1/dashboard/overview
 * @desc    Get dashboard overview with working mock data
 * @access  Private
 */
router.get('/overview', simpleAuth, async (req, res) => {
  try {
    const { dateRange = '30' } = req.query;
    
    console.log(`[DASHBOARD] Overview request from ${req.user.clientName}, range: ${dateRange} days`);
    
    // Generate realistic mock data
    const mockKPIs = {
      totalIncidents: Math.floor(Math.random() * 50) + 25,
      criticalIncidents: Math.floor(Math.random() * 5) + 2,
      highIncidents: Math.floor(Math.random() * 10) + 5,
      resolvedIncidents: Math.floor(Math.random() * 40) + 30,
      avgAiConfidence: Math.round((Math.random() * 10 + 90) * 100) / 100,
      activeProperties: Math.ceil(req.client.cameras / 10),
      totalProperties: Math.ceil(req.client.cameras / 8)
    };
    
    const resolutionRate = mockKPIs.totalIncidents > 0 
      ? Math.round((mockKPIs.resolvedIncidents / mockKPIs.totalIncidents) * 100)
      : 0;
    
    // Generate trend data
    const trends = Array.from({ length: parseInt(dateRange) }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (parseInt(dateRange) - 1 - i));
      return {
        date: date.toISOString().split('T')[0],
        incidents: Math.floor(Math.random() * 5) + 1,
        highSeverity: Math.floor(Math.random() * 2)
      };
    });
    
    const response = {
      success: true,
      data: {
        dateRange: parseInt(dateRange),
        lastUpdated: new Date().toISOString(),
        client: {
          id: req.user.clientId,
          name: req.user.clientName,
          isVIP: req.user.isVIP,
          cameras: req.client.cameras
        },
        kpis: {
          ...mockKPIs,
          resolutionRate: resolutionRate,
          monitoringHours: req.client.cameras * 24 * parseInt(dateRange),
          responseTime: '2.3 minutes'
        },
        trends: trends,
        recentCriticalIncidents: [
          {
            id: 1001,
            incidentNumber: 'INC-1001-2025',
            incidentType: 'Package Theft',
            location: 'Main Lobby',
            propertyName: req.user.clientName,
            incidentDate: new Date(Date.now() - 3600000).toISOString(),
            status: 'investigating',
            aiConfidence: 94.5
          },
          {
            id: 1002,
            incidentNumber: 'INC-1002-2025',
            incidentType: 'Trespassing',
            location: 'Parking Garage',
            propertyName: req.user.clientName,
            incidentDate: new Date(Date.now() - 7200000).toISOString(),
            status: 'resolved',
            aiConfidence: 88.2
          }
        ],
        propertyStats: [{
          propertyId: req.user.clientId,
          propertyName: req.user.clientName,
          incidentCount: mockKPIs.totalIncidents,
          highSeverityCount: mockKPIs.criticalIncidents + mockKPIs.highIncidents,
          avgAiConfidence: mockKPIs.avgAiConfidence
        }],
        aiPerformance: {
          totalDetections: mockKPIs.totalIncidents,
          highConfidenceDetections: Math.floor(mockKPIs.totalIncidents * 0.92),
          veryHighConfidenceDetections: Math.floor(mockKPIs.totalIncidents * 0.78),
          avgConfidence: mockKPIs.avgAiConfidence,
          accuracyRate: 92
        }
      }
    };
    
    console.log(`[DASHBOARD] ✅ Returning overview data - ${mockKPIs.totalIncidents} incidents`);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('[DASHBOARD] Overview error:', error);
    res.status(500).json({
      error: 'Dashboard service error',
      code: 'DASHBOARD_SERVICE_ERROR',
      message: 'Unable to load dashboard data'
    });
  }
});

/**
 * @route   GET /api/client/v1/dashboard/test
 * @desc    Test endpoint for dashboard
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dashboard API WORKING!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/client/v1/dashboard/overview',
      'GET /api/client/v1/dashboard/test'
    ]
  });
});

export default router;
