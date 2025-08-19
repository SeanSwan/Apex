// backend/check-current-db-state.mjs
/**
 * APEX AI DATABASE STATE CHECKER
 * =============================
 * Checks what tables and data currently exist in the database
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 APEX AI DATABASE STATE CHECKER');
console.log('=================================\n');

async function checkDatabaseState() {
  const pool = new Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',  
    database: process.env.PG_DB || 'apex',
    password: process.env.PG_PASSWORD || '',
    port: Number(process.env.PG_PORT || 5432),
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database successfully\n');

    // 1. Check all tables
    console.log('📋 EXISTING TABLES:');
    console.log('==================');
    const tablesResult = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ NO TABLES FOUND - Database is empty!');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`📄 ${row.table_name} (${row.table_type})`);
      });
    }

    // 2. Check for specific critical tables
    console.log('\n🎯 CRITICAL TABLES CHECK:');
    console.log('========================');
    const criticalTables = [
      'users', 'Users',
      'properties', 'Properties', 
      'clients', 'Clients',
      'contact_lists',
      'standard_operating_procedures',
      'incidents', 'Incidents'
    ];

    for (const tableName of criticalTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
        console.log(`✅ ${tableName}: ${result.rows[0].count} records`);
      } catch (error) {
        try {
          const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
          console.log(`✅ ${tableName}: ${result.rows[0].count} records`);
        } catch (error2) {
          console.log(`❌ ${tableName}: Does not exist`);
        }
      }
    }

    // 3. Check for migration tracking
    console.log('\n📊 MIGRATION STATUS:');
    console.log('===================');
    try {
      const migrationsResult = await client.query('SELECT name FROM "SequelizeMeta" ORDER BY name');
      console.log(`✅ Migrations table exists with ${migrationsResult.rows.length} completed migrations:`);
      migrationsResult.rows.forEach(row => {
        console.log(`   - ${row.name}`);
      });
    } catch (error) {
      console.log('❌ SequelizeMeta table does not exist - No migrations have been run');
    }

    // 4. Check user roles if users table exists
    console.log('\n👥 USER ROLES CHECK:');
    console.log('===================');
    try {
      const rolesResult = await client.query(`
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role 
        ORDER BY count DESC
      `);
      console.log('✅ User roles found:');
      rolesResult.rows.forEach(row => {
        console.log(`   - ${row.role}: ${row.count} users`);
      });
    } catch (error) {
      try {
        const rolesResult = await client.query(`
          SELECT role, COUNT(*) as count 
          FROM "Users" 
          GROUP BY role 
          ORDER BY count DESC
        `);
        console.log('✅ User roles found:');
        rolesResult.rows.forEach(row => {
          console.log(`   - ${row.role}: ${row.count} users`);
        });
      } catch (error2) {
        console.log('❌ No users table found or accessible');
      }
    }

    client.release();
    await pool.end();

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('   - Ensure PostgreSQL is running');
    console.log('   - Check your .env file database credentials');  
    console.log('   - Verify database "apex" exists');
  }
}

checkDatabaseState();
