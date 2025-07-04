/**
 * AI Report Assistant - Main Component (FULLY REFACTORED)
 * Production-ready modular component using extracted specialized components
 * Reduced from 27.6KB to ~6KB through enhanced decomposition
 */

import React from 'react';
import { 
  Sparkles, 
  Maximize2, 
  Minimize2,
  RotateCcw,
  Download
} from 'lucide-react';

// Clean barrel imports
import { 
  AIOptions,
  AI_ANALYSIS_CONFIG,
  DEFAULT_AI_OPTIONS
} from './constants';
import { useAIAssistant, useSecurityTips } from './utils';
import { SuggestionItem, SecurityTipsDisplay } from './components';
import {
  ProcessingIndicator,
  NoSuggestionsDisplay,
  ContentPrompt,
  FeedbackSection,
  AnalyticsPanel
} from './components/AIAssistantComponents';
import {
  AssistantContainer,
  AssistantHeader,
  HeaderTitle,
  HeaderActions,
  IconButton,
  AssistantContent,
  ContentSection,
  SuggestionsList,
  StatusMessage
} from './shared';

/**
 * AI Report Assistant Props Interface
 */
export interface AIReportAssistantProps {
  day: string;
  content: string;
  securityCode?: string;
  onChange: (content: string) => void;
  aiOptions?: AIOptions;
  dateRange: { start: Date; end: Date };
  className?: string;
  enableAnalytics?: boolean;
  compactMode?: boolean;
}

/**
 * AI Report Assistant Component - Pure Orchestration
 *
 * Provides intelligent assistance for security report writing with
 * grammar correction, content suggestions, and security improvements
 */
export const AIReportAssistant: React.FC<AIReportAssistantProps> = ({
  day,
  content,
  securityCode = 'Code 4',
  onChange,
  aiOptions = DEFAULT_AI_OPTIONS,
  dateRange,
  className,
  enableAnalytics = false,
  compactMode = false
}) => {
  // Use the main AI assistant hook
  const {
    state,
    actions,
    suggestionActions,
    analytics,
    performance
  } = useAIAssistant(
    content,
    day,
    securityCode,
    dateRange,
    aiOptions,
    onChange,
    {
      autoAnalyze: true,
      enablePersistence: true,
      suggestionOptions: {
        enableFeedback: true,
        autoCollapseAfterApply: true
      }
    }
  );

  // Get security tips for the current day
  const { tips } = useSecurityTips(day, 4);

  // Handle suggestion application
  const handleApplySuggestion = (index: number, improvement: string) => {
    suggestionActions.applySuggestion(index, improvement);
  };

  // Handle feedback
  const handleGlobalFeedback = (type: 'helpful' | 'not-helpful') => {
    suggestionActions.recordFeedback(-1, type);
  };

  // Export analysis data (for debugging/admin)
  const handleExportData = () => {
    const data = {
      performance,
      analytics,
      suggestions: state.suggestions,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-assistant-data-${day.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render content based on state - Clean conditional rendering
  const renderContent = () => {
    // Processing State
    if (state.isProcessing) {
      return (
        <ProcessingIndicator
          isProcessing={true}
          variant={compactMode ? 'compact' : 'default'}
          primaryMessage="Analyzing security report content..."
          secondaryMessage="AI is reviewing your report for improvements and suggestions"
        />
      );
    }

    // Suggestions State
    if (state.suggestions.length > 0) {
      return (
        <>
          <StatusMessage $variant="info">
            AI analysis has identified {state.suggestions.length} suggestion{state.suggestions.length !== 1 ? 's' : ''} to enhance your security report:
          </StatusMessage>

          <SuggestionsList>
            {state.suggestions.map((suggestion, index) => (
              <SuggestionItem
                key={`${suggestion.type}-${index}`}
                suggestion={suggestion}
                index={index}
                isExpanded={state.expandedSuggestion === index}
                isApplied={state.appliedSuggestions.has(index)}
                isDismissed={state.dismissedSuggestions.has(index)}
                feedback={state.feedbackGiven[index]}
                onToggle={suggestionActions.toggleSuggestion}
                onApply={handleApplySuggestion}
                onDismiss={suggestionActions.dismissSuggestion}
                onFeedback={suggestionActions.recordFeedback}
                showPreview={!compactMode}
                enableAnimations={!compactMode}
                maxPreviewLength={compactMode ? 100 : 200}
              />
            ))}
          </SuggestionsList>
        </>
      );
    }

    // No Issues Found State
    if (content.length >= AI_ANALYSIS_CONFIG.minContentLength) {
      return (
        <NoSuggestionsDisplay
          day={day}
          compactMode={compactMode}
          showSecurityTips={true}
          title="Your report looks excellent!"
          description="No significant issues were found in your security report. The content appears well-structured and comprehensive."
          variant="success"
        />
      );
    }

    // Need More Content State
    return (
      <ContentPrompt
        day={day}
        currentLength={content.length}
        minLength={AI_ANALYSIS_CONFIG.minContentLength}
        compactMode={compactMode}
        showQuickTips={!compactMode}
        title="Add more content to your report"
        variant="info"
      />
    );
  };

  return (
    <AssistantContainer $expanded={state.isExpanded} className={className}>
      {/* Header */}
      <AssistantHeader onClick={actions.toggleExpanded}>
        <HeaderTitle>
          <Sparkles size={18} />
          AI Security Report Assistant
          {state.isProcessing && (
            <ProcessingIndicator 
              isProcessing={true} 
              variant="minimal" 
              showSecondaryMessage={false}
              spinnerSize={16}
              primaryMessage=""
            />
          )}
        </HeaderTitle>

        <HeaderActions>
          {/* Quick actions when expanded */}
          {state.isExpanded && (
            <>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  actions.forceAnalyze();
                }}
                title="Refresh Analysis"
                disabled={state.isProcessing}
              >
                <RotateCcw size={16} />
              </IconButton>

              {enableAnalytics && (
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportData();
                  }}
                  title="Export Data"
                  $variant="secondary"
                >
                  <Download size={16} />
                </IconButton>
              )}
            </>
          )}

          {/* Expand/collapse button */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              actions.toggleExpanded();
            }}
            title={state.isExpanded ? 'Minimize' : 'Expand'}
          >
            {state.isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </IconButton>
        </HeaderActions>
      </AssistantHeader>

      {/* Content */}
      <AssistantContent $expanded={state.isExpanded}>
        <ContentSection $padding={compactMode ? '0.75rem' : '1rem'}>
          {renderContent()}
        </ContentSection>

        {/* Advanced Analytics Panel */}
        {enableAnalytics && analytics && state.isExpanded && (
          <AnalyticsPanel
            analytics={analytics}
            performance={performance}
            compactMode={compactMode}
            showExportButton={true}
            onExport={handleExportData}
          />
        )}

        {/* Feedback Section */}
        <FeedbackSection
          feedbackGiven={state.feedbackGiven}
          onFeedback={handleGlobalFeedback}
          performance={performance}
          compactMode={compactMode}
          showPerformanceMetrics={!enableAnalytics} // Don't duplicate if analytics panel is shown
          variant={compactMode ? 'compact' : 'default'}
        />
      </AssistantContent>
    </AssistantContainer>
  );
};

export default AIReportAssistant;
