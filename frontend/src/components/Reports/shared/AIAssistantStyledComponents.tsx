/**
 * AI Assistant Styled Components - UI Components for AI Assistant
 * Extracted from AIReportAssistant for better modularity
 * Production-ready styled components with responsive design and accessibility
 */

import styled, { css } from 'styled-components';
import {
  aiAnimations,
  AI_RESPONSIVE_BREAKPOINTS,
  AI_TIMING_CONSTANTS
} from '../constants/aiAssistantConstants';

/**
 * Main assistant container with expansion state
 */
export const AssistantContainer = styled.div<{ $expanded: boolean }>`
  border: 1px solid ${props => props.$expanded ? '#7c3aed' : '#e0e0e0'};
  border-radius: 8px;
  overflow: hidden;
  background-color: ${props => props.$expanded ? '#f9f5ff' : '#f9fafb'};
  transition: all 0.3s ease;
  box-shadow: ${props => props.$expanded 
    ? '0 4px 16px rgba(124, 58, 237, 0.15)' 
    : '0 2px 8px rgba(0, 0, 0, 0.05)'
  };
  animation: ${aiAnimations.fadeIn} 0.3s ease-out;

  &:hover {
    border-color: ${props => props.$expanded ? '#7c3aed' : '#0070f3'};
    box-shadow: ${props => props.$expanded 
      ? '0 6px 20px rgba(124, 58, 237, 0.2)' 
      : '0 4px 12px rgba(0, 112, 243, 0.1)'
    };
  }

  &:focus-within {
    outline: 2px solid #7c3aed;
    outline-offset: 2px;
  }

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    border-radius: 6px;
    margin: 0 0.5rem;
  }
`;

/**
 * Assistant header with branding and controls
 */
export const AssistantHeader = styled.div<{ $color?: string }>`
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  background: ${props => props.$color ? css`
    linear-gradient(135deg, ${props.$color}, ${props.$color}dd)
  ` : css`
    linear-gradient(135deg, #7c3aed, #6366f1)
  `};
  color: white;
  cursor: pointer;
  transition: background 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover::before {
    left: 100%;
  }

  &:hover {
    background: ${props => props.$color ? css`
      linear-gradient(135deg, ${props.$color}ee, ${props.$color}cc)
    ` : css`
      linear-gradient(135deg, #8b5cf6, #7c3aed)
    `};
  }

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.5rem 0.75rem;
  }
`;

/**
 * Header title with icon and text
 */
export const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  z-index: 1;
  position: relative;

  svg {
    flex-shrink: 0;
  }

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 0.875rem;
    gap: 0.375rem;
  }
`;

/**
 * Header actions container
 */
export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 1;
  position: relative;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    gap: 0.375rem;
  }
`;

/**
 * Icon button for header actions
 */
export const IconButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'danger': return 'rgba(239, 68, 68, 0.2)';
      case 'secondary': return 'rgba(255, 255, 255, 0.1)';
      default: return 'rgba(255, 255, 255, 0.15)';
    }
  }};
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.375rem;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);

  &:hover {
    background: ${props => {
      switch (props.$variant) {
        case 'danger': return 'rgba(239, 68, 68, 0.3)';
        case 'secondary': return 'rgba(255, 255, 255, 0.2)';
        default: return 'rgba(255, 255, 255, 0.25)';
      }
    }};
    transform: scale(1.05);
    border-color: rgba(255, 255, 255, 0.3);
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
  }

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.25rem;
  }
`;

/**
 * Expandable content container
 */
export const AssistantContent = styled.div<{ 
  $expanded: boolean; 
  $maxHeight?: number;
}>`
  max-height: ${props => props.$expanded ? `${props.$maxHeight || 800}px` : '0'};
  overflow: hidden;
  transition: max-height ${AI_TIMING_CONSTANTS.animationDuration}ms ease-in-out;
  background-color: white;
`;

/**
 * Content section wrapper
 */
export const ContentSection = styled.div<{ $padding?: string }>`
  padding: ${props => props.$padding || '1rem'};

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: ${props => props.$padding || '0.75rem'};
  }
`;

/**
 * Loading/processing container
 */
export const ProcessingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  color: #6b7280;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 2rem 1.5rem;
  }
`;

/**
 * Animated spinner icon
 */
export const SpinnerIcon = styled.div<{ $size?: number }>`
  width: ${props => props.$size || 32}px;
  height: ${props => props.$size || 32}px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #7c3aed;
  border-radius: 50%;
  animation: ${aiAnimations.spin} 1s linear infinite;
  margin-bottom: 1rem;
`;

/**
 * Processing status text
 */
export const ProcessingText = styled.div<{ $size?: 'sm' | 'md' | 'lg' }>`
  font-size: ${props => {
    switch (props.$size) {
      case 'sm': return '0.875rem';
      case 'lg': return '1.125rem';
      default: return '1rem';
    }
  }};
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
    font-weight: 400;
    color: #6b7280;
    font-size: 0.875rem;
  }
`;

/**
 * Suggestions list container
 */
export const SuggestionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
`;

/**
 * No suggestions container
 */
export const NoSuggestionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 2rem;
  color: #6b7280;
  text-align: center;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 8px;
  margin: 1rem 0;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 2rem 1.5rem;
    margin: 0.75rem 0;
  }
`;

/**
 * Success icon container
 */
