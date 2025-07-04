/**
 * Constants Barrel Export - Clean Import Interface
 * Centralizes all theme-related constants for efficient imports
 */

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
} from './themeConstants';
export type {
  ThemeTabType,
  MediaUploadType,
  CollapsibleSectionType,
  CardStyleType,
  AnimationPresetType
} from './themeConstants';

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
} from './chartConstants';
export type { 
  ActiveTabType, 
  TimeframeType, 
  ComparisonType, 
  SecurityCodeType 
} from './chartConstants';

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
} from './aiAssistantConstants';
export type {
  Suggestion,
  AIOptions,
  SuggestionType,
  FeedbackType
} from './aiAssistantConstants';

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
} from './previewPanelConstants';
export type {
  PreviewViewType,
  SectionType,
  PDFQualityType,
  PDFExportType,
  LoadingState,
  SecurityCodeType as PreviewSecurityCodeType
} from './previewPanelConstants';

// Media Constants
export * from './mediaConstants';
