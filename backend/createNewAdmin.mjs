// createNewAdmin.mjs
import bcrypt from 'bcryptjs';
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find and load .env file
const envPath = path.resolve(__dirname, '.env');
console.log(`📁 Loading environment from: ${envPath}`);
dotenv.config({ path: envPath });

// Database connection parameters
const dbConfig = {
  database: process.env.PG_DB || 'apex',
  username: process.env.PG_USER || 'swanadmin',
  password: process.env.PG_PASSWORD || '',
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT) || 5432
};

console.log('📊 Database connection parameters:');
console.log(`- Database: ${dbConfig.database}`);
console.log(`- User: ${dbConfig.username}`);
console.log(`- Host: ${dbConfig.host}`);
console.log(`- Port: ${dbConfig.port}`);
console.log(`- Password is set: ${!!dbConfig.password}`);

// Create connection
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'postgres',
    logging: false,
  }
);

// Define minimalist User model
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user'
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true
});

async function createAdmin() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Connected to the database successfully.');

    // Define admin user
    const adminUsername = 'ogpswan';
    const adminPassword = '7777777';
    const adminEmail = 'ogpswan@example.com';
    
    // Hash the password using bcrypt with 10 salt rounds (the same as your application)
    console.log(`🔐 Hashing password for user '${adminUsername}'...`);
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    console.log(`🔑 Generated password hash: ${hashedPassword}`);
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { username: adminUsername } });
    
    if (existingUser) {
      console.log(`⚠️ User '${adminUsername}' already exists. Updating password...`);
      
      // Update the user
      await existingUser.update({
        password: hashedPassword,
        role: 'super_admin',
        first_name: 'Admin',
        last_name: 'User',
        email: adminEmail,
        is_active: true,
        status: 'active',
        failed_login_attempts: 0,
        account_locked: false,
        account_locked_until: null
      });
      
      console.log(`✅ User '${adminUsername}' updated successfully.`);
    } else {
      console.log(`👤 Creating new admin user '${adminUsername}'...`);
      
      // Create new user
      await User.create({
        username: adminUsername,
        password: hashedPassword,
        email: adminEmail,
        role: 'super_admin',
        first_name: 'Admin',
        last_name: 'User',
        is_active: true,
        status: 'active'
      });
      
      console.log(`✅ Admin user '${adminUsername}' created successfully.`);
    }
    
    // Print the user details
    const user = await User.findOne({
      where: { username: adminUsername },
      attributes: { exclude: ['password'] }
    });
    
    console.log(`\n📋 Admin user details:`);
    console.log(user.toJSON());
    
    console.log(`\n🔐 Login credentials:`);
    console.log(`Username: ${adminUsername}`);
    console.log(`Password: ${adminPassword}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.name === 'SequelizeConnectionError') {
      console.log('\n🔍 Database Connection Troubleshooting:');
      console.log('1. Check if PostgreSQL is running');
      console.log('2. Verify your database name, username, and password');
      console.log('3. Ensure the database server is accessible from this machine');
    }
  } finally {
    // Close the connection
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

// Run the function
createAdmin();