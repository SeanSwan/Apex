// File: frontend/src/pages/EnhancedReportsPage.component.tsx
/**
 * EnhancedReportsPage.component.tsx
 *
 * An improved version of the reports system with:
 *   - Client-specific theming and branding
 *   - Multiple data visualization options (charts, heatmaps, metrics)
 *   - AI-assisted report writing and error correction
 *   - Email/SMS delivery integration (SendGrid/Twilio)
 *   - Daily report updates with aggregation for weekly exports
 *   - PDF generation with professional formatting
 *   - Auto-calculated metrics that don't require manual data entry
 */

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Define ExportOptions interface locally
interface ExportOptions {
  backgroundImage?: string;
  backgroundTheme?: string;
  returnBlob?: boolean;
}

// Subcomponents
import HeaderCustomization from '../components/Reports/HeaderCustomization';
import PropertyInfoPanel from '../components/Reports/PropertyInfoPanel';
import DataVisualizationPanel from '../components/Reports/DataVisualizationPanel';
import DailyReportsPanel from '../components/Reports/DailyReportsPanel';
import DeliveryOptionsPanel from '../components/Reports/DeliveryOptionsPanel';
import PreviewPanel from '../components/Reports/PreviewPanel';
import ClientSelector from '../components/Reports/ClientSelector';
import ThemeBuilder from '../components/Reports/ThemeBuilder';
import AIAssistant from '../components/Reports/AIAssistant';
import { useToast } from '../context/ToastContext';

// Types
import type { 
  ClientData, 
  ThemeSettings, 
  ReportData,
  DailyReport, 
  MetricsData,
  DeliveryOptions,
  AIOptions
} from '../types/reports';

// API services
// Note: Make sure the file name case matches exactly with your filesystem
import { 
  saveReportDraft, 
  loadReportDraft, 
  sendReport,
  getClientsForUser,
  getClientMetrics,
  uploadReportToCDN
} from '../services/reportservice';

// Styled components
const PageWrapper = styled.div`
  position: relative;
  min-height: 100vh;
  padding: 2rem;
  overflow-y: auto;
  background-color: #f9f9f9;
  font-family: 'Inter', sans-serif;
`;

interface BackgroundOverlayProps {
  $backgroundImage?: string;
  $backgroundOpacity: number;
  $backgroundFilter?: string;
}

const BackgroundOverlay = styled.div<BackgroundOverlayProps>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${(props) =>
    props.$backgroundImage ? `url(${props.$backgroundImage})` : 'none'};
  background-size: cover;
  background-position: center;
  opacity: ${(props) => props.$backgroundOpacity};
  filter: ${(props) => props.$backgroundFilter || 'none'};
  z-index: -1;
`;

const ContentContainer = styled.div`
  position: relative;
  z-index: 1;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const TabNav = styled.div`
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
  flex-wrap: wrap;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 0.5rem;
`;

interface TabButtonProps {
  $active: boolean;
}

const TabButton = styled.button<TabButtonProps>`
  padding: 0.75rem 1.25rem;
  border: none;
  background: ${(props) => (props.$active ? '#f0f7ff' : 'transparent')};
  color: ${(props) => (props.$active ? '#0056b3' : '#333')};
  border-radius: 8px 8px 0 0;
  font-size: 1rem;
  font-weight: ${(props) => (props.$active ? '600' : '400')};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    background: #f0f7ff;
    color: #0056b3;
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1.5rem 0;
  flex-wrap: wrap;
  gap: 1rem;
`;

interface ActionButtonProps {
  $variant?: 'primary' | 'secondary' | 'success' | 'danger';
}

