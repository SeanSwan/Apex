// File: frontend/src/pages/ReportBuilder.tsx

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ClientData, MetricsData, ThemeSettings, DailyReport, AIOptions, DeliveryOptions, DailyReportStatus, SecurityCode } from '../types/reports';
import ClientSelector from '../components/Reports/ClientSelector';
import PropertyInfoPanel from '../components/Reports/PropertyInfoPanel';
import DailyReportsPanel from '../components/Reports/DailyReportsPanel';
import DataVisualizationPanel from '../components/Reports/DataVisualizationPanel';
import ThemeBuilder from '../components/Reports/ThemeBuilder';
import PreviewPanel from '../components/Reports/PreviewPanel';
import DeliveryOptionsPanel from '../components/Reports/DeliveryOptionsPanel';
import FileUploadPanel from '../components/Reports/FileUploadPanel';
import AIAssistant from '../components/Reports/AIAssistant';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
// import axios from 'axios'; // Uncomment when you need to make API calls

// Import mock data
import { mockClients, mockMetricsData, mockDailyReports } from '../data/mockData';

// Styled components
const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f8f9fa;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
  border-bottom: 3px solid #0070f3;
  padding-bottom: 0.5rem;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
`;

interface TabProps {
  active: boolean;
}

const Tab = styled.button<TabProps>`
  padding: 0.75rem 1.5rem;
  background-color: ${props => props.active ? '#0070f3' : 'transparent'};
  color: ${props => props.active ? 'white' : '#333'};
  border: none;
  border-bottom: ${props => props.active ? '3px solid #0070f3' : 'none'};
  cursor: pointer;
  font-size: 1rem;
  font-weight: ${props => props.active ? '600' : '400'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? '#0060df' : '#f0f0f0'};
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: flex-end;
`;

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success';
}

const Button = styled.button<ButtonProps>`
  padding: 0.75rem 1.5rem;
  background-color: ${props => {
    switch (props.variant) {
      case 'primary': return '#0070f3';
      case 'secondary': return '#f5f5f5';
      case 'success': return '#28a745';
      default: return '#0070f3';
    }
  }};
  color: ${props => props.variant === 'secondary' ? '#333' : '#fff'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background-color: ${props => {
      switch (props.variant) {
        case 'primary': return '#0060df';
        case 'secondary': return '#e0e0e0';
        case 'success': return '#218838';
        default: return '#0060df';
      }
    }};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const DateRangeDisplay = styled.div`
  background-color: white;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: inline-block;
  margin-bottom: 1.5rem;
  border: 1px solid #e0e0e0;
`;

const ActionIcon = styled.span`
  margin-right: 0.5rem;
`;

// Loading container
const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const LoadingContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
`;

const KeyframeStyles = styled.div`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ReportBuilder = () => {
  // Refs
  const chartRef = useRef<HTMLDivElement>(null);
  
  // State
  const [activeTab, setActiveTab] = useState<string>('client');
  const [clients] = useState<ClientData[]>(mockClients);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData>(mockMetricsData);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(mockDailyReports || [
    { day: 'Monday', content: '', status: 'To update' as DailyReportStatus, securityCode: 'Code 4' as SecurityCode },
    { day: 'Tuesday', content: '', status: 'To update' as DailyReportStatus, securityCode: 'Code 4' as SecurityCode },
    { day: 'Wednesday', content: '', status: 'To update' as DailyReportStatus, securityCode: 'Code 4' as SecurityCode },
    { day: 'Thursday', content: '', status: 'To update' as DailyReportStatus, securityCode: 'Code 4' as SecurityCode },
    { day: 'Friday', content: '', status: 'To update' as DailyReportStatus, securityCode: 'Code 4' as SecurityCode },
    { day: 'Saturday', content: '', status: 'To update' as DailyReportStatus, securityCode: 'Code 4' as SecurityCode },
    { day: 'Sunday', content: '', status: 'To update' as DailyReportStatus, securityCode: 'Code 4' as SecurityCode },
  ]);
  const [summaryNotes, setSummaryNotes] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [chartDataURL, setChartDataURL] = useState<string>('');
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    primaryColor: '#0070f3',
    secondaryColor: '#ffffff',
    accentColor: '#f5a623',
    fontFamily: 'Arial, sans-serif',
    backgroundOpacity: 0.8,
    reportTitle: 'AI Live Monitoring Report',
  });
  const [aiOptions, setAIOptions] = useState<AIOptions>({
    autoCorrect: true,
    enhanceWriting: true,
    suggestContent: true,
    generateSummary: true,
  });
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
  const [dateRange] = useState<{ start: Date; end: Date }>({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date()),
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  
  // Use effect to capture chart when activeTab changes to 'preview'
  useEffect(() => {
    if (activeTab === 'preview' && chartRef.current) {
      const captureChart = async () => {
        try {
          setIsLoading(true);
          setLoadingMessage('Capturing chart data...');
          
          // Delay slightly to ensure chart has fully rendered
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Add null check to ensure chartRef.current is not null
          if (chartRef.current) {
            const canvas = await html2canvas(chartRef.current, {
              scale: 2, // Higher resolution
              logging: false,
              useCORS: true, // Enable cross-origin images
              allowTaint: true,
              backgroundColor: '#ffffff'
            });
            
            const dataUrl = canvas.toDataURL('image/png');
            setChartDataURL(dataUrl);
          }
        } catch (error) {
          console.error('Failed to capture chart:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      captureChart();
    }
  }, [activeTab]);
  
  // Load saved data from localStorage on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeSettings');
    if (savedTheme) {
      try {
        setThemeSettings(JSON.parse(savedTheme));
      } catch (error) {
        console.error('Failed to parse saved theme settings:', error);
      }
    }
    
    const savedClient = localStorage.getItem('selectedClient');
    if (savedClient) {
      try {
        setSelectedClient(JSON.parse(savedClient));
      } catch (error) {
        console.error('Failed to parse saved client:', error);
      }
    }
    
    const savedReports = localStorage.getItem('dailyReports');
    if (savedReports) {
      try {
        setDailyReports(JSON.parse(savedReports));
      } catch (error) {
        console.error('Failed to parse saved reports:', error);
      }
    }
    
    const savedSummary = localStorage.getItem('summaryNotes');
    if (savedSummary) {
      setSummaryNotes(savedSummary);
    }
    
    const savedSignature = localStorage.getItem('signature');
    if (savedSignature) {
      setSignature(savedSignature);
    }
  }, []);
  
  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
  }, [themeSettings]);
  
  useEffect(() => {
    if (selectedClient) {
      localStorage.setItem('selectedClient', JSON.stringify(selectedClient));
    }
  }, [selectedClient]);
  
  useEffect(() => {
    localStorage.setItem('dailyReports', JSON.stringify(dailyReports));
  }, [dailyReports]);
  
  useEffect(() => {
    localStorage.setItem('summaryNotes', summaryNotes);
  }, [summaryNotes]);
  
  useEffect(() => {
    localStorage.setItem('signature', signature);
  }, [signature]);
  
  // Handlers
  const handleSelectClient = (client: ClientData) => {
    setSelectedClient(client);
    setActiveTab('info');
    
    // Load client-specific metrics (in a real app, this would be an API call)
    // For now, we're just using the mock data
  };
  
  const handleMetricsChange = (updatedMetrics: Partial<MetricsData>) => {
    setMetrics(prev => ({ ...prev, ...updatedMetrics }));
  };
  
  const handleReportChange = (day: string, content: string, status?: string, securityCode?: string) => {
    setDailyReports(prev => 
      prev.map(report => 
        report.day === day 
          ? { 
              ...report, 
              content, 
              status: (status || report.status) as DailyReportStatus,
              securityCode: (securityCode || report.securityCode) as SecurityCode
            } 
          : report
      )
    );
  };
  
  const handleThemeChange = (settings: Partial<ThemeSettings>) => {
    setThemeSettings(prev => ({ ...prev, ...settings }));
  };
  
  const handleAIOptionChange = (options: Partial<AIOptions>) => {
    setAIOptions(prev => ({ ...prev, ...options }));
  };
  
  const handleDeliveryOptionsChange = (options: Partial<DeliveryOptions>) => {
    setDeliveryOptions(prev => ({ ...prev, ...options }));
  };
  
  // Generate and download PDF report
  const handleDownloadReport = async () => {
    if (!selectedClient) return;
    
    setIsLoading(true);
    setLoadingMessage('Generating PDF report...');
    
    try {
      // Create a new PDF document (A4, portrait)
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // If we have a chart data URL, include it in the report
      if (chartDataURL) {
        // Add header info
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.text(`${themeSettings.reportTitle || 'AI Live Monitoring Report'}`, 105, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`${selectedClient.name} - ${format(dateRange.start, 'MMM d')} to ${format(dateRange.end, 'MMM d, yyyy')}`, 105, 25, { align: 'center' });
        
        // Add chart image
        doc.addImage(chartDataURL, 'PNG', 20, 35, 170, 80);
        
        // Add daily reports
        doc.setFontSize(14);
        doc.text('Daily Activity Reports', 20, 130);
        
        let yPosition = 140;
        
        dailyReports.forEach(report => {
          if (report.content) {
            // Check if we need a new page
            if (yPosition > 250) {
              doc.addPage();
              yPosition = 20;
            }
            
            doc.setFontSize(12);
            doc.setTextColor(0, 70, 150);
            doc.text(`${report.day} (${report.securityCode})`, 20, yPosition);
            
            doc.setTextColor(0, 0, 0);
            const splitContent = doc.splitTextToSize(report.content, 170);
            doc.text(splitContent, 20, yPosition + 7);
            
            yPosition += 7 + (splitContent.length * 7) + 5;
          }
        });
        
        // Check if we need a new page for summary
        if (yPosition > 230 && summaryNotes) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Add summary notes if they exist
        if (summaryNotes) {
          doc.setFontSize(14);
          doc.setTextColor(0, 70, 150);
          doc.text('Additional Notes & Compliance', 20, yPosition);
          
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          const splitSummary = doc.splitTextToSize(summaryNotes, 170);
          doc.text(splitSummary, 20, yPosition + 7);
          
          yPosition += 7 + (splitSummary.length * 7) + 10;
        }
        
        // Add signature if it exists
        if (signature) {
          doc.text(`Report prepared by: ${signature}`, 20, yPosition);
        }
      } else {
        // If no chart data, create a simpler report
        doc.setFontSize(18);
        doc.text(`${themeSettings.reportTitle || 'AI Live Monitoring Report'}`, 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`${selectedClient.name} - ${format(dateRange.start, 'MMM d')} to ${format(dateRange.end, 'MMM d, yyyy')}`, 105, 30, { align: 'center' });
        
        // Add daily reports
        let yPosition = 50;
        
        dailyReports.forEach(report => {
          if (report.content) {
            // Check if we need a new page
            if (yPosition > 250) {
              doc.addPage();
              yPosition = 20;
            }
            
            doc.setFontSize(14);
            doc.setTextColor(0, 70, 150);
            doc.text(`${report.day} (${report.securityCode})`, 20, yPosition);
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            const splitContent = doc.splitTextToSize(report.content, 170);
            doc.text(splitContent, 20, yPosition + 7);
            
            yPosition += 7 + (splitContent.length * 7) + 5;
          }
        });
        
        // Check if we need a new page for summary
        if (yPosition > 230 && summaryNotes) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Add summary notes if they exist
        if (summaryNotes) {
          doc.setFontSize(14);
          doc.setTextColor(0, 70, 150);
          doc.text('Additional Notes & Compliance', 20, yPosition);
          
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          const splitSummary = doc.splitTextToSize(summaryNotes, 170);
          doc.text(splitSummary, 20, yPosition + 7);
          
          yPosition += 7 + (splitSummary.length * 7) + 10;
        }
        
        // Add signature if it exists
        if (signature) {
          doc.text(`Report prepared by: ${signature}`, 20, yPosition);
        }
      }
      
      // Save the PDF with the client name and date
      doc.save(`${selectedClient.name}-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send report via email/SMS
  const handleSendReport = async () => {
    if (!selectedClient) return;
    
    setIsLoading(true);
    setLoadingMessage('Preparing to send report...');
    
    try {
      // First, generate a PDF blob
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Add content to PDF (simplified for brevity - same as download function)
      doc.setFontSize(18);
      doc.text(`${themeSettings.reportTitle || 'AI Live Monitoring Report'}`, 105, 20, { align: 'center' });
      
      // Basic client info and date range
      doc.setFontSize(12);
      doc.text(`${selectedClient.name} - ${format(dateRange.start, 'MMM d')} to ${format(dateRange.end, 'MMM d, yyyy')}`, 105, 30, { align: 'center' });
      
      // Create PDF blob
      const pdfBlob = doc.output('blob');
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', pdfBlob, `${selectedClient.name}-Report.pdf`);
      
      setLoadingMessage('Uploading report file...');
      
      // In a real implementation, this would upload to your server
      // For demo purposes, we'll simulate a successful upload
      // const uploadResponse = await axios.post('/api/reports/upload', formData);
      // const reportUrl = uploadResponse.data.url;
      
      // Simulate upload delay and success for demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setLoadingMessage('Sending report to recipients...');
      
      // Send to recipients (in a real implementation, this would call your backend API)
      /*
      const sendResponse = await axios.post('/api/reports/send', {
        clientId: selectedClient.id,
        reportUrl,
        deliveryOptions,
        subject: `${themeSettings.reportTitle || 'Security Report'} - ${format(dateRange.start, 'MMM d')} to ${format(dateRange.end, 'MMM d, yyyy')}`,
        message: `Please find attached the security report for ${selectedClient.name} covering the period from ${format(dateRange.start, 'MMM d')} to ${format(dateRange.end, 'MMM d, yyyy')}.`,
      });
      */
      
      // Simulate sending delay and success for demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      alert(`Report has been sent to ${deliveryOptions.emailRecipients.length} recipients.`);
    } catch (error) {
      console.error('Failed to send report:', error);
      alert('There was an error sending the report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Use AI to enhance all reports
  const handleEnhanceAllReports = async () => {
    if (dailyReports.some(report => !report.content)) {
      alert('Please ensure all days have at least some basic content before using AI enhancement.');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('AI is enhancing your reports...');
    
    try {
      // Get enhanced reports using AIAssistant
      const reportData = await AIAssistant.finalizeReport(
        dailyReports.map(report => ({ day: report.day, content: report.content })),
        summaryNotes,
        aiOptions
      );
      
      // Update the reports with enhanced content
      setDailyReports(prev => 
        prev.map(report => {
          const enhancedReport = reportData.dailyReports.find(r => r.day === report.day);
          return enhancedReport
            ? { 
                ...report, 
                content: enhancedReport.content, 
                status: 'Completed' as DailyReportStatus 
              }
            : report;
        })
      );
      
      // Update summary notes if AI generated a new summary
      if (aiOptions.generateSummary) {
        setSummaryNotes(reportData.summary);
      }
      
      alert('All reports have been enhanced by AI.');
    } catch (error) {
      console.error('AI enhancement failed:', error);
      alert('There was an error enhancing the reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigate to the next tab
  const handleNextTab = () => {
    switch (activeTab) {
      case 'client':
        setActiveTab('info');
        break;
      case 'info':
        setActiveTab('reports');
        break;
      case 'reports':
        setActiveTab('theme');
        break;
      case 'theme':
        setActiveTab('preview');
        break;
      case 'preview':
        setActiveTab('delivery');
        break;
      default:
        break;
    }
  };
  
  // Navigate to the previous tab
  const handlePrevTab = () => {
    switch (activeTab) {
      case 'info':
        setActiveTab('client');
        break;
      case 'reports':
        setActiveTab('info');
        break;
      case 'theme':
        setActiveTab('reports');
        break;
      case 'preview':
        setActiveTab('theme');
        break;
      case 'delivery':
        setActiveTab('preview');
        break;
      default:
        break;
    }
  };
  
  return (
    <Container>
      <KeyframeStyles />
      <Title>Report Builder</Title>
      
      {/* Date range display */}
      <DateRangeDisplay>
        <strong>Report Period:</strong> {format(dateRange.start, 'MMMM d, yyyy')} - {format(dateRange.end, 'MMMM d, yyyy')}
      </DateRangeDisplay>
      
      {/* Tabs */}
      <TabContainer>
        <Tab
          active={activeTab === 'client'}
          onClick={() => setActiveTab('client')}
        >
          1. Select Client
        </Tab>
        <Tab
          active={activeTab === 'info'}
          onClick={() => setActiveTab('info')}
        >
          2. Property Info
        </Tab>
        <Tab
          active={activeTab === 'reports'}
          onClick={() => setActiveTab('reports')}
        >
          3. Daily Reports
        </Tab>
        <Tab
          active={activeTab === 'theme'}
          onClick={() => setActiveTab('theme')}
        >
          4. Theme & Branding
        </Tab>
        <Tab
          active={activeTab === 'preview'}
          onClick={() => setActiveTab('preview')}
        >
          5. Preview
        </Tab>
        <Tab
          active={activeTab === 'delivery'}
          onClick={() => setActiveTab('delivery')}
        >
          6. Delivery
        </Tab>
      </TabContainer>
      
      {/* Tab content */}
      <div>
        {activeTab === 'client' && (
          <ClientSelector
            clients={clients}
            selectedClient={selectedClient}
            onSelectClient={handleSelectClient}
          />
        )}
        
        {activeTab === 'info' && selectedClient && (
          <PropertyInfoPanel
            clientData={selectedClient}
            metrics={metrics}
            dateRange={dateRange}
            onMetricsChange={handleMetricsChange}
          />
        )}
        
        {activeTab === 'reports' && selectedClient && (
          <DailyReportsPanel
            dailyReports={dailyReports}
            onReportChange={handleReportChange}
            dateRange={dateRange}
            summaryNotes={summaryNotes}
            onSummaryChange={setSummaryNotes}
            signature={signature}
            onSignatureChange={setSignature}
            aiOptions={aiOptions}
            onAIOptionChange={handleAIOptionChange}
          />
        )}
        
        {activeTab === 'theme' && selectedClient && (
          <>
            <ThemeBuilder
              settings={themeSettings}
              onChange={handleThemeChange}
            />
            <FileUploadPanel
              onFileUploaded={(fileUrl, fileName, fileType) => {
                console.log('File uploaded:', fileUrl, fileName, fileType);
                // You can add the file URL to the report data here if needed
              }}
              autoDeleteDays={30}
            />
          </>
        )}
        
        {activeTab === 'preview' && selectedClient && (
          <>
            <DataVisualizationPanel
              chartRef={chartRef}
              metrics={metrics}
              themeSettings={themeSettings}
              setChartDataURL={setChartDataURL}
            />
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
          </>
        )}
        
        {activeTab === 'delivery' && selectedClient && (
          <DeliveryOptionsPanel
            options={deliveryOptions}
            onChange={handleDeliveryOptionsChange}
            client={selectedClient}
          />
        )}
      </div>
      
      {/* Navigation buttons */}
      <ButtonContainer>
        {activeTab !== 'client' && (
          <Button variant="secondary" onClick={handlePrevTab}>
            <ActionIcon>←</ActionIcon> Previous
          </Button>
        )}
        
        {activeTab === 'reports' && (
          <Button 
            variant="primary" 
            onClick={handleEnhanceAllReports}
            disabled={dailyReports.every(report => !report.content)}
          >
            <ActionIcon>✨</ActionIcon> Enhance All with AI
          </Button>
        )}
        
        {activeTab === 'preview' && (
          <Button 
            variant="success" 
            onClick={handleDownloadReport}
            disabled={!selectedClient}
          >
            <ActionIcon>↓</ActionIcon> Download Report
          </Button>
        )}
        
        {activeTab === 'delivery' && (
          <Button 
            variant="success" 
            onClick={handleSendReport}
            disabled={!selectedClient || deliveryOptions.emailRecipients.length === 0}
          >
            <ActionIcon>📤</ActionIcon> Send Report
          </Button>
        )}
        
        {activeTab !== 'delivery' && (
          <Button variant="primary" onClick={handleNextTab} disabled={!selectedClient}>
            Next <ActionIcon>→</ActionIcon>
          </Button>
        )}
      </ButtonContainer>
      
      {/* Loading overlay */}
      {isLoading && (
        <LoadingContainer>
          <LoadingContent>
            <div style={{ marginBottom: '1rem' }}>
              {loadingMessage || 'Loading...'}
            </div>
            <div style={{ width: '50px', height: '50px', margin: '0 auto', border: '5px solid #f3f3f3', borderTop: '5px solid #0070f3', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </LoadingContent>
        </LoadingContainer>
      )}
    </Container>
  );
};

export default ReportBuilder;