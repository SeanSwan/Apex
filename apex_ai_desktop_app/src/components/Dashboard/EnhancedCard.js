/**
 * APEX AI DESKTOP - ENHANCED CARD COMPONENT
 * =========================================
 * Reusable card component for admin dashboard with rich data visualization
 * Features: Interactive cards, quick actions, preview data, theme support
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronRight,
  ExternalLink,
  Activity,
  BarChart3
} from 'lucide-react';

// ===========================
// STYLED COMPONENTS
// ===========================

const CardContainer = styled.div`
  background: ${props => props.theme.colors.backgroundCard};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  cursor: ${props => props.onClick ? 'pointer' : 'default'};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    ${props => props.onClick && `
      border-color: ${props.theme.colors.primary};
      box-shadow: 0 4px 12px rgba(0, 255, 136, 0.1);
      transform: translateY(-2px);
    `}
  }

  ${props => props.theme === 'primary' && `
    border-left: 4px solid ${props.theme.colors.primary};
  `}

  ${props => props.theme === 'success' && `
    border-left: 4px solid ${props.theme.colors.success};
  `}

  ${props => props.theme === 'warning' && `
    border-left: 4px solid ${props.theme.colors.warning};
  `}

  ${props => props.theme === 'error' && `
    border-left: 4px solid ${props.theme.colors.error};
  `}

  ${props => props.theme === 'info' && `
    border-left: 4px solid ${props.theme.colors.info || '#3b82f6'};
  `}

  ${props => props.theme === 'purple' && `
    border-left: 4px solid #8b5cf6;
  `}
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const CardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const TitleText = styled.h3`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.backgroundLight};
  color: ${props => props.theme.colors.textSecondary};
`;

const CardValue = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

const MainValue = styled.div`
  font-size: 2rem;
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text};
  line-height: 1.2;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const ValueChange = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.sm};
  
  ${props => props.trend === 'up' && `
    color: ${props.theme.colors.success};
  `}
  
  ${props => props.trend === 'down' && `
    color: ${props.theme.colors.error};
  `}
  
  ${props => props.trend === 'neutral' && `
    color: ${props.theme.colors.textMuted};
  `}
`;

const CardDetails = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.textSecondary};

  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }
`;

const DetailLabel = styled.span`
  color: ${props => props.theme.colors.textMuted};
`;

const DetailValue = styled.span`
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  
  ${props => props.status === 'good' && `
    color: ${props.theme.colors.success};
  `}
  
  ${props => props.status === 'warning' && `
    color: ${props.theme.colors.warning};
  `}
  
  ${props => props.status === 'error' && `
    color: ${props.theme.colors.error};
  `}
`;

const PreviewSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.backgroundLight};
  border-radius: ${props => props.theme.borderRadius.md};
`;

const PreviewTitle = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.textMuted};
  margin-bottom: ${props => props.theme.spacing.xs};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PreviewChart = styled.div`
  display: flex;
  align-items: end;
  gap: 2px;
  height: 40px;
`;

const ChartBar = styled.div`
  background: ${props => {
    if (props.theme === 'primary') return props.theme.colors.primary;
    if (props.theme === 'success') return props.theme.colors.success;
    if (props.theme === 'warning') return props.theme.colors.warning;
    if (props.theme === 'error') return props.theme.colors.error;
    if (props.theme === 'purple') return '#8b5cf6';
    return props.theme.colors.info || '#3b82f6';
  }};
  opacity: 0.7;
  flex: 1;
  border-radius: 2px;
  height: ${props => props.height}%;
  min-height: 4px;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  flex-wrap: wrap;
`;

const QuickActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.variant === 'primary' && `
    background: ${props.theme.colors.primary};
    color: white;
    &:hover {
      background: ${props.theme.colors.primaryDark};
    }
  `}

  ${props => props.variant === 'secondary' && `
    background: ${props.theme.colors.backgroundLight};
    color: ${props.theme.colors.text};
    border: 1px solid ${props.theme.colors.border};
    &:hover {
      background: ${props.theme.colors.background};
    }
  `}

  ${props => props.variant === 'success' && `
    background: ${props.theme.colors.success};
    color: white;
    &:hover {
      background: #059669;
    }
  `}

  ${props => props.variant === 'warning' && `
    background: ${props.theme.colors.warning};
    color: white;
    &:hover {
      background: #d97706;
    }
  `}

  ${props => props.variant === 'error' && `
    background: ${props.theme.colors.error};
    color: white;
    &:hover {
      background: #dc2626;
    }
  `}
`;

const ExpandedPreview = styled.div`
  margin-top: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

// ===========================
// MAIN COMPONENT
// ===========================

const EnhancedCard = ({ 
  title, 
  icon, 
  solidIcon,
  data = {}, 
  theme = 'default',
  onClick,
  onQuickAction,
  showPreview = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // ===========================
  // DATA EXTRACTION
  // ===========================

  const {
    value = 'N/A',
    change = 0,
    trend = 'neutral',
    details = [],
    previewData = null,
    quickActions = [],
    distribution = null
  } = data;

  // ===========================
  // HELPER FUNCTIONS
  // ===========================

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} />;
      case 'down': return <TrendingDown size={16} />;
      default: return <Minus size={16} />;
    }
  };

  const formatChange = (change) => {
    if (change === 0) return '0%';
    if (change > 0) return `+${change}%`;
    return `${change}%`;
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (previewData) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleQuickActionClick = (e, action) => {
    e.stopPropagation();
    if (onQuickAction) {
      onQuickAction(action);
    }
  };

  const renderPreviewChart = () => {
    if (!previewData?.chartData) return null;

    const maxValue = Math.max(...previewData.chartData.map(d => d.value));
    
    return (
      <PreviewChart>
        {previewData.chartData.map((item, index) => (
          <ChartBar
            key={index}
            height={(item.value / maxValue) * 100}
            theme={theme}
            title={`${item.date}: ${item.label || item.value}`}
          />
        ))}
      </PreviewChart>
    );
  };

  const renderDistribution = () => {
    if (!distribution) return null;

    return (
      <PreviewSection>
        <PreviewTitle>
          <BarChart3 size={12} />
          Distribution
        </PreviewTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {distribution.map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <div 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: item.color 
                }}
              />
              <span style={{ flex: 1, color: '#888' }}>{item.label}</span>
              <span style={{ fontWeight: '500' }}>{item.value}</span>
              <span style={{ color: '#888' }}>({item.percentage}%)</span>
            </div>
          ))}
        </div>
      </PreviewSection>
    );
  };

  // ===========================
  // RENDER
  // ===========================

  return (
    <CardContainer
      theme={theme}
      onClick={handleCardClick}
      className={className}
    >
      <CardHeader>
        <CardTitle>
          <IconContainer>
            {solidIcon || icon}
          </IconContainer>
          <TitleText>{title}</TitleText>
        </CardTitle>
        
        {(onClick || previewData) && (
          <ChevronRight 
            size={16} 
            style={{ 
              color: '#888', 
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }} 
          />
        )}
      </CardHeader>

      <CardValue>
        <MainValue>{value}</MainValue>
        
        {change !== 0 && (
          <ValueChange trend={trend}>
            {getTrendIcon()}
            {formatChange(change)} from last period
          </ValueChange>
        )}
      </CardValue>

      {details.length > 0 && (
        <CardDetails>
          {details.map((detail, index) => (
            <DetailItem key={index}>
              <DetailLabel>{detail.label}</DetailLabel>
              <DetailValue status={detail.status}>
                {detail.value}
              </DetailValue>
            </DetailItem>
          ))}
        </CardDetails>
      )}

      {distribution && renderDistribution()}

      {previewData && showPreview && (
        <PreviewSection>
          <PreviewTitle>
            <Activity size={12} />
            7-Day Trend
          </PreviewTitle>
          {renderPreviewChart()}
        </PreviewSection>
      )}

      {quickActions.length > 0 && (
        <QuickActions>
          {quickActions.map((action, index) => (
            <QuickActionButton
              key={index}
              variant={action.variant || 'secondary'}
              onClick={(e) => handleQuickActionClick(e, action.action)}
              title={action.label}
            >
              {action.icon}
              {action.label}
            </QuickActionButton>
          ))}
        </QuickActions>
      )}

      {isExpanded && previewData && (
        <ExpandedPreview>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Detailed View</h4>
          {renderPreviewChart()}
          {previewData.additionalInfo && (
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
              {previewData.additionalInfo}
            </div>
          )}
        </ExpandedPreview>
      )}
    </CardContainer>
  );
};

export default EnhancedCard;
