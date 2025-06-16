// File: backend/services/DataSyncService.ts
/**
 * DataSyncService
 * 
 * Manages synchronization of data between PropertyInfoPanel and EnhancedPreviewPanel
 * Uses React Context API to share state between components
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
  ClientData, 
  MetricsData, 
  DailyReport, 
  DailyReportStatus, 
  SecurityCode,
  ThemeSettings 
} from '../../frontend/src/types/reports';

// Default data for initialization
const defaultMetrics: MetricsData = {
  humanIntrusions: { Monday: 8, Tuesday: 5, Wednesday: 12, Thursday: 7, Friday: 9, Saturday: 4, Sunday: 3 },
  vehicleIntrusions: { Monday: 3, Tuesday: 2, Wednesday: 4, Thursday: 3, Friday: 5, Saturday: 2, Sunday: 0 },
  potentialThreats: 3,
  proactiveAlerts: 15,
  responseTime: 1.2,
  aiAccuracy: 97.5,
  totalCameras: 12,
  camerasOnline: 11,
  totalMonitoringHours: 168,
  operationalUptime: 99.2
};

const defaultClient: ClientData = {
  id: '1',
  name: 'Highland Properties',
  siteName: 'Highland Tower Complex',
  location: '1250 Highland Avenue',
  city: 'Cityville',
  state: 'CA',
  zipCode: '91234',
  cameraType: 'AI-enabled IP Cameras',
  cameraDetails: 'Advanced motion detection with night vision',
  contactEmail: 'manager@highland.com'
};

const defaultDateRange = {
  start: new Date(new Date().setDate(new Date().getDate() - 7)),
  end: new Date()
};

// Define the interface for our context
interface ReportDataContextType {
  client: ClientData | null;
  setClient: (client: ClientData | null) => void;
  metrics: MetricsData;
  setMetrics: (metrics: MetricsData) => void;
  dateRange: { start: Date; end: Date };
  setDateRange: (dateRange: { start: Date; end: Date }) => void;
  dailyReports: DailyReport[];
  setDailyReports: (reports: DailyReport[]) => void;
  summaryNotes: string;
  setSummaryNotes: (notes: string) => void;
  chartDataURL: string;
  setChartDataURL: (url: string) => void;
  themeSettings: ThemeSettings;
  setThemeSettings: (settings: ThemeSettings) => void;
}

// Create the default context value
const defaultContextValue: ReportDataContextType = {
  client: defaultClient,
  setClient: () => {},
  metrics: defaultMetrics,
  setMetrics: () => {},
  dateRange: defaultDateRange,
  setDateRange: () => {},
  dailyReports: [],
  setDailyReports: () => {},
  summaryNotes: '',
  setSummaryNotes: () => {},
  chartDataURL: '',
  setChartDataURL: () => {},
  themeSettings: {},
  setThemeSettings: () => {}
};

// Create the context
export const ReportDataContext = createContext<ReportDataContextType>(defaultContextValue);

// Create a provider component
interface ReportDataProviderProps {
  children: ReactNode;
  initialClient?: ClientData | null;
  initialMetrics?: MetricsData;
  initialDateRange?: { start: Date; end: Date };
}

export const ReportDataProvider = ({ 
  children,
  initialClient = defaultClient,
  initialMetrics = defaultMetrics,
  initialDateRange = defaultDateRange
}: ReportDataProviderProps) => {
  // State for all shared data
  const [client, setClient] = useState<ClientData | null>(initialClient);
  const [metrics, setMetrics] = useState<MetricsData>(initialMetrics);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [summaryNotes, setSummaryNotes] = useState<string>('');
  const [chartDataURL, setChartDataURL] = useState<string>('');
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({});

  // Generate default daily reports if none are provided
  useEffect(() => {
    if (dailyReports.length === 0) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const securityCodes: SecurityCode[] = ['Code 4', 'Code 4', 'Code 3', 'Code 3', 'Code 4', 'Code 1', 'Code 1'];
      const reportStatus: DailyReportStatus = 'Completed';
      
      // Create properly typed daily reports with all required fields
      const defaultReports: DailyReport[] = days.map((day, index) => ({
        day,
        securityCode: securityCodes[index],
        content: `Standard monitoring and surveillance conducted. No significant incidents reported.`,
        status: reportStatus,
        timestamp: new Date().toISOString()
      }));
      
      setDailyReports(defaultReports);
    }
  }, [dailyReports.length]);

  // Provide the context value
  const contextValue: ReportDataContextType = {
    client,
    setClient,
    metrics,
    setMetrics,
    dateRange,
    setDateRange,
    dailyReports,
    setDailyReports,
    summaryNotes,
    setSummaryNotes,
    chartDataURL,
    setChartDataURL,
    themeSettings,
    setThemeSettings
  };

  return (
    <ReportDataContext.Provider value={contextValue}>
      {children}
    </ReportDataContext.Provider>
  );
};

// Custom hook to use the ReportData context
export const useReportData = (): ReportDataContextType => {
  const context = useContext(ReportDataContext);
  
  if (!context) {
    throw new Error('useReportData must be used within a ReportDataProvider');
  }
  
  return context;
};

// Utility function to update metrics
export const updateMetrics = (
  currentMetrics: MetricsData,
  updates: Partial<MetricsData>
): MetricsData => {
  const newMetrics = { ...currentMetrics };
  
  // Update top-level properties
  Object.keys(updates).forEach(key => {
    const metricKey = key as keyof MetricsData;
    
    // Handle special case for objects like humanIntrusions and vehicleIntrusions
    if (metricKey === 'humanIntrusions' || metricKey === 'vehicleIntrusions') {
      const updateValue = updates[metricKey];
      if (updateValue) {
        newMetrics[metricKey] = {
          ...newMetrics[metricKey],
          ...updateValue
        };
      }
    } else if (updates[metricKey] !== undefined) {
      // Type-safe way to assign properties
      (newMetrics[metricKey] as any) = updates[metricKey];
    }
  });
  
  return newMetrics;
};

// Export everything in a default object for convenience
export default {
  ReportDataContext,
  ReportDataProvider,
  useReportData,
  updateMetrics
};