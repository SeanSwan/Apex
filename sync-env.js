// Save this as sync-env.js in your project root
// Run with: node sync-env.js

const fs = require('fs');
const path = require('path');

// Paths to the two .env files
const rootEnvPath = path.resolve(__dirname, '.env');
const backendEnvPath = path.resolve(__dirname, 'backend', '.env');

// Function to parse an .env file into an object
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const envVars = {};
  for (const line of lines) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }
    
    // Split by the first = character
    const separatorIndex = line.indexOf('=');
    if (separatorIndex > 0) {
      const key = line.substring(0, separatorIndex).trim();
      const value = line.substring(separatorIndex + 1).trim();
      envVars[key] = value;
    }
  }
  
  return envVars;
}

// Function to write an object to an .env file
function writeEnvFile(filePath, envVars) {
  const lines = [];
  for (const [key, value] of Object.entries(envVars)) {
    lines.push(`${key}=${value}`);
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
}

// Main function
function syncEnvFiles() {
  console.log('Syncing .env files...');
  
  // Read both files
  const rootEnv = parseEnvFile(rootEnvPath);
  const backendEnv = parseEnvFile(backendEnvPath);
  
  // Print current state
  console.log('Root .env:', Object.keys(rootEnv).join(', '));
  console.log('Backend .env:', Object.keys(backendEnv).join(', '));
  
  // Add critical variables if missing
  if (!rootEnv.JWT_SECRET && backendEnv.JWT_SECRET) {
    console.log('Adding JWT_SECRET to root .env from backend .env');
    rootEnv.JWT_SECRET = backendEnv.JWT_SECRET;
  } else if (!backendEnv.JWT_SECRET && rootEnv.JWT_SECRET) {
    console.log('Adding JWT_SECRET to backend .env from root .env');
    backendEnv.JWT_SECRET = rootEnv.JWT_SECRET;
  } else if (!rootEnv.JWT_SECRET && !backendEnv.JWT_SECRET) {
    console.log('JWT_SECRET missing from both files, creating a new one');
    // Generate a random string as JWT_SECRET
    const crypto = require('crypto');
    const newSecret = crypto.randomBytes(32).toString('hex');
    rootEnv.JWT_SECRET = newSecret;
    backendEnv.JWT_SECRET = newSecret;
  }
  
  // Ensure JWT_EXPIRES_IN is set
  if (!rootEnv.JWT_EXPIRES_IN) {
    rootEnv.JWT_EXPIRES_IN = backendEnv.JWT_EXPIRES_IN || '3h';
  }
  if (!backendEnv.JWT_EXPIRES_IN) {
    backendEnv.JWT_EXPIRES_IN = rootEnv.JWT_EXPIRES_IN || '3h';
  }
  
  // Write the updated files
  writeEnvFile(rootEnvPath, rootEnv);
  writeEnvFile(backendEnvPath, backendEnv);
  
  console.log('Environment variables synchronized!');
  console.log('Updated root .env:', Object.keys(rootEnv).join(', '));
  console.log('Updated backend .env:', Object.keys(backendEnv).join(', '));
}

// Run the sync
syncEnvFiles();