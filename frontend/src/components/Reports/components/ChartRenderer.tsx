/**
 * Chart Renderer - Specialized Chart Rendering Component
 * Extracted from DataVisualizationPanel for better modularity
 * Production-ready chart rendering with comprehensive support for all chart types
 */

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  Cell,
} from 'recharts';

import { ChartWrapper, StatusMessage } from '../shared/ChartStyledComponents';
import { EnhancedBarChart, CustomBarLabel, ChartErrorBoundary } from '../ChartComponents';
import { generateChartConfig, getChartTypeConfig } from '../utils/chartConfigManager';
import { ThemeSettings } from '../../../types/reports';
import { 
  TAB_TYPES, 
  TIMEFRAME_TYPES, 
  COMPARISON_TYPES,
  ActiveTabType,
  TimeframeType,
  ComparisonType
} from '../constants/chartConstants';

/**
 * Chart data interfaces
 */
interface DailyDataPoint {
  day: string;
  humanIntrusions: number;
  vehicleIntrusions: number;
  total: number;
}

interface SummaryDataPoint {
  name: string;
  value: number;
}

interface WeekdayWeekendDataPoint {
  name: string;
  human: number;
  vehicle: number;
  total: number;
}

interface HourlyDataPoint {
  hour: string;
  human: number;
  vehicle: number;
  total: number;
}

interface ChartData {
  dailyData: DailyDataPoint[];
  weeklySummary: SummaryDataPoint[];
  weekdayVsWeekendData: WeekdayWeekendDataPoint[];
  hourlyAggregates: HourlyDataPoint[];
}

/**
 * Chart renderer props
 */
interface ChartRendererProps {
  activeTab: ActiveTabType;
  timeframe: TimeframeType;
  comparisonType: ComparisonType;
  chartData: ChartData;
  themeSettings?: ThemeSettings;
  width?: string | number;
  height?: number;
  onChartClick?: (data: any) => void;
  onChartHover?: (data: any) => void;
  enableAnimations?: boolean;
  enableInteractivity?: boolean;
}

/**
 * Main Chart Renderer Component
 */
