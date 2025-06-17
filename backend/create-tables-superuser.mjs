#!/usr/bin/env node
/**
 * APEX AI - CREATE TABLES AS POSTGRES SUPERUSER
 * =============================================
 * Uses postgres user to create tables, then grants ownership to swanadmin
 */

import pkg from 'pg';
const { Client } = pkg;

console.log('🛡️ APEX AI - SUPERUSER TABLE CREATION');
console.log('=====================================\n');

const postgresConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '',  // Will prompt for password
  database: 'apex'
};

const swanadminConfig = {
  host: 'localhost',
  port: 5432,
  user: 'swanadmin',
  password: 'Hollywood1980',
  database: 'apex'
};

async function createTablesAsSuperuser() {
  let postgresClient;
  let swanadminClient;
  
  try {
    console.log('🔑 Connecting as postgres superuser...');
    console.log('💡 You may be prompted for the postgres user password...\n');
    
    postgresClient = new Client(postgresConfig);
    await postgresClient.connect();
    console.log('✅ Connected as postgres superuser\n');

    // First, ensure swanadmin has proper permissions
    console.log('🔐 Granting CREATE privileges to swanadmin...');
    await postgresClient.query('GRANT CREATE ON SCHEMA public TO swanadmin');
    await postgresClient.query('GRANT ALL PRIVILEGES ON SCHEMA public TO swanadmin');
    console.log('   ✅ Permissions granted\n');

    // Create Users table
    console.log('📊 Creating Users table...');
    await postgresClient.query(`
      CREATE TABLE IF NOT EXISTS "Users" (
        id SERIAL PRIMARY KEY,
        "firstName" VARCHAR(255) NOT NULL,
        "lastName" VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'guard',
        "phoneNumber" VARCHAR(20),
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await postgresClient.query('ALTER TABLE "Users" OWNER TO swanadmin');
    console.log('   ✅ Users table created and ownership granted');

    // Create Clients table
    console.log('📊 Creating Clients table...');
    await postgresClient.query(`
      CREATE TABLE IF NOT EXISTS "Clients" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        "phoneNumber" VARCHAR(20),
        address TEXT,
        "contractStart" DATE,
        "contractEnd" DATE,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await postgresClient.query('ALTER TABLE "Clients" OWNER TO swanadmin');
    console.log('   ✅ Clients table created and ownership granted');

    // Create Properties table
    console.log('📊 Creating Properties table...');
    await postgresClient.query(`
      CREATE TABLE IF NOT EXISTS "Properties" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        "clientId" INTEGER REFERENCES "Clients"(id) ON DELETE CASCADE,
        "propertyType" VARCHAR(100),
        "accessCodes" TEXT,
        "specialInstructions" TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await postgresClient.query('ALTER TABLE "Properties" OWNER TO swanadmin');
    console.log('   ✅ Properties table created and ownership granted');

    // Create Reports table
    console.log('📊 Creating Reports table...');
    await postgresClient.query(`
      CREATE TABLE IF NOT EXISTS "Reports" (
        id SERIAL PRIMARY KEY,
        "guardId" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
        "clientId" INTEGER REFERENCES "Clients"(id) ON DELETE CASCADE,
        "propertyId" INTEGER REFERENCES "Properties"(id) ON DELETE CASCADE,
        "shiftDate" DATE NOT NULL,
        "startTime" TIME,
        "endTime" TIME,
        title VARCHAR(255),
        description TEXT,
        "incidentOccurred" BOOLEAN DEFAULT false,
        "incidentDescription" TEXT,
        "weatherConditions" VARCHAR(100),
        status VARCHAR(50) DEFAULT 'draft',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await postgresClient.query('ALTER TABLE "Reports" OWNER TO swanadmin');
    console.log('   ✅ Reports table created and ownership granted');

    // Create Schedules table
    console.log('📊 Creating Schedules table...');
    await postgresClient.query(`
      CREATE TABLE IF NOT EXISTS "Schedules" (
        id SERIAL PRIMARY KEY,
        "guardId" INTEGER REFERENCES "Users"(id) ON DELETE CASCADE,
        "propertyId" INTEGER REFERENCES "Properties"(id) ON DELETE CASCADE,
        "shiftDate" DATE NOT NULL,
        "startTime" TIME NOT NULL,
        "endTime" TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await postgresClient.query('ALTER TABLE "Schedules" OWNER TO swanadmin');
    console.log('   ✅ Schedules table created and ownership granted');

    // Grant all privileges on sequences to swanadmin
    console.log('\n🔐 Granting sequence privileges...');
    await postgresClient.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO swanadmin');
    await postgresClient.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO swanadmin');
    console.log('   ✅ All privileges granted');

    // Close postgres connection
    await postgresClient.end();
    postgresClient = null;

    // Now connect as swanadmin to insert sample data
    console.log('\n📝 Connecting as swanadmin to insert sample data...');
    swanadminClient = new Client(swanadminConfig);
    await swanadminClient.connect();
    console.log('✅ Connected as swanadmin\n');

    // Insert Users
    console.log('👥 Adding sample users...');
    await swanadminClient.query(`
      INSERT INTO "Users" ("firstName", "lastName", email, password, role, "phoneNumber") VALUES
      ('John', 'Guard', 'guard@example.com', '$2b$10$hash', 'guard', '555-0101'),
      ('Jane', 'Admin', 'admin@example.com', '$2b$10$hash', 'admin', '555-0102'),
      ('Mike', 'Supervisor', 'supervisor@example.com', '$2b$10$hash', 'supervisor', '555-0103')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('   ✅ Sample users added');

    // Insert Clients
    console.log('🏢 Adding sample clients...');
    await swanadminClient.query(`
      INSERT INTO "Clients" (name, email, "phoneNumber", address, "contractStart", "contractEnd") VALUES
      ('ACME Corporation', 'contact@acme.com', '555-0201', '123 Business St, City, State', '2025-01-01', '2025-12-31'),
      ('SecureBuildings Inc', 'info@securebuildings.com', '555-0202', '456 Office Ave, City, State', '2025-01-01', '2025-12-31')
      ON CONFLICT DO NOTHING
    `);
    console.log('   ✅ Sample clients added');

    // Insert Properties
    console.log('🏗️ Adding sample properties...');
    await swanadminClient.query(`
      INSERT INTO "Properties" (name, address, "clientId", "propertyType", "specialInstructions") VALUES
      ('ACME Headquarters', '123 Business St, City, State', 1, 'Office Building', 'Check all entry points hourly'),
      ('ACME Warehouse', '789 Industrial Rd, City, State', 1, 'Warehouse', 'Monitor loading dock area'),
      ('Secure Office Complex', '456 Office Ave, City, State', 2, 'Office Building', 'Patrol parking garage every 2 hours')
      ON CONFLICT DO NOTHING
    `);
    console.log('   ✅ Sample properties added');

    console.log('\n🧪 Final verification...');
    
    // Verify all tables and data
    const tables = ['Users', 'Clients', 'Properties', 'Reports', 'Schedules'];
    let allSuccess = true;
    
    for (const tableName of tables) {
      try {
        const result = await swanadminClient.query(`SELECT COUNT(*) FROM "${tableName}"`);
        const count = result.rows[0].count;
        console.log(`   ✅ ${tableName}: ${count} records`);
      } catch (error) {
        console.log(`   ❌ ${tableName}: ERROR - ${error.message}`);
        allSuccess = false;
      }
    }

    console.log('\n🎯 FINAL RESULT:');
    console.log('================');
    
    if (allSuccess) {
      console.log('🎉 SUCCESS! ALL TABLES CREATED WITH PROPER PERMISSIONS!');
      console.log('✅ Tables created by postgres superuser');
      console.log('✅ Ownership transferred to swanadmin');
      console.log('✅ Sample data inserted by swanadmin');
      console.log('✅ All permissions properly configured');
      console.log('\n🚀 APEX AI PLATFORM IS NOW READY!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Backend: npm run dev');
      console.log('   2. Frontend: cd ../frontend && npm run dev');
      console.log('   3. Browser: http://localhost:5173');
      console.log('\n💫 Your security platform is ready for development!');
    } else {
      console.log('❌ Some issues encountered during setup');
      console.log('💡 Try manual verification: node verify-database-setup.mjs');
    }
    
  } catch (error) {
    console.error('\n❌ SUPERUSER TABLE CREATION FAILED:');
    console.error(`Error: ${error.message}`);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 DIAGNOSIS: PostgreSQL authentication issue');
      console.log('🔧 SOLUTIONS:');
      console.log('   1. Check postgres user password');
      console.log('   2. Update pg_hba.conf for local trust authentication');
      console.log('   3. Use pgAdmin GUI with manual table creation');
      console.log('   4. See PGADMIN_MANUAL_SETUP.md for step-by-step guide');
    } else if (error.message.includes('connect ECONNREFUSED')) {
      console.log('\n💡 DIAGNOSIS: PostgreSQL service not running');
      console.log('🔧 SOLUTIONS:');
      console.log('   1. Start PostgreSQL service in Windows Services');
      console.log('   2. Launch pgAdmin and start the server');
    } else {
      console.log('\n💡 DIAGNOSIS: Unknown error');
      console.log('🔧 FALLBACK SOLUTION:');
      console.log('   Use pgAdmin manual setup - see PGADMIN_MANUAL_SETUP.md');
    }
  } finally {
    if (postgresClient) {
      await postgresClient.end();
    }
    if (swanadminClient) {
      await swanadminClient.end();
    }
  }
}

createTablesAsSuperuser();
