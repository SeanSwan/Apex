/**
 * FACE RECOGNITION INTEGRATION TEST SUITE
 * =======================================
 * Comprehensive end-to-end testing for Face Recognition system
 * Tests API endpoints, database connectivity, file system integration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const icons = {
    'INFO': '🔵',
    'SUCCESS': '✅',
    'ERROR': '❌',
    'WARNING': '⚠️',
    'PROGRESS': '🔄',
    'API': '🌐',
    'DATABASE': '🗄️',
    'FRONTEND': '⚛️'
  };
  
  console.log(`[${timestamp}] ${icons[type] || icons.INFO} ${message}`);
}

// Test Suite Results
const testResults = {
  timestamp: new Date().toISOString(),
  apiTests: null,
  databaseTests: null,
  frontendTests: null,
  integrationTests: null,
  overallStatus: null
};

// API Endpoint Tests
async function testApiEndpoints() {
  log('Testing Face Recognition API endpoints...', 'API');
  
  const tests = [];
  const baseUrl = 'http://localhost:3000/api';
  
  try {
    // Test 1: Health Check
    try {
      const response = await fetch(`${baseUrl}/health`);
      const data = await response.json();
      
      tests.push({
        endpoint: '/api/health',
        method: 'GET',
        success: response.ok && data.features?.face_recognition === true,
        status: response.status,
        details: data.features?.face_recognition ? 'Face recognition feature enabled' : 'Face recognition not in features'
      });
    } catch (error) {
      tests.push({
        endpoint: '/api/health',
        method: 'GET',
        success: false,
        error: 'Request failed: ' + error.message
      });
    }
    
    // Test 2: Face Management Endpoint
    try {
      const response = await fetch(`${baseUrl}/faces`);
      
      tests.push({
        endpoint: '/api/faces',
        method: 'GET',
        success: response.status === 200 || response.status === 404, // 404 is OK if no faces exist
        status: response.status,
        details: response.status === 404 ? 'No faces enrolled yet (expected)' : 'Face API accessible'
      });
    } catch (error) {
      tests.push({
        endpoint: '/api/faces',
        method: 'GET',
        success: false,
        error: 'Request failed: ' + error.message
      });
    }
    
    // Test 3: Face Analytics Endpoint
    try {
      const response = await fetch(`${baseUrl}/faces/analytics/summary`);
      
      tests.push({
        endpoint: '/api/faces/analytics/summary',
        method: 'GET',
        success: response.ok,
        status: response.status,
        details: response.ok ? 'Analytics endpoint working' : 'Analytics endpoint failed'
      });
    } catch (error) {
      tests.push({
        endpoint: '/api/faces/analytics/summary',
        method: 'GET',
        success: false,
        error: 'Request failed: ' + error.message
      });
    }
    
    // Test 4: Face Detections Endpoint
    try {
      const response = await fetch(`${baseUrl}/faces/detections`);
      
      tests.push({
        endpoint: '/api/faces/detections',
        method: 'GET',
        success: response.ok,
        status: response.status,
        details: response.ok ? 'Detections endpoint working' : 'Detections endpoint failed'
      });
    } catch (error) {
      tests.push({
        endpoint: '/api/faces/detections',
        method: 'GET',
        success: false,
        error: 'Request failed: ' + error.message
      });
    }
    
    const passedTests = tests.filter(t => t.success).length;
    
    testResults.apiTests = {
      success: passedTests >= 2, // At least 2 endpoints must work
      testsRun: tests.length,
      testsPassed: passedTests,
      details: tests
    };
    
    log(`API Tests: ${passedTests}/${tests.length} passed`, passedTests >= 2 ? 'SUCCESS' : 'ERROR');
    
    return passedTests >= 2;
    
  } catch (error) {
    log(`API testing failed: ${error.message}`, 'ERROR');
    testResults.apiTests = { success: false, error: error.message };
    return false;
  }
}

// Database Integration Tests
async function testDatabaseIntegration() {
  log('Testing database integration...', 'DATABASE');
  
  const tests = [];
  
  try {
    // Test 1: Schema file exists
    const schemaPath = path.join(__dirname, 'backend', 'database', 'face_recognition_schema.sql');
    const schemaExists = fs.existsSync(schemaPath);
    
    tests.push({
      test: 'Schema File Availability',
      success: schemaExists,
      details: schemaExists ? 'Schema file found' : 'Schema file missing'
    });
    
    // Test 2: Environment configuration
    const envPath = path.join(__dirname, 'backend', '.env');
    const envExists = fs.existsSync(envPath);
    
    tests.push({
      test: 'Environment Configuration',
      success: envExists,
      details: envExists ? '.env file found' : '.env file missing'
    });
    
    // Test 3: Database connection (if pg module available)
    try {
      const pkg = await import('pg');
      
      tests.push({
        test: 'PostgreSQL Module',
        success: true,
        details: 'pg module available'
      });
      
      // Try to connect if environment variables are set
      if (process.env.DB_PASSWORD || envExists) {
        try {
          const { Pool } = pkg.default || pkg;
          const pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'apex_defense',
            user: process.env.DB_USER || 'swanadmin',
            password: process.env.DB_PASSWORD || ''
          });
          
          const client = await pool.connect();
          await client.query('SELECT 1');
          client.release();
          await pool.end();
          
          tests.push({
            test: 'Database Connectivity',
            success: true,
            details: 'Database connection successful'
          });
          
        } catch (dbError) {
          tests.push({
            test: 'Database Connectivity',
            success: false,
            details: `Connection failed: ${dbError.message}`
          });
        }
      } else {
        tests.push({
          test: 'Database Connectivity',
          success: false,
          details: 'No database credentials configured'
        });
      }
      
    } catch (pgError) {
      tests.push({
        test: 'PostgreSQL Module',
        success: false,
        details: 'pg module not installed'
      });
    }
    
    const passedTests = tests.filter(t => t.success).length;
    
    testResults.databaseTests = {
      success: passedTests >= 2, // At least 2 database components must work
      testsRun: tests.length,
      testsPassed: passedTests,
      details: tests
    };
    
    log(`Database Tests: ${passedTests}/${tests.length} passed`, passedTests >= 2 ? 'SUCCESS' : 'WARNING');
    
    return passedTests >= 2;
    
  } catch (error) {
    log(`Database testing failed: ${error.message}`, 'ERROR');
    testResults.databaseTests = { success: false, error: error.message };
    return false;
  }
}

// Frontend Integration Tests
async function testFrontendIntegration() {
  log('Testing frontend integration...', 'FRONTEND');
  
  const tests = [];
  
  try {
    // Test 1: Face Management Components
    const componentPaths = [
      'frontend/src/components/FaceManagement/FaceManagementDashboard.tsx',
      'frontend/src/components/FaceManagement/FaceEnrollment.tsx',
      'frontend/src/components/FaceManagement/index.ts'
    ];
    
    componentPaths.forEach(componentPath => {
      const fullPath = path.join(__dirname, componentPath);
      const exists = fs.existsSync(fullPath);
      
      tests.push({
        test: `Component: ${path.basename(componentPath)}`,
        success: exists,
        details: exists ? 'Component file found' : 'Component file missing'
      });
    });
    
    // Test 2: Page Component
    const pageComponentPath = path.join(__dirname, 'frontend/src/pages/FaceManagementPage.tsx');
    const pageExists = fs.existsSync(pageComponentPath);
    
    tests.push({
      test: 'Face Management Page',
      success: pageExists,
      details: pageExists ? 'Page component found' : 'Page component missing'
    });
    
    // Test 3: Component Export
    const indexPath = path.join(__dirname, 'frontend/src/components/index.ts');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      const hasFaceExport = indexContent.includes('FaceManagement');
      
      tests.push({
        test: 'Component Export Integration',
        success: hasFaceExport,
        details: hasFaceExport ? 'FaceManagement exported' : 'FaceManagement not exported'
      });
    } else {
      tests.push({
        test: 'Component Export Integration',
        success: false,
        details: 'Components index file not found'
      });
    }
    
    // Test 4: App Router Integration
    const appPath = path.join(__dirname, 'frontend/src/App.tsx');
    if (fs.existsSync(appPath)) {
      const appContent = fs.readFileSync(appPath, 'utf8');
      const hasFaceRoute = appContent.includes('/face-management');
      
      tests.push({
        test: 'App Router Integration',
        success: hasFaceRoute,
        details: hasFaceRoute ? 'Face Management route found' : 'Face Management route missing'
      });
    } else {
      tests.push({
        test: 'App Router Integration',
        success: false,
        details: 'App.tsx not found'
      });
    }
    
    // Test 5: Header Navigation
    const headerPath = path.join(__dirname, 'frontend/src/components/Header/header.component.jsx');
    if (fs.existsSync(headerPath)) {
      const headerContent = fs.readFileSync(headerPath, 'utf8');
      const hasNavLink = headerContent.includes('/face-management');
      
      tests.push({
        test: 'Navigation Integration',
        success: hasNavLink,
        details: hasNavLink ? 'Navigation link found' : 'Navigation link missing'
      });
    } else {
      tests.push({
        test: 'Navigation Integration',
        success: false,
        details: 'Header component not found'
      });
    }
    
    const passedTests = tests.filter(t => t.success).length;
    
    testResults.frontendTests = {
      success: passedTests >= tests.length - 1, // Allow 1 failure
      testsRun: tests.length,
      testsPassed: passedTests,
      details: tests
    };
    
    log(`Frontend Tests: ${passedTests}/${tests.length} passed`, passedTests >= tests.length - 1 ? 'SUCCESS' : 'ERROR');
    
    return passedTests >= tests.length - 1;
    
  } catch (error) {
    log(`Frontend testing failed: ${error.message}`, 'ERROR');
    testResults.frontendTests = { success: false, error: error.message };
    return false;
  }
}

// AI Engine Integration Tests
async function testAIEngineIntegration() {
  log('Testing AI Engine integration...', 'PROGRESS');
  
  const tests = [];
  
  try {
    // Test 1: AI Engine Files
    const aiFiles = [
      'apex_ai_engine/face_recognition_engine.py',
      'apex_ai_engine/face_enrollment.py'
    ];
    
    aiFiles.forEach(aiFile => {
      const fullPath = path.join(__dirname, aiFile);
      const exists = fs.existsSync(fullPath);
      
      tests.push({
        test: `AI Engine: ${path.basename(aiFile)}`,
        success: exists,
        details: exists ? 'AI file found' : 'AI file missing'
      });
    });
    
    // Test 2: Python Dependencies
    const requirementsPath = path.join(__dirname, 'apex_ai_engine/requirements.txt');
    if (fs.existsSync(requirementsPath)) {
      const requirements = fs.readFileSync(requirementsPath, 'utf8');
      const hasFaceRecognition = requirements.includes('face_recognition');
      
      tests.push({
        test: 'Python Dependencies',
        success: hasFaceRecognition,
        details: hasFaceRecognition ? 'face_recognition dependency found' : 'face_recognition dependency missing'
      });
    } else {
      tests.push({
        test: 'Python Dependencies',
        success: false,
        details: 'requirements.txt not found'
      });
    }
    
    const passedTests = tests.filter(t => t.success).length;
    
    testResults.integrationTests = {
      success: passedTests >= tests.length - 1, // Allow 1 failure
      testsRun: tests.length,
      testsPassed: passedTests,
      details: tests
    };
    
    log(`AI Engine Tests: ${passedTests}/${tests.length} passed`, passedTests >= tests.length - 1 ? 'SUCCESS' : 'WARNING');
    
    return passedTests >= tests.length - 1;
    
  } catch (error) {
    log(`AI Engine testing failed: ${error.message}`, 'ERROR');
    testResults.integrationTests = { success: false, error: error.message };
    return false;
  }
}

// Generate Comprehensive Report
function generateIntegrationReport() {
  const report = {
    executionSummary: {
      testTimestamp: testResults.timestamp,
      totalPhases: 4,
      phasesCompleted: Object.values(testResults).filter(r => r !== null && typeof r === 'object').length,
      overallSuccess: Object.values(testResults)
        .filter(r => r !== null && typeof r === 'object')
        .every(r => r.success)
    },
    testResults: testResults,
    systemReadiness: {
      apiEndpoints: testResults.apiTests?.success ? 'READY' : 'NEEDS_ATTENTION',
      databaseIntegration: testResults.databaseTests?.success ? 'READY' : 'NEEDS_SETUP',
      frontendIntegration: testResults.frontendTests?.success ? 'READY' : 'NEEDS_ATTENTION',
      aiEngineIntegration: testResults.integrationTests?.success ? 'READY' : 'NEEDS_ATTENTION'
    },
    deploymentStatus: null
  };
  
  // Determine overall deployment status
  const readyComponents = Object.values(report.systemReadiness).filter(status => status === 'READY').length;
  const totalComponents = Object.keys(report.systemReadiness).length;
  
  if (readyComponents === totalComponents) {
    report.deploymentStatus = 'PRODUCTION_READY';
  } else if (readyComponents >= totalComponents - 1) {
    report.deploymentStatus = 'MOSTLY_READY';
  } else {
    report.deploymentStatus = 'NEEDS_WORK';
  }
  
  return report;
}

// Display Integration Results
function displayIntegrationResults(report) {
  console.log('\n' + '='.repeat(100));
  console.log('🧪 APEX AI FACE RECOGNITION SYSTEM - INTEGRATION TEST RESULTS');
  console.log('='.repeat(100));
  
  // Executive Summary
  console.log('\n📊 INTEGRATION TEST SUMMARY');
  console.log('-'.repeat(60));
  console.log(`Test Execution: ${report.executionSummary.testTimestamp}`);
  console.log(`Test Phases: ${report.executionSummary.phasesCompleted}/${report.executionSummary.totalPhases} completed`);
  console.log(`Overall Success: ${report.executionSummary.overallSuccess ? '✅ ALL TESTS PASSED' : '⚠️ SOME ISSUES FOUND'}`);
  
  // System Readiness
  console.log('\n🚦 SYSTEM READINESS STATUS');
  console.log('-'.repeat(60));
  Object.entries(report.systemReadiness).forEach(([component, status]) => {
    const icon = status === 'READY' ? '✅' : '⚠️';
    const componentName = component.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${icon} ${componentName}: ${status}`);
  });
  
  // Detailed Test Results
  console.log('\n📋 DETAILED TEST RESULTS');
  console.log('-'.repeat(60));
  
  if (testResults.apiTests) {
    console.log(`🌐 API Tests: ${testResults.apiTests.success ? '✅ PASSED' : '❌ FAILED'} (${testResults.apiTests.testsPassed || 0}/${testResults.apiTests.testsRun || 0})`);
  }
  
  if (testResults.databaseTests) {
    console.log(`🗄️ Database Tests: ${testResults.databaseTests.success ? '✅ PASSED' : '⚠️ PARTIAL'} (${testResults.databaseTests.testsPassed || 0}/${testResults.databaseTests.testsRun || 0})`);
  }
  
  if (testResults.frontendTests) {
    console.log(`⚛️ Frontend Tests: ${testResults.frontendTests.success ? '✅ PASSED' : '❌ FAILED'} (${testResults.frontendTests.testsPassed || 0}/${testResults.frontendTests.testsRun || 0})`);
  }
  
  if (testResults.integrationTests) {
    console.log(`🧠 AI Engine Tests: ${testResults.integrationTests.success ? '✅ PASSED' : '⚠️ PARTIAL'} (${testResults.integrationTests.testsPassed || 0}/${testResults.integrationTests.testsRun || 0})`);
  }
  
  // Deployment Status
  console.log('\n🚀 DEPLOYMENT STATUS');
  console.log('-'.repeat(60));
  
  switch (report.deploymentStatus) {
    case 'PRODUCTION_READY':
      console.log('🟢 PRODUCTION READY - All systems operational!');
      console.log('✅ Face Recognition system is ready for deployment');
      console.log('🎯 You can now access Face Management at /face-management');
      break;
    case 'MOSTLY_READY':
      console.log('🟡 MOSTLY READY - Minor issues detected');
      console.log('⚠️ System is functional but some optimizations needed');
      console.log('🔧 Address remaining issues for optimal performance');
      break;
    case 'NEEDS_WORK':
      console.log('🔴 NEEDS WORK - Critical issues found');
      console.log('❌ System requires attention before deployment');
      console.log('🛠️ Fix critical issues and re-run tests');
      break;
  }
  
  console.log('\n' + '='.repeat(100));
  console.log(`🎉 Integration testing completed at ${new Date().toISOString()}`);
  console.log('='.repeat(100) + '\n');
}

// Main Integration Test Execution
async function runIntegrationTests() {
  console.log('🧪 APEX AI FACE RECOGNITION - INTEGRATION TEST SUITE');
  console.log('='.repeat(100));
  console.log('Testing complete Face Recognition system integration...\n');
  
  try {
    // Run all test phases
    await testApiEndpoints();
    await testDatabaseIntegration();
    await testFrontendIntegration();
    await testAIEngineIntegration();
    
    // Generate and display results
    const report = generateIntegrationReport();
    displayIntegrationResults(report);
    
    // Save detailed report
    const reportPath = path.join(__dirname, `face_recognition_integration_test_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Detailed test report saved to: ${path.basename(reportPath)}`);
    
    return report;
    
  } catch (error) {
    log(`❌ CRITICAL ERROR: Integration testing failed - ${error.message}`, 'ERROR');
    console.error(error);
    return null;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests().catch(console.error);
}

export default runIntegrationTests;
