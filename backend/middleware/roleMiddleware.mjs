// backend/middleware/roleMiddleware.mjs
import { protect } from './authMiddleware.mjs';

/**
 * Role constants for the application
 */
export const ROLES = {
  // Admin roles
  SUPER_ADMIN: 'super_admin',
  ADMIN_CTO: 'admin_cto',
  ADMIN_CEO: 'admin_ceo',
  ADMIN_CFO: 'admin_cfo',
  
  // Management roles
  MANAGER: 'manager',
  
  // Client roles
  CLIENT: 'client',
  
  // Security personnel roles
  GUARD: 'guard',
  
  // Pending users
  USER: 'user',
  
  // Special role groups (these are not actual roles but used in middleware)
  ANY_ADMIN: 'any_admin',      // Any admin role
  ANY_MANAGER: 'any_manager',  // Any manager role (includes admins)
};

/**
 * Role hierarchy relationships
 */
export const ROLE_HIERARCHY = {
  // Admin roles include themselves
  [ROLES.SUPER_ADMIN]: [ROLES.SUPER_ADMIN],
  [ROLES.ADMIN_CTO]: [ROLES.ADMIN_CTO],
  [ROLES.ADMIN_CEO]: [ROLES.ADMIN_CEO],
  [ROLES.ADMIN_CFO]: [ROLES.ADMIN_CFO],
  
  // Manager roles include admins
  [ROLES.MANAGER]: [
    ROLES.MANAGER,
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN_CTO,
    ROLES.ADMIN_CEO,
    ROLES.ADMIN_CFO
  ],
  
  // Groups
  [ROLES.ANY_ADMIN]: [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN_CTO,
    ROLES.ADMIN_CEO,
    ROLES.ADMIN_CFO
  ],
  
  [ROLES.ANY_MANAGER]: [
    ROLES.MANAGER,
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN_CTO,
    ROLES.ADMIN_CEO,
    ROLES.ADMIN_CFO
  ]
};

/**
 * Check if a user with a certain role can access a resource requiring another role
 * @param {string} userRole - The role of the user
 * @param {string} requiredRole - The role required for access
 * @returns {boolean} - Whether the user has sufficient permissions
 */
export const checkRoleAccess = (userRole, requiredRole) => {
  // Direct role match
  if (userRole === requiredRole) return true;
  
  // Check role hierarchy
  if (ROLE_HIERARCHY[requiredRole] && ROLE_HIERARCHY[requiredRole].includes(userRole)) {
    return true;
  }
  
  return false;
};

/**
 * Middleware to require specific roles for route access
 * @param {string|string[]} roles - Single role or array of roles that can access the route
 * @returns {Function} Express middleware function
 */
export const requireRole = (roles) => {
  // Handle both string and array inputs
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return protect(roleArray);
};

/**
 * Middleware shortcuts for common role requirements
 */
export const requireAdmin = protect([ROLES.ANY_ADMIN]);
export const requireManager = protect([ROLES.ANY_MANAGER]);
export const requireClient = protect([ROLES.CLIENT]);
export const requireGuard = protect([ROLES.GUARD]);

/**
 * Middleware for when a user must be authenticated but role doesn't matter
 */
export const requireAuth = protect([]);

/**
 * Extend the request object with role checking methods
 * Use after the protect middleware has attached the user to the request
 */
export const addRoleHelpers = (req, res, next) => {
  if (req.user) {
    // Add helper methods to check roles
    req.user.hasRole = (role) => checkRoleAccess(req.user.role, role);
    req.user.isAdmin = () => checkRoleAccess(req.user.role, ROLES.ANY_ADMIN);
    req.user.isManager = () => checkRoleAccess(req.user.role, ROLES.ANY_MANAGER);
    req.user.isGuard = () => req.user.role === ROLES.GUARD;
    req.user.isClient = () => req.user.role === ROLES.CLIENT;
  }
  next();
};

/**
 * Complete middleware chain for authenticated requests with role helpers
 * @param {string|string[]} roles - Required roles for the route
 * @returns {Function[]} Array of middleware functions
 */
export const withRoles = (roles) => {
  const roleMiddleware = roles ? requireRole(roles) : requireAuth;
  return [roleMiddleware, addRoleHelpers];
};

/**
 * Owner check middleware - verifies that the authenticated user owns the resource
 * @param {Function} getResourceOwnerId - Function that extracts the owner ID from the request
 * @param {boolean} allowAdmin - Whether to also allow admins to access the resource
 * @returns {Function} Express middleware function
 */
export const requireOwnership = (getResourceOwnerId, allowAdmin = true) => {
  return async (req, res, next) => {
    try {
      // This middleware should be used after authentication
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Allow admins to bypass ownership check if specified
      if (allowAdmin && checkRoleAccess(req.user.role, ROLES.ANY_ADMIN)) {
        return next();
      }
      
      // Get the owner ID using the provided function
      const ownerId = await getResourceOwnerId(req);
      
      // Check if the authenticated user is the owner
      if (ownerId && req.user.id === ownerId) {
        return next();
      }
      
      // Deny access if not the owner
      return res.status(403).json({ 
        message: 'Access denied: You do not have permission to access this resource' 
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({ message: 'Server error during permission check' });
    }
  };
};

/**
 * Property access middleware - checks if a user has access to a specific property
 * Used for clients who should only access their own properties
 */
export const requirePropertyAccess = async (req, res, next) => {
  try {
    // This middleware should be used after authentication
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Admins and managers can access all properties
    if (checkRoleAccess(req.user.role, ROLES.ANY_MANAGER)) {
      return next();
    }
    
    // Get the property ID from the request parameters or body
    const propertyId = req.params.propertyId || req.body.propertyId;
    
    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required' });
    }
    
    // If user is a client, check if the property belongs to them
    if (req.user.role === ROLES.CLIENT) {
      const { Property } = require('../models/index.mjs');
      
      const property = await Property.findByPk(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      
      if (property.client_id !== req.user.id) {
        return res.status(403).json({ 
          message: 'Access denied: You do not have permission to access this property' 
        });
      }
    }
    
    // If user is a guard, check if they are assigned to the property
    if (req.user.role === ROLES.GUARD) {
      const { Guard, PropertyAssignment } = require('../models/index.mjs');
      
      // Find the guard record for this user
      const guard = await Guard.findOne({ where: { user_id: req.user.id } });
      
      if (!guard) {
        return res.status(404).json({ message: 'Guard profile not found' });
      }
      
      // Check if the guard is assigned to this property
      const assignment = await PropertyAssignment.findOne({
        where: {
          guard_id: guard.id,
          property_id: propertyId,
          status: 'active'
        }
      });
      
      if (!assignment) {
        return res.status(403).json({ 
          message: 'Access denied: You are not assigned to this property' 
        });
      }
    }
    
    // User has access to the property
    next();
  } catch (error) {
    console.error('Property access check error:', error);
    return res.status(500).json({ message: 'Server error during permission check' });
  }
};