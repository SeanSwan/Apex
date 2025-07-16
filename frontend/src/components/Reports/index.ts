/**
 * Reports Components Index - REORGANIZED & CONFLICT-FREE
 * Fixed all duplicate exports and naming conflicts
 * Organized by category with clear prefixes for styled components
 */

// ===== MAIN COMPONENTS =====
export { default as EnhancedReportBuilder } from './EnhancedReportBuilder';
export { default as ClientSelector } from './ClientSelector';
export { default as PropertyInfoPanel } from './PropertyInfoPanel';
export { default as DailyReportsPanel } from './DailyReportsPanel';
export { default as MediaManagementSystem } from './MediaManagementSystem';
export { default as DataVisualizationPanel } from './DataVisualizationPanel';
export { default as ThemeBuilder } from './ThemeBuilder';
export { default as EnhancedPreviewPanel } from './EnhancedPreviewPanel';
export type { EnhancedPreviewPanelProps } from './EnhancedPreviewPanel';
export { default as DeliveryOptionsPanel } from './DeliveryOptionsPanel';

// ===== AI ASSISTANT COMPONENTS =====
export {
  default as AIReportAssistant
} from './AIReportAssistant';
export type {
  AIReportAssistantProps
} from './AIReportAssistant';

// AI Assistant Sub-Components
export {
  ProcessingIndicator,
  NoSuggestionsDisplay,
  ContentPrompt,
  FeedbackSection,
  AnalyticsPanel,
  SimpleAIAssistant,
  CustomAIAssistant,
  AIAssistantPresets,
  HighSecurityAIAssistant,
  QuickEditAIAssistant,
  TrainingAIAssistant,
  ReviewAIAssistant,
  AIAssistantComponents,
  ComponentGroups
} from './components/AIAssistantComponents';
export type {
  ProcessingIndicatorProps,
  NoSuggestionsDisplayProps,
  ContentPromptProps,
  FeedbackSectionProps,
  PerformanceMetrics,
  AnalyticsPanelProps,
  AnalyticsData,
  SimpleAIAssistantProps,
  CustomAIAssistantProps
} from './components/AIAssistantComponents';

// ===== EXTRACTED COMPONENTS =====
export { default as ChartRenderer, EnhancedChartRenderer, useChartInteraction } from './components/ChartRenderer';
export { 
  default as ColorPalette, 
  ColorContrastDisplay
} from './components/ColorPalette';
export type { 
  ColorValue,
  ColorPaletteProps, 
  ColorContrastDisplayProps
} from './components/ColorPalette';

export {
  default as SuggestionItem,
  BulkSuggestionActions
} from './components/SuggestionItem';
export type {
  SuggestionItemProps,
  BulkSuggestionActionsProps
} from './components/SuggestionItem';

export {
  default as SecurityTipsDisplay
} from './components/SecurityTipsDisplay';
export type {
  SecurityTipsDisplayProps,
  SecurityTip,
  TipFilterOptions
} from './components/SecurityTipsDisplay';

// ===== PREVIEW PANEL COMPONENTS =====
export {
  ExecutiveSummary,
  CompactExecutiveSummary,
  CustomExecutiveSummary,
  AnalyticsExecutiveSummary
} from './components/ExecutiveSummary';
export type {
  ExecutiveSummaryProps,
  CustomExecutiveSummaryProps,
  AnalyticsExecutiveSummaryProps
} from './components/ExecutiveSummary';

export {
  MetricsDisplay,
  PropertyInfo,
  MetricCardComponent,
  CompactMetricsDisplay,
  MetricsSummary
} from './components/MetricsDisplay';
export type {
  MetricsDisplayProps,
  PropertyInfoProps,
  MetricCardProps,
  MetricsSummaryProps
} from './components/MetricsDisplay';

export {
  MediaGallery,
  MediaItemComponent,
  VideoLinkComponent,
  ChartImage,
  CompactMediaGallery
} from './components/MediaGallery';
export type {
  MediaGalleryProps,
  MediaItemProps,
  VideoLinkItemProps,
  ChartImageProps
} from './components/MediaGallery';

// ===== CONSTANTS & CONFIGURATION =====

// Chart Constants
export {
  CHART_COLORS,
  CHART_DIMENSIONS,
  CHART_CONFIG,
  ANALYSIS_KEYWORDS,
  DAY_MAPPING,
  SECURITY_CODE_WEIGHTS,
  LOCAL_STORAGE_CONFIG,
  CHART_GENERATION_CONFIG,
  DEFAULT_METRICS,
  TAB_TYPES,
  TIMEFRAME_TYPES,
  COMPARISON_TYPES,
  getChartColor,
  getSecurityCodeWeight,
  getDayName
} from './constants/chartConstants';
export type { 
  ActiveTabType, 
  TimeframeType, 
  ComparisonType, 
  SecurityCodeType 
} from './constants/chartConstants';

