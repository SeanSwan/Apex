// File: backend/src/routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

// Protect all routes with authentication
router.use(authMiddleware);

// Report management routes
router.post('/upload/report', checkPermission('reports:create'), reportController.uploadReport);
router.post('/reports/draft', checkPermission('reports:create'), reportController.saveReportDraft);
router.get('/reports/:id', checkPermission('reports:read'), reportController.getReport);
router.post('/reports/send', checkPermission('reports:send'), reportController.sendReport);

// Client data routes
router.get('/clients', checkPermission('clients:read'), reportController.getClientsForUser);
router.get('/clients/:clientId/metrics', checkPermission('clients:read'), reportController.getClientMetrics);

// AI routes
router.post('/ai/enhance', checkPermission('ai:use'), require('../controllers/aiController').enhanceText);
router.post('/ai/summarize', checkPermission('ai:use'), require('../controllers/aiController').generateSummary);
router.post('/ai/finalize-report', checkPermission('ai:use'), require('../controllers/aiController').finalizeReport);

module.exports = router;