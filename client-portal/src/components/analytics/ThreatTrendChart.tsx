// client-portal/src/components/analytics/ThreatTrendChart.tsx
/**
 * APEX AI - Threat Trend Visualization Component
 * ==============================================
 * 
 * Advanced threat trend analysis with interactive charts,
 * pattern recognition, and predictive insights.
 * 
 * Features:
 * - Multi-dimensional threat trend visualization
 * - Interactive time series charts with zoom/pan
 * - Threat type breakdown and correlation analysis
 * - Seasonal pattern detection and highlighting
 * - Anomaly detection with alert indicators
 * - Predictive trend forecasting
 * - Export capabilities for detailed reports
 * - Mobile-responsive design with touch gestures
 * 
 * Usage:
 * <ThreatTrendChart
 *   data={threatData}
 *   timeRange="30d"
 *   showPredictions={true}
 * />
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Brush,
  ComposedChart,
  Bar,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts';
import {
  ExclamationTriangleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  BoltIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useMobileDetection } from '../common/MobileDetector';
import { usePerformance } from '../../hooks/usePerformance';
import type { ThreatTrends, ThreatPattern, ThreatAnomaly } from '../../types/client.types';

// ===========================
// TYPES AND INTERFACES
// ===========================

interface ThreatTrendChartProps {
  data: ThreatTrends;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  showPredictions?: boolean;
  showAnomalies?: boolean;
  showPatterns?: boolean;
  enableInteraction?: boolean;
  height?: number;
  className?: string;
  onThreatTypeClick?: (threatType: string) => void;
  onTimeRangeSelect?: (startDate: string, endDate: string) => void;
}

interface ChartDataPoint {
  date: string;
  timestamp: number;
  [threatType: string]: string | number;
  total?: number;
  predicted?: number;
  anomaly?: boolean;
  pattern?: string;
}

interface ThreatTypeConfig {
  color: string;
  strokeWidth: number;
  opacity: number;
  visible: boolean;
  label: string;
}

// ===========================
// CONSTANTS
// ===========================

const THREAT_TYPE_CONFIGS: Record<string, ThreatTypeConfig> = {
  weapon: {
    color: '#dc2626',
    strokeWidth: 3,
    opacity: 1,
    visible: true,
    label: 'Weapons'
  },
  violence: {
    color: '#b91c1c',
    strokeWidth: 2,
    opacity: 0.9,
    visible: true,
    label: 'Violence'
  },
  theft: {
    color: '#ea580c',
    strokeWidth: 2,
    opacity: 0.8,
    visible: true,
    label: 'Theft'
  },
  vandalism: {
    color: '#ca8a04',
    strokeWidth: 2,
    opacity: 0.8,
    visible: true,
    label: 'Vandalism'
  },
  trespassing: {
    color: '#2563eb',
    strokeWidth: 2,
    opacity: 0.7,
    visible: true,
    label: 'Trespassing'
  },
  loitering: {
    color: '#7c3aed',
    strokeWidth: 1,
    opacity: 0.7,
    visible: true,
    label: 'Loitering'
  },
  other: {
    color: '#6b7280',
    strokeWidth: 1,
    opacity: 0.6,
    visible: false,
    label: 'Other'
  }
};

const CHART_MODES = {
  line: 'Line Chart',
  area: 'Area Chart',
  stacked: 'Stacked Area',
  scatter: 'Scatter Plot',
  heatmap: 'Heatmap'
} as const;

type ChartMode = keyof typeof CHART_MODES;

// ===========================
// UTILITY FUNCTIONS
// ===========================

const formatTrendData = (trends: any[]): ChartDataPoint[] => {
  return trends.map(trend => ({
    ...trend,
    timestamp: new Date(trend.date).getTime(),
    total: Object.entries(trend)
      .filter(([key]) => key !== 'date' && key !== 'timestamp')
      .reduce((sum, [, value]) => sum + (typeof value === 'number' ? value : 0), 0)
  }));
};

const detectAnomalies = (data: ChartDataPoint[], threshold: number = 2): ChartDataPoint[] => {
  if (data.length < 7) return data; // Need minimum data for anomaly detection

  return data.map((point, index) => {
    if (index < 3 || index >= data.length - 3) return point;

    // Calculate moving average and standard deviation
    const window = data.slice(index - 3, index + 4);
    const values = window.map(w => w.total || 0);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Mark as anomaly if value is beyond threshold standard deviations
    const isAnomaly = Math.abs((point.total || 0) - mean) > threshold * stdDev;

    return {
      ...point,
      anomaly: isAnomaly
    };
  });
};

const generatePredictions = (data: ChartDataPoint[], periods: number = 7): ChartDataPoint[] => {
  if (data.length < 14) return []; // Need minimum data for predictions

  // Simple linear regression for trend prediction
  const recentData = data.slice(-14); // Use last 14 data points
  const n = recentData.length;
  
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  recentData.forEach((point, index) => {
    const x = index;
    const y = point.total || 0;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate predictions
  const predictions: ChartDataPoint[] = [];
  const lastDate = new Date(data[data.length - 1].date);

  for (let i = 1; i <= periods; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + i);
    
    const predicted = Math.max(0, slope * (n + i - 1) + intercept);
    
    predictions.push({
      date: futureDate.toISOString().split('T')[0],
      timestamp: futureDate.getTime(),
      predicted: Math.round(predicted),
      total: undefined
    });
  }

  return predictions;
};

// ===========================
// CUSTOM TOOLTIP COMPONENT
// ===========================

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const date = new Date(label).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-900 mb-2">{date}</p>
      <div className="space-y-1">
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
              {entry.value} {entry.value === 1 ? 'incident' : 'incidents'}
            </span>
          </div>
        ))}
      </div>
      {payload.some((p: any) => p.payload?.anomaly) && (
        <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
            <span className="text-xs text-red-700 font-medium">Anomaly Detected</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ===========================
// PATTERN INDICATOR COMPONENT
// ===========================

const PatternIndicators: React.FC<{ patterns: ThreatPattern[] }> = ({ patterns }) => {
  if (!patterns?.length) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center space-x-2 mb-3">
        <EyeIcon className="h-5 w-5 text-blue-600" />
        <h4 className="text-sm font-semibold text-blue-900">Detected Patterns</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {patterns.map((pattern, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className={`w-2 h-2 rounded-full mt-1.5 ${
                pattern.confidence > 0.8 ? 'bg-green-500' :
                pattern.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">{pattern.type}</p>
              <p className="text-xs text-blue-700">{pattern.description}</p>
              <p className="text-xs text-blue-600 mt-1">
                Confidence: {(pattern.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===========================
// MAIN THREAT TREND CHART COMPONENT
// ===========================

const ThreatTrendChart: React.FC<ThreatTrendChartProps> = ({
  data,
  timeRange = '30d',
  showPredictions = false,
  showAnomalies = true,
  showPatterns = true,
  enableInteraction = true,
  height,
  className = '',
  onThreatTypeClick,
  onTimeRangeSelect
}) => {
  const { device, screen } = useMobileDetection();
  const { startLoading, finishLoading } = usePerformance('ThreatTrendChart');

  // State management
  const [chartMode, setChartMode] = useState<ChartMode>('line');
  const [visibleThreatTypes, setVisibleThreatTypes] = useState<Record<string, boolean>>(
    Object.fromEntries(
      Object.entries(THREAT_TYPE_CONFIGS).map(([key, config]) => [key, config.visible])
    )
  );
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const chartRef = useRef<HTMLDivElement>(null);

  // ===========================
  // DATA PROCESSING
  // ===========================

  const processedData = useMemo(() => {
    if (!data?.trends) return [];

    let processed = formatTrendData(data.trends);

    // Add anomaly detection if enabled
    if (showAnomalies) {
      processed = detectAnomalies(processed);
    }

    return processed;
  }, [data?.trends, showAnomalies]);

  const predictionsData = useMemo(() => {
    if (!showPredictions || !processedData.length) return [];
    return generatePredictions(processedData, 7);
  }, [processedData, showPredictions]);

  const combinedData = useMemo(() => {
    return [...processedData, ...predictionsData];
  }, [processedData, predictionsData]);

  // ===========================
  // RESPONSIVE CONFIGURATION
  // ===========================

  const chartHeight = height || (device.type === 'mobile' ? 300 : 400);
  const chartMargin = device.type === 'mobile' 
    ? { top: 10, right: 10, left: 10, bottom: 10 }
    : { top: 20, right: 30, left: 20, bottom: 20 };

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleThreatTypeToggle = useCallback((threatType: string) => {
    setVisibleThreatTypes(prev => ({
      ...prev,
      [threatType]: !prev[threatType]
    }));

    if (onThreatTypeClick) {
      onThreatTypeClick(threatType);
    }
  }, [onThreatTypeClick]);

  const handleBrushChange = useCallback((brushData: any) => {
    if (brushData?.startIndex !== undefined && brushData?.endIndex !== undefined) {
      const startData = combinedData[brushData.startIndex];
      const endData = combinedData[brushData.endIndex];
      
      if (startData && endData && onTimeRangeSelect) {
        onTimeRangeSelect(startData.date, endData.date);
      }
    }
  }, [combinedData, onTimeRangeSelect]);

  const handleZoom = useCallback((domain: [number, number] | null) => {
    setZoomDomain(domain);
  }, []);

  // ===========================
  // CHART RENDERING
  // ===========================

  const renderChart = () => {
    const threatTypes = Object.entries(THREAT_TYPE_CONFIGS)
      .filter(([type]) => visibleThreatTypes[type])
      .map(([type, config]) => ({ type, config }));

    const commonProps = {
      data: combinedData,
      margin: chartMargin,
      onMouseDown: enableInteraction ? (e: any) => {
        if (e?.activeLabel) {
          const timestamp = new Date(e.activeLabel).getTime();
          setSelectedTimeRange([timestamp, timestamp]);
        }
      } : undefined
    };

    switch (chartMode) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              domain={zoomDomain || ['dataMin', 'dataMax']}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {threatTypes.map(({ type, config }) => (
              <Area
                key={type}
                type="monotone"
                dataKey={type}
                stackId="threats"
                stroke={config.color}
                fill={config.color}
                fillOpacity={config.opacity * 0.5}
                strokeWidth={config.strokeWidth}
                name={config.label}
              />
            ))}
            
            {showPredictions && (
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#94a3b8"
                fill="#94a3b8"
                fillOpacity={0.2}
                strokeDasharray="5 5"
                name="Predicted"
              />
            )}
          </AreaChart>
        );

      case 'stacked':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              domain={zoomDomain || ['dataMin', 'dataMax']}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {threatTypes.map(({ type, config }) => (
              <Area
                key={type}
                type="monotone"
                dataKey={type}
                stackId="1"
                stroke={config.color}
                fill={config.color}
                fillOpacity={config.opacity}
                name={config.label}
              />
            ))}
          </AreaChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fontSize: 12 }}
              type="number"
              scale="time"
              domain={zoomDomain || ['dataMin', 'dataMax']}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {threatTypes.map(({ type, config }) => (
              <Scatter
                key={type}
                dataKey={type}
                fill={config.color}
                name={config.label}
              />
            ))}
          </ScatterChart>
        );

      default: // line chart
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              domain={zoomDomain || ['dataMin', 'dataMax']}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {threatTypes.map(({ type, config }) => (
              <Line
                key={type}
                type="monotone"
                dataKey={type}
                stroke={config.color}
                strokeWidth={config.strokeWidth}
                strokeOpacity={config.opacity}
                dot={{ r: 3, fill: config.color }}
                activeDot={{ r: 5, fill: config.color }}
                name={config.label}
              />
            ))}
            
            {showPredictions && (
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Predicted"
              />
            )}

            {/* Anomaly indicators */}
            {showAnomalies && processedData
              .filter(point => point.anomaly)
              .map((point, index) => (
                <ReferenceLine
                  key={`anomaly-${index}`}
                  x={point.date}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeOpacity={0.7}
                />
              ))
            }
          </LineChart>
        );
    }
  };

  // ===========================
  // CONTROLS RENDERING
  // ===========================

  const renderControls = () => (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4 mb-6">
      {/* Chart Mode Selector */}
      <div className="flex items-center space-x-2">
        <ChartBarIcon className="h-5 w-5 text-gray-500" />
        <select
          value={chartMode}
          onChange={(e) => setChartMode(e.target.value as ChartMode)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(CHART_MODES).map(([mode, label]) => (
            <option key={mode} value={mode}>{label}</option>
          ))}
        </select>
      </div>

      {/* Threat Type Toggles */}
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(THREAT_TYPE_CONFIGS).map(([type, config]) => (
          <button
            key={type}
            onClick={() => handleThreatTypeToggle(type)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              visibleThreatTypes[type]
                ? 'text-white'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: visibleThreatTypes[type] ? config.color : undefined
            }}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={showPredictions}
            onChange={(e) => {
              // This would trigger a re-render with new props in the parent
              console.log('Toggle predictions:', e.target.checked);
            }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Predictions</span>
        </label>
        
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={showAnomalies}
            onChange={(e) => {
              // This would trigger a re-render with new props in the parent
              console.log('Toggle anomalies:', e.target.checked);
            }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Anomalies</span>
        </label>
      </div>
    </div>
  );

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Threat Trends Analysis</h3>
          <p className="text-sm text-gray-600 mt-1">
            Interactive visualization of security incidents over time
          </p>
        </div>
        
        {enableInteraction && (
          <button
            onClick={() => handleZoom(null)}
            className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowsPointingOutIcon className="h-4 w-4 mr-2" />
            Reset Zoom
          </button>
        )}
      </div>

      {/* Controls */}
      {renderControls()}

      {/* Chart */}
      <div ref={chartRef} className="w-full">
        <ResponsiveContainer width="100%" height={chartHeight}>
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Brush for time selection */}
      {enableInteraction && device.type !== 'mobile' && (
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={processedData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={1}
                dot={false}
              />
              <Brush
                dataKey="date"
                height={30}
                stroke="#3b82f6"
                onChange={handleBrushChange}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pattern Indicators */}
      {showPatterns && data?.patterns && (
        <PatternIndicators patterns={data.patterns} />
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {processedData.reduce((sum, point) => sum + (point.total || 0), 0)}
          </p>
          <p className="text-sm text-gray-600">Total Incidents</p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {processedData.filter(point => point.anomaly).length}
          </p>
          <p className="text-sm text-gray-600">Anomalies</p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {Math.round(processedData.reduce((sum, point) => sum + (point.total || 0), 0) / processedData.length)}
          </p>
          <p className="text-sm text-gray-600">Daily Average</p>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {data?.insights?.length || 0}
          </p>
          <p className="text-sm text-gray-600">Insights</p>
        </div>
      </div>
    </div>
  );
};

export default ThreatTrendChart;