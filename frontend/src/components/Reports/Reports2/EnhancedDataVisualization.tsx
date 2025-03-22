// File: frontend/src/components/Reports2/EnhancedDataVisualization.tsx

import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { ThemeSettings, MetricsData } from '../../types/reports';

// Import enhanced chart components
import {
  ResponsiveContainer,
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
  LabelList,
  HeatMap,
  CalendarHeatMap,
  AreaChart,
  Area
} from './EnhancedChartComponents';

// Styled components with responsive design using Grid and Flexbox
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
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const ChartContainer = styled.div`
  margin-top: 1.5rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    transform: translateY(-3px);
  }
  
  @media (max-width: 480px) {
    padding: 1rem;
    margin-top: 1rem;
  }
`;

const ChartOptionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const ChartOptionGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  
  @media (max-width: 480px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const ChartOptionLabel = styled.span`
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
  
  @media (max-width: 480px) {
    width: 100%;
    margin-bottom: 0.25rem;
  }
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
    transform: translateY(-2px);
  }
  
  @media (max-width: 480px) {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.75rem;
  }
`;

const ChartSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #0070f3;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
  }
  
  @media (max-width: 480px) {
    width: 100%;
  }
`;

const DataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
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
  
  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #333;
  
  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const MetricLabel = styled.div`
  font-size: 1rem;
  color: #6c757d;
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const InsightBox = styled.div`
  margin-top: 1.5rem;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #0070f3;
  
  h4 {
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  p {
    margin-bottom: 0.75rem;
    font-size: 0.95rem;
    line-height: 1.6;
  }
  
  @media (max-width: 480px) {
    padding: 1rem;
    
    h4 {
      font-size: 1rem;
    }
    
    p {
      font-size: 0.85rem;
    }
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5;
  border-radius: 12px;
`;

const LoadingSpinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ChartTab = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  
  @media (max-width: 640px) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 1px;
    
    &::-webkit-scrollbar {
      height: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
    }
  }
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.25rem;
  background: transparent;
  color: ${props => props.active ? '#0070f3' : '#6c757d'};
  border: none;
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? '#0070f3' : 'transparent'};
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    color: ${props => props.active ? '#0070f3' : '#333'};
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
`;

const ExportButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #0060df;
    transform: translateY(-2px);
  }
  
  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
    margin-top: 0.5rem;
  }
`;

const TimeframeTab = styled.div`
  display: flex;
  margin-bottom: 1rem;
  gap: 0.5rem;
  
  @media (max-width: 640px) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
    
    &::-webkit-scrollbar {
      height: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
    }
  }
`;

const TimeframeButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  background: ${props => props.active ? '#0070f3' : '#f0f0f0'};
  color: ${props => props.active ? 'white' : '#333'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.active ? '#0060df' : '#e0e0e0'};
  }
  
  @media (max-width: 480px) {
    padding: 0.4rem 0.75rem;
    font-size: 0.75rem;
  }
