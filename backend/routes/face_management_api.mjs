/**
 * APEX AI FACE MANAGEMENT API ROUTES
 * ===================================
 * Production-ready face recognition API endpoints
 * 
 * Features:
 * - Face enrollment with image upload
 * - Face profile management (CRUD operations)
 * - Analytics and detection summaries
 * - Secure file handling and validation
 */

import { Router } from 'express';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import pkg from 'pg';
const { Pool } = pkg;

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ========================================
// DATABASE CONNECTION
// ========================================

// Use existing database connection or create new one
let db;
try {
  // Try to import existing database connection
  const { pool } = await import('../config/database.js');
  db = pool;
} catch (error) {
  // Fallback: create direct connection
  db = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'apex_defense',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  });
}

// ========================================
// FILE UPLOAD CONFIGURATION
// ========================================

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'faces');
await fs.ensureDir(uploadDir);

// Configure multer for face image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure filename with timestamp and hash
    const timestamp = Date.now();
    const hash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `face_${timestamp}_${hash}${ext}`;
    cb(null, filename);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Only allow image files
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file per request
  }
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Generate face encoding by calling Python AI engine
 */
async function generateFaceEncoding(imagePath) {
  try {
    // Import spawn for calling Python script
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, '..', '..', 'apex_ai_engine', 'face_enrollment.py');
      const python = spawn('python', [pythonScript, imagePath]);
      
      let result = '';
      let error = '';
      
      python.stdout.on('data', (data) => {
        result += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          try {
            const encodingData = JSON.parse(result);
            resolve(encodingData);
          } catch (parseError) {
            reject(new Error(`Failed to parse encoding result: ${parseError.message}`));
          }
        } else {
          reject(new Error(`Face encoding failed: ${error}`));
        }
      });
      
      python.on('error', (err) => {
        reject(new Error(`Failed to start Python process: ${err.message}`));
      });
    });
  } catch (error) {
    throw new Error(`Face encoding system error: ${error.message}`);
  }
}

/**
 * Validate face profile data
 */
function validateFaceProfile(data) {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }
  
  if (data.name && data.name.length > 255) {
    errors.push('Name must be less than 255 characters');
  }
  
  if (data.department && data.department.length > 100) {
    errors.push('Department must be less than 100 characters');
  }
  
  if (data.access_level && data.access_level.length > 50) {
    errors.push('Access level must be less than 50 characters');
  }
  
  return errors;
}

// ========================================
// API ROUTES
// ========================================

/**
 * POST /api/face/enroll
 * Enroll a new face with image upload
 */
router.post('/enroll', upload.single('image'), async (req, res) => {
  let uploadedFile = null;
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided. Please upload a valid image.'
      });
    }
    
    uploadedFile = req.file;
    const { name, department, access_level, notes } = req.body;
    
    // Validate input data
    const validationErrors = validateFaceProfile({ name, department, access_level });
    if (validationErrors.length > 0) {
      // Clean up uploaded file
      await fs.remove(uploadedFile.path);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    // Generate face encoding using AI engine
    console.log('Generating face encoding for:', uploadedFile.path);
    const encodingResult = await generateFaceEncoding(uploadedFile.path);
    
    if (!encodingResult.success) {
      // Clean up uploaded file
      await fs.remove(uploadedFile.path);
      return res.status(400).json({
        success: false,
        error: 'Face encoding failed',
        details: encodingResult.error || 'Could not detect or encode face in image'
      });
    }
    
    // Store face profile in database
    const insertQuery = `
      INSERT INTO face_profiles 
      (name, encoding_vector, image_path, image_filename, image_size, 
       department, access_level, notes, created_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
      RETURNING face_id, name, created_at
    `;
    
    const values = [
      name.trim(),
      encodingResult.encoding, // Base64 encoded face vector
      uploadedFile.path,
      uploadedFile.originalname,
      uploadedFile.size,
      department || null,
      access_level || null,
      notes || null,
      req.user?.username || 'system' // Use authenticated user if available
    ];
    
    const result = await db.query(insertQuery, values);
    const newProfile = result.rows[0];
    
    console.log('Face profile enrolled successfully:', newProfile.face_id);
    
    res.status(201).json({
      success: true,
      message: 'Face enrolled successfully',
      data: {
        face_id: newProfile.face_id,
        name: newProfile.name,
        created_at: newProfile.created_at,
        image_filename: uploadedFile.originalname,
        encoding_quality: encodingResult.confidence || 'unknown'
      }
    });
    
  } catch (error) {
    console.error('Face enrollment error:', error);
    
    // Clean up uploaded file on error
    if (uploadedFile) {
      try {
        await fs.remove(uploadedFile.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Face enrollment failed',
      details: error.message
    });
  }
});