export const SuccessIcon = styled.div<{ $color?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.$color || '#10b981'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 1rem;
  animation: ${aiAnimations.pulse} 2s infinite;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    width: 40px;
    height: 40px;
  }
`;

/**
 * Status message text
 */
export const StatusMessage = styled.div<{ $variant?: 'success' | 'warning' | 'info' }>`
  font-weight: 500;
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
  color: ${props => {
    switch (props.$variant) {
      case 'success': return '#16a34a';
      case 'warning': return '#d97706';
      case 'info': return '#2563eb';
      default: return '#374151';
    }
  }};

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 1rem;
  }
`;

/**
 * Status description text
 */
export const StatusDescription = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
  line-height: 1.5;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 0.8125rem;
    margin-bottom: 1rem;
  }
`;

/**
 * Tips section container
 */
export const TipsSection = styled.div`
  margin-top: 1.5rem;
  text-align: left;
  width: 100%;
  max-width: 600px;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    margin-top: 1rem;
  }
`;

/**
 * Tips header
 */
export const TipsHeader = styled.div`
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: #374151;
  font-size: 0.9375rem;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }
`;

/**
 * Multi-column layout for tips
 */
export const MultiColumnLayout = styled.div<{ $columns?: number }>`
  columns: ${props => props.$columns || 2};
  column-gap: 2rem;
  column-fill: balance;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.tablet}) {
    columns: 1;
    column-gap: 0;
  }
`;

/**
 * Individual tip container
 */
export const TipContainer = styled.div`
  margin-bottom: 1rem;
  break-inside: avoid;
  page-break-inside: avoid;
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;

  &:hover {
    border-color: #7c3aed;
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.1);
  }

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }
`;

/**
 * Tip title
 */
export const TipTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  color: #374151;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 0.875rem;
    margin-bottom: 0.375rem;
  }
`;

/**
 * Tip content
 */
export const TipContent = styled.div`
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.5;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 0.8125rem;
  }
`;

/**
 * Feedback container
 */
export const FeedbackContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-top: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-size: 0.8125rem;
  color: #6b7280;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

/**
 * Feedback text
 */
export const FeedbackText = styled.div`
  font-weight: 500;
  color: #374151;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 0.75rem;
  }
`;

/**
 * Feedback actions container
 */
export const FeedbackActions = styled.div`
  display: flex;
  gap: 0.75rem;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    width: 100%;
    justify-content: space-between;
    gap: 0.5rem;
  }
`;

/**
 * Feedback button
 */
export const FeedbackButton = styled.button<{ 
  $active?: boolean; 
  $variant?: 'positive' | 'negative';
}>`
  background: ${props => {
    if (props.$active) {
      return props.$variant === 'positive' ? '#dcfce7' : '#fee2e2';
    }
    return 'transparent';
  }};
  border: 1px solid ${props => {
    if (props.$active) {
      return props.$variant === 'positive' ? '#16a34a' : '#dc2626';
    }
    return '#e5e7eb';
  }};
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: ${props => {
    if (props.$active) {
      return props.$variant === 'positive' ? '#16a34a' : '#dc2626';
    }
    return '#6b7280';
  }};
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;

  &:hover {
    background: ${props => {
      if (props.$variant === 'positive') return '#dcfce7';
      if (props.$variant === 'negative') return '#fee2e2';
      return '#f3f4f6';
    }};
    border-color: ${props => {
      if (props.$variant === 'positive') return '#16a34a';
      if (props.$variant === 'negative') return '#dc2626';
      return '#9ca3af';
    }};
    color: ${props => {
      if (props.$variant === 'positive') return '#16a34a';
      if (props.$variant === 'negative') return '#dc2626';
      return '#4b5563';
    }};
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
`;

/**
 * Analytics section (for debugging/admin)
 */
export const AnalyticsSection = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: #6b7280;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 0.75rem;
    padding: 0.75rem;
  }
`;

/**
 * Analytics title
 */
export const AnalyticsTitle = styled.div`
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

/**
 * Analytics grid
 */
export const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
`;

/**
 * Analytics metric
 */
export const AnalyticsMetric = styled.div`
  text-align: center;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
`;

/**
 * Analytics value
 */
export const AnalyticsValue = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #7c3aed;
  margin-bottom: 0.25rem;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 1rem;
  }
`;

/**
 * Analytics label
 */
export const AnalyticsLabel = styled.div`
  font-size: 0.6875rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  @media (max-width: ${AI_RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 0.625rem;
  }
`;

/**
 * Accessibility improvements
 */
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

/**
 * Focus trap for modal-like behavior
 */
export const FocusTrap = styled.div`
  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid #7c3aed;
    outline-offset: 2px;
  }
`;

/**
 * Scroll container with custom scrollbar
 */
export const ScrollContainer = styled.div<{ $maxHeight?: string }>`
  max-height: ${props => props.$maxHeight || '400px'};
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
    
    &:hover {
      background: #94a3b8;
    }
  }
`;

export default {
  AssistantContainer,
  AssistantHeader,
  HeaderTitle,
  HeaderActions,
  IconButton,
  AssistantContent,
  ContentSection,
  ProcessingContainer,
  SpinnerIcon,
  ProcessingText,
  SuggestionsList,
  NoSuggestionsContainer,
  SuccessIcon,
  StatusMessage,
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
  VisuallyHidden,
  FocusTrap,
  ScrollContainer
};
