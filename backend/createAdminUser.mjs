// =========================================================================
// ADMIN USER MANAGEMENT SCRIPT
// =========================================================================
// This script allows you to:
//   1. Create a new admin user
//   2. Delete an existing admin user
//   3. Update an existing admin's password
//
// HOW TO USE THIS SCRIPT:
// -----------------------
// 1. Save this file as "manageAdmin.mjs" in your backend directory
//
// 2. Run the script with one of these commands:
//
//    * To create an admin (default action):
//      node manageAdmin.mjs create
//
//    * To create an admin with custom username/password:
//      node manageAdmin.mjs create myusername mypassword
//
//    * To delete an admin:
//      node manageAdmin.mjs delete admin
//
//    * To update an admin's password:
//      node manageAdmin.mjs update admin newpassword
//
//    * To see help:
//      node manageAdmin.mjs help
//
// NOTE: The script will maintain only ONE admin user by default.
// If you need multiple admins, modify the ALLOW_MULTIPLE_ADMINS constant below.
// =========================================================================

import { Sequelize, DataTypes, Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// =========================================================================
// CONFIGURATION
// =========================================================================

// Set to true if you want to allow creating multiple admin users
const ALLOW_MULTIPLE_ADMINS = false;

// Default admin credentials (used if not provided via command line)
const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const DEFAULT_ADMIN_EMAIL = 'admin@example.com';
const DEFAULT_ADMIN_ROLE = 'admin_ceo';

// =========================================================================
// ENVIRONMENT SETUP
// =========================================================================

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define possible .env file locations in order of priority
const possibleEnvPaths = [
  path.resolve(__dirname, '.env'),               // backend/.env
  path.resolve(__dirname, '..', '.env'),         // project root/.env
  path.resolve(process.cwd(), '.env')            // current working directory
];

// Find the first .env file that exists
let envPath = null;
for (const possiblePath of possibleEnvPaths) {
  if (fs.existsSync(possiblePath)) {
    envPath = possiblePath;
    break;
  }
}

// If no .env file found, default to backend root
if (!envPath) {
  envPath = path.resolve(__dirname, '.env');
  console.warn(`⚠️ Warning: No .env file found. Using default path: ${envPath}`);
}

// Load environment variables
console.log(`📂 Loading environment from: ${envPath}`);
dotenv.config({ path: envPath });

// =========================================================================
// PROCESS COMMAND LINE ARGUMENTS
// =========================================================================

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'create';  // Default to create if no command specified
const param1 = args[1];  // Username for create/delete, or username for update
const param2 = args[2];  // Password for create, or new password for update

// Show help and exit if requested
if (command === 'help' || command === '--help' || command === '-h') {
  console.log(`
📚 Admin User Management Script Help
===================================

Commands:
  create [username] [password]  - Create a new admin user
  delete [username]             - Delete an admin user
  update [username] [password]  - Update an admin's password
  help                          - Show this help message

Examples:
  node manageAdmin.mjs create               - Create default admin (username: admin, password: admin123)
  node manageAdmin.mjs create myAdmin pass123   - Create admin with custom credentials
  node manageAdmin.mjs delete admin         - Delete the 'admin' user
  node manageAdmin.mjs update admin newpass - Change admin's password to 'newpass'

Note: By default, this script maintains only ONE admin user.
`);
  process.exit(0);
}

// =========================================================================
// DATABASE CONNECTION
// =========================================================================

// Log database connection info (mask password)
console.log('🔌 Database connection info:');
console.log(`  Database: ${process.env.PG_DB || 'apex'}`);
console.log(`  User: ${process.env.PG_USER || 'postgres'}`);
console.log(`  Host: ${process.env.PG_HOST || 'localhost'}`);
console.log(`  Port: ${process.env.PG_PORT || 5432}`);
console.log(`  Password set: ${!!process.env.PG_PASSWORD}`);

// Create database connection
const sequelize = new Sequelize(
  process.env.PG_DB || 'apex',
  process.env.PG_USER || 'postgres',
  process.env.PG_PASSWORD || '',
  {
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432,
    dialect: 'postgres',
    logging: false,  // Set to console.log for debugging
    dialectOptions: {
      // Explicitly handle potential null values
      password: process.env.PG_PASSWORD || null
    }
  }
);

// =========================================================================
// USER MODEL DEFINITION
// =========================================================================

// Define User model directly in this script to avoid imports
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user',
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  // Use timestamps
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'users',
});

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

