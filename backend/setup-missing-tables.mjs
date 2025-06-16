/**
 * APEX AI DATABASE SETUP - MISSING TABLES CREATION
 * ================================================
 * Create tables needed for external service integration
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost', 
  database: process.env.PG_DB || 'apex',
  password: process.env.PG_PASSWORD || '',
  port: Number(process.env.PG_PORT || 5432),
});

console.log('🔧 Creating missing database tables for external services...\n');

async function createMissingTables() {
  try {
    // Check existing tables
    const existingTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const existingResult = await pool.query(existingTablesQuery);
    const existingTables = existingResult.rows.map(row => row.table_name);
    
    console.log('📋 Existing tables:', existingTables);
    
    // Create missing tables for external services
    const tablesToCreate = [
      {
        name: 'guard_devices',
        sql: `
          CREATE TABLE IF NOT EXISTS guard_devices (
            id SERIAL PRIMARY KEY,
            guard_id VARCHAR(50) NOT NULL,
            device_tokens JSONB NOT NULL DEFAULT '[]',
            platform VARCHAR(20) NOT NULL,
            app_version VARCHAR(20),
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'guard_notifications',
        sql: `
          CREATE TABLE IF NOT EXISTS guard_notifications (
            id SERIAL PRIMARY KEY,
            guard_id VARCHAR(50) NOT NULL,
            notification_data JSONB NOT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read_at TIMESTAMP,
            status VARCHAR(20) DEFAULT 'sent'
          )
        `
      },
      {
        name: 'camera_zones',
        sql: `
          CREATE TABLE IF NOT EXISTS camera_zones (
            id SERIAL PRIMARY KEY,
            camera_id VARCHAR(50) NOT NULL,
            zone_id VARCHAR(50) NOT NULL,
            zone_name VARCHAR(100),
            sensitivity_level VARCHAR(20) DEFAULT 'normal',
            latitude DECIMAL(10,8),
            longitude DECIMAL(11,8),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'threat_vectors',
        sql: `
          CREATE TABLE IF NOT EXISTS threat_vectors (
            id SERIAL PRIMARY KEY,
            vector_id VARCHAR(100) UNIQUE NOT NULL,
            data JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'camera_command_log',
        sql: `
          CREATE TABLE IF NOT EXISTS camera_command_log (
            id SERIAL PRIMARY KEY,
            camera_id VARCHAR(50) NOT NULL,
            command VARCHAR(100) NOT NULL,
            parameters JSONB,
            response JSONB,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'camera_audio_log',
        sql: `
          CREATE TABLE IF NOT EXISTS camera_audio_log (
            id SERIAL PRIMARY KEY,
            camera_id VARCHAR(50) NOT NULL,
            audio_type VARCHAR(50) NOT NULL,
            message_text TEXT,
            tts_options JSONB,
            parameters JSONB,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'camera_monitoring_log',
        sql: `
          CREATE TABLE IF NOT EXISTS camera_monitoring_log (
            id SERIAL PRIMARY KEY,
            camera_id VARCHAR(50) NOT NULL,
            monitoring_type VARCHAR(50) NOT NULL,
            detection_context VARCHAR(100),
            activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'guard_dispatches',
        sql: `
          CREATE TABLE IF NOT EXISTS guard_dispatches (
            id SERIAL PRIMARY KEY,
            dispatch_id VARCHAR(100) UNIQUE NOT NULL,
            alert_id VARCHAR(100) NOT NULL,
            guard_id VARCHAR(50) NOT NULL,
            priority VARCHAR(20) NOT NULL,
            status VARCHAR(20) DEFAULT 'dispatched',
            estimated_arrival TIMESTAMP,
            route_data JSONB,
            special_instructions TEXT,
            backup_required BOOLEAN DEFAULT false,
            backup_for_dispatch VARCHAR(100),
            guard_location JSONB,
            status_notes TEXT,
            completion_time TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by VARCHAR(50),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      }
    ];
    
    // Create missing tables
    for (const table of tablesToCreate) {
      if (!existingTables.includes(table.name)) {
        await pool.query(table.sql);
        console.log(`✅ Created table: ${table.name}`);
      } else {
        console.log(`⚠️ Table ${table.name} already exists`);
      }
    }
    
    // Insert sample data if tables are empty
    console.log('\n📊 Inserting sample data for testing...');
    
    // Sample cameras if none exist
    const cameraCount = await pool.query('SELECT COUNT(*) FROM cameras');
    if (parseInt(cameraCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO cameras (camera_id, name, status, capabilities, rtsp_url) VALUES 
        ('cam_001', 'Main Entrance', 'online', '{"supports_ptz": true, "supports_audio_output": true, "supports_digital_zoom": true}', 'rtsp://demo.camera/stream1'),
        ('cam_002', 'Parking Lot', 'online', '{"supports_ptz": false, "supports_audio_output": true, "supports_digital_zoom": true}', 'rtsp://demo.camera/stream2'),
        ('cam_003', 'Rear Exit', 'online', '{"supports_ptz": true, "supports_audio_output": false, "supports_digital_zoom": true}', 'rtsp://demo.camera/stream3')
      `);
      console.log('✅ Sample cameras created');
    }
    
    // Sample guards if none exist
    const guardCount = await pool.query('SELECT COUNT(*) FROM guards');
    if (parseInt(guardCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO guards (guard_id, name, status, experience_level, last_known_latitude, last_known_longitude, active_alerts) VALUES 
        ('guard_001', 'John Smith', 'on_duty', 'senior', 40.7128, -74.0060, 0),
        ('guard_002', 'Sarah Johnson', 'available', 'intermediate', 40.7130, -74.0055, 0),
        ('guard_003', 'Mike Wilson', 'on_duty', 'junior', 40.7125, -74.0065, 1)
      `);
      console.log('✅ Sample guards created');
    }
    
    // Sample camera zones
    const zoneCount = await pool.query('SELECT COUNT(*) FROM camera_zones');
    if (parseInt(zoneCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO camera_zones (camera_id, zone_id, zone_name, sensitivity_level, latitude, longitude) VALUES 
        ('cam_001', 'zone_entrance', 'Main Entrance Area', 'high_security', 40.7128, -74.0060),
        ('cam_002', 'zone_parking', 'Parking Lot', 'normal', 40.7130, -74.0055),
        ('cam_003', 'zone_rear', 'Rear Exit Area', 'restricted', 40.7125, -74.0065)
      `);
      console.log('✅ Sample camera zones created');
    }
    
    // Create indexes for performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_ai_alerts_camera_id ON ai_alerts_log(camera_id)',
      'CREATE INDEX IF NOT EXISTS idx_ai_alerts_timestamp ON ai_alerts_log(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_guard_dispatches_alert_id ON guard_dispatches(alert_id)',
      'CREATE INDEX IF NOT EXISTS idx_guard_notifications_guard_id ON guard_notifications(guard_id)',
      'CREATE INDEX IF NOT EXISTS idx_camera_zones_camera_id ON camera_zones(camera_id)'
    ];
    
    for (const indexSql of indexes) {
      try {
        await pool.query(indexSql);
      } catch (error) {
        // Index might already exist, that's ok
      }
    }
    
    console.log('✅ Database indexes created');
    
    console.log('\n🎉 Database setup complete!');
    console.log('📊 Your database now has all required tables for external services');
    
  } catch (error) {
    console.error('❌ Database setup error:', error);
  } finally {
    await pool.end();
  }
}

createMissingTables();