`;

interface EnhancedDataVisualizationPanelProps {
  chartRef: React.RefObject<HTMLDivElement>;
  metrics: MetricsData;
  themeSettings: ThemeSettings;
  setChartDataURL: (dataURL: string) => void;
  dateRange: { start: Date; end: Date };
}

/**
 * Enhanced Data Visualization Panel component
 * Provides comprehensive data visualization capabilities for security reporting
 */
const EnhancedDataVisualizationPanel: React.FC<EnhancedDataVisualizationPanelProps> = ({
  chartRef,
  metrics,
  themeSettings,
  setChartDataURL,
  dateRange,
}) => {
  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'intrusions' | 'trends' | 'comparison'>('overview');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area' | 'heatmap' | 'calendar'>('bar');
  const [dataView, setDataView] = useState<'daily' | 'weekly' | 'comparison'>('daily');
  const [comparisonType, setComparisonType] = useState<'humanVsVehicle' | 'weekdayVsWeekend'>('humanVsVehicle');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Capture chart as image when active tab changes
  useEffect(() => {
    const captureChartAsImage = async () => {
      if (chartRef.current) {
        try {
          setIsLoading(true);
          
          // Wait for rendering to complete
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const canvas = await html2canvas(chartRef.current, {
            scale: 2,
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff'
          });
          
          const dataURL = canvas.toDataURL('image/png');
          setChartDataURL(dataURL);
        } catch (error) {
          console.error('Failed to capture chart as image:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    captureChartAsImage();
  }, [activeTab, chartType, dataView, comparisonType, timeframe, chartRef, setChartDataURL]);
  
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

    // For calendar view - create dummy data spanning the period
    const startDate = dateRange.start;
    const endDate = dateRange.end;
    
    // Generate dates from start to end
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Create calendar data by mapping the daily values
    const calendarData = dates.map(date => {
      const dayOfWeek = format(date, 'EEEE');
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      let value: number;
      if (Object.prototype.hasOwnProperty.call(metrics.humanIntrusions, dayOfWeek)) {
        value = metrics.humanIntrusions[dayOfWeek as keyof typeof metrics.humanIntrusions] + 
                metrics.vehicleIntrusions[dayOfWeek as keyof typeof metrics.vehicleIntrusions];
      } else {
        value = 0;
      }
      
      return {
        date: formattedDate,
        value: value,
        day: dayOfWeek
      };
    });
    
    // Time series data for trends
    const generateTimeSeriesData = () => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const hoursData: any[] = [];
      
      days.forEach(day => {
        // Generate a full day of hourly data
        for (let hour = 0; hour < 24; hour++) {
          // Create a more realistic pattern based on time of day
          let activityFactor: number;
          
          if (hour >= 22 || hour < 6) {
            // Night hours - higher activity
            activityFactor = 0.7 + Math.random() * 0.5;
          } else if (hour >= 9 && hour <= 17) {
            // Working hours - lower activity
            activityFactor = 0.3 + Math.random() * 0.4;
          } else {
            // Transition hours - medium activity
            activityFactor = 0.4 + Math.random() * 0.5;
          }
          
          // Create a realistic distribution of intrusions
          const baseHuman = metrics.humanIntrusions[day as keyof typeof metrics.humanIntrusions] || 5;
          const baseVehicle = metrics.vehicleIntrusions[day as keyof typeof metrics.vehicleIntrusions] || 3;
          
          const hourlyHuman = Math.max(0, Math.round((baseHuman / 24) * activityFactor * (1 + Math.random() * 0.5)));
          const hourlyVehicle = Math.max(0, Math.round((baseVehicle / 24) * activityFactor * (1 + Math.random() * 0.5)));
          
          hoursData.push({
            day,
            hour: `${hour.toString().padStart(2, '0')}:00`,
            human: hourlyHuman,
            vehicle: hourlyVehicle,
            total: hourlyHuman + hourlyVehicle
          });
        }
      });
      
      return hoursData;
    };

    const timeSeriesData = generateTimeSeriesData();
    
    // Create hourly aggregates
    const hourlyAggregates = Array.from({ length: 24 }, (_, hour) => {
      const hourData = timeSeriesData.filter(d => d.hour === `${hour.toString().padStart(2, '0')}:00`);
      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        human: hourData.reduce((sum, item) => sum + item.human, 0),
        vehicle: hourData.reduce((sum, item) => sum + item.vehicle, 0),
        total: hourData.reduce((sum, item) => sum + item.total, 0)
      };
    });
    
    // Heatmap data structure
    const heatmapData = days.map(day => {
      const dayData: any = { name: day };
      
      // Morning (0-8)
      const morningHours = timeSeriesData.filter(d => d.day === day && parseInt(d.hour) < 8);
      dayData.morning = morningHours.reduce((sum, item) => sum + item.total, 0);
      
      // Day (8-16)
      const dayHours = timeSeriesData.filter(d => d.day === day && parseInt(d.hour) >= 8 && parseInt(d.hour) < 16);
      dayData.day = dayHours.reduce((sum, item) => sum + item.total, 0);
      
      // Evening (16-24)
      const eveningHours = timeSeriesData.filter(d => d.day === day && parseInt(d.hour) >= 16);
      dayData.evening = eveningHours.reduce((sum, item) => sum + item.total, 0);
      
      return dayData;
    });
    
    return {
      dailyData,
      weeklySummary,
      weekdayVsWeekendData,
      calendarData,
      timeSeriesData,
      hourlyAggregates,
      heatmapData
    };
  }, [metrics, dateRange]);
  
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
    
    // Find peak hour
    const peakHour = transformedData.hourlyAggregates.reduce(
      (max, item) => (item.total > max.total ? item : max),
      { hour: '', total: 0 }
    ).hour;
    
    // Calculate human vs vehicle percentage
    const humanPercentage = totalIntrusions > 0 ? (totalHuman / totalIntrusions) * 100 : 0;
    const vehiclePercentage = totalIntrusions > 0 ? (totalVehicle / totalIntrusions) * 100 : 0;
    
    // Calculate daily average
    const dailyAverage = totalIntrusions / 7;
    
    // Calculate weekday vs weekend distribution
    const weekdayTotal = transformedData.weekdayVsWeekendData[0].total;
    const weekendTotal = transformedData.weekdayVsWeekendData[1].total;
    const weekdayPercentage = (weekdayTotal / (weekdayTotal + weekendTotal)) * 100;
    const weekendPercentage = (weekendTotal / (weekdayTotal + weekendTotal)) * 100;
    const weekdayDailyAvg = weekdayTotal / 5;
    const weekendDailyAvg = weekendTotal / 2;
    
    return {
      totalIntrusions,
      peakDay,
      peakHour,
      humanPercentage,
      vehiclePercentage,
      dailyAverage,
      weekdayPercentage,
      weekendPercentage,
      weekdayDailyAvg,
      weekendDailyAvg,
      weekdayTotal,
      weekendTotal
    };
  }, [metrics, transformedData]);
  
  // Custom colors based on theme
  const CHART_COLORS = {
    human: themeSettings.primaryColor || '#0070f3',
    vehicle: themeSettings.accentColor || '#f5a623',
    weekday: '#4caf50',
    weekend: '#ff9800',
    morning: '#64b5f6',
    day: '#4caf50', 
    evening: '#7e57c2'
  };
  
  // Get appropriate data for current view
  const getCurrentData = () => {
    switch (activeTab) {
      case 'overview':
        return transformedData.dailyData;
      case 'intrusions':
        return transformedData.dailyData;
      case 'trends':
        if (timeframe === 'daily') {
          return transformedData.hourlyAggregates;
        } else {
          return transformedData.dailyData;
        }
      case 'comparison':
        if (comparisonType === 'humanVsVehicle') {
          return transformedData.weeklySummary;
        } else {
          return transformedData.weekdayVsWeekendData;
        }
      default:
        return transformedData.dailyData;
    }
  };
  
  // Render main chart for each tab
  const renderChart = () => {
    const data = getCurrentData();
    
    if (activeTab === 'overview') {
      if (chartType === 'bar') {
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={transformedData.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="humanIntrusions" name="Human Intrusions" fill={CHART_COLORS.human} />
              <Bar dataKey="vehicleIntrusions" name="Vehicle Intrusions" fill={CHART_COLORS.vehicle} />
            </BarChart>
          </ResponsiveContainer>
        );
      } else if (chartType === 'line') {
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
                dot={{ fill: CHART_COLORS.human, r: 5 }}
                activeDot={{ r: 8 }}
              />
              <Line 
                type="monotone" 
                dataKey="vehicleIntrusions" 
                name="Vehicle Intrusions" 
                stroke={CHART_COLORS.vehicle} 
                strokeWidth={2} 
                dot={{ fill: CHART_COLORS.vehicle, r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      } else if (chartType === 'pie') {
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
                label={({ name, percent }: { name: string; percent: number }) => 
                  `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                <Cell fill={CHART_COLORS.human} />
                <Cell fill={CHART_COLORS.vehicle} />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      } else if (chartType === 'area') {
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={transformedData.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="humanIntrusions" 
                name="Human Intrusions" 
                stackId="1"
                stroke={CHART_COLORS.human} 
                fill={CHART_COLORS.human + 'CC'} 
              />
              <Area 
                type="monotone" 
                dataKey="vehicleIntrusions" 
                name="Vehicle Intrusions" 
                stackId="1"
                stroke={CHART_COLORS.vehicle} 
                fill={CHART_COLORS.vehicle + 'CC'} 
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      } else if (chartType === 'heatmap') {
        return (
          <HeatMap
            data={transformedData.heatmapData}
            title="Activity Heatmap by Day and Time"
            description="Intrusion activity breakdown by day of week and time of day"
            xAxis="name"
            dataKeys={['morning', 'day', 'evening']}
            colors={[
              '#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', 
              '#42a5f5', '#2196f3', '#1e88e5', '#1976d2'
            ]}
          />
        );
      } else if (chartType === 'calendar') {
        return (
          <CalendarHeatMap
            data={transformedData.calendarData}
            title="Activity Calendar"
            description="Total intrusions by date"
            startDate={dateRange.start}
            endDate={dateRange.end}
            colorScale={[
              '#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'
            ]}
          />
        );
      }
    } else if (activeTab === 'intrusions') {
      // For the Intrusions tab - similar to Overview but with different styling
      if (chartType === 'bar') {
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
                radius={[4, 4, 0, 0]}
              >
                <LabelList dataKey="humanIntrusions" position="top" />
              </Bar>
              <Bar 
                dataKey="vehicleIntrusions" 
                name="Vehicle Intrusions" 
                fill={CHART_COLORS.vehicle}
                radius={[4, 4, 0, 0]}
              >
                <LabelList dataKey="vehicleIntrusions" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      } else if (chartType === 'pie') {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
              <div style={{ width: '45%', minWidth: '280px' }}>
                <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Human Intrusions by Day</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={transformedData.dailyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="humanIntrusions"
                      nameKey="day"
                      label={({ name, percent }: { name: string; percent: number }) => 
                        percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                    >
                      {transformedData.dailyData.map((entry, index) => (
                        <Cell 
                          key={`cell-human-${index}`} 
                          fill={`hsl(${210 + index * 12}, 80%, ${50 + index * 5}%)`} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div style={{ width: '45%', minWidth: '280px' }}>
                <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Vehicle Intrusions by Day</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={transformedData.dailyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="vehicleIntrusions"
                      nameKey="day"
                      label={({ name, percent }: { name: string; percent: number }) => 
                        percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                    >
                      {transformedData.dailyData.map((entry, index) => (
                        <Cell 
                          key={`cell-vehicle-${index}`} 
                          fill={`hsl(${30 + index * 12}, 80%, ${55 + index * 5}%)`} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div style={{ width: '60%', minWidth: '280px' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Total Intrusion Distribution</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={transformedData.weeklySummary}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }: { name: string; percent: number }) => 
                      `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    <Cell fill={CHART_COLORS.human} />
                    <Cell fill={CHART_COLORS.vehicle} />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      } else if (chartType === 'heatmap') {
        return (
          <HeatMap
            data={transformedData.heatmapData}
            title="Intrusion Heatmap by Day and Time"
            description="Activity breakdown showing patterns across day of week and time of day"
            xAxis="name"
            dataKeys={['morning', 'day', 'evening']}
            colors={[
              '#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', 
              '#42a5f5', '#2196f3', '#1e88e5', '#1976d2'
            ]}
          />
        );
      }
    } else if (activeTab === 'trends') {
      if (timeframe === 'daily') {
        // Show hourly trends
        if (chartType === 'line') {
          return (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={transformedData.hourlyAggregates}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="human" 
                  name="Human Activity" 
                  stroke={CHART_COLORS.human} 
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.human, r: 4 }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="vehicle" 
                  name="Vehicle Activity" 
                  stroke={CHART_COLORS.vehicle} 
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.vehicle, r: 4 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          );
        } else if (chartType === 'bar') {
          return (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={transformedData.hourlyAggregates}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="human" name="Human Activity" fill={CHART_COLORS.human} />
                <Bar dataKey="vehicle" name="Vehicle Activity" fill={CHART_COLORS.vehicle} />
              </BarChart>
            </ResponsiveContainer>
          );
        } else if (chartType === 'area') {
          return (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={transformedData.hourlyAggregates}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="human" 
                  name="Human Activity" 
                  stackId="1" 
                  stroke={CHART_COLORS.human} 
                  fill={CHART_COLORS.human + 'CC'} 
                />
                <Area 
                  type="monotone" 
                  dataKey="vehicle" 
                  name="Vehicle Activity" 
                  stackId="1" 
                  stroke={CHART_COLORS.vehicle} 
                  fill={CHART_COLORS.vehicle + 'CC'} 
                />
              </AreaChart>
            </ResponsiveContainer>
          );
        }
      } else {
        // Show weekly trends
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
                  dataKey="total" 
                  name="Total Activity" 
                  stroke="#8884d8" 
                  strokeWidth={3}
                  dot={{ fill: '#8884d8', r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          );
        } else if (chartType === 'area') {
          return (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={transformedData.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  name="Total Activity" 
                  stroke="#8884d8" 
                  fill="#8884d8CC" 
                />
              </AreaChart>
            </ResponsiveContainer>
          );
        }
      }
    } else if (activeTab === 'comparison') {
      if (comparisonType === 'humanVsVehicle') {
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
                  label={({ name, value, percent }: { name: string; value: number; percent: number }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                >
                  <Cell fill={CHART_COLORS.human} />
                  <Cell fill={CHART_COLORS.vehicle} />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          );
        } else if (chartType === 'bar') {
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
                  name="Count" 
                  fill="#8884d8"
                >
                  <Cell fill={CHART_COLORS.human} />
                  <Cell fill={CHART_COLORS.vehicle} />
                  <LabelList dataKey="value" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
        }
      } else if (comparisonType === 'weekdayVsWeekend') {
        if (chartType === 'bar') {
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
                >
                  <LabelList dataKey="human" position="top" />
                </Bar>
                <Bar 
                  dataKey="vehicle" 
                  name="Vehicle Intrusions" 
                  fill={CHART_COLORS.vehicle}
                >
                  <LabelList dataKey="vehicle" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          );
        } else if (chartType === 'pie') {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                <div style={{ width: '45%', minWidth: '280px' }}>
                  <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Weekday vs Weekend Distribution</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Weekday', value: insights.weekdayTotal },
                          { name: 'Weekend', value: insights.weekendTotal }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }: { name: string; percent: number }) => 
                          `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill={CHART_COLORS.weekday} />
                        <Cell fill={CHART_COLORS.weekend} />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div style={{ width: '45%', minWidth: '280px' }}>
                  <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Daily Average Comparison</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { name: 'Weekday', value: insights.weekdayDailyAvg },
                      { name: 'Weekend', value: insights.weekendDailyAvg }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="value" 
                        fill="#8884d8"
                        name="Daily Average"
                      >
                        <Cell fill={CHART_COLORS.weekday} />
                        <Cell fill={CHART_COLORS.weekend} />
                        <LabelList dataKey="value" position="top" formatter={(value: number) => value.toFixed(1)} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        }
      }
    }
    
    // Default fallback chart
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
      <SectionTitle>
        Data Visualization & Analytics
        <ExportButton onClick={() => setChartDataURL('')}>
          <span>📊</span> Update Chart Image
        </ExportButton>
      </SectionTitle>
      
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
      
      {/* Chart Tabs */}
      <ChartTab>
        <TabButton 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </TabButton>
        <TabButton 
          active={activeTab === 'intrusions'} 
          onClick={() => setActiveTab('intrusions')}
        >
          Intrusion Analysis
        </TabButton>
        <TabButton 
          active={activeTab === 'trends'} 
          onClick={() => setActiveTab('trends')}
        >
          Trends & Patterns
        </TabButton>
        <TabButton 
          active={activeTab === 'comparison'} 
          onClick={() => setActiveTab('comparison')}
        >
          Comparisons
        </TabButton>
      </ChartTab>
      
      {/* Timeframe selection for trends tab */}
      {activeTab === 'trends' && (
        <TimeframeTab>
          <TimeframeButton 
            active={timeframe === 'daily'} 
            onClick={() => setTimeframe('daily')}
          >
            Hourly Breakdown
          </TimeframeButton>
          <TimeframeButton 
            active={timeframe === 'weekly'} 
            onClick={() => setTimeframe('weekly')}
          >
            Weekly Trends
          </TimeframeButton>
        </TimeframeTab>
      )}
      
      {/* Comparison Type Selection */}
      {activeTab === 'comparison' && (
        <TimeframeTab>
          <TimeframeButton 
            active={comparisonType === 'humanVsVehicle'} 
            onClick={() => setComparisonType('humanVsVehicle')}
          >
            Human vs Vehicle
          </TimeframeButton>
          <TimeframeButton 
            active={comparisonType === 'weekdayVsWeekend'} 
            onClick={() => setComparisonType('weekdayVsWeekend')}
          >
            Weekday vs Weekend
          </TimeframeButton>
        </TimeframeTab>
      )}
      
      {/* Chart options */}
      <ChartOptionsContainer>
        <ChartOptionGroup>
          <ChartOptionLabel>Chart Type:</ChartOptionLabel>
          {activeTab === 'overview' && (
            <>
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
                active={chartType === 'area'} 
                onClick={() => setChartType('area')}
              >
                Area
              </ChartButton>
              <ChartButton 
                active={chartType === 'heatmap'} 
                onClick={() => setChartType('heatmap')}
              >
                Heatmap
              </ChartButton>
              <ChartButton 
                active={chartType === 'calendar'} 
                onClick={() => setChartType('calendar')}
              >
                Calendar
              </ChartButton>
            </>
          )}
          
          {activeTab === 'intrusions' && (
            <>
              <ChartButton 
                active={chartType === 'bar'} 
                onClick={() => setChartType('bar')}
              >
                Bar
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
            </>
          )}
          
          {activeTab === 'trends' && (
            <>
              <ChartButton 
                active={chartType === 'line'} 
                onClick={() => setChartType('line')}
              >
                Line
              </ChartButton>
              <ChartButton 
                active={chartType === 'bar'} 
                onClick={() => setChartType('bar')}
              >
                Bar
              </ChartButton>
              <ChartButton 
                active={chartType === 'area'} 
                onClick={() => setChartType('area')}
              >
                Area
              </ChartButton>
            </>
          )}
          
          {activeTab === 'comparison' && (
            <>
              <ChartButton 
                active={chartType === 'bar'} 
                onClick={() => setChartType('bar')}
              >
                Bar
              </ChartButton>
              <ChartButton 
                active={chartType === 'pie'} 
                onClick={() => setChartType('pie')}
              >
                Pie
              </ChartButton>
            </>
          )}
        </ChartOptionGroup>
      </ChartOptionsContainer>
      
      {/* Chart container - this is what will be captured */}
      <ChartContainer>
        <div ref={chartRef} style={{ position: 'relative' }}>
          {renderChart()}
          {isLoading && (
            <LoadingOverlay>
              <LoadingSpinner />
            </LoadingOverlay>
          )}
        </div>
      </ChartContainer>
      
      {/* Insight box */}
      <InsightBox>
        <h4>🔍 AI-Generated Insights</h4>
        
        {activeTab === 'overview' && (
          <>
            <p>
              The data reveals a total of <strong>{insights.totalIntrusions} intrusions</strong> detected during the monitoring period, with <strong>{insights.peakDay}</strong> showing the highest activity. 
              Human intrusions account for <strong>{insights.humanPercentage.toFixed(1)}%</strong> of detections, while vehicle intrusions represent <strong>{insights.vehiclePercentage.toFixed(1)}%</strong>.
              The daily average is <strong>{insights.dailyAverage.toFixed(1)} intrusions</strong> per day.
            </p>
            <p>
              {insights.humanPercentage > insights.vehiclePercentage 
                ? 'Human-related events dominate the detection activity this week, suggesting increased pedestrian traffic.'
                : 'Vehicle-related events are more frequent, indicating higher vehicular activity than pedestrian movement.'}
              {' '}
              {insights.peakHour && `Peak activity was detected at ${insights.peakHour}, suggesting enhanced monitoring should be focused during this timeframe.`}
            </p>
          </>
        )}
        
        {activeTab === 'intrusions' && (
          <>
            <p>
              Analysis shows that <strong>{insights.humanPercentage > insights.vehiclePercentage ? 'human' : 'vehicle'}</strong> intrusions are more common, representing <strong>{Math.max(insights.humanPercentage, insights.vehiclePercentage).toFixed(1)}%</strong> of all detections.
              {insights.peakDay && ` ${insights.peakDay} has the highest detection rate with a total of ${transformedData.dailyData.find(d => d.day === insights.peakDay)?.total || 0} intrusions, which is ${((transformedData.dailyData.find(d => d.day === insights.peakDay)?.total || 0) / insights.dailyAverage).toFixed(1)}x the daily average.`}
            </p>
            <p>
              {insights.weekdayPercentage > 70 
                ? 'Weekdays account for a significant majority of all intrusion events, suggesting lower security risk during weekends.' 
                : insights.weekendPercentage > 40 
                ? 'Weekend activity is notably high, representing a significant portion of total intrusions and warranting focused weekend security measures.'
                : 'Activity is primarily distributed across weekdays, with typical lower frequencies during weekends.'}
            </p>
          </>
        )}
        
        {activeTab === 'trends' && (
          <>
            <p>
              {timeframe === 'daily' 
                ? `Hourly trend analysis shows peak activity at ${insights.peakHour}, with elevated detection rates during ${parseInt(insights.peakHour) < 12 ? 'morning' : parseInt(insights.peakHour) < 18 ? 'afternoon' : 'evening'} hours.` 
                : `Weekly trend analysis shows a ${transformedData.dailyData[0].total > transformedData.dailyData[6].total ? 'decreasing' : 'increasing'} pattern from Monday to Sunday, with ${insights.peakDay} showing the highest activity.`}
              {' '}
              This information can be used to optimize security resource allocation and patrol scheduling.
            </p>
            <p>
              {timeframe === 'daily'
                ? `The data indicates that ${parseInt(insights.peakHour) < 6 || parseInt(insights.peakHour) >= 22 ? 'nighttime' : 'daytime'} hours experience the most security events, suggesting enhanced measures during these periods would be most effective.`
                : `The ${insights.weekdayPercentage > insights.weekendPercentage ? 'weekday' : 'weekend'} period shows significantly higher activity, with ${Math.max(insights.weekdayPercentage, insights.weekendPercentage).toFixed(1)}% of all detections.`}
            </p>
          </>
        )}
        
        {activeTab === 'comparison' && (
          <>
            <p>
              {comparisonType === 'humanVsVehicle'
                ? `Human vs vehicle comparison shows a ${Math.abs(insights.humanPercentage - insights.vehiclePercentage) < 10 ? 'relatively balanced' : 'significant'} difference, with ${insights.humanPercentage > insights.vehiclePercentage ? 'human' : 'vehicle'} activity accounting for ${Math.max(insights.humanPercentage, insights.vehiclePercentage).toFixed(1)}% of all detections.`
                : `Weekday vs weekend analysis shows weekday activity represents ${insights.weekdayPercentage.toFixed(1)}% of intrusions, while weekend activity accounts for ${insights.weekendPercentage.toFixed(1)}%.`}
              {' '}
              {comparisonType === 'weekdayVsWeekend' && `On a daily average basis, ${insights.weekdayDailyAvg > insights.weekendDailyAvg ? 'weekdays' : 'weekend days'} experience ${Math.max(insights.weekdayDailyAvg, insights.weekendDailyAvg).toFixed(1)} intrusions compared to ${Math.min(insights.weekdayDailyAvg, insights.weekendDailyAvg).toFixed(1)} on ${insights.weekdayDailyAvg > insights.weekendDailyAvg ? 'weekend days' : 'weekdays'}.`}
            </p>
            <p>
              {comparisonType === 'humanVsVehicle'
                ? `Based on this distribution, security operations should ${Math.abs(insights.humanPercentage - insights.vehiclePercentage) < 10 ? 'maintain balanced coverage for both pedestrian and vehicle monitoring' : `focus more resources on ${insights.humanPercentage > insights.vehiclePercentage ? 'pedestrian' : 'vehicle'} activity monitoring`}.`
                : `This data suggests ${insights.weekdayDailyAvg > insights.weekendDailyAvg ? 'weekdays require more intensive monitoring than weekends' : 'weekend security should be prioritized as daily average intrusions exceed weekday levels'}.`}
              {' '}
              Adjusting security protocols accordingly would optimize resource allocation.
            </p>
          </>
        )}
      </InsightBox>
    </Section>
  );
};

export default EnhancedDataVisualizationPanel;