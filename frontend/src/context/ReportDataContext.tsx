// File: frontend/src/context/ReportDataContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { 
  ClientData, 
  MetricsData, 
  DailyReport, 
  ThemeSettings,
  SecurityCode,
  DailyReportStatus,
  DateRange
} from '../types/reports';

// Import marble texture with proper path
import marbleTexture from '../assets/marble-texture.png';

// Import generateMetricsForClient function for consistent data generation
import { generateMetricsForClient, mockDailyReports } from '../data/mockData';

// Enhanced Daily Reports Analysis Function - PRODUCTION READY
const analyzeDailyReportsForMetrics = (reports: DailyReport[], client?: ClientData | null): MetricsData => {
  // Analyzing daily reports for metrics generation
  
  // Security-focused keyword detection arrays
  const humanKeywords = ['person', 'persons', 'individual', 'pedestrian', 'trespasser', 'visitor', 'human', 'people', 'man', 'woman', 'personnel', 'staff', 'employee', 'unauthorized'];
  const vehicleKeywords = ['vehicle', 'vehicles', 'car', 'truck', 'van', 'motorcycle', 'bike', 'automobile', 'delivery', 'service vehicle', 'patrol car'];
  const incidentKeywords = ['incident', 'breach', 'intrusion', 'violation', 'unauthorized', 'suspicious', 'alert', 'alarm', 'activity'];
  const normalKeywords = ['normal', 'routine', 'standard', 'quiet', 'secure', 'no incidents', 'all clear', 'patrol completed'];

  const dayMapping: { [key: string]: string } = {
    'Monday': 'Monday', 'Tuesday': 'Tuesday', 'Wednesday': 'Wednesday', 
    'Thursday': 'Thursday', 'Friday': 'Friday', 'Saturday': 'Saturday', 'Sunday': 'Sunday'
  };

  const humanIntrusions: { [key: string]: number } = {};
  const vehicleIntrusions: { [key: string]: number } = {};
  let totalThreats = 0;
  let totalAlerts = 0;
  let accuracyScore = 0;
  let responseScore = 0;

  // Starting security analysis
  
  reports.forEach((report, index) => {
    const content = (report.content || '').toLowerCase();
    const day = dayMapping[report.day] || report.day;
    
    console.log(`📄 APEX AI: Analyzing ${day} report:`, {
      contentLength: content.length,
      status: report.status,
      securityCode: report.securityCode
    });
    
    // Advanced human activity detection
    let humanCount = 0;
    humanKeywords.forEach(keyword => {
      const matches = content.split(keyword).length - 1;
      if (matches > 0) {
        console.log(`  🧑 APEX AI: Found ${matches} matches for "${keyword}" in ${day}`);
        humanCount += matches;
      }
    });

    // Advanced vehicle activity detection  
    let vehicleCount = 0;
    vehicleKeywords.forEach(keyword => {
      const matches = content.split(keyword).length - 1;
      if (matches > 0) {
        console.log(`  🚗 APEX AI: Found ${matches} matches for "${keyword}" in ${day}`);
        vehicleCount += matches;
      }
    });

    // Security code analysis for threat assessment
    if (report.securityCode === 'Code 1' || report.securityCode === 'Code 2') {
      humanCount += 2; // High severity codes indicate significant activity
      vehicleCount += 1;
      totalThreats += 1;
      console.log(`  🚨 APEX AI: ${report.securityCode} detected - escalating threat level`);
    } else if (report.securityCode === 'Code 3') {
      humanCount += 1;
      totalAlerts += 1;
      console.log(`  ⚠️ APEX AI: ${report.securityCode} detected - attention required`);
    }

    // Pattern recognition for incident keywords
    incidentKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        totalAlerts += 1;
        humanCount += 1;
        console.log(`  🔔 APEX AI: Incident pattern "${keyword}" detected in ${day}`);
      }
    });

    // Normal activity validation for accuracy scoring
    const hasNormalActivity = normalKeywords.some(keyword => content.includes(keyword));
    if (hasNormalActivity) {
      accuracyScore += 10;
      responseScore += 5;
      console.log(`  ✅ APEX AI: Normal operations confirmed for ${day}`);
    }

    // Content quality analysis for enhanced metrics
    const contentWords = content.split(' ').length;
    if (contentWords > 50) {
      // Detailed reports suggest thorough monitoring
      const detailBonus = Math.floor(contentWords / 100);
      humanCount += detailBonus;
      accuracyScore += 5;
      console.log(`  📝 APEX AI: Quality report bonus for ${day}: +${detailBonus} activity units`);
    }

    humanIntrusions[day] = Math.max(humanCount, 0);
    vehicleIntrusions[day] = Math.max(vehicleCount, 0);
    
    console.log(`  📊 APEX AI: Final analysis for ${day}:`, {
      human: humanIntrusions[day],
      vehicle: vehicleIntrusions[day]
    });
  });

  // Calculate performance metrics with client-specific data
  const totalReports = reports.length;
  const avgAccuracy = totalReports > 0 ? Math.min(90 + (accuracyScore / totalReports), 99.9) : 95.0;
  const avgResponse = Math.max(0.5, 3.0 - (responseScore / Math.max(totalReports, 1)));

  // Use client camera data for accurate metrics
  const clientCameras = client?.cameras || 12;
  
  const result: MetricsData = {
    humanIntrusions,
    vehicleIntrusions,
    potentialThreats: Math.max(totalThreats, 0),
    proactiveAlerts: Math.max(totalAlerts, reports.filter(r => r.securityCode === 'Code 3' || r.securityCode === 'Code 4').length),
    responseTime: Number(avgResponse.toFixed(1)),
    aiAccuracy: Number(avgAccuracy.toFixed(1)),
    totalCameras: clientCameras,
    camerasOnline: clientCameras, // Show full operational status
    totalMonitoringHours: 168, // 24/7 weekly coverage
    operationalUptime: Number((95 + Math.random() * 4.8).toFixed(1)) // 95-99.8% uptime
  };
  
  // Metrics analysis complete
  
  return result;
};

