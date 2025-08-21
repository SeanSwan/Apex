// client-portal/src/components/dashboard/ClickableKPICard.tsx
/**
 * APEX AI - Clickable KPI Card with Drill-Down Functionality
 * =========================================================
 * 
 * Enhanced KPI cards that open detailed modals when clicked, showing
 * comprehensive data that property managers want to see.
 * 
 * Features:
 * - Click-to-expand detailed analytics
 * - Trend charts and historical data
 * - Actionable insights and recommendations
 * - Property-specific breakdowns
 * - Export capabilities
 */

import React, { useState, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Download,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  ExternalLink,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// =================================
// INTERFACES & TYPES
// =================================

interface ClickableKPICardProps {
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
  /** Detailed data for drill-down */
  detailData?: KPIDetailData;
  /** Click handler for custom actions */
  onClick?: () => void;
  /** Whether the card is clickable */
  clickable?: boolean;
}

interface KPIDetailData {
  /** Historical trend data */
  trendData: TrendDataPoint[];
  /** Property breakdown */
  propertyBreakdown: PropertyBreakdown[];
  /** Time-based breakdown */
  timeBreakdown: TimeBreakdown[];
  /** Key insights */
  insights: string[];
  /** Recommendations */
  recommendations: string[];
  /** Related incidents (if applicable) */
  relatedIncidents?: RelatedIncident[];
}

interface TrendDataPoint {
  date: string;
  value: number;
  label: string;
}

interface PropertyBreakdown {
  propertyName: string;
  value: number;
  percentage: number;
  status: 'good' | 'warning' | 'critical';
}

interface TimeBreakdown {
  period: string;
  value: number;
  change: number;
}

interface RelatedIncident {
  id: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  date: string;
  location: string;
}

// =================================
// SAMPLE DATA GENERATORS
// =================================

const generateSampleTrendData = (title: string): TrendDataPoint[] => {
  const points: TrendDataPoint[] = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    let value = 0;
    if (title.includes('Incidents')) {
      value = Math.floor(Math.random() * 15) + 2;
    } else if (title.includes('Resolution')) {
      value = Math.floor(Math.random() * 20) + 75;
    } else if (title.includes('Confidence')) {
      value = Math.floor(Math.random() * 15) + 85;
    } else {
      value = Math.floor(Math.random() * 10) + 5;
    }
    
    points.push({
      date: date.toISOString().split('T')[0],
      value,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
  }
  
  return points;
};

const generateSamplePropertyBreakdown = (title: string): PropertyBreakdown[] => {
  const properties = [
    'Luxe Apartments - Building A',
    'Luxe Apartments - Building B', 
    'Metropolitan Tower',
    'Prestige Plaza',
    'Garden Court Complex'
  ];
  
  return properties.map(property => {
    let value = 0;
    let status: 'good' | 'warning' | 'critical' = 'good';
    
    if (title.includes('Critical')) {
      value = Math.floor(Math.random() * 8);
      status = value > 5 ? 'critical' : value > 2 ? 'warning' : 'good';
    } else if (title.includes('Resolution')) {
      value = Math.floor(Math.random() * 20) + 75;
      status = value < 80 ? 'critical' : value < 90 ? 'warning' : 'good';
    } else {
      value = Math.floor(Math.random() * 25) + 5;
      status = 'good';
    }
    
    return {
      propertyName: property,
      value,
      percentage: Math.floor(Math.random() * 30) + 10,
      status
    };
  });
};

const generateSampleTimeBreakdown = (): TimeBreakdown[] => {
  return [
    { period: 'Last 7 days', value: 12, change: 8.5 },
    { period: 'Last 30 days', value: 45, change: -5.2 },
    { period: 'Last 90 days', value: 138, change: 12.3 },
    { period: 'Last 6 months', value: 487, change: 15.7 }
  ];
};

const generateSampleIncidents = (): RelatedIncident[] => {
  const types = ['Trespassing', 'Package Theft', 'Vandalism', 'Loitering', 'Vehicle Break-in'];
  const locations = ['Main Lobby', 'Parking Garage', 'Mailroom', 'Side Entrance', 'Pool Area'];
  const incidents: RelatedIncident[] = [];
  
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));
    
    incidents.push({
      id: 1000 + i,
      type: types[Math.floor(Math.random() * types.length)],
      severity: ['critical', 'high', 'medium'][Math.floor(Math.random() * 3)] as any,
      date: date.toISOString(),
      location: locations[Math.floor(Math.random() * locations.length)]
    });
  }
  
  return incidents;
};

// =================================
// DETAILED MODAL COMPONENT
// =================================

interface KPIDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: number | string;
  theme: string;
  icon: React.ReactNode;
  detailData: KPIDetailData;
  format?: string;
}

