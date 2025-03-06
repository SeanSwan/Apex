// Create a new file: backend/src/config.js

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from project root
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

// Validate critical environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'PG_USER',
  'PG_HOST',
  'PG_DB',
  'PG_PASSWORD',
  'PG_PORT'
];

// Check if all required variables are present
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please check your .env file');
  // Don't exit here, just warn
}

// Export configuration for use in other files
export default {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '3h'
  },
  database: {
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    name: process.env.PG_DB,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT)
  },
  server: {
    port: process.env.BACKEND_PORT || 5000,
    frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
  }
};

// Then in your files, import and use this config instead of directly using process.env
// Example import:
// import config from '../src/config.js';
// Then use:
// const decoded = jwt.verify(token, config.jwt.secret);