// Theme Constants
export {
  THEME_TABS,
  THEME_PRESETS,
  COLLAPSIBLE_SECTIONS,
  TIMING_CONSTANTS,
  MEDIA_UPLOAD_TYPES,
  FONT_FAMILIES,
  CARD_STYLES,
  ANIMATION_PRESETS
} from './constants/themeConstants';
export type {
  ThemeTabType,
  MediaUploadType,
  CollapsibleSectionType,
  CardStyleType,
  AnimationPresetType
} from './constants/themeConstants';

// AI Assistant Constants
export {
  SUGGESTION_TYPES,
  GRAMMAR_PATTERNS,
  CONTENT_ENHANCEMENT_PATTERNS,
  SECURITY_SUGGESTION_PATTERNS,
  SECURITY_TIPS_BY_DAY,
  AI_ANALYSIS_CONFIG,
  AI_TIMING_CONSTANTS,
  SUGGESTION_BADGE_COLORS,
  SECURITY_CODE_CONFIG,
  CONTENT_ANALYSIS_KEYWORDS,
  DEFAULT_AI_OPTIONS,
  ENHANCEMENT_TEMPLATES,
  FEEDBACK_TYPES,
  getSecurityTipsForDay,
  getSuggestionBadgeColor,
  getSecurityCodeConfig,
  getDayIndex
} from './constants/aiAssistantConstants';
export type {
  Suggestion,
  AIOptions,
  SuggestionType,
  FeedbackType
} from './constants/aiAssistantConstants';

// Preview Panel Constants
export {
  PREVIEW_VIEW_TYPES,
  SECTION_TYPES,
  SECTION_VISIBILITY_MAP,
  PDF_GENERATION_CONFIG,
  EXPORT_CONFIG,
  LOADING_STATES,
  SECURITY_CODE_STYLES,
  MARBLE_TEXTURE_CONFIG,
  RESPONSIVE_BREAKPOINTS,
  ANIMATION_CONFIG,
  FALLBACK_VALUES,
  GRID_CONFIG,
  DATE_FORMAT_PATTERNS,
  THEME_DEFAULTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  COMPONENT_CONFIG,
  getRandomTexturePosition,
  getRandomTextureSize,
  getRandomOpacity,
  getSecurityCodeStyle,
  shouldShowSection
} from './constants/previewPanelConstants';
export type {
  PreviewViewType,
  SectionType,
  PDFQualityType,
  PDFExportType,
  LoadingState,
  SecurityCodeType as PreviewSecurityCodeType
} from './constants/previewPanelConstants';

// ===== UTILITY FUNCTIONS =====

// Chart Utilities
export { 
  analyzeDailyReportsForCharts, 
  getMetricValue, 
  validateDailyReports,
  calculateSummaryStats,
  generateHourlyPatterns
} from './utils/chartDataAnalyzer';

export { 
  saveToLocalStorage, 
  loadFromLocalStorage, 
  clearOldChartData,
  getStorageInfo,
  autoSaveManager,
  exportToFile,
  importFromFile
} from './utils/chartLocalStorage';

export { 
  generateComprehensiveInsights, 
  transformMetricsForCharts, 
  generateContextualInsights
} from './utils/chartInsightsGenerator';
export type { InsightsData, TransformedChartData } from './utils/chartInsightsGenerator';

export { 
  transformMetricsToChartData, 
  validateChartData,
  filterAndSortChartData,
  generateTimeSeriesData,
  transformReportsToActivityData,
  exportChartData
} from './utils/chartDataTransformer';
export type { 
  DailyDataPoint, 
  SummaryDataPoint, 
  WeekdayWeekendDataPoint, 
  HourlyDataPoint, 
  ChartDataSet 
} from './utils/chartDataTransformer';

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
} from './utils/chartConfigManager';
export type { ChartThemeConfig, ChartGenerationOptions } from './utils/chartConfigManager';

// Theme Utilities
export {
  themePresetsManager,
  createCustomPreset,
  getPresetsList,
  applyPreset,
  deleteCustomPreset,
  exportPresets,
  importPresets
} from './utils/themePresetsManager';
export type {
  ExtendedThemeSettings,
  PresetMetadata,
  PresetApplication,
  CustomPreset
} from './utils/themePresetsManager';

export {
  themeValidator,
  validateThemeSettings,
  validateSingleSetting,
  getValidationSeverity
} from './utils/themeValidator';
export type {
  ValidationResult,
  ValidationSummary,
  ValidationSeverity
} from './utils/themeValidator';

export {
  themeExporter,
  exportUtils,
  exportTheme,
  importTheme,
  downloadTheme
} from './utils/themeExporter';
export type {
  ExportResult,
  ExportOptions,
  ImportResult,
  ImportOptions
} from './utils/themeExporter';

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
} from './utils/themeBuilderUtils';
export type {
  ThemeBuilderState,
  ThemeBuilderActions
} from './utils/themeBuilderUtils';

// AI Assistant Utilities
export {
  aiAnalysisEngine,
  aiAnalysisUtils,
  AIAnalysisEngine
} from './utils/aiAnalysisEngine';
export type {
  GrammarIssue,
  ContentEnhancement,
  SecuritySuggestion,
  AnalysisResult
} from './utils/aiAnalysisEngine';

export {
  SuggestionManager,
  useSuggestionManager,
  suggestionUtils
} from './utils/suggestionManager';
export type {
  SuggestionState,
  SuggestionActions,
  SuggestionProcessingOptions,
  SuggestionAnalytics
} from './utils/suggestionManager';

export {
  useAIAssistant,
  useSecurityTips,
  useAIOptions,
  useAnalysisPerformance,
  useContentQuality,
  useAIAssistantShortcuts,
  useAIAssistantAnalytics
} from './utils/aiAssistantHooks';
export type {
  AIAssistantState,
  AIAssistantActions,
  AIAssistantHookOptions,
  AnalysisTriggers
} from './utils/aiAssistantHooks';

// Preview Panel Utilities
export {
  EnhancedPDFGenerator,
  usePDFGeneration
} from './utils/pdfGenerationEngine';
export type {
  PDFGenerationOptions,
  PDFGenerationResult,
  CanvasGenerationOptions,
  UsePDFGenerationOptions,
  UsePDFGenerationReturn
} from './utils/pdfGenerationEngine';

export {
  ExportManager,
  useExportManager,
  exportUtils as previewExportUtils
} from './utils/exportManager';
export type {
  ExportFormat,
  ExportQualitySettings,
  ExportOptions as PreviewExportOptions,
  ExportResult as PreviewExportResult,
  CanvasOptions,
  DownloadOptions,
  UseExportManagerOptions,
  UseExportManagerReturn
} from './utils/exportManager';

export {
  usePreviewRenderer,
  DateFormatter,
  ResponsiveUtils,
  SectionVisibilityManager,
  PreviewDataValidator,
  PreviewContentGenerator,
  PREVIEW_BUTTON_CONFIGS
} from './utils/previewRenderer';
export type {
  PreviewState,
  PreviewActions,
  PreviewRendererOptions,
  PreviewButtonConfig
} from './utils/previewRenderer';

export {
  usePreviewState,
  usePreviewData,
  useResponsivePreview
} from './utils/previewHooks';
export type {
  UsePreviewStateOptions,
  UsePreviewDataOptions
} from './utils/previewHooks';

// ===== STYLED COMPONENTS =====

// Chart Styled Components (Prefixed: Chart*)
export {
  Section as ChartSection,
  SectionTitle as ChartSectionTitle,
  ChartContainer,
  DataGrid,
  MetricCard,
  MetricValue,
  MetricLabel,
  ChartTab,
  TabButton,
  TimeframeTab,
  TimeframeButton,
  ExportButton as ChartExportButton,
  SaveButton,
  InsightBox,
  LoadingOverlay as ChartLoadingOverlay,
  LoadingSpinner as ChartLoadingSpinner,
  StatusMessage as ChartStatusMessage,
  ChartWrapper,
  ResponsiveGrid as ChartResponsiveGrid,
  ButtonGroup as ChartButtonGroup,
  VisuallyHidden as ChartVisuallyHidden,
  FocusTrap as ChartFocusTrap,
  AnimationDelay as ChartAnimationDelay,
  ThemeTransitionWrapper as ChartThemeTransitionWrapper
} from './shared/ChartStyledComponents';

// Theme Builder Styled Components (Prefixed: Theme*)
export {
  TabContainer,
  Tab,
  ContentContainer,
  SettingsGrid,
  SettingCard,
  SettingGroup,
  Label,
  SelectInput,
  TextInput,
  RangeSlider,
  TextArea,
  PresetButton,
  ActionBar,
  ActionButton as ThemeActionButton,
  ToggleSwitch,
  ColorInput,
  FileInput,
  ImagePreview,
  CollapsibleSection,
  SectionHeader,
  SectionContent,
  ValidationMessage,
  PreviewContainer as ThemePreviewContainer,
  CustomCSSEditor,
  ProgressIndicator,
  TooltipWrapper as ThemeTooltipWrapper,
  QuickActionButton,
  ImportExportPanel
} from './shared/ThemeBuilderStyledComponents';

