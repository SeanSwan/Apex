/**
 * APEX AI SECURITY PLATFORM - INPUT VALIDATION MIDDLEWARE
 * =======================================================
 * Comprehensive input validation and sanitization
 */

import { body, param, query, validationResult } from 'express-validator';
// Note: Install sanitize-html with: npm install sanitize-html
// import sanitizeHtml from 'sanitize-html';

/**
 * Validation Error Handler
 * Standardized error response for validation failures
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn(`Validation errors for ${req.method} ${req.path}:`, errors.array());
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

/**
 * Custom Sanitization Functions
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  // Basic sanitization - replace with sanitizeHtml for production
  return value.replace(/<script[^>]*>.*?<\/script>/gi, '')
              .replace(/<[^>]*>/g, '')
              .trim();
};

const sanitizeObjectStrings = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObjectStrings(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * AI Alert Validation Rules
 */
export const validateAlertCreation = [
  body('detection_data').isObject().withMessage('Detection data must be an object'),
  body('detection_data.detection_type')
    .isIn(['person', 'weapon', 'vehicle', 'suspicious_behavior', 'loitering', 'intrusion'])
    .withMessage('Invalid detection type'),
  body('detection_data.confidence')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Confidence must be between 0 and 1'),
  body('camera_id')
    .isLength({ min: 1, max: 50 })
    .escape()
    .withMessage('Camera ID must be 1-50 characters'),
  body('alert_type')
    .isIn(['detection', 'manual', 'system', 'test'])
    .withMessage('Invalid alert type'),
  body('detection_data.bounding_box')
    .optional()
    .isObject()
    .withMessage('Bounding box must be an object'),
  body('detection_data.bounding_box.x').optional().isFloat({ min: 0 }),
  body('detection_data.bounding_box.y').optional().isFloat({ min: 0 }),
  body('detection_data.bounding_box.width').optional().isFloat({ min: 0 }),
  body('detection_data.bounding_box.height').optional().isFloat({ min: 0 }),
  
  // Sanitize input
  body('*').customSanitizer(sanitizeString),
  body('detection_data').customSanitizer(sanitizeObjectStrings),
  
  handleValidationErrors
];

/**
 * Guard Dispatch Validation Rules
 */
export const validateDispatchCreation = [
  body('alert_id')
    .isLength({ min: 1, max: 100 })
    .escape()
    .withMessage('Alert ID required'),
  body('guard_id')
    .optional()
    .isLength({ min: 1, max: 50 })
    .escape()
    .withMessage('Invalid guard ID'),
  body('priority')
    .isIn(['low', 'normal', 'high', 'emergency', 'critical'])
    .withMessage('Invalid priority level'),
  body('route_optimization')
    .optional()
    .isBoolean()
    .withMessage('Route optimization must be boolean'),
  body('backup_required')
    .optional()
    .isBoolean()
    .withMessage('Backup required must be boolean'),
  body('special_instructions')
    .optional()
    .isLength({ max: 500 })
    .escape()
    .withMessage('Special instructions too long (max 500 chars)'),
  
  // Sanitize input
  body('*').customSanitizer(sanitizeString),
  
  handleValidationErrors
];

/**
 * Guard Management Validation Rules
 */
export const validateGuardCreation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .escape()
    .withMessage('Name must be 2-100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('phone')
    .isMobilePhone()
    .withMessage('Valid phone number required'),
  body('employee_id')
    .isLength({ min: 1, max: 20 })
    .escape()
    .withMessage('Employee ID required'),
  body('experience_level')
    .isIn(['junior', 'intermediate', 'senior', 'supervisor'])
    .withMessage('Invalid experience level'),
  body('certifications')
    .optional()
    .isArray()
    .withMessage('Certifications must be an array'),
  body('hourly_rate')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Invalid hourly rate'),
  
  handleValidationErrors
];

/**
 * Camera Configuration Validation Rules
 */
export const validateCameraConfig = [
  body('camera_id')
    .isLength({ min: 1, max: 50 })
    .escape()
    .withMessage('Camera ID required'),
  body('name')
    .isLength({ min: 1, max: 100 })
    .escape()
    .withMessage('Camera name required'),
  body('rtsp_url')
    .optional()
    .isURL({ protocols: ['rtsp', 'http', 'https'] })
    .withMessage('Invalid RTSP URL'),
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('capabilities.supports_ptz')
    .optional()
    .isBoolean()
    .withMessage('PTZ support must be boolean'),
  body('capabilities.supports_audio')
    .optional()
    .isBoolean()
    .withMessage('Audio support must be boolean'),
  
  handleValidationErrors
];

/**
 * Report Generation Validation Rules
 */
export const validateReportGeneration = [
  body('template_type')
    .isIn(['daily', 'weekly', 'monthly', 'incident', 'custom'])
    .withMessage('Invalid template type'),
  body('date_range.start')
    .isISO8601()
    .withMessage('Invalid start date'),
  body('date_range.end')
    .isISO8601()
    .withMessage('Invalid end date'),
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object'),
  body('output_format')
    .isIn(['pdf', 'xlsx', 'json', 'html'])
    .withMessage('Invalid output format'),
  body('include_images')
    .optional()
    .isBoolean()
    .withMessage('Include images must be boolean'),
  
  // Sanitize input
  body('*').customSanitizer(sanitizeString),
  body('filters').customSanitizer(sanitizeObjectStrings),
  
  handleValidationErrors
];

/**
 * User Management Validation Rules
 */
export const validateUserCreation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 characters, alphanumeric, underscore, or dash'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be 8+ chars with uppercase, lowercase, number, and special character'),
  body('role')
    .isIn(['guard', 'supervisor', 'dispatch', 'operations_manager', 'admin', 'client_viewer'])
    .withMessage('Invalid role'),
  body('first_name')
    .isLength({ min: 1, max: 50 })
    .escape()
    .withMessage('First name required'),
  body('last_name')
    .isLength({ min: 1, max: 50 })
    .escape()
    .withMessage('Last name required'),
  
  handleValidationErrors
];

/**
 * Parameter Validation Rules
 */
export const validateIdParam = [
  param('id')
    .isLength({ min: 1, max: 100 })
    .escape()
    .withMessage('Invalid ID parameter'),
  handleValidationErrors
];

export const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Page must be between 1 and 10000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort must be asc or desc'),
  handleValidationErrors
];

/**
 * File Upload Validation
 */
export const validateFileUpload = (allowedTypes = [], maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }
    
    const files = req.files || [req.file];
    
    for (const file of files) {
      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: 'Invalid file type',
          allowed: allowedTypes,
          received: file.mimetype
        });
      }
      
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          error: 'File too large',
          maxSize: `${maxSize / 1024 / 1024}MB`,
          received: `${file.size / 1024 / 1024}MB`
        });
      }
      
      // Sanitize filename
      file.originalname = sanitizeString(file.originalname);
    }
    
    next();
  };
};

/**
 * Security Headers Middleware
 */
export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CSP for production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' wss: ws:;"
    );
  }
  
  next();
};

export default {
  validateAlertCreation,
  validateDispatchCreation,
  validateGuardCreation,
  validateCameraConfig,
  validateReportGeneration,
  validateUserCreation,
  validateIdParam,
  validatePaginationQuery,
  validateFileUpload,
  securityHeaders,
  handleValidationErrors
};