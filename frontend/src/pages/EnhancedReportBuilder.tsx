// File: frontend/src/pages/EnhancedReportBuilder.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from '../hooks/use-toast';

// Import base components
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

// Import enhanced report components
import ClientSelector from '../components/Reports/ClientSelector';
import PropertyInfoPanel from '../components/Reports/PropertyInfoPanel';
import DailyReportsPanel from '../components/Reports/DailyReportsPanel';
import AIReportAssistant from '../components/Reports/AIReportAssistant';
import MediaManagementSystem from '../components/Reports/MediaManagementSystem';
import DualLogoHeaderCustomizer from '../components/Reports/DualLogoHeaderCustomizer';
import EnhancedPDFGenerator from '../components/Reports/EnhancedPDFGenerator';
import QuickIncidentReport from '../components/Reports/QuickIncidentReport';

// Import data visualization components
import DataVisualizationPanel from '../components/Reports/DataVisualizationPanel';
import BugFixVerification from '../components/BugFixVerification';

// Import types and mock data
import { 
  ClientData, 
  MetricsData, 
  ThemeSettings, 
  DailyReport, 
  AIOptions, 
  DeliveryOptions 
} from '../types/reports';
import { mockClients, mockMetricsData, mockDailyReports } from '../data/mockData';

// Import icons
import { 
  Building, 
  BarChart2, 
  FileText, 
  Wand2, 
  Paintbrush, 
  Eye, 
  Send, 
  Camera, 
  AlertTriangle,
  Save,
  ChevronRight,
  ChevronLeft,
  Clock,
  Users,
  X
} from 'lucide-react';

// Styled components
const Container = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
  background-color: #f8f9fa;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 8px;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Subtitle = styled.h2`
  font-size: 1.1rem;
  color: #4b5563;
  font-weight: 400;
`;

const ProgressBar = styled.div`
  background-color: #e5e7eb;
  border-radius: 9999px;
  height: 8px;
  margin: 16px 0;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number }>`
  background-color: #0070f3;
  height: 100%;
  width: ${props => `${props.progress}%`};
  transition: width 0.5s ease;
`;

const TabsContainer = styled.div`
  margin-bottom: 24px;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Step = styled.div<{ active: boolean; completed: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  
  .number {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    background-color: ${props => 
      props.completed ? '#0070f3' : props.active ? '#e0f2fe' : '#e5e7eb'};
    color: ${props => 
      props.completed ? 'white' : props.active ? '#0070f3' : '#6b7280'};
    transition: all 0.3s ease;
  }
  
  .text {
    font-size: 0.9rem;
    color: ${props => props.active ? '#111827' : '#6b7280'};
    font-weight: ${props => props.active ? '600' : '400'};
  }
`;

const StepConnector = styled.div<{ completed: boolean }>`
  flex: 1;
  height: 2px;
  background-color: ${props => props.completed ? '#0070f3' : '#e5e7eb'};
  margin: 0 8px;
  position: relative;
  top: -14px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
`;

const ContentContainer = styled.div`
  margin-bottom: 24px;
`;

const IncidentButton = styled(Button)`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px 16px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
`;

const SaveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #6b7280;
`;

const ExpiredBadge = styled(Badge)`
  background-color: #fecaca;
  color: #b91c1c;
`;

const ProtectedBadge = styled(Badge)`
  background-color: #d1fae5;
  color: #047857;
