// backend/routes/client/v1/auth.mjs
/**
 * SIMPLE CLIENT AUTH FOR TESTING
 * ==============================
 */

import express from 'express';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Demo user for testing
const DEMO_USER = {
  id: 1,
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.johnson@luxeapartments.com',
  password: '$2a$12$LQv3c1yqBwEHXKn4B8iXKeBQ6JWfq2ZOdtWqWIGU8QGNzAg1v1uCa', // Demo123!
  role: 'client',
  clientId: 1,
  clientName: 'Luxe Apartments',
  permissions: ['incidents', 'evidence', 'analytics', 'settings']
};

/**
 * @route   POST /api/client/v1/auth/login
 * @desc    Simple login test
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    console.log('[AUTH] Login attempt received:', req.body);
    
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        code: 'MISSING_CREDENTIALS',
        message: 'Email and password are required'
      });
    }
    
    // Check if email matches demo user
    if (email.toLowerCase().trim() !== DEMO_USER.email.toLowerCase()) {
      console.log(`[AUTH] Login failed - user not found: ${email}`);
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect'
      });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, DEMO_USER.password);
    
    if (!passwordMatch) {
      console.log(`[AUTH] Login failed - invalid password: ${email}`);
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect'
      });
    }
    
    console.log(`[AUTH] Login successful: ${DEMO_USER.email}`);
    
    // Return success (simplified for testing)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: DEMO_USER.id,
          firstName: DEMO_USER.firstName,
          lastName: DEMO_USER.lastName,
          email: DEMO_USER.email,
          role: DEMO_USER.role,
          clientId: DEMO_USER.clientId,
          clientName: DEMO_USER.clientName,
          permissions: DEMO_USER.permissions
        },
        accessToken: 'demo-token-12345',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        permissions: DEMO_USER.permissions
      }
    });
    
  } catch (error) {
    console.error('Client login error:', error);
    
    res.status(500).json({
      error: 'Login service error',
      code: 'LOGIN_SERVICE_ERROR',
      message: 'Unable to process login request. Please try again.'
    });
  }
});

/**
 * @route   GET /api/client/v1/auth/test
 * @desc    Simple test endpoint
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Client Portal Auth routes working!',
    timestamp: new Date().toISOString()
  });
});

export default router;
