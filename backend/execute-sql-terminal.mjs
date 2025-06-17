#!/usr/bin/env node
/**
 * APEX AI - TERMINAL-BASED SQL EXECUTION
 * ======================================
 * Finds psql and executes the SQL script via terminal
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

console.log('🛡️ APEX AI - TERMINAL SQL EXECUTION');
console.log('===================================\n');

const commonPsqlPaths = [
  'C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\14\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\13\\bin\\psql.exe',
  'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\15\\bin\\psql.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\14\\bin\\psql.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\13\\bin\\psql.exe',
  'C:\\Program Files (x86)\\PostgreSQL\\16\\bin\\psql.exe'
];

async function findAndExecuteSQL() {
  console.log('🔍 Finding PostgreSQL installation...\n');
  
  let psqlCommand = null;
  
  // First try if psql is in PATH
  try {
    await execAsync('psql --version');
    console.log('✅ Found psql in PATH');
    psqlCommand = 'psql';
  } catch (error) {
    console.log('❌ psql not in PATH, checking installation directories...\n');
    
    // Check common installation paths
    for (const psqlPath of commonPsqlPaths) {
      if (fs.existsSync(psqlPath)) {
        console.log(`✅ Found PostgreSQL at: ${psqlPath}`);
        psqlCommand = `"${psqlPath}"`;
        break;
      }
    }
  }
  
  if (!psqlCommand) {
    console.log('❌ PostgreSQL installation not found!');
    console.log('\n🔧 MANUAL ALTERNATIVES:');
    console.log('1. Install PostgreSQL: https://www.postgresql.org/download/windows/');
    console.log('2. Add PostgreSQL to PATH environment variable');
    console.log('3. Use the Node.js direct execution method below');
    return false;
  }
  
  // Check if SQL file exists
  const sqlFile = 'COMPLETE_SETUP.sql';
  if (!fs.existsSync(sqlFile)) {
    console.log(`❌ SQL file not found: ${sqlFile}`);
    console.log('💡 Run this first: node generate-pgadmin-script.mjs');
    return false;
  }
  
  console.log('\n🔧 Executing SQL script via terminal...');
  console.log(`Command: ${psqlCommand} -U postgres -d apex -f ${sqlFile}`);
  console.log('\n💡 You may be prompted for postgres password...\n');
  
  try {
    const { stdout, stderr } = await execAsync(`${psqlCommand} -U postgres -d apex -f ${sqlFile}`);
    
    if (stdout) {
      console.log('📊 SQL Execution Results:');
      console.log(stdout);
      
      if (stdout.includes('Setup completed successfully!')) {
        console.log('\n🎉 SUCCESS! Tables created via terminal!');
        return true;
      }
    }
    
    if (stderr && !stderr.includes('NOTICE:')) {
      console.log('⚠️ Warnings/Errors:');
      console.log(stderr);
    }
    
  } catch (error) {
    console.error('\n❌ SQL execution failed:');
    console.error(error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication Solutions:');
      console.log('1. Check postgres user password');
      console.log('2. Try with empty password');
      console.log('3. Use alternative method below');
    }
    
    return false;
  }
  
  return false;
}

// Run the main function
findAndExecuteSQL().then(success => {
  if (success) {
    console.log('\n🧪 Verifying database setup...');
    // Import and run verification
    import('./verify-database-setup.mjs');
  } else {
    console.log('\n🔧 ALTERNATIVE: Direct Node.js execution...');
    console.log('Try: node execute-sql-nodejs.mjs');
  }
});
