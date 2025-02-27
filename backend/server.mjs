import express from 'express';
import pkg from 'pg'; // PostgreSQL client for Node.js
const { Pool } = pkg;
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import checkinRoutes from './routes/checkin.mjs'; // Check-in routes
import authRoutes from './routes/authRoutes.mjs'; // Authentication routes
import detectionRoutes from './routes/detectionRoutes.mjs'; // Detection routes
import { protect } from './middleware/authMiddleware.mjs'; // Authentication middleware

dotenv.config(); // Load environment variables from .env file

const app = express();
const server = http.createServer(app);
const port = process.env.BACKEND_PORT || 5000; // Port the server will listen on

// Define the allowed origin
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// Configure CORS options
const corsOptions = {
  origin: allowedOrigin,
  credentials: true, // Allow cookies and credentials
};

// Use CORS middleware with the options
app.use(cors(corsOptions));

// Use express.json middleware
app.use(express.json()); // Parse incoming JSON requests

// Create a new PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PG_USER, // PostgreSQL user
  host: process.env.PG_HOST, // PostgreSQL host
  database: process.env.PG_DB, // PostgreSQL database name
  password: process.env.PG_PASSWORD, // PostgreSQL password
  port: process.env.PG_PORT, // PostgreSQL port
});

// Authentication routes (login, register)
app.use('/api/auth', authRoutes);

// Protected routes using the 'protect' middleware and role-based access control
app.use('/api/checkin', protect(['guard', 'supervisor', 'admin']), checkinRoutes);
app.use('/api/detections', protect(['guard', 'regional_manager', 'dispatch', 'operations_manager', 'admin', 'supervisor', 'payroll']), detectionRoutes);

// Socket.IO event handling
export const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('A user connected');
  
  // You can handle more events here
  
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});