`;

// Define steps for the report builder
const STEPS = [
  { id: 'client', name: 'Client', icon: <Building size={18} /> },
  { id: 'property', name: 'Property', icon: <Building size={18} /> },
  { id: 'dailyReports', name: 'Daily Reports', icon: <FileText size={18} /> },
  { id: 'mediaEvidence', name: 'Media', icon: <Camera size={18} /> },
  { id: 'visualize', name: 'Visualize', icon: <BarChart2 size={18} /> },
  { id: 'design', name: 'Design', icon: <Paintbrush size={18} /> },
  { id: 'preview', name: 'Preview', icon: <Eye size={18} /> },
  { id: 'deliver', name: 'Deliver', icon: <Send size={18} /> }
];

/**
 * EnhancedReportBuilder Component
 * A 7-star report builder with advanced features for security operations
 */
const EnhancedReportBuilder: React.FC = () => {
  const navigate = useNavigate();
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Client & property state
  const [clients] = useState<ClientData[]>(mockClients);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData>(mockMetricsData);
  
  // Report content state
  const [dailyReports, setDailyReports] = useState<DailyReport[]>(mockDailyReports);
  const [summaryNotes, setSummaryNotes] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  
  // Media state
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [videoLinks, setVideoLinks] = useState<any[]>([]);
  
  // Design state
  const [chartDataURL, setChartDataURL] = useState<string>('');
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    primaryColor: '#0070f3',
    secondaryColor: '#ffffff',
    accentColor: '#f5a623',
    fontFamily: 'Arial, sans-serif',
    backgroundOpacity: 0.8,
    reportTitle: 'Security Operations Report',
  });
  const [leftLogo, setLeftLogo] = useState<string | undefined>(undefined);
  const [rightLogo, setRightLogo] = useState<string | undefined>(undefined);
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(undefined);
  
  // AI options state
  const [aiOptions, setAIOptions] = useState<AIOptions>({
    enabled: true,
    autoCorrect: true,
    enhanceWriting: true,
    suggestContent: true,
    generateSummary: true,
    suggestImprovements: true,
    analyzeThreats: true,
    highlightPatterns: true
  });
  
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
  
  // UI state
  const [activeStep, setActiveStep] = useState<string>('client');
  const [dateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().setDate(new Date().getDate() - 6)),
    end: new Date(),
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showIncidentReport, setShowIncidentReport] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutosaving, setIsAutosaving] = useState<boolean>(false);
  
  // Calculate progress
  const calculateProgress = useCallback(() => {
    let progress = 0;
    
    // Client selection is 10%
    if (selectedClient) {
      progress += 15;
      
      // Check property info content
      if (metrics) {
        progress += 15;
      }
      
      // Check daily reports content
      const completedReports = dailyReports.filter(report => report.content && report.content.length > 50);
      progress += (completedReports.length / dailyReports.length) * 20;
      
      // Check media content
      if (mediaFiles.length > 0) {
        progress += 10;
      }
      
      // Check visualization content
      if (chartDataURL) {
        progress += 10;
      }
      
      // Check design content
      if (leftLogo || rightLogo || backgroundImage) {
        progress += 10;
      }
      
      // Check delivery content
      if (deliveryOptions.emailRecipients.length > 0 || deliveryOptions.smsRecipients.length > 0) {
        progress += 10;
      }
      
      // Check summary notes
      if (summaryNotes && summaryNotes.length > 50) {
        progress += 10;
      }
    }
    
    return Math.min(Math.round(progress), 100);
  }, [
    selectedClient, 
    metrics, 
    dailyReports, 
    mediaFiles, 
    chartDataURL, 
    leftLogo, 
    rightLogo, 
    backgroundImage, 
    deliveryOptions, 
    summaryNotes
  ]);
  
  // Calculate current step index
  const currentStepIndex = STEPS.findIndex(step => step.id === activeStep);
  
  // Handle next step
  const handleNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setActiveStep(STEPS[nextIndex].id);
    }
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setActiveStep(STEPS[prevIndex].id);
    }
  };
  
  // Handle client selection
  const handleSelectClient = (client: ClientData) => {
    setSelectedClient(client);
    
    // If this is the first selection, move to next step
    if (!selectedClient) {
      handleNextStep();
    }
  };
  
  // Handle metrics change
  const handleMetricsChange = (updatedMetrics: Partial<MetricsData>) => {
    setMetrics(prev => ({ ...prev, ...updatedMetrics }));
  };
  
  // Handle daily report change
  const handleReportChange = (day: string, content: string, status?: string, securityCode?: string) => {
    setDailyReports(prev => 
      prev.map(report => 
        report.day === day 
          ? { 
              ...report, 
              content, 
              status: (status || report.status) as any,
              securityCode: (securityCode || report.securityCode) as any
            } 
          : report
      )
    );
    
    // Trigger autosave
    triggerAutosave();
  };
  
  // Handle theme change
  const handleThemeChange = (settings: Partial<ThemeSettings>) => {
    setThemeSettings(prev => ({ ...prev, ...settings }));
    
    // Trigger autosave
    triggerAutosave();
  };
  
  // Handle header customization
  const handleHeaderUpdate = (values: any) => {
    setLeftLogo(values.leftLogo);
    setRightLogo(values.rightLogo);
    setBackgroundImage(values.backgroundImage);
    setThemeSettings(prev => ({
      ...prev,
      backgroundColor: values.backgroundColor,
      textColor: values.textColor,
      accentColor: values.accentColor,
      fontFamily: values.fontFamily,
      backgroundOpacity: values.backgroundOpacity,
      reportTitle: values.reportTitle
    }));
    
    // Trigger autosave
    triggerAutosave();
  };
  
  // Handle AI options change
  const handleAIOptionChange = (options: Partial<AIOptions>) => {
    setAIOptions(prev => ({ ...prev, ...options }));
  };
  
  // Handle delivery options change
  const handleDeliveryOptionsChange = (options: Partial<DeliveryOptions>) => {
    setDeliveryOptions(prev => ({ ...prev, ...options }));
  };
  
  // Handle media selection
  const handleMediaSelect = (media: any[]) => {
    setMediaFiles(media);
    
    // Extract video links with expiry
    const videos = media.filter(item => item.type === 'video');
    setVideoLinks(videos.map(video => ({
      url: video.shareLink,
      title: video.name,
      expiryDate: video.expiryDate
    })));
    
    // Trigger autosave
    triggerAutosave();
  };
  
  // Capture chart as image when entering preview tab
  useEffect(() => {
    if (activeStep === 'preview' && chartRef.current) {
      const captureChart = async () => {
        try {
          setIsLoading(true);
          
          // Import html2canvas dynamically to reduce initial load time
          const html2canvas = (await import('html2canvas')).default;
          
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
          toast({
            title: 'Error',
            description: 'Failed to capture chart data. Please try again.',
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      captureChart();
    }
  }, [activeStep]);
  
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
    
    const savedLastUpdate = localStorage.getItem('lastSaved');
    if (savedLastUpdate) {
      try {
        setLastSaved(new Date(savedLastUpdate));
      } catch (error) {
        console.error('Failed to parse last saved date:', error);
      }
    }
  }, []);
  
  // Autosave function
  const triggerAutosave = useCallback(() => {
    setIsAutosaving(true);
    
    // Simulate a delay before saving is complete
    setTimeout(() => {
      // Save to localStorage
      if (themeSettings) {
        localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
      }
      
      if (selectedClient) {
        localStorage.setItem('selectedClient', JSON.stringify(selectedClient));
      }
      
      localStorage.setItem('dailyReports', JSON.stringify(dailyReports));
      localStorage.setItem('summaryNotes', summaryNotes);
      localStorage.setItem('signature', signature);
      
      // Update last saved timestamp
      const now = new Date();
      localStorage.setItem('lastSaved', now.toISOString());
      setLastSaved(now);
      setIsAutosaving(false);
    }, 1500);
  }, [themeSettings, selectedClient, dailyReports, summaryNotes, signature]);
  
  // Generate and download PDF report
  const handleDownloadReport = async () => {
    if (!selectedClient) {
      toast({
        title: 'Client Required',
        description: 'Please select a client first',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare the property data for the PDF
      const propertyData = [
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
      
      // This normally would call the PDF generator component but for demo we'll just show success
      toast({
        title: 'PDF Generated',
        description: 'Your report has been successfully downloaded',
        variant: 'default'
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast({
        title: 'PDF Generation Failed',
        description: 'Failed to generate and download PDF report',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send report via email and SMS
  const handleSendReport = async () => {
    if (!selectedClient) {
      toast({
        title: 'Client Required',
        description: 'Please select a client first',
        variant: 'destructive'
      });
      return;
    }
    
    if (deliveryOptions.emailRecipients.length === 0 && deliveryOptions.smsRecipients.length === 0) {
      toast({
        title: 'Recipients Required',
        description: 'Please add at least one email or SMS recipient',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real implementation, you would send the report to your backend
      // For demo, we'll just simulate a successful send
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Report Sent Successfully',
        description: `Report sent to ${deliveryOptions.emailRecipients.length + deliveryOptions.smsRecipients.length} recipient(s)`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Failed to send report:', error);
      toast({
        title: 'Send Failed',
        description: 'Failed to send report',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fill data with dummy content for demo
  const populateWithDummyData = () => {
    // Set a client
    if (!selectedClient && clients.length > 0) {
      setSelectedClient(clients[0]);
    }
    
    // Generate some daily reports with content
    const dummyReportContent = [
      "Morning security monitoring began at 00:00 hours with all systems operational. Regular staff arrivals were logged from 8:15 AM to 9:30 AM, all with proper credentials. At 10:45 AM, delivery personnel arrived and followed all check-in protocols. Afternoon patrols conducted at 1:00 PM and 4:00 PM with no issues detected. All premises remained secure throughout the day.",
      "Security monitoring active for all hours. Staff arrivals began at 8:05 AM with proper credential verification. At 11:30 AM, a maintenance worker arrived for scheduled HVAC service and was properly escorted. A brief power fluctuation at 2:15 PM caused cameras #3 and #4 to restart, but all systems were fully operational within 2 minutes. Evening security verification completed at 7:00 PM with all access points secured.",
      "All security systems functioning normally. Morning shift change logged at 8:00 AM. Visitor access was granted for scheduled client meeting at 10:30 AM, with proper escort protocols followed. At 1:45 PM, loading dock alarm briefly activated but was determined to be a false alarm. System diagnostics confirmed all equipment operating within parameters. Final security verification completed at 7:15 PM.",
      "Security monitoring ongoing throughout the day. Staff arrivals normal between 8:00 AM and 9:15 AM. Scheduled fire alarm test conducted at 10:00 AM with all systems responding properly. At 3:30 PM, a delivery attempt was made without prior authorization - proper protocols were followed and delivery was rescheduled. Evening security check completed at 6:45 PM with all systems secure.",
      "All security measures operational for the full 24-hour period. Morning access granted for regular personnel starting at 8:10 AM. At 11:45 AM, a suspicious individual was observed in the parking area, but left before security response was necessary. Afternoon patrol conducted at 3:00 PM with no irregularities noted. All systems verified and secured by 7:00 PM.",
      "Weekend security monitoring active with reduced staff presence. At 9:30 AM, authorized maintenance team arrived for scheduled work on the HVAC system. Proper access protocols were followed. Security patrol conducted at 12:00 PM and 4:00 PM with all areas secure. No unauthorized access attempts detected.",
      "Weekend security monitoring continued with minimal activity. Regular patrol checks conducted at 9:00 AM, 1:00 PM, and 5:00 PM with all areas secure. At 2:15 PM, a motion alert triggered in the west corridor but was confirmed to be authorized maintenance personnel. All systems functioning normally with no security concerns."
    ];
    
    const updatedReports = dailyReports.map((report, index) => ({
      ...report,
      content: dummyReportContent[index] || report.content,
      status: 'Completed' as any
    }));
    
    setDailyReports(updatedReports);
    
    // Set summary notes
    setSummaryNotes("Weekly security monitoring has been completed with 100% coverage of all designated areas. All security systems maintained full operational status with 99.8% uptime. Staff and visitor access protocols were strictly followed with proper credential verification. A total of 47 legitimate access events were recorded with zero unauthorized attempts. All automated alerts were promptly investigated with appropriate follow-up actions. Security patrol schedules were maintained with complete documentation. Video retention policies are in compliance with all required regulations. This report has been verified for accuracy and completeness in accordance with security operations procedures.");
    
    // Set signature
    setSignature("John Williamson, Chief Security Officer");
    
    // Move to daily reports step to show the populated data
    setActiveStep('dailyReports');
    
    toast({
      title: 'Demo Data Loaded',
      description: 'The report has been populated with sample data for demonstration purposes',
      variant: 'default'
    });
  };
  
  // Prepare property data for PDF
  const preparePropertyData = () => {
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
  
  return (
    <Container>
      <Header>
        <Title>
          <FileText size={32} />
          Enhanced Report Builder
          {lastSaved && (
            <SaveIndicator>
              {isAutosaving ? (
                <>
                  <Clock className="animate-spin" size={14} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Clock size={14} />
                  <span>Last saved: {format(lastSaved, 'MMM d, h:mm a')}</span>
                </>
              )}
            </SaveIndicator>
          )}
        </Title>
        <Subtitle>
          {selectedClient 
            ? `${selectedClient.name} - ${format(dateRange.start, 'MMM d')} to ${format(dateRange.end, 'MMM d, yyyy')}` 
            : 'Create a comprehensive security operations report'}
        </Subtitle>
        
        <ProgressBar>
          <ProgressFill progress={calculateProgress()} />
        </ProgressBar>
      </Header>
      
      <StepIndicator>
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <Step 
              active={activeStep === step.id}
              completed={STEPS.findIndex(s => s.id === activeStep) > index}
              onClick={() => setActiveStep(step.id)}
            >
              <div className="number">
                {STEPS.findIndex(s => s.id === activeStep) > index ? '✓' : index + 1}
              </div>
              <div className="text">{step.name}</div>
            </Step>
            
            {index < STEPS.length - 1 && (
              <StepConnector completed={STEPS.findIndex(s => s.id === activeStep) > index} />
            )}
          </React.Fragment>
        ))}
      </StepIndicator>
      
      <ContentContainer>
        <Tabs value={activeStep} onValueChange={setActiveStep}>
          {/* Client Selection */}
          <TabsContent value="client">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={20} />
                <h2 className="text-xl font-semibold">Select Client</h2>
              </div>
              
              <ClientSelector
                clients={clients}
                selectedClient={selectedClient}
                onSelectClient={handleSelectClient}
              />
              
              {/* Demo data button */}
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={populateWithDummyData}
                >
                  Load Demo Data
                </Button>
              </div>
            </Card>
          </TabsContent>
          
          {/* Property Information */}
          <TabsContent value="property">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building size={20} />
                <h2 className="text-xl font-semibold">Property Information</h2>
              </div>
              
              {selectedClient ? (
                <PropertyInfoPanel
                  clientData={selectedClient}
                  metrics={metrics}
                  dateRange={dateRange}
                  onMetricsChange={handleMetricsChange}
                />
              ) : (
                <div className="py-12 text-center text-gray-500">
                  Please select a client first
                </div>
              )}
            </Card>
          </TabsContent>
          
          {/* Daily Reports */}
          <TabsContent value="dailyReports">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={20} />
                <h2 className="text-xl font-semibold">Daily Reports</h2>
              </div>
              
              {selectedClient ? (
                <>
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
                  
                  {/* AI Report Assistant */}
                  <div className="mt-6">
                    <AIReportAssistant
                      day={dailyReports[0]?.day || 'Monday'}
                      content={dailyReports[0]?.content || ''}
                      securityCode={dailyReports[0]?.securityCode as any}
                      onChange={(content) => handleReportChange(dailyReports[0]?.day || 'Monday', content)}
                      aiOptions={aiOptions}
                      dateRange={dateRange}
                    />
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  Please select a client first
                </div>
              )}
            </Card>
          </TabsContent>
          
          {/* Media Evidence */}
          <TabsContent value="mediaEvidence">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Camera size={20} />
                <h2 className="text-xl font-semibold">Media Evidence</h2>
              </div>
              
              {selectedClient ? (
                <MediaManagementSystem
                  onMediaSelect={handleMediaSelect}
                  clientId={selectedClient.id}
                  reportId="current-report"
                />
              ) : (
                <div className="py-12 text-center text-gray-500">
                  Please select a client first
                </div>
              )}
              
              {videoLinks.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <div className="font-semibold flex items-center gap-2 mb-2">
                    <Camera size={16} />
                    Secured Video Links
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {videoLinks.map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <div className="font-medium text-sm">{link.title}</div>
                          <div className="text-xs text-gray-500">{new Date(link.expiryDate) > new Date() 
                            ? `Expires: ${format(new Date(link.expiryDate), 'MMM d, h:mm a')}` 
                            : 'Expired'}</div>
                        </div>
                        
                        {new Date(link.expiryDate) > new Date() ? (
                          <ProtectedBadge>
                            Secured
                          </ProtectedBadge>
                        ) : (
                          <ExpiredBadge>
                            Expired
                          </ExpiredBadge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
          
          {/* Data Visualization */}
          <TabsContent value="visualize">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={20} />
                <h2 className="text-xl font-semibold">Data Visualization</h2>
              </div>
              
              {selectedClient ? (
                <DataVisualizationPanel
                  chartRef={chartRef}
                  metrics={metrics}
                  themeSettings={themeSettings}
                  setChartDataURL={setChartDataURL}
                />
              ) : (
                <div className="py-12 text-center text-gray-500">
                  Please select a client first
                </div>
              )}
            </Card>
          </TabsContent>
          
          {/* Design */}
          <TabsContent value="design">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Paintbrush size={20} />
                <h2 className="text-xl font-semibold">Design & Branding</h2>
              </div>
              
              {selectedClient ? (
                <DualLogoHeaderCustomizer
                  leftLogo={leftLogo}
                  rightLogo={rightLogo}
                  backgroundImage={backgroundImage}
                  reportTitle={themeSettings.reportTitle}
                  clientName={selectedClient.name}
                  backgroundColor={themeSettings.backgroundColor || '#ffffff'}
                  textColor={themeSettings.textColor || '#333333'}
                  accentColor={themeSettings.accentColor || '#0070f3'}
                  fontFamily={themeSettings.fontFamily || 'Arial, sans-serif'}
                  backgroundOpacity={themeSettings.backgroundOpacity || 0.8}
                  dateRange={dateRange}
                  onUpdate={handleHeaderUpdate}
                />
              ) : (
                <div className="py-12 text-center text-gray-500">
                  Please select a client first
                </div>
              )}
            </Card>
          </TabsContent>
          
          {/* Preview */}
          <TabsContent value="preview">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={20} />
                <h2 className="text-xl font-semibold">Report Preview</h2>
              </div>
              
              {selectedClient ? (
                <EnhancedPDFGenerator
                  reportTitle={themeSettings.reportTitle}
                  leftLogo={leftLogo}
                  rightLogo={rightLogo}
                  backgroundImage={backgroundImage}
                  themeSettings={themeSettings}
                  propertyData={preparePropertyData()}
                  chartImageURL={chartDataURL}
                  dailyReports={dailyReports}
                  summaryNotes={summaryNotes}
                  signature={signature}
                  dateRange={dateRange}
                  clientName={selectedClient.name}
                  videoLinks={videoLinks}
                  onSend={handleSendReport}
                />
              ) : (
                <div className="py-12 text-center text-gray-500">
                  Please select a client first
                </div>
              )}
            </Card>
          </TabsContent>
          
          {/* Delivery */}
          <TabsContent value="deliver">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Send size={20} />
                <h2 className="text-xl font-semibold">Delivery Options</h2>
              </div>
              
              {selectedClient ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Delivery Methods</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="email-delivery"
                            checked={deliveryOptions.email}
                            onChange={(e) => handleDeliveryOptionsChange({ email: e.target.checked })}
                            className="h-4 w-4"
                          />
                          <label htmlFor="email-delivery">Email Delivery</label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="sms-delivery"
                            checked={deliveryOptions.sms}
                            onChange={(e) => handleDeliveryOptionsChange({ sms: e.target.checked })}
                            className="h-4 w-4"
                          />
                          <label htmlFor="sms-delivery">SMS Notification</label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="schedule-delivery"
                            checked={deliveryOptions.scheduleDelivery}
                            onChange={(e) => handleDeliveryOptionsChange({ scheduleDelivery: e.target.checked })}
                            className="h-4 w-4"
                          />
                          <label htmlFor="schedule-delivery">Schedule Delivery</label>
                        </div>
                      </div>
                      
                      {deliveryOptions.scheduleDelivery && (
                        <div className="mt-4">
                          <label className="block mb-2">Delivery Date & Time</label>
                          <input 
                            type="datetime-local" 
                            className="px-3 py-2 border rounded-md"
                            value={format(deliveryOptions.deliveryDate, "yyyy-MM-dd'T'HH:mm")}
                            onChange={(e) => handleDeliveryOptionsChange({ 
                              deliveryDate: new Date(e.target.value) 
                            })}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Recipients</h3>
                      
                      {deliveryOptions.email && (
                        <div className="mb-4">
                          <label className="block mb-2">Email Recipients</label>
                          <div className="flex space-x-2">
                            <input 
                              type="email" 
                              className="flex-1 px-3 py-2 border rounded-md"
                              placeholder="Enter email address"
                            />
                            <Button>Add</Button>
                          </div>
                          
                          <div className="mt-2">
                            {deliveryOptions.emailRecipients.length === 0 ? (
                              <div className="text-sm text-gray-500">No recipients added</div>
                            ) : (
                              <div className="space-y-2">
                                {deliveryOptions.emailRecipients.map((email, index) => (
                                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span>{email}</span>
                                    <Button variant="ghost" size="sm">
                                      <X size={14} />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {deliveryOptions.sms && (
                        <div>
                          <label className="block mb-2">SMS Recipients</label>
                          <div className="flex space-x-2">
                            <input 
                              type="tel" 
                              className="flex-1 px-3 py-2 border rounded-md"
                              placeholder="Enter phone number"
                            />
                            <Button>Add</Button>
                          </div>
                          
                          <div className="mt-2">
                            {deliveryOptions.smsRecipients.length === 0 ? (
                              <div className="text-sm text-gray-500">No recipients added</div>
                            ) : (
                              <div className="space-y-2">
                                {deliveryOptions.smsRecipients.map((phone, index) => (
                                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span>{phone}</span>
                                    <Button variant="ghost" size="sm">
                                      <X size={14} />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Content Options</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="include-full-data"
                          checked={deliveryOptions.includeFullData}
                          onChange={(e) => handleDeliveryOptionsChange({ includeFullData: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <label htmlFor="include-full-data">Include Full Data</label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="include-charts"
                          checked={deliveryOptions.includeCharts}
                          onChange={(e) => handleDeliveryOptionsChange({ includeCharts: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <label htmlFor="include-charts">Include Charts & Visualizations</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      onClick={handleSendReport}
                      disabled={isLoading}
                    >
                      <Send size={16} className="mr-2" />
                      Send Report Now
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  Please select a client first
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </ContentContainer>
      
      <ButtonContainer>
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft size={16} className="mr-2" />
          Previous
        </Button>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadReport}
            disabled={!selectedClient || isLoading}
          >
            <Save size={16} className="mr-2" />
            Save Draft
          </Button>
          
          <Button
            onClick={handleNextStep}
            disabled={currentStepIndex === STEPS.length - 1 || (!selectedClient && currentStepIndex > 0)}
          >
            Next
            <ChevronRight size={16} className="ml-2" />
          </Button>
        </div>
      </ButtonContainer>
      
      {/* Incident Report Button */}
      <IncidentButton 
        onClick={() => setShowIncidentReport(!showIncidentReport)}
        variant={showIncidentReport ? "destructive" : "default"}
      >
        <AlertTriangle size={16} className="mr-2" />
        {showIncidentReport ? 'Close Incident Report' : 'Quick Incident Report'}
      </IncidentButton>
      
      {/* Quick Incident Report Panel */}
      {showIncidentReport && (
        <Card className="fixed bottom-80 right-6 w-full max-w-2xl shadow-lg z-20">
          <QuickIncidentReport 
            clientId={selectedClient?.id}
            onReportSent={() => setShowIncidentReport(false)}
          />
        </Card>
      )}
      
      {/* Bug Fix Verification Status */}
      <BugFixVerification />
    </Container>
  );
};

export default EnhancedReportBuilder;