// test-system-startup.mjs
/**
 * APEX AI - System Startup Validation Test
 * =======================================
 * 
 * This script tests if the backend server can start successfully
 * and validates the current system state.
 */

import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(message, 'bold');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test if a URL is accessible
function testUrl(url, timeout = 5000) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve({ success: true, status: res.statusCode, url });
    });
    
    req.on('error', (err) => {
      resolve({ success: false, error: err.message, url });
    });
    
    req.setTimeout(timeout, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout', url });
    });
  });
}

// Kill existing node processes
function killExistingProcesses() {
  return new Promise((resolve) => {
    exec('taskkill /F /IM node.exe 2>NUL', (error) => {
      // Don't care about errors here
      setTimeout(resolve, 1000); // Wait 1 second
    });
  });
}

async function validateProjectStructure() {
  logHeader('🔍 PROJECT STRUCTURE VALIDATION');
  
  const requiredDirs = [
    'backend',
    'client-portal', 
    'apex_ai_desktop_app'
  ];
  
  const requiredBackendFiles = [
    'backend/src/server.mjs',
    'backend/package.json',
    'backend/.env'
  ];
  
  const requiredClientFiles = [
    'client-portal/src/App.tsx',
    'client-portal/src/main.tsx',
    'client-portal/package.json',
    'client-portal/vite.config.ts'
  ];
  
  let allValid = true;
  
  // Check directories
  for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
      logSuccess(`Directory exists: ${dir}`);
    } else {
      logError(`Missing directory: ${dir}`);
      allValid = false;
    }
  }
  
  // Check backend files
  for (const file of requiredBackendFiles) {
    if (fs.existsSync(file)) {
      logSuccess(`Backend file exists: ${file}`);
    } else {
      logError(`Missing backend file: ${file}`);
      allValid = false;
    }
  }
  
  // Check client portal files
  for (const file of requiredClientFiles) {
    if (fs.existsSync(file)) {
      logSuccess(`Client portal file exists: ${file}`);
    } else {
      logError(`Missing client portal file: ${file}`);
      allValid = false;
    }
  }
  
  return allValid;
}

async function testBackendStartup() {
  logHeader('🚀 BACKEND SERVER STARTUP TEST');
  
  return new Promise((resolve) => {
    const backendProcess = spawn('node', ['src/server.mjs'], {
      cwd: 'backend',
      stdio: 'pipe'
    });
    
    let serverStarted = false;
    let serverOutput = '';
    
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      log(output.trim(), 'blue');
      
      if (output.includes('Server is running on port')) {
        serverStarted = true;
        logSuccess('Backend server started successfully!');
        
        // Test health endpoint after a brief delay
        setTimeout(async () => {
          const healthResult = await testUrl('http://localhost:5001/api/health');
          if (healthResult.success) {
            logSuccess(`Health check passed - Status: ${healthResult.status}`);
          } else {
            logError(`Health check failed: ${healthResult.error}`);
          }
          
          // Kill the server and resolve
          backendProcess.kill();
          resolve({ success: serverStarted, output: serverOutput });
        }, 2000);
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      logError(output.trim());
    });
    
    backendProcess.on('error', (error) => {
      logError(`Failed to start backend: ${error.message}`);
      resolve({ success: false, error: error.message, output: serverOutput });
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverStarted) {
        logError('Backend startup timeout after 30 seconds');
        backendProcess.kill();
        resolve({ success: false, error: 'Timeout', output: serverOutput });
      }
    }, 30000);
  });
}

async function validateDependencies() {
  logHeader('📦 DEPENDENCY VALIDATION');
  
  const backendPackageJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const clientPackageJson = JSON.parse(fs.readFileSync('client-portal/package.json', 'utf8'));
  
  logInfo(`Backend package: ${backendPackageJson.name}@${backendPackageJson.version}`);
  logInfo(`Client portal package: ${clientPackageJson.name}@${clientPackageJson.version}`);
  
  // Check if node_modules exist
  if (fs.existsSync('backend/node_modules')) {
    logSuccess('Backend dependencies installed');
  } else {
    logWarning('Backend dependencies not installed - run: cd backend && npm install');
  }
  
  if (fs.existsSync('client-portal/node_modules')) {
    logSuccess('Client portal dependencies installed');
  } else {
    logWarning('Client portal dependencies not installed - run: cd client-portal && npm install');
  }
  
  return true;
}

async function checkDatabaseConnection() {
  logHeader('🗄️  DATABASE CONNECTION TEST');
  
  try {
    // Try to import and test the unified queries
    const { UnifiedQueries } = await import('./backend/database/unifiedQueries.mjs');
    
    if (UnifiedQueries && typeof UnifiedQueries.testConnection === 'function') {
      logInfo('Testing database connection...');
      const connected = await UnifiedQueries.testConnection();
      
      if (connected) {
        logSuccess('Database connection successful');
        
        // Get database stats if available
        if (typeof UnifiedQueries.getDatabaseStats === 'function') {
          const stats = await UnifiedQueries.getDatabaseStats();
          logInfo(`Database stats: ${JSON.stringify(stats, null, 2)}`);
        }
        
        return true;
      } else {
        logError('Database connection failed');
        return false;
      }
    } else {
      logWarning('UnifiedQueries not available or incomplete');
      return false;
    }
  } catch (error) {
    logError(`Database test error: ${error.message}`);
    return false;
  }
}

async function generateSystemReport() {
  logHeader('📊 SYSTEM STATUS REPORT');
  
  const report = {
    timestamp: new Date().toISOString(),
    projectStructure: await validateProjectStructure(),
    dependencies: await validateDependencies(),
    databaseConnection: await checkDatabaseConnection(),
    backendStartup: null
  };
  
  // Test backend startup
  logInfo('Testing backend startup...');
  await killExistingProcesses(); // Clean slate
  report.backendStartup = await testBackendStartup();
  
  // Generate final status
  const allPassed = report.projectStructure && 
                   report.dependencies && 
                   report.databaseConnection && 
                   report.backendStartup?.success;
  
  logHeader('🎯 FINAL SYSTEM STATUS');
  
  if (allPassed) {
    logSuccess('🎉 SYSTEM IS READY FOR DEPLOYMENT!');
    log('\n🚀 Next Steps:', 'bold');
    log('1. Run: npm start (to start both backend and client portal)', 'green');
    log('2. Open: http://localhost:5173 (client portal)', 'green');
    log('3. Test login with: sarah.johnson@luxeapartments.com / Demo123!', 'green');
    log('4. Deploy to production when ready', 'green');
  } else {
    logWarning('⚠️  SYSTEM NEEDS ATTENTION');
    log('\n🔧 Issues Found:', 'bold');
    if (!report.projectStructure) log('- Project structure incomplete', 'red');
    if (!report.dependencies) log('- Dependencies need installation', 'red');
    if (!report.databaseConnection) log('- Database connection issues', 'red');
    if (!report.backendStartup?.success) log('- Backend startup problems', 'red');
  }
  
  // Save report
  fs.writeFileSync('system-status-report.json', JSON.stringify(report, null, 2));
  log('\n📋 Detailed report saved to: system-status-report.json', 'cyan');
  
  return report;
}

// Main execution
async function main() {
  log('\n🚀 APEX AI - SYSTEM STARTUP VALIDATION', 'bold');
  log('=' .repeat(60), 'cyan');
  
  try {
    const report = await generateSystemReport();
    process.exit(report.backendStartup?.success ? 0 : 1);
  } catch (error) {
    logError(`Validation failed: ${error.message}`);
    process.exit(1);
  }
}

main();
