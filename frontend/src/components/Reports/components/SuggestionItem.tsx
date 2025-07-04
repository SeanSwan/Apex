/**
 * Suggestion Item Component - Individual AI Suggestion Display and Interaction
 * Extracted from AIReportAssistant for better modularity
 * Production-ready suggestion component with accessibility and animations
 */

import React, { useState, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import {
  CheckCircle,
  FileText,
  Shield,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ArrowRightCircle,
  Copy,
  ThumbsUp,
  ThumbsDown,
  X,
  AlertTriangle
} from 'lucide-react';

import {
  Suggestion,
  FeedbackType,
  FEEDBACK_TYPES,
  getSuggestionBadgeColor,
  AI_TIMING_CONSTANTS,
  aiAnimations
} from '../constants/aiAssistantConstants';
import { Button } from '../../ui/button';

/**
 * Suggestion item props interface
 */
export interface SuggestionItemProps {
  suggestion: Suggestion;
  index: number;
  isExpanded: boolean;
  isApplied: boolean;
  isDismissed: boolean;
  feedback: FeedbackType | null;
  onToggle: (index: number) => void;
  onApply: (index: number, improvement: string) => void;
  onDismiss: (index: number) => void;
  onFeedback: (index: number, feedback: FeedbackType) => void;
  showPreview?: boolean;
  enableAnimations?: boolean;
  maxPreviewLength?: number;
  className?: string;
}

/**
 * Suggestion container with animation support
 */
const SuggestionContainer = styled.div<{ 
  $isApplied: boolean; 
  $isDismissed: boolean;
  $enableAnimations: boolean;
}>`
  border: 1px solid ${props => {
    if (props.$isApplied) return '#10b981';
    if (props.$isDismissed) return '#ef4444';
    return '#e0e0e0';
  }};
  border-radius: 6px;
  overflow: hidden;
  background-color: ${props => {
    if (props.$isApplied) return '#f0fdf4';
    if (props.$isDismissed) return '#fef2f2';
    return '#ffffff';
  }};
  transition: ${props => props.$enableAnimations ? 'all 0.3s ease' : 'none'};
  animation: ${props => props.$enableAnimations ? css`${aiAnimations.fadeIn} 0.3s ease-out` : 'none'};
  opacity: ${props => props.$isDismissed ? 0.6 : 1};
  
  &:hover {
    border-color: ${props => {
      if (props.$isApplied) return '#10b981';
      if (props.$isDismissed) return '#ef4444';
      return '#7c3aed';
    }};
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.1);
  }
`;

/**
 * Suggestion header with interactive elements
 */
const SuggestionHeader = styled.div<{ $clickable: boolean }>`
  padding: 0.75rem;
  background-color: #f3f4f6;
  font-weight: 500;
  font-size: 0.875rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.$clickable ? '#e5e7eb' : '#f3f4f6'};
  }

  @media (max-width: 640px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }
`;

/**
 * Suggestion title with icon and badge
 */
const SuggestionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0; // Allow text to wrap
`;

/**
 * Suggestion badge with type-specific styling
 */
const SuggestionBadge = styled.span<{ $type: string }>`
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 500;
  white-space: nowrap;
  background-color: ${props => getSuggestionBadgeColor(props.$type as any).background};
  color: ${props => getSuggestionBadgeColor(props.$type as any).color};
`;

/**
 * Header actions container
 */
const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
`;

/**
 * Quick action button
 */
const QuickActionButton = styled.button<{ $variant?: 'apply' | 'dismiss' | 'copy' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'apply': return '#10b981';
      case 'dismiss': return '#ef4444';
      case 'copy': return '#6b7280';
      default: return 'transparent';
    }
  }};
  border: none;
  padding: 0.25rem;
  border-radius: 4px;
  color: ${props => props.$variant ? 'white' : '#6b7280'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: ${props => props.$variant ? 1 : 0.7};

  &:hover {
    opacity: 1;
    transform: scale(1.05);
    background: ${props => {
      switch (props.$variant) {
        case 'apply': return '#059669';
        case 'dismiss': return '#dc2626';
        case 'copy': return '#4b5563';
        default: return 'rgba(107, 114, 128, 0.1)';
      }
    }};
  }

  &:active {
    transform: scale(0.95);
  }
`;

/**
 * Expandable content container
 */
const SuggestionContent = styled.div<{ 
  $isExpanded: boolean; 
  $enableAnimations: boolean;
  $maxHeight: number;
}>`
  max-height: ${props => props.$isExpanded ? `${props.$maxHeight}px` : '0'};
  overflow: hidden;
  transition: ${props => props.$enableAnimations ? 'max-height 0.3s ease-in-out, opacity 0.2s ease' : 'none'};
  opacity: ${props => props.$isExpanded ? 1 : 0};
`;

/**
 * Suggestion text content
 */
const SuggestionText = styled.div`
  padding: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #333;
  background-color: white;
  white-space: pre-line;

  @media (max-width: 640px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }
`;

/**
 * Preview container for suggestion improvements
 */
const PreviewContainer = styled.div`
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
`;

const PreviewLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const PreviewText = styled.div`
  font-size: 0.8125rem;
  color: #334155;
  line-height: 1.5;
  max-height: 100px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
`;

/**
 * Suggestion actions container
 */
const SuggestionActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid #f3f4f6;
  background-color: white;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

/**
 * Feedback section
 */
const FeedbackSection = styled.div<{ $isVisible: boolean }>`
  display: ${props => props.$isVisible ? 'flex' : 'none'};
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
`;

const FeedbackButton = styled.button<{ $isActive: boolean; $type: 'positive' | 'negative' }>`
  background: ${props => {
    if (!props.$isActive) return 'transparent';
    return props.$type === 'positive' ? '#dcfce7' : '#fee2e2';
  }};
  border: 1px solid ${props => {
    if (!props.$isActive) return '#e5e7eb';
    return props.$type === 'positive' ? '#16a34a' : '#dc2626';
  }};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: ${props => {
    if (!props.$isActive) return '#6b7280';
    return props.$type === 'positive' ? '#16a34a' : '#dc2626';
  }};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$type === 'positive' ? '#dcfce7' : '#fee2e2'};
    border-color: ${props => props.$type === 'positive' ? '#16a34a' : '#dc2626'};
    color: ${props => props.$type === 'positive' ? '#16a34a' : '#dc2626'};
  }
