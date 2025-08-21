// backend/middleware/clientAuth.mjs
/**
 * SIMPLIFIED CLIENT PORTAL AUTHENTICATION MIDDLEWARE
 * =================================================
 * Working authentication system for immediate functionality
 * Will be enhanced with database integration once basic functionality is confirmed
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Temporary demo users for immediate functionality
const DEMO_USERS = [
  {
    id: 1,
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@luxeapartments.com',
    password: '$2a$12$LQv3c1yqBwEHXKn4B8iXKeBQ6JWfq2ZOdtWqWIGU8QGNzAg1v1uCa', // Demo123!
    role: 'client',
    company_name: 'Luxe Apartments',
    is_active: true,
    status: 'active',
    // Mock client data
    clientData: {
      id: 1,
      name: 'Luxe Apartments',
      isVIP: true,
      isActive: true,
      cameras: 24
    },
    permissions: ['incidents', 'evidence', 'analytics', 'settings'],
    comparePassword: async function(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    }
  },
  {
    id: 2,
    first_name: 'Michael',
    last_name: 'Chen',
    email: 'michael.chen@grandtowers.com',
    password: '$2a$12$LQv3c1yqBwEHXKn4B8iXKeBQ6JWfq2ZOdtWqWIGU8QGNzAg1v1uCa', // Demo123!
    role: 'client',
    company_name: 'Grand Towers',
    is_active: true,
    status: 'active',
    // Mock client data
    clientData: {
      id: 2,
      name: 'Grand Towers',
      isVIP: false,
      isActive: true,
      cameras: 16
    },
    permissions: ['incidents', 'evidence', 'analytics'],
    comparePassword: async function(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    }
  }
];

/**
 * Find client user by email
 */
export const findClientUserByEmail = async (email) => {
  try {
    const user = DEMO_USERS.find(user => 
      user.email.toLowerCase() === email.toLowerCase() &&
      user.role === 'client' &&
      user.is_active &&
      user.status === 'active'
    );
    
    if (!user) {
      return null;
    }
    
    return {
      ...user,
      permissions: user.permissions
    };
    
  } catch (error) {
    console.error('Error finding client user by email:', error);
    return null;
  }
};

/**
 * Legacy support - find user by email (backward compatibility)
 */
export const findUserByEmail = findClientUserByEmail;

/**
 * Create JWT token
 */
export const createAccessToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientData?.id || null
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
};

/**
 * Create comprehensive client portal session
 */
export const createClientPortalSession = async (user, req) => {
  try {
    const accessToken = createAccessToken(user);
    const sessionToken = jwt.sign(
      { userId: user.id, type: 'session', clientId: user.clientData?.id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Extended session for client portal
    );
    
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
    
    // Log successful login activity
    await logClientPortalActivity(
      user.id,
      user.clientData?.id || null,
      'LOGIN_SUCCESS',
      'authentication',
      null,
      {
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
        session_duration: '8h'
      },
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent'),
      'SUCCESS'
    );
    
    return {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        clientId: user.clientData?.id || null,
        clientName: user.clientData?.name || user.company_name || 'Unknown Client',
        companyPosition: user.company_position,
        permissions: user.permissions,
        isVIP: user.clientData?.isVIP || false,
        lastLogin: new Date().toISOString()
      },
      client: user.clientData ? {
        id: user.clientData.id,
        name: user.clientData.name,
        siteName: user.clientData.siteName,
        location: user.clientData.location,
        cameras: user.clientData.cameras,
        isVIP: user.clientData.isVIP,
        isActive: user.clientData.isActive
      } : null,
      accessToken,
      sessionToken,
      expiresAt,
      permissions: user.permissions
    };
    
  } catch (error) {
    console.error('Error creating client portal session:', error);
    throw new Error('Failed to create client session');
  }
};

/**
 * Enhanced client session authentication middleware
 */
export const authenticateClientSession = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.cookies?.client_session_token;
    
    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'MISSING_TOKEN',
        message: 'Authentication token is required'
      });
    }
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        code: 'CONFIG_ERROR',
        message: 'Authentication service unavailable'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user from demo data
    const user = DEMO_USERS.find(u => 
      u.id === decoded.userId &&
      u.role === 'client' &&
      u.is_active &&
      u.status === 'active'
    );
    
    if (!user) {
      await logClientPortalActivity(
        decoded.userId,
        decoded.clientId,
        'AUTH_FAILED_USER_NOT_FOUND',
        'security',
        null,
        { token_data: decoded },
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        'FAILURE'
      );
      
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        message: 'Authentication token is invalid'
      });
    }
    
    // Set user context for request
    req.user = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      clientId: user.clientData?.id || null,
      clientName: user.clientData?.name || user.company_name || 'Unknown Client',
      companyPosition: user.company_position,
      permissions: user.permissions,
      isVIP: user.clientData?.isVIP || false,
      clientData: user.clientData
    };
    
    req.client = user.clientData;
    
    next();
    
  } catch (error) {
    console.error('Client session authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token format',
        code: 'MALFORMED_TOKEN',
        message: 'Authentication token is malformed'
      });
    }
    
    return res.status(500).json({
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR',
      message: 'Unable to authenticate request'
    });
  }
};

