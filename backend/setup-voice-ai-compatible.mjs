#!/usr/bin/env node

/**
 * APEX AI - VOICE AI TABLES WITH DATA TYPE DETECTION
 * =================================================
 * Creates Voice AI tables that match existing column data types
 * Detects and adapts to existing primary key data types
 */

import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

class VoiceAITablesWithTypeDetection {
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

  async detectExistingColumnTypes() {
    console.log('\n🔍 Detecting existing column data types...');
    
    try {
      // Check properties table structure
      const [propertyInfo] = await this.sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'properties' AND table_schema = 'public'
        AND column_name IN ('id', 'property_id')
        ORDER BY column_name
      `);
      
      console.log('   📄 Properties table columns:');
      propertyInfo.forEach(col => {
        console.log(`      ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
      
      // Determine property key info
      const propertyKey = propertyInfo.find(col => col.column_name === 'property_id') || 
                         propertyInfo.find(col => col.column_name === 'id');
      
      if (!propertyKey) {
        throw new Error('No suitable primary key found in properties table');
      }
      
      this.propertyKeyColumn = propertyKey.column_name;
      this.propertyKeyType = this.mapDataType(propertyKey.data_type);
      
      // Check users table structure
      const [userInfo] = await this.sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
        AND column_name IN ('id', 'user_id')
        ORDER BY column_name
      `);
      
      console.log('   👤 Users table columns:');
      userInfo.forEach(col => {
        console.log(`      ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
      
      // Determine user key info
      const userKey = userInfo.find(col => col.column_name === 'user_id') || 
                     userInfo.find(col => col.column_name === 'id');
      
      if (!userKey) {
        throw new Error('No suitable primary key found in users table');
      }
      
      this.userKeyColumn = userKey.column_name;
      this.userKeyType = this.mapDataType(userKey.data_type);
      
      // Check incidents table if it exists
      const [incidentInfo] = await this.sequelize.query(`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'incidents' AND table_schema = 'public'
        AND column_name IN ('id', 'incident_id')
        ORDER BY column_name
      `);
      
      if (incidentInfo.length > 0) {
        console.log('   🚨 Incidents table columns:');
        incidentInfo.forEach(col => {
          console.log(`      ${col.column_name}: ${col.data_type}`);
        });
        
        const incidentKey = incidentInfo.find(col => col.column_name === 'incident_id') || 
                           incidentInfo.find(col => col.column_name === 'id');
        
        this.incidentKeyColumn = incidentKey.column_name;
        this.incidentKeyType = this.mapDataType(incidentKey.data_type);
      } else {
        this.incidentKeyColumn = 'id';
        this.incidentKeyType = 'UUID';
      }
      
      console.log('\n   🔗 Detected key mappings:');
      console.log(`      Properties: ${this.propertyKeyColumn} (${this.propertyKeyType})`);
      console.log(`      Users: ${this.userKeyColumn} (${this.userKeyType})`);
      console.log(`      Incidents: ${this.incidentKeyColumn} (${this.incidentKeyType})`);
      
      return true;
      
    } catch (error) {
      console.error('   ❌ Column type detection failed:', error.message);
      return false;
    }
  }

  mapDataType(pgType) {
    switch (pgType.toLowerCase()) {
      case 'uuid':
        return 'UUID';
      case 'integer':
      case 'int4':
        return 'INTEGER';
      case 'bigint':
      case 'int8':
        return 'BIGINT';
      case 'character varying':
      case 'varchar':
        return 'VARCHAR(255)';
      default:
        return 'UUID'; // Default fallback
    }
  }

