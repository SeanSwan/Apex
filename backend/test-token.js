// backend/src/test-token.js
// Run with: node --loader ts-node/esm src/test-token.js

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check .env file location and load
const envPath = path.resolve(__dirname, '..', '..', '.env');
console.log(`Looking for .env at: ${envPath}`);
console.log(`File exists: ${fs.existsSync(envPath)}`);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading .env file:', result.error);
}

// Check JWT_SECRET
const secret = process.env.JWT_SECRET;
console.log(`JWT_SECRET exists: ${!!secret}`);
if (!secret) {
  console.error('JWT_SECRET is not set in environment variables');
  process.exit(1);
}

// Create a test token
const testPayload = { userId: 999, role: 'admin' };
try {
  console.log('\nCreating test token...');
  const token = jwt.sign(testPayload, secret, { expiresIn: '1h' });
  console.log(`Token: ${token}`);
  
  // Verify the token
  console.log('\nVerifying token...');
  const decoded = jwt.verify(token, secret);
  console.log('Token verified successfully!');
  console.log('Decoded payload:', decoded);
  
  // Test with wrong secret
  console.log('\nTesting with wrong secret (should fail)...');
  try {
    jwt.verify(token, 'wrong_secret');
    console.log('⚠️ Warning: Verification with wrong secret succeeded! This should not happen.');
  } catch (error) {
    console.log('✅ Expected error with wrong secret:', error.name);
  }
  
} catch (error) {
  console.error('Error in token operations:', error);
}