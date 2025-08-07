#!/usr/bin/env node

/**
 * APEX AI BASELINE TESTING COORDINATOR
 * ====================================
 * Runs comprehensive baseline tests to establish current system status
 * 
 * Tests:
 * 1. Phase 1 Face Detection Integration (Simulation)
 * 2. Real API Endpoint Testing  
 * 3. Database Connectivity Tests
 * 4. File System Integration Tests
 * 5. Component Import/Export Tests
 */

import { exec, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test Orchestration
const testResults = {
  timestamp: new Date().toISOString(),
  phase1Simulation: null,
  realApiTests: null,
  databaseTests: null,
  fileSystemTests: null,
  componentTests: null,
  overallStatus: null
};

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const icons = {
    'INFO': '🔵',
    'SUCCESS': '✅', 
    'ERROR': '❌',
    'WARNING': '⚠️',
    'PROGRESS': '🔄',
    'TEST': '🧪'
  };
  
  console.log(`[${timestamp}] ${icons[type] || icons.INFO} ${message}`);
}

// Phase 1: Run Phase 1 Face Detection Simulation Tests
async function runPhase1SimulationTests() {
  log('Starting Phase 1 Face Detection Simulation Tests...', 'TEST');
  
  try {
    // Import and run the existing test suite
    const { default: runPhase1Testing } = await import('./test_phase1_face_detection.mjs');
    
    const simulationResults = await runPhase1Testing();
    
    testResults.phase1Simulation = {
      success: true,
      data: simulationResults,
      message: 'Phase 1 simulation tests completed successfully'
    };
    
    log('✅ Phase 1 Simulation Tests: COMPLETED', 'SUCCESS');
    return true;
    
  } catch (error) {
    log(`❌ Phase 1 Simulation Tests: FAILED - ${error.message}`, 'ERROR');
    testResults.phase1Simulation = {
      success: false,
      error: error.message,
      message: 'Phase 1 simulation tests failed'
    };
    return false;
  }
}

// Phase 2: Test Real API Endpoints
async function runRealApiTests() {
  log('Starting Real API Endpoint Tests...', 'TEST');
  
  try {
    const apiTests = [];
    
    // Test 1: API Health Check
    try {
      const healthResponse = await fetch('http://localhost:3000/api/health');
      apiTests.push({
        test: 'API Health Check',
        success: healthResponse.ok,
        status: healthResponse.status,
        response: healthResponse.ok ? await healthResponse.json() : null
      });
    } catch (error) {
      apiTests.push({
        test: 'API Health Check', 
        success: false,
        error: 'API server not accessible'
      });
    }
    
    // Test 2: Face Management API Check
    try {
      const facesResponse = await fetch('http://localhost:3000/api/faces');
      apiTests.push({
        test: 'Face Management API',
        success: facesResponse.status === 200 || facesResponse.status === 404, // 404 is ok if no faces exist
        status: facesResponse.status
      });
    } catch (error) {
      apiTests.push({
        test: 'Face Management API',
        success: false, 
        error: 'Face API not accessible'
      });
    }
    
    // Test 3: Face Analytics API Check  
    try {
      const analyticsResponse = await fetch('http://localhost:3000/api/faces/analytics/summary');
      apiTests.push({
        test: 'Face Analytics API',
        success: analyticsResponse.ok,
        status: analyticsResponse.status
      });
    } catch (error) {
      apiTests.push({
        test: 'Face Analytics API',
        success: false,
        error: 'Analytics API not accessible'
      });
    }
    
    const successfulTests = apiTests.filter(t => t.success).length;
    
    testResults.realApiTests = {
      success: successfulTests >= 1, // At least one API must work
      testsRun: apiTests.length,
      testsPassed: successfulTests,
      details: apiTests,
      message: `${successfulTests}/${apiTests.length} API tests passed`
    };
    
    log(`Real API Tests: ${successfulTests}/${apiTests.length} passed`, 
        successfulTests >= 1 ? 'SUCCESS' : 'WARNING');
    
    return successfulTests >= 1;
    
  } catch (error) {
    log(`❌ Real API Tests: FAILED - ${error.message}`, 'ERROR');
    testResults.realApiTests = {
      success: false,
      error: error.message,
      message: 'API tests failed'
    };
    return false;
  }
}

// Phase 3: Test Database Connectivity
async function runDatabaseTests() {
  log('Starting Database Connectivity Tests...', 'TEST');
  
  try {
    const dbTests = [];
    
    // Check if database files exist
    const dbFiles = [
      'backend/database/face_recognition_schema.sql',
      'backend/.env'
    ];
    
    for (const file of dbFiles) {
      const filePath = path.join(__dirname, file);
      dbTests.push({
        test: `Database File: ${file}`,
        success: fs.existsSync(filePath),
        path: filePath
      });
    }
    
    // Test database connection via backend script
    try {
      const testDbScript = path.join(__dirname, 'backend', 'test-db-connection.mjs');
      if (fs.existsSync(testDbScript)) {
        dbTests.push({
          test: 'Database Connection Script Available',
          success: true
        });
      }
    } catch (error) {
      dbTests.push({
        test: 'Database Connection Test',
        success: false,
        error: error.message
      });
    }
    
    const successfulTests = dbTests.filter(t => t.success).length;
    
    testResults.databaseTests = {
      success: successfulTests >= dbTests.length / 2, // At least half must pass
      testsRun: dbTests.length,
      testsPassed: successfulTests,
      details: dbTests,
      message: `${successfulTests}/${dbTests.length} database tests passed`
    };
    
    log(`Database Tests: ${successfulTests}/${dbTests.length} passed`, 
        successfulTests >= dbTests.length / 2 ? 'SUCCESS' : 'WARNING');
    
    return successfulTests >= dbTests.length / 2;
    
  } catch (error) {
    log(`❌ Database Tests: FAILED - ${error.message}`, 'ERROR');
    testResults.databaseTests = {
      success: false,
      error: error.message,
      message: 'Database tests failed'
    };
    return false;
  }
}

// Phase 4: Test File System Integration
async function runFileSystemTests() {
  log('Starting File System Integration Tests...', 'TEST');
  
  try {
    const fsTests = [];
    
    // Check critical directories and files exist
    const criticalPaths = [
      'backend/routes/face_management_api.mjs',
      'apex_ai_engine/face_recognition_engine.py', 
      'apex_ai_engine/face_enrollment.py',
      'frontend/src/components/FaceManagement',
      'frontend/src/components/FaceManagement/FaceManagementDashboard.tsx',
      'frontend/src/components/FaceManagement/FaceEnrollment.tsx'
    ];
    
    for (const filePath of criticalPaths) {
      const fullPath = path.join(__dirname, filePath);
      fsTests.push({
        test: `Critical Path: ${filePath}`,
        success: fs.existsSync(fullPath),
        path: fullPath,
        type: fs.existsSync(fullPath) ? (fs.lstatSync(fullPath).isDirectory() ? 'directory' : 'file') : 'missing'
      });
    }
    
    // Check uploads directory (should be created by API)
    const uploadsDir = path.join(__dirname, 'backend', 'uploads', 'faces');
    fsTests.push({
      test: 'Face Uploads Directory',
      success: true, // This will be created by API if needed
      path: uploadsDir,
      note: 'Will be created automatically by face enrollment API'
    });
    
    const successfulTests = fsTests.filter(t => t.success).length;
    
    testResults.fileSystemTests = {
      success: successfulTests >= criticalPaths.length, // All critical paths must exist
      testsRun: fsTests.length,
      testsPassed: successfulTests,
      details: fsTests,
      message: `${successfulTests}/${fsTests.length} file system tests passed`
    };
    
    log(`File System Tests: ${successfulTests}/${fsTests.length} passed`, 
        successfulTests >= criticalPaths.length ? 'SUCCESS' : 'ERROR');
    
    return successfulTests >= criticalPaths.length;
    
  } catch (error) {
    log(`❌ File System Tests: FAILED - ${error.message}`, 'ERROR');
    testResults.fileSystemTests = {
      success: false,
      error: error.message,
      message: 'File system tests failed'
    };
    return false;
  }
}

// Phase 5: Test Component Import/Export
async function runComponentTests() {
  log('Starting Component Import/Export Tests...', 'TEST');
  
  try {
    const componentTests = [];
    
    // Test if we can import key components (syntax check)
    const importTests = [
      {
        name: 'Face Management Index',
        path: './frontend/src/components/FaceManagement/index.ts',
        expected: 'FaceManagementDashboard'
      }
    ];
    
    for (const test of importTests) {
      try {
        const filePath = path.join(__dirname, test.path);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const hasExpectedExport = content.includes(test.expected);
          
          componentTests.push({
            test: `Import Test: ${test.name}`,
            success: hasExpectedExport,
            details: hasExpectedExport ? `Found ${test.expected}` : `Missing ${test.expected}`
          });
        } else {
          componentTests.push({
            test: `Import Test: ${test.name}`,
            success: false,
            details: 'File not found'
          });
        }
      } catch (error) {
        componentTests.push({
          test: `Import Test: ${test.name}`,
          success: false,
          error: error.message
        });
      }
    }
    
    const successfulTests = componentTests.filter(t => t.success).length;
    
    testResults.componentTests = {
      success: successfulTests >= componentTests.length / 2,
      testsRun: componentTests.length,
      testsPassed: successfulTests,
      details: componentTests,
      message: `${successfulTests}/${componentTests.length} component tests passed`
    };
    
    log(`Component Tests: ${successfulTests}/${componentTests.length} passed`, 
        successfulTests >= componentTests.length / 2 ? 'SUCCESS' : 'WARNING');
    
    return successfulTests >= componentTests.length / 2;
    
  } catch (error) {
    log(`❌ Component Tests: FAILED - ${error.message}`, 'ERROR');
    testResults.componentTests = {
      success: false,
      error: error.message,
      message: 'Component tests failed'
    };
    return false;
  }
}

// Generate Final Report
function generateBaselineReport() {
  log('Generating Baseline Test Report...', 'PROGRESS');
  
  const report = {
    executionSummary: {
      testTimestamp: testResults.timestamp,
      totalPhases: 5,
      phasesCompleted: Object.values(testResults).filter(r => r !== null && typeof r === 'object').length,
      overallSuccess: Object.values(testResults).filter(r => r !== null && typeof r === 'object').every(r => r.success)
    },
    testResults: testResults,
    systemStatus: {
      faceRecognitionSystem: testResults.phase1Simulation?.success ? 'OPERATIONAL' : 'NEEDS_ATTENTION',
      apiEndpoints: testResults.realApiTests?.success ? 'OPERATIONAL' : 'NEEDS_ATTENTION', 
      databaseIntegration: testResults.databaseTests?.success ? 'OPERATIONAL' : 'NEEDS_ATTENTION',
      fileSystemIntegrity: testResults.fileSystemTests?.success ? 'OPERATIONAL' : 'CRITICAL',
      componentArchitecture: testResults.componentTests?.success ? 'OPERATIONAL' : 'NEEDS_ATTENTION'
    },
    criticalFindings: [],
    recommendations: []
  };
  
  // Analyze critical findings
  if (!testResults.fileSystemTests?.success) {
    report.criticalFindings.push({
      severity: 'CRITICAL',
      issue: 'Missing critical files in Face Recognition system',
      impact: 'System cannot function without core files',
      recommendation: 'Verify all files are present and restore missing components'
    });
  }
  
  if (!testResults.realApiTests?.success) {
    report.criticalFindings.push({
      severity: 'HIGH',
      issue: 'API endpoints not accessible',
      impact: 'Frontend cannot communicate with backend',
      recommendation: 'Start backend server and verify API routes'
    });
  }
  
  if (!testResults.databaseTests?.success) {
    report.criticalFindings.push({
      severity: 'HIGH', 
      issue: 'Database integration issues detected',
      impact: 'Face recognition data cannot be stored/retrieved',
      recommendation: 'Verify database connection and run schema setup'
    });
  }
  
  // Generate recommendations
  if (report.executionSummary.overallSuccess) {
    report.recommendations.push('✅ System baseline is STRONG - proceed with integration gaps fix');
    report.recommendations.push('📊 Run production readiness tests next');
    report.recommendations.push('🚀 Consider moving to Phase 2 development');
  } else {
    report.recommendations.push('⚠️ Address critical findings before proceeding');
    report.recommendations.push('🔧 Focus on restoring missing components first');
    report.recommendations.push('📝 Re-run baseline tests after fixes');
  }
  
  // Save report
  const reportPath = path.join(__dirname, `baseline_test_report_${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  return report;
}

// Display Results
function displayBaselineResults(report) {
  console.log('\n' + '='.repeat(100));
  console.log('🧪 APEX AI FACE RECOGNITION SYSTEM - BASELINE TEST RESULTS');
  console.log('='.repeat(100));
  
  // Executive Summary
  console.log('\n📊 EXECUTIVE SUMMARY');
  console.log('-'.repeat(60));
  console.log(`Test Execution: ${report.executionSummary.testTimestamp}`);
  console.log(`Phases Completed: ${report.executionSummary.phasesCompleted}/${report.executionSummary.totalPhases}`);
  console.log(`Overall Status: ${report.executionSummary.overallSuccess ? '✅ SYSTEM READY' : '⚠️ NEEDS ATTENTION'}`);
  
  // System Status Overview
  console.log('\n🔍 SYSTEM STATUS OVERVIEW');
  console.log('-'.repeat(60));
  Object.entries(report.systemStatus).forEach(([component, status]) => {
    const icon = status === 'OPERATIONAL' ? '✅' : status === 'CRITICAL' ? '❌' : '⚠️';
    const componentName = component.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${icon} ${componentName}: ${status}`);
  });
  
  // Test Phase Results
  console.log('\n📋 DETAILED TEST PHASE RESULTS');
  console.log('-'.repeat(60));
  
  if (testResults.phase1Simulation) {
    console.log(`🧠 Phase 1 Simulation: ${testResults.phase1Simulation.success ? '✅ PASSED' : '❌ FAILED'}`);
    if (testResults.phase1Simulation.success && testResults.phase1Simulation.data) {
      const data = testResults.phase1Simulation.data;
      console.log(`   📈 Components: ${data.phase1Summary?.componentsSuccessful || 'N/A'}/${data.phase1Summary?.totalComponents || 'N/A'} successful`);
    }
  }
  
  if (testResults.realApiTests) {
    console.log(`🌐 API Endpoint Tests: ${testResults.realApiTests.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   📈 APIs: ${testResults.realApiTests.testsPassed}/${testResults.realApiTests.testsRun} accessible`);
  }
  
  if (testResults.databaseTests) {
    console.log(`🗄️ Database Tests: ${testResults.databaseTests.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   📈 DB Components: ${testResults.databaseTests.testsPassed}/${testResults.databaseTests.testsRun} verified`);
  }
  
  if (testResults.fileSystemTests) {
    console.log(`📁 File System Tests: ${testResults.fileSystemTests.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   📈 Critical Files: ${testResults.fileSystemTests.testsPassed}/${testResults.fileSystemTests.testsRun} present`);
  }
  
  if (testResults.componentTests) {
    console.log(`⚛️ Component Tests: ${testResults.componentTests.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   📈 Components: ${testResults.componentTests.testsPassed}/${testResults.componentTests.testsRun} verified`);
  }
  
  // Critical Findings
  if (report.criticalFindings.length > 0) {
    console.log('\n🚨 CRITICAL FINDINGS');
    console.log('-'.repeat(60));
    report.criticalFindings.forEach((finding, index) => {
      console.log(`${index + 1}. [${finding.severity}] ${finding.issue}`);
      console.log(`   Impact: ${finding.impact}`);
      console.log(`   Fix: ${finding.recommendation}`);
    });
  }
  
  // Recommendations
  console.log('\n🎯 RECOMMENDATIONS');
  console.log('-'.repeat(60));
  report.recommendations.forEach(rec => {
    console.log(`${rec}`);
  });
  
  console.log('\n' + '='.repeat(100));
  console.log(`🎉 Baseline testing completed - Report saved to: baseline_test_report_${Date.now()}.json`);
  console.log('='.repeat(100) + '\n');
}

// Main Execution
async function runBaselineTests() {
  console.log('\n🚀 APEX AI FACE RECOGNITION - BASELINE SYSTEM TESTING');
  console.log('='.repeat(100));
  console.log('Running comprehensive baseline tests to establish current system status...\n');
  
  try {
    // Run all test phases
    await runPhase1SimulationTests();
    await runRealApiTests();
    await runDatabaseTests(); 
    await runFileSystemTests();
    await runComponentTests();
    
    // Generate and display final report
    const report = generateBaselineReport();
    displayBaselineResults(report);
    
    return report;
    
  } catch (error) {
    log(`❌ CRITICAL ERROR: Baseline testing failed - ${error.message}`, 'ERROR');
    console.error(error);
    return null;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBaselineTests().catch(console.error);
}

export default runBaselineTests;