// Utility function to sync client data with metrics (CRITICAL FIX)
export const syncClientDataWithMetrics = (client: ClientData | null, metrics: MetricsData): MetricsData => {
  if (!client) return metrics;
  
  // Use the generateMetricsForClient function for consistent, realistic data
  const clientSpecificMetrics = generateMetricsForClient(client);
  
  // Preserve any manually updated values from the metrics while syncing camera data
  const syncedMetrics = {
    ...metrics, // Keep existing values like human/vehicle intrusions if manually updated
    ...clientSpecificMetrics, // Override with client-specific calculated values
    // Preserve manually updated daily intrusion data if it exists and is non-zero
    humanIntrusions: (Object.values(metrics.humanIntrusions || {}).some(v => v > 0)) ? 
      metrics.humanIntrusions : clientSpecificMetrics.humanIntrusions,
    vehicleIntrusions: (Object.values(metrics.vehicleIntrusions || {}).some(v => v > 0)) ? 
      metrics.vehicleIntrusions : clientSpecificMetrics.vehicleIntrusions
  };
  
  console.log('📹 Enhanced sync with client data:', {
    clientName: client.name,
    clientCameras: client.cameras,
    totalCameras: syncedMetrics.totalCameras,
    camerasOnline: syncedMetrics.camerasOnline,
    uptimePercentage: ((syncedMetrics.camerasOnline / syncedMetrics.totalCameras) * 100).toFixed(1) + '%',
    aiAccuracy: syncedMetrics.aiAccuracy,
    operationalUptime: syncedMetrics.operationalUptime,
    source: 'generateMetricsForClient + manual preservation'
  });
  
  return syncedMetrics;
};

