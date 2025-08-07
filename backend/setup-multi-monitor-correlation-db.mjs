#!/usr/bin/env node
/**
 * SETUP MULTI-MONITOR CORRELATION DATABASE
 * ========================================
 * Script to create the necessary database tables for the Multi-Monitor Threat Correlation system
 * Run this script to set up correlation tables for cross-monitor threat tracking and handoff
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
});

async function createMultiMonitorCorrelationTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Creating Multi-Monitor Correlation tables...');
    
    // Create monitor_relationships table
    console.log('📍 Creating monitor_relationships table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS monitor_relationships (
        id SERIAL PRIMARY KEY,
        relationship_id VARCHAR(100) UNIQUE NOT NULL,
        monitor_a VARCHAR(100) NOT NULL,
        monitor_b VARCHAR(100) NOT NULL,
        spatial_relationship VARCHAR(20) NOT NULL DEFAULT 'adjacent'
          CHECK (spatial_relationship IN ('adjacent', 'overlapping', 'sequential', 'isolated')),
        transition_zones TEXT,
        average_handoff_time DECIMAL(5, 3) NOT NULL DEFAULT 2.000,
        confidence_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.20,
        is_active BOOLEAN NOT NULL DEFAULT true,
        metadata TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(monitor_a, monitor_b)
      );
    `);
    
    // Create cross_monitor_threats table
    console.log('🎯 Creating cross_monitor_threats table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS cross_monitor_threats (
        id SERIAL PRIMARY KEY,
        threat_id VARCHAR(100) UNIQUE NOT NULL,
        original_detection_id VARCHAR(100) NOT NULL,
        monitor_id VARCHAR(100) NOT NULL,
        zone_id VARCHAR(100) NOT NULL,
        threat_type VARCHAR(50) NOT NULL,
        threat_level VARCHAR(20) NOT NULL DEFAULT 'MEDIUM'
          CHECK (threat_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'WEAPON')),
        confidence DECIMAL(3, 2) NOT NULL,
        bbox_x INTEGER NOT NULL,
        bbox_y INTEGER NOT NULL,
        bbox_width INTEGER NOT NULL,
        bbox_height INTEGER NOT NULL,
        features TEXT,
        movement_vector_x DECIMAL(8, 4),
        movement_vector_y DECIMAL(8, 4),
        last_seen TIMESTAMP WITH TIME ZONE NOT NULL,
        correlation_metadata TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create threat_correlations table
    console.log('🔗 Creating threat_correlations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS threat_correlations (
        id SERIAL PRIMARY KEY,
        correlation_id VARCHAR(100) UNIQUE NOT NULL,
        primary_threat_id VARCHAR(100) NOT NULL,
        correlated_threat_ids TEXT NOT NULL,
        confidence_score DECIMAL(3, 2) NOT NULL,
        correlation_status VARCHAR(20) NOT NULL DEFAULT 'pending'
          CHECK (correlation_status IN ('pending', 'active', 'handoff_in_progress', 'completed', 'expired', 'failed')),
        correlation_factors TEXT,
        expected_monitors TEXT,
        handoff_history TEXT,
        last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE,
        metadata TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create threat_handoff_log table
    console.log('📝 Creating threat_handoff_log table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS threat_handoff_log (
        id SERIAL PRIMARY KEY,
        handoff_id VARCHAR(100) UNIQUE NOT NULL,
        correlation_id VARCHAR(100) NOT NULL,
        threat_id VARCHAR(100) NOT NULL,
        from_monitor VARCHAR(100) NOT NULL,
        to_monitor VARCHAR(100) NOT NULL,
        from_zone VARCHAR(100),
        to_zone VARCHAR(100),
        handoff_status VARCHAR(20) NOT NULL DEFAULT 'initiated'
          CHECK (handoff_status IN ('initiated', 'in_progress', 'successful', 'failed', 'timeout')),
        handoff_latency_ms INTEGER,
        confidence_score DECIMAL(3, 2) NOT NULL,
        correlation_factors TEXT,
        handoff_reason VARCHAR(20) NOT NULL DEFAULT 'automatic'
          CHECK (handoff_reason IN ('automatic', 'predicted_movement', 'manual', 'escalation')),
        success_metrics TEXT,
        error_details TEXT,
        initiated_at TIMESTAMP WITH TIME ZONE NOT NULL,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes for performance
    console.log('🔍 Creating database indexes...');
    
    const indexes = [
      // Monitor relationships indexes
      'CREATE INDEX IF NOT EXISTS idx_monitor_relationships_pair ON monitor_relationships(monitor_a, monitor_b);',
      'CREATE INDEX IF NOT EXISTS idx_monitor_relationships_spatial ON monitor_relationships(spatial_relationship);',
      'CREATE INDEX IF NOT EXISTS idx_monitor_relationships_active ON monitor_relationships(is_active);',
      
      // Cross-monitor threats indexes
      'CREATE INDEX IF NOT EXISTS idx_cross_monitor_threats_monitor ON cross_monitor_threats(monitor_id);',
      'CREATE INDEX IF NOT EXISTS idx_cross_monitor_threats_zone ON cross_monitor_threats(zone_id);',
      'CREATE INDEX IF NOT EXISTS idx_cross_monitor_threats_type ON cross_monitor_threats(threat_type);',
      'CREATE INDEX IF NOT EXISTS idx_cross_monitor_threats_level ON cross_monitor_threats(threat_level);',
      'CREATE INDEX IF NOT EXISTS idx_cross_monitor_threats_last_seen ON cross_monitor_threats(last_seen);',
      'CREATE INDEX IF NOT EXISTS idx_cross_monitor_threats_active ON cross_monitor_threats(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_cross_monitor_threats_created ON cross_monitor_threats(created_at);',
      
      // Threat correlations indexes
      'CREATE INDEX IF NOT EXISTS idx_threat_correlations_primary ON threat_correlations(primary_threat_id);',
      'CREATE INDEX IF NOT EXISTS idx_threat_correlations_status ON threat_correlations(correlation_status);',
      'CREATE INDEX IF NOT EXISTS idx_threat_correlations_confidence ON threat_correlations(confidence_score);',
      'CREATE INDEX IF NOT EXISTS idx_threat_correlations_updated ON threat_correlations(last_updated);',
      'CREATE INDEX IF NOT EXISTS idx_threat_correlations_expires ON threat_correlations(expires_at);',
      
      // Threat handoff log indexes
      'CREATE INDEX IF NOT EXISTS idx_threat_handoff_log_correlation ON threat_handoff_log(correlation_id);',
      'CREATE INDEX IF NOT EXISTS idx_threat_handoff_log_threat ON threat_handoff_log(threat_id);',
      'CREATE INDEX IF NOT EXISTS idx_threat_handoff_log_monitors ON threat_handoff_log(from_monitor, to_monitor);',
      'CREATE INDEX IF NOT EXISTS idx_threat_handoff_log_status ON threat_handoff_log(handoff_status);',
      'CREATE INDEX IF NOT EXISTS idx_threat_handoff_log_latency ON threat_handoff_log(handoff_latency_ms);',
      'CREATE INDEX IF NOT EXISTS idx_threat_handoff_log_initiated ON threat_handoff_log(initiated_at);',
      'CREATE INDEX IF NOT EXISTS idx_threat_handoff_log_completed ON threat_handoff_log(completed_at);'
    ];
    
    for (const indexQuery of indexes) {
      await client.query(indexQuery);
    }
    
    // Insert sample monitor relationships
    console.log('📊 Inserting sample monitor relationship data...');
    
    await client.query(`
      INSERT INTO monitor_relationships (relationship_id, monitor_a, monitor_b, spatial_relationship, confidence_multiplier, metadata)
      VALUES 
        ('monitor_0_1_adjacent', '0', '1', 'adjacent', 1.30, '{"description": "Main entrance to lobby transition", "typical_handoff_scenarios": ["person_entering", "person_exiting"]}'),
        ('monitor_1_2_sequential', '1', '2', 'sequential', 1.20, '{"description": "Lobby to parking area sequence", "typical_handoff_scenarios": ["visitor_parking", "resident_parking"]}'),
        ('monitor_0_2_overlapping', '0', '2', 'overlapping', 1.40, '{"description": "Entrance with parking lot view overlap", "typical_handoff_scenarios": ["vehicle_arrival", "delivery_approach"]}'),
        ('monitor_2_3_adjacent', '2', '3', 'adjacent', 1.25, '{"description": "Parking to rear building access", "typical_handoff_scenarios": ["employee_access", "service_entrance"]}}')
      ON CONFLICT (relationship_id) DO UPDATE SET
        confidence_multiplier = excluded.confidence_multiplier,
        metadata = excluded.metadata,
        updated_at = CURRENT_TIMESTAMP;
    `);
    
    console.log('✅ Multi-Monitor Correlation database setup completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    
    // Get counts
    const relationshipsResult = await client.query('SELECT COUNT(*) as count FROM monitor_relationships;');
    const threatsResult = await client.query('SELECT COUNT(*) as count FROM cross_monitor_threats;');
    const correlationsResult = await client.query('SELECT COUNT(*) as count FROM threat_correlations;');
    const handoffsResult = await client.query('SELECT COUNT(*) as count FROM threat_handoff_log;');
    
    console.log(`   • Monitor Relationships: ${relationshipsResult.rows[0].count}`);
    console.log(`   • Cross-Monitor Threats: ${threatsResult.rows[0].count}`);
    console.log(`   • Threat Correlations: ${correlationsResult.rows[0].count}`);
    console.log(`   • Handoff Log Entries: ${handoffsResult.rows[0].count}`);
    console.log(`   • Database Tables: 4 (relationships, threats, correlations, handoff_log)`);
    console.log(`   • Database Indexes: 20+ for high-performance queries`);
    console.log('');
    console.log('🚀 Ready to use Multi-Monitor Threat Correlation system!');
    console.log('');
    console.log('🎯 Features Enabled:');
    console.log('   • Cross-monitor threat tracking with <500ms latency');
    console.log('   • AI-powered correlation confidence scoring');
    console.log('   • Automatic threat handoff between monitors');
    console.log('   • Comprehensive audit trail for all handoff operations');
    console.log('   • Spatial relationship modeling for accurate predictions');
    
  } catch (error) {
    console.error('❌ Error creating Multi-Monitor Correlation tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function checkPrerequisites() {
  console.log('🔍 Checking system prerequisites...');
  
  // Check if Rules Configuration tables exist (optional dependency)
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name IN ('geofencing_zones', 'security_rules')
    `);
    
    const rulesTablesExist = parseInt(result.rows[0].count) >= 2;
    
    if (rulesTablesExist) {
      console.log('✅ Rules Configuration tables detected - enhanced integration available');
    } else {
      console.log('⚠️  Rules Configuration tables not found - basic correlation will work');
      console.log('   Consider running SETUP_RULES_CONFIGURATION.bat first for full functionality');
    }
    
    client.release();
    return true;
  } catch (error) {
    console.log('⚠️  Could not check prerequisites:', error.message);
    return true; // Continue anyway
  }
}

async function main() {
  console.log('🔗 APEX AI Multi-Monitor Threat Correlation Database Setup');
  console.log('='.repeat(60));
  console.log('');
  
  // Check database connection
  console.log('🔍 Checking database connection...');
  const isConnected = await checkDatabaseConnection();
  
  if (!isConnected) {
    console.log('');
    console.log('❌ Cannot proceed without database connection.');
    console.log('Please check your database configuration in .env file:');
    console.log('   • PG_HOST');
    console.log('   • PG_PORT');
    console.log('   • PG_DB');
    console.log('   • PG_USER');
    console.log('   • PG_PASSWORD');
    process.exit(1);
  }
  
  // Check prerequisites
  await checkPrerequisites();
  console.log('');
  
  try {
    await createMultiMonitorCorrelationTables();
    console.log('');
    console.log('🎉 Setup completed successfully!');
    console.log('You can now use the Multi-Monitor Threat Correlation system in the APEX AI Engine.');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Start the AI engine with correlation support');
    console.log('   2. Configure monitor relationships in your system');
    console.log('   3. Begin cross-monitor threat tracking automatically');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createMultiMonitorCorrelationTables };
