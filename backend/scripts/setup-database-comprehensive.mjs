#!/usr/bin/env node
/**
 * APEX AI SECURITY PLATFORM - COMPREHENSIVE DATABASE SETUP
 * ========================================================
 * Run this script to fix all database permission and connectivity issues
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🛡️ APEX AI - COMPREHENSIVE DATABASE SETUP');
console.log('==========================================\n');

const scriptPath = path.join(process.cwd(), 'scripts', 'fix-database-complete.sql');

// Check if the SQL script exists
if (!fs.existsSync(scriptPath)) {
  console.error('❌ SQL script not found at:', scriptPath);
  console.log('💡 Make sure you are running this from the backend directory');
  process.exit(1);
}

console.log('📋 This script will:');
console.log('   1. Drop and recreate the "apex" database');
console.log('   2. Grant comprehensive privileges to swanadmin user');
console.log('   3. Create all required tables with proper ownership');
console.log('   4. Insert sample data for testing');
console.log('   5. Verify the setup\n');

console.log('⚠️  WARNING: This will DROP the existing apex database if it exists!');
console.log('📝 Make sure PostgreSQL is running and postgres user is accessible\n');

try {
  console.log('🔧 Running database setup script...');
  
  // Execute the SQL script as postgres user
  const result = execSync(`psql -U postgres -f "${scriptPath}"`, {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ Database setup completed successfully!');
  console.log('\n📊 Setup Results:');
  console.log(result);
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Start your backend server: npm run dev');
  console.log('   2. Check that "Users table exists" message appears');
  console.log('   3. Test the application functionality\n');
  
  console.log('💡 If you see any permission errors, ensure:');
  console.log('   - PostgreSQL is running');
  console.log('   - postgres user has superuser privileges');
  console.log('   - No other connections are blocking the database drop');
  
} catch (error) {
  console.error('❌ Database setup failed:');
  console.error(error.message);
  
  if (error.message.includes('authentication failed')) {
    console.log('\n💡 Authentication Issue Solutions:');
    console.log('   1. Make sure PostgreSQL is running: net start postgresql-x64-14');
    console.log('   2. Verify postgres user password or update pg_hba.conf for trust authentication');
    console.log('   3. Try: psql -U postgres -c "\\l" to test connection');
  }
  
  if (error.message.includes('could not connect')) {
    console.log('\n💡 Connection Issue Solutions:');
    console.log('   1. Start PostgreSQL service: net start postgresql-x64-14');
    console.log('   2. Check if PostgreSQL is listening on port 5432');
    console.log('   3. Verify pg_hba.conf allows local connections');
  }
  
  console.log('\n🔧 Manual Setup Option:');
  console.log(`   Run this command directly: psql -U postgres -f "${scriptPath}"`);
  
  process.exit(1);
}
