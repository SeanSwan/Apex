// backend/routes/reportRoutes.mjs
import express from 'express';
import { ROLES, withRoles } from '../middleware/roleMiddleware.mjs';
import { requirePropertyAccess } from '../middleware/roleMiddleware.mjs';
import * as reportController from '../controllers/reportController.js';
import * as aiController from '../controllers/aiController.mjs';

const router = express.Router();

/**
 * Permission to role mapping
 * This maps your existing permission strings to the new role system
 */
const permissionMap = {
  'reports:create': [ROLES.ANY_MANAGER, ROLES.GUARD],
  'reports:read': [ROLES.ANY_MANAGER, ROLES.GUARD, ROLES.CLIENT],
  'reports:update': [ROLES.ANY_MANAGER, ROLES.GUARD],
  'reports:delete': [ROLES.ANY_ADMIN],
  'reports:send': [ROLES.ANY_MANAGER, ROLES.GUARD],
  'reports:approve': [ROLES.ANY_MANAGER],
  'clients:read': [ROLES.ANY_MANAGER, ROLES.CLIENT],
  'ai:use': [ROLES.ANY_MANAGER, ROLES.GUARD, ROLES.CLIENT]
};

// Helper function to convert your permission string to role array
const permissionToRoles = (permission) => {
  return permissionMap[permission] || [];
};

/**
 * @route   POST /api/reports/upload/report
 * @desc    Upload a new report
 * @access  Private (Manager, Guard)
 */
router.post(
  '/upload/report',
  withRoles(permissionToRoles('reports:create')),
  reportController.uploadReport
);

/**
 * @route   POST /api/reports/reports/draft
 * @desc    Save a report draft
 * @access  Private (Manager, Guard)
 */
router.post(
  '/reports/draft',
  withRoles(permissionToRoles('reports:create')),
  reportController.saveReportDraft
);

/**
 * @route   GET /api/reports/reports/:id
 * @desc    Get a specific report
 * @access  Private (Manager, Guard, Client)
 */
router.get(
  '/reports/:id',
  withRoles(permissionToRoles('reports:read')),
  requirePropertyAccess,
  reportController.getReport
);

/**
 * @route   POST /api/reports/reports/send
 * @desc    Send a report
 * @access  Private (Manager, Guard)
 */
router.post(
  '/reports/send',
  withRoles(permissionToRoles('reports:send')),
  reportController.sendReport
);

/**
 * @route   GET /api/reports/clients
 * @desc    Get clients for user
 * @access  Private (Manager, Client)
 */
router.get(
  '/clients',
  withRoles(permissionToRoles('clients:read')),
  reportController.getClientsForUser
);

/**
 * @route   GET /api/reports/clients/:clientId/metrics
 * @desc    Get metrics for a specific client
 * @access  Private (Manager, Client)
 */
router.get(
  '/clients/:clientId/metrics',
  withRoles(permissionToRoles('clients:read')),
  requirePropertyAccess,
  reportController.getClientMetrics
);

/**
 * @route   POST /api/reports/ai/enhance
 * @desc    Enhance text using AI
 * @access  Private (Manager, Guard, Client)
 */
router.post(
  '/ai/enhance',
  withRoles(permissionToRoles('ai:use')),
  aiController.enhanceText
);

/**
 * @route   POST /api/reports/ai/summarize
 * @desc    Generate summary using AI
 * @access  Private (Manager, Guard, Client)
 */
router.post(
  '/ai/summarize',
  withRoles(permissionToRoles('ai:use')),
  aiController.generateSummary
);

/**
 * @route   POST /api/reports/ai/finalize-report
 * @desc    Finalize report using AI
 * @access  Private (Manager, Guard, Client)
 */
router.post(
  '/ai/finalize-report',
  withRoles(permissionToRoles('ai:use')),
  aiController.finalizeReport
);

// New routes using enhanced role system

/**
 * @route   GET /api/reports/all
 * @desc    Get all reports (admin/manager only)
 * @access  Private (Admin, Manager)
 */
router.get(
  '/all',
  withRoles([ROLES.ANY_MANAGER]),
  reportController.getAllReports
);

/**
 * @route   PUT /api/reports/:reportId/approve
 * @desc    Approve a report
 * @access  Private (Managers and Admins only)
 */
router.put(
  '/:reportId/approve',
  withRoles([ROLES.ANY_MANAGER]),
  reportController.approveReport
);

/**
 * @route   PUT /api/reports/:reportId/reject
 * @desc    Reject a report
 * @access  Private (Managers and Admins only)
 */
router.put(
  '/:reportId/reject',
  withRoles([ROLES.ANY_MANAGER]),
  reportController.rejectReport
);

/**
 * @route   GET /api/reports/property/:propertyId
 * @desc    Get reports for a specific property
 * @access  Private (Admin, Manager, Client who owns the property, Guards assigned to property)
 */
router.get(
  '/property/:propertyId',
  withRoles([ROLES.ANY_MANAGER, ROLES.CLIENT, ROLES.GUARD]),
  requirePropertyAccess,
  reportController.getPropertyReports
);

/**
 * @route   GET /api/reports/guard/:guardId
 * @desc    Get reports submitted by a specific guard
 * @access  Private (Admin, Manager, the Guard himself)
 */
router.get(
  '/guard/:guardId',
  withRoles([ROLES.ANY_MANAGER, ROLES.GUARD]),
  reportController.getGuardReports
);

/**
 * @route   GET /api/reports/templates
 * @desc    Get report templates
 * @access  Private (Admin, Manager, Guard)
 */
router.get(
  '/templates',
  withRoles([ROLES.ANY_MANAGER, ROLES.GUARD]),
  reportController.getReportTemplates
);

/**
 * @route   POST /api/reports/templates
 * @desc    Create a new report template
 * @access  Private (Admin, Manager)
 */
router.post(
  '/templates',
  withRoles([ROLES.ANY_MANAGER]),
  reportController.createReportTemplate
);

/**
 * @route   DELETE /api/reports/:reportId
 * @desc    Delete a report
 * @access  Private (Admins only)
 */
router.delete(
  '/:reportId',
  withRoles([ROLES.ANY_ADMIN]),
  reportController.deleteReport
);

export default router;