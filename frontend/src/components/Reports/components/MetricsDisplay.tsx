/**
 * Metrics Display Component - Security Metrics Grid and Cards
 * Extracted from EnhancedPreviewPanel for better modularity
 * Production-ready component for metrics visualization
 */

import React from 'react';
import styled from 'styled-components';
import { 
  getRandomTexturePosition, 
  getRandomOpacity,
  getRandomTextureSize,
  MARBLE_TEXTURE_CONFIG,
  RESPONSIVE_BREAKPOINTS,
  GRID_CONFIG,
  COMPONENT_CONFIG
} from '../constants/previewPanelConstants';
import { MetricsData } from '../../../types/reports';
import marbleTexture from '../../../assets/marble-texture.png';

/**
 * Metrics Display Props Interface
 */
export interface MetricsDisplayProps {
  metrics: MetricsData;
  accentColor?: string;
  className?: string;
  showPropertyInfo?: boolean;
  isCompact?: boolean;
  gridColumns?: number;
  showAnimations?: boolean;
  onMetricClick?: (metricKey: string, value: number) => void;
}

/**
 * Property Info Props Interface
 */
export interface PropertyInfoProps {
  siteName?: string;
  location?: string;
  camerasOnline?: number;
  totalCameras?: number;
  cameraType?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  accentColor?: string;
  isCompact?: boolean;
}

/**
 * Individual Metric Props Interface
 */
export interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  accentColor?: string;
  isClickable?: boolean;
  onClick?: () => void;
  icon?: string;
  trend?: 'up' | 'down' | 'stable';
  isCompact?: boolean;
}

/**
 * Styled Components
 */
const MetricsSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionHeader = styled.h2<{ $accentColor?: string }>`
  color: ${props => props.$accentColor || '#e5c76b'};
  margin-bottom: 1.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${props => props.$accentColor || '#e5c76b'};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '📊';
    font-size: 1.125rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    font-size: 1.25rem;
  }
`;

const PropertyInfoGrid = styled.div<{ $isCompact?: boolean }>`
  display: grid;
  grid-template-columns: ${GRID_CONFIG.PROPERTY_INFO.COLUMNS.DESKTOP};
  gap: ${GRID_CONFIG.PROPERTY_INFO.GAP};
  margin-bottom: ${props => props.$isCompact ? '1.5rem' : '2rem'};

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.DESKTOP}px) {
    grid-template-columns: ${GRID_CONFIG.PROPERTY_INFO.COLUMNS.TABLET};
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    grid-template-columns: ${GRID_CONFIG.PROPERTY_INFO.COLUMNS.MOBILE};
  }
`;

const PropertyInfoCard = styled.div<{ $isCompact?: boolean }>`
  background-color: transparent;
  border-radius: 8px;
  padding: ${props => props.$isCompact ? '1rem' : '1.25rem'};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  height: 100%;
  background-image: url(${marbleTexture});
  background-size: ${getRandomTextureSize()};
  background-position: ${getRandomTexturePosition()};
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }

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
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  color: #9e9e9e;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  font-weight: 500;
`;

const InfoValue = styled.div`
  font-weight: 700;
  font-size: 1.75rem;
  color: #e5c76b;
  line-height: 1.2;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    font-size: 1.5rem;
  }
`;

const InfoDetail = styled.div`
  font-size: 0.75rem;
  color: #9e9e9e;
  margin-top: 0.25rem;
  line-height: 1.3;
`;

const MetricsGrid = styled.div<{ $gridColumns?: number; $isCompact?: boolean }>`
  display: grid;
  grid-template-columns: ${props => {
    if (props.$gridColumns) return `repeat(${props.$gridColumns}, 1fr)`;
    return GRID_CONFIG.METRICS.COLUMNS.DESKTOP;
  }};
  gap: ${props => props.$isCompact ? GRID_CONFIG.METRICS.GAP.MOBILE : GRID_CONFIG.METRICS.GAP.DESKTOP};
  margin-bottom: ${props => props.$isCompact ? '1.5rem' : '2rem'};

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.DESKTOP}px) {
    grid-template-columns: ${GRID_CONFIG.METRICS.COLUMNS.TABLET};
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    grid-template-columns: ${GRID_CONFIG.METRICS.COLUMNS.MOBILE};
    gap: ${GRID_CONFIG.METRICS.GAP.MOBILE};
  }
`;

const MetricCard = styled.div<{ 
  $accentColor?: string; 
  $isClickable?: boolean;
  $isCompact?: boolean;
  $trend?: 'up' | 'down' | 'stable';
}>`
  padding: ${props => props.$isCompact ? COMPONENT_CONFIG.METRICS_CARD.PADDING.MOBILE : COMPONENT_CONFIG.METRICS_CARD.PADDING.DESKTOP};
  border-radius: 8px;
  background-color: transparent;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  height: ${COMPONENT_CONFIG.METRICS_CARD.HEIGHT};
  background-image: url(${marbleTexture});
  background-size: ${getRandomTextureSize()};
  background-position: ${getRandomTexturePosition()};
  position: relative;
  cursor: ${props => props.$isClickable ? 'pointer' : 'default'};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: ${props => props.$isClickable ? 'translateY(-2px)' : 'none'};
    box-shadow: ${props => props.$isClickable ? '0 6px 12px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.2)'};
  }

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

  ${props => props.$trend && `
    &::after {
      content: '${props.$trend === 'up' ? '📈' : props.$trend === 'down' ? '📉' : '➡️'}';
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      z-index: 2;
      font-size: 0.875rem;
      opacity: 0.7;
    }
  `}

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    padding: ${COMPONENT_CONFIG.METRICS_CARD.PADDING.MOBILE};
  }
`;

