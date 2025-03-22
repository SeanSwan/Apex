// File: frontend/src/components/Reports/ChartComponents.tsx

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
    LabelList as RechartsLabelList
  } from 'recharts';
  import { FC, ReactNode } from 'react';
  
  // Type definitions for wrapper components
  interface ResponsiveContainerProps {
    width: string | number;
    height: number;
    children: ReactNode;
  }
  
  interface CellProps {
    fill?: string;
  }
  
  interface BarProps {
    dataKey: string;
    name?: string;
    fill?: string;
    children?: ReactNode;
  }
  
  interface LineProps {
    type?: string;
    dataKey: string;
    name?: string;
    stroke?: string;
    strokeWidth?: number;
  }
  
  interface PieProps {
    data: any[];
    cx?: string | number;
    cy?: string | number;
    labelLine?: boolean;
    outerRadius?: number;
    fill?: string;
    dataKey: string;
    nameKey?: string;
    label?: any;
    children?: ReactNode;
  }
  
  interface AxisProps {
    dataKey?: string;
    scale?: string;
    domain?: [any, any];
    children?: ReactNode;
  }
  
  interface LabelListProps {
    dataKey: string;
    position?: string;
  }
  
  // Create wrapper components that handle the TypeScript errors
  export const ResponsiveContainer: FC<ResponsiveContainerProps> = ({ width, height, children }) => (
    <RechartsResponsiveContainer width={width} height={height}>
      {children}
    </RechartsResponsiveContainer>
  );
  
  export const LineChart: FC<{ data?: any[]; children?: ReactNode }> = ({ data, children }) => (
    <RechartsLineChart data={data}>{children}</RechartsLineChart>
  );
  
  export const BarChart: FC<{ data?: any[]; children?: ReactNode }> = ({ data, children }) => (
    <RechartsBarChart data={data}>{children}</RechartsBarChart>
  );
  
  export const PieChart: FC<{ children?: ReactNode }> = ({ children }) => (
    <RechartsPieChart>{children}</RechartsPieChart>
  );
  
  export const Pie: FC<PieProps> = (props) => <RechartsPie {...props} />;
  
  export const Cell: FC<CellProps> = ({ fill }) => <RechartsCell fill={fill} />;
  
  export const Bar: FC<BarProps> = ({ dataKey, name, fill, children }) => (
    <RechartsBar dataKey={dataKey} name={name} fill={fill}>
      {children}
    </RechartsBar>
  );
  
  export const Line: FC<LineProps> = ({ type, dataKey, name, stroke, strokeWidth }) => (
    <RechartsLine type={type} dataKey={dataKey} name={name} stroke={stroke} strokeWidth={strokeWidth} />
  );
  
  export const XAxis: FC<AxisProps> = ({ dataKey, children }) => (
    <RechartsXAxis dataKey={dataKey}>{children}</RechartsXAxis>
  );
  
  export const YAxis: FC<AxisProps> = ({ dataKey, children }) => (
    <RechartsYAxis dataKey={dataKey}>{children}</RechartsYAxis>
  );
  
  export const CartesianGrid: FC<{ strokeDasharray?: string }> = ({ strokeDasharray }) => (
    <RechartsCartesianGrid strokeDasharray={strokeDasharray} />
  );
  
  export const Tooltip: FC = () => <RechartsTooltip />;
  
  export const Legend: FC = () => <RechartsLegend />;
  
  export const LabelList: FC<LabelListProps> = ({ dataKey, position }) => (
    <RechartsLabelList dataKey={dataKey} position={position} />
  );