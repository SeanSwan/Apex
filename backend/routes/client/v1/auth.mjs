// backend/routes/client/v1/auth.mjs
/**
 * PRODUCTION CLIENT PORTAL AUTHENTICATION ROUTES
 * ==============================================
 * Enhanced authentication endpoints using real database models
 * Implements secure login, profile management, and session handling
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import { 
  findClientUserByEmail, 
  createClientPortalSession, 
  authenticateClientSession,
  logClientActivity,
  ClientPortalQueries 
} from '../../../middleware/clientAuth.mjs';

const router = express.Router();

/**
 * @route   POST /api/client/v1/auth/login
 * @desc    Authenticate client user and create session
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    console.log('\n=== [CLIENT-AUTH] LOGIN ATTEMPT ===');
    console.log('[CLIENT-AUTH] Request body (sanitized):', {
      email: req.body.email ? req.body.email.substring(0, 3) + '***' : 'missing',
      passwordProvided: !!req.body.password
    });
    
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      console.log('[CLIENT-AUTH] Missing credentials detected');
      return res.status(400).json({
        error: 'Missing credentials',
        code: 'MISSING_CREDENTIALS',
        message: 'Email and password are required'
      });
    }
    
    // Rate limiting check (basic implementation)
    const loginAttempts = req.session?.loginAttempts || 0;
    if (loginAttempts >= 5) {
      console.log('[CLIENT-AUTH] Rate limit exceeded');
      return res.status(429).json({
        error: 'Too many attempts',
        code: 'RATE_LIMITED',
        message: 'Too many login attempts. Please try again later.'
      });
    }
    
    // Authenticate user using enhanced authentication
    const user = await ClientPortalQueries.authenticateClientUser(email.trim(), password);
    
    if (!user) {
      // Increment session login attempts
      req.session = req.session || {};
      req.session.loginAttempts = (req.session.loginAttempts || 0) + 1;
      
      console.log(`[CLIENT-AUTH] Login failed for: ${email.substring(0, 3)}***`);
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect'
      });
    }
    
    // Reset session login attempts on successful authentication
    if (req.session) {
      req.session.loginAttempts = 0;
    }
    
    // Create comprehensive client portal session
    const sessionData = await createClientPortalSession(user, req);
    
    console.log(`[CLIENT-AUTH] Login successful: ${user.email}`);
    console.log(`[CLIENT-AUTH] Client: ${sessionData.client?.name || 'Unknown'}`);
    console.log(`[CLIENT-AUTH] Permissions: ${sessionData.permissions.join(', ')}`);
    
    // Set secure HTTP-only cookie for additional security
    res.cookie('client_session_token', sessionData.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });
    
    // Return success with comprehensive session data
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: sessionData.user,
        client: sessionData.client,
        accessToken: sessionData.accessToken,
        expiresAt: sessionData.expiresAt,
        permissions: sessionData.permissions,
        sessionInfo: {
          loginTime: new Date().toISOString(),
          expiresIn: '8 hours',
          ipAddress: req.ip || req.connection.remoteAddress
        }
      }
    });
    
  } catch (error) {
    console.error('[CLIENT-AUTH] Login error:', error);
    
    // Don't reveal internal error details to client
    res.status(500).json({
      error: 'Login service error',
      code: 'LOGIN_SERVICE_ERROR',
      message: 'Unable to process login request. Please try again later.'
    });
  }
});

/**
 * @route   GET /api/client/v1/auth/profile
 * @desc    Get current authenticated user profile
 * @access  Private (requires authentication)
 */
router.get('/profile', authenticateClientSession, logClientActivity('PROFILE_ACCESS', 'data_access'), async (req, res) => {
  try {
    console.log('\n=== [CLIENT-AUTH] PROFILE REQUEST ===');
    console.log(`[CLIENT-AUTH] User: ${req.user.email}`);
    console.log(`[CLIENT-AUTH] Client: ${req.user.clientName}`);
    
    // Get additional client data if available
    let additionalClientData = {};
    if (req.user.clientId) {
      const dashboardData = await ClientPortalQueries.getClientDashboardData(
        req.user.clientId,
        req.user.permissions
      );
      
      if (dashboardData) {
        additionalClientData = {
          dashboardAccess: true,
          availableFeatures: req.user.permissions,
          clientStats: dashboardData.analytics || {},
          lastActivity: dashboardData.lastActivity || null
        };
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          id: req.user.id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email,
          role: req.user.role,
          companyPosition: req.user.companyPosition,
          lastLogin: req.user.lastLogin
        },
        client: req.client ? {
          id: req.client.id,
          name: req.client.name,
          siteName: req.client.siteName,
          location: req.client.location,
          cameras: req.client.cameras,
          isVIP: req.client.isVIP,
          isActive: req.client.isActive
        } : null,
        permissions: req.user.permissions,
        features: additionalClientData,
        sessionInfo: {
          authenticated: true,
          clientPortalAccess: true,
          timezone: 'America/New_York' // TODO: Get from user preferences
        }
      }
    });
    
  } catch (error) {
    console.error('[CLIENT-AUTH] Profile error:', error);
    
    res.status(500).json({
      error: 'Profile service error',
      code: 'PROFILE_SERVICE_ERROR',
      message: 'Unable to retrieve user profile. Please try again.'
    });
  }
});

/**
 * @route   POST /api/client/v1/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Private (requires authentication)
 */
router.post('/logout', authenticateClientSession, logClientActivity('LOGOUT', 'authentication'), async (req, res) => {
  try {
    console.log('\n=== [CLIENT-AUTH] LOGOUT REQUEST ===');
    console.log(`[CLIENT-AUTH] User: ${req.user.email}`);
    
    // Clear HTTP-only cookie
    res.clearCookie('client_session_token');
    
    // TODO: Add token to blacklist/invalidation list when implemented
    
    console.log(`[CLIENT-AUTH] Logout successful: ${req.user.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Logout successful',
      data: {
        loggedOut: true,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[CLIENT-AUTH] Logout error:', error);
    
    res.status(500).json({
      error: 'Logout service error',
      code: 'LOGOUT_SERVICE_ERROR',
      message: 'Unable to process logout request'
    });
  }
});

/**
 * @route   POST /api/client/v1/auth/refresh
 * @desc    Refresh authentication token
 * @access  Private (requires valid session)
 */
router.post('/refresh', authenticateClientSession, async (req, res) => {
  try {
    console.log('\n=== [CLIENT-AUTH] TOKEN REFRESH ===');
    console.log(`[CLIENT-AUTH] User: ${req.user.email}`);
    
    // Get fresh user data from database
    const user = await findClientUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        message: 'Unable to refresh session - user not found'
      });
    }
    
    // Create new session
    const sessionData = await createClientPortalSession(user, req);
    
    // Update HTTP-only cookie
    res.cookie('client_session_token', sessionData.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });
    
    console.log(`[CLIENT-AUTH] Token refresh successful: ${user.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: sessionData.accessToken,
        expiresAt: sessionData.expiresAt,
        refreshedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[CLIENT-AUTH] Token refresh error:', error);
    
    res.status(500).json({
      error: 'Token refresh error',
      code: 'TOKEN_REFRESH_ERROR',
      message: 'Unable to refresh authentication token'
    });
  }
});

/**
 * @route   GET /api/client/v1/auth/session
 * @desc    Check session validity and return session info
 * @access  Private (requires authentication)
 */
router.get('/session', authenticateClientSession, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Session is valid',
      data: {
        valid: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          clientName: req.user.clientName
        },
        permissions: req.user.permissions,
        expiresAt: null, // TODO: Calculate from JWT
        sessionStart: null, // TODO: Get from JWT
        currentTime: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[CLIENT-AUTH] Session check error:', error);
    
    res.status(500).json({
      error: 'Session check error',
      code: 'SESSION_CHECK_ERROR',
      message: 'Unable to verify session status'
    });
  }
});

/**
 * @route   GET /api/client/v1/auth/test
 * @desc    Test endpoint for development
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Enhanced Client Portal Auth routes working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: [
      'Database authentication',
      'Role-based access control',
      'Session management',
      'Audit logging',
      'Security controls'
    ]
  });
});

export default router;