const ActionButton = styled.button<ActionButtonProps>`
  padding: 0.75rem 1.5rem;
  background-color: ${(props) => {
    switch (props.$variant) {
      case 'primary': return '#0070f3';
      case 'secondary': return '#f5f5f5';
      case 'success': return '#28a745';
      case 'danger': return '#dc3545';
      default: return '#0070f3';
    }
  }};
  color: ${(props) => props.$variant === 'secondary' ? '#333' : '#fff'};
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease-in-out;
  box-shadow: ${(props) => props.$variant === 'secondary' ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.15)'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${(props) => props.$variant === 'secondary' ? 'none' : '0 6px 20px rgba(0, 0, 0, 0.15)'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

interface StatusIndicatorProps {
  $status: 'draft' | 'review' | 'ready' | 'sent';
}

const StatusIndicator = styled.div<StatusIndicatorProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${(props) => {
    switch (props.$status) {
      case 'draft': return '#6c757d';
      case 'review': return '#fd7e14';
      case 'ready': return '#28a745';
      case 'sent': return '#0070f3';
      default: return '#6c757d';
    }
  }};
  
  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${(props) => {
      switch (props.$status) {
        case 'draft': return '#6c757d';
        case 'review': return '#fd7e14';
        case 'ready': return '#28a745';
        case 'sent': return '#0070f3';
        default: return '#6c757d';
      }
    }};
  }
`;

// Mock default data (replace with API calls in production)
const defaultDailyReports: DailyReport[] = [
  { day: 'Monday', content: '', status: 'To update', securityCode: 'Code 4' },
  { day: 'Tuesday', content: '', status: 'To update', securityCode: 'Code 4' },
  { day: 'Wednesday', content: '', status: 'To update', securityCode: 'Code 4' },
  { day: 'Thursday', content: '', status: 'To update', securityCode: 'Code 4' },
  { day: 'Friday', content: '', status: 'To update', securityCode: 'Code 4' },
  { day: 'Saturday', content: '', status: 'To update', securityCode: 'Code 4' },
  { day: 'Sunday', content: '', status: 'To update', securityCode: 'Code 4' },
];

const defaultMetrics: MetricsData = {
  humanIntrusions: {
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
    Sunday: 0,
  },
  vehicleIntrusions: {
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
    Sunday: 0,
  },
  aiAccuracy: 98.7,
  responseTime: 0.8,
  proactiveAlerts: 0,
  potentialThreats: 0,
  operationalUptime: 100,
  totalMonitoringHours: 168,
  totalCameras: 0,
  camerasOnline: 0,
};

