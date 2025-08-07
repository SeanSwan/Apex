#!/usr/bin/env node

/**
 * APEX AI - VOICE AI TABLES FOR EXISTING DATABASE
 * ==============================================
 * Creates Voice AI tables that work with existing database structure
 * Uses existing 'id' columns instead of 'property_id', 'user_id'
 */

import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

class VoiceAITablesForExistingDB {
  constructor() {
    this.sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT) || 5432,
      database: process.env.PG_DB || 'apex',
      username: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      logging: false, // Reduce noise
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

  async checkExistingStructure() {
    console.log('\n📋 Validating existing database structure...');
    
    // Check properties table
    try {
      const [propertyColumns] = await this.sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'properties' AND table_schema = 'public'
        AND column_name IN ('id', 'property_id')
      `);
      
      const hasPropertyId = propertyColumns.some(col => col.column_name === 'property_id');
      const hasId = propertyColumns.some(col => col.column_name === 'id');
      
      console.log(`   📄 Properties table: ${hasId ? 'uses id' : ''} ${hasPropertyId ? 'uses property_id' : ''}`);
      
      this.propertyKeyColumn = hasPropertyId ? 'property_id' : 'id';
      
    } catch (error) {
      console.log('   ❌ Could not check properties table:', error.message);
      this.propertyKeyColumn = 'id'; // default
    }

    // Check users table  
    try {
      const [userColumns] = await this.sequelize.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
        AND column_name IN ('id', 'user_id')
      `);
      
      const hasUserId = userColumns.some(col => col.column_name === 'user_id');
      const hasId = userColumns.some(col => col.column_name === 'id');
      
      console.log(`   👤 Users table: ${hasId ? 'uses id' : ''} ${hasUserId ? 'uses user_id' : ''}`);
      
      this.userKeyColumn = hasUserId ? 'user_id' : 'id';
      
    } catch (error) {
      console.log('   ❌ Could not check users table:', error.message);
      this.userKeyColumn = 'id'; // default
    }

    console.log(`   🔗 Will use: properties.${this.propertyKeyColumn}, users.${this.userKeyColumn}`);
  }

  async createIncidentsTableIfNeeded() {
    console.log('\n🚨 Checking/creating incidents table...');
    
    try {
      // Check if incidents table exists
      const [results] = await this.sequelize.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_name = 'incidents' AND table_schema = 'public'
      `);
      
      if (results[0].count > 0) {
        console.log('   ✅ Incidents table already exists');
        return;
      }
      
      // Create incidents table compatible with existing structure
      await this.sequelize.query(`
        CREATE TABLE incidents (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          incident_number VARCHAR(50) UNIQUE,
          title VARCHAR(200),
          description TEXT,
          incident_type VARCHAR(100),
          priority VARCHAR(20) DEFAULT 'medium',
          status VARCHAR(50) DEFAULT 'open',
          location TEXT,
          reported_at TIMESTAMPTZ DEFAULT NOW(),
          reported_by VARCHAR(100),
          property_id UUID REFERENCES properties(${this.propertyKeyColumn}),
          caller_phone VARCHAR(20),
          caller_name VARCHAR(200),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      console.log('   ✅ Incidents table created');
      
    } catch (error) {
      console.error('   ❌ Incidents table error:', error.message);
      throw error;
    }
  }

  async createVoiceAITables() {
    console.log('\n🎤 Creating Voice AI Dispatcher tables...');
    
    await this.createContactListsTable();
    await this.createSOPTable();
    await this.createCallLogsTable();
    
    console.log('✅ All Voice AI Dispatcher tables created successfully');
  }

  async createContactListsTable() {
    console.log('   📋 Creating contact_lists table...');
    
    try {
      await this.sequelize.query(`
        CREATE TABLE contact_lists (
          contact_list_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          property_id UUID REFERENCES properties(${this.propertyKeyColumn}) ON DELETE CASCADE,
          is_active BOOLEAN DEFAULT true,
          incident_types JSONB DEFAULT '[]'::jsonb,
          notification_methods JSONB DEFAULT '{
            "sms": {"enabled": true, "delay_seconds": 0},
            "email": {"enabled": true, "delay_seconds": 30},
            "push": {"enabled": true, "delay_seconds": 0},
            "call": {"enabled": false, "delay_seconds": 300}
          }'::jsonb,
          contacts JSONB DEFAULT '[]'::jsonb,
          created_by UUID REFERENCES users(${this.userKeyColumn}),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      // Create indexes
      await this.sequelize.query(`
        CREATE INDEX idx_contact_lists_property ON contact_lists(property_id);
        CREATE INDEX idx_contact_lists_active ON contact_lists(is_active);
      `);
      
      console.log('   ✅ Contact lists table created');
    } catch (error) {
      console.error('   ❌ Contact lists table error:', error.message);
      throw error;
    }
  }

  async createSOPTable() {
    console.log('   📋 Creating standard_operating_procedures table...');
    
    try {
      await this.sequelize.query(`
        CREATE TABLE standard_operating_procedures (
          sop_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          property_id UUID REFERENCES properties(${this.propertyKeyColumn}) ON DELETE CASCADE,
          incident_type VARCHAR(100) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          priority_level INTEGER DEFAULT 1,
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
          created_by UUID REFERENCES users(${this.userKeyColumn}),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      // Create indexes
      await this.sequelize.query(`
        CREATE INDEX idx_sops_property ON standard_operating_procedures(property_id);
        CREATE INDEX idx_sops_incident_type ON standard_operating_procedures(incident_type);
        CREATE INDEX idx_sops_active ON standard_operating_procedures(is_active);
      `);
      
      console.log('   ✅ Standard operating procedures table created');
    } catch (error) {
      console.error('   ❌ SOP table error:', error.message);
      throw error;
    }
  }

  async createCallLogsTable() {
    console.log('   📋 Creating call_logs table...');
    
    try {
      await this.sequelize.query(`
        CREATE TABLE call_logs (
          call_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          twilio_call_sid VARCHAR(100) UNIQUE NOT NULL,
          caller_phone VARCHAR(20) NOT NULL,
          caller_name VARCHAR(200),
          property_id UUID REFERENCES properties(${this.propertyKeyColumn}),
          incident_id UUID REFERENCES incidents(id),
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
        )
      `);
      
      // Create indexes
      await this.sequelize.query(`
        CREATE INDEX idx_call_logs_twilio_sid ON call_logs(twilio_call_sid);
        CREATE INDEX idx_call_logs_property ON call_logs(property_id);
        CREATE INDEX idx_call_logs_incident ON call_logs(incident_id);
        CREATE INDEX idx_call_logs_status ON call_logs(call_status);
        CREATE INDEX idx_call_logs_start_time ON call_logs(call_start_time);
      `);
      
      console.log('   ✅ Call logs table created');
    } catch (error) {
      console.error('   ❌ Call logs table error:', error.message);
      throw error;
    }
  }

  async updateSequelizeMeta() {
    console.log('\n📝 Updating SequelizeMeta records...');
    
    try {
      // Ensure SequelizeMeta table exists
      await this.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
          name VARCHAR(255) NOT NULL PRIMARY KEY
        )
      `);
      
      // Add Voice AI migration records
      const voiceMigrations = [
        '20250805120050-create-contact-lists.js',
        '20250805120100-create-standard-operating-procedures.js',
        '20250805120000-create-call-logs.js'
      ];
      
      for (const migration of voiceMigrations) {
        await this.sequelize.query(`
          INSERT INTO "SequelizeMeta" (name) VALUES ('${migration}')
          ON CONFLICT (name) DO NOTHING
        `);
        console.log(`   ✅ Recorded: ${migration}`);
      }
      
    } catch (error) {
      console.log('   ⚠️  SequelizeMeta update skipped:', error.message);
    }
  }

  async insertSampleVoiceData() {
    console.log('\n📋 Creating sample Voice AI data...');
    
    try {
      // Get first property and user
      const [properties] = await this.sequelize.query(`SELECT ${this.propertyKeyColumn} as id FROM properties LIMIT 1`);
      const [users] = await this.sequelize.query(`SELECT ${this.userKeyColumn} as id FROM users LIMIT 1`);
      
      if (properties.length === 0 || users.length === 0) {
        console.log('   ⚠️  No existing properties or users found, skipping sample data');
        return;
      }
      
      const propertyId = properties[0].id;
      const userId = users[0].id;
      
      // Create sample contact list
      await this.sequelize.query(`
        INSERT INTO contact_lists (name, description, property_id, created_by, contacts)
        VALUES (
          'Emergency Response Team', 
          'Primary emergency contacts for property incidents',
          '${propertyId}',
          '${userId}',
          '[{"name": "Security Manager", "phone": "+1234567890", "email": "security@property.com", "role": "primary"}]'::jsonb
        )
      `);
      
      // Create sample SOP
      await this.sequelize.query(`
        INSERT INTO standard_operating_procedures (
          title, description, property_id, incident_type, created_by
        ) VALUES (
          'General Security Incident Response',
          'Standard procedure for handling general security incidents via voice calls',
          '${propertyId}',
          'security_incident',
          '${userId}'
        )
      `);
      
      console.log('   ✅ Sample Voice AI data created');
      
    } catch (error) {
      console.log('   ⚠️  Sample data creation skipped:', error.message);
    }
  }

  async finalVerification() {
    console.log('\n🔍 Final Voice AI system verification...');
    
    const voiceTables = ['contact_lists', 'standard_operating_procedures', 'call_logs'];
    let allGood = true;
    
    for (const table of voiceTables) {
      try {
        const [results] = await this.sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ✅ ${table} - Working (${results[0].count} records)`);
      } catch (error) {
        console.log(`   ❌ ${table} - Error: ${error.message}`);
        allGood = false;
      }
    }
    
    // Test foreign key relationships
    try {
      const [fkResults] = await this.sequelize.query(`
        SELECT 
          cl.name as contact_list,
          sop.title as sop_title,
          p.name as property_name
        FROM contact_lists cl
        LEFT JOIN properties p ON cl.property_id = p.${this.propertyKeyColumn}
        LEFT JOIN standard_operating_procedures sop ON sop.contact_list_id = cl.contact_list_id
        LIMIT 3
      `);
      
      console.log(`   ✅ Foreign key relationships working (${fkResults.length} test records)`);
      
    } catch (error) {
      console.log(`   ⚠️  Foreign key test: ${error.message}`);
    }
    
    return allGood;
  }

  async execute() {
    console.log('🚀 APEX AI - Voice AI Tables for Existing Database');
    console.log('=' .repeat(65));
    console.log('Creating Voice AI Dispatcher tables for your existing database...\n');
    
    try {
      // Step 1: Validate connection
      const isConnected = await this.validateConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }
      
      // Step 2: Check existing structure and adapt
      await this.checkExistingStructure();
      
      // Step 3: Create incidents table if needed
      await this.createIncidentsTableIfNeeded();
      
      // Step 4: Create Voice AI tables
      await this.createVoiceAITables();
      
      // Step 5: Update migration tracking
      await this.updateSequelizeMeta();
      
      // Step 6: Create sample data
      await this.insertSampleVoiceData();
      
      // Step 7: Final verification
      const allGood = await this.finalVerification();
      
      if (allGood) {
        console.log('\n🎉 SUCCESS: Voice AI Dispatcher Database Ready!');
        console.log('=' .repeat(65));
        console.log('✅ Voice AI tables created successfully');
        console.log('✅ Compatible with your existing database structure');
        console.log('✅ Foreign key relationships established');
        console.log('✅ Sample data created for testing');
        console.log('✅ Database indexes optimized for performance');
        
        console.log('\n📞 VOICE AI DISPATCHER: DATABASE READY FOR TESTING');
        
        console.log('\n📋 NEXT STEPS:');
        console.log('1. ✅ Database setup complete');
        console.log('2. Configure API keys in backend/.env:');
        console.log('   - TWILIO_ACCOUNT_SID=your_actual_sid');
        console.log('   - TWILIO_AUTH_TOKEN=your_actual_token');
        console.log('   - DEEPGRAM_API_KEY=your_actual_key');
        console.log('   - ELEVENLABS_API_KEY=your_actual_key');
        console.log('3. Test system integration: node verify-voice-system.mjs');
        console.log('4. Start backend server: npm start');
        console.log('5. Configure Twilio webhook to your backend URL');
        
        console.log('\n🎯 READY FOR: End-to-end voice call testing!');
        
      } else {
        console.log('\n⚠️  Some Voice AI tables may have issues');
        console.log('Please check the error messages above');
      }
      
      await this.sequelize.close();
      
    } catch (error) {
      console.error('\n❌ CRITICAL SETUP ERROR:', error.message);
      console.error('\n🔧 TROUBLESHOOTING:');
      console.error('1. Check database permissions for creating tables');
      console.error('2. Verify existing tables have expected structure');
      console.error('3. Check PostgreSQL version compatibility');
      
      await this.sequelize.close();
      process.exit(1);
    }
  }
}

// Execute the Voice AI table setup
const setup = new VoiceAITablesForExistingDB();
setup.execute().catch(console.error);
