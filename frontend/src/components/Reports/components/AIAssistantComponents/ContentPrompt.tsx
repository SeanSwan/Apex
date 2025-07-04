/**
 * ContentPrompt Component - Extracted from AIReportAssistant
 * Prompts user to add more content for AI analysis
 */

import React from 'react';
import { Sparkles, Edit3, FileText } from 'lucide-react';
import { SecurityTipsDisplay } from '../SecurityTipsDisplay';
import { AI_ANALYSIS_CONFIG } from '../../constants';
import {
  NoSuggestionsContainer,
  SuccessIcon,
  StatusMessage,
  StatusDescription
} from '../../shared';

export interface ContentPromptProps {
  day: string;
  currentLength: number;
  minLength?: number;
  compactMode?: boolean;
  showQuickTips?: boolean;
  customIcon?: React.ReactNode;
  title?: string;
  customDescription?: string;
  variant?: 'info' | 'warning' | 'neutral';
  className?: string;
}

/**
 * ContentPrompt - Encourages user to add more content for analysis
 * 
 * Shows current content length vs minimum requirements and optional tips
 */
const ContentPrompt: React.FC<ContentPromptProps> = ({
  day,
  currentLength,
  minLength = AI_ANALYSIS_CONFIG.minContentLength,
  compactMode = false,
  showQuickTips = true,
  customIcon,
  title = "Add more content to your report",
  customDescription,
  variant = 'info',
  className
}) => {
  const getDefaultDescription = () => {
    const remaining = Math.max(0, minLength - currentLength);
    
    if (remaining === 0) {
      return `You've reached the minimum length! Add a bit more content to get comprehensive AI analysis.`;
    }
    
    return `Enter more details in your security report (${remaining} more characters needed) to receive AI-powered suggestions and improvements.`;
  };

  const getProgressPercentage = () => {
    return Math.min(100, Math.round((currentLength / minLength) * 100));
  };

  const getIconComponent = () => {
    if (customIcon) return customIcon;
    
    const progress = getProgressPercentage();
    if (progress >= 75) return <Edit3 size={24} />;
    if (progress >= 25) return <FileText size={24} />;
    return <Sparkles size={24} />;
  };

  const getIconColor = () => {
    const progress = getProgressPercentage();
    
    switch (variant) {
      case 'warning': return '#f59e0b';
      case 'neutral': return '#6b7280';
      default: 
        if (progress >= 75) return '#22c55e';
        if (progress >= 50) return '#3b82f6';
        return '#6b7280';
    }
  };

  return (
    <NoSuggestionsContainer className={className}>
      {/* Prompt Icon */}
      <SuccessIcon $color={getIconColor()}>
        {getIconComponent()}
      </SuccessIcon>
      
      {/* Status Message */}
      <StatusMessage $variant={variant}>
        {title}
      </StatusMessage>
      
      {/* Description with Progress */}
      <StatusDescription>
        {customDescription || getDefaultDescription()}
        
        {/* Progress Indicator */}
        {!compactMode && (
          <div style={{ 
            marginTop: '1rem',
            padding: '0.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            fontSize: '0.875rem'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '0.5rem',
              color: '#e0e0e0'
            }}>
              <span>Content Progress</span>
              <span>{currentLength} / {minLength} characters</span>
            </div>
            
            <div style={{
              width: '100%',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${getProgressPercentage()}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${getIconColor()}, ${getIconColor()}aa)`,
                borderRadius: '3px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
      </StatusDescription>

      {/* Quick Tips */}
      {showQuickTips && !compactMode && (
        <SecurityTipsDisplay
          day={day}
          maxTips={2}
          showCategories={false}
          showPriority={false}
          layout="list"
          compactMode={true}
        />
      )}
    </NoSuggestionsContainer>
  );
};

export default ContentPrompt;
