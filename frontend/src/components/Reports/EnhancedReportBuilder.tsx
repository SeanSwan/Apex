// Enhanced Report Builder with Performance Optimizations and Bug Fixes
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
import DailyReportsPanel from './DailyReportsPanel';
import MediaManagementSystem from './MediaManagementSystem';
import DataVisualizationPanel from './DataVisualizationPanel';
import ThemeBuilder from './ThemeBuilder';
import EnhancedPreviewPanel from './EnhancedPreviewPanel';
import DeliveryOptionsPanel from './DeliveryOptionsPanel';
import BugFixVerification from './BugFixVerification';


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
  // REMOVED LOCAL METRICS STATE - Context is single source of truth
  const [dailyReports, setDailyReports] = usePerformanceOptimizedState<DailyReport[]>(mockDailyReports || [], 'dailyReports');
  const [summaryNotes, setSummaryNotes] = usePerformanceOptimizedState<string>('', 'summaryNotes');
  const [signature, setSignature] = usePerformanceOptimizedState<string>('', 'signature');
  const [contactEmail, setContactEmail] = usePerformanceOptimizedState<string>('', 'contactEmail');
  const [chartDataURL, setChartDataURL] = useState<string>('');
  const [themeSettings, setThemeSettings] = usePerformanceOptimizedState<CustomThemeSettings>(defaultThemeSettings, 'themeSettings');
  const [aiOptions, setAIOptions] = usePerformanceOptimizedState<AIOptions>(defaultAIOptions, 'aiOptions');
  const [deliveryOptions, setDeliveryOptions] = usePerformanceOptimizedState<DeliveryOptions>(defaultDeliveryOptions, 'deliveryOptions');
  const [reportMedia, setReportMedia] = usePerformanceOptimizedState<MediaFile[]>([], 'reportMedia');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isChartGenerationRequested, setIsChartGenerationRequested] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = usePerformanceOptimizedState<Date>(new Date(), 'currentDate');

  // Get chart data from context directly
  const contextData = useReportData();
  const contextMetrics = contextData.metrics;

  // Memoized date range calculation
  const dateRange = useMemo(() => ({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 })
  }), [currentDate]);

  // Enhanced error handling for chart generation
  const generateChartWithErrorHandling = useCallback(async () => {
    if (!chartRef.current) return;

    setIsLoading(true);
    setLoadingMessage('Generating chart preview...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current, { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: null,
          logging: false 
        });
        const dataUrl = canvas.toDataURL('image/png');
        setChartDataURL(dataUrl);
        
        toast({ 
          title: "Chart Generated", 
          description: "Chart preview updated successfully.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Chart generation failed:', error);
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

  // 🚨 IMMEDIATE chart generation when switching to preview
  useEffect(() => {
    if (activeTab === 'preview' && chartRef.current) {
      console.log('⚡ IMMEDIATE chart generation for preview');
      
      // Generate immediately, don't wait
      const timeoutId = setTimeout(() => {
        setIsChartGenerationRequested(true);
      }, 100); // Very short delay
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab]);

  // 🚨 CRITICAL FIX: Chart regeneration when context metrics change  
  useEffect(() => {
    if ((activeTab === 'viz' || activeTab === 'preview') && contextMetrics) {
      console.log('📈 CONTEXT metrics changed - requesting chart regeneration');
      
      // Shorter debounce for preview
      const debounceTime = activeTab === 'preview' ? 500 : 1000;
      const timeoutId = setTimeout(() => {
        setIsChartGenerationRequested(true);
      }, debounceTime);
      
      return () => clearTimeout(timeoutId);
    }
  }, [contextMetrics?.potentialThreats, contextMetrics?.aiAccuracy, contextMetrics?.totalCameras, activeTab]);

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
      
      // FORCE security company email - do not use client email
      setContactEmail(securityCompanyEmail);
      setSignature(securityCompanySignature);
      
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
      
      // Update context directly - no local state
      if (contextData.setMetrics) {
      contextData.setMetrics(clientSpecificMetrics);
      }
      
      console.log('🏢 Client-specific metrics generated for context:', {
      clientName: client.name,
      clientCameras: client.cameras,
      generatedTotalCameras: clientSpecificMetrics.totalCameras,
      generatedCamerasOnline: clientSpecificMetrics.camerasOnline,
      shouldShow: `${clientSpecificMetrics.camerasOnline}/${clientSpecificMetrics.totalCameras}`,
      aiAccuracy: clientSpecificMetrics.aiAccuracy,
      operationalUptime: clientSpecificMetrics.operationalUptime
      });
      
      // Reset other states for new client but keep security company defaults
      setDailyReports(mockDailyReports || []);
      setSummaryNotes('');
      setSignature(securityCompanySignature); // Keep default signature
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
  }, [setSelectedClient, setContactEmail, setDeliveryOptions, contextData.setMetrics, setDailyReports, setSummaryNotes, setSignature, setReportMedia, setActiveTab, toast]);

  // REMOVED handleMetricsChange - PropertyInfoPanel updates context directly
  // Charts regenerate automatically when context metrics change

  const handleReportChange = useCallback((day: string, content: string, status?: string, securityCode?: string) => {
    setDailyReports(prev => prev.map(report => 
      report.day === day 
        ? { 
            ...report, 
            content, 
            status: (status as DailyReportStatus) || report.status, 
            securityCode: (securityCode as SecurityCode) || report.securityCode 
          } 
        : report
    ));
  }, [setDailyReports]);

  // More callback handlers
  const handleAIOptionChange = useCallback((options: Partial<AIOptions>) => { 
    setAIOptions(prev => ({ ...prev, ...options })); 
  }, [setAIOptions]);

  const handleSummaryChange = useCallback((text: string) => { 
    setSummaryNotes(text); 
  }, [setSummaryNotes]);

  const handleSignatureChange = useCallback((text: string) => { 
    setSignature(text); 
  }, [setSignature]);

  const handleContactEmailChange = useCallback((email: string) => { 
    setContactEmail(email); 
  }, [setContactEmail]);

  const handleThemeChange = useCallback((settings: Partial<CustomThemeSettings>) => { 
    setThemeSettings(prev => ({ ...prev, ...settings })); 
  }, [setThemeSettings]);

  const handleDeliveryOptionsChange = useCallback((options: Partial<DeliveryOptions>) => { 
    setDeliveryOptions(prev => ({ ...prev, ...options })); 
  }, [setDeliveryOptions]);

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
      setActiveTab('preview'); 
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
    if(ni < tabs.length) setActiveTab(tabs[ni].id); 
  }, [currentTabIndex, tabs, setActiveTab]);
  
  const handlePrevious = useCallback(() => { 
    let pi = currentTabIndex - 1; 
    while(pi >= 0 && tabs[pi].disabled) pi--; 
    if(pi >= 0) setActiveTab(tabs[pi].id); 
  }, [currentTabIndex, tabs, setActiveTab]);

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
          key={`${selectedClient?.id || 'no-client'}-${themeSettings?.backgroundImage || 'no-bg'}`}
        >
          {/* 🚨 CRITICAL FIX: REMOVED ReportDataUpdater and ContextDataSyncer */}
          {/* These were creating circular loops - context is now the single source of truth */}
          
          {/* Debug verification component */}
          <BugFixVerification />
          
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
                  onClick={() => !tab.disabled && setActiveTab(tab.id)} 
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
                  <DailyReportsPanel 
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
                    >
                      <RefreshCw size={16} />
                      {isLoading ? 'Generating...' : (isChartGenerationRequested ? 'Queued...' : 'Refresh Chart')}
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