// backend/config/database.mjs
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

/**
 * Enhanced database configuration with robust environment handling
 * 
 * This module:
 * 1. Searches for .env files in multiple locations
 * 2. Verifies database connection parameters
 * 3. Provides detailed logging for troubleshooting
 * 4. Includes a test connection method
 */

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Find and load the appropriate .env file
 */
const loadEnvironmentVariables = () => {
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

  // If no .env file found, use the project root as fallback
  if (!envPath) {
    envPath = path.resolve(__dirname, '..', '..', '.env');
    console.warn(`⚠️ Warning: No .env file found. Using default path: ${envPath}`);
  }

  // Load environment variables from the found location
  dotenv.config({ path: envPath });
  console.log(`📁 Loading database config from: ${envPath}`);
  
  return envPath;
};

/**
 * Validate environment variables are properly set
 */
const validateEnvironmentVariables = () => {
  const requiredVars = ['PG_DB', 'PG_USER', 'PG_HOST', 'PG_PORT'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please check your .env file configuration');
  }
  
  // Log database connection parameters (without showing the actual password)
  console.log('📊 Database connection parameters:');
  console.log(`- Database: ${process.env.PG_DB || '(not set)'}`);
  console.log(`- User: ${process.env.PG_USER || '(not set)'}`);
  console.log(`- Host: ${process.env.PG_HOST || '(not set)'}`);
  console.log(`- Port: ${process.env.PG_PORT || '(not set)'}`);
  console.log(`- Password is set: ${process.env.PG_PASSWORD !== undefined}`);
  console.log(`- Password is empty: ${process.env.PG_PASSWORD === ''}`);
  
  return missingVars.length === 0;
};

// Execute environment loading
const envPath = loadEnvironmentVariables();
const environmentValid = validateEnvironmentVariables();

/**
 * Create Sequelize instance with proper configuration
 */
const sequelize = new Sequelize(
  process.env.PG_DB,
  process.env.PG_USER,
  process.env.PG_PASSWORD || '', // Handle empty password properly
  {
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT) || 5432,
    dialect: 'postgres', // Explicitly set dialect for Sequelize 4.0+
    logging: process.env.NODE_ENV !== 'production',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      // Fix for the password error by explicitly handling potential null values
      password: process.env.PG_PASSWORD || null,
      
      // Add SSL configuration for production environments
      ...(process.env.NODE_ENV === 'production' && {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      })
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
);

/**
 * Test the database connection
 * @returns {Promise<boolean>} True if connection is successful, false otherwise
 */
const testConnection = async () => {
  if (!environmentValid) {
    console.error('❌ Cannot test connection due to missing environment variables');
    return false;
  }
  
  try {
    await sequelize.authenticate();
    console.log('✅ Connection to PostgreSQL has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL:', error.message);
    
    // Provide helpful hints based on the error
    if (error.message.includes('password')) {
      console.log('🔧 HINT: Make sure your PG_PASSWORD environment variable is set correctly.');
      console.log('   - If using no password, leave it empty (PG_PASSWORD=)');
      console.log('   - If using a password, don\'t use quotes in the .env file');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('🔧 HINT: Make sure PostgreSQL is running on your computer.');
      console.log('   - Check that the PostgreSQL service is started');
      console.log('   - Verify the host and port settings in your .env file');
    } else if (error.message.includes('does not exist')) {
      console.log('🔧 HINT: The specified database does not exist.');
      console.log('   - Create the database first: CREATE DATABASE your_db_name;');
      console.log('   - Or update your PG_DB environment variable to match an existing database');
    }
    
    return false;
  }
};

// Export the sequelize instance and test function
export { testConnection, envPath as envFilePath };
export default sequelize;