`;

/**
 * Status indicator for applied/dismissed suggestions
 */
const StatusIndicator = styled.div<{ $type: 'applied' | 'dismissed' }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${props => props.$type === 'applied' ? '#16a34a' : '#dc2626'};
  background: ${props => props.$type === 'applied' ? '#dcfce7' : '#fee2e2'};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
`;

/**
 * Get suggestion icon based on type
 */
const getSuggestionIcon = (type: string, size: number = 16) => {
  switch (type) {
    case 'grammar':
      return <CheckCircle size={size} />;
    case 'content':
      return <FileText size={size} />;
    case 'security':
      return <Shield size={size} />;
    case 'improvement':
      return <Lightbulb size={size} />;
    default:
      return <FileText size={size} />;
  }
};

/**
 * SuggestionItem component
 */
export const SuggestionItem: React.FC<SuggestionItemProps> = ({
  suggestion,
  index,
  isExpanded,
  isApplied,
  isDismissed,
  feedback,
  onToggle,
  onApply,
  onDismiss,
  onFeedback,
  showPreview = true,
  enableAnimations = true,
  maxPreviewLength = 200,
  className
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(300);

  // Calculate content height for smooth animations
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded, suggestion.text]);

  // Handle copy to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Handle apply suggestion
  const handleApply = () => {
    onApply(index, suggestion.improvement);
  };

  // Handle dismiss suggestion
  const handleDismiss = () => {
    onDismiss(index);
  };

  // Handle feedback
  const handleFeedback = (feedbackType: FeedbackType) => {
    onFeedback(index, feedbackType);
  };

  // Truncate text for preview
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <SuggestionContainer
      $isApplied={isApplied}
      $isDismissed={isDismissed}
      $enableAnimations={enableAnimations}
      className={className}
    >
      <SuggestionHeader
        $clickable={!isApplied && !isDismissed}
        onClick={() => !isApplied && !isDismissed && onToggle(index)}
      >
        <SuggestionTitle>
          {getSuggestionIcon(suggestion.type)}
          <span>{suggestion.title}</span>
          <SuggestionBadge $type={suggestion.type}>
            {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
          </SuggestionBadge>
          {suggestion.priority === 'high' && (
            <AlertTriangle size={14} color="#f59e0b" title="High Priority" />
          )}
        </SuggestionTitle>

        <HeaderActions>
          {/* Status indicators */}
          {isApplied && (
            <StatusIndicator $type="applied">
              <CheckCircle size={12} />
              Applied
            </StatusIndicator>
          )}
          
          {isDismissed && (
            <StatusIndicator $type="dismissed">
              <X size={12} />
              Dismissed
            </StatusIndicator>
          )}

          {/* Quick actions for active suggestions */}
          {!isApplied && !isDismissed && (
            <>
              <QuickActionButton
                $variant="copy"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(suggestion.improvement);
                }}
                title="Copy suggestion"
              >
                <Copy size={14} />
              </QuickActionButton>

              <QuickActionButton
                $variant="apply"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApply();
                }}
                title="Apply suggestion"
              >
                <ArrowRightCircle size={14} />
              </QuickActionButton>

              <QuickActionButton
                $variant="dismiss"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                title="Dismiss suggestion"
              >
                <X size={14} />
              </QuickActionButton>
            </>
          )}

          {/* Expand/collapse indicator */}
          {!isApplied && !isDismissed && (
            isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
          )}
        </HeaderActions>
      </SuggestionHeader>

      <SuggestionContent
        ref={contentRef}
        $isExpanded={isExpanded}
        $enableAnimations={enableAnimations}
        $maxHeight={contentHeight}
      >
        <SuggestionText>
          {suggestion.text}
          
          {/* Show issue if it's a grammar suggestion */}
          {suggestion.issue && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: '#dc2626' }}>
              <strong>Found:</strong> "{suggestion.issue}"
            </div>
          )}

          {/* Show preview of improvement */}
          {showPreview && suggestion.improvement && (
            <PreviewContainer>
              <PreviewLabel>Suggested Improvement:</PreviewLabel>
              <PreviewText>
                {truncateText(suggestion.improvement, maxPreviewLength * 3)}
              </PreviewText>
            </PreviewContainer>
          )}
        </SuggestionText>

        {!isApplied && !isDismissed && (
          <SuggestionActions>
            <ActionGroup>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggle(index)}
              >
                Collapse
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(suggestion.improvement)}
                disabled={isCopied}
              >
                <Copy size={14} className="mr-1" />
                {isCopied ? 'Copied!' : 'Copy Text'}
              </Button>
            </ActionGroup>

            <ActionGroup>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
              >
                Dismiss
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleApply}
              >
                <ArrowRightCircle size={14} className="mr-1" />
                Apply Suggestion
              </Button>
            </ActionGroup>
          </SuggestionActions>
        )}

        {/* Feedback section */}
        <FeedbackSection $isVisible={isApplied || isDismissed}>
          <span>Was this suggestion helpful?</span>
          
          <FeedbackButton
            $isActive={feedback === FEEDBACK_TYPES.HELPFUL}
            $type="positive"
            onClick={() => handleFeedback(FEEDBACK_TYPES.HELPFUL)}
          >
            <ThumbsUp size={12} />
            Helpful
          </FeedbackButton>
          
          <FeedbackButton
            $isActive={feedback === FEEDBACK_TYPES.NOT_HELPFUL}
            $type="negative"
            onClick={() => handleFeedback(FEEDBACK_TYPES.NOT_HELPFUL)}
          >
            <ThumbsDown size={12} />
            Not Helpful
          </FeedbackButton>
        </FeedbackSection>
      </SuggestionContent>
    </SuggestionContainer>
  );
};

