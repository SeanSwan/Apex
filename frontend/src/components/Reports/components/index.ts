/**
 * Components Barrel Export - Clean Import Interface
 * Centralizes all extracted components for efficient imports
 */

// Theme Builder Components
export { 
  default as ColorPalette, 
  ColorContrastDisplay, 
  ColorAccessibilityInfo, 
  ColorValueDisplay 
} from './ColorPalette';
export type { 
  ColorPaletteProps, 
  ColorSwatchProps, 
  ContrastCheckResult 
} from './ColorPalette';

// Chart Components
export { 
  default as ChartRenderer, 
  EnhancedChartRenderer, 
  useChartInteraction 
} from './ChartRenderer';

// AI Assistant Components
export {
  default as SuggestionItem,
  BulkSuggestionActions
} from './SuggestionItem';
export type {
  SuggestionItemProps,
  BulkSuggestionActionsProps
} from './SuggestionItem';

export {
  default as SecurityTipsDisplay
} from './SecurityTipsDisplay';
export type {
  SecurityTipsDisplayProps,
  SecurityTip,
  TipFilterOptions
} from './SecurityTipsDisplay';

// Preview Panel Components
export {
  ExecutiveSummary,
  CompactExecutiveSummary,
  CustomExecutiveSummary,
  AnalyticsExecutiveSummary
} from './ExecutiveSummary';
export type {
  ExecutiveSummaryProps,
  CustomExecutiveSummaryProps,
  AnalyticsExecutiveSummaryProps
} from './ExecutiveSummary';

export {
  MetricsDisplay,
  PropertyInfo,
  MetricCardComponent,
  CompactMetricsDisplay,
  MetricsSummary
} from './MetricsDisplay';
export type {
  MetricsDisplayProps,
  PropertyInfoProps,
  MetricCardProps,
  MetricsSummaryProps
} from './MetricsDisplay';

export {
  MediaGallery,
  MediaItemComponent,
  VideoLinkComponent,
  ChartImage,
  CompactMediaGallery
} from './MediaGallery';
export type {
  MediaGalleryProps,
  MediaItemProps,
  VideoLinkItemProps,
  ChartImageProps
} from './MediaGallery';

// Media Management Components
export { default as MediaFileCard } from './MediaFileCard';
export { default as MediaFilterControls } from './MediaFilterControls';
export { default as MediaModals } from './MediaModals';
export { default as MediaUploadArea } from './MediaUploadArea';

// Theme Tab Components
export {
  PresetsTab,
  ColorsTab,
  LayoutTab,
  MediaTab,
  EffectsTab,
  AdvancedTab,
  ThemePreview
} from './ThemeTabComponents';

// AI Assistant Components
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
} from './AIAssistantComponents';
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
} from './AIAssistantComponents';
