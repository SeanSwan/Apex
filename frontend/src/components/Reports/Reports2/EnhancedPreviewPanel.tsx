// File: frontend/src/components/Reports2/EnhancedPreviewPanel.tsx

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ClientData, ThemeSettings, MetricsData, DailyReport } from '../../types/reports';

// Styled components with enhanced mobile responsiveness using CSS Grid and Flexbox
const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const PreviewControlsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  
  @media (max-width: 640px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const PreviewControls = styled.div`
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 4px;
  padding: 0.5rem;
  gap: 0.5rem;
  flex-wrap: wrap;
  
  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
  }
`;

const PreviewButton = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  background-color: ${props => props.active ? '#0070f3' : 'transparent'};
  color: ${props => props.active ? 'white' : '#333'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? '#0060df' : '#e0e0e0'};
  }
  
  @media (max-width: 480px) {
    flex: 1;
    text-align: center;
    font-size: 0.75rem;
    padding: 0.5rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    width: 100%;
    justify-content: stretch;
  }
`;

const DownloadButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #218838;
    transform: translateY(-2px);
  }
  
  @media (max-width: 640px) {
    width: 100%;
    justify-content: center;
  }
`;

const PDFButton = styled(DownloadButton)`
  background-color: #dc3545;
  
  &:hover {
    background-color: #c82333;
  }
`;

const PreviewContainer = styled.div<{ fontFamily: string }>`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  font-family: ${props => props.fontFamily};
  position: relative;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const HeaderSection = styled.div<{ backgroundImage?: string; opacity?: number }>`
  background-image: ${props => props.backgroundImage ? `url(${props.backgroundImage})` : 'none'};
  background-size: cover;
  background-position: center;
  height: 150px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, ${props => props.opacity || 0.3});
    z-index: 1;
  }
  
  @media (max-width: 480px) {
    height: 120px;
    padding: 0.75rem;
  }
`;

const LogoContainer = styled.div`
  z-index: 2;
  max-width: 30%;
  display: flex;
  justify-content: center;
  align-items: center;
  
  img {
    max-height: 80px;
    max-width: 100%;
    object-fit: contain;
  }
  
  @media (max-width: 480px) {
    max-width: 25%;
    
    img {
      max-height: 60px;
    }
  }
`;

const HeaderContent = styled.div`
  z-index: 2;
  color: white;
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  
  @media (max-width: 640px) {
    font-size: 1.25rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const HeaderSubtitle = styled.div`
  font-size: 1rem;
  margin-top: 0.5rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  
  @media (max-width: 640px) {
    font-size: 0.875rem;
  }
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const ContentSection = styled.div<{ primaryColor: string; secondaryColor: string }>`
  padding: 1.5rem;
  background-color: ${props => props.secondaryColor};
  color: ${props => props.primaryColor};
  
  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const SectionHeader = styled.h2<{ accentColor: string }>`
  color: ${props => props.accentColor};
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${props => props.accentColor + '40'};
  
  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const PropertyInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  color: #666;
`;

const InfoValue = styled.div`
  font-weight: 600;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
`;

const MetricCard = styled.div<{ accentColor: string }>`
  padding: 1rem;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    border-bottom: 2px solid ${props => props.accentColor};
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  
  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const MetricLabel = styled.div`
  font-size: 0.75rem;
  color: #666;
  
  @media (max-width: 480px) {
    font-size: 0.7rem;
  }
`;

const DailyReportsSection = styled.div`
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
`;

const DailyReportItem = styled.div`
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  
  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const DailyReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const DailyReportDay = styled.div`
  font-weight: 600;
`;

const DailyReportContent = styled.div`
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-line;
  
  @media (max-width: 480px) {
    font-size: 0.825rem;
  }
`;

const ChartImageContainer = styled.div`
  margin: 1.5rem 0;
  text-align: center;
  
  img {
    max-width: 100%;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
`;

const NotesSection = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
`;

const SignatureSection = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  text-align: right;
`;

const PreviewMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  z-index: 10;
  pointer-events: none;
  font-weight: bold;
  letter-spacing: 2px;
  white-space: nowrap;
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
    padding: 0.4rem 0.8rem;
  }
