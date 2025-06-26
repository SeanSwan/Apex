// EnhancedReportBuilder.tsx - REFACTORED MAIN COMPONENT
// Reduced from 2,100+ lines to ~400 lines through modularization
// Now focuses on orchestration rather than implementation details

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ThemeProvider } from 'styled-components';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { RefreshCw } from 'lucide-react';

// Hook Imports
import { 
  usePerformanceOptimizedState, 
  useReportNavigation, 
  useChartGeneration, 
  useToast 
} from '../../hooks';

// Component Imports
import ReportBuilderErrorBoundary from './ReportBuilderErrorBoundary';
import LoadingOverlay from './LoadingOverlay';
import DateRangeSelector from './DateRangeSelector';
import ReportNavigation from './ReportNavigation';

// Styled Components
import {
  GlobalStyle,
  Container,
  Title,
  TabContainer,
  Tab,
  TabContent,
  Button
} from './ReportBuilder.styles';

// Panel Components
import ClientSelector from './ClientSelector';
import PropertyInfoPanel from './PropertyInfoPanel';
import EnhancedDailyReportsPanel from './DailyReportsPanel';
import MediaManagementSystem from './MediaManagementSystem';
import DataVisualizationPanel from './DataVisualizationPanel';
import ThemeBuilder from './ThemeBuilder';
import EnhancedPreviewPanel from './EnhancedPreviewPanel';
import DeliveryOptionsPanel from './DeliveryOptionsPanel';

// Context and Data
import { ReportDataProvider, useReportData } from '../../context/ReportDataContext';
import { mockClients, mockMetricsData, mockDailyReports, generateMetricsForClient } from '../../data/mockData';

// Constants and Types
import {
  DEFAULT_AI_OPTIONS,
  DEFAULT_DELIVERY_OPTIONS,
  DEFAULT_THEME_SETTINGS,
  SECURITY_COMPANY_CONTACT,
  STORAGE_KEYS
} from './reportBuilder.constants';

import {
  ClientData,
  AIOptions,
  DeliveryOptions,
  MediaFile,
  DateRange
} from '../../types/reports';

// Enhanced PDF Generator
import { EnhancedPDFGenerator } from './EnhancedPDFGenerator';

/**
 * Main Report Builder Component - Refactored for Maintainability
 * 
 * This component has been modularized from 2,100+ lines to ~400 lines by:
 * - Extracting styled components to separate file
 * - Creating custom hooks for complex logic
 * - Breaking down into smaller, focused components
 * - Centralizing constants and configurations
 * - Implementing proper error boundaries
 */