const MetricValue = styled.div<{ $isCompact?: boolean }>`
  font-size: ${props => props.$isCompact ? '1.5rem' : '2rem'};
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #e5c76b;
  display: flex;
  align-items: baseline;
  gap: 0.25rem;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    font-size: ${props => props.$isCompact ? '1.25rem' : '1.5rem'};
  }
`;

const MetricUnit = styled.span<{ $isCompact?: boolean }>`
  font-size: ${props => props.$isCompact ? '1rem' : '1.25rem'};
  font-weight: 500;
  color: #ccc;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    font-size: ${props => props.$isCompact ? '0.875rem' : '1rem'};
  }
`;

const MetricLabel = styled.div<{ $isCompact?: boolean }>`
  font-size: ${props => props.$isCompact ? '0.75rem' : '0.875rem'};
  color: #ccc;
  text-align: center;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    font-size: ${props => props.$isCompact ? '0.7rem' : '0.75rem'};
  }
`;

const MetricIcon = styled.span`
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
  display: block;
  text-align: center;
`;

/**
 * Property Information Component
 */
export const PropertyInfo: React.FC<PropertyInfoProps> = ({
  siteName,
  location,
  camerasOnline = 0,
  totalCameras = 0,
  cameraType,
  city,
  state,
  zipCode,
  accentColor = '#e5c76b',
  isCompact = false
}) => {
  const propertyInfoItems = [
    { label: 'Site Name', value: siteName || 'N/A' },
    { label: 'Location', value: location || 'N/A' },
    { 
      label: 'Camera Coverage', 
      value: `${camerasOnline} / ${totalCameras}`,
      detail: `${totalCameras > 0 ? Math.round((camerasOnline / totalCameras) * 100) : 0}% operational`
    },
    { label: 'Camera Type', value: cameraType || 'Standard IP' },
    { label: 'City', value: city || 'N/A' },
    { 
      label: 'State/Zip', 
      value: `${state || 'N/A'} ${zipCode || ''}`.trim()
    }
  ];

  return (
    <>
      <SectionHeader $accentColor={accentColor}>
        Property & Site Information
      </SectionHeader>
      <PropertyInfoGrid $isCompact={isCompact}>
        {propertyInfoItems.map((item, index) => (
          <PropertyInfoCard key={index} $isCompact={isCompact}>
            <InfoLabel>{item.label}</InfoLabel>
            <InfoValue>{item.value}</InfoValue>
            {item.detail && <InfoDetail>{item.detail}</InfoDetail>}
          </PropertyInfoCard>
        ))}
      </PropertyInfoGrid>
    </>
  );
};

/**
 * Individual Metric Card Component
 */
export const MetricCardComponent: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  accentColor = '#e5c76b',
  isClickable = false,
  onClick,
  icon,
  trend,
  isCompact = false
}) => {
  const handleClick = () => {
    if (isClickable && onClick) {
      onClick();
    }
  };

  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      // Format large numbers with commas
      if (val >= 1000) {
        return val.toLocaleString();
      }
      // Handle decimal places for percentages and small numbers
      if (val % 1 !== 0) {
        return val.toFixed(1);
      }
    }
    return val.toString();
  };

  return (
    <MetricCard
      $accentColor={accentColor}
      $isClickable={isClickable}
      $isCompact={isCompact}
      $trend={trend}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      {icon && <MetricIcon>{icon}</MetricIcon>}
      <MetricValue $isCompact={isCompact}>
        {formatValue(value)}
        {unit && <MetricUnit $isCompact={isCompact}>{unit}</MetricUnit>}
      </MetricValue>
      <MetricLabel $isCompact={isCompact}>{label}</MetricLabel>
    </MetricCard>
  );
};

/**
 * Main Metrics Display Component
 */
