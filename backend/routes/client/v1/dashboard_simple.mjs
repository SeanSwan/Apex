// backend/routes/client/v1/dashboard.mjs
/**
 * SIMPLE CLIENT DASHBOARD FOR TESTING
 * ==================================
 */

import express from 'express';
import { authenticateClientSession, logClientActivity } from '../../../middleware/clientAuth.mjs';

const router = express.Router();

// Apply simple authentication to all routes
router.use(authenticateClientSession);

/**
 * @route   GET /api/client/v1/dashboard/overview
 * @desc    Get demo dashboard data
 * @access  Private
 */
router.get('/overview', logClientActivity('view_dashboard_overview', 'dashboard'), async (req, res) => {
  try {
    const { dateRange = '30' } = req.query;
    const clientId = req.user.clientId;
    
    // Mock data for demo purposes
    const mockDashboardData = {
      success: true,
      data: {
        dateRange: parseInt(dateRange),
        lastUpdated: new Date().toISOString(),
        
        kpis: {
          totalIncidents: 127,
          criticalIncidents: 8,
          highIncidents: 23,
          resolvedIncidents: 89,
          resolutionRate: 70,
          avgAiConfidence: 92.5,
          activeProperties: 3,
          totalProperties: 4,
          
          // Enhanced KPIs for rich dashboard
          weeklyChange: {
            totalIncidents: 12,
            criticalIncidents: -2,
            resolutionRate: 5.2,
            avgAiConfidence: 1.8
          },
          
          performanceMetrics: {
            avgResponseTime: 8.5, // minutes
            falsePositiveRate: 2.3, // percentage
            userSatisfactionScore: 4.6, // out of 5
            systemUptime: 99.8 // percentage
          }
        },
        
        trends: [
          { date: '2025-01-01', incidents: 5, highSeverity: 1, resolved: 4, avgConfidence: 91.2 },
          { date: '2025-01-02', incidents: 8, highSeverity: 2, resolved: 6, avgConfidence: 93.1 },
          { date: '2025-01-03', incidents: 6, highSeverity: 1, resolved: 5, avgConfidence: 89.7 },
          { date: '2025-01-04', incidents: 12, highSeverity: 3, resolved: 8, avgConfidence: 94.3 },
          { date: '2025-01-05', incidents: 9, highSeverity: 2, resolved: 7, avgConfidence: 92.8 },
          { date: '2025-01-06', incidents: 7, highSeverity: 1, resolved: 6, avgConfidence: 90.5 },
          { date: '2025-01-07', incidents: 11, highSeverity: 4, resolved: 7, avgConfidence: 95.1 }
        ],
        
        recentCriticalIncidents: [
          {
            id: 1,
            incidentNumber: 'INC-2025-001',
            incidentType: 'weapon_detected',
            severity: 'critical',
            location: 'Main Lobby',
            description: 'AI detected potential weapon in visitor bag during entry scan',
            propertyName: 'Luxe Apartments - Building A',
            incidentDate: '2025-01-07T14:30:00Z',
            status: 'investigating',
            aiConfidence: 96.8,
            evidenceCount: 3,
            reportedBy: 'AI System'
          },
          {
            id: 2,
            incidentNumber: 'INC-2025-002',
            incidentType: 'package_theft',
            severity: 'high',
            location: 'Mailroom',
            description: 'Individual seen taking packages not addressed to them',
            propertyName: 'Luxe Apartments - Building B',
            incidentDate: '2025-01-07T11:15:00Z',
            status: 'resolved',
            aiConfidence: 94.2,
            evidenceCount: 5,
            reportedBy: 'AI System'
          },
          {
            id: 3,
            incidentNumber: 'INC-2025-003',
            incidentType: 'trespassing',
            severity: 'high',
            location: 'Parking Garage Level B2',
            description: 'Unauthorized individual accessing restricted parking area',
            propertyName: 'Luxe Apartments - Building C',
            incidentDate: '2025-01-06T18:20:00Z',
            status: 'investigating',
            aiConfidence: 91.8,
            evidenceCount: 4,
            reportedBy: 'AI System'
          },
          {
            id: 4,
            incidentNumber: 'INC-2025-004',
            incidentType: 'vandalism',
            severity: 'medium',
            location: 'Elevator Bank - Floor 3',
            description: 'Graffiti detected on elevator doors',
            propertyName: 'Luxe Apartments - Building A',
            incidentDate: '2025-01-06T14:15:00Z',
            status: 'resolved',
            aiConfidence: 88.4,
            evidenceCount: 2,
            reportedBy: 'Resident Report'
          },
          {
            id: 5,
            incidentNumber: 'INC-2025-005',
            incidentType: 'suspicious_activity',
            severity: 'medium',
            location: 'Pool Area',
            description: 'Individual loitering around pool equipment room after hours',
            propertyName: 'Luxe Apartments - Amenity Center',
            incidentDate: '2025-01-06T15:30:00Z',
            status: 'resolved',
            aiConfidence: 87.5,
            evidenceCount: 2,
            reportedBy: 'AI System'
          }
        ],
        
        propertyStats: [
          {
            propertyId: 1,
            propertyName: 'Luxe Apartments - Building A',
            incidentCount: 45,
            highSeverityCount: 12,
            avgAiConfidence: 93.2
          },
          {
            propertyId: 2,
            propertyName: 'Luxe Apartments - Building B',
            incidentCount: 38,
            highSeverityCount: 9,
            avgAiConfidence: 91.8
          },
          {
            propertyId: 3,
            propertyName: 'Luxe Apartments - Building C',
            incidentCount: 32,
            highSeverityCount: 7,
            avgAiConfidence: 94.1
          },
          {
            propertyId: 4,
            propertyName: 'Luxe Apartments - Amenity Center',
            incidentCount: 12,
            highSeverityCount: 3,
            avgAiConfidence: 89.5
          }
        ],
        
        aiPerformance: {
          totalDetections: 127,
          highConfidenceDetections: 98,
          veryHighConfidenceDetections: 74,
          avgConfidence: 92.5,
          accuracyRate: 87.3,
          
          // Enhanced AI metrics
          modelVersions: {
            weaponDetection: 'v2.1.3',
            packageTheft: 'v1.8.2',
            violence: 'v3.0.1',
            trespassing: 'v2.5.4'
          },
          
          confidenceDistribution: {
            veryHigh: 74, // 95%+
            high: 24,     // 85-94%
            medium: 21,   // 70-84%
            low: 8        // <70%
          },
          
          responseMetrics: {
            avgProcessingTime: 1.2, // seconds
            realTimeAnalysis: 99.2, // percentage
            concurrentStreams: 12,
            maxConcurrentSupported: 16
          },
          
          weeklyImprovement: {
            accuracyIncrease: 2.1,
            falsePositiveReduction: 15.3,
            processingSpeedImprovement: 8.7
          }
        },
        
        // Additional dashboard sections
        alertsAndNotifications: {
          totalSent: 342,
          emailsSent: 156,
          smsSent: 98,
          pushNotifications: 88,
          deliveryRate: 98.8,
          avgDeliveryTime: 2.3 // seconds
        },
        
        systemHealth: {
          overallStatus: 'healthy',
          cameraStatus: {
            online: 47,
            offline: 1,
            maintenance: 0,
            uptime: 98.9
          },
          networkStatus: {
            latency: 12, // ms
            bandwidth: 98.2, // percentage utilized
            packetLoss: 0.1
          },
          serverStatus: {
            cpuUsage: 34.2,
            memoryUsage: 67.8,
            diskUsage: 45.3,
            temperature: 42 // celsius
          }
        }
      }
    };
    
    console.log(`[DASHBOARD] Enhanced overview requested by ${req.user.email} for client ${clientId}, dateRange: ${dateRange}`);
    res.status(200).json(mockDashboardData);
    
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      error: 'Dashboard service error',
      code: 'DASHBOARD_SERVICE_ERROR',
      message: 'Unable to load dashboard data. Please try again.'
    });
  }
});

/**
 * @route   GET /api/client/v1/dashboard/incident-types
 * @desc    Get incident type breakdown
 * @access  Private
 */
router.get('/incident-types', logClientActivity('view_incident_types', 'dashboard'), async (req, res) => {
  try {
    const { dateRange = '30' } = req.query;
    
    const mockIncidentTypes = {
      success: true,
      data: {
        dateRange: parseInt(dateRange),
        incidentTypes: [
          {
            type: 'noise_complaint',
            count: 35,
            percentage: 27.6,
            criticalCount: 2,
            highCount: 8,
            resolvedCount: 28,
            avgConfidence: 89.2,
            resolutionRate: 80
          },
          {
            type: 'package_theft',
            count: 28,
            percentage: 22.0,
            criticalCount: 1,
            highCount: 6,
            resolvedCount: 20,
            avgConfidence: 94.1,
            resolutionRate: 71
          },
          {
            type: 'trespassing',
            count: 24,
            percentage: 18.9,
            criticalCount: 2,
            highCount: 4,
            resolvedCount: 18,
            avgConfidence: 91.8,
            resolutionRate: 75
          },
          {
            type: 'suspicious_activity',
            count: 18,
            percentage: 14.2,
            criticalCount: 1,
            highCount: 3,
            resolvedCount: 12,
            avgConfidence: 87.5,
            resolutionRate: 67
          },
          {
            type: 'vandalism',
            count: 12,
            percentage: 9.4,
            criticalCount: 1,
            highCount: 2,
            resolvedCount: 8,
            avgConfidence: 92.3,
            resolutionRate: 67
          },
          {
            type: 'weapon_detected',
            count: 6,
            percentage: 4.7,
            criticalCount: 1,
            highCount: 0,
            resolvedCount: 2,
            avgConfidence: 96.8,
            resolutionRate: 33
          },
          {
            type: 'violence',
            count: 4,
            percentage: 3.1,
            criticalCount: 0,
            highCount: 0,
            resolvedCount: 1,
            avgConfidence: 94.2,
            resolutionRate: 25
          }
        ]
      }
    };
    
    res.status(200).json(mockIncidentTypes);
    
  } catch (error) {
    console.error('Incident types error:', error);
    res.status(500).json({
      error: 'Incident types service error',
      code: 'INCIDENT_TYPES_ERROR',
      message: 'Unable to load incident type data'
    });
  }
});

