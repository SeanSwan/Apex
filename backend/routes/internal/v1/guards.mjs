// backend/routes/internal/v1/guards.mjs
/**
 * APEX AI INTERNAL GUARDS API ROUTES
 * ==================================
 * API endpoints for guard and dispatch management
 * Used by desktop app for Voice AI Dispatcher operations
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

// Role-based access middleware for guard management
const requireGuardManagementAccess = requireAnyRole(['super_admin', 'admin_cto', 'admin_ceo', 'manager']);

/**
 * @route   GET /api/internal/v1/guards
 * @desc    Get all guards (role-based access)
 * @access  Private (Admin/Manager only)
 */
router.get('/', requireGuardManagementAccess, async (req, res) => {
  try {
    const { status, propertyId, search, limit = 50, offset = 0 } = req.query;
    
    // Build filter conditions
    let whereClause = 'WHERE 1=1';
    const replacements = {};
    
    if (status) {
      whereClause += ' AND g.status = :status';
      replacements.status = status;
    }
    
    if (propertyId) {
      whereClause += ' AND EXISTS (SELECT 1 FROM property_assignments pa WHERE pa.guard_id = g.id AND pa.property_id = :propertyId)';
      replacements.propertyId = propertyId;
    }
    
    if (search) {
      whereClause += ' AND (g.first_name ILIKE :search OR g.last_name ILIKE :search OR g.email ILIKE :search OR g.badge_number ILIKE :search)';
      replacements.search = `%${search}%`;
    }
    
    // Role-based filtering for managers
    if (req.user.role === 'manager' && req.user.assignedProperties) {
      whereClause += ' AND EXISTS (SELECT 1 FROM property_assignments pa WHERE pa.guard_id = g.id AND pa.property_id = ANY(:assignedProperties))';
      replacements.assignedProperties = req.user.assignedProperties;
    }
    
    const [guards] = await UnifiedQueries.sequelize.query(`
      SELECT 
        g.id,
        g.first_name as "firstName",
        g.last_name as "lastName",
        g.email,
        g.phone,
        g.badge_number as "badgeNumber",
        g.hire_date as "hireDate",
        g.employment_status as "employmentStatus",
        g.certifications,
        g.emergency_contact_info as "emergencyContactInfo",
        g.shift_schedule as "shiftSchedule",
        g.hourly_rate as "hourlyRate",
        g.status,
        g.last_check_in as "lastCheckIn",
        g.current_location as "currentLocation",
        g.created_at as "createdAt",
        g.updated_at as "updatedAt",
        COUNT(DISTINCT pa.property_id) as "assignedProperties",
        COUNT(DISTINCT i.id) as "handledIncidents",
        MAX(cl.created_at) as "lastCallLog"
      FROM guards g
      LEFT JOIN property_assignments pa ON g.id = pa.guard_id
      LEFT JOIN incidents i ON g.id = i.assigned_to AND i.status = 'resolved'
      LEFT JOIN call_logs cl ON g.id = cl.guard_id
      ${whereClause}
      GROUP BY g.id
      ORDER BY g.last_name, g.first_name
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { ...replacements, limit: parseInt(limit), offset: parseInt(offset) },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    // Get total count
    const [countResult] = await UnifiedQueries.sequelize.query(`
      SELECT COUNT(*) as total
      FROM guards g
      ${whereClause}
    `, {
      replacements,
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'view_guards',
      'guard',
      null,
      { filters: req.query, guardCount: guards.length },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      data: {
        guards,
        pagination: {
          total: parseInt(countResult[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < parseInt(countResult[0].total)
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching guards:', error);
    res.status(500).json({
      error: 'Guard service error',
      code: 'GUARD_SERVICE_ERROR',
      message: 'Unable to fetch guards. Please try again.'
    });
  }
});

/**
 * @route   GET /api/internal/v1/guards/:id
 * @desc    Get single guard details
 * @access  Private (Admin/Manager only)
 */
router.get('/:id', requireGuardManagementAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [guards] = await UnifiedQueries.sequelize.query(`
      SELECT 
        g.*,
        COUNT(DISTINCT pa.property_id) as "assignedPropertyCount",
        COUNT(DISTINCT i.id) as "totalIncidents",
        COUNT(DISTINCT CASE WHEN i.status = 'resolved' THEN i.id END) as "resolvedIncidents",
        AVG(CASE WHEN i.status = 'resolved' AND i.resolved_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (i.resolved_at - i.created_at))/60 END) as "avgResolutionTimeMinutes"
      FROM guards g
      LEFT JOIN property_assignments pa ON g.id = pa.guard_id
      LEFT JOIN incidents i ON g.id = i.assigned_to
      WHERE g.id = :id
      GROUP BY g.id
    `, {
      replacements: { id },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    if (guards.length === 0) {
      return res.status(404).json({
        error: 'Guard not found',
        code: 'GUARD_NOT_FOUND',
        message: 'The requested guard does not exist'
      });
    }
    
    // Get assigned properties
    const [assignedProperties] = await UnifiedQueries.sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.address,
        p.city,
        p.state,
        pa.assigned_at as "assignedAt",
        pa.shift_schedule as "shiftSchedule",
        c.company_name as "clientName"
      FROM properties p
      JOIN property_assignments pa ON p.id = pa.property_id
      JOIN clients c ON p.client_id = c.id
      WHERE pa.guard_id = :guardId
      ORDER BY pa.assigned_at DESC
    `, {
      replacements: { guardId: id },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    // Get recent call logs
    const [recentCallLogs] = await UnifiedQueries.sequelize.query(`
      SELECT 
        cl.id,
        cl.call_type as "callType",
        cl.caller_info as "callerInfo",
        cl.incident_type as "incidentType",
        cl.description,
        cl.status,
        cl.created_at as "createdAt",
        cl.ended_at as "endedAt",
        p.name as "propertyName"
      FROM call_logs cl
      LEFT JOIN properties p ON cl.property_id = p.id
      WHERE cl.guard_id = :guardId
      ORDER BY cl.created_at DESC
      LIMIT 20
    `, {
      replacements: { guardId: id },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'view_guard_details',
      'guard',
      id,
      {},
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      data: {
        guard: {
          ...guards[0],
          assignedProperties,
          recentCallLogs
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching guard details:', error);
    res.status(500).json({
      error: 'Guard service error',
      code: 'GUARD_SERVICE_ERROR',
      message: 'Unable to fetch guard details'
    });
  }
});

/**
 * @route   POST /api/internal/v1/guards/:id/dispatch
 * @desc    Dispatch guard to incident
 * @access  Private (Admin/Manager only)
 */
router.post('/:id/dispatch', requireGuardManagementAccess, async (req, res) => {
  try {
    const { id: guardId } = req.params;
    const { 
      incidentId, 
      priority = 'medium', 
      instructions, 
      estimatedResponseTime,
      notifyContacts = true
    } = req.body;
    
    // Validation
    if (!incidentId) {
      return res.status(400).json({
        error: 'Missing incident ID',
        code: 'MISSING_INCIDENT_ID',
        message: 'Incident ID is required for dispatch'
      });
    }
    
    // Check if guard exists and is available
    const [guards] = await UnifiedQueries.sequelize.query(`
      SELECT id, first_name, last_name, status, current_location
      FROM guards 
      WHERE id = :guardId AND status = 'active'
    `, {
      replacements: { guardId },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    if (guards.length === 0) {
      return res.status(404).json({
        error: 'Guard not available',
        code: 'GUARD_NOT_AVAILABLE',
        message: 'The guard is not available for dispatch'
      });
    }
    
    // Check if incident exists
    const [incidents] = await UnifiedQueries.sequelize.query(`
      SELECT id, status, property_id, incident_type
      FROM incidents 
      WHERE id = :incidentId
    `, {
      replacements: { incidentId },
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    if (incidents.length === 0) {
      return res.status(404).json({
        error: 'Incident not found',
        code: 'INCIDENT_NOT_FOUND',
        message: 'The incident does not exist'
      });
    }
    
    // Update incident with guard assignment
    await UnifiedQueries.sequelize.query(`
      UPDATE incidents 
      SET 
        assigned_to = :guardId,
        status = 'in_progress',
        priority_level = :priority,
        dispatch_instructions = :instructions,
        estimated_response_time = :estimatedResponseTime,
        dispatched_at = NOW(),
        updated_at = NOW()
      WHERE id = :incidentId
    `, {
      replacements: {
        guardId,
        incidentId,
        priority,
        instructions: instructions || null,
        estimatedResponseTime: estimatedResponseTime || null
      },
      type: UnifiedQueries.sequelize.QueryTypes.UPDATE
    });
    
    // Create dispatch notification entry (for notification system)
    const [dispatchResult] = await UnifiedQueries.sequelize.query(`
      INSERT INTO call_logs (
        guard_id, property_id, incident_id, call_type, caller_info,
        incident_type, description, status, created_at, updated_at
      ) VALUES (
        :guardId, :propertyId, :incidentId, 'dispatch', 
        :callerInfo, :incidentType, :description, 'dispatched', NOW(), NOW()
      ) RETURNING id
    `, {
      replacements: {
        guardId,
        propertyId: incidents[0].property_id,
        incidentId,
        callerInfo: JSON.stringify({
          dispatchedBy: req.user.id,
          dispatchedByName: `${req.user.firstName} ${req.user.lastName}`,
          role: req.user.role
        }),
        incidentType: incidents[0].incident_type,
        description: `Guard dispatched to ${incidents[0].incident_type}. ${instructions || ''}`
      },
      type: UnifiedQueries.sequelize.QueryTypes.INSERT
    });
    
    // If notifyContacts is true, trigger notifications (this would integrate with notification system)
    if (notifyContacts) {
      // Here you would trigger the notification system
      // For now, we'll just log it
      console.log(`Notification triggered for incident ${incidentId}, guard ${guardId}`);
    }
    
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'dispatch_guard',
      'incident',
      incidentId,
      { 
        guardId,
        guardName: `${guards[0].first_name} ${guards[0].last_name}`,
        priority,
        instructions: instructions || null
      },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      message: 'Guard dispatched successfully',
      data: {
        dispatchId: dispatchResult[0].id,
        guardName: `${guards[0].first_name} ${guards[0].last_name}`,
        incidentId,
        estimatedResponseTime
      }
    });
    
  } catch (error) {
    console.error('Error dispatching guard:', error);
    res.status(500).json({
      error: 'Dispatch error',
      code: 'DISPATCH_ERROR',
      message: 'Unable to dispatch guard. Please try again.'
    });
  }
});

/**
 * @route   GET /api/internal/v1/guards/on-duty
 * @desc    Get guards currently on duty
 * @access  Private (Admin/Manager only)
 */
router.get('/on-duty', requireGuardManagementAccess, async (req, res) => {
  try {
    const { propertyId } = req.query;
    
    let whereClause = `WHERE g.status = 'active' 
                       AND g.last_check_in >= NOW() - INTERVAL '4 hours'`;
    const replacements = {};
    
    if (propertyId) {
      whereClause += ' AND EXISTS (SELECT 1 FROM property_assignments pa WHERE pa.guard_id = g.id AND pa.property_id = :propertyId)';
      replacements.propertyId = propertyId;
    }
    
    // Role-based filtering for managers
    if (req.user.role === 'manager' && req.user.assignedProperties) {
      whereClause += ' AND EXISTS (SELECT 1 FROM property_assignments pa WHERE pa.guard_id = g.id AND pa.property_id = ANY(:assignedProperties))';
      replacements.assignedProperties = req.user.assignedProperties;
    }
    
    const [guardsOnDuty] = await UnifiedQueries.sequelize.query(`
      SELECT 
        g.id,
        g.first_name as "firstName",
        g.last_name as "lastName",
        g.phone,
        g.badge_number as "badgeNumber",
        g.last_check_in as "lastCheckIn",
        g.current_location as "currentLocation",
        COUNT(DISTINCT CASE WHEN i.status IN ('pending', 'in_progress') THEN i.id END) as "activeIncidents",
        ARRAY_AGG(DISTINCT p.name) as "assignedPropertyNames"
      FROM guards g
      LEFT JOIN property_assignments pa ON g.id = pa.guard_id
      LEFT JOIN properties p ON pa.property_id = p.id
      LEFT JOIN incidents i ON g.id = i.assigned_to
      ${whereClause}
      GROUP BY g.id
      ORDER BY g.last_check_in DESC
    `, {
      replacements,
      type: UnifiedQueries.sequelize.QueryTypes.SELECT
    });
    
    res.status(200).json({
      success: true,
      data: {
        guardsOnDuty,
        totalOnDuty: guardsOnDuty.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching guards on duty:', error);
    res.status(500).json({
      error: 'Guards on duty service error',
      code: 'GUARDS_ON_DUTY_SERVICE_ERROR',
      message: 'Unable to fetch guards on duty'
    });
  }
});

/**
 * @route   PUT /api/internal/v1/guards/:id/status
 * @desc    Update guard status (check-in/check-out, location update)
 * @access  Private (Admin/Manager/Guard only)
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id: guardId } = req.params;
    const { status, location, notes } = req.body;
    
    // Guards can only update their own status, admins/managers can update any
    if (req.user.role === 'guard' && req.user.id !== guardId) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED',
        message: 'Guards can only update their own status'
      });
    }
    
    // Update guard status
    const updateFields = {
      lastCheckIn: new Date(),
      updatedAt: new Date()
    };
    
    if (status) {
      updateFields.status = status;
    }
    
    if (location) {
      updateFields.currentLocation = JSON.stringify(location);
    }
    
    const setClause = Object.keys(updateFields)
      .map(key => `"${key}" = :${key}`)
      .join(', ');
    
    await UnifiedQueries.sequelize.query(`
      UPDATE guards 
      SET ${setClause}
      WHERE id = :guardId
    `, {
      replacements: { ...updateFields, guardId },
      type: UnifiedQueries.sequelize.QueryTypes.UPDATE
    });
    
    // Log the status update
    await UnifiedQueries.logClientPortalActivity(
      req.user.id,
      req.user.clientId,
      'update_guard_status',
      'guard',
      guardId,
      { status, location, notes },
      req.ip,
      req.headers['user-agent'],
      null
    );
    
    res.status(200).json({
      success: true,
      message: 'Guard status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating guard status:', error);
    res.status(500).json({
      error: 'Guard status update error',
      code: 'GUARD_STATUS_UPDATE_ERROR',
      message: 'Unable to update guard status'
    });
  }
});

export default router;
