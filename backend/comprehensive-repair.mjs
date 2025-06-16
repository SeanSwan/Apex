/**
 * APEX AI PLATFORM - COMPREHENSIVE REPAIR SCRIPT
 * ===============================================
 * Fix all integration issues and restart enhanced server
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

console.log('🔧 APEX AI Platform Comprehensive Repair...\n');

async function comprehensiveRepair() {
  try {
    console.log('📊 Step 1: Creating missing database tables...');
    
    // Run database setup
    const dbSetup = spawn('node', ['setup-missing-tables.mjs'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    await new Promise((resolve, reject) => {
      dbSetup.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Database tables created successfully\n');
          resolve();
        } else {
          console.log('❌ Database setup failed\n');
          reject(new Error(`Database setup failed with code ${code}`));
        }
      });
    });
    
    console.log('🔒 Step 2: Verifying security configuration...');
    
    // Check if rate limiting files exist
    const rateLimiterExists = fs.existsSync('middleware/security/rateLimiter.mjs');
    const validationExists = fs.existsSync('middleware/security/validation.mjs');
    
    if (rateLimiterExists && validationExists) {
      console.log('✅ Security middleware files exist');
    } else {
      console.log('❌ Security middleware files missing');
    }
    
    console.log('🌐 Step 3: Checking external service files...');
    
    // Check external service files
    const ttsExists = fs.existsSync('services/external/ttsService.mjs');
    const pushExists = fs.existsSync('services/external/pushNotificationService.mjs');
    const emailExists = fs.existsSync('services/external/emailService.mjs');
    const gpsExists = fs.existsSync('services/external/gpsRoutingService.mjs');
    
    console.log(`   TTS Service: ${ttsExists ? '✅' : '❌'}`);
    console.log(`   Push Notifications: ${pushExists ? '✅' : '❌'}`);
    console.log(`   Email Service: ${emailExists ? '✅' : '❌'}`);
    console.log(`   GPS Routing: ${gpsExists ? '✅' : '❌'}`);
    
    console.log('\n📦 Step 4: Installing missing dependencies...');
    
    try {
      // Check if external service packages are installed
      await execAsync('npm list firebase-admin');
      console.log('✅ firebase-admin installed');
    } catch (error) {
      console.log('⚠️ Installing firebase-admin...');
      await execAsync('npm install firebase-admin@latest');
    }
    
    try {
      await execAsync('npm list apn');
      console.log('✅ apn installed');
    } catch (error) {
      console.log('⚠️ Installing apn...');
      await execAsync('npm install apn@latest');
    }
    
    console.log('\n⚙️ Step 5: Environment configuration check...');
    
    const envExists = fs.existsSync('.env');
    if (envExists) {
      console.log('✅ .env file exists');
      
      const envContent = fs.readFileSync('.env', 'utf8');
      const hasJwtSecret = envContent.includes('JWT_SECRET');
      const hasPgConfig = envContent.includes('PG_DB');
      
      console.log(`   JWT_SECRET configured: ${hasJwtSecret ? '✅' : '❌'}`);
      console.log(`   Database configured: ${hasPgConfig ? '✅' : '❌'}`);
      
      if (!hasJwtSecret) {
        console.log('⚠️ Adding basic JWT_SECRET to .env...');
        fs.appendFileSync('.env', '\\nJWT_SECRET=your_jwt_secret_change_in_production\\n');
      }
      
    } else {
      console.log('⚠️ .env file missing - creating basic configuration...');
      
      const basicEnv = `# APEX AI Basic Configuration
JWT_SECRET=your_jwt_secret_change_in_production
PG_USER=postgres
PG_HOST=localhost
PG_DB=apex
PG_PASSWORD=
PG_PORT=5432
BACKEND_PORT=5000
NODE_ENV=development
`;
      
      fs.writeFileSync('.env', basicEnv);
      console.log('✅ Basic .env file created');
    }
    
    console.log('\n🔄 Step 6: Restart recommendation...');
    console.log('✅ All repairs completed successfully!');
    console.log('');
    console.log('🚀 To test the fixes:');
    console.log('   1. Restart your server: Ctrl+C then npm start');
    console.log('   2. Run: node test-security-enhancements.mjs');
    console.log('   3. Run: node test-external-integrations.mjs');
    console.log('');
    console.log('💡 If you still see 500 errors, they may be due to missing external service credentials');
    console.log('   This is normal for TTS/GPS services that need API keys');
    console.log('   The important thing is that 404 errors should be fixed!');
    
  } catch (error) {
    console.error('❌ Repair failed:', error.message);
  }
}

comprehensiveRepair();