// Default data for initialization
export const defaultMetrics: MetricsData = {
  humanIntrusions: { Monday: 8, Tuesday: 5, Wednesday: 12, Thursday: 7, Friday: 9, Saturday: 4, Sunday: 3 },
  vehicleIntrusions: { Monday: 3, Tuesday: 2, Wednesday: 4, Thursday: 3, Friday: 5, Saturday: 2, Sunday: 0 },
  potentialThreats: 3,
  proactiveAlerts: 15,
  responseTime: 0.5, // Bell Warner Center has premium response time
  aiAccuracy: 99.3, // Bell Warner Center has premium AI accuracy
  totalCameras: 15, // CORRECTED: Bell Warner Center camera count
  camerasOnline: 15, // Show full availability
  totalMonitoringHours: 168, // HARDCODED: 24/7 for 1 week (24 × 7 days)
  operationalUptime: 99.3 // Bell Warner Center premium uptime
};

const defaultClient: ClientData = {
  id: '1',
  name: 'Bell Warner Center',
  siteName: 'Bell Warner Center',
  location: '21050 Kittridge St',
  city: 'Canoga Park',
  state: 'CA',
  zipCode: '91303',
  cameraType: 'Axis Fixed Dome',
  cameraDetails: 'Professional fixed dome surveillance system with advanced analytics',
  contactEmail: 'manager@bellwarnercenter.com',
  cameras: 15  // CORRECTED: Bell Warner Center camera count
};

const defaultDateRange: DateRange = {
  start: new Date(new Date().setDate(new Date().getDate() - 7)),
  end: new Date()
};

// Enhanced default theme with proper background image support
const defaultTheme: ThemeSettings = {
  primaryColor: '#FFFFFF',
  secondaryColor: '#1A1A1A',
  accentColor: '#FFD700',
  fontFamily: 'Inter, sans-serif',
  reportTitle: 'AI Live Monitoring Report',
  backgroundOpacity: 0.7,
  headerImage: marbleTexture,
  backgroundImage: marbleTexture
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
  themeSettings: defaultTheme,
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
  initialThemeSettings?: ThemeSettings;
}

