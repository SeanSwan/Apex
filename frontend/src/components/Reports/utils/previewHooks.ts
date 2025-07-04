/**
 * Preview Hooks - Custom React Hooks for Preview Panel
 * Extracted from EnhancedPreviewPanel for better modularity
 * Production-ready hooks for state management and operations
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { 
  PreviewViewType, 
  LoadingState,
  PDFExportType,
  PREVIEW_VIEW_TYPES,
  LOADING_STATES,
  FALLBACK_VALUES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from '../constants/previewPanelConstants';
import { 
  EnhancedPDFGenerator, 
  PDFGenerationOptions, 
  PDFGenerationResult,
  usePDFGeneration 
} from './pdfGenerationEngine';
import { 
  ExportManager, 
  ExportOptions, 
  ExportResult,
  useExportManager 
} from './exportManager';
import { 
  usePreviewRenderer,
  PreviewRendererOptions,
  DateFormatter,
  ResponsiveUtils 
} from './previewRenderer';
import { ClientData, MetricsData, ThemeSettings, DailyReport, DateRange } from '../../../types/reports';

/**
 * Preview State Interface
 */
export interface PreviewState {
  currentView: PreviewViewType;
  loadingState: LoadingState;
  isLoading: boolean;
  isPDFGenerating: boolean;
  isExporting: boolean;
  error: string | null;
  lastOperation: string | null;
}

/**
 * Preview Actions Interface
 */
export interface PreviewActions {
  setView: (view: PreviewViewType) => void;
  resetView: () => void;
  generatePDF: (type?: PDFExportType) => Promise<PDFGenerationResult>;
  exportImage: (filename?: string) => Promise<ExportResult>;
  downloadPreview: () => Promise<ExportResult>;
  clearError: () => void;
}

/**
 * Preview Hook Options
 */
export interface UsePreviewStateOptions {
  defaultView?: PreviewViewType;
  enableAutoSave?: boolean;
  enableAnalytics?: boolean;
  onViewChange?: (view: PreviewViewType) => void;
  onOperationStart?: (operation: string) => void;
  onOperationComplete?: (operation: string, success: boolean) => void;
  onError?: (error: string) => void;
}

/**
 * Main Preview State Hook
 */
