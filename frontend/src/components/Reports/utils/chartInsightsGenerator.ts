/**
 * Chart Insights Generator - Advanced Analytics and Insights for Chart Data
 * Extracted from DataVisualizationPanel for better modularity
 * Production-ready insights generation with comprehensive analysis
 */

import { DailyReport, ClientData, MetricsData } from '../../../types/reports';
import { calculateSummaryStats, generateHourlyPatterns } from './chartDataAnalyzer';
import { DAY_MAPPING } from '../constants/chartConstants';

/**
 * Interface for comprehensive insights data
 */
export interface InsightsData {
  totalIntrusions: number;
  peakDay: string;
  peakHour: string;
  humanPercentage: number;
  vehiclePercentage: number;
  dailyAverage: number;
  weekdayPercentage: number;
  weekendPercentage: number;
  weekdayDailyAvg: number;
  weekendDailyAvg: number;
  weekdayTotal: number;
  weekendTotal: number;
  recommendations: string[];
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
    description: string;
  };
  riskLevel: 'low' | 'medium' | 'high';
  efficiency: {
    score: number;
    factors: string[];
  };
}

/**
 * Interface for transformed chart data
 */
export interface TransformedChartData {
  dailyData: Array<{
    day: string;
    humanIntrusions: number;
    vehicleIntrusions: number;
    total: number;
  }>;
  weeklySummary: Array<{
    name: string;
    value: number;
  }>;
  weekdayVsWeekendData: Array<{
    name: string;
    human: number;
    vehicle: number;
    total: number;
  }>;
  hourlyAggregates: Array<{
    hour: string;
    human: number;
    vehicle: number;
    total: number;
  }>;
}

/**
 * Transform raw metrics data into chart-ready formats
 * 
 * @param metrics - Raw metrics data
 * @returns Transformed data for different chart types
 */