/**
 * GET /api/faces
 * List all face profiles with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { 
      status = 'active', 
      department, 
      limit = 50, 
      offset = 0,
      search 
    } = req.query;
    
    let query = `
      SELECT 
        face_id,
        name,
        department,
        access_level,
        status,
        created_at,
        image_filename,
        notes,
        (SELECT COUNT(*) FROM face_detections fd WHERE fd.face_id = fp.face_id) as total_detections,
        (SELECT MAX(detected_at) FROM face_detections fd WHERE fd.face_id = fp.face_id) as last_detected
      FROM face_profiles fp
      WHERE 1=1
    `;
    
    const values = [];
    let paramIndex = 1;
    
    // Add filters
    if (status && status !== 'all') {
      query += ` AND status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }
    
    if (department) {
      query += ` AND department = $${paramIndex}`;
      values.push(department);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR notes ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }
    
    // Add ordering and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, values);
    
    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM face_profiles WHERE 1=1`;
    const countValues = [];
    let countParamIndex = 1;
    
    if (status && status !== 'all') {
      countQuery += ` AND status = $${countParamIndex}`;
      countValues.push(status);
      countParamIndex++;
    }
    
    if (department) {
      countQuery += ` AND department = $${countParamIndex}`;
      countValues.push(department);
      countParamIndex++;
    }
    
    if (search) {
      countQuery += ` AND (name ILIKE $${countParamIndex} OR notes ILIKE $${countParamIndex})`;
      countValues.push(`%${search}%`);
      countParamIndex++;
    }
    
    const countResult = await db.query(countQuery, countValues);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: {
        faces: result.rows,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < totalCount
        }
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch face profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch face profiles',
      details: error.message
    });
  }
});

/**
 * GET /api/faces/:faceId
 * Get detailed information about a specific face profile
 */
router.get('/:faceId', async (req, res) => {
  try {
    const { faceId } = req.params;
    
    const query = `
      SELECT 
        fp.*,
        (SELECT COUNT(*) FROM face_detections fd WHERE fd.face_id = fp.face_id) as total_detections,
        (SELECT MAX(detected_at) FROM face_detections fd WHERE fd.face_id = fp.face_id) as last_detected,
        (SELECT AVG(confidence) FROM face_detections fd WHERE fd.face_id = fp.face_id) as avg_confidence
      FROM face_profiles fp
      WHERE face_id = $1
    `;
    
    const result = await db.query(query, [faceId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Face profile not found'
      });
    }
    
    // Don't return the encoding vector for security
    const profile = result.rows[0];
    delete profile.encoding_vector;
    
    res.json({
      success: true,
      data: profile
    });
    
  } catch (error) {
    console.error('Failed to fetch face profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch face profile',
      details: error.message
    });
  }
});

/**
 * DELETE /api/faces/:faceId
 * Delete a face profile and associated data
 */
router.delete('/:faceId', async (req, res) => {
  try {
    const { faceId } = req.params;
    const { permanent = false } = req.query;
    
    // First check if profile exists
    const checkQuery = 'SELECT face_id, image_path, name FROM face_profiles WHERE face_id = $1';
    const checkResult = await db.query(checkQuery, [faceId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Face profile not found'
      });
    }
    
    const profile = checkResult.rows[0];
    
    if (permanent === 'true') {
      // Permanent deletion - remove from database and file system
      const deleteQuery = 'DELETE FROM face_profiles WHERE face_id = $1';
      await db.query(deleteQuery, [faceId]);
      
      // Delete associated image file
      if (profile.image_path) {
        try {
          await fs.remove(profile.image_path);
        } catch (fileError) {
          console.warn('Could not delete image file:', fileError.message);
        }
      }
      
      res.json({
        success: true,
        message: `Face profile "${profile.name}" permanently deleted`
      });
    } else {
      // Soft deletion - mark as archived
      const updateQuery = 'UPDATE face_profiles SET status = $1, updated_at = NOW() WHERE face_id = $2';
      await db.query(updateQuery, ['archived', faceId]);
      
      res.json({
        success: true,
        message: `Face profile "${profile.name}" archived`
      });
    }
    
  } catch (error) {
    console.error('Failed to delete face profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete face profile',
      details: error.message
    });
  }
});

