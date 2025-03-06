// backend/src/debug.mjs
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend folder
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Simple logging functions
export const log = (message, ...args) => {
  console.log(`[INFO] ${message}`, ...args);
};

export const warn = (message, ...args) => {
  console.warn(`[WARNING] ${message}`, ...args);
};

export const error = (message, err) => {
  console.error(`[ERROR] ${message}`);
  if (err) {
    console.error(err);
  }
};

// Set up global error handlers
export const setupGlobalErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    error('Uncaught Exception:', err);
    // Don't exit the process to allow for graceful handling
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process to allow for graceful handling
  });

  log('Global error handlers set up');
};

// Environment variables checker
export const checkEnv = () => {
  log('Checking environment variables...');
  
  const requiredVars = [
    'PG_USER', 
    'PG_HOST', 
    'PG_DB', 
    'PG_PORT', 
    'JWT_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    error(`Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  log('All required environment variables are set');
  return true;
};

// Print environment status (with limited exposure of secrets)
export const printEnvStatus = () => {
  log('Environment variables status:');
  log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not set'}`);
  log(`PG_HOST: ${process.env.PG_HOST || '❌ Not set'}`);
  log(`PG_PORT: ${process.env.PG_PORT || '❌ Not set'}`);
  log(`PG_USER: ${process.env.PG_USER || '❌ Not set'}`);
  log(`PG_DB: ${process.env.PG_DB || '❌ Not set'}`);
  log(`PG_PASSWORD: ${process.env.PG_PASSWORD ? '✅ Set' : '❌ Not set'}`);
};