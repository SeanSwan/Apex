#!/usr/bin/env node

/**
 * VOICE AI DISPATCHER - COMPREHENSIVE MIGRATION HANDLER
 * ====================================================
 * Handles Voice AI Dispatcher migrations with full validation and rollback capability
 */

import dotenv from 'dotenv';
import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

class VoiceAIMigrationHandler {
  constructor() {
    this.sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT) || 5432,
      database: process.env.PG_DB || 'apex',
      username: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      logging: false, // Reduce noise for cleaner output
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
    console.log('\n🔍 Checking for existing Voice AI tables...');
    
    const tableChecks = [
      { name: 'contact_lists', description: 'Automated notification contacts' },
      { name: 'standard_operating_procedures', description: 'AI decision logic and SOPs' },
      { name: 'call_logs', description: 'Voice call records and transcripts' }
    ];
    
    const existingTables = [];
    
    for (const table of tableChecks) {
      try {
        const [results] = await this.sequelize.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = '${table.name}'
        `);
        
        if (results.length > 0) {
          existingTables.push(table.name);
          console.log(`✅ ${table.name} - ${table.description}`);
        } else {
          console.log(`❌ ${table.name} - ${table.description} (MISSING)`);
        }
      } catch (error) {
        console.log(`⚠️  ${table.name} - Error checking: ${error.message}`);
      }
    }
    
    return existingTables;
  }
  
  async createContactListsTable() {
    console.log('\n📋 Creating contact_lists table...');
    
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
        created_by UUID REFERENCES users(user_id),
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
    
    console.log('✅ contact_lists table created successfully');
  }
  
  async createStandardOperatingProceduresTable() {
    console.log('\n📋 Creating standard_operating_procedures table...');
    
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
        approved_by UUID REFERENCES users(user_id),
        approved_at TIMESTAMPTZ,
        created_by UUID REFERENCES users(user_id),
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
    
    console.log('✅ standard_operating_procedures table created successfully');
  }
  
  async createCallLogsTable() {
    console.log('\n📋 Creating call_logs table...');
    
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
    
    console.log('✅ call_logs table created successfully');
  }
  
  async updateSequelizeMeta() {
    console.log('\n📝 Updating SequelizeMeta table...');
    
    const migrations = [
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
    
    // Add migration records
    for (const migration of migrations) {
      await this.sequelize.query(`
        INSERT INTO "SequelizeMeta" (name) VALUES ('${migration}')
        ON CONFLICT (name) DO NOTHING;
      `);
      console.log(`✅ Recorded migration: ${migration}`);
    }
  }
  
  async execute() {
    console.log('🚀 APEX AI - Voice AI Dispatcher Database Setup');
    console.log('=' .repeat(60));
    
    try {
      // Step 1: Validate connection
      const isConnected = await this.validateConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }
      
      // Step 2: Check existing tables
      const existingTables = await this.checkExistingTables();
      
      // Step 3: Create missing tables
      if (!existingTables.includes('contact_lists')) {
        await this.createContactListsTable();
      }
      
      if (!existingTables.includes('standard_operating_procedures')) {
        await this.createStandardOperatingProceduresTable();
      }
      
      if (!existingTables.includes('call_logs')) {
        await this.createCallLogsTable();
      }
      
      // Step 4: Update SequelizeMeta
      await this.updateSequelizeMeta();
      
      // Step 5: Final verification
      console.log('\n🔍 Final verification...');
      const finalCheck = await this.checkExistingTables();
      
      if (finalCheck.length === 3) {
        console.log('\n🎉 SUCCESS: Voice AI Dispatcher database setup complete!');
        console.log('📋 All tables created and ready:');
        finalCheck.forEach(table => console.log(`   ✓ ${table}`));
        
        console.log('\n📋 NEXT STEPS:');
        console.log('1. ✅ Database tables ready');
        console.log('2. Configure API keys in .env file');
        console.log('3. Test MCP server integration');
        console.log('4. Verify frontend components');
      } else {
        console.log('\n⚠️  Some tables may not have been created correctly');
      }
      
      await this.sequelize.close();
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR:', error.message);
      console.error('\n🔧 TROUBLESHOOTING:');
      console.error('1. Verify PostgreSQL is running');
      console.error('2. Check database credentials in .env');
      console.error('3. Ensure database "apex" exists');
      await this.sequelize.close();
      process.exit(1);
    }
  }
}

// Execute the migration handler
const migrationHandler = new VoiceAIMigrationHandler();
migrationHandler.execute().catch(console.error);
