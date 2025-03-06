// Save this as debug-token.js in your backend directory
// Run with: node debug-token.js

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Read both .env files to check their contents
const rootEnv = fs.readFileSync(path.resolve(__dirname, '..', '.env'), 'utf8');
const backendEnv = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8');

console.log('\n--- Root .env file ---');
console.log(rootEnv.replace(/([A-Z_]+=)(.+)/g, '$1[HIDDEN]'));

console.log('\n--- Backend .env file ---');
console.log(backendEnv.replace(/([A-Z_]+=)(.+)/g, '$1[HIDDEN]'));

// Extract JWT_SECRET from both files using regex
const rootJwtMatch = rootEnv.match(/JWT_SECRET=(.+)/);
const backendJwtMatch = backendEnv.match(/JWT_SECRET=(.+)/);

const rootJwtSecret = rootJwtMatch ? rootJwtMatch[1].trim() : null;
const backendJwtSecret = backendJwtMatch ? backendJwtMatch[1].trim() : null;

console.log('\n--- JWT Secret Info ---');
console.log('Root JWT Secret exists:', !!rootJwtSecret);
console.log('Backend JWT Secret exists:', !!backendJwtSecret);

if (rootJwtSecret && backendJwtSecret) {
  console.log('JWT Secrets are identical:', rootJwtSecret === backendJwtSecret);
}

// Try to create and verify a token with both secrets
console.log('\n--- Token Tests ---');

// Get a token from the console if provided
const sampleToken = process.argv[2];

if (sampleToken) {
  console.log('Testing provided token...');
  
  if (backendJwtSecret) {
    try {
      const decoded = jwt.verify(sampleToken, backendJwtSecret);
      console.log('✅ Token verified with backend JWT_SECRET!');
      console.log('Decoded:', decoded);
    } catch (err) {
      console.log('❌ Failed to verify with backend JWT_SECRET:', err.message);
    }
  }
  
  if (rootJwtSecret) {
    try {
      const decoded = jwt.verify(sampleToken, rootJwtSecret);
      console.log('✅ Token verified with root JWT_SECRET!');
      console.log('Decoded:', decoded);
    } catch (err) {
      console.log('❌ Failed to verify with root JWT_SECRET:', err.message);
    }
  }
} else {
  console.log('No token provided for testing.');
}

// Create new tokens with both secrets
console.log('\n--- Creating test tokens ---');
const payload = { userId: 123, role: 'user' };

if (backendJwtSecret) {
  const backendToken = jwt.sign(payload, backendJwtSecret, { expiresIn: '1h' });
  console.log('Backend Token:', backendToken);
}

if (rootJwtSecret) {
  const rootToken = jwt.sign(payload, rootJwtSecret, { expiresIn: '1h' });
  console.log('Root Token:', rootToken);
}