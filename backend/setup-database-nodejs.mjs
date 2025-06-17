#!/usr/bin/env node
/**
 * APEX AI - NODE.JS DATABASE SETUP (PSQL ALTERNATIVE)
 * ===================================================
 * This script runs the database setup without requiring psql in PATH
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

console.log('🛡️ APEX AI - NODE.JS DATABASE SETUP');
console.log('====================================\n');

const commonPaths = [
  'C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\14\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\13\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\15\\bin\\psql.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\14\\bin\\psql.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\13\\bin\\psql.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\16\\bin\\psql.exe'
];

async function findPsql() {
  console.log('🔍 Searching for PostgreSQL installation...\n');
  
  // First try if psql is in PATH
  try {
    await execAsync('psql --version');
    console.log('✅ PostgreSQL found in PATH');
    return 'psql';
  } catch (error) {
    console.log('❌ PostgreSQL not in PATH, checking common locations...\n');
  }
  
  // Check common installation paths
  for (const psqlPath of commonPaths) {
    if (fs.existsSync(psqlPath)) {
      console.log(`✅ Found PostgreSQL at: ${psqlPath}`);
      return `"${psqlPath}"`;
    }
  }
  
  return null;
}

async function runDatabaseSetup() {
  try {
    const psqlCommand = await findPsql();
    
    if (!psqlCommand) {
      console.log('❌ PostgreSQL installation not found!');
      console.log('\n💡 MANUAL SOLUTIONS:');
      console.log('1. Install PostgreSQL: https://www.postgresql.org/download/windows/');
      console.log('2. Or use pgAdmin to run the SQL script manually');
      console.log('3. Or add PostgreSQL bin folder to your PATH');
      process.exit(1);
    }
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'fix-database-complete.sql');
    
    if (!fs.existsSync(scriptPath)) {
      console.log(`❌ SQL script not found at: ${scriptPath}`);
      process.exit(1);
    }
    
    console.log('\n🔧 Running database setup...');
    console.log(`Command: ${psqlCommand} -U postgres -f "${scriptPath}"`);
    console.log('\n💡 You may be prompted for the postgres user password...\n');
    
    const { stdout, stderr } = await execAsync(`${psqlCommand} -U postgres -f "${scriptPath}"`);
    
    if (stdout) {
      console.log('📊 Setup Results:');
      console.log(stdout);
    }
    
    if (stderr && !stderr.includes('NOTICE:')) {
      console.log('⚠️ Warnings/Errors:');
      console.log(stderr);
    }
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Start your backend server: npm run dev');
    console.log('   2. Check that "Users table exists" message appears');
    console.log('   3. Test the application functionality');
    
  } catch (error) {
    console.error('\n❌ Database setup failed:');
    console.error(error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication Issue Solutions:');
      console.log('   1. Make sure PostgreSQL is running');
      console.log('   2. Check postgres user password');
      console.log('   3. Try: pg_hba.conf configuration for trust authentication');
    }
    
    if (error.message.includes('could not connect')) {
      console.log('\n💡 Connection Issue Solutions:');
      console.log('   1. Start PostgreSQL service');
      console.log('   2. Check if PostgreSQL is listening on port 5432');
      console.log('   3. Verify Windows services or use pgAdmin');
    }
    
    console.log('\n🔧 Alternative Solutions:');
    console.log('   1. Use pgAdmin to run the SQL script manually');
    console.log('   2. Copy/paste SQL content directly into pgAdmin query tool');
    console.log(`   3. SQL file location: ${path.join(process.cwd(), 'scripts', 'fix-database-complete.sql')}`);
    
    process.exit(1);
  }
}

runDatabaseSetup();
