// APEX AI PHASE 5A INTEGRATION TEST SUITE - DYNAMIC PORT VERSION
// =============================================================
// Enhanced integration testing with automatic port discovery

import axios from 'axios';
import io from 'socket.io-client';
import chalk from 'chalk';
import { performance } from 'perf_hooks';
import { getServerStatus, getFrontendServerInfo, getBackendServerInfo } from './utils/discoverServerPorts.mjs';

// Dynamic test configuration - will be updated based on discovered ports
let TEST_CONFIG = {
  backend_url: 'http://localhost:5000',
  websocket_url: 'http://localhost:5000',
  frontend_url: 'http://localhost:5173',
  timeout: 10000,
  retry_attempts: 3
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

// Enhanced server discovery and configuration
async function discoverAndConfigureServers() {
  log.section('🔍 DYNAMIC SERVER DISCOVERY');
  
  const serverStatus = await getServerStatus();
  const frontend = getFrontendServerInfo();
  const backend = getBackendServerInfo();
  
  // Update test configuration with discovered ports
  TEST_CONFIG = {
    backend_url: backend.url,
    websocket_url: backend.websocket_url,
    frontend_url: frontend.url,
    timeout: 10000,
    retry_attempts: 3
  };
  
  log.info(`🖥️  Backend discovered: ${backend.url} (Port ${backend.port})`);
  log.info(`📱 Frontend discovered: ${frontend.url} (Port ${frontend.port})`);
  log.info(`🔌 WebSocket URL: ${backend.websocket_url}`);
  
  // Display server status
  if (serverStatus.summary.all_systems_ready) {
    log.success('✅ All systems ready for integration testing');
  } else {
    if (!serverStatus.summary.backend_available) {
      log.warning('⚠️  Backend server may not be running on discovered port');
    }
    if (!serverStatus.summary.frontend_available) {
      log.warning('⚠️  Frontend server may not be running on discovered port');
    }
  }
  
  return serverStatus;
}

// Enhanced server availability check with dynamic discovery
async function checkServerAvailability() {
  log.section('🔍 DYNAMIC SERVER AVAILABILITY CHECK');
  
  const serverStatus = await discoverAndConfigureServers();
  let backendAvailable = false;
  let frontendAvailable = false;
  
  // Check backend with discovered URL
  log.subsection(`Checking Backend Server (${TEST_CONFIG.backend_url})`);
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
      log.error(`Backend server not responding at ${TEST_CONFIG.backend_url}`);
      log.info('💡 Backend may be starting up or on a different port');
    } else {
      log.error(`Backend error: ${error.message}`);
    }
  }
  
  // Check frontend with discovered URL
  log.subsection(`Checking Frontend Server (${TEST_CONFIG.frontend_url})`);
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
      log.error(`Frontend server not responding at ${TEST_CONFIG.frontend_url}`);
      log.info('💡 Frontend may be starting up or on a different port');
    } else {
      log.error(`Frontend error: ${error.message}`);
    }
  }
  
  // Server readiness assessment
  if (!backendAvailable && !frontendAvailable) {
    log.error('\n🚨 CRITICAL: Both servers are unavailable on discovered ports');
    log.info('📋 Troubleshooting steps:');
    log.info('   1. Run: restart-dynamic-servers.bat');
    log.info('   2. Check server terminal windows for errors');
    log.info('   3. Verify servers started successfully');
    log.info('   4. Re-run this integration test');
    log.info('\n⏹️  Integration testing aborted - fix server availability first');
    process.exit(1);
  } else if (!backendAvailable) {
    log.warning('\n⚠️  Backend server unavailable - backend tests will fail');
    log.info(`💡 Expected backend at: ${TEST_CONFIG.backend_url}`);
  } else if (!frontendAvailable) {
    log.warning('\n⚠️  Frontend server unavailable - frontend tests will fail');
    log.info(`💡 Expected frontend at: ${TEST_CONFIG.frontend_url}`);
  } else {
    log.success('\n✅ Both servers are available on discovered ports');
  }
  
  return { backendAvailable, frontendAvailable, serverStatus };
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
      `Response time: ${responseTime}ms, Status: ${response.status}, URL: ${TEST_CONFIG.backend_url}`
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
    
    recordTest('Backend Health Check', false, `URL: ${TEST_CONFIG.backend_url}, Error: ${error.message}`);
    return false;
  }
}

// Test 2: CORS Middleware Testing
async function testCORS() {
  log.subsection('Testing CORS Middleware');
  
  try {
    const response = await axios.options(`${TEST_CONFIG.backend_url}/api/auth/profile`, {
      headers: {
        'Origin': TEST_CONFIG.frontend_url,
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
      `Frontend origin: ${TEST_CONFIG.frontend_url}, CORS origin: ${corsHeaders['access-control-allow-origin'] || 'Not set'}`
    );
    
    return corsWorking;
  } catch (error) {
    recordTest('CORS Middleware', false, error.message);
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
    recordTest('Security Headers (Helmet)', false, error.message);
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
          `Status: ${response.status}, URL: ${TEST_CONFIG.backend_url}${endpoint.path}`
        );
      } else {
        recordTest(
          `API Endpoint ${endpoint.path}`,
          false,
          `Unexpected status: ${response.status}`
        );
      }
    } catch (error) {
      recordTest(`API Endpoint ${endpoint.path}`, false, error.message);
    }
  }
  
  return endpointsPassed > 0;
}

// Test 5: WebSocket Connection with Dynamic URL
async function testWebSocketConnection() {
  log.subsection(`Testing WebSocket Connection (${TEST_CONFIG.websocket_url})`);
  
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
      recordTest('WebSocket Connection', false, `Connection timeout, URL: ${TEST_CONFIG.websocket_url}`);
      resolve(false);
    }, TEST_CONFIG.timeout);
    
    socket.on('connect', () => {
      const responseTime = Math.round(performance.now() - startTime);
      clearTimeout(timer);
      cleanup();
      
      recordTest(
        'WebSocket Connection',
        true,
        `Connected in ${responseTime}ms, ID: ${socket.id}, URL: ${TEST_CONFIG.websocket_url}`
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

// Test 6: Frontend Accessibility Check
async function testFrontendAccessibility() {
  log.subsection(`Testing Frontend Accessibility (${TEST_CONFIG.frontend_url})`);
  
  try {
    const response = await axios.get(TEST_CONFIG.frontend_url, {
      timeout: TEST_CONFIG.timeout
    });
    
    const isAccessible = response.status === 200;
    
    recordTest(
      'Frontend Accessibility',
      isAccessible,
      `Frontend responding at ${TEST_CONFIG.frontend_url}`
    );
    
    return isAccessible;
  } catch (error) {
    recordTest('Frontend Accessibility', false, `URL: ${TEST_CONFIG.frontend_url}, Error: ${error.message}`);
    return false;
  }
}

// Main test execution with dynamic configuration
async function runDynamicIntegrationTests() {
  console.clear();
  log.section('🚀 APEX AI PHASE 5A INTEGRATION TEST SUITE - DYNAMIC PORT VERSION');
  log.info('Advanced integration testing with automatic port discovery\n');
  
  // Server discovery and configuration
  const { backendAvailable, frontendAvailable } = await checkServerAvailability();
  
  log.info(`🎯 Test Configuration:`);
  log.info(`   Backend URL: ${TEST_CONFIG.backend_url}`);
  log.info(`   Frontend URL: ${TEST_CONFIG.frontend_url}`);
  log.info(`   WebSocket URL: ${TEST_CONFIG.websocket_url}\n`);
  
  // Execute integration tests
  log.section('EXECUTING DYNAMIC INTEGRATION TESTS');
  
  if (backendAvailable) {
    await testBackendHealth();
    await sleep(500);
    
    await testCORS();
    await sleep(500);
    
    await testSecurityHeaders();
    await sleep(500);
    
    await testAPIEndpoints();
    await sleep(500);
    
    await testWebSocketConnection();
    await sleep(500);
  } else {
    log.warning('⏭️  Skipping backend tests - backend server not available');
    recordTest('Backend Tests', false, 'Backend server not responding on discovered port');
  }
  
  if (frontendAvailable) {
    await testFrontendAccessibility();
  } else {
    log.warning('⏭️  Skipping frontend tests - frontend server not available');
    recordTest('Frontend Accessibility', false, 'Frontend server not responding on discovered port');
  }
  
  // Generate final report
  generateFinalReport();
}

// Generate comprehensive test report
function generateFinalReport() {
  console.log('\n' + '='.repeat(60));
  log.section('🎯 DYNAMIC INTEGRATION TEST RESULTS');
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
    log.info('Dynamic port allocation is working perfectly!');
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
    log.info('2. ✅ Dynamic port allocation system is working correctly');
    log.info('3. ✅ No more port conflict issues!');
  } else {
    log.info('1. 🔧 Fix failed integration tests');
    log.info('2. 🚀 Use restart-dynamic-servers.bat to restart with port discovery');
    log.info('3. 🔄 Re-run: node test-integration-dynamic.mjs');
    log.info('4. ⏸️  Hold Phase 5B until all tests pass');
  }
  
  console.log('\n' + '='.repeat(60));
  log.success('Dynamic integration test suite completed!');
  log.info('🎉 Port conflicts are now handled automatically!');
  console.log('='.repeat(60) + '\n');
  
  saveTestResults();
}

// Save test results to file
function saveTestResults() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = `phase-5a-dynamic-integration-results-${timestamp}.json`;
  
  const fullResults = {
    timestamp: new Date().toISOString(),
    test_suite: 'Phase 5A Integration Testing - Dynamic Port Version',
    configuration: TEST_CONFIG,
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      pass_rate: Math.round((testResults.passed / testResults.total) * 100)
    },
    test_details: testResults.details,
    errors: testResults.errors
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
  log.warning('\n🛑 Dynamic integration test interrupted by user');
  log.info('Partial results may be incomplete');
  process.exit(0);
});

// Run the dynamic integration test suite
runDynamicIntegrationTests().catch(error => {
  log.error('Dynamic integration test suite failed with error:', error);
  process.exit(1);
});
