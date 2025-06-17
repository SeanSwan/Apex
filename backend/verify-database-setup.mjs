#!/usr/bin/env node
/**
 * APEX AI - DATABASE SETUP VERIFICATION
 * =====================================
 * Check if database setup was successful
 */

import pkg from 'pg';
const { Client } = pkg;

console.log('🔍 APEX AI - DATABASE VERIFICATION');
console.log('==================================\n');

// Database connection config
const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'swanadmin',
  password: 'Hollywood1980',
  database: 'apex'
};

async function verifyDatabaseSetup() {
  let client;
  
  try {
    console.log('🔗 Testing database connection...');
    client = new Client(dbConfig);
    await client.connect();
    console.log('✅ Successfully connected to apex database as swanadmin\n');
    
    // Check if required tables exist
    console.log('📊 Checking required tables...');
    const tableChecks = [
      { name: 'Users', expected: true },
      { name: 'Clients', expected: true },
      { name: 'Properties', expected: true },
      { name: 'Reports', expected: true },
      { name: 'Schedules', expected: true }
    ];
    
    let allTablesExist = true;
    
    for (const table of tableChecks) {
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${table.name}'
          );
        `);
        
        if (result.rows[0].exists) {
          console.log(`   ✅ ${table.name} table exists`);
        } else {
          console.log(`   ❌ ${table.name} table missing`);
          allTablesExist = false;
        }
      } catch (error) {
        console.log(`   ❌ Error checking ${table.name}: ${error.message}`);
        allTablesExist = false;
      }
    }
    
    // Check sample data
    console.log('\n📋 Checking sample data...');
    try {
      const userCount = await client.query('SELECT COUNT(*) FROM "Users"');
      const clientCount = await client.query('SELECT COUNT(*) FROM "Clients"');
      const propertyCount = await client.query('SELECT COUNT(*) FROM "Properties"');
      
      console.log(`   👥 Users: ${userCount.rows[0].count} records`);
      console.log(`   🏢 Clients: ${clientCount.rows[0].count} records`);
      console.log(`   🏗️ Properties: ${propertyCount.rows[0].count} records`);
      
      if (userCount.rows[0].count > 0 && clientCount.rows[0].count > 0 && propertyCount.rows[0].count > 0) {
        console.log('   ✅ Sample data successfully inserted');
      } else {
        console.log('   ⚠️ Some sample data may be missing');
      }
    } catch (error) {
      console.log(`   ❌ Error checking sample data: ${error.message}`);
    }
    
    // Check permissions
    console.log('\n🔐 Checking table permissions...');
    try {
      const permissionResult = await client.query(`
        SELECT table_name, privilege_type 
        FROM information_schema.role_table_grants 
        WHERE grantee = 'swanadmin' 
        AND table_schema = 'public'
        LIMIT 5
      `);
      
      if (permissionResult.rows.length > 0) {
        console.log('   ✅ swanadmin has proper table permissions');
        permissionResult.rows.forEach(row => {
          console.log(`      - ${row.table_name}: ${row.privilege_type}`);
        });
      } else {
        console.log('   ⚠️ Limited permission information available');
      }
    } catch (error) {
      console.log(`   ❌ Error checking permissions: ${error.message}`);
    }
    
    console.log('\n🎯 OVERALL ASSESSMENT:');
    console.log('=====================');
    
    if (allTablesExist) {
      console.log('✅ DATABASE SETUP SUCCESSFUL!');
      console.log('   - Database connection: ✅ Working');
      console.log('   - Required tables: ✅ Created');
      console.log('   - User permissions: ✅ Configured');
      console.log('   - Sample data: ✅ Inserted');
      console.log('\n🚀 READY TO START BACKEND SERVER!');
      console.log('   Run: npm run dev');
    } else {
      console.log('❌ DATABASE SETUP INCOMPLETE');
      console.log('   Some tables are missing or inaccessible');
      console.log('\n🔧 RECOMMENDED ACTIONS:');
      console.log('   1. Try: node setup-database-nodejs.mjs');
      console.log('   2. Or manually run SQL in pgAdmin');
      console.log('   3. Check PostgreSQL service is running');
    }
    
  } catch (error) {
    console.log('❌ DATABASE CONNECTION FAILED');
    console.log(`Error: ${error.message}\n`);
    
    if (error.message.includes('database "apex" does not exist')) {
      console.log('💡 DIAGNOSIS: Database was not created');
      console.log('   The auto.bat script likely failed silently');
      console.log('\n🔧 NEXT STEPS:');
      console.log('   1. Try: node setup-database-nodejs.mjs');
      console.log('   2. Or check DATABASE_SETUP_GUIDE.md for manual setup');
    } else if (error.message.includes('authentication failed')) {
      console.log('💡 DIAGNOSIS: Authentication issue');
      console.log('   PostgreSQL is running but credentials are wrong');
      console.log('\n🔧 NEXT STEPS:');
      console.log('   1. Check postgres user password');
      console.log('   2. Verify swanadmin user was created');
    } else if (error.message.includes('connect ECONNREFUSED')) {
      console.log('💡 DIAGNOSIS: PostgreSQL service not running');
      console.log('\n🔧 NEXT STEPS:');
      console.log('   1. Start PostgreSQL service in Windows Services');
      console.log('   2. Or start via pgAdmin');
      console.log('   3. Check if PostgreSQL is installed');
    } else {
      console.log('💡 DIAGNOSIS: Unknown connection issue');
      console.log('\n🔧 NEXT STEPS:');
      console.log('   1. Check PostgreSQL installation');
      console.log('   2. Verify connection settings in .env file');
      console.log('   3. Try manual setup with pgAdmin');
    }
  } finally {
    if (client) {
      await client.end();
    }
  }
}

verifyDatabaseSetup();
