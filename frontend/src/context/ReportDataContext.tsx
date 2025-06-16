// File: frontend/src/context/ReportDataContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
  ClientData, 
  MetricsData, 
  DailyReport, 
  ThemeSettings,
  SecurityCode,
  DailyReportStatus,
  DateRange
} from '../types/reports';

// Default data for initialization
export const defaultMetrics: MetricsData = {
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

const defaultDateRange: DateRange = {
  start: new Date(new Date().setDate(new Date().getDate() - 7)),
  end: new Date()
};

// Export the context type with the new fetchInitialData property
export interface ReportDataContextType {
  client: ClientData | null;
  setClient: (client: ClientData | null) => void;
  metrics: MetricsData;
  setMetrics: (metrics: MetricsData) => void;
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
  dailyReports: DailyReport[];
  setDailyReports: (reports: DailyReport[]) => void;
  summaryNotes: string;
  setSummaryNotes: (notes: string) => void;
  chartDataURL: string;
  setChartDataURL: (url: string) => void;
  themeSettings: ThemeSettings;
  setThemeSettings: (settings: ThemeSettings) => void;
  signature: string;
  setSignature: (signature: string) => void;
  contactEmail: string;
  setContactEmail: (email: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  fetchInitialData: (clientId: string) => Promise<void>;
}

// Create the default context value (with a stub for fetchInitialData)
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
  setThemeSettings: () => {},
  signature: '',
  setSignature: () => {},
  contactEmail: '',
  setContactEmail: () => {},
  isLoading: false,
  setIsLoading: () => {},
  fetchInitialData: async (clientId: string) => {
    console.log(`fetchInitialData called for clientId: ${clientId}`);
    // Stub: Set loading, perform API call, update context, etc.
    // For now, we'll simulate a fetch delay:
    defaultContextValue.setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // TODO: Replace with actual API logic and update context accordingly.
    defaultContextValue.setIsLoading(false);
  }
};

// Create the context
export const ReportDataContext = createContext<ReportDataContextType>(defaultContextValue);

// Create a provider component
interface ReportDataProviderProps {
  children: ReactNode;
  initialClient?: ClientData | null;
  initialMetrics?: MetricsData;
  initialDateRange?: DateRange;
}

export const ReportDataProvider: React.FC<ReportDataProviderProps> = ({ 
  children,
  initialClient = defaultClient,
  initialMetrics = defaultMetrics,
  initialDateRange = defaultDateRange
}) => {
  // State for all shared data
  const [client, setClient] = useState<ClientData | null>(initialClient);
  const [metrics, setMetrics] = useState<MetricsData>(initialMetrics);
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [summaryNotes, setSummaryNotes] = useState<string>('');
  const [chartDataURL, setChartDataURL] = useState<string>('');
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({});
  const [signature, setSignature] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Generate default daily reports if none are provided
  useEffect(() => {
    if (dailyReports.length === 0) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const securityCodes: SecurityCode[] = ['Code 4', 'Code 4', 'Code 3', 'Code 3', 'Code 4', 'Code 1', 'Code 1'];
      const reportStatus: DailyReportStatus = 'Completed';
      
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

  // Implement fetchInitialData as a stub
  const fetchInitialData = async (clientId: string): Promise<void> => {
    setIsLoading(true);
    console.log(`fetchInitialData triggered for clientId: ${clientId}`);
    // TODO: Replace with your API call logic to fetch data
    // For example:
    // const data = await apiClient.get(`/api/reports/${clientId}`);
    // setClient(data.client);
    // setMetrics(data.metrics);
    // setDateRange(data.dateRange);
    setIsLoading(false);
  };

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
    setThemeSettings,
    signature,
    setSignature,
    contactEmail,
    setContactEmail,
    isLoading,
    setIsLoading,
    fetchInitialData
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
  Object.keys(updates).forEach(key => {
    const metricKey = key as keyof MetricsData;
    if (metricKey === 'humanIntrusions' || metricKey === 'vehicleIntrusions') {
      const updateValue = updates[metricKey];
      if (updateValue) {
        newMetrics[metricKey] = {
          ...newMetrics[metricKey],
          ...updateValue
        };
      }
    } else if (updates[metricKey] !== undefined) {
      (newMetrics[metricKey] as any) = updates[metricKey];
    }
  });
  return newMetrics;
};

// Export everything
export default {
  ReportDataContext,
  ReportDataProvider,
  useReportData,
  updateMetrics,
  defaultMetrics,
  defaultClient,
  defaultDateRange
};
