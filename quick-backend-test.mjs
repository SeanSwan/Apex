// quick-backend-test.mjs
/**
 * Quick Backend Startup Test for APEX AI
 * =====================================
 */

import { exec, spawn } from 'child_process';
import fs from 'fs';

function log(message, prefix = 'INFO') {
  console.log(`[${prefix}] ${message}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'SUCCESS');
}

function logError(message) {
  log(`❌ ${message}`, 'ERROR');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'INFO');
}

async function quickValidation() {
  console.log('\n🚀 APEX AI - Quick Backend Validation');
  console.log('=====================================\n');
  
  // 1. Check if critical files exist
  const criticalFiles = [
    'backend/src/server.mjs',
    'backend/.env',
    'backend/package.json',
    'backend/database/unifiedQueries.mjs',
    'client-portal/src/App.tsx',
    'client-portal/package.json'
  ];
  
  logInfo('Checking critical files...');
  let filesOK = true;
  for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
      logSuccess(`${file} exists`);
    } else {
      logError(`${file} missing`);
      filesOK = false;
    }
  }
  
  if (!filesOK) {
    logError('Critical files missing - cannot proceed');
    return false;
  }
  
  // 2. Test database connection
  logInfo('Testing database connection...');
  try {
    const { UnifiedQueries } = await import('./backend/database/unifiedQueries.mjs');
    const connected = await UnifiedQueries.testConnection();
    
    if (connected) {
      logSuccess('Database connection successful');
      
      // Get stats
      try {
        const stats = await UnifiedQueries.getDatabaseStats();
        logInfo(`Database stats: Users: ${stats.totalUsers}, Properties: ${stats.totalProperties}`);
      } catch (e) {
        logInfo('Database stats not available (tables may not exist yet)');
      }
    } else {
      logError('Database connection failed');
      return false;
    }
  } catch (error) {
    logError(`Database test failed: ${error.message}`);
    return false;
  }
  
  // 3. Test backend server startup
  logInfo('Testing backend server startup...');
  return new Promise((resolve) => {
    // Kill any existing node processes first
    exec('taskkill /F /IM node.exe 2>NUL', () => {
      setTimeout(() => {
        const serverProcess = spawn('node', ['src/server.mjs'], {
          cwd: 'backend',
          stdio: 'pipe'
        });
        
        let serverStarted = false;
        let timeout;
        
        serverProcess.stdout.on('data', (data) => {
          const output = data.toString();
          console.log(`[BACKEND] ${output.trim()}`);
          
          if (output.includes('Server is running on port')) {
            serverStarted = true;
            logSuccess('Backend server started successfully!');
            
            // Test health endpoint
            import('http').then(http => {
              const req = http.get('http://localhost:5001/api/health', (res) => {
                logSuccess(`Health endpoint accessible - Status: ${res.statusCode}`);
                clearTimeout(timeout);
                serverProcess.kill();
                resolve(true);
              });
              
              req.on('error', () => {
                logError('Health endpoint not accessible');
                clearTimeout(timeout);
                serverProcess.kill();
                resolve(false);
              });
              
              req.setTimeout(3000, () => {
                req.destroy();
                logError('Health endpoint timeout');
                clearTimeout(timeout);
                serverProcess.kill();
                resolve(false);
              });
            });
          }
        });
        
        serverProcess.stderr.on('data', (data) => {
          console.log(`[BACKEND ERROR] ${data.toString().trim()}`);
        });
        
        serverProcess.on('error', (error) => {
          logError(`Server startup failed: ${error.message}`);
          clearTimeout(timeout);
          resolve(false);
        });
        
        // 15 second timeout
        timeout = setTimeout(() => {
          if (!serverStarted) {
            logError('Server startup timeout (15 seconds)');
            serverProcess.kill();
            resolve(false);
          }
        }, 15000);
        
      }, 1000);
    });
  });
}

// Run the test
quickValidation()
  .then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
      logSuccess('🎉 SYSTEM VALIDATION PASSED!');
      console.log('\nNext steps:');
      console.log('1. Run: npm start (to start both services)');
      console.log('2. Open: http://localhost:5173');
      console.log('3. Test client portal login');
    } else {
      logError('❌ SYSTEM VALIDATION FAILED');
      console.log('\nThe system needs attention before deployment.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    logError(`Validation error: ${error.message}`);
    process.exit(1);
  });
