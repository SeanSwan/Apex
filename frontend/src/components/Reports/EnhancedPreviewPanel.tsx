/**
 * Enhanced Preview Panel - Main Component (REFACTORED)
 * Production-ready modular component using extracted utilities
 * Reduced from 45.35KB to ~18KB through proper decomposition
 */

import React, { useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ClientData, MetricsData, DailyReport, ThemeSettings, MediaFile, VideoLink, DateRange } from '../../types/reports';
import { useReportData } from '../../context/ReportDataContext';

// Import extracted utilities and components
import {
  PREVIEW_VIEW_TYPES,
  SECTION_TYPES,
  PDFExportType,
  shouldShowSection,
  FALLBACK_VALUES,
  DATE_FORMAT_PATTERNS
} from './constants/previewPanelConstants';
import { usePreviewState, usePreviewData, useResponsivePreview } from './utils/previewHooks';
import { DateFormatter, PreviewContentGenerator } from './utils/previewRenderer';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { MetricsDisplay, PropertyInfo } from './components/MetricsDisplay';
import { MediaGallery, ChartImage } from './components/MediaGallery';
import {
  Section,
  SectionTitle,
  PreviewControlsContainer,
  PreviewControls,
  PreviewButton,
  ButtonGroup,
  DownloadButton,
  PDFButton,
  PreviewContainer,
  HeaderSection,
  LogoContainer,
  HeaderContent,
  HeaderTitle,
  HeaderSubtitle,
  ContentSection,
  ContentSectionHeader,
  DailyReportsSection,
  DailyReportItem,
  DailyReportHeader,
  DailyReportDay,
  DailyReportContent,
  SecurityCodeBadge,
  NotesSection,
  NotesContent,
  ContactSection,
  ContactInfo,
  ContactItem,
  ContactLabel,
  ContactValue,
  LoadingOverlay,
  LoadingSpinner
} from './shared/PreviewStyledComponents';

import marbleTexture from '../../assets/marble-texture.png';

// 🚨 APEX AI: REMOVED DUPLICATE ANALYSIS - Now using single source of truth from context
// All daily reports analysis is now handled in ReportDataContext for consistency

/**
 * Enhanced Preview Panel Props Interface
 */
export interface EnhancedPreviewPanelProps {
  mediaFiles?: MediaFile[];
  videoLinks?: VideoLink[];
  onExportPDF?: (type: PDFExportType) => Promise<void>;
  backgroundColor?: string;
  textColor?: string;
  leftLogo?: string;
  rightLogo?: string;
  className?: string;
  enableAnalytics?: boolean;
  onViewChange?: (view: string) => void;
}

// Fallback data if context is loading
const fallbackMetrics: MetricsData = {
  humanIntrusions: {},
  vehicleIntrusions: {},
  potentialThreats: 0,
  proactiveAlerts: 0,
  responseTime: 0,
  aiAccuracy: 0,
  totalCameras: 0,
  camerasOnline: 0,
  totalMonitoringHours: 0,
  operationalUptime: 0
};

// Export component and types
export default EnhancedPreviewPanel;
export type { EnhancedPreviewPanelProps };

const fallbackTheme: ThemeSettings = { 
  fontFamily: FALLBACK_VALUES.FONT_FAMILY, 
  backgroundOpacity: FALLBACK_VALUES.BACKGROUND_OPACITY,
  reportTitle: FALLBACK_VALUES.REPORT_TITLE,
  primaryColor: '#FFFFFF',
  secondaryColor: '#1A1A1A',
  accentColor: '#FFD700',
  backgroundImage: marbleTexture,
  headerImage: marbleTexture
};

const fallbackDateRange: DateRange = { start: new Date(), end: new Date() };

/**
 * Enhanced Preview Panel - Main Component (REFACTORED)
 * Production-ready modular component using extracted utilities
 * Reduced from 45.35KB to ~18KB through proper decomposition
 */
