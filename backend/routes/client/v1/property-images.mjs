// backend/routes/client/v1/property-images.mjs
/**
 * APEX AI CLIENT PORTAL - Property Images API
 * ===========================================
 * Read-only property image access for client portal users
 * Features: Secure image viewing, client data isolation, audit logging
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import { UnifiedQueries } from '../../../database/unifiedQueries.mjs';
import { authenticateToken, requireClientRole } from '../../../middleware/unifiedAuth.mjs';

const router = express.Router();

// Rate limiting for client API
const clientAPILimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Higher limit for viewing images
  message: {
    error: 'Rate limit exceeded',
    code: 'CLIENT_API_RATE_LIMIT',
    message: 'Too many requests. Please wait a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication and rate limiting to all routes
router.use(clientAPILimiter, authenticateToken, requireClientRole);

/**
 * @route   GET /api/client/v1/property-images/:propertyId
 * @desc    Get all images for a specific property (client can only see their own properties)
 * @access  Private (Client role)
 */
router.get('/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    // Verify client has access to this property
    const hasAccess = await UnifiedQueries.checkClientPropertyAccess(
      req.user.clientId,
      propertyId
    );
    
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Property access denied',
        code: 'PROPERTY_ACCESS_DENIED',
        message: 'You do not have access to this property'
      });
    }
    
    // Get property with images
    const [properties] = await UnifiedQueries.sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.property_images,
        p.image_count,
        p.images_last_updated,
        p.primary_image
      FROM properties p
      WHERE p.id = :propertyId AND p.client_id = :clientId AND p.status = 'active'
    `, {
      replacements: { 
        propertyId, 
        clientId: req.user.clientId 
      },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    if (properties.length === 0) {
      return res.status(404).json({
        error: 'Property not found',
        code: 'PROPERTY_NOT_FOUND',
        message: 'Property not found or access denied'
      });
    }
    
    const property = properties[0];
    let images = [];
    
    if (property.property_images) {
      try {
        images = JSON.parse(property.property_images);
        
        // Add watermark URLs for client portal
        images = images.map(image => ({
          ...image,
          thumbnailUrl: `/property-images/thumbnails/${image.filename}`,
          watermarkedUrl: `/property-images/watermarked/${image.filename}`,
          downloadUrl: `/api/client/v1/property-images/${propertyId}/download/${image.filename}`
        }));
      } catch (parseError) {
        console.error('Error parsing property images:', parseError);
        images = [];
      }
    }
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'view_property_images',
      'property_images',
      propertyId,
      { imageCount: images.length },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      data: {
        propertyId,
        propertyName: property.name,
        imageCount: property.image_count || 0,
        lastUpdated: property.images_last_updated,
        primaryImage: property.primary_image,
        images
      }
    });
    
  } catch (error) {
    console.error('Error fetching property images:', error);
    res.status(500).json({
      error: 'Property images service error',
      code: 'PROPERTY_IMAGES_SERVICE_ERROR',
      message: 'Unable to fetch property images. Please try again.'
    });
  }
});

/**
 * @route   GET /api/client/v1/property-images/:propertyId/download/:filename
 * @desc    Download a property image with watermark (client access)
 * @access  Private (Client role)
 */
router.get('/:propertyId/download/:filename', async (req, res) => {
  try {
    const { propertyId, filename } = req.params;
    
    // Verify client has access to this property
    const hasAccess = await UnifiedQueries.checkClientPropertyAccess(
      req.user.clientId,
      propertyId
    );
    
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Property access denied',
        code: 'PROPERTY_ACCESS_DENIED',
        message: 'You do not have access to this property'
      });
    }
    
    // Verify the image belongs to this property
    const [properties] = await UnifiedQueries.sequelize.query(`
      SELECT property_images FROM properties 
      WHERE id = :propertyId AND client_id = :clientId
    `, {
      replacements: { 
        propertyId, 
        clientId: req.user.clientId 
      },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    if (properties.length === 0) {
      return res.status(404).json({
        error: 'Property not found',
        code: 'PROPERTY_NOT_FOUND',
        message: 'Property not found'
      });
    }
    
    let imageExists = false;
    if (properties[0].property_images) {
      try {
        const images = JSON.parse(properties[0].property_images);
        imageExists = images.some(img => img.filename === filename);
      } catch (parseError) {
        console.error('Error parsing property images:', parseError);
      }
    }
    
    if (!imageExists) {
      return res.status(404).json({
        error: 'Image not found',
        code: 'IMAGE_NOT_FOUND',
        message: 'The requested image does not exist for this property'
      });
    }
    
    // Check if file exists on disk
    const imagePath = path.join(process.cwd(), 'public', 'property-images', filename);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        error: 'Image file not found',
        code: 'IMAGE_FILE_NOT_FOUND',
        message: 'The image file is not available'
      });
    }
    
    // Log download activity
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'download_property_image',
      'property_image',
      propertyId,
      { filename },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    // Set appropriate headers for image download
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Watermark', 'APEX-AI-CLIENT-PORTAL');
    
    // Send file
    res.sendFile(imagePath);
    
  } catch (error) {
    console.error('Error downloading property image:', error);
    res.status(500).json({
      error: 'Image download error',
      code: 'IMAGE_DOWNLOAD_ERROR',
      message: 'Unable to download image. Please try again.'
    });
  }
});

/**
 * @route   GET /api/client/v1/property-images/gallery/:propertyId
 * @desc    Get property image gallery with metadata for client portal
 * @access  Private (Client role)
 */
router.get('/gallery/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { page = 1, limit = 12 } = req.query;
    
    // Verify client has access to this property
    const hasAccess = await UnifiedQueries.checkClientPropertyAccess(
      req.user.clientId,
      propertyId
    );
    
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Property access denied',
        code: 'PROPERTY_ACCESS_DENIED',
        message: 'You do not have access to this property'
      });
    }
    
    // Get property with detailed image information
    const [properties] = await UnifiedQueries.sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.address,
        p.property_images,
        p.image_count,
        p.images_last_updated,
        p.primary_image,
        c.company_name as "clientName"
      FROM properties p
      JOIN clients c ON p.client_id = c.id
      WHERE p.id = :propertyId AND p.client_id = :clientId AND p.status = 'active'
    `, {
      replacements: { 
        propertyId, 
        clientId: req.user.clientId 
      },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    if (properties.length === 0) {
      return res.status(404).json({
        error: 'Property not found',
        code: 'PROPERTY_NOT_FOUND',
        message: 'Property not found or access denied'
      });
    }
    
    const property = properties[0];
    let allImages = [];
    
    if (property.property_images) {
      try {
        allImages = JSON.parse(property.property_images);
      } catch (parseError) {
        console.error('Error parsing property images:', parseError);
        allImages = [];
      }
    }
    
    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedImages = allImages.slice(offset, offset + parseInt(limit));
    
    // Enhanced image data for gallery
    const galleryImages = paginatedImages.map((image, index) => ({
      id: `${propertyId}-${index}`,
      filename: image.filename,
      originalName: image.originalName,
      thumbnailUrl: `/property-images/thumbnails/${image.filename}`,
      fullUrl: `/property-images/${image.filename}`,
      watermarkedUrl: `/property-images/watermarked/${image.filename}`,
      downloadUrl: `/api/client/v1/property-images/${propertyId}/download/${image.filename}`,
      size: image.size,
      uploadedAt: image.uploadedAt,
      isPrimary: property.primary_image === image.filename,
      dimensions: {
        width: image.width || null,
        height: image.height || null
      }
    }));
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'view_property_gallery',
      'property_gallery',
      propertyId,
      { page: parseInt(page), limit: parseInt(limit), totalImages: allImages.length },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      data: {
        property: {
          id: property.id,
          name: property.name,
          address: property.address,
          clientName: property.clientName
        },
        gallery: {
          images: galleryImages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: allImages.length,
            totalPages: Math.ceil(allImages.length / parseInt(limit)),
            hasNext: offset + parseInt(limit) < allImages.length,
            hasPrev: parseInt(page) > 1
          }
        },
        metadata: {
          totalImages: property.image_count || 0,
          lastUpdated: property.images_last_updated,
          primaryImage: property.primary_image
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching property gallery:', error);
    res.status(500).json({
      error: 'Property gallery service error',
      code: 'PROPERTY_GALLERY_SERVICE_ERROR',
      message: 'Unable to fetch property gallery. Please try again.'
    });
  }
});

