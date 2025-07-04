/**
 * Chart Data Transformer - Data Transformation Utilities for Chart Generation
 * Extracted from DataVisualizationPanel for better modularity
 * Production-ready data transformation with validation and error handling
 */

import { DailyReport, ClientData, MetricsData } from '../../../types/reports';
import { getMetricValue } from './chartDataAnalyzer';
import { DAY_MAPPING, ANALYSIS_KEYWORDS } from '../constants/chartConstants';

/**
 * Data structure interfaces for different chart types
 */
export interface DailyDataPoint {
  day: string;
  humanIntrusions: number;
  vehicleIntrusions: number;
  total: number;
}

export interface SummaryDataPoint {
  name: string;
  value: number;
}

export interface WeekdayWeekendDataPoint {
  name: string;
  human: number;
  vehicle: number;
  total: number;
}

export interface HourlyDataPoint {
  hour: string;
  human: number;
  vehicle: number;
  total: number;
}

export interface ChartDataSet {
  dailyData: DailyDataPoint[];
  weeklySummary: SummaryDataPoint[];
  weekdayVsWeekendData: WeekdayWeekendDataPoint[];
  hourlyAggregates: HourlyDataPoint[];
}

/**
 * Transform metrics data into comprehensive chart datasets
 * 
 * @param metrics - Raw metrics data
 * @returns Complete chart dataset with all visualizations
 */
export const transformMetricsToChartData = (metrics: MetricsData): ChartDataSet => {
  const safeHumanIntrusions = metrics.humanIntrusions || {};
  const safeVehicleIntrusions = metrics.vehicleIntrusions || {};
  
  return {
    dailyData: generateDailyData(safeHumanIntrusions, safeVehicleIntrusions),
    weeklySummary: generateWeeklySummary(safeHumanIntrusions, safeVehicleIntrusions),
    weekdayVsWeekendData: generateWeekdayWeekendData(safeHumanIntrusions, safeVehicleIntrusions),
    hourlyAggregates: generateHourlyAggregates(safeHumanIntrusions, safeVehicleIntrusions)
  };
};

/**
 * Generate daily data points for daily activity charts
 */
const generateDailyData = (
  humanIntrusions: { [key: string]: number },
  vehicleIntrusions: { [key: string]: number }
): DailyDataPoint[] => {
  const daysOfWeek = Object.keys(DAY_MAPPING);
  
  return daysOfWeek.map(day => {
    const human = getMetricValue(humanIntrusions, day);
    const vehicle = getMetricValue(vehicleIntrusions, day);
    
    return {
      day,
      humanIntrusions: human,
      vehicleIntrusions: vehicle,
      total: human + vehicle
    };
  });
};

/**
 * Generate weekly summary data for pie charts and overview
 */
const generateWeeklySummary = (
  humanIntrusions: { [key: string]: number },
  vehicleIntrusions: { [key: string]: number }
): SummaryDataPoint[] => {
  const totalHuman = Object.values(humanIntrusions).reduce((sum, val) => sum + (val || 0), 0);
  const totalVehicle = Object.values(vehicleIntrusions).reduce((sum, val) => sum + (val || 0), 0);
  
  return [
    { name: 'Human', value: totalHuman },
    { name: 'Vehicle', value: totalVehicle }
  ].filter(item => item.value > 0);
};

/**
 * Generate weekday vs weekend comparison data
 */
const generateWeekdayWeekendData = (
  humanIntrusions: { [key: string]: number },
  vehicleIntrusions: { [key: string]: number }
): WeekdayWeekendDataPoint[] => {
  const weekdayDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const weekendDays = ['Saturday', 'Sunday'];
  
  const weekdayData = {
    human: weekdayDays.reduce((sum, day) => sum + getMetricValue(humanIntrusions, day), 0),
    vehicle: weekdayDays.reduce((sum, day) => sum + getMetricValue(vehicleIntrusions, day), 0)
  };
  
  const weekendData = {
    human: weekendDays.reduce((sum, day) => sum + getMetricValue(humanIntrusions, day), 0),
    vehicle: weekendDays.reduce((sum, day) => sum + getMetricValue(vehicleIntrusions, day), 0)
  };
  
  return [
    {
      name: 'Weekday',
      human: weekdayData.human,
      vehicle: weekdayData.vehicle,
      total: weekdayData.human + weekdayData.vehicle
    },
    {
      name: 'Weekend',
      human: weekendData.human,
      vehicle: weekendData.vehicle,
      total: weekendData.human + weekendData.vehicle
    }
  ];
};

