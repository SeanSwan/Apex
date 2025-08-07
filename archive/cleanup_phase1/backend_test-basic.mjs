#!/usr/bin/env node

/**
 * BASIC API TEST - APEX AI PLATFORM
 * =================================
 * Tests only the essential endpoints to verify the server is working
 */

// Using built-in fetch (Node.js 18+)
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');

async function testBasicEndpoints() {
  log('🔍 BASIC API TEST - APEX AI PLATFORM', 'cyan');
  log('====================================', 'cyan');
  
  let passed = 0;
  let total = 0;
  
  const tests = [
    {
      name: 'Health Check',
      url: '/api/health',
      method: 'GET'
    },
    {
      name: 'JWT Test',
      url: '/api/test-jwt', 
      method: 'GET'
    }
  ];
  
  for (const test of tests) {
    total++;
    logInfo(`Testing: ${test.name}`);
    
    try {
      const response = await fetch(`${API_BASE}${test.url}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        logSuccess(`${test.name} - OK (${response.status})`);
        if (test.name === 'Health Check') {
          log(`   Status: ${data.status}`, 'blue');
          log(`   Timestamp: ${data.timestamp}`, 'blue');
        }
        passed++;
      } else {
        logError(`${test.name} - Failed (${response.status})`);
      }
    } catch (error) {
      logError(`${test.name} - Error: ${error.message}`);
    }
    
    log(''); // Empty line
  }
  
  // Summary
  log('📊 TEST SUMMARY', 'cyan');
  log('===============', 'cyan');
  log(`Total Tests: ${total}`, 'blue');
  log(`Passed: ${passed}`, passed === total ? 'green' : 'yellow');
  log(`Failed: ${total - passed}`, total - passed === 0 ? 'green' : 'red');
  
  if (passed === total) {
    log('\n🎉 EXCELLENT! Basic server functionality is working!', 'green');
    log('✅ Your server is ready for the Enhanced AI Dispatch system!', 'green');
    log('\n🚀 Next Steps:', 'cyan');
    log('  1. Open your frontend: http://localhost:3000', 'blue');
    log('  2. Test the Live Monitoring Dashboard', 'blue');
    log('  3. Click the Enhanced AI Dispatch buttons', 'blue');
  } else {
    log('\n❌ Some basic tests failed.', 'red');
    log('🔧 Check that:', 'yellow');
    log('  - The server is running on port 5000', 'yellow');
    log('  - Database is connected', 'yellow');
    log('  - No firewall blocking localhost:5000', 'yellow');
  }
}

// Run tests
testBasicEndpoints().catch(error => {
  logError(`Test suite failed: ${error.message}`);
});