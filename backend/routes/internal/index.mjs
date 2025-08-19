// backend/routes/internal/index.mjs
/**
 * APEX AI INTERNAL ROUTES INDEX
 * =============================
 * Internal API routes for desktop application
 * Provides admin/manager interfaces for system management
 */

import express from 'express';
import sopsRoutes from './v1/sops.mjs';
import contactListsRoutes from './v1/contact-lists.mjs';
import propertiesRoutes from './v1/properties.mjs';
import guardsRoutes from './v1/guards.mjs';

const router = express.Router();

// Add security headers for internal routes
router.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// V1 Internal API Routes
router.use('/v1/sops', sopsRoutes);
router.use('/v1/contact-lists', contactListsRoutes);
router.use('/v1/properties', propertiesRoutes);
router.use('/v1/guards', guardsRoutes);

// Health check for internal API
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Internal API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.status(200).json({
    success: true,
    api: 'APEX AI Internal API',
    version: '1.0.0',
    endpoints: {
      'Standard Operating Procedures': {
        'GET /api/internal/v1/sops': 'List all SOPs',
        'GET /api/internal/v1/sops/:id': 'Get SOP details',
        'POST /api/internal/v1/sops': 'Create new SOP',
        'PUT /api/internal/v1/sops/:id': 'Update SOP',
        'DELETE /api/internal/v1/sops/:id': 'Delete SOP'
      },
      'Contact Lists': {
        'GET /api/internal/v1/contact-lists': 'List all contact lists',
        'GET /api/internal/v1/contact-lists/:id': 'Get contact list details',
        'POST /api/internal/v1/contact-lists': 'Create new contact list',
        'PUT /api/internal/v1/contact-lists/:id': 'Update contact list',
        'DELETE /api/internal/v1/contact-lists/:id': 'Delete contact list',
        'POST /api/internal/v1/contact-lists/test-notifications': 'Test notifications'
      },
      'Properties': {
        'GET /api/internal/v1/properties': 'List accessible properties',
        'GET /api/internal/v1/properties/:id': 'Get property details',
        'GET /api/internal/v1/properties/:id/incidents': 'Get property incidents',
        'PUT /api/internal/v1/properties/:id': 'Update property'
      },
      'Guards & Dispatch': {
        'GET /api/internal/v1/guards': 'List all guards',
        'GET /api/internal/v1/guards/:id': 'Get guard details',
        'GET /api/internal/v1/guards/on-duty': 'Get guards currently on duty',
        'POST /api/internal/v1/guards/:id/dispatch': 'Dispatch guard to incident',
        'PUT /api/internal/v1/guards/:id/status': 'Update guard status'
      }
    },
    authentication: 'Bearer token required',
    rateLimit: '200 requests per 5 minutes',
    access: 'Admin/Manager roles required for most endpoints'
  });
});

export default router;