/**
 * GET /api/faces/analytics/summary
 * Get face recognition analytics and summary statistics
 */
router.get('/analytics/summary', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Get profile summary
    const profileQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(CASE WHEN department IS NOT NULL THEN 1 END) as with_department
      FROM face_profiles 
      GROUP BY status
    `;
    
    // Get detection trends for last N days
    const detectionQuery = `
      SELECT 
        DATE(detected_at) as detection_date,
        COUNT(*) as total_detections,
        COUNT(CASE WHEN is_match = true THEN 1 END) as known_detections,
        COUNT(CASE WHEN is_match = false THEN 1 END) as unknown_detections,
        COUNT(DISTINCT camera_id) as active_cameras,
        AVG(confidence) as avg_confidence
      FROM face_detections 
      WHERE detected_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(detected_at)
      ORDER BY detection_date DESC
    `;
    
    // Get top detected faces
    const topFacesQuery = `
      SELECT 
        fp.name,
        fp.department,
        COUNT(fd.detection_id) as detection_count,
        MAX(fd.detected_at) as last_detected,
        AVG(fd.confidence) as avg_confidence
      FROM face_profiles fp
      JOIN face_detections fd ON fp.face_id = fd.face_id
      WHERE fd.detected_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY fp.face_id, fp.name, fp.department
      ORDER BY detection_count DESC
      LIMIT 10
    `;
    
    // Get camera activity
    const cameraQuery = `
      SELECT 
        camera_id,
        camera_name,
        COUNT(*) as total_detections,
        COUNT(DISTINCT face_id) FILTER (WHERE face_id IS NOT NULL) as unique_faces,
        AVG(confidence) as avg_confidence,
        MAX(detected_at) as last_activity
      FROM face_detections
      WHERE detected_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY camera_id, camera_name
      ORDER BY total_detections DESC
    `;
    
    // Execute all queries
    const [profileResult, detectionResult, topFacesResult, cameraResult] = await Promise.all([
      db.query(profileQuery),
      db.query(detectionQuery),
      db.query(topFacesQuery),
      db.query(cameraQuery)
    ]);
    
    res.json({
      success: true,
      analytics: {
        profile_summary: profileResult.rows,
        detection_trends: detectionResult.rows,
        top_detected_faces: topFacesResult.rows,
        camera_activity: cameraResult.rows,
        period_days: parseInt(days),
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Failed to generate analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics',
      details: error.message
    });
  }
});

/**
 * GET /api/faces/detections
 * Get recent face detection events
 */
router.get('/detections', async (req, res) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      camera_id, 
      is_match,
      face_id,
      hours = 24 
    } = req.query;
    
    let query = `
      SELECT 
        fd.detection_id,
        fd.face_id,
        fp.name as face_name,
        fd.camera_id,
        fd.camera_name,
        fd.confidence,
        fd.is_match,
        fd.detected_at,
        fd.bbox_x,
        fd.bbox_y,
        fd.bbox_width,
        fd.bbox_height,
        fd.processing_time_ms
      FROM face_detections fd
      LEFT JOIN face_profiles fp ON fd.face_id = fp.face_id
      WHERE fd.detected_at >= NOW() - INTERVAL '${parseInt(hours)} hours'
    `;
    
    const values = [];
    let paramIndex = 1;
    
    if (camera_id) {
      query += ` AND fd.camera_id = $${paramIndex}`;
      values.push(camera_id);
      paramIndex++;
    }
    
    if (is_match !== undefined) {
      query += ` AND fd.is_match = $${paramIndex}`;
      values.push(is_match === 'true');
      paramIndex++;
    }
    
    if (face_id) {
      query += ` AND fd.face_id = $${paramIndex}`;
      values.push(face_id);
      paramIndex++;
    }
    
    query += ` ORDER BY fd.detected_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, values);
    
    res.json({
      success: true,
      data: {
        detections: result.rows,
        period_hours: parseInt(hours)
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch detections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch detections',
      details: error.message
    });
  }
});

// ========================================
// ERROR HANDLING MIDDLEWARE
// ========================================

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Only one image allowed per request.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
});

export default router;
