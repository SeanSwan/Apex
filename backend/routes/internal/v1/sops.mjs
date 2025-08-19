// backend/routes/internal/v1/sops.mjs
/**
 * APEX AI INTERNAL SOPS API ROUTES
 * ================================
 * API endpoints for Standard Operating Procedures management
 * Used by desktop app for Voice AI Dispatcher configuration
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { UnifiedQueries } from '../../../database/unifiedQueries.mjs';
import { authenticateToken, requireAnyRole } from '../../../middleware/unifiedAuth.mjs';

const router = express.Router();

// Rate limiting for internal APIs (200 requests per 5 minutes)
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

// Role-based access middleware for SOPs
const requireSOPAccess = requireAnyRole(['super_admin', 'admin_cto', 'admin_ceo', 'manager']);

/**
 * @route   GET /api/internal/v1/sops
 * @desc    Get all SOPs (role-based access)
 * @access  Private (Admin/Manager only)
 */
router.get('/', requireSOPAccess, async (req, res) => {
  try {
    const { propertyId, incidentType, status, limit = 50, offset = 0 } = req.query;
    
    // Build filter conditions
    let whereClause = 'WHERE 1=1';
    const replacements = {};
    
    if (propertyId) {
      whereClause += ' AND s.property_id = :propertyId';
      replacements.propertyId = propertyId;
    }
    
    if (incidentType) {
      whereClause += ' AND s.incident_type = :incidentType';
      replacements.incidentType = incidentType;
    }
    
    if (status) {
      whereClause += ' AND s.status = :status';
      replacements.status = status;
    }
    
    // Admin users can see all SOPs, managers may have property restrictions
    if (req.user.role === 'manager' && req.user.assignedProperties) {
      whereClause += ' AND s.property_id = ANY(:assignedProperties)';
      replacements.assignedProperties = req.user.assignedProperties;
    }
    
    const [sops] = await UnifiedQueries.sequelize.query(`
      SELECT 
        s.id,
        s.title,
        s.description,
        s.property_id as "propertyId",
        s.incident_type as "incidentType",
        s.priority_level as "priorityLevel",
        s.initial_response_script as "initialResponseScript",
        s.information_gathering_questions as "informationGatheringQuestions",
        s.conversation_flow as "conversationFlow",
        s.automated_actions as "automatedActions",
        s.notify_guard as "notifyGuard",
        s.notify_manager as "notifyManager",
        s.notify_emergency_services as "notifyEmergencyServices",
        s.notification_delay_minutes as "notificationDelayMinutes",
        s.escalation_triggers as "escalationTriggers",
        s.auto_escalate_after_minutes as "autoEscalateAfterMinutes",
        s.human_takeover_threshold as "humanTakeoverThreshold",
        s.primary_contact_list_id as "primaryContactListId",
        s.emergency_contact_list_id as "emergencyContactListId",
        s.compliance_requirements as "complianceRequirements",
        s.documentation_requirements as "documentationRequirements",
        s.status,
        s.version,
        s.effective_date as "effectiveDate",
        s.expiration_date as "expirationDate",
        s.times_used as "timesUsed",
        s.success_rate as "successRate",
        s.last_used_at as "lastUsedAt",
        s.tags,
        s.notes,
        s.created_at as "createdAt",
        s.updated_at as "updatedAt",
        p.name as "propertyName",
        p.address as "propertyAddress",
        creator.first_name || ' ' || creator.last_name as "createdByName",
        approver.first_name || ' ' || approver.last_name as "approvedByName"
      FROM standard_operating_procedures s
      LEFT JOIN properties p ON s.property_id = p.id
      LEFT JOIN users creator ON s.created_by = creator.id
      LEFT JOIN users approver ON s.approved_by = approver.id
      ${whereClause}
      ORDER BY s.priority_level DESC, s.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { ...replacements, limit: parseInt(limit), offset: parseInt(offset) },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    // Get total count
    const [countResult] = await UnifiedQueries.sequelize.query(`
      SELECT COUNT(*) as total
      FROM standard_operating_procedures s
      ${whereClause}
    `, {
      replacements,
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'view_sops',
      'sop',
      null,
      { filters: req.query },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      data: {
        sops,
        pagination: {
          total: parseInt(countResult[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < parseInt(countResult[0].total)
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching SOPs:', error);
    res.status(500).json({
      error: 'SOP service error',
      code: 'SOP_SERVICE_ERROR',
      message: 'Unable to fetch SOPs. Please try again.'
    });
  }
});

/**
 * @route   GET /api/internal/v1/sops/:id
 * @desc    Get single SOP by ID
 * @access  Private (Admin/Manager only)
 */
router.get('/:id', requireSOPAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [sops] = await UnifiedQueries.sequelize.query(`
      SELECT 
        s.*,
        p.name as "propertyName",
        p.address as "propertyAddress",
        creator.first_name || ' ' || creator.last_name as "createdByName",
        approver.first_name || ' ' || approver.last_name as "approvedByName"
      FROM standard_operating_procedures s
      LEFT JOIN properties p ON s.property_id = p.id
      LEFT JOIN users creator ON s.created_by = creator.id
      LEFT JOIN users approver ON s.approved_by = approver.id
      WHERE s.id = :id
    `, {
      replacements: { id },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    if (sops.length === 0) {
      return res.status(404).json({
        error: 'SOP not found',
        code: 'SOP_NOT_FOUND',
        message: 'The requested SOP does not exist'
      });
    }
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'view_sop_details',
      'sop',
      id,
      {},
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      data: {
        sop: sops[0]
      }
    });
    
  } catch (error) {
    console.error('Error fetching SOP:', error);
    res.status(500).json({
      error: 'SOP service error',
      code: 'SOP_SERVICE_ERROR',
      message: 'Unable to fetch SOP details'
    });
  }
});

/**
 * @route   POST /api/internal/v1/sops
 * @desc    Create new SOP
 * @access  Private (Admin/Manager only)
 */
router.post('/', requireSOPAccess, async (req, res) => {
  try {
    const {
      title,
      description,
      propertyId,
      incidentType,
      priorityLevel = 'medium',
      initialResponseScript,
      informationGatheringQuestions = [],
      conversationFlow = {},
      automatedActions = [],
      notifyGuard = true,
      notifyManager = false,
      notifyEmergencyServices = false,
      notificationDelayMinutes = 0,
      escalationTriggers = {},
      autoEscalateAfterMinutes,
      humanTakeoverThreshold = 0.70,
      primaryContactListId,
      emergencyContactListId,
      complianceRequirements = {},
      documentationRequirements = {},
      status = 'draft',
      version = '1.0',
      effectiveDate,
      expirationDate,
      tags = [],
      notes
    } = req.body;
    
    // Validation
    if (!title || !propertyId || !incidentType || !initialResponseScript) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Title, property, incident type, and initial response script are required'
      });
    }
    
    // Create SOP
    const [sopResult] = await UnifiedQueries.sequelize.query(`
      INSERT INTO standard_operating_procedures (
        title, description, property_id, incident_type, priority_level,
        initial_response_script, information_gathering_questions, conversation_flow,
        automated_actions, notify_guard, notify_manager, notify_emergency_services,
        notification_delay_minutes, escalation_triggers, auto_escalate_after_minutes,
        human_takeover_threshold, primary_contact_list_id, emergency_contact_list_id,
        compliance_requirements, documentation_requirements, status, version,
        effective_date, expiration_date, tags, notes, created_by, created_at, updated_at
      ) VALUES (
        :title, :description, :propertyId, :incidentType, :priorityLevel,
        :initialResponseScript, :informationGatheringQuestions, :conversationFlow,
        :automatedActions, :notifyGuard, :notifyManager, :notifyEmergencyServices,
        :notificationDelayMinutes, :escalationTriggers, :autoEscalateAfterMinutes,
        :humanTakeoverThreshold, :primaryContactListId, :emergencyContactListId,
        :complianceRequirements, :documentationRequirements, :status, :version,
        :effectiveDate, :expirationDate, :tags, :notes, :createdBy, NOW(), NOW()
      ) RETURNING id
    `, {
      replacements: {
        title,
        description,
        propertyId,
        incidentType,
        priorityLevel,
        initialResponseScript,
        informationGatheringQuestions: JSON.stringify(informationGatheringQuestions),
        conversationFlow: JSON.stringify(conversationFlow),
        automatedActions: JSON.stringify(automatedActions),
        notifyGuard,
        notifyManager,
        notifyEmergencyServices,
        notificationDelayMinutes,
        escalationTriggers: JSON.stringify(escalationTriggers),
        autoEscalateAfterMinutes,
        humanTakeoverThreshold,
        primaryContactListId: primaryContactListId || null,
        emergencyContactListId: emergencyContactListId || null,
        complianceRequirements: JSON.stringify(complianceRequirements),
        documentationRequirements: JSON.stringify(documentationRequirements),
        status,
        version,
        effectiveDate: effectiveDate || null,
        expirationDate: expirationDate || null,
        tags: JSON.stringify(tags),
        notes,
        createdBy: req.user.id
      },
      type: UnifiedQueries.sequelize.QueryTypes.INSERT
    });
    
    const newSOPId = sopResult[0].id;
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'create_sop',
      'sop',
      newSOPId,
      { title, incidentType, propertyId },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(201).json({
      success: true,
      message: 'SOP created successfully',
      data: {
        sopId: newSOPId
      }
    });
    
  } catch (error) {
    console.error('Error creating SOP:', error);
    res.status(500).json({
      error: 'SOP creation error',
      code: 'SOP_CREATION_ERROR',
      message: 'Unable to create SOP. Please try again.'
    });
  }
});

/**
 * @route   PUT /api/internal/v1/sops/:id
 * @desc    Update existing SOP
 * @access  Private (Admin/Manager only)
 */
router.put('/:id', requireSOPAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = { ...req.body };
    
    // Remove fields that shouldn't be updated this way
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
    if (updateFields.informationGatheringQuestions) {
      updateFields.informationGatheringQuestions = JSON.stringify(updateFields.informationGatheringQuestions);
    }
    if (updateFields.conversationFlow) {
      updateFields.conversationFlow = JSON.stringify(updateFields.conversationFlow);
    }
    if (updateFields.automatedActions) {
      updateFields.automatedActions = JSON.stringify(updateFields.automatedActions);
    }
    if (updateFields.escalationTriggers) {
      updateFields.escalationTriggers = JSON.stringify(updateFields.escalationTriggers);
    }
    if (updateFields.complianceRequirements) {
      updateFields.complianceRequirements = JSON.stringify(updateFields.complianceRequirements);
    }
    if (updateFields.documentationRequirements) {
      updateFields.documentationRequirements = JSON.stringify(updateFields.documentationRequirements);
    }
    if (updateFields.tags) {
      updateFields.tags = JSON.stringify(updateFields.tags);
    }
    
    // Build update query
    const setClause = Object.keys(updateFields)
      .map(key => `"${key}" = :${key}`)
      .join(', ');
    
    const [result] = await UnifiedQueries.sequelize.query(`
      UPDATE standard_operating_procedures 
      SET ${setClause}
      WHERE id = :id
    `, {
      replacements: { ...updateFields, id },
      type: UnifiedQueries.sequelize.QueryTypes.UPDATE
    });
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'SOP not found',
        code: 'SOP_NOT_FOUND',
        message: 'The SOP to update does not exist'
      });
    }
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'update_sop',
      'sop',
      id,
      { updatedFields: Object.keys(updateFields) },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      message: 'SOP updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating SOP:', error);
    res.status(500).json({
      error: 'SOP update error',
      code: 'SOP_UPDATE_ERROR',
      message: 'Unable to update SOP. Please try again.'
    });
  }
});

/**
 * @route   DELETE /api/internal/v1/sops/:id
 * @desc    Delete SOP
 * @access  Private (Admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    // Only super admins and CTOs can delete SOPs
    if (!['super_admin', 'admin_cto'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_ROLE',
        message: 'Only super administrators can delete SOPs'
      });
    }
    
    const { id } = req.params;
    
    // Check if SOP exists and get details for logging
    const [sops] = await UnifiedQueries.sequelize.query(`
      SELECT title, incident_type, property_id 
      FROM standard_operating_procedures 
      WHERE id = :id
    `, {
      replacements: { id },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    if (sops.length === 0) {
      return res.status(404).json({
        error: 'SOP not found',
        code: 'SOP_NOT_FOUND',
        message: 'The SOP to delete does not exist'
      });
    }
    
    // Delete the SOP
    await UnifiedQueries.sequelize.query(`
      DELETE FROM standard_operating_procedures WHERE id = :id
    `, {
      replacements: { id },
      type: UnifiedQueries.sequelize.QueryTypes.DELETE
    });
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'delete_sop',
      'sop',
      id,
      { 
        title: sops[0].title, 
        incidentType: sops[0].incident_type,
        propertyId: sops[0].property_id
      },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      message: 'SOP deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting SOP:', error);
    res.status(500).json({
      error: 'SOP deletion error',
      code: 'SOP_DELETION_ERROR',
      message: 'Unable to delete SOP. Please try again.'
    });
  }
});

export default router;
