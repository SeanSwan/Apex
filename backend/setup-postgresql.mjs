#!/usr/bin/env node
/**
 * APEX AI - POSTGRESQL INSTALLATION CHECKER & DATABASE SETUP
 * ==========================================================
 * Checks PostgreSQL installation and runs database setup
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 APEX AI - PostgreSQL Installation Check');
console.log('===========================================\n');

// Common PostgreSQL paths on Windows
const commonPaths = [
  'C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\14\\bin\\psql.exe', 
  'C:\\Program Files\\PostgreSQL\\13\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\12\\bin\\psql.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\15\\bin\\psql.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\14\\bin\\psql.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\13\\bin\\psql.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\12\\bin\\psql.exe'
];

function findPostgreSQL() {
  // First try if psql is in PATH
  try {
    execSync('psql --version', { stdio: 'pipe' });
    console.log('✅ PostgreSQL found in system PATH');
    return 'psql';
  } catch (error) {
    console.log('⚠️ PostgreSQL not in system PATH, checking common locations...');
  }
  
  // Check common installation paths
  for (const psqlPath of commonPaths) {
    if (fs.existsSync(psqlPath)) {
      console.log(`✅ Found PostgreSQL at: ${psqlPath}`);
      return psqlPath;
    }
  }
  
  return null;
}

async function runDatabaseSetup(psqlPath) {
  const scriptPath = path.join(process.cwd(), 'scripts', 'fix-database-complete.sql');
  
  if (!fs.existsSync(scriptPath)) {
    console.error('❌ SQL script not found at:', scriptPath);
    return false;
  }
  
  console.log('🔧 Running database setup...');
  
  try {
    const result = execSync(`"${psqlPath}" -U postgres -f "${scriptPath}"`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ Database setup completed successfully!');
    console.log('\n📊 Setup Results:');
    console.log(result);
    return true;
    
  } catch (error) {
    console.error('❌ Database setup failed:');
    console.error(error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication Issue Solutions:');
      console.log('   1. Try running: net start postgresql-x64-14');
      console.log('   2. Check PostgreSQL service status');
      console.log('   3. Verify postgres user password');
    }
    
    return false;
  }
}

function provideSolutions() {
  console.log('\n💡 SOLUTIONS:');
  console.log('=============');
  
  console.log('\n🔧 Option 1: Install PostgreSQL');
  console.log('   Download from: https://www.postgresql.org/download/windows/');
  console.log('   Make sure to install with default settings');
  
  console.log('\n🔧 Option 2: Use PostgreSQL Service');
  console.log('   1. Check if service is running: net start postgresql-x64-14');
  console.log('   2. Or start manually from Services.msc');
  
  console.log('\n🔧 Option 3: Manual SQL Execution');
  console.log('   1. Open pgAdmin 4 (if installed)');
  console.log('   2. Connect to postgres database as postgres user');
  console.log('   3. Run the SQL script: scripts/fix-database-complete.sql');
  
  console.log('\n🔧 Option 4: Alternative Database Setup');
  console.log('   Use the Node.js database setup script instead');
  console.log('   Run: node setup-database-alternative.mjs');
}

// Main execution
async function main() {
  const psqlPath = findPostgreSQL();
  
  if (!psqlPath) {
    console.log('❌ PostgreSQL not found on this system');
    provideSolutions();
    return;
  }
  
  const success = await runDatabaseSetup(psqlPath);
  
  if (success) {
    console.log('\n🎯 Next Steps:');
    console.log('   1. Start your backend: npm run dev');
    console.log('   2. Check for "Database connection established" message');
    console.log('   3. Start your frontend: cd ../frontend && npm run dev');
  } else {
    provideSolutions();
  }
}

main().catch(console.error);
