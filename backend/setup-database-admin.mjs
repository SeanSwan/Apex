#!/usr/bin/env node

/**
 * APEX AI PLATFORM - DATABASE SETUP (ADMIN VERSION)
 * =================================================
 * Creates the database using postgres superuser, then sets up tables
 */

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');

// Option 1: Create database as postgres superuser
async function createDatabaseAsPostgres() {
  const client = new Client({
    user: 'postgres',  // Use postgres superuser
    host: process.env.PG_HOST,
    password: process.env.PG_PASSWORD, // Assuming same password
    port: Number(process.env.PG_PORT),
    database: 'postgres'
  });

  try {
    await client.connect();
    logInfo('Connected to PostgreSQL as postgres user');

    // Check if database exists
    const dbCheckResult = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [process.env.PG_DB]
    );

    if (dbCheckResult.rows.length === 0) {
      logInfo(`Creating database: ${process.env.PG_DB}`);
      await client.query(`CREATE DATABASE "${process.env.PG_DB}"`);
      logSuccess(`Database "${process.env.PG_DB}" created successfully!`);
      
      // Grant privileges to swanadmin
      await client.query(`GRANT ALL PRIVILEGES ON DATABASE "${process.env.PG_DB}" TO ${process.env.PG_USER}`);
      logSuccess(`Granted all privileges to ${process.env.PG_USER}`);
    } else {
      logInfo(`Database "${process.env.PG_DB}" already exists`);
    }

  } catch (error) {
    logError(`Database creation failed: ${error.message}`);
    throw error;
  } finally {
    await client.end();
  }
}

// Option 2: Grant CREATEDB privilege to swanadmin
async function grantCreateDBPrivilege() {
  const client = new Client({
    user: 'postgres',
    host: process.env.PG_HOST,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT),
    database: 'postgres'
  });

  try {
    await client.connect();
    logInfo('Granting CREATEDB privilege to swanadmin...');
    
    await client.query(`ALTER USER ${process.env.PG_USER} CREATEDB`);
    logSuccess(`CREATEDB privilege granted to ${process.env.PG_USER}`);

  } catch (error) {
    logError(`Failed to grant privileges: ${error.message}`);
    throw error;
  } finally {
    await client.end();
  }
}

async function createBasicTables() {
  const client = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT),
  });

  try {
    await client.connect();
    logInfo('Connected to target database');

    // Essential tables for the AI system
    const tables = [
      {
        name: 'cameras',
        sql: `
          CREATE TABLE IF NOT EXISTS cameras (
            camera_id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            location TEXT NOT NULL,
            rtsp_url VARCHAR(500),
            control_url VARCHAR(500),
            status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error', 'maintenance')),
            capabilities JSONB,
            ai_enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'guards',
        sql: `
          CREATE TABLE IF NOT EXISTS guards (
            guard_id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            phone_number VARCHAR(20),
            email VARCHAR(200),
            status VARCHAR(20) DEFAULT 'off_duty' CHECK (status IN ('on_duty', 'off_duty', 'break', 'responding', 'available')),
            assigned_zone VARCHAR(100),
            last_known_latitude DECIMAL(10, 8),
            last_known_longitude DECIMAL(11, 8),
            active_alerts INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'ai_alerts_log',
        sql: `
          CREATE TABLE IF NOT EXISTS ai_alerts_log (
            alert_id VARCHAR(50) PRIMARY KEY,
            timestamp TIMESTAMP DEFAULT NOW(),
            camera_id VARCHAR(50),
            alert_type VARCHAR(100) NOT NULL,
            priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
            description TEXT NOT NULL,
            detection_details JSONB NOT NULL,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'dispatched', 'resolved')),
            acknowledged_by VARCHAR(50),
            acknowledged_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'security_events',
        sql: `
          CREATE TABLE IF NOT EXISTS security_events (
            event_id VARCHAR(50) PRIMARY KEY,
            event_type VARCHAR(100) NOT NULL,
            event_data JSONB NOT NULL,
            timestamp TIMESTAMP DEFAULT NOW()
          )
        `
      }
    ];

    for (const table of tables) {
      await client.query(table.sql);
      logSuccess(`Created table: ${table.name}`);
    }

    // Insert sample data
    await client.query(`
      INSERT INTO cameras (camera_id, name, location, status, capabilities) 
      VALUES 
        ('cam_entrance_1', 'Main Entrance', 'Building A - Lobby', 'online', '{"supports_ptz": true, "supports_audio_output": true}'),
        ('cam_parking_1', 'Parking Garage', 'Underground Level 1', 'online', '{"supports_ptz": false, "supports_audio_output": false}')
      ON CONFLICT (camera_id) DO NOTHING
    `);

    await client.query(`
      INSERT INTO guards (guard_id, name, status, assigned_zone, last_known_latitude, last_known_longitude) 
      VALUES 
        ('guard_001', 'Marcus Johnson', 'on_duty', 'Zone A', 33.7175, -117.8311),
        ('guard_002', 'Sarah Williams', 'on_duty', 'Zone B', 33.7173, -117.8315)
      ON CONFLICT (guard_id) DO NOTHING
    `);

    logSuccess('Sample data inserted successfully!');

  } catch (error) {
    if (error.message.includes('duplicate key')) {
      logInfo('Sample data already exists, skipping...');
    } else {
      logError(`Setup failed: ${error.message}`);
      throw error;
    }
  } finally {
    await client.end();
  }
}

async function main() {
  log('\n🚀 APEX AI PLATFORM - DATABASE SETUP (ADMIN)', 'bright');
  log('===============================================', 'cyan');

  try {
    log('\n📋 Trying different approaches...', 'yellow');
    
    // Try Option 1: Create database as postgres user
    try {
      log('\n1️⃣ Attempting to create database as postgres user...', 'blue');
      await createDatabaseAsPostgres();
    } catch (error1) {
      log('\n2️⃣ Trying to grant CREATEDB privilege...', 'blue');
      try {
        await grantCreateDBPrivilege();
        // Now try creating database as swanadmin again
        const { default: originalSetup } = await import('./setup-database.mjs');
        await originalSetup();
      } catch (error2) {
        logError('Both approaches failed. You may need to create the database manually.');
        log('\n🔧 MANUAL SOLUTION:', 'yellow');
        log('1. Open pgAdmin or psql as postgres user', 'blue');
        log('2. Run: CREATE DATABASE "apex";', 'blue');
        log('3. Run: GRANT ALL PRIVILEGES ON DATABASE "apex" TO swanadmin;', 'blue');
        log('4. Then run this script again', 'blue');
        throw error2;
      }
    }
    
    // Create tables
    log('\n3️⃣ Creating tables and sample data...', 'blue');
    await createBasicTables();

    log('\n🎉 Database setup completed successfully!', 'green');
    log('✅ You can now start the server with: npm run dev', 'green');
    
  } catch (error) {
    logError(`\nSetup failed: ${error.message}`);
    log('\n🔧 NEXT STEPS:', 'yellow');
    log('1. Try the manual database creation steps above', 'blue');
    log('2. Or contact your PostgreSQL administrator', 'blue');
    log('3. Verify postgres user password is correct', 'blue');
  }
}

main();