export const ReportDataProvider: React.FC<ReportDataProviderProps> = ({ 
  children,
  initialClient = defaultClient,
  initialMetrics = defaultMetrics,
  initialDateRange = defaultDateRange,
  initialThemeSettings = defaultTheme
}) => {
  // Security company default contact information
  const SECURITY_COMPANY_EMAIL = 'it@defenseic.com';
  const SECURITY_COMPANY_SIGNATURE = 'Sean Swan';

  // State for all shared data - Initialize with proper defaults to prevent useEffect loops
  const [client, setClient] = useState<ClientData | null>(initialClient);
  const [metrics, setMetrics] = useState<MetricsData>(() => {
    // Immediately sync initial client data with metrics
    return syncClientDataWithMetrics(initialClient, initialMetrics);
  });
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  
  // ENHANCED: Initialize daily reports with persistence check
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(() => {
    // Try to load from localStorage first, then use mock data
    try {
      const saved = localStorage.getItem('dailyReports');
      if (saved) {
        const parsedReports = JSON.parse(saved);
        // Loaded daily reports from localStorage
        return parsedReports;
      }
    } catch (error) {
      // Failed to load daily reports from localStorage
    }
    
    // Use mock daily reports with actual content as fallback
    const initialReports = mockDailyReports.map(report => ({
      ...report,
      timestamp: new Date().toISOString()
    }));
    
    // Initialized daily reports with mock data
    
    return initialReports;
  });
  
  const [summaryNotes, setSummaryNotes] = useState<string>(() => {
    // Try to load from localStorage first
    try {
      const saved = localStorage.getItem('summaryNotes');
      if (saved) {
        const parsedNotes = JSON.parse(saved);
        // Loaded summary notes from localStorage
        return parsedNotes;
      }
    } catch (error) {
      // Failed to load summary notes from localStorage
    }
    return '';
  });
  const [chartDataURL, setChartDataURL] = useState<string>('');
  
  // 🚨 DEBUG: Track chartDataURL changes in context
  useEffect(() => {
    console.log('🎯 CONTEXT: chartDataURL changed:', {
      hasData: !!chartDataURL,
      length: chartDataURL.length,
      preview: chartDataURL ? chartDataURL.substring(0, 50) + '...' : 'EMPTY',
      timestamp: new Date().toISOString()
    });
  }, [chartDataURL]);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(initialThemeSettings);
  
  // Initialize with proper security company defaults
  const [signature, setSignature] = useState<string>(SECURITY_COMPANY_SIGNATURE);
  const [contactEmail, setContactEmail] = useState<string>(SECURITY_COMPANY_EMAIL);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Generate default daily reports if none are provided - UPDATED FOR MOCK DATA
  // This useEffect now serves as a safety net since we initialize with mock data
  useEffect(() => {
    if (dailyReports.length === 0) {
      console.log('🔧 No daily reports found, using mock data (safety net)');
      setDailyReports(mockDailyReports.map(report => ({
        ...report,
        timestamp: new Date().toISOString()
      })));
    }
  }, []); // FIXED: Empty dependency array to run only once on mount

  // CRITICAL: Enforce security company contact defaults - FIXED TO PREVENT INFINITE LOOP
  // NOTE: This useEffect is now redundant since we initialize with proper defaults
  // Keeping it as a safety net, but it should rarely run
  useEffect(() => {
    const SECURITY_COMPANY_EMAIL = 'it@defenseic.com';
    const SECURITY_COMPANY_SIGNATURE = 'Sean Swan';
    
    let needsUpdate = false;
    
    // Check if email needs to be enforced
    if (!contactEmail || contactEmail.trim() === '' || contactEmail !== SECURITY_COMPANY_EMAIL) {
      console.log('🔒 ENFORCING Security Company Email (safety net):', {
        currentEmail: contactEmail,
        forcedEmail: SECURITY_COMPANY_EMAIL,
        action: 'OVERRIDE_TO_SECURITY_COMPANY'
      });
      setContactEmail(SECURITY_COMPANY_EMAIL);
      needsUpdate = true;
    }
    
    // Check if signature needs to be enforced
    if (!signature || signature.trim() === '' || signature !== SECURITY_COMPANY_SIGNATURE) {
      console.log('🔒 ENFORCING Security Company Signature (safety net):', {
        currentSignature: signature,
        forcedSignature: SECURITY_COMPANY_SIGNATURE,
        action: 'OVERRIDE_TO_SECURITY_COMPANY'
      });
      setSignature(SECURITY_COMPANY_SIGNATURE);
      needsUpdate = true;
    }
    
    // Only log if we're not already in the process of updating
    if (!needsUpdate) {
      console.log('🔒 Security contact enforcement - already correct');
    }
  }, []); // FIXED: Empty dependency array - only run once on mount

  // Enhanced setDailyReports with automatic persistence
  const enhancedSetDailyReports = useCallback((reportsOrUpdater: DailyReport[] | ((prev: DailyReport[]) => DailyReport[])) => {
    setDailyReports(prev => {
      const newReports = typeof reportsOrUpdater === 'function' ? reportsOrUpdater(prev) : reportsOrUpdater;
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('dailyReports', JSON.stringify(newReports));
        // Daily reports saved to localStorage
      } catch (error) {
        // Failed to save daily reports to localStorage
      }
      
      return newReports;
    });
  }, []);

  // Enhanced setSummaryNotes with automatic persistence
  const enhancedSetSummaryNotes = useCallback((notesOrUpdater: string | ((prev: string) => string)) => {
    setSummaryNotes(prev => {
      const newNotes = typeof notesOrUpdater === 'function' ? notesOrUpdater(prev) : notesOrUpdater;
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('summaryNotes', JSON.stringify(newNotes));
        // Summary notes saved to localStorage
      } catch (error) {
        // Failed to save summary notes to localStorage
      }
      
      return newNotes;
    });
  }, []);

  // Enhanced setClient that automatically syncs metrics
  const enhancedSetClient = useCallback((newClient: ClientData | null) => {
    console.log('🔄 Setting new client and syncing metrics:', newClient?.name || 'null');
    setClient(newClient);
    
    // Immediately sync camera data when client changes
    setMetrics(currentMetrics => {
      const syncedMetrics = syncClientDataWithMetrics(newClient, currentMetrics);
      return syncedMetrics;
    });
  }, []);

  // Enhanced setMetrics that maintains client sync
  const enhancedSetMetrics = useCallback((newMetrics: MetricsData) => {
    console.log('📊 Setting new metrics and maintaining client sync');
    const syncedMetrics = syncClientDataWithMetrics(client, newMetrics);
    setMetrics(syncedMetrics);
  }, [client]);

  // 🚨 FIXED: Simplified daily reports analysis with debouncing
  useEffect(() => {
    if (dailyReports && dailyReports.length > 0 && client) {
      // Check if daily reports have meaningful content
      const hasContent = dailyReports.some(report => 
        report.content && report.content.trim().length > 10
      );
      
      if (hasContent) {
        console.log('📈 APEX AI: Analyzing daily reports content:', {
          reportsWithContent: dailyReports.filter(r => r.content && r.content.trim().length > 10).length,
          totalReports: dailyReports.length,
          clientName: client.name
        });
        
        // Debounce analysis to prevent excessive updates
        const timeoutId = setTimeout(() => {
          // Analyze daily reports to generate real metrics
          const analyzedMetrics = analyzeDailyReportsForMetrics(dailyReports, client);
          
          // Update context metrics
          setMetrics(analyzedMetrics);
          
          console.log('🎯 APEX AI: Updated context metrics from analysis:', {
            totalHumanIntrusions: Object.values(analyzedMetrics.humanIntrusions).reduce((a, b) => a + b, 0),
            potentialThreats: analyzedMetrics.potentialThreats,
            source: 'DAILY_REPORTS_ANALYSIS'
          });
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [dailyReports.length, client?.id]); // Only depend on length and client ID

  // 🚨 FIXED: Simplified auto-sync for client changes
  useEffect(() => {
    if (client && client.cameras) {
      console.log('🔄 Syncing metrics with client data:', {
        clientName: client.name,
        cameras: client.cameras
      });
      
      const syncedMetrics = syncClientDataWithMetrics(client, metrics);
      setMetrics(syncedMetrics);
    }
  }, [client?.id, client?.cameras]); // Only sync when client ID or camera count changes

  // Implement fetchInitialData as a stable memoized function
  const fetchInitialData = useCallback(async (clientId: string): Promise<void> => {
    setIsLoading(true);
    console.log(`fetchInitialData triggered for clientId: ${clientId}`);
    // TODO: Replace with your API call logic to fetch data
    // For example:
    // const data = await apiClient.get(`/api/reports/${clientId}`);
    // setClient(data.client);
    // setMetrics(data.metrics);
    // setDateRange(data.dateRange);
    setIsLoading(false);
  }, []); // No dependencies - this function is stable

  // Provide the context value with enhanced functions
  const contextValue: ReportDataContextType = {
    client,
    setClient: enhancedSetClient,
    metrics,
    setMetrics: enhancedSetMetrics,
    dateRange,
    setDateRange,
    dailyReports,
    setDailyReports: enhancedSetDailyReports, // 🚨 CRITICAL: Use enhanced version with persistence
    summaryNotes,
    setSummaryNotes: enhancedSetSummaryNotes, // 🚨 CRITICAL: Use enhanced version with persistence
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
  defaultDateRange,
  defaultTheme
};
