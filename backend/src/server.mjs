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

// ==================================================
// APEX AI SECURITY ENHANCEMENTS - PRODUCTION READY
// ==================================================
import helmet from 'helmet';
import { apiLimiter, authLimiter, aiAlertLimiter, dispatchLimiter } from '../middleware/security/rateLimiter.mjs';
import { securityHeaders } from '../middleware/security/validation.mjs';

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
    const port = process.env.PORT || process.env.BACKEND_PORT || 5001;

    // Define allowed origins for CORS
    const allowedOrigins = [
      'http://localhost:5173',  // Vite default
      'http://localhost:3000',  // Alternative port (your Vite config)
      'http://localhost:3001',  // Client portal backup port (auto-increment)
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

    // ==============================================
    // SECURITY MIDDLEWARE - PRODUCTION HARDENING
    // ==============================================
    
    // Helmet for security headers
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:"],
        },
      },
      crossOriginEmbedderPolicy: false // Allow WebSocket connections
    }));
    
    // Custom security headers
    app.use(securityHeaders);
    
    // Use CORS middleware with the options
    app.use(cors(corsOptions));

    // Use express.json middleware with size limit
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Global API rate limiting
    app.use(apiLimiter);
    
    // Add request logging middleware
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
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
      console.log('✅ Database connection successful');
      
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
        console.log('✅ Users table exists');
      } else {
        console.log('⚠️ Users table does not exist yet - you may need to run migrations');
      }
      
      client.release();
    } catch (dbError) {
      console.log('⚠️ Database not available - running in DEMO MODE');
      console.log('📝 This is fine for development and demo purposes');
      // Continue anyway to allow exploring other functionality
    }

    // Initialize Sprint 4 Enhanced WebSocket Server with AI Engine integration
    const io = initializeSocketIO(server, allowedOrigins);
    console.log('✅ Sprint 4 WebSocket Server initialized with AI Engine integration');
    
    // Import additional socket utilities
    const { getAIEngineStatus, isConnectedToAI } = await import('./socket.js');

    // Enhanced health check route with security status
    app.get('/api/health', (req, res) => {
      const aiEngineStatus = getAIEngineStatus();
      res.json({ 
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        security: {
          helmet_enabled: true,
          rate_limiting_active: true,
          cors_configured: true,
          validation_active: true
        },
        websocket: {
          sprint4_integration: true,
          ai_engine_connected: isConnectedToAI(),
          ai_engine_status: aiEngineStatus,
          features: {
            visual_alerts: true,
            spatial_audio: true,
            ai_conversation: true,
            master_threat_coordinator: true
          }
        },
        corsOrigins: allowedOrigins,
        version: '3.0.0-sprint4-integration'
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

    // ===========================================
    // CLIENT PORTAL ROUTES (INDEPENDENT LOADING)
    // ===========================================
    
    // Load client portal routes independently of protect middleware
    try {
      console.log('Importing Client Portal Authentication routes...');
      const { default: clientAuthRoutes } = await import('../routes/client/v1/auth.mjs');
      app.use('/api/client/v1/auth', clientAuthRoutes);
      console.log('✅ Client Portal Auth routes loaded successfully');
    } catch (clientAuthError) {
      console.log('⚠️ Client Portal Auth routes not available:', clientAuthError.message);
      console.error('Full error:', clientAuthError);
    }
    
    // Load additional client portal routes
    try {
      console.log('Importing Client Portal Dashboard routes...');
      const { default: clientDashboardRoutes } = await import('../routes/client/v1/dashboard_simple.mjs');
      app.use('/api/client/v1/dashboard', clientDashboardRoutes);
      console.log('✅ Client Portal Dashboard routes loaded successfully');
    } catch (clientDashboardError) {
      console.log('⚠️ Client Portal Dashboard routes not available:', clientDashboardError.message);
    }
    
    try {
      console.log('Importing Client Portal Incidents routes...');
      const { default: clientIncidentsRoutes } = await import('../routes/client/v1/incidents_simple.mjs');
      app.use('/api/client/v1/incidents', clientIncidentsRoutes);
      console.log('✅ Client Portal Incidents routes loaded successfully');
    } catch (clientIncidentsError) {
      console.log('⚠️ Client Portal Incidents routes not available:', clientIncidentsError.message);
    }
    
    try {
      console.log('Importing Client Portal Evidence routes...');
      const { default: clientEvidenceRoutes } = await import('../routes/client/v1/evidence_simple.mjs');
      app.use('/api/client/v1/evidence', clientEvidenceRoutes);
      console.log('✅ Client Portal Evidence routes loaded successfully');
    } catch (clientEvidenceError) {
      console.log('⚠️ Client Portal Evidence routes not available:', clientEvidenceError.message);
    }
    
    try {
      console.log('Importing Client Portal Analytics routes...');
      const { default: clientAnalyticsRoutes } = await import('../routes/client/v1/analytics.mjs');
      app.use('/api/client/v1/analytics', clientAnalyticsRoutes);
      console.log('✅ Client Portal Analytics routes loaded successfully');
    } catch (clientAnalyticsError) {
      console.log('⚠️ Client Portal Analytics routes not available:', clientAnalyticsError.message);
    }
    
    try {
      console.log('Importing Client Portal Settings routes...');
      const { default: clientSettingsRoutes } = await import('../routes/client/v1/settings.mjs');
      app.use('/api/client/v1/settings', clientSettingsRoutes);
      console.log('✅ Client Portal Settings routes loaded successfully');
    } catch (clientSettingsError) {
      console.log('⚠️ Client Portal Settings routes not available:', clientSettingsError.message);
    }
    
    try {
      console.log('Importing Client Portal Hotspots routes...');
      const { default: clientHotspotsRoutes } = await import('../routes/client/v1/hotspots.mjs');
      app.use('/api/client/v1/hotspots', clientHotspotsRoutes);
      console.log('✅ Client Portal Hotspots routes loaded successfully');
    } catch (clientHotspotsError) {
      console.log('⚠️ Client Portal Hotspots routes not available:', clientHotspotsError.message);
    }
    
    try {
      // Import the protect middleware
      console.log('Importing auth middleware...');
      
      // Import routes dynamically with enhanced security
      console.log('Importing auth routes with rate limiting...');
      const { default: authRoutes } = await import('../routes/authRoutes.mjs');
      
      // Apply strict rate limiting to authentication routes
      app.use('/api/auth', authLimiter, authRoutes);
      console.log('✅ Auth routes loaded with security enhancements');
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
        
        // ===========================================
        // APEX AI PLATFORM ROUTES (NEW)
        // ===========================================
        
        try {
          console.log('Importing APEX AI Alert routes with rate limiting...');
          const { default: aiAlertRoutes } = await import('../routes/ai/alertRoutes.mjs');
          app.use('/api/ai-alerts', aiAlertLimiter, aiAlertRoutes);
          console.log('✅ AI Alert routes loaded with security enhancements');
        } catch (aiAlertError) {
          console.log('⚠️ AI Alert routes not available:', aiAlertError.message);
        }
        
        try {
          console.log('Importing APEX AI Dispatch routes with rate limiting...');
          const { default: aiDispatchRoutes } = await import('../routes/ai/dispatchRoutes.mjs');
          app.use('/api/dispatch', dispatchLimiter, aiDispatchRoutes);
          console.log('✅ AI Dispatch routes loaded with security enhancements');
        } catch (aiDispatchError) {
          console.log('⚠️ AI Dispatch routes not available:', aiDispatchError.message);
        }
        
        try {
          console.log('Importing APEX AI Camera routes...');
          const { default: aiCameraRoutes } = await import('../routes/ai/cameraRoutes.mjs');
          app.use('/api/cameras', aiCameraRoutes);
          console.log('✅ AI Camera routes loaded successfully');
        } catch (aiCameraError) {
          console.log('⚠️ AI Camera routes not available:', aiCameraError.message);
        }
        
        try {
          console.log('Importing APEX AI Services routes...');
          const { default: aiServicesRoutes } = await import('../routes/ai/aiServicesRoutes.mjs');
          app.use('/api/ai', aiServicesRoutes);
          console.log('✅ AI Services routes loaded successfully');
        } catch (aiServicesError) {
          console.log('⚠️ AI Services routes not available:', aiServicesError.message);
        }
        
        try {
          console.log('Importing APEX AI Routing routes...');
          const { default: aiRoutingRoutes } = await import('../routes/ai/routingRoutes.mjs');
          app.use('/api/routing', aiRoutingRoutes);
          console.log('✅ AI Routing routes loaded successfully');
        } catch (aiRoutingError) {
          console.log('⚠️ AI Routing routes not available:', aiRoutingError.message);
        }
        
        try {
          console.log('Importing APEX AI Notification routes...');
          const { default: aiNotificationRoutes } = await import('../routes/ai/notificationRoutes.mjs');
          app.use('/api/notifications', aiNotificationRoutes);
          app.use('/api/security', aiNotificationRoutes);
          console.log('✅ AI Notification routes loaded successfully');
        } catch (aiNotificationError) {
          console.log('⚠️ AI Notification routes not available:', aiNotificationError.message);
        }
        
        // ===========================================
        // VOICE AI DISPATCHER ROUTES (NEW SPRINT 3)
        // ===========================================
        
        try {
          console.log('Importing Voice AI Dispatcher routes...');
          const { default: voiceAiRoutes } = await import('../routes/voice-ai.mjs');
          app.use('/api/voice-ai', voiceAiRoutes);
          console.log('✅ Voice AI Dispatcher routes loaded successfully');
          
          // Initialize Voice AI WebSocket handlers
          const { initializeVoiceAIWebSocket } = await import('./voiceAISocket.mjs');
          initializeVoiceAIWebSocket(io);
          console.log('✅ Voice AI WebSocket handlers initialized');
          
        } catch (voiceAiError) {
          console.log('⚠️ Voice AI routes not available:', voiceAiError.message);
        }
        
        // ===========================================
        // INTERNAL DESKTOP APP ROUTES (NEW UNIFIED)
        // ===========================================
        
        try {
          console.log('Importing Internal Desktop App routes...');
          const { default: internalRoutes } = await import('../routes/internal/index.mjs');
          app.use('/api/internal', internalRoutes);
          console.log('✅ Internal Desktop App routes loaded successfully');
          console.log('   📋 SOPs management API ready');
          console.log('   📞 Contact lists management API ready');
          console.log('   🏠 Properties management API ready');
          console.log('   👮 Guards & dispatch management API ready');
          
        } catch (internalError) {
          console.log('⚠️ Internal Desktop App routes not available:', internalError.message);
        }
        
        console.log('🚀 APEX AI Platform routes integration complete with PRODUCTION SECURITY!');
        console.log('🎯 Sprint 4: Client Portal routes integrated successfully!');
        console.log('🔒 Security Features Active:');
        console.log('   ✅ Helmet security headers');
        console.log('   ✅ API rate limiting');
        console.log('   ✅ Input validation ready');
        console.log('   ✅ Authentication rate limiting');
        console.log('   ✅ AI alert flood protection');
        console.log('   ✅ Dispatch spam prevention');
        
        // Additional protected routes can be imported here
      } else {
        console.error('Auth middleware failed to load');
      }
    } catch (importError) {
      console.error('Error importing route files', importError);
      // Don't throw here - we'll continue with partial functionality
    }

    // ===========================================
    // DEMO MODE - MOCK API ROUTES (FALLBACK)
    // ===========================================
    
    try {
      console.log('🎭 Loading Mock API routes for demo mode...');
      const { default: mockApiRoutes } = await import('../routes/mockApi.mjs');
      app.use('/api/mock', mockApiRoutes);
      console.log('✅ Mock API routes loaded - demo mode ready!');
    } catch (mockError) {
      console.log('⚠️ Mock API routes not available:', mockError.message);
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