/**
 * @route   GET /api/client/v1/dashboard/properties
 * @desc    Get properties overview
 * @access  Private
 */
router.get('/properties', logClientActivity('view_properties_dashboard', 'dashboard'), async (req, res) => {
  try {
    const { dateRange = '30' } = req.query;
    
    const mockProperties = {
      success: true,
      data: {
        dateRange: parseInt(dateRange),
        properties: [
          {
            id: 1,
            name: 'Luxe Apartments - Building A',
            address: '123 Main Street, Downtown',
            propertyType: 'Residential',
            stats: {
              incidentCount: 45,
              criticalCount: 3,
              highCount: 12,
              resolvedCount: 32,
              recentCount: 8,
              avgConfidence: 93.2,
              resolutionRate: 71
            }
          },
          {
            id: 2,
            name: 'Luxe Apartments - Building B',
            address: '125 Main Street, Downtown',
            propertyType: 'Residential',
            stats: {
              incidentCount: 38,
              criticalCount: 2,
              highCount: 9,
              resolvedCount: 27,
              recentCount: 6,
              avgConfidence: 91.8,
              resolutionRate: 71
            }
          },
          {
            id: 3,
            name: 'Luxe Apartments - Building C',
            address: '127 Main Street, Downtown',
            propertyType: 'Residential',
            stats: {
              incidentCount: 32,
              criticalCount: 2,
              highCount: 7,
              resolvedCount: 23,
              recentCount: 5,
              avgConfidence: 94.1,
              resolutionRate: 72
            }
          },
          {
            id: 4,
            name: 'Luxe Apartments - Amenity Center',
            address: '129 Main Street, Downtown',
            propertyType: 'Amenities',
            stats: {
              incidentCount: 12,
              criticalCount: 1,
              highCount: 3,
              resolvedCount: 7,
              recentCount: 2,
              avgConfidence: 89.5,
              resolutionRate: 58
            }
          }
        ]
      }
    };
    
    res.status(200).json(mockProperties);
    
  } catch (error) {
    console.error('Properties dashboard error:', error);
    res.status(500).json({
      error: 'Properties service error',
      code: 'PROPERTIES_ERROR',
      message: 'Unable to load properties data'
    });
  }
});

export default router;
