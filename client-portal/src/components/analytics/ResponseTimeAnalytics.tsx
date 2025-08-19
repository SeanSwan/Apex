// client-portal/src/components/analytics/ResponseTimeAnalytics.tsx
/**
 * APEX AI - Response Time Analytics Component
 * ===========================================
 * 
 * Comprehensive response time analysis with industry benchmarking,
 * SLA compliance tracking, and performance optimization insights.
 * 
 * Features:
 * - Multi-dimensional response time visualization
 * - Industry benchmark comparisons
 * - SLA compliance tracking and alerts
 * - Performance trend analysis
 * - Bottleneck identification and recommendations
 * - Response time distribution analysis
 * - Team and individual performance metrics
 * - Mobile-responsive design with interactive charts
 * 
 * Usage:
 * <ResponseTimeAnalytics
 *   data={responseData}
 *   showBenchmarks={true}
 *   enableSLATracking={true}
 * />
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
  ReferenceLine,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  CogIcon,
  BoltIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useMobileDetection } from '../common/MobileDetector';
import { usePerformance } from '../../hooks/usePerformance';
import type { ResponseMetrics, SLACompliance, PerformanceBenchmark } from '../../types/client.types';

// ===========================
// TYPES AND INTERFACES
// ===========================

interface ResponseTimeAnalyticsProps {
  data: ResponseMetrics;
  showBenchmarks?: boolean;
  enableSLATracking?: boolean;
  showTeamMetrics?: boolean;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  className?: string;
  onDrillDown?: (metric: string, filters: any) => void;
  onSLAViolation?: (violation: SLAViolation) => void;
}

interface SLAViolation {
  severity: 'critical' | 'high' | 'medium' | 'low';
  responseTime: number;
  target: number;
  timestamp: string;
  incidentId: string;
}

interface ResponseTimeBreakdown {
  stage: string;
  averageTime: number;
  target: number;
  performance: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  bottleneck: boolean;
}

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

// ===========================
// CONSTANTS
// ===========================

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#65a30d'
};

const PERFORMANCE_COLORS = {
  excellent: '#10b981',
  good: '#3b82f6',
  warning: '#f59e0b',
  critical: '#ef4444'
};

const SLA_TARGETS = {
  critical: 2, // 2 minutes
  high: 5,     // 5 minutes
  medium: 15,  // 15 minutes
  low: 60      // 60 minutes
};

const RESPONSE_STAGES = [
  { id: 'detection', name: 'Detection', target: 30 }, // seconds
  { id: 'assessment', name: 'Assessment', target: 60 },
  { id: 'dispatch', name: 'Dispatch', target: 120 },
  { id: 'arrival', name: 'Arrival', target: 300 },
  { id: 'resolution', name: 'Resolution', target: 900 }
];

// ===========================
// UTILITY FUNCTIONS
// ===========================

const calculatePerformanceScore = (actual: number, target: number): number => {
  if (actual <= target * 0.8) return 100; // Excellent
  if (actual <= target) return 85;         // Good
  if (actual <= target * 1.2) return 70;  // Needs improvement
  return 50; // Poor
};

const getPerformanceStatus = (score: number): 'excellent' | 'good' | 'warning' | 'critical' => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'warning';
  return 'critical';
};

const formatTime = (minutes: number): string => {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  if (minutes < 60) return `${Math.round(minutes)}m`;
  return `${Math.round(minutes / 60 * 10) / 10}h`;
};

// ===========================
// CUSTOM TOOLTIP COMPONENTS
// ===========================

const ResponseTimeTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      <div className="space-y-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-700">{entry.name}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {formatTime(entry.value)}
            </span>
          </div>
        ))}
      </div>
      {payload.some((p: any) => p.value > (SLA_TARGETS[p.payload?.severity] || 60)) && (
        <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
            <span className="text-xs text-red-700 font-medium">SLA Violation</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ===========================
// PERFORMANCE METRIC CARD
// ===========================

const MetricCard: React.FC<{
  metric: PerformanceMetric;
  onClick?: () => void;
}> = ({ metric, onClick }) => {
  const { status, trend, value, target, change } = metric;
  
  const statusConfig = {
    excellent: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: CheckCircleIcon },
    good: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: CheckCircleIcon },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: ExclamationTriangleIcon },
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: XCircleIcon }
  }[status];

  const TrendIcon = trend === 'up' ? TrendingUpIcon : trend === 'down' ? TrendingDownIcon : ClockIcon;
  const StatusIcon = statusConfig.icon;

  return (
    <div 
      className={`${statusConfig.bg} ${statusConfig.border} border rounded-lg p-4 ${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <StatusIcon className={`h-5 w-5 ${statusConfig.text}`} />
        <div className={`flex items-center space-x-1 ${
          trend === 'up' ? 'text-red-600' : trend === 'down' ? 'text-green-600' : 'text-gray-600'
        }`}>
          <TrendIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{Math.abs(change)}%</span>
        </div>
      </div>
      
      <h3 className="text-sm font-medium text-gray-900 mb-1">{metric.name}</h3>
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold text-gray-900">{formatTime(value)}</span>
        <span className="text-sm text-gray-600">/ {formatTime(target)} target</span>
      </div>
      
      <div className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              status === 'excellent' ? 'bg-green-500' :
              status === 'good' ? 'bg-blue-500' :
              status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, (target / value) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// ===========================
// SLA COMPLIANCE TRACKER
// ===========================

const SLAComplianceTracker: React.FC<{
  data: SLACompliance[];
  onViolationClick?: (violation: SLAViolation) => void;
}> = ({ data, onViolationClick }) => {
  const complianceData = useMemo(() => {
    return Object.entries(SLA_TARGETS).map(([severity, target]) => {
      const severityData = data.filter(d => d.severity === severity);
      const compliant = severityData.filter(d => d.responseTime <= target).length;
      const total = severityData.length;
      const compliance = total > 0 ? (compliant / total) * 100 : 100;
      
      return {
        severity,
        target,
        compliance: Math.round(compliance),
        compliant,
        total,
        violations: total - compliant
      };
    });
  }, [data]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">SLA Compliance</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <ShieldCheckIcon className="h-4 w-4" />
          <span>Service Level Agreements</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {complianceData.map(({ severity, compliance, violations, total, target }) => (
          <div key={severity} className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] }}
              />
              <span className="ml-2 text-sm font-medium text-gray-900 capitalize">{severity}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{compliance}%</p>
            <p className="text-xs text-gray-600">Target: {formatTime(target)}</p>
            {violations > 0 && (
              <p className="text-xs text-red-600 mt-1">{violations} violations</p>
            )}
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={complianceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="severity" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value) => [`${value}%`, 'Compliance']} />
          <Bar dataKey="compliance" radius={[4, 4, 0, 0]}>
            {complianceData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.compliance >= 95 ? '#10b981' : entry.compliance >= 85 ? '#3b82f6' : entry.compliance >= 70 ? '#f59e0b' : '#ef4444'} 
              />
            ))}
          </Bar>
          <ReferenceLine y={95} stroke="#10b981" strokeDasharray="2 2" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ===========================
// RESPONSE BREAKDOWN ANALYSIS
// ===========================

const ResponseBreakdownAnalysis: React.FC<{
  breakdown: ResponseTimeBreakdown[];
}> = ({ breakdown }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Response Process Breakdown</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <CogIcon className="h-4 w-4" />
          <span>Stage Analysis</span>
        </div>
      </div>

      <div className="space-y-4">
        {breakdown.map((stage, index) => {
          const score = calculatePerformanceScore(stage.averageTime, stage.target);
          const status = getPerformanceStatus(score);
          
          return (
            <div key={stage.stage} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  status === 'excellent' ? 'bg-green-500' :
                  status === 'good' ? 'bg-blue-500' :
                  status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {index + 1}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{stage.stage}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatTime(stage.averageTime)}
                    </span>
                    <span className="text-sm text-gray-600">
                      / {formatTime(stage.target)}
                    </span>
                    {stage.bottleneck && (
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-500" title="Bottleneck detected" />
                    )}
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      status === 'excellent' ? 'bg-green-500' :
                      status === 'good' ? 'bg-blue-500' :
                      status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, (stage.target / stage.averageTime) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===========================
// MAIN RESPONSE TIME ANALYTICS COMPONENT
// ===========================

const ResponseTimeAnalytics: React.FC<ResponseTimeAnalyticsProps> = ({
  data,
  showBenchmarks = true,
  enableSLATracking = true,
  showTeamMetrics = false,
  timeRange = '30d',
  className = '',
  onDrillDown,
  onSLAViolation
}) => {
  const { device } = useMobileDetection();
  const { performanceScore } = usePerformance('ResponseTimeAnalytics');

  // State management
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'trend' | 'distribution' | 'comparison'>('trend');

  // ===========================
  // DATA PROCESSING
  // ===========================

  const performanceMetrics = useMemo((): PerformanceMetric[] => {
    if (!data?.metrics) return [];

    return [
      {
        name: 'Average Response Time',
        value: data.metrics.averageResponseTime || 0,
        target: 15, // 15 minutes target
        trend: data.metrics.responseTimeTrend || 'stable',
        change: data.metrics.responseTimeChange || 0,
        status: getPerformanceStatus(calculatePerformanceScore(data.metrics.averageResponseTime || 0, 15))
      },
      {
        name: 'Critical Response Time',
        value: data.metrics.criticalResponseTime || 0,
        target: SLA_TARGETS.critical,
        trend: data.metrics.criticalTrend || 'stable',
        change: data.metrics.criticalChange || 0,
        status: getPerformanceStatus(calculatePerformanceScore(data.metrics.criticalResponseTime || 0, SLA_TARGETS.critical))
      },
      {
        name: 'First Response Time',
        value: data.metrics.firstResponseTime || 0,
        target: 5, // 5 minutes target
        trend: data.metrics.firstResponseTrend || 'stable',
        change: data.metrics.firstResponseChange || 0,
        status: getPerformanceStatus(calculatePerformanceScore(data.metrics.firstResponseTime || 0, 5))
      },
      {
        name: 'Resolution Time',
        value: data.metrics.resolutionTime || 0,
        target: 60, // 60 minutes target
        trend: data.metrics.resolutionTrend || 'stable',
        change: data.metrics.resolutionChange || 0,
        status: getPerformanceStatus(calculatePerformanceScore(data.metrics.resolutionTime || 0, 60))
      }
    ];
  }, [data?.metrics]);

  const chartHeight = device.type === 'mobile' ? 250 : 350;
  const chartMargin = device.type === 'mobile' 
    ? { top: 10, right: 10, left: 10, bottom: 10 }
    : { top: 20, right: 30, left: 20, bottom: 20 };

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleMetricClick = useCallback((metric: PerformanceMetric) => {
    setSelectedMetric(metric.name);
    if (onDrillDown) {
      onDrillDown(metric.name, { timeRange, severity: 'all' });
    }
  }, [onDrillDown, timeRange]);

  // ===========================
  // CHART RENDERING
  // ===========================

  const renderTrendChart = () => {
    if (!data?.trends) return null;

    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart data={data.trends} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip content={<ResponseTimeTooltip />} />
          <Legend />
          
          <Area
            type="monotone"
            dataKey="averageResponseTime"
            fill="#3b82f6"
            fillOpacity={0.3}
            stroke="#3b82f6"
            name="Average Response"
          />
          
          {Object.entries(SLA_TARGETS).map(([severity, target]) => (
            <ReferenceLine
              key={severity}
              y={target}
              stroke={SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]}
              strokeDasharray="2 2"
              label={`${severity.toUpperCase()} SLA`}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  const renderDistributionChart = () => {
    if (!data?.distribution) return null;

    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data.distribution} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timeRange" />
          <YAxis />
          <Tooltip />
          <Legend />
          
          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Incidents" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderComparisonChart = () => {
    if (!data?.benchmarks || !showBenchmarks) return null;

    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data.benchmarks.comparison} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="severity" />
          <YAxis />
          <Tooltip content={<ResponseTimeTooltip />} />
          <Legend />
          
          <Bar dataKey="yourTime" fill="#3b82f6" name="Your Performance" />
          <Bar dataKey="industryAverage" fill="#e5e7eb" name="Industry Average" />
          <Bar dataKey="bestPractice" fill="#10b981" name="Best Practice" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric) => (
          <MetricCard
            key={metric.name}
            metric={metric}
            onClick={() => handleMetricClick(metric)}
          />
        ))}
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Response Time Analysis</h3>
            <p className="text-sm text-gray-600 mt-1">
              Performance trends and benchmarking over {timeRange}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 mt-4 lg:mt-0">
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="trend">Trend Analysis</option>
              <option value="distribution">Distribution</option>
              {showBenchmarks && <option value="comparison">Benchmark Comparison</option>}
            </select>
          </div>
        </div>

        <div className="w-full">
          {chartType === 'trend' && renderTrendChart()}
          {chartType === 'distribution' && renderDistributionChart()}
          {chartType === 'comparison' && renderComparisonChart()}
        </div>
      </div>

      {/* SLA Compliance Tracker */}
      {enableSLATracking && data?.slaCompliance && (
        <SLAComplianceTracker
          data={data.slaCompliance}
          onViolationClick={onSLAViolation}
        />
      )}

      {/* Response Process Breakdown */}
      {data?.breakdown && (
        <ResponseBreakdownAnalysis breakdown={data.breakdown} />
      )}

      {/* Team Performance (if enabled) */}
      {showTeamMetrics && data?.teamMetrics && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <UserGroupIcon className="h-4 w-4" />
              <span>Individual Metrics</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.teamMetrics.map((member, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{member.name}</span>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    member.performance === 'excellent' ? 'bg-green-100 text-green-800' :
                    member.performance === 'good' ? 'bg-blue-100 text-blue-800' :
                    member.performance === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {member.performance}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Avg: {formatTime(member.averageResponseTime)}
                </p>
                <p className="text-sm text-gray-600">
                  Cases: {member.casesHandled}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data?.recommendations && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BoltIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Performance Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-red-500' :
                    rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">{rec.title}</p>
                  <p className="text-sm text-blue-700 mt-1">{rec.description}</p>
                  <p className="text-xs text-blue-600 mt-2">
                    Expected impact: {rec.expectedImprovement}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseTimeAnalytics;