// backend/routes/internal/v1/properties.mjs
/**
 * APEX AI ENHANCED PROPERTIES API ROUTES
 * =======================================
 * Comprehensive property management API for admin dashboard
 * - Full CRUD operations for properties
 * - Image upload and management capabilities
 * - Bulk operations support
 * - Real-time client portal synchronization
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { UnifiedQueries } from '../../../database/unifiedQueries.mjs';
import { authenticateToken, requireAnyRole } from '../../../middleware/unifiedAuth.mjs';

const router = express.Router();

// Rate limiting for internal APIs
const internalAPILimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200,
  message: {
    error: 'Rate limit exceeded',
    code: 'INTERNAL_API_RATE_LIMIT',
    message: 'Too many requests. Please wait a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Ensure property images directory exists
const PROPERTY_IMAGES_DIR = path.join(process.cwd(), 'public', 'property-images');
if (!fs.existsSync(PROPERTY_IMAGES_DIR)) {
  fs.mkdirSync(PROPERTY_IMAGES_DIR, { recursive: true });
}

// Configure multer for property image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PROPERTY_IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `property-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 images per property
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Apply authentication and rate limiting to all routes
router.use(internalAPILimiter, authenticateToken);

/**
 * @route   GET /api/internal/v1/properties
 * @desc    Get all properties accessible to user
 * @access  Private (Role-based access)
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 100, offset = 0, search, status } = req.query;
    
    // Get user's accessible properties based on role
    const accessibleProperties = await UnifiedQueries.getUserAccessibleProperties(
      req.user.id,
      req.user.role,
      req.user.clientId
    );
    
    if (accessibleProperties.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          properties: [],
          pagination: {
            total: 0,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: false
          }
        }
      });
    }
    
    // Build filter conditions
    let whereClause = 'WHERE p.id = ANY(:accessiblePropertyIds)';
    const replacements = { accessiblePropertyIds: accessibleProperties.map(p => p.id) };
    
    if (search) {
      whereClause += ' AND (p.name ILIKE :search OR p.address ILIKE :search)';
      replacements.search = `%${search}%`;
    }
    
    if (status) {
      whereClause += ' AND p.status = :status';
      replacements.status = status;
    }
    
    const [properties] = await UnifiedQueries.sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.address,
        p.city,
        p.state,
        p.zip_code as "zipCode",
        p.country,
        p.property_type as "propertyType",
        p.client_id as "clientId",
        p.timezone,
        p.emergency_contact_info as "emergencyContactInfo",
        p.special_instructions as "specialInstructions",
        p.access_codes as "accessCodes",
        p.status,
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        c.company_name as "clientCompanyName",
        COUNT(DISTINCT g.id) as "assignedGuards",
        COUNT(DISTINCT sop.id) as "sopCount",
        COUNT(DISTINCT cl.id) as "contactListCount",
        COUNT(DISTINCT i.id) as "incidentCount"
      FROM properties p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN property_assignments pa ON p.id = pa.property_id
      LEFT JOIN guards g ON pa.guard_id = g.id AND g.status = 'active'
      LEFT JOIN standard_operating_procedures sop ON p.id = sop.property_id AND sop.status = 'active'
      LEFT JOIN contact_lists cl ON p.id = cl.property_id AND cl.status = 'active'
      LEFT JOIN incidents i ON p.id = i.property_id AND i.created_at >= NOW() - INTERVAL '30 days'
      ${whereClause}
      GROUP BY p.id, c.company_name
      ORDER BY p.name ASC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { ...replacements, limit: parseInt(limit), offset: parseInt(offset) },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    // Get total count
    const [countResult] = await UnifiedQueries.sequelize.query(`
      SELECT COUNT(*) as total
      FROM properties p
      ${whereClause}
    `, {
      replacements,
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'view_properties',
      'property',
      null,
      { filters: req.query, propertyCount: properties.length },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      data: {
        properties,
        pagination: {
          total: parseInt(countResult[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < parseInt(countResult[0].total)
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      error: 'Property service error',
      code: 'PROPERTY_SERVICE_ERROR',
      message: 'Unable to fetch properties. Please try again.'
    });
  }
});

/**
 * @route   GET /api/internal/v1/properties/:id
 * @desc    Get single property details
 * @access  Private (Role-based access)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has access to this property
    const hasAccess = await UnifiedQueries.checkPropertyAccess(
      req.user.id,
      req.user.role,
      req.user.clientId,
      id
    );
    
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Property access denied',
        code: 'PROPERTY_ACCESS_DENIED',
        message: 'You do not have access to this property'
      });
    }
    
    const [properties] = await UnifiedQueries.sequelize.query(`
      SELECT 
        p.*,
        c.company_name as "clientCompanyName",
        c.primary_contact_name as "clientContactName",
        c.primary_contact_email as "clientContactEmail",
        c.primary_contact_phone as "clientContactPhone",
        COUNT(DISTINCT pa.guard_id) as "assignedGuards",
        COUNT(DISTINCT sop.id) as "sopCount",
        COUNT(DISTINCT cl.id) as "contactListCount",
        COUNT(DISTINCT i.id) as "recentIncidents"
      FROM properties p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN property_assignments pa ON p.id = pa.property_id
      LEFT JOIN standard_operating_procedures sop ON p.id = sop.property_id
      LEFT JOIN contact_lists cl ON p.id = cl.property_id
      LEFT JOIN incidents i ON p.id = i.property_id AND i.created_at >= NOW() - INTERVAL '30 days'
      WHERE p.id = :id
      GROUP BY p.id, c.id
    `, {
      replacements: { id },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    if (properties.length === 0) {
      return res.status(404).json({
        error: 'Property not found',
        code: 'PROPERTY_NOT_FOUND',
        message: 'The requested property does not exist'
      });
    }
    
    // Get assigned guards for this property
    const [assignedGuards] = await UnifiedQueries.sequelize.query(`
      SELECT 
        g.id,
        g.first_name as "firstName",
        g.last_name as "lastName",
        g.email,
        g.phone,
        g.badge_number as "badgeNumber",
        g.status,
        pa.assigned_at as "assignedAt",
        pa.shift_schedule as "shiftSchedule"
      FROM guards g
      JOIN property_assignments pa ON g.id = pa.guard_id
      WHERE pa.property_id = :propertyId AND g.status = 'active'
      ORDER BY g.last_name, g.first_name
    `, {
      replacements: { propertyId: id },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'view_property_details',
      'property',
      id,
      {},
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      data: {
        property: {
          ...properties[0],
          assignedGuards
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching property details:', error);
    res.status(500).json({
      error: 'Property service error',
      code: 'PROPERTY_SERVICE_ERROR',
      message: 'Unable to fetch property details'
    });
  }
});

/**
 * @route   GET /api/internal/v1/properties/:id/incidents
 * @desc    Get incidents for a property
 * @access  Private (Role-based access)
 */
router.get('/:id/incidents', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0, status, incidentType, startDate, endDate } = req.query;
    
    // Check property access
    const hasAccess = await UnifiedQueries.checkPropertyAccess(
      req.user.id,
      req.user.role,
      req.user.clientId,
      id
    );
    
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Property access denied',
        code: 'PROPERTY_ACCESS_DENIED',
        message: 'You do not have access to this property'
      });
    }
    
    // Build filter conditions
    let whereClause = 'WHERE i.property_id = :propertyId';
    const replacements = { propertyId: id };
    
    if (status) {
      whereClause += ' AND i.status = :status';
      replacements.status = status;
    }
    
    if (incidentType) {
      whereClause += ' AND i.incident_type = :incidentType';
      replacements.incidentType = incidentType;
    }
    
    if (startDate) {
      whereClause += ' AND i.created_at >= :startDate';
      replacements.startDate = startDate;
    }
    
    if (endDate) {
      whereClause += ' AND i.created_at <= :endDate';
      replacements.endDate = endDate;
    }
    
    const [incidents] = await UnifiedQueries.sequelize.query(`
      SELECT 
        i.id,
        i.incident_type as "incidentType",
        i.description,
        i.priority_level as "priorityLevel",
        i.status,
        i.created_at as "createdAt",
        i.resolved_at as "resolvedAt",
        reporter.first_name || ' ' || reporter.last_name as "reportedBy",
        assigned.first_name || ' ' || assigned.last_name as "assignedTo",
        COUNT(ie.id) as "evidenceCount"
      FROM incidents i
      LEFT JOIN users reporter ON i.reported_by = reporter.id
      LEFT JOIN users assigned ON i.assigned_to = assigned.id
      LEFT JOIN incident_evidence ie ON i.id = ie.incident_id
      ${whereClause}
      GROUP BY i.id, reporter.first_name, reporter.last_name, assigned.first_name, assigned.last_name
      ORDER BY i.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { ...replacements, limit: parseInt(limit), offset: parseInt(offset) },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    res.status(200).json({
      success: true,
      data: {
        incidents,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: incidents.length === parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching property incidents:', error);
    res.status(500).json({
      error: 'Property incidents service error',
      code: 'PROPERTY_INCIDENTS_SERVICE_ERROR',
      message: 'Unable to fetch property incidents'
    });
  }
});

/**
 * @route   PUT /api/internal/v1/properties/:id
 * @desc    Update property (Admin only)
 * @access  Private (Admin only)
 */
router.put('/:id', async (req, res) => {
  try {
    // Only admins can update properties
    if (!['super_admin', 'admin_cto', 'admin_ceo'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_ROLE',
        message: 'Only administrators can update properties'
      });
    }
    
    const { id } = req.params;
    const updateFields = { ...req.body };
    
    // Remove fields that shouldn't be updated
    delete updateFields.id;
    delete updateFields.clientId;
    delete updateFields.createdAt;
    
    // Add audit fields
    updateFields.updatedAt = new Date();
    
    // Convert objects to JSON strings if needed
    if (updateFields.emergencyContactInfo) {
      updateFields.emergencyContactInfo = JSON.stringify(updateFields.emergencyContactInfo);
    }
    if (updateFields.accessCodes) {
      updateFields.accessCodes = JSON.stringify(updateFields.accessCodes);
    }
    
    // Build update query
    const setClause = Object.keys(updateFields)
      .map(key => `"${key}" = :${key}`)
      .join(', ');
    
    const [result] = await UnifiedQueries.sequelize.query(`
      UPDATE properties 
      SET ${setClause}
      WHERE id = :id
    `, {
      replacements: { ...updateFields, id },
      type: UnifiedQueries.sequelize.QueryTypes.UPDATE
    });
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Property not found',
        code: 'PROPERTY_NOT_FOUND',
        message: 'The property to update does not exist'
      });
    }
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'update_property',
      'property',
      id,
      { updatedFields: Object.keys(updateFields) },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      message: 'Property updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({
      error: 'Property update error',
      code: 'PROPERTY_UPDATE_ERROR',
      message: 'Unable to update property. Please try again.'
    });
  }
});

/**
 * @route   POST /api/internal/v1/properties
 * @desc    Create new property (Admin only)
 * @access  Private (Admin only)
 */
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    // Only admins can create properties
    if (!['super_admin', 'admin_cto', 'admin_ceo'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_ROLE',
        message: 'Only administrators can create properties'
      });
    }

    const {
      name,
      address,
      city,
      state,
      zipCode,
      country = 'United States',
      propertyType,
      clientId,
      timezone = 'America/New_York',
      emergencyContactInfo,
      specialInstructions,
      accessCodes
    } = req.body;

    // Validate required fields
    if (!name || !address || !clientId) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Property name, address, and client ID are required'
      });
    }

    // Process uploaded images
    const images = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `/property-images/${file.filename}`
    })) : [];

    // Create property ID
    const propertyId = uuidv4();

    // Prepare property data
    const propertyData = {
      id: propertyId,
      name,
      address,
      city,
      state,
      zip_code: zipCode,
      country,
      property_type: propertyType,
      client_id: clientId,
      timezone,
      emergency_contact_info: emergencyContactInfo ? JSON.stringify(emergencyContactInfo) : null,
      special_instructions: specialInstructions,
      access_codes: accessCodes ? JSON.stringify(accessCodes) : null,
      property_images: images.length > 0 ? JSON.stringify(images) : null,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Insert property into database
    await UnifiedQueries.sequelize.query(`
      INSERT INTO properties (
        id, name, address, city, state, zip_code, country, property_type,
        client_id, timezone, emergency_contact_info, special_instructions,
        access_codes, property_images, status, created_at, updated_at
      ) VALUES (
        :id, :name, :address, :city, :state, :zip_code, :country, :property_type,
        :client_id, :timezone, :emergency_contact_info, :special_instructions,
        :access_codes, :property_images, :status, :created_at, :updated_at
      )
    `, {
      replacements: propertyData,
      type: UnifiedQueries.sequelize.QueryTypes.INSERT
    });

    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'create_property',
      'property',
      propertyId,
      { propertyName: name, imageCount: images.length },
      req.ip,
      req.headers['user-agent'],
      null
    );

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: {
        propertyId,
        name,
        imageCount: images.length
      }
    });

  } catch (error) {
    console.error('Error creating property:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }

    res.status(500).json({
      error: 'Property creation error',
      code: 'PROPERTY_CREATION_ERROR',
      message: 'Unable to create property. Please try again.'
    });
  }
});

/**
 * @route   DELETE /api/internal/v1/properties/:id
 * @desc    Delete property (Admin only)
 * @access  Private (Admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    // Only admins can delete properties
    if (!['super_admin', 'admin_cto', 'admin_ceo'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_ROLE',
        message: 'Only administrators can delete properties'
      });
    }

    const { id } = req.params;

    // Get property details for cleanup
    const [properties] = await UnifiedQueries.sequelize.query(`
      SELECT property_images, name FROM properties WHERE id = :id
    `, {
      replacements: { id },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });

    if (properties.length === 0) {
      return res.status(404).json({
        error: 'Property not found',
        code: 'PROPERTY_NOT_FOUND',
        message: 'The property to delete does not exist'
      });
    }

    const property = properties[0];

    // Check for existing incidents, guards, etc.
    const [dependencies] = await UnifiedQueries.sequelize.query(`
      SELECT 
        COUNT(DISTINCT i.id) as incident_count,
        COUNT(DISTINCT pa.guard_id) as guard_count,
        COUNT(DISTINCT sop.id) as sop_count
      FROM properties p
      LEFT JOIN incidents i ON p.id = i.property_id
      LEFT JOIN property_assignments pa ON p.id = pa.property_id
      LEFT JOIN standard_operating_procedures sop ON p.id = sop.property_id
      WHERE p.id = :id
    `, {
      replacements: { id },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });

    const deps = dependencies[0];
    if (deps.incident_count > 0 || deps.guard_count > 0 || deps.sop_count > 0) {
      return res.status(409).json({
        error: 'Property has dependencies',
        code: 'PROPERTY_HAS_DEPENDENCIES',
        message: `Cannot delete property. It has ${deps.incident_count} incidents, ${deps.guard_count} guard assignments, and ${deps.sop_count} SOPs.`,
        details: {
          incidents: parseInt(deps.incident_count),
          guards: parseInt(deps.guard_count),
          sops: parseInt(deps.sop_count)
        }
      });
    }

    // Delete property
    await UnifiedQueries.sequelize.query(`
      DELETE FROM properties WHERE id = :id
    `, {
      replacements: { id },
      type: UnifiedQueries.sequelize.QueryTypes.DELETE
    });

    // Clean up property images
    if (property.property_images) {
      try {
        const images = JSON.parse(property.property_images);
        images.forEach(image => {
          const imagePath = path.join(PROPERTY_IMAGES_DIR, image.filename);
          fs.unlink(imagePath, (err) => {
            if (err) console.error('Error deleting property image:', err);
          });
        });
      } catch (parseError) {
        console.error('Error parsing property images:', parseError);
      }
    }

    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'delete_property',
      'property',
      id,
      { propertyName: property.name },
      req.ip,
      req.headers['user-agent'],
      null
    );

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({
      error: 'Property deletion error',
      code: 'PROPERTY_DELETION_ERROR',
      message: 'Unable to delete property. Please try again.'
    });
  }
});

/**
 * @route   POST /api/internal/v1/properties/:id/images
 * @desc    Add images to existing property (Admin only)
 * @access  Private (Admin only)
 */
router.post('/:id/images', upload.array('images', 5), async (req, res) => {
  try {
    // Only admins can modify properties
    if (!['super_admin', 'admin_cto', 'admin_ceo'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_ROLE',
        message: 'Only administrators can modify properties'
      });
    }

    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No images provided',
        code: 'NO_IMAGES_PROVIDED',
        message: 'At least one image file is required'
      });
    }

    // Get current property images
    const [properties] = await UnifiedQueries.sequelize.query(`
      SELECT property_images FROM properties WHERE id = :id
    `, {
      replacements: { id },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });

    if (properties.length === 0) {
      return res.status(404).json({
        error: 'Property not found',
        code: 'PROPERTY_NOT_FOUND',
        message: 'The property does not exist'
      });
    }

    let existingImages = [];
    if (properties[0].property_images) {
      try {
        existingImages = JSON.parse(properties[0].property_images);
      } catch (parseError) {
        console.error('Error parsing existing images:', parseError);
      }
    }

    // Process new images
    const newImages = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `/property-images/${file.filename}`,
      uploadedAt: new Date().toISOString()
    }));

    // Combine images (limit to 10 total)
    const allImages = [...existingImages, ...newImages].slice(0, 10);

    // Update property with new images
    await UnifiedQueries.sequelize.query(`
      UPDATE properties 
      SET property_images = :images, updated_at = :updatedAt
      WHERE id = :id
    `, {
      replacements: {
        images: JSON.stringify(allImages),
        updatedAt: new Date(),
        id
      },
      type: UnifiedQueries.sequelize.QueryTypes.UPDATE
    });

    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'add_property_images',
      'property',
      id,
      { newImageCount: newImages.length, totalImages: allImages.length },
      req.ip,
      req.headers['user-agent'],
      null
    );

    res.status(200).json({
      success: true,
      message: 'Images added successfully',
      data: {
        newImages: newImages.length,
        totalImages: allImages.length
      }
    });

  } catch (error) {
    console.error('Error adding property images:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }

    res.status(500).json({
      error: 'Image upload error',
      code: 'IMAGE_UPLOAD_ERROR',
      message: 'Unable to add images. Please try again.'
    });
  }
});

/**
 * @route   POST /api/internal/v1/properties/bulk-import
 * @desc    Bulk import properties from CSV (Admin only)
 * @access  Private (Admin only)
 */
router.post('/bulk-import', async (req, res) => {
  try {
    // Only admins can bulk import
    if (!['super_admin', 'admin_cto', 'admin_ceo'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_ROLE',
        message: 'Only administrators can bulk import properties'
      });
    }

    const { properties } = req.body;

    if (!properties || !Array.isArray(properties) || properties.length === 0) {
      return res.status(400).json({
        error: 'Invalid properties data',
        code: 'INVALID_PROPERTIES_DATA',
        message: 'Properties array is required and must not be empty'
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const propertyData of properties) {
      try {
        const {
          name,
          address,
          city,
          state,
          zipCode,
          country = 'United States',
          propertyType,
          clientId,
          timezone = 'America/New_York'
        } = propertyData;

        // Validate required fields
        if (!name || !address || !clientId) {
          results.failed++;
          results.errors.push({
            property: name || 'Unknown',
            error: 'Missing required fields (name, address, clientId)'
          });
          continue;
        }

        const propertyId = uuidv4();

        await UnifiedQueries.sequelize.query(`
          INSERT INTO properties (
            id, name, address, city, state, zip_code, country, property_type,
            client_id, timezone, status, created_at, updated_at
          ) VALUES (
            :id, :name, :address, :city, :state, :zip_code, :country, :property_type,
            :client_id, :timezone, 'active', :created_at, :updated_at
          )
        `, {
          replacements: {
            id: propertyId,
            name,
            address,
            city,
            state,
            zip_code: zipCode,
            country,
            property_type: propertyType,
            client_id: clientId,
            timezone,
            created_at: new Date(),
            updated_at: new Date()
          },
          type: UnifiedQueries.sequelize.QueryTypes.INSERT
        });

        results.successful++;

      } catch (propertyError) {
        results.failed++;
        results.errors.push({
          property: propertyData.name || 'Unknown',
          error: propertyError.message
        });
      }
    }

    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'bulk_import_properties',
      'property',
      null,
      { successful: results.successful, failed: results.failed },
      req.ip,
      req.headers['user-agent'],
      null
    );

    res.status(200).json({
      success: true,
      message: `Bulk import completed. ${results.successful} successful, ${results.failed} failed.`,
      data: results
    });

  } catch (error) {
    console.error('Error in bulk import:', error);
    res.status(500).json({
      error: 'Bulk import error',
      code: 'BULK_IMPORT_ERROR',
      message: 'Unable to complete bulk import. Please try again.'
    });
  }
});

export default router;
