/**
 * DATABASE STATUS DIAGNOSTIC
 * ==========================
 * Check if Face Recognition database tables were created successfully
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load backend/.env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, 'backend', '.env') });

console.log('🔍 FACE RECOGNITION DATABASE DIAGNOSTIC');
console.log('='.repeat(50));

async function checkDatabaseStatus() {
  try {
    // Try to import pg
    const pkg = await import('pg');
    const { Pool } = pkg.default || pkg;
    
    console.log('✅ PostgreSQL module available');
    
    // Database config - map PG_* variables from backend/.env to DB_* variables
    const dbConfig = {
      host: process.env.PG_HOST || 'localhost',
      port: process.env.PG_PORT || 5432,
      database: process.env.PG_DB || 'apex',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || ''
    };
    
    console.log('📄 Loaded config from backend/.env');
    console.log(`🔑 Using database: ${dbConfig.database}`);
    console.log(`👤 Using user: ${dbConfig.user}`);
    console.log(`🔒 Password configured: ${dbConfig.password ? 'YES' : 'NO'}`);
    
    console.log(`📡 Connecting to database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
    
    const pool = new Pool(dbConfig);
    const client = await pool.connect();
    
    console.log('✅ Database connection successful');
    
    // Check if face_profiles table exists
    const profileCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'face_profiles'
      );
    `);
    
    // Check if face_detections table exists
    const detectionCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'face_detections'
      );
    `);
    
    const profilesExist = profileCheck.rows[0].exists;
    const detectionsExist = detectionCheck.rows[0].exists;
    
    console.log(`\n📊 TABLE STATUS:`);
    console.log(`face_profiles: ${profilesExist ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`face_detections: ${detectionsExist ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (profilesExist && detectionsExist) {
      console.log('\n🎉 SUCCESS: Face Recognition database is ready!');
      
      // Check if there are any face profiles
      const countResult = await client.query('SELECT COUNT(*) FROM face_profiles');
      const faceCount = countResult.rows[0].count;
      
      console.log(`👤 Face profiles enrolled: ${faceCount}`);
      
      if (faceCount == 0) {
        console.log('📝 Ready to enroll your first faces!');
      }
      
    } else {
      console.log('\n⚠️ TABLES MISSING: Need to create Face Recognition tables');
      
      // Try to create tables
      console.log('\n🔧 Attempting to create tables...');
      
      const schemaPath = './backend/database/face_recognition_schema.sql';
      const fs = await import('fs');
      
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        try {
          await client.query('BEGIN');
          await client.query(schemaSql);
          await client.query('COMMIT');
          
          console.log('✅ Face Recognition tables created successfully!');
        } catch (schemaError) {
          await client.query('ROLLBACK');
          console.log(`❌ Failed to create tables: ${schemaError.message}`);
        }
      } else {
        console.log('❌ Schema file not found');
      }
    }
    
    client.release();
    await pool.end();
    
    return profilesExist && detectionsExist;
    
  } catch (error) {
    console.log(`❌ Database diagnostic failed: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 PostgreSQL server is not running');
    } else if (error.code === '28P01') {
      console.log('💡 Invalid database credentials');
    } else if (error.code === '3D000') {
      console.log('💡 Database does not exist');
    }
    
    return false;
  }
}

async function testFaceAPI() {
  console.log('\n🧪 Testing Face Recognition API...');
  
  try {
    const response = await fetch('http://localhost:5000/api/faces');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Face API working - ready to use!');
      console.log(`📊 Current faces: ${data.data?.faces?.length || 0}`);
    } else if (response.status === 404) {
      console.log('✅ Face API working - no faces enrolled yet');
    } else {
      console.log(`⚠️ Face API returned status ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Face API not accessible');
    return false;
  }
}

async function runDiagnostic() {
  const dbReady = await checkDatabaseStatus();
  const apiReady = await testFaceAPI();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));
  
  if (dbReady && apiReady) {
    console.log('🟢 SYSTEM READY FOR USE!');
    console.log('🎯 Access Face Management: http://localhost:5000/face-management');
    console.log('👤 Click "🧠 Face Recognition" in the navigation menu');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Open http://localhost:5000/face-management');
    console.log('2. Click "Enroll Face" to add your first person');
    console.log('3. Start using the face recognition system!');
  } else {
    console.log('🟡 SYSTEM NEEDS ATTENTION');
    if (!dbReady) {
      console.log('❌ Database tables need to be created');
    }
    if (!apiReady) {
      console.log('❌ API not accessible');
    }
  }
  
  console.log('\n' + '='.repeat(50));
}

runDiagnostic().catch(console.error);
