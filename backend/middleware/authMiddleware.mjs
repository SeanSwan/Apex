// backend/middleware/authMiddleware.mjs
import pkg from 'pg';
const { Pool } = pkg;
import { verifyToken, decodeToken } from '../utils/jwt.mjs';
import dotenv from 'dotenv';

// Load environment variables directly from the backend/.env file
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Add debug logging
console.log(`Auth middleware: Environment loaded from ${envPath}`);
console.log(`Auth middleware: JWT_SECRET is set: ${!!process.env.JWT_SECRET}`);

// Create a new PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASSWORD || '', // Handle empty password case
  port: Number(process.env.PG_PORT || 5432),
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected successfully');
  }
});

// Middleware function to protect routes based on user roles
export const protect = (roles = []) => {
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
      
      // Check if the users table exists
      try {
        const tableCheck = await pool.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
        );
        
        if (!tableCheck.rows[0].exists) {
          console.error('Users table does not exist');
          return res.status(500).json({ message: 'Database configuration error' });
        }
      } catch (tableError) {
        console.error('Error checking for users table:', tableError);
      }
      
      try {
        const query = 'SELECT * FROM users WHERE id = $1';
        const { rows } = await pool.query(query, [userId]);

        if (rows.length === 0) {
          console.error(`User with ID ${userId} not found in database`);
          return res.status(401).json({ message: 'User not found' });
        }

        console.log(`User found: ${rows[0].username}, role: ${rows[0].role}`);
        req.user = rows[0]; // Attach the user to the request object

        // Check if the user's role is included in the allowed roles for this route
        if (roles.length && !roles.includes(req.user.role)) {
          console.error(`User role (${req.user.role}) not in allowed roles: ${roles.join(', ')}`);
          return res.status(403).json({ message: 'Forbidden: Access denied' });
        }

        console.log('Authentication successful');
        next(); // Proceed to the next middleware or route handler
      } catch (dbError) {
        console.error('Database error during user lookup:', dbError);
        return res.status(500).json({ message: 'Database error' });
      }
    } catch (err) {
      console.error('Auth error:', err);
      res.status(401).json({ message: 'Not authorized' });
    }
  };
};