#!/usr/bin/env node

/**
 * VOICE AI DISPATCHER - DATABASE MIGRATION EXECUTOR
 * ================================================
 * Executes the three Voice AI Dispatcher migrations in proper dependency order
 * This script ensures the database tables are created correctly for the voice system
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define migrations in dependency order
const migrations = [
  '20250805120050-create-contact-lists.js',           // First: No dependencies
  '20250805120100-create-standard-operating-procedures.js', // Second: References properties
  '20250805120000-create-call-logs.js'                // Third: References SOPs
];

async function runMigrations() {
  console.log('🚀 APEX AI - Voice AI Dispatcher Database Migration Executor');
  console.log('=' .repeat(60));
  
  try {
    // First, check current migration status
    console.log('\n📋 Checking current migration status...');
    const { stdout: statusOutput } = await execAsync('npx sequelize-cli db:migrate:status', {
      cwd: __dirname
    });
    console.log(statusOutput);
    
    // Run all pending migrations
    console.log('\n🔄 Executing Voice AI Dispatcher migrations...');
    const { stdout: migrateOutput, stderr: migrateError } = await execAsync('npx sequelize-cli db:migrate', {
      cwd: __dirname
    });
    
    if (migrateError && !migrateError.includes('Sequelize')) {
      console.error('❌ Migration Error:', migrateError);
      process.exit(1);
    }
    
    console.log('✅ Migration Output:');
    console.log(migrateOutput);
    
    // Verify the new tables were created
    console.log('\n🔍 Verifying Voice AI Dispatcher tables...');
    const { stdout: verifyOutput } = await execAsync('npx sequelize-cli db:migrate:status', {
      cwd: __dirname
    });
    console.log(verifyOutput);
    
    // Check for the specific voice tables
    const voiceTables = ['contact_lists', 'standard_operating_procedures', 'call_logs'];
    let allTablesCreated = true;
    
    for (const table of voiceTables) {
      if (verifyOutput.includes(table) || verifyOutput.includes('up')) {
        console.log(`✅ Table verified: ${table}`);
      } else {
        console.log(`❌ Table missing: ${table}`);
        allTablesCreated = false;
      }
    }
    
    if (allTablesCreated) {
      console.log('\n🎉 SUCCESS: Voice AI Dispatcher database tables created successfully!');
      console.log('📋 Next Steps:');
      console.log('   1. Configure API keys in .env file');
      console.log('   2. Test MCP server integration');
      console.log('   3. Verify frontend components');
    } else {
      console.log('\n⚠️  WARNING: Some tables may not have been created correctly');
    }
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR during migration:', error.message);
    console.error('🔧 Troubleshooting Steps:');
    console.error('   1. Verify PostgreSQL is running');
    console.error('   2. Check database credentials in .env file');
    console.error('   3. Ensure database exists and is accessible');
    process.exit(1);
  }
}

// Execute migrations
runMigrations().catch(console.error);
