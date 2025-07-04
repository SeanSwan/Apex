/**
 * Preview Renderer - Preview Management and Control Utilities
 * Extracted from EnhancedPreviewPanel for better modularity
 * Production-ready preview state management and rendering logic
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  PreviewViewType, 
  SectionType,
  PREVIEW_VIEW_TYPES,
  SECTION_TYPES,
  shouldShowSection,
  RESPONSIVE_BREAKPOINTS,
  DATE_FORMAT_PATTERNS,
  FALLBACK_VALUES
} from '../constants/previewPanelConstants';
import { ClientData, DateRange, ThemeSettings, MetricsData } from '../../../types/reports';

/**
 * Preview State Interface
 */
export interface PreviewState {
  currentView: PreviewViewType;
  visibleSections: SectionType[];
  isFullscreen: boolean;
  isMobile: boolean;
  isTablet: boolean;
  zoom: number;
}

/**
 * Preview Actions Interface
 */
export interface PreviewActions {
  setView: (view: PreviewViewType) => void;
  toggleSection: (section: SectionType) => void;
  toggleFullscreen: () => void;
  setZoom: (zoom: number) => void;
  resetView: () => void;
}

/**
 * Preview Renderer Options
 */
export interface PreviewRendererOptions {
  defaultView?: PreviewViewType;
  enableFullscreen?: boolean;
  enableZoom?: boolean;
  responsiveBreakpoints?: typeof RESPONSIVE_BREAKPOINTS;
}

/**
 * Date Formatting Utilities
 */
export class DateFormatter {
  /**
   * Format date with error handling
   */
  static formatDate(date: Date | string | null | undefined, pattern: string = DATE_FORMAT_PATTERNS.DISPLAY): string {
    try {
      if (!date) return FALLBACK_VALUES.CLIENT_NAME;
      
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObj.getTime())) {
        console.warn('⚠️ Preview: Invalid date provided:', date);
        return 'Invalid Date';
      }
      
      return format(dateObj, pattern);
    } catch (error) {
      console.error('❌ Preview: Error formatting date:', { date, pattern, error });
      return 'Invalid Date';
    }
  }

  /**
   * Format date range for display
   */
  static formatDateRange(
    startDate: Date | string | null | undefined, 
    endDate: Date | string | null | undefined,
    pattern: string = DATE_FORMAT_PATTERNS.DISPLAY
  ): string {
    const start = this.formatDate(startDate, pattern);
    const end = this.formatDate(endDate, pattern);
    
    if (start === 'Invalid Date' || end === 'Invalid Date') {
      return 'Date Range Not Available';
    }
    
    return `${start} - ${end}`;
  }

  /**
   * Format filename-safe date
   */
  static formatFilenameDate(date?: Date | string): string {
    return this.formatDate(date, DATE_FORMAT_PATTERNS.FILE_NAME);
  }
}

/**
 * Responsive Utilities
 */
export class ResponsiveUtils {
  /**
   * Check if viewport is mobile
   */
  static isMobile(): boolean {
    return window.innerWidth <= RESPONSIVE_BREAKPOINTS.MOBILE;
  }

  /**
   * Check if viewport is tablet
   */
  static isTablet(): boolean {
    return window.innerWidth <= RESPONSIVE_BREAKPOINTS.TABLET && window.innerWidth > RESPONSIVE_BREAKPOINTS.MOBILE;
  }

  /**
   * Check if viewport is desktop
   */
  static isDesktop(): boolean {
    return window.innerWidth > RESPONSIVE_BREAKPOINTS.TABLET;
  }

  /**
   * Get current breakpoint
   */
  static getCurrentBreakpoint(): 'mobile' | 'tablet' | 'desktop' | 'large' {
    const width = window.innerWidth;
    
    if (width <= RESPONSIVE_BREAKPOINTS.MOBILE) return 'mobile';
    if (width <= RESPONSIVE_BREAKPOINTS.TABLET) return 'tablet';
    if (width <= RESPONSIVE_BREAKPOINTS.DESKTOP) return 'desktop';
    return 'large';
  }
}

/**
 * Section Visibility Manager
 */
export class SectionVisibilityManager {
  /**
   * Get visible sections for a preview view
   */
  static getVisibleSections(view: PreviewViewType): SectionType[] {
    if (view === PREVIEW_VIEW_TYPES.FULL) {
      return Object.values(SECTION_TYPES);
    }
    
    return Object.values(SECTION_TYPES).filter(section => 
      shouldShowSection(section, view)
    );
  }

  /**
   * Check if section should be rendered
   */
  static shouldRenderSection(section: SectionType, view: PreviewViewType): boolean {
    return shouldShowSection(section, view);
  }

  /**
   * Get section display name
   */
  static getSectionDisplayName(section: SectionType): string {
    const displayNames: Record<SectionType, string> = {
      [SECTION_TYPES.HEADER]: 'Header',
      [SECTION_TYPES.INFO]: 'Property Information',
      [SECTION_TYPES.METRICS]: 'Security Metrics',
      [SECTION_TYPES.CHART]: 'Data Visualization',
      [SECTION_TYPES.DAILY]: 'Daily Reports',
      [SECTION_TYPES.NOTES]: 'Notes & Contact',
      [SECTION_TYPES.MEDIA]: 'Media Evidence',
      [SECTION_TYPES.VIDEOS]: 'Video Evidence'
    };
    
    return displayNames[section] || section;
  }
}

/**
 * Preview Data Validator
 */
export class PreviewDataValidator {
  /**
   * Validate client data
   */
  static validateClient(client: ClientData | null | undefined): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!client) {
      errors.push('Client data is missing');
      return { isValid: false, errors, warnings };
    }

    if (!client.name && !client.siteName) {
      warnings.push('Client name or site name is missing');
    }

    if (!client.location) {
      warnings.push('Client location is missing');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate metrics data
   */
  static validateMetrics(metrics: MetricsData | null | undefined): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!metrics) {
      errors.push('Metrics data is missing');
      return { isValid: false, errors, warnings };
    }

    // Check for required numeric fields
    const requiredFields = [
      'potentialThreats',
      'proactiveAlerts', 
      'responseTime',
      'aiAccuracy',
      'totalCameras',
      'camerasOnline'
    ];

    requiredFields.forEach(field => {
      const value = (metrics as any)[field];
      if (typeof value !== 'number' || isNaN(value)) {
        warnings.push(`${field} is missing or invalid`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate theme settings
   */
  static validateTheme(theme: ThemeSettings | null | undefined): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!theme) {
      warnings.push('Theme settings are missing, using defaults');
      return { isValid: true, errors, warnings };
    }

    if (!theme.reportTitle) {
      warnings.push('Report title is missing');
    }

    if (!theme.primaryColor && !theme.secondaryColor) {
      warnings.push('Theme colors are not configured');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Preview Content Generator
 */
export class PreviewContentGenerator {
  /**
   * Generate executive summary from metrics
   */
  static generateExecutiveSummary(
    metrics: MetricsData,
    client: ClientData | null,
    dateRange: DateRange,
    dailyReportsCount: number = 0
  ): string {
    const totalHumanIntrusions = Object.values(metrics.humanIntrusions || {})
      .reduce((sum: number, value: number) => sum + value, 0);
    
    const totalVehicleIntrusions = Object.values(metrics.vehicleIntrusions || {})
      .reduce((sum: number, value: number) => sum + value, 0);
    
    const totalActivity = totalHumanIntrusions + totalVehicleIntrusions;
    
    // Property information
    const propertyName = client?.siteName || client?.name || 'the monitored property';
    const propertyLocation = client?.location ? ` located at ${client.location}` : '';
    const dateRangeStr = DateFormatter.formatDateRange(dateRange.start, dateRange.end);
    
    // Camera information
    const cameraInfo = metrics.totalCameras > 0 ? 
      ` utilizing ${metrics.camerasOnline}/${metrics.totalCameras} operational cameras` : '';
    const uptimeInfo = metrics.operationalUptime > 0 ? 
      ` maintaining ${metrics.operationalUptime}% system uptime` : '';
    
    // Base summary
    let summary = `Security monitoring report for ${propertyName}${propertyLocation} covering ${dateRangeStr}.`;
    
    // Add operational details
    if (cameraInfo || uptimeInfo) {
      summary += ` Surveillance operations conducted${cameraInfo}${uptimeInfo}.`;
    }
    
    // Activity analysis
    if (totalActivity === 0) {
      summary += ` No significant security incidents detected during the monitoring period. All ${dailyReportsCount} daily security reports completed successfully with continuous 24/7 coverage.`;
    } else {
      const activityType = totalHumanIntrusions > totalVehicleIntrusions ? 'human activity' : 
                          totalVehicleIntrusions > totalHumanIntrusions ? 'vehicle activity' : 'mixed activity';
      
      summary += ` Security assessment indicates monitored activity with ${totalActivity} total events: ${totalHumanIntrusions} human activities and ${totalVehicleIntrusions} vehicle activities, primarily ${activityType}.`;
    }
    
    // Performance metrics
    if (metrics.aiAccuracy > 0 || metrics.responseTime > 0) {
      summary += ` AI detection system performance: ${metrics.aiAccuracy}% accuracy with ${metrics.responseTime}s average response time.`;
    }
    
    // Alert summary
    if (metrics.proactiveAlerts > 0 || metrics.potentialThreats > 0) {
      summary += ` Security response generated ${metrics.proactiveAlerts} proactive alerts and identified ${metrics.potentialThreats} potential security concerns requiring attention.`;
    }
    
    return summary;
  }

  /**
   * Generate fallback content for missing data
   */
  static generateFallbackContent(section: SectionType): string {
    const fallbackContent: Record<SectionType, string> = {
      [SECTION_TYPES.HEADER]: 'Security Monitoring Report',
      [SECTION_TYPES.INFO]: 'Property information not available',
      [SECTION_TYPES.METRICS]: 'Security metrics are being calculated',
      [SECTION_TYPES.CHART]: 'Data visualization will appear here when available',
      [SECTION_TYPES.DAILY]: 'Daily security reports will be displayed when available',
      [SECTION_TYPES.NOTES]: 'Additional notes and compliance information',
      [SECTION_TYPES.MEDIA]: 'Media evidence will be displayed when available',
      [SECTION_TYPES.VIDEOS]: 'Video evidence will be displayed when available'
    };
    
    return fallbackContent[section] || 'Content not available';
  }
}

/**
 * Custom Hook: usePreviewRenderer
 */
export const usePreviewRenderer = (options: PreviewRendererOptions = {}) => {
  const {
    defaultView = PREVIEW_VIEW_TYPES.FULL,
    enableFullscreen = true,
    enableZoom = true,
    responsiveBreakpoints = RESPONSIVE_BREAKPOINTS
  } = options;

  // State management
  const [currentView, setCurrentView] = useState<PreviewViewType>(defaultView);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isMobile, setIsMobile] = useState(ResponsiveUtils.isMobile());
  const [isTablet, setIsTablet] = useState(ResponsiveUtils.isTablet());

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(ResponsiveUtils.isMobile());
      setIsTablet(ResponsiveUtils.isTablet());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Visible sections calculation
  const visibleSections = useMemo(() => {
    return SectionVisibilityManager.getVisibleSections(currentView);
  }, [currentView]);

  // Actions
  const setView = useCallback((view: PreviewViewType) => {
    setCurrentView(view);
  }, []);

  const toggleSection = useCallback((section: SectionType) => {
    // Custom section visibility logic can be implemented here
    console.log('Toggle section:', section);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (enableFullscreen) {
      setIsFullscreen(prev => !prev);
    }
  }, [enableFullscreen]);

  const setZoomLevel = useCallback((newZoom: number) => {
    if (enableZoom) {
      setZoom(Math.max(0.5, Math.min(3, newZoom)));
    }
  }, [enableZoom]);

  const resetView = useCallback(() => {
    setCurrentView(defaultView);
    setIsFullscreen(false);
    setZoom(1);
  }, [defaultView]);

  // Preview state
  const previewState: PreviewState = {
    currentView,
    visibleSections,
    isFullscreen,
    isMobile,
    isTablet,
    zoom
  };

  // Preview actions
  const previewActions: PreviewActions = {
    setView,
    toggleSection,
    toggleFullscreen,
    setZoom: setZoomLevel,
    resetView
  };

  return {
    previewState,
    previewActions,
    // Utility functions
    shouldRenderSection: (section: SectionType) => 
      SectionVisibilityManager.shouldRenderSection(section, currentView),
    getSectionDisplayName: SectionVisibilityManager.getSectionDisplayName,
    formatDate: DateFormatter.formatDate,
    formatDateRange: DateFormatter.formatDateRange,
    getCurrentBreakpoint: ResponsiveUtils.getCurrentBreakpoint,
    validateData: {
      client: PreviewDataValidator.validateClient,
      metrics: PreviewDataValidator.validateMetrics,
      theme: PreviewDataValidator.validateTheme
    },
    generateContent: {
      executiveSummary: PreviewContentGenerator.generateExecutiveSummary,
      fallback: PreviewContentGenerator.generateFallbackContent
    }
  };
};

/**
 * Preview Button Configuration
 */
export interface PreviewButtonConfig {
  view: PreviewViewType;
  label: string;
  description: string;
  icon?: string;
}

export const PREVIEW_BUTTON_CONFIGS: PreviewButtonConfig[] = [
  {
    view: PREVIEW_VIEW_TYPES.FULL,
    label: 'Full Report',
    description: 'Complete report with all sections',
    icon: '📄'
  },
  {
    view: PREVIEW_VIEW_TYPES.PAGE1,
    label: 'Page 1',
    description: 'Header, property info, and metrics',
    icon: '📊'
  },
  {
    view: PREVIEW_VIEW_TYPES.PAGE2,
    label: 'Page 2', 
    description: 'Charts and media evidence',
    icon: '📈'
  },
  {
    view: PREVIEW_VIEW_TYPES.PAGE3,
    label: 'Page 3',
    description: 'Daily reports and notes',
    icon: '📝'
  }
];

// Export utility classes
export {
  DateFormatter,
  ResponsiveUtils,
  SectionVisibilityManager,
  PreviewDataValidator,
  PreviewContentGenerator
};

// Default export
export default {
  usePreviewRenderer,
  DateFormatter,
  ResponsiveUtils,
  SectionVisibilityManager,
  PreviewDataValidator,
  PreviewContentGenerator,
  PREVIEW_BUTTON_CONFIGS
};