export const transformMetricsForCharts = (metrics: MetricsData): TransformedChartData => {
  const safeHumanIntrusions = metrics.humanIntrusions || {};
  const safeVehicleIntrusions = metrics.vehicleIntrusions || {};
  const daysOfWeek = Object.keys(DAY_MAPPING);

  // Calculate daily data
  const dailyData = daysOfWeek.map(day => {
    const human = safeHumanIntrusions[day] || 0;
    const vehicle = safeVehicleIntrusions[day] || 0;
    return {
      day,
      humanIntrusions: human,
      vehicleIntrusions: vehicle,
      total: human + vehicle
    };
  });

  // Calculate weekly summary
  const totalHuman = Object.values(safeHumanIntrusions).reduce((sum, val) => sum + (val || 0), 0);
  const totalVehicle = Object.values(safeVehicleIntrusions).reduce((sum, val) => sum + (val || 0), 0);
  const weeklySummary = [
    { name: 'Human', value: totalHuman },
    { name: 'Vehicle', value: totalVehicle }
  ].filter(item => item.value > 0);

  // Calculate weekday vs weekend data
  const weekdayDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const weekendDays = ['Saturday', 'Sunday'];
  
  const weekdayData = {
    human: weekdayDays.reduce((sum, day) => sum + (safeHumanIntrusions[day] || 0), 0),
    vehicle: weekdayDays.reduce((sum, day) => sum + (safeVehicleIntrusions[day] || 0), 0)
  };
  
  const weekendData = {
    human: weekendDays.reduce((sum, day) => sum + (safeHumanIntrusions[day] || 0), 0),
    vehicle: weekendDays.reduce((sum, day) => sum + (safeVehicleIntrusions[day] || 0), 0)
  };

  const weekdayVsWeekendData = [
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

  // Generate hourly aggregates
  const hourlyAggregates = generateHourlyPatterns(metrics);

  return {
    dailyData,
    weeklySummary,
    weekdayVsWeekendData,
    hourlyAggregates
  };
};

/**
 * Generate comprehensive insights from transformed data
 * 
 * @param transformedData - Transformed chart data
 * @param dateRange - Date range for analysis
 * @returns Comprehensive insights object
 */
export const generateComprehensiveInsights = (
  transformedData: TransformedChartData,
  dateRange?: { start: Date; end: Date }
): InsightsData => {
  const { dailyData, weeklySummary, weekdayVsWeekendData, hourlyAggregates } = transformedData;

  // Calculate basic metrics
  const humanEntry = weeklySummary.find(d => d.name === 'Human');
  const vehicleEntry = weeklySummary.find(d => d.name === 'Vehicle');
  const totalHuman = humanEntry?.value || 0;
  const totalVehicle = vehicleEntry?.value || 0;
  const totalIntrusions = totalHuman + totalVehicle;

  // Find peak day and hour
  const peakDayEntry = dailyData.reduce(
    (max, item) => (item.total > max.total ? item : max),
    { day: 'N/A', total: -1, humanIntrusions: 0, vehicleIntrusions: 0 }
  );
  const peakDay = peakDayEntry.total > 0 ? peakDayEntry.day : 'N/A';

  const peakHourEntry = hourlyAggregates.reduce(
    (max, item) => (item.total > max.total ? item : max),
    { hour: 'N/A', total: -1, human: 0, vehicle: 0 }
  );
  const peakHour = peakHourEntry.total > 0 ? peakHourEntry.hour : 'N/A';

  // Calculate percentages
  const humanPercentage = totalIntrusions > 0 ? (totalHuman / totalIntrusions) * 100 : 0;
  const vehiclePercentage = totalIntrusions > 0 ? (totalVehicle / totalIntrusions) * 100 : 0;

  // Calculate daily average
  let numberOfDays = 7;
  if (dateRange?.start && dateRange?.end) {
    const diffTime = Math.abs(dateRange.end.getTime() - dateRange.start.getTime());
    numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  const dailyAverage = numberOfDays > 0 ? totalIntrusions / numberOfDays : 0;

  // Weekday vs Weekend analysis
  const weekdayEntry = weekdayVsWeekendData.find(d => d.name === 'Weekday');
  const weekendEntry = weekdayVsWeekendData.find(d => d.name === 'Weekend');
  const weekdayTotal = weekdayEntry?.total || 0;
  const weekendTotal = weekendEntry?.total || 0;

  const totalWeekData = weekdayTotal + weekendTotal;
  const weekdayPercentage = totalWeekData > 0 ? (weekdayTotal / totalWeekData) * 100 : 0;
  const weekendPercentage = totalWeekData > 0 ? (weekendTotal / totalWeekData) * 100 : 0;

  // Calculate actual weekday and weekend days
  let actualWeekdays = 5;
  let actualWeekendDays = 2;
  if (dateRange?.start && dateRange?.end) {
    const current = new Date(dateRange.start);
    const final = new Date(dateRange.end);
    actualWeekdays = 0;
    actualWeekendDays = 0;
    
    while (current <= final) {
      const dayIndex = current.getDay();
      if (dayIndex >= 1 && dayIndex <= 5) {
        actualWeekdays++;
      } else {
        actualWeekendDays++;
      }
      current.setDate(current.getDate() + 1);
    }
  }

  const weekdayDailyAvg = actualWeekdays > 0 ? weekdayTotal / actualWeekdays : 0;
  const weekendDailyAvg = actualWeekendDays > 0 ? weekendTotal / actualWeekendDays : 0;

  // Generate recommendations
  const recommendations = generateRecommendations({
    totalIntrusions,
    peakDay,
    peakHour,
    humanPercentage,
    vehiclePercentage,
    weekdayDailyAvg,
    weekendDailyAvg,
    dailyAverage
  });

  // Analyze trends
  const trends = analyzeTrends(dailyData);

  // Calculate risk level
  const riskLevel = calculateRiskLevel(totalIntrusions, dailyAverage, peakDayEntry.total);

  // Calculate efficiency score
  const efficiency = calculateEfficiencyScore({
    totalIntrusions,
    dailyAverage,
    peakVariance: Math.max(...dailyData.map(d => d.total)) - Math.min(...dailyData.map(d => d.total)),
    distributionBalance: Math.abs(humanPercentage - vehiclePercentage)
  });

  return {
    totalIntrusions,
    peakDay,
    peakHour,
    humanPercentage: isNaN(humanPercentage) ? 0 : humanPercentage,
    vehiclePercentage: isNaN(vehiclePercentage) ? 0 : vehiclePercentage,
    dailyAverage: isNaN(dailyAverage) ? 0 : dailyAverage,
    weekdayPercentage: isNaN(weekdayPercentage) ? 0 : weekdayPercentage,
    weekendPercentage: isNaN(weekendPercentage) ? 0 : weekendPercentage,
    weekdayDailyAvg: isNaN(weekdayDailyAvg) ? 0 : weekdayDailyAvg,
    weekendDailyAvg: isNaN(weekendDailyAvg) ? 0 : weekendDailyAvg,
    weekdayTotal,
    weekendTotal,
    recommendations,
    trends,
    riskLevel,
    efficiency
  };
};

/**
 * Generate actionable recommendations based on insights
 */
const generateRecommendations = (data: any): string[] => {
  const recommendations: string[] = [];

  if (data.totalIntrusions === 0) {
    recommendations.push('Consider reviewing detection sensitivity settings');
    recommendations.push('Verify all cameras are operational and positioned correctly');
    return recommendations;
  }

  // Peak day recommendations
  if (data.peakDay !== 'N/A') {
    recommendations.push(`Consider increased monitoring on ${data.peakDay}s`);
  }

  // Peak hour recommendations
  if (data.peakHour !== 'N/A') {
    const hour = parseInt(data.peakHour);
    if (hour >= 22 || hour <= 6) {
      recommendations.push('Increase overnight security measures');
    } else {
      recommendations.push(`Focus resources during ${data.peakHour} time period`);
    }
  }

  // Activity type recommendations
  if (data.humanPercentage > 70) {
    recommendations.push('Implement enhanced pedestrian monitoring protocols');
  } else if (data.vehiclePercentage > 70) {
    recommendations.push('Focus on vehicle access control and monitoring');
  }

  // Schedule recommendations
  if (data.weekdayDailyAvg > data.weekendDailyAvg * 1.5) {
    recommendations.push('Consider reduced weekend staffing with enhanced automation');
  } else if (data.weekendDailyAvg > data.weekdayDailyAvg * 1.5) {
    recommendations.push('Increase weekend security presence');
  }

  // Daily average recommendations
  if (data.dailyAverage > 10) {
    recommendations.push('Consider implementing proactive deterrent measures');
  } else if (data.dailyAverage < 1) {
    recommendations.push('Review detection parameters to ensure adequate sensitivity');
  }

  return recommendations;
};

/**
 * Analyze trends in daily data
 */
const analyzeTrends = (dailyData: any[]): InsightsData['trends'] => {
  if (dailyData.length < 3) {
    return {
      direction: 'stable',
      confidence: 0,
      description: 'Insufficient data for trend analysis'
    };
  }

  const values = dailyData.map(d => d.total);
  const firstHalf = values.slice(0, Math.ceil(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

  const change = ((secondAvg - firstAvg) / Math.max(firstAvg, 1)) * 100;
  const confidence = Math.min(100, Math.abs(change) * 10);

  let direction: 'increasing' | 'decreasing' | 'stable';
  let description: string;

  if (Math.abs(change) < 10) {
    direction = 'stable';
    description = 'Activity levels remain consistent throughout the period';
  } else if (change > 0) {
    direction = 'increasing';
    description = `Activity levels increased by ${change.toFixed(1)}% during the period`;
  } else {
    direction = 'decreasing';
    description = `Activity levels decreased by ${Math.abs(change).toFixed(1)}% during the period`;
  }

  return { direction, confidence, description };
};

/**
 * Calculate risk level based on activity patterns
 */
const calculateRiskLevel = (total: number, dailyAvg: number, peakDay: number): 'low' | 'medium' | 'high' => {
  const riskScore = (total * 0.3) + (dailyAvg * 0.4) + (peakDay * 0.3);

  if (riskScore > 20) return 'high';
  if (riskScore > 10) return 'medium';
  return 'low';
};

/**
 * Calculate efficiency score and contributing factors
 */
const calculateEfficiencyScore = (data: any): InsightsData['efficiency'] => {
  const factors: string[] = [];
  let score = 100;

  // Penalize high variance (inconsistent detection)
  if (data.peakVariance > 15) {
    score -= 20;
    factors.push('High variance in daily activity suggests inconsistent monitoring');
  }

  // Penalize extreme imbalance
  if (data.distributionBalance > 80) {
    score -= 15;
    factors.push('Extreme imbalance between human and vehicle detection');
  }

  // Reward consistent moderate activity
  if (data.dailyAverage > 2 && data.dailyAverage < 10) {
    score += 10;
    factors.push('Consistent moderate activity levels indicate effective monitoring');
  }

  // Penalize very low activity (potential under-detection)
  if (data.totalIntrusions < 5) {
    score -= 25;
    factors.push('Very low activity may indicate detection sensitivity issues');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    factors
  };
};

/**
 * Generate contextual insights based on tab selection
 */
export const generateContextualInsights = (
  insights: InsightsData,
  activeTab: string,
  timeframe?: string,
  comparisonType?: string
): string[] => {
  const contextualInsights: string[] = [];

  switch (activeTab) {
    case 'overview':
      contextualInsights.push(
        `Total security activities: ${insights.totalIntrusions} with ${insights.humanPercentage.toFixed(1)}% human and ${insights.vehiclePercentage.toFixed(1)}% vehicle events`
      );
      if (insights.peakDay !== 'N/A') {
        contextualInsights.push(`Peak activity day: ${insights.peakDay}`);
      }
      break;

    case 'intrusions':
      contextualInsights.push(
        `Activity analysis shows ${insights.humanPercentage > insights.vehiclePercentage ? 'human' : 'vehicle'} events are dominant`
      );
      contextualInsights.push(
        `Weekly pattern: ${insights.weekdayPercentage.toFixed(1)}% weekdays vs ${insights.weekendPercentage.toFixed(1)}% weekends`
      );
      break;

    case 'trends':
      contextualInsights.push(insights.trends.description);
      if (timeframe === 'daily' && insights.peakHour !== 'N/A') {
        contextualInsights.push(`Peak activity occurs around ${insights.peakHour}`);
      }
      break;

    case 'comparison':
      if (comparisonType === 'humanVsVehicle') {
        contextualInsights.push(
          `Human to Vehicle ratio: ${insights.humanPercentage.toFixed(1)}% to ${insights.vehiclePercentage.toFixed(1)}%`
        );
      } else if (comparisonType === 'weekdayVsWeekend') {
        contextualInsights.push(
          `Weekday average: ${insights.weekdayDailyAvg.toFixed(1)} vs Weekend average: ${insights.weekendDailyAvg.toFixed(1)}`
        );
      }
      break;
  }

  // Add top recommendation
  if (insights.recommendations.length > 0) {
    contextualInsights.push(`Recommendation: ${insights.recommendations[0]}`);
  }

  return contextualInsights;
};
