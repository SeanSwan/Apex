/**
 * Executive Summary Component - Professional Executive Summary Display
 * Extracted from EnhancedPreviewPanel for better modularity
 * Production-ready component for executive summary rendering
 */

import React from 'react';
import styled from 'styled-components';
import { 
  getRandomTexturePosition, 
  getRandomOpacity,
  MARBLE_TEXTURE_CONFIG,
  RESPONSIVE_BREAKPOINTS 
} from '../constants/previewPanelConstants';
import marbleTexture from '../../../assets/marble-texture.png';

/**
 * Executive Summary Props Interface
 */
export interface ExecutiveSummaryProps {
  summary: string;
  accentColor?: string;
  className?: string;
  showBorder?: boolean;
  isCompact?: boolean;
}

/**
 * Styled Components
 */
const ExecutiveSummaryContainer = styled.div<{ 
  $accentColor?: string; 
  $showBorder?: boolean;
  $isCompact?: boolean;
}>`
  margin-bottom: ${props => props.$isCompact ? '1rem' : '2rem'};
  padding: ${props => props.$isCompact ? '1rem' : '1.5rem'};
  background-color: transparent;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  background-image: url(${marbleTexture});
  background-size: ${MARBLE_TEXTURE_CONFIG.BASE_SIZE + MARBLE_TEXTURE_CONFIG.SIZE_VARIATION}%;
  background-position: ${getRandomTexturePosition()};
  position: relative;
  border-left: ${props => props.$showBorder ? `4px solid ${props.$accentColor || '#e5c76b'}` : 'none'};

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, ${getRandomOpacity()});
    z-index: 0;
    border-radius: 8px;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    padding: ${props => props.$isCompact ? '0.75rem' : '1rem'};
    margin-bottom: ${props => props.$isCompact ? '0.75rem' : '1.5rem'};
  }
`;

const SummaryTitle = styled.h3<{ $accentColor?: string; $isCompact?: boolean }>`
  color: ${props => props.$accentColor || '#e5c76b'};
  margin-bottom: ${props => props.$isCompact ? '0.75rem' : '1rem'};
  font-size: ${props => props.$isCompact ? '1rem' : '1.125rem'};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '📊';
    font-size: ${props => props.$isCompact ? '0.875rem' : '1rem'};
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    font-size: ${props => props.$isCompact ? '0.9rem' : '1rem'};
  }
`;

const SummaryContent = styled.div<{ $isCompact?: boolean }>`
  line-height: 1.6;
  color: #e0e0e0;
  font-size: ${props => props.$isCompact ? '0.875rem' : '0.95rem'};

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    font-size: ${props => props.$isCompact ? '0.825rem' : '0.875rem'};
    line-height: 1.5;
  }
`;

const SummaryParagraph = styled.p<{ $isCompact?: boolean }>`
  margin-bottom: ${props => props.$isCompact ? '0.5rem' : '0.75rem'};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const HighlightMetric = styled.span`
  color: #e5c76b;
  font-weight: 600;
`;

const KeyInsight = styled.div<{ $accentColor?: string }>`
  background: rgba(229, 199, 107, 0.1);
  border-left: 3px solid ${props => props.$accentColor || '#e5c76b'};
  padding: 0.75rem;
  margin: 1rem 0;
  border-radius: 0 4px 4px 0;
  font-style: italic;
  color: #f0f0f0;
  font-size: 0.9rem;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    padding: 0.5rem;
    margin: 0.75rem 0;
    font-size: 0.85rem;
  }
`;

/**
 * Executive Summary Component
 */
export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  summary,
  accentColor = '#e5c76b',
  className,
  showBorder = true,
  isCompact = false
}) => {
  // Process summary text to identify key insights and metrics
  const processedSummary = React.useMemo(() => {
    if (!summary) return [];

    // Split summary into sentences
    const sentences = summary.split('. ').map(sentence => {
      // Add period back if it doesn't end with one
      return sentence.endsWith('.') ? sentence : sentence + '.';
    });

    return sentences.map((sentence, index) => {
      // Identify and highlight metrics (numbers followed by units or percentages)
      const highlightedSentence = sentence.replace(
        /(\d+(?:\.\d+)?)\s*(%|seconds?|sec|hours?|hrs?|minutes?|min|cameras?|alerts?|incidents?|activities?|events?)/gi,
        '<highlight>$1$2</highlight>'
      );

      // Check if this sentence contains key insights
      const isKeyInsight = /accuracy|performance|uptime|response time|detection|monitoring|continuous|24\/7|coverage/i.test(sentence);

      return {
        text: highlightedSentence,
        isKeyInsight,
        index
      };
    });
  }, [summary]);

  // Extract key insights
  const keyInsights = processedSummary.filter(item => item.isKeyInsight);
  const regularContent = processedSummary.filter(item => !item.isKeyInsight);

  if (!summary || summary.trim().length === 0) {
    return (
      <ExecutiveSummaryContainer 
        $accentColor={accentColor}
        $showBorder={showBorder}
        $isCompact={isCompact}
        className={className}
      >
        <SummaryTitle $accentColor={accentColor} $isCompact={isCompact}>
          Executive Summary
        </SummaryTitle>
        <SummaryContent $isCompact={isCompact}>
          <SummaryParagraph $isCompact={isCompact}>
            Executive summary will be generated automatically based on security metrics and daily reports.
          </SummaryParagraph>
        </SummaryContent>
      </ExecutiveSummaryContainer>
    );
  }

  return (
    <ExecutiveSummaryContainer 
      $accentColor={accentColor}
      $showBorder={showBorder}
      $isCompact={isCompact}
      className={className}
    >
      <SummaryTitle $accentColor={accentColor} $isCompact={isCompact}>
        Executive Summary
      </SummaryTitle>
      
      <SummaryContent $isCompact={isCompact}>
        {regularContent.map((item, index) => (
          <SummaryParagraph key={index} $isCompact={isCompact}>
            <span 
              dangerouslySetInnerHTML={{
                __html: item.text.replace(
                  /<highlight>(.*?)<\/highlight>/g,
                  `<span style="color: ${accentColor}; font-weight: 600;">$1</span>`
                )
              }}
            />
          </SummaryParagraph>
        ))}
        
        {keyInsights.length > 0 && (
          <>
            {keyInsights.map((insight, index) => (
              <KeyInsight key={`insight-${index}`} $accentColor={accentColor}>
                <span 
                  dangerouslySetInnerHTML={{
                    __html: insight.text.replace(
                      /<highlight>(.*?)<\/highlight>/g,
                      `<span style="color: ${accentColor}; font-weight: 700;">$1</span>`
                    )
                  }}
                />
              </KeyInsight>
            ))}
          </>
        )}
      </SummaryContent>
    </ExecutiveSummaryContainer>
  );
};

/**
 * Compact Executive Summary Variant
 */
export const CompactExecutiveSummary: React.FC<Omit<ExecutiveSummaryProps, 'isCompact'>> = (props) => (
  <ExecutiveSummary {...props} isCompact={true} />
);

/**
 * Executive Summary with Custom Styling
 */
export interface CustomExecutiveSummaryProps extends ExecutiveSummaryProps {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  fontSize?: string;
}

export const CustomExecutiveSummary: React.FC<CustomExecutiveSummaryProps> = ({
  backgroundColor,
  textColor,
  borderColor,
  fontSize,
  ...props
}) => {
  const StyledContainer = styled(ExecutiveSummaryContainer)`
    ${backgroundColor && `background-color: ${backgroundColor} !important;`}
    ${textColor && `color: ${textColor} !important;`}
    ${borderColor && `border-left-color: ${borderColor} !important;`}
    ${fontSize && `font-size: ${fontSize} !important;`}
  `;

  return (
    <StyledContainer 
      as={ExecutiveSummaryContainer}
      $accentColor={props.accentColor}
      $showBorder={props.showBorder}
      $isCompact={props.isCompact}
      className={props.className}
    >
      <SummaryTitle $accentColor={props.accentColor} $isCompact={props.isCompact}>
        Executive Summary
      </SummaryTitle>
      
      <SummaryContent $isCompact={props.isCompact}>
        <SummaryParagraph $isCompact={props.isCompact}>
          {props.summary}
        </SummaryParagraph>
      </SummaryContent>
    </StyledContainer>
  );
};

/**
 * Executive Summary with Analytics
 */
export interface AnalyticsExecutiveSummaryProps extends ExecutiveSummaryProps {
  onView?: () => void;
  onInteraction?: (type: 'expand' | 'collapse' | 'highlight_click') => void;
  trackingId?: string;
}

export const AnalyticsExecutiveSummary: React.FC<AnalyticsExecutiveSummaryProps> = ({
  onView,
  onInteraction,
  trackingId,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Track when component comes into view
  React.useEffect(() => {
    if (!onView || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onView();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [onView]);

  const handleToggleExpand = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onInteraction?.(newState ? 'expand' : 'collapse');
  };

  return (
    <div ref={containerRef} data-tracking-id={trackingId}>
      <ExecutiveSummary 
        {...props}
        summary={isExpanded ? props.summary : (props.summary.slice(0, 200) + '...')}
      />
      {props.summary.length > 200 && (
        <button 
          onClick={handleToggleExpand}
          style={{
            background: 'none',
            border: 'none',
            color: props.accentColor || '#e5c76b',
            cursor: 'pointer',
            fontSize: '0.875rem',
            marginTop: '0.5rem',
            textDecoration: 'underline'
          }}
        >
          {isExpanded ? 'Show Less' : 'Read More'}
        </button>
      )}
    </div>
  );
};

// Default export
export default ExecutiveSummary;

// Export types
export type {
  ExecutiveSummaryProps,
  CustomExecutiveSummaryProps,
  AnalyticsExecutiveSummaryProps
};
