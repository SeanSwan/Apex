// backend/utils/jwt.mjs
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Make sure we have a JWT secret
if (!process.env.JWT_SECRET) {
  console.error('WARNING: JWT_SECRET is not set in environment variables');
  // Set a fallback for development only (NOT for production)
  process.env.JWT_SECRET = 'defense_app_secret_key_2025';
}

// Simple functions to sign and verify tokens
export const signToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '3h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return null;
  }
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};