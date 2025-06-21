// Fixed Chart Components with proper Recharts integration
import React from 'react';
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
  AreaChart,
  Area,
} from 'recharts';

// Chart Colors Configuration
export const CHART_COLORS = {
  primary: '#d4af37',
  secondary: '#ffffff',
  human: '#d4af37',
  vehicle: '#ffffff',
  weekday: '#d4af37',
  weekend: '#ffffff',
  morning: '#d4af37',
  day: '#ffffff',
  evening: '#aaaaaa',
  grid: '#444',
  text: '#aaa',
  background: '#222222'
};

// Custom Label Component for Bar Charts
interface CustomLabelProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number | string | null;
  offset?: number;
  index?: number;
}

export const CustomBarLabel: React.FC<CustomLabelProps> = (props) => {
  const { x, y, width, height, value } = props;

  // Only render the label if value is a positive number
  if (value === undefined || value === null || typeof value !== 'number' || value <= 0) {
    return null;
  }

  // Position label above the bar
  const labelX = (x ?? 0) + (width ?? 0) / 2;
  const labelY = (y ?? 0) - 5;

  return (
    <text
      x={labelX}
      y={labelY}
      fill="#fff"
      fontSize="12px"
      textAnchor="middle"
      dominantBaseline="bottom"
    >
      {value}
    </text>
  );
};

// Common chart props
const commonTooltipStyle = {
  contentStyle: { 
    backgroundColor: '#333', 
    border: '1px solid #555', 
    color: '#d4af37', 
    borderRadius: '4px', 
    padding: '8px 12px' 
  },
  labelStyle: { color: '#fff', marginBottom: '5px' },
  itemStyle: { color: '#eee' },
  cursor: { fill: 'rgba(212, 175, 55, 0.15)' }
};

const commonLegendStyle = { 
  color: '#aaa', 
  marginTop: '10px' 
};

// Pie Chart Label Formatters
export const formatPieLabel = (props: any): string => {
  const { name, percent, value } = props;
  if (value > 0 && percent > 0.03) {
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  }
  return '';
};

export const formatPieLabelWithValue = (props: any): string => {
  const { name, value, percent } = props;
  if (value > 0 && percent > 0.03) {
    return `${name}: ${value} (${(percent * 100).toFixed(1)}%)`;
  }
  return '';
};

// Chart Components
interface ChartProps {
  data: any[];
  width?: string | number;
  height?: number;
}

export const EnhancedBarChart: React.FC<ChartProps> = ({ data, width = "100%", height = 400 }) => (
  <ResponsiveContainer width={width} height={height}>
    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
      <XAxis dataKey="day" stroke={CHART_COLORS.text} />
      <YAxis stroke={CHART_COLORS.text} />
      <Tooltip {...commonTooltipStyle} />
      <Legend wrapperStyle={commonLegendStyle} />
      <Bar dataKey="humanIntrusions" name="Human Intrusions" fill={CHART_COLORS.human}>
        <LabelList dataKey="humanIntrusions" content={<CustomBarLabel />} />
      </Bar>
      <Bar dataKey="vehicleIntrusions" name="Vehicle Intrusions" fill={CHART_COLORS.vehicle}>
        <LabelList dataKey="vehicleIntrusions" content={<CustomBarLabel />} />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export const EnhancedLineChart: React.FC<ChartProps> = ({ data, width = "100%", height = 400 }) => (
  <ResponsiveContainer width={width} height={height}>
    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
      <XAxis dataKey="day" stroke={CHART_COLORS.text} />
      <YAxis stroke={CHART_COLORS.text} />
      <Tooltip {...commonTooltipStyle} />
      <Legend wrapperStyle={commonLegendStyle} />
      <Line 
        type="monotone" 
        dataKey="humanIntrusions" 
        name="Human Intrusions" 
        stroke={CHART_COLORS.human} 
        strokeWidth={2} 
        dot={{ r: 4 }} 
        activeDot={{ r: 7 }} 
      />
      <Line 
        type="monotone" 
        dataKey="vehicleIntrusions" 
        name="Vehicle Intrusions" 
        stroke={CHART_COLORS.vehicle} 
        strokeWidth={2} 
        dot={{ r: 4 }} 
        activeDot={{ r: 7 }} 
      />
    </LineChart>
  </ResponsiveContainer>
);

export const EnhancedPieChart: React.FC<ChartProps> = ({ data, width = "100%", height = 400 }) => (
  <ResponsiveContainer width={width} height={height}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={true}
        outerRadius={150}
        dataKey="value"
        nameKey="name"
        label={formatPieLabelWithValue}
      >
        {data.map((entry, index) => (
          <Cell 
            key={`cell-${index}`} 
            fill={entry.name === 'Human' ? CHART_COLORS.human : CHART_COLORS.vehicle} 
          />
        ))}
      </Pie>
      <Tooltip contentStyle={commonTooltipStyle.contentStyle} />
      <Legend wrapperStyle={commonLegendStyle} />
    </PieChart>
  </ResponsiveContainer>
);

export const EnhancedAreaChart: React.FC<ChartProps> = ({ data, width = "100%", height = 400 }) => (
  <ResponsiveContainer width={width} height={height}>
    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
      <XAxis dataKey="day" stroke={CHART_COLORS.text} />
      <YAxis stroke={CHART_COLORS.text} />
      <Tooltip {...commonTooltipStyle} />
      <Legend wrapperStyle={commonLegendStyle} />
      <Area 
        type="monotone" 
        dataKey="humanIntrusions" 
        name="Human Intrusions" 
        stackId="1" 
        stroke={CHART_COLORS.human} 
        fill={`${CHART_COLORS.human}B3`} 
      />
      <Area 
        type="monotone" 
        dataKey="vehicleIntrusions" 
        name="Vehicle Intrusions" 
        stackId="1" 
        stroke={CHART_COLORS.vehicle} 
        fill={`${CHART_COLORS.vehicle}80`} 
      />
    </AreaChart>
  </ResponsiveContainer>
);

// Chart Error Boundary
interface ChartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ChartErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          backgroundColor: '#1a1a1a', 
          color: '#e0e0e0', 
          border: '1px solid #333',
          borderRadius: '8px' 
        }}>
          <h3>Chart Error</h3>
          <p>Unable to render chart. Please try refreshing.</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#d4af37',
              color: '#222',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Chart Wrapper Component
interface ChartWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({ children, title, description }) => (
  <div style={{ 
    backgroundColor: CHART_COLORS.background, 
    padding: '1.5rem', 
    borderRadius: '8px',
    marginBottom: '1rem'
  }}>
    {title && (
      <h4 style={{ 
        color: CHART_COLORS.primary, 
        marginBottom: '0.5rem',
        fontSize: '1.1rem',
        fontWeight: '600'
      }}>
        {title}
      </h4>
    )}
    {description && (
      <p style={{ 
        color: CHART_COLORS.text, 
        marginBottom: '1rem',
        fontSize: '0.9rem'
      }}>
        {description}
      </p>
    )}
    <ChartErrorBoundary>
      {children}
    </ChartErrorBoundary>
  </div>
);
