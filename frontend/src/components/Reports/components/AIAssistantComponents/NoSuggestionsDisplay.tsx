/**
 * NoSuggestionsDisplay Component - Extracted from AIReportAssistant
 * Displays success state when no issues are found in the content
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { SecurityTipsDisplay } from '../SecurityTipsDisplay';
import {
  NoSuggestionsContainer,
  SuccessIcon,
  StatusMessage,
  StatusDescription
} from '../../shared';

export interface NoSuggestionsDisplayProps {
  day: string;
  compactMode?: boolean;
  showSecurityTips?: boolean;
  maxTips?: number;
  customIcon?: React.ReactNode;
  title?: string;
  description?: string;
  variant?: 'success' | 'info' | 'neutral';
  className?: string;
}

/**
 * NoSuggestionsDisplay - Shows success state when AI finds no issues
 * 
 * Includes optional security tips and customizable messaging
 */
const NoSuggestionsDisplay: React.FC<NoSuggestionsDisplayProps> = ({
  day,
  compactMode = false,
  showSecurityTips = true,
  maxTips,
  customIcon,
  title = "Your report looks excellent!",
  description = "No significant issues were found in your security report. The content appears well-structured and comprehensive.",
  variant = 'success',
  className
}) => {
  const getMaxTips = () => {
    if (maxTips !== undefined) return maxTips;
    return compactMode ? 2 : 4;
  };

  const getIconColor = () => {
    switch (variant) {
      case 'info': return '#3b82f6';
      case 'neutral': return '#6b7280';
      default: return '#22c55e';
    }
  };

  return (
    <NoSuggestionsContainer className={className}>
      {/* Success Icon */}
      <SuccessIcon $color={getIconColor()}>
        {customIcon || <Sparkles size={24} />}
      </SuccessIcon>
      
      {/* Status Message */}
      <StatusMessage $variant={variant}>
        {title}
      </StatusMessage>
      
      {/* Description */}
      <StatusDescription>
        {description}
      </StatusDescription>

      {/* Security Tips */}
      {showSecurityTips && (
        <SecurityTipsDisplay
          day={day}
          maxTips={getMaxTips()}
          showCategories={!compactMode}
          showPriority={!compactMode}
          layout={compactMode ? 'list' : 'columns'}
          compactMode={compactMode}
        />
      )}
    </NoSuggestionsContainer>
  );
};

export default NoSuggestionsDisplay;