/**
 * Log client activity middleware
 */
export const logClientActivity = (action, category) => {
  return (req, res, next) => {
    // Enhanced activity logging with user context
    const logData = {
      user: req.user?.email || 'Unknown',
      clientId: req.user?.clientId || 'Unknown',
      action,
      category,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
    
    console.log(`[CLIENT-PORTAL] ${JSON.stringify(logData)}`);
    
    // Log to database asynchronously
    logClientPortalActivity(
      req.user?.id,
      req.user?.clientId,
      action,
      category,
      null,
      logData,
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent'),
      'SUCCESS'
    ).catch(err => console.error('Async logging error:', err));
    
    next();
  };
};

/**
 * Enhanced audit logging function for client portal activities
 */
export const logClientPortalActivity = async (userId, clientId, action, category, resourceId = null, metadata = {}, ipAddress = null, userAgent = null, result = 'SUCCESS') => {
  try {
    // Enhanced logging with database storage capability
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      clientId,
      action,
      category,
      resourceId,
      metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata,
      ipAddress,
      userAgent,
      result
    };
    
    // Console logging for immediate debugging
    console.log(`[CLIENT-PORTAL-AUDIT] ${logEntry.timestamp} - User:${userId} Client:${clientId} - ${action} (${category}) - ${result}`);
    
    // TODO: Store in database audit table when available
    // await db.ClientPortalAuditLog.create(logEntry);
    
    return logEntry;
    
  } catch (error) {
    console.error('Error logging client portal activity:', error);
    // Don't throw error as this is logging - should not break main flow
  }
};

/**
 * Enhanced client portal queries with simplified demo data
 */
export const ClientPortalQueries = {
  /**
   * Authenticate client user with demo data
   */
  async authenticateClientUser(email, password) {
    try {
      const user = await findClientUserByEmail(email);
      
      if (!user) {
        await logClientPortalActivity(
          null,
          null,
          'LOGIN_FAILED_USER_NOT_FOUND',
          'security',
          null,
          { email: email.substring(0, 3) + '***' },
          null,
          null,
          'FAILURE'
        );
        return null;
      }
      
      // Check password
      const isValidPassword = await user.comparePassword(password);
      
      if (!isValidPassword) {
        await logClientPortalActivity(
          user.id,
          user.clientData?.id,
          'LOGIN_FAILED_INVALID_PASSWORD',
          'security',
          null,
          { failed_attempts: 1 },
          null,
          null,
          'FAILURE'
        );
        
        return null;
      }
      
      return user;
      
    } catch (error) {
      console.error('Error authenticating client user:', error);
      return null;
    }
  },
  
  /**
   * Get client dashboard data with demo data
   */
  async getClientDashboardData(clientId, permissions) {
    try {
      const user = DEMO_USERS.find(u => u.clientData?.id === clientId);
      
      if (!user || !user.clientData.isActive) {
        return null;
      }
      
      // Return data based on permissions
      const dashboardData = {
        client: {
          id: user.clientData.id,
          name: user.clientData.name,
          siteName: user.clientData.siteName,
          cameras: user.clientData.cameras,
          isVIP: user.clientData.isVIP
        }
      };
      
      // Add incident data if permitted
      if (permissions.includes('incidents')) {
        dashboardData.incidents = {
          total: Math.floor(Math.random() * 50) + 20,
          thisWeek: Math.floor(Math.random() * 15) + 5,
          criticalThisMonth: Math.floor(Math.random() * 8) + 2
        };
      }
      
      // Add analytics if permitted
      if (permissions.includes('analytics')) {
        dashboardData.analytics = {
          monitoringHours: user.clientData.cameras * 24 * 7, // Weekly hours
          detectionAccuracy: 95.7,
          responseTime: '2.3 minutes'
        };
      }
      
      return dashboardData;
      
    } catch (error) {
      console.error('Error getting client dashboard data:', error);
      return null;
    }
  },
  
  // Legacy compatibility
  logClientPortalActivity
};
