// backend/routes/client/v1/incidents.mjs
/**
 * WORKING CLIENT PORTAL INCIDENTS API ROUTES
 * ==========================================
 * Simple, working incidents endpoints for immediate testing
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
    permissions: ['incidents', 'evidence', 'analytics', 'settings']
  };
  
  next();
};

/**
 * @route   GET /api/client/v1/incidents
 * @desc    Get incidents list with working mock data
 * @access  Private
 */
router.get('/', simpleAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      severity,
      status,
      sortBy = 'incidentDate',
      sortOrder = 'desc'
    } = req.query;
    
    console.log(`[INCIDENTS] Request from ${req.user.clientName}, page: ${page}, severity: ${severity}`);
    
    // Generate mock incidents
    const incidents = Array.from({ length: parseInt(limit) }, (_, i) => {
      const incidentId = 1000 + i + (parseInt(page) - 1) * parseInt(limit);
      const types = ['Package Theft', 'Trespassing', 'Vandalism', 'Loitering', 'Vehicle Break-in'];
      const severities = ['critical', 'high', 'medium', 'low'];
      const statuses = ['reported', 'investigating', 'resolved', 'closed'];
      const locations = ['Main Lobby', 'Parking Garage', 'Mailroom', 'Pool Area', 'Side Entrance'];
      
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      
      // Apply severity filter if provided
      if (severity && !severity.split(',').includes(randomSeverity)) {
        return null;
      }
      
      const incidentDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      return {
        id: incidentId,
        incidentNumber: `INC-${String(incidentId).slice(-4)}-2025`,
        incidentType: randomType,
        severity: randomSeverity,
        status: randomStatus,
        location: randomLocation,
        description: `${randomType} incident detected at ${randomLocation}. AI detection system activated.`,
        aiConfidence: Math.round((Math.random() * 20 + 80) * 100) / 100,
        incidentDate: incidentDate.toISOString(),
        reportedBy: 'AI Detection System',
        resolvedAt: randomStatus === 'resolved' ? new Date(incidentDate.getTime() + Math.random() * 3600000 * 24).toISOString() : null,
        propertyName: req.user.clientName,
        evidenceCount: Math.floor(Math.random() * 5) + 1
      };
    }).filter(Boolean);
    
    const totalIncidents = 150;
    const totalPages = Math.ceil(totalIncidents / parseInt(limit));
    
    const response = {
      success: true,
      data: {
        incidents: incidents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalItems: totalIncidents,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        summary: {
          totalToday: Math.floor(Math.random() * 10) + 5,
          totalThisWeek: Math.floor(Math.random() * 50) + 25,
          criticalCount: incidents.filter(i => i.severity === 'critical').length,
          resolvedCount: incidents.filter(i => i.status === 'resolved').length
        }
      }
    };
    
    console.log(`[INCIDENTS] ✅ Returning ${incidents.length} incidents`);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('[INCIDENTS] Error:', error);
    res.status(500).json({
      error: 'Incidents service error',
      code: 'INCIDENTS_SERVICE_ERROR',
      message: 'Unable to load incidents'
    });
  }
});

export default router;