// Function to check if user exists
async function userExists(username) {
  const user = await User.findOne({ where: { username } });
  return !!user;
}

// Function to count admin users
async function countAdminUsers() {
  return await User.count({
    where: {
      role: {
        [Op.or]: ['admin_ceo', 'admin_cto', 'admin_cfo', 'super_admin']
      }
    }
  });
}

// Function to create admin user
async function createAdmin(username = DEFAULT_ADMIN_USERNAME, password = DEFAULT_ADMIN_PASSWORD) {
  try {
    // Check if we should restrict to single admin
    if (!ALLOW_MULTIPLE_ADMINS) {
      const adminCount = await countAdminUsers();
      if (adminCount > 0) {
        console.log('⚠️ An admin user already exists and ALLOW_MULTIPLE_ADMINS is set to false.');
        console.log('   Please delete the existing admin first, or set ALLOW_MULTIPLE_ADMINS to true.');
        return false;
      }
    }

    // Check if the requested username already exists
    if (await userExists(username)) {
      console.log(`⚠️ User '${username}' already exists.`);
      console.log('   Use the update command to change their password instead.');
      return false;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const adminUser = await User.create({
      username: username,
      password: hashedPassword,
      email: DEFAULT_ADMIN_EMAIL,
      role: DEFAULT_ADMIN_ROLE,
      first_name: 'Admin',
      last_name: 'User',
      is_active: true,
    });

    // Log admin details (excluding password)
    const adminDetails = { ...adminUser.get() };
    delete adminDetails.password;

    console.log(`✅ Admin user '${username}' created successfully!`);
    console.log('');
    console.log('🔐 Login credentials:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('');
    console.log('Admin user details:', adminDetails);
    return true;
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    return false;
  }
}

// Function to delete admin user
async function deleteAdmin(username) {
  try {
    // Check if user exists
    if (!await userExists(username)) {
      console.log(`⚠️ User '${username}' not found.`);
      return false;
    }

    // Confirm the user is an admin
    const user = await User.findOne({ where: { username } });
    const isAdmin = ['admin_ceo', 'admin_cto', 'admin_cfo', 'super_admin'].includes(user.role);
    
    if (!isAdmin) {
      console.log(`⚠️ User '${username}' is not an admin (role: ${user.role}).`);
      return false;
    }

    // Delete the user
    await User.destroy({ where: { username } });
    console.log(`✅ Admin user '${username}' deleted successfully.`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting admin user:', error.message);
    return false;
  }
}

// Function to update admin password
async function updateAdmin(username, newPassword) {
  try {
    // Check if user exists
    if (!await userExists(username)) {
      console.log(`⚠️ User '${username}' not found.`);
      return false;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user
    await User.update(
      { password: hashedPassword },
      { where: { username } }
    );

    console.log(`✅ Password for user '${username}' updated successfully.`);
    console.log('');
    console.log('🔐 New login credentials:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${newPassword}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating admin password:', error.message);
    return false;
  }
}

// =========================================================================
// MAIN FUNCTION
// =========================================================================

async function main() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Create users table if it doesn't exist
    try {
      console.log('🔧 Syncing User model with database...');
      await User.sync({ alter: true });
      console.log('✅ User model synchronized with database.');
    } catch (syncError) {
      console.error('❌ Error syncing User model:', syncError.message);
      return;
    }

    // Execute requested command
    switch (command) {
      case 'create':
        await createAdmin(param1, param2);
        break;
      case 'delete':
        if (!param1) {
          console.log('⚠️ Username parameter required for delete command.');
          console.log('   Example: node manageAdmin.mjs delete admin');
        } else {
          await deleteAdmin(param1);
        }
        break;
      case 'update':
        if (!param1 || !param2) {
          console.log('⚠️ Username and password parameters required for update command.');
          console.log('   Example: node manageAdmin.mjs update admin newpassword');
        } else {
          await updateAdmin(param1, param2);
        }
        break;
      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('   Run "node manageAdmin.mjs help" for usage information.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.name === 'SequelizeConnectionError') {
      console.log('\n🔧 Database Connection Troubleshooting:');
      console.log('1. Make sure PostgreSQL is running on your machine');
      console.log('2. Check that your database exists (default: apex)');
      console.log('3. Verify your username and password in the .env file');
      console.log('4. Confirm the host and port settings are correct');
    }
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

// Run the main function
main();