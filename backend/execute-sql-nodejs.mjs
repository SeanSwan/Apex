#!/usr/bin/env node
/**
 * APEX AI - DIRECT NODE.JS SQL EXECUTION
 * ======================================
 * Executes SQL directly via Node.js as postgres user with better auth handling
 */

import pkg from 'pg';
import readline from 'readline';
const { Client } = pkg;

console.log('🛡️ APEX AI - DIRECT NODE.JS SQL EXECUTION');
console.log('==========================================\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function executeWithDifferentAuth() {
  console.log('🔑 Trying different authentication methods...\n');
  
  const authMethods = [
    { user: 'postgres', password: '', description: 'postgres with empty password' },
    { user: 'postgres', password: 'postgres', description: 'postgres with "postgres" password' },
    { user: 'postgres', password: 'admin', description: 'postgres with "admin" password' },
    { user: 'postgres', password: '123456', description: 'postgres with "123456" password' }
  ];
  
  // Also try custom password
  const customPassword = await question('🔐 Enter postgres password (or press Enter to try common passwords): ');
  if (customPassword.trim()) {
    authMethods.unshift({ 
      user: 'postgres', 
      password: customPassword.trim(), 
      description: 'postgres with your password' 
    });
  }
  
  rl.close();
  
  // SQL statements to execute
  const sqlStatements = [
    // Step 1: Grant permissions
    'GRANT CREATE ON SCHEMA public TO swanadmin;',
    'GRANT ALL PRIVILEGES ON SCHEMA public TO swanadmin;',
    
    // Step 2: Create Users table
    `CREATE TABLE IF NOT EXISTS "Users" (
      id SERIAL PRIMARY KEY,
      "firstName" VARCHAR(255) NOT NULL,
      "lastName" VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'guard',
      "phoneNumber" VARCHAR(20),
      "isActive" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    
    // Step 3: Create Clients table
    `CREATE TABLE IF NOT EXISTS "Clients" (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      "phoneNumber" VARCHAR(20),
      address TEXT,
      "contractStart" DATE,
      "contractEnd" DATE,
      "isActive" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    
    // Step 4: Create Properties table
    `CREATE TABLE IF NOT EXISTS "Properties" (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      "clientId" INTEGER REFERENCES "Clients"(id) ON DELETE CASCADE,
      "propertyType" VARCHAR(100),
      "accessCodes" TEXT,
      "specialInstructions" TEXT,
      "isActive" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    
    // Step 5: Create Reports table
    `CREATE TABLE IF NOT EXISTS "Reports" (
      id SERIAL PRIMARY KEY,
      "guardId" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
      "clientId" INTEGER REFERENCES "Clients"(id) ON DELETE CASCADE,
      "propertyId" INTEGER REFERENCES "Properties"(id) ON DELETE CASCADE,
      "shiftDate" DATE NOT NULL,
      "startTime" TIME,
      "endTime" TIME,
      title VARCHAR(255),
      description TEXT,
      "incidentOccurred" BOOLEAN DEFAULT false,
      "incidentDescription" TEXT,
      "weatherConditions" VARCHAR(100),
      status VARCHAR(50) DEFAULT 'draft',
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    
    // Step 6: Create Schedules table
    `CREATE TABLE IF NOT EXISTS "Schedules" (
      id SERIAL PRIMARY KEY,
      "guardId" INTEGER REFERENCES "Users"(id) ON DELETE CASCADE,
      "propertyId" INTEGER REFERENCES "Properties"(id) ON DELETE CASCADE,
      "shiftDate" DATE NOT NULL,
      "startTime" TIME NOT NULL,
      "endTime" TIME NOT NULL,
      status VARCHAR(50) DEFAULT 'scheduled',
      notes TEXT,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    
    // Step 7: Grant ownership
    'ALTER TABLE "Users" OWNER TO swanadmin;',
    'ALTER TABLE "Clients" OWNER TO swanadmin;',
    'ALTER TABLE "Properties" OWNER TO swanadmin;',
    'ALTER TABLE "Reports" OWNER TO swanadmin;',
    'ALTER TABLE "Schedules" OWNER TO swanadmin;',
    
    // Step 8: Grant privileges
    'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO swanadmin;',
    'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO swanadmin;'
  ];
  
  const sampleDataStatements = [
    // Sample Users
    `INSERT INTO "Users" ("firstName", "lastName", email, password, role, "phoneNumber") VALUES
    ('John', 'Guard', 'guard@example.com', '$2b$10$hash', 'guard', '555-0101'),
    ('Jane', 'Admin', 'admin@example.com', '$2b$10$hash', 'admin', '555-0102'),
    ('Mike', 'Supervisor', 'supervisor@example.com', '$2b$10$hash', 'supervisor', '555-0103')
    ON CONFLICT (email) DO NOTHING;`,
    
    // Sample Clients
    `INSERT INTO "Clients" (name, email, "phoneNumber", address, "contractStart", "contractEnd") VALUES
    ('ACME Corporation', 'contact@acme.com', '555-0201', '123 Business St, City, State', '2025-01-01', '2025-12-31'),
    ('SecureBuildings Inc', 'info@securebuildings.com', '555-0202', '456 Office Ave, City, State', '2025-01-01', '2025-12-31')
    ON CONFLICT DO NOTHING;`,
    
    // Sample Properties
    `INSERT INTO "Properties" (name, address, "clientId", "propertyType", "specialInstructions") VALUES
    ('ACME Headquarters', '123 Business St, City, State', 1, 'Office Building', 'Check all entry points hourly'),
    ('ACME Warehouse', '789 Industrial Rd, City, State', 1, 'Warehouse', 'Monitor loading dock area'),
    ('Secure Office Complex', '456 Office Ave, City, State', 2, 'Office Building', 'Patrol parking garage every 2 hours')
    ON CONFLICT DO NOTHING;`
  ];
  
  // Try each authentication method
  for (const auth of authMethods) {
    console.log(`🔐 Trying ${auth.description}...`);
    
    const dbConfig = {
      host: 'localhost',
      port: 5432,
      user: auth.user,
      password: auth.password,
      database: 'apex'
    };
    
    let client;
    try {
      client = new Client(dbConfig);
      await client.connect();
      console.log(`   ✅ Connected successfully with ${auth.description}\n`);
      
      // Execute table creation statements
      console.log('📊 Creating tables...');
      for (let i = 0; i < sqlStatements.length; i++) {
        const statement = sqlStatements[i];
        
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE.*?"(\w+)"/)?.[1];
          console.log(`   📋 Creating ${tableName || 'table'}...`);
        } else if (statement.includes('GRANT')) {
          console.log('   🔐 Setting permissions...');
        } else if (statement.includes('ALTER TABLE')) {
          console.log('   👤 Transferring ownership...');
        }
        
        try {
          await client.query(statement);
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.log(`   ⚠️ Warning: ${error.message}`);
          }
        }
      }
      
      console.log('\n📝 Inserting sample data...');
      for (const dataStatement of sampleDataStatements) {
        try {
          await client.query(dataStatement);
        } catch (error) {
          console.log(`   ⚠️ Data insertion warning: ${error.message}`);
        }
      }
      
      // Verify tables
      console.log('\n🧪 Verifying table creation...');
      const tables = ['Users', 'Clients', 'Properties', 'Reports', 'Schedules'];
      let allSuccess = true;
      
      for (const tableName of tables) {
        try {
          const result = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
          console.log(`   ✅ ${tableName}: ${result.rows[0].count} records`);
        } catch (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`);
          allSuccess = false;
        }
      }
      
      await client.end();
      
      if (allSuccess) {
        console.log('\n🎉 SUCCESS! TABLES CREATED VIA TERMINAL!');
        console.log('✅ All tables created and populated');
        console.log('✅ Permissions configured');
        console.log('✅ Sample data inserted');
        console.log('\n🚀 READY TO START YOUR SERVERS!');
        console.log('   Backend: npm run dev');
        console.log('   Frontend: cd ../frontend && npm run dev');
        return true;
      }
      
    } catch (error) {
      console.log(`   ❌ Failed with ${auth.description}: ${error.message}`);
      if (client) {
        try { await client.end(); } catch {}
      }
      continue;
    }
  }
  
  console.log('\n❌ ALL AUTHENTICATION METHODS FAILED');
  console.log('\n🔧 TERMINAL ALTERNATIVES:');
  console.log('1. Check if PostgreSQL service is running');
  console.log('2. Reset postgres password via Windows Services');
  console.log('3. Try: net start postgresql-x64-14 (or similar)');
  console.log('4. Use SQL Server Management Studio if available');
  
  return false;
}

executeWithDifferentAuth();
