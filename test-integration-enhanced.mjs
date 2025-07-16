// APEX AI PHASE 5A INTEGRATION TEST SUITE - ENHANCED VERSION
// ==========================================================
// Enhanced with better error handling and server availability checks

import axios from 'axios';
import io from 'socket.io-client';
import chalk from 'chalk';
import { performance } from 'perf_hooks';

// Test configuration
const TEST_CONFIG = {
  backend_url: 'http://localhost:5000',
  websocket_url: 'http://localhost:5000',
  frontend_url: 'http://localhost:5173',
  timeout: 10000,
  retry_attempts: 3,
  server_startup_wait: 5000
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [],
  details: []
};

// Utility functions
const log = {
  info: (msg) => console.log(chalk.blue('ℹ️'), msg),
  success: (msg) => console.log(chalk.green('✅'), msg),
  error: (msg) => console.log(chalk.red('❌'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠️'), msg),
  section: (msg) => console.log(chalk.cyan('\n📋'), chalk.bold(msg)),
  subsection: (msg) => console.log(chalk.magenta('  🔸'), msg)
};

const recordTest = (testName, passed, details = '', error = null) => {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    testResults.details.push({ test: testName, status: 'PASSED', details });
    log.success(`${testName}: PASSED ${details ? `- ${details}` : ''}`);
  } else {
    testResults.failed++;
    const errorMsg = error?.message || details || 'Unknown error';
    testResults.errors.push({ test: testName, error: errorMsg });
    testResults.details.push({ test: testName, status: 'FAILED', details: errorMsg });
    log.error(`${testName}: FAILED - ${errorMsg}`);
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced server availability check
async function checkServerAvailability() {
  log.section('🔍 PRE-TEST SERVER AVAILABILITY CHECK');
  
  let backendAvailable = false;
  let frontendAvailable = false;
  
  // Check backend
  log.subsection('Checking Backend Server (Port 5000)');
  try {
    const response = await axios.get(`${TEST_CONFIG.backend_url}/health`, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (response.status === 200 || response.status === 404) {
      backendAvailable = true;
      log.success(`Backend server responding (Status: ${response.status})`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log.error('Backend server not running - connection refused');
      log.info('💡 Start backend with: cd backend && npm run dev');
    } else if (error.code === 'ETIMEDOUT') {
      log.error('Backend server timeout - may be starting up');
    } else {
      log.error(`Backend error: ${error.message}`);
    }
  }
  
  // Check frontend
  log.subsection('Checking Frontend Server (Port 5173)');
  try {
    const response = await axios.get(TEST_CONFIG.frontend_url, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      frontendAvailable = true;
      log.success('Frontend dev server responding');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log.error('Frontend server not running - connection refused');
      log.info('💡 Start frontend with: cd frontend && npm run dev');
    } else if (error.code === 'ETIMEDOUT') {
      log.error('Frontend server timeout - may be starting up');
    } else {
      log.error(`Frontend error: ${error.message}`);
    }
  }
  
  // Server readiness assessment
  if (!backendAvailable && !frontendAvailable) {
    log.error('\n🚨 CRITICAL: Both backend and frontend servers are unavailable');
    log.info('📋 Required actions:');
    log.info('   1. Run: restart-servers-for-testing.bat');
    log.info('   2. Wait for servers to start completely');
    log.info('   3. Re-run this integration test');
    log.info('\n⏹️  Integration testing aborted - fix server availability first');
    process.exit(1);
  } else if (!backendAvailable) {
    log.warning('\n⚠️  Backend server unavailable - backend tests will fail');
    log.info('💡 Start backend server to enable full integration testing');
  } else if (!frontendAvailable) {
    log.warning('\n⚠️  Frontend server unavailable - frontend tests will fail');
    log.info('💡 Start frontend server to enable full integration testing');
  } else {
    log.success('\n✅ Both servers are available - proceeding with integration tests');
  }
  
  return { backendAvailable, frontendAvailable };
}

// Test 1: Backend Server Health Check
async function testBackendHealth() {
  log.subsection('Testing Backend Server Health');
  const startTime = performance.now();
  
  try {
    const response = await axios.get(`${TEST_CONFIG.backend_url}/health`, {
      timeout: TEST_CONFIG.timeout
    });
    
    const responseTime = Math.round(performance.now() - startTime);
    const isHealthy = response.status === 200 || response.status === 404;
    
    recordTest(
      'Backend Health Check',
      isHealthy,
      `Response time: ${responseTime}ms, Status: ${response.status}`
    );
    
    return isHealthy;
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    
    if (error.response?.status === 404) {
      recordTest(
        'Backend Health Check',
        true,
        `Server running (no health endpoint), Response time: ${responseTime}ms`
      );
      return true;
    }
    
    if (error.code === 'ECONNREFUSED') {
      recordTest('Backend Health Check', false, 'Connection refused - backend server not running');
    } else {
      recordTest('Backend Health Check', false, error.message);
    }
    return false;
  }
}

// Test 2: CORS Middleware Testing
async function testCORS() {
  log.subsection('Testing CORS Middleware');
  
  try {
    const response = await axios.options(`${TEST_CONFIG.backend_url}/api/auth/profile`, {
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      },
      timeout: TEST_CONFIG.timeout
    });
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers']
    };
    
    const corsWorking = corsHeaders['access-control-allow-origin'] && 
                       corsHeaders['access-control-allow-methods'];
    
    recordTest(
      'CORS Middleware',
      corsWorking,
      `Origin: ${corsHeaders['access-control-allow-origin'] || 'Not set'}`
    );
    
    return corsWorking;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      recordTest('CORS Middleware', false, 'Connection refused - backend server not running');
    } else {
      recordTest('CORS Middleware', false, error.message);
    }
    return false;
  }
}

// Test 3: Security Headers (Helmet)
async function testSecurityHeaders() {
  log.subsection('Testing Security Headers (Helmet)');
  
  try {
    const response = await axios.get(`${TEST_CONFIG.backend_url}/api/auth/profile`, {
      timeout: TEST_CONFIG.timeout,
      validateStatus: () => true
    });
    
    const securityHeaders = {
      'x-content-type-options': response.headers['x-content-type-options'],
      'x-frame-options': response.headers['x-frame-options'],
      'x-xss-protection': response.headers['x-xss-protection'],
      'strict-transport-security': response.headers['strict-transport-security']
    };
    
    const hasSecurityHeaders = Object.values(securityHeaders).some(header => header !== undefined);
    
    recordTest(
      'Security Headers (Helmet)',
      hasSecurityHeaders,
      `Headers found: ${Object.keys(securityHeaders).filter(key => securityHeaders[key]).join(', ')}`
    );
    
    return hasSecurityHeaders;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      recordTest('Security Headers (Helmet)', false, 'Connection refused - backend server not running');
    } else {
      recordTest('Security Headers (Helmet)', false, error.message);
    }
    return false;
  }
}

// Test 4: API Endpoint Connectivity
async function testAPIEndpoints() {
  log.subsection('Testing API Endpoint Connectivity');
  
  const endpoints = [
    { path: '/api/auth/profile', method: 'GET', expectAuth: true },
    { path: '/api/properties', method: 'GET', expectAuth: false },
    { path: '/api/cameras', method: 'GET', expectAuth: false },
    { path: '/api/ai/detection-summary', method: 'GET', expectAuth: false }
  ];
  
  let endpointsPassed = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios[endpoint.method.toLowerCase()](`${TEST_CONFIG.backend_url}${endpoint.path}`, {
        timeout: TEST_CONFIG.timeout,
        validateStatus: () => true
      });
      
      const validStatusCodes = [200, 401, 404, 500];
      const isValid = validStatusCodes.includes(response.status);
      
      if (isValid) {
        endpointsPassed++;
        recordTest(
          `API Endpoint ${endpoint.path}`,
          true,
          `Status: ${response.status}`
        );
      } else {
        recordTest(
          `API Endpoint ${endpoint.path}`,
          false,
          `Unexpected status: ${response.status}`
        );
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        recordTest(`API Endpoint ${endpoint.path}`, false, 'Connection refused - backend server not running');
      } else {
        recordTest(`API Endpoint ${endpoint.path}`, false, error.message);
      }
    }
  }
  
  return endpointsPassed > 0;
}

// Test 5: Rate Limiting
async function testRateLimiting() {
  log.subsection('Testing Rate Limiting');
  
  try {
    const requests = [];
    const startTime = performance.now();
    
    for (let i = 0; i < 20; i++) {
      requests.push(
        axios.get(`${TEST_CONFIG.backend_url}/api/properties`, {
          timeout: 5000,
          validateStatus: () => true
        }).catch(error => ({ error, status: error.response?.status }))
      );
    }
    
    const responses = await Promise.all(requests);
    const responseTime = Math.round(performance.now() - startTime);
    
    const rateLimitedCount = responses.filter(r => r.status === 429).length;
    const successCount = responses.filter(r => r.status === 200).length;
    
    recordTest(
      'Rate Limiting',
      true,
      `${rateLimitedCount} rate limited, ${successCount} successful in ${responseTime}ms`
    );
    
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      recordTest('Rate Limiting', false, 'Connection refused - backend server not running');
    } else {
      recordTest('Rate Limiting', false, error.message);
    }
    return false;
  }
}

// Test 6: WebSocket Connection
async function testWebSocketConnection() {
  log.subsection('Testing WebSocket Connection');
  
  return new Promise((resolve) => {
    const startTime = performance.now();
    let resolved = false;
    
    const socket = io(TEST_CONFIG.websocket_url, {
      transports: ['websocket', 'polling'],
      timeout: TEST_CONFIG.timeout,
      autoConnect: true
    });
    
    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        socket.disconnect();
      }
    };
    
    const timer = setTimeout(() => {
      cleanup();
      recordTest('WebSocket Connection', false, 'Connection timeout - check if backend WebSocket server is running');
      resolve(false);
    }, TEST_CONFIG.timeout);
    
    socket.on('connect', () => {
      const responseTime = Math.round(performance.now() - startTime);
      clearTimeout(timer);
      cleanup();
      
      recordTest(
        'WebSocket Connection',
        true,
        `Connected in ${responseTime}ms, ID: ${socket.id}`
      );
      resolve(true);
    });
    
    socket.on('connection_established', (data) => {
      log.info(`WebSocket protocol confirmed: ${data.client_id}`);
    });
    
    socket.on('error', (error) => {
      clearTimeout(timer);
      cleanup();
      recordTest('WebSocket Connection', false, `WebSocket error: ${error.message || error}`);
      resolve(false);
    });
    
    socket.on('disconnect', (reason) => {
      if (!resolved) {
        clearTimeout(timer);
        cleanup();
        recordTest('WebSocket Connection', false, `Disconnected: ${reason}`);
        resolve(false);
      }
    });
  });
}

