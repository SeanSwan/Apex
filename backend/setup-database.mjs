#!/usr/bin/env node

/**
 * APEX AI PLATFORM - DATABASE SETUP SCRIPT
 * =========================================
 * Creates the database and runs initial setup
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

async function createDatabase() {
  // Connect to PostgreSQL server (not to the specific database)
  const client = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT),
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await client.connect();
    logInfo('Connected to PostgreSQL server');

    // Check if database exists
    const dbCheckResult = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [process.env.PG_DB]
    );

    if (dbCheckResult.rows.length === 0) {
      // Database doesn't exist, create it
      logInfo(`Creating database: ${process.env.PG_DB}`);
      await client.query(`CREATE DATABASE "${process.env.PG_DB}"`);
      logSuccess(`Database "${process.env.PG_DB}" created successfully!`);
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

async function createBasicTables() {
  // Connect to the target database
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

    // Create essential tables for the system to start
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
            resolution VARCHAR(20),
            frame_rate INTEGER,
            night_vision BOOLEAN DEFAULT false,
            last_maintenance TIMESTAMP,
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
            user_id INTEGER,
            name VARCHAR(200) NOT NULL,
            phone_number VARCHAR(20),
            email VARCHAR(200),
            status VARCHAR(20) DEFAULT 'off_duty' CHECK (status IN ('on_duty', 'off_duty', 'break', 'responding', 'available')),
            assigned_zone VARCHAR(100),
            experience_level VARCHAR(20) DEFAULT 'standard' CHECK (experience_level IN ('junior', 'standard', 'senior', 'supervisor')),
            skills JSONB,
            last_known_latitude DECIMAL(10, 8),
            last_known_longitude DECIMAL(11, 8),
            last_location_update TIMESTAMP,
            last_check_in TIMESTAMP,
            active_alerts INTEGER DEFAULT 0,
            last_dispatch TIMESTAMP,
            performance_rating DECIMAL(3, 2),
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
            risk_analysis JSONB,
            ai_copilot_actions JSONB,
            threat_vector_id VARCHAR(50),
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'dispatched', 'resolved', 'false_positive')),
            acknowledged_by VARCHAR(50),
            acknowledged_at TIMESTAMP,
            assigned_guard VARCHAR(50),
            operator_metadata JSONB,
            resolution_time INTEGER,
            false_positive_reason TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'guard_dispatches',
        sql: `
          CREATE TABLE IF NOT EXISTS guard_dispatches (
            dispatch_id VARCHAR(50) PRIMARY KEY,
            alert_id VARCHAR(50),
            guard_id VARCHAR(50),
            priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'emergency', 'backup')),
            status VARCHAR(20) DEFAULT 'dispatched' CHECK (status IN ('dispatched', 'en_route', 'on_scene', 'completed', 'cancelled')),
            estimated_arrival TIMESTAMP,
            actual_arrival TIMESTAMP,
            completion_time TIMESTAMP,
            route_data JSONB,
            guard_location JSONB,
            special_instructions TEXT,
            backup_required BOOLEAN DEFAULT false,
            backup_for_dispatch VARCHAR(50),
            status_notes TEXT,
            created_by VARCHAR(50),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
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
            user_id VARCHAR(50),
            guard_id VARCHAR(50),
            ip_address INET,
            user_agent TEXT,
            severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
            timestamp TIMESTAMP DEFAULT NOW()
          )
        `
      }
    ];

    for (const table of tables) {
      await client.query(table.sql);
      logSuccess(`Created table: ${table.name}`);
    }

  } catch (error) {
    logError(`Table creation failed: ${error.message}`);
    throw error;
  } finally {
    await client.end();
  }
}

async function insertSampleData() {
  const client = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT),
  });

  try {
    await client.connect();
    logInfo('Inserting sample data...');

    // Sample cameras
    await client.query(`
      INSERT INTO cameras (camera_id, name, location, status, capabilities, ai_enabled) 
      VALUES 
        ('cam_entrance_1', 'Main Entrance', 'Building A - Lobby', 'online', '{"supports_ptz": true, "supports_audio_output": true, "supports_digital_zoom": true}', true),
        ('cam_parking_1', 'Parking Garage', 'Underground Level 1', 'online', '{"supports_ptz": false, "supports_audio_output": false, "supports_digital_zoom": true}', true),
        ('cam_elevator_1', 'Elevator Bank', 'Building A - Floor 1', 'online', '{"supports_ptz": true, "supports_audio_output": true, "supports_digital_zoom": true}', true),
        ('cam_rooftop_1', 'Rooftop Access', 'Building A - Roof', 'offline', '{"supports_ptz": true, "supports_audio_output": true, "supports_digital_zoom": true}', true)
      ON CONFLICT (camera_id) DO NOTHING
    `);

    // Sample guards
    await client.query(`
      INSERT INTO guards (guard_id, name, phone_number, email, status, assigned_zone, experience_level, last_known_latitude, last_known_longitude) 
      VALUES 
        ('guard_001', 'Marcus Johnson', '+1-555-0101', 'marcus.j@security.com', 'on_duty', 'Zone A', 'senior', 33.7175, -117.8311),
        ('guard_002', 'Sarah Williams', '+1-555-0102', 'sarah.w@security.com', 'on_duty', 'Zone B', 'standard', 33.7173, -117.8315),
        ('guard_003', 'David Chen', '+1-555-0103', 'david.c@security.com', 'break', 'Zone C', 'standard', 33.7177, -117.8308)
      ON CONFLICT (guard_id) DO NOTHING
    `);

    logSuccess('Sample data inserted successfully!');

  } catch (error) {
    if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
      logInfo('Sample data already exists, skipping...');
    } else {
      logError(`Sample data insertion failed: ${error.message}`);
      throw error;
    }
  } finally {
    await client.end();
  }
}

async function main() {
  log('\n🚀 APEX AI PLATFORM - DATABASE SETUP', 'bright');
  log('=====================================', 'cyan');

  try {
    // Step 1: Create database
    await createDatabase();
    
    // Step 2: Create essential tables
    await createBasicTables();
    
    // Step 3: Insert sample data
    await insertSampleData();

    log('\n🎉 Database setup completed successfully!', 'green');
    log('✅ You can now start the server with: npm run dev', 'green');
    
  } catch (error) {
    logError(`\nSetup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run setup
main();