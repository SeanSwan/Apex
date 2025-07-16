/**
 * Theme Exporter - Advanced Theme Export/Import Functionality
 * Extracted from ThemeBuilder for better modularity
 * Production-ready export/import with multiple formats and validation
 */

import { 
  EXPORT_FORMATS,
  CSS_VARIABLES,
  generateCSSVariables,
  ExportFormatType
} from '../constants/themeConstants';
import { ThemeSettings } from '../../../types/reports';

/**
 * Import options interface
 */
export interface ImportOptions {
  validateSettings?: boolean;
  autoCorrect?: boolean;
  preserveCustomCSS?: boolean;
  preserveImages?: boolean;
}

/**
 * Export options interface
 */
export interface ExportOptions {
  filename?: string;
  includeImages?: boolean;
  compressImages?: boolean;
  includeMetadata?: boolean;
  validateBeforeExport?: boolean;
}

/**
 * Extended theme settings for export/import
 */
export interface ExtendedThemeSettings extends ThemeSettings {
  companyLogo?: string;
  clientLogo?: string;
  headerImage?: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
  reportTitle?: string;
  gradientDirection?: 'linear' | 'radial';
  gradientAngle?: number;
  enableGradient?: boolean;
  shadowIntensity?: number;
  borderRadius?: number;
  textShadow?: boolean;
  cardStyle?: 'modern' | 'classic' | 'minimal' | 'luxury';
  animationsEnabled?: boolean;
  darkMode?: boolean;
  customCSS?: string;
}

/**
 * Export result interface
 */
export interface ExportResult {
  success: boolean;
  data?: string;
  filename?: string;
  mimeType?: string;
  error?: string;
  metadata?: ExportMetadata;
}

/**
 * Import result interface
 */
export interface ImportResult {
  success: boolean;
  settings?: ExtendedThemeSettings;
  error?: string;
  warnings?: string[];
  metadata?: ImportMetadata;
}

/**
 * Export metadata
 */
export interface ExportMetadata {
  format: ExportFormatType;
  version: string;
  timestamp: string;
  fileSize: number;
  checksum?: string;
  author?: string;
  description?: string;
}

/**
 * Import metadata
 */
export interface ImportMetadata {
  format: ExportFormatType;
  version: string;
  timestamp: string;
  author?: string;
  description?: string;
  isUpgrade?: boolean;
  isDowngrade?: boolean;
}

/**
 * Theme package interface for comprehensive exports
 */
export interface ThemePackage {
  metadata: {
    name: string;
    version: string;
    author?: string;
    description?: string;
    created: string;
    modified: string;
    tags?: string[];
    category?: string;
  };
  theme: ExtendedThemeSettings;
  assets?: {
    images: { [key: string]: string };
    fonts?: { [key: string]: string };
  };
  customization?: {
    variables: { [key: string]: string };
    mixins?: string[];
    utilities?: string[];
  };
}

/**
 * Theme exporter class
 */
export class ThemeExporter {
  private readonly version = '1.0.0';
  private readonly supportedFormats = Object.values(EXPORT_FORMATS);

