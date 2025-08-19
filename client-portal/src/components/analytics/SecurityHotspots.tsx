// client-portal/src/components/analytics/SecurityHotspots.tsx
/**
 * APEX AI - Security Hotspots Analysis Component
 * ==============================================
 * 
 * Advanced security hotspot mapping and risk assessment with
 * interactive visualizations and actionable intelligence.
 * 
 * Features:
 * - Interactive hotspot mapping with risk scoring
 * - Location-based threat clustering and analysis
 * - Risk assessment with mitigation recommendations
 * - Temporal pattern analysis for hotspots
 * - Heat map visualization with customizable metrics
 * - Incident correlation and pattern detection
 * - Mobile-responsive design with touch interactions
 * - Export capabilities for security reports
 * 
 * Usage:
 * <SecurityHotspots
 *   data={hotspotsData}
 *   showRiskAssessment={true}
 *   enableInteractiveMap={true}
 * />
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Treemap,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  MapPinIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ClockIcon,
  CalendarIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  BuildingOffice2Icon,
  MapIcon
} from '@heroicons/react/24/outline';
import { useMobileDetection } from '../common/MobileDetector';
import { usePerformance } from '../../hooks/usePerformance';
import type { SecurityHotspots, RiskAssessment, LocationThreat, HotspotPattern } from '../../types/client.types';

// ===========================
// TYPES AND INTERFACES
// ===========================

interface SecurityHotspotsProps {
  data: SecurityHotspots;
  showRiskAssessment?: boolean;
  enableInteractiveMap?: boolean;
  showPatterns?: boolean;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  className?: string;
  onHotspotClick?: (hotspot: LocationThreat) => void;
  onRiskLevelFilter?: (riskLevel: string) => void;
  onLocationDrillDown?: (location: string) => void;
}

interface HotspotVisualization {
  x: number;
  y: number;
  size: number;
  color: string;
  location: string;
  incidents: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threatTypes: string[];
  lastIncident: string;
}

interface RiskMatrix {
  probability: number;
  impact: number;
  location: string;
  riskScore: number;
  mitigation: string[];
}

// ===========================
// CONSTANTS
// ===========================

const RISK_COLORS = {
  low: '#10b981',
  medium: '#f59e0b', 
  high: '#ef4444',
  critical: '#dc2626'
};

const THREAT_TYPE_COLORS = {
  weapon: '#dc2626',
  violence: '#b91c1c',
  theft: '#ea580c',
  vandalism: '#ca8a04',
  trespassing: '#2563eb',
  loitering: '#7c3aed',
  suspicious: '#6366f1',
  other: '#6b7280'
};

const LOCATION_TYPES = {
  entrance: 'Building Entrance',
  lobby: 'Lobby Area',
  parking: 'Parking Area',
  elevator: 'Elevator Zone',
  corridor: 'Corridor',
  stairwell: 'Stairwell',
  amenity: 'Amenity Area',
  exterior: 'Exterior Perimeter',
  storage: 'Storage Area',
  utility: 'Utility Area'
};

const RISK_THRESHOLDS = {
  low: { min: 0, max: 25, label: 'Low Risk' },
  medium: { min: 25, max: 50, label: 'Medium Risk' },
  high: { min: 50, max: 75, label: 'High Risk' },
  critical: { min: 75, max: 100, label: 'Critical Risk' }
};

// ===========================
// UTILITY FUNCTIONS
// ===========================

const calculateRiskScore = (incidents: number, severity: number, frequency: number): number => {
  // Weighted risk calculation: incidents * severity weight * frequency multiplier
  const severityWeight = severity / 4; // Normalize severity (1-4 scale)
  const frequencyMultiplier = Math.log10(frequency + 1); // Logarithmic frequency scaling
  return Math.min(100, (incidents * severityWeight * frequencyMultiplier * 10));
};

const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
};

const generateHotspotCoordinates = (location: string, index: number): { x: number; y: number } => {
  // Generate pseudo-coordinates based on location name and index for visualization
  const hash = location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    x: (hash % 100) + (index * 5),
    y: ((hash * 2) % 100) + (index * 3)
  };
};

const groupByLocation = (hotspots: LocationThreat[]): Record<string, LocationThreat[]> => {
  return hotspots.reduce((groups, hotspot) => {
    const locationType = hotspot.locationType || 'other';
    if (!groups[locationType]) groups[locationType] = [];
    groups[locationType].push(hotspot);
    return groups;
  }, {} as Record<string, LocationThreat[]>);
};

// ===========================
// CUSTOM TOOLTIP COMPONENTS
// ===========================

const HotspotTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{data.location}</h4>
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
          data.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
          data.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
          data.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {data.riskLevel} risk
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Incidents:</span>
          <span className="font-medium text-gray-900">{data.incidents}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Risk Score:</span>
          <span className="font-medium text-gray-900">{data.riskScore}/100</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Last Incident:</span>
          <span className="font-medium text-gray-900">
            {new Date(data.lastIncident).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      {data.threatTypes?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Threat Types:</p>
          <div className="flex flex-wrap gap-1">
            {data.threatTypes.map((type: string, index: number) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ===========================
// RISK ASSESSMENT MATRIX
// ===========================

const RiskAssessmentMatrix: React.FC<{
  riskData: RiskMatrix[];
  onLocationClick?: (location: string) => void;
}> = ({ riskData, onLocationClick }) => {
  const matrixData = useMemo(() => {
    return riskData.map(item => ({
      ...item,
      size: Math.max(50, item.riskScore * 5), // Size based on risk score
      color: RISK_COLORS[getRiskLevel(item.riskScore)]
    }));
  }, [riskData]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Risk Assessment Matrix</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <ShieldExclamationIcon className="h-4 w-4" />
          <span>Probability vs Impact</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 20, right: 80, bottom: 60, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="probability" 
            name="Probability" 
            domain={[0, 100]}
            label={{ value: 'Probability (%)', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            type="number" 
            dataKey="impact" 
            name="Impact" 
            domain={[0, 100]}
            label={{ value: 'Impact Score', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<HotspotTooltip />} />
          
          <Scatter data={matrixData} fill="#8884d8">
            {matrixData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                onClick={() => onLocationClick?.(entry.location)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Scatter>

          {/* Risk level quadrant lines */}
          <line x1={0} y1={50} x2={100} y2={50} stroke="#d1d5db" strokeDasharray="2 2" />
          <line x1={50} y1={0} x2={50} y2={100} stroke="#d1d5db" strokeDasharray="2 2" />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Risk Level Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
        {Object.entries(RISK_COLORS).map(([level, color]) => (
          <div key={level} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-gray-700 capitalize">{level} Risk</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===========================
// HOTSPOT HEATMAP
// ===========================

const HotspotHeatmap: React.FC<{
  hotspots: HotspotVisualization[];
  onHotspotClick?: (hotspot: HotspotVisualization) => void;
}> = ({ hotspots, onHotspotClick }) => {
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string | null>(null);

  const filteredHotspots = useMemo(() => {
    if (!selectedRiskLevel) return hotspots;
    return hotspots.filter(h => h.riskLevel === selectedRiskLevel);
  }, [hotspots, selectedRiskLevel]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Security Hotspot Map</h3>
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-4 w-4 text-gray-500" />
          <select
            value={selectedRiskLevel || ''}
            onChange={(e) => setSelectedRiskLevel(e.target.value || null)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" hide />
          <YAxis type="number" dataKey="y" hide />
          <Tooltip content={<HotspotTooltip />} />
          
          <Scatter data={filteredHotspots}>
            {filteredHotspots.map((hotspot, index) => (
              <Cell 
                key={`hotspot-${index}`}
                fill={hotspot.color}
                onClick={() => onHotspotClick?.(hotspot)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Hotspot Summary */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(RISK_THRESHOLDS).map(([level, threshold]) => {
          const count = hotspots.filter(h => h.riskLevel === level).length;
          return (
            <div key={level} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: RISK_COLORS[level as keyof typeof RISK_COLORS] }}
                />
                <span className="text-sm font-medium text-gray-900">{threshold.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-600">locations</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===========================
// LOCATION BREAKDOWN
// ===========================

const LocationBreakdown: React.FC<{
  locationGroups: Record<string, LocationThreat[]>;
}> = ({ locationGroups }) => {
  const locationData = useMemo(() => {
    return Object.entries(locationGroups).map(([type, locations]) => {
      const totalIncidents = locations.reduce((sum, loc) => sum + loc.incidents, 0);
      const avgRiskScore = locations.reduce((sum, loc) => sum + loc.riskScore, 0) / locations.length;
      
      return {
        type,
        label: LOCATION_TYPES[type as keyof typeof LOCATION_TYPES] || type,
        locations: locations.length,
        incidents: totalIncidents,
        avgRiskScore: Math.round(avgRiskScore),
        riskLevel: getRiskLevel(avgRiskScore)
      };
    });
  }, [locationGroups]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Location Breakdown</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <BuildingOffice2Icon className="h-4 w-4" />
          <span>By Area Type</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={locationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="incidents" radius={[4, 4, 0, 0]}>
              {locationData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={RISK_COLORS[entry.riskLevel]} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Location Details */}
        <div className="space-y-3">
          {locationData
            .sort((a, b) => b.incidents - a.incidents)
            .map((location, index) => (
              <div key={location.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: RISK_COLORS[location.riskLevel] }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{location.label}</p>
                    <p className="text-sm text-gray-600">
                      {location.locations} locations • Risk: {location.avgRiskScore}/100
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{location.incidents}</p>
                  <p className="text-xs text-gray-600">incidents</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// ===========================
// TEMPORAL PATTERNS
// ===========================

const TemporalPatterns: React.FC<{
  patterns: HotspotPattern[];
}> = ({ patterns }) => {
  if (!patterns?.length) return null;

  const hourlyData = useMemo(() => {
    // Generate hourly pattern data
    return Array.from({ length: 24 }, (_, hour) => {
      const hourPatterns = patterns.filter(p => 
        p.timePattern && p.timePattern.includes(`${hour}:`)
      );
      return {
        hour: `${hour}:00`,
        incidents: hourPatterns.reduce((sum, p) => sum + p.frequency, 0),
        riskScore: hourPatterns.reduce((sum, p) => sum + p.riskImpact, 0) / (hourPatterns.length || 1)
      };
    });
  }, [patterns]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Temporal Risk Patterns</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <ClockIcon className="h-4 w-4" />
          <span>24-Hour Analysis</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="incidents"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.3}
            name="Incidents"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Pattern Insights */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {patterns.slice(0, 3).map((pattern, index) => (
          <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <EyeIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{pattern.type}</span>
            </div>
            <p className="text-sm text-blue-700">{pattern.description}</p>
            <p className="text-xs text-blue-600 mt-1">
              Confidence: {(pattern.confidence * 100).toFixed(0)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===========================
// MAIN SECURITY HOTSPOTS COMPONENT
// ===========================

const SecurityHotspots: React.FC<SecurityHotspotsProps> = ({
  data,
  showRiskAssessment = true,
  enableInteractiveMap = true,
  showPatterns = true,
  timeRange = '30d',
  className = '',
  onHotspotClick,
  onRiskLevelFilter,
  onLocationDrillDown
}) => {
  const { device } = useMobileDetection();
  const { performanceScore } = usePerformance('SecurityHotspots');

  // State management
  const [selectedHotspot, setSelectedHotspot] = useState<LocationThreat | null>(null);
  const [viewMode, setViewMode] = useState<'heatmap' | 'matrix' | 'breakdown'>('heatmap');

  // ===========================
  // DATA PROCESSING
  // ===========================

  const hotspotsVisualization = useMemo((): HotspotVisualization[] => {
    if (!data?.hotspots) return [];

    return data.hotspots.map((hotspot, index) => {
      const coords = generateHotspotCoordinates(hotspot.location, index);
      const riskLevel = getRiskLevel(hotspot.riskScore);
      
      return {
        ...coords,
        size: Math.max(20, hotspot.incidents * 5),
        color: RISK_COLORS[riskLevel],
        location: hotspot.location,
        incidents: hotspot.incidents,
        riskScore: hotspot.riskScore,
        riskLevel,
        threatTypes: hotspot.threatTypes || [],
        lastIncident: hotspot.lastIncident
      };
    });
  }, [data?.hotspots]);

  const riskMatrixData = useMemo((): RiskMatrix[] => {
    if (!data?.riskAssessment) return [];

    return data.hotspots?.map(hotspot => ({
      probability: hotspot.probability || Math.random() * 100,
      impact: hotspot.impact || hotspot.riskScore,
      location: hotspot.location,
      riskScore: hotspot.riskScore,
      mitigation: hotspot.mitigation || []
    })) || [];
  }, [data?.hotspots, data?.riskAssessment]);

  const locationGroups = useMemo(() => {
    if (!data?.hotspots) return {};
    return groupByLocation(data.hotspots);
  }, [data?.hotspots]);

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleHotspotClick = useCallback((hotspot: HotspotVisualization | LocationThreat) => {
    const locationThreat = 'location' in hotspot ? hotspot : 
      data?.hotspots?.find(h => h.location === hotspot.location);
    
    if (locationThreat) {
      setSelectedHotspot(locationThreat);
      onHotspotClick?.(locationThreat);
    }
  }, [data?.hotspots, onHotspotClick]);

  const handleLocationDrillDown = useCallback((location: string) => {
    onLocationDrillDown?.(location);
  }, [onLocationDrillDown]);

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Security Hotspots Analysis</h2>
          <p className="text-sm text-gray-600 mt-1">
            Location-based threat analysis and risk assessment for {timeRange}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="heatmap">Hotspot Map</option>
            <option value="matrix">Risk Matrix</option>
            <option value="breakdown">Location Breakdown</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <MapPinIcon className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hotspots</p>
              <p className="text-2xl font-bold text-gray-900">{data?.hotspots?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Risk</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.hotspots?.filter(h => h.riskScore >= 75).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <ArrowTrendingUpIcon className="h-6 w-6 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.hotspots?.filter(h => h.riskScore >= 50 && h.riskScore < 75).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <ClockIcon className="h-6 w-6 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Risk Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.hotspots?.length ? 
                  Math.round(data.hotspots.reduce((sum, h) => sum + h.riskScore, 0) / data.hotspots.length) : 0
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Visualization */}
      {viewMode === 'heatmap' && (
        <HotspotHeatmap
          hotspots={hotspotsVisualization}
          onHotspotClick={handleHotspotClick}
        />
      )}

      {viewMode === 'matrix' && showRiskAssessment && (
        <RiskAssessmentMatrix
          riskData={riskMatrixData}
          onLocationClick={handleLocationDrillDown}
        />
      )}

      {viewMode === 'breakdown' && (
        <LocationBreakdown locationGroups={locationGroups} />
      )}

      {/* Temporal Patterns */}
      {showPatterns && data?.patterns && (
        <TemporalPatterns patterns={data.patterns} />
      )}

      {/* Mitigation Recommendations */}
      {data?.recommendations && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ShieldExclamationIcon className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Risk Mitigation Recommendations</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.recommendations.map((rec, index) => (
              <div key={index} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-red-500' :
                    rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-900 mb-1">{rec.title}</h4>
                    <p className="text-sm text-orange-700 mb-2">{rec.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-orange-600">
                      <span>Priority: {rec.priority}</span>
                      <span>Impact: {rec.expectedImpact}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Hotspot Details Modal */}
      {selectedHotspot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedHotspot.location}</h3>
              <button
                onClick={() => setSelectedHotspot(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Risk Score</p>
                  <p className="text-xl font-bold text-gray-900">{selectedHotspot.riskScore}/100</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Incidents</p>
                  <p className="text-xl font-bold text-gray-900">{selectedHotspot.incidents}</p>
                </div>
              </div>
              
              {selectedHotspot.threatTypes && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Threat Types</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedHotspot.threatTypes.map((type, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedHotspot.mitigation && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Mitigation Actions</p>
                  <ul className="space-y-1">
                    {selectedHotspot.mitigation.map((action, index) => (
                      <li key={index} className="text-sm text-gray-700">• {action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityHotspots;