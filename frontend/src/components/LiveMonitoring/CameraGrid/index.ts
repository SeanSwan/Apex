// APEX AI LIVE MONITORING - CAMERA GRID EXPORTS

// APEX AI LIVE MONITORING - CAMERA GRID INDEX
// Enhanced exports for camera grid components

export { CameraGrid } from './CameraGrid';
export { CameraCard } from './CameraCard';
export { DetectionOverlay } from './DetectionOverlay';

// Enhanced prop types for external use
export type { CameraGridProps } from '../types';

// Quick setup handler types
export interface EnhancedCameraGridProps {
  onQuickSetup?: (setupType: string) => void;
  onTestStream?: (streamType: string) => void;
}
