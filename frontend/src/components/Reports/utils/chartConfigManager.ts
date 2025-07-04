/**
 * Chart Config Manager - Configuration Management for Chart Components
 * Extracted from DataVisualizationPanel for better modularity
 * Production-ready configuration management with theme support
 */

import { 
  CHART_COLORS, 
  CHART_DIMENSIONS, 
  CHART_CONFIG, 
  CHART_GENERATION_CONFIG,
  getChartColor 
} from '../constants/chartConstants';
import { ThemeSettings } from '../../../types/reports';

/**
 * Chart configuration interfaces
 */
export interface ChartThemeConfig {
  colors: {
    human: string;
    vehicle: string;
    weekday: string;
    weekend: string;
    primary: string;
    secondary: string;
    background: string;
    text: string;
    border: string;
  };
  dimensions: {
    width: string;
    height: number;
    margin: {
      top: number;
      right: number;
      left: number;
      bottom: number;
    };
  };
  styling: {
    tooltip: any;
    legend: any;
    grid: any;
    axis: any;
    bar: any;
  };
}

export interface ChartGenerationOptions {
  scale: number;
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
  backgroundColor: string | null;
  timeout: number;
  maxAttempts: number;
  waitInterval: number;
}

/**
 * Generate chart configuration based on theme settings
 * 
 * @param themeSettings - Theme settings from the application
 * @returns Complete chart configuration object
 */
export const generateChartConfig = (themeSettings?: ThemeSettings): ChartThemeConfig => {
  const colors = {
    human: themeSettings?.primaryColor || CHART_COLORS.human,
    vehicle: themeSettings?.accentColor || CHART_COLORS.vehicle,
    weekday: themeSettings?.primaryColor || CHART_COLORS.weekday,
    weekend: themeSettings?.accentColor || CHART_COLORS.weekend,
    primary: themeSettings?.primaryColor || CHART_COLORS.primary,
    secondary: themeSettings?.accentColor || CHART_COLORS.secondary,
    background: themeSettings?.backgroundColor || CHART_COLORS.background,
    text: themeSettings?.textColor || CHART_COLORS.text,
    border: CHART_COLORS.border
  };

  return {
    colors,
    dimensions: {
      width: CHART_DIMENSIONS.width,
      height: CHART_DIMENSIONS.height,
      margin: { ...CHART_DIMENSIONS.margin }
    },
    styling: {
      tooltip: {
        ...CHART_CONFIG.tooltip,
        contentStyle: {
          ...CHART_CONFIG.tooltip.contentStyle,
          color: colors.primary
        }
      },
      legend: {
        ...CHART_CONFIG.legend,
        style: {
          ...CHART_CONFIG.legend.style,
          color: colors.text
        }
      },
      grid: { ...CHART_CONFIG.grid },
      axis: {
        ...CHART_CONFIG.axis,
        stroke: colors.text
      },
      bar: { ...CHART_CONFIG.bar }
    }
  };
};

/**
 * Get chart generation options with customization
 * 
 * @param customOptions - Custom options to override defaults
 * @returns Chart generation options
 */
export const getChartGenerationOptions = (customOptions: Partial<ChartGenerationOptions> = {}): ChartGenerationOptions => {
  return {
    scale: customOptions.scale || CHART_GENERATION_CONFIG.canvasSettings.scale,
    format: customOptions.format || 'png',
    quality: customOptions.quality || CHART_GENERATION_CONFIG.canvasSettings.quality,
    backgroundColor: customOptions.backgroundColor !== undefined ? customOptions.backgroundColor : CHART_GENERATION_CONFIG.canvasSettings.backgroundColor,
    timeout: customOptions.timeout || CHART_GENERATION_CONFIG.finalBuffer,
    maxAttempts: customOptions.maxAttempts || CHART_GENERATION_CONFIG.maxAttempts,
    waitInterval: customOptions.waitInterval || CHART_GENERATION_CONFIG.waitInterval
  };
};

/**
 * Generate responsive chart dimensions based on container size
 * 
 * @param containerWidth - Container width in pixels
 * @param containerHeight - Container height in pixels
 * @param aspectRatio - Desired aspect ratio (width/height)
 * @returns Responsive dimensions
 */
export const getResponsiveChartDimensions = (
  containerWidth: number,
  containerHeight: number,
  aspectRatio: number = 16/9
): { width: string; height: number; margin: any } => {
  const maxWidth = containerWidth - 40; // Account for padding
  const maxHeight = containerHeight - 100; // Account for headers/controls
  
  let width = maxWidth;
  let height = maxWidth / aspectRatio;
  
  // Adjust if height is too large
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  // Ensure minimum dimensions
  width = Math.max(width, 300);
  height = Math.max(height, 200);
  
  // Calculate responsive margins
  const margin = {
    top: Math.max(10, Math.round(height * 0.05)),
    right: Math.max(15, Math.round(width * 0.05)),
    left: Math.max(15, Math.round(width * 0.05)),
    bottom: Math.max(10, Math.round(height * 0.05))
  };
  
  return {
    width: `${width}px`,
    height: Math.round(height),
    margin
  };
};

/**
 * Generate chart color palette based on data type
 * 
 * @param dataType - Type of data being visualized
 * @param themeSettings - Theme settings
 * @param count - Number of colors needed
 * @returns Array of colors
 */
export const generateColorPalette = (
  dataType: 'security' | 'activity' | 'comparison' | 'trends',
  themeSettings?: ThemeSettings,
  count: number = 8
): string[] => {
  const baseColors = {
    human: themeSettings?.primaryColor || CHART_COLORS.human,
    vehicle: themeSettings?.accentColor || CHART_COLORS.vehicle,
    primary: themeSettings?.primaryColor || CHART_COLORS.primary,
    secondary: themeSettings?.accentColor || CHART_COLORS.secondary
  };
  
  switch (dataType) {
    case 'security':
      return [
        baseColors.human,
        baseColors.vehicle,
        adjustColorBrightness(baseColors.human, 0.3),
        adjustColorBrightness(baseColors.vehicle, 0.3),
        adjustColorBrightness(baseColors.human, -0.3),
        adjustColorBrightness(baseColors.vehicle, -0.3)
      ].slice(0, count);
      
    case 'activity':
      return generateGradientColors(baseColors.primary, count);
      
    case 'comparison':
      return [
        baseColors.human,
        baseColors.vehicle,
        adjustColorBrightness(baseColors.human, 0.2),
        adjustColorBrightness(baseColors.vehicle, 0.2)
      ].slice(0, count);
      
    case 'trends':
      return generateAnalogousColors(baseColors.primary, count);
      
    default:
      return generateGradientColors(baseColors.primary, count);
  }
};

/**
 * Adjust color brightness
 * 
 * @param color - Hex color string
 * @param amount - Brightness adjustment (-1 to 1)
 * @returns Adjusted color
 */
const adjustColorBrightness = (color: string, amount: number): string => {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Adjust brightness
  const newR = Math.max(0, Math.min(255, r + (amount * 255)));
  const newG = Math.max(0, Math.min(255, g + (amount * 255)));
  const newB = Math.max(0, Math.min(255, b + (amount * 255)));
  
  // Convert back to hex
  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
};

/**
 * Generate gradient colors from a base color
 * 
 * @param baseColor - Base hex color
 * @param count - Number of colors to generate
 * @returns Array of gradient colors
 */
const generateGradientColors = (baseColor: string, count: number): string[] => {
  const colors: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const brightness = (i / (count - 1)) * 0.6 - 0.3; // Range from -0.3 to 0.3
    colors.push(adjustColorBrightness(baseColor, brightness));
  }
  
  return colors;
};

/**
 * Generate analogous colors from a base color
 * 
 * @param baseColor - Base hex color
 * @param count - Number of colors to generate
 * @returns Array of analogous colors
 */
const generateAnalogousColors = (baseColor: string, count: number): string[] => {
  // This is a simplified version - in production, you'd use proper color theory
  const colors: string[] = [baseColor];
  
  for (let i = 1; i < count; i++) {
    const brightness = (i % 2 === 0) ? 0.2 : -0.2;
    colors.push(adjustColorBrightness(baseColor, brightness * (i / 2)));
  }
  
  return colors;
};

/**
 * Chart animation configuration
 */
export const getChartAnimationConfig = (enableAnimations: boolean = true) => {
  if (!enableAnimations) {
    return {
      animationDuration: 0,
      animationEasing: 'linear'
    };
  }
  
  return {
    animationDuration: 1000,
    animationEasing: 'ease-in-out',
    animationDelay: 0,
    animationBegin: 0
  };
};

/**
 * Chart accessibility configuration
 */
export const getChartAccessibilityConfig = () => {
  return {
    // ARIA labels and descriptions
    ariaLabel: 'Security data visualization chart',
    ariaDescription: 'Interactive chart showing security activity patterns',
    
    // Color contrast settings
    highContrast: false,
    
    // Keyboard navigation
    tabIndex: 0,
    
    // Screen reader support
    role: 'img',
    
    // Focus management
    focusable: true
  };
};

/**
 * Export chart configuration
 */
export const exportChartConfig = (config: ChartThemeConfig, format: 'json' | 'css' = 'json'): string => {
  if (format === 'css') {
    return `
      :root {
        --chart-color-human: ${config.colors.human};
        --chart-color-vehicle: ${config.colors.vehicle};
        --chart-color-primary: ${config.colors.primary};
        --chart-color-secondary: ${config.colors.secondary};
        --chart-color-background: ${config.colors.background};
        --chart-color-text: ${config.colors.text};
        --chart-color-border: ${config.colors.border};
        --chart-width: ${config.dimensions.width};
        --chart-height: ${config.dimensions.height}px;
      }
    `;
  }
  
  return JSON.stringify(config, null, 2);
};

/**
 * Validate chart configuration
 */
export const validateChartConfig = (config: ChartThemeConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate colors
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  Object.entries(config.colors).forEach(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('#')) {
      if (!colorRegex.test(value)) {
        errors.push(`Invalid color format for ${key}: ${value}`);
      }
    } else if (typeof value !== 'string') {
      errors.push(`Color ${key} must be a string`);
    }
  });
  
  // Validate dimensions
  if (config.dimensions.height <= 0) {
    errors.push('Chart height must be greater than 0');
  }
  
  if (config.dimensions.height < 200) {
    warnings.push('Chart height is very small, consider increasing for better visibility');
  }
  
  // Validate margins
  const margins = config.dimensions.margin;
  if (margins.top < 0 || margins.right < 0 || margins.left < 0 || margins.bottom < 0) {
    errors.push('Chart margins must be non-negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Get chart configuration for specific chart type
 */
export const getChartTypeConfig = (
  chartType: 'bar' | 'line' | 'pie' | 'area',
  themeSettings?: ThemeSettings
): any => {
  const baseConfig = generateChartConfig(themeSettings);
  
  switch (chartType) {
    case 'bar':
      return {
        ...baseConfig,
        bar: {
          ...baseConfig.styling.bar,
          maxBarSize: 50,
          categoryGap: '20%',
          barGap: 4
        }
      };
      
    case 'line':
      return {
        ...baseConfig,
        line: {
          strokeWidth: 2,
          dot: { r: 4 },
          activeDot: { r: 6 }
        }
      };
      
    case 'pie':
      return {
        ...baseConfig,
        pie: {
          cx: '50%',
          cy: '50%',
          outerRadius: 80,
          innerRadius: 0,
          paddingAngle: 2
        }
      };
      
    case 'area':
      return {
        ...baseConfig,
        area: {
          strokeWidth: 2,
          fillOpacity: 0.6,
          dot: { r: 0 }
        }
      };
      
    default:
      return baseConfig;
  }
};
