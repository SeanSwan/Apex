/**
 * DATABASE SETUP VERIFICATION & EXECUTION SCRIPT
 * ==============================================
 * Checks for existing face recognition tables and creates them if needed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database configuration from environment or defaults
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'apex_defense',
  user: process.env.DB_USER || 'swanadmin',
  password: process.env.DB_PASSWORD || ''
};

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const icons = {
    'INFO': '🔵',
    'SUCCESS': '✅',
    'ERROR': '❌',
    'WARNING': '⚠️',
    'PROGRESS': '🔄',
    'DATABASE': '🗄️'
  };
  
  console.log(`[${timestamp}] ${icons[type] || icons.INFO} ${message}`);
}

async function checkDatabaseConnection() {
  log('Checking database connection...', 'DATABASE');
  
  try {
    // Try to import and use pg
    const pkg = await import('pg');
    const { Pool } = pkg.default || pkg;
    
    const pool = new Pool(dbConfig);
    
    // Test connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    
    log(`✅ Database connected successfully at ${result.rows[0].current_time}`, 'SUCCESS');
    
    client.release();
    await pool.end();
    
    return true;
    
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'ERROR');
    
    if (error.code === 'MODULE_NOT_FOUND') {
      log('Install pg package: npm install pg', 'WARNING');
    } else if (error.code === 'ECONNREFUSED') {
      log('PostgreSQL server is not running or not accessible', 'WARNING');
    } else if (error.code === '28P01') {
      log('Invalid database credentials', 'WARNING');
    }
    
    return false;
  }
}

async function checkFaceRecognitionTables() {
  log('Checking for Face Recognition tables...', 'DATABASE');
  
  try {
    const pkg = await import('pg');
    const { Pool } = pkg.default || pkg;
    
    const pool = new Pool(dbConfig);
    const client = await pool.connect();
    
    // Check if face_profiles table exists
    const profilesResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'face_profiles'
      );
    `);
    
    // Check if face_detections table exists
    const detectionsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'face_detections'
      );
    `);
    
    const profilesExist = profilesResult.rows[0].exists;
    const detectionsExist = detectionsResult.rows[0].exists;
    
    log(`Face Profiles Table: ${profilesExist ? '✅ EXISTS' : '❌ MISSING'}`, profilesExist ? 'SUCCESS' : 'WARNING');
    log(`Face Detections Table: ${detectionsExist ? '✅ EXISTS' : '❌ MISSING'}`, detectionsExist ? 'SUCCESS' : 'WARNING');
    
    client.release();
    await pool.end();
    
    return { profilesExist, detectionsExist, bothExist: profilesExist && detectionsExist };
    
  } catch (error) {
    log(`❌ Failed to check tables: ${error.message}`, 'ERROR');
    return { profilesExist: false, detectionsExist: false, bothExist: false };
  }
}

async function executeFaceRecognitionSchema() {
  log('Executing Face Recognition database schema...', 'DATABASE');
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'backend', 'database', 'face_recognition_schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      log(`❌ Schema file not found: ${schemaPath}`, 'ERROR');
      return false;
    }
    
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    log(`✅ Schema file loaded: ${Math.round(schemaSql.length / 1024)}KB`, 'SUCCESS');
    
    // Execute schema
    const pkg = await import('pg');
    const { Pool } = pkg.default || pkg;
    
    const pool = new Pool(dbConfig);
    const client = await pool.connect();
    
    // Execute the schema in a transaction
    await client.query('BEGIN');
    
    try {
      await client.query(schemaSql);
      await client.query('COMMIT');
      
      log('✅ Face Recognition schema executed successfully!', 'SUCCESS');
      
      // Verify tables were created
      const verification = await checkFaceRecognitionTables();
      
      if (verification.bothExist) {
        log('✅ Both Face Recognition tables verified and ready!', 'SUCCESS');
      } else {
        log('⚠️ Schema executed but table verification failed', 'WARNING');
      }
      
    } catch (schemaError) {
      await client.query('ROLLBACK');
      throw schemaError;
    }
    
    client.release();
    await pool.end();
    
    return true;
    
  } catch (error) {
    log(`❌ Schema execution failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function runDatabaseSetup() {
  console.log('🗄️ APEX AI FACE RECOGNITION - DATABASE SETUP VERIFICATION');
  console.log('='.repeat(80));
  console.log();
  
  try {
    // Step 1: Check database connection
    const connectionOk = await checkDatabaseConnection();
    
    if (!connectionOk) {
      console.log('\n❌ SETUP FAILED: Cannot connect to database');
      console.log('Fix database connection first, then re-run this script.');
      return false;
    }
    
    // Step 2: Check if tables exist
    const tableCheck = await checkFaceRecognitionTables();
    
    if (tableCheck.bothExist) {
      console.log('\n✅ SETUP COMPLETE: Face Recognition tables already exist!');
      console.log('Database is ready for Face Recognition system.');
      return true;
    }
    
    // Step 3: Execute schema if tables don't exist
    console.log('\n🔧 Creating Face Recognition tables...');
    const schemaOk = await executeFaceRecognitionSchema();
    
    if (schemaOk) {
      console.log('\n✅ SETUP COMPLETE: Face Recognition database ready!');
      return true;
    } else {
      console.log('\n❌ SETUP FAILED: Could not create Face Recognition tables');
      return false;
    }
    
  } catch (error) {
    log(`❌ CRITICAL ERROR: ${error.message}`, 'ERROR');
    return false;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDatabaseSetup()
    .then(success => {
      if (success) {
        console.log('\n🎉 Face Recognition database setup completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Face Recognition database setup failed.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

export default runDatabaseSetup;
