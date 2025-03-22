// backend/src/server.mjs
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeSocketIO } from './socket.js';
import { log, error, setupGlobalErrorHandlers } from './debug.mjs';
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Setup global error handlers to catch uncaught exceptions
setupGlobalErrorHandlers();

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from backend root directory
const envPath = path.resolve(__dirname, '..', '.env');
console.log(`Loading environment from: ${envPath}`);
dotenv.config({ path: envPath });

// Check if the .env file exists
const envFileExists = fs.existsSync(envPath);
console.log(`.env file exists: ${envFileExists ? 'Yes' : 'No'}`);

// Check JWT configuration
console.log(`JWT_SECRET is set: ${!!process.env.JWT_SECRET}`);
if (process.env.JWT_SECRET) {
  console.log(`JWT_SECRET starts with: ${process.env.JWT_SECRET.substring(0, 3)}...`);
}

// Main function to start the server
const startServer = async () => {
  try {
    const app = express();
    const server = http.createServer(app);
    const port = process.env.PORT || process.env.BACKEND_PORT || 5000;

    // Define allowed origins for CORS
    const allowedOrigins = [
      'http://localhost:5173',  // Vite default
      'http://localhost:3000',  // Alternative port (your Vite config)
      process.env.FRONTEND_ORIGIN, // From .env if specified
    ].filter(Boolean); // Remove undefined/null values
    
    console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

    // Configure CORS options to accept multiple origins
    const corsOptions = {
      origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          console.log(`CORS blocked origin: ${origin}`);
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };

    // Use CORS middleware with the options
    app.use(cors(corsOptions));

    // Use express.json middleware
    app.use(express.json());
    
    // Add request logging middleware
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });

    // Create a new PostgreSQL connection pool with fallbacks
    const pool = new Pool({
      user: process.env.PG_USER || 'postgres',
      host: process.env.PG_HOST || 'localhost',
      database: process.env.PG_DB || 'postgres',
      password: process.env.PG_PASSWORD || '',
      port: Number(process.env.PG_PORT || 5432),
    });

    // Test database connection
    try {
      const client = await pool.connect();
      console.log('Database connection successful');
      
      // Check if users table exists
      const tableResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        )
      `);
      
      const usersTableExists = tableResult.rows[0].exists;
      if (usersTableExists) {
        console.log('Users table exists');
      } else {
        console.log('Users table does not exist yet - you may need to run migrations');
      }
      
      client.release();
    } catch (dbError) {
      console.error('Failed to connect to database', dbError);
      // Continue anyway to allow exploring other functionality
    }

    // Initialize Socket.io before importing routes
    initializeSocketIO(server, allowedOrigins);

    // Simple health check route
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        corsOrigins: allowedOrigins
      });
    });

    // Add JWT validation test route
    app.get('/api/test-jwt', async (req, res) => {
      try {
        const testPayload = { userId: 999, role: 'test' };
        
        if (!process.env.JWT_SECRET) {
          return res.status(500).json({ 
            error: 'JWT_SECRET not set',
            environment: {
              JWT_SECRET_SET: !!process.env.JWT_SECRET,
              ENV_PATH: envPath,
              ENV_FILE_EXISTS: fs.existsSync(envPath)
            }
          });
        }
        
        const token = jwt.sign(testPayload, process.env.JWT_SECRET);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        res.json({ 
          success: true, 
          message: 'JWT signing and verification working correctly',
          token,
          decoded
        });
      } catch (jwtError) {
        res.status(500).json({ 
          error: 'JWT test failed', 
          message: jwtError.message,
          stack: jwtError.stack
        });
      }
    });

    try {
      // Import routes dynamically 
      console.log('Importing auth routes...');
      const { default: authRoutes } = await import('../routes/authRoutes.mjs');
      app.use('/api/auth', authRoutes);
      console.log('Auth routes loaded successfully');
      
      // Import the protect middleware
      console.log('Importing auth middleware...');
      const { protect } = await import('../middleware/authMiddleware.mjs');
      
      // Only import these routes if the protect middleware was loaded successfully
      if (protect) {
        console.log('Auth middleware loaded successfully, importing protected routes...');
        
        try {
          const { default: checkinRoutes } = await import('../routes/checkin.mjs');
          app.use('/api/checkin', protect(['guard', 'supervisor', 'admin']), checkinRoutes);
          console.log('Checkin routes loaded successfully');
        } catch (checkinError) {
          console.error('Error importing checkin routes', checkinError);
        }
        
        try {
          const { default: detectionRoutes } = await import('../routes/detectionRoutes.mjs');
          app.use('/api/detections', protect(['guard', 'regional_manager', 'dispatch', 'operations_manager', 'admin', 'supervisor', 'payroll']), detectionRoutes);
          console.log('Detection routes loaded successfully');
        } catch (detectionError) {
          console.error('Error importing detection routes', detectionError);
        }
        
        // Additional protected routes can be imported here
      } else {
        console.error('Auth middleware failed to load');
      }
    } catch (importError) {
      console.error('Error importing route files', importError);
      // Don't throw here - we'll continue with partial functionality
    }

    // Catch-all 404 handler
    app.use((req, res) => {
      res.status(404).json({ 
        error: 'Not Found',
        message: `The requested resource at ${req.url} was not found`
      });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
      });
    });

    // Start the server
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Health check available at: http://localhost:${port}/api/health`);
      console.log(`JWT test available at: http://localhost:${port}/api/test-jwt`);
    });
  } catch (err) {
    console.error('Error starting server', err);
    process.exit(1);
  }
};

// Start the server
startServer();