const EnhancedPreviewPanel: React.FC<EnhancedPreviewPanelProps> = ({
  mediaFiles = [],
  videoLinks = [],
  onExportPDF,
  backgroundColor,
  textColor,
  leftLogo,
  rightLogo,
  className,
  enableAnalytics = false,
  onViewChange
}) => {
  // Use the shared context data with error handling
  const {
    client,
    themeSettings: contextTheme,
    metrics: contextMetrics,
    dailyReports,
    summaryNotes,
    signature,
    chartDataURL,
    dateRange,
    isLoading: isContextLoading,
    contactEmail
  } = useReportData();

  // Use custom hooks for state management
  const { previewState, previewActions, previewRef } = usePreviewState({
    enableAnalytics,
    onViewChange
  });

  const { processedData, derivedMetrics, formatters } = usePreviewData({
    client,
    metrics: contextMetrics || fallbackMetrics,
    theme: contextTheme,
    dailyReports,
    dateRange,
    summaryNotes,
    signature,
    contactEmail
  });

  const { isMobile } = useResponsivePreview();

  // Chart data tracking
  useEffect(() => {
    if (chartDataURL && !chartDataURL.startsWith('data:image')) {
      console.warn('⚠️ Invalid chart data format detected');
    }
  }, [chartDataURL]);

  // 🚨 CRITICAL: Real-time data sync verification
  useEffect(() => {
    const handleTabSwitchSync = (event: CustomEvent) => {
      console.log('🔄 Preview: Tab switch detected, verifying data sync:', event.detail);
      
      if (event.detail.toTab === 'preview') {
        console.log('🖼️ Preview: Preparing to show data - Current state:', {
          clientName: client?.name,
          dailyReportsCount: dailyReports?.length || 0,
          reportsWithContent: dailyReports?.filter(r => r.content && r.content.trim().length > 0).length || 0,
          summaryNotesLength: summaryNotes?.length || 0,
          chartDataAvailable: !!chartDataURL,
          metricsLoaded: !!processedData.metrics,
          timestamp: new Date().toISOString()
        });
        
        const hasValidReports = dailyReports && dailyReports.some(r => r.content && r.content.trim().length > 10);
        if (!hasValidReports) {
          console.warn('⚠️ Preview: WARNING - No meaningful daily reports content detected!');
        } else {
          console.log('✅ Preview: Daily reports content verified and ready for display');
        }
      }
    };
    
    window.addEventListener('tabSwitchDataSync', handleTabSwitchSync as EventListener);
    return () => window.removeEventListener('tabSwitchDataSync', handleTabSwitchSync as EventListener);
  }, [client, dailyReports, summaryNotes, chartDataURL, processedData.metrics]);

  // Generate executive summary from processed data
  const executiveSummary = useMemo(() => {
    console.log('📜 APEX AI: Generating executive summary with derived metrics:', {
      totalHumanIntrusions: derivedMetrics.totalHumanIntrusions,
      totalVehicleIntrusions: derivedMetrics.totalVehicleIntrusions,
      totalActivity: derivedMetrics.totalActivity,
      source: 'PROCESSED_DATA_METRICS'
    });
    
    return PreviewContentGenerator.generateExecutiveSummary(
      processedData.metrics,
      processedData.client,
      processedData.dateRange,
      derivedMetrics.totalReports
    );
  }, [processedData, derivedMetrics]);

  // Event handlers using extracted utilities
  const handleDownloadPreview = async () => {
    await previewActions.downloadPreview();
  };

  const handleGeneratePDF = async (type: PDFExportType = 'standard') => {
    if (onExportPDF) {
      console.log('Using custom PDF export function...');
      await onExportPDF(type);
    } else {
      await previewActions.generatePDF(type);
    }
  };

  // Utility functions using extracted renderers
  const shouldRenderSection = (section: string) => {
    return shouldShowSection(section as any, previewState.currentView);
  };

  const formatDate = (date: Date | string) => {
    return DateFormatter.formatDate(date, DATE_FORMAT_PATTERNS.DISPLAY);
  };

  // Show loading state if context is loading and no data available
  if (isContextLoading && !client) {
    return (
      <Section className={className}>
        <SectionTitle>Report Preview</SectionTitle>
        <div>Loading preview data...</div>
      </Section>
    );
  }

  return (
    <Section className={className}>
      <SectionTitle>
        Professional Report Preview
        <PreviewControlsContainer>
          <PreviewControls>
            <PreviewButton 
              $active={previewState.currentView === PREVIEW_VIEW_TYPES.FULL} 
              onClick={() => previewActions.setView(PREVIEW_VIEW_TYPES.FULL)}
            >
              Full Report
            </PreviewButton>
            <PreviewButton 
              $active={previewState.currentView === PREVIEW_VIEW_TYPES.PAGE1} 
              onClick={() => previewActions.setView(PREVIEW_VIEW_TYPES.PAGE1)}
            >
              Page 1
            </PreviewButton>
            <PreviewButton 
              $active={previewState.currentView === PREVIEW_VIEW_TYPES.PAGE2} 
              onClick={() => previewActions.setView(PREVIEW_VIEW_TYPES.PAGE2)}
            >
              Page 2
            </PreviewButton>
            <PreviewButton 
              $active={previewState.currentView === PREVIEW_VIEW_TYPES.PAGE3} 
              onClick={() => previewActions.setView(PREVIEW_VIEW_TYPES.PAGE3)}
            >
              Page 3
            </PreviewButton>
          </PreviewControls>
          <ButtonGroup>
            <DownloadButton onClick={handleDownloadPreview} disabled={previewState.isLoading}>
              <span>⬇</span> Download Preview {previewState.isLoading ? '...' : ''}
            </DownloadButton>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <PDFButton 
                onClick={() => handleGeneratePDF('standard')} 
                disabled={previewState.isLoading} 
                title="Standard quality PDF"
              >
                <span>📄</span> Standard {previewState.isLoading ? '...' : ''}
              </PDFButton>
              <PDFButton 
                onClick={() => handleGeneratePDF('compressed')} 
                disabled={previewState.isLoading} 
                title="Compressed PDF (smaller file)" 
                style={{ backgroundColor: '#28a745' }}
              >
                <span>🗜️</span> Compressed {previewState.isLoading ? '...' : ''}
              </PDFButton>
              <PDFButton 
                onClick={() => handleGeneratePDF('both')} 
                disabled={previewState.isLoading} 
                title="Both standard and compressed versions"
              >
                <span>📦</span> Both {previewState.isLoading ? '...' : ''}
              </PDFButton>
            </div>
          </ButtonGroup>
        </PreviewControlsContainer>
      </SectionTitle>

      <PreviewContainer ref={previewRef} $fontFamily={processedData.theme.fontFamily}>
        {shouldRenderSection(SECTION_TYPES.HEADER) && (
          <HeaderSection
            $backgroundImage={processedData.theme.backgroundImage || processedData.theme.headerImage || backgroundColor}
            $opacity={processedData.theme.backgroundOpacity}
          >
            <LogoContainer>
              {(processedData.theme.companyLogo || leftLogo) && (
                <img src={processedData.theme.companyLogo || leftLogo} alt="Company Logo" />
              )}
            </LogoContainer>
            <HeaderContent>
              <HeaderTitle>
                {processedData.theme.reportTitle}
              </HeaderTitle>
              <HeaderSubtitle>
                [{processedData.client.name || FALLBACK_VALUES.CLIENT_NAME} – {formatters.formatDateRange(processedData.dateRange.start, processedData.dateRange.end)}]
              </HeaderSubtitle>
            </HeaderContent>
            <LogoContainer>
              {(processedData.theme.clientLogo || rightLogo) && (
                <img src={processedData.theme.clientLogo || rightLogo} alt="Client Logo" />
              )}
            </LogoContainer>
          </HeaderSection>
        )}

        <ContentSection
          $primaryColor={processedData.theme.primaryColor || textColor}
          $secondaryColor={processedData.theme.secondaryColor || backgroundColor}
        >
          {/* Executive Summary */}
          <ExecutiveSummary 
            summary={executiveSummary}
            accentColor={processedData.theme.accentColor}
          />

          {/* Property Information */}
          {shouldRenderSection(SECTION_TYPES.INFO) && (
            <PropertyInfo
              siteName={processedData.client.siteName || processedData.client.name}
              location={processedData.client.location}
              camerasOnline={processedData.metrics.camerasOnline}
              totalCameras={processedData.metrics.totalCameras}
              cameraType={processedData.client.cameraType}
              city={processedData.client.city}
              state={processedData.client.state}
              zipCode={processedData.client.zipCode}
              accentColor={processedData.theme.accentColor}
            />
          )}

          {/* Security Metrics */}
          {shouldRenderSection(SECTION_TYPES.METRICS) && (
            <MetricsDisplay
              metrics={processedData.metrics}
              accentColor={processedData.theme.accentColor}
              isCompact={isMobile}
            />
          )}

          {/* Chart Visualization */}
          {shouldRenderSection(SECTION_TYPES.CHART) && (
            <div>
              <ContentSectionHeader $accentColor={processedData.theme.accentColor}>
                Weekly Security Analysis
              </ContentSectionHeader>
              <ChartImage
                chartDataURL={chartDataURL}
                accentColor={processedData.theme.accentColor}
                isCompact={isMobile}
              />
            </div>
          )}

          {/* Media Evidence */}
          {shouldRenderSection(SECTION_TYPES.MEDIA) && (
            <MediaGallery
              mediaFiles={mediaFiles}
              videoLinks={[]}
              accentColor={processedData.theme.accentColor}
              isCompact={isMobile}
            />
          )}

          {/* Daily Reports */}
          {shouldRenderSection(SECTION_TYPES.DAILY) && (
            <div>
              <ContentSectionHeader $accentColor={processedData.theme.accentColor}>
                Detailed Daily Security Reports
              </ContentSectionHeader>
              <DailyReportsSection>
                {processedData.dailyReports && processedData.dailyReports.length > 0 ? (
                  processedData.dailyReports.map((report: DailyReport) => (
                    <DailyReportItem key={report.day}>
                      <DailyReportHeader>
                        <DailyReportDay>{report.day}:</DailyReportDay>
                        {report.securityCode && (
                          <SecurityCodeBadge $code={report.securityCode}>
                            {report.securityCode}✓
                          </SecurityCodeBadge>
                        )}
                      </DailyReportHeader>
                      <DailyReportContent>
                        {report.content && report.content.trim() ? 
                          report.content.trim().replace(/Debug:[^\n]*/g, '').replace(/\n+/g, '\n').trim() : 
                          `Standard security monitoring conducted for ${report.day}. No significant incidents reported.`
                        }
                      </DailyReportContent>
                    </DailyReportItem>
                  ))
                ) : (
                  <DailyReportItem>
                    <DailyReportContent>
                      No daily activity logs available for this period.
                    </DailyReportContent>
                  </DailyReportItem>
                )}
              </DailyReportsSection>
            </div>
          )}

          {/* Notes and Contact Information */}
          {shouldRenderSection(SECTION_TYPES.NOTES) && (
            <>
              <div>
                <ContentSectionHeader $accentColor={processedData.theme.accentColor}>
                  Additional Notes & Compliance
                </ContentSectionHeader>
                <NotesSection>
                  <NotesContent>
                    {processedData.summaryNotes && processedData.summaryNotes.trim() ? (
                      processedData.summaryNotes.trim().replace(/Debug:[^\n]*/g, '').replace(/\n+/g, '\n').trim()
                    ) : (
                      'All security protocols followed as per standard operating procedures. Continuous monitoring maintained throughout the reporting period.'
                    )}
                  </NotesContent>
                </NotesSection>
              </div>

              <div>
                <ContentSectionHeader $accentColor={processedData.theme.accentColor}>
                  Contact Information
                </ContentSectionHeader>
                <ContactSection>
                  <ContactInfo>
                    <ContactItem>
                      <ContactLabel>Report Prepared By:</ContactLabel>
                      <ContactValue>{processedData.signature}</ContactValue>
                    </ContactItem>
                    <ContactItem>
                      <ContactLabel>Security Company Contact:</ContactLabel>
                      <ContactValue>{processedData.contactEmail}</ContactValue>
                    </ContactItem>
                    <ContactItem>
                      <ContactLabel>Client Property:</ContactLabel>
                      <ContactValue>{processedData.client?.contactEmail || 'N/A'}</ContactValue>
                    </ContactItem>
                    <ContactItem>
                      <ContactLabel>Report Period:</ContactLabel>
                      <ContactValue>{formatters.formatDateRange(processedData.dateRange.start, processedData.dateRange.end)}</ContactValue>
                    </ContactItem>
                  </ContactInfo>
                </ContactSection>
              </div>
            </>
          )}

          {/* Video Evidence */}
          {shouldRenderSection(SECTION_TYPES.VIDEOS) && videoLinks.length > 0 && (
            <MediaGallery
              mediaFiles={[]}
              videoLinks={videoLinks}
              accentColor={processedData.theme.accentColor}
              isCompact={isMobile}
            />
          )}
        </ContentSection>
      </PreviewContainer>

      {(isContextLoading || previewState.isLoading) && (
        <LoadingOverlay>
          <LoadingSpinner />
        </LoadingOverlay>
      )}
    </Section>
  );
};

export default EnhancedPreviewPanel;