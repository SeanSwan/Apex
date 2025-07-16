// APEX AI DYNAMIC FRONTEND STARTER
// ================================
// Starts frontend dev server on next available port

import { spawn } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { findAvailablePort } from './findAvailablePort.mjs';
import chalk from 'chalk';

const FRONTEND_DIR = './frontend';
const PORT_INFO_FILE = './frontend-port-info.json';

/**
 * Save port information for other scripts to use
 * @param {number} port - Port number being used
 * @param {string} url - Full URL of frontend server
 */
function savePortInfo(port, url) {
  const portInfo = {
    port,
    url,
    timestamp: new Date().toISOString(),
    pid: process.pid
  };
  
  try {
    writeFileSync(PORT_INFO_FILE, JSON.stringify(portInfo, null, 2));
    console.log(chalk.green(`📄 Port info saved to: ${PORT_INFO_FILE}`));
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Could not save port info: ${error.message}`));
  }
}

/**
 * Start frontend development server with dynamic port
 */
async function startFrontendServer() {
  console.log(chalk.cyan('\n🚀 APEX AI DYNAMIC FRONTEND STARTER'));
  console.log(chalk.cyan('=====================================\n'));
  
  try {
    // Find available port starting from 5173
    console.log(chalk.blue('🔍 Finding available port for frontend...'));
    const port = await findAvailablePort(5173, 10);
    const url = `http://localhost:${port}`;
    
    console.log(chalk.green(`✅ Starting frontend server on port ${port}`));
    console.log(chalk.blue(`🌐 Frontend URL: ${url}\n`));
    
    // Save port info for integration tests
    savePortInfo(port, url);
    
    // Start Vite dev server with dynamic port
    const viteProcess = spawn('npm', ['run', 'dev', '--', '--port', port.toString()], {
      cwd: FRONTEND_DIR,
      stdio: 'inherit',
      shell: true
    });
    
    // Handle process events
    viteProcess.on('error', (error) => {
      console.error(chalk.red(`❌ Failed to start frontend server: ${error.message}`));
      process.exit(1);
    });
    
    viteProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(chalk.red(`❌ Frontend server exited with code ${code}`));
      } else {
        console.log(chalk.yellow('🛑 Frontend server stopped'));
      }
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Shutting down frontend server...'));
      viteProcess.kill('SIGINT');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log(chalk.yellow('\n🛑 Shutting down frontend server...'));
      viteProcess.kill('SIGTERM');
      process.exit(0);
    });
    
    console.log(chalk.green('✅ Frontend server started successfully!'));
    console.log(chalk.blue(`📱 Access your application at: ${url}`));
    console.log(chalk.gray('   Press Ctrl+C to stop the server\n'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Error starting frontend server: ${error.message}`));
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startFrontendServer();
}

export { startFrontendServer };