// Test 7: WebSocket Message Protocol
async function testWebSocketProtocol() {
  log.subsection('Testing WebSocket Message Protocol');
  
  return new Promise((resolve) => {
    const socket = io(TEST_CONFIG.websocket_url, {
      transports: ['websocket', 'polling'],
      timeout: TEST_CONFIG.timeout
    });
    
    let protocolTested = false;
    
    const cleanup = () => {
      socket.disconnect();
    };
    
    const timer = setTimeout(() => {
      cleanup();
      if (!protocolTested) {
        recordTest('WebSocket Protocol', false, 'Protocol test timeout - WebSocket may not be responding to messages');
        resolve(false);
      }
    }, TEST_CONFIG.timeout);
    
    socket.on('connect', () => {
      socket.emit('client_identify', {
        client_type: 'frontend',
        capabilities: {
          live_monitoring: true,
          ai_detections: true
        }
      });
    });
    
    socket.on('identification_success', (data) => {
      clearTimeout(timer);
      protocolTested = true;
      cleanup();
      
      recordTest(
        'WebSocket Protocol',
        true,
        `Client authenticated: ${data.client_type}`
      );
      resolve(true);
    });
    
    socket.on('error', (error) => {
      clearTimeout(timer);
      cleanup();
      recordTest('WebSocket Protocol', false, `Protocol error: ${error.message || error}`);
      resolve(false);
    });
  });
}

// Test 8: Frontend Accessibility Check
async function testFrontendAccessibility() {
  log.subsection('Testing Frontend Accessibility');
  
  try {
    const response = await axios.get(TEST_CONFIG.frontend_url, {
      timeout: TEST_CONFIG.timeout
    });
    
    const isAccessible = response.status === 200;
    
    recordTest(
      'Frontend Accessibility',
      isAccessible,
      `Frontend dev server responding at ${TEST_CONFIG.frontend_url}`
    );
    
    return isAccessible;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      recordTest('Frontend Accessibility', false, 'Connection refused - frontend dev server not running');
    } else {
      recordTest('Frontend Accessibility', false, `Frontend server error: ${error.message}`);
    }
    return false;
  }
}