export const ChartRenderer: React.FC<ChartRendererProps> = ({
  activeTab,
  timeframe,
  comparisonType,
  chartData,
  themeSettings,
  width = "100%",
  height = 400,
  onChartClick,
  onChartHover,
  enableAnimations = true,
  enableInteractivity = true
}) => {
  // Generate chart configuration
  const chartConfig = useMemo(() => generateChartConfig(themeSettings), [themeSettings]);
  
  // Get chart colors
  const chartColors = useMemo(() => ({
    human: chartConfig.colors.human,
    vehicle: chartConfig.colors.vehicle,
    weekday: chartConfig.colors.weekday,
    weekend: chartConfig.colors.weekend,
    primary: chartConfig.colors.primary,
    secondary: chartConfig.colors.secondary
  }), [chartConfig]);

  // Common chart properties
  const commonProps = useMemo(() => ({
    width: typeof width === 'string' ? width : `${width}px`,
    height
  }), [width, height]);

  // Tooltip configuration
  const tooltipConfig = useMemo(() => ({
    ...chartConfig.styling.tooltip,
    cursor: enableInteractivity ? chartConfig.styling.tooltip.cursor : false
  }), [chartConfig, enableInteractivity]);

  // Legend configuration
  const legendConfig = useMemo(() => ({
    wrapperStyle: chartConfig.styling.legend.style
  }), [chartConfig]);

  // Animation configuration
  const animationConfig = useMemo(() => ({
    animationDuration: enableAnimations ? 1000 : 0,
    animationEasing: enableAnimations ? 'ease-in-out' : undefined
  }), [enableAnimations]);

  /**
   * Render chart based on active tab and configuration
   */
  const renderChart = () => {
    try {
      switch (activeTab) {
        case TAB_TYPES.OVERVIEW:
          return renderOverviewChart();
        case TAB_TYPES.INTRUSIONS:
          return renderIntrusionsChart();
        case TAB_TYPES.TRENDS:
          return renderTrendsChart();
        case TAB_TYPES.COMPARISON:
          return renderComparisonChart();
        default:
          return renderEmptyState("Please select a chart type");
      }
    } catch (error) {
      console.error("Error rendering chart:", error);
      return renderErrorState("An error occurred while rendering the chart");
    }
  };

  /**
   * Render overview chart - Daily activity bar chart
   */
  const renderOverviewChart = () => {
    if (!chartData.dailyData?.length || chartData.dailyData.every(d => d.total === 0)) {
      return renderEmptyState("No daily activity data available");
    }

    return (
      <ChartWrapper>
        <ResponsiveContainer {...commonProps}>
          <BarChart 
            data={chartData.dailyData} 
            margin={chartConfig.dimensions.margin}
            onClick={enableInteractivity ? onChartClick : undefined}
            onMouseMove={enableInteractivity ? onChartHover : undefined}
            {...animationConfig}
          >
            <CartesianGrid {...chartConfig.styling.grid} />
            <XAxis 
              dataKey="day" 
              {...chartConfig.styling.axis}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              {...chartConfig.styling.axis}
              tick={{ fontSize: 12 }}
            />
            <Tooltip {...tooltipConfig} />
            <Legend {...legendConfig} />
            <Bar 
              dataKey="humanIntrusions" 
              name="Human Activity" 
              fill={chartColors.human}
              radius={chartConfig.styling.bar.radius}
            >
              <LabelList dataKey="humanIntrusions" content={<CustomBarLabel />} />
            </Bar>
            <Bar 
              dataKey="vehicleIntrusions" 
              name="Vehicle Activity" 
              fill={chartColors.vehicle}
              radius={chartConfig.styling.bar.radius}
            >
              <LabelList dataKey="vehicleIntrusions" content={<CustomBarLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    );
  };

  /**
   * Render intrusions chart - Activity analysis bar chart
   */
  const renderIntrusionsChart = () => {
    if (!chartData.dailyData?.length || chartData.dailyData.every(d => d.total === 0)) {
      return renderEmptyState("No intrusion data available");
    }

    return (
      <ChartWrapper>
        <ResponsiveContainer {...commonProps}>
          <BarChart 
            data={chartData.dailyData} 
            margin={chartConfig.dimensions.margin}
            onClick={enableInteractivity ? onChartClick : undefined}
            onMouseMove={enableInteractivity ? onChartHover : undefined}
            {...animationConfig}
          >
            <CartesianGrid {...chartConfig.styling.grid} />
            <XAxis 
              dataKey="day" 
              {...chartConfig.styling.axis}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              {...chartConfig.styling.axis}
              tick={{ fontSize: 12 }}
            />
            <Tooltip {...tooltipConfig} />
            <Legend {...legendConfig} />
            <Bar 
              dataKey="humanIntrusions" 
              name="Human Activity" 
              fill={chartColors.human}
              radius={chartConfig.styling.bar.radius}
            >
              <LabelList dataKey="humanIntrusions" content={<CustomBarLabel />} />
            </Bar>
            <Bar 
              dataKey="vehicleIntrusions" 
              name="Vehicle Activity" 
              fill={chartColors.vehicle}
              radius={chartConfig.styling.bar.radius}
            >
              <LabelList dataKey="vehicleIntrusions" content={<CustomBarLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    );
  };

  /**
   * Render trends chart - Based on timeframe selection
   */
  const renderTrendsChart = () => {
    if (timeframe === TIMEFRAME_TYPES.DAILY) {
      return renderHourlyTrendsChart();
    } else {
      return renderWeeklyTrendsChart();
    }
  };

  /**
   * Render hourly trends chart
   */
  const renderHourlyTrendsChart = () => {
    if (!chartData.hourlyAggregates?.length || chartData.hourlyAggregates.every(d => d.total === 0)) {
      return renderEmptyState("No hourly trend data available");
    }

    return (
      <ChartWrapper>
        <ResponsiveContainer {...commonProps}>
          <BarChart 
            data={chartData.hourlyAggregates} 
            margin={chartConfig.dimensions.margin}
            onClick={enableInteractivity ? onChartClick : undefined}
            onMouseMove={enableInteractivity ? onChartHover : undefined}
            {...animationConfig}
          >
            <CartesianGrid {...chartConfig.styling.grid} />
            <XAxis 
              dataKey="hour" 
              {...chartConfig.styling.axis}
              tick={{ fontSize: 10 }}
              interval={1}
            />
            <YAxis 
              {...chartConfig.styling.axis}
              tick={{ fontSize: 12 }}
            />
            <Tooltip {...tooltipConfig} />
            <Legend {...legendConfig} />
            <Bar 
              dataKey="human" 
              name="Human" 
              fill={chartColors.human}
              radius={chartConfig.styling.bar.radius}
            >
              <LabelList dataKey="human" content={<CustomBarLabel />} />
            </Bar>
            <Bar 
              dataKey="vehicle" 
              name="Vehicle" 
              fill={chartColors.vehicle}
              radius={chartConfig.styling.bar.radius}
            >
              <LabelList dataKey="vehicle" content={<CustomBarLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    );
  };

  /**
   * Render weekly trends chart
   */
  const renderWeeklyTrendsChart = () => {
    if (!chartData.dailyData?.length || chartData.dailyData.every(d => d.total === 0)) {
      return renderEmptyState("No weekly trend data available");
    }

    return (
      <ChartWrapper>
        <ResponsiveContainer {...commonProps}>
          <BarChart 
            data={chartData.dailyData} 
            margin={chartConfig.dimensions.margin}
            onClick={enableInteractivity ? onChartClick : undefined}
            onMouseMove={enableInteractivity ? onChartHover : undefined}
            {...animationConfig}
          >
            <CartesianGrid {...chartConfig.styling.grid} />
            <XAxis 
              dataKey="day" 
              {...chartConfig.styling.axis}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              {...chartConfig.styling.axis}
              tick={{ fontSize: 12 }}
            />
            <Tooltip {...tooltipConfig} />
            <Legend {...legendConfig} />
            <Bar 
              dataKey="total" 
              name="Total Activity" 
              fill={chartColors.primary}
              radius={chartConfig.styling.bar.radius}
            >
              <LabelList dataKey="total" content={<CustomBarLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    );
  };

  /**
   * Render comparison chart - Based on comparison type
   */
  const renderComparisonChart = () => {
    if (comparisonType === COMPARISON_TYPES.HUMAN_VS_VEHICLE) {
      return renderHumanVsVehicleChart();
    } else {
      return renderWeekdayVsWeekendChart();
    }
  };

  /**
   * Render human vs vehicle comparison chart
   */
  const renderHumanVsVehicleChart = () => {
    if (!chartData.weeklySummary?.length) {
      return renderEmptyState("No human vs vehicle comparison data available");
    }

    return (
      <ChartWrapper>
        <ResponsiveContainer {...commonProps}>
          <BarChart 
            data={chartData.weeklySummary} 
            layout="vertical" 
            margin={{ top: 5, right: 50, left: 20, bottom: 5 }}
            onClick={enableInteractivity ? onChartClick : undefined}
            onMouseMove={enableInteractivity ? onChartHover : undefined}
            {...animationConfig}
          >
            <CartesianGrid {...chartConfig.styling.grid} horizontal={false} />
            <XAxis 
              type="number" 
              {...chartConfig.styling.axis}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={80} 
              {...chartConfig.styling.axis}
              tick={{ fontSize: 12 }}
            />
            <Tooltip {...tooltipConfig} />
            <Bar dataKey="value" name="Count">
              {chartData.weeklySummary.map((entry) => (
                <Cell 
                  key={`cell-${entry.name}`} 
                  fill={entry.name === 'Human' ? chartColors.human : chartColors.vehicle} 
                />
              ))}
              <LabelList 
                dataKey="value" 
                position="right" 
                content={<CustomBarLabel />} 
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    );
  };

  /**
   * Render weekday vs weekend comparison chart
   */
  const renderWeekdayVsWeekendChart = () => {
    if (!chartData.weekdayVsWeekendData?.length || chartData.weekdayVsWeekendData.every(d => d.total === 0)) {
      return renderEmptyState("No weekday vs weekend comparison data available");
    }

    return (
      <ChartWrapper>
        <ResponsiveContainer {...commonProps}>
          <BarChart 
            data={chartData.weekdayVsWeekendData} 
            margin={chartConfig.dimensions.margin}
            onClick={enableInteractivity ? onChartClick : undefined}
            onMouseMove={enableInteractivity ? onChartHover : undefined}
            {...animationConfig}
          >
            <CartesianGrid {...chartConfig.styling.grid} />
            <XAxis 
              dataKey="name" 
              {...chartConfig.styling.axis}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              {...chartConfig.styling.axis}
              tick={{ fontSize: 12 }}
            />
            <Tooltip {...tooltipConfig} />
            <Legend {...legendConfig} />
            <Bar 
              dataKey="human" 
              name="Human" 
              stackId="a" 
              fill={chartColors.human}
              radius={[0, 0, 0, 0]}
            >
              <LabelList dataKey="human" content={<CustomBarLabel />} />
            </Bar>
            <Bar 
              dataKey="vehicle" 
              name="Vehicle" 
              stackId="a" 
              fill={chartColors.vehicle}
              radius={chartConfig.styling.bar.radius}
            >
              <LabelList dataKey="vehicle" content={<CustomBarLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = (message: string) => (
    <ChartWrapper>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: height,
        color: chartColors.primary,
        fontSize: '1.1rem',
        fontWeight: 500
      }}>
        {message}
      </div>
    </ChartWrapper>
  );

  /**
   * Render error state
   */
  const renderErrorState = (message: string) => (
    <ChartWrapper>
      <StatusMessage $type="error">
        <span>⚠️</span>
        {message}
      </StatusMessage>
    </ChartWrapper>
  );

  return (
    <ChartErrorBoundary>
      <div style={{ position: 'relative', minHeight: `${height}px` }}>
        {renderChart()}
      </div>
    </ChartErrorBoundary>
  );
};

export default ChartRenderer;

/**
 * Hook for chart interaction handling
 */
export const useChartInteraction = () => {
  const handleChartClick = (data: any) => {
    console.log('Chart clicked:', data);
    // Custom click handling logic
  };

  const handleChartHover = (data: any) => {
    console.log('Chart hovered:', data);
    // Custom hover handling logic
  };

  return {
    handleChartClick,
    handleChartHover
  };
};

/**
 * Chart renderer with enhanced features
 */
export const EnhancedChartRenderer: React.FC<ChartRendererProps & {
  showGridLines?: boolean;
  showDataLabels?: boolean;
  showLegend?: boolean;
  customColors?: { [key: string]: string };
}> = ({
  showGridLines = true,
  showDataLabels = true,
  showLegend = true,
  customColors,
  ...props
}) => {
  const enhancedProps = {
    ...props,
    // Override chart config if needed
    chartConfig: {
      ...generateChartConfig(props.themeSettings),
      styling: {
        ...generateChartConfig(props.themeSettings).styling,
        grid: showGridLines ? generateChartConfig(props.themeSettings).styling.grid : { strokeDasharray: 'none' }
      }
    }
  };

  return <ChartRenderer {...enhancedProps} />;
};
