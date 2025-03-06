// backend/src/check-env.js

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the backend root directory (assuming this file is in src/)
const backendDir = path.resolve(__dirname, '..');

// Check if .env file exists in the backend directory
const envPath = path.join(backendDir, '.env');
const envExists = fs.existsSync(envPath);

console.log(`\n--- Environment Check ---`);
console.log(`Looking for .env at: ${envPath}`);
console.log(`.env file exists: ${envExists ? '✅ Yes' : '❌ No'}`);

// If .env exists, load it and check for JWT_SECRET
if (envExists) {
  dotenv.config({ path: envPath });
  
  // Check if JWT_SECRET is set
  if (process.env.JWT_SECRET) {
    console.log(`JWT_SECRET: ✅ Set (${process.env.JWT_SECRET.substring(0, 3)}...)`);
  } else {
    console.log(`JWT_SECRET: ❌ Not set`);
  }
  
  // Check other important environment variables
  const requiredVars = [
    'PG_HOST', 'PG_PORT', 'PG_USER', 'PG_PASSWORD', 'PG_DB',
    'JWT_EXPIRES_IN'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log(`\nMissing environment variables: ${missingVars.join(', ')}`);
  } else {
    console.log(`\nAll required environment variables are set.`);
  }
} else {
  console.log('\nCould not find .env file. Please create one with the necessary variables.');
}

// Create a test JWT token to check signing
if (process.env.JWT_SECRET) {
  try {
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign({ test: true }, process.env.JWT_SECRET);
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    console.log('\nJWT test: ✅ Successful token generation and verification');
  } catch (error) {
    console.log(`\nJWT test failed: ${error.message}`);
  }
}

console.log(`\n--- End of Environment Check ---\n`);