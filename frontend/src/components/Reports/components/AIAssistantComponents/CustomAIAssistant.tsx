/**
 * CustomAIAssistant Component - Extracted from AIReportAssistant
 * Advanced AI assistant with customizable options and callbacks
 */

import React, { useCallback, useEffect } from 'react';
import { AIReportAssistant, AIReportAssistantProps } from '../../AIReportAssistant';
import { AIOptions, DEFAULT_AI_OPTIONS } from '../../constants';

export interface CustomAIAssistantProps extends Omit<AIReportAssistantProps, 'aiOptions'> {
  customOptions?: Partial<AIOptions>;
  onAnalysisComplete?: (suggestions: any[]) => void;
  onAnalysisStart?: () => void;
  onSuggestionApplied?: (suggestion: any, index: number) => void;
  onSuggestionDismissed?: (suggestion: any, index: number) => void;
  onFeedbackGiven?: (feedback: 'helpful' | 'not-helpful', globalFeedback?: boolean) => void;
  enableAdvancedAnalytics?: boolean;
  customAnalyticsCallback?: (analytics: any) => void;
}

/**
 * CustomAIAssistant - Advanced AI assistant with custom behaviors
 * 
 * Provides full customization of AI options and event callbacks
 * Suitable for advanced integrations and custom workflows
 */
const CustomAIAssistant: React.FC<CustomAIAssistantProps> = ({
  customOptions,
  onAnalysisComplete,
  onAnalysisStart,
  onSuggestionApplied,
  onSuggestionDismissed,
  onFeedbackGiven,
  enableAdvancedAnalytics = false,
  customAnalyticsCallback,
  ...props
}) => {
  // Merge custom options with defaults
  const mergedOptions: AIOptions = {
    ...DEFAULT_AI_OPTIONS,
    ...customOptions
  };

  // Enhanced content change handler with callbacks
  const handleContentChange = useCallback((newContent: string) => {
    // Call original onChange
    props.onChange(newContent);
    
    // Trigger analysis start callback if provided
    if (onAnalysisStart) {
      onAnalysisStart();
    }
  }, [props.onChange, onAnalysisStart]);

  // Analytics callback effect
  useEffect(() => {
    if (enableAdvancedAnalytics && customAnalyticsCallback) {
      // Set up analytics reporting interval
      const interval = setInterval(() => {
        const analyticsData = {
          timestamp: new Date(),
          sessionId: `session-${Date.now()}`,
          contentLength: props.content.length,
          day: props.day,
          securityCode: props.securityCode,
          // Add more analytics data as needed
        };
        
        customAnalyticsCallback(analyticsData);
      }, 30000); // Report every 30 seconds

      return () => clearInterval(interval);
    }
  }, [enableAdvancedAnalytics, customAnalyticsCallback, props.content.length, props.day, props.securityCode]);

  // Create enhanced props with callbacks
  const enhancedProps = {
    ...props,
    onChange: handleContentChange,
    aiOptions: mergedOptions,
    enableAnalytics: enableAdvancedAnalytics || props.enableAnalytics
  };

  return <AIReportAssistant {...enhancedProps} />;
};

/**
 * Preset configurations for common use cases
 */
export const AIAssistantPresets = {
  // High-security mode with thorough analysis
  highSecurity: {
    enableGrammarCheck: true,
    enableContentSuggestions: true,
    enableSecuritySuggestions: true,
    suggestionDelay: 500,
    maxSuggestions: 10,
    autoApplyGrammarFixes: false,
    enableAdvancedAnalysis: true,
    securityFocus: true
  },

  // Fast mode for quick edits
  quickEdit: {
    enableGrammarCheck: true,
    enableContentSuggestions: false,
    enableSecuritySuggestions: false,
    suggestionDelay: 200,
    maxSuggestions: 3,
    autoApplyGrammarFixes: true,
    enableAdvancedAnalysis: false
  },

  // Training mode with detailed feedback
  training: {
    enableGrammarCheck: true,
    enableContentSuggestions: true,
    enableSecuritySuggestions: true,
    suggestionDelay: 1000,
    maxSuggestions: 8,
    autoApplyGrammarFixes: false,
    enableAdvancedAnalysis: true,
    enableDetailedFeedback: true,
    persistFeedback: true
  },

  // Review mode for final checks
  review: {
    enableGrammarCheck: true,
    enableContentSuggestions: true,
    enableSecuritySuggestions: true,
    suggestionDelay: 300,
    maxSuggestions: 5,
    autoApplyGrammarFixes: false,
    enableAdvancedAnalysis: true,
    focusOnImprovement: true
  }
};

/**
 * Preset-based AI Assistant Components
 */
export const HighSecurityAIAssistant: React.FC<Omit<CustomAIAssistantProps, 'customOptions'>> = (props) => (
  <CustomAIAssistant {...props} customOptions={AIAssistantPresets.highSecurity} />
);

export const QuickEditAIAssistant: React.FC<Omit<CustomAIAssistantProps, 'customOptions'>> = (props) => (
  <CustomAIAssistant {...props} customOptions={AIAssistantPresets.quickEdit} />
);

export const TrainingAIAssistant: React.FC<Omit<CustomAIAssistantProps, 'customOptions'>> = (props) => (
  <CustomAIAssistant {...props} customOptions={AIAssistantPresets.training} />
);

export const ReviewAIAssistant: React.FC<Omit<CustomAIAssistantProps, 'customOptions'>> = (props) => (
  <CustomAIAssistant {...props} customOptions={AIAssistantPresets.review} />
);

export default CustomAIAssistant;
