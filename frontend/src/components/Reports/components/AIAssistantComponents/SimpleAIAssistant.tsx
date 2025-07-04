/**
 * SimpleAIAssistant Component - Extracted from AIReportAssistant
 * Simplified AI assistant for basic use cases with minimal configuration
 */

import React from 'react';
import { AIReportAssistant, AIReportAssistantProps } from '../../AIReportAssistant';

export interface SimpleAIAssistantProps {
  content: string;
  onChange: (content: string) => void;
  day?: string;
  securityCode?: string;
  className?: string;
  enableAnalytics?: boolean;
}

/**
 * SimpleAIAssistant - Minimal configuration AI assistant
 * 
 * Provides AI assistance with sensible defaults for basic use cases
 * Always runs in compact mode with predefined date range
 */
const SimpleAIAssistant: React.FC<SimpleAIAssistantProps> = ({
  content,
  onChange,
  day = 'Monday',
  securityCode = 'Code 4',
  className,
  enableAnalytics = false
}) => {
  // Generate a 7-day date range starting from today
  const dateRange = {
    start: new Date(),
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };

  // Create minimal AI options for simple use case
  const aiOptions = {
    enableGrammarCheck: true,
    enableContentSuggestions: true,
    enableSecuritySuggestions: true,
    suggestionDelay: 1000, // Faster response for simple mode
    maxSuggestions: 3, // Fewer suggestions to avoid overwhelm
    autoApplyGrammarFixes: false,
    persistFeedback: false // Don't persist in simple mode
  };

  return (
    <AIReportAssistant
      day={day}
      content={content}
      securityCode={securityCode}
      onChange={onChange}
      dateRange={dateRange}
      aiOptions={aiOptions}
      compactMode={true}
      enableAnalytics={enableAnalytics}
      className={className}
    />
  );
};

export default SimpleAIAssistant;
