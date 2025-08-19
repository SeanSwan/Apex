// backend/routes/client/v1/evidence.mjs
/**
 * SIMPLE CLIENT EVIDENCE FOR TESTING
 * ==================================
 */

import express from 'express';
import { authenticateClientSession, logClientActivity } from '../../../middleware/clientAuth.mjs';

const router = express.Router();

// Apply simple authentication to all routes
router.use(authenticateClientSession);

/**
 * @route   GET /api/client/v1/evidence
 * @desc    Get demo evidence files
 * @access  Private
 */
router.get('/', logClientActivity('view_evidence', 'evidence'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      fileType = '',
      search = ''
    } = req.query;
    
    // Mock evidence files data
    const mockEvidenceFiles = [
      {
        id: 1,
        incidentId: 1,
        incidentNumber: 'INC-2025-001',
        incidentType: 'weapon_detected',
        incidentDate: '2025-01-07T14:30:00Z',
        location: 'Main Lobby - Entrance',
        propertyName: 'Luxe Apartments - Building A',
        originalFileName: 'lobby_camera_1_detection.mp4',
        fileType: 'video',
        fileSize: 15728640,
        fileSizeFormatted: '15.0 MB',
        hasThumbnail: true,
        hasWatermark: true,
        metadata: {
          duration: '00:02:15',
          resolution: '1920x1080',
          fps: 30,
          codec: 'H.264'
        },
        createdAt: '2025-01-07T14:30:15Z'
      },
      {
        id: 2,
        incidentId: 1,
        incidentNumber: 'INC-2025-001',
        incidentType: 'weapon_detected',
        incidentDate: '2025-01-07T14:30:00Z',
        location: 'Main Lobby - Entrance',
        propertyName: 'Luxe Apartments - Building A',
        originalFileName: 'weapon_detection_screenshot.jpg',
        fileType: 'image',
        fileSize: 2097152,
        fileSizeFormatted: '2.0 MB',
        hasThumbnail: true,
        hasWatermark: true,
        metadata: {
          dimensions: '1920x1080',
          format: 'JPEG',
          aiConfidence: 96.8
        },
        createdAt: '2025-01-07T14:30:16Z'
      },
      {
        id: 3,
        incidentId: 2,
        incidentNumber: 'INC-2025-002',
        incidentType: 'package_theft',
        incidentDate: '2025-01-07T11:15:00Z',
        location: 'Mailroom',
        propertyName: 'Luxe Apartments - Building B',
        originalFileName: 'mailroom_camera_theft.mp4',
        fileType: 'video',
        fileSize: 25165824,
        fileSizeFormatted: '24.0 MB',
        hasThumbnail: true,
        hasWatermark: true,
        metadata: {
          duration: '00:03:42',
          resolution: '1920x1080',
          fps: 30,
          codec: 'H.264'
        },
        createdAt: '2025-01-07T11:15:30Z'
      },
      {
        id: 4,
        incidentId: 2,
        incidentNumber: 'INC-2025-002',
        incidentType: 'package_theft',
        incidentDate: '2025-01-07T11:15:00Z',
        location: 'Mailroom',
        propertyName: 'Luxe Apartments - Building B',
        originalFileName: 'suspect_identification.jpg',
        fileType: 'image',
        fileSize: 1572864,
        fileSizeFormatted: '1.5 MB',
        hasThumbnail: true,
        hasWatermark: true,
        metadata: {
          dimensions: '1920x1080',
          format: 'JPEG',
          faceDetected: true
        },
        createdAt: '2025-01-07T11:16:00Z'
      },
      {
        id: 5,
        incidentId: 3,
        incidentNumber: 'INC-2025-003',
        incidentType: 'noise_complaint',
        incidentDate: '2025-01-06T23:45:00Z',
        location: 'Unit 4B',
        propertyName: 'Luxe Apartments - Building A',
        originalFileName: 'noise_level_recording.wav',
        fileType: 'audio',
        fileSize: 5242880,
        fileSizeFormatted: '5.0 MB',
        hasThumbnail: false,
        hasWatermark: false,
        metadata: {
          duration: '00:01:30',
          format: 'WAV',
          sampleRate: '44.1 kHz',
          peakDb: 85.2
        },
        createdAt: '2025-01-06T23:47:00Z'
      },
      {
        id: 6,
        incidentId: 4,
        incidentNumber: 'INC-2025-004',
        incidentType: 'trespassing',
        incidentDate: '2025-01-06T18:20:00Z',
        location: 'Parking Garage Level B2',
        propertyName: 'Luxe Apartments - Building C',
        originalFileName: 'garage_security_footage.mp4',
        fileType: 'video',
        fileSize: 18874368,
        fileSizeFormatted: '18.0 MB',
        hasThumbnail: true,
        hasWatermark: true,
        metadata: {
          duration: '00:04:15',
          resolution: '1920x1080',
          fps: 24,
          codec: 'H.264'
        },
        createdAt: '2025-01-06T18:20:45Z'
      },
      {
        id: 7,
        incidentId: 1,
        incidentNumber: 'INC-2025-001',
        incidentType: 'weapon_detected',
        incidentDate: '2025-01-07T14:30:00Z',
        location: 'Main Lobby - Entrance',
        propertyName: 'Luxe Apartments - Building A',
        originalFileName: 'ai_analysis_report.pdf',
        fileType: 'document',
        fileSize: 524288,
        fileSizeFormatted: '512 KB',
        hasThumbnail: false,
        hasWatermark: true,
        metadata: {
          pages: 3,
          format: 'PDF',
          contains: 'AI detection analysis and confidence scores'
        },
        createdAt: '2025-01-07T14:31:30Z'
      },
      {
        id: 8,
        incidentId: 5,
        incidentNumber: 'INC-2025-005',
        incidentType: 'suspicious_activity',
        incidentDate: '2025-01-06T15:30:00Z',
        location: 'Pool Area',
        propertyName: 'Luxe Apartments - Amenity Center',
        originalFileName: 'pool_area_surveillance.jpg',
        fileType: 'image',
        fileSize: 1310720,
        fileSizeFormatted: '1.25 MB',
        hasThumbnail: true,
        hasWatermark: true,
        metadata: {
          dimensions: '1920x1080',
          format: 'JPEG',
          timestamp: '2025-01-06T15:30:45Z'
        },
        createdAt: '2025-01-06T15:30:30Z'
      }
    ];
    
    // Apply basic filtering for demo
    let filteredFiles = mockEvidenceFiles;
    
    if (search) {
      filteredFiles = filteredFiles.filter(file => 
        file.originalFileName.toLowerCase().includes(search.toLowerCase()) ||
        file.incidentNumber.toLowerCase().includes(search.toLowerCase()) ||
        file.incidentType.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (fileType) {
      filteredFiles = filteredFiles.filter(file => file.fileType === fileType);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedFiles = filteredFiles.slice(startIndex, endIndex);
    
    // Calculate stats
    const stats = {
      totalFiles: filteredFiles.length,
      videoFiles: filteredFiles.filter(f => f.fileType === 'video').length,
      imageFiles: filteredFiles.filter(f => f.fileType === 'image').length,
      audioFiles: filteredFiles.filter(f => f.fileType === 'audio').length,
      watermarkedFiles: filteredFiles.filter(f => f.hasWatermark).length,
      totalStorage: filteredFiles.reduce((sum, f) => sum + f.fileSize, 0),
      totalStorageFormatted: '68.25 MB',
      avgFileSize: filteredFiles.length > 0 ? Math.round(filteredFiles.reduce((sum, f) => sum + f.fileSize, 0) / filteredFiles.length) : 0,
      avgFileSizeFormatted: '8.5 MB',
      watermarkRate: filteredFiles.length > 0 ? Math.round((filteredFiles.filter(f => f.hasWatermark).length / filteredFiles.length) * 100) : 0
    };
    
    console.log(`[EVIDENCE] ${paginatedFiles.length} evidence files returned for ${req.user.email}`);
    
    res.status(200).json({
      success: true,
      data: {
        items: paginatedFiles,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredFiles.length / limit),
          totalItems: filteredFiles.length,
          itemsPerPage: parseInt(limit),
          hasNextPage: endIndex < filteredFiles.length,
          hasPrevPage: page > 1
        },
        filters: {
          search,
          fileType
        },
        stats
      }
    });
    
  } catch (error) {
    console.error('Evidence error:', error);
    res.status(500).json({
      error: 'Evidence service error',
      code: 'EVIDENCE_SERVICE_ERROR',
      message: 'Unable to load evidence data'
    });
  }
});

/**
 * @route   GET /api/client/v1/evidence/download/:id
 * @desc    Download evidence file (mock response)
 * @access  Private
 */
router.get('/download/:id', logClientActivity('download_evidence', 'evidence'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock download response
    console.log(`[EVIDENCE] Download requested for file ${id} by ${req.user.email}`);
    
    res.status(200).json({
      success: true,
      message: 'File download initiated',
      data: {
        downloadUrl: `/api/client/v1/evidence/file/${id}`,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        fileName: `evidence_file_${id}.mp4`
      }
    });
    
  } catch (error) {
    console.error('Evidence download error:', error);
    res.status(500).json({
      error: 'Evidence download error',
      code: 'EVIDENCE_DOWNLOAD_ERROR',
      message: 'Unable to initiate file download'
    });
  }
});

export default router;
