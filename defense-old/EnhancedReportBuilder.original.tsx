// 🚨 CRITICAL FIX APPLIED: Enhanced Report Builder - SINGLE SOURCE OF TRUTH
// 🚨 FIXED: Eliminated multiple sources of truth that caused data sync failures
// 🚨 FIXED: DailyReportsPanel now uses ONLY context data, Preview reads from same context
// 🚨 FIXED: Data flow: Reports → Context → Preview (no more local state confusion)
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import styled, { createGlobalStyle, css, ThemeProvider } from 'styled-components';
import { format, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { EnhancedPDFGenerator } from './EnhancedPDFGenerator';
import { useToast } from '../../hooks/use-toast';
import { ChevronLeft, ChevronRight, Download, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';

// Type Imports
import {
  ClientData,
  MetricsData,
  ThemeSettings,
  DailyReport,
  AIOptions,
  DeliveryOptions,
  DailyReportStatus,
  SecurityCode,
  MediaFile,
  DateRange
} from '../../types/reports';

// Component Imports with Error Boundaries
import ClientSelector from './ClientSelector';
import PropertyInfoPanel from './PropertyInfoPanel';
import EnhancedDailyReportsPanel from './DailyReportsPanel';
import MediaManagementSystem from './MediaManagementSystem';
import DataVisualizationPanel from './DataVisualizationPanel';
import ThemeBuilder from './ThemeBuilder';
import EnhancedPreviewPanel from './EnhancedPreviewPanel';
import DeliveryOptionsPanel from './DeliveryOptionsPanel';
// Removed debug components for production: BugFixVerification, DataFlowMonitor


import { DatePicker } from '../ui/date-picker';

// Context Providers
import { ReportDataProvider, useReportData } from '../../context/ReportDataContext';

// Mock Data Import
import { mockClients, mockMetricsData, mockDailyReports, generateMetricsForClient } from '../../data/mockData';

// Import marble texture for theme defaults - using proper import for bundling
import marbleTexture from '../../assets/marble-texture.png';

// Debug asset loading
console.log('🖼️ Marble texture loaded:', marbleTexture);

// Enhanced Theme Interface
interface CustomThemeSettings extends ThemeSettings {
  backgroundOpacity: number;
  reportTitle: string;
  headerImage?: string;
  backgroundImage?: string;
  companyLogo?: string;
  clientLogo?: string;
  textColor?: string;
}

// Error Boundary Component
class ReportBuilderErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Report Builder Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorContainer>
          <h2>Something went wrong with the Report Builder</h2>
          <p>Error: {this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// Styled Components with Performance Optimizations
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: sans-serif;
    background-color: #0f1419;
  }
`;

const ErrorContainer = styled.div`
  padding: 2rem;
  text-align: center;
  background-color: #1a1a1a;
  color: #e0e0e0;
  border-radius: 8px;
  margin: 2rem;
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 2rem auto;
  padding: 1.5rem;
  position: relative;
  border-radius: 10px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: #FAF0E6;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: inherit;
    z-index: 1;
  }

  & > * {
    position: relative;
    z-index: 2;
  }

  @media (max-width: 768px) {
    margin: 1rem;
    padding: 1rem;
  }
`;

const Title = styled.h1`
  text-align: center;
  color: #EEE8AA;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const DateRangeContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  color: #F0E6D2;
  font-size: 1rem;
  font-weight: 500;
  flex-wrap: wrap;
`;

const DatePickerButton = styled.button`
  padding: 6px 12px;
  font-size: 0.9em;
  gap: 6px;
  background-color: rgba(30, 30, 35, 0.6);
  color: #F0E6D2;
  border: 1px solid rgba(238, 232, 170, 0.3);
  border-radius: 5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.2s ease;
  
  &:hover { 
    background-color: rgba(50, 50, 55, 0.6); 
  }
`;

const TabContainer = styled.div`
  display: flex;
  overflow-x: auto;
  margin-bottom: 2rem;
  border-bottom: 2px solid rgba(238, 232, 170, 0.3);
  padding-bottom: 1px;
  scrollbar-width: none;
  
  &::-webkit-scrollbar { 
    display: none; 
  }

  @media (min-width: 1024px) {
    overflow-x: visible;
    justify-content: center;
    flex-wrap: wrap;
  }
`;

interface TabProps {
  $active: boolean;
  $isNew?: boolean;
  theme?: CustomThemeSettings;
}

const Tab = styled.button<TabProps>`
  padding: 12px 18px;
  cursor: pointer;
  border: none;
  border-bottom: 3px solid transparent;
  background-color: transparent;
  font-size: 0.95em;
  font-weight: 500;
  color: #A0A0A0;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
  position: relative;

  ${({ $active, theme }) => $active && css`
    color: ${theme?.primaryColor || '#FFD700'};
    border-bottom-color: ${theme?.primaryColor || '#FFD700'};
    font-weight: 600;
  `}

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme?.primaryColor || '#FFD700'};
    background-color: rgba(255, 215, 0, 0.1);
  }

  &:disabled {
    color: #444444;
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  ${({ $isNew }) => $isNew && css`
    &::after {
      content: 'NEW';
      position: absolute;
      top: -8px;
      right: -8px;
      background: linear-gradient(45deg, #e74c3c, #c0392b);
      color: white;
      font-size: 0.6rem;
      padding: 2px 6px;
      border-radius: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `}
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(238, 232, 170, 0.3);
`;

interface ButtonProps {
  $variant?: 'primary' | 'secondary' | 'success' | 'danger';
  theme?: CustomThemeSettings;
}

const Button = styled.button<ButtonProps>`
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:disabled {
    background-color: #333333;
    color: #666666;
    cursor: not-allowed;
    opacity: 0.7;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.4);
  }

  ${({ $variant = 'secondary', theme }) => {
    const primary = theme?.primaryColor || '#FFD700';
    
    switch ($variant) {
      case 'primary': 
        return css`
          background-color: ${primary}; 
          color: #0a0a0a; 
          &:hover:not(:disabled) { 
            background-color: ${primary}dd; 
          }
        `;
      case 'success': 
        return css`
          background-color: #25914B; 
          color: white; 
          &:hover:not(:disabled) { 
            background-color: #1e7940; 
          }
        `;
      case 'danger': 
        return css`
          background-color: #b52e3c; 
          color: white; 
          &:hover:not(:disabled) { 
            background-color: #9e2635; 
          }
        `;
      case 'secondary': 
      default: 
        return css`
          background-color: rgba(30, 30, 35, 0.7); 
          color: #F0E6D2; 
          border: 1px solid rgba(238, 232, 170, 0.3); 
          &:hover:not(:disabled) { 
            background-color: rgba(50, 50, 55, 0.7); 
          }
        `;
    }
  }}
