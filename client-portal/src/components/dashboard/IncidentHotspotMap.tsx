// client-portal/src/components/dashboard/IncidentHotspotMap.tsx
/**
 * Incident Hotspot Map Component  
 * ===============================
 * Visual analytics component showing property and location-based incident hotspots
 * Uses Recharts for professional data visualization with interactive features
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ReferenceLine
} from 'recharts';
import { PropertyHotspot, LocationHotspot, DateRange } from '../../types/client.types';

// =================================
// INTERFACES & TYPES
// =================================

interface IncidentHotspotMapProps {
  /** Property hotspot data */
  propertyHotspots: PropertyHotspot[];
  /** Location hotspot data */
  locationHotspots: LocationHotspot[];
  /** Current date range for context */
  dateRange: DateRange;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string;
  /** Optional custom class names */
  className?: string;
}

interface ChartViewMode {
  id: 'property-bar' | 'location-pie' | 'risk-scatter' | 'comparison-table';
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface ProcessedHotspotData {
  propertyData: Array<{
    name: string;
    address: string;
    incidents: number;
    highSeverity: number;
    riskScore: number;
    riskLevel: string;
    confidence: number;
    color: string;
  }>;
  locationData: Array<{
    name: string;
    property: string;
    incidents: number;
    highSeverity: number;
    riskLevel: string;
    color: string;
  }>;
  riskScatterData: Array<{
    name: string;
    incidents: number;
    confidence: number;
    riskScore: number;
    color: string;
  }>;
}

// =================================
// CONSTANTS & CONFIGURATION
// =================================

const RISK_LEVEL_COLORS = {
  low: '#10B981',      // Green-500
  medium: '#F59E0B',   // Amber-500  
  high: '#EF4444',     // Red-500
  critical: '#DC2626'  // Red-600
};

const RISK_LEVEL_LABELS = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'Critical Risk'
};

const CHART_VIEW_MODES: ChartViewMode[] = [
  {
    id: 'property-bar',
    name: 'Property Overview',
    description: 'Incident count by property with severity breakdown',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    id: 'location-pie',
    name: 'Location Breakdown', 
    description: 'Incident distribution by specific locations',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    )
  },
  {
    id: 'risk-scatter',
    name: 'Risk Analysis',
    description: 'Risk correlation between incident count and AI confidence',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    id: 'comparison-table',
    name: 'Detailed Table',
    description: 'Comprehensive data table with all metrics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  }
];

// =================================
// UTILITY FUNCTIONS  
// =================================

/**
 * Calculate risk score based on incidents and severity
 */
const calculateRiskScore = (incidents: number, highSeverity: number, confidence: number): number => {
  const baseScore = incidents * 10;
  const severityMultiplier = highSeverity * 25;
  const confidenceBonus = confidence * 0.5;
  
  return Math.min(100, baseScore + severityMultiplier + confidenceBonus);
};

/**
 * Determine risk level from score
 */
const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
};

/**
 * Process raw hotspot data for visualization
 */
const processHotspotData = (
  propertyHotspots: PropertyHotspot[],
  locationHotspots: LocationHotspot[]
): ProcessedHotspotData => {
  // Process property data
  const propertyData = propertyHotspots.map(property => {
    const riskScore = calculateRiskScore(
      property.incidentCount,
      property.highSeverityCount,
      property.avgConfidence
    );
    const riskLevel = getRiskLevel(riskScore);
    
    return {
      name: property.propertyName.length > 20 
        ? property.propertyName.substring(0, 20) + '...' 
        : property.propertyName,
      address: property.propertyAddress,
      incidents: property.incidentCount,
      highSeverity: property.highSeverityCount,
      riskScore,
      riskLevel,
      confidence: property.avgConfidence,
      color: RISK_LEVEL_COLORS[riskLevel]
    };
  });

  // Process location data  
  const locationData = locationHotspots.map(location => ({
    name: location.location,
    property: location.propertyName,
    incidents: location.incidentCount,
    highSeverity: location.highSeverityCount,
    riskLevel: location.riskLevel,
    color: RISK_LEVEL_COLORS[location.riskLevel]
  }));

  // Process risk scatter data
  const riskScatterData = propertyHotspots.map(property => {
    const riskScore = calculateRiskScore(
      property.incidentCount,
      property.highSeverityCount, 
      property.avgConfidence
    );
    
    return {
      name: property.propertyName,
      incidents: property.incidentCount,
      confidence: property.avgConfidence,
      riskScore,
      color: RISK_LEVEL_COLORS[getRiskLevel(riskScore)]
    };
  });

  return { propertyData, locationData, riskScatterData };
};

