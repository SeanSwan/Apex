/**
 * AI Assistant Components Barrel Export - Clean Import Interface
 * Centralizes all AI assistant components for efficient imports
 */

// Base Level Components
export { default as ProcessingIndicator } from './ProcessingIndicator';
export type { ProcessingIndicatorProps } from './ProcessingIndicator';

export { default as NoSuggestionsDisplay } from './NoSuggestionsDisplay';
export type { NoSuggestionsDisplayProps } from './NoSuggestionsDisplay';

export { default as ContentPrompt } from './ContentPrompt';
export type { ContentPromptProps } from './ContentPrompt';

// Feature Components
export { default as FeedbackSection } from './FeedbackSection';
export type { 
  FeedbackSectionProps, 
  PerformanceMetrics 
} from './FeedbackSection';

export { default as AnalyticsPanel } from './AnalyticsPanel';
export type { 
  AnalyticsPanelProps, 
  AnalyticsData 
} from './AnalyticsPanel';

// Variant Components
export { default as SimpleAIAssistant } from './SimpleAIAssistant';
export type { SimpleAIAssistantProps } from './SimpleAIAssistant';

export { 
  default as CustomAIAssistant,
  AIAssistantPresets,
  HighSecurityAIAssistant,
  QuickEditAIAssistant,
  TrainingAIAssistant,
  ReviewAIAssistant
} from './CustomAIAssistant';
export type { CustomAIAssistantProps } from './CustomAIAssistant';

/**
 * Re-export commonly used types for convenience
 */
export type {
  AIOptions,
  Suggestion,
  SuggestionType,
  FeedbackType
} from '../../constants';

/**
 * Component categories for easy reference
 */
export const AIAssistantComponents = {
  // State Components
  ProcessingIndicator,
  NoSuggestionsDisplay,
  ContentPrompt,
  
  // Feature Components
  FeedbackSection,
  AnalyticsPanel,
  
  // Variant Components
  SimpleAIAssistant,
  CustomAIAssistant,
  
  // Preset Components
  HighSecurityAIAssistant,
  QuickEditAIAssistant,
  TrainingAIAssistant,
  ReviewAIAssistant
};

/**
 * Component groups for different use cases
 */
export const ComponentGroups = {
  // Basic components for simple implementations
  Basic: [
    'ProcessingIndicator',
    'NoSuggestionsDisplay', 
    'ContentPrompt',
    'SimpleAIAssistant'
  ],
  
  // Advanced components for full-featured implementations
  Advanced: [
    'FeedbackSection',
    'AnalyticsPanel',
    'CustomAIAssistant'
  ],
  
  // Preset components for specific use cases
  Presets: [
    'HighSecurityAIAssistant',
    'QuickEditAIAssistant', 
    'TrainingAIAssistant',
    'ReviewAIAssistant'
  ]
};
