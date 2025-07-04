/**
 * ProcessingIndicator Component - Extracted from AIReportAssistant
 * Reusable processing state indicator with customizable messages and animations
 */

import React from 'react';
import {
  ProcessingContainer,
  SpinnerIcon,
  ProcessingText
} from '../../shared';

export interface ProcessingIndicatorProps {
  isProcessing: boolean;
  primaryMessage?: string;
  secondaryMessage?: string;
  spinnerSize?: number;
  variant?: 'default' | 'compact' | 'minimal';
  showSecondaryMessage?: boolean;
  customIcon?: React.ReactNode;
  className?: string;
}

/**
 * ProcessingIndicator - Displays loading state with customizable messages
 * 
 * Used for AI analysis, report generation, and other async operations
 */
const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({
  isProcessing,
  primaryMessage = "Analyzing security report content...",
  secondaryMessage = "AI is reviewing your report for improvements and suggestions",
  spinnerSize = 32,
  variant = 'default',
  showSecondaryMessage = true,
  customIcon,
  className
}) => {
  if (!isProcessing) {
    return null;
  }

  const getSpinnerSize = () => {
    switch (variant) {
      case 'compact': return Math.max(spinnerSize * 0.75, 20);
      case 'minimal': return Math.max(spinnerSize * 0.6, 16);
      default: return spinnerSize;
    }
  };

  const getPrimaryTextSize = () => {
    switch (variant) {
      case 'compact': return 'sm';
      case 'minimal': return 'xs';
      default: return 'md';
    }
  };

  return (
    <ProcessingContainer className={className} $variant={variant}>
      {/* Processing Icon */}
      {customIcon || <SpinnerIcon size={getSpinnerSize()} />}
      
      {/* Primary Message */}
      <ProcessingText $size={getPrimaryTextSize()}>
        {primaryMessage}
      </ProcessingText>
      
      {/* Secondary Message */}
      {showSecondaryMessage && secondaryMessage && variant !== 'minimal' && (
        <ProcessingText>
          {secondaryMessage}
        </ProcessingText>
      )}
    </ProcessingContainer>
  );
};

export default ProcessingIndicator;