export const usePreviewState = (options: UsePreviewStateOptions = {}) => {
  const {
    defaultView = PREVIEW_VIEW_TYPES.FULL,
    enableAutoSave = false,
    enableAnalytics = false,
    onViewChange,
    onOperationStart,
    onOperationComplete,
    onError
  } = options;

  // State management
  const [currentView, setCurrentView] = useState<PreviewViewType>(defaultView);
  const [loadingState, setLoadingState] = useState<LoadingState>(LOADING_STATES.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [lastOperation, setLastOperation] = useState<string | null>(null);

  // Refs for tracking
  const previewRef = useRef<HTMLDivElement>(null);
  const operationStartTime = useRef<number>(0);

  // Derived state
  const isLoading = useMemo(() => 
    loadingState !== LOADING_STATES.IDLE && loadingState !== LOADING_STATES.SUCCESS && loadingState !== LOADING_STATES.ERROR,
    [loadingState]
  );

  const isPDFGenerating = useMemo(() => 
    loadingState === LOADING_STATES.GENERATING_PDF,
    [loadingState]
  );

  const isExporting = useMemo(() => 
    loadingState === LOADING_STATES.EXPORTING_IMAGE,
    [loadingState]
  );

  // PDF Generation hook
  const { 
    generatePDF: generatePDFBase, 
    generateBasicPDF,
    isGenerating: isPDFGeneratingBase,
    error: pdfError 
  } = usePDFGeneration({
    onStart: () => {
      setLoadingState(LOADING_STATES.GENERATING_PDF);
      setLastOperation('PDF Generation');
      operationStartTime.current = Date.now();
      onOperationStart?.('PDF Generation');
    },
    onComplete: () => {
      const duration = Date.now() - operationStartTime.current;
      console.log(`📊 PDF Generation completed in ${duration}ms`);
    },
    onSuccess: (result) => {
      setLoadingState(LOADING_STATES.SUCCESS);
      setError(null);
      onOperationComplete?.('PDF Generation', true);
      
      if (enableAnalytics) {
        trackOperation('pdf_generation', { 
          success: true, 
          view: currentView,
          duration: Date.now() - operationStartTime.current
        });
      }
    },
    onError: (errorMsg) => {
      setLoadingState(LOADING_STATES.ERROR);
      setError(errorMsg);
      onError?.(errorMsg);
      onOperationComplete?.('PDF Generation', false);
      
      if (enableAnalytics) {
        trackOperation('pdf_generation', { 
          success: false, 
          error: errorMsg,
          view: currentView 
        });
      }
    }
  });

  // Export Manager hook
  const { 
    exportAsImage, 
    downloadAsImage,
    isExporting: isExportingBase,
    error: exportError 
  } = useExportManager({
    onStart: () => {
      setLoadingState(LOADING_STATES.EXPORTING_IMAGE);
      setLastOperation('Image Export');
      operationStartTime.current = Date.now();
      onOperationStart?.('Image Export');
    },
    onComplete: () => {
      const duration = Date.now() - operationStartTime.current;
      console.log(`📊 Image Export completed in ${duration}ms`);
    },
    onSuccess: (result) => {
      setLoadingState(LOADING_STATES.SUCCESS);
      setError(null);
      onOperationComplete?.('Image Export', true);
      
      if (enableAnalytics) {
        trackOperation('image_export', { 
          success: true, 
          view: currentView,
          format: result.format,
          fileSize: result.fileSize,
          duration: Date.now() - operationStartTime.current
        });
      }
    },
    onError: (errorMsg) => {
      setLoadingState(LOADING_STATES.ERROR);
      setError(errorMsg);
      onError?.(errorMsg);
      onOperationComplete?.('Image Export', false);
      
      if (enableAnalytics) {
        trackOperation('image_export', { 
          success: false, 
          error: errorMsg,
          view: currentView 
        });
      }
    }
  });

  // View change handler
  const setView = useCallback((view: PreviewViewType) => {
    setCurrentView(view);
    setError(null);
    setLoadingState(LOADING_STATES.IDLE);
    onViewChange?.(view);
    
    if (enableAnalytics) {
      trackOperation('view_change', { view, previousView: currentView });
    }
  }, [currentView, onViewChange, enableAnalytics]);

  // Reset view
  const resetView = useCallback(() => {
    setView(defaultView);
  }, [defaultView, setView]);

  // Generate PDF with enhanced options
  const generatePDF = useCallback(async (type: PDFExportType = 'standard'): Promise<PDFGenerationResult> => {
    if (!previewRef.current) {
      const errorMsg = 'Preview element not available for PDF generation';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      const pdfOptions: Partial<PDFGenerationOptions> = {
        generateCompressed: type === 'compressed' || type === 'both',
        quality: type === 'compressed' ? 0.6 : 0.8,
        scale: 2,
        removeWatermarks: true
      };

      const result = await generatePDFBase(previewRef.current, pdfOptions);
      
      // If 'both' type requested, generate compressed version too
      if (type === 'both' && result.success && !result.compressedFilename) {
        console.log('📄 Generating additional compressed PDF...');
        const compressedOptions: Partial<PDFGenerationOptions> = {
          ...pdfOptions,
          quality: 0.6,
          generateCompressed: true
        };
        await generatePDFBase(previewRef.current, compressedOptions);
      }

      return result;

    } catch (error) {
      console.error('❌ PDF Generation failed in hook:', error);
      const errorMsg = error instanceof Error ? error.message : ERROR_MESSAGES.PDF_GENERATION_FAILED;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [generatePDFBase]);

  // Export as image
  const exportImage = useCallback(async (filename?: string): Promise<ExportResult> => {
    if (!previewRef.current) {
      const errorMsg = 'Preview element not available for image export';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      const exportOptions: ExportOptions = {
        filename: filename || `preview-${format(new Date(), 'yyyyMMdd-HHmmss')}`,
        format: 'png',
        quality: 0.9,
        scale: 2,
        includeTimestamp: !filename
      };

      return await exportAsImage(previewRef.current, exportOptions);

    } catch (error) {
      console.error('❌ Image Export failed in hook:', error);
      const errorMsg = error instanceof Error ? error.message : ERROR_MESSAGES.EXPORT_FAILED;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [exportAsImage]);

  // Download preview as image
  const downloadPreview = useCallback(async (): Promise<ExportResult> => {
    if (!previewRef.current) {
      const errorMsg = 'Preview element not available for download';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      const exportOptions: ExportOptions = {
        filename: `preview-report-${format(new Date(), 'yyyyMMdd')}`,
        format: 'png',
        quality: 0.9,
        scale: 2,
        includeTimestamp: true
      };

      return await downloadAsImage(previewRef.current, exportOptions);

    } catch (error) {
      console.error('❌ Preview Download failed in hook:', error);
      const errorMsg = error instanceof Error ? error.message : ERROR_MESSAGES.EXPORT_FAILED;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [downloadAsImage]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    setLoadingState(LOADING_STATES.IDLE);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (enableAutoSave && currentView !== defaultView) {
      const timer = setTimeout(() => {
        localStorage.setItem('previewState', JSON.stringify({
          currentView,
          timestamp: Date.now()
        }));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentView, defaultView, enableAutoSave]);

  // Error synchronization
  useEffect(() => {
    if (pdfError && !error) {
      setError(pdfError);
    }
  }, [pdfError, error]);

  useEffect(() => {
    if (exportError && !error) {
      setError(exportError);
    }
  }, [exportError, error]);

  // Analytics tracking function
  const trackOperation = useCallback((operation: string, data: any) => {
    if (enableAnalytics) {
      console.log(`📊 Preview Analytics: ${operation}`, data);
      // Here you could integrate with analytics services
      // like Google Analytics, Mixpanel, etc.
    }
  }, [enableAnalytics]);

  // Auto-clear success state
  useEffect(() => {
    if (loadingState === LOADING_STATES.SUCCESS) {
      const timer = setTimeout(() => {
        setLoadingState(LOADING_STATES.IDLE);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [loadingState]);

  // Preview state object
  const previewState: PreviewState = {
    currentView,
    loadingState,
    isLoading,
    isPDFGenerating,
    isExporting,
    error,
    lastOperation
  };

  // Preview actions object
  const previewActions: PreviewActions = {
    setView,
    resetView,
    generatePDF,
    exportImage,
    downloadPreview,
    clearError
  };

  return {
    previewState,
    previewActions,
    previewRef,
    // Additional utilities
    isOperationInProgress: isLoading,
    canPerformOperation: !isLoading,
    getOperationProgress: () => {
      if (loadingState === LOADING_STATES.IDLE) return 0;
      if (loadingState === LOADING_STATES.SUCCESS) return 100;
      return 50; // Indeterminate progress for ongoing operations
    }
  };
};

/**
 * Preview Data Processing Hook
 */
export interface UsePreviewDataOptions {
  client?: ClientData | null;
  metrics?: MetricsData | null;
  theme?: ThemeSettings | null;
  dailyReports?: DailyReport[] | null;
  dateRange?: DateRange | null;
  summaryNotes?: string | null;
  signature?: string | null;
  contactEmail?: string | null;
}

export const usePreviewData = (options: UsePreviewDataOptions = {}) => {
  const {
    client,
    metrics,
    theme,
    dailyReports,
    dateRange,
    summaryNotes,
    signature,
    contactEmail
  } = options;

  // Process and validate data
  const processedData = useMemo(() => {
    // Client data with fallbacks
    const effectiveClient = client || {
      name: FALLBACK_VALUES.CLIENT_NAME,
      siteName: FALLBACK_VALUES.PROPERTY_NAME,
      location: FALLBACK_VALUES.LOCATION
    } as ClientData;

    // Metrics with fallbacks
    const effectiveMetrics = metrics || {
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
    } as MetricsData;

    // Theme with fallbacks
    const effectiveTheme = {
      reportTitle: FALLBACK_VALUES.REPORT_TITLE,
      fontFamily: FALLBACK_VALUES.FONT_FAMILY,
      backgroundOpacity: FALLBACK_VALUES.BACKGROUND_OPACITY,
      primaryColor: '#FFFFFF',
      secondaryColor: '#1A1A1A',
      accentColor: '#FFD700',
      ...theme
    } as ThemeSettings;

    // Date range with fallbacks
    const effectiveDateRange = dateRange || {
      start: new Date(),
      end: new Date()
    } as DateRange;

    // Contact information with fallbacks
    const effectiveContactEmail = contactEmail || FALLBACK_VALUES.SECURITY_EMAIL;
    const effectiveSignature = signature || FALLBACK_VALUES.SECURITY_SIGNATURE;

    return {
      client: effectiveClient,
      metrics: effectiveMetrics,
      theme: effectiveTheme,
      dateRange: effectiveDateRange,
      dailyReports: dailyReports || [],
      summaryNotes: summaryNotes || '',
      contactEmail: effectiveContactEmail,
      signature: effectiveSignature
    };
  }, [client, metrics, theme, dailyReports, dateRange, summaryNotes, signature, contactEmail]);

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    const humanTotal = Object.values(processedData.metrics.humanIntrusions || {})
      .reduce((sum: number, value: number) => sum + value, 0);
    
    const vehicleTotal = Object.values(processedData.metrics.vehicleIntrusions || {})
      .reduce((sum: number, value: number) => sum + value, 0);

    const totalActivity = humanTotal + vehicleTotal;
    const completedReports = processedData.dailyReports.filter(r => r.status === 'Completed').length;
    const highSeverityReports = processedData.dailyReports.filter(r => 
      r.securityCode === 'Code 1' || r.securityCode === 'Code 2'
    ).length;

    return {
      totalHumanIntrusions: humanTotal,
      totalVehicleIntrusions: vehicleTotal,
      totalActivity,
      completedReports,
      highSeverityReports,
      totalReports: processedData.dailyReports.length
    };
  }, [processedData.metrics, processedData.dailyReports]);

  // Format utilities
  const formatters = useMemo(() => ({
    formatDate: (date: Date | string) => DateFormatter.formatDate(date),
    formatDateRange: (start: Date | string, end: Date | string) => 
      DateFormatter.formatDateRange(start, end),
    formatFileDate: (date?: Date | string) => DateFormatter.formatFilenameDate(date)
  }), []);

  // Data validation
  const validation = useMemo(() => {
    const hasValidClient = !!(processedData.client.name || processedData.client.siteName);
    const hasValidReports = processedData.dailyReports.length > 0;
    const hasValidMetrics = processedData.metrics.totalCameras >= 0;
    const hasValidDateRange = processedData.dateRange.start && processedData.dateRange.end;

    return {
      hasValidClient,
      hasValidReports,
      hasValidMetrics,
      hasValidDateRange,
      isDataComplete: hasValidClient && hasValidReports && hasValidMetrics && hasValidDateRange
    };
  }, [processedData]);

  return {
    processedData,
    derivedMetrics,
    formatters,
    validation,
    // Utility functions
    getClientDisplayName: () => processedData.client.siteName || processedData.client.name || FALLBACK_VALUES.CLIENT_NAME,
    getReportTitle: () => processedData.theme.reportTitle || FALLBACK_VALUES.REPORT_TITLE,
    getDateRangeString: () => formatters.formatDateRange(
      processedData.dateRange.start, 
      processedData.dateRange.end
    )
  };
};

/**
 * Responsive Preview Hook
 */
export const useResponsivePreview = () => {
  const [isMobile, setIsMobile] = useState(ResponsiveUtils.isMobile());
  const [isTablet, setIsTablet] = useState(ResponsiveUtils.isTablet());
  const [currentBreakpoint, setCurrentBreakpoint] = useState(ResponsiveUtils.getCurrentBreakpoint());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(ResponsiveUtils.isMobile());
      setIsTablet(ResponsiveUtils.isTablet());
      setCurrentBreakpoint(ResponsiveUtils.getCurrentBreakpoint());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    currentBreakpoint,
    // Utility functions
    getGridColumns: (desktop: string, tablet: string, mobile: string) => {
      if (isMobile) return mobile;
      if (isTablet) return tablet;
      return desktop;
    },
    getResponsiveValue: <T>(desktop: T, tablet: T, mobile: T): T => {
      if (isMobile) return mobile;
      if (isTablet) return tablet;
      return desktop;
    }
  };
};

// Export all hooks
export default {
  usePreviewState,
  usePreviewData,
  useResponsivePreview
};
