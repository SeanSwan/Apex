// backend/routes/client/v1/incidents.mjs
/**
 * SIMPLE CLIENT INCIDENTS FOR TESTING
 * ===================================
 */

import express from 'express';
import { authenticateClientSession, logClientActivity } from '../../../middleware/clientAuth.mjs';

const router = express.Router();

// Apply simple authentication to all routes
router.use(authenticateClientSession);

/**
 * @route   GET /api/client/v1/incidents
 * @desc    Get demo incidents data
 * @access  Private
 */
router.get('/', logClientActivity('view_incidents', 'incidents'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      incidentType = '', 
      severity = '', 
      status = '' 
    } = req.query;
    
    // Mock incidents data
    const mockIncidents = [
      {
        id: 1,
        incidentNumber: 'INC-2025-001',
        incidentType: 'weapon_detected',
        severity: 'critical',
        status: 'investigating',
        location: 'Main Lobby - Entrance',
        description: 'AI detected potential weapon in visitor bag during entry scan',
        aiConfidence: 96.8,
        incidentDate: '2025-01-07T14:30:00Z',
        reportedBy: 'AI System',
        reportedPhone: null,
        resolvedAt: null,
        resolvedByName: null,
        resolutionNotes: null,
        propertyName: 'Luxe Apartments - Building A',
        propertyAddress: '123 Main Street, Downtown',
        evidenceCount: 3,
        createdAt: '2025-01-07T14:30:15Z',
        updatedAt: '2025-01-07T14:35:22Z'
      },
      {
        id: 2,
        incidentNumber: 'INC-2025-002',
        incidentType: 'package_theft',
        severity: 'high',
        status: 'resolved',
        location: 'Mailroom',
        description: 'Individual seen taking packages not addressed to them',
        aiConfidence: 94.2,
        incidentDate: '2025-01-07T11:15:00Z',
        reportedBy: 'AI System',
        reportedPhone: null,
        resolvedAt: '2025-01-07T13:45:00Z',
        resolvedByName: 'Security Guard Johnson',
        resolutionNotes: 'Individual identified and packages recovered. Trespassing warning issued.',
        propertyName: 'Luxe Apartments - Building B',
        propertyAddress: '125 Main Street, Downtown',
        evidenceCount: 5,
        createdAt: '2025-01-07T11:15:30Z',
        updatedAt: '2025-01-07T13:45:15Z'
      },
      {
        id: 3,
        incidentNumber: 'INC-2025-003',
        incidentType: 'noise_complaint',
        severity: 'medium',
        status: 'resolved',
        location: 'Unit 4B',
        description: 'Resident reported loud party after quiet hours',
        aiConfidence: 89.1,
        incidentDate: '2025-01-06T23:45:00Z',
        reportedBy: 'Resident - Unit 4A',
        reportedPhone: '+1-555-0123',
        resolvedAt: '2025-01-07T00:15:00Z',
        resolvedByName: 'Night Security',
        resolutionNotes: 'Spoke with residents. Music volume reduced to acceptable level.',
        propertyName: 'Luxe Apartments - Building A',
        propertyAddress: '123 Main Street, Downtown',
        evidenceCount: 1,
        createdAt: '2025-01-06T23:47:00Z',
        updatedAt: '2025-01-07T00:15:30Z'
      },
      {
        id: 4,
        incidentNumber: 'INC-2025-004',
        incidentType: 'trespassing',
        severity: 'high',
        status: 'investigating',
        location: 'Parking Garage Level B2',
        description: 'Unauthorized individual accessing restricted parking area',
        aiConfidence: 91.8,
        incidentDate: '2025-01-06T18:20:00Z',
        reportedBy: 'AI System',
        reportedPhone: null,
        resolvedAt: null,
        resolvedByName: null,
        resolutionNotes: null,
        propertyName: 'Luxe Apartments - Building C',
        propertyAddress: '127 Main Street, Downtown',
        evidenceCount: 4,
        createdAt: '2025-01-06T18:20:45Z',
        updatedAt: '2025-01-06T18:25:12Z'
      },
      {
        id: 5,
        incidentNumber: 'INC-2025-005',
        incidentType: 'suspicious_activity',
        severity: 'medium',
        status: 'resolved',
        location: 'Pool Area',
        description: 'Individual loitering around pool equipment room after hours',
        aiConfidence: 87.5,
        incidentDate: '2025-01-06T15:30:00Z',
        reportedBy: 'AI System',
        reportedPhone: null,
        resolvedAt: '2025-01-06T16:00:00Z',
        resolvedByName: 'Security Guard Martinez',
        resolutionNotes: 'Individual identified as maintenance contractor. Work order verified.',
        propertyName: 'Luxe Apartments - Amenity Center',
        propertyAddress: '129 Main Street, Downtown',
        evidenceCount: 2,
        createdAt: '2025-01-06T15:30:30Z',
        updatedAt: '2025-01-06T16:00:45Z'
      }
    ];
    
    // Apply basic filtering for demo
    let filteredIncidents = mockIncidents;
    
    if (search) {
      filteredIncidents = filteredIncidents.filter(incident => 
        incident.incidentNumber.toLowerCase().includes(search.toLowerCase()) ||
        incident.description.toLowerCase().includes(search.toLowerCase()) ||
        incident.location.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (incidentType) {
      filteredIncidents = filteredIncidents.filter(incident => 
        incident.incidentType === incidentType
      );
    }
    
    if (severity) {
      filteredIncidents = filteredIncidents.filter(incident => 
        incident.severity === severity
      );
    }
    
    if (status) {
      filteredIncidents = filteredIncidents.filter(incident => 
        incident.status === status
      );
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedIncidents = filteredIncidents.slice(startIndex, endIndex);
    
    console.log(`[INCIDENTS] ${paginatedIncidents.length} incidents returned for ${req.user.email}`);
    
    res.status(200).json({
      success: true,
      data: {
        items: paginatedIncidents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredIncidents.length / limit),
          totalItems: filteredIncidents.length,
          itemsPerPage: parseInt(limit),
          hasNextPage: endIndex < filteredIncidents.length,
          hasPrevPage: page > 1
        },
        filters: {
          search,
          incidentType,
          severity,
          status
        }
      }
    });
    
  } catch (error) {
    console.error('Incidents error:', error);
    res.status(500).json({
      error: 'Incidents service error',
      code: 'INCIDENTS_SERVICE_ERROR',
      message: 'Unable to load incidents data'
    });
  }
});

/**
 * @route   GET /api/client/v1/incidents/:id
 * @desc    Get single incident details
 * @access  Private
 */
router.get('/:id', logClientActivity('view_incident_details', 'incidents'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock detailed incident data
    const mockIncidentDetails = {
      id: parseInt(id),
      incidentNumber: 'INC-2025-001',
      incidentType: 'weapon_detected',
      severity: 'critical',
      status: 'investigating',
      location: 'Main Lobby - Entrance',
      description: 'AI detected potential weapon in visitor bag during entry scan. Individual was approaching reception desk when detection occurred.',
      aiConfidence: 96.8,
      incidentDate: '2025-01-07T14:30:00Z',
      reportedBy: 'AI System',
      reportedPhone: null,
      resolvedAt: null,
      resolvedByName: null,
      resolutionNotes: null,
      propertyName: 'Luxe Apartments - Building A',
      propertyAddress: '123 Main Street, Downtown',
      evidenceCount: 3,
      responseActions: [
        {
          id: 1,
          action: 'AI Detection Alert Triggered',
          timestamp: '2025-01-07T14:30:15Z',
          performedBy: 'AI System',
          status: 'completed',
          details: 'Weapon detection model confidence: 96.8%'
        },
        {
          id: 2,
          action: 'Security Team Notification Sent',
          timestamp: '2025-01-07T14:30:18Z',
          performedBy: 'AI System',
          status: 'completed',
          details: 'SMS and push notifications sent to on-duty security'
        },
        {
          id: 3,
          action: 'Law Enforcement Contact Initiated',
          timestamp: '2025-01-07T14:31:00Z',
          performedBy: 'Security Supervisor',
          status: 'pending',
          details: 'Non-emergency line contacted for guidance'
        }
      ],
      notificationsSent: [
        {
          id: 1,
          type: 'sms',
          recipient: 'Security Guard Johnson',
          message: 'CRITICAL: Weapon detected in Building A lobby',
          sentAt: '2025-01-07T14:30:20Z',
          status: 'delivered'
        },
        {
          id: 2,
          type: 'email',
          recipient: 'security@luxeapartments.com',
          message: 'Critical incident alert with evidence attachments',
          sentAt: '2025-01-07T14:30:25Z',
          status: 'delivered'
        }
      ],
      evidence: [
        {
          id: 1,
          originalFileName: 'lobby_camera_1_detection.mp4',
          fileType: 'video',
          fileSize: 15728640,
          fileSizeFormatted: '15.0 MB',
          hasThumbnail: true,
          hasWatermark: true,
          createdAt: '2025-01-07T14:30:15Z'
        },
        {
          id: 2,
          originalFileName: 'weapon_detection_screenshot.jpg',
          fileType: 'image',
          fileSize: 2097152,
          fileSizeFormatted: '2.0 MB',
          hasThumbnail: true,
          hasWatermark: true,
          createdAt: '2025-01-07T14:30:16Z'
        },
        {
          id: 3,
          originalFileName: 'ai_analysis_report.pdf',
          fileType: 'document',
          fileSize: 524288,
          fileSizeFormatted: '512 KB',
          hasThumbnail: false,
          hasWatermark: true,
          createdAt: '2025-01-07T14:31:30Z'
        }
      ],
      createdAt: '2025-01-07T14:30:15Z',
      updatedAt: '2025-01-07T14:35:22Z'
    };
    
    res.status(200).json({
      success: true,
      data: mockIncidentDetails
    });
    
  } catch (error) {
    console.error('Incident details error:', error);
    res.status(500).json({
      error: 'Incident details service error',
      code: 'INCIDENT_DETAILS_ERROR',
      message: 'Unable to load incident details'
    });
  }
});

export default router;
