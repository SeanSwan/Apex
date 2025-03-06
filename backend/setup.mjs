// Run this script with: node setup.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n==== Project Setup Helper ====\n');

// Directories to create if they don't exist
const directories = [
  'utils',
  'config',
  'models'
];

// Create directories
directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dirPath}`);
    } catch (error) {
      console.error(`❌ Failed to create directory ${dirPath}: ${error.message}`);
    }
  } else {
    console.log(`✓ Directory already exists: ${dirPath}`);
  }
});

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `# Server Configuration
PORT=5000

# Database Configuration
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=
PG_DB=postgres

# JWT Configuration
JWT_SECRET=defense_app_secret_key_2025
JWT_EXPIRES_IN=3h

# Other Services
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_EMAIL_FROM=your_verified_sendgrid_email
GROUPME_TOKEN=

# Logging
LOG_LEVEL=info
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Created .env file: ${envPath}`);
  } catch (error) {
    console.error(`❌ Failed to create .env file: ${error.message}`);
  }
} else {
  console.log(`✓ .env file already exists: ${envPath}`);
}

// Create JWT utility file
const jwtUtilPath = path.join(__dirname, 'utils', 'jwt.mjs');
if (!fs.existsSync(jwtUtilPath)) {
  const jwtUtilContent = `// utils/jwt.mjs
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
`;

  try {
    fs.writeFileSync(jwtUtilPath, jwtUtilContent);
    console.log(`✅ Created JWT utility file: ${jwtUtilPath}`);
  } catch (error) {
    console.error(`❌ Failed to create JWT utility file: ${error.message}`);
  }
} else {
  console.log(`✓ JWT utility file already exists: ${jwtUtilPath}`);
}

console.log('\n==== Setup Complete ====\n');
console.log('Next steps:');
console.log('1. Ensure your .env file has the correct values');
console.log('2. Run "node debug.mjs" to check your configuration');
console.log('3. Start your application with "npm start"');
console.log('\n');