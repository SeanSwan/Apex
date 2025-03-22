// backend/middleware/authMiddleware.mjs
import { verifyToken, decodeToken } from '../utils/jwt.mjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../models/index.mjs';

// Load environment variables directly from the backend/.env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Add debug logging
console.log(`Auth middleware: Environment loaded from ${envPath}`);
console.log(`Auth middleware: JWT_SECRET is set: ${!!process.env.JWT_SECRET}`);

// Admin roles hierarchy
const ADMIN_ROLES = ['super_admin', 'admin_cto', 'admin_ceo', 'admin_cfo'];
const MANAGER_ROLES = [...ADMIN_ROLES, 'manager'];
const CLIENT_ROLES = ['client'];
const GUARD_ROLES = ['guard'];
const ALL_ROLES = [...ADMIN_ROLES, 'manager', 'client', 'guard', 'user'];

// Role hiearchy helpers
const isAdmin = (role) => ADMIN_ROLES.includes(role);
const isManager = (role) => MANAGER_ROLES.includes(role);
const isGuard = (role) => GUARD_ROLES.includes(role);
const isClient = (role) => CLIENT_ROLES.includes(role);

// Primary middleware function to protect routes based on user roles
export const protect = (roles = []) => {
  // Convert string to array if a single role was provided
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return async (req, res, next) => {
    try {
      let token;

      // Check if the Authorization header contains a Bearer token
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
      ) {
        token = req.headers.authorization.split(' ')[1];
      }

      // If no token is provided, return an unauthorized error
      if (!token) {
        return res.status(401).json({ message: 'Not authorized, token missing' });
      }

      // Add debug logging for token
      console.log(`Processing token: ${token.substring(0, 15)}...`);
      
      // Try to decode token without verification first (for debugging)
      const decodedWithoutVerification = decodeToken(token);
      console.log('Token payload (without verification):', decodedWithoutVerification);

      // Verify the token
      const decoded = verifyToken(token);
      if (!decoded) {
        console.error('Token verification failed');
        return res.status(401).json({ message: 'Invalid token' });
      }

      console.log('Token verified successfully:', decoded);

      // Fetch the user from the database using the decoded userId or id
      const userId = decoded.userId || decoded.id; // Handle both formats
      
      if (!userId) {
        console.error('No userId in token payload');
        return res.status(401).json({ message: 'Invalid token format' });
      }
      
      console.log(`Looking up user with ID: ${userId}`);
      
      try {
        // Use Sequelize models to find the user
        const user = await db.User.findByPk(userId);

        if (!user) {
          console.error(`User with ID ${userId} not found in database`);
          return res.status(401).json({ message: 'User not found' });
        }

        console.log(`User found: ${user.username}, role: ${user.role}`);
        
        // Check if user is active
        if (!user.is_active) {
          console.error(`User ${user.username} account is inactive`);
          return res.status(403).json({ message: 'Account is inactive' });
        }
        
        // Attach the user to the request object (excluding password)
        req.user = user.toJSON();

        // If no specific roles are required, just authenticate
        if (!roles.length) {
          console.log('No specific roles required, authentication successful');
          return next();
        }
        
        // Check if the user's role is included in the allowed roles for this route
        const userHasRequiredRole = roles.some(role => {
          // Handle role hierarchy with special keywords
          if (role === 'any_admin' && isAdmin(user.role)) return true;
          if (role === 'any_manager' && isManager(user.role)) return true;
          if (role === 'any_guard' && isGuard(user.role)) return true;
          if (role === 'any_client' && isClient(user.role)) return true;
          
          // Direct role match
          return user.role === role;
        });
        
        if (!userHasRequiredRole) {
          console.error(`User role (${user.role}) not in allowed roles: ${roles.join(', ')}`);
          return res.status(403).json({ 
            message: 'Forbidden: Access denied',
            requiredRoles: roles,
            userRole: user.role
          });
        }

        console.log('Authentication and authorization successful');
        next(); // Proceed to the next middleware or route handler
      } catch (dbError) {
        console.error('Database error during user lookup:', dbError);
        return res.status(500).json({ message: 'Database error', error: dbError.message });
      }
    } catch (err) {
      console.error('Auth error:', err);
      res.status(401).json({ message: 'Not authorized', error: err.message });
    }
  };
};

// Middleware to check if user is an admin (any admin role)
export const requireAdmin = protect(['any_admin']);

// Middleware to check if user is a manager or admin
export const requireManager = protect(['any_manager']);

// Middleware to check if user is a guard
export const requireGuard = protect(['guard']);

// Middleware to check if user is a client
export const requireClient = protect(['client']);

// Middleware that just verifies authentication without role checks
export const requireAuth = protect([]);

// Middleware to attach user to request if authenticated (but doesn't block if not)
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check if the Authorization header contains a Bearer token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify the token
      const decoded = verifyToken(token);
      if (decoded) {
        const userId = decoded.userId || decoded.id;
        if (userId) {
          // Use Sequelize to find the user
          const user = await db.User.findByPk(userId);
          if (user && user.is_active) {
            req.user = user.toJSON();
          }
        }
      }
    }
    
    // Always proceed to next middleware
    next();
  } catch (err) {
    console.error('Optional auth error:', err);
    // Still proceed to next middleware even if auth fails
    next();
  }
};