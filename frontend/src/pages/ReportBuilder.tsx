import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import styled, { createGlobalStyle, css, ThemeProvider } from 'styled-components';
import { format, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '../hooks/use-toast';
import { ChevronLeft, ChevronRight, Download, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';

// --- Type Imports ---
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
} from '../types/reports';

// --- Component Imports ---
import ClientSelector from '../components/Reports/ClientSelector';
import PropertyInfoPanel from '../components/Reports/PropertyInfoPanel';
import DailyReportsPanel from '../components/Reports/DailyReportsPanel';
import MediaManagementSystem from '../components/Reports/MediaManagementSystem';
import DataVisualizationPanel from '../components/Reports/DataVisualizationPanel';
import ThemeBuilder from '../components/Reports/ThemeBuilder';
// Import the Enhanced Preview Panel instead of standard PreviewPanel
import EnhancedPreviewPanel from '../components/Reports/PreviewPanel';
import DeliveryOptionsPanel from '../components/Reports/DeliveryOptionsPanel';
import { DatePicker } from './../components/ui/date-picker';

// --- Context Providers ---
import { ReportDataProvider, useReportData } from '../context/ReportDataContext';

// --- Mock Data Import ---
import { mockClients, mockMetricsData, mockDailyReports } from '../data/mockData';

// --- Custom Theme Settings Interface ---
interface CustomThemeSettings extends ThemeSettings {
  backgroundOpacity: number;
  reportTitle: string;
  headerImage?: string;
  companyLogo?: string;
  clientLogo?: string;
  textColor?: string;
}

// --- Styled Components ---
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: sans-serif;
    background-color: #0f1419;
  }
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 2rem auto;
  padding: 1.5rem;
  position: relative;
  border-radius: 10px;
  background-image: url('/src/assets/marble-texture.png');
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
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

  @media (max-width: 768px) {
    gap: 0.5rem;
    font-size: 0.9rem;
  }
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
  &:hover { background-color: rgba(50, 50, 55, 0.6); }
`;

const TabContainer = styled.div`
  display: flex;
  overflow-x: auto;
  margin-bottom: 2rem;
  border-bottom: 2px solid rgba(238, 232, 170, 0.3);
  padding-bottom: 1px;

  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;

  @media (min-width: 1024px) {
    overflow-x: visible;
    justify-content: center;
    flex-wrap: wrap;
  }
`;

interface TabProps {
  $active: boolean;
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

  @media (max-width: 768px) {
    padding: 10px 12px;
    font-size: 0.85em;
  }
`;


const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(238, 232, 170, 0.3);
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
`;

interface ButtonProps {
  $variant?: 'primary' | 'secondary' | 'success' | 'danger';
  theme?: CustomThemeSettings;
}

const BaseButtonStyles = css<ButtonProps>`
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
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

  @media (max-width: 768px) {
    padding: 8px 15px;
    font-size: 0.9em;
  }
`;

const Button = styled.button<ButtonProps>`
  ${BaseButtonStyles}

  ${({ $variant = 'secondary', theme }) => {
    const primary = theme?.primaryColor || '#FFD700';

    const darken = (color: string, amount: number): string => {
        let usePound = false; if (color[0] === "#") { color = color.slice(1); usePound = true; }
        const num = parseInt(color, 16);
        let r = (num >> 16) - amount; if (r < 0) r = 0; r = Math.min(255, r);
        let g = ((num >> 8) & 0x00FF) - amount; if (g < 0) g = 0; g = Math.min(255, g);
        let b = (num & 0x0000FF) - amount; if (b < 0) b = 0; b = Math.min(255, b);
        return (usePound?"#":"") + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
    };

    switch ($variant) {
      case 'primary': return css` background-color: ${primary}; color: #0a0a0a; &:hover:not(:disabled) { background-color: ${darken(primary, 20)}; } `;
      case 'success': return css` background-color: #25914B; color: white; &:hover:not(:disabled) { background-color: #1e7940; } `;
      case 'danger': return css` background-color: #b52e3c; color: white; &:hover:not(:disabled) { background-color: #9e2635; } `;
      case 'secondary': default: return css` background-color: rgba(30, 30, 35, 0.7); color: #F0E6D2; border: 1px solid rgba(238, 232, 170, 0.3); &:hover:not(:disabled) { background-color: rgba(50, 50, 55, 0.7); } `;
    }
  }}