/**
 * Generate hourly aggregates for time-based trend analysis
 */
const generateHourlyAggregates = (
  humanIntrusions: { [key: string]: number },
  vehicleIntrusions: { [key: string]: number }
): HourlyDataPoint[] => {
  const totalHuman = Object.values(humanIntrusions).reduce((sum, val) => sum + (val || 0), 0);
  const totalVehicle = Object.values(vehicleIntrusions).reduce((sum, val) => sum + (val || 0), 0);
  const dailyTotal = totalHuman + totalVehicle;
  
  return Array.from({ length: 24 }, (_, hour) => {
    const hourStr = `${hour.toString().padStart(2, '0')}:00`;
    
    // Simulate realistic hourly distribution
    const hourlyFactor = calculateHourlyFactor(hour);
    const hourlyTotal = Math.round((dailyTotal / 168) * hourlyFactor * 7); // 168 hours per week
    const humanRatio = dailyTotal > 0 ? totalHuman / dailyTotal : 0.6;
    
    return {
      hour: hourStr,
      human: Math.round(hourlyTotal * humanRatio),
      vehicle: Math.round(hourlyTotal * (1 - humanRatio)),
      total: hourlyTotal
    };
  });
};

/**
 * Calculate realistic hourly activity factor
 * Models typical security activity patterns throughout the day
 */
const calculateHourlyFactor = (hour: number): number => {
  // Early morning (0-6): Lower activity
  if (hour >= 0 && hour < 6) return 0.6;
  
  // Morning (6-9): Moderate activity
  if (hour >= 6 && hour < 9) return 1.0;
  
  // Business hours (9-17): Higher activity
  if (hour >= 9 && hour < 17) return 1.3;
  
  // Evening (17-22): Moderate activity
  if (hour >= 17 && hour < 22) return 1.1;
  
  // Night (22-24): Lower activity
  return 0.7;
};

/**
 * Transform daily reports into activity frequency data
 * Analyzes report content to extract activity patterns
 */
export const transformReportsToActivityData = (reports: DailyReport[]): {
  activityByDay: { [key: string]: number };
  contentAnalysis: {
    totalWords: number;
    averageWordsPerReport: number;
    keywordFrequency: { [key: string]: number };
  };
} => {
  const activityByDay: { [key: string]: number } = {};
  let totalWords = 0;
  const keywordFrequency: { [key: string]: number } = {};
  
  // Initialize day counters
  Object.keys(DAY_MAPPING).forEach(day => {
    activityByDay[day] = 0;
  });
  
  reports.forEach(report => {
    const content = (report.content || '').toLowerCase();
    const day = DAY_MAPPING[report.day as keyof typeof DAY_MAPPING] || report.day;
    
    // Count words
    const words = content.split(/\s+/).filter(word => word.length > 0);
    totalWords += words.length;
    
    // Analyze keyword frequency
    Object.values(ANALYSIS_KEYWORDS).flat().forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = content.match(regex) || [];
      if (matches.length > 0) {
        keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + matches.length;
        activityByDay[day] += matches.length;
      }
    });
    
    // Add base activity for non-empty reports
    if (words.length > 10) {
      activityByDay[day] += 1;
    }
  });
  
  return {
    activityByDay,
    contentAnalysis: {
      totalWords,
      averageWordsPerReport: reports.length > 0 ? totalWords / reports.length : 0,
      keywordFrequency
    }
  };
};

/**
 * Generate time-series data for trend analysis
 */
export const generateTimeSeriesData = (
  dailyData: DailyDataPoint[],
  timeframe: 'daily' | 'weekly' = 'daily'
): Array<{ 
  period: string; 
  value: number; 
  human: number; 
  vehicle: number; 
  trend: 'up' | 'down' | 'stable' 
}> => {
  if (timeframe === 'daily') {
    return dailyData.map((data, index) => {
      const prevData = index > 0 ? dailyData[index - 1] : null;
      let trend: 'up' | 'down' | 'stable' = 'stable';
      
      if (prevData) {
        if (data.total > prevData.total) trend = 'up';
        else if (data.total < prevData.total) trend = 'down';
      }
      
      return {
        period: data.day,
        value: data.total,
        human: data.humanIntrusions,
        vehicle: data.vehicleIntrusions,
        trend
      };
    });
  }
  
  // Weekly aggregation (simplified for this example)
  const weeklyTotal = dailyData.reduce((sum, data) => sum + data.total, 0);
  const weeklyHuman = dailyData.reduce((sum, data) => sum + data.humanIntrusions, 0);
  const weeklyVehicle = dailyData.reduce((sum, data) => sum + data.vehicleIntrusions, 0);
  
  return [{
    period: 'Current Week',
    value: weeklyTotal,
    human: weeklyHuman,
    vehicle: weeklyVehicle,
    trend: 'stable' as const
  }];
};

/**
 * Filter and sort data based on criteria
 */
export const filterAndSortChartData = <T extends Record<string, any>>(
  data: T[],
  filterCriteria: {
    minValue?: number;
    maxValue?: number;
    includeZeros?: boolean;
    sortBy?: keyof T;
    sortOrder?: 'asc' | 'desc';
  } = {}
): T[] => {
  const {
    minValue = 0,
    maxValue = Infinity,
    includeZeros = true,
    sortBy,
    sortOrder = 'asc'
  } = filterCriteria;
  
  let filteredData = data.filter(item => {
    const value = typeof item.total === 'number' ? item.total : 
                  typeof item.value === 'number' ? item.value : 0;
    
    if (!includeZeros && value === 0) return false;
    if (value < minValue || value > maxValue) return false;
    
    return true;
  });
  
  if (sortBy) {
    filteredData.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? 
          aVal.localeCompare(bVal) : 
          bVal.localeCompare(aVal);
      }
      
      return 0;
    });
  }
  
  return filteredData;
};

/**
 * Validate chart data integrity
 */
export const validateChartData = (data: ChartDataSet): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate daily data
  if (!Array.isArray(data.dailyData) || data.dailyData.length === 0) {
    errors.push('Daily data is missing or empty');
  } else {
    const hasValidData = data.dailyData.some(d => d.total > 0);
    if (!hasValidData) {
      warnings.push('No activity data found in daily reports');
    }
    
    // Check for missing days
    const expectedDays = Object.keys(DAY_MAPPING);
    const actualDays = data.dailyData.map(d => d.day);
    const missingDays = expectedDays.filter(day => !actualDays.includes(day));
    
    if (missingDays.length > 0) {
      warnings.push(`Missing data for days: ${missingDays.join(', ')}`);
    }
  }
  
  // Validate weekly summary
  if (!Array.isArray(data.weeklySummary) || data.weeklySummary.length === 0) {
    errors.push('Weekly summary data is missing or empty');
  }
  
  // Validate weekday vs weekend data
  if (!Array.isArray(data.weekdayVsWeekendData) || data.weekdayVsWeekendData.length !== 2) {
    errors.push('Weekday vs weekend comparison data is invalid');
  }
  
  // Validate hourly aggregates
  if (!Array.isArray(data.hourlyAggregates) || data.hourlyAggregates.length !== 24) {
    errors.push('Hourly aggregates data is invalid (should have 24 hours)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Export data in different formats for external use
 */
export const exportChartData = (
  data: ChartDataSet,
  format: 'csv' | 'json' | 'xlsx' = 'json'
): string => {
  switch (format) {
    case 'csv':
      return convertToCSV(data);
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'xlsx':
      // This would require a library like xlsx
      console.warn('XLSX export not implemented, returning JSON');
      return JSON.stringify(data, null, 2);
    default:
      return JSON.stringify(data, null, 2);
  }
};

/**
 * Convert chart data to CSV format
 */
const convertToCSV = (data: ChartDataSet): string => {
  const rows: string[] = [];
  
  // Add daily data
  rows.push('Day,Human Intrusions,Vehicle Intrusions,Total');
  data.dailyData.forEach(item => {
    rows.push(`${item.day},${item.humanIntrusions},${item.vehicleIntrusions},${item.total}`);
  });
  
  rows.push(''); // Empty row separator
  
  // Add weekly summary
  rows.push('Type,Count');
  data.weeklySummary.forEach(item => {
    rows.push(`${item.name},${item.value}`);
  });
  
  return rows.join('\n');
};
