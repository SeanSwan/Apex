/**
 * FeedbackSection Component - Extracted from AIReportAssistant
 * Handles user feedback and displays performance metrics
 */

import React from 'react';
import {
  FeedbackContainer,
  FeedbackText,
  FeedbackActions,
  FeedbackButton
} from '../../shared';

export interface PerformanceMetrics {
  averageAnalysisTime: number;
  totalAnalyses: number;
  successRate?: number;
  lastAnalysisTime?: number;
}

export interface FeedbackSectionProps {
  feedbackGiven: { [key: number]: 'helpful' | 'not-helpful' };
  onFeedback: (type: 'helpful' | 'not-helpful') => void;
  performance?: PerformanceMetrics;
  compactMode?: boolean;
  showPerformanceMetrics?: boolean;
  customText?: string;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

/**
 * FeedbackSection - Collects user feedback and shows performance data
 * 
 * Provides thumbs up/down feedback and optional performance metrics display
 */
const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  feedbackGiven,
  onFeedback,
  performance,
  compactMode = false,
  showPerformanceMetrics = true,
  customText = "AI Assistant trained specifically for security operations reporting",
  variant = 'default',
  className
}) => {
  const shouldShowMetrics = () => {
    return showPerformanceMetrics && 
           performance && 
           !compactMode && 
           variant !== 'minimal';
  };

  const formatMetrics = () => {
    if (!performance) return '';
    
    const metrics = [
      `Avg. analysis: ${Math.round(performance.averageAnalysisTime)}ms`,
      `Total analyses: ${performance.totalAnalyses}`
    ];
    
    if (performance.successRate !== undefined) {
      metrics.push(`Success rate: ${Math.round(performance.successRate * 100)}%`);
    }
    
    return metrics.join(' • ');
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'compact': return { fontSize: '0.875rem' };
      case 'minimal': return { fontSize: '0.8rem' };
      default: return {};
    }
  };

  const getButtonSize = () => {
    switch (variant) {
      case 'compact': return 'sm';
      case 'minimal': return 'xs';
      default: return 'md';
    }
  };

  return (
    <FeedbackContainer className={className} $variant={variant}>
      {/* Feedback Text with Optional Metrics */}
      <FeedbackText style={getTextStyle()}>
        {customText}
        
        {shouldShowMetrics() && (
          <span style={{ 
            marginLeft: '0.5rem', 
            fontSize: '0.75rem', 
            opacity: 0.7,
            display: variant === 'compact' ? 'block' : 'inline',
            marginTop: variant === 'compact' ? '0.25rem' : '0'
          }}>
            • {formatMetrics()}
          </span>
        )}
      </FeedbackText>

      {/* Feedback Actions */}
      <FeedbackActions $variant={variant}>
        <FeedbackButton
          $active={feedbackGiven[-1] === 'helpful'}
          $variant="positive"
          $size={getButtonSize()}
          onClick={() => onFeedback('helpful')}
          title="This AI assistance was helpful"
        >
          <span>👍</span>
          {variant !== 'minimal' && 'Helpful'}
        </FeedbackButton>
        
        <FeedbackButton
          $active={feedbackGiven[-1] === 'not-helpful'}
          $variant="negative"
          $size={getButtonSize()}
          onClick={() => onFeedback('not-helpful')}
          title="This AI assistance was not helpful"
        >
          <span>👎</span>
          {variant !== 'minimal' && 'Not Helpful'}
        </FeedbackButton>
      </FeedbackActions>
    </FeedbackContainer>
  );
};

export default FeedbackSection;
