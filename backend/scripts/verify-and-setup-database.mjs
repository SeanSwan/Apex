#!/usr/bin/env node

/**
 * APEX AI - DATABASE VERIFICATION & SETUP
 * =======================================
 * Checks current database state and creates missing tables if needed
 */

import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

class DatabaseChecker {
  constructor() {
    this.sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT) || 5432,
      database: process.env.PG_DB || 'apex',
      username: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      logging: false
    });
  }

  async validateConnection() {
    console.log('🔌 Testing database connection...');
    try {
      await this.sequelize.authenticate();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async checkRequiredTables() {
    console.log('\n📋 Checking required tables...');
    
    const requiredTables = [
      'Clients',
      'Properties', 
      'Users',
      'Incidents',
      'EvidenceFiles'
    ];
    
    const missingTables = [];
    const existingTables = [];
    
    for (const table of requiredTables) {
      try {
        const [results] = await this.sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = :tableName
          )
        `, {
          replacements: { tableName: table },
          type: this.sequelize.QueryTypes.SELECT
        });
        
        if (results.exists) {
          console.log(`   ✅ ${table} - exists`);
          existingTables.push(table);
        } else {
          console.log(`   ❌ ${table} - missing`);
          missingTables.push(table);
        }
      } catch (error) {
        console.log(`   ❌ ${table} - error checking: ${error.message}`);
        missingTables.push(table);
      }
    }
    
    return { existingTables, missingTables };
  }

  async createMissingTables() {
    console.log('\n🔧 Creating missing tables...');
    
    // Create Clients table
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Clients" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        "phoneNumber" VARCHAR(20),
        address TEXT,
        "contractStart" DATE,
        "contractEnd" DATE,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ Clients table ready');

    // Create Properties table
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Properties" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        "clientId" INTEGER REFERENCES "Clients"(id) ON DELETE CASCADE,
        "propertyType" VARCHAR(100),
        "accessCodes" JSONB,
        "specialInstructions" TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ Properties table ready');

    // Create Users table
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Users" (
        id SERIAL PRIMARY KEY,
        "firstName" VARCHAR(255) NOT NULL,
        "lastName" VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'guard',
        "clientId" INTEGER REFERENCES "Clients"(id) ON DELETE SET NULL,
        "phoneNumber" VARCHAR(20),
        "isActive" BOOLEAN DEFAULT true,
        "clientPermissions" JSONB,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ Users table ready');

    // Create Incidents table
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Incidents" (
        id SERIAL PRIMARY KEY,
        "incidentNumber" VARCHAR(100) UNIQUE NOT NULL,
        "propertyId" INTEGER NOT NULL REFERENCES "Properties"(id) ON DELETE CASCADE,
        "clientId" INTEGER NOT NULL REFERENCES "Clients"(id) ON DELETE CASCADE,
        "incidentType" VARCHAR(100) NOT NULL,
        severity VARCHAR(50) DEFAULT 'low',
        status VARCHAR(50) DEFAULT 'reported',
        location VARCHAR(255),
        description TEXT NOT NULL,
        "incidentDate" TIMESTAMPTZ NOT NULL,
        "aiConfidence" DECIMAL(5,2),
        "reportedBy" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
        "resolvedAt" TIMESTAMPTZ,
        "resolvedBy" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
        "resolutionNotes" TEXT,
        "authoritiesContacted" BOOLEAN DEFAULT false,
        "authoritiesReportNumber" VARCHAR(100),
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ Incidents table ready');

    // Create EvidenceFiles table
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "EvidenceFiles" (
        id SERIAL PRIMARY KEY,
        "incidentId" INTEGER NOT NULL REFERENCES "Incidents"(id) ON DELETE CASCADE,
        "originalFileName" VARCHAR(255) NOT NULL,
        "fileType" VARCHAR(50) NOT NULL,
        "fileSize" BIGINT NOT NULL,
        "filePath" VARCHAR(500) NOT NULL,
        "thumbnailPath" VARCHAR(500),
        "watermarkPath" VARCHAR(500),
        "isClientAccessible" BOOLEAN DEFAULT true,
        metadata JSONB DEFAULT '{}',
        "uploadedBy" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('   ✅ EvidenceFiles table ready');

    // Create indexes for better performance
    await this.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_properties_client_id ON "Properties"("clientId");
      CREATE INDEX IF NOT EXISTS idx_users_client_id ON "Users"("clientId");
      CREATE INDEX IF NOT EXISTS idx_users_email ON "Users"(email);
      CREATE INDEX IF NOT EXISTS idx_incidents_property_id ON "Incidents"("propertyId");
      CREATE INDEX IF NOT EXISTS idx_incidents_client_id ON "Incidents"("clientId");
      CREATE INDEX IF NOT EXISTS idx_incidents_type ON "Incidents"("incidentType");
      CREATE INDEX IF NOT EXISTS idx_incidents_severity ON "Incidents"(severity);
      CREATE INDEX IF NOT EXISTS idx_incidents_status ON "Incidents"(status);
      CREATE INDEX IF NOT EXISTS idx_incidents_date ON "Incidents"("incidentDate");
      CREATE INDEX IF NOT EXISTS idx_evidence_incident_id ON "EvidenceFiles"("incidentId");
      CREATE INDEX IF NOT EXISTS idx_evidence_type ON "EvidenceFiles"("fileType");
    `);
    console.log('   ✅ Database indexes created');
  }

  async execute() {
    console.log('🚀 APEX AI - DATABASE VERIFICATION & SETUP');
    console.log('=' .repeat(70));
    
    try {
      // Step 1: Test connection
      const isConnected = await this.validateConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to database');
      }
      
      // Step 2: Check required tables
      const { existingTables, missingTables } = await this.checkRequiredTables();
      
      // Step 3: Create missing tables if needed
      if (missingTables.length > 0) {
        console.log(`\n⚠️  Found ${missingTables.length} missing tables. Creating them now...`);
        await this.createMissingTables();
      } else {
        console.log('\n✅ All required tables exist!');
      }
      
      // Step 4: Final verification
      console.log('\n🔍 Final verification...');
      const { existingTables: finalCheck } = await this.checkRequiredTables();
      
      if (finalCheck.length >= 5) {
        console.log('\n🎉 SUCCESS: Database is ready for client portal!');
        console.log('=' .repeat(70));
        console.log('✅ All core tables exist and are accessible');
        console.log('✅ Database indexes created for optimal performance');
        console.log('✅ Ready for test data population');
        
        console.log('\n📋 NEXT STEP:');
        console.log('Run: node scripts/populate-test-data.mjs');
      } else {
        throw new Error('Database setup verification failed');
      }
      
      await this.sequelize.close();
      
    } catch (error) {
      console.error('\n❌ ERROR:', error.message);
      console.error('\n🔧 TROUBLESHOOTING:');
      console.error('1. Make sure PostgreSQL is running');
      console.error('2. Verify database credentials in .env file');
      console.error('3. Ensure database "apex" exists');
      console.error('4. Check user permissions');
      
      await this.sequelize.close();
      process.exit(1);
    }
  }
}

// Execute the database verification and setup
const checker = new DatabaseChecker();
checker.execute().catch(console.error);