export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  metrics,
  accentColor = '#e5c76b',
  className,
  showPropertyInfo = false,
  isCompact = false,
  gridColumns,
  showAnimations = true,
  onMetricClick
}) => {
  // Calculate totals from metrics
  const totalHumanIntrusions = React.useMemo(() => {
    return Object.values(metrics.humanIntrusions || {})
      .reduce((sum: number, value: number) => sum + value, 0);
  }, [metrics.humanIntrusions]);

  const totalVehicleIntrusions = React.useMemo(() => {
    return Object.values(metrics.vehicleIntrusions || {})
      .reduce((sum: number, value: number) => sum + value, 0);
  }, [metrics.vehicleIntrusions]);

  // Define metrics configuration
  const metricsConfig = [
    {
      key: 'humanIntrusions',
      label: 'Human Activities',
      value: totalHumanIntrusions,
      icon: '🚶',
      trend: totalHumanIntrusions > 5 ? 'up' : totalHumanIntrusions === 0 ? 'stable' : 'down'
    },
    {
      key: 'vehicleIntrusions',
      label: 'Vehicle Activities',
      value: totalVehicleIntrusions,
      icon: '🚗',
      trend: totalVehicleIntrusions > 3 ? 'up' : totalVehicleIntrusions === 0 ? 'stable' : 'down'
    },
    {
      key: 'potentialThreats',
      label: 'Security Alerts',
      value: metrics.potentialThreats ?? 0,
      icon: '⚠️',
      trend: (metrics.potentialThreats ?? 0) > 0 ? 'up' : 'stable'
    },
    {
      key: 'proactiveAlerts',
      label: 'Proactive Responses',
      value: metrics.proactiveAlerts ?? 0,
      icon: '🛡️',
      trend: (metrics.proactiveAlerts ?? 0) > 0 ? 'up' : 'stable'
    },
    {
      key: 'aiAccuracy',
      label: 'AI Accuracy',
      value: (metrics.aiAccuracy ?? 0),
      unit: '%',
      icon: '🎯',
      trend: (metrics.aiAccuracy ?? 0) >= 95 ? 'up' : (metrics.aiAccuracy ?? 0) >= 85 ? 'stable' : 'down'
    },
    {
      key: 'responseTime',
      label: 'Response Time',
      value: (metrics.responseTime ?? 0),
      unit: 'sec',
      icon: '⚡',
      trend: (metrics.responseTime ?? 0) <= 2 ? 'up' : (metrics.responseTime ?? 0) <= 5 ? 'stable' : 'down'
    },
    {
      key: 'totalMonitoringHours',
      label: 'Monitor Hours',
      value: metrics.totalMonitoringHours ?? 0,
      icon: '⏰',
      trend: 'stable'
    },
    {
      key: 'operationalUptime',
      label: 'System Uptime',
      value: (metrics.operationalUptime ?? 0),
      unit: '%',
      icon: '📡',
      trend: (metrics.operationalUptime ?? 0) >= 99 ? 'up' : (metrics.operationalUptime ?? 0) >= 95 ? 'stable' : 'down'
    }
  ] as const;

  const handleMetricClick = (metricKey: string, value: number) => {
    onMetricClick?.(metricKey, value);
  };

  return (
    <MetricsSection className={className}>
      <SectionHeader $accentColor={accentColor}>
        AI-Driven Security Analytics
      </SectionHeader>
      
      <MetricsGrid $gridColumns={gridColumns} $isCompact={isCompact}>
        {metricsConfig.map((metric) => (
          <MetricCardComponent
            key={metric.key}
            label={metric.label}
            value={metric.value}
            unit={metric.unit}
            accentColor={accentColor}
            isClickable={!!onMetricClick}
            onClick={() => handleMetricClick(metric.key, metric.value)}
            icon={metric.icon}
            trend={showAnimations ? metric.trend as any : undefined}
            isCompact={isCompact}
          />
        ))}
      </MetricsGrid>
    </MetricsSection>
  );
};

/**
 * Compact Metrics Display
 */
export const CompactMetricsDisplay: React.FC<Omit<MetricsDisplayProps, 'isCompact'>> = (props) => (
  <MetricsDisplay {...props} isCompact={true} />
);

/**
 * Metrics Summary Component (simplified version)
 */
export interface MetricsSummaryProps {
  metrics: MetricsData;
  accentColor?: string;
  showTotals?: boolean;
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({
  metrics,
  accentColor = '#e5c76b',
  showTotals = true
}) => {
  const totalHuman = Object.values(metrics.humanIntrusions || {})
    .reduce((sum: number, value: number) => sum + value, 0);
  
  const totalVehicle = Object.values(metrics.vehicleIntrusions || {})
    .reduce((sum: number, value: number) => sum + value, 0);

  const totalActivity = totalHuman + totalVehicle;

  if (!showTotals) return null;

  return (
    <MetricsGrid $gridColumns={3} $isCompact={true}>
      <MetricCardComponent
        label="Total Activity"
        value={totalActivity}
        accentColor={accentColor}
        icon="📊"
        isCompact={true}
      />
      <MetricCardComponent
        label="Threat Level"
        value={metrics.potentialThreats ?? 0}
        accentColor={accentColor}
        icon="🚨"
        isCompact={true}
      />
      <MetricCardComponent
        label="System Health"
        value={metrics.operationalUptime ?? 0}
        unit="%"
        accentColor={accentColor}
        icon="💚"
        isCompact={true}
      />
    </MetricsGrid>
  );
};

// Default export
export default MetricsDisplay;

// Export all components and types - Components are exported individually where defined

export type {
  MetricsDisplayProps,
  PropertyInfoProps,
  MetricCardProps,
  MetricsSummaryProps
};
