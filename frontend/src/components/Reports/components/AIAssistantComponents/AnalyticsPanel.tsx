/**
 * AnalyticsPanel Component - New component for AI Assistant analytics
 * Displays detailed analytics and performance metrics
 */

import React from 'react';
import { BarChart, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import {
  AnalyticsSection,
  AnalyticsTitle,
  AnalyticsGrid,
  AnalyticsMetric,
  AnalyticsValue,
  AnalyticsLabel
} from '../../shared';

export interface AnalyticsData {
  totalSuggestions: number;
  appliedSuggestions: number;
  dismissedSuggestions: number;
  averageProcessingTime: number;
  analysisCount: number;
  successRate: number;
  feedbackScore: number;
  lastAnalysisTime?: Date;
  sessionDuration?: number;
}

export interface AnalyticsPanelProps {
  analytics: AnalyticsData;
  performance?: {
    averageAnalysisTime: number;
    totalAnalyses: number;
    successRate?: number;
  };
  compactMode?: boolean;
  showExportButton?: boolean;
  onExport?: () => void;
  className?: string;
}

/**
 * AnalyticsPanel - Displays comprehensive AI assistant analytics
 * 
 * Shows usage statistics, performance metrics, and success rates
 */
const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  analytics,
  performance,
  compactMode = false,
  showExportButton = false,
  onExport,
  className
}) => {
  const getAppliedRate = () => {
    if (analytics.totalSuggestions === 0) return 0;
    return Math.round((analytics.appliedSuggestions / analytics.totalSuggestions) * 100);
  };

  const getDismissedRate = () => {
    if (analytics.totalSuggestions === 0) return 0;
    return Math.round((analytics.dismissedSuggestions / analytics.totalSuggestions) * 100);
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return '#22c55e';
    if (rate >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getFeedbackScoreColor = (score: number) => {
    if (score >= 0.7) return '#22c55e';
    if (score >= 0.4) return '#f59e0b';
    return '#ef4444';
  };

  const metrics = [
    {
      label: 'Total Suggestions',
      value: analytics.totalSuggestions,
      icon: <BarChart size={16} />,
      color: '#3b82f6'
    },
    {
      label: 'Applied',
      value: `${analytics.appliedSuggestions} (${getAppliedRate()}%)`,
      icon: <CheckCircle size={16} />,
      color: '#22c55e'
    },
    {
      label: 'Dismissed',
      value: `${analytics.dismissedSuggestions} (${getDismissedRate()}%)`,
      icon: <AlertCircle size={16} />,
      color: '#ef4444'
    },
    {
      label: 'Avg. Processing',
      value: formatTime(analytics.averageProcessingTime),
      icon: <Clock size={16} />,
      color: '#8b5cf6'
    },
    {
      label: 'Success Rate',
      value: `${Math.round(analytics.successRate * 100)}%`,
      icon: <TrendingUp size={16} />,
      color: getSuccessRateColor(analytics.successRate * 100)
    },
    {
      label: 'User Satisfaction',
      value: `${Math.round(analytics.feedbackScore * 100)}%`,
      icon: <TrendingUp size={16} />,
      color: getFeedbackScoreColor(analytics.feedbackScore)
    }
  ];

  // Add session metrics if available
  const sessionMetrics = [
    {
      label: 'Analyses Run',
      value: analytics.analysisCount,
      icon: <BarChart size={16} />,
      color: '#6b7280'
    }
  ];

  if (analytics.sessionDuration) {
    sessionMetrics.push({
      label: 'Session Time',
      value: formatDuration(analytics.sessionDuration),
      icon: <Clock size={16} />,
      color: '#6b7280'
    });
  }

  const allMetrics = compactMode ? metrics.slice(0, 4) : [...metrics, ...sessionMetrics];

  return (
    <AnalyticsSection className={className}>
      <AnalyticsTitle>
        <BarChart size={18} />
        AI Assistant Analytics
        {showExportButton && onExport && (
          <button
            onClick={onExport}
            style={{
              marginLeft: 'auto',
              padding: '0.25rem 0.5rem',
              background: 'rgba(255, 215, 0, 0.2)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '6px',
              color: '#FFD700',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Export
          </button>
        )}
      </AnalyticsTitle>

      <AnalyticsGrid $compact={compactMode}>
        {allMetrics.map((metric, index) => (
          <AnalyticsMetric key={index} $color={metric.color}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {metric.icon}
              <AnalyticsLabel>{metric.label}</AnalyticsLabel>
            </div>
            <AnalyticsValue $color={metric.color}>
              {metric.value}
            </AnalyticsValue>
          </AnalyticsMetric>
        ))}
      </AnalyticsGrid>

      {/* Performance Summary */}
      {performance && !compactMode && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#ccc'
        }}>
          <strong>Performance Summary:</strong> {performance.totalAnalyses} total analyses • 
          {formatTime(performance.averageAnalysisTime)} avg. time
          {performance.successRate && ` • ${Math.round(performance.successRate * 100)}% success rate`}
        </div>
      )}

      {/* Last Analysis Time */}
      {analytics.lastAnalysisTime && !compactMode && (
        <div style={{
          marginTop: '0.5rem',
          fontSize: '0.75rem',
          color: '#888',
          textAlign: 'center'
        }}>
          Last analysis: {analytics.lastAnalysisTime.toLocaleTimeString()}
        </div>
      )}
    </AnalyticsSection>
  );
};

export default AnalyticsPanel;
