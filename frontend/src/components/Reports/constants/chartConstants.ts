/**
 * Chart Constants - Chart Colors, Configurations, and Default Values
 * Extracted from DataVisualizationPanel for better modularity
 * Production-ready constants for data visualization
 */

// === CHART COLORS ===
export const CHART_COLORS = {
  human: '#d4af37',
  vehicle: '#ffffff',
  weekday: '#d4af37',
  weekend: '#ffffff',
  primary: '#d4af37',
  secondary: '#ffffff',
  accent: '#ffd700',
  background: '#1a1a1a',
  border: '#333333',
  text: '#ffffff',
  muted: '#666666'
} as const;

// === CHART DIMENSIONS ===
export const CHART_DIMENSIONS = {
  width: '100%' as const,
  height: 400,
  minHeight: 410,
  margin: {
    top: 20,
    right: 30,
    left: 20,
    bottom: 5
  }
} as const;

// === CHART CONFIGURATION ===
export const CHART_CONFIG = {
  tooltip: {
    contentStyle: { 
      backgroundColor: '#333', 
      border: '1px solid #555', 
      color: '#d4af37', 
      borderRadius: '4px', 
      padding: '8px 12px' 
    },
    labelStyle: { 
      color: '#fff', 
      marginBottom: '5px' 
    },
    itemStyle: { 
      color: '#eee' 
    },
    cursor: { 
      fill: 'rgba(212, 175, 55, 0.15)' 
    }
  },
  legend: {
    style: { 
      color: '#aaa', 
      marginTop: '10px' 
    }
  },
  grid: {
    strokeDasharray: '3 3',
    stroke: '#444'
  },
  axis: {
    stroke: '#aaa'
  },
  bar: {
    radius: [4, 4, 0, 0] as [number, number, number, number]
  }
} as const;

// === KEYWORDS FOR CONTENT ANALYSIS ===
export const ANALYSIS_KEYWORDS = {
  human: [
    'person', 'persons', 'individual', 'pedestrian', 'trespasser', 
    'visitor', 'human', 'people', 'man', 'woman', 'personnel', 
    'staff', 'employee', 'unauthorized'
  ],
  vehicle: [
    'vehicle', 'vehicles', 'car', 'truck', 'van', 'motorcycle', 
    'bike', 'automobile', 'delivery', 'service vehicle', 'patrol car', 
    'traffic'
  ],
  incident: [
    'incident', 'breach', 'intrusion', 'violation', 'unauthorized', 
    'suspicious', 'alert', 'alarm', 'activity', 'trespassing'
  ],
  normal: [
    'normal', 'routine', 'standard', 'quiet', 'secure', 
    'no incidents', 'all clear', 'patrol completed', 'uneventful'
  ]
} as const;

// === DAY MAPPING ===
export const DAY_MAPPING = {
  'Monday': 'Monday',
  'Tuesday': 'Tuesday', 
  'Wednesday': 'Wednesday',
  'Thursday': 'Thursday',
  'Friday': 'Friday',
  'Saturday': 'Saturday',
  'Sunday': 'Sunday'
} as const;

// === SECURITY CODE WEIGHTS ===
export const SECURITY_CODE_WEIGHTS = {
  'Code 1': { human: 3, vehicle: 2, threats: 2 },
  'Code 2': { human: 2, vehicle: 1, threats: 1 },
  'Code 3': { human: 1, vehicle: 0, threats: 0 },
  'Code 4': { human: 0, vehicle: 0, threats: 0 }
} as const;

// === LOCAL STORAGE CONFIGURATION ===
export const LOCAL_STORAGE_CONFIG = {
  key: 'apexAiReportData',
  version: '1.0',
  autoSaveInterval: 30000, // 30 seconds
  maxRetries: 3
} as const;

// === CHART GENERATION CONFIGURATION ===
export const CHART_GENERATION_CONFIG = {
  maxAttempts: 30,
  waitInterval: 1000, // 1 second
  finalBuffer: 2000, // 2 seconds
  cooldownPeriod: 3000, // 3 seconds
  canvasSettings: {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    allowTaint: true,
    imageFormat: 'image/png' as const,
    quality: 0.95
  }
} as const;

// === DEFAULT METRICS VALUES ===
export const DEFAULT_METRICS = {
  totalCameras: 12,
  camerasOnline: 12,
  totalMonitoringHours: 168,
  operationalUptime: 95.0,
  aiAccuracy: 95.0,
  responseTime: 3.0,
  potentialThreats: 0,
  proactiveAlerts: 0
} as const;

// === TAB TYPES ===
export const TAB_TYPES = {
  OVERVIEW: 'overview',
  INTRUSIONS: 'intrusions',
  TRENDS: 'trends',
  COMPARISON: 'comparison'
} as const;

// === TIMEFRAME TYPES ===
export const TIMEFRAME_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly'
} as const;

// === COMPARISON TYPES ===
export const COMPARISON_TYPES = {
  HUMAN_VS_VEHICLE: 'humanVsVehicle',
  WEEKDAY_VS_WEEKEND: 'weekdayVsWeekend'
} as const;

// === EXPORT TYPES ===
export type ActiveTabType = typeof TAB_TYPES[keyof typeof TAB_TYPES];
export type TimeframeType = typeof TIMEFRAME_TYPES[keyof typeof TIMEFRAME_TYPES];
export type ComparisonType = typeof COMPARISON_TYPES[keyof typeof COMPARISON_TYPES];
export type SecurityCodeType = keyof typeof SECURITY_CODE_WEIGHTS;

// === UTILITY FUNCTIONS ===
export const getChartColor = (type: keyof typeof CHART_COLORS, fallback: string = '#d4af37') => {
  return CHART_COLORS[type] || fallback;
};

export const getSecurityCodeWeight = (code: SecurityCodeType, type: 'human' | 'vehicle' | 'threats') => {
  return SECURITY_CODE_WEIGHTS[code][type] || 0;
};

export const getDayName = (day: string) => {
  return DAY_MAPPING[day as keyof typeof DAY_MAPPING] || day;
};
