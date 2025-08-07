/**
 * DATABASE SETUP VERIFICATION SCRIPT
 * ==================================
 * Checks if face recognition tables exist and creates them if needed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function log(message, type = 'INFO') {
  const icons = {
    'INFO': '🔵',
    'SUCCESS': '✅', 
    'ERROR': '❌',
    'WARNING': '⚠️',
    'PROGRESS': '🔄',
    'DATABASE': '🗄️'
  };
  console.log(`${icons[type] || icons.INFO} ${message}`);
}

// Check database setup status
function checkDatabaseSetup() {
  log('FACE RECOGNITION DATABASE SETUP VERIFICATION', 'DATABASE');
  console.log('='.repeat(60));
  
  // Check if schema file exists
  const schemaPath = path.join(__dirname, 'backend/database/face_recognition_schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    log('❌ Database schema file NOT found!', 'ERROR');
    return false;
  }
  
  log('✅ Database schema file found', 'SUCCESS');
  
  // Read schema content
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Check for required tables
  const requiredTables = [
    'face_profiles',
    'face_detections', 
    'face_recognition_analytics'
  ];
  
  const tablesFound = [];
  const tablesMissing = [];
  
  requiredTables.forEach(table => {
    if (schemaContent.includes(`CREATE TABLE ${table}`)) {
      tablesFound.push(table);
      log(`✅ Table definition found: ${table}`, 'SUCCESS');
    } else {
      tablesMissing.push(table);
      log(`❌ Table definition missing: ${table}`, 'ERROR');
    }
  });
  
  // Check for required functions
  const requiredFunctions = [
    'cleanup_old_detections',
    'update_daily_analytics'
  ];
  
  const functionsFound = [];
  const functionsMissing = [];
  
  requiredFunctions.forEach(func => {
    if (schemaContent.includes(`CREATE OR REPLACE FUNCTION ${func}`)) {
      functionsFound.push(func);
      log(`✅ Function definition found: ${func}`, 'SUCCESS');
    } else {
      functionsMissing.push(func);
      log(`❌ Function definition missing: ${func}`, 'ERROR');
    }
  });
  
  // Check environment file
  const envPath = path.join(__dirname, 'backend/.env');
  const envExists = fs.existsSync(envPath);
  
  if (envExists) {
    log('✅ Environment file (.env) found', 'SUCCESS');
  } else {
    log('⚠️ Environment file (.env) not found', 'WARNING');
  }
  
  // Generate database setup SQL script
  if (tablesFound.length === requiredTables.length) {
    generateDatabaseSetupScript(schemaContent);
  }
  
  // Summary
  console.log('\\n' + '='.repeat(60));
  log('DATABASE SETUP SUMMARY', 'DATABASE');
  console.log('='.repeat(60));
  
  console.log(`📊 Tables: ${tablesFound.length}/${requiredTables.length} defined`);
  console.log(`📊 Functions: ${functionsFound.length}/${requiredFunctions.length} defined`);
  console.log(`📊 Environment: ${envExists ? 'Configured' : 'Needs Setup'}`);
  
  const isReady = tablesFound.length === requiredTables.length && 
                 functionsFound.length === requiredFunctions.length;
  
  console.log(`\\n🎯 Database Schema Status: ${isReady ? '✅ READY' : '⚠️ NEEDS SETUP'}`);
  
  if (isReady) {
    log('✅ Database schema is complete and ready!', 'SUCCESS');
    log('📄 Setup script generated: setup_face_recognition_database.sql', 'INFO');
    log('🚀 Next: Run the setup script in your PostgreSQL database', 'INFO');
  } else {
    log('⚠️ Database schema needs attention', 'WARNING');
    log('🔧 Fix missing components before proceeding', 'WARNING');
  }
  
  return isReady;
}

// Generate ready-to-execute database setup script
function generateDatabaseSetupScript(schemaContent) {
  const setupScript = `-- APEX AI FACE RECOGNITION DATABASE SETUP SCRIPT
-- ================================================
-- Auto-generated setup script for Face Recognition system
-- Execute this script in your PostgreSQL database as a superuser

-- Check if database exists and create if needed
-- Note: This part should be run by a database administrator

\\\\echo 'Setting up Face Recognition database...'

-- Connect to your database (replace 'apex' with your database name)
-- \\\\c apex;

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean reinstall)
-- WARNING: This will delete all existing face recognition data!
-- Comment out these lines if you want to preserve existing data

-- DROP TABLE IF EXISTS face_detections CASCADE;
-- DROP TABLE IF EXISTS face_recognition_analytics CASCADE;
-- DROP TABLE IF EXISTS face_profiles CASCADE;

-- Execute the main schema
${schemaContent}

-- Verify installation
\\\\echo 'Verifying Face Recognition tables...'

SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN ('face_profiles', 'face_detections', 'face_recognition_analytics')
ORDER BY tablename;

\\\\echo 'Face Recognition database setup complete!'
\\\\echo 'Tables created: face_profiles, face_detections, face_recognition_analytics'
\\\\echo 'You can now start using the Face Recognition system.'
`;

  // Write the setup script
  const setupPath = path.join(__dirname, 'setup_face_recognition_database.sql');
  fs.writeFileSync(setupPath, setupScript);
  
  log('📄 Database setup script generated!', 'SUCCESS');
  log(`💾 Location: ${setupPath}`, 'INFO');
}

// Create database connection test script
function createConnectionTestScript() {
  const testScript = `#!/usr/bin/env node

/**
 * FACE RECOGNITION DATABASE CONNECTION TEST
 * ========================================
 * Tests database connectivity and table existence
 */

