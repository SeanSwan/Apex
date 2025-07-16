/**
 * Utilities Barrel Export - Clean Import Interface
 * Centralizes all utility functions and hooks for efficient imports
 */

// Daily Reports Utilities
export {
  parseBulkReport,
  applyBulkImportResults,
  validateBulkImportText,
  validateReportsCompleteness,
  assessContentQuality,
  getActiveReport,
  findNextIncompleteReport,
  updateReportStatusWithProgression,
  emitMetricsUpdateEvent,
  triggerAutosaveIndicator,
  shouldTriggerAISuggestions,
  triggerAITypingIndicator,
  handleBulkImportError
} from './dailyReportsUtils';

// Daily Reports Hooks
export {
  useDailyReportsState,
  useBulkImport,
  useContactForm,
  useReportHandlers,
  useForceSave,
  useAIGeneration,
  useReportCalculations,
  useDailyReportsPanel
} from './dailyReportsHooks';

// Theme Builder Utilities
export {
  imageUtils,
  colorBuilderUtils,
  sectionUtils,
  themeManagementUtils,
  formUtils,
  performanceUtils,
  useThemeBuilderState,
  useImageUpload,
  useThemeValidation
} from './themeBuilderUtils';
export type {
  ThemeBuilderState,
  ThemeBuilderActions
} from './themeBuilderUtils';

// Theme Management Utilities
export {
  themePresetsManager,
  createCustomPreset,
  getPresetsList,
  applyPreset,
  deleteCustomPreset,
  exportPresets,
  importPresets
} from './themePresetsManager';
export type {
  ExtendedThemeSettings,
  PresetMetadata,
  PresetApplication,
  CustomPreset
} from './themePresetsManager';

export {
  themeValidator,
  validateThemeSettings,
  validateSingleSetting,
  getValidationSeverity
} from './themeValidator';
export type {
  ValidationResult,
  ValidationSummary,
  ValidationSeverity
} from './themeValidator';

export {
  themeExporter,
  exportUtils,
  exportTheme,
  importTheme,
  downloadTheme
} from './themeExporter';
export type {
  ExportResult,
  ExportOptions,
  ImportResult,
  ImportOptions
} from './themeExporter';

// Chart Utilities
export { 
  analyzeDailyReportsForCharts, 
  getMetricValue, 
  validateDailyReports,
  calculateSummaryStats,
  generateHourlyPatterns
} from './chartDataAnalyzer';

export { 
  saveToLocalStorage, 
  loadFromLocalStorage, 
  clearOldChartData,
  getStorageInfo,
  autoSaveManager,
  exportToFile,
  importFromFile
} from './chartLocalStorage';

export { 
  generateComprehensiveInsights, 
  transformMetricsForCharts, 
  generateContextualInsights
} from './chartInsightsGenerator';
export type { InsightsData, TransformedChartData } from './chartInsightsGenerator';

export { 
  transformMetricsToChartData, 
  validateChartData,
  filterAndSortChartData,
  generateTimeSeriesData,
  transformReportsToActivityData,
  exportChartData
} from './chartDataTransformer';
export type { 
  DailyDataPoint, 
  SummaryDataPoint, 
  WeekdayWeekendDataPoint, 
  HourlyDataPoint, 
  ChartDataSet 
} from './chartDataTransformer';

export { 
  generateChartConfig, 
  getChartGenerationOptions,
  getResponsiveChartDimensions,
  generateColorPalette,
  getChartAnimationConfig,
  getChartAccessibilityConfig,
  exportChartConfig,
  validateChartConfig,
  getChartTypeConfig
} from './chartConfigManager';
export type { ChartThemeConfig, ChartGenerationOptions } from './chartConfigManager';

// AI Assistant Utilities
export {
  aiAnalysisEngine,
  aiAnalysisUtils,
  AIAnalysisEngine
} from './aiAnalysisEngine';
export type {
  GrammarIssue,
  ContentEnhancement,
  SecuritySuggestion,
  AnalysisResult
} from './aiAnalysisEngine';

export {
  SuggestionManager,
  useSuggestionManager,
  suggestionUtils
} from './suggestionManager';
export type {
  SuggestionState,
  SuggestionActions,
  SuggestionProcessingOptions,
  SuggestionAnalytics
} from './suggestionManager';

export {
  useAIAssistant,
  useSecurityTips,
  useAIOptions,
  useAnalysisPerformance,
  useContentQuality,
  useAIAssistantShortcuts,
  useAIAssistantAnalytics
} from './aiAssistantHooks';
export type {
  AIAssistantState,
  AIAssistantActions,
  AIAssistantHookOptions,
  AnalysisTriggers
} from './aiAssistantHooks';

// Preview Panel Utilities
export {
  EnhancedPDFGenerator,
  usePDFGeneration
} from './pdfGenerationEngine';
export type {
  PDFGenerationOptions,
  PDFGenerationResult,
  CanvasGenerationOptions,
  UsePDFGenerationOptions,
  UsePDFGenerationReturn
} from './pdfGenerationEngine';

export {
  ExportManager,
  useExportManager,
  exportUtils as previewExportUtils
} from './exportManager';
export type {
  ExportFormat,
  ExportQualitySettings,
  ExportOptions as PreviewExportOptions,
  ExportResult as PreviewExportResult,
  CanvasOptions,
  DownloadOptions,
  UseExportManagerOptions,
  UseExportManagerReturn
} from './exportManager';

export {
  usePreviewRenderer,
  DateFormatter,
  ResponsiveUtils,
  SectionVisibilityManager,
  PreviewDataValidator,
  PreviewContentGenerator,
  PREVIEW_BUTTON_CONFIGS
} from './previewRenderer';
export type {
  PreviewState,
  PreviewActions,
  PreviewRendererOptions,
  PreviewButtonConfig
} from './previewRenderer';

export {
  usePreviewState,
  usePreviewData,
  useResponsivePreview
} from './previewHooks';
export type {
  UsePreviewStateOptions,
  UsePreviewDataOptions
} from './previewHooks';

// Media Utilities
export * from './mediaUtils';
export * from './mediaHooks';

// Enhanced Production Utilities
export { 
  default as EnhancedErrorBoundary, 
  withErrorBoundary, 
  useAsyncError, 
  safeAsync, 
  DataErrorBoundary 
} from './EnhancedErrorBoundary';

export {
  default as AccessibilityUtils,
  colorContrast,
  useFocusManagement,
  useKeyboardNavigation,
  screenReader,
  useAccessibility,
  SkipLink,
  AccessibleButton
} from './AccessibilityUtils';
export type { AccessibilityProps } from './AccessibilityUtils';

export {
  TypeValidators,
  TypeGuards,
  TypeFactories
} from './TypeSafetyUtils';
export type {
  StrictStringLiteral,
  NonEmptyString,
  HexColor,
  EmailString,
  URLString,
  StrictStyledProps,
  StrictErrorBoundaryProps,
  StrictLoadingState,
  StrictValidationResult,
  StrictChartDataPoint,
  StrictChartConfiguration,
  StrictThemeSettings,
  StrictAISuggestion,
  StrictAIAnalysisResult,
  DeepReadonly,
  StrictPick,
  StrictOptional,
  SafeFunction,
  StrictPerformanceMetrics,
  StrictComponentPerformance,
  StrictAccessibilityProps,
  StrictContrastRatio
} from './TypeSafetyUtils';