`;

const LoadingOverlay = styled.div`
  position: fixed; 
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(10, 10, 12, 0.8);
  display: flex; 
  flex-direction: column; 
  justify-content: center; 
  align-items: center;
  z-index: 1000;
`;

const LoadingSpinner = styled.div`
  border: 4px solid #222222;
  border-top: 4px solid #FFD700;
  border-radius: 50%;
  width: 40px; 
  height: 40px;
  animation: spin 1.5s linear infinite;
  
  @keyframes spin { 
    0% { transform: rotate(0deg); } 
    100% { transform: rotate(360deg); } 
  }
`;

const LoadingMessage = styled.div`
  margin-top: 1rem; 
  color: #F0E6D2; 
  font-weight: 500;
`;

// Enhanced Hook for Performance
const usePerformanceOptimizedState = <T,>(
  initialValue: T,
  key: string
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const debouncedSetState = useCallback(
    (value: React.SetStateAction<T>) => {
      setState(value);
      
      // Debounced localStorage save
      const timeoutId = setTimeout(() => {
        try {
          const valueToSave = typeof value === 'function' ? (value as (prev: T) => T)(state) : value;
          localStorage.setItem(key, JSON.stringify(valueToSave));
        } catch (error) {
          console.warn(`Failed to save ${key} to localStorage:`, error);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [key, state]
  );

  return [state, debouncedSetState];
};

// Default configurations
const defaultAIOptions: AIOptions = {
  enabled: true, autoCorrect: true, enhanceWriting: true, suggestContent: true,
  suggestImprovements: true, analyzeThreats: false, generateSummary: true, highlightPatterns: false,
};

const defaultDeliveryOptions: DeliveryOptions = {
  emailRecipients: [], scheduleDelivery: false, deliveryDate: new Date(),
  email: true, sms: false, smsRecipients: [], includeFullData: true,
  includeCharts: true, deliveryFrequency: 'weekly', includeAttachments: true,
  deliveryFormat: 'pdf', ccEmails: [], bccEmails: [],
};

const defaultThemeSettings: CustomThemeSettings = {
  primaryColor: '#FFD700', secondaryColor: '#222222', accentColor: '#FAF0E6',
  fontFamily: 'Arial, sans-serif', reportTitle: 'AI Live Monitoring Report',
  backgroundOpacity: 0.7, 
  headerImage: marbleTexture, 
  backgroundImage: marbleTexture,
  companyLogo: '', clientLogo: '', textColor: '#F0E6D2',
};

// Debug function to check if assets are loading
const debugAssetPaths = () => {
  console.log('🖼️ Asset debugging:', {
    marbleTextureImport: marbleTexture,
    isValidPath: marbleTexture && marbleTexture.length > 0,
    pathType: typeof marbleTexture
  });
};

// Call debug function
debugAssetPaths();

// Main Component
const EnhancedReportBuilder: React.FC = () => {
  const { toast } = useToast();
  const chartRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);

  // Enhanced state management with performance optimization
  const [activeTab, setActiveTab] = usePerformanceOptimizedState<string>('client', 'activeTab');
  const [clients] = useState<ClientData[]>(() => mockClients);
  const [selectedClient, setSelectedClient] = usePerformanceOptimizedState<ClientData | null>(null, 'selectedClient');
  // 🚨 FIXED: REMOVED LOCAL DAILY REPORTS STATE - Context is single source of truth
  // 🚨 FIXED: REMOVED LOCAL SUMMARY/SIGNATURE/EMAIL STATE - Context is single source of truth
  const [chartDataURL, setChartDataURL] = useState<string>('');
  const [themeSettings, setThemeSettings] = usePerformanceOptimizedState<CustomThemeSettings>(defaultThemeSettings, 'themeSettings');
  const [aiOptions, setAIOptions] = usePerformanceOptimizedState<AIOptions>(defaultAIOptions, 'aiOptions');
  const [deliveryOptions, setDeliveryOptions] = usePerformanceOptimizedState<DeliveryOptions>(defaultDeliveryOptions, 'deliveryOptions');
  const [reportMedia, setReportMedia] = usePerformanceOptimizedState<MediaFile[]>([], 'reportMedia');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isChartGenerationRequested, setIsChartGenerationRequested] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = usePerformanceOptimizedState<Date>(new Date(), 'currentDate');

  // 🚨 FIXED: Get ALL data from context directly - single source of truth
  const contextData = useReportData();
  const contextMetrics = contextData.metrics;
  const dailyReports = contextData.dailyReports;
  const summaryNotes = contextData.summaryNotes;
  const signature = contextData.signature;
  const contactEmail = contextData.contactEmail;
  
  console.log('📊 FIXED: Using context as single source of truth:', {
    dailyReportsCount: dailyReports?.length || 0,
    reportsWithContent: dailyReports?.filter(r => r.content && r.content.trim().length > 0).length || 0,
    summaryNotesLength: summaryNotes?.length || 0,
    signature: signature || 'N/A',
    contactEmail: contactEmail || 'N/A',
    source: 'CONTEXT_ONLY'
  });

  // Memoized date range calculation
  const dateRange = useMemo(() => ({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 })
  }), [currentDate]);

  // Enhanced error handling for chart generation with FULL LOADING DETECTION
  const generateChartWithErrorHandling = useCallback(async () => {
    if (!chartRef.current) return;

    setIsLoading(true);
    setLoadingMessage('Generating chart preview...');
    
    try {
      // 🚨 CRITICAL FIX: Wait for full chart rendering with multiple checks
      console.log('📊 ENHANCED: Starting chart generation with full loading detection...');
      
      // Step 1: Wait for initial DOM stabilization
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Check for loading indicators and wait for them to disappear
      let attempts = 0;
      const maxAttempts = 15; // 15 attempts = ~7.5 seconds max wait
      
      while (attempts < maxAttempts) {
        const loadingElements = chartRef.current.querySelectorAll('[class*="loading"], [class*="Loading"], .recharts-loading, .loading-spinner, [data-loading="true"]');
        const hasLoadingText = chartRef.current.textContent?.includes('Loading') || chartRef.current.textContent?.includes('loading');
        const hasDarkBackground = window.getComputedStyle(chartRef.current).backgroundColor === 'rgba(0, 0, 0, 0)' || 
                                 window.getComputedStyle(chartRef.current).backgroundColor === 'transparent';
        
        // Check if SVG/Canvas elements are present (indicates chart is rendered)
        const chartElements = chartRef.current.querySelectorAll('svg, canvas, .recharts-surface');
        const hasChartContent = chartElements.length > 0;
        
        console.log(`📊 ENHANCED: Chart loading check ${attempts + 1}/${maxAttempts}:`, {
          loadingElementsFound: loadingElements.length,
          hasLoadingText,
          hasDarkBackground,
          hasChartContent,
          chartElementsCount: chartElements.length
        });
        
        // Chart is ready when: no loading elements, no loading text, has chart content
        if (loadingElements.length === 0 && !hasLoadingText && hasChartContent) {
          console.log('✅ ENHANCED: Chart fully loaded and ready for capture!');
          break;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between checks
      }
      
      if (attempts >= maxAttempts) {
        console.warn('⚠️ ENHANCED: Chart capture proceeding after max wait time');
      }
      
      // Step 4: Check if chart is actually visible and in viewport
      const isChartVisible = chartRef.current.offsetHeight > 0 && 
                            chartRef.current.offsetWidth > 0 &&
                            chartRef.current.getBoundingClientRect().height > 0;
      
      if (!isChartVisible) {
        console.warn('⚠️ ENHANCED: Chart element not visible, waiting...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Step 5: Additional stabilization wait for animations/transitions
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 6: Capture with enhanced settings
      if (chartRef.current) {
        console.log('📸 ENHANCED: Capturing fully loaded chart...');
        
        const canvas = await html2canvas(chartRef.current, { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#1e1e1e', // Ensure dark background
          logging: false,
          allowTaint: true,
          foreignObjectRendering: true,
          width: chartRef.current.scrollWidth,
          height: chartRef.current.scrollHeight,
          windowWidth: chartRef.current.scrollWidth,
          windowHeight: chartRef.current.scrollHeight
        });
        
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        setChartDataURL(dataUrl);
        
        console.log('✅ ENHANCED: Chart captured successfully:', {
          dataUrlLength: dataUrl.length,
          isValidDataUrl: dataUrl.startsWith('data:image/png'),
          canvasWidth: canvas.width,
          canvasHeight: canvas.height
        });
        
        toast({ 
          title: "Enhanced Chart Generated", 
          description: "Chart preview captured with full loading detection.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('❌ ENHANCED: Chart generation failed:', error);
      toast({ 
        variant: "destructive", 
        title: "Chart Generation Failed", 
        description: "Unable to generate chart preview. Please try again."
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      setIsChartGenerationRequested(false);
    }
  }, [toast]);

  // 🚨 QUICK FIX: Less restrictive chart generation for preview
  useEffect(() => {
    const needsChart = (activeTab === 'viz' || activeTab === 'preview');
    const shouldGenerate = needsChart && (isChartGenerationRequested || (activeTab === 'preview' && !chartDataURL));
    
    if (shouldGenerate && chartRef.current) {
      console.log('📊 GENERATING chart for preview:', {
        activeTab,
        hasChartRef: !!chartRef.current,
        isRequested: isChartGenerationRequested,
        hasExistingChart: !!chartDataURL
      });
      
      generateChartWithErrorHandling();
    }
  }, [activeTab, isChartGenerationRequested, generateChartWithErrorHandling, chartDataURL]);

  // 🚨 CRITICAL FIX: Listen for PropertyInfoPanel metrics updates to trigger chart regeneration
  useEffect(() => {
    const handleMetricsUpdated = (event: CustomEvent) => {
      console.log('📈 ReportBuilder: Received metrics update event from PropertyInfoPanel:', event.detail);
      
      // Trigger chart regeneration if we're on viz or preview tab
      if ((activeTab === 'viz' || activeTab === 'preview') && !isLoading) {
        console.log('🔄 ReportBuilder: Triggering chart regeneration after PropertyInfoPanel save');
        setIsChartGenerationRequested(true);
      }
    };
    
    // Listen for the custom event
    window.addEventListener('metricsUpdated', handleMetricsUpdated as EventListener);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('metricsUpdated', handleMetricsUpdated as EventListener);
    };
  }, [activeTab, isLoading]);

  // 🚨 IMMEDIATE chart generation when switching to preview
  useEffect(() => {
    if (activeTab === 'preview' && chartRef.current && !isLoading) {
      console.log('⚡ IMMEDIATE chart generation for preview');
      
      // Generate immediately, don't wait
      const timeoutId = setTimeout(() => {
        setIsChartGenerationRequested(true);
      }, 100); // Very short delay
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, isLoading]);

  // 🚨 CRITICAL FIX: Listen for daily reports updates to trigger immediate sync
  useEffect(() => {
    const handleDailyReportsUpdated = (event: CustomEvent) => {
      console.log('🔄 ReportBuilder: Daily reports updated, triggering immediate sync:', event.detail);
      
      // Force chart regeneration if we're on visualization tabs
      if ((activeTab === 'viz' || activeTab === 'preview') && !isLoading) {
        console.log('📊 ReportBuilder: Triggering immediate chart regeneration after daily report update');
        setIsChartGenerationRequested(true);
      }
      
      // Emit metrics update event for other components
      const metricsEvent = new CustomEvent('metricsUpdated', {
        detail: {
          source: 'DAILY_REPORTS_UPDATE',
          timestamp: new Date().toISOString(),
          context: event.detail
        }
      });
      window.dispatchEvent(metricsEvent);
    };
    
    // Listen for the custom event from DailyReportsPanel
    window.addEventListener('dailyReportsUpdated', handleDailyReportsUpdated as EventListener);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('dailyReportsUpdated', handleDailyReportsUpdated as EventListener);
    };
  }, [activeTab, isLoading]);

  // 🚨 CRITICAL FIX: Chart regeneration when ANY context metrics change  
  useEffect(() => {
    if ((activeTab === 'viz' || activeTab === 'preview') && contextMetrics) {
      console.log('📈 CONTEXT metrics changed - requesting chart regeneration:', {
        totalHumanIntrusions: Object.values(contextMetrics.humanIntrusions || {}).reduce((a, b) => a + b, 0),
        totalVehicleIntrusions: Object.values(contextMetrics.vehicleIntrusions || {}).reduce((a, b) => a + b, 0),
        potentialThreats: contextMetrics.potentialThreats,
        totalCameras: contextMetrics.totalCameras,
        aiAccuracy: contextMetrics.aiAccuracy
      });
      
      // Shorter debounce for preview
      const debounceTime = activeTab === 'preview' ? 500 : 1000;
      const timeoutId = setTimeout(() => {
        setIsChartGenerationRequested(true);
      }, debounceTime);
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    // 🚨 CRITICAL: Watch ALL metric properties that could change
    JSON.stringify(contextMetrics?.humanIntrusions || {}),
    JSON.stringify(contextMetrics?.vehicleIntrusions || {}),
    contextMetrics?.potentialThreats, 
    contextMetrics?.proactiveAlerts,
    contextMetrics?.aiAccuracy, 
    contextMetrics?.responseTime,
    contextMetrics?.totalCameras,
    contextMetrics?.camerasOnline,
    contextMetrics?.operationalUptime,
    activeTab
  ]);

  // CRITICAL: Real-time theme synchronization to context
  useEffect(() => {
    console.log('🎨 Theme settings changed, syncing to context:', {
      hasBackgroundImage: !!themeSettings?.backgroundImage,
      backgroundImagePath: themeSettings?.backgroundImage,
      reportTitle: themeSettings?.reportTitle
    });
  }, [themeSettings]);

  // Enhanced callback handlers with error boundaries
  const handleSelectClient = useCallback((client: ClientData) => {
    try {
      setSelectedClient(client);
      
      // CRITICAL: ALWAYS use security company contact information
      // NEVER use client contact information for reports
      const securityCompanyEmail = 'it@defenseic.com';
      const securityCompanySignature = 'Sean Swan';
      
      // 🚨 FIXED: Update context directly - no local state setters
      if (contextData.setContactEmail) {
        contextData.setContactEmail(securityCompanyEmail);
      }
      if (contextData.setSignature) {
        contextData.setSignature(securityCompanySignature);
      }
      
      console.log('🔒 SECURITY CONTACT ENFORCED:', {
        clientName: client.name,
        clientEmail: client.contactEmail,
        FORCED_securityEmail: securityCompanyEmail,
        FORCED_signature: securityCompanySignature,
        message: 'Contact info ALWAYS uses security company details'
      });
      
      setDeliveryOptions(prev => ({ 
        ...prev, 
        // For delivery, we send TO the client but FROM security company
        emailRecipients: client.contactEmail ? [client.contactEmail] : [],
        // CC our security company for records
        ccEmails: [securityCompanyEmail]
      }));
      
      // CRITICAL: Generate metrics based on client data using proper calculation
      const clientSpecificMetrics = generateMetricsForClient(client);
      
      // 🚨 FIXED: Update context directly - single source of truth
      if (contextData.setMetrics) {
        contextData.setMetrics(clientSpecificMetrics);
      }
      
      // 🚨 FIXED: Reset context data for new client
      if (contextData.setDailyReports) {
        contextData.setDailyReports(mockDailyReports || []);
      }
      if (contextData.setSummaryNotes) {
        contextData.setSummaryNotes('');
      }
      if (contextData.setSignature) {
        contextData.setSignature(securityCompanySignature);
      }
      if (contextData.setContactEmail) {
        contextData.setContactEmail(securityCompanyEmail);
      }
      
      console.log('🏢 FIXED: Client-specific data set in context:', {
        clientName: client.name,
        clientCameras: client.cameras,
        generatedTotalCameras: clientSpecificMetrics.totalCameras,
        generatedCamerasOnline: clientSpecificMetrics.camerasOnline,
        shouldShow: `${clientSpecificMetrics.camerasOnline}/${clientSpecificMetrics.totalCameras}`,
        aiAccuracy: clientSpecificMetrics.aiAccuracy,
        operationalUptime: clientSpecificMetrics.operationalUptime,
        resetDailyReports: (mockDailyReports || []).length,
        resetSignature: securityCompanySignature,
        resetContactEmail: securityCompanyEmail
      });
      
      // Reset other local-only states
      setReportMedia([]);
      setChartDataURL(''); // Clear existing chart so new one generates
      setActiveTab('info');
      
      toast({ 
        title: "Client Selected", 
        description: `Selected ${client.name} with ${client.cameras || 0} cameras. Security contact: ${securityCompanyEmail}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error selecting client:', error);
      toast({ 
        variant: "destructive", 
        title: "Selection Error", 
        description: "Failed to select client. Please try again."
      });
    }
  }, [setSelectedClient, setDeliveryOptions, contextData.setMetrics, contextData.setDailyReports, contextData.setSummaryNotes, contextData.setSignature, contextData.setContactEmail, setReportMedia, setActiveTab, toast]);

  // REMOVED handleMetricsChange - PropertyInfoPanel updates context directly
  // Charts regenerate automatically when context metrics change

  // 🚨 FIXED: Simplified daily reports handler - CONTEXT ONLY
  const handleReportChange = useCallback((day: string, content: string, status?: string, securityCode?: string) => {
    console.log('🚨 FIXED: Daily report update - CONTEXT ONLY:', {
      day,
      contentLength: content.length,
      status,
      securityCode,
      source: 'CONTEXT_ONLY_UPDATE'
    });
    
    // 🚨 CRITICAL FIX: Use ONLY context - no local state confusion
    if (contextData.setDailyReports) {
      contextData.setDailyReports(prev => 
        prev.map(report => 
          report.day === day 
            ? { 
                ...report, 
                content,
                status: (status as DailyReportStatus) || report.status,
                securityCode: (securityCode as SecurityCode) || report.securityCode,
                timestamp: new Date().toISOString()
              } 
            : report
        )
      );
      
      console.log('✅ FIXED: Daily report saved DIRECTLY to context with auto-persistence');
    } else {
      console.error('❌ FIXED: Context setDailyReports not available!');
    }
  }, [contextData.setDailyReports]);

  // More callback handlers
  const handleAIOptionChange = useCallback((options: Partial<AIOptions>) => { 
    setAIOptions(prev => ({ ...prev, ...options })); 
  }, [setAIOptions]);

  // 🚨 FIXED: Simplified summary handler - CONTEXT ONLY
  const handleSummaryChange = useCallback((text: string) => { 
    console.log('🚨 FIXED: Summary update - CONTEXT ONLY:', {
      textLength: text.length,
      source: 'CONTEXT_ONLY_UPDATE'
    });
    
    if (contextData.setSummaryNotes) {
      contextData.setSummaryNotes(text);
      console.log('✅ FIXED: Summary notes saved DIRECTLY to context with auto-persistence');
    } else {
      console.error('❌ FIXED: Context setSummaryNotes not available!');
    }
  }, [contextData.setSummaryNotes]);

  // 🚨 FIXED: Simplified signature handler - CONTEXT ONLY
  const handleSignatureChange = useCallback((text: string) => { 
    console.log('🚨 FIXED: Signature update - CONTEXT ONLY');
    
    if (contextData.setSignature) {
      contextData.setSignature(text);
      console.log('✅ FIXED: Signature saved DIRECTLY to context');
    } else {
      console.error('❌ FIXED: Context setSignature not available!');
    }
  }, [contextData.setSignature]);

  // 🚨 FIXED: Simplified contact email handler - CONTEXT ONLY
  const handleContactEmailChange = useCallback((email: string) => { 
    console.log('🚨 FIXED: Contact email update - CONTEXT ONLY');
    
    if (contextData.setContactEmail) {
      contextData.setContactEmail(email);
      console.log('✅ FIXED: Contact email saved DIRECTLY to context');
    } else {
      console.error('❌ FIXED: Context setContactEmail not available!');
    }
  }, [contextData.setContactEmail]);

  // 🚨 FIXED: Simplified theme handler - CONTEXT ONLY
  const handleThemeChange = useCallback((settings: Partial<CustomThemeSettings>) => { 
    console.log('🚨 FIXED: Theme update - CONTEXT ONLY');
    
    if (contextData.setThemeSettings) {
      contextData.setThemeSettings(prev => ({ ...prev, ...settings }));
      console.log('✅ FIXED: Theme settings saved DIRECTLY to context');
    } else {
      console.error('❌ FIXED: Context setThemeSettings not available!');
    }
    
    // Keep local theme state for immediate UI feedback only
    setThemeSettings(prev => ({ ...prev, ...settings }));
  }, [contextData.setThemeSettings, setThemeSettings]);

  const handleDeliveryOptionsChange = useCallback((options: Partial<DeliveryOptions>) => { 
    setDeliveryOptions(prev => ({ ...prev, ...options })); 
  }, [setDeliveryOptions]);

  // 🚨 FIXED: Simplified navigation - context handles persistence automatically + TAB SWITCH DATA SAVE
  const handleTabChange = useCallback((newTab: string) => {
    console.log('🚀 TAB NAVIGATION: From', activeTab, 'to', newTab, '- SAVING DATA BEFORE SWITCH');
    
    // 🚨 CRITICAL: Save all current data to context before switching tabs
    if (activeTab === 'reports') {
      console.log('💾 SAVE CHECKPOINT: Leaving Daily Reports tab - ensuring all data persisted');
      
      // Emit save event to ensure Daily Reports saves all pending changes
      const saveEvent = new CustomEvent('forceSaveBeforeTabSwitch', {
        detail: {
          fromTab: activeTab,
          toTab: newTab,
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(saveEvent);
    }
    
    // 🚨 IMMEDIATE data sync event for any components listening
    const tabSwitchEvent = new CustomEvent('tabSwitchDataSync', {
      detail: {
        fromTab: activeTab,
        toTab: newTab,
        action: 'ENSURE_DATA_SYNC',
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(tabSwitchEvent);
    
    // Switch to the new tab
    setActiveTab(newTab);
    
    console.log('✅ TAB SWITCH COMPLETE: Now on', newTab, 'tab with data saved');
  }, [activeTab, setActiveTab]);

  const handleMediaSystemSelection = useCallback((selectedMediaFromSystem: MediaFile[]) => { 
    setReportMedia(selectedMediaFromSystem); 
  }, [setReportMedia]);

  const handleRefreshChart = useCallback(() => { 
    setChartDataURL(''); // Clear existing chart
    setIsChartGenerationRequested(true); 
  }, []);

  // Enhanced PDF download with compression options
  const handleDownloadReport = useCallback(async (compressionType: 'standard' | 'compressed' | 'both' = 'both') => {
    if (!selectedClient || !previewPanelRef.current) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Client not selected or preview not ready." 
      }); 
      return;
    }

    if (activeTab !== 'preview') {
      handleTabChange('preview'); 
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!previewPanelRef.current) { 
        toast({ 
          variant: "destructive", 
          title: "Preview Error",
          description: "Preview panel could not be loaded."
        }); 
        return; 
      }
    }

    setIsLoading(true); 
    setLoadingMessage('Generating PDF with compression options...');
    
    try {
      const fileName = `${selectedClient.name}_Report_${format(dateRange.start, 'yyyyMMdd')}-${format(dateRange.end, 'yyyyMMdd')}.pdf`;
      
      const result = await EnhancedPDFGenerator.generatePDF({
        element: previewPanelRef.current,
        filename: fileName,
        quality: compressionType === 'compressed' ? 0.6 : 0.8,
        generateCompressed: compressionType === 'both' || compressionType === 'compressed',
        removeWatermarks: true,
        scale: 2
      });
      
      if (result.success) {
        let description = `Report saved as ${result.filename}`;
        if (result.compressedFilename) {
          const savings = result.originalSize && result.compressedSize 
            ? Math.round((1 - result.compressedSize / result.originalSize) * 100)
            : 0;
          description += ` and ${result.compressedFilename} (${savings}% smaller)`;
        }
        
        toast({ 
          title: "PDF Generated Successfully", 
          description,
          variant: "default"
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) { 
      console.error("PDF Error:", error); 
      toast({ 
        variant: "destructive", 
        title: "PDF Generation Failed", 
        description: "Unable to generate PDF. Please try again."
      }); 
    } finally { 
      setIsLoading(false); 
      setLoadingMessage(''); 
    }
  }, [selectedClient, activeTab, dateRange, toast, setActiveTab]);

  // Memoized values for performance
  const isClientSelected = !!selectedClient;
  const tabs = useMemo(() => [
    { id: 'client', label: '1. Client Selection', disabled: false },
    { id: 'info', label: '2. Property Info', disabled: !isClientSelected },
    { id: 'reports', label: '3. Daily Reports', disabled: !isClientSelected },
    { id: 'media', label: '4. Media Management', disabled: !isClientSelected },
    { id: 'viz', label: '5. Data Visualization', disabled: !isClientSelected },
    { id: 'theme', label: '6. Theme Customization', disabled: !isClientSelected },
    { id: 'delivery', label: '7. Delivery Options', disabled: !isClientSelected },
    { id: 'preview', label: '8. PDF Preview & Export', disabled: !isClientSelected },
  ], [isClientSelected]);

  // Navigation logic
  const currentTabIndex = useMemo(() => tabs.findIndex(tab => tab.id === activeTab), [tabs, activeTab]);
  
  const handleNext = useCallback(() => { 
    let ni = currentTabIndex + 1; 
    while(ni < tabs.length && tabs[ni].disabled) ni++; 
    if(ni < tabs.length) handleTabChange(tabs[ni].id); 
  }, [currentTabIndex, tabs, handleTabChange]);
  
  const handlePrevious = useCallback(() => { 
    let pi = currentTabIndex - 1; 
    while(pi >= 0 && tabs[pi].disabled) pi--; 
    if(pi >= 0) handleTabChange(tabs[pi].id); 
  }, [currentTabIndex, tabs, handleTabChange]);

  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;
  const canGoNext = !isLastTab && currentTabIndex + 1 < tabs.length && !tabs[currentTabIndex + 1]?.disabled;
  const canGoPrevious = !isFirstTab;

  // Render component
  return (
    <ReportBuilderErrorBoundary>
      <ThemeProvider theme={themeSettings}>
        <GlobalStyle />
        {isLoading && (
          <LoadingOverlay>
            <LoadingSpinner />
            <LoadingMessage>{loadingMessage}</LoadingMessage>
          </LoadingOverlay>
        )}
        
        <ReportDataProvider 
          initialClient={selectedClient} 
          initialMetrics={mockMetricsData}
          initialDateRange={dateRange}
          initialThemeSettings={themeSettings}
          key={`provider-${selectedClient?.id || 'no-client'}`}
        >
          
          {/* Enhanced Debug Monitor - REMOVED to fix infinite loop */}
          
          <Container>
            <Title>{themeSettings.reportTitle || 'Enhanced Report Builder'}</Title>

            <DateRangeContainer>
              <span>Report for week:</span>
              <DatePicker
                date={currentDate}
                onDateChange={(date) => { if (date) setCurrentDate(date); }}
              >
                <DatePickerButton>
                  <CalendarIcon size={16} />
                  {`${format(dateRange.start, 'MMM dd')} - ${format(dateRange.end, 'MMM dd, yyyy')}`}
                </DatePickerButton>
              </DatePicker>
              <Button 
                $variant="secondary" 
                onClick={() => setCurrentDate(subDays(currentDate, 7))} 
                title="Previous Week"
              >
                <ChevronLeft size={16}/> Prev
              </Button>
              <Button 
                $variant="secondary" 
                onClick={() => setCurrentDate(addDays(currentDate, 7))} 
                title="Next Week"
              >
                Next <ChevronRight size={16}/>
              </Button>
            </DateRangeContainer>

            <TabContainer>
              {tabs.map(tab => (
                <Tab 
                  key={tab.id} 
                  $active={activeTab === tab.id} 
                  $isNew={tab.isNew}
                  onClick={() => !tab.disabled && handleTabChange(tab.id)} 
                  disabled={tab.disabled}
                  theme={themeSettings}
                >
                  {tab.label}
                </Tab>
              ))}
            </TabContainer>

            <div style={{ marginTop: '1.5rem' }}>
              {/* Tab Content with Error Boundaries */}
              {activeTab === 'client' && ( 
                <ReportBuilderErrorBoundary fallback={<div>Error loading client selector</div>}>
                  <ClientSelector 
                    clients={clients} 
                    onSelectClient={handleSelectClient} 
                    selectedClient={selectedClient} 
                  />
                </ReportBuilderErrorBoundary>
              )}

              {activeTab === 'info' && selectedClient && ( 
                <ReportBuilderErrorBoundary fallback={<div>Error loading property info</div>}>
                  <PropertyInfoPanel 
                    clientData={selectedClient} 
                    dateRange={dateRange} 
                  />
                </ReportBuilderErrorBoundary>
              )}

              {activeTab === 'reports' && selectedClient && ( 
                <ReportBuilderErrorBoundary fallback={<div>Error loading daily reports</div>}>
                  <EnhancedDailyReportsPanel 
                    dailyReports={dailyReports}
                    onReportChange={handleReportChange} 
                    dateRange={dateRange} 
                    summaryNotes={summaryNotes}
                    onSummaryChange={handleSummaryChange} 
                    signature={signature}
                    onSignatureChange={handleSignatureChange} 
                    aiOptions={aiOptions} 
                    onAIOptionChange={handleAIOptionChange} 
                    contactEmail={contactEmail}
                    onContactEmailChange={handleContactEmailChange} 
                  />
                </ReportBuilderErrorBoundary>
              )}

              {activeTab === 'media' && selectedClient && ( 
                <ReportBuilderErrorBoundary fallback={<div>Error loading media management</div>}>
                  <MediaManagementSystem 
                    initialMedia={reportMedia} 
                    onMediaSelect={handleMediaSystemSelection} 
                  />
                </ReportBuilderErrorBoundary>
              )}

              {activeTab === 'viz' && selectedClient && (
                <ReportBuilderErrorBoundary fallback={<div>Error loading visualization</div>}>
                  <div ref={chartRef}>
                    <DataVisualizationPanel 
                      themeSettings={themeSettings} 
                      setChartDataURL={(url) => setChartDataURL(url ?? '')} 
                      dateRange={dateRange} 
                      chartRef={chartRef} 
                    />
                    <Button 
                      $variant="primary" 
                      onClick={handleRefreshChart} 
                      style={{ marginTop: '15px' }} 
                      disabled={isLoading || isChartGenerationRequested}
                      theme={themeSettings}
                      title="Generate chart with enhanced loading detection - waits for full chart rendering"
                    >
                      <RefreshCw size={16} />
                      {isLoading ? 'Generating with Full Loading Detection...' : (isChartGenerationRequested ? 'Queued for Enhanced Capture...' : 'Enhanced Chart Capture')}
                    </Button>
                  </div>
                </ReportBuilderErrorBoundary>
              )}

              {activeTab === 'theme' && selectedClient && ( 
                <ReportBuilderErrorBoundary fallback={<div>Error loading theme builder</div>}>
                  <ThemeBuilder 
                    settings={themeSettings} 
                    onChange={handleThemeChange} 
                  />
                </ReportBuilderErrorBoundary>
              )}

              {activeTab === 'delivery' && selectedClient && ( 
                <ReportBuilderErrorBoundary fallback={<div>Error loading delivery options</div>}>
                  <DeliveryOptionsPanel 
                    options={deliveryOptions} 
                    onChange={handleDeliveryOptionsChange} 
                    client={selectedClient} 
                  />
                </ReportBuilderErrorBoundary>
              )}

              {activeTab === 'preview' && selectedClient && (
                <ReportBuilderErrorBoundary fallback={<div>Error loading preview</div>}>
                  <div ref={previewPanelRef}>
                    <EnhancedPreviewPanel
                      mediaFiles={reportMedia}
                      videoLinks={[]} 
                      backgroundColor={themeSettings.secondaryColor}
                      textColor={themeSettings.textColor}
                      leftLogo={themeSettings.companyLogo} 
                      rightLogo={themeSettings.clientLogo}
                      onExportPDF={handleDownloadReport}
                    />
                  </div>
                </ReportBuilderErrorBoundary>
              )}
            </div>

            <NavigationContainer>
              <Button 
                $variant="secondary" 
                onClick={handlePrevious} 
                disabled={!canGoPrevious}
                theme={themeSettings}
              > 
                <ChevronLeft size={16} /> Previous 
              </Button>
              {activeTab !== 'preview' ? (
                <Button 
                  $variant="primary" 
                  onClick={handleNext} 
                  disabled={!canGoNext}
                  theme={themeSettings}
                > 
                  Next <ChevronRight size={16} /> 
                </Button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Button 
                    $variant="success" 
                    onClick={() => handleDownloadReport('standard')} 
                    disabled={isLoading || !selectedClient}
                    theme={themeSettings}
                    title="Download standard quality PDF"
                  > 
                    <Download size={16} /> Standard PDF 
                  </Button>
                  <Button 
                    $variant="secondary" 
                    onClick={() => handleDownloadReport('compressed')} 
                    disabled={isLoading || !selectedClient}
                    theme={themeSettings}
                    title="Download compressed PDF (smaller file size)"
                  > 
                    <Download size={16} /> Compressed 
                  </Button>
                  <Button 
                    $variant="primary" 
                    onClick={() => handleDownloadReport('both')} 
                    disabled={isLoading || !selectedClient}
                    theme={themeSettings}
                    title="Download both standard and compressed versions"
                  > 
                    <Download size={16} /> Both Versions 
                  </Button>
                </div>
              )}
            </NavigationContainer>
          </Container>
        </ReportDataProvider>
      </ThemeProvider>
    </ReportBuilderErrorBoundary>
  );
};

export default EnhancedReportBuilder;