`;

const LoadingOverlay = styled.div`
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

const LoadingSpinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const MediaSection = styled.div`
  margin-top: 1.5rem;
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  
  @media (max-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
`;

const MediaItem = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  height: 150px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 0.5rem;
    font-size: 0.75rem;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover .overlay {
    opacity: 1;
  }
  
  @media (max-width: 480px) {
    height: 120px;
  }
`;

const VideoLinkItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  margin-bottom: 0.5rem;
  
  .link-info {
    flex: 1;
  }
  
  .link-title {
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  .link-expiry {
    font-size: 0.75rem;
    color: #666;
  }
  
  .badge {
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .active {
    background-color: #d1fae5;
    color: #047857;
  }
  
  .expired {
    background-color: #fecaca;
    color: #b91c1c;
  }
`;

// Define types
interface VideoLink {
  url: string;
  title: string;
  expiryDate: string | Date;
}

interface MediaFile {
  url: string;
  name: string;
  type: string;
  thumbnail?: string;
}

interface EnhancedPreviewPanelProps {
  client: ClientData | null;
  themeSettings: ThemeSettings;
  metrics: MetricsData;
  dailyReports: DailyReport[];
  summaryNotes: string;
  signature: string;
  chartDataURL: string;
  dateRange: { start: Date; end: Date };
  mediaFiles?: MediaFile[];
  videoLinks?: VideoLink[];
  onExportPDF?: () => void;
  backgroundColor?: string;
  textColor?: string;
  leftLogo?: string;
  rightLogo?: string;
}

/**
 * Enhanced preview panel for report builder with improved styling, mobile responsiveness, and additional features
 */
