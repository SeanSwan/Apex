#!/usr/bin/env node

/**
 * APEX AI - COMPREHENSIVE DATABASE SETUP
 * =====================================
 * Complete database setup including core tables and Voice AI Dispatcher
 * Handles dependency chain: Core Tables → Voice AI Tables → Verification
 */

import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

class ComprehensiveDatabaseSetup {
  constructor() {
    this.sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT) || 5432,
      database: process.env.PG_DB || 'apex',
      username: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      logging: false,
      define: {
        timestamps: true,
        underscored: true
      }
    });
  }

  async validateConnection() {
    console.log('🔌 Validating database connection...');
    try {
      await this.sequelize.authenticate();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async checkExistingTables() {
    console.log('\n📋 Checking existing database structure...');
    
    try {
      const [results] = await this.sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      const existingTables = results.map(row => row.table_name);
      
      console.log(`Found ${existingTables.length} existing tables:`);
      if (existingTables.length > 0) {
        existingTables.forEach(table => console.log(`   📄 ${table}`));
      } else {
        console.log('   ℹ️  No tables found - starting fresh database setup');
      }
      
      return existingTables;
    } catch (error) {
      console.error('❌ Error checking tables:', error.message);
      return [];
    }
  }

  async runSequelizeMigrations() {
    console.log('\n🔄 Running Sequelize migrations for core tables...');
    
    try {
      const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate', {
        cwd: __dirname,
        env: { ...process.env }
      });
      
      if (stderr && !stderr.includes('Sequelize')) {
        console.error('⚠️ Migration warnings:', stderr);
      }
      
      console.log('✅ Core migrations completed');
      if (stdout.includes('No migrations were executed')) {
        console.log('   ℹ️  All core migrations were already up to date');
      } else {
        console.log('   📋 Migration details:', stdout.split('\n').filter(line => line.includes('==')).join('\n   '));
      }
      
      return true;
    } catch (error) {
      console.error('❌ Sequelize migration error:', error.message);
      return false;
    }
  }

  async createVoiceAITables() {
    console.log('\n🎤 Creating Voice AI Dispatcher tables...');
    
    // Create contact_lists table
    await this.createContactListsTable();
    
    // Create standard_operating_procedures table  
    await this.createStandardOperatingProceduresTable();
    
    // Create call_logs table
    await this.createCallLogsTable();
    
    console.log('✅ All Voice AI Dispatcher tables created successfully');
  }

  async createContactListsTable() {
    console.log('   📋 Creating contact_lists table...');
    
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS contact_lists (
        contact_list_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        property_id UUID REFERENCES properties(property_id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        incident_types JSONB DEFAULT '[]'::jsonb,
        notification_methods JSONB DEFAULT '{
          "sms": {"enabled": true, "delay_seconds": 0},
          "email": {"enabled": true, "delay_seconds": 30},
          "push": {"enabled": true, "delay_seconds": 0},
          "call": {"enabled": false, "delay_seconds": 300}
        }'::jsonb,
        escalation_rules JSONB DEFAULT '{
          "max_attempts": 3,
          "escalation_delay_minutes": 15,
          "require_acknowledgment": true
        }'::jsonb,
        contacts JSONB DEFAULT '[]'::jsonb,
        usage_analytics JSONB DEFAULT '{
          "total_notifications": 0,
          "success_rate": 0,
          "last_used": null
        }'::jsonb,
        created_by UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Create indexes
    await this.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_lists_property_id ON contact_lists(property_id);
      CREATE INDEX IF NOT EXISTS idx_contact_lists_active ON contact_lists(is_active);
      CREATE INDEX IF NOT EXISTS idx_contact_lists_incident_types ON contact_lists USING GIN(incident_types);
    `);
  }

  async createStandardOperatingProceduresTable() {
    console.log('   📋 Creating standard_operating_procedures table...');
    
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS standard_operating_procedures (
        sop_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        property_id UUID REFERENCES properties(property_id) ON DELETE CASCADE,
        incident_type VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        priority_level INTEGER DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5),
        conversation_flow JSONB DEFAULT '{
          "greeting": "Hello, this is APEX AI Security. How can I assist you?",
          "information_gathering": [],
          "responses": {},
          "escalation_triggers": []
        }'::jsonb,
        automated_actions JSONB DEFAULT '{
          "notifications": [],
          "guard_dispatch": false,
          "police_call": false,
          "incident_creation": true
        }'::jsonb,
        escalation_rules JSONB DEFAULT '{
          "human_takeover_triggers": ["weapon", "violence", "medical_emergency"],
          "police_dispatch_triggers": ["weapon", "active_violence"],
          "confidence_thresholds": {"high": 0.9, "medium": 0.7, "low": 0.5}
        }'::jsonb,
        contact_list_id UUID REFERENCES contact_lists(contact_list_id),
        usage_statistics JSONB DEFAULT '{
          "times_used": 0,
          "success_rate": 0,
          "average_call_duration": 0,
          "last_used": null
        }'::jsonb,
        version INTEGER DEFAULT 1,
        approved_by UUID,
        approved_at TIMESTAMPTZ,
        created_by UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Create indexes
    await this.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_sops_property_id ON standard_operating_procedures(property_id);
      CREATE INDEX IF NOT EXISTS idx_sops_incident_type ON standard_operating_procedures(incident_type);
      CREATE INDEX IF NOT EXISTS idx_sops_active ON standard_operating_procedures(is_active);
      CREATE INDEX IF NOT EXISTS idx_sops_priority ON standard_operating_procedures(priority_level);
    `);
  }

  async createCallLogsTable() {
    console.log('   📋 Creating call_logs table...');
    
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS call_logs (
        call_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        twilio_call_sid VARCHAR(100) UNIQUE NOT NULL,
        caller_phone VARCHAR(20) NOT NULL,
        caller_name VARCHAR(200),
        property_id UUID REFERENCES properties(property_id),
        incident_id UUID REFERENCES incidents(incident_id),
        sop_id UUID REFERENCES standard_operating_procedures(sop_id),
        call_status VARCHAR(50) DEFAULT 'incoming',
        call_direction VARCHAR(20) DEFAULT 'inbound',
        call_start_time TIMESTAMPTZ DEFAULT NOW(),
        call_end_time TIMESTAMPTZ,
        call_duration_seconds INTEGER DEFAULT 0,
        ai_confidence_score DECIMAL(3,2) DEFAULT 0.0,
        human_takeover BOOLEAN DEFAULT false,
        human_takeover_time TIMESTAMPTZ,
        takeover_reason VARCHAR(200),
        full_transcript JSONB DEFAULT '[]'::jsonb,
        conversation_summary TEXT,
        extracted_information JSONB DEFAULT '{
          "incident_type": null,
          "location": null,
          "urgency_level": null,
          "caller_callback": null,
          "additional_details": {}
        }'::jsonb,
        ai_actions_taken JSONB DEFAULT '{
          "notifications_sent": [],
          "guard_dispatched": false,
          "police_called": false,
          "incident_created": false
        }'::jsonb,
        audio_recording_url VARCHAR(500),
        audio_recording_duration INTEGER,
        twilio_recording_sid VARCHAR(100),
        processing_status VARCHAR(50) DEFAULT 'pending',
        error_logs JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // Create indexes
    await this.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_call_logs_twilio_sid ON call_logs(twilio_call_sid);
      CREATE INDEX IF NOT EXISTS idx_call_logs_property_id ON call_logs(property_id);
      CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(call_status);
      CREATE INDEX IF NOT EXISTS idx_call_logs_start_time ON call_logs(call_start_time);
      CREATE INDEX IF NOT EXISTS idx_call_logs_human_takeover ON call_logs(human_takeover);
    `);
  }

  async updateSequelizeMeta() {
    console.log('\n📝 Updating SequelizeMeta for Voice AI migrations...');
    
    const voiceMigrations = [
      '20250805120050-create-contact-lists.js',
      '20250805120100-create-standard-operating-procedures.js',
      '20250805120000-create-call-logs.js'
    ];
    
    // Ensure SequelizeMeta table exists
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        name VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `);
    
    // Add Voice AI migration records
    for (const migration of voiceMigrations) {
      await this.sequelize.query(`
        INSERT INTO "SequelizeMeta" (name) VALUES ('${migration}')
        ON CONFLICT (name) DO NOTHING;
      `);
      console.log(`   ✅ Recorded migration: ${migration}`);
    }
  }

  async finalVerification() {
    console.log('\n🔍 Final system verification...');
    
    // Check all required tables exist
    const requiredTables = [
      'users', 'properties', 'incidents',
      'contact_lists', 'standard_operating_procedures', 'call_logs'
    ];
    
    let allTablesExist = true;
    
    for (const table of requiredTables) {
      try {
        const [results] = await this.sequelize.query(`
          SELECT COUNT(*) as count FROM ${table} LIMIT 1
        `);
        console.log(`   ✅ ${table} - Accessible (${results[0].count} records)`);
      } catch (error) {
        console.log(`   ❌ ${table} - Missing or inaccessible`);
        allTablesExist = false;
      }
    }
    
    return allTablesExist;
  }

  async execute() {
    console.log('🚀 APEX AI - Comprehensive Database Setup');
    console.log('=' .repeat(60));
    console.log('Setting up complete database schema including Voice AI Dispatcher...\n');
    
    try {
      // Step 1: Validate connection
      const isConnected = await this.validateConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }
      
      // Step 2: Check existing structure
      const existingTables = await this.checkExistingTables();
      
      // Step 3: Run core migrations first
      const coreSuccess = await this.runSequelizeMigrations();
      if (!coreSuccess) {
        throw new Error('Core migrations failed');
      }
      
      // Step 4: Create Voice AI tables
      await this.createVoiceAITables();
      
      // Step 5: Update SequelizeMeta
      await this.updateSequelizeMeta();
      
      // Step 6: Final verification
      const allGood = await this.finalVerification();
      
      if (allGood) {
        console.log('\n🎉 SUCCESS: Complete database setup finished!');
        console.log('=' .repeat(60));
        console.log('✅ Core APEX AI tables created and accessible');
        console.log('✅ Voice AI Dispatcher tables created and accessible');
        console.log('✅ All foreign key relationships established');
        console.log('✅ Database indexes created for optimal performance');
        
        console.log('\n📋 NEXT STEPS:');
        console.log('1. ✅ Database setup complete');
        console.log('2. Configure API keys in .env files');
        console.log('3. Test Voice AI integration: node verify-voice-system.mjs');
        console.log('4. Start backend server and test voice endpoints');
      } else {
        console.log('\n⚠️  Some tables may not have been created correctly');
        console.log('Please check the logs above for specific issues');
      }
      
      await this.sequelize.close();
      
    } catch (error) {
      console.error('\n❌ CRITICAL SETUP ERROR:', error.message);
      console.error('\n🔧 TROUBLESHOOTING:');
      console.error('1. Verify PostgreSQL is running and accessible');
      console.error('2. Check database credentials in .env file');
      console.error('3. Ensure database "apex" exists and user has permissions');
      console.error('4. Check for any conflicting database connections');
      
      await this.sequelize.close();
      process.exit(1);
    }
  }
}

// Execute the comprehensive database setup
const setup = new ComprehensiveDatabaseSetup();
setup.execute().catch(console.error);
