// File: frontend/src/components/Reports/PreviewPanel.tsx

import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ClientData, ThemeSettings, MetricsData, DailyReport } from '../../types/reports';
import html2canvas from 'html2canvas';

// Styled components
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
`;

const PreviewControlsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const PreviewControls = styled.div`
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 4px;
  padding: 0.5rem;
  gap: 0.5rem;
`;

const PreviewButton = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  background-color: ${props => props.active ? '#0070f3' : 'transparent'};
  color: ${props => props.active ? 'white' : '#333'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  
  &:hover {
    background-color: ${props => props.active ? '#0060df' : '#e0e0e0'};
  }
`;

const DownloadButton = styled.button`
  margin-left: auto;
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
  
  &:hover {
    background-color: #218838;
  }
`;

const PreviewContainer = styled.div<{ fontFamily: string }>`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  font-family: ${props => props.fontFamily};
  position: relative;
`;

const HeaderSection = styled.div<{ backgroundImage?: string }>`
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
    background: rgba(0, 0, 0, 0.3);
    z-index: 1;
  }
`;

const LogoContainer = styled.div`
  z-index: 2;
  img {
    max-height: 80px;
    max-width: 150px;
    object-fit: contain;
  }
`;

const HeaderContent = styled.div`
  z-index: 2;
  color: white;
  text-align: center;
  flex: 1;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
`;

const HeaderSubtitle = styled.div`
  font-size: 1rem;
  margin-top: 0.5rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`;

const ContentSection = styled.div<{ primaryColor: string; secondaryColor: string }>`
  padding: 1.5rem;
  background-color: ${props => props.secondaryColor};
  color: ${props => props.primaryColor};
`;

const SectionHeader = styled.h2<{ accentColor: string }>`
  color: ${props => props.accentColor};
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${props => props.accentColor + '40'};
`;

const PropertyInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const InfoItem = styled.div`
  margin-bottom: 0.5rem;
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
`;

const MetricCard = styled.div<{ accentColor: string }>`
  padding: 1rem;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  text-align: center;
  
  &:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    transition: all 0.2s ease;
    border-bottom: 2px solid ${props => props.accentColor};
  }
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
`;

const MetricLabel = styled.div`
  font-size: 0.75rem;
  color: #666;
`;

const DailyReportsSection = styled.div`
  margin-top: 1.5rem;
`;

const DailyReportItem = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
`;

const DailyReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 0.5rem;
`;

const DailyReportDay = styled.div`
  font-weight: 600;
`;

const DailyReportContent = styled.div`
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-line;
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
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  z-index: 10;
  pointer-events: none;
`;

