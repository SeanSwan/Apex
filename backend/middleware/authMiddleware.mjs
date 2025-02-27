import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

// Create a new PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PG_USER, // PostgreSQL user
  host: process.env.PG_HOST, // PostgreSQL host
  database: process.env.PG_DB, // PostgreSQL database name
  password: process.env.PG_PASSWORD, // PostgreSQL password
  port: process.env.PG_PORT, // PostgreSQL port
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

      // Verify the token using the JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user from the database using the decoded userId
      const query = 'SELECT * FROM users WHERE id = $1';
      const { rows } = await pool.query(query, [decoded.userId]);

      if (rows.length === 0) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = rows[0]; // Attach the user to the request object

      // Check if the user's role is included in the allowed roles for this route
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Access denied' });
      }

      next(); // Proceed to the next middleware or route handler
    } catch (err) {
      console.error('Auth error:', err);
      res.status(401).json({ message: 'Not authorized' });
    }
  };
};                                      