// backend/middleware/unifiedAuth.mjs
/**
 * APEX AI UNIFIED AUTHENTICATION MIDDLEWARE
 * =========================================
 * Clean authentication middleware for unified system
 * Compatible with UnifiedQueries and new UUID schema
 */

import jwt from 'jsonwebtoken';
import { UnifiedQueries } from '../database/unifiedQueries.mjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Role hierarchy for access control
const ROLE_HIERARCHY = {
  'super_admin': 7,
  'admin_cto': 6,
  'admin_ceo': 5,
  'admin_cfo': 4,
  'manager': 3,
  'client': 2,
  'guard': 1,
  'user': 0
};

/**
 * Verify JWT token and attach user data to request
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'NO_TOKEN',
        message: 'Please provide a valid access token'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({
        error: 'Authentication service unavailable',
        code: 'AUTH_CONFIG_ERROR',
        message: 'Authentication service is not properly configured'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details from database using UnifiedQueries
    const user = await UnifiedQueries.authenticateUser(decoded.email || decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        message: 'The user associated with this token no longer exists'
      });
    }

    // Check if user account is active
    if (user.status !== 'active') {
      return res.status(401).json({
        error: 'Account inactive',
        code: 'ACCOUNT_INACTIVE',
        message: 'Your account has been deactivated'
      });
    }

    // Attach user information to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      clientId: user.clientId,
      assignedProperties: user.assignedProperties || [],
      permissions: user.permissions || [],
      isAuthenticated: true
    };

    // Log authentication for audit
    await UnifiedQueries.logClientPortalActivity(
      user.id,
      user.clientId,
      'api_access',
      'authentication',
      null,
      { endpoint: req.path, method: req.method },
      req.ip,
      req.headers['user-agent'],
      null
    );

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        message: 'The provided token is invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please log in again.'
      });
    }

    return res.status(500).json({
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR',
      message: 'Unable to verify authentication. Please try again.'
    });
  }
};

/**
 * Require specific role or higher
 */
export const requireRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED',
        message: 'Please authenticate first'
      });
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredRoleLevel = ROLE_HIERARCHY[minimumRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_ROLE',
        message: `This action requires ${minimumRole} role or higher`,
        userRole: req.user.role,
        requiredRole: minimumRole
      });
    }

    next();
  };
};

/**
 * Require one of multiple roles
 */
export const requireAnyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED',
        message: 'Please authenticate first'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_ROLE',
        message: `This action requires one of: ${allowedRoles.join(', ')}`,
        userRole: req.user.role,
        allowedRoles: allowedRoles
      });
    }

    next();
  };
};

/**
 * Check if user has access to specific property
 */
export const requirePropertyAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED',
        message: 'Please authenticate first'
      });
    }

    const propertyId = req.params.propertyId || req.body.propertyId || req.query.propertyId;
    
    if (!propertyId) {
      return res.status(400).json({
        error: 'Property ID required',
        code: 'MISSING_PROPERTY_ID',
        message: 'Property ID must be specified'
      });
    }

    // Super admins and CTOs have access to all properties
    if (['super_admin', 'admin_cto'].includes(req.user.role)) {
      req.propertyAccess = 'full';
      return next();
    }

    // Check if user has access to this property
    const hasAccess = await UnifiedQueries.checkPropertyAccess(
      req.user.id,
      req.user.role,
      req.user.clientId,
      propertyId
    );

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Property access denied',
        code: 'PROPERTY_ACCESS_DENIED',
        message: 'You do not have access to this property'
      });
    }

    req.propertyAccess = 'granted';
    next();
  } catch (error) {
    console.error('Property access check error:', error);
    return res.status(500).json({
      error: 'Access check failed',
      code: 'ACCESS_CHECK_ERROR',
      message: 'Unable to verify property access'
    });
  }
};

/**
 * Generate JWT token for user
 */
export const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    clientId: user.clientId,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'apex-ai-security',
    audience: 'apex-ai-users'
  });
};

/**
 * Verify and decode token without authentication
 */
export const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.verify(token, process.env.JWT_SECRET);
};

export default {
  authenticateToken,
  requireRole,
  requireAnyRole,
  requirePropertyAccess,
  generateToken,
  verifyToken
};
