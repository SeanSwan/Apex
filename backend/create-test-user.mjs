// backend/create-test-user.mjs
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import db from './models/index.mjs';
import readline from 'readline';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask questions
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

// Display initial message
console.log('=== TEST USER CREATION UTILITY ===');
console.log('Checking database connection and creating test users if needed...');

async function createTestUsers() {
  try {
    // Try to connect to the database
    await db.sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Check if admin user already exists
    const existingAdmin = await db.User.findOne({ where: { username: 'swanadmin' } });
    
    if (existingAdmin) {
      console.log('👤 Admin user "swanadmin" already exists with ID:', existingAdmin.id);
    } else {
      console.log('\n--- Creating Admin User ---');
      const adminPassword = await question('Enter password for admin user (minimum 6 characters): ');
      
      // Validate password length
      if (adminPassword.length < 6) {
        console.log('❌ Password must be at least 6 characters long. Aborting admin user creation.');
      } else {
        // Create admin user
        const adminUser = await db.User.create({
          username: 'swanadmin',
          password: adminPassword,
          email: 'swanadmin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'super_admin',
          is_active: true,
          status: 'active',
          email_verified: true
        });
        
        console.log('✅ Created admin user "swanadmin" with ID:', adminUser.id);
        console.log('   Username: swanadmin');
        console.log('   Role: super_admin');
      }
    }

    // Check if regular user already exists
    const existingUser = await db.User.findOne({ where: { username: 'test' } });
    
    if (existingUser) {
      console.log('👤 Regular user "test" already exists with ID:', existingUser.id);
    } else {
      console.log('\n--- Creating Test User ---');
      const testPassword = await question('Enter password for test user (minimum 6 characters): ');
      
      // Validate password length
      if (testPassword.length < 6) {
        console.log('❌ Password must be at least 6 characters long. Aborting test user creation.');
      } else {
        // Create regular user
        const regularUser = await db.User.create({
          username: 'test',
          password: testPassword,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'guard',
          is_active: true,
          status: 'active',
          email_verified: true
        });
        
        console.log('✅ Created regular user "test" with ID:', regularUser.id);
        console.log('   Username: test');
        console.log('   Role: guard');
      }
    }

    console.log('\n✅ User creation process completed.');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    console.error('\nPlease check your database connection and try again.');
    console.error('Tip: Make sure your database server is running and .env file is properly configured.');
  } finally {
    // Close the database connection and readline interface
    await db.sequelize.close();
    rl.close();
    console.log('Database connection closed.');
  }
}

// Run the function
createTestUsers();