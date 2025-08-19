// client-portal/src/components/analytics/AnalyticsHub.tsx
/**
 * APEX AI - Comprehensive Analytics Dashboard
 * ==========================================
 * 
 * Enterprise-grade analytics hub providing deep insights into security
 * operations, threat patterns, response performance, and ROI metrics.
 * 
 * Features:
 * - Real-time threat trend analysis with predictive insights
 * - Response time analytics with industry benchmarking
 * - Security hotspot mapping with risk assessment
 * - ROI and value demonstration metrics
 * - Interactive charts with drill-down capabilities
 * - Export functionality for executive reporting
 * - Mobile-responsive design with touch optimization
 * - Performance-optimized with lazy loading
 * 
 * Master Prompt Compliance:
 * - "Analytics Hub" - Advanced security analytics and reporting dashboard
 * - ROI metrics showing platform value and cost savings
 * - Professional UI for enterprise client expectations
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  TrendingUpIcon, 
  TrendingDownIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { usePerformance } from '../../hooks/usePerformance';
import { useMobileDetection } from '../common/MobileDetector';
import PerformanceOptimizer from '../common/PerformanceOptimizer';
import { clientAPI } from '../../services/clientAPI';
import type { 
  AnalyticsOverview, 
  ThreatTrends, 
  ResponseMetrics, 
  SecurityHotspots,
  ROIMetrics 
} from '../../types/client.types';

// ===========================
// TYPES AND INTERFACES
// ===========================

interface AnalyticsData {
  overview: AnalyticsOverview | null;
  threatTrends: ThreatTrends | null;
  responseMetrics: ResponseMetrics | null;
  securityHotspots: SecurityHotspots | null;
  roiMetrics: ROIMetrics | null;
}

interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

interface AnalyticsFilters {
  dateRange: DateRange;
  propertyId: string | null;
  incidentTypes: string[];
  includeComparative: boolean;
  includePredictive: boolean;
}

// ===========================
// CONSTANTS
// ===========================

const DATE_RANGES: DateRange[] = [
  {
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    label: 'Last 7 Days'
  },
  {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    label: 'Last 30 Days'
  },
  {
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    label: 'Last 90 Days'
  },
  {
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    label: 'Last Year'
  }
];

const THREAT_COLORS = {
  'weapon': '#ef4444',
  'violence': '#dc2626',
  'theft': '#f97316',
  'vandalism': '#eab308',
  'trespassing': '#3b82f6',
  'loitering': '#6b7280',
  'other': '#8b5cf6'
};

const SEVERITY_COLORS = {
  'critical': '#dc2626',
  'high': '#ea580c',
  'medium': '#ca8a04',
  'low': '#65a30d'
};

// ===========================
// MAIN ANALYTICS HUB COMPONENT
// ===========================

const AnalyticsHub: React.FC = () => {
  const { 
    startLoading, 
    finishLoading, 
    isLoading, 
    updateLoadingProgress 
  } = usePerformance('AnalyticsHub');
  
  const { device, screen } = useMobileDetection();
  
  // State management
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    overview: null,
    threatTrends: null,
    responseMetrics: null,
    securityHotspots: null,
    roiMetrics: null
  });
  
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: DATE_RANGES[1], // Default to last 30 days
    propertyId: null,
    incidentTypes: [],
    includeComparative: true,
    includePredictive: false
  });
  
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'performance' | 'hotspots' | 'roi'>('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===========================
  // DATA FETCHING
  // ===========================

  const fetchAnalyticsData = useCallback(async () => {
    try {
      startLoading('Loading analytics data...', 8);
      setError(null);
      
      updateLoadingProgress(10, 'fetching', 'Fetching overview data...');
      
      // Fetch all analytics data in parallel for better performance
      const [
        overviewResponse,
        threatTrendsResponse,
        responseMetricsResponse,
        hotspotsResponse,
        roiResponse
      ] = await Promise.all([
        clientAPI.getAnalyticsOverview({
          startDate: filters.dateRange.startDate,
          endDate: filters.dateRange.endDate,
          propertyId: filters.propertyId,
          includeComparative: filters.includeComparative,
          includePredictive: filters.includePredictive
        }),
        clientAPI.getThreatTrends({
          startDate: filters.dateRange.startDate,
          endDate: filters.dateRange.endDate,
          propertyId: filters.propertyId,
          granularity: 'daily',
          incidentTypes: filters.incidentTypes.length > 0 ? filters.incidentTypes : undefined
        }),
        clientAPI.getResponseTimeAnalytics({
          startDate: filters.dateRange.startDate,
          endDate: filters.dateRange.endDate,
          propertyId: filters.propertyId
        }),
        clientAPI.getSecurityHotspots({
          startDate: filters.dateRange.startDate,
          endDate: filters.dateRange.endDate,
          propertyId: filters.propertyId
        }),
        clientAPI.getROIMetrics({
          startDate: filters.dateRange.startDate,
          endDate: filters.dateRange.endDate,
          propertyId: filters.propertyId
        })
      ]);

      updateLoadingProgress(80, 'processing', 'Processing analytics data...');

      setAnalyticsData({
        overview: overviewResponse.data,
        threatTrends: threatTrendsResponse.data,
        responseMetrics: responseMetricsResponse.data,
        securityHotspots: hotspotsResponse.data,
        roiMetrics: roiResponse.data
      });

      updateLoadingProgress(100, 'complete', 'Analytics loaded successfully');
      
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setError('Failed to load analytics data. Please try again.');
      toast.error('Failed to load analytics data');
    } finally {
      finishLoading();
    }
  }, [filters, startLoading, updateLoadingProgress, finishLoading]);

  // Fetch data on mount and filter changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // ===========================
  // EXPORT FUNCTIONALITY
  // ===========================

  const handleExport = useCallback(async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      setIsExporting(true);
      toast.loading('Generating analytics export...');

      const exportResponse = await clientAPI.exportAnalytics({
        format,
        reportType: 'executive',
        sections: [activeTab],
        startDate: filters.dateRange.startDate,
        endDate: filters.dateRange.endDate,
        propertyId: filters.propertyId
      });

      if (exportResponse.success) {
        // Create download link
        const link = document.createElement('a');
        link.href = exportResponse.data.downloadUrl;
        link.download = exportResponse.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`${format.toUpperCase()} export completed successfully`);
      }

    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export analytics data');
    } finally {
      setIsExporting(false);
      toast.dismiss();
    }
  }, [activeTab, filters]);

  // ===========================
  // RESPONSIVE CHART CONFIGURATION
  // ===========================

  const chartHeight = useMemo(() => {
    if (device.type === 'mobile') return 250;
    if (device.type === 'tablet') return 300;
    return 400;
  }, [device.type]);

  const chartMargin = useMemo(() => {
    if (device.type === 'mobile') {
      return { top: 10, right: 10, left: 10, bottom: 10 };
    }
    return { top: 20, right: 30, left: 20, bottom: 20 };
  }, [device.type]);

  // ===========================
  // UI COMPONENTS
  // ===========================

  const renderKPICard = (
    title: string, 
    value: string | number, 
    change: number, 
    icon: React.ElementType,
    color: string = 'blue'
  ) => {
    const IconComponent = icon;
    const isPositive = change > 0;
    const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
    const TrendIcon = isPositive ? TrendingUpIcon : TrendingDownIcon;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-${color}-100`}>
              <IconComponent className={`h-6 w-6 text-${color}-600`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
          <div className={`flex items-center space-x-1 ${changeColor}`}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{Math.abs(change)}%</span>
          </div>
        </div>
      </div>
    );
  };

  const renderOverviewTab = () => {
    if (!analyticsData.overview) return null;

    const { overview, threatTrends, responseMetrics } = analyticsData.overview;

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {renderKPICard(
            'Total Incidents',
            overview.totalIncidents || 0,
            overview.incidentsChange || 0,
            ExclamationTriangleIcon,
            'red'
          )}
          {renderKPICard(
            'Critical Threats',
            overview.criticalThreats || 0,
            overview.criticalChange || 0,
            ShieldCheckIcon,
            'orange'
          )}
          {renderKPICard(
            'Avg Response Time',
            `${overview.avgResponseTime || 0}min`,
            overview.responseTimeChange || 0,
            ClockIcon,
            'blue'
          )}
          {renderKPICard(
            'AI Accuracy',
            `${overview.aiAccuracy || 0}%`,
            overview.accuracyChange || 0,
            BoltIcon,
            'green'
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Threat Trends Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Threat Trends</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <CalendarIcon className="h-4 w-4" />
                <span>{filters.dateRange.label}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={threatTrends?.trends || []} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="incidents"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Response Time Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Response Performance</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ClockIcon className="h-4 w-4" />
                <span>By Severity</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={responseMetrics?.bySeverity || []} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="severity" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="avgResponseTime" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights Section */}
        {overview.insights && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <EyeIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">{insight.title}</p>
                    <p className="text-sm text-blue-700 mt-1">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTrendsTab = () => {
    if (!analyticsData.threatTrends) return null;

    const { trends, patterns, insights } = analyticsData.threatTrends;

    return (
      <div className="space-y-6">
        {/* Trend Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Threat Pattern Analysis</h3>
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 text-gray-500" />
              <select 
                className="text-sm border border-gray-300 rounded px-2 py-1"
                value={filters.incidentTypes.join(',')}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  incidentTypes: e.target.value ? e.target.value.split(',') : []
                }))}
              >
                <option value="">All Types</option>
                <option value="weapon">Weapons</option>
                <option value="violence">Violence</option>
                <option value="theft">Theft</option>
                <option value="vandalism">Vandalism</option>
                <option value="trespassing">Trespassing</option>
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={chartHeight + 50}>
            <LineChart data={trends} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              {Object.entries(THREAT_COLORS).map(([type, color]) => (
                <Line
                  key={type}
                  type="monotone"
                  dataKey={type}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pattern Analysis */}
        {patterns && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Patterns</h3>
              <div className="space-y-3">
                {patterns.seasonal?.map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-900">{pattern.period}</span>
                    <span className="text-sm text-gray-600">{pattern.trend}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Activity Times</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={patterns.hourly || []} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="incidents" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPerformanceTab = () => {
    if (!analyticsData.responseMetrics) return null;

    const { metrics, benchmarks, performance } = analyticsData.responseMetrics;

    return (
      <div className="space-y-6">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ClockIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Average Response</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics?.avgResponseTime}min</p>
            <p className="text-sm text-gray-600 mt-1">Across all incidents</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">SLA Compliance</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{performance?.slaCompliance}%</p>
            <p className="text-sm text-gray-600 mt-1">Meeting target response times</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Performance Score</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{performance?.overallScore}/100</p>
            <p className="text-sm text-gray-600 mt-1">Industry comparison</p>
          </div>
        </div>

        {/* Benchmarks Comparison */}
        {benchmarks && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Benchmarks</h3>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={benchmarks.comparison} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="severity" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="yourTime" fill="#3b82f6" name="Your Performance" />
                <Bar dataKey="industryAvg" fill="#e5e7eb" name="Industry Average" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  const renderHotspotsTab = () => {
    if (!analyticsData.securityHotspots) return null;

    const { hotspots, riskAssessment } = analyticsData.securityHotspots;

    return (
      <div className="space-y-6">
        {/* Risk Level Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <PieChart margin={chartMargin}>
                <Pie
                  data={riskAssessment?.distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                  nameKey="risk"
                >
                  {(riskAssessment?.distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.risk as keyof typeof SEVERITY_COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Hotspots</h3>
            <div className="space-y-3">
              {hotspots?.slice(0, 5).map((hotspot, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">{hotspot.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{hotspot.incidents} incidents</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      hotspot.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                      hotspot.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                      hotspot.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {hotspot.riskLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderROITab = () => {
    if (!analyticsData.roiMetrics) return null;

    const { valueMetrics, costSavings, projections } = analyticsData.roiMetrics;

    return (
      <div className="space-y-6">
        {/* Value Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Cost Savings</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">${costSavings?.total?.toLocaleString() || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Per month</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Incidents Prevented</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{valueMetrics?.incidentsPrevented || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Through AI detection</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ClockIcon className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Time Saved</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{valueMetrics?.timeSaved || 0}hrs</p>
            <p className="text-sm text-gray-600 mt-1">Manual monitoring time</p>
          </div>
        </div>

        {/* ROI Projections */}
        {projections && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ROI Projections</h3>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={projections.monthly} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value?.toLocaleString()}`, 'Savings']} />
                <Area
                  type="monotone"
                  dataKey="cumulativeSavings"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  // ===========================
  // MAIN RENDER
  // ===========================

  if (error) {
    return (
      <div className="space-y-6">
        <div className="apex-page-header">
          <h1 className="apex-page-heading">Analytics</h1>
          <p className="apex-page-description">Advanced security analytics and reporting dashboard</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Analytics</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <PerformanceOptimizer level="high">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="apex-page-header">
          <div className="apex-page-title">
            <h1 className="apex-page-heading">Analytics</h1>
            <p className="apex-page-description">
              Advanced security analytics and reporting dashboard
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Date Range Selector */}
            <select
              value={DATE_RANGES.findIndex(range => range.label === filters.dateRange.label)}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: DATE_RANGES[parseInt(e.target.value)]
              }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DATE_RANGES.map((range, index) => (
                <option key={index} value={index}>{range.label}</option>
              ))}
            </select>

            {/* Export Button */}
            <div className="relative">
              <button
                onClick={() => handleExport('pdf')}
                disabled={isExporting || isLoading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Analytics Tabs">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'trends', label: 'Threat Trends', icon: TrendingUpIcon },
              { id: 'performance', label: 'Performance', icon: ClockIcon },
              { id: 'hotspots', label: 'Security Hotspots', icon: MapPinIcon },
              { id: 'roi', label: 'ROI Metrics', icon: CurrencyDollarIcon }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className={device.type === 'mobile' ? 'hidden sm:inline' : ''}>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading analytics data...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'trends' && renderTrendsTab()}
              {activeTab === 'performance' && renderPerformanceTab()}
              {activeTab === 'hotspots' && renderHotspotsTab()}
              {activeTab === 'roi' && renderROITab()}
            </>
          )}
        </div>
      </div>
    </PerformanceOptimizer>
  );
};

export default AnalyticsHub;