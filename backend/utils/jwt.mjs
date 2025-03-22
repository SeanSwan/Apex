// backend/utils/jwt.mjs
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define possible env file paths in order of preference
const possibleEnvPaths = [
  path.resolve(__dirname, '..', '.env'),               // backend/.env
  path.resolve(__dirname, '..', '..', '.env'),         // project root/.env
  path.resolve(__dirname, '..', '..', 'backend', '.env') // explicit backend/.env
];

// Find the first .env file that exists
let envPath = null;
for (const possiblePath of possibleEnvPaths) {
  if (fs.existsSync(possiblePath)) {
    envPath = possiblePath;
    break;
  }
}

// Load environment variables from the correct location
if (envPath) {
  dotenv.config({ path: envPath });
  console.log(`JWT utils: Loading environment from: ${envPath}`);
} else {
  dotenv.config();
  console.log('JWT utils: No specific .env file found, using default dotenv behavior');
}

// Make sure we have a JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('WARNING: JWT_SECRET is not set in environment variables');
  // Set a fallback for development only (NOT for production)
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Using fallback JWT_SECRET for development environment only');
    process.env.JWT_SECRET = 'defense_app_dev_secret_key_2025';
  } else {
    throw new Error('JWT_SECRET must be set in production environment');
  }
}

// Get the secret from environment (or fallback for dev)
const getSecret = () => process.env.JWT_SECRET;

// Function to sign a new token
export const signToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '3h') => {
  return jwt.sign(payload, getSecret(), { expiresIn });
};

// Function to verify a token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, getSecret());
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return null;
  }
};

// Function to decode a token without verification (for debugging)
export const decodeToken = (token) => {
  return jwt.decode(token);
};

// Export all jwt utilities
export default {
  signToken,
  verifyToken,
  decodeToken
};