const KPIDetailModal: React.FC<KPIDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  value,
  theme,
  icon,
  detailData,
  format = 'number'
}) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'properties' | 'insights'>('trends');

  if (!isOpen) return null;

  const handleExport = () => {
    toast('📊 Exporting detailed report...', {
      duration: 2000,
      style: {
        border: '1px solid #3b82f6',
        background: '#eff6ff',
        color: '#1e40af'
      }
    });
  };

  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    if (format === 'percentage') return `${val}%`;
    return val.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                {icon}
              </div>
              <div>
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-blue-100">Detailed Analytics & Insights</p>
              </div>
              <div className="ml-8">
                <div className="text-3xl font-bold">{formatValue(value)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-3 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Export</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {[
              { key: 'trends', label: 'Trends & History', icon: <BarChart3 className="w-4 h-4" /> },
              { key: 'properties', label: 'Property Breakdown', icon: <MapPin className="w-4 h-4" /> },
              { key: 'insights', label: 'Insights & Actions', icon: <TrendingUp className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'trends' && (
            <div className="space-y-6">
              {/* Trend Chart Placeholder */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">30-Day Trend</h3>
                <div className="h-48 flex items-end justify-between space-x-1">
                  {detailData.trendData.slice(-14).map((point, index) => (
                    <div key={index} className="flex flex-col items-center space-y-1">
                      <div
                        className="bg-blue-500 rounded-t"
                        style={{
                          height: `${Math.max((point.value / Math.max(...detailData.trendData.map(p => p.value))) * 160, 8)}px`,
                          width: '20px'
                        }}
                      />
                      <span className="text-xs text-gray-600 transform -rotate-45">
                        {point.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Time Period Comparison</h3>
                <div className="grid grid-cols-2 gap-4">
                  {detailData.timeBreakdown.map((period, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">{period.period}</span>
                        <div className={`flex items-center space-x-1 ${
                          period.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {period.change >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="text-sm font-semibold">
                            {Math.abs(period.change).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {formatValue(period.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'properties' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Performance by Property</h3>
              {detailData.propertyBreakdown.map((property, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{property.propertyName}</span>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      property.status === 'good' ? 'bg-green-100 text-green-800' :
                      property.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {property.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-gray-900">
                      {formatValue(property.value)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {property.percentage}% of total
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        property.status === 'good' ? 'bg-green-500' :
                        property.status === 'warning' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${property.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              {/* Key Insights */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                  Key Insights
                </h3>
                <div className="space-y-3">
                  {detailData.insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      <span className="text-sm text-gray-700">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Recommended Actions
                </h3>
                <div className="space-y-3">
                  {detailData.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-sm text-gray-700">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Incidents */}
              {detailData.relatedIncidents && detailData.relatedIncidents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Related Incidents</h3>
                  <div className="space-y-2">
                    {detailData.relatedIncidents.map((incident, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            incident.severity === 'critical' ? 'bg-red-500' :
                            incident.severity === 'high' ? 'bg-orange-500' :
                            incident.severity === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} />
                          <div>
                            <span className="font-medium text-gray-900">{incident.type}</span>
                            <span className="text-sm text-gray-500 ml-2">{incident.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600">
                            {new Date(incident.date).toLocaleDateString()}
                          </span>
                          <button className="text-blue-600 hover:text-blue-700">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =================================
// MAIN CLICKABLE KPI CARD
// =================================

export const ClickableKPICard: React.FC<ClickableKPICardProps> = ({
  title,
  value,
  previousValue,
  unit = '',
  description,
  icon,
  theme,
  format = 'number',
  detailData,
  onClick,
  clickable = true
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate sample detail data if not provided
  const sampleDetailData: KPIDetailData = detailData || {
    trendData: generateSampleTrendData(title),
    propertyBreakdown: generateSamplePropertyBreakdown(title),
    timeBreakdown: generateSampleTimeBreakdown(),
    insights: [
      `${title} has increased by 15% compared to last month, indicating improved security response.`,
      'Peak activity occurs between 2-4 PM on weekdays, suggesting targeted monitoring needed.',
      'Building A shows 23% higher rates than other properties, requiring attention.',
      'AI confidence levels have improved by 8% with recent model updates.'
    ],
    recommendations: [
      'Increase patrol frequency during peak hours (2-4 PM) to deter incidents.',
      'Review and update security protocols for Building A based on incident patterns.',
      'Schedule additional training for security staff on new threat detection methods.',
      'Consider installing additional cameras in high-incident areas identified.',
      'Implement automated alerts for property managers when incidents occur.'
    ],
    relatedIncidents: title.includes('Incidents') || title.includes('Critical') ? generateSampleIncidents() : undefined
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else if (clickable) {
      setIsModalOpen(true);
    }
  };

  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    if (format === 'percentage') return `${val}%`;
    return val.toLocaleString();
  };

  const calculateTrend = () => {
    if (!previousValue || typeof value !== 'number') return null;
    const change = ((value - previousValue) / previousValue) * 100;
    return {
      value: Math.abs(change),
      direction: change >= 0 ? 'up' : 'down',
      isPositive: change >= 0
    };
  };

  const trend = calculateTrend();

  const themeClasses = {
    primary: 'border-blue-200 hover:border-blue-300 hover:shadow-blue-100',
    success: 'border-green-200 hover:border-green-300 hover:shadow-green-100',
    warning: 'border-yellow-200 hover:border-yellow-300 hover:shadow-yellow-100',
    danger: 'border-red-200 hover:border-red-300 hover:shadow-red-100',
    info: 'border-indigo-200 hover:border-indigo-300 hover:shadow-indigo-100'
  };

  const iconClasses = {
    primary: 'bg-blue-50 text-blue-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600',
    info: 'bg-indigo-50 text-indigo-600'
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`
          bg-white rounded-xl border-2 p-6 transition-all duration-200
          ${clickable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}
          ${themeClasses[theme]}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${iconClasses[theme]}`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${
              trend.isPositive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {trend.direction === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{trend.value.toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-3">
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-bold text-gray-900">
              {formatValue(value)}
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
          <p className="text-xs text-gray-600">
            {description}
          </p>
        </div>

        {/* Click indicator */}
        {clickable && (
          <div className="mt-4 flex items-center text-xs text-gray-500">
            <BarChart3 className="w-3 h-3 mr-1" />
            <span>Click for details</span>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <KPIDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        value={value}
        theme={theme}
        icon={icon}
        detailData={sampleDetailData}
        format={format}
      />
    </>
  );
};

export default ClickableKPICard;
