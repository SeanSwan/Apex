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
import React, { FC, ReactNode, CSSProperties, ReactElement, useState, useEffect } from 'react';
import styled from 'styled-components';
// Import MUI components for placeholder and Tooltip in CalendarHeatMap
import { CircularProgress, Box, Tooltip as MuiTooltip } from '@mui/material'; 

// Styled components for enhanced appearance
const ChartContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  min-height: 200px; /* Ensure container has some height during loading */
  display: flex; /* Use flex for centering placeholder */
  flex-direction: column; /* Stack title/desc and chart/placeholder */

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
`;

// New styled component for the placeholder container within ChartContainer
const PlaceholderContainer = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1; /* Allow placeholder to take available space */
  min-height: 150px; /* Minimum height for the placeholder area */
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

// --- Advanced Type Definitions (remain unchanged) ---
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
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

export interface ResponsiveContainerProps {
  width: string | number;
  height: number | string;
  children: ReactNode;
  aspect?: number;
  minWidth?: number;
  minHeight?: number;
}

type ScaleType = 'auto' | 'linear' | 'pow' | 'sqrt' | 'log' | 'identity' | 'time' | 'band' | 'point' | 'ordinal' | 'quantile' | 'quantize' | 'utc' | 'sequential' | 'threshold';

export interface AxisProps {
  dataKey?: string;
  scale?: ScaleType;
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
  shape?: React.ReactElement | ((props: any) => React.ReactElement);
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
  label?: boolean | React.ReactElement | { offsetRadius: number } | ((props: any) => React.ReactNode);
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

export type PositionType = 'top' | 'bottom' | 'left' | 'right' | 'inside' | 'outside' | 'insideLeft' |
  'insideRight' | 'insideTop' | 'insideBottom' | 'insideTopLeft' | 'insideBottomLeft' |
  'insideTopRight' | 'insideBottomRight' | 'none';

export interface LabelListProps {
  dataKey: string;
  position?: PositionType;
  offset?: number;
  angle?: number;
  formatter?: (value: any, entry: any) => React.ReactNode;
  content?: React.ReactElement | ((props: any) => React.ReactNode);
  className?: string;
  id?: string;
  value?: string | number;
}

export interface Coordinate {
  x: number;
  y: number;
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
  coordinate?: Coordinate;
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

export interface PolarAngleAxisProps {
  dataKey?: string;
  cx?: number;
  cy?: number;
  radius?: number;
  axisLineType?: 'circle' | 'polygon';
  tickLine?: boolean;
  tick?: boolean | ReactElement | Function;
  stroke?: string;
  orientation?: 'inner' | 'outer';
  tickFormatter?: (value: any) => string;
  allowDuplicatedCategory?: boolean;
}

export interface PolarRadiusAxisProps {
  angle?: number;
  cx?: number;
  cy?: number;
  domain?: Array<string | number>;
  label?: string | number | ReactElement | Function;
  orientation?: 'left' | 'right' | 'middle';
  axisLine?: boolean;
  tick?: boolean | ReactElement | Function;
  tickFormatter?: (value: any) => string;
  tickCount?: number;
  scale?: ScaleType;
  allowDuplicatedCategory?: boolean;
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

// --- Helper Hook for Delay ---
const useDelayedRender = (delayMs: number): boolean => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, delayMs);

    // Cleanup function to clear the timeout if the component unmounts
    return () => clearTimeout(timer);
  }, [delayMs]); // Rerun effect if delay changes

  return isReady;
};

// --- Chart Loading Placeholder ---
const ChartLoadingPlaceholder: FC<{ height: number | string }> = ({ height }) => (
  <PlaceholderContainer sx={{ height: height }}>
      <CircularProgress size={40} />
  </PlaceholderContainer>
);

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

// --- Apply Delay to Base chart components ---

// *** UPDATED DELAY VALUE ***
const RENDER_DELAY_MS = 2500; // 2.5 seconds

export const LineChart: FC<ChartProps> = ({
  data,
  children,
  title,
  description,
  customLegend,
  className,
  style,
  width = "100%",
  height = 400,
  margin = { top: 5, right: 30, left: 20, bottom: 5 }
}) => {
  const isReady = useDelayedRender(RENDER_DELAY_MS); // Use the delay hook

  return (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}

      {isReady ? ( // Conditionally render the chart
        <>
          <ResponsiveContainer width={width} height={height}>
            <RechartsLineChart data={data} margin={margin}>
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
        </>
      ) : (
        <ChartLoadingPlaceholder height={height} /> // Show placeholder
      )}
    </ChartContainer>
  );
};

export const BarChart: FC<ChartProps> = ({
  data,
  children,
  title,
  description,
  customLegend,
  className,
  style,
  width = "100%",
  height = 400,
  margin = { top: 5, right: 30, left: 20, bottom: 5 }
}) => {
  const isReady = useDelayedRender(RENDER_DELAY_MS); // Use the delay hook

  return (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}

      {isReady ? ( // Conditionally render the chart
        <>
          <ResponsiveContainer width={width} height={height}>
            <RechartsBarChart data={data} margin={margin}>
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
        </>
      ) : (
        <ChartLoadingPlaceholder height={height} /> // Show placeholder
      )}
    </ChartContainer>
  );
};

export const PieChart: FC<ChartProps> = ({
  children,
  title,
  description,
  customLegend,
  className,
  style,
  width = "100%",
  height = 400,
  margin = { top: 5, right: 30, left: 20, bottom: 5 }
}) => {
  const isReady = useDelayedRender(RENDER_DELAY_MS); // Use the delay hook

  return (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}

      {isReady ? ( // Conditionally render the chart
        <>
          <ResponsiveContainer width={width} height={height}>
            <RechartsPieChart margin={margin}>
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
        </>
      ) : (
        <ChartLoadingPlaceholder height={height} /> // Show placeholder
      )}
    </ChartContainer>
  );
};

export const AreaChart: FC<ChartProps> = ({
  data,
  children,
  title,
  description,
  customLegend,
  className,
  style,
  width = "100%",
  height = 400,
  margin = { top: 5, right: 30, left: 20, bottom: 5 }
}) => {
  const isReady = useDelayedRender(RENDER_DELAY_MS); // Use the delay hook

  return (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}

      {isReady ? ( // Conditionally render the chart
        <>
          <ResponsiveContainer width={width} height={height}>
            <RechartsAreaChart data={data} margin={margin}>
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
        </>
      ) : (
        <ChartLoadingPlaceholder height={height} /> // Show placeholder
      )}
    </ChartContainer>
  );
};

export const ScatterChart: FC<ChartProps> = ({
  data,
  children,
  title,
  description,
  customLegend,
  className,
  style,
  width = "100%",
  height = 400,
  margin = { top: 5, right: 30, left: 20, bottom: 5 }
}) => {
  const isReady = useDelayedRender(RENDER_DELAY_MS); // Use the delay hook

  return (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}

      {isReady ? ( // Conditionally render the chart
        <>
          <ResponsiveContainer width={width} height={height}>
            <RechartsScatterChart margin={margin}>
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
        </>
      ) : (
        <ChartLoadingPlaceholder height={height} /> // Show placeholder
      )}
    </ChartContainer>
  );
};

export const ComposedChart: FC<ChartProps> = ({
  data,
  children,
  title,
  description,
  customLegend,
  className,
  style,
  width = "100%",
  height = 400,
  margin = { top: 5, right: 30, left: 20, bottom: 5 }
}) => {
  const isReady = useDelayedRender(RENDER_DELAY_MS); // Use the delay hook

  return (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}

      {isReady ? ( // Conditionally render the chart
        <>
          <ResponsiveContainer width={width} height={height}>
            <RechartsComposedChart data={data} margin={margin}>
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
        </>
      ) : (
        <ChartLoadingPlaceholder height={height} /> // Show placeholder
      )}
    </ChartContainer>
  );
};

export const RadarChart: FC<ChartProps> = ({
  data,
  children,
  title,
  description,
  customLegend,
  className,
  style,
  width = "100%",
  height = 400,
  margin = { top: 5, right: 30, left: 20, bottom: 5 }
}) => {
  const isReady = useDelayedRender(RENDER_DELAY_MS); // Use the delay hook

  return (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}

      {isReady ? ( // Conditionally render the chart
        <>
          <ResponsiveContainer width={width} height={height}>
            <RechartsRadarChart data={data} margin={margin}>
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
        </>
      ) : (
        <ChartLoadingPlaceholder height={height} /> // Show placeholder
      )}
    </ChartContainer>
  );
};

export const RadialBarChart: FC<ChartProps> = ({
  data,
  children,
  title,
  description,
  customLegend,
  className,
  style,
  width = "100%",
  height = 400,
  margin = { top: 5, right: 30, left: 20, bottom: 5 }
}) => {
  const isReady = useDelayedRender(RENDER_DELAY_MS); // Use the delay hook

  return (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}

      {isReady ? ( // Conditionally render the chart
        <>
          <ResponsiveContainer width={width} height={height}>
            <RechartsRadialBarChart data={data} margin={margin}>
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
        </>
      ) : (
        <ChartLoadingPlaceholder height={height} /> // Show placeholder
      )}
    </ChartContainer>
  );
};

// Chart Components - Exported directly, delay applied in wrappers
export const Pie: FC<any> = (props) => <RechartsPie {...props} />;
export const Cell: FC<any> = (props) => <RechartsCell {...props} />;
export const Bar: FC<any> = (props) => <RechartsBar {...props} />;
export const Line: FC<any> = (props) => <RechartsLine {...props} />;
export const Area: FC<any> = (props) => <RechartsArea {...props} />;
export const Scatter: FC<any> = (props) => <RechartsScatter {...props} />;
export const Radar: FC<any> = (props) => <RechartsRadar {...props} />;
export const RadialBar: FC<any> = (props) => <RechartsRadialBar {...props} />;
export const Treemap: FC<any> = (props) => <RechartsTreemap {...props} />;

// Axes Components - Exported directly
export const XAxis: FC<any> = (props) => <RechartsXAxis {...props} />;
export const YAxis: FC<any> = (props) => <RechartsYAxis {...props} />;
export const PolarAngleAxis: FC<any> = (props) => <RechartsPolarAngleAxis {...props} />;
export const PolarRadiusAxis: FC<any> = (props) => <RechartsPolarRadiusAxis {...props} />;
export const PolarGrid: FC<any> = (props) => <RechartsPolarGrid {...props} />;

// Helper Components - Exported directly
export const CartesianGrid: FC<{ strokeDasharray?: string; vertical?: boolean; horizontal?: boolean }> = (props) =>
  <RechartsCartesianGrid {...props} />;
export const Tooltip: FC<any> = (props) => <RechartsTooltip {...props} />;
export const Legend: FC<any> = (props) => <RechartsLegend {...props} />;
export const LabelList: FC<any> = (props) => <RechartsLabelList {...props} />;
export const Brush: FC<any> = (props) => <RechartsBrush {...props} />;

// --- Apply Delay to Custom Chart Types ---

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
  const isReady = useDelayedRender(RENDER_DELAY_MS); // Use the delay hook

  const getColorByValue = (value: number, min: number, max: number) => {
    const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
    const colorIndex = Math.floor(normalizedValue * (colors.length - 1));
    return colors[colorIndex];
  };

  // Calculate min and max values across all data
  const allValues = data.flatMap(d => dataKeys.map(key => d[key])).filter(v => v !== undefined && typeof v === 'number');
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;

  const CustomizedLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    // Only render label if value is defined and numeric
    if (value === undefined || value === null || isNaN(Number(value))) {
        return null;
    }
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize={12}
      >
        {Number(value).toFixed(0)} {/* Format value if needed */}
      </text>
    );
  };

  return (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}

      {isReady ? ( // Conditionally render the chart
        <>
          <ResponsiveContainer width={width} height={height}>
            <RechartsComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <RechartsCartesianGrid strokeDasharray="3 3" />
              <RechartsXAxis dataKey={xAxis} />
              <RechartsYAxis type="category" dataKey="name" />
              <RechartsTooltip
                formatter={(value, name) => [`${value}`, name]}
                labelFormatter={(label) => `${label}`}
              />
              <RechartsLegend />

              {dataKeys.map((dataKey, idx) => (
                <RechartsBar
                  key={idx}
                  dataKey={dataKey}
                  shape={(props: any) => {
                    const { x, y, width, height, value, payload } = props; // Get payload for item-specific value
                    // Ensure value is numeric before processing
                    const numericValue = (value !== undefined && value !== null && !isNaN(Number(value))) ? Number(value) : undefined;
                    const fillColor = numericValue !== undefined ? getColorByValue(numericValue, minValue, maxValue) : '#cccccc'; // Use gray for non-numeric/missing

                    return (
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={fillColor}
                        stroke="#fff"
                        strokeWidth={1}
                        rx={2}
                        ry={2}
                      />
                    );
                  }}
                >
                  <RechartsLabelList dataKey={dataKey} position="inside" content={<CustomizedLabel />} />
                </RechartsBar>
              ))}
            </RechartsComposedChart>
          </ResponsiveContainer>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ fontSize: '0.75rem' }}>{minValue.toFixed(0)}</div>
              <div style={{ display: 'flex', height: '20px', width: '200px' }}>
                {colors.map((color, i) => (
                  <div
                    key={i}
                    style={{ backgroundColor: color, height: '100%', flex: 1 }}
                  />
                ))}
              </div>
              <div style={{ fontSize: '0.75rem' }}>{maxValue.toFixed(0)}</div>
            </div>
          </div>
        </>
      ) : (
        <ChartLoadingPlaceholder height={height} /> // Show placeholder
      )}
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
  style,
  height = 200, // Adjust default height for calendar
  width = "100%"
}) => {
  const isReady = useDelayedRender(RENDER_DELAY_MS); // Use the delay hook

  // --- Helper functions for CalendarHeatMap (remain the same) ---
  const getDaysBetweenDates = (start: Date, end: Date) => {
      const dates = [];
      const currentDate = new Date(start);
      currentDate.setHours(0, 0, 0, 0);
      const finalEndDate = new Date(end);
      finalEndDate.setHours(0, 0, 0, 0);

      while (currentDate <= finalEndDate) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- Calendar calculation logic (remains mostly the same, check dependencies) ---
  const getAllDays = getDaysBetweenDates(startDate, endDate);
  const valueMap = new Map(data.map(item => [item.date, item.value]));
  const values = data.map(item => item.value).filter(v => typeof v === 'number');
  const maxValue = values.length > 0 ? Math.max(...values) : 1;

  const getColorByValue = (value?: number) => {
    if (value === undefined || value === null) return emptyColor;
    const numericValue = Number(value);
    if (isNaN(numericValue)) return emptyColor;
    if (numericValue === 0 && colorScale.length > 0) return colorScale[0]; // Use first color for explicit 0

    const safeMaxValue = Math.max(1, maxValue);
    const normalizedValue = Math.max(0, Math.min(1, numericValue / safeMaxValue));

    // Scale non-zero values across the remaining colors (index 1 to N)
    const colorIndex = Math.min(colorScale.length - 1, Math.max(1, Math.ceil(normalizedValue * (colorScale.length - 1))));

    return colorScale[colorIndex] || emptyColor;
  };

  // Group days by week
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = Array(7).fill(null);
  // Start filling the first week based on the start date's day of the week
  getAllDays.forEach((day, index) => {
      const dayOfWeek = day.getDay(); // 0 = Sunday, 6 = Saturday
      currentWeek[dayOfWeek] = day;

      // If it's Saturday or the last day overall, push the week and start a new one
      if (dayOfWeek === 6 || index === getAllDays.length - 1) {
          weeks.push([...currentWeek]); // Push a copy
          currentWeek = Array(7).fill(null); // Reset for the next week
      }
  });


  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ChartContainer className={className} style={style}>
      {title && <ChartTitle>{title}</ChartTitle>}
      {description && <ChartDescription>{description}</ChartDescription>}

      {isReady ? ( // Conditionally render the chart
        <div style={{ overflowX: 'auto', width: '100%' }}>
          {/* Month Labels */}
          <div style={{ display: 'flex', paddingLeft: '34px', marginBottom: '5px', boxSizing: 'border-box' }}>
              {weeks.map((week, weekIndex) => {
                  const firstNonNullDay = week.find(d => d !== null);
                  if (!firstNonNullDay) return <div key={weekIndex} style={{ width: '12px', marginRight: '2px' }}></div>;

                  const month = firstNonNullDay.getMonth();
                  // Determine if the previous week ended in a different month
                  let prevMonth = -1;
                  if (weekIndex > 0) {
                      const prevWeekLastNonNullDay = [...weeks[weekIndex - 1]].reverse().find(d => d !== null);
                      if (prevWeekLastNonNullDay) {
                          prevMonth = prevWeekLastNonNullDay.getMonth();
                      }
                  }

                  // Show label if it's the first week OR the month changes from the previous week's end
                   // OR if the first day of this week is within the first 7 days of the month
                  const showLabel = weekIndex === 0 || month !== prevMonth || firstNonNullDay.getDate() <= 7;


                  return (
                      <div
                          key={weekIndex}
                          style={{
                              width: '12px', // Cell width + margin-right
                              marginRight: '2px',
                              fontSize: '10px',
                              color: '#767676',
                              visibility: showLabel ? 'visible' : 'hidden',
                              textAlign: 'left',
                              whiteSpace: 'nowrap' // Prevent wrapping
                          }}
                      >
                          {monthLabels[month]}
                      </div>
                  );
              })}
          </div>

          <div style={{ display: 'flex' }}>
            {/* Day Labels */}
            <div style={{ width: '30px', marginRight: '4px', paddingTop: '1px' }}>
              {dayLabels.map((_, i) => (
                // Show label only for Mon, Wed, Fri
                (i === 1 || i === 3 || i === 5) && (
                  <div
                    key={i}
                    style={{
                      height: '10px', // Match cell height
                      fontSize: '9px',
                      color: '#767676',
                      textAlign: 'right',
                      marginBottom: '2px', // Match cell margin
                      lineHeight: '10px' // Vertical align text
                    }}
                  >
                    {dayLabels[i]} {/* Correctly show Mon, Wed, Fri */}
                  </div>
                )
              ))}
            </div>

            {/* Heatmap Grid */}
            <div style={{ display: 'flex', flexGrow: 1 }}>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} style={{ width: '10px', marginRight: '2px' }}>
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      // Render an empty placeholder if day is null
                       return (
                          <div
                              key={dayIndex}
                              style={{
                                  width: '10px',
                                  height: '10px',
                                  backgroundColor: 'transparent', // Invisible
                                  marginBottom: '2px',
                              }}
                          />
                      );
                    }
                    // Proceed if day is not null
                    const dateString = formatDate(day);
                    const value = valueMap.get(dateString);
                    const color = getColorByValue(value);

                    return (
                      <MuiTooltip // Use MUI Tooltip
                          title={day ? `${day.toDateString()}: ${value ?? 'No data'}` : ''}
                          placement="top"
                          arrow
                          key={dayIndex}
                          componentsProps={{ tooltip: { sx: { fontSize: '0.7rem' } } }} // Style the tooltip
                      >
                          <div
                            style={{
                              width: '10px',
                              height: '10px',
                              backgroundColor: color,
                              marginBottom: '2px',
                              borderRadius: '2px',
                              outline: '1px solid rgba(27, 31, 35, 0.06)',
                              outlineOffset: '-1px'
                            }}
                          />
                      </MuiTooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '10px', fontSize: '10px', color: '#555' }}>
              <span>Less</span>
              {colorScale.map((color, i) => (
                  <div
                      key={i}
                      style={{
                          width: '10px',
                          height: '10px',
                          backgroundColor: color,
                          outline: '1px solid rgba(27, 31, 35, 0.06)',
                          outlineOffset: '-1px',
                          borderRadius: '2px'
                      }}
                  />
              ))}
              <span>More</span>
          </div>
        </div>
      ) : (
        <ChartLoadingPlaceholder height={typeof height === 'number' ? `${height}px` : height} /> // Show placeholder
      )}
    </ChartContainer>
  );
};


// Export all components including the modified ones
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