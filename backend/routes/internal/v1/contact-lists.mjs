// backend/routes/internal/v1/contact-lists.mjs
/**
 * APEX AI INTERNAL CONTACT LISTS API ROUTES
 * =========================================
 * API endpoints for notification contact lists management
 * Used by desktop app for automated alert notifications
 */

import express from 'express';
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

// Apply authentication and rate limiting to all routes
router.use(internalAPILimiter, authenticateToken);

// Role-based access middleware
const requireContactListAccess = requireAnyRole(['super_admin', 'admin_cto', 'admin_ceo', 'manager']);

/**
 * @route   GET /api/internal/v1/contact-lists
 * @desc    Get all contact lists (role-based access)
 * @access  Private (Admin/Manager only)
 */
router.get('/', requireContactListAccess, async (req, res) => {
  try {
    const { propertyId, listType, status, limit = 50, offset = 0 } = req.query;
    
    // Build filter conditions
    let whereClause = 'WHERE 1=1';
    const replacements = {};
    
    if (propertyId) {
      whereClause += ' AND cl.property_id = :propertyId';
      replacements.propertyId = propertyId;
    }
    
    if (listType) {
      whereClause += ' AND cl.list_type = :listType';
      replacements.listType = listType;
    }
    
    if (status) {
      whereClause += ' AND cl.status = :status';
      replacements.status = status;
    }
    
    // Role-based property filtering
    if (req.user.role === 'manager' && req.user.assignedProperties) {
      whereClause += ' AND cl.property_id = ANY(:assignedProperties)';
      replacements.assignedProperties = req.user.assignedProperties;
    }
    
    const [contactLists] = await UnifiedQueries.sequelize.query(`
      SELECT 
        cl.id,
        cl.name,
        cl.description,
        cl.property_id as "propertyId",
        cl.list_type as "listType",
        cl.priority_order as "priorityOrder",
        cl.contacts,
        cl.notification_methods as "notificationMethods",
        cl.notification_schedule as "notificationSchedule",
        cl.escalation_delay_minutes as "escalationDelayMinutes",
        cl.max_escalation_attempts as "maxEscalationAttempts",
        cl.require_acknowledgment as "requireAcknowledgment",
        cl.applicable_incident_types as "applicableIncidentTypes",
        cl.excluded_incident_types as "excludedIncidentTypes",
        cl.active_hours as "activeHours",
        cl.timezone,
        cl.status,
        cl.effective_date as "effectiveDate",
        cl.expiration_date as "expirationDate",
        cl.times_used as "timesUsed",
        cl.success_rate as "successRate",
        cl.last_used_at as "lastUsedAt",
        cl.tags,
        cl.notes,
        cl.created_at as "createdAt",
        cl.updated_at as "updatedAt",
        p.name as "propertyName",
        p.address as "propertyAddress",
        creator.first_name || ' ' || creator.last_name as "createdByName"
      FROM contact_lists cl
      LEFT JOIN properties p ON cl.property_id = p.id
      LEFT JOIN users creator ON cl.created_by = creator.id
      ${whereClause}
      ORDER BY cl.priority_order ASC, cl.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { ...replacements, limit: parseInt(limit), offset: parseInt(offset) },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    // Get total count
    const [countResult] = await UnifiedQueries.sequelize.query(`
      SELECT COUNT(*) as total
      FROM contact_lists cl
      ${whereClause}
    `, {
      replacements,
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'view_contact_lists',
      'contact_list',
      null,
      { filters: req.query },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      data: {
        contactLists,
        pagination: {
          total: parseInt(countResult[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < parseInt(countResult[0].total)
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching contact lists:', error);
    res.status(500).json({
      error: 'Contact list service error',
      code: 'CONTACT_LIST_SERVICE_ERROR',
      message: 'Unable to fetch contact lists. Please try again.'
    });
  }
});

/**
 * @route   GET /api/internal/v1/contact-lists/:id
 * @desc    Get single contact list by ID
 * @access  Private (Admin/Manager only)
 */
router.get('/:id', requireContactListAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [contactLists] = await UnifiedQueries.sequelize.query(`
      SELECT 
        cl.*,
        p.name as "propertyName",
        p.address as "propertyAddress",
        creator.first_name || ' ' || creator.last_name as "createdByName"
      FROM contact_lists cl
      LEFT JOIN properties p ON cl.property_id = p.id
      LEFT JOIN users creator ON cl.created_by = creator.id
      WHERE cl.id = :id
    `, {
      replacements: { id },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    if (contactLists.length === 0) {
      return res.status(404).json({
        error: 'Contact list not found',
        code: 'CONTACT_LIST_NOT_FOUND',
        message: 'The requested contact list does not exist'
      });
    }
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'view_contact_list_details',
      'contact_list',
      id,
      {},
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      data: {
        contactList: contactLists[0]
      }
    });
    
  } catch (error) {
    console.error('Error fetching contact list:', error);
    res.status(500).json({
      error: 'Contact list service error',
      code: 'CONTACT_LIST_SERVICE_ERROR',
      message: 'Unable to fetch contact list details'
    });
  }
});

/**
 * @route   POST /api/internal/v1/contact-lists
 * @desc    Create new contact list
 * @access  Private (Admin/Manager only)
 */
router.post('/', requireContactListAccess, async (req, res) => {
  try {
    const {
      name,
      description,
      propertyId,
      listType = 'primary',
      priorityOrder = 1,
      contacts = [],
      notificationMethods = ['sms', 'email'],
      notificationSchedule = {},
      escalationDelayMinutes = 5,
      maxEscalationAttempts = 3,
      requireAcknowledgment = false,
      applicableIncidentTypes = [],
      excludedIncidentTypes = [],
      activeHours = {},
      timezone = 'America/New_York',
      status = 'active',
      effectiveDate,
      expirationDate,
      tags = [],
      notes
    } = req.body;
    
    // Validation
    if (!name || !propertyId) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Name and property are required'
      });
    }
    
    if (contacts.length === 0) {
      return res.status(400).json({
        error: 'No contacts provided',
        code: 'NO_CONTACTS',
        message: 'At least one contact is required'
      });
    }
    
    // Create contact list
    const [contactListResult] = await UnifiedQueries.sequelize.query(`
      INSERT INTO contact_lists (
        name, description, property_id, list_type, priority_order,
        contacts, notification_methods, notification_schedule,
        escalation_delay_minutes, max_escalation_attempts, require_acknowledgment,
        applicable_incident_types, excluded_incident_types, active_hours,
        timezone, status, effective_date, expiration_date, tags, notes,
        created_by, created_at, updated_at
      ) VALUES (
        :name, :description, :propertyId, :listType, :priorityOrder,
        :contacts, :notificationMethods, :notificationSchedule,
        :escalationDelayMinutes, :maxEscalationAttempts, :requireAcknowledgment,
        :applicableIncidentTypes, :excludedIncidentTypes, :activeHours,
        :timezone, :status, :effectiveDate, :expirationDate, :tags, :notes,
        :createdBy, NOW(), NOW()
      ) RETURNING id
    `, {
      replacements: {
        name,
        description,
        propertyId,
        listType,
        priorityOrder,
        contacts: JSON.stringify(contacts),
        notificationMethods: JSON.stringify(notificationMethods),
        notificationSchedule: JSON.stringify(notificationSchedule),
        escalationDelayMinutes,
        maxEscalationAttempts,
        requireAcknowledgment,
        applicableIncidentTypes: JSON.stringify(applicableIncidentTypes),
        excludedIncidentTypes: JSON.stringify(excludedIncidentTypes),
        activeHours: JSON.stringify(activeHours),
        timezone,
        status,
        effectiveDate: effectiveDate || null,
        expirationDate: expirationDate || null,
        tags: JSON.stringify(tags),
        notes,
        createdBy: req.user.id
      },
      type: UnifiedQueries.sequelize.QueryTypes.INSERT
    });
    
    const newContactListId = contactListResult[0].id;
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'create_contact_list',
      'contact_list',
      newContactListId,
      { name, listType, propertyId, contactCount: contacts.length },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(201).json({
      success: true,
      message: 'Contact list created successfully',
      data: {
        contactListId: newContactListId
      }
    });
    
  } catch (error) {
    console.error('Error creating contact list:', error);
    res.status(500).json({
      error: 'Contact list creation error',
      code: 'CONTACT_LIST_CREATION_ERROR',
      message: 'Unable to create contact list. Please try again.'
    });
  }
});

/**
 * @route   PUT /api/internal/v1/contact-lists/:id
 * @desc    Update existing contact list
 * @access  Private (Admin/Manager only)
 */
router.put('/:id', requireContactListAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = { ...req.body };
    
    // Remove fields that shouldn't be updated
    delete updateFields.id;
    delete updateFields.createdBy;
    delete updateFields.createdAt;
    delete updateFields.timesUsed;
    delete updateFields.successRate;
    delete updateFields.lastUsedAt;
    
    // Add audit fields
    updateFields.lastUpdatedBy = req.user.id;
    updateFields.updatedAt = new Date();
    
    // Convert arrays/objects to JSON strings
    if (updateFields.contacts) {
      updateFields.contacts = JSON.stringify(updateFields.contacts);
    }
    if (updateFields.notificationMethods) {
      updateFields.notificationMethods = JSON.stringify(updateFields.notificationMethods);
    }
    if (updateFields.notificationSchedule) {
      updateFields.notificationSchedule = JSON.stringify(updateFields.notificationSchedule);
    }
    if (updateFields.applicableIncidentTypes) {
      updateFields.applicableIncidentTypes = JSON.stringify(updateFields.applicableIncidentTypes);
    }
    if (updateFields.excludedIncidentTypes) {
      updateFields.excludedIncidentTypes = JSON.stringify(updateFields.excludedIncidentTypes);
    }
    if (updateFields.activeHours) {
      updateFields.activeHours = JSON.stringify(updateFields.activeHours);
    }
    if (updateFields.tags) {
      updateFields.tags = JSON.stringify(updateFields.tags);
    }
    
    // Build update query
    const setClause = Object.keys(updateFields)
      .map(key => `"${key}" = :${key}`)
      .join(', ');
    
    const [result] = await UnifiedQueries.sequelize.query(`
      UPDATE contact_lists 
      SET ${setClause}
      WHERE id = :id
    `, {
      replacements: { ...updateFields, id },
      type: UnifiedQueries.sequelize.QueryTypes.UPDATE
    });
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Contact list not found',
        code: 'CONTACT_LIST_NOT_FOUND',
        message: 'The contact list to update does not exist'
      });
    }
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'update_contact_list',
      'contact_list',
      id,
      { updatedFields: Object.keys(updateFields) },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      message: 'Contact list updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating contact list:', error);
    res.status(500).json({
      error: 'Contact list update error',
      code: 'CONTACT_LIST_UPDATE_ERROR',
      message: 'Unable to update contact list. Please try again.'
    });
  }
});

/**
 * @route   DELETE /api/internal/v1/contact-lists/:id
 * @desc    Delete contact list
 * @access  Private (Admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    // Only super admins and CTOs can delete contact lists
    if (!['super_admin', 'admin_cto'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_ROLE',
        message: 'Only super administrators can delete contact lists'
      });
    }
    
    const { id } = req.params;
    
    // Check if contact list exists and get details for logging
    const [contactLists] = await UnifiedQueries.sequelize.query(`
      SELECT name, list_type, property_id 
      FROM contact_lists 
      WHERE id = :id
    `, {
      replacements: { id },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    if (contactLists.length === 0) {
      return res.status(404).json({
        error: 'Contact list not found',
        code: 'CONTACT_LIST_NOT_FOUND',
        message: 'The contact list to delete does not exist'
      });
    }
    
    // Delete the contact list
    await UnifiedQueries.sequelize.query(`
      DELETE FROM contact_lists WHERE id = :id
    `, {
      replacements: { id },
      type: UnifiedQueries.sequelize.QueryTypes.DELETE
    });
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'delete_contact_list',
      'contact_list',
      id,
      { 
        name: contactLists[0].name, 
        listType: contactLists[0].list_type,
        propertyId: contactLists[0].property_id
      },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      message: 'Contact list deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting contact list:', error);
    res.status(500).json({
      error: 'Contact list deletion error',
      code: 'CONTACT_LIST_DELETION_ERROR',
      message: 'Unable to delete contact list. Please try again.'
    });
  }
});

/**
 * @route   POST /api/internal/v1/contact-lists/test-notifications
 * @desc    Test notifications for contact list
 * @access  Private (Admin/Manager only)
 */
router.post('/test-notifications', requireContactListAccess, async (req, res) => {
  try {
    const { contacts, notificationMethods, testMessage } = req.body;
    
    if (!contacts || contacts.length === 0) {
      return res.status(400).json({
        error: 'No contacts provided',
        code: 'NO_CONTACTS',
        message: 'At least one contact is required for testing'
      });
    }
    
    // Mock notification sending (replace with actual implementation)
    let successful = 0;
    let failed = 0;
    const results = [];
    
    for (const contact of contacts) {
      for (const method of notificationMethods) {
        try {
          // Here you would integrate with actual notification services
          // For now, we'll simulate success/failure
          const success = Math.random() > 0.1; // 90% success rate for demo
          
          if (success) {
            successful++;
            results.push({
              contact: contact.name,
              method: method,
              status: 'sent',
              message: `Test notification sent via ${method}`
            });
          } else {
            failed++;
            results.push({
              contact: contact.name,
              method: method,
              status: 'failed',
              message: `Failed to send via ${method}`
            });
          }
        } catch (error) {
          failed++;
          results.push({
            contact: contact.name,
            method: method,
            status: 'error',
            message: error.message
          });
        }
      }
    }
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'test_notifications',
      'contact_list',
      null,
      { 
        contactCount: contacts.length,
        methods: notificationMethods,
        successful,
        failed
      },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      message: 'Test notifications completed',
      data: {
        successful,
        failed,
        total: successful + failed,
        results
      }
    });
    
  } catch (error) {
    console.error('Error testing notifications:', error);
    res.status(500).json({
      error: 'Notification test error',
      code: 'NOTIFICATION_TEST_ERROR',
      message: 'Unable to test notifications. Please try again.'
    });
  }
});

export default router;