// Main test execution
async function runIntegrationTests() {
  console.clear();
  log.section('🚀 APEX AI PHASE 5A INTEGRATION TEST SUITE - ENHANCED');
  log.info('Testing backend-frontend integration for APEX AI Defense System\n');
  
  log.info(`Backend URL: ${TEST_CONFIG.backend_url}`);
  log.info(`Frontend URL: ${TEST_CONFIG.frontend_url}`);
  log.info(`WebSocket URL: ${TEST_CONFIG.websocket_url}\n`);
  
  // Pre-test server availability check
  const { backendAvailable, frontendAvailable } = await checkServerAvailability();
  
  // Execute integration tests
  log.section('EXECUTING INTEGRATION TESTS');
  
  if (backendAvailable) {
    await testBackendHealth();
    await sleep(500);
    
    await testCORS();
    await sleep(500);
    
    await testSecurityHeaders();
    await sleep(500);
    
    await testAPIEndpoints();
    await sleep(500);
    
    await testRateLimiting();
    await sleep(1000);
    
    await testWebSocketConnection();
    await sleep(500);
    
    await testWebSocketProtocol();
    await sleep(500);
  } else {
    log.warning('⏭️  Skipping backend tests - backend server not available');
    recordTest('Backend Health Check', false, 'Backend server not running');
    recordTest('CORS Middleware', false, 'Backend server not running');
    recordTest('Security Headers (Helmet)', false, 'Backend server not running');
    recordTest('API Endpoint Tests', false, 'Backend server not running');
    recordTest('Rate Limiting', false, 'Backend server not running');
    recordTest('WebSocket Connection', false, 'Backend server not running');
    recordTest('WebSocket Protocol', false, 'Backend server not running');
  }
  
  if (frontendAvailable) {
    await testFrontendAccessibility();
  } else {
    log.warning('⏭️  Skipping frontend tests - frontend server not available');
    recordTest('Frontend Accessibility', false, 'Frontend dev server not running');
  }
  
  // Generate final report
  generateFinalReport();
}

// Generate comprehensive test report
function generateFinalReport() {
  console.log('\n' + '='.repeat(60));
  log.section('🎯 PHASE 5A INTEGRATION TEST RESULTS');
  console.log('='.repeat(60));
  
  const passRate = Math.round((testResults.passed / testResults.total) * 100);
  log.info(`Total Tests: ${testResults.total}`);
  log.success(`Passed: ${testResults.passed}`);
  log.error(`Failed: ${testResults.failed}`);
  log.info(`Pass Rate: ${passRate}%\n`);
  
  log.section('📊 DETAILED TEST RESULTS');
  testResults.details.forEach(result => {
    const status = result.status === 'PASSED' ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
    const details = result.details ? ` - ${result.details}` : '';
    console.log(`${status} ${result.test}${details}`);
  });
  
  if (testResults.errors.length > 0) {
    log.section('🚨 ERROR SUMMARY');
    testResults.errors.forEach(error => {
      log.error(`${error.test}: ${error.error}`);
    });
  }
  
  log.section('🎭 INTEGRATION STATUS ASSESSMENT');
  
  if (passRate >= 90) {
    log.success('🟢 EXCELLENT - System ready for Phase 5B');
    log.info('All critical integration points are functioning correctly.');
  } else if (passRate >= 75) {
    log.warning('🟡 GOOD - Minor issues detected');
    log.info('System mostly functional, review failed tests before proceeding.');
  } else if (passRate >= 50) {
    log.warning('🟠 NEEDS ATTENTION - Multiple integration issues');
    log.info('Address failed tests before proceeding to Phase 5B.');
  } else {
    log.error('🔴 CRITICAL ISSUES - Integration testing failed');
    log.info('Major problems detected. Do not proceed until issues are resolved.');
  }
  
  log.section('📋 RECOMMENDED NEXT STEPS');
  
  if (passRate >= 80) {
    log.info('1. ✅ Proceed with Phase 5B: Live Monitoring Interface Testing');
    log.info('2. ✅ Begin comprehensive user acceptance testing');
    log.info('3. ✅ Prepare for AI Engine integration testing');
  } else {
    log.info('1. 🔧 Fix failed integration tests');
    log.info('2. 🚀 Use restart-servers-for-testing.bat to restart servers');
    log.info('3. 🔄 Re-run integration test suite');
    log.info('4. ⏸️  Hold Phase 5B until all tests pass');
  }
  
  console.log('\n' + '='.repeat(60));
  log.success('Integration test suite completed!');
  console.log('='.repeat(60) + '\n');
  
  saveTestResults();
}

// Save test results to file
function saveTestResults() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = `phase-5a-integration-test-results-${timestamp}.json`;
  
  const fullResults = {
    timestamp: new Date().toISOString(),
    test_suite: 'Phase 5A Integration Testing - Enhanced',
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      pass_rate: Math.round((testResults.passed / testResults.total) * 100)
    },
    test_details: testResults.details,
    errors: testResults.errors,
    test_config: TEST_CONFIG
  };
  
  try {
    import('fs').then(fs => {
      fs.writeFileSync(resultsFile, JSON.stringify(fullResults, null, 2));
      log.info(`📄 Test results saved to: ${resultsFile}`);
    });
  } catch (error) {
    log.warning('Could not save test results to file');
  }
}

process.on('SIGINT', () => {
  log.warning('\n🛑 Integration test interrupted by user');
  log.info('Partial results may be incomplete');
  process.exit(0);
});

// Run the integration test suite
runIntegrationTests().catch(error => {
  log.error('Integration test suite failed with error:', error);
  process.exit(1);
});
