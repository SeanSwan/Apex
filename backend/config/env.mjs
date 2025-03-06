// 1. Create a new file: backend/config/env.mjs

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend root directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Export a function to check if JWT_SECRET is set
export const checkJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    console.error('WARNING: JWT_SECRET is not set in environment variables');
    // Set a fallback secret only for development (NOT recommended for production)
    process.env.JWT_SECRET = 'your_jwt_secret_key';
    return false;
  }
  return true;
};

// Run check on module import
checkJwtSecret();

// Export other environment variables as needed
export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '3h'
};