const EnhancedPreviewPanel: React.FC<EnhancedPreviewPanelProps> = ({
  client,
  themeSettings,
  metrics,
  dailyReports,
  summaryNotes,
  signature,
  chartDataURL,
  dateRange,
  mediaFiles = [],
  videoLinks = [],
  onExportPDF,
  backgroundColor,
  textColor,
  leftLogo,
  rightLogo,
}) => {
  const [previewView, setPreviewView] = useState<'full' | 'page1' | 'page2' | 'page3'>('full');
  const [showPreviewMessage, setShowPreviewMessage] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Calculate total metrics
  const totalHumanIntrusions = Object.values(metrics.humanIntrusions).reduce((sum, value) => sum + value, 0);
  const totalVehicleIntrusions = Object.values(metrics.vehicleIntrusions).reduce((sum, value) => sum + value, 0);
  
  // Download preview as image
  const handleDownloadPreview = async () => {
    if (previewRef.current) {
      try {
        // Temporarily hide preview message
        setShowPreviewMessage(false);
        setIsLoading(true);
        
        // Wait for state update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(previewRef.current, {
          scale: 2,
          logging: false,
          useCORS: true,
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        
        // Create download link
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${client?.name || 'Client'}-Report-Preview.png`;
        link.click();
        
        // Show preview message again
        setShowPreviewMessage(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to download preview:', error);
        setIsLoading(false);
      }
    }
  };
  
  // Generate PDF with correct formatting
  const handleGeneratePDF = async () => {
    if (previewRef.current && onExportPDF) {
      try {
        onExportPDF();
      } catch (error) {
        console.error('Failed to generate PDF:', error);
        // Fallback to basic PDF generation if the custom handler fails
        generateBasicPDF();
      }
    } else {
      generateBasicPDF();
    }
  };
  
  // Basic PDF generation in case the custom handler is not provided
  const generateBasicPDF = async () => {
    if (previewRef.current) {
      try {
        setShowPreviewMessage(false);
        setIsLoading(true);
        
        // Wait for state update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(previewRef.current, {
          scale: 2,
          logging: false,
          useCORS: true,
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // A4 size
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [210, 297]
        });
        
        // Calculate the ratio to fit the image within A4
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add the image to the PDF
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // Save the PDF
        pdf.save(`${client?.name || 'Client'}-Report.pdf`);
        
        setShowPreviewMessage(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to generate basic PDF:', error);
        setIsLoading(false);
      }
    }
  };
  
  // Handle which sections to show based on preview view
  const shouldShowSection = (section: 'header' | 'info' | 'metrics' | 'chart' | 'daily' | 'notes' | 'media' | 'videos'): boolean => {
    if (previewView === 'full') return true;
    
    switch (section) {
      case 'header':
      case 'info':
      case 'metrics':
        return previewView === 'page1';
      case 'chart':
      case 'media':
        return previewView === 'page2';
      case 'daily':
      case 'notes':
      case 'videos':
        return previewView === 'page3';
      default:
        return false;
    }
  };
  
  // Format date for display
  const formatDate = (date: Date | string) => {
    if (typeof date === 'string') {
      return format(new Date(date), 'MMM d, yyyy');
    }
    return format(date, 'MMM d, yyyy');
  };
  
  return (
    <Section>
      <SectionTitle>
        Report Preview
        <PreviewControlsContainer>
          <PreviewControls>
            <PreviewButton 
              active={previewView === 'full'} 
              onClick={() => setPreviewView('full')}
            >
              Full Report
            </PreviewButton>
            <PreviewButton 
              active={previewView === 'page1'} 
              onClick={() => setPreviewView('page1')}
            >
              Page 1
            </PreviewButton>
            <PreviewButton 
              active={previewView === 'page2'} 
              onClick={() => setPreviewView('page2')}
            >
              Page 2
            </PreviewButton>
            <PreviewButton 
              active={previewView === 'page3'} 
              onClick={() => setPreviewView('page3')}
            >
              Page 3
            </PreviewButton>
          </PreviewControls>
          
          <ButtonGroup>
            <DownloadButton onClick={handleDownloadPreview}>
              <span>⬇</span> Download Preview
            </DownloadButton>
            <PDFButton onClick={handleGeneratePDF}>
              <span>📄</span> Export PDF
            </PDFButton>
          </ButtonGroup>
        </PreviewControlsContainer>
      </SectionTitle>
      
      {/* Preview container */}
      <PreviewContainer 
        ref={previewRef}
        fontFamily={themeSettings.fontFamily}
      >
        {showPreviewMessage && (
          <PreviewMessage>PREVIEW ONLY</PreviewMessage>
        )}
        
        {/* Header section */}
        {shouldShowSection('header') && (
          <HeaderSection 
            backgroundImage={themeSettings.headerImage || backgroundImage}
            opacity={themeSettings.backgroundOpacity}
          >
            <LogoContainer>
              {(themeSettings.companyLogo || leftLogo) && (
                <img src={themeSettings.companyLogo || leftLogo} alt="Company Logo" />
              )}
            </LogoContainer>
            
            <HeaderContent>
              <HeaderTitle style={{ color: themeSettings.textColor || textColor || 'white' }}>
                {themeSettings.reportTitle || 'Security Operations Report'}
              </HeaderTitle>
              <HeaderSubtitle style={{ color: themeSettings.textColor || textColor || 'white' }}>
                {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
              </HeaderSubtitle>
            </HeaderContent>
            
            <LogoContainer>
              {(themeSettings.clientLogo || rightLogo) && (
                <img src={themeSettings.clientLogo || rightLogo} alt="Client Logo" />
              )}
            </LogoContainer>
          </HeaderSection>
        )}
        
        {/* Content section */}
        <ContentSection
          primaryColor={themeSettings.primaryColor || textColor || '#333333'}
          secondaryColor={themeSettings.secondaryColor || backgroundColor || '#ffffff'}
        >
          {/* Property info section */}
          {shouldShowSection('info') && client && (
            <div>
              <SectionHeader accentColor={themeSettings.accentColor || '#0070f3'}>
                Site & Monitoring Details
              </SectionHeader>
              
              <PropertyInfoGrid>
                <InfoItem>
                  <InfoLabel>Site Name:</InfoLabel>
                  <InfoValue>{client.siteName || client.name}</InfoValue>
                </InfoItem>
                
                <InfoItem>
                  <InfoLabel>Location:</InfoLabel>
                  <InfoValue>{client.location || 'N/A'}</InfoValue>
                </InfoItem>
                
                <InfoItem>
                  <InfoLabel>Monitoring Period:</InfoLabel>
                  <InfoValue>
                    {format(dateRange.start, 'MMM d h:mm a')} - {format(dateRange.end, 'MMM d h:mm a, yyyy')}
                  </InfoValue>
                </InfoItem>
                
                <InfoItem>
                  <InfoLabel>Total Cameras On-Site:</InfoLabel>
                  <InfoValue>{metrics.totalCameras || 'N/A'}</InfoValue>
                </InfoItem>
                
                <InfoItem>
                  <InfoLabel>Camera Model:</InfoLabel>
                  <InfoValue>{client.cameraType || 'Standard IP'}</InfoValue>
                </InfoItem>
                
                {client.contactEmail && (
                  <InfoItem>
                    <InfoLabel>Primary Contact:</InfoLabel>
                    <InfoValue>{client.contactEmail}</InfoValue>
                  </InfoItem>
                )}
              </PropertyInfoGrid>
            </div>
          )}
          
          {/* Metrics section */}
          {shouldShowSection('metrics') && (
            <div>
              <SectionHeader accentColor={themeSettings.accentColor || '#0070f3'}>
                AI-Driven Insights
              </SectionHeader>
              
              <MetricsGrid>
                <MetricCard accentColor={themeSettings.accentColor || '#0070f3'}>
                  <MetricValue>{totalHumanIntrusions}</MetricValue>
                  <MetricLabel>Total Humans Captured</MetricLabel>
                </MetricCard>
                
                <MetricCard accentColor={themeSettings.accentColor || '#0070f3'}>
                  <MetricValue>{totalVehicleIntrusions}</MetricValue>
                  <MetricLabel>Vehicle Intrusions</MetricLabel>
                </MetricCard>
                
                <MetricCard accentColor={themeSettings.accentColor || '#0070f3'}>
                  <MetricValue>{metrics.potentialThreats}</MetricValue>
                  <MetricLabel>Potential Threats Identified</MetricLabel>
                </MetricCard>
                
                <MetricCard accentColor={themeSettings.accentColor || '#0070f3'}>
                  <MetricValue>{metrics.proactiveAlerts}</MetricValue>
                  <MetricLabel>Proactive Alerts Issued</MetricLabel>
                </MetricCard>
                
                <MetricCard accentColor={themeSettings.accentColor || '#0070f3'}>
                  <MetricValue>{metrics.aiAccuracy}%</MetricValue>
                  <MetricLabel>AI Accuracy (%)</MetricLabel>
                </MetricCard>
                
                <MetricCard accentColor={themeSettings.accentColor || '#0070f3'}>
                  <MetricValue>{metrics.responseTime}</MetricValue>
                  <MetricLabel>Average Response Time (sec)</MetricLabel>
                </MetricCard>
                
                <MetricCard accentColor={themeSettings.accentColor || '#0070f3'}>
                  <MetricValue>{metrics.totalMonitoringHours}</MetricValue>
                  <MetricLabel>Total Monitoring Hours</MetricLabel>
                </MetricCard>
                
                <MetricCard accentColor={themeSettings.accentColor || '#0070f3'}>
                  <MetricValue>{metrics.operationalUptime}%</MetricValue>
                  <MetricLabel>Operational Uptime (%)</MetricLabel>
                </MetricCard>
              </MetricsGrid>
            </div>
          )}
          
          {/* Chart image section */}
          {shouldShowSection('chart') && chartDataURL && (
            <div>
              <SectionHeader accentColor={themeSettings.accentColor || '#0070f3'}>
                Analytics & Charts
              </SectionHeader>
              
              <ChartImageContainer>
                <img src={chartDataURL} alt="Weekly Intrusion Data" />
              </ChartImageContainer>
            </div>
          )}
          
          {/* Media gallery section */}
          {shouldShowSection('media') && mediaFiles.length > 0 && (
            <MediaSection>
              <SectionHeader accentColor={themeSettings.accentColor || '#0070f3'}>
                Media Evidence
              </SectionHeader>
              
              <MediaGrid>
                {mediaFiles.map((file, index) => (
                  <MediaItem key={index}>
                    <img src={file.thumbnail || file.url} alt={file.name} />
                    <div className="overlay">{file.name}</div>
                  </MediaItem>
                ))}
              </MediaGrid>
            </MediaSection>
          )}
          
          {/* Video links section */}
          {shouldShowSection('videos') && videoLinks.length > 0 && (
            <MediaSection>
              <SectionHeader accentColor={themeSettings.accentColor || '#0070f3'}>
                Secured Video Evidence
              </SectionHeader>
              
              {videoLinks.map((link, index) => (
                <VideoLinkItem key={index}>
                  <div className="link-info">
                    <div className="link-title">{link.title}</div>
                    <div className="link-expiry">
                      {new Date(link.expiryDate) > new Date() 
                        ? `Accessible until: ${formatDate(link.expiryDate)}` 
                        : 'Access expired'}
                    </div>
                  </div>
                  <div className={`badge ${new Date(link.expiryDate) > new Date() ? 'active' : 'expired'}`}>
                    {new Date(link.expiryDate) > new Date() ? 'Active' : 'Expired'}
                  </div>
                </VideoLinkItem>
              ))}
            </MediaSection>
          )}
          
          {/* Daily reports section */}
          {shouldShowSection('daily') && (
            <DailyReportsSection>
              <SectionHeader accentColor={themeSettings.accentColor || '#0070f3'}>
                Weekly Activity Overview
              </SectionHeader>
              
              {dailyReports.map((report) => (
                <DailyReportItem key={report.day}>
                  <DailyReportHeader>
                    <DailyReportDay>{report.day}:</DailyReportDay>
                    {report.securityCode && (
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        backgroundColor: report.securityCode === 'Code 4' ? '#d1fae5' : 
                                      report.securityCode === 'Code 3' ? '#fff9c4' :
                                      report.securityCode === 'Code 2' ? '#ffccbc' : '#fecaca',
                        color: report.securityCode === 'Code 4' ? '#047857' :
                              report.securityCode === 'Code 3' ? '#f57f17' :
                              report.securityCode === 'Code 2' ? '#d84315' : '#b91c1c'
                      }}>
                        {report.securityCode}
                      </span>
                    )}
                  </DailyReportHeader>
                  <DailyReportContent>
                    {report.content || `No report available for ${report.day}.`}
                  </DailyReportContent>
                </DailyReportItem>
              ))}
            </DailyReportsSection>
          )}
          
          {/* Additional notes section */}
          {shouldShowSection('notes') && (
            <div>
              <SectionHeader accentColor={themeSettings.accentColor || '#0070f3'}>
                Additional Notes & Compliance
              </SectionHeader>
              
              <NotesSection>
                <DailyReportContent>
                  {summaryNotes || 'No additional notes provided.'}
                </DailyReportContent>
              </NotesSection>
              
              <SectionHeader accentColor={themeSettings.accentColor || '#0070f3'}>
                Contact Information
              </SectionHeader>
              
              <SignatureSection>
                <InfoItem>
                  <InfoLabel>Contact Name:</InfoLabel>
                  <InfoValue>{signature || 'N/A'}</InfoValue>
                </InfoItem>
                
                <InfoItem>
                  <InfoLabel>Contact Email:</InfoLabel>
                  <InfoValue>{client?.contactEmail || 'N/A'}</InfoValue>
                </InfoItem>
              </SignatureSection>
            </div>
          )}
        </ContentSection>
      </PreviewContainer>
      
      {/* Loading overlay */}
      {isLoading && (
        <LoadingOverlay>
          <LoadingSpinner />
        </LoadingOverlay>
      )}
    </Section>
  );
};

export default EnhancedPreviewPanel;