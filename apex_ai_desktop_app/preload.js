/**
 * APEX AI DESKTOP MONITOR - PRELOAD SCRIPT
 * ========================================
 * Secure bridge between main process and renderer process
 * Exposes safe APIs for the React frontend to communicate with Electron
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Camera Stream Management
  startCameraStream: (cameraData) => ipcRenderer.invoke('start-camera-stream', cameraData),
  stopCameraStream: (cameraId) => ipcRenderer.invoke('stop-camera-stream', cameraId),
  
  // AI Engine Configuration
  configureAIRules: (rules) => ipcRenderer.invoke('configure-ai-rules', rules),
  captureSnapshot: (cameraId) => ipcRenderer.invoke('capture-snapshot', cameraId),
  
  // Voice Response System
  playVoiceResponse: (voiceLine) => ipcRenderer.invoke('play-voice-response', voiceLine),
  
  // App Information
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // File System
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Event Listeners for AI Engine Messages
  onAIEngineMessage: (callback) => {
    ipcRenderer.on('ai-engine-message', (event, message) => callback(message));
  },
  
  removeAIEngineListener: () => {
    ipcRenderer.removeAllListeners('ai-engine-message');
  },
  
  // Platform Information
  platform: process.platform,
  
  // Development helpers
  isDev: process.env.NODE_ENV === 'development'
});

console.log('🔒 Preload script loaded - Secure API bridge established');
