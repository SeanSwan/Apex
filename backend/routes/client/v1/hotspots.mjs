// backend/routes/client/v1/hotspots.mjs
/**
 * WORKING CLIENT PORTAL HOTSPOTS API ROUTES
 * =========================================
 * Simple, working hotspots endpoints for immediate testing
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
  
  if (!token || !token.startsWith('demo-token-')) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    });
  }
  
  req.user = {
    id: 1,
    clientName: 'Luxe Apartments',
    clientId: 1,
    isVIP: true
  };
  
  next();
};

/**
 * @route   GET /api/client/v1/hotspots
 * @desc    Get security hotspots with working mock data
 * @access  Private
 */
router.get('/', simpleAuth, async (req, res) => {
  try {
    const { dateRange = '30', riskThreshold = 'medium' } = req.query;
    
    console.log(`[HOTSPOTS] Request from ${req.user.clientName}, range: ${dateRange} days`);
    
    const mockHotspotsData = {
      success: true,
      data: {
        dateRange: parseInt(dateRange),
        lastUpdated: new Date().toISOString(),
        client: {
          id: req.user.clientId,
          name: req.user.clientName,
          isVIP: req.user.isVIP
        },
        propertyHotspots: [
          {
            propertyId: 1,
            propertyName: `${req.user.clientName} - Building A`,
            propertyAddress: '123 Main Street, Downtown',
            incidentCount: Math.floor(Math.random() * 30) + 15,
            highSeverityCount: Math.floor(Math.random() * 8) + 3,
            commonIncidentTypes: 'Package Theft, Trespassing',
            avgConfidence: Math.round((Math.random() * 10 + 90) * 100) / 100,
            riskLevel: 'high'
          },
          {
            propertyId: 2,
            propertyName: `${req.user.clientName} - Building B`,
            propertyAddress: '125 Main Street, Downtown',
            incidentCount: Math.floor(Math.random() * 25) + 10,
            highSeverityCount: Math.floor(Math.random() * 6) + 2,
            commonIncidentTypes: 'Vandalism, Loitering',
            avgConfidence: Math.round((Math.random() * 8 + 88) * 100) / 100,
            riskLevel: 'medium'
          }
        ],
        locationHotspots: [
          {
            location: 'Main Lobby - Entrance',
            propertyName: `${req.user.clientName} - Building A`,
            incidentCount: Math.floor(Math.random() * 10) + 8,
            highSeverityCount: Math.floor(Math.random() * 4) + 2,
            incidentTypes: 'Package Theft, Trespassing',
            riskLevel: 'high',
            lastIncident: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
            heatmapIntensity: 0.9
          },
          {
            location: 'Mailroom',
            propertyName: `${req.user.clientName} - Building A`,
            incidentCount: Math.floor(Math.random() * 8) + 5,
            highSeverityCount: Math.floor(Math.random() * 3) + 1,
            incidentTypes: 'Package Theft, Vandalism',
            riskLevel: 'high',
            lastIncident: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString(),
            heatmapIntensity: 0.7
          }
        ],
        riskAnalysis: {
          overallRiskLevel: 'medium',
          trendDirection: 'stable',
          topRiskFactors: [
            'Package theft incidents concentrated in mailroom area',
            'After-hours access attempts increasing',
            'Parking garage security concerns'
          ],
          recommendations: [
            'Increase security presence in mailroom during peak hours',
            'Install additional lighting in parking areas',
            'Review access control protocols'
          ]
        }
      }
    };
    
    console.log(`[HOTSPOTS] ✅ Returning hotspots data`);
    res.status(200).json(mockHotspotsData);
    
  } catch (error) {
    console.error('[HOTSPOTS] Error:', error);
    res.status(500).json({
      error: 'Hotspots service error',
      code: 'HOTSPOTS_SERVICE_ERROR',
      message: 'Unable to load security hotspots data'
    });
  }
});

export default router;
