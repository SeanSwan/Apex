#!/usr/bin/env node
/**
 * APEX AI - CREATE MISSING TABLES
 * ===============================
 * Creates the missing tables since database connection already works
 */

import pkg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pkg;

console.log('🛡️ APEX AI - CREATE MISSING TABLES');
console.log('===================================\n');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'swanadmin',
  password: 'Hollywood1980',
  database: 'apex'
};

async function createTables() {
  let client;
  
  try {
    console.log('🔗 Connecting to apex database...');
    client = new Client(dbConfig);
    await client.connect();
    console.log('✅ Connected successfully as swanadmin\n');
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'create-tables-only.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found: ${sqlPath}`);
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('📋 Executing table creation SQL...\n');
    
    // Split SQL into individual statements and execute
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('CREATE TABLE')) {
        const tableName = statement.match(/CREATE TABLE.*?"(\w+)"/)?.[1];
        console.log(`📊 Creating table: ${tableName || 'Unknown'}`);
      } else if (statement.includes('INSERT INTO')) {
        const tableName = statement.match(/INSERT INTO.*?"(\w+)"/)?.[1];
        console.log(`📝 Inserting sample data into: ${tableName || 'Unknown'}`);
      } else if (statement.includes('SELECT')) {
        const isCount = statement.includes('COUNT');
        if (isCount) {
          console.log('🧮 Running verification queries...');
        }
      }
      
      try {
        const result = await client.query(statement + ';');
        
        // Show results for verification queries
        if (statement.includes('SELECT') && result.rows) {
          result.rows.forEach(row => {
            Object.entries(row).forEach(([key, value]) => {
              console.log(`   ✅ ${key}: ${value}`);
            });
          });
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️ Already exists (skipping)`);
        } else {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }
    }
    
    console.log('\n🧪 Final verification...');
    
    // Verify tables exist
    const tableChecks = ['Users', 'Clients', 'Properties', 'Reports', 'Schedules'];
    let allCreated = true;
    
    for (const tableName of tableChecks) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
        console.log(`   ✅ ${tableName}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
        allCreated = false;
      }
    }
    
    console.log('\n🎯 FINAL RESULT:');
    console.log('================');
    
    if (allCreated) {
      console.log('✅ ALL TABLES CREATED SUCCESSFULLY!');
      console.log('✅ Sample data inserted');
      console.log('✅ Database setup is now complete');
      console.log('\n🚀 READY TO START YOUR BACKEND SERVER!');
      console.log('   Run: npm run dev');
      console.log('\n🎨 AND YOUR FRONTEND:');
      console.log('   Run: cd ../frontend && npm run dev');
    } else {
      console.log('❌ Some tables failed to create');
      console.log('💡 Try manual setup with pgAdmin');
    }
    
  } catch (error) {
    console.error('\n❌ TABLE CREATION FAILED:');
    console.error(error.message);
    
    console.log('\n🔧 ALTERNATIVE SOLUTIONS:');
    console.log('1. Use pgAdmin to run the SQL manually');
    console.log('2. Copy the SQL from scripts/create-tables-only.sql');
    console.log('3. Paste into pgAdmin Query Tool and execute');
  } finally {
    if (client) {
      await client.end();
    }
  }
}

createTables();