// AI Assistant Styled Components (Prefixed: AI*)
export {
  AssistantContainer,
  AssistantHeader,
  HeaderTitle,
  HeaderActions,
  IconButton,
  AssistantContent,
  ContentSection as AIContentSection,
  ProcessingContainer,
  SpinnerIcon,
  ProcessingText,
  SuggestionsList,
  NoSuggestionsContainer,
  SuccessIcon,
  StatusMessage as AIStatusMessage,
  StatusDescription,
  TipsSection,
  TipsHeader,
  MultiColumnLayout,
  TipContainer,
  TipTitle,
  TipContent,
  FeedbackContainer,
  FeedbackText,
  FeedbackActions,
  FeedbackButton,
  AnalyticsSection,
  AnalyticsTitle,
  AnalyticsGrid,
  AnalyticsMetric,
  AnalyticsValue,
  AnalyticsLabel,
  VisuallyHidden as AIVisuallyHidden,
  FocusTrap as AIFocusTrap,
  ScrollContainer
} from './shared/AIAssistantStyledComponents';

// Preview Panel Styled Components (Prefixed: Preview*)
export {
  Section as PreviewSection,
  SectionTitle as PreviewSectionTitle,
  PreviewControlsContainer,
  PreviewControls,
  PreviewButton,
  ButtonGroup as PreviewButtonGroup,
  ActionButton as PreviewActionButton,
  DownloadButton,
  PDFButton,
  PreviewContainer,
  HeaderSection,
  LogoContainer,
  HeaderContent,
  HeaderTitle as PreviewHeaderTitle,
  HeaderSubtitle,
  ContentSection as PreviewContentSection,
  ContentSectionHeader,
  LoadingOverlay as PreviewLoadingOverlay,
  LoadingSpinner as PreviewLoadingSpinner,
  StatusIndicator,
  ContactSection,
  ContactInfo,
  ContactItem,
  ContactLabel,
  ContactValue,
  NotesSection,
  NotesContent,
  DailyReportsSection,
  DailyReportItem,
  DailyReportHeader,
  DailyReportDay,
  DailyReportContent,
  SecurityCodeBadge,
  VisuallyHidden as PreviewVisuallyHidden,
  FocusTrap as PreviewFocusTrap,
  ResponsiveGrid as PreviewResponsiveGrid,
  ResponsiveText,
  AnimationDelay as PreviewAnimationDelay,
  ThemeTransitionWrapper as PreviewThemeTransitionWrapper,
  SkeletonLoader,
  ScrollContainer as PreviewScrollContainer,
  TooltipWrapper as PreviewTooltipWrapper
} from './shared/PreviewStyledComponents';

// ===== ENHANCED UTILITIES (PRODUCTION READY) =====

// Enhanced Error Boundary
export { default as EnhancedErrorBoundary, withErrorBoundary, useAsyncError, safeAsync, DataErrorBoundary } from './utils/EnhancedErrorBoundary';

// Accessibility Utilities
export {
  default as AccessibilityUtils,
  colorContrast,
  useFocusManagement,
  useKeyboardNavigation,
  screenReader,
  useAccessibility,
  SkipLink,
  AccessibleButton
} from './utils/AccessibilityUtils';
export type { AccessibilityProps } from './utils/AccessibilityUtils';

// Type Safety Utilities
export {
  TypeValidators,
  TypeGuards,
  TypeFactories
} from './utils/TypeSafetyUtils';
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
} from './utils/TypeSafetyUtils';

// ===== LEGACY UTILITY COMPONENTS =====
export { default as ReportBuilderErrorBoundary } from './ReportBuilderErrorBoundary';
export { default as LoadingOverlay } from './LoadingOverlay';
export { default as DateRangeSelector } from './DateRangeSelector';
export { default as ReportNavigation } from './ReportNavigation';
export { EnhancedPDFGenerator as EnhancedPDFGeneratorComponent } from './EnhancedPDFGenerator';
export { default as DataFlowMonitor } from './DataFlowMonitor';
export { default as DragDropImageUpload } from './DragDropImageUpload';
export { default as BugFixVerification } from './BugFixVerification';

// ===== LEGACY EXPORTS =====
export * from './ReportBuilder.styles';
export * from './reportBuilder.constants';
export * from './ChartComponents';

// ===== DEFAULT EXPORT =====
export { default } from './EnhancedReportBuilder';

/**
 * EXPORT SUMMARY:
 * - ✅ Resolved all duplicate exports (Section, LoadingOverlay, ButtonGroup, etc.)
 * - ✅ Added prefixes to styled components (Chart*, Theme*, AI*, Preview*)
 * - ✅ Organized by category for better maintainability
 * - ✅ Fixed type conflicts (SecurityCodeType renamed to PreviewSecurityCodeType)
 * - ✅ Maintained backward compatibility
 * - ✅ Clear documentation for each section
 */