// Define the exportToPDF function
export const exportToPDF = async (
  headerImage: string,
  propertyData: any[],
  chartImageURL: string,
  reportText: string,
  signature: string,
  options?: {
    backgroundImage?: string;
    backgroundTheme?: string;
    returnBlob?: boolean;
  }
): Promise<any> => {
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
  
  // Add metrics table
  (doc as any).autoTable({
    startY: 75,
    head: [['Metric', 'Value']],
    body: propertyData.map(item => [item.type, item.count]),
    theme: 'striped',
    headStyles: { fillColor: options?.backgroundTheme || [0, 112, 243] },
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
  const textLines = doc.splitTextToSize(reportText, 180);
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
};

const EnhancedReportsPage: React.FC = () => {
  // Access the toast context
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [reportStatus, setReportStatus] = useState<'draft' | 'review' | 'ready' | 'sent'>('draft');
  
  // Date selection state
  const [reportDate, setReportDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });
  
  // Client & branding state
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    headerImage: '/images/header1.jpg',
    clientLogo: '',
    companyLogo: '/images/logo.png',
    backgroundImage: '',
    backgroundOpacity: 0.3,
    primaryColor: '#0070f3',
    secondaryColor: '#1a1a1a',
    accentColor: '#f5a623',
    fontFamily: 'Inter, sans-serif',
  });
  
  // Report data state
  const [metrics, setMetrics] = useState<MetricsData>(defaultMetrics);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(defaultDailyReports);
  const [summaryNotes, setSummaryNotes] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  
  // Delivery options state
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptions>({
    email: true,
    sms: false,
    emailRecipients: [],
    smsRecipients: [],
    scheduleDelivery: false,
    deliveryDate: new Date(),
    includeFullData: true,
    includeCharts: true,
  });
  
  // AI options state
  const [aiOptions, setAIOptions] = useState<AIOptions>({
    autoCorrect: true,
    enhanceWriting: true,
    suggestContent: true,
    generateSummary: true,
  });
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<number>(0);
  
  // Chart ref for capturing as image
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartDataURL, setChartDataURL] = useState<string>('');
  
  // Handle client selection
  const handleClientSelect = async (client: ClientData) => {
    setSelectedClient(client);
    
    // Load client's theme settings if available
    if (client.themeSettings) {
      setThemeSettings(client.themeSettings);
    }
    
    // Load client metrics
    try {
      setLoading(true);
      const clientMetrics = await getClientMetrics(client.id, dateRange.start, dateRange.end);
      setMetrics(clientMetrics);
    } catch (error) {
      console.error('Failed to load client metrics:', error);
      showToast('Failed to load client data', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle theme settings changes
  const handleThemeChange = (newSettings: Partial<ThemeSettings>) => {
    setThemeSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  // Handle metrics changes
  const handleMetricsChange = (newMetrics: Partial<MetricsData>) => {
    setMetrics(prev => ({ ...prev, ...newMetrics }));
  };
  
  // Handle daily report changes
  const handleDailyReportChange = (day: string, content: string, status?: string, securityCode?: string) => {
    setDailyReports(prev => 
      prev.map(report => 
        report.day === day 
          ? { ...report, content, ...(status && { status }), ...(securityCode && { securityCode }) }
          : report
      )
    );
  };
  
  // Handle delivery options changes
  const handleDeliveryOptionsChange = (newOptions: Partial<DeliveryOptions>) => {
    setDeliveryOptions(prev => ({ ...prev, ...newOptions }));
  };
  
  // Handle AI option changes
  const handleAIOptionChange = (newOptions: Partial<AIOptions>) => {
    setAIOptions(prev => ({ ...prev, ...newOptions }));
  };
  
  // Helper function to prepare property data from metrics for PDF export
  const preparePropertyDataForExport = (): any[] => {
    if (!selectedClient) return [];
    
    // Create array of intrusion data
    const propertyData = [
      { 
        type: 'Human Intrusions', 
        count: Object.values(metrics.humanIntrusions).reduce((sum, val) => sum + val, 0) 
      },
      { 
        type: 'Vehicle Intrusions', 
        count: Object.values(metrics.vehicleIntrusions).reduce((sum, val) => sum + val, 0) 
      },
      { type: 'Potential Threats', count: metrics.potentialThreats },
      { type: 'AI Accuracy (%)', count: metrics.aiAccuracy },
      { type: 'Response Time (sec)', count: metrics.responseTime },
    ];
    
    return propertyData;
  };

  // Helper function to prepare report text from daily reports
  const prepareReportText = (): string => {
    // Combine all daily reports
    const reportText = dailyReports
      .map(report => `${report.day}: ${report.content}`)
      .join('\n\n');
      
    // Add summary notes if available
    return summaryNotes 
      ? `${reportText}\n\nAdditional Notes & Compliance:\n${summaryNotes}`
      : reportText;
  };
  
  // Helper function to capture chart as image
  const captureChartAsImage = async (): Promise<string> => {
    if (!chartRef.current) return '';
    
    try {
      const canvas = await html2canvas(chartRef.current);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to capture chart as image:', error);
      return '';
    }
  };
  
  // Apply AI to improve report
  const handleApplyAI = async () => {
    if (!selectedClient) {
      showToast('Please select a client first', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      // Use AIAssistant to finalize the entire report
      const result = await AIAssistant.finalizeReport(
        dailyReports.map(report => ({ 
          day: report.day, 
          content: report.content 
        })),
        summaryNotes,
        aiOptions
      );
      
      // Update daily reports with improved text
      setDailyReports(prev => 
        prev.map(report => {
          const improved = result.dailyReports.find(r => r.day === report.day);
          return improved ? { ...report, content: improved.content } : report;
        })
      );
      
      // Update summary if generated
      if (result.summary) {
        setSummaryNotes(result.summary);
      }
      
      setReportStatus('review');
      showToast('Report improved with AI', 'success');
    } catch (error) {
      console.error('AI processing failed:', error);
      showToast('Failed to improve report with AI', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Save report as draft
  const handleSaveDraft = async () => {
    if (!selectedClient) {
      showToast('Please select a client first', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      // Update chart data URL before saving
      const chartImg = await captureChartAsImage();
      if (chartImg) {
        setChartDataURL(chartImg);
      }
      
      const reportData: ReportData = {
        clientId: selectedClient.id,
        dateRange,
        themeSettings,
        metrics,
        dailyReports,
        summaryNotes,
        signature,
        deliveryOptions,
        status: reportStatus,
        chartDataURL: chartImg || chartDataURL,
      };
      
      await saveReportDraft(reportData);
      showToast('Report draft saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save draft:', error);
      showToast('Failed to save report draft', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Preview as PDF
  const handlePreviewPDF = async () => {
    if (!selectedClient) {
      showToast('Please select a client first', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      // Update chart image if needed
      if (!chartDataURL && chartRef.current) {
        const chartImg = await captureChartAsImage();
        if (chartImg) {
          setChartDataURL(chartImg);
        }
      }
      
      // Prepare the data for PDF export
      const propertyData = preparePropertyDataForExport();
      const reportText = prepareReportText();
      
      // Call exportToPDF with the correct argument count and types
      await exportToPDF(
        themeSettings.headerImage,
        propertyData,
        chartDataURL,
        reportText,
        signature,
        {
          backgroundImage: themeSettings.backgroundImage,
          backgroundTheme: themeSettings.primaryColor,
        }
      );
      
      setReportStatus('ready');
      showToast('PDF preview generated successfully', 'success');
    } catch (error) {
      console.error('Failed to preview PDF:', error);
      showToast('Failed to generate PDF preview', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Send report to clients
  const handleSendReport = async () => {
    if (!selectedClient) {
      showToast('Please select a client first', 'warning');
      return;
    }
    
    if (deliveryOptions.emailRecipients.length === 0 && deliveryOptions.smsRecipients.length === 0) {
      showToast('Please add at least one recipient', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      // Prepare property data and report text
      const propertyData = preparePropertyDataForExport();
      const reportText = prepareReportText();
      
      // Get PDF as blob
      const pdfBlob = await exportToPDF(
        themeSettings.headerImage,
        propertyData,
        chartDataURL,
        reportText,
        signature,
        {
          backgroundImage: themeSettings.backgroundImage,
          backgroundTheme: themeSettings.primaryColor,
          returnBlob: true, // Signal to return a blob instead of downloading
        }
      ) as Blob;
      
      // Upload PDF to CDN
      const uploadedUrl = await uploadReportToCDN(pdfBlob);
      
      // Send report
      await sendReport({
        clientId: selectedClient.id,
        reportUrl: uploadedUrl,
        deliveryOptions,
        subject: `Weekly Monitoring Report: ${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`,
        message: `Your weekly security monitoring report for ${selectedClient.name} is now available.`,
      });
      
      setReportStatus('sent');
      showToast('Report sent successfully', 'success');
    } catch (error) {
      console.error('Failed to send report:', error);
      showToast('Failed to send report', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients on component mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await getClientsForUser();
        setClients(response);
        if (response.length > 0) {
          setSelectedClient(response[0]);
        }
      } catch (error) {
        console.error('Failed to load clients:', error);
        showToast('Failed to load clients', 'error');
      }
    };
    
    loadClients();
  }, []);
  
  // Update chart data URL when metrics change
  useEffect(() => {
    const updateChartImage = async () => {
      if (chartRef.current) {
        const chartImg = await captureChartAsImage();
        if (chartImg) {
          setChartDataURL(chartImg);
        }
      }
    };
    
    // Only update when on the data visualization tab
    if (activeTab === 2) {
      updateChartImage();
    }
  }, [metrics, activeTab]);
  
  // Define the tabbed sections
  const tabs = [
    {
      title: 'Client & Theme',
      icon: '👤',
      component: (
        <ContentContainer>
          <ClientSelector 
            clients={clients} 
            selectedClient={selectedClient} 
            onSelectClient={handleClientSelect} 
          />
          <ThemeBuilder 
            settings={themeSettings} 
            onChange={handleThemeChange} 
          />
          <HeaderCustomization
            headerImage={themeSettings.headerImage}
            setHeaderImage={(url) => handleThemeChange({ headerImage: url })}
            backgroundTheme={themeSettings.primaryColor}
            setBackgroundTheme={(color) => handleThemeChange({ primaryColor: color })}
            backgroundImage={themeSettings.backgroundImage}
            setBackgroundImage={(url) => handleThemeChange({ backgroundImage: url })}
            backgroundOpacity={themeSettings.backgroundOpacity}
            setBackgroundOpacity={(opacity) => handleThemeChange({ backgroundOpacity: opacity })}
          />
        </ContentContainer>
      ),
    },
    {
      title: 'Property & Metrics',
      icon: '📊',
      component: (
        <ContentContainer>
          <PropertyInfoPanel 
            clientData={selectedClient} 
            metrics={metrics}
            dateRange={dateRange}
            onMetricsChange={handleMetricsChange}
          />
        </ContentContainer>
      ),
    },
    {
      title: 'Data Visualization',
      icon: '📈',
      component: (
        <ContentContainer>
          <DataVisualizationPanel 
            chartRef={chartRef}
            metrics={metrics}
            themeSettings={themeSettings}
            setChartDataURL={setChartDataURL}
          />
        </ContentContainer>
      ),
    },
    {
      title: 'Daily Reports',
      icon: '📝',
      component: (
        <ContentContainer>
          <DailyReportsPanel
            dailyReports={dailyReports}
            onReportChange={handleDailyReportChange}
            dateRange={dateRange}
            summaryNotes={summaryNotes}
            onSummaryChange={setSummaryNotes}
            signature={signature}
            onSignatureChange={setSignature}
            aiOptions={aiOptions}
            onAIOptionChange={handleAIOptionChange}
          />
        </ContentContainer>
      ),
    },
    {
      title: 'Preview & Delivery',
      icon: '📬',
      component: (
        <ContentContainer>
          <PreviewPanel 
            client={selectedClient}
            themeSettings={themeSettings}
            metrics={metrics}
            dailyReports={dailyReports}
            summaryNotes={summaryNotes}
            signature={signature}
            chartDataURL={chartDataURL}
            dateRange={dateRange}
          />
          <DeliveryOptionsPanel
            options={deliveryOptions}
            onChange={handleDeliveryOptionsChange}
            client={selectedClient}
          />
        </ContentContainer>
      ),
    },
  ];

  return (
    <PageWrapper>
      {/* Render the background overlay if a custom background image is provided */}
      {themeSettings.backgroundImage && (
        <BackgroundOverlay
          $backgroundImage={themeSettings.backgroundImage}
          $backgroundOpacity={themeSettings.backgroundOpacity}
          $backgroundFilter="blur(2px)"
        />
      )}
      
      <h1>Enhanced Security Monitoring Reports</h1>
      
      {/* Status and action bar */}
      <ActionBar>
        <StatusIndicator $status={reportStatus}>
          {reportStatus === 'draft' && 'Draft Report'}
          {reportStatus === 'review' && 'AI-Enhanced (Review)'}
          {reportStatus === 'ready' && 'Ready to Send'}
          {reportStatus === 'sent' && 'Report Sent'}
        </StatusIndicator>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <ActionButton 
            $variant="secondary" 
            onClick={handleSaveDraft}
            disabled={loading || !selectedClient}
          >
            Save Draft
          </ActionButton>
          
          {reportStatus === 'draft' && (
            <ActionButton 
              $variant="primary" 
              onClick={handleApplyAI}
              disabled={loading || !selectedClient}
            >
              Apply AI Enhancement
            </ActionButton>
          )}
          
          {reportStatus === 'review' && (
            <ActionButton 
              $variant="primary" 
              onClick={handlePreviewPDF}
              disabled={loading || !selectedClient}
            >
              Preview & Approve
            </ActionButton>
          )}
          
          {reportStatus === 'ready' && (
            <ActionButton 
              $variant="success" 
              onClick={handleSendReport}
              disabled={loading || !selectedClient}
            >
              Send Report
            </ActionButton>
          )}
          
          {reportStatus === 'sent' && (
            <ActionButton 
              $variant="primary" 
              onClick={() => {
                setReportStatus('draft');
                setDailyReports(defaultDailyReports);
                setSummaryNotes('');
              }}
            >
              Start New Report
            </ActionButton>
          )}
        </div>
      </ActionBar>

      {/* Navigation Tabs for the report sections */}
      <TabNav>
        {tabs.map((tab, index) => (
          <TabButton key={index} $active={activeTab === index} onClick={() => setActiveTab(index)}>
            <span>{tab.icon}</span> {tab.title}
          </TabButton>
        ))}
      </TabNav>

      {/* Render the currently active tab */}
      <div>{tabs[activeTab].component}</div>
    </PageWrapper>
  );
};

export default EnhancedReportsPage;