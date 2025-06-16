// File: frontend/src/utils/metricsUtils.ts

import { MetricsData } from '../types/reports';

/**
 * Interface for calculated metrics to ensure consistent type safety
 */
export interface CalculatedMetrics {
  totalHumanIntrusions: number;
  totalVehicleIntrusions: number;
  avgHumanIntrusionsPerDay: number;
  avgVehicleIntrusionsPerDay: number;
  peakHumanDay: string;
  peakVehicleDay: string;
  cameraUptime: number;
  responseEfficiency: number;
}

/**
 * Safely sums values from a record of metrics
 * Ensures type safety by converting any non-number values to 0
 */
export const sumMetrics = (metrics: Record<string, number>): number => {
  return Object.values(metrics).reduce((total, value) => {
    // Ensure we only work with numbers to avoid 'unknown' type errors
    const numValue = typeof value === 'number' ? value : 0;
    return total + numValue;
  }, 0);
};

/**
 * Finds the day with the highest metric value
 */
export const findPeakDay = (metrics: Record<string, number>, defaultDay = 'None'): string => {
  if (!metrics || Object.keys(metrics).length === 0) return defaultDay;
  
  let peakDay = defaultDay;
  let peakValue = -1;
  
  Object.entries(metrics).forEach(([day, value]) => {
    const numValue = typeof value === 'number' ? value : 0;
    if (numValue > peakValue) {
      peakValue = numValue;
      peakDay = day;
    }
  });
  
  return peakDay;
};

/**
 * Calculates the average of metric values
 */
export const calculateAverage = (metrics: Record<string, number>): number => {
  if (!metrics) return 0;
  
  const days = Object.keys(metrics).length;
  if (days === 0) return 0;
  
  const total = sumMetrics(metrics);
  return total / days;
};

/**
 * Calculate comprehensive metrics from raw metrics data
 * Returns properly typed CalculatedMetrics object
 */
export const calculateMetrics = (metricsData: MetricsData): CalculatedMetrics => {
  // Default values in case metrics data is incomplete
  const defaultMetrics: CalculatedMetrics = {
    totalHumanIntrusions: 0,
    totalVehicleIntrusions: 0,
    avgHumanIntrusionsPerDay: 0,
    avgVehicleIntrusionsPerDay: 0,
    peakHumanDay: 'None',
    peakVehicleDay: 'None',
    cameraUptime: 0,
    responseEfficiency: 0
  };
  
  // Return default metrics if metricsData is null or undefined
  if (!metricsData) return defaultMetrics;
  
  // Calculate total intrusions with type safety
  const totalHumanIntrusions = sumMetrics(metricsData.humanIntrusions);
  const totalVehicleIntrusions = sumMetrics(metricsData.vehicleIntrusions);
  
  // Calculate averages
  const avgHumanIntrusionsPerDay = calculateAverage(metricsData.humanIntrusions);
  const avgVehicleIntrusionsPerDay = calculateAverage(metricsData.vehicleIntrusions);
  
  // Find peak days
  const peakHumanDay = findPeakDay(metricsData.humanIntrusions);
  const peakVehicleDay = findPeakDay(metricsData.vehicleIntrusions);
  
  // Calculate additional metrics
  const cameraUptime = metricsData.camerasOnline / Math.max(metricsData.totalCameras, 1) * 100;
  
  // Calculate response efficiency (inverse of response time, normalized to 100%)
  // Assumption: 3 minutes is the target response time
  const responseEfficiency = 100 - (metricsData.responseTime / 3 * 100);
  
  return {
    totalHumanIntrusions,
    totalVehicleIntrusions,
    avgHumanIntrusionsPerDay,
    avgVehicleIntrusionsPerDay,
    peakHumanDay,
    peakVehicleDay,
    cameraUptime,
    responseEfficiency
  };
};

/**
 * Gets a specific metric value or returns a default
 */
export const getMetricValue = <T extends keyof MetricsData>(
  metrics: MetricsData | null, 
  key: T,
  defaultValue: MetricsData[T]
): MetricsData[T] => {
  if (!metrics || !(key in metrics)) {
    return defaultValue;
  }
  return metrics[key];
};

/**
 * Formats a number as a percentage string
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Formats intrusion counts with appropriate labels
 */
export const formatIntrusions = (count: number): string => {
  return `${count} ${count === 1 ? 'intrusion' : 'intrusions'}`;
};

/**
 * Safely formats object values for display
 */
export const safeFormatValue = (value: unknown): string => {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  return JSON.stringify(value);
};

export default {
  calculateMetrics,
  sumMetrics,
  findPeakDay,
  calculateAverage,
  getMetricValue,
  formatPercentage,
  formatIntrusions,
  safeFormatValue
};