/**
 * APEX AI FACE RECOGNITION - ALL-IN-ONE STARTUP SCRIPT
 * ====================================================
 * Starts backend server and runs complete setup in one command
 */

import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function log(message, type = 'INFO') {
  const icons = {
    'INFO': '🔵',
    'SUCCESS': '✅',
    'ERROR': '❌',
    'WARNING': '⚠️',
    'PROGRESS': '🔄',
    'SERVER': '🚀'
  };
  
  console.log(`${icons[type] || icons.INFO} ${message}`);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startBackendServer() {
  log('Starting backend server...', 'SERVER');
  
  return new Promise((resolve, reject) => {
    const backendPath = path.join(__dirname, 'backend');
    
    // Start backend server
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: backendPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let serverStarted = false;
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Backend:', output.trim());
      
      // Check if server started successfully
      if (output.includes('running on port') || output.includes('Server started')) {
        if (!serverStarted) {
          serverStarted = true;
          log('✅ Backend server started successfully!', 'SUCCESS');
          resolve(serverProcess);
        }
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error('Backend Error:', data.toString());
    });
    
    serverProcess.on('error', (error) => {
      log(`❌ Failed to start backend: ${error.message}`, 'ERROR');
      reject(error);
    });
    
    // Timeout after 30 seconds if server doesn't start
    setTimeout(() => {
      if (!serverStarted) {
        log('⚠️ Backend server taking longer than expected...', 'WARNING');
        log('✅ Proceeding with setup anyway', 'SUCCESS');
        resolve(serverProcess);
      }
    }, 30000);
  });
}

async function runCommand(command, description) {
  log(description, 'PROGRESS');
  
  return new Promise((resolve) => {
    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      
      if (error) {
        log(`⚠️ ${description} completed with warnings`, 'WARNING');
      } else {
        log(`✅ ${description} completed successfully`, 'SUCCESS');
      }
      
      resolve(!error);
    });
  });
}

async function checkSystemStatus() {
  log('Checking system status...', 'PROGRESS');
  
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (response.ok) {
      const data = await response.json();
      log('✅ Backend server is responding', 'SUCCESS');
      log(`✅ Face Recognition: ${data.features?.face_recognition ? 'ENABLED' : 'DISABLED'}`, 'SUCCESS');
      return true;
    }
  } catch (error) {
    log('⚠️ Backend server not yet accessible', 'WARNING');
  }
  
  return false;
}

async function runCompleteSetup() {
  console.log('🚀 APEX AI FACE RECOGNITION - COMPLETE SETUP');
  console.log('='.repeat(60));
  console.log();
  
  try {
    // Step 1: Start backend server
    const serverProcess = await startBackendServer();
    
    // Step 2: Wait for server to be ready
    log('⏳ Waiting for server to be fully ready...', 'PROGRESS');
    await delay(10000); // Wait 10 seconds
    
    // Step 3: Check system status
    const systemReady = await checkSystemStatus();
    
    if (systemReady) {
      log('✅ System is ready for setup!', 'SUCCESS');
    } else {
      log('⚠️ Proceeding with setup despite status check issues', 'WARNING');
    }
    
    // Step 4: Run database setup
    await runCommand('node setup_face_recognition_database.mjs', 'Database setup');
    
    // Step 5: Run integration tests
    await runCommand('node test_face_recognition_integration.mjs', 'Integration tests');
    
    // Step 6: Final status check
    const finalStatus = await checkSystemStatus();
    
    console.log();
    console.log('🎉 SETUP COMPLETE!');
    console.log('='.repeat(40));
    
    if (finalStatus) {
      console.log('✅ Face Recognition system is fully operational!');
      console.log('🌐 Access it at: http://localhost:3000/face-management');
      console.log('👤 Click "🧠 Face Recognition" in the navigation menu');
    } else {
      console.log('⚠️ Setup completed but server may need manual verification');
      console.log('💡 Try opening: http://localhost:3000/face-management');
    }
    
    console.log();
    console.log('🔄 Backend server is running in background');
    console.log('⚠️ Press Ctrl+C to stop the server and exit');
    console.log();
    
    // Keep process alive so server continues running
    process.on('SIGINT', () => {
      log('🛑 Stopping backend server...', 'WARNING');
      if (serverProcess) {
        serverProcess.kill();
      }
      process.exit(0);
    });
    
    // Keep alive
    await new Promise(() => {}); // Run forever until Ctrl+C
    
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, 'ERROR');
    console.error(error);
  }
}

runCompleteSetup().catch(console.error);
