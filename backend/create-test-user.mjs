// backend/create-users.mjs
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import db from './models/index.mjs';
import readline from 'readline';
import chalk from 'chalk'; // For colored console output
import { setTimeout } from 'timers/promises'; // For async delays
import fs from 'fs/promises'; // For file operations

// --- Configuration Constants ---
const DEFAULT_USERS = [
  {
    username: 'swanadmin',
    email: 'swanadmin@example.com',
    role: 'super_admin',
    firstName: 'Admin',
    lastName: 'User',
    defaults: {
      first_name: 'Admin',
      last_name: 'User',
      role: 'super_admin',
      is_active: true,
      status: 'active',
      email_verified: true
    }
  },
  {
    username: 'test',
    email: 'test@example.com',
    role: 'guard',
    firstName: 'Test',
    lastName: 'User',
    defaults: {
      first_name: 'Test',
      last_name: 'User',
      role: 'guard',
      is_active: true,
      status: 'active',
      email_verified: true
    }
  }
];

// Security configurations
const PASSWORD_CONFIG = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
  saltRounds: 10
};

// --- Environment Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

// Function to load environment variables with error handling
async function loadEnvironment() {
  try {
    // Check if .env file exists
    await fs.access(envPath);
    const dotenvResult = dotenv.config({ path: envPath });
    
    if (dotenvResult.error) {
      console.warn(chalk.yellow(`⚠️ Warning: .env file exists but could not be loaded from ${envPath}.`));
      console.warn(chalk.yellow(`   Error: ${dotenvResult.error.message}`));
    } else {
      console.log(chalk.green(`✅ Environment loaded from ${envPath}`));
    }
  } catch (error) {
    console.warn(chalk.yellow(`⚠️ Warning: .env file not found at ${envPath}. Using environment variables if set.`));
    
    if (process.env.NODE_ENV === 'production') {
      console.error(chalk.red("❌ CRITICAL: .env file missing in production environment. Exiting."));
      process.exit(1);
    }
  }
  
  // Validate required environment variables
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(chalk.red(`❌ Missing required environment variables: ${missingVars.join(', ')}`));
    console.error(chalk.red(`Please set these variables in your .env file or environment.`));
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn(chalk.yellow(`Attempting to continue, but database connection may fail.`));
    }
  }
}

// --- Readline Setup with Better Password Handling ---
class SecurePrompt {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async question(query, isPassword = false) {
    // Special handling for password input
    if (isPassword) {
      process.stdout.write(`${query}: `);
      
      // Disable echo for passwords in supported environments
      const originalStdinMode = process.stdin.isRaw;
      try {
        // This only works in environments that support raw mode
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(true);
        }
        
        return new Promise(resolve => {
          let password = '';
          
          const onData = (data) => {
            const key = data.toString();
            
            // Ctrl+C or Ctrl+D
            if (key === '\u0003' || key === '\u0004') {
              console.log('\n');
              process.exit(0);
            }
            
            // Enter key
            if (key === '\r' || key === '\n') {
              process.stdout.write('\n');
              process.stdin.removeListener('data', onData);
              if (process.stdin.isTTY) {
                process.stdin.setRawMode(originalStdinMode);
              }
              resolve(password);
              return;
            }
            
            // Backspace
            if (key === '\u007F' || key === '\b') {
              if (password.length > 0) {
                password = password.substring(0, password.length - 1);
                process.stdout.write('\b \b'); // Erase character
              }
              return;
            }
            
            // Otherwise, add to password
            password += key;
            process.stdout.write('*');
          };
          
          process.stdin.on('data', onData);
        });
      } catch (error) {
        console.warn(chalk.yellow(`⚠️ Secure password input not available, showing password input: ${error.message}`));
        // Fallback to visible input if any issues
        return this.regularQuestion(`${query} (INPUT VISIBLE)`);
      }
    } else {
      return this.regularQuestion(query);
    }
  }
  
  async regularQuestion(query) {
    return new Promise((resolve) => {
      this.rl.question(`${query}: `, (answer) => {
        resolve(answer.trim());
      });
    });
  }
  
  close() {
    this.rl.close();
  }
}

// --- Password Validation ---
function validatePassword(password, username) {
  const errors = [];
  
  if (!password || password.length < PASSWORD_CONFIG.minLength) {
    errors.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters long`);
  }
  
  if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (PASSWORD_CONFIG.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Prevent password from containing username
  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    errors.push('Password cannot contain your username');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// --- User Creation Functions ---
async function createUserIfNotExists(userData, securePrompt) {
  const { username, email, role, firstName, lastName, defaults } = userData;
  console.log(chalk.cyan(`\n--- Checking/Creating User: ${username} ---`));

  try {
    // Check if user exists
    const existingUser = await db.User.findOne({ 
      where: { 
        [db.Sequelize.Op.or]: [
          { username: username },
          { email: email }
        ]
      } 
    });

    if (existingUser) {
      if (existingUser.username === username) {
        console.log(chalk.blue(`👤 User "${username}" already exists with ID: ${existingUser.id} and Role: ${existingUser.role}.`));
      } else {
        console.log(chalk.yellow(`⚠️ Email "${email}" is already in use by user "${existingUser.username}".`));
      }
      
      // Ask if user wants to update this user
      const updateResponse = await securePrompt.question(`Do you want to update user "${username}"? (y/n)`);
      
      if (updateResponse.toLowerCase() === 'y') {
        return await updateExistingUser(existingUser, securePrompt);
      } else {
        console.log(chalk.blue(`Skipping user "${username}".`));
        return;
      }
    }

    console.log(chalk.blue(`   User "${username}" not found. Proceeding with creation...`));

    // Get password with validation
    let passwordValid = false;
    let password;
    
    while (!passwordValid) {
      password = await securePrompt.question(`Enter password for ${username}`, true);
      
      const validation = validatePassword(password, username);
      
      if (!validation.valid) {
        console.log(chalk.red('❌ Password validation failed:'));
        validation.errors.forEach(error => {
          console.log(chalk.red(`   - ${error}`));
        });
        console.log(chalk.yellow('Please try again.'));
      } else {
        passwordValid = true;
      }
    }

    // Ask for password confirmation
    const confirmPassword = await securePrompt.question(`Confirm password for ${username}`, true);
    
    if (password !== confirmPassword) {
      console.log(chalk.red('❌ Passwords do not match. Aborting creation for this user.'));
      return;
    }

    // Hash the password
    console.log(chalk.blue(`   Hashing password for "${username}"...`));
    const hashedPassword = await bcrypt.hash(password, PASSWORD_CONFIG.saltRounds);
    console.log(chalk.green('   Password hashed successfully.'));

    // Additional user data collection
    const addMoreFields = await securePrompt.question('Would you like to add more user details? (y/n)');
    
    let additionalFields = {};
    if (addMoreFields.toLowerCase() === 'y') {
      const phone = await securePrompt.question('Enter phone number (optional)');
      if (phone) additionalFields.phone = phone;
      
      const department = await securePrompt.question('Enter department (optional)');
      if (department) additionalFields.department = department;
    }

    // Create the user
    console.log(chalk.blue(`   Creating user "${username}" in the database...`));
    const newUser = await db.User.create({
      username: username,
      email: email,
      password: hashedPassword,
      ...defaults,
      ...additionalFields
    });

    console.log(chalk.green(`✅ Created user "${username}" successfully!`));
    console.log(chalk.green(`   ID: ${newUser.id}`));
    console.log(chalk.green(`   Role: ${newUser.role}`));
    
    return newUser;

  } catch (creationError) {
    console.error(chalk.red(`❌ Error creating user "${username}":`, creationError.message));
    
    if (creationError.name === 'SequelizeUniqueConstraintError') {
      console.error(chalk.red(`   This is likely due to a unique constraint violation (username or email already exists).`));
    } else if (creationError.name === 'SequelizeValidationError') {
      console.error(chalk.red(`   Validation error. Please check the input data format.`));
      creationError.errors.forEach(err => {
        console.error(chalk.red(`   - ${err.path}: ${err.message}`));
      });
    }
    
    console.log(chalk.yellow(`   Skipping creation for user "${username}" due to error.`));
  }
}

async function updateExistingUser(user, securePrompt) {
  console.log(chalk.blue(`\n--- Updating User: ${user.username} ---`));
  
  const updates = {};
  
  // Ask which fields to update
  console.log(chalk.blue('Select fields to update:'));
  
  const updatePassword = await securePrompt.question('Update password? (y/n)');
  if (updatePassword.toLowerCase() === 'y') {
    let passwordValid = false;
    let password;
    
    while (!passwordValid) {
      password = await securePrompt.question(`Enter new password for ${user.username}`, true);
      
      const validation = validatePassword(password, user.username);
      
      if (!validation.valid) {
        console.log(chalk.red('❌ Password validation failed:'));
        validation.errors.forEach(error => {
          console.log(chalk.red(`   - ${error}`));
        });
      } else {
        passwordValid = true;
      }
    }
    
    // Hash the password
    updates.password = await bcrypt.hash(password, PASSWORD_CONFIG.saltRounds);
    console.log(chalk.green('   Password updated and hashed successfully.'));
  }
  
  const updateRole = await securePrompt.question('Update role? (y/n)');
  if (updateRole.toLowerCase() === 'y') {
    const newRole = await securePrompt.question(`Enter new role for ${user.username} (current: ${user.role})`);
    if (newRole) updates.role = newRole;
  }
  
  const updateEmail = await securePrompt.question('Update email? (y/n)');
  if (updateEmail.toLowerCase() === 'y') {
    const newEmail = await securePrompt.question(`Enter new email for ${user.username} (current: ${user.email})`);
    if (newEmail) updates.email = newEmail;
  }
  
  const updateStatus = await securePrompt.question('Update active status? (y/n)');
  if (updateStatus.toLowerCase() === 'y') {
    const isActive = await securePrompt.question(`Set user as active? (y/n) (current: ${user.is_active ? 'active' : 'inactive'})`);
    updates.is_active = isActive.toLowerCase() === 'y';
    updates.status = isActive.toLowerCase() === 'y' ? 'active' : 'inactive';
  }
  
  // Only update if there are changes
  if (Object.keys(updates).length === 0) {
    console.log(chalk.yellow('No updates provided. User remains unchanged.'));
    return user;
  }
  
  try {
    await user.update(updates);
    console.log(chalk.green(`✅ Updated user "${user.username}" successfully!`));
    return user;
  } catch (error) {
    console.error(chalk.red(`❌ Error updating user "${user.username}":`, error.message));
    return user;
  }
}

// --- Bulk User Creation ---
async function bulkCreateUsersFromFile(filePath, securePrompt) {
  try {
    console.log(chalk.blue(`\n--- Attempting to load users from ${filePath} ---`));
    
    // Check if file exists
    await fs.access(filePath);
    
    // Read and parse file
    const fileContent = await fs.readFile(filePath, 'utf8');
    let users;
    
    try {
      users = JSON.parse(fileContent);
    } catch (parseError) {
      console.error(chalk.red(`❌ Error parsing JSON file: ${parseError.message}`));
      return;
    }
    
    if (!Array.isArray(users)) {
      console.error(chalk.red('❌ File does not contain an array of users.'));
      return;
    }
    
    console.log(chalk.green(`✅ Found ${users.length} users in file.`));
    
    // Confirm bulk creation
    const confirmBulk = await securePrompt.question(`Create all ${users.length} users? (y/n)`);
    if (confirmBulk.toLowerCase() !== 'y') {
      console.log(chalk.yellow('Bulk user creation cancelled.'));
      return;
    }
    
    // Generate a default password or ask for one
    const useDefaultPassword = await securePrompt.question('Use the same password for all users? (y/n)');
    let defaultPassword = null;
    
    if (useDefaultPassword.toLowerCase() === 'y') {
      let passwordValid = false;
      
      while (!passwordValid) {
        defaultPassword = await securePrompt.question('Enter default password for all users', true);
        
        const validation = validatePassword(defaultPassword, '');
        
        if (!validation.valid) {
          console.log(chalk.red('❌ Password validation failed:'));
          validation.errors.forEach(error => {
            console.log(chalk.red(`   - ${error}`));
          });
        } else {
          passwordValid = true;
        }
      }
    }
    
    // Create users
    const results = {
      success: 0,
      skipped: 0,
      failed: 0
    };
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(chalk.blue(`\n--- Processing user ${i+1}/${users.length}: ${user.username} ---`));
      
      // Check if user has the required fields
      if (!user.username || !user.email || !user.role) {
        console.error(chalk.red(`❌ User is missing required fields (username, email, or role).`));
        results.failed++;
        continue;
      }
      
      // Format user data
      const userData = {
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName || user.username,
        lastName: user.lastName || '',
        defaults: {
          first_name: user.firstName || user.username,
          last_name: user.lastName || '',
          role: user.role,
          is_active: user.is_active !== undefined ? user.is_active : true,
          status: user.status || 'active',
          email_verified: user.email_verified !== undefined ? user.email_verified : false,
          ...user.additionalFields
        }
      };
      
      // Check if user exists
      const existingUser = await db.User.findOne({ 
        where: { 
          [db.Sequelize.Op.or]: [
            { username: userData.username },
            { email: userData.email }
          ]
        } 
      });
      
      if (existingUser) {
        console.log(chalk.yellow(`⚠️ User "${userData.username}" or email "${userData.email}" already exists. Skipping.`));
        results.skipped++;
        continue;
      }
      
      // Set password
      let password = defaultPassword;
      
      if (!password) {
        password = await securePrompt.question(`Enter password for ${userData.username}`, true);
        
        const validation = validatePassword(password, userData.username);
        
        if (!validation.valid) {
          console.log(chalk.red('❌ Password validation failed. Skipping this user.'));
          results.failed++;
          continue;
        }
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, PASSWORD_CONFIG.saltRounds);
      
      // Create user
      try {
        const newUser = await db.User.create({
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          ...userData.defaults
        });
        
        console.log(chalk.green(`✅ Created user "${userData.username}" successfully!`));
        results.success++;
      } catch (error) {
        console.error(chalk.red(`❌ Error creating user "${userData.username}":`, error.message));
        results.failed++;
      }
    }
    
    // Show results
    console.log(chalk.cyan('\n--- Bulk User Creation Results ---'));
    console.log(chalk.green(`✅ Successfully created: ${results.success}`));
    console.log(chalk.yellow(`⚠️ Skipped: ${results.skipped}`));
    console.log(chalk.red(`❌ Failed: ${results.failed}`));
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(chalk.red(`❌ File not found: ${filePath}`));
    } else {
      console.error(chalk.red(`❌ Error reading file: ${error.message}`));
    }
  }
}

// --- Custom User Creation ---
async function createCustomUser(securePrompt) {
  console.log(chalk.cyan('\n--- Create Custom User ---'));
  
  const username = await securePrompt.question('Enter username (required)');
  if (!username) {
    console.log(chalk.red('❌ Username is required. Aborting custom user creation.'));
    return;
  }
  
  const email = await securePrompt.question('Enter email (required)');
  if (!email) {
    console.log(chalk.red('❌ Email is required. Aborting custom user creation.'));
    return;
  }
  
  const role = await securePrompt.question('Enter role (required)');
  if (!role) {
    console.log(chalk.red('❌ Role is required. Aborting custom user creation.'));
    return;
  }
  
  const firstName = await securePrompt.question('Enter first name');
  const lastName = await securePrompt.question('Enter last name');
  
  const is_active = (await securePrompt.question('Is user active? (y/n)')).toLowerCase() === 'y';
  const email_verified = (await securePrompt.question('Is email verified? (y/n)')).toLowerCase() === 'y';
  
  // Additional fields
  const addMoreFields = await securePrompt.question('Would you like to add more user details? (y/n)');
  
  let additionalFields = {};
  if (addMoreFields.toLowerCase() === 'y') {
    const phone = await securePrompt.question('Enter phone number (optional)');
    if (phone) additionalFields.phone = phone;
    
    const department = await securePrompt.question('Enter department (optional)');
    if (department) additionalFields.department = department;
  }
  
  const userData = {
    username,
    email,
    role,
    firstName,
    lastName,
    defaults: {
      first_name: firstName,
      last_name: lastName,
      role,
      is_active,
      status: is_active ? 'active' : 'inactive',
      email_verified,
      ...additionalFields
    }
  };
  
  return await createUserIfNotExists(userData, securePrompt);
}

// --- Progress Spinner ---
class Spinner {
  constructor() {
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.interval = null;
    this.message = '';
    this.currentFrame = 0;
  }
  
  start(message) {
    this.message = message;
    this.currentFrame = 0;
    
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.currentFrame]} ${this.message}`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
    
    return this;
  }
  
  stop(finalMessage = null) {
    clearInterval(this.interval);
    process.stdout.write(`\r${' '.repeat(this.message.length + 2)}\r`);
    
    if (finalMessage) {
      console.log(finalMessage);
    }
  }
}

// --- Main Function ---
async function main() {
  console.log(chalk.cyan('🚀 User Management Utility 🚀'));
  console.log(chalk.cyan('========================='));
  
  // Load environment
  await loadEnvironment();
  
  // Create prompt
  const securePrompt = new SecurePrompt();
  
  try {
    // Test Database Connection with spinner
    const spinner = new Spinner().start('Connecting to database...');
    
    try {
      await db.sequelize.authenticate();
      spinner.stop(chalk.green('✅ Database connection established successfully.'));
    } catch (error) {
      spinner.stop(chalk.red(`❌ Database connection failed: ${error.message}`));
      throw error;
    }
    
    // Show menu
    let exit = false;
    
    while (!exit) {
      console.log(chalk.cyan('\n--- Main Menu ---'));
      console.log('1. Create default users (admin and test)');
      console.log('2. Create custom user');
      console.log('3. Bulk create users from JSON file');
      console.log('4. List existing users');
      console.log('5. Exit');
      
      const choice = await securePrompt.question('Select an option (1-5)');
      
      switch (choice) {
        case '1':
          // Create default users
          for (const userData of DEFAULT_USERS) {
            await createUserIfNotExists(userData, securePrompt);
          }
          break;
          
        case '2':
          // Create custom user
          await createCustomUser(securePrompt);
          break;
          
        case '3':
          // Bulk create users
          const filePath = await securePrompt.question('Enter path to JSON file with users');
          await bulkCreateUsersFromFile(filePath, securePrompt);
          break;
          
        case '4':
          // List existing users
          console.log(chalk.cyan('\n--- Existing Users ---'));
          const spinner = new Spinner().start('Fetching users...');
          
          try {
            const users = await db.User.findAll({
              attributes: ['id', 'username', 'email', 'role', 'is_active', 'status', 'createdAt']
            });
            
            spinner.stop();
            
            if (users.length === 0) {
              console.log(chalk.yellow('No users found in the database.'));
            } else {
              console.log(chalk.green(`Found ${users.length} users:`));
              
              // Display users in a table format
              console.log('\nID | Username | Email | Role | Status | Created At');
              console.log('-'.repeat(80));
              
              users.forEach(user => {
                const status = user.is_active ? chalk.green('Active') : chalk.red('Inactive');
                console.log(`${user.id} | ${user.username} | ${user.email} | ${user.role} | ${status} | ${user.createdAt.toISOString().split('T')[0]}`);
              });
            }
          } catch (error) {
            spinner.stop(chalk.red(`❌ Error fetching users: ${error.message}`));
          }
          break;
          
        case '5':
          exit = true;
          break;
          
        default:
          console.log(chalk.red('Invalid option. Please select 1-5.'));
      }
    }
    
    console.log(chalk.green('\n✨ User management process completed successfully. ✨'));
    
  } catch (error) {
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeAccessDeniedError') {
      console.error(chalk.red('\n❌ Database Connection Error: Could not connect.'));
      console.error(chalk.red(`   Message: ${error.message}`));
      console.error(chalk.red('   Please check:'));
      console.error(chalk.red('     - Database server is running.'));
      console.error(chalk.red('     - Connection details in .env are correct (Host, Port, User, Password, DB Name).'));
      console.error(chalk.red('     - Network connectivity and firewall rules.'));
    } else if (error.name === 'SequelizeDatabaseError') {
      console.error(chalk.red('\n❌ Database Error:', error.message));
      console.error(chalk.red('   This might indicate issues with table structures or specific queries.'));
      console.error(chalk.red('   Original Error:', error.original?.message || 'N/A'));
    } else {
      console.error(chalk.red('\n❌ An unexpected error occurred:'), error);
    }
    
    console.error(chalk.red('\nScript aborted due to error.'));
    process.exitCode = 1;
    
  } finally {
    // Close resources
    console.log(chalk.blue('\n🔌 Closing database connection...'));
    
    if (db && db.sequelize) {
      await db.sequelize.close();
      console.log(chalk.blue('   Database connection closed.'));
    }
    
    securePrompt.close();
  }
}

// --- Run the Script ---
main().catch(error => {
  console.error(chalk.red('\n❌ Unhandled error in main process:'), error);
  process.exitCode = 1;
});