const EnhancedReportBuilder: React.FC = () => {
  const { toast } = useToast();
  
  // Refs for DOM manipulation
  const chartRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);

  // Core state management with persistence
  const [clients] = useState<ClientData[]>(() => mockClients);
  const [selectedClient, setSelectedClient] = usePerformanceOptimizedState<ClientData | null>(
    null, 
    STORAGE_KEYS.SELECTED_CLIENT
  );
  const [themeSettings, setThemeSettings] = usePerformanceOptimizedState(
    DEFAULT_THEME_SETTINGS, 
    STORAGE_KEYS.THEME_SETTINGS
  );
  const [aiOptions, setAIOptions] = usePerformanceOptimizedState<AIOptions>(
    DEFAULT_AI_OPTIONS, 
    STORAGE_KEYS.AI_OPTIONS
  );
  const [deliveryOptions, setDeliveryOptions] = usePerformanceOptimizedState(
    DEFAULT_DELIVERY_OPTIONS, 
    STORAGE_KEYS.DELIVERY_OPTIONS
  );
  const [reportMedia, setReportMedia] = usePerformanceOptimizedState<MediaFile[]>(
    [], 
    STORAGE_KEYS.REPORT_MEDIA
  );
  const [currentDate, setCurrentDate] = usePerformanceOptimizedState<Date>(
    new Date(), 
    STORAGE_KEYS.CURRENT_DATE
  );

  // Computed values
  const isClientSelected = !!selectedClient;
  const dateRange = useMemo(() => ({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 })
  }), [currentDate]);

  // Custom hooks for complex logic
  const navigation = useReportNavigation({ isClientSelected });
  
  const chart = useChartGeneration({
    activeTab: navigation.activeTab,
    contextMetrics: null, // Will be populated from context
    toast
  });

  // Context data access
  const contextData = useReportData();
  const { 
    dailyReports, 
    summaryNotes, 
    signature, 
    contactEmail,
    metrics: contextMetrics 
  } = contextData;

  // Enhanced client selection handler
  const handleSelectClient = useCallback((client: ClientData) => {
    try {
      setSelectedClient(client);
      
      // Always enforce security company contact information
      const { email: securityEmail, signature: securitySignature } = SECURITY_COMPANY_CONTACT;
      
      // Update context with security contact info
      contextData.setContactEmail?.(securityEmail);
      contextData.setSignature?.(securitySignature);
      
      console.log('🔒 SECURITY CONTACT ENFORCED:', {
        clientName: client.name,
        securityEmail,
        securitySignature
      });
      
      // Update delivery options for client
      setDeliveryOptions(prev => ({ 
        ...prev, 
        emailRecipients: client.contactEmail ? [client.contactEmail] : [],
        ccEmails: [securityEmail]
      }));
      
      // Generate client-specific metrics
      const clientSpecificMetrics = generateMetricsForClient(client);
      contextData.setMetrics?.(clientSpecificMetrics);
      
      // Reset data for new client
      contextData.setDailyReports?.(mockDailyReports || []);
      contextData.setSummaryNotes?.('');
      
      // Reset local states
      setReportMedia([]);
      chart.setChartDataURL('');
      navigation.setActiveTab('info');
      
      toast({ 
        title: "Client Selected", 
        description: `Selected ${client.name} with ${client.cameras || 0} cameras.`,
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
  }, [setSelectedClient, contextData, setDeliveryOptions, setReportMedia, chart, navigation, toast]);

  // Event handlers for data updates
  const handleReportChange = useCallback((day: string, content: string, status?: string, securityCode?: string) => {
    contextData.setDailyReports?.(prev => 
      prev.map(report => 
        report.day === day 
          ? { 
              ...report, 
              content,
              status: status as any || report.status,
              securityCode: securityCode as any || report.securityCode,
              timestamp: new Date().toISOString()
            } 
          : report
      )
    );
  }, [contextData.setDailyReports]);

  const handleAIOptionChange = useCallback((options: Partial<AIOptions>) => { 
    setAIOptions(prev => ({ ...prev, ...options })); 
  }, [setAIOptions]);

  const handleSummaryChange = useCallback((text: string) => { 
    contextData.setSummaryNotes?.(text);
  }, [contextData.setSummaryNotes]);

  const handleSignatureChange = useCallback((text: string) => { 
    contextData.setSignature?.(text);
  }, [contextData.setSignature]);

  const handleContactEmailChange = useCallback((email: string) => { 
    contextData.setContactEmail?.(email);
  }, [contextData.setContactEmail]);

  const handleThemeChange = useCallback((settings: Partial<typeof DEFAULT_THEME_SETTINGS>) => { 
    contextData.setThemeSettings?.(prev => ({ ...prev, ...settings }));
    setThemeSettings(prev => ({ ...prev, ...settings }));
  }, [contextData.setThemeSettings, setThemeSettings]);

  const handleDeliveryOptionsChange = useCallback((options: Partial<DeliveryOptions>) => { 
    setDeliveryOptions(prev => ({ ...prev, ...options })); 
  }, [setDeliveryOptions]);

  const handleMediaSystemSelection = useCallback((selectedMediaFromSystem: MediaFile[]) => { 
    setReportMedia(selectedMediaFromSystem); 
  }, [setReportMedia]);

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

    if (navigation.activeTab !== 'preview') {
      navigation.handleTabChange('preview'); 
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
    }
  }, [selectedClient, navigation.activeTab, navigation.handleTabChange, dateRange, toast]);

  // Chart generation effects
  useEffect(() => {
    const needsChart = (navigation.activeTab === 'viz' || navigation.activeTab === 'preview');
    const shouldGenerate = needsChart && (chart.isChartGenerationRequested || (navigation.activeTab === 'preview' && !chart.chartDataURL));
    
    if (shouldGenerate && chartRef.current) {
      chart.generateChartWithErrorHandling(chartRef);
    }
  }, [navigation.activeTab, chart.isChartGenerationRequested, chart.generateChartWithErrorHandling, chart.chartDataURL]);

  // Event listeners for component synchronization
  useEffect(() => {
    const handleMetricsUpdated = (event: CustomEvent) => {
      if ((navigation.activeTab === 'viz' || navigation.activeTab === 'preview') && !chart.isLoading) {
        chart.setIsChartGenerationRequested(true);
      }
    };
    
    const handleDailyReportsUpdated = (event: CustomEvent) => {
      if ((navigation.activeTab === 'viz' || navigation.activeTab === 'preview') && !chart.isLoading) {
        chart.setIsChartGenerationRequested(true);
      }
    };
    
    window.addEventListener('metricsUpdated', handleMetricsUpdated as EventListener);
    window.addEventListener('dailyReportsUpdated', handleDailyReportsUpdated as EventListener);
    
    return () => {
      window.removeEventListener('metricsUpdated', handleMetricsUpdated as EventListener);
      window.removeEventListener('dailyReportsUpdated', handleDailyReportsUpdated as EventListener);
    };
  }, [navigation.activeTab, chart.isLoading, chart.setIsChartGenerationRequested]);

  // Render tab content based on active tab
  const renderTabContent = () => {
    const { activeTab } = navigation;

    switch (activeTab) {
      case 'client':
        return (
          <ClientSelector 
            clients={clients} 
            onSelectClient={handleSelectClient} 
            selectedClient={selectedClient} 
          />
        );

      case 'info':
        return selectedClient ? (
          <PropertyInfoPanel 
            clientData={selectedClient} 
            dateRange={dateRange} 
          />
        ) : null;

      case 'reports':
        return selectedClient ? (
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
        ) : null;

      case 'media':
        return selectedClient ? (
          <MediaManagementSystem 
            initialMedia={reportMedia} 
            onMediaSelect={handleMediaSystemSelection} 
          />
        ) : null;

      case 'viz':
        return selectedClient ? (
          <div ref={chartRef}>
            <DataVisualizationPanel 
              themeSettings={themeSettings} 
              setChartDataURL={chart.setChartDataURL} 
              dateRange={dateRange} 
              chartRef={chartRef} 
            />
            <Button 
              $variant="primary" 
              onClick={chart.handleRefreshChart} 
              style={{ marginTop: '15px' }} 
              disabled={chart.isLoading || chart.isChartGenerationRequested}
              theme={themeSettings}
              title="Generate chart with enhanced loading detection"
            >
              <RefreshCw size={16} />
              {chart.isLoading ? 'Generating...' : 
               chart.isChartGenerationRequested ? 'Queued...' : 
               'Enhanced Chart Capture'}
            </Button>
          </div>
        ) : null;

      case 'theme':
        return selectedClient ? (
          <ThemeBuilder 
            settings={themeSettings} 
            onChange={handleThemeChange} 
          />
        ) : null;

      case 'delivery':
        return selectedClient ? (
          <DeliveryOptionsPanel 
            options={deliveryOptions} 
            onChange={handleDeliveryOptionsChange} 
            client={selectedClient} 
          />
        ) : null;

      case 'preview':
        return selectedClient ? (
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
        ) : null;

      default:
        return <div>Unknown tab: {activeTab}</div>;
    }
  };

  return (
    <ReportBuilderErrorBoundary>
      <ThemeProvider theme={themeSettings}>
        <GlobalStyle />
        
        <LoadingOverlay isLoading={chart.isLoading} message={chart.loadingMessage}>
          <ReportDataProvider 
            initialClient={selectedClient} 
            initialMetrics={mockMetricsData}
            initialDateRange={dateRange}
            initialThemeSettings={themeSettings}
            key={`provider-${selectedClient?.id || 'no-client'}`}
          >
            <Container>
              <Title>{themeSettings.reportTitle || 'Enhanced Report Builder'}</Title>

              <DateRangeSelector
                currentDate={currentDate}
                dateRange={dateRange}
                onDateChange={setCurrentDate}
                themeSettings={themeSettings}
              />

              <TabContainer>
                {navigation.tabs.map(tab => (
                  <Tab 
                    key={tab.id} 
                    $active={navigation.activeTab === tab.id} 
                    $isNew={tab.isNew}
                    onClick={() => !tab.disabled && navigation.handleTabChange(tab.id)} 
                    disabled={tab.disabled}
                    theme={themeSettings}
                  >
                    {tab.label}
                  </Tab>
                ))}
              </TabContainer>

              <TabContent>
                <ReportBuilderErrorBoundary fallback={<div>Error loading tab content</div>}>
                  {renderTabContent()}
                </ReportBuilderErrorBoundary>
              </TabContent>

              <ReportNavigation
                activeTab={navigation.activeTab}
                canGoPrevious={navigation.canGoPrevious}
                canGoNext={navigation.canGoNext}
                isLoading={chart.isLoading}
                selectedClient={selectedClient}
                themeSettings={themeSettings}
                onPrevious={navigation.handlePrevious}
                onNext={navigation.handleNext}
                onDownloadReport={handleDownloadReport}
              />
            </Container>
          </ReportDataProvider>
        </LoadingOverlay>
      </ThemeProvider>
    </ReportBuilderErrorBoundary>
  );
};

export default EnhancedReportBuilder;