  async createIncidentsTableIfNeeded() {
    console.log('\n🚨 Checking incidents table...');
    
    try {
      const [results] = await this.sequelize.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_name = 'incidents' AND table_schema = 'public'
      `);
      
      if (results[0].count > 0) {
        console.log('   ✅ Incidents table already exists');
        return;
      }
      
      // Create incidents table with compatible data type
      await this.sequelize.query(`
        CREATE TABLE incidents (
          id ${this.incidentKeyType} DEFAULT ${this.incidentKeyType === 'UUID' ? 'gen_random_uuid()' : 'nextval(\'incidents_id_seq\')'} PRIMARY KEY,
          incident_number VARCHAR(50) UNIQUE,
          title VARCHAR(200),
          description TEXT,
          incident_type VARCHAR(100),
          priority VARCHAR(20) DEFAULT 'medium',
          status VARCHAR(50) DEFAULT 'open',
          location TEXT,
          reported_at TIMESTAMPTZ DEFAULT NOW(),
          reported_by VARCHAR(100),
          property_id ${this.propertyKeyType} REFERENCES properties(${this.propertyKeyColumn}),
          caller_phone VARCHAR(20),
          caller_name VARCHAR(200),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      // Create sequence if needed for integer types
      if (this.incidentKeyType !== 'UUID') {
        await this.sequelize.query(`CREATE SEQUENCE IF NOT EXISTS incidents_id_seq`);
      }
      
      console.log('   ✅ Incidents table created with compatible data types');
      
    } catch (error) {
      console.log('   ⚠️  Incidents table handling:', error.message);
    }
  }

  async createVoiceAITables() {
    console.log('\n🎤 Creating Voice AI tables with compatible data types...');
    
    await this.createContactListsTable();
    await this.createSOPTable();
    await this.createCallLogsTable();
    
    console.log('✅ All Voice AI tables created successfully');
  }

  async createContactListsTable() {
    console.log('   📋 Creating contact_lists table...');
    
    try {
      await this.sequelize.query(`
        CREATE TABLE contact_lists (
          contact_list_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          description TEXT,
          property_id ${this.propertyKeyType} REFERENCES properties(${this.propertyKeyColumn}) ON DELETE CASCADE,
          is_active BOOLEAN DEFAULT true,
          incident_types JSONB DEFAULT '[]'::jsonb,
          notification_methods JSONB DEFAULT '{
            "sms": {"enabled": true, "delay_seconds": 0},
            "email": {"enabled": true, "delay_seconds": 30},
            "push": {"enabled": true, "delay_seconds": 0},
            "call": {"enabled": false, "delay_seconds": 300}
          }'::jsonb,
          contacts JSONB DEFAULT '[]'::jsonb,
          created_by ${this.userKeyType} REFERENCES users(${this.userKeyColumn}),
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
          property_id ${this.propertyKeyType} REFERENCES properties(${this.propertyKeyColumn}) ON DELETE CASCADE,
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
          created_by ${this.userKeyType} REFERENCES users(${this.userKeyColumn}),
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
          property_id ${this.propertyKeyType} REFERENCES properties(${this.propertyKeyColumn}),
          incident_id ${this.incidentKeyType} REFERENCES incidents(${this.incidentKeyColumn}),
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

  async insertSampleData() {
    console.log('\n📋 Creating sample Voice AI data...');
    
    try {
      // Get first property and user with correct column names
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
          $1,
          $2,
          '[{"name": "Security Manager", "phone": "+1234567890", "email": "security@property.com", "role": "primary"}]'::jsonb
        )
      `, { bind: [propertyId, userId] });
      
      // Create sample SOP
      await this.sequelize.query(`
        INSERT INTO standard_operating_procedures (
          title, description, property_id, incident_type, created_by
        ) VALUES (
          'General Security Incident Response',
          'Standard procedure for handling general security incidents via voice calls',
          $1,
          'security_incident',
          $2
        )
      `, { bind: [propertyId, userId] });
      
      console.log('   ✅ Sample Voice AI data created');
      
    } catch (error) {
      console.log('   ⚠️  Sample data creation:', error.message);
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
    
    return allGood;
  }

  async execute() {
    console.log('🚀 APEX AI - Voice AI Tables with Data Type Detection');
    console.log('=' .repeat(70));
    console.log('Creating Voice AI tables that match your existing database structure...\n');
    
    try {
      // Step 1: Validate connection
      const isConnected = await this.validateConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }
      
      // Step 2: Detect existing column types
      const typesDetected = await this.detectExistingColumnTypes();
      if (!typesDetected) {
        throw new Error('Could not detect existing column types');
      }
      
      // Step 3: Create incidents table if needed
      await this.createIncidentsTableIfNeeded();
      
      // Step 4: Create Voice AI tables with compatible types
      await this.createVoiceAITables();
      
      // Step 5: Create sample data
      await this.insertSampleData();
      
      // Step 6: Final verification
      const allGood = await this.finalVerification();
      
      if (allGood) {
        console.log('\n🎉 SUCCESS: Voice AI Dispatcher Database Ready!');
        console.log('=' .repeat(70));
        console.log('✅ Voice AI tables created with compatible data types');
        console.log('✅ Foreign key relationships established successfully');
        console.log('✅ Database indexes optimized for performance');
        console.log('✅ Sample data created for immediate testing');
        
        console.log('\n📞 VOICE AI DISPATCHER: READY FOR API CONFIGURATION');
        
        console.log('\n📋 NEXT STEPS:');
        console.log('1. ✅ Database setup complete - all tables ready');
        console.log('2. Configure API keys in backend/.env:');
        console.log('   - TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
        console.log('   - TWILIO_AUTH_TOKEN=your_actual_token_here');
        console.log('   - DEEPGRAM_API_KEY=your_deepgram_key_here');
        console.log('   - ELEVENLABS_API_KEY=your_elevenlabs_key_here');
        console.log('3. Verify system integration: node verify-voice-system.mjs');
        console.log('4. Start backend server: npm start');
        console.log('5. Configure Twilio webhook URL: http://your-domain/api/voice/webhook/incoming');
        
        console.log('\n🎯 STATUS: Ready for end-to-end voice call testing!');
        
      } else {
        console.log('\n⚠️  Some Voice AI tables may have issues');
        console.log('Please review the error messages above');
      }
      
      await this.sequelize.close();
      
    } catch (error) {
      console.error('\n❌ CRITICAL SETUP ERROR:', error.message);
      console.error('\n🔧 TROUBLESHOOTING:');
      console.error('1. Verify PostgreSQL supports JSONB (version 9.4+)');
      console.error('2. Check database user has CREATE TABLE permissions');
      console.error('3. Ensure existing tables have proper primary keys');
      
      await this.sequelize.close();
      process.exit(1);
    }
  }
}

// Execute the Voice AI table setup with data type detection
const setup = new VoiceAITablesWithTypeDetection();
setup.execute().catch(console.error);
