/**
 * QUICK BASELINE STATUS CHECK
 * ==========================
 * Rapid assessment of Face Recognition system integration status
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function log(message, type = 'INFO') {
  const icons = {
    'INFO': '🔵',
    'SUCCESS': '✅', 
    'ERROR': '❌',
    'WARNING': '⚠️',
    'PROGRESS': '🔄'
  };
  console.log(`${icons[type] || icons.INFO} ${message}`);
}

// Quick File System Check
function quickFileSystemCheck() {
  log('QUICK FILE SYSTEM STATUS CHECK', 'PROGRESS');
  
  const criticalFiles = [
    'backend/routes/face_management_api.mjs',
    'apex_ai_engine/face_recognition_engine.py',
    'apex_ai_engine/face_enrollment.py', 
    'frontend/src/components/FaceManagement/FaceManagementDashboard.tsx',
    'frontend/src/components/FaceManagement/FaceEnrollment.tsx',
    'frontend/src/components/FaceManagement/index.ts',
    'backend/database/face_recognition_schema.sql'
  ];
  
  let existingFiles = 0;
  
  for (const file of criticalFiles) {
    const fullPath = path.join(__dirname, file);
    const exists = fs.existsSync(fullPath);
    
    if (exists) {
      const stats = fs.lstatSync(fullPath);
      const size = stats.isFile() ? `(${Math.round(stats.size / 1024)}KB)` : '(DIR)';
      log(`✅ ${file} ${size}`, 'SUCCESS');
      existingFiles++;
    } else {
      log(`❌ ${file} - MISSING`, 'ERROR');
    }
  }
  
  const completionRate = (existingFiles / criticalFiles.length * 100).toFixed(1);
  
  log(`\n📊 FILE SYSTEM STATUS: ${existingFiles}/${criticalFiles.length} files present (${completionRate}%)`, 
      existingFiles === criticalFiles.length ? 'SUCCESS' : 'WARNING');
  
  return {
    totalFiles: criticalFiles.length,
    existingFiles,
    completionRate: parseFloat(completionRate),
    allFilesPresent: existingFiles === criticalFiles.length
  };
}

// Quick Integration Check
function quickIntegrationCheck() {
  log('\nQUICK INTEGRATION STATUS CHECK', 'PROGRESS');
  
  const checks = [];
  
  // Check if Face Management is exported from main components
  const frontendIndexPath = path.join(__dirname, 'frontend/src/components/index.ts');
  if (fs.existsSync(frontendIndexPath)) {
    const content = fs.readFileSync(frontendIndexPath, 'utf8');
    const hasFaceManagement = content.includes('FaceManagement');
    checks.push({
      name: 'Frontend Component Export',
      success: hasFaceManagement,
      detail: hasFaceManagement ? 'FaceManagement exported' : 'FaceManagement NOT exported'
    });
  } else {
    checks.push({
      name: 'Frontend Component Export',
      success: false,
      detail: 'Frontend index.ts not found'
    });
  }
  
  // Check if Face API is integrated into main router
  const apiRouterPath = path.join(__dirname, 'backend/routes/api.mjs');
  if (fs.existsSync(apiRouterPath)) {
    const content = fs.readFileSync(apiRouterPath, 'utf8');
    const hasFaceRoutes = content.includes('face_management_api') || content.includes('faces');
    checks.push({
      name: 'Backend API Integration',
      success: hasFaceRoutes,
      detail: hasFaceRoutes ? 'Face routes integrated' : 'Face routes NOT integrated'
    });
  } else {
    checks.push({
      name: 'Backend API Integration', 
      success: false,
      detail: 'API router not found'
    });
  }
  
  // Check if App.tsx has Face Management route
  const appPath = path.join(__dirname, 'frontend/src/App.tsx');
  if (fs.existsSync(appPath)) {
    const content = fs.readFileSync(appPath, 'utf8');
    const hasFaceRoute = content.includes('FaceManagement') || content.includes('face');
    checks.push({
      name: 'Frontend Route Integration',
      success: hasFaceRoute,
      detail: hasFaceRoute ? 'Face route exists' : 'Face route NOT found'
    });
  } else {
    checks.push({
      name: 'Frontend Route Integration',
      success: false, 
      detail: 'App.tsx not found'
    });
  }
  
  // Display results
  checks.forEach(check => {
    log(`${check.success ? '✅' : '❌'} ${check.name}: ${check.detail}`, 
        check.success ? 'SUCCESS' : 'ERROR');
  });
  
  const passedChecks = checks.filter(c => c.success).length;
  log(`\n🔗 INTEGRATION STATUS: ${passedChecks}/${checks.length} integration points connected`, 
      passedChecks === checks.length ? 'SUCCESS' : 'WARNING');
  
  return {
    totalChecks: checks.length,
    passedChecks,
    checks,
    fullyIntegrated: passedChecks === checks.length
  };
}

// Quick Database Check
function quickDatabaseCheck() {
  log('\nQUICK DATABASE STATUS CHECK', 'PROGRESS');
  
  const dbChecks = [];
  
  // Check if schema file exists
  const schemaPath = path.join(__dirname, 'backend/database/face_recognition_schema.sql');
  if (fs.existsSync(schemaPath)) {
    const content = fs.readFileSync(schemaPath, 'utf8');
    const hasTables = content.includes('face_profiles') && content.includes('face_detections');
    dbChecks.push({
      name: 'Database Schema',
      success: hasTables,
      detail: hasTables ? 'Tables defined' : 'Tables NOT defined'
    });
  } else {
    dbChecks.push({
      name: 'Database Schema',
      success: false,
      detail: 'Schema file missing'
    });
  }
  
  // Check if .env exists
  const envPath = path.join(__dirname, 'backend/.env');
  dbChecks.push({
    name: 'Environment Configuration',
    success: fs.existsSync(envPath),
    detail: fs.existsSync(envPath) ? '.env file exists' : '.env file missing'
  });
  
  // Check database connection script
  const dbTestPath = path.join(__dirname, 'backend/test-db-connection.mjs');
  dbChecks.push({
    name: 'Database Test Script',
    success: fs.existsSync(dbTestPath),
    detail: fs.existsSync(dbTestPath) ? 'Test script available' : 'Test script missing'
  });
  
  dbChecks.forEach(check => {
    log(`${check.success ? '✅' : '❌'} ${check.name}: ${check.detail}`, 
        check.success ? 'SUCCESS' : 'ERROR');
  });
  
  const passedChecks = dbChecks.filter(c => c.success).length;
  log(`\n🗄️ DATABASE STATUS: ${passedChecks}/${dbChecks.length} database components ready`, 
      passedChecks >= 2 ? 'SUCCESS' : 'WARNING');
  
  return {
    totalChecks: dbChecks.length,
    passedChecks,
    checks: dbChecks,
    databaseReady: passedChecks >= 2
  };
}

// Generate Quick Report
function generateQuickReport(fileSystemResults, integrationResults, databaseResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      filesReady: fileSystemResults.allFilesPresent,
      integrationReady: integrationResults.fullyIntegrated,
      databaseReady: databaseResults.databaseReady,
      overallReady: fileSystemResults.allFilesPresent && integrationResults.fullyIntegrated && databaseResults.databaseReady
    },
    scores: {
      fileSystemScore: fileSystemResults.completionRate,
      integrationScore: (integrationResults.passedChecks / integrationResults.totalChecks * 100),
      databaseScore: (databaseResults.passedChecks / databaseResults.totalChecks * 100)
    },
    details: {
      fileSystem: fileSystemResults,
      integration: integrationResults,
      database: databaseResults
    }
  };
  
  // Overall system health
  const avgScore = (report.scores.fileSystemScore + report.scores.integrationScore + report.scores.databaseScore) / 3;
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 QUICK BASELINE ASSESSMENT RESULTS');
  console.log('='.repeat(80));
  
  console.log('\n🎯 OVERALL SYSTEM HEALTH');
  console.log(`Average Score: ${avgScore.toFixed(1)}%`);
  console.log(`Status: ${avgScore >= 90 ? '🟢 EXCELLENT' : avgScore >= 70 ? '🟡 GOOD' : '🔴 NEEDS WORK'}`);
  
  console.log('\n📋 COMPONENT BREAKDOWN');
  console.log(`📁 File System: ${report.scores.fileSystemScore.toFixed(1)}% (${fileSystemResults.existingFiles}/${fileSystemResults.totalFiles} files)`);
  console.log(`🔗 Integration: ${report.scores.integrationScore.toFixed(1)}% (${integrationResults.passedChecks}/${integrationResults.totalChecks} connected)`);
  console.log(`🗄️ Database: ${report.scores.databaseScore.toFixed(1)}% (${databaseResults.passedChecks}/${databaseResults.totalChecks} ready)`);
  
  console.log('\n🚦 READINESS STATUS');
  console.log(`Files Ready: ${report.summary.filesReady ? '✅ YES' : '❌ NO'}`);
  console.log(`Integration Ready: ${report.summary.integrationReady ? '✅ YES' : '❌ NO'}`);
  console.log(`Database Ready: ${report.summary.databaseReady ? '✅ YES' : '❌ NO'}`);
  console.log(`Overall Ready: ${report.summary.overallReady ? '✅ YES' : '❌ NO'}`);
  
  if (!report.summary.overallReady) {
    console.log('\n🔧 IMMEDIATE ACTION ITEMS');
    if (!fileSystemResults.allFilesPresent) {
      console.log('❌ Restore missing Face Recognition files');
    }
    if (!integrationResults.fullyIntegrated) {
      console.log('❌ Complete component integration (routes, exports, imports)');
    }
    if (!databaseResults.databaseReady) {
      console.log('❌ Set up database configuration and connection');
    }
  } else {
    console.log('\n🎉 SYSTEM IS BASELINE READY!');
    console.log('✅ All core components are present and integrated');
    console.log('🚀 Ready to proceed with testing and deployment');
  }
  
  console.log('\n' + '='.repeat(80));
  
  return report;
}

// Main execution
function runQuickBaseline() {
  console.log('🚀 APEX AI FACE RECOGNITION - QUICK BASELINE CHECK');
  console.log('==================================================\n');
  
  const fileSystemResults = quickFileSystemCheck();
  const integrationResults = quickIntegrationCheck(); 
  const databaseResults = quickDatabaseCheck();
  
  const report = generateQuickReport(fileSystemResults, integrationResults, databaseResults);
  
  return report;
}

// Execute
runQuickBaseline();
