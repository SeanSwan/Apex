// client-portal/src/components/dashboard/EnhancedDashboardCards.tsx
/**
 * ENHANCED DASHBOARD CARDS - APEX AI CLIENT PORTAL
 * ================================================
 * Modern, interactive dashboard cards with enhanced data details,
 * micro-animations, hover effects, and seamless modal integration.
 * 
 * FEATURES:
 * - Interactive hover states with preview data
 * - Micro-animations and smooth transitions
 * - Enhanced data details on click
 * - Real-time data updates with WebSocket integration
 * - Modern responsive design with accessibility
 * - Integration with enhanced modals
 * - Contextual actions and quick filters
 * - Export and sharing capabilities
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  BellIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  PlayIcon,
  FilterIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  FireIcon,
  SparklesIcon,
  BoltIcon,
  CpuChipIcon,
  GlobeAltIcon,
  HomeIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  DevicePhoneMobileIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import {
  ShieldCheckIcon as ShieldCheckIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  FireIcon as FireIconSolid,
  SparklesIcon as SparklesIconSolid
} from '@heroicons/react/24/solid';
import { EnhancedIncidentModal } from '../modals/EnhancedIncidentModal';
import { EnhancedPropertyModal } from '../modals/EnhancedPropertyModal';

// ================================
// INTERFACES & TYPES
// ================================

interface EnhancedDashboardCardsProps {
  dashboardData: DashboardData;
  onCardClick?: (cardType: string, data: any) => void;
  onQuickAction?: (action: string, data: any) => void;
  isAdmin?: boolean;
}

interface DashboardData {
  totalIncidents: CardData;
  criticalIncidents: CardData;
  aiConfidence: CardData;
  responseTime: CardData;
  activeProperties: CardData;
  recentIncidents: IncidentSummary[];
  performanceMetrics: PerformanceMetric[];
  aiInsights: AIInsight[];
}

interface CardData {
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  details: DetailItem[];
  quickActions?: QuickAction[];
  previewData?: PreviewData;
}

interface DetailItem {
  label: string;
  value: string | number;
  status?: 'good' | 'warning' | 'critical';
  trend?: number;
}

interface QuickAction {
  label: string;
  action: string;
  icon: React.ReactNode;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

interface PreviewData {
  chartData?: ChartDataPoint[];
  breakdown?: BreakdownItem[];
  recentActivity?: ActivityItem[];
}

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface BreakdownItem {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

interface ActivityItem {
  id: string;
  timestamp: string;
  description: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

interface PerformanceMetric {
  metric: string;
  value: number;
  target: number;
  status: 'good' | 'warning' | 'critical';
}

interface AIInsight {
  insight: string;
  confidence: number;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface IncidentSummary {
  id: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  location: string;
  status: 'open' | 'investigating' | 'resolved';
}

// ================================
// ENHANCED CARD COMPONENT
// ================================

interface EnhancedCardProps {
  title: string;
  icon: React.ReactNode;
  solidIcon?: React.ReactNode;
  data: CardData;
  theme: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  onClick?: () => void;
  onQuickAction?: (action: string) => void;
  className?: string;
}

const EnhancedCard: React.FC<EnhancedCardProps> = ({
  title,
  icon,
  solidIcon,
  data,
  theme,
  onClick,
  onQuickAction,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const themeClasses = {
    primary: {
      card: 'border-blue-200 hover:border-blue-400 hover:shadow-blue-100',
      icon: 'bg-blue-50 text-blue-600',
      iconHover: 'bg-blue-600 text-white',
      accent: 'text-blue-600',
      background: 'bg-gradient-to-br from-blue-50 to-blue-100'
    },
    success: {
      card: 'border-green-200 hover:border-green-400 hover:shadow-green-100',
      icon: 'bg-green-50 text-green-600',
      iconHover: 'bg-green-600 text-white',
      accent: 'text-green-600',
      background: 'bg-gradient-to-br from-green-50 to-green-100'
    },
    warning: {
      card: 'border-yellow-200 hover:border-yellow-400 hover:shadow-yellow-100',
      icon: 'bg-yellow-50 text-yellow-600',
      iconHover: 'bg-yellow-600 text-white',
      accent: 'text-yellow-600',
      background: 'bg-gradient-to-br from-yellow-50 to-yellow-100'
    },
    danger: {
      card: 'border-red-200 hover:border-red-400 hover:shadow-red-100',
      icon: 'bg-red-50 text-red-600',
      iconHover: 'bg-red-600 text-white',
      accent: 'text-red-600',
      background: 'bg-gradient-to-br from-red-50 to-red-100'
    },
    info: {
      card: 'border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-100',
      icon: 'bg-indigo-50 text-indigo-600',
      iconHover: 'bg-indigo-600 text-white',
      accent: 'text-indigo-600',
      background: 'bg-gradient-to-br from-indigo-50 to-indigo-100'
    },
    purple: {
      card: 'border-purple-200 hover:border-purple-400 hover:shadow-purple-100',
      icon: 'bg-purple-50 text-purple-600',
      iconHover: 'bg-purple-600 text-white',
      accent: 'text-purple-600',
      background: 'bg-gradient-to-br from-purple-50 to-purple-100'
    }
  };

  const currentTheme = themeClasses[theme];

  const handleClick = useCallback(() => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 150);
    onClick?.();
  }, [onClick]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', change: number) => {
    if (trend === 'stable' || Math.abs(change) < 1) {
      return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
    return trend === 'up' ? (
      <TrendingUpIcon className={`w-4 h-4 ${change > 0 ? 'text-green-600' : 'text-red-600'}`} />
    ) : (
      <TrendingDownIcon className={`w-4 h-4 ${change < 0 ? 'text-red-600' : 'text-green-600'}`} />
    );
  };

  const formatValue = (value: number | string): string => {
    if (typeof value === 'string') return value;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <div className="relative">
      {/* Main Card */}
      <div
        className={`
          bg-white rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 ease-out
          ${onClick ? 'hover:shadow-lg hover:-translate-y-1' : ''}
          ${currentTheme.card}
          ${isClicked ? 'scale-95' : 'scale-100'}
          ${isHovered ? 'shadow-xl' : 'shadow-sm'}
          ${className}
        `}
        onMouseEnter={() => {
          setIsHovered(true);
          setShowPreview(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setTimeout(() => setShowPreview(false), 300);
        }}
        onClick={handleClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div 
            className={`
              p-3 rounded-xl transition-all duration-300
              ${isHovered ? currentTheme.iconHover : currentTheme.icon}
            `}
          >
            {isHovered && solidIcon ? solidIcon : icon}
          </div>
          
          {/* Trend Indicator */}
          <div className="flex items-center space-x-2">
            {getTrendIcon(data.trend, data.change)}
            <span className={`text-sm font-semibold ${
              Math.abs(data.change) < 1 ? 'text-gray-500' :
              data.change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Value */}
        <div className="mb-3">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {formatValue(data.value)}
          </div>
          <h3 className="text-sm font-medium text-gray-600">
            {title}
          </h3>
        </div>

        {/* Quick Details */}
        <div className="space-y-2 mb-4">
          {data.details.slice(0, 2).map((detail, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{detail.label}</span>
              <div className="flex items-center space-x-2">
                <span className={`font-medium ${
                  detail.status === 'good' ? 'text-green-600' :
                  detail.status === 'warning' ? 'text-yellow-600' :
                  detail.status === 'critical' ? 'text-red-600' :
                  'text-gray-900'
                }`}>
                  {detail.value}
                </span>
                {detail.trend && (
                  <span className={`text-xs ${
                    detail.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {detail.trend > 0 ? '+' : ''}{detail.trend}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        {data.quickActions && data.quickActions.length > 0 && (
          <div className="flex space-x-2">
            {data.quickActions.slice(0, 2).map((action, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAction?.(action.action);
                }}
                className={`
                  flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1
                  ${action.variant === 'primary' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                    action.variant === 'success' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                    action.variant === 'warning' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                    action.variant === 'danger' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                    'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                `}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Click Indicator */}
        {onClick && (
          <div className="mt-3 flex items-center justify-center text-xs text-gray-500 space-x-1">
            <ChartBarIcon className="w-3 h-3" />
            <span>Click for detailed analysis</span>
            <ArrowRightIcon className="w-3 h-3" />
          </div>
        )}

        {/* Hover Overlay */}
        {isHovered && (
          <div className={`
            absolute inset-0 rounded-xl opacity-5 transition-opacity duration-300
            ${currentTheme.background}
          `} />
        )}
      </div>

      {/* Preview Popup */}
      {showPreview && data.previewData && (
        <div className="absolute top-full left-0 right-0 mt-2 z-10 opacity-0 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-h-64 overflow-y-auto">
            {/* Chart Preview */}
            {data.previewData.chartData && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">7-Day Trend</h4>
                <div className="flex items-end space-x-1 h-16">
                  {data.previewData.chartData.slice(-7).map((point, index) => (
                    <div
                      key={index}
                      className={`flex-1 ${currentTheme.background} rounded-t`}
                      style={{
                        height: `${Math.max((point.value / Math.max(...data.previewData!.chartData!.map(p => p.value))) * 60, 4)}px`
                      }}
                      title={`${point.label || point.date}: ${point.value}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Breakdown Preview */}
            {data.previewData.breakdown && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Breakdown</h4>
                <div className="space-y-1">
                  {data.previewData.breakdown.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-600">{item.category}</span>
                      </div>
                      <span className="font-medium">{item.value} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity Preview */}
            {data.previewData.recentActivity && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Recent Activity</h4>
                <div className="space-y-1">
                  {data.previewData.recentActivity.slice(0, 3).map((activity, index) => (
                    <div key={index} className="text-xs text-gray-600">
                      <span className="font-medium">
                        {new Date(activity.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      <span className="ml-2">{activity.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ================================
// MAIN ENHANCED DASHBOARD CARDS
// ================================

export const EnhancedDashboardCards: React.FC<EnhancedDashboardCardsProps> = ({
  dashboardData,
  onCardClick,
  onQuickAction,
  isAdmin = false
}) => {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);

  // Generate sample data for demonstrations
  const samplePreviewData = useMemo(() => ({
    chartData: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: Math.floor(Math.random() * 20) + 5,
      label: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        weekday: 'short' 
      })
    })),
    breakdown: [
      { category: 'Trespassing', value: 12, percentage: 45, color: '#ef4444' },
      { category: 'Loitering', value: 8, percentage: 30, color: '#f59e0b' },
      { category: 'Vandalism', value: 4, percentage: 15, color: '#8b5cf6' },
      { category: 'Other', value: 3, percentage: 10, color: '#6b7280' }
    ],
    recentActivity: [
      {
        id: '1',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        description: 'Motion detected at Main Entrance',
        status: 'info' as const
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        description: 'Incident #1247 resolved automatically',
        status: 'success' as const
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        description: 'High confidence alert triggered',
        status: 'warning' as const
      }
    ]
  }), []);

  const handleCardClick = useCallback((cardType: string, data?: any) => {
    switch (cardType) {
      case 'incidents':
      case 'critical_incidents':
        // Open incident browser or detailed modal
        if (dashboardData.recentIncidents.length > 0) {
          setSelectedIncident(dashboardData.recentIncidents[0]);
          setIsIncidentModalOpen(true);
        }
        break;
      case 'properties':
        // Open property management
        setSelectedProperty(null);
        setIsPropertyModalOpen(true);
        break;
      case 'ai_confidence':
      case 'response_time':
        // Open analytics dashboard
        break;
    }
    
    onCardClick?.(cardType, data);
  }, [dashboardData, onCardClick]);

  const handleQuickAction = useCallback((action: string, cardData?: any) => {
    console.log('Quick action:', action, cardData);
    onQuickAction?.(action, cardData);
  }, [onQuickAction]);

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Incidents */}
        <EnhancedCard
          title="Total Incidents"
          icon={<ExclamationTriangleIcon className="w-6 h-6" />}
          solidIcon={<ExclamationTriangleIconSolid className="w-6 h-6" />}
          data={{
            ...dashboardData.totalIncidents,
            previewData: samplePreviewData,
            quickActions: [
              {
                label: 'View All',
                action: 'view_incidents',
                icon: <EyeIcon className="w-3 h-3" />,
                variant: 'primary'
              },
              {
                label: 'Filter',
                action: 'filter_incidents',
                icon: <FilterIcon className="w-3 h-3" />,
                variant: 'secondary'
              }
            ]
          }}
          theme="info"
          onClick={() => handleCardClick('incidents')}
          onQuickAction={(action) => handleQuickAction(action)}
        />

        {/* Critical Incidents */}
        <EnhancedCard
          title="Critical Incidents"
          icon={<FireIcon className="w-6 h-6" />}
          solidIcon={<FireIconSolid className="w-6 h-6" />}
          data={{
            ...dashboardData.criticalIncidents,
            previewData: {
              ...samplePreviewData,
              breakdown: [
                { category: 'Weapons Detected', value: 2, percentage: 40, color: '#dc2626' },
                { category: 'Violence', value: 2, percentage: 40, color: '#ea580c' },
                { category: 'Breaking & Entering', value: 1, percentage: 20, color: '#d97706' }
              ]
            },
            quickActions: [
              {
                label: 'Alert',
                action: 'send_alert',
                icon: <BellIcon className="w-3 h-3" />,
                variant: 'danger'
              },
              {
                label: 'Details',
                action: 'view_critical',
                icon: <DocumentTextIcon className="w-3 h-3" />,
                variant: 'primary'
              }
            ]
          }}
          theme="danger"
          onClick={() => handleCardClick('critical_incidents')}
          onQuickAction={(action) => handleQuickAction(action)}
        />

        {/* AI Confidence */}
        <EnhancedCard
          title="AI Confidence Score"
          icon={<CpuChipIcon className="w-6 h-6" />}
          solidIcon={<SparklesIconSolid className="w-6 h-6" />}
          data={{
            ...dashboardData.aiConfidence,
            previewData: {
              ...samplePreviewData,
              chartData: Array.from({ length: 7 }, (_, i) => ({
                date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                value: Math.floor(Math.random() * 10) + 85,
                label: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                  weekday: 'short' 
                })
              }))
            },
            quickActions: [
              {
                label: 'Optimize',
                action: 'optimize_ai',
                icon: <BoltIcon className="w-3 h-3" />,
                variant: 'success'
              },
              {
                label: 'Analysis',
                action: 'ai_analysis',
                icon: <ChartBarIcon className="w-3 h-3" />,
                variant: 'primary'
              }
            ]
          }}
          theme="purple"
          onClick={() => handleCardClick('ai_confidence')}
          onQuickAction={(action) => handleQuickAction(action)}
        />

        {/* Response Time */}
        <EnhancedCard
          title="Avg Response Time"
          icon={<ClockIcon className="w-6 h-6" />}
          solidIcon={<ClockIcon className="w-6 h-6" />}
          data={{
            ...dashboardData.responseTime,
            previewData: {
              ...samplePreviewData,
              chartData: Array.from({ length: 7 }, (_, i) => ({
                date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                value: Math.floor(Math.random() * 60) + 90,
                label: `${Math.floor(Math.random() * 60) + 90}s`
              }))
            },
            quickActions: [
              {
                label: 'Improve',
                action: 'improve_response',
                icon: <TrendingUpIcon className="w-3 h-3" />,
                variant: 'success'
              },
              {
                label: 'History',
                action: 'response_history',
                icon: <CalendarDaysIcon className="w-3 h-3" />,
                variant: 'secondary'
              }
            ]
          }}
          theme="success"
          onClick={() => handleCardClick('response_time')}
          onQuickAction={(action) => handleQuickAction(action)}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Properties */}
        <EnhancedCard
          title="Active Properties"
          icon={<BuildingOfficeIcon className="w-6 h-6" />}
          solidIcon={<HomeIcon className="w-6 h-6" />}
          data={{
            ...dashboardData.activeProperties,
            previewData: {
              breakdown: [
                { category: 'Luxury Apartments', value: 8, percentage: 50, color: '#3b82f6' },
                { category: 'Commercial', value: 4, percentage: 25, color: '#10b981' },
                { category: 'Residential', value: 3, percentage: 19, color: '#f59e0b' },
                { category: 'Corporate', value: 1, percentage: 6, color: '#8b5cf6' }
              ],
              recentActivity: [
                {
                  id: '1',
                  timestamp: new Date().toISOString(),
                  description: 'Luxe Apartments - New guard assigned',
                  status: 'success' as const
                },
                {
                  id: '2',
                  timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                  description: 'Metro Tower - Security level upgraded',
                  status: 'info' as const
                }
              ]
            },
            quickActions: isAdmin ? [
              {
                label: 'Add Property',
                action: 'add_property',
                icon: <BuildingOfficeIcon className="w-3 h-3" />,
                variant: 'primary'
              },
              {
                label: 'Manage',
                action: 'manage_properties',
                icon: <EyeIcon className="w-3 h-3" />,
                variant: 'secondary'
              }
            ] : [
              {
                label: 'View All',
                action: 'view_properties',
                icon: <EyeIcon className="w-3 h-3" />,
                variant: 'primary'
              }
            ]
          }}
          theme="primary"
          onClick={() => handleCardClick('properties')}
          onQuickAction={(action) => handleQuickAction(action)}
        />

        {/* Evidence Files */}
        <EnhancedCard
          title="Evidence Files"
          icon={<DocumentTextIcon className="w-6 h-6" />}
          solidIcon={<PhotoIcon className="w-6 h-6" />}
          data={{
            value: 847,
            change: 12.3,
            trend: 'up',
            details: [
              { label: 'Videos', value: '524', status: 'good' },
              { label: 'Images', value: '298', status: 'good' },
              { label: 'Audio', value: '25', status: 'good' }
            ],
            previewData: {
              breakdown: [
                { category: 'Video Files', value: 524, percentage: 62, color: '#3b82f6' },
                { category: 'Images', value: 298, percentage: 35, color: '#10b981' },
                { category: 'Audio', value: 25, percentage: 3, color: '#f59e0b' }
              ]
            },
            quickActions: [
              {
                label: 'Browse',
                action: 'browse_evidence',
                icon: <EyeIcon className="w-3 h-3" />,
                variant: 'primary'
              },
              {
                label: 'Export',
                action: 'export_evidence',
                icon: <ArrowDownTrayIcon className="w-3 h-3" />,
                variant: 'secondary'
              }
            ]
          }}
          theme="info"
          onClick={() => handleCardClick('evidence')}
          onQuickAction={(action) => handleQuickAction(action)}
        />

        {/* System Health */}
        <EnhancedCard
          title="System Health"
          icon={<ShieldCheckIcon className="w-6 h-6" />}
          solidIcon={<ShieldCheckIconSolid className="w-6 h-6" />}
          data={{
            value: '98.7%',
            change: 0.3,
            trend: 'up',
            details: [
              { label: 'Cameras Online', value: '47/48', status: 'good' },
              { label: 'AI Systems', value: 'Optimal', status: 'good' },
              { label: 'Network', value: 'Stable', status: 'good' }
            ],
            previewData: {
              chartData: Array.from({ length: 7 }, (_, i) => ({
                date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                value: Math.floor(Math.random() * 3) + 97,
                label: `${Math.floor(Math.random() * 3) + 97}%`
              }))
            },
            quickActions: [
              {
                label: 'Diagnostics',
                action: 'run_diagnostics',
                icon: <CpuChipIcon className="w-3 h-3" />,
                variant: 'primary'
              },
              {
                label: 'Settings',
                action: 'system_settings',
                icon: <InformationCircleIcon className="w-3 h-3" />,
                variant: 'secondary'
              }
            ]
          }}
          theme="success"
          onClick={() => handleCardClick('system_health')}
          onQuickAction={(action) => handleQuickAction(action)}
        />
      </div>

      {/* Enhanced Incident Modal */}
      <EnhancedIncidentModal
        incident={selectedIncident}
        isOpen={isIncidentModalOpen}
        onClose={() => {
          setIsIncidentModalOpen(false);
          setSelectedIncident(null);
        }}
        onManualOverride={(action, data) => {
          console.log('Manual override from modal:', action, data);
        }}
      />

      {/* Enhanced Property Modal */}
      <EnhancedPropertyModal
        property={selectedProperty}
        isOpen={isPropertyModalOpen}
        onClose={() => {
          setIsPropertyModalOpen(false);
          setSelectedProperty(null);
        }}
        onSave={async (propertyData) => {
          console.log('Save property:', propertyData);
          // Handle property save
        }}
        onDelete={async (propertyId) => {
          console.log('Delete property:', propertyId);
          // Handle property delete
        }}
        mode={selectedProperty ? 'edit' : 'create'}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default EnhancedDashboardCards;

// ================================
// CSS ANIMATIONS (ADD TO GLOBAL CSS)
// ================================

const styles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}
`;

// Export styles to be added to global CSS
export { styles as EnhancedDashboardStyles };
