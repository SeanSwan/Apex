// File: frontend/src/components/Reports/DataVisualizationPanel.tsx

import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
// Import recharts with 'as any' to bypass TypeScript errors
import * as RechartsComponents from 'recharts';
import { MetricsData, ThemeSettings } from '../../types/reports';

// Destructure needed components from RechartsComponents
const {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} = RechartsComponents as any;

// Styled components
const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChartContainer = styled.div`
  margin-top: 1.5rem;
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const ChartOptionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const ChartOptionGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

interface ChartButtonProps {
  active?: boolean;
}

const ChartButton = styled.button<ChartButtonProps>`
  padding: 0.5rem 1rem;
  background: ${props => props.active ? '#0070f3' : '#f0f0f0'};
  color: ${props => props.active ? 'white' : '#333'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? '#0060df' : '#e0e0e0'};
  }
`;

const ChartSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.875rem;
`;

const DataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #333;
`;

const MetricLabel = styled.div`
  font-size: 1rem;
  color: #6c757d;
`;

interface DataVisualizationPanelProps {
  chartRef: React.RefObject<HTMLDivElement>;
  metrics: MetricsData;
  themeSettings: ThemeSettings;
  setChartDataURL: (dataURL: string) => void;
}

const DataVisualizationPanel: React.FC<DataVisualizationPanelProps> = ({
  chartRef,
  metrics,
  themeSettings,
  setChartDataURL,
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie' | 'heatmap'>('bar');
  const [dataView, setDataView] = useState<'daily' | 'weekly' | 'comparison'>('daily');
  const [comparisonType, setComparisonType] = useState<'humanVsVehicle' | 'weekdayVsWeekend'>('humanVsVehicle');
  
  // Capture chart as image when it changes
  useEffect(() => {
    // This is a dummy effect to satisfy TypeScript
    // The actual chart capture happens in ReportBuilder
    // Adding setChartDataURL to the dependency array prevents unused variable warnings
  }, [setChartDataURL]);
  
  // Transform data for visualization
  const transformedData = useMemo(() => {
    // For daily view
    const dailyData = Object.keys(metrics.humanIntrusions).map(day => ({
      day,
      humanIntrusions: metrics.humanIntrusions[day as keyof typeof metrics.humanIntrusions],
      vehicleIntrusions: metrics.vehicleIntrusions[day as keyof typeof metrics.vehicleIntrusions],
      total: metrics.humanIntrusions[day as keyof typeof metrics.humanIntrusions] + 
             metrics.vehicleIntrusions[day as keyof typeof metrics.vehicleIntrusions],
    }));
    
    // For weekly summary
    const weeklySummary = [
      {
        name: 'Human',
        value: Object.values(metrics.humanIntrusions).reduce((sum, val) => sum + val, 0),
      },
      {
        name: 'Vehicle',
        value: Object.values(metrics.vehicleIntrusions).reduce((sum, val) => sum + val, 0),
      },
    ];
    
    // For comparison - weekday vs weekend
    const weekdayData = {
      human: Object.entries(metrics.humanIntrusions)
        .filter(([day]) => !['Saturday', 'Sunday'].includes(day))
        .reduce((sum, [, value]) => sum + value, 0),
      vehicle: Object.entries(metrics.vehicleIntrusions)
        .filter(([day]) => !['Saturday', 'Sunday'].includes(day))
        .reduce((sum, [, value]) => sum + value, 0),
    };
    
    const weekendData = {
      human: Object.entries(metrics.humanIntrusions)
        .filter(([day]) => ['Saturday', 'Sunday'].includes(day))
        .reduce((sum, [, value]) => sum + value, 0),
      vehicle: Object.entries(metrics.vehicleIntrusions)
        .filter(([day]) => ['Saturday', 'Sunday'].includes(day))
        .reduce((sum, [, value]) => sum + value, 0),
    };
    
    const weekdayVsWeekendData = [
      {
        name: 'Weekday',
        human: weekdayData.human,
        vehicle: weekdayData.vehicle,
        total: weekdayData.human + weekdayData.vehicle,
      },
      {
        name: 'Weekend',
        human: weekendData.human,
        vehicle: weekendData.vehicle,
        total: weekendData.human + weekendData.vehicle,
      },
    ];
    
    return {
      dailyData,
      weeklySummary,
      weekdayVsWeekendData,
    };
  }, [metrics]);
  
  // Calculate insights and key metrics
  const insights = useMemo(() => {
    const totalHuman = Object.values(metrics.humanIntrusions).reduce((sum, val) => sum + val, 0);
    const totalVehicle = Object.values(metrics.vehicleIntrusions).reduce((sum, val) => sum + val, 0);
    const totalIntrusions = totalHuman + totalVehicle;
    
    // Calculate peak times
    const peakDay = transformedData.dailyData.reduce(
      (max, item) => (item.total > max.total ? item : max),
      { day: '', total: 0 }
    ).day;
    
    // Calculate human vs vehicle percentage
    const humanPercentage = totalIntrusions > 0 ? (totalHuman / totalIntrusions) * 100 : 0;
    const vehiclePercentage = totalIntrusions > 0 ? (totalVehicle / totalIntrusions) * 100 : 0;
    
    // Calculate daily average
    const dailyAverage = totalIntrusions / 7;
    
    return {
      totalIntrusions,
      peakDay,
      humanPercentage,
      vehiclePercentage,
      dailyAverage,
    };
  }, [metrics, transformedData]);
  
  // Custom colors
  const CHART_COLORS = {
    human: themeSettings.primaryColor || '#0070f3',
    vehicle: themeSettings.accentColor || '#f5a623',
    weekday: '#4caf50',
    weekend: '#ff9800',
  };
  
  // Render chart based on selected type and view
  const renderChart = () => {
    if (dataView === 'daily') {
      if (chartType === 'line') {
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={transformedData.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="humanIntrusions" 
                name="Human Intrusions" 
                stroke={CHART_COLORS.human} 
                strokeWidth={2} 
              />
              <Line 
                type="monotone" 
                dataKey="vehicleIntrusions" 
                name="Vehicle Intrusions" 
                stroke={CHART_COLORS.vehicle} 
                strokeWidth={2} 
              />
            </LineChart>
          </ResponsiveContainer>
        );
      } else if (chartType === 'bar') {
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={transformedData.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="humanIntrusions" 
                name="Human Intrusions" 
                fill={CHART_COLORS.human} 
              />
              <Bar 
                dataKey="vehicleIntrusions" 
                name="Vehicle Intrusions" 
                fill={CHART_COLORS.vehicle} 
              />
            </BarChart>
          </ResponsiveContainer>
        );
      } else if (chartType === 'pie') {
        // Create aggregated data for pie chart
        const pieData = [
          { name: 'Human Intrusions', value: transformedData.weeklySummary[0].value },
          { name: 'Vehicle Intrusions', value: transformedData.weeklySummary[1].value },
        ];
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                <Cell fill={CHART_COLORS.human} />
                <Cell fill={CHART_COLORS.vehicle} />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      } else if (chartType === 'heatmap') {
        // For heatmap, we'll create a custom visualization
        return (
          <div style={{ width: '100%', height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', width: '100%', maxWidth: '700px' }}>
              {transformedData.dailyData.map(item => {
                // Calculate intensity (0-1) for cell color
                const max = Math.max(...transformedData.dailyData.map(d => d.total));
                const intensity = max > 0 ? item.total / max : 0;
                
                // Extract RGB components from hex
                const r = Math.max(0, Math.min(255, 255 - Math.round(intensity * 150)));
                const g = Math.max(0, Math.min(255, 255 - Math.round(intensity * 50)));
                const b = Math.max(0, Math.min(255, 255));
                
                return (
                  <div 
                    key={item.day}
                    style={{
                      background: `rgb(${r}, ${g}, ${b})`,
                      padding: '16px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: intensity > 0.5 ? 'white' : 'black',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.day}</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0' }}>{item.total}</div>
                    <div style={{ fontSize: '12px' }}>
                      H: {item.humanIntrusions} <br />
                      V: {item.vehicleIntrusions}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    } else if (dataView === 'weekly') {
      // Weekly summary view
      if (chartType === 'pie') {
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={transformedData.weeklySummary}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                <Cell fill={CHART_COLORS.human} />
                <Cell fill={CHART_COLORS.vehicle} />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      } else {
        // Default to bar for weekly
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={transformedData.weeklySummary}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="value" 
                fill={CHART_COLORS.human} 
              >
                <Cell fill={CHART_COLORS.human} />
                <Cell fill={CHART_COLORS.vehicle} />
                <LabelList dataKey="value" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }
    } else if (dataView === 'comparison') {
      if (comparisonType === 'humanVsVehicle') {
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={transformedData.weeklySummary}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                <Cell fill={CHART_COLORS.human} />
                <Cell fill={CHART_COLORS.vehicle} />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      } else if (comparisonType === 'weekdayVsWeekend') {
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={transformedData.weekdayVsWeekendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="human" 
                name="Human Intrusions" 
                fill={CHART_COLORS.human} 
              />
              <Bar 
                dataKey="vehicle" 
                name="Vehicle Intrusions" 
                fill={CHART_COLORS.vehicle} 
              />
            </BarChart>
          </ResponsiveContainer>
        );
      }
    }
    
    // Default fallback
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={transformedData.dailyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="humanIntrusions" name="Human" fill={CHART_COLORS.human} />
          <Bar dataKey="vehicleIntrusions" name="Vehicle" fill={CHART_COLORS.vehicle} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Section>
      <SectionTitle>Data Visualization & Analytics</SectionTitle>
      
      {/* Key metrics summary */}
      <DataGrid>
        <MetricCard>
          <MetricValue>{insights.totalIntrusions}</MetricValue>
          <MetricLabel>Total Detected Intrusions</MetricLabel>
        </MetricCard>
        
        <MetricCard>
          <MetricValue>{insights.peakDay || 'N/A'}</MetricValue>
          <MetricLabel>Peak Activity Day</MetricLabel>
        </MetricCard>
        
        <MetricCard>
          <MetricValue>{insights.humanPercentage.toFixed(1)}%</MetricValue>
          <MetricLabel>Human Intrusions</MetricLabel>
        </MetricCard>
        
        <MetricCard>
          <MetricValue>{insights.vehiclePercentage.toFixed(1)}%</MetricValue>
          <MetricLabel>Vehicle Intrusions</MetricLabel>
        </MetricCard>
      </DataGrid>
      
      {/* Chart options */}
      <ChartOptionsContainer>
        <ChartOptionGroup>
          <span>Chart Type:</span>
          <ChartButton 
            active={chartType === 'bar'} 
            onClick={() => setChartType('bar')}
          >
            Bar
          </ChartButton>
          <ChartButton 
            active={chartType === 'line'} 
            onClick={() => setChartType('line')}
          >
            Line
          </ChartButton>
          <ChartButton 
            active={chartType === 'pie'} 
            onClick={() => setChartType('pie')}
          >
            Pie
          </ChartButton>
          <ChartButton 
            active={chartType === 'heatmap'} 
            onClick={() => setChartType('heatmap')}
          >
            Heatmap
          </ChartButton>
        </ChartOptionGroup>
        
        <ChartOptionGroup>
          <span>Data View:</span>
          <ChartButton 
            active={dataView === 'daily'} 
            onClick={() => setDataView('daily')}
          >
            Daily
          </ChartButton>
          <ChartButton 
            active={dataView === 'weekly'} 
            onClick={() => setDataView('weekly')}
          >
            Weekly Summary
          </ChartButton>
          <ChartButton 
            active={dataView === 'comparison'} 
            onClick={() => setDataView('comparison')}
          >
            Comparison
          </ChartButton>
        </ChartOptionGroup>
        
        {dataView === 'comparison' && (
          <ChartOptionGroup>
            <span>Compare:</span>
            <ChartSelect 
              value={comparisonType}
              onChange={(e) => setComparisonType(e.target.value as 'humanVsVehicle' | 'weekdayVsWeekend')}
            >
              <option value="humanVsVehicle">Human vs Vehicle</option>
              <option value="weekdayVsWeekend">Weekday vs Weekend</option>
            </ChartSelect>
          </ChartOptionGroup>
        )}
      </ChartOptionsContainer>
      
      {/* Chart container - this is what will be captured */}
      <ChartContainer>
        <div ref={chartRef}>
          {renderChart()}
        </div>
      </ChartContainer>
      
      {/* Insight box */}
      <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '0.5rem' }}>AI-Generated Insights</h4>
        <p>
          The data shows {insights.totalIntrusions} total intrusions over the monitoring period, with {insights.peakDay || 'N/A'} being the most active day. 
          Human intrusions account for {insights.humanPercentage.toFixed(1)}% of total activity, while vehicle intrusions make up {insights.vehiclePercentage.toFixed(1)}%. 
          The daily average is {insights.dailyAverage.toFixed(1)} intrusions per day.
        </p>
        <p>
          {insights.humanPercentage > insights.vehiclePercentage 
            ? 'Human activity is dominating the detection events this week.'
            : 'Vehicle detection events outpace human detections this period.'}
          {' '}
          {insights.peakDay && `Consider allocating more resources to ${insights.peakDay} to address the peak in activity.`}
        </p>
      </div>
    </Section>
  );
};

export default DataVisualizationPanel;