// backend/config/database.mjs
import { Sequelize } from 'sequelize';
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

// If no .env file found, use the project root as fallback
if (!envPath) {
  envPath = path.resolve(__dirname, '..', '..', '.env');
  console.warn(`Warning: No .env file found. Using default path: ${envPath}`);
}

// Load environment variables from the correct location
dotenv.config({ path: envPath });
console.log(`Loading database config from: ${envPath}`);

// Create Sequelize instance with fallback values for all required parameters
const sequelize = new Sequelize(
  process.env.PG_DB || 'postgres',
  process.env.PG_USER || 'postgres',
  process.env.PG_PASSWORD || '',
  {
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    }
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection to PostgreSQL has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL:', error.message);
    
    // Log helpful troubleshooting messages
    if (error.message.includes('password')) {
      console.log('🔧 HINT: Make sure your PG_PASSWORD environment variable is set correctly.');
      console.log('   - If using no password, leave it empty (PG_PASSWORD=)');
      console.log('   - If using a password, don\'t use quotes in the .env file');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('🔧 HINT: Make sure PostgreSQL is running on your computer.');
      console.log('   - Check that the PostgreSQL service is started');
      console.log('   - Verify the host and port settings in your .env file');
    }
    
    return false;
  }
};

export { testConnection };
export default sequelize;