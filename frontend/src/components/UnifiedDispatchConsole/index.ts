/**
 * UNIFIED DISPATCH CONSOLE COMPONENTS - MASTER PROMPT v52.0 (ENHANCED)
 * =====================================================================
 * Export all Voice AI Dispatcher monitoring components
 * Enhanced with error boundaries, loading states, and accessibility
 * Phase B: UI/UX Excellence - COMPLETE
 * Phase C: WebSocket Integration - COMPLETE
 */

// Core Voice AI Components (Enhanced)
export { default as LiveCallMonitor } from './LiveCallMonitor';
export { default as EnhancedLiveCallMonitor } from './EnhancedLiveCallMonitor';
export { default as CallInterventionPanel } from './CallInterventionPanel';
export { default as EnhancedCallInterventionPanel } from './EnhancedCallInterventionPanel';

// WebSocket-Integrated Components (Phase C - NEW)
export { default as LiveCallMonitorWebSocket } from './LiveCallMonitorWebSocket';
export { default as CallInterventionPanelWebSocket } from './CallInterventionPanelWebSocket';
export type { CallInterventionStatus } from './CallInterventionPanelWebSocket';
export type { LiveCallMonitorWebSocketProps, VoiceCall, CallTranscriptEntry } from './LiveCallMonitorWebSocket';

// System Monitoring Components (Phase A + Enhanced)
export { default as ApiStatusIndicator, CompactApiStatusIndicator, DetailedApiStatusIndicator } from './ApiStatusIndicator';
export { default as SystemStatusDashboard, CompactSystemStatus, FullSystemDashboard } from './SystemStatusDashboard';

// UI/UX Enhancement Components (Phase B)
export { default as ErrorBoundary, withErrorBoundary, useErrorHandler } from './ErrorBoundary';
export { 
  Skeleton,
  LiveCallMonitorSkeleton,
  SystemStatusDashboardSkeleton,
  ApiStatusIndicatorSkeleton,
  CallInterventionPanelSkeleton,
  SOPEditorSkeleton,
  CardSkeleton,
  LoadingSpinner
} from './LoadingSkeletons';

// Configuration Components
export { default as SOPEditor } from '../Configuration/SOPEditor';

// Note: Type exports are not included as the interfaces are not explicitly exported from individual components
// Components should be imported with their implicit prop types as needed by consuming code