interface PreviewPanelProps {
  client: ClientData | null;
  themeSettings: ThemeSettings;
  metrics: MetricsData;
  dailyReports: DailyReport[];
  summaryNotes: string;
  signature: string;
  chartDataURL: string;
  dateRange: { start: Date; end: Date };
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  client,
  themeSettings,
  metrics,
  dailyReports,
  summaryNotes,
  signature,
  chartDataURL,
  dateRange,
}) => {
  const [previewView, setPreviewView] = useState<'full' | 'page1' | 'page2' | 'page3'>('full');
  const [showPreviewMessage, setShowPreviewMessage] = useState<boolean>(true);
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
      } catch (error) {
        console.error('Failed to download preview:', error);
      }
    }
  };
  
  // Handle which sections to show based on preview view
  const shouldShowSection = (section: 'header' | 'info' | 'metrics' | 'chart' | 'daily' | 'notes'): boolean => {
    if (previewView === 'full') return true;
    
    switch (section) {
      case 'header':
      case 'info':
      case 'metrics':
        return previewView === 'page1';
      case 'chart':
        return previewView === 'page2';
      case 'daily':
      case 'notes':
        return previewView === 'page3';
      default:
        return false;
    }
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
          
          <DownloadButton onClick={handleDownloadPreview}>
            <span>⬇</span> Download Preview
          </DownloadButton>
        </PreviewControlsContainer>
      </SectionTitle>
      
      {/* Preview container */}
      <PreviewContainer 
        ref={previewRef}
        fontFamily={themeSettings.fontFamily}
      >
        {showPreviewMessage && (
          <PreviewMessage>Preview Only</PreviewMessage>
        )}
        
        {/* Header section */}
        {shouldShowSection('header') && (
          <HeaderSection backgroundImage={themeSettings.headerImage}>
            <LogoContainer>
              {themeSettings.companyLogo && (
                <img src={themeSettings.companyLogo} alt="Company Logo" />
              )}
            </LogoContainer>
            
            <HeaderContent>
              <HeaderTitle>
                {themeSettings.reportTitle || 'AI Live Monitoring Report'}
              </HeaderTitle>
              <HeaderSubtitle>
                {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
              </HeaderSubtitle>
            </HeaderContent>
            
            <LogoContainer>
              {themeSettings.clientLogo && (
                <img src={themeSettings.clientLogo} alt="Client Logo" />
              )}
            </LogoContainer>
          </HeaderSection>
        )}
        
        {/* Content section */}
        <ContentSection
          primaryColor={themeSettings.primaryColor}
          secondaryColor={themeSettings.secondaryColor}
        >
          {/* Property info section */}
          {shouldShowSection('info') && client && (
            <div>
              <SectionHeader accentColor={themeSettings.accentColor}>
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
              </PropertyInfoGrid>
            </div>
          )}
          
          {/* Metrics section */}
          {shouldShowSection('metrics') && (
            <div>
              <SectionHeader accentColor={themeSettings.accentColor}>
                AI-Driven Insights
              </SectionHeader>
              
              <MetricsGrid>
                <MetricCard accentColor={themeSettings.accentColor}>
                  <MetricValue>{totalHumanIntrusions}</MetricValue>
                  <MetricLabel>Total Humans Captured</MetricLabel>
                </MetricCard>
                
                <MetricCard accentColor={themeSettings.accentColor}>
                  <MetricValue>{totalVehicleIntrusions}</MetricValue>
                  <MetricLabel>Vehicle Intrusions</MetricLabel>
                </MetricCard>
                
                <MetricCard accentColor={themeSettings.accentColor}>
                  <MetricValue>{metrics.potentialThreats}</MetricValue>
                  <MetricLabel>Potential Threats Identified</MetricLabel>
                </MetricCard>
                
                <MetricCard accentColor={themeSettings.accentColor}>
                  <MetricValue>{metrics.proactiveAlerts}</MetricValue>
                  <MetricLabel>Proactive Alerts Issued</MetricLabel>
                </MetricCard>
                
                <MetricCard accentColor={themeSettings.accentColor}>
                  <MetricValue>{metrics.aiAccuracy}%</MetricValue>
                  <MetricLabel>AI Accuracy (%)</MetricLabel>
                </MetricCard>
                
                <MetricCard accentColor={themeSettings.accentColor}>
                  <MetricValue>{metrics.responseTime}</MetricValue>
                  <MetricLabel>Average Response Time (sec)</MetricLabel>
                </MetricCard>
                
                <MetricCard accentColor={themeSettings.accentColor}>
                  <MetricValue>{metrics.totalMonitoringHours}</MetricValue>
                  <MetricLabel>Total Monitoring Hours</MetricLabel>
                </MetricCard>
                
                <MetricCard accentColor={themeSettings.accentColor}>
                  <MetricValue>{metrics.operationalUptime}%</MetricValue>
                  <MetricLabel>Operational Uptime (%)</MetricLabel>
                </MetricCard>
              </MetricsGrid>
            </div>
          )}
          
          {/* Chart image section */}
          {shouldShowSection('chart') && chartDataURL && (
            <div>
              <SectionHeader accentColor={themeSettings.accentColor}>
                Reports & Charts
              </SectionHeader>
              
              <ChartImageContainer>
                <img src={chartDataURL} alt="Weekly Intrusion Data" />
              </ChartImageContainer>
            </div>
          )}
          
          {/* Daily reports section */}
          {shouldShowSection('daily') && (
            <DailyReportsSection>
              <SectionHeader accentColor={themeSettings.accentColor}>
                Weekly Activity Overview
              </SectionHeader>
              
              {dailyReports.map((report) => (
                <DailyReportItem key={report.day}>
                  <DailyReportHeader>
                    <DailyReportDay>{report.day}:</DailyReportDay>
                    {report.securityCode && (
                      <span>{report.securityCode}</span>
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
              <SectionHeader accentColor={themeSettings.accentColor}>
                Additional Notes & Compliance
              </SectionHeader>
              
              <NotesSection>
                <DailyReportContent>
                  {summaryNotes || 'No additional notes provided.'}
                </DailyReportContent>
              </NotesSection>
              
              <SectionHeader accentColor={themeSettings.accentColor}>
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
    </Section>
  );
};

export default PreviewPanel;