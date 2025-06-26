// Hooks Index - Centralized Exports
// Created for proper import/export standardization

// === REPORT BUILDER HOOKS ===
export { usePerformanceOptimizedState } from './usePerformanceOptimizedState';
export { useReportNavigation } from './useReportNavigation';
export { useChartGeneration } from './useChartGeneration';

// === UI HOOKS ===
export { useToast } from './use-toast';

// === UTILITY HOOKS ===
export { default as useCurrentTime } from './useCurrentTime';
export { default as useGeolocation } from './useGeolocation';

// === RE-EXPORTS FOR FLEXIBILITY ===
// Allow both named and default imports where applicable
export { useToast as default } from './use-toast';