/**
 * Bulk suggestion actions component
 */
export interface BulkSuggestionActionsProps {
  suggestions: Suggestion[];
  selectedIndices: number[];
  onSelectAll: () => void;
  onSelectNone: () => void;
  onBulkApply: (indices: number[]) => void;
  onBulkDismiss: (indices: number[]) => void;
  className?: string;
}

const BulkActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 1rem;
`;

const BulkActionButton = styled(Button)`
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
`;

export const BulkSuggestionActions: React.FC<BulkSuggestionActionsProps> = ({
  suggestions,
  selectedIndices,
  onSelectAll,
  onSelectNone,
  onBulkApply,
  onBulkDismiss,
  className
}) => {
  const hasSelection = selectedIndices.length > 0;
  const allSelected = selectedIndices.length === suggestions.length;

  return (
    <BulkActionsContainer className={className}>
      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        {selectedIndices.length} of {suggestions.length} suggestions selected
      </span>

      <BulkActionButton
        variant="outline"
        size="sm"
        onClick={allSelected ? onSelectNone : onSelectAll}
      >
        {allSelected ? 'Select None' : 'Select All'}
      </BulkActionButton>

      {hasSelection && (
        <>
          <BulkActionButton
            variant="outline"
            size="sm"
            onClick={() => onBulkApply(selectedIndices)}
          >
            <ArrowRightCircle size={14} className="mr-1" />
            Apply Selected ({selectedIndices.length})
          </BulkActionButton>

          <BulkActionButton
            variant="outline"
            size="sm"
            onClick={() => onBulkDismiss(selectedIndices)}
          >
            <X size={14} className="mr-1" />
            Dismiss Selected ({selectedIndices.length})
          </BulkActionButton>
        </>
      )}
    </BulkActionsContainer>
  );
};

export default SuggestionItem;
