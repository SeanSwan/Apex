// backend/routes/client/v1/auth.mjs
/**
 * WORKING CLIENT PORTAL AUTHENTICATION ROUTES
 * ===========================================
 * Simple, working authentication for immediate testing
 */

import express from 'express';
import bcrypt from 'bcryptjs';

const router = express.Router();

// WORKING Demo user for testing
const DEMO_USER = {
  id: 1,
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.johnson@luxeapartments.com',
  password: 'Demo123!', // Plain text for immediate testing
  role: 'client',
  clientId: 1,
  clientName: 'Luxe Apartments',
  permissions: ['incidents', 'evidence', 'analytics', 'settings']
};

/**
 * @route   POST /api/client/v1/auth/login
 * @desc    WORKING login test
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    console.log('\n=== [CLIENT-AUTH] WORKING LOGIN ATTEMPT ===');
    console.log('[CLIENT-AUTH] Request body:', JSON.stringify(req.body, null, 2));
    
    const { email, password } = req.body;
    
    console.log(`[CLIENT-AUTH] Email: "${email}", Password: "${password}"`);
    
    // Validate input
    if (!email || !password) {
      console.log('[CLIENT-AUTH] Missing credentials');
      return res.status(400).json({
        error: 'Missing credentials',
        code: 'MISSING_CREDENTIALS',
        message: 'Email and password are required'
      });
    }
    
    // Check email
    const normalizedEmail = email.toLowerCase().trim();
    const demoEmail = DEMO_USER.email.toLowerCase();
    
    console.log(`[CLIENT-AUTH] Email match: ${normalizedEmail} === ${demoEmail} = ${normalizedEmail === demoEmail}`);
    
    if (normalizedEmail !== demoEmail) {
      console.log(`[CLIENT-AUTH] Email mismatch - provided: "${normalizedEmail}", expected: "${demoEmail}"`);
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect'
      });
    }
    
    // Check password (simple comparison for immediate testing)
    const passwordMatch = password === DEMO_USER.password;
    
    console.log(`[CLIENT-AUTH] Password match: "${password}" === "${DEMO_USER.password}" = ${passwordMatch}`);
    
    if (!passwordMatch) {
      console.log(`[CLIENT-AUTH] Password mismatch`);
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect'
      });
    }
    
    console.log(`[CLIENT-AUTH] ✅ LOGIN SUCCESSFUL!`);
    
    // Create a simple JWT token (for testing)
    const token = `demo-token-${Date.now()}`;
    
    // Return success
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
        accessToken: token,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
        permissions: DEMO_USER.permissions
      }
    });
    
  } catch (error) {
    console.error('[CLIENT-AUTH] Login error:', error);
    
    res.status(500).json({
      error: 'Login service error',
      code: 'LOGIN_SERVICE_ERROR',
      message: 'Unable to process login request. Please try again.'
    });
  }
});

/**
 * @route   GET /api/client/v1/auth/profile
 * @desc    Get current user profile (simple version)
 * @access  Private (requires valid session)
 */
router.get('/profile', async (req, res) => {
  try {
    console.log('\n=== [CLIENT-AUTH] PROFILE REQUEST ===');
    console.log('[CLIENT-AUTH] Headers:', JSON.stringify(req.headers, null, 2));
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[CLIENT-AUTH] No valid authorization header');
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'MISSING_TOKEN',
        message: 'No valid authorization token provided'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log(`[CLIENT-AUTH] Token: ${token}`);
    
    // Simple token validation (for testing)
    if (token && token.startsWith('demo-token-')) {
      console.log('[CLIENT-AUTH] ✅ Valid demo token, returning profile');
      
      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
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
          }
        }
      });
    } else {
      console.log('[CLIENT-AUTH] Invalid token');
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'INVALID_TOKEN',
        message: 'Invalid authorization token'
      });
    }
    
  } catch (error) {
    console.error('[CLIENT-AUTH] Profile error:', error);
    
    res.status(500).json({
      error: 'Profile service error',
      code: 'PROFILE_SERVICE_ERROR',
      message: 'Unable to retrieve user profile'
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
    message: 'Client Portal Auth routes WORKING!',
    timestamp: new Date().toISOString(),
    demoCredentials: {
      email: DEMO_USER.email,
      password: DEMO_USER.password,
      note: 'Use these exact credentials for testing'
    }
  });
});

export default router;
