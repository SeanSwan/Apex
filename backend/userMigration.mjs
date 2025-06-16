// userMigration.mjs
import sequelize from './config/database.mjs';
import { DataTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize chalk if not installed
let log = console.log;
try {
  // Try to use chalk if available
  if (chalk) {
    log = (message, ...args) => console.log(chalk.blue(message), ...args);
  }
} catch (error) {
  // Continue without chalk
  console.log('Chalk not available, continuing without colors');
}

async function createUserMigration() {
  try {
    log('🔄 Connecting to database...');
    await sequelize.authenticate();
    log('✅ Database connection established successfully.');

    log('📊 Checking if users table exists...');
    const [tables] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const tableExists = tables[0].exists;
    
    if (tableExists) {
      log('📋 Users table exists. Checking columns...');
      
      // Get existing columns
      const [columns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users';
      `);
      
      const existingColumns = columns.map(col => col.column_name);
      log(`📋 Found ${existingColumns.length} existing columns in users table.`);
      
      // Create missing columns
      const userColumns = {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        username: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        email: {
          type: DataTypes.STRING,
          unique: true
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false
        },
        role: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'user'
        },
        first_name: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'Admin'
        },
        last_name: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'User'
        },
        phone_number: {
          type: DataTypes.STRING
        },
        emergency_contact_name: {
          type: DataTypes.STRING
        },
        emergency_contact_phone: {
          type: DataTypes.STRING
        },
        profile_image: {
          type: DataTypes.STRING
        },
        address: {
          type: DataTypes.STRING
        },
        city: {
          type: DataTypes.STRING
        },
        state: {
          type: DataTypes.STRING
        },
        zip_code: {
          type: DataTypes.STRING
        },
        date_of_birth: {
          type: DataTypes.DATEONLY
        },
        hire_date: {
          type: DataTypes.DATEONLY
        },
        employee_id: {
          type: DataTypes.STRING,
          unique: true
        },
        security_license_number: {
          type: DataTypes.STRING
        },
        security_license_expiry: {
          type: DataTypes.DATEONLY
        },
        company_name: {
          type: DataTypes.STRING
        },
        company_position: {
          type: DataTypes.STRING
        },
        last_login: {
          type: DataTypes.DATE
        },
        reset_password_token: {
          type: DataTypes.STRING
        },
        reset_password_expires: {
          type: DataTypes.DATE
        },
        failed_login_attempts: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        account_locked: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        account_locked_until: {
          type: DataTypes.DATE
        },
        email_verified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        email_verification_token: {
          type: DataTypes.STRING
        },
        two_factor_auth_enabled: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        two_factor_auth_secret: {
          type: DataTypes.STRING
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        status: {
          type: DataTypes.STRING,
          defaultValue: 'pending'
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        },
        last_active: {
          type: DataTypes.DATE
        },
        notifications_enabled: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        time_zone: {
          type: DataTypes.STRING,
          defaultValue: 'America/New_York'
        },
        language_preference: {
          type: DataTypes.STRING,
          defaultValue: 'en-US'
        }
      };
      
      // Prepare alter table queries
      let alterTableQueries = [];
      for (const [columnName, columnDef] of Object.entries(userColumns)) {
        if (!existingColumns.includes(columnName)) {
          // Convert Sequelize types to PostgreSQL types
          let sqlType = 'VARCHAR(255)'; // Default
          if (columnDef.type === DataTypes.INTEGER) {
            sqlType = 'INTEGER';
          } else if (columnDef.type === DataTypes.BOOLEAN) {
            sqlType = 'BOOLEAN';
          } else if (columnDef.type === DataTypes.DATE) {
            sqlType = 'TIMESTAMP';
          } else if (columnDef.type === DataTypes.DATEONLY) {
            sqlType = 'DATE';
          }
          
          // Build the column definition
          let columnDefinition = `ADD COLUMN IF NOT EXISTS ${columnName} ${sqlType}`;
          
          // Add constraints if needed
          if (columnDef.allowNull === false) {
            // For NOT NULL columns, provide a default to avoid errors on existing data
            if (columnDef.defaultValue !== undefined) {
              let defaultValue = columnDef.defaultValue;
              
              // Format the default value based on its type
              if (typeof defaultValue === 'string') {
                defaultValue = `'${defaultValue}'`;
              } else if (defaultValue === DataTypes.NOW) {
                defaultValue = 'NOW()';
              } else if (typeof defaultValue === 'boolean') {
                defaultValue = defaultValue ? 'TRUE' : 'FALSE';
              }
              
              columnDefinition += ` DEFAULT ${defaultValue}`;
            }
            columnDefinition += ` NOT NULL`;
          }
          
          // Add unique constraint if needed
          if (columnDef.unique === true && columnName !== 'id') {
            // For unique columns, create a unique index instead of direct constraint
            // to avoid errors on existing data
            const uniqueIndexQuery = `
              CREATE UNIQUE INDEX IF NOT EXISTS idx_users_${columnName}_unique 
              ON users (${columnName})
              WHERE ${columnName} IS NOT NULL;
            `;
            alterTableQueries.push(uniqueIndexQuery);
          }
          
          // Add autoIncrement for id
          if (columnName === 'id' && columnDef.autoIncrement) {
            columnDefinition = `ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY`;
          }
          
          alterTableQueries.push(`ALTER TABLE users ${columnDefinition};`);
        }
      }
      
      // Execute all ALTER TABLE queries
      if (alterTableQueries.length > 0) {
        log(`🔄 Adding ${alterTableQueries.length} missing columns to users table...`);
        
        for (const query of alterTableQueries) {
          try {
            await sequelize.query(query);
            log(`✅ Executed: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);
          } catch (error) {
            log(`❌ Error executing query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);
            log(`   Error message: ${error.message}`);
            // Continue with next query
          }
        }
        
        log('✅ User table migration completed successfully!');
      } else {
        log('✅ All columns already exist in the users table. No migration needed.');
      }
    } else {
      log('📋 Users table does not exist. Creating the table...');
      
      // Create the users table with all columns
      await sequelize.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          email VARCHAR(255) UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(255) NOT NULL DEFAULT 'user',
          first_name VARCHAR(255) NOT NULL DEFAULT 'Admin',
          last_name VARCHAR(255) NOT NULL DEFAULT 'User',
          phone_number VARCHAR(255),
          emergency_contact_name VARCHAR(255),
          emergency_contact_phone VARCHAR(255),
          profile_image VARCHAR(255),
          address VARCHAR(255),
          city VARCHAR(255),
          state VARCHAR(255),
          zip_code VARCHAR(255),
          date_of_birth DATE,
          hire_date DATE,
          employee_id VARCHAR(255) UNIQUE,
          security_license_number VARCHAR(255),
          security_license_expiry DATE,
          company_name VARCHAR(255),
          company_position VARCHAR(255),
          last_login TIMESTAMP,
          reset_password_token VARCHAR(255),
          reset_password_expires TIMESTAMP,
          failed_login_attempts INTEGER DEFAULT 0,
          account_locked BOOLEAN DEFAULT FALSE,
          account_locked_until TIMESTAMP,
          email_verified BOOLEAN DEFAULT FALSE,
          email_verification_token VARCHAR(255),
          two_factor_auth_enabled BOOLEAN DEFAULT FALSE,
          two_factor_auth_secret VARCHAR(255),
          is_active BOOLEAN DEFAULT TRUE,
          status VARCHAR(255) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          last_active TIMESTAMP,
          notifications_enabled BOOLEAN DEFAULT TRUE,
          time_zone VARCHAR(255) DEFAULT 'America/New_York',
          language_preference VARCHAR(255) DEFAULT 'en-US'
        );
      `);
      
      log('✅ Users table created successfully!');
    }
    
    // Create an admin user if none exists
    log('👤 Checking for existing admin users...');
    const [adminUsers] = await sequelize.query(`
      SELECT * FROM users 
      WHERE role IN ('admin_ceo', 'admin_cto', 'admin_cfo', 'super_admin') 
      LIMIT 1;
    `);
    
    if (adminUsers.length === 0) {
      log('👤 No admin users found. Creating a default admin user...');
      
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await sequelize.query(`
        INSERT INTO users (
          username, email, password, role, first_name, last_name, 
          is_active, status, created_at, updated_at
        ) VALUES (
          'admin', 'admin@example.com', :password, 'admin_ceo', 'Admin', 'User',
          TRUE, 'active', NOW(), NOW()
        )
      `, {
        replacements: { password: hashedPassword }
      });
      
      log('✅ Default admin user created successfully!');
      log('   Username: admin');
      log('   Password: admin123');
    } else {
      log('✅ Admin user already exists. No need to create a default admin.');
    }
    
    log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
    log('🔌 Database connection closed.');
  }
}

// Execute the migration
createUserMigration();