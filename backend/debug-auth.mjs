// backend/debug-auth.mjs
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sequelize from './config/database.mjs';
import User from './models/user.mjs';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define possible env file paths in order of preference
const possibleEnvPaths = [
  path.resolve(__dirname, '.env'),               // backend/.env
  path.resolve(__dirname, '..', '.env'),         // project root/.env
  path.resolve(__dirname, '..', 'backend', '.env') // explicit backend/.env
];

console.log('Checking for .env files...');
for (const envPath of possibleEnvPaths) {
  console.log(`- ${envPath}: ${fs.existsSync(envPath) ? 'EXISTS' : 'NOT FOUND'}`);
  if (fs.existsSync(envPath)) {
    console.log(`  Loading environment from: ${envPath}`);
    dotenv.config({ path: envPath });
    break;
  }
}

const runDiagnostics = async () => {
  console.log('\n=== AUTH SYSTEM DIAGNOSTICS ===');
  console.log('\n=== ENVIRONMENT VARIABLES ===');
  console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
  if (process.env.JWT_SECRET) {
    console.log('JWT_SECRET length:', process.env.JWT_SECRET.length);
    console.log('JWT_SECRET preview:', process.env.JWT_SECRET.substring(0, 5) + '...');
  }
  
  console.log('\nDatabase connection variables:');
  console.log('- PG_HOST:', process.env.PG_HOST || 'not set');
  console.log('- PG_PORT:', process.env.PG_PORT || 'not set');
  console.log('- PG_USER:', process.env.PG_USER || 'not set');
  console.log('- PG_DB:', process.env.PG_DB || 'not set');
  console.log('- PG_PASSWORD set:', !!process.env.PG_PASSWORD);

  console.log('\n=== DATABASE CONNECTION TEST ===');
  try {
    await sequelize.authenticate();
    console.log('✅ Connection to database successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }

  console.log('\n=== JWT FUNCTIONALITY TEST ===');
  try {
    const testPayload = { userId: 9999, role: 'test_role' };
    const token = jwt.sign(testPayload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
    console.log('✅ JWT signing successful');
    console.log('Token preview:', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    console.log('✅ JWT verification successful');
    console.log('Decoded payload:', decoded);
  } catch (error) {
    console.error('❌ JWT test failed:', error.message);
  }

  console.log('\n=== USER MODEL TEST ===');
  try {
    const users = await User.findAll({ limit: 5 });
    console.log(`✅ Found ${users.length} users in database`);
    if (users.length > 0) {
      console.log('Example user (excluding password):');
      const userExample = users[0].toJSON();
      delete userExample.password;
      console.log(userExample);
    } else {
      console.log('No users found in database');
      
      // Test creating a user
      console.log('\nTesting user creation...');
      const testPassword = 'test_password_123';
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      try {
        // Create a test user - DO NOT create in production!
        if (process.env.NODE_ENV !== 'production') {
          const testUser = await User.create({
            username: 'debug_test_user',
            password: hashedPassword,
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            role: 'user',
            is_active: true
          });
          console.log('✅ Test user created successfully');
          console.log('User details:', testUser.toJSON());
        } else {
          console.log('Skipping test user creation in production environment');
        }
      } catch (createError) {
        console.error('❌ Error creating test user:', createError.message);
      }
    }
    
    // Test password comparison
    if (users.length > 0) {
      console.log('\nTesting password comparison functionality...');
      try {
        // Instead of testing with actual passwords, test the bcrypt functionality
        const testPassword = 'test_password_123';
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        const compareResult = await bcrypt.compare(testPassword, hashedPassword);
        console.log('Bcrypt hash sample:', hashedPassword);
        console.log('Password comparison test result:', compareResult ? '✅ Successful' : '❌ Failed');
      } catch (bcryptError) {
        console.error('❌ Error testing password comparison:', bcryptError.message);
      }
    }
  } catch (error) {
    console.error('❌ User model test failed:', error.message);
    console.error('Error details:', error);
  }

  console.log('\n=== DIAGNOSTICS COMPLETE ===');
};

runDiagnostics().catch(err => {
  console.error('Diagnostics failed with error:', err);
  process.exit(1);
}).finally(() => {
  console.log('Exiting diagnostics script');
});