  /**
   * Export theme settings to specified format
   */
  async exportTheme(
    settings: ExtendedThemeSettings,
    format: ExportFormatType,
    options: {
      filename?: string;
      includeAssets?: boolean;
      includeMetadata?: boolean;
      compress?: boolean;
      author?: string;
      description?: string;
    } = {}
  ): Promise<ExportResult> {
    try {
      if (!this.supportedFormats.includes(format)) {
        return {
          success: false,
          error: `Unsupported export format: ${format}`
        };
      }

      const timestamp = new Date().toISOString();
      let data: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case EXPORT_FORMATS.JSON:
          const jsonResult = await this.exportToJSON(settings, options);
          data = jsonResult.data;
          filename = options.filename || `theme-${Date.now()}.json`;
          mimeType = 'application/json';
          break;

        case EXPORT_FORMATS.CSS:
          data = this.exportToCSS(settings);
          filename = options.filename || `theme-${Date.now()}.css`;
          mimeType = 'text/css';
          break;

        case EXPORT_FORMATS.SCSS:
          data = this.exportToSCSS(settings);
          filename = options.filename || `theme-${Date.now()}.scss`;
          mimeType = 'text/scss';
          break;

        case EXPORT_FORMATS.THEME_OBJECT:
          data = this.exportToThemeObject(settings);
          filename = options.filename || `theme-${Date.now()}.js`;
          mimeType = 'text/javascript';
          break;

        default:
          return {
            success: false,
            error: `Export format not implemented: ${format}`
          };
      }

      const metadata: ExportMetadata = {
        format,
        version: this.version,
        timestamp,
        fileSize: new Blob([data]).size,
        author: options.author,
        description: options.description
      };

      return {
        success: true,
        data,
        filename,
        mimeType,
        metadata
      };

    } catch (error) {
      return {
        success: false,
        error: `Export failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Import theme settings from various formats
   */
  async importTheme(
    data: string,
    format: ExportFormatType,
    options: {
      validateSettings?: boolean;
      autoCorrect?: boolean;
      preserveAssets?: boolean;
    } = {}
  ): Promise<ImportResult> {
    try {
      if (!this.supportedFormats.includes(format)) {
        return {
          success: false,
          error: `Unsupported import format: ${format}`
        };
      }

      let settings: ExtendedThemeSettings;
      let metadata: ImportMetadata | undefined;
      const warnings: string[] = [];

      switch (format) {
        case EXPORT_FORMATS.JSON:
          const jsonResult = this.importFromJSON(data);
          settings = jsonResult.settings;
          metadata = jsonResult.metadata;
          if (jsonResult.warnings) {
            warnings.push(...jsonResult.warnings);
          }
          break;

        case EXPORT_FORMATS.CSS:
          settings = this.importFromCSS(data);
          break;

        case EXPORT_FORMATS.SCSS:
          settings = this.importFromSCSS(data);
          break;

        case EXPORT_FORMATS.THEME_OBJECT:
          settings = this.importFromThemeObject(data);
          break;

        default:
          return {
            success: false,
            error: `Import format not implemented: ${format}`
          };
      }

      // Validate settings if requested
      if (options.validateSettings) {
        const validation = this.validateImportedSettings(settings);
        if (!validation.isValid) {
          if (options.autoCorrect) {
            settings = this.autoCorrectSettings(settings);
            warnings.push('Some settings were automatically corrected');
          } else {
            return {
              success: false,
              error: `Invalid settings: ${validation.errors.join(', ')}`
            };
          }
        }
        if (validation.warnings.length > 0) {
          warnings.push(...validation.warnings);
        }
      }

      return {
        success: true,
        settings,
        warnings: warnings.length > 0 ? warnings : undefined,
        metadata
      };

    } catch (error) {
      return {
        success: false,
        error: `Import failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Create a comprehensive theme package
   */
  async createThemePackage(
    settings: ExtendedThemeSettings,
    metadata: {
      name: string;
      author?: string;
      description?: string;
      tags?: string[];
      category?: string;
    }
  ): Promise<ExportResult> {
    try {
      const themePackage: ThemePackage = {
        metadata: {
          ...metadata,
          version: this.version,
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        },
        theme: this.sanitizeSettingsForExport(settings),
        assets: {
          images: this.extractImageAssets(settings)
        },
        customization: {
          variables: this.extractCSSVariables(settings)
        }
      };

      const data = JSON.stringify(themePackage, null, 2);
      const filename = `${metadata.name.replace(/[^a-zA-Z0-9]/g, '_')}-theme-package.json`;

      return {
        success: true,
        data,
        filename,
        mimeType: 'application/json',
        metadata: {
          format: EXPORT_FORMATS.JSON,
          version: this.version,
          timestamp: themePackage.metadata.created,
          fileSize: new Blob([data]).size,
          author: metadata.author,
          description: metadata.description
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Theme package creation failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Extract theme package
   */
  async extractThemePackage(data: string): Promise<ImportResult> {
    try {
      const packageData: ThemePackage = JSON.parse(data);

      if (!packageData.theme || !packageData.metadata) {
        return {
          success: false,
          error: 'Invalid theme package format'
        };
      }

      const metadata: ImportMetadata = {
        format: EXPORT_FORMATS.JSON,
        version: packageData.metadata.version,
        timestamp: packageData.metadata.created,
        author: packageData.metadata.author,
        description: packageData.metadata.description
      };

      return {
        success: true,
        settings: packageData.theme,
        metadata
      };

    } catch (error) {
      return {
        success: false,
        error: `Theme package extraction failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Download exported theme
   */
  downloadTheme(exportResult: ExportResult): void {
    if (!exportResult.success || !exportResult.data || !exportResult.filename) {
      throw new Error('Invalid export result for download');
    }

    const blob = new Blob([exportResult.data], { 
      type: exportResult.mimeType || 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = exportResult.filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Private export methods
   */
  private async exportToJSON(
    settings: ExtendedThemeSettings,
    options: any
  ): Promise<{ data: string }> {
    const exportData = {
      format: 'apex-ai-theme',
      version: this.version,
      exported: new Date().toISOString(),
      author: options.author,
      description: options.description,
      settings: this.sanitizeSettingsForExport(settings)
    };

    if (options.includeAssets) {
      (exportData as any).assets = {
        images: this.extractImageAssets(settings)
      };
    }

    return {
      data: JSON.stringify(exportData, null, 2)
    };
  }

  private exportToCSS(settings: ExtendedThemeSettings): string {
    const variables = generateCSSVariables(settings);
    const customCSS = settings.customCSS || '';

    return `
/* Apex AI Theme CSS Export */
/* Generated: ${new Date().toISOString()} */

:root {
${variables}
}

/* Base theme styles */
.apex-theme {
  font-family: var(${CSS_VARIABLES.FONT_FAMILY});
  background-color: var(${CSS_VARIABLES.SECONDARY_COLOR});
  color: var(${CSS_VARIABLES.PRIMARY_COLOR});
}

.apex-theme .accent {
  color: var(${CSS_VARIABLES.ACCENT_COLOR});
}

.apex-theme .card {
  border-radius: var(${CSS_VARIABLES.BORDER_RADIUS});
  box-shadow: 0 4px calc(16px * var(${CSS_VARIABLES.SHADOW_INTENSITY})) rgba(0, 0, 0, 0.1);
}

${customCSS ? `\n/* Custom CSS */\n${customCSS}` : ''}
    `.trim();
  }

  private exportToSCSS(settings: ExtendedThemeSettings): string {
    const variables = this.generateSCSSVariables(settings);
    const mixins = this.generateSCSSMixins(settings);
    const customCSS = settings.customCSS || '';

    return `
// Apex AI Theme SCSS Export
// Generated: ${new Date().toISOString()}

${variables}

${mixins}

// Base theme styles
.apex-theme {
  font-family: $font-family;
  background-color: $secondary-color;
  color: $primary-color;

  .accent {
    color: $accent-color;
  }

  .card {
    border-radius: $border-radius;
    box-shadow: 0 4px #{16px * $shadow-intensity} rgba(0, 0, 0, 0.1);
    
    @include card-style($card-style);
  }
}

${customCSS ? `\n// Custom CSS\n${customCSS}` : ''}
    `.trim();
  }

  private exportToThemeObject(settings: ExtendedThemeSettings): string {
    const themeObject = {
      colors: {
        primary: settings.primaryColor,
        secondary: settings.secondaryColor,
        accent: settings.accentColor
      },
      typography: {
        fontFamily: settings.fontFamily
      },
      layout: {
        borderRadius: settings.borderRadius,
        shadowIntensity: settings.shadowIntensity,
        cardStyle: settings.cardStyle
      },
      effects: {
        enableGradient: settings.enableGradient,
        gradientAngle: settings.gradientAngle,
        textShadow: settings.textShadow,
        animationsEnabled: settings.animationsEnabled
      },
      media: {
        backgroundOpacity: settings.backgroundOpacity
      }
    };

    return `
// Apex AI Theme Object Export
// Generated: ${new Date().toISOString()}

export const apexTheme = ${JSON.stringify(themeObject, null, 2)};

export default apexTheme;
    `.trim();
  }

  /**
   * Private import methods
   */
  private importFromJSON(data: string): {
    settings: ExtendedThemeSettings;
    metadata?: ImportMetadata;
    warnings?: string[];
  } {
    const parsed = JSON.parse(data);
    const warnings: string[] = [];

    // Handle different JSON formats
    let settings: ExtendedThemeSettings;
    let metadata: ImportMetadata | undefined;

    if (parsed.format === 'apex-ai-theme' && parsed.settings) {
      // Native format
      settings = parsed.settings;
      metadata = {
        format: EXPORT_FORMATS.JSON,
        version: parsed.version || '1.0.0',
        timestamp: parsed.exported,
        author: parsed.author,
        description: parsed.description
      };
    } else if (parsed.primaryColor && parsed.secondaryColor) {
      // Direct settings object
      settings = parsed;
      warnings.push('Imported legacy format, some features may not be available');
    } else {
      throw new Error('Unrecognized JSON format');
    }

    return { settings, metadata, warnings };
  }

  private importFromCSS(data: string): ExtendedThemeSettings {
    const settings: ExtendedThemeSettings = {
      backgroundOpacity: 0.7
    };

    // Extract CSS variables
    const variableRegex = /--([^:]+):\s*([^;]+);/g;
    let match;

    while ((match = variableRegex.exec(data)) !== null) {
      const [, name, value] = match;
      const cleanValue = value.trim();

      switch (name) {
        case 'primary-color':
          settings.primaryColor = cleanValue;
          break;
        case 'secondary-color':
          settings.secondaryColor = cleanValue;
          break;
        case 'accent-color':
          settings.accentColor = cleanValue;
          break;
        case 'font-family':
          settings.fontFamily = cleanValue.replace(/"/g, '');
          break;
        case 'border-radius':
          settings.borderRadius = parseInt(cleanValue.replace('px', ''));
          break;
        case 'shadow-intensity':
          settings.shadowIntensity = parseFloat(cleanValue);
          break;
      }
    }

    // Extract custom CSS (everything after variables)
    const customCSSMatch = data.match(/\/\* Custom CSS \*\/\s*(.*)/s);
    if (customCSSMatch) {
      settings.customCSS = customCSSMatch[1].trim();
    }

    return settings;
  }

  private importFromSCSS(data: string): ExtendedThemeSettings {
    const settings: ExtendedThemeSettings = {
      backgroundOpacity: 0.7
    };

    // Extract SCSS variables
    const variableRegex = /\$([^:]+):\s*([^;]+);/g;
    let match;

    while ((match = variableRegex.exec(data)) !== null) {
      const [, name, value] = match;
      const cleanValue = value.trim();

      switch (name) {
        case 'primary-color':
          settings.primaryColor = cleanValue;
          break;
        case 'secondary-color':
          settings.secondaryColor = cleanValue;
          break;
        case 'accent-color':
          settings.accentColor = cleanValue;
          break;
        case 'font-family':
          settings.fontFamily = cleanValue.replace(/"/g, '');
          break;
        case 'border-radius':
          settings.borderRadius = parseInt(cleanValue.replace('px', ''));
          break;
        case 'shadow-intensity':
          settings.shadowIntensity = parseFloat(cleanValue);
          break;
      }
    }

    return settings;
  }

  private importFromThemeObject(data: string): ExtendedThemeSettings {
    // Extract theme object from JavaScript
    const objectMatch = data.match(/export\s+const\s+\w+\s*=\s*({.*?});/s);
    if (!objectMatch) {
      throw new Error('Could not extract theme object from JavaScript');
    }

    const themeObject = eval(`(${objectMatch[1]})`);
    
    return {
      primaryColor: themeObject.colors?.primary,
      secondaryColor: themeObject.colors?.secondary,
      accentColor: themeObject.colors?.accent,
      fontFamily: themeObject.typography?.fontFamily,
      borderRadius: themeObject.layout?.borderRadius,
      shadowIntensity: themeObject.layout?.shadowIntensity,
      cardStyle: themeObject.layout?.cardStyle,
      enableGradient: themeObject.effects?.enableGradient,
      gradientAngle: themeObject.effects?.gradientAngle,
      textShadow: themeObject.effects?.textShadow,
      animationsEnabled: themeObject.effects?.animationsEnabled,
      backgroundOpacity: themeObject.media?.backgroundOpacity || 0.7
    };
  }

  /**
   * Utility methods
   */
  private sanitizeSettingsForExport(settings: ExtendedThemeSettings): ExtendedThemeSettings {
    const sanitized = { ...settings };
    
    // Remove potentially sensitive data
    // (In this case, we keep all settings but could filter if needed)
    
    return sanitized;
  }

  private extractImageAssets(settings: ExtendedThemeSettings): { [key: string]: string } {
    const assets: { [key: string]: string } = {};
    
    if (settings.companyLogo) assets.companyLogo = settings.companyLogo;
    if (settings.clientLogo) assets.clientLogo = settings.clientLogo;
    if (settings.headerImage) assets.headerImage = settings.headerImage;
    if (settings.backgroundImage) assets.backgroundImage = settings.backgroundImage;
    
    return assets;
  }

  private extractCSSVariables(settings: ExtendedThemeSettings): { [key: string]: string } {
    return {
      'primary-color': settings.primaryColor || '',
      'secondary-color': settings.secondaryColor || '',
      'accent-color': settings.accentColor || '',
      'font-family': settings.fontFamily || '',
      'border-radius': `${settings.borderRadius || 12}px`,
      'shadow-intensity': `${settings.shadowIntensity || 1}`,
      'background-opacity': `${settings.backgroundOpacity || 0.7}`
    };
  }

  private generateSCSSVariables(settings: ExtendedThemeSettings): string {
    return `
// Theme Variables
$primary-color: ${settings.primaryColor || '#FFFFFF'};
$secondary-color: ${settings.secondaryColor || '#1A1A1A'};
$accent-color: ${settings.accentColor || '#FFD700'};
$font-family: ${settings.fontFamily || 'Inter, sans-serif'};
$border-radius: ${settings.borderRadius || 12}px;
$shadow-intensity: ${settings.shadowIntensity || 1};
$background-opacity: ${settings.backgroundOpacity || 0.7};
$card-style: ${settings.cardStyle || 'modern'};
    `.trim();
  }

  private generateSCSSMixins(settings: ExtendedThemeSettings): string {
    return `
// Theme Mixins
@mixin card-style($style: modern) {
  @if $style == luxury {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 255, 255, 0.05));
    border: 2px solid $accent-color;
  } @else if $style == minimal {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
  } @else {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.2);
  }
}

@mixin theme-gradient($angle: 135deg) {
  background: linear-gradient(#{$angle}, $primary-color, #{$secondary-color}20);
}
    `.trim();
  }

  private validateImportedSettings(settings: ExtendedThemeSettings): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!settings.primaryColor) errors.push('Primary color is required');
    if (!settings.secondaryColor) errors.push('Secondary color is required');
    if (!settings.accentColor) errors.push('Accent color is required');

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private autoCorrectSettings(settings: ExtendedThemeSettings): ExtendedThemeSettings {
    return {
      ...settings,
      primaryColor: settings.primaryColor || '#FFFFFF',
      secondaryColor: settings.secondaryColor || '#1A1A1A',
      accentColor: settings.accentColor || '#FFD700',
      fontFamily: settings.fontFamily || 'Inter, sans-serif',
      backgroundOpacity: settings.backgroundOpacity || 0.7,
      borderRadius: settings.borderRadius || 12,
      shadowIntensity: settings.shadowIntensity || 1
    };
  }
}

// Export singleton instance
export const themeExporter = new ThemeExporter();

/**
 * Convenience wrapper functions for easier importing
 * These provide direct access to themeExporter methods
 */

/**
 * Export theme with specified format
 */
export const exportTheme = async (
  settings: ExtendedThemeSettings,
  format: ExportFormatType,
  options?: ExportOptions
): Promise<ExportResult> => {
  return themeExporter.exportTheme(settings, format, options);
};

/**
 * Import theme from data
 */
export const importTheme = async (
  data: string,
  format: ExportFormatType,
  options?: ImportOptions
): Promise<ImportResult> => {
  return themeExporter.importTheme(data, format, options);
};

/**
 * Download theme file
 */
export const downloadTheme = (exportResult: ExportResult): void => {
  return themeExporter.downloadTheme(exportResult);
};

/**
 * Create theme package
 */
export const createThemePackage = (
  settings: ExtendedThemeSettings,
  metadata: any
): ThemePackage => {
  return themeExporter.createThemePackage(settings, metadata);
};

/**
 * Validate theme package
 */
export const validateThemePackage = (packageData: string) => {
  return themeExporter.validateThemePackage(packageData);
};

/**
 * Utility functions for theme export/import
 */
export const exportUtils = {
  /**
   * Quick export to JSON
   */
  exportJSON: async (settings: ExtendedThemeSettings, filename?: string) => {
    return themeExporter.exportTheme(settings, EXPORT_FORMATS.JSON, { filename });
  },

  /**
   * Quick export to CSS
   */
  exportCSS: async (settings: ExtendedThemeSettings, filename?: string) => {
    return themeExporter.exportTheme(settings, EXPORT_FORMATS.CSS, { filename });
  },

  /**
   * Quick import from JSON
   */
  importJSON: async (data: string) => {
    return themeExporter.importTheme(data, EXPORT_FORMATS.JSON, { validateSettings: true });
  },

  /**
   * Download theme file
   */
  download: (exportResult: ExportResult) => {
    themeExporter.downloadTheme(exportResult);
  }
};
