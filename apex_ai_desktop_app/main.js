/**
 * APEX AI DESKTOP MONITOR - MAIN PROCESS
 * =====================================
 * Electron main process for the AI security monitoring desktop application
 * Handles window management, Python AI engine communication, and system integration
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

// Keep a global reference of the window object
let mainWindow;
let pythonAIProcess = null;
let wsServer = null;
let isDev = false;

// Determine if running in development
try {
  isDev = require('electron-is-dev') || process.env.NODE_ENV === 'development';
} catch (e) {
  isDev = false;
}

/**
 * Create the main application window
 */
function createMainWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev // Disable web security in dev for local video files
    },
    show: false,
    titleBarStyle: 'default',
    icon: path.join(__dirname, 'assets/icon.png') // Add icon later
  });

  // Load the React app
  const startUrl = isDev 
    ? 'http://localhost:3001' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  console.log('🖥️ Main window created');
}

/**
 * Initialize WebSocket server for Python AI Engine communication
 */
function initializeWSServer() {
  wsServer = new WebSocket.Server({ port: 8765 });
  
  wsServer.on('connection', (ws) => {
    console.log('🔌 Python AI Engine connected');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleAIEngineMessage(message);
      } catch (error) {
        console.error('❌ Invalid AI Engine message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('🔌 Python AI Engine disconnected');
    });
  });
  
  console.log('🚀 WebSocket server started on port 8765');
}

/**
 * Handle messages from Python AI Engine
 */
function handleAIEngineMessage(message) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Forward AI engine messages to renderer process
    mainWindow.webContents.send('ai-engine-message', message);
  }
}

/**
 * Start Python AI Engine process
 */
function startPythonAIEngine() {
  const pythonScript = path.join(__dirname, '../apex_ai_engine/inference.py');
  
  // Check if Python script exists
  const fs = require('fs');
  if (!fs.existsSync(pythonScript)) {
    console.log('⚠️ Python AI Engine script not found, will create later');
    return;
  }
  
  console.log('🐍 Starting Python AI Engine...');
  
  pythonAIProcess = spawn('python', [pythonScript], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: path.dirname(pythonScript)
  });
  
  pythonAIProcess.stdout.on('data', (data) => {
    console.log('🐍 AI Engine:', data.toString().trim());
  });
  
  pythonAIProcess.stderr.on('data', (data) => {
    console.error('🐍 AI Engine Error:', data.toString().trim());
  });
  
  pythonAIProcess.on('close', (code) => {
    console.log(`🐍 Python AI Engine exited with code ${code}`);
    pythonAIProcess = null;
  });
}

/**
 * Stop Python AI Engine process
 */
function stopPythonAIEngine() {
  if (pythonAIProcess) {
    console.log('🛑 Stopping Python AI Engine...');
    pythonAIProcess.kill();
    pythonAIProcess = null;
  }
}

// App event handlers
app.whenReady().then(() => {
  createMainWindow();
  initializeWSServer();
  startPythonAIEngine();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopPythonAIEngine();
  
  if (wsServer) {
    wsServer.close();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopPythonAIEngine();
});

// IPC Handlers for renderer process communication

ipcMain.handle('start-camera-stream', async (event, cameraData) => {
  console.log('📹 Starting camera stream:', cameraData.camera_id);
  
  // Send command to Python AI Engine via WebSocket
  if (wsServer) {
    wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          command: 'start_camera',
          data: cameraData
        }));
      }
    });
  }
  
  return { success: true, camera_id: cameraData.camera_id };
});

ipcMain.handle('stop-camera-stream', async (event, cameraId) => {
  console.log('⏹️ Stopping camera stream:', cameraId);
  
  // Send command to Python AI Engine via WebSocket
  if (wsServer) {
    wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          command: 'stop_camera',
          data: { camera_id: cameraId }
        }));
      }
    });
  }
  
  return { success: true, camera_id: cameraId };
});

ipcMain.handle('configure-ai-rules', async (event, rules) => {
  console.log('⚙️ Configuring AI rules:', Object.keys(rules));
  
  // Send rules to Python AI Engine
  if (wsServer) {
    wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          command: 'configure_rules',
          data: rules
        }));
      }
    });
  }
  
  return { success: true };
});

ipcMain.handle('capture-snapshot', async (event, cameraId) => {
  console.log('📸 Capturing snapshot for camera:', cameraId);
  
  // Request snapshot from Python AI Engine
  if (wsServer) {
    wsServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          command: 'capture_snapshot',
          data: { camera_id: cameraId }
        }));
      }
    });
  }
  
  return { success: true, camera_id: cameraId };
});

ipcMain.handle('play-voice-response', async (event, voiceLine) => {
  console.log('🔊 Playing voice response:', voiceLine);
  
  // In production, this would trigger actual audio playback
  // For demo, we'll simulate it
  return { success: true, voice_line: voiceLine };
});

ipcMain.handle('get-app-info', async () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    pythonAIEngineRunning: pythonAIProcess !== null,
    wsServerRunning: wsServer !== null
  };
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

console.log('🚀 Apex AI Desktop Monitor - Main Process Initialized');
