/**
 * Shared Styled Components Barrel Export - Clean Import Interface
 * Centralizes all styled components with proper prefixes to avoid conflicts
 */

// Theme Builder Styled Components (Prefixed: Theme*)
export {
  Section,
  SectionTitle,
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
  TextArea as ThemeTextArea,
  PresetButton,
  ActionBar,
  ActionButton,
  ToggleSwitch,
  ColorInput,
  FileInput,
  ImagePreview,
  PreviewHeader,
  PreviewTitle,
  PreviewText,
  PreviewHighlight,
  CollapsibleSection,
  CollapsibleContent,
  SectionHeader,
  SectionHeader as CollapsibleHeader,
  SectionContent,
  ValidationMessage,
  PreviewContainer as ThemePreviewContainer,
  CustomCSSEditor,
  ProgressIndicator,
  TooltipWrapper as ThemeTooltipWrapper,
  QuickActionButton,
  ImportExportPanel,
  LoadingSpinner,
  ErrorMessage,
  SuccessMessage
} from './ThemeBuilderStyledComponents';

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
  StatusMessage,
  StatusMessage as ChartStatusMessage,
  ChartWrapper,
  ResponsiveGrid as ChartResponsiveGrid,
  ButtonGroup as ChartButtonGroup,
  VisuallyHidden as ChartVisuallyHidden,
  FocusTrap as ChartFocusTrap,
  AnimationDelay as ChartAnimationDelay,
  ThemeTransitionWrapper as ChartThemeTransitionWrapper
} from './ChartStyledComponents';

// AI Assistant Styled Components (Prefixed: AI*)
export {
  AssistantContainer,
  AssistantHeader,
  HeaderTitle,
  HeaderActions,
  IconButton,
  AssistantContent,
  ContentSection,
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
} from './AIAssistantStyledComponents';

// Daily Reports Styled Components (Prefixed: DailyReports*)
export {
  Section as DailyReportsSection,
  SectionHeader as DailyReportsSectionHeader,
  SectionTitle as DailyReportsSectionTitle,
  BulkImportSection,
  BulkImportTitle,
  BulkImportDescription,
  BulkTextArea,
  BulkImportButtons,
  ProcessingIndicator,
  ImportPreview,
  PreviewItem,
  PreviewDay,
  PreviewContent,
  ReportTabs,
  ReportTabsList,
  ReportTabsTrigger,
  ReportTabsContent,
  TabsHeader,
  TabsHeaderTitle,
  ReportHeaderTitle,
  CollapseButton,
  ProgressContainer,
  ProgressDetails,
  ProgressText,
  ProgressBar,
  ProgressFill,
  WordCountBadge,
  TextAreaContainer,
  TextArea,
  CharCount,
  AIPromptIndicator,
  ControlsRow,
  ControlGroup,
  ControlLabel,
  Select as DailyReportsSelect,
  TextInput as DailyReportsTextInput,
  ButtonGroup as DailyReportsButtonGroup,
  ExpandedButtonGroup,
  StyledButton as DailyReportsStyledButton,
  BulkButton,
  SecurityCodeBadge,
  CardSection,
  SummarySection,
  SummarySectionTitle,
  SignatureSection,
  AIOptionsSection,
  InputGroup as DailyReportsInputGroup,
  InputLabel as DailyReportsInputLabel,
  CheckboxGroup,
  CheckboxLabel,
  Checkbox,
  AutosaveIndicator
} from './DailyReportsStyledComponents';
export type {
  ReportTabsTriggerProps,
  ProgressFillProps,
  CharCountProps,
  SecurityCodeBadgeProps,
  WordCountBadgeProps,
  CollapseButtonProps
} from './DailyReportsStyledComponents';

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
  DailyReportsSection as PreviewDailyReportsSection,
  DailyReportItem,
  DailyReportHeader,
  DailyReportDay,
  DailyReportContent,
  SecurityCodeBadge as PreviewSecurityCodeBadge,
  VisuallyHidden as PreviewVisuallyHidden,
  FocusTrap as PreviewFocusTrap,
  ResponsiveGrid as PreviewResponsiveGrid,
  ResponsiveText,
  AnimationDelay as PreviewAnimationDelay,
  ThemeTransitionWrapper as PreviewThemeTransitionWrapper,
  SkeletonLoader,
  ScrollContainer as PreviewScrollContainer,
  TooltipWrapper as PreviewTooltipWrapper
} from './PreviewStyledComponents';

// ========================================
// BACKWARD COMPATIBILITY ALIASES
// ========================================
// These exports maintain backward compatibility for components that haven't been updated
// to use the new prefixed naming convention

// Common component aliases (defaulting to Chart* versions for most common usage)
export {
  ChartStatusMessage as StatusMessage,
  ChartButtonGroup as ButtonGroup,
  ChartResponsiveGrid as ResponsiveGrid,
  ChartVisuallyHidden as VisuallyHidden,
  ChartFocusTrap as FocusTrap,
  ChartAnimationDelay as AnimationDelay,
  ChartThemeTransitionWrapper as ThemeTransitionWrapper
};

// AI Assistant specific aliases
// (ContentSection now exported directly)

// Theme Builder specific aliases
// (ActionButton now exported directly)

// Preview specific aliases
// (Preview components now exported directly)

// Additional commonly used aliases
// (CollapsibleHeader now exported directly)

// Error message alias removed - ErrorMessage now exported directly
