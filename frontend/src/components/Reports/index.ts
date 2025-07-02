// Reports Components Index - Centralized Exports
// Created for proper import/export standardization

// === MAIN COMPONENTS ===
export { default as EnhancedReportBuilder } from './EnhancedReportBuilder';
export { default as ClientSelector } from './ClientSelector';
export { default as PropertyInfoPanel } from './PropertyInfoPanel';
export { default as DailyReportsPanel } from './DailyReportsPanel';
export { default as MediaManagementSystem } from './MediaManagementSystem';
export { default as DataVisualizationPanel } from './DataVisualizationPanel';
export { default as ThemeBuilder } from './ThemeBuilder';
export { default as EnhancedPreviewPanel } from './EnhancedPreviewPanel';
export { default as DeliveryOptionsPanel } from './DeliveryOptionsPanel';

// === MODULARIZED COMPONENTS ===
export { default as ReportBuilderErrorBoundary } from './ReportBuilderErrorBoundary';
export { default as LoadingOverlay } from './LoadingOverlay';
export { default as DateRangeSelector } from './DateRangeSelector';
export { default as ReportNavigation } from './ReportNavigation';

// === STYLED COMPONENTS ===
export * from './ReportBuilder.styles';

// === CONSTANTS & CONFIGURATION ===
export * from './reportBuilder.constants';

// === PDF GENERATION ===
export { EnhancedPDFGenerator } from './EnhancedPDFGenerator';

// === UTILITY COMPONENTS ===
export { default as AIReportAssistant } from './AIReportAssistant';
export * from './ChartComponents';
export { default as DataFlowMonitor } from './DataFlowMonitor';
export { default as DragDropImageUpload } from './DragDropImageUpload';
export { default as BugFixVerification } from './BugFixVerification';

// === RE-EXPORTS FOR BACKWARD COMPATIBILITY ===
// Allow both named and default imports
export { default } from './EnhancedReportBuilder';
