// APEX AI SERVER PORT DISCOVERY UTILITY
// =====================================
// Discovers actual ports being used by backend and frontend servers

import { readFileSync, existsSync } from 'fs';
import { findAvailablePort, getPortStatus } from './findAvailablePort.mjs';

const FRONTEND_PORT_INFO_FILE = './frontend-port-info.json';
const BACKEND_PORT_INFO_FILE = './backend-port-info.json';

/**
 * Read port information from saved file
 * @param {string} filePath - Path to port info file
 * @returns {Object|null} - Port information or null if not found
 */
function readPortInfo(filePath) {
  try {
    if (!existsSync(filePath)) {
      return null;
    }
    
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.warn(`⚠️  Could not read port info from ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Get current frontend server information
 * @returns {Object} - Frontend server info
 */
export function getFrontendServerInfo() {
  const portInfo = readPortInfo(FRONTEND_PORT_INFO_FILE);
  
  if (portInfo) {
    return {
      port: portInfo.port,
      url: portInfo.url,
      isRunning: true,
      source: 'saved_info',
      timestamp: portInfo.timestamp
    };
  }
  
  // Fallback to default if no saved info
  return {
    port: 5173,
    url: 'http://localhost:5173',
    isRunning: false,
    source: 'default',
    timestamp: null
  };
}

/**
 * Get current backend server information
 * @returns {Object} - Backend server info
 */
export function getBackendServerInfo() {
  const portInfo = readPortInfo(BACKEND_PORT_INFO_FILE);
  
  if (portInfo) {
    return {
      port: portInfo.port,
      url: portInfo.url,
      websocket_url: portInfo.websocket_url || portInfo.url,
      isRunning: true,
      source: 'saved_info',
      timestamp: portInfo.timestamp
    };
  }
  
  // Fallback to default if no saved info
  return {
    port: 5000,
    url: 'http://localhost:5000',
    websocket_url: 'http://localhost:5000',
    isRunning: false,
    source: 'default',
    timestamp: null
  };
}

/**
 * Get comprehensive server status
 * @returns {Promise<Object>} - Complete server status
 */
export async function getServerStatus() {
  const frontend = getFrontendServerInfo();
  const backend = getBackendServerInfo();
  const portStatus = await getPortStatus();
  
  return {
    frontend,
    backend,
    portStatus,
    summary: {
      frontend_available: frontend.isRunning && portStatus[frontend.port] === false, // false = port in use
      backend_available: backend.isRunning && portStatus[backend.port] === false,
      all_systems_ready: frontend.isRunning && backend.isRunning
    }
  };
}

/**
 * Find next available ports for both servers
 * @returns {Promise<Object>} - Next available ports
 */
export async function findNextAvailablePorts() {
  const frontendPort = await findAvailablePort(5173, 10);
  const backendPort = await findAvailablePort(5000, 10);
  
  return {
    frontend: {
      port: frontendPort,
      url: `http://localhost:${frontendPort}`
    },
    backend: {
      port: backendPort,
      url: `http://localhost:${backendPort}`,
      websocket_url: `http://localhost:${backendPort}`
    }
  };
}

/**
 * Update frontend environment with discovered backend URL
 * @param {string} backendUrl - Backend URL to use
 * @returns {Object} - Updated environment variables
 */
export function createFrontendEnvironment(backendUrl) {
  return {
    ...process.env,
    VITE_BACKEND_URL: backendUrl,
    VITE_API_URL: '/api'
  };
}

// CLI usage for debugging
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔍 APEX AI SERVER PORT DISCOVERY');
  console.log('=================================\n');
  
  const frontend = getFrontendServerInfo();
  const backend = getBackendServerInfo();
  
  console.log('📱 Frontend Server:');
  console.log(`   Port: ${frontend.port}`);
  console.log(`   URL: ${frontend.url}`);
  console.log(`   Status: ${frontend.isRunning ? '✅ Running' : '❌ Not Running'}`);
  console.log(`   Source: ${frontend.source}\n`);
  
  console.log('🖥️  Backend Server:');
  console.log(`   Port: ${backend.port}`);
  console.log(`   URL: ${backend.url}`);
  console.log(`   WebSocket: ${backend.websocket_url}`);
  console.log(`   Status: ${backend.isRunning ? '✅ Running' : '❌ Not Running'}`);
  console.log(`   Source: ${backend.source}\n`);
  
  // Show port status
  console.log('🔍 Port Availability Check:');
  getPortStatus().then(status => {
    Object.entries(status).forEach(([port, available]) => {
      const statusText = available ? '✅ Available' : '❌ In Use';
      console.log(`   Port ${port}: ${statusText}`);
    });
  });
}
