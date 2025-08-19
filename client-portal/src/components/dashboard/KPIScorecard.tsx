// client-portal/src/components/dashboard/KPIScorecard.tsx
/**
 * KPI Scorecard Component
 * =======================
 * Professional KPI metric cards for the executive dashboard
 * Displays security performance metrics with trend indicators and comparisons
 */

import React from 'react';
import { DashboardKPIs, DateRange } from '../../types/client.types';

// =================================
// INTERFACES & TYPES
// =================================

interface KPIScorecardProps {
  /** KPI data to display */
  kpis: DashboardKPIs;
  /** Current date range for context */
  dateRange: DateRange;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string;
  /** Optional custom class names */
  className?: string;
}

interface KPICardProps {
  /** Card title */
  title: string;
  /** Primary metric value */
  value: number | string;
  /** Previous period value for comparison */
  previousValue?: number;
  /** Unit or suffix for the value */
  unit?: string;
  /** Description or subtitle */
  description?: string;
  /** Icon component */
  icon: React.ReactNode;
  /** Color theme */
  theme: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** Format type for value display */
  format?: 'number' | 'percentage' | 'decimal' | 'currency';
  /** Optional loading state */
  isLoading?: boolean;
}

interface TrendIndicatorProps {
  /** Current value */
  current: number;
  /** Previous value */
  previous: number;
  /** Format type */
  format?: 'number' | 'percentage' | 'decimal';
  /** Show trend direction only */
  directionOnly?: boolean;
}

// =================================
// CONSTANTS & CONFIGURATION
// =================================

const CARD_THEMES = {
  primary: {
    icon: 'text-apex-blue-600 bg-apex-blue-50',
    border: 'border-apex-blue-200',
    accent: 'text-apex-blue-600',
    bg: 'bg-apex-blue-50'
  },
  success: {
    icon: 'text-green-600 bg-green-50',
    border: 'border-green-200', 
    accent: 'text-green-600',
    bg: 'bg-green-50'
  },
  warning: {
    icon: 'text-yellow-600 bg-yellow-50',
    border: 'border-yellow-200',
    accent: 'text-yellow-600', 
    bg: 'bg-yellow-50'
  },
  danger: {
    icon: 'text-red-600 bg-red-50',
    border: 'border-red-200',
    accent: 'text-red-600',
    bg: 'bg-red-50'
  },
  info: {
    icon: 'text-indigo-600 bg-indigo-50',
    border: 'border-indigo-200',
    accent: 'text-indigo-600',
    bg: 'bg-indigo-50'
  }
};

// =================================
// UTILITY FUNCTIONS
// =================================

/**
 * Format numeric value based on type
 */
const formatValue = (value: number | string, format: 'number' | 'percentage' | 'decimal' | 'currency' = 'number'): string => {
  if (typeof value === 'string') return value;
  
  switch (format) {
    case 'percentage':
      return `${Math.round(value * 10) / 10}%`;
    case 'decimal':
      return (Math.round(value * 100) / 100).toFixed(2);
    case 'currency':
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(value);
    case 'number':
    default:
      return value.toLocaleString();
  }
};

/**
 * Calculate percentage change between two values
 */
const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Get date range label for context
 */
const getDateRangeLabel = (dateRange: DateRange): string => {
  const labels = {
    '7': 'Last 7 days',
    '30': 'Last 30 days', 
    '90': 'Last 90 days',
    '180': 'Last 180 days',
    '365': 'Last 365 days'
  };
  return labels[dateRange];
};

// =================================
// TREND INDICATOR COMPONENT
// =================================

const TrendIndicator: React.FC<TrendIndicatorProps> = ({ 
  current, 
  previous, 
  format = 'number',
  directionOnly = false 
}) => {
  const change = calculatePercentageChange(current, previous);
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  if (isNeutral) {
    return (
      <div className="flex items-center text-gray-500">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
        <span className="text-sm font-medium">No change</span>
      </div>
    );
  }

  const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
  const bgClass = isPositive ? 'bg-green-50' : 'bg-red-50';
  const ArrowIcon = isPositive ? (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  ) : (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  );

  return (
    <div className={`flex items-center ${colorClass}`}>
      <div className={`flex items-center px-2 py-1 rounded-full ${bgClass}`}>
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {ArrowIcon}
        </svg>
        <span className="text-xs font-semibold">
          {directionOnly ? (isPositive ? 'Up' : 'Down') : `${Math.abs(change).toFixed(1)}%`}
        </span>
      </div>
    </div>
  );
};