`;


const LoadingOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(10, 10, 12, 0.8);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  z-index: 1000;
`;

const LoadingSpinner = styled.div`
  border: 4px solid #222222;
  border-top: 4px solid #FFD700;
  border-radius: 50%;
  width: 40px; height: 40px;
  animation: spin 1.5s linear infinite;
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;

const LoadingMessage = styled.div`
  margin-top: 1rem; color: #F0E6D2; font-weight: 500;
`;

// --- Default State Initializers ---
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
  backgroundOpacity: 0.7, headerImage: '/src/assets/marble-texture.png',
  companyLogo: '', clientLogo: '', textColor: '#F0E6D2',
};

// --- Component Definition ---
const ReportBuilder: React.FC = () => {
  // Component state
  const { toast } = useToast();
  const chartRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);

  // --- State Hooks ---
  const [activeTab, setActiveTab] = useState<string>('client');
  const [clients] = useState<ClientData[]>(() => mockClients);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData>(() => mockMetricsData);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(() => mockDailyReports || []);
  const [summaryNotes, setSummaryNotes] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [chartDataURL, setChartDataURL] = useState<string>('');
  const [themeSettings, setThemeSettings] = useState<CustomThemeSettings>(defaultThemeSettings);
  const [aiOptions, setAIOptions] = useState<AIOptions>(defaultAIOptions);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptions>(defaultDeliveryOptions);
  const [reportMedia, setReportMedia] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isChartGenerationRequested, setIsChartGenerationRequested] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const dateRange = useMemo(() => ({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 })
  }), [currentDate]);

  // --- Effects (LocalStorage, Chart Capture) ---
  // Load state from localStorage
  useEffect(() => {
    console.log("Attempting to load state from localStorage...");
    try {
        const savedClient = localStorage.getItem('selectedClient');
        if (savedClient) {
            const client = JSON.parse(savedClient);
            setSelectedClient(client);
            setContactEmail(client.contactEmail || '');
        }

        const savedMetrics = localStorage.getItem('metrics');
        setMetrics(savedMetrics ? JSON.parse(savedMetrics) : mockMetricsData);

        const savedReports = localStorage.getItem('dailyReports');
        setDailyReports(savedReports ? JSON.parse(savedReports) : (mockDailyReports || []));

        setSummaryNotes(localStorage.getItem('summaryNotes') || '');
        setSignature(localStorage.getItem('signature') || '');

        const savedTheme = localStorage.getItem('themeSettings');
        setThemeSettings(savedTheme ? { ...defaultThemeSettings, ...JSON.parse(savedTheme) } : defaultThemeSettings);

        const savedAIOptions = localStorage.getItem('aiOptions');
        setAIOptions(savedAIOptions ? { ...defaultAIOptions, ...JSON.parse(savedAIOptions) } : defaultAIOptions);

        const savedDeliveryOptions = localStorage.getItem('deliveryOptions');
        if (savedDeliveryOptions) {
            const parsed = JSON.parse(savedDeliveryOptions);
            if (parsed.deliveryDate) parsed.deliveryDate = new Date(parsed.deliveryDate);
            setDeliveryOptions({ ...defaultDeliveryOptions, ...parsed });
        } else {
            setDeliveryOptions(defaultDeliveryOptions);
        }

        const savedReportMedia = localStorage.getItem('reportMedia');
        setReportMedia(savedReportMedia ? JSON.parse(savedReportMedia) : []);

        const savedDate = localStorage.getItem('currentDate');
        if (savedDate) setCurrentDate(new Date(savedDate));

    } catch (error) {
        console.error("Failed to load state from localStorage:", error);
        toast({ variant: "destructive", title: "Load Failed", description: "Could not load saved state." });
    }
  }, [toast]);

  // Save state to localStorage (individual effects)
  useEffect(() => { if (selectedClient) localStorage.setItem('selectedClient', JSON.stringify(selectedClient)); else localStorage.removeItem('selectedClient'); }, [selectedClient]);
  useEffect(() => { localStorage.setItem('metrics', JSON.stringify(metrics)); }, [metrics]);
  useEffect(() => { localStorage.setItem('dailyReports', JSON.stringify(dailyReports)); }, [dailyReports]);
  useEffect(() => { localStorage.setItem('summaryNotes', summaryNotes); }, [summaryNotes]);
  useEffect(() => { localStorage.setItem('signature', signature); }, [signature]);
  useEffect(() => { localStorage.setItem('themeSettings', JSON.stringify(themeSettings)); }, [themeSettings]);
  useEffect(() => { localStorage.setItem('aiOptions', JSON.stringify(aiOptions)); }, [aiOptions]);
  useEffect(() => { localStorage.setItem('deliveryOptions', JSON.stringify(deliveryOptions)); }, [deliveryOptions]);
  useEffect(() => { localStorage.setItem('contactEmail', contactEmail); }, [contactEmail]);
  useEffect(() => { localStorage.setItem('reportMedia', JSON.stringify(reportMedia)); }, [reportMedia]);
  useEffect(() => { localStorage.setItem('currentDate', currentDate.toISOString()); }, [currentDate]);

  // Chart Generation Effect
  useEffect(() => {
    let isMounted = true;
    const generateChart = async () => {
      if ((activeTab === 'viz' || activeTab === 'preview') && chartRef.current && (isChartGenerationRequested || chartDataURL === '')) {
        setIsLoading(true); setLoadingMessage('Generating chart preview...');
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          if (isMounted && chartRef.current) {
            const canvas = await html2canvas(chartRef.current, { scale: 2, useCORS: true, backgroundColor: null });
            const dataUrl = canvas.toDataURL('image/png');
            if (isMounted) setChartDataURL(dataUrl);
          }
        } catch (error) { console.error('Failed to capture chart:', error); if(isMounted) toast({ variant: "destructive", title: "Chart Capture Failed" }); }
        finally { if (isMounted) { setIsLoading(false); setLoadingMessage(''); setIsChartGenerationRequested(false); } }
      }
    };
    generateChart();
    return () => { isMounted = false; };
  }, [activeTab, isChartGenerationRequested, chartDataURL, toast]);

  // Effect to request chart regeneration when relevant data changes
  useEffect(() => {
    if (activeTab === 'viz' || activeTab === 'preview') {
      setIsChartGenerationRequested(true);
    }
  }, [metrics, themeSettings, activeTab]);

  // Force context sync when switching to preview tab
  useEffect(() => {
    if (activeTab === 'preview') {
      console.log('Preview tab activated - forcing data sync to context');
      // Force immediate sync by setting loading state
      setIsLoading(true);
      
      // Use setTimeout to ensure all state updates have been processed
      setTimeout(() => {
        console.log('Preview data sync - Current state:', {
          selectedClient: selectedClient?.name,
          metricsCount: Object.keys(metrics).length,
          reportsCount: dailyReports.length,
          themeKeys: Object.keys(themeSettings),
          hasBackgroundImage: !!themeSettings.backgroundImage,
          signature,
          contactEmail
        });
        setIsLoading(false);
      }, 100);
    }
  }, [activeTab, selectedClient, metrics, dailyReports, themeSettings, signature, contactEmail]);

  // --- Callback Handlers ---
  const handleSelectClient = useCallback((client: ClientData) => {
    setSelectedClient(client);
    setContactEmail(client.contactEmail || '');
    setDeliveryOptions(prev => ({ ...prev, emailRecipients: client.contactEmail ? [client.contactEmail] : [] }));
    // Reset states for new client
    setMetrics(mockMetricsData);
    setDailyReports(mockDailyReports || []);
    setSummaryNotes('');
    setSignature('');
    setReportMedia([]);
    setChartDataURL('');
    setActiveTab('info');
    toast({ title: "Client Selected", description: `Selected ${client.name}.` });
  }, [toast]);

  const handleMetricsChange = useCallback((updatedMetrics: Partial<MetricsData>) => {
    setMetrics(prev => ({ ...prev, ...updatedMetrics }));
  }, []);

  const handleReportChange = useCallback((day: string, content: string, status?: string, securityCode?: string) => {
    setDailyReports(prev => prev.map(report => report.day === day ? { ...report, content, status: (status as DailyReportStatus) || report.status, securityCode: (securityCode as SecurityCode) || report.securityCode } : report));
  }, []);

  const handleAIOptionChange = useCallback((options: Partial<AIOptions>) => { setAIOptions(prev => ({ ...prev, ...options })); }, []);
  const handleSummaryChange = useCallback((text: string) => { setSummaryNotes(text); }, []);
  const handleSignatureChange = useCallback((text: string) => { setSignature(text); }, []);
  const handleContactEmailChange = useCallback((email: string) => { setContactEmail(email); }, []);
  const handleThemeChange = useCallback((settings: Partial<CustomThemeSettings>) => { setThemeSettings(prev => ({ ...prev, ...settings })); }, []);
  const handleDeliveryOptionsChange = useCallback((options: Partial<DeliveryOptions>) => { setDeliveryOptions(prev => ({ ...prev, ...options })); }, []);
  const handleMediaSystemSelection = useCallback((selectedMediaFromSystem: MediaFile[]) => { setReportMedia(selectedMediaFromSystem); }, []);
  const handleRefreshChart = useCallback(() => { setIsChartGenerationRequested(true); }, []);

  const handleDownloadReport = useCallback(async () => {
    if (!selectedClient || !previewPanelRef.current) {
      toast({ variant: "destructive", title: "Error", description: "Client not selected or preview not ready." }); return;
    }
    if (activeTab !== 'preview') {
      setActiveTab('preview'); await new Promise(resolve => setTimeout(resolve, 500));
      if (!previewPanelRef.current) { toast({ variant: "destructive", title: "Preview Error" }); return; }
    }
    setIsLoading(true); setLoadingMessage('Generating PDF...');
    try {
        const canvas = await html2canvas(previewPanelRef.current, { scale: 2, useCORS: true, logging: false, onclone: (doc) => { const wm = doc.querySelector('[data-watermark="true"]'); if(wm) (wm as HTMLElement).style.display = 'none'; }});
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth(); const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData); const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        let heightLeft = imgHeight; let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight); heightLeft -= pdfHeight;
        while (heightLeft > 0) { position -= pdfHeight; pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight); heightLeft -= pdfHeight; }
        pdf.save(`${selectedClient.name}_Report_${format(dateRange.start, 'yyyyMMdd')}-${format(dateRange.end, 'yyyyMMdd')}.pdf`);
        toast({ title: "PDF Generated" });
    } catch (error) { console.error("PDF Error:", error); toast({ variant: "destructive", title: "PDF Error" }); }
    finally { setIsLoading(false); setLoadingMessage(''); }
  }, [selectedClient, activeTab, dateRange, toast]);

  // --- Memoized Values ---
  const isClientSelected = !!selectedClient;
  const tabs = useMemo(() => [
    { id: 'client', label: '1. Client', disabled: false },
    { id: 'info', label: '2. Info', disabled: !isClientSelected },
    { id: 'reports', label: '3. Reports', disabled: !isClientSelected },
    { id: 'media', label: '4. Media', disabled: !isClientSelected },
    { id: 'viz', label: '5. Visualize', disabled: !isClientSelected },
    { id: 'theme', label: '6. Theme', disabled: !isClientSelected },
    { id: 'delivery', label: '7. Delivery', disabled: !isClientSelected },
    { id: 'preview', label: '8. Preview', disabled: !isClientSelected },
  ], [isClientSelected]);

  // --- Navigation Logic ---
  const currentTabIndex = useMemo(() => tabs.findIndex(tab => tab.id === activeTab), [tabs, activeTab]);
  const handleNext = useCallback(() => { let ni = currentTabIndex + 1; while(ni < tabs.length && tabs[ni].disabled) ni++; if(ni < tabs.length) setActiveTab(tabs[ni].id); }, [currentTabIndex, tabs]);
  const handlePrevious = useCallback(() => { let pi = currentTabIndex - 1; while(pi >= 0 && tabs[pi].disabled) pi--; if(pi >= 0) setActiveTab(tabs[pi].id); }, [currentTabIndex, tabs]);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;
  const canGoNext = !isLastTab && currentTabIndex + 1 < tabs.length && !tabs[currentTabIndex + 1]?.disabled;
  const canGoPrevious = !isFirstTab;

  // --- JSX Return ---
  return (
    <ThemeProvider theme={themeSettings}>
      <GlobalStyle />
      {isLoading && (
        <LoadingOverlay>
          <LoadingSpinner />
          <LoadingMessage>{loadingMessage}</LoadingMessage>
        </LoadingOverlay>
      )}
      {/* Wrap the entire content in the ReportDataProvider */}
      <ReportDataProvider 
        initialClient={selectedClient} 
        initialMetrics={metrics}
        initialDateRange={dateRange}
        initialThemeSettings={themeSettings}
      >
        <Container>
          <Title>{themeSettings.reportTitle || 'Report Builder'}</Title>

          <DateRangeContainer>
            <span>Report for week:</span>
            <DatePicker
              date={currentDate}
              onDateChange={(date) => { if (date) setCurrentDate(date); }}
            >
              <DatePickerButton>
                <CalendarIcon size={16} className="mr-1" />
                {`${format(dateRange.start, 'MMM dd')} - ${format(dateRange.end, 'MMM dd, yyyy')}`}
              </DatePickerButton>
            </DatePicker>
            <Button $variant="secondary" onClick={() => setCurrentDate(subDays(currentDate, 7))} title="Previous Week">
              <ChevronLeft size={16}/> Prev
            </Button>
            <Button $variant="secondary" onClick={() => setCurrentDate(addDays(currentDate, 7))} title="Next Week">
              Next <ChevronRight size={16}/>
            </Button>
          </DateRangeContainer>

          <TabContainer>
            {tabs.map(tab => (
              <Tab key={tab.id} $active={activeTab === tab.id} onClick={() => !tab.disabled && setActiveTab(tab.id)} disabled={tab.disabled}>
                {tab.label}
              </Tab>
            ))}
          </TabContainer>

          <div style={{ marginTop: '1.5rem' }}>
            {/* --- Client Selector --- */}
            {activeTab === 'client' && ( 
              <ClientSelector 
                clients={clients} 
                onSelectClient={handleSelectClient} 
                selectedClient={selectedClient} 
              /> 
            )}

            {/* --- Property Info --- */}
            {activeTab === 'info' && selectedClient && ( 
              <PropertyInfoPanel 
                clientData={selectedClient} 
                metrics={metrics} 
                dateRange={dateRange} 
                onMetricsChange={handleMetricsChange} 
              /> 
            )}

            {/* --- Daily Reports --- */}
            {activeTab === 'reports' && selectedClient && ( 
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
            )}

            {/* --- Media Management --- */}
            {activeTab === 'media' && selectedClient && ( 
              <MediaManagementSystem 
                initialMedia={reportMedia} 
                onMediaSelect={handleMediaSystemSelection} 
              /> 
            )}

            {/* --- Visualization --- */}
            {activeTab === 'viz' && selectedClient && (
              <div ref={chartRef}>
                <DataVisualizationPanel 
                  metrics={metrics} 
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
                >
                  <RefreshCw size={16} className='mr-1' />
                  {isLoading ? 'Generating...' : (isChartGenerationRequested ? 'Queued...' : 'Refresh Chart Image')}
                </Button>
              </div>
            )}

            {/* --- Theme Builder --- */}
            {activeTab === 'theme' && selectedClient && ( 
              <ThemeBuilder 
                settings={themeSettings} 
                onChange={handleThemeChange} 
              /> 
            )}

            {/* --- Delivery Options --- */}
            {activeTab === 'delivery' && selectedClient && ( 
              <DeliveryOptionsPanel 
                options={deliveryOptions} 
                onChange={handleDeliveryOptionsChange} 
                client={selectedClient} 
              /> 
            )}

            {/* --- Preview --- */}
            {activeTab === 'preview' && selectedClient && (
              <div ref={previewPanelRef}>
                {/* Using the EnhancedPreviewPanel component with shared context */}
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
            )}
          </div>

          <NavigationContainer>
            <Button $variant="secondary" onClick={handlePrevious} disabled={!canGoPrevious}> 
              <ChevronLeft size={16} /> Previous 
            </Button>
            {activeTab !== 'preview' ? (
              <Button $variant="primary" onClick={handleNext} disabled={!canGoNext}> 
                Next <ChevronRight size={16} /> 
              </Button>
            ) : (
              <Button $variant="success" onClick={handleDownloadReport} disabled={isLoading || !selectedClient}> 
                <Download size={16} /> Download PDF 
              </Button>
            )}
          </NavigationContainer>
        </Container>
        
        {/* Create Report Context Updater Component */}
        <ReportDataUpdater 
          client={selectedClient}
          metrics={metrics}
          dateRange={dateRange}
          dailyReports={dailyReports}
          summaryNotes={summaryNotes}
          signature={signature}
          chartDataURL={chartDataURL}
          themeSettings={themeSettings}
          contactEmail={contactEmail}
        />
      </ReportDataProvider>
    </ThemeProvider>
  );
};

// This is a helper component that updates the ReportDataContext
// whenever the props change. It doesn't render anything.
interface ReportDataUpdaterProps {
  client: ClientData | null;
  metrics: MetricsData;
  dateRange: DateRange;
  dailyReports: DailyReport[];
  summaryNotes: string;
  signature: string;
  chartDataURL: string;
  themeSettings: ThemeSettings;
  contactEmail: string;
}

const ReportDataUpdater: React.FC<ReportDataUpdaterProps> = ({
  client,
  metrics,
  dateRange,
  dailyReports,
  summaryNotes,
  signature,
  chartDataURL,
  themeSettings,
  contactEmail
}) => {
  const { 
    setClient,
    setMetrics,
    setDateRange,
    setDailyReports,
    setSummaryNotes,
    setSignature,
    setChartDataURL,
    setThemeSettings,
    setContactEmail
  } = useReportData();

  // CONSOLIDATED DATA SYNC - All data updates in a single effect to prevent race conditions
  useEffect(() => {
    console.log('ReportDataUpdater: Syncing ALL data to context:', {
      clientName: client?.name,
      hasMetrics: !!metrics,
      reportCount: dailyReports?.length,
      hasTheme: !!themeSettings,
      hasBackgroundImage: !!themeSettings?.backgroundImage,
      hasHeaderImage: !!themeSettings?.headerImage,
      hasChart: !!chartDataURL,
      summaryLength: summaryNotes?.length,
      signature: signature,
      contactEmail: contactEmail
    });

    // Update all context values in batch
    if (client) setClient(client);
    setMetrics(metrics);
    setDateRange(dateRange);
    setDailyReports(dailyReports);
    setSummaryNotes(summaryNotes);
    setSignature(signature);
    setChartDataURL(chartDataURL);
    setThemeSettings(themeSettings);
    setContactEmail(contactEmail);

  }, [
    client, metrics, dateRange, dailyReports, summaryNotes, 
    signature, chartDataURL, themeSettings, contactEmail,
    setClient, setMetrics, setDateRange, setDailyReports,
    setSummaryNotes, setSignature, setChartDataURL, setThemeSettings, setContactEmail
  ]);

  return null; // This component doesn't render anything
};

export default ReportBuilder;