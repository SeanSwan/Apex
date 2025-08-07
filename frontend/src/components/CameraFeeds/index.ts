/**
 * APEX AI CAMERA FEEDS COMPONENTS - EXPORTS
 * =========================================
 * Central export file for all camera feed components
 */

// Core camera components
export { default as CameraFeed, STREAM_TYPES, CONNECTION_STATUS } from './CameraFeed'
export { default as CameraGrid, GRID_LAYOUTS } from './CameraGrid'
export { default as DispatcherDashboard } from './DispatcherDashboard'
export { default as CameraConfiguration } from './CameraConfiguration'

// Configuration presets
export const CAMERA_PRESETS = {
  HIKVISION: 'hikvision',
  DAHUA: 'dahua',
  GENERIC_MJPEG: 'generic_mjpeg',
  GENERIC_HTTP: 'generic_http',
  RTSP: 'rtsp'
}