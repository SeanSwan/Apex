// backend/config/config.js
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Configuration file for Sequelize CLI using ES modules
 * 
 * This file provides database configuration for Sequelize CLI migrations
 */

// Get current file directory (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Search for .env file in multiple locations
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
  envPath = path.resolve(__dirname, '..', '.env');
  console.warn(`Warning: No .env file found. Using default path: ${envPath}`);
}

// Load environment variables
dotenv.config({ path: envPath });
console.log(`Loading Sequelize CLI config from: ${envPath}`);

// Validate critical environment variables
const requiredEnvVars = ['PG_USER', 'PG_HOST', 'PG_DB', 'PG_PORT'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please check your .env file');
}

// Configuration for different environments
const config = {
  development: {
    username: process.env.PG_USER,
    password: process.env.PG_PASSWORD || '', // Handle empty password
    database: process.env.PG_DB,
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT, 10) || 5432,
    dialect: 'postgres', // Explicitly set dialect for Sequelize 4.0+
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true
    }
  },
  test: {
    username: process.env.PG_USER,
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DB_TEST || `${process.env.PG_DB}_test`,
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT, 10) || 5432,
    dialect: 'postgres', // Explicitly set dialect for Sequelize 4.0+
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  },
  production: {
    username: process.env.PG_USER,
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DB,
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT, 10) || 5432,
    dialect: 'postgres', // Explicitly set dialect for Sequelize 4.0+
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

export default config;