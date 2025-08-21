// backend/routes/client/v1/test.mjs
/**
 * SIMPLE TEST ROUTE FOR DEBUGGING
 * ===============================
 * Basic route with no dependencies to verify server integration
 */

import express from 'express';

const router = express.Router();

/**
 * @route   GET /api/client/v1/test
 * @desc    Simple test endpoint to verify route loading
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Client Portal TEST route is working!',
    timestamp: new Date().toISOString(),
    server: 'Enhanced Backend',
    routeStatus: 'LOADED_SUCCESSFULLY'
  });
});

/**
 * @route   GET /api/client/v1/test/debug
 * @desc    Debug information endpoint
 * @access  Public
 */
router.get('/debug', (req, res) => {
  res.status(200).json({
    success: true,
    debug: {
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      routeLoaded: true,
      middlewareTest: 'PASS'
    }
  });
});

export default router;