/**
 * Custom tooltip for charts
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <h3 className="font-semibold text-gray-900 mb-2">{label || data.name}</h3>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium text-gray-900">{entry.value}</span>
          </div>
        ))}
        {data.address && (
          <p className="text-xs text-gray-500 mt-2">{data.address}</p>
        )}
      </div>
    );
  }
  return null;
};

// =================================
// CHART COMPONENTS
// =================================

const PropertyBarChart: React.FC<{ data: any[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={400}>
    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis 
        dataKey="name" 
        angle={-45}
        textAnchor="end"
        height={80}
        fontSize={12}
        stroke="#666"
      />
      <YAxis stroke="#666" fontSize={12} />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Bar 
        dataKey="incidents" 
        name="Total Incidents"
        fill="#3B82F6"
        radius={[2, 2, 0, 0]}
      />
      <Bar 
        dataKey="highSeverity" 
        name="High Severity"
        fill="#EF4444"
        radius={[2, 2, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
);

const LocationPieChart: React.FC<{ data: any[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={400}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, incidents }) => `${name}: ${incidents}`}
        outerRadius={120}
        fill="#8884d8"
        dataKey="incidents"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
);

const RiskScatterChart: React.FC<{ data: any[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={400}>
    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis 
        type="number" 
        dataKey="incidents" 
        name="Incidents"
        stroke="#666"
        fontSize={12}
      />
      <YAxis 
        type="number" 
        dataKey="confidence" 
        name="AI Confidence"
        stroke="#666" 
        fontSize={12}
        domain={[0, 100]}
      />
      <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
      <Scatter name="Properties" data={data} fill="#8884d8">
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Scatter>
      <ReferenceLine y={85} stroke="#10B981" strokeDasharray="5 5" label="High Confidence" />
      <ReferenceLine x={10} stroke="#F59E0B" strokeDasharray="5 5" label="High Activity" />
    </ScatterChart>
  </ResponsiveContainer>
);

const DetailedTable: React.FC<{ propertyData: any[]; locationData: any[] }> = ({ 
  propertyData, 
  locationData 
}) => (
  <div className="space-y-8">
    {/* Property Table */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Hotspots</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Incidents</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">High Severity</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">AI Confidence</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {propertyData.map((property, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">{property.name}</div>
                    <div className="text-sm text-gray-500">{property.address}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-medium text-gray-900">
                  {property.incidents}
                </td>
                <td className="px-4 py-3 text-center font-medium text-red-600">
                  {property.highSeverity}
                </td>
                <td className="px-4 py-3 text-center font-medium text-gray-900">
                  {property.confidence.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-center">
                  <span 
                    className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    style={{ 
                      backgroundColor: `${property.color}20`, 
                      color: property.color 
                    }}
                  >
                    {RISK_LEVEL_LABELS[property.riskLevel as keyof typeof RISK_LEVEL_LABELS]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Location Table */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Hotspots</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Incidents</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">High Severity</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {locationData.map((location, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{location.name}</td>
                <td className="px-4 py-3 text-gray-600">{location.property}</td>
                <td className="px-4 py-3 text-center font-medium text-gray-900">
                  {location.incidents}
                </td>
                <td className="px-4 py-3 text-center font-medium text-red-600">
                  {location.highSeverity}
                </td>
                <td className="px-4 py-3 text-center">
                  <span 
                    className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    style={{ 
                      backgroundColor: `${location.color}20`, 
                      color: location.color 
                    }}
                  >
                    {RISK_LEVEL_LABELS[location.riskLevel as keyof typeof RISK_LEVEL_LABELS]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// =================================
// MAIN COMPONENT
// =================================

export const IncidentHotspotMap: React.FC<IncidentHotspotMapProps> = ({
  propertyHotspots,
  locationHotspots,
  dateRange,
  isLoading = false,
  error,
  className = ''
}) => {
  const [activeView, setActiveView] = useState<ChartViewMode['id']>('property-bar');

  // Process data for visualization
  const processedData = useMemo(() => 
    processHotspotData(propertyHotspots, locationHotspots),
    [propertyHotspots, locationHotspots]
  );

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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Analytics</h3>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className={`apex-card ${className}`}>
        <div className="apex-card-body p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-64"></div>
            <div className="h-4 bg-gray-200 rounded mb-8 w-96"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // No Data State
  if (propertyHotspots.length === 0 && locationHotspots.length === 0) {
    return (
      <div className={`apex-card ${className}`}>
        <div className="apex-card-body p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Hotspot Data Available</h3>
          <p className="text-sm text-gray-600">
            No incident hotspots found for the selected time period. This could indicate excellent security performance.
          </p>
        </div>
      </div>
    );
  }

  const currentView = CHART_VIEW_MODES.find(mode => mode.id === activeView);

  return (
    <div className={`apex-card ${className}`}>
      <div className="apex-card-header border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Security Hotspot Analysis
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Visual analytics of incident patterns and risk areas
            </p>
          </div>

          {/* View Mode Selector */}
          <div className="flex space-x-2">
            {CHART_VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveView(mode.id)}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${activeView === mode.id
                    ? 'bg-apex-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
                title={mode.description}
              >
                {mode.icon}
                <span className="hidden sm:inline">{mode.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="apex-card-body p-6">
        {/* Current View Description */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-apex-blue-500">
          <p className="text-sm text-gray-700">
            <strong>{currentView?.name}:</strong> {currentView?.description}
          </p>
        </div>

        {/* Chart Content */}
        <div className="min-h-[400px]">
          {activeView === 'property-bar' && (
            <PropertyBarChart data={processedData.propertyData} />
          )}
          {activeView === 'location-pie' && (
            <LocationPieChart data={processedData.locationData} />
          )}
          {activeView === 'risk-scatter' && (
            <RiskScatterChart data={processedData.riskScatterData} />
          )}
          {activeView === 'comparison-table' && (
            <DetailedTable 
              propertyData={processedData.propertyData}
              locationData={processedData.locationData}
            />
          )}
        </div>

        {/* Summary Statistics */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {propertyHotspots.length}
              </div>
              <div className="text-sm text-gray-600">Properties</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {locationHotspots.length}
              </div>
              <div className="text-sm text-gray-600">Locations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {processedData.propertyData.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length}
              </div>
              <div className="text-sm text-gray-600">High Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-apex-blue-600">
                {Math.round(processedData.propertyData.reduce((acc, p) => acc + p.confidence, 0) / processedData.propertyData.length)}%
              </div>
              <div className="text-sm text-gray-600">Avg Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {processedData.propertyData.reduce((acc, p) => acc + p.incidents, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Incidents</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentHotspotMap;