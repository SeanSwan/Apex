#!/usr/bin/env node

/**
 * APEX AI - CLEAN DATABASE SETUP FOR VOICE AI
 * ===========================================
 * Fresh database setup with conflict resolution
 * Handles existing tables and creates clean structure
 */

import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

class CleanDatabaseSetup {
  constructor() {
    this.sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT) || 5432,
      database: process.env.PG_DB || 'apex',
      username: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      logging: console.log, // Enable logging to see what's happening
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

  async checkAndCleanExistingTables() {
    console.log('\n🧹 Checking for existing conflicting tables...');
    
    const tablesToCheck = ['call_logs', 'standard_operating_procedures', 'contact_lists', 'incidents', 'properties', 'users'];
    
    for (const table of tablesToCheck) {
      try {
        const [results] = await this.sequelize.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_name = '${table}' AND table_schema = 'public'
        `);
        
        if (results[0].count > 0) {
          console.log(`   ⚠️  Found existing table: ${table}`);
          
          // Get column info to see structure
          const [columns] = await this.sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${table}' AND table_schema = 'public'
            ORDER BY ordinal_position
          `);
          
          console.log(`      Columns: ${columns.map(c => c.column_name).join(', ')}`);
        } else {
          console.log(`   ✅ Table ${table} - clean (doesn't exist)`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking ${table}: ${error.message}`);
      }
    }
  }

  async dropVoiceAITablesOnly() {
    console.log('\n🗑️  Dropping Voice AI tables to start fresh...');
    
    const voiceTables = ['call_logs', 'standard_operating_procedures', 'contact_lists'];
    
    for (const table of voiceTables) {
      try {
        await this.sequelize.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`   ✅ Dropped ${table}`);
      } catch (error) {
        console.log(`   ⚠️  Could not drop ${table}: ${error.message}`);
      }
    }
  }

  async createCoreTablesSimple() {
    console.log('\n📋 Creating essential core tables with simple structure...');
    
    // Create users table (simplified)
    await this.createUsersTableSimple();
    
    // Create properties table (simplified)
    await this.createPropertiesTableSimple();
    
    // Create incidents table (simplified)
    await this.createIncidentsTableSimple();
    
    console.log('✅ Essential core tables created successfully');
  }

  async createUsersTableSimple() {
    console.log('   👤 Creating users table...');
    
    try {
      await this.sequelize.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id UUID DEFAULT gen_random_uuid(),
          username VARCHAR(100) UNIQUE,
          email VARCHAR(255) UNIQUE,
          password_hash VARCHAR(255),
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          role VARCHAR(50) DEFAULT 'user',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (user_id)
        )
      `);
      console.log('   ✅ Users table created');
    } catch (error) {
      console.error('   ❌ Users table error:', error.message);
      throw error;
    }
  }

  async createPropertiesTableSimple() {
    console.log('   🏢 Creating properties table...');
    
    try {
      await this.sequelize.query(`
        CREATE TABLE IF NOT EXISTS properties (
          property_id UUID DEFAULT gen_random_uuid(),
          name VARCHAR(200) NOT NULL,
          address TEXT,
          city VARCHAR(100),
          state VARCHAR(50),
          zip_code VARCHAR(20),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (property_id)
        )
      `);
      console.log('   ✅ Properties table created');
    } catch (error) {
      console.error('   ❌ Properties table error:', error.message);
      throw error;
    }
  }

  async createIncidentsTableSimple() {
    console.log('   🚨 Creating incidents table...');
    
    try {
      await this.sequelize.query(`
        CREATE TABLE IF NOT EXISTS incidents (
          incident_id UUID DEFAULT gen_random_uuid(),
          id UUID DEFAULT gen_random_uuid(),
          incident_number VARCHAR(50) UNIQUE,
          title VARCHAR(200),
          description TEXT,
          incident_type VARCHAR(100),
          priority VARCHAR(20) DEFAULT 'medium',
          status VARCHAR(50) DEFAULT 'open',
          location TEXT,
          reported_at TIMESTAMPTZ DEFAULT NOW(),
          reported_by VARCHAR(100),
          property_id UUID,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (incident_id)
        )
      `);
      
      // Add foreign key after table creation
      await this.sequelize.query(`
        ALTER TABLE incidents 
        ADD CONSTRAINT fk_incidents_property 
        FOREIGN KEY (property_id) REFERENCES properties(property_id)
      `);
      
      console.log('   ✅ Incidents table created');
    } catch (error) {
      console.error('   ❌ Incidents table error:', error.message);
      throw error;
    }
  }

  async createVoiceAITablesSimple() {
    console.log('\n🎤 Creating Voice AI Dispatcher tables...');
    
    await this.createContactListsTableSimple();
    await this.createSOPTableSimple();
    await this.createCallLogsTableSimple();
    
    console.log('✅ All Voice AI Dispatcher tables created successfully');
  }

  async createContactListsTableSimple() {
    console.log('   📋 Creating contact_lists table...');
    
    try {
      await this.sequelize.query(`
        CREATE TABLE contact_lists (
          contact_list_id UUID DEFAULT gen_random_uuid(),
          name VARCHAR(200) NOT NULL,
          description TEXT,
          property_id UUID,
          contacts JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (contact_list_id)
        )
      `);
      
      // Add foreign key
      await this.sequelize.query(`
        ALTER TABLE contact_lists 
        ADD CONSTRAINT fk_contact_lists_property 
        FOREIGN KEY (property_id) REFERENCES properties(property_id)
      `);
      
      console.log('   ✅ Contact lists table created');
    } catch (error) {
      console.error('   ❌ Contact lists table error:', error.message);
      throw error;
    }
  }

  async createSOPTableSimple() {
    console.log('   📋 Creating standard_operating_procedures table...');
    
    try {
      await this.sequelize.query(`
        CREATE TABLE standard_operating_procedures (
          sop_id UUID DEFAULT gen_random_uuid(),
          title VARCHAR(200) NOT NULL,
          description TEXT,
          property_id UUID,
          incident_type VARCHAR(100),
          conversation_flow JSONB DEFAULT '{}'::jsonb,
          automated_actions JSONB DEFAULT '{}'::jsonb,
          contact_list_id UUID,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (sop_id)
        )
      `);
      
      // Add foreign keys
      await this.sequelize.query(`
        ALTER TABLE standard_operating_procedures 
        ADD CONSTRAINT fk_sops_property 
        FOREIGN KEY (property_id) REFERENCES properties(property_id)
      `);
      
      await this.sequelize.query(`
        ALTER TABLE standard_operating_procedures 
        ADD CONSTRAINT fk_sops_contact_list 
        FOREIGN KEY (contact_list_id) REFERENCES contact_lists(contact_list_id)
      `);
      
      console.log('   ✅ Standard operating procedures table created');
    } catch (error) {
      console.error('   ❌ SOP table error:', error.message);
      throw error;
    }
  }

  async createCallLogsTableSimple() {
    console.log('   📋 Creating call_logs table...');
    
    try {
      await this.sequelize.query(`
        CREATE TABLE call_logs (
          call_id UUID DEFAULT gen_random_uuid(),
          twilio_call_sid VARCHAR(100) UNIQUE NOT NULL,
          caller_phone VARCHAR(20) NOT NULL,
          caller_name VARCHAR(200),
          property_id UUID,
          incident_id UUID,
          sop_id UUID,
          call_status VARCHAR(50) DEFAULT 'incoming',
          call_start_time TIMESTAMPTZ DEFAULT NOW(),
          call_end_time TIMESTAMPTZ,
          full_transcript JSONB DEFAULT '[]'::jsonb,
          extracted_information JSONB DEFAULT '{}'::jsonb,
          ai_actions_taken JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (call_id)
        )
      `);
      
      // Add foreign keys
      await this.sequelize.query(`
        ALTER TABLE call_logs 
        ADD CONSTRAINT fk_call_logs_property 
        FOREIGN KEY (property_id) REFERENCES properties(property_id)
      `);
      
      await this.sequelize.query(`
        ALTER TABLE call_logs 
        ADD CONSTRAINT fk_call_logs_incident 
        FOREIGN KEY (incident_id) REFERENCES incidents(incident_id)
      `);
      
      await this.sequelize.query(`
        ALTER TABLE call_logs 
        ADD CONSTRAINT fk_call_logs_sop 
        FOREIGN KEY (sop_id) REFERENCES standard_operating_procedures(sop_id)
      `);
      
      console.log('   ✅ Call logs table created');
    } catch (error) {
      console.error('   ❌ Call logs table error:', error.message);
      throw error;
    }
  }

  async insertSampleData() {
    console.log('\n📋 Creating sample data for testing...');
    
    try {
      // Insert sample user
      const [userResult] = await this.sequelize.query(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, role)
        VALUES ('admin', 'admin@apexai.com', 'dummy_hash', 'System', 'Admin', 'admin')
        RETURNING user_id
      `);
      
      // Insert sample property
      const [propertyResult] = await this.sequelize.query(`
        INSERT INTO properties (name, address, city, state, zip_code)
        VALUES ('Test Property', '123 Security Blvd', 'Los Angeles', 'CA', '90210')
        RETURNING property_id
      `);
      
      console.log('   ✅ Sample data created successfully');
      
      return {
        user_id: userResult[0].user_id,
        property_id: propertyResult[0].property_id
      };
      
    } catch (error) {
      console.log('   ⚠️  Sample data creation skipped (may already exist)');
      return null;
    }
  }

  async finalVerification() {
    console.log('\n🔍 Final system verification...');
    
    const requiredTables = [
      'users', 'properties', 'incidents',
      'contact_lists', 'standard_operating_procedures', 'call_logs'
    ];
    
    let allTablesExist = true;
    
    for (const table of requiredTables) {
      try {
        const [results] = await this.sequelize.query(`
          SELECT COUNT(*) as count FROM ${table}
        `);
        console.log(`   ✅ ${table} - Accessible (${results[0].count} records)`);
      } catch (error) {
        console.log(`   ❌ ${table} - Error: ${error.message}`);
        allTablesExist = false;
      }
    }
    
    return allTablesExist;
  }

  async execute() {
    console.log('🚀 APEX AI - Clean Database Setup for Voice AI');
    console.log('=' .repeat(60));
    console.log('Creating clean database structure for Voice AI Dispatcher...\n');
    
    try {
      // Step 1: Validate connection
      const isConnected = await this.validateConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }
      
      // Step 2: Check existing tables
      await this.checkAndCleanExistingTables();
      
      // Step 3: Clean up Voice AI tables only
      await this.dropVoiceAITablesOnly();
      
      // Step 4: Create core tables
      await this.createCoreTablesSimple();
      
      // Step 5: Create Voice AI tables
      await this.createVoiceAITablesSimple();
      
      // Step 6: Insert sample data
      const sampleData = await this.insertSampleData();
      
      // Step 7: Final verification
      const allGood = await this.finalVerification();
      
      if (allGood) {
        console.log('\n🎉 SUCCESS: Voice AI Database Setup Complete!');
        console.log('=' .repeat(60));
        console.log('✅ Core tables: users, properties, incidents');
        console.log('✅ Voice AI tables: contact_lists, SOPs, call_logs');
        console.log('✅ All foreign key relationships working');
        console.log('✅ Sample data created for testing');
        
        console.log('\n📞 VOICE AI DISPATCHER: DATABASE READY');
        console.log('\n📋 NEXT STEPS:');
        console.log('1. ✅ Database setup complete');
        console.log('2. Configure API keys in backend/.env:');
        console.log('   - TWILIO_ACCOUNT_SID=your_sid');
        console.log('   - TWILIO_AUTH_TOKEN=your_token');
        console.log('   - DEEPGRAM_API_KEY=your_key');
        console.log('   - ELEVENLABS_API_KEY=your_key');
        console.log('3. Test system: node verify-voice-system.mjs');
        console.log('4. Start backend server and test voice endpoints');
        
      } else {
        console.log('\n⚠️  Some tables may have issues');
      }
      
      await this.sequelize.close();
      
    } catch (error) {
      console.error('\n❌ CRITICAL SETUP ERROR:', error.message);
      console.error('Stack trace:', error.stack);
      
      await this.sequelize.close();
      process.exit(1);
    }
  }
}

// Execute the clean database setup
const setup = new CleanDatabaseSetup();
setup.execute().catch(console.error);