/**
 * @route   GET /api/client/v1/property-images/stats
 * @desc    Get image statistics for all client properties
 * @access  Private (Client role)
 */
router.get('/stats', async (req, res) => {
  try {
    // Get property image statistics for this client
    const [stats] = await UnifiedQueries.sequelize.query(`
      SELECT 
        COUNT(p.id) as "totalProperties",
        COUNT(CASE WHEN p.image_count > 0 THEN 1 END) as "propertiesWithImages",
        COALESCE(SUM(p.image_count), 0) as "totalImages",
        COALESCE(AVG(p.image_count), 0) as "averageImagesPerProperty",
        MAX(p.images_last_updated) as "lastImageUpload"
      FROM properties p
      WHERE p.client_id = :clientId AND p.status = 'active'
    `, {
      replacements: { clientId: req.user.clientId },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    // Get recent image activity
    const [recentActivity] = await UnifiedQueries.sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.image_count,
        p.images_last_updated
      FROM properties p
      WHERE p.client_id = :clientId 
        AND p.status = 'active' 
        AND p.images_last_updated IS NOT NULL
      ORDER BY p.images_last_updated DESC
      LIMIT 5
    `, {
      replacements: { clientId: req.user.clientId },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'view_image_stats',
      'image_stats',
      null,
      { totalProperties: stats[0].totalProperties },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalProperties: parseInt(stats[0].totalProperties),
          propertiesWithImages: parseInt(stats[0].propertiesWithImages),
          totalImages: parseInt(stats[0].totalImages),
          averageImagesPerProperty: parseFloat(stats[0].averageImagesPerProperty).toFixed(1),
          lastImageUpload: stats[0].lastImageUpload
        },
        recentActivity
      }
    });
    
  } catch (error) {
    console.error('Error fetching image statistics:', error);
    res.status(500).json({
      error: 'Image statistics service error',
      code: 'IMAGE_STATS_SERVICE_ERROR',
      message: 'Unable to fetch image statistics. Please try again.'
    });
  }
});

export default router;