import pg from 'pg';
const { Client } = pg;

// Database configuration from environment
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'apex',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
};

async function testDatabaseConnection() {
  console.log('🗄️ Testing Face Recognition database connection...');
  console.log('='.repeat(60));
  
  if (!dbConfig.password) {
    console.log('❌ ERROR: DB_PASSWORD environment variable not set');
    console.log('💡 Set your database password in backend/.env file');
    return false;
  }
  
  const client = new Client(dbConfig);
  
  try {
    // Connect to database
    await client.connect();
    console.log('✅ Database connection successful');
    
    // Check if face recognition tables exist
    const tables = ['face_profiles', 'face_detections', 'face_recognition_analytics'];
    
    for (const table of tables) {
      try {
        const result = await client.query(\`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )
        \`, [table]);
        
        const exists = result.rows[0].exists;
        console.log(\`\${exists ? '✅' : '❌'} Table \${table}: \${exists ? 'EXISTS' : 'NOT FOUND'}\`);
        
        if (exists) {
          // Get row count
          const countResult = await client.query(\`SELECT COUNT(*) FROM \${table}\`);
          const count = countResult.rows[0].count;
          console.log(\`   📊 Rows: \${count}\`);
        }
      } catch (error) {
        console.log(\`❌ Error checking table \${table}: \${error.message}\`);
      }
    }
    
    console.log('\\n🎯 Connection test completed successfully!');
    return true;
    
  } catch (error) {
    console.log(\`❌ Database connection failed: \${error.message}\`);
    console.log('💡 Check your database configuration in backend/.env');
    return false;
  } finally {
    await client.end();
  }
}

// Execute test
testDatabaseConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
  });
`;

  const testPath = path.join(__dirname, 'test_face_recognition_database.mjs');
  fs.writeFileSync(testPath, testScript);
  
  log('📄 Database connection test script created!', 'SUCCESS');
  log(`💾 Location: ${testPath}`, 'INFO');
  log('🔧 Run with: node test_face_recognition_database.mjs', 'INFO');
}

// Main execution
function main() {
  console.log('🚀 APEX AI FACE RECOGNITION - DATABASE VERIFICATION');
  console.log('==================================================\\n');
  
  const isReady = checkDatabaseSetup();
  
  if (isReady) {
    createConnectionTestScript();
    
    console.log('\\n📋 NEXT STEPS:');
    console.log('1. Ensure PostgreSQL is running');
    console.log('2. Configure backend/.env with database credentials');
    console.log('3. Run: psql -d your_database -f setup_face_recognition_database.sql');
    console.log('4. Test connection: node test_face_recognition_database.mjs');
    console.log('5. Start backend server and test API endpoints');
  }
  
  return isReady;
}

// Execute
main();
