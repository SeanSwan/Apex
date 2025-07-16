// APEX AI DYNAMIC BACKEND STARTER
// ===============================
// Starts backend server with port conflict resolution

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { findAvailablePort } from './findAvailablePort.mjs';
import chalk from 'chalk';

const BACKEND_DIR = './backend';
const BACKEND_PORT_INFO_FILE = './backend-port-info.json';

/**
 * Save backend port information
 * @param {number} port - Port number being used
 * @param {string} url - Full URL of backend server
 */
function saveBackendPortInfo(port, url) {
  const portInfo = {
    port,
    url,
    websocket_url: url,
    timestamp: new Date().toISOString(),
    pid: process.pid
  };
  
  try {
    writeFileSync(BACKEND_PORT_INFO_FILE, JSON.stringify(portInfo, null, 2));
    console.log(chalk.green(`📄 Backend port info saved to: ${BACKEND_PORT_INFO_FILE}`));
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Could not save backend port info: ${error.message}`));
  }
}

/**
 * Start backend server with dynamic port allocation
 */
async function startBackendServer() {
  console.log(chalk.cyan('\n🚀 APEX AI DYNAMIC BACKEND STARTER'));
  console.log(chalk.cyan('====================================\n'));
  
  try {
    // Find available port starting from 5000
    console.log(chalk.blue('🔍 Finding available port for backend...'));
    const port = await findAvailablePort(5000, 10);
    const url = `http://localhost:${port}`;
    
    console.log(chalk.green(`✅ Starting backend server on port ${port}`));
    console.log(chalk.blue(`🌐 Backend URL: ${url}`));
    console.log(chalk.blue(`🔌 WebSocket URL: ${url}\n`));
    
    // Save port info for integration tests
    saveBackendPortInfo(port, url);
    
    // Set environment variable for backend to use dynamic port
    const env = { ...process.env, PORT: port.toString(), BACKEND_PORT: port.toString() };
    
    // Start backend server with dynamic port
    const backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: BACKEND_DIR,
      stdio: 'inherit',
      shell: true,
      env
    });
    
    // Handle process events
    backendProcess.on('error', (error) => {
      console.error(chalk.red(`❌ Failed to start backend server: ${error.message}`));
      process.exit(1);
    });
    
    backendProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(chalk.red(`❌ Backend server exited with code ${code}`));
      } else {
        console.log(chalk.yellow('🛑 Backend server stopped'));
      }
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Shutting down backend server...'));
      backendProcess.kill('SIGINT');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log(chalk.yellow('\n🛑 Shutting down backend server...'));
      backendProcess.kill('SIGTERM');
      process.exit(0);
    });
    
    console.log(chalk.green('✅ Backend server started successfully!'));
    console.log(chalk.blue(`🔗 API Base URL: ${url}/api`));
    console.log(chalk.blue(`🔌 WebSocket available at: ${url}`));
    console.log(chalk.gray('   Press Ctrl+C to stop the server\n'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Error starting backend server: ${error.message}`));
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startBackendServer();
}

export { startBackendServer };
