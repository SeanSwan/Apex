/**
 * DATABASE CONFIGURATION DIAGNOSTIC
 * =================================
 * Check PostgreSQL server status and database configuration
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load backend/.env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, 'backend', '.env') });

console.log('🔧 DATABASE CONFIGURATION DIAGNOSTIC');
console.log('='.repeat(50));

async function checkPostgreSQLServer() {
  console.log('🔍 STEP 1: Checking PostgreSQL Server Status');
  
  try {
    const pkg = await import('pg');
    const { Pool } = pkg.default || pkg;
    
    // Try to connect to default postgres database (not apex)
    const testConfig = {
      host: process.env.PG_HOST || 'localhost',
      port: process.env.PG_PORT || 5432,
      database: 'postgres', // Connect to default postgres database first
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || ''
    };
    
    console.log(`📡 Testing connection to postgres@${testConfig.host}:${testConfig.port}`);
    console.log(`👤 User: ${testConfig.user}`);
    console.log(`🔒 Password length: ${testConfig.password.length} characters`);
    
    const pool = new Pool(testConfig);
    const client = await pool.connect();
    
    console.log('✅ PostgreSQL server is running and accessible');
    
    // Check if apex database exists
    const dbCheck = await client.query(`
      SELECT datname FROM pg_database WHERE datname = 'apex';
    `);
    
    if (dbCheck.rows.length > 0) {
      console.log('✅ Database "apex" exists');
    } else {
      console.log('❌ Database "apex" does not exist');
      console.log('💡 SOLUTION: Create the database or change PG_DB in .env');
    }
    
    client.release();
    await pool.end();
    
    return true;
    
  } catch (error) {
    console.log(`❌ PostgreSQL connection failed: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 SOLUTION: Start PostgreSQL server');
      console.log('   - Windows: net start postgresql-x64-14 (or similar)');
      console.log('   - Or start via pgAdmin or Services');
    } else if (error.code === '28P01') {
      console.log('💡 SOLUTION: Fix PostgreSQL credentials');
      console.log('   - Check if postgres user password is correct');
      console.log('   - Try removing quotes from password in .env');
    } else if (error.code === '3D000') {
      console.log('💡 SOLUTION: Database configuration issue');
    }
    
    return false;
  }
}

async function checkEnvironmentConfig() {
  console.log('\\n📋 STEP 2: Environment Configuration');
  console.log('-'.repeat(30));
  
  const config = {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DB,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD
  };
  
  console.log('Current configuration:');
  Object.entries(config).forEach(([key, value]) => {
    if (key === 'password') {
      console.log(`  ${key}: ${value ? '***configured***' : 'NOT SET'}`);
    } else {
      console.log(`  ${key}: ${value || 'NOT SET'}`);
    }
  });
  
  // Check for common issues
  console.log('\\n🔍 Configuration Analysis:');
  
  if (config.password && (config.password.startsWith('"') || config.password.startsWith("'"))) {
    console.log('⚠️  Password has quotes - this might cause issues');
    console.log('💡 Try removing quotes from PG_PASSWORD in backend/.env');
  }
  
  if (!config.password) {
    console.log('❌ No password configured');
  }
  
  if (config.database !== 'apex') {
    console.log(`⚠️  Database name is "${config.database}" but expecting "apex"`);
  }
}

async function suggestSolutions() {
  console.log('\\n🛠️  SUGGESTED SOLUTIONS');
  console.log('='.repeat(50));
  
  console.log('Option 1: Fix Password (Most Likely)');
  console.log('  1. Edit backend/.env');
  console.log('  2. Change: PG_PASSWORD="Hollywood1980"');
  console.log('  3. To:     PG_PASSWORD=Hollywood1980');
  console.log('  4. Save and test again');
  
  console.log('\\nOption 2: Create apex Database');
  console.log('  1. Open pgAdmin or psql');
  console.log('  2. Connect as postgres user');
  console.log('  3. Run: CREATE DATABASE apex;');
  
  console.log('\\nOption 3: Check PostgreSQL Service');
  console.log('  1. Open Services (services.msc)');
  console.log('  2. Find PostgreSQL service');
  console.log('  3. Start if stopped');
  
  console.log('\\nOption 4: Reset postgres User Password');
  console.log('  1. Open Command Prompt as Admin');
  console.log('  2. psql -U postgres');
  console.log('  3. ALTER USER postgres PASSWORD \'Hollywood1980\';');
}

async function runDiagnostic() {
  await checkEnvironmentConfig();
  const serverOk = await checkPostgreSQLServer();
  await suggestSolutions();
  
  console.log('\\n' + '='.repeat(50));
  console.log('📊 DIAGNOSTIC COMPLETE');
  console.log('='.repeat(50));
  
  if (serverOk) {
    console.log('🟢 PostgreSQL server is accessible');
    console.log('🎯 NEXT: Create "apex" database if missing');
  } else {
    console.log('🔴 PostgreSQL connection issues detected');
    console.log('🎯 NEXT: Fix connection issues above');
  }
}

runDiagnostic().catch(console.error);
