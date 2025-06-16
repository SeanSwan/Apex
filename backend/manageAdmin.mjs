// =========================================================================
// ENHANCED ADMIN USER MANAGEMENT SCRIPT
// =========================================================================
// This script provides comprehensive admin user management with advanced features:
//   1. Create a new admin user
//   2. Delete an existing admin user
//   3. Update an existing admin's password
//   4. List all admin users
//   5. Swap admins (delete existing and create new in one operation)
//   6. Advanced password validation and generation
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
//    * To list all admin users:
//      node manageAdmin.mjs list
//
//    * To swap admins (delete existing and create new):
//      node manageAdmin.mjs swap oldadmin newadmin newpassword
//
//    * To generate a secure random password:
//      node manageAdmin.mjs generate-password [length]
//
//    * To see help:
//      node manageAdmin.mjs help
//
// SECURITY FEATURES:
// -----------------
// - Password strength validation
// - Secure password hashing with bcrypt
// - Environment variable handling with fallbacks
// - Input validation
// - Transaction support for atomic operations
// - Detailed error reporting
// =========================================================================

import { Sequelize, DataTypes, Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import readline from 'readline';
import chalk from 'chalk'; // For colored console output

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

// Password requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIRES_UPPERCASE = true;
const PASSWORD_REQUIRES_LOWERCASE = true;
const PASSWORD_REQUIRES_NUMBER = true;
const PASSWORD_REQUIRES_SPECIAL = true;

// Admin roles allowed by the system
const VALID_ADMIN_ROLES = ['admin_ceo', 'admin_cto', 'admin_cfo', 'super_admin'];

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
try {
  for (const possiblePath of possibleEnvPaths) {
    if (fs.existsSync(possiblePath)) {
      envPath = possiblePath;
      break;
    }
  }
} catch (error) {
  console.error(chalk.red(`❌ An unexpected error occurred: ${error.message}`));
}

// If no .env file found, default to backend root
if (!envPath) {
  envPath = path.resolve(__dirname, '.env');
  console.warn(chalk.yellow(`⚠️ Warning: No .env file found. Using default path: ${envPath}`));
}

// Load environment variables
console.log(chalk.blue(`📂 Loading environment from: ${envPath}`));
dotenv.config({ path: envPath });

// =========================================================================
// PROCESS COMMAND LINE ARGUMENTS
// =========================================================================

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'create';  // Default to create if no command specified
const param1 = args[1];  // Username for create/delete, or username for update
const param2 = args[2];  // Password for create, or new password for update
const param3 = args[3];  // Additional parameter for future use

// Show help and exit if requested
if (command === 'help' || command === '--help' || command === '-h') {
  showHelp();
  process.exit(0);
}

// =========================================================================
// DATABASE CONNECTION
// =========================================================================

// Extract database configuration from environment variables with fallbacks
const dbConfig = {
  database: process.env.PG_DB || 'apex',
  username: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT) || 5432,
  dialect: 'postgres',
  logging: false,  // Set to console.log for debugging
  dialectOptions: {
    // Handle specific postgres connection options
    password: process.env.PG_PASSWORD || null,
    // Add SSL support if needed
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Log database connection info (mask password)
console.log(chalk.blue('🔌 Database connection info:'));
console.log(chalk.blue(`  Database: ${dbConfig.database}`));
console.log(chalk.blue(`  User: ${dbConfig.username}`));
console.log(chalk.blue(`  Host: ${dbConfig.host}`));
console.log(chalk.blue(`  Port: ${dbConfig.port}`));
console.log(chalk.blue(`  Password set: ${!!dbConfig.password}`));
console.log(chalk.blue(`  SSL: ${dbConfig.dialectOptions.ssl ? 'Enabled' : 'Disabled'}`));

// Create database connection
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    dialectOptions: dbConfig.dialectOptions,
    pool: dbConfig.pool
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
    validate: {
      notEmpty: true,
      len: [3, 50]
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user',
    validate: {
      isIn: {
        args: [['user', 'manager', 'guard', 'admin_ceo', 'admin_cto', 'admin_cfo', 'super_admin']],
        msg: 'Invalid role'
      }
    }
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
    allowNull: false,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failed_login_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  account_locked_until: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  // Use timestamps
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'users',
  // Add hooks for password validation
  hooks: {
    beforeValidate: (user) => {
      // Only validate password if it's being changed
      if (user.changed('password') && user.password) {
        validatePassword(user.password);
      }
    },
    beforeCreate: async (user) => {
      // Hash password before saving if it's not already hashed
      if (user.password && !user.password.startsWith('$2a$')) {
        user.password = await hashPassword(user.password);
      }
    },
    beforeUpdate: async (user) => {
      // Hash password before updating if it's changed and not already hashed
      if (user.changed('password') && user.password && !user.password.startsWith('$2a$')) {
        user.password = await hashPassword(user.password);
      }
    }
  }
});

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

// Function to show help message
function showHelp() {
  console.log(chalk.green(`
📚 Enhanced Admin User Management Script Help
=============================================

Commands:
  create [username] [password]         - Create a new admin user
  delete [username]                    - Delete an admin user
  update [username] [password]         - Update an admin's password
  list                                 - List all admin users
  swap [oldAdmin] [newAdmin] [password] - Replace one admin with another
  generate-password [length]           - Generate a secure random password
  help                                 - Show this help message

Examples:
  node manageAdmin.mjs create                       - Create default admin
  node manageAdmin.mjs create myAdmin Pass123!      - Create custom admin
  node manageAdmin.mjs delete admin                 - Delete the 'admin' user
  node manageAdmin.mjs update admin NewPass123!     - Change admin's password
  node manageAdmin.mjs list                         - Show all admin users
  node manageAdmin.mjs swap oldAdmin newAdmin p@ssW0rd! - Replace admin
  node manageAdmin.mjs generate-password 16         - Generate 16-char password

Password Requirements:
  - Minimum length: ${PASSWORD_MIN_LENGTH} characters
  - Requires uppercase: ${PASSWORD_REQUIRES_UPPERCASE ? 'Yes' : 'No'}
  - Requires lowercase: ${PASSWORD_REQUIRES_LOWERCASE ? 'Yes' : 'No'}
  - Requires number: ${PASSWORD_REQUIRES_NUMBER ? 'Yes' : 'No'}
  - Requires special char: ${PASSWORD_REQUIRES_SPECIAL ? 'Yes' : 'No'}

Note: ${ALLOW_MULTIPLE_ADMINS ? 'Multiple admin users are allowed' : 'Only one admin user is allowed at a time'}
`));
}

// Function to hash password
async function hashPassword(password) {
  // Use a higher cost factor (12) for better security
  return await bcrypt.hash(password, 12);
}

// Function to validate password strength
function validatePassword(password) {
  const errors = [];

  // Check length
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }

  // Check for uppercase letters
  if (PASSWORD_REQUIRES_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (PASSWORD_REQUIRES_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (PASSWORD_REQUIRES_NUMBER && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special characters
  if (PASSWORD_REQUIRES_SPECIAL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Throw validation error if any requirements not met
  if (errors.length > 0) {
    throw new Error(`Password validation failed: ${errors.join(', ')}`);
  }

  return true;
}

// Function to generate a secure random password
function generatePassword(length = 16) {
  // Define character sets
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  // Combine all character sets based on requirements
  let allChars = '';
  if (PASSWORD_REQUIRES_UPPERCASE) allChars += uppercaseChars;
  if (PASSWORD_REQUIRES_LOWERCASE) allChars += lowercaseChars;
  if (PASSWORD_REQUIRES_NUMBER) allChars += numberChars;
  if (PASSWORD_REQUIRES_SPECIAL) allChars += specialChars;

  // Ensure we have some characters to work with
  if (!allChars) {
    allChars = lowercaseChars + numberChars;
  }

  // Initialize password with required character types to ensure it meets complexity requirements
  let password = '';
  if (PASSWORD_REQUIRES_UPPERCASE) password += uppercaseChars.charAt(Math.floor(crypto.randomInt(uppercaseChars.length)));
  if (PASSWORD_REQUIRES_LOWERCASE) password += lowercaseChars.charAt(Math.floor(crypto.randomInt(lowercaseChars.length)));
  if (PASSWORD_REQUIRES_NUMBER) password += numberChars.charAt(Math.floor(crypto.randomInt(numberChars.length)));
  if (PASSWORD_REQUIRES_SPECIAL) password += specialChars.charAt(Math.floor(crypto.randomInt(specialChars.length)));

  // Fill the rest with random characters from all allowed types
  while (password.length < length) {
    const randomIndex = crypto.randomInt(allChars.length);
    password += allChars.charAt(randomIndex);
  }

  // Shuffle the password to avoid predictable placement of required characters
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

// Function to create a readline interface for user input
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Function to ask for confirmation
async function confirmAction(message) {
  const rl = createReadlineInterface();
  
  return new Promise(resolve => {
    rl.question(chalk.yellow(`${message} (y/N): `), answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Function to prompt for password
async function promptForPassword() {
  console.log(chalk.yellow('\nEnter a secure password or press Enter to generate one:'));
  const rl = createReadlineInterface();
  
  return new Promise(resolve => {
    rl.question('Password: ', password => {
      rl.close();
      if (!password) {
        const generatedPassword = generatePassword();
        console.log(chalk.green(`\nGenerated password: ${generatedPassword}`));
        resolve(generatedPassword);
      } else {
        resolve(password);
      }
    });
  });
}

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
        [Op.in]: VALID_ADMIN_ROLES
      }
    }
  });
}

// Function to get all admin users
async function getAdminUsers() {
  return await User.findAll({
    where: {
      role: {
        [Op.in]: VALID_ADMIN_ROLES
      }
    },
    attributes: ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'is_active', 'created_at', 'updated_at', 'last_login']
  });
}

// Function to create admin user
async function createAdmin(username = DEFAULT_ADMIN_USERNAME, password = DEFAULT_ADMIN_PASSWORD) {
  let transaction;
  
  try {
    // Start transaction for data consistency
    transaction = await sequelize.transaction();

    // Check if we should restrict to single admin
    if (!ALLOW_MULTIPLE_ADMINS) {
      const adminCount = await countAdminUsers();
      if (adminCount > 0) {
        console.log(chalk.yellow('⚠️ An admin user already exists and ALLOW_MULTIPLE_ADMINS is set to false.'));
        console.log(chalk.yellow('   Please delete the existing admin first, or set ALLOW_MULTIPLE_ADMINS to true.'));
        return false;
      }
    }

    // Check if the requested username already exists
    if (await userExists(username)) {
      console.log(chalk.yellow(`⚠️ User '${username}' already exists.`));
      console.log(chalk.yellow('   Use the update command to change their password instead.'));
      return false;
    }

    // Validate password
    try {
      validatePassword(password);
    } catch (validationError) {
      console.log(chalk.red(`❌ Password validation failed: ${validationError.message}`));
      return false;
    }

    // Create admin user (Password will be hashed by the hook)
    const adminUser = await User.create({
      username: username,
      password: password,
      email: DEFAULT_ADMIN_EMAIL,
      role: DEFAULT_ADMIN_ROLE,
      first_name: 'Admin',
      last_name: 'User',
      is_active: true,
    }, { transaction });

    // Commit transaction
    await transaction.commit();

    // Log admin details (excluding password)
    const adminDetails = { ...adminUser.get() };
    delete adminDetails.password;

    console.log(chalk.green(`✅ Admin user '${username}' created successfully!`));
    console.log(chalk.green(''));
    console.log(chalk.green('🔐 Login credentials:'));
    console.log(chalk.green(`Username: ${username}`));
    console.log(chalk.green(`Password: ${password}`));
    console.log(chalk.green(''));
    console.log('Admin user details:', adminDetails);
    return true;
  } catch (error) {
    // Rollback transaction if error occurs
    if (transaction) await transaction.rollback();
    console.error(chalk.red(`❌ Error creating admin user: ${error.message}`));
    
    if (error.name === 'SequelizeValidationError') {
      console.log(chalk.yellow('Validation errors:'));
      error.errors.forEach(e => console.log(chalk.yellow(`- ${e.message}`)));
    }
    
    return false;
  }
}

// Function to delete admin user
async function deleteAdmin(username) {
  let transaction;
  
  try {
    // Start transaction
    transaction = await sequelize.transaction();

    // Check if user exists
    if (!await userExists(username)) {
      console.log(chalk.yellow(`⚠️ User '${username}' not found.`));
      return false;
    }

    // Confirm the user is an admin
    const user = await User.findOne({ where: { username } });
    const isAdmin = VALID_ADMIN_ROLES.includes(user.role);
    
    if (!isAdmin) {
      console.log(chalk.yellow(`⚠️ User '${username}' is not an admin (role: ${user.role}).`));
      return false;
    }

    // Get confirmation before proceeding
    const confirmed = await confirmAction(`Are you sure you want to delete admin user '${username}'?`);
    if (!confirmed) {
      console.log(chalk.yellow('❌ Operation cancelled by user.'));
      return false;
    }

    // Delete the user
    await User.destroy({ 
      where: { username },
      transaction
    });

    // Commit transaction
    await transaction.commit();
    
    console.log(chalk.green(`✅ Admin user '${username}' deleted successfully.`));
    return true;
  } catch (error) {
    // Rollback transaction if error occurs
    if (transaction) await transaction.rollback();
    console.error(chalk.red(`❌ Error deleting admin user: ${error.message}`));
    return false;
  }
}

// Function to update admin password
async function updateAdmin(username, newPassword) {
  let transaction;
  
  try {
    // Start transaction
    transaction = await sequelize.transaction();

    // Check if user exists
    if (!await userExists(username)) {
      console.log(chalk.yellow(`⚠️ User '${username}' not found.`));
      return false;
    }

    // Get the user to make sure they're an admin
    const user = await User.findOne({ where: { username } });
    if (!VALID_ADMIN_ROLES.includes(user.role)) {
      console.log(chalk.yellow(`⚠️ User '${username}' is not an admin (role: ${user.role}).`));
      return false;
    }

    // Validate password
    try {
      validatePassword(newPassword);
    } catch (validationError) {
      console.log(chalk.red(`❌ Password validation failed: ${validationError.message}`));
      return false;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user
    await User.update(
      { 
        password: hashedPassword,
        updated_at: new Date()
      },
      { 
        where: { username },
        transaction
      }
    );

    // Commit transaction
    await transaction.commit();

    console.log(chalk.green(`✅ Password for user '${username}' updated successfully.`));
    console.log(chalk.green(''));
    console.log(chalk.green('🔐 New login credentials:'));
    console.log(chalk.green(`Username: ${username}`));
    console.log(chalk.green(`Password: ${newPassword}`));
    return true;
  } catch (error) {
    // Rollback transaction if error occurs
    if (transaction) await transaction.rollback();
    console.error(chalk.red(`❌ Error updating admin password: ${error.message}`));
    return false;
  }
}

// Function to list all admin users
async function listAdminUsers() {
  try {
    const admins = await getAdminUsers();
    
    if (admins.length === 0) {
      console.log(chalk.yellow('⚠️ No admin users found.'));
      return true;
    }

    console.log(chalk.green(`\n📋 Found ${admins.length} admin user(s):\n`));
    
    // Format and display each admin user
    admins.forEach((admin, index) => {
      console.log(chalk.blue(`Admin #${index + 1}:`));
      console.log(`  ID: ${admin.id}`);
      console.log(`  Username: ${admin.username}`);
      console.log(`  Role: ${admin.role}`);
      console.log(`  Email: ${admin.email}`);
      console.log(`  Name: ${admin.first_name} ${admin.last_name}`);
      console.log(`  Active: ${admin.is_active ? 'Yes' : 'No'}`);
      console.log(`  Created: ${admin.created_at}`);
      console.log(`  Last updated: ${admin.updated_at}`);
      console.log(`  Last login: ${admin.last_login || 'Never'}`);
      console.log('');
    });
    
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Error listing admin users: ${error.message}`));
    return false;
  }
}

// Function to swap admin users (delete existing and create new)
async function swapAdmins(oldUsername, newUsername, newPassword) {
  let transaction;
  
  try {
    // Start transaction
    transaction = await sequelize.transaction();

    // Verify old admin exists
    if (!await userExists(oldUsername)) {
      console.log(chalk.yellow(`⚠️ User '${oldUsername}' not found.`));
      return false;
    }

    // Check if the old user is an admin
    const oldUser = await User.findOne({ where: { username: oldUsername } });
    if (!VALID_ADMIN_ROLES.includes(oldUser.role)) {
      console.log(chalk.yellow(`⚠️ User '${oldUsername}' is not an admin (role: ${oldUser.role}).`));
      return false;
    }

    // Check if new username already exists
    if (await userExists(newUsername)) {
      console.log(chalk.yellow(`⚠️ User '${newUsername}' already exists.`));
      return false;
    }

    // Validate password
    try {
      validatePassword(newPassword);
    } catch (validationError) {
      console.log(chalk.red(`❌ Password validation failed: ${validationError.message}`));
      return false;
    }

    // Get confirmation
    const confirmed = await confirmAction(
      `Are you sure you want to replace admin '${oldUsername}' with a new admin '${newUsername}'?`
    );
    
    if (!confirmed) {
      console.log(chalk.yellow('❌ Operation cancelled by user.'));
      return false;
    }

    // Delete old admin
    await User.destroy({ 
      where: { username: oldUsername },
      transaction
    });

    // Create new admin with same role as old admin
    const newAdmin = await User.create({
      username: newUsername,
      password: newPassword,
      email: `${newUsername}@example.com`, // Generate a default email
      role: oldUser.role,
      first_name: 'Admin',
      last_name: 'User',
      is_active: true,
    }, { transaction });

    // Commit transaction
    await transaction.commit();

    // Log new admin details (excluding password)
    const adminDetails = { ...newAdmin.get() };
    delete adminDetails.password;

    console.log(chalk.green(`✅ Admin swap completed successfully!`));
    console.log(chalk.green(`✅ Old admin '${oldUsername}' deleted.`));
    console.log(chalk.green(`✅ New admin '${newUsername}' created.`));
    console.log(chalk.green(''));
    console.log(chalk.green('🔐 New login credentials:'));
    console.log(chalk.green(`Username: ${newUsername}`));
    console.log(chalk.green(`Password: ${newPassword}`));
    console.log(chalk.green(''));
    console.log('New admin user details:', adminDetails);
    
    return true;
  } catch (error) {
    // Rollback transaction if error occurs
    if (transaction) await transaction.rollback();
    console.error(chalk.red(`❌ Error swapping admin users: ${error.message}`));
    return false;
  }
}

// Function to display a generated password
async function displayGeneratedPassword(length) {
  try {
    // Convert length to number and validate
    length = parseInt(length) || 16;
    if (length < PASSWORD_MIN_LENGTH) {
      console.log(chalk.yellow(`⚠️ Minimum password length is ${PASSWORD_MIN_LENGTH}. Adjusting to minimum.`));
      length = PASSWORD_MIN_LENGTH;
    }
    
    if (length > 100) {
      console.log(chalk.yellow(`⚠️ Maximum password length is 100. Adjusting to maximum.`));
      length = 100;
    }

    // Generate and display the password
    const password = generatePassword(length);
    console.log(chalk.green(`\n🔐 Generated secure password (${length} characters):`));
    console.log(chalk.green(`${password}`));
    
    // Display password strength assessment
    console.log(chalk.green(`\n📊 Password strength assessment:`));
    console.log(`  Length: ${length} characters`);
    console.log(`  Contains uppercase: ${/[A-Z]/.test(password) ? 'Yes' : 'No'}`);
    console.log(`  Contains lowercase: ${/[a-z]/.test(password) ? 'Yes' : 'No'}`);
    console.log(`  Contains numbers: ${/[0-9]/.test(password) ? 'Yes' : 'No'}`);
    console.log(`  Contains special chars: ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'Yes' : 'No'}`);
    
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Error generating password: ${error.message}`));
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
    console.log(chalk.green('✅ Database connection established successfully.'));

    // Create users table if it doesn't exist
    try {
      console.log(chalk.blue('🔧 Syncing User model with database...'));
      await User.sync({ alter: true });
      console.log(chalk.green('✅ User model synchronized with database.'));
    } catch (syncError) {
      console.error(chalk.red(`❌ Error syncing User model: ${syncError.message}`));
      return;
    }

    // Execute requested command
    switch (command) {
      case 'create':
        let username = param1 || DEFAULT_ADMIN_USERNAME;
        let password = param2;
        
        if (!password) {
          password = await promptForPassword();
        }
        
        await createAdmin(username, password);
        break;
        
      case 'delete':
        if (!param1) {
          console.log(chalk.yellow('⚠️ Username parameter required for delete command.'));
          console.log(chalk.yellow('   Example: node manageAdmin.mjs delete admin'));
        } else {
          await deleteAdmin(param1);
        }
        break;
        
      case 'update':
        if (!param1) {
          console.log(chalk.yellow('⚠️ Username parameter required for update command.'));
          console.log(chalk.yellow('   Example: node manageAdmin.mjs update admin newpassword'));
        } else {
          let newPassword = param2;
          
          if (!newPassword) {
            newPassword = await promptForPassword();
          }
          
          await updateAdmin(param1, newPassword);
        }
        break;
        
      case 'list':
        await listAdminUsers();
        break;
        
      case 'swap':
        if (!param1 || !param2) {
          console.log(chalk.yellow('⚠️ Old username and new username parameters required for swap command.'));
          console.log(chalk.yellow('   Example: node manageAdmin.mjs swap oldadmin newadmin [newpassword]'));
        } else {
          let newPassword = param3;
          
          if (!newPassword) {
            newPassword = await promptForPassword();
          }
          
          await swapAdmins(param1, param2, newPassword);
        }
        break;
        
      case 'generate-password':
        await displayGeneratedPassword(param1);
        break;
     }
  } catch (error) {
      console.error(chalk.red(`❌ An error occurred in main(): ${error.message}`));
  }
}