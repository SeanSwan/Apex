// File: frontend/src/pages/DetailedReportPage.tsx

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Modern UI components
import { useToast } from '../hooks/use-toast';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { CalendarIcon } from 'lucide-react';

// Custom report components
import ClientInformationPanel from '../components/Reports/ClientInformationPanel';
import MetricsVisualizationPanel from '../components/Reports/MetricsVisualizationPanel';
import DailyReportsPanel from '../components/Reports/DailyReportsPanel';

// Types
import { 
  ClientData, 
  MetricsData, 
  DailyReport,
  ReportData,
  PropertyDataItem,
  PDFOptions,
  DailyReportStatus,
  SecurityCode,
  AIOptions
} from '../types/reports';

// Import services
import * as reportService from '../services/reportService';

// Import mock data for fallback and development
import { mockClients, mockMetricsData, mockDailyReports } from '../data/mockData';

// Styled components
const PageWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f8f9fa;
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 28px;
  margin-bottom: 8px;
  color: #333;
`;

const Subtitle = styled.h2`
  font-size: 18px;
  color: #666;
  font-weight: 400;
  margin-bottom: 20px;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: flex-end;
`;

const DateRangeContainer = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  flex-direction: column;
  
  &::after {
    content: '';
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #0070f3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-top: 16px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingMessage = styled.div`
  font-size: 16px;
  color: #333;
  margin-bottom: 16px;
`;

/**
 * Define the AIOptions interface expected by the DailyReportsPanel component
 * This ensures compatibility with the component props
 */
interface DailyReportsPanelAIOptions {
  enabled: boolean;
  suggestImprovements: boolean;
  analyzeThreats: boolean;
  highlightPatterns: boolean;
  autoCorrect: boolean;
  enhanceWriting: boolean;
  suggestContent: boolean;
  generateSummary: boolean;
}

/**
 * PDF export utility function
 * Generates a PDF report based on the client data, metrics, and user input
 */
const exportToPDF = async (
  headerImage: string,
  propertyData: PropertyDataItem[],
  chartImageURL: string,
  summaryNotes: string,
  signature: string,
  options?: PDFOptions
): Promise<Blob | null> => {
  try {
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Add company branding and header image
    try {
      if (headerImage) {
        // Add header image
        doc.addImage(headerImage, 'JPEG', 10, 10, 190, 30);
      }
    } catch (error) {
      console.error('Error adding header image:', error);
    }

    // Add title
    doc.setFontSize(18);
    doc.text('Security Monitoring Report', 105, 50, { align: 'center' });
    
    // Add report period
    doc.setFontSize(11);
    doc.text(`Report Period: ${new Date().toLocaleDateString()}`, 105, 58, { align: 'center' });

    // Add property data section
    doc.setFontSize(14);
    doc.text('Security Metrics Summary', 14, 70);
    
    // Add metrics table with proper type
    const autoTableDoc = doc as unknown as { 
      autoTable: (options: any) => void 
    };
    
    autoTableDoc.autoTable({
      startY: 75,
      head: [['Metric', 'Value']],
      body: propertyData.map(item => [item.type, item.count]),
      theme: 'striped',
      headStyles: { 
        fillColor: typeof options?.backgroundTheme === 'string' 
          ? options.backgroundTheme 
          : [0, 112, 243] 
      },
      margin: { top: 75 },
    });

    // Add chart if available
    if (chartImageURL) {
      try {
        const tableHeight = (propertyData.length * 10) + 5; // Estimate table height
        doc.addImage(chartImageURL, 'PNG', 14, 90 + tableHeight, 180, 80);
        doc.setFontSize(12);
        doc.text('Security Activity Visualization', 105, 85 + tableHeight, { align: 'center' });
      } catch (error) {
        console.error('Error adding chart image:', error);
      }
    }

    // Add daily reports
    doc.setFontSize(14);
    doc.text('Daily Security Reports', 14, 195);
    doc.setFontSize(10);
    
    // Split the report text into lines that fit within the page width
    const textLines = doc.splitTextToSize(summaryNotes, 180);
    doc.text(textLines, 14, 203);

    // Add signature if provided
    if (signature) {
      const pageCount = doc.getNumberOfPages();
      doc.setPage(pageCount);
      doc.setFontSize(10);
      doc.text('Security Operations Manager:', 14, 280);
      doc.text(signature, 70, 280);
    }

    // Add pagination
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    }

    // Either return the blob or save the PDF
    if (options?.returnBlob) {
      return doc.output('blob');
    } else {
      doc.save('security-report.pdf');
      return null;
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * DetailedReportPage Component
 * This component displays a detailed view of a security report and allows editing.
 * It supports loading existing reports and creating new ones.
 */
const DetailedReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [reportStatus, setReportStatus] = useState<'draft' | 'sent' | 'archived'>('draft');
  const [reportTitle, setReportTitle] = useState<string>('Security Monitoring Report');
  const [summaryNotes, setSummaryNotes] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [clients, setClients] = useState<ClientData[]>(mockClients);
  const [metrics, setMetrics] = useState<MetricsData>(mockMetricsData);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(mockDailyReports);
  const [chartDataURL, setChartDataURL] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date()),
  });
  
  // AI Options - Only include properties defined in your AIOptions interface
  const [aiOptions, setAIOptions] = useState<AIOptions>({
    enabled: true,
    suggestImprovements: true,
    analyzeThreats: true,
    highlightPatterns: true
  });
  
  // Handle chart rendering and capture
  const handleChartRendered = useCallback(async (chartElement: HTMLDivElement) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Capturing chart data...');
      
      // Delay slightly to ensure chart has fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(chartElement, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      setChartDataURL(dataUrl);
    } catch (error) {
      console.error('Failed to capture chart:', error);
      toast({
        title: 'Error',
        description: 'Failed to capture chart data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Load client metrics
  const loadClientMetrics = useCallback(async (clientId: string) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Loading metrics data...');
      
      const metricsData = await reportService.getClientMetrics(
        clientId,
        dateRange.start,
        dateRange.end
      );
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load metrics data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.start, dateRange.end, toast]);
  
  // Load report data if ID is provided
  useEffect(() => {
    const loadReportData = async () => {
      if (id) {
        try {
          setIsLoading(true);
          setLoadingMessage('Loading report data...');
          
          // Load report draft
          const reportData = await reportService.loadReportDraft(id);
          
          // Set report data
          setReportTitle(reportData.title || 'Security Monitoring Report');
          setSummaryNotes(reportData.summary || '');
          setReportStatus(reportData.status || 'draft');
          
          // Set client if available
          if (reportData.clientId) {
            const client = clients.find(c => c.id === reportData.clientId);
            if (client) {
              setSelectedClient(client);
              await loadClientMetrics(client.id);
            }
          }
        } catch (error) {
          console.error('Failed to load report data:', error);
          toast({
            title: 'Error',
            description: 'Failed to load report data',
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadReportData();
  }, [id, clients, loadClientMetrics, toast]);
  
  // Handle date range change
  const handleDateRangeChange = (type: 'start' | 'end', date: Date) => {
    setDateRange(prev => ({
      ...prev,
      [type]: date
    }));
  };
  
  // Prepare property data for PDF
  const preparePropertyData = (): PropertyDataItem[] => {
    if (!metrics || !selectedClient) return [];
    
    return [
      { type: 'Property', count: selectedClient.name },
      { type: 'Location', count: selectedClient.location },
      { type: 'Total Cameras', count: metrics.totalCameras },
      { type: 'Cameras Online', count: metrics.camerasOnline },
      { type: 'AI Accuracy', count: `${metrics.aiAccuracy}%` },
      { type: 'Operational Uptime', count: `${metrics.operationalUptime}%` },
      { type: 'Response Time', count: `${metrics.responseTime}s` },
      { type: 'Human Intrusions', count: Object.values(metrics.humanIntrusions).reduce((sum, val) => sum + val, 0) },
      { type: 'Vehicle Detections', count: Object.values(metrics.vehicleIntrusions).reduce((sum, val) => sum + val, 0) }
    ];
  };
  
  // Generate and download PDF report
  const handleDownloadReport = async () => {
    if (!selectedClient) {
      toast({
        title: 'Warning',
        description: 'Please select a client first',
        variant: 'default'
      });
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Generating PDF report...');
    
    try {
      await exportToPDF(
        'https://via.placeholder.com/1200x200/0056b3/ffffff?text=Security+Report+Header',
        preparePropertyData(),
        chartDataURL,
        summaryNotes,
        signature
      );
      
      toast({
        title: 'Success',
        description: 'PDF generated successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send report via email
  const handleSendReport = async () => {
    if (!selectedClient) {
      toast({
        title: 'Warning',
        description: 'Please select a client first',
        variant: 'default'
      });
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Preparing to send report...');
    
    try {
      // Generate PDF as blob
      const pdfBlob = await exportToPDF(
        'https://via.placeholder.com/1200x200/0056b3/ffffff?text=Security+Report+Header',
        preparePropertyData(),
        chartDataURL,
        summaryNotes,
        signature,
        { returnBlob: true }
      );
      
      if (!pdfBlob) {
        throw new Error('Failed to generate PDF');
      }
      
      // Upload to CDN
      setLoadingMessage('Uploading report...');
      const reportUrl = await reportService.uploadReportToCDN(pdfBlob);
      
      // Send report
      setLoadingMessage('Sending report...');
      await reportService.sendReport({
        clientId: selectedClient.id,
        reportUrl,
        subject: reportTitle,
        message: `Security report for ${selectedClient.name} covering the period from ${format(dateRange.start, 'MMM d')} to ${format(dateRange.end, 'MMM d, yyyy')} is now available.`,
        deliveryOptions: {
          email: true,
          sms: false,
          emailRecipients: [],
          smsRecipients: [],
          scheduleDelivery: false,
          deliveryDate: new Date(),
          includeFullData: true,
          includeCharts: true
        }
      });
      
      // Update status
      setReportStatus('sent');
      
      // Save the updated report
      await reportService.saveReportDraft({
        id: id || `new-report-${Date.now()}`,
        clientId: selectedClient.id,
        title: reportTitle,
        summary: summaryNotes,
        recipients: [],
        status: 'sent',
        reportUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      toast({
        title: 'Success',
        description: 'Report sent successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Failed to send report:', error);
      toast({
        title: 'Error',
        description: 'Failed to send report',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save report draft
  const handleSaveDraft = async () => {
    if (!selectedClient) {
      toast({
        title: 'Warning',
        description: 'Please select a client first',
        variant: 'default'
      });
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Saving report draft...');
    
    try {
      const reportData: ReportData = {
        id: id || `draft-${Date.now()}`,
        clientId: selectedClient.id,
        title: reportTitle,
        summary: summaryNotes,
        recipients: [],
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const savedReport = await reportService.saveReportDraft(reportData);
      
      // Navigate to the saved report if it's a new report
      if (!id) {
        navigate(`/reports/${savedReport.id}`);
      }
      
      toast({
        title: 'Success',
        description: 'Report draft saved successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Failed to save report draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to save report draft',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectClient = (client: ClientData) => {
    setSelectedClient(client);
    loadClientMetrics(client.id);
  };
  
  // Handle report change
  const handleReportChange = (day: string, content: string, status?: string, securityCode?: string) => {
    setDailyReports(prevReports => 
      prevReports.map(report => 
        report.day === day 
          ? { 
              ...report, 
              content, 
              ...(status && { status: status as DailyReportStatus }), 
              ...(securityCode && { securityCode: securityCode as SecurityCode }) 
            }
          : report
      )
    );
  };
  
  // Handle AI option change - only update fields that exist in your AIOptions interface
  const handleAIOptionChange = (options: Partial<any>) => {
    const validOptions: Partial<AIOptions> = {};
    
    if ('enabled' in options) validOptions.enabled = options.enabled;
    if ('suggestImprovements' in options) validOptions.suggestImprovements = options.suggestImprovements;
    if ('analyzeThreats' in options) validOptions.analyzeThreats = options.analyzeThreats;
    if ('highlightPatterns' in options) validOptions.highlightPatterns = options.highlightPatterns;
    
    setAIOptions(prev => ({ ...prev, ...validOptions }));
  };
  
  // Create a compatible aiOptions object for the DailyReportsPanel
  const compatibleAIOptions: DailyReportsPanelAIOptions = {
    ...aiOptions,
    autoCorrect: true,
    enhanceWriting: true,
    suggestContent: true,
    generateSummary: true
  };
  
  return (
    <PageWrapper>
      {isLoading && (
        <LoadingOverlay>
          <LoadingMessage>{loadingMessage}</LoadingMessage>
        </LoadingOverlay>
      )}
      
      <Header>
        <Title>
          {id ? reportTitle : 'New Security Report'}
        </Title>
        <Subtitle>
          {selectedClient 
            ? `${selectedClient.name} - ${format(dateRange.start, 'MMM d')} to ${format(dateRange.end, 'MMM d, yyyy')}` 
            : 'Select a client to begin'}
        </Subtitle>
      </Header>
      
      <ActionButtonsContainer>
        <Button onClick={handleSaveDraft} disabled={!selectedClient}>
          Save Draft
        </Button>
        <Button onClick={handleDownloadReport} disabled={!selectedClient} variant="outline">
          Download PDF
        </Button>
        <Button onClick={handleSendReport} disabled={!selectedClient}>
          Send Report
        </Button>
      </ActionButtonsContainer>

      <DateRangeContainer>
        <h3 className="text-lg font-medium mb-4">Report Period</h3>
        <div className="flex items-center space-x-4">
          <div className="grid gap-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[200px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.start, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.start}
                  onSelect={(date) => date && handleDateRangeChange('start', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[200px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.end, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRange.end}
                  onSelect={(date) => date && handleDateRangeChange('end', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button 
            onClick={() => selectedClient && loadClientMetrics(selectedClient.id)}
            className="mt-auto"
            disabled={!selectedClient}
          >
            Update Data
          </Button>
        </div>
      </DateRangeContainer>
      
      {/* Client Selection */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-medium mb-4">Select Client</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div 
              key={client.id}
              className={`border rounded-md p-4 cursor-pointer transition-colors ${
                selectedClient?.id === client.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:border-gray-400'
              }`}
              onClick={() => handleSelectClient(client)}
            >
              <div className="font-medium">{client.name}</div>
              <div className="text-sm text-gray-500">{client.location}</div>
              <div className="flex gap-2 mt-2">
                {client.isActive && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                    Active
                  </span>
                )}
                {client.isVIP && (
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded">
                    VIP
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Client Information Panel */}
      {selectedClient && <ClientInformationPanel client={selectedClient} />}
      
      {/* Metrics Visualization Panel */}
      {selectedClient && (
        <MetricsVisualizationPanel 
          metrics={metrics} 
          onChartRendered={handleChartRendered} 
        />
      )}
      
      {/* Daily Reports Panel - Using compatible AI options */}
      <DailyReportsPanel
        dailyReports={dailyReports}
        onReportChange={handleReportChange}
        dateRange={dateRange}
        summaryNotes={summaryNotes}
        onSummaryChange={setSummaryNotes}
        signature={signature}
        onSignatureChange={setSignature}
        aiOptions={compatibleAIOptions}
        onAIOptionChange={handleAIOptionChange}
      />
      
      {/* Report Settings */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-medium mb-4">Report Settings</h3>
        
        <div className="mb-4">
          <Label htmlFor="report-title">Report Title</Label>
          <Input
            id="report-title"
            value={reportTitle}
            onChange={e => setReportTitle(e.target.value)}
            placeholder="Enter report title"
            className="mt-1"
          />
        </div>
      </Card>
      
      <ButtonContainer>
        <Button onClick={handleSaveDraft} disabled={!selectedClient}>
          Save Draft
        </Button>
        <Button onClick={handleSendReport} disabled={!selectedClient}>
          Send Report
        </Button>
      </ButtonContainer>
    </PageWrapper>
  );
};

export default DetailedReportPage;