// =================================
// KPI CARD COMPONENT
// =================================

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  previousValue,
  unit = '',
  description,
  icon,
  theme,
  format = 'number',
  isLoading = false
}) => {
  const themeConfig = CARD_THEMES[theme];
  const formattedValue = formatValue(value, format);
  const showTrend = previousValue !== undefined && typeof value === 'number';

  if (isLoading) {
    return (
      <div className="apex-card animate-pulse">
        <div className="apex-card-body p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
          <div className="w-32 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`apex-card hover:shadow-lg transition-shadow duration-200 ${themeConfig.border} border-l-4 tech-border hover-glow-teal`}>
      <div className="apex-card-body p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${themeConfig.icon}`}>
            {icon}
          </div>
          {showTrend && (
            <TrendIndicator 
              current={value as number} 
              previous={previousValue} 
              format={format}
              directionOnly={false}
            />
          )}
        </div>

        {/* Main Value */}
        <div className="mb-2">
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-gray-900">
              {formattedValue}
            </span>
            {unit && (
              <span className="text-sm font-medium text-gray-500">
                {unit}
              </span>
            )}
          </div>
        </div>

        {/* Title and Description */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-600">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// =================================
// SKELETON LOADER
// =================================

const KPISkeletonLoader: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(8)].map((_, index) => (
      <div key={index} className="apex-card animate-pulse">
        <div className="apex-card-body p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
          <div className="w-32 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

// =================================
// MAIN COMPONENT
// =================================

export const KPIScorecard: React.FC<KPIScorecardProps> = ({
  kpis,
  dateRange,
  isLoading = false,
  error,
  className = ''
}) => {
  // Error State
  if (error) {
    return (
      <div className={`apex-card border-red-200 ${className}`}>
        <div className="apex-card-body p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load KPIs</h3>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return <KPISkeletonLoader />;
  }

  // KPI Card Configuration
  const kpiCards = [
    {
      title: 'Total Incidents',
      value: kpis.totalIncidents,
      description: `Security events detected in ${getDateRangeLabel(dateRange)}`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      theme: 'primary' as const,
      format: 'number' as const
    },
    {
      title: 'Critical Threats',
      value: kpis.criticalIncidents,
      description: 'High-priority security threats requiring immediate response',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      theme: 'danger' as const,
      format: 'number' as const
    },
    {
      title: 'High Priority',
      value: kpis.highIncidents,
      description: 'Important security events requiring attention',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      theme: 'warning' as const,
      format: 'number' as const
    },
    {
      title: 'Resolved Cases',
      value: kpis.resolvedIncidents,
      description: 'Successfully resolved security incidents',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      theme: 'success' as const,
      format: 'number' as const
    },
    {
      title: 'Resolution Rate',
      value: kpis.resolutionRate,
      description: 'Percentage of incidents successfully resolved',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      theme: 'success' as const,
      format: 'percentage' as const
    },
    {
      title: 'AI Confidence',
      value: kpis.avgAiConfidence,
      description: 'Average confidence level of AI threat detection',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      theme: 'info' as const,
      format: 'percentage' as const
    },
    {
      title: 'Active Properties',
      value: kpis.activeProperties,
      unit: `of ${kpis.totalProperties}`,
      description: 'Properties currently under APEX AI protection',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      theme: 'primary' as const,
      format: 'number' as const
    },
    {
      title: 'Protection Coverage',
      value: (kpis.activeProperties / kpis.totalProperties) * 100,
      description: 'Percentage of properties with active monitoring',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      theme: 'success' as const,
      format: 'percentage' as const
    }
  ];

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2 text-glow-teal">
          Security Performance Overview
        </h2>
        <p className="text-sm text-gray-600 text-glow-cyan">
          Key performance indicators for {getDateRangeLabel(dateRange).toLowerCase()}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <KPICard
            key={index}
            title={card.title}
            value={card.value}
            unit={card.unit}
            description={card.description}
            icon={card.icon}
            theme={card.theme}
            format={card.format}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
};

export default KPIScorecard;