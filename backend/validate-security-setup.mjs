/**
 * APEX AI SECURITY VALIDATION SCRIPT
 * ==================================
 * Validates security configuration without starting server
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔒 APEX AI Security Configuration Validation');
console.log('===========================================\n');

async function validateSecuritySetup() {
  let passed = 0;
  let failed = 0;
  let warnings = 0;

  function check(name, condition, message, isWarning = false) {
    if (condition) {
      console.log(`✅ ${name}: ${message}`);
      passed++;
    } else {
      const symbol = isWarning ? '⚠️' : '❌';
      console.log(`${symbol} ${name}: ${message}`);
      isWarning ? warnings++ : failed++;
    }
  }

  // 1. Check dependencies
  console.log('📦 Checking Dependencies...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    check('Helmet', packageJson.dependencies.helmet, 'Security headers package installed');
    check('Express Rate Limit', packageJson.dependencies['express-rate-limit'], 'Rate limiting package installed');
    check('Express Validator', packageJson.dependencies['express-validator'], 'Input validation package installed');
    check('Sanitize HTML', packageJson.dependencies['sanitize-html'], 'HTML sanitization package installed');
    
  } catch (error) {
    check('Package.json', false, 'Could not read package.json');
  }

  console.log('\n🔧 Checking Security Middleware...');
  
  // 2. Check security middleware files
  const securityFiles = [
    'middleware/security/rateLimiter.mjs',
    'middleware/security/validation.mjs'
  ];

  for (const file of securityFiles) {
    const exists = fs.existsSync(file);
    check(`Security Middleware (${file})`, exists, exists ? 'File exists' : 'File missing');
    
    if (exists) {
      const content = fs.readFileSync(file, 'utf8');
      check(`${file} - Imports`, content.includes('express-rate-limit') || content.includes('express-validator'), 'Contains security imports');
      check(`${file} - Exports`, content.includes('export'), 'Exports middleware functions');
    }
  }

  console.log('\n⚙️ Checking Server Configuration...');
  
  // 3. Check server.mjs integration
  try {
    const serverContent = fs.readFileSync('src/server.mjs', 'utf8');
    
    check('Helmet Import', serverContent.includes("import helmet from 'helmet'"), 'Helmet imported in server');
    check('Rate Limiter Import', serverContent.includes('rateLimiter.mjs'), 'Rate limiter imported in server');
    check('Security Headers', serverContent.includes('securityHeaders'), 'Security headers middleware imported');
    check('Helmet Usage', serverContent.includes('app.use(helmet'), 'Helmet middleware applied');
    check('Rate Limiting Usage', serverContent.includes('app.use(apiLimiter'), 'Rate limiting applied');
    check('Auth Rate Limiting', serverContent.includes('authLimiter'), 'Auth rate limiting applied');
    
  } catch (error) {
    check('Server File', false, 'Could not read src/server.mjs');
  }

  console.log('\n🌐 Checking Environment Configuration...');
  
  // 4. Check .env file
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    
    check('JWT Secret', envContent.includes('JWT_SECRET'), 'JWT secret configured');
    check('Database Config', envContent.includes('PG_'), 'Database configuration present');
    
    // Check for security-related env vars (warnings only)
    check('Rate Limit Config', envContent.includes('API_RATE_LIMIT'), 'API rate limit configured', true);
    check('CORS Origins', envContent.includes('CORS_ALLOWED_ORIGINS'), 'CORS origins configured', true);
    
  } catch (error) {
    check('Environment File', false, 'Could not read .env file', true);
  }

  console.log('\n📁 Checking File Structure...');
  
  // 5. Check directory structure
  const requiredDirs = [
    'src',
    'middleware',
    'middleware/security',
    'routes',
    'routes/ai'
  ];

  for (const dir of requiredDirs) {
    const exists = fs.existsSync(dir);
    check(`Directory (${dir})`, exists, exists ? 'Directory exists' : 'Directory missing');
  }

  // 6. Check AI routes
  const aiRoutes = [
    'routes/ai/alertRoutes.mjs',
    'routes/ai/dispatchRoutes.mjs',
    'routes/ai/cameraRoutes.mjs'
  ];

  for (const route of aiRoutes) {
    const exists = fs.existsSync(route);
    check(`AI Route (${route})`, exists, exists ? 'Route file exists' : 'Route file missing', true);
  }

  console.log('\n📊 VALIDATION SUMMARY');
  console.log('====================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  
  if (failed === 0) {
    console.log('\n🎉 SECURITY CONFIGURATION VALIDATED SUCCESSFULLY!');
    console.log('🚀 Your APEX AI Platform is ready for secure operation!');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Start your server: npm start');
    console.log('2. Test security: node test-security-enhancements.mjs');
    console.log('3. Begin external service integration');
    
  } else {
    console.log('\n⚠️  CONFIGURATION ISSUES DETECTED');
    console.log('Please fix the failed checks before proceeding.');
  }

  if (warnings > 0) {
    console.log('\n💡 Optional Improvements:');
    console.log('- Add API_RATE_LIMIT to .env');
    console.log('- Configure CORS_ALLOWED_ORIGINS for production');
    console.log('- Verify all AI route files are present');
  }
}

// Run validation
validateSecuritySetup().catch(console.error);
