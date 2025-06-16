#!/usr/bin/env node

/**
 * APEX AI PLATFORM - CREATE TABLES AS POSTGRES
 * ============================================
 * Creates tables directly as postgres user to bypass permission issues
 */

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');

async function createTablesAsPostgres() {
  const client = new Client({
    user: 'postgres',  // Use postgres user
    host: process.env.PG_HOST,
    database: 'apex',  // Connect to apex database
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT),
  });

  try {
    await client.connect();
    logInfo('Connected to apex database as postgres user');

    // Create tables
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

    // Grant permissions on tables to swanadmin
    logInfo('Granting permissions to swanadmin...');
    for (const table of tables) {
      await client.query(`GRANT ALL PRIVILEGES ON ${table.name} TO swanadmin`);
    }
    logSuccess('Permissions granted to swanadmin');

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
    if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
      logInfo('Tables/data already exist, skipping...');
    } else {
      logError(`Setup failed: ${error.message}`);
      throw error;
    }
  } finally {
    await client.end();
  }
}

async function main() {
  log('\n🚀 APEX AI PLATFORM - POSTGRES TABLE CREATION', 'cyan');
  log('==============================================', 'cyan');

  try {
    await createTablesAsPostgres();
    
    log('\n🎉 Database setup completed successfully!', 'green');
    log('✅ You can now start the server with: npm run dev', 'green');
    
  } catch (error) {
    logError(`\nSetup failed: ${error.message}`);
    log('💡 Try the manual SQL approach if this fails', 'blue');
  }
}

main();