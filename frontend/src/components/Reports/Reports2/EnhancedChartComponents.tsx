// File: frontend/src/components/Reports2/EnhancedChartComponents.tsx

import {
    LineChart as RechartsLineChart,
    Line as RechartsLine,
    BarChart as RechartsBarChart,
    Bar as RechartsBar,
    PieChart as RechartsPieChart,
    Pie as RechartsPie,
    Cell as RechartsCell,
    XAxis as RechartsXAxis,
    YAxis as RechartsYAxis,
    CartesianGrid as RechartsCartesianGrid,
    Tooltip as RechartsTooltip,
    Legend as RechartsLegend,
    ResponsiveContainer as RechartsResponsiveContainer,
    LabelList as RechartsLabelList,
    Brush as RechartsBrush,
    ScatterChart as RechartsScatterChart,
    Scatter as RechartsScatter,
    AreaChart as RechartsAreaChart,
    Area as RechartsArea,
    ComposedChart as RechartsComposedChart,
    RadarChart as RechartsRadarChart,
    Radar as RechartsRadar,
    PolarGrid as RechartsPolarGrid,
    PolarAngleAxis as RechartsPolarAngleAxis,
    PolarRadiusAxis as RechartsPolarRadiusAxis,
    RadialBarChart as RechartsRadialBarChart,
    RadialBar as RechartsRadialBar,
    Treemap as RechartsTreemap
  } from 'recharts';
  import { FC, ReactNode, CSSProperties } from 'react';
  import styled from 'styled-components';
  
  // Styled components for enhanced appearance
  const ChartContainer = styled.div`
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    }
  `;
  
  const ChartTitle = styled.h3`
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
    color: #333;
    font-weight: 600;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #f0f0f0;
  `;
  
  const ChartDescription = styled.p`
    font-size: 0.9rem;
    color: #6c757d;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  `;
  
  const ChartLegendContainer = styled.div`
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin: 1rem 0;
  `;
  
  const ChartLegendItem = styled.div<{ color: string }>`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    
    &::before {
      content: '';
      display: block;
      width: 12px;
      height: 12px;
      border-radius: 2px;
      background-color: ${props => props.color};
    }
  `;
  
  // Advanced Type Definitions
  export interface ChartProps {
    width?: string | number;
    height?: number;
    data?: any[];
    children?: ReactNode;
    title?: string;
    description?: string;
    customLegend?: { name: string; color: string }[];
    className?: string;
    style?: CSSProperties;
  }
  
  export interface ResponsiveContainerProps {
    width: string | number;
    height: number | string;
    children: ReactNode;
    aspect?: number;
    minWidth?: number;
    minHeight?: number;
  }
  
  export interface AxisProps {
    dataKey?: string;
    scale?: string;
    domain?: [any, any];
    children?: ReactNode;
    name?: string;
    unit?: string;
    orientation?: 'top' | 'bottom' | 'left' | 'right';
    type?: 'number' | 'category';
    allowDecimals?: boolean;
    hide?: boolean;
    tickLine?: boolean;
    axisLine?: boolean;
    tickFormatter?: (value: any) => string;
    tickMargin?: number;
    minTickGap?: number;
    tickCount?: number;
    interval?: number | 'preserveStart' | 'preserveEnd' | 'preserveStartEnd';
    padding?: { left?: number; right?: number; top?: number; bottom?: number };
  }
  
  export interface CellProps {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }
  
  export interface BarProps {
    dataKey: string;
    name?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    fillOpacity?: number;
    stackId?: string | number;
    children?: ReactNode;
    isAnimationActive?: boolean;
    animationDuration?: number;
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
    radius?: number | [number, number, number, number];
    onClick?: (data: any, index: number) => void;
  }
  
  export interface LineProps {
    type?: 'basis' | 'basisClosed' | 'basisOpen' | 'linear' | 'linearClosed' | 'natural' | 'monotoneX' | 'monotoneY' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter';
    dataKey: string;
    name?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    fill?: string;
    fillOpacity?: number;
    activeDot?: boolean | object | React.ReactElement;
    dot?: boolean | object | React.ReactElement;
    isAnimationActive?: boolean;
    animationDuration?: number;
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
    connectNulls?: boolean;
    onClick?: (data: any, index: number) => void;
  }
  
  export interface AreaProps extends LineProps {
    stackId?: string | number;
  }
  
  export interface PieProps {
    data: any[];
    cx?: string | number;
    cy?: string | number;
    labelLine?: boolean;
    paddingAngle?: number;
    startAngle?: number;
    endAngle?: number;
    innerRadius?: number | string;
    outerRadius?: number | string;
    fill?: string;
    dataKey: string;
    nameKey?: string;
    label?: boolean | object | Function | React.ReactElement;
    labelPosition?: 'inside' | 'outside' | 'insideLeft' | 'insideRight' | 'insideTop' | 'insideBottom' | 'insideTopLeft' | 'insideBottomLeft' | 'insideTopRight' | 'insideBottomRight' | 'outside';
    children?: ReactNode;
    isAnimationActive?: boolean;
    animationDuration?: number;
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
    onClick?: (data: any, index: number) => void;
  }
  
  export interface ScatterProps {
    data?: any[];
    dataKey?: string;
    fill?: string;
    stroke?: string;
    line?: boolean | object | React.ReactElement;
    lineType?: 'fitting' | 'joint';
    shape?: 'circle' | 'cross' | 'diamond' | 'square' | 'star' | 'triangle' | 'wye' | React.ReactElement;
    isAnimationActive?: boolean;
    animationDuration?: number;
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
    name?: string;
    onClick?: (data: any, index: number) => void;
  }
  
  export interface LabelListProps {
    dataKey: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'inside' | 'outside' | 'insideLeft' | 'insideRight' | 'insideTop' | 'insideBottom' | 'insideTopLeft' | 'insideBottomLeft' | 'insideTopRight' | 'insideBottomRight' | 'none';
    offset?: number;
    fill?: string;
    stroke?: string;
    fontSize?: number;
    formatter?: (value: any, entry: any) => React.ReactNode;
  }
  
  export interface TooltipProps {
    formatter?: (value: any, name?: string, props?: any) => React.ReactNode;
    labelFormatter?: (label: any) => React.ReactNode;
    itemSorter?: (a: any, b: any) => number;
    isAnimationActive?: boolean;
    animationDuration?: number;
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
    separator?: string;
    wrapperStyle?: object;
    contentStyle?: object;
    itemStyle?: object;
    labelStyle?: object;
    cursor?: boolean | object | React.ReactElement;
    position?: { x?: number; y?: number };
    active?: boolean;
    payload?: any[];
    label?: string;
    viewBox?: { x?: number; y?: number; width?: number; height?: number };
    coordinate?: { x?: number; y?: number };
  }
  
  export interface LegendProps {
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    layout?: 'horizontal' | 'vertical';
    iconSize?: number;
    iconType?: 'line' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
    wrapperStyle?: object;
    chartWidth?: number;
    chartHeight?: number;
    width?: number;
    height?: number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    content?: React.ReactElement | Function;
    payload?: { value: any; id: string; type: string; color: string }[];
    onClick?: (dataItem: any) => void;
  }
  
  export interface RadarProps {
    dataKey: string;
    name?: string;
    stroke?: string;
    fill?: string;
    fillOpacity?: number;
    dot?: boolean | object | React.ReactElement;
    activeDot?: boolean | object | React.ReactElement;
    isAnimationActive?: boolean;
    animationDuration?: number;
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  }
  
  // Enhanced Wrapper Components
  export const ResponsiveContainer: FC<ResponsiveContainerProps> = ({ 
    width, 
    height, 
    children, 
    aspect,
    minWidth,
    minHeight
  }) => (
    <RechartsResponsiveContainer 
      width={width} 
      height={height}
      aspect={aspect}
      minWidth={minWidth}
      minHeight={minHeight}
    >
      {children}
    </RechartsResponsiveContainer>
  );
  
  // Base chart components with enhanced props
  export const LineChart: FC<ChartProps> = ({ 
    data, 
    children, 
    title, 
    description, 
    customLegend,
    className,
    style,
    width = "100%",
    height = 400
  }) => (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}
      
      <ResponsiveContainer width={width} height={height}>
        <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {children}
        </RechartsLineChart>
      </ResponsiveContainer>
      
      {customLegend && (
        <ChartLegendContainer>
          {customLegend.map((item, index) => (
            <ChartLegendItem key={index} color={item.color}>
              {item.name}
            </ChartLegendItem>
          ))}
        </ChartLegendContainer>
      )}
    </ChartContainer>
  );
  
  export const BarChart: FC<ChartProps> = ({ 
    data, 
    children, 
    title, 
    description, 
    customLegend,
    className,
    style,
    width = "100%",
    height = 400
  }) => (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}
      
      <ResponsiveContainer width={width} height={height}>
        <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {children}
        </RechartsBarChart>
      </ResponsiveContainer>
      
      {customLegend && (
        <ChartLegendContainer>
          {customLegend.map((item, index) => (
            <ChartLegendItem key={index} color={item.color}>
              {item.name}
            </ChartLegendItem>
          ))}
        </ChartLegendContainer>
      )}
    </ChartContainer>
  );
  
  export const PieChart: FC<ChartProps> = ({ 
    children, 
    title, 
    description, 
    customLegend,
    className,
    style,
    width = "100%",
    height = 400
  }) => (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}
      
      <ResponsiveContainer width={width} height={height}>
        <RechartsPieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {children}
        </RechartsPieChart>
      </ResponsiveContainer>
      
      {customLegend && (
        <ChartLegendContainer>
          {customLegend.map((item, index) => (
            <ChartLegendItem key={index} color={item.color}>
              {item.name}
            </ChartLegendItem>
          ))}
        </ChartLegendContainer>
      )}
    </ChartContainer>
  );
  
  export const AreaChart: FC<ChartProps> = ({ 
    data, 
    children, 
    title, 
    description, 
    customLegend,
    className,
    style,
    width = "100%",
    height = 400
  }) => (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}
      
      <ResponsiveContainer width={width} height={height}>
        <RechartsAreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {children}
        </RechartsAreaChart>
      </ResponsiveContainer>
      
      {customLegend && (
        <ChartLegendContainer>
          {customLegend.map((item, index) => (
            <ChartLegendItem key={index} color={item.color}>
              {item.name}
            </ChartLegendItem>
          ))}
        </ChartLegendContainer>
      )}
    </ChartContainer>
  );
  
  export const ScatterChart: FC<ChartProps> = ({ 
    data, 
    children, 
    title, 
    description, 
    customLegend,
    className,
    style,
    width = "100%",
    height = 400
  }) => (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}
      
      <ResponsiveContainer width={width} height={height}>
        <RechartsScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {children}
        </RechartsScatterChart>
      </ResponsiveContainer>
      
      {customLegend && (
        <ChartLegendContainer>
          {customLegend.map((item, index) => (
            <ChartLegendItem key={index} color={item.color}>
              {item.name}
            </ChartLegendItem>
          ))}
        </ChartLegendContainer>
      )}
    </ChartContainer>
  );
  
  export const ComposedChart: FC<ChartProps> = ({ 
    data, 
    children, 
    title, 
    description, 
    customLegend,
    className,
    style,
    width = "100%",
    height = 400
  }) => (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}
      
      <ResponsiveContainer width={width} height={height}>
        <RechartsComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {children}
        </RechartsComposedChart>
      </ResponsiveContainer>
      
      {customLegend && (
        <ChartLegendContainer>
          {customLegend.map((item, index) => (
            <ChartLegendItem key={index} color={item.color}>
              {item.name}
            </ChartLegendItem>
          ))}
        </ChartLegendContainer>
      )}
    </ChartContainer>
  );
  
  export const RadarChart: FC<ChartProps> = ({ 
    data, 
    children, 
    title, 
    description, 
    customLegend,
    className,
    style,
    width = "100%",
    height = 400
  }) => (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}
      
      <ResponsiveContainer width={width} height={height}>
        <RechartsRadarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {children}
        </RechartsRadarChart>
      </ResponsiveContainer>
      
      {customLegend && (
        <ChartLegendContainer>
          {customLegend.map((item, index) => (
            <ChartLegendItem key={index} color={item.color}>
              {item.name}
            </ChartLegendItem>
          ))}
        </ChartLegendContainer>
      )}
    </ChartContainer>
  );
  
  export const RadialBarChart: FC<ChartProps> = ({ 
    data, 
    children, 
    title, 
    description, 
    customLegend,
    className,
    style,
    width = "100%",
    height = 400
  }) => (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}
      
      <ResponsiveContainer width={width} height={height}>
        <RechartsRadialBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {children}
        </RechartsRadialBarChart>
      </ResponsiveContainer>
      
      {customLegend && (
        <ChartLegendContainer>
          {customLegend.map((item, index) => (
            <ChartLegendItem key={index} color={item.color}>
              {item.name}
            </ChartLegendItem>
          ))}
        </ChartLegendContainer>
      )}
    </ChartContainer>
  );
  
  // Chart Components
  export const Pie: FC<PieProps> = (props) => <RechartsPie {...props} />;
  export const Cell: FC<CellProps> = (props) => <RechartsCell {...props} />;
  export const Bar: FC<BarProps> = (props) => <RechartsBar {...props} />;
  export const Line: FC<LineProps> = (props) => <RechartsLine {...props} />;
  export const Area: FC<AreaProps> = (props) => <RechartsArea {...props} />;
  export const Scatter: FC<ScatterProps> = (props) => <RechartsScatter {...props} />;
  export const Radar: FC<RadarProps> = (props) => <RechartsRadar {...props} />;
  export const RadialBar: FC<BarProps> = (props) => <RechartsRadialBar {...props} />;
  export const Treemap: FC<any> = (props) => <RechartsTreemap {...props} />;
  
  // Axes Components
  export const XAxis: FC<AxisProps> = (props) => <RechartsXAxis {...props} />;
  export const YAxis: FC<AxisProps> = (props) => <RechartsYAxis {...props} />;
  export const PolarAngleAxis: FC<AxisProps> = (props) => <RechartsPolarAngleAxis {...props} />;
  export const PolarRadiusAxis: FC<AxisProps> = (props) => <RechartsPolarRadiusAxis {...props} />;
  export const PolarGrid: FC<any> = (props) => <RechartsPolarGrid {...props} />;
  
  // Helper Components
  export const CartesianGrid: FC<{ strokeDasharray?: string; vertical?: boolean; horizontal?: boolean }> = (props) => 
    <RechartsCartesianGrid {...props} />;
  
  export const Tooltip: FC<TooltipProps> = (props) => <RechartsTooltip {...props} />;
  export const Legend: FC<LegendProps> = (props) => <RechartsLegend {...props} />;
  export const LabelList: FC<LabelListProps> = (props) => <RechartsLabelList {...props} />;
  export const Brush: FC<any> = (props) => <RechartsBrush {...props} />;
  
  // Custom Chart Types that aren't directly from recharts
  
  // HeatMap Component
  export const HeatMap: FC<ChartProps & { 
    data: Array<{ name: string; [key: string]: any }>;
    xAxis: string;
    dataKeys: string[];
    colors?: string[];
  }> = ({ 
    data, 
    xAxis, 
    dataKeys, 
    colors = ['#f3e5f5', '#e1bee7', '#ce93d8', '#ba68c8', '#ab47bc', '#9c27b0', '#8e24aa', '#7b1fa2'],
    title,
    description,
    className,
    style,
    width = "100%",
    height = 400
  }) => {
    const getColorByValue = (value: number, min: number, max: number) => {
      const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
      const colorIndex = Math.floor(normalizedValue * (colors.length - 1));
      return colors[colorIndex];
    };
  
    // Calculate min and max values across all data
    const allValues = data.flatMap(d => dataKeys.map(key => d[key])).filter(v => v !== undefined);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
  
    return (
      <ChartContainer className={className} style={style}>
        {title && <ChartTitle>{title}</ChartTitle>}
        {description && <ChartDescription>{description}</ChartDescription>}
        
        <ResponsiveContainer width={width} height={height}>
          <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis} />
            <YAxis type="category" dataKey="name" />
            <Tooltip 
              formatter={(value, name) => [`${value}`, name]} 
              labelFormatter={(label) => `${label}`}
            />
            <Legend />
            
            {dataKeys.map((dataKey, idx) => (
              <Bar 
                key={idx}
                dataKey={dataKey} 
                fill={getColorByValue(data.reduce((sum, item) => sum + (item[dataKey] || 0), 0) / data.length, minValue, maxValue)} 
                shape={(props: any) => {
                  const { x, y, width, height, value } = props;
                  return (
                    <rect 
                      x={x} 
                      y={y} 
                      width={width} 
                      height={height} 
                      fill={getColorByValue(value, minValue, maxValue)}
                      stroke="#fff"
                      strokeWidth={1}
                      rx={2}
                      ry={2}
                    />
                  );
                }}
              >
                <LabelList dataKey={dataKey} position="center" fill="#fff" />
              </Bar>
            ))}
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Custom color legend */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '0.75rem' }}>{minValue}</div>
            <div style={{ display: 'flex', height: '20px', width: '200px' }}>
              {colors.map((color, i) => (
                <div 
                  key={i} 
                  style={{ 
                    backgroundColor: color, 
                    height: '100%', 
                    flex: 1 
                  }} 
                />
              ))}
            </div>
            <div style={{ fontSize: '0.75rem' }}>{maxValue}</div>
          </div>
        </div>
      </ChartContainer>
    );
  };
  
  // Calendar Chart Component
  export const CalendarHeatMap: FC<ChartProps & {
    data: Array<{ date: string; value: number }>;
    startDate?: Date;
    endDate?: Date;
    colorScale?: string[];
    emptyColor?: string;
  }> = ({
    data,
    startDate = new Date(new Date().getFullYear(), 0, 1),
    endDate = new Date(),
    colorScale = ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'],
    emptyColor = '#ebedf0',
    title,
    description,
    className,
    style
  }) => {
    const getDaysBetweenDates = (start: Date, end: Date) => {
      const dates = [];
      const currentDate = new Date(start);
      while (currentDate <= end) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    };
  
    const getAllDays = getDaysBetweenDates(startDate, endDate);
    
    // Create a map for quick lookup of values by date
    const valueMap = new Map(data.map(item => [item.date, item.value]));
    
    // Find min and max for color scaling
    const values = data.map(item => item.value);
    const maxValue = Math.max(...values);
    
    const getColorByValue = (value?: number) => {
      if (value === undefined) return emptyColor;
      const normalizedValue = value / maxValue;
      const index = Math.min(colorScale.length - 1, Math.floor(normalizedValue * colorScale.length));
      return colorScale[index];
    };
    
    // Group days by week and month for rendering
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    getAllDays.forEach(day => {
      if (day.getDay() === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
      if (day.getTime() === endDate.getTime()) {
        weeks.push(currentWeek);
      }
    });
    
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <ChartContainer className={className} style={style}>
        {title && <ChartTitle>{title}</ChartTitle>}
        {description && <ChartDescription>{description}</ChartDescription>}
        
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <div style={{ width: '30px' }}></div>
            {weeks.map((_, weekIndex) => {
              const date = weeks[weekIndex][0] || new Date();
              const month = date.getMonth();
              const prevDate = weekIndex > 0 ? weeks[weekIndex - 1][0] : null;
              const prevMonth = prevDate ? prevDate.getMonth() : -1;
              
              return (
                month !== prevMonth ? (
                  <div key={weekIndex} style={{ flex: '1', textAlign: 'center', fontSize: '12px', color: '#767676' }}>
                    {monthLabels[month]}
                  </div>
                ) : <div key={weekIndex} style={{ flex: '1' }}></div>
              );
            })}
          </div>
          
          <div style={{ display: 'flex' }}>
            <div style={{ width: '30px', marginRight: '4px' }}>
              {dayLabels.map((day, i) => (
                <div 
                  key={i} 
                  style={{ 
                    height: '10px', 
                    fontSize: '9px', 
                    color: '#767676', 
                    textAlign: 'right', 
                    marginBottom: '2px',
                    paddingTop: i === 0 ? '0' : '1px'
                  }}
                >
                  {i % 2 === 1 ? day : ''}
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', flex: 1 }}>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} style={{ flex: '1', marginRight: '2px' }}>
                  {Array(7).fill(0).map((_, dayIndex) => {
                    const day = week[dayIndex];
                    const dateString = day ? formatDate(day) : '';
                    const value = valueMap.get(dateString);
                    
                    return (
                      <div 
                        key={dayIndex} 
                        style={{
                          height: '10px',
                          backgroundColor: day ? getColorByValue(value) : 'transparent',
                          border: day ? '1px solid rgba(27, 31, 35, 0.06)' : 'none',
                          marginBottom: '2px',
                          borderRadius: '2px',
                          position: 'relative'
                        }}
                        title={day ? `${day.toDateString()}: ${value || 0}` : ''}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
              <span>Less</span>
              {colorScale.map((color, i) => (
                <div 
                  key={i} 
                  style={{ 
                    width: '10px', 
                    height: '10px', 
                    backgroundColor: color,
                    border: '1px solid rgba(27, 31, 35, 0.06)',
                    borderRadius: '2px'
                  }} 
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </ChartContainer>
    );
  };
  
  export default {
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
    AreaChart,
    Area,
    ScatterChart,
    Scatter,
    ComposedChart,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    RadialBarChart,
    RadialBar,
    Treemap,
    Brush,
    HeatMap,
    CalendarHeatMap
  };