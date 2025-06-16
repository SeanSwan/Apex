/**
 * APEX AI PLATFORM - QUICK STATUS CHECK
 * ====================================
 * Check if repairs were successful
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

console.log('🔍 APEX AI Platform - Quick Status Check...\n');

async function quickStatusCheck() {
  let issuesFound = 0;
  let fixesWorking = 0;

  function checkResult(name, condition, details = '') {
    if (condition) {
      fixesWorking++;
      console.log(`✅ ${name} ${details}`);
    } else {
      issuesFound++;
      console.log(`❌ ${name} ${details}`);
    }
  }

  try {
    // 1. Check database connection
    console.log('📊 1. Database Check...');
    
    const pool = new Pool({
      user: process.env.PG_USER || 'postgres',
      host: process.env.PG_HOST || 'localhost',
      database: process.env.PG_DB || 'apex',
      password: process.env.PG_PASSWORD || '',
      port: Number(process.env.PG_PORT || 5432),
    });

    try {
      const client = await pool.connect();
      checkResult('Database Connection', true, '- Connected successfully');
      
      // Check for new tables
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('guard_devices', 'guard_notifications', 'camera_zones', 'threat_vectors', 'guard_dispatches')
      `;
      
      const tablesResult = await client.query(tablesQuery);
      const foundTables = tablesResult.rows.map(row => row.table_name);
      
      checkResult('Required Tables Created', foundTables.length >= 4, `- Found ${foundTables.length}/5 tables: ${foundTables.join(', ')}`);
      
      // Check sample data
      const camerasCount = await client.query('SELECT COUNT(*) FROM cameras');
      const guardsCount = await client.query('SELECT COUNT(*) FROM guards');
      
      checkResult('Sample Cameras', parseInt(camerasCount.rows[0].count) > 0, `- ${camerasCount.rows[0].count} cameras`);
      checkResult('Sample Guards', parseInt(guardsCount.rows[0].count) > 0, `- ${guardsCount.rows[0].count} guards`);
      
      client.release();
      await pool.end();
      
    } catch (dbError) {
      checkResult('Database Connection', false, `- Error: ${dbError.message}`);
    }

    console.log('\n🔒 2. Security Files Check...');
    
    // 2. Check security files
    const securityFiles = [
      'middleware/security/rateLimiter.mjs',
      'middleware/security/validation.mjs'
    ];
    
    securityFiles.forEach(file => {
      const exists = fs.existsSync(file);
      checkResult(`Security File (${file})`, exists, exists ? '- File exists' : '- File missing');
    });

    console.log('\n🌐 3. External Service Files Check...');
    
    // 3. Check external service files
    const serviceFiles = [
      'services/external/ttsService.mjs',
      'services/external/pushNotificationService.mjs',
      'services/external/emailService.mjs',
      'services/external/gpsRoutingService.mjs'
    ];
    
    serviceFiles.forEach(file => {
      const exists = fs.existsSync(file);
      checkResult(`Service File (${file.split('/').pop()})`, exists, exists ? '- Ready' : '- Missing');
    });

    console.log('\n⚙️ 4. Configuration Check...');
    
    // 4. Check environment configuration
    const envExists = fs.existsSync('.env');
    checkResult('Environment File', envExists, envExists ? '- .env file exists' : '- .env file missing');
    
    if (envExists) {
      const envContent = fs.readFileSync('.env', 'utf8');
      checkResult('JWT Secret', envContent.includes('JWT_SECRET'), '- Configured');
      checkResult('Database Config', envContent.includes('PG_DB'), '- Configured');
    }

    console.log('\n📦 5. Package Dependencies...');
    
    // 5. Check if packages are listed in package.json
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      checkResult('Helmet Package', !!packageJson.dependencies.helmet, '- Security headers');
      checkResult('Rate Limiting Package', !!packageJson.dependencies['express-rate-limit'], '- DDoS protection');
      checkResult('Validation Package', !!packageJson.dependencies['express-validator'], '- Input validation');
    } catch (packageError) {
      checkResult('Package.json', false, `- Error reading: ${packageError.message}`);
    }

    console.log('\n📈 STATUS SUMMARY');
    console.log('=================');
    console.log(`✅ Working: ${fixesWorking}`);
    console.log(`❌ Issues: ${issuesFound}`);
    
    const healthPercentage = Math.round((fixesWorking / (fixesWorking + issuesFound)) * 100);
    console.log(`🎯 System Health: ${healthPercentage}%`);
    
    if (healthPercentage >= 90) {
      console.log('\n🎉 EXCELLENT! Repairs were successful!');
      console.log('✅ Your APEX AI Platform is ready for testing');
      console.log('\n🚀 Next: Run the integration test:');
      console.log('   node test-integration-improved.mjs');
    } else if (healthPercentage >= 75) {
      console.log('\n⚠️ GOOD! Most repairs successful, minor issues remain');
      console.log('🔧 Run the comprehensive repair if needed:');
      console.log('   node comprehensive-repair.mjs');
    } else {
      console.log('\n❌ Issues detected. Run the repair script:');
      console.log('   repair-all.bat');
    }

  } catch (error) {
    console.error('❌ Status check failed:', error.message);
  }
}

quickStatusCheck();
