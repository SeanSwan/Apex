// APEX AI DYNAMIC PORT FINDER UTILITY
// ===================================
// Finds next available port starting from a base port

import net from 'net';

/**
 * Check if a port is available
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} - True if port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, (err) => {
      if (err) {
        resolve(false);
      } else {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      }
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Find next available port starting from basePort
 * @param {number} basePort - Starting port number
 * @param {number} maxAttempts - Maximum ports to try (default: 10)
 * @returns {Promise<number>} - Next available port
 */
export async function findAvailablePort(basePort, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = basePort + i;
    const available = await isPortAvailable(port);
    
    if (available) {
      console.log(`✅ Found available port: ${port}`);
      return port;
    } else {
      console.log(`⚠️  Port ${port} is in use, trying next...`);
    }
  }
  
  throw new Error(`No available ports found in range ${basePort}-${basePort + maxAttempts - 1}`);
}

/**
 * Get current port usage for common development ports
 * @returns {Promise<Object>} - Port usage status
 */
export async function getPortStatus() {
  const commonPorts = [3000, 5000, 5173, 5174, 5175, 8080];
  const status = {};
  
  for (const port of commonPorts) {
    status[port] = await isPortAvailable(port);
  }
  
  return status;
}

// CLI usage if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const basePort = parseInt(process.argv[2]) || 5173;
  const maxAttempts = parseInt(process.argv[3]) || 10;
  
  console.log(`🔍 Finding available port starting from ${basePort}...`);
  
  try {
    const port = await findAvailablePort(basePort, maxAttempts);
    console.log(`🎯 Available port found: ${port}`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}
