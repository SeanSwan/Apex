/**
 * Theme Validator - Comprehensive Theme Settings Validation
 * Extracted from ThemeBuilder for better modularity
 * Production-ready validation with detailed error reporting
 */

import { 
  VALIDATION_RULES,
  CARD_STYLES,
  GRADIENT_DIRECTIONS,
  FONT_FAMILIES,
  isValidColor,
  clampValue
} from '../constants/themeConstants';
import { ThemeSettings } from '../../../types/reports';

/**
 * Validation severity levels
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  field: string;
  severity: ValidationSeverity;
  message: string;
  suggestion?: string;
  correctedValue?: any;
}

/**
 * Complete validation summary
 */
export interface ValidationSummary {
  isValid: boolean;
  hasWarnings: boolean;
  hasInfo: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  info: ValidationResult[];
  correctedSettings?: Partial<ThemeSettings>;
}

/**
 * Extended theme settings for validation
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
 * Theme validator class
 */
export class ThemeValidator {
  private results: ValidationResult[] = [];

  /**
   * Validate complete theme settings
   */
  validateThemeSettings(settings: ExtendedThemeSettings): ValidationSummary {
    this.results = [];

    // Validate colors
    this.validateColors(settings);
    
    // Validate typography
    this.validateTypography(settings);
    
    // Validate layout properties
    this.validateLayout(settings);
    
    // Validate media assets
    this.validateMedia(settings);
    
    // Validate effects
    this.validateEffects(settings);
    
    // Validate custom CSS
    this.validateCustomCSS(settings);
    
    // Validate accessibility
    this.validateAccessibility(settings);

    return this.generateSummary(settings);
  }

  /**
   * Validate individual setting
   */
  validateSingleSetting(
    field: string, 
    value: any, 
    settings: ExtendedThemeSettings
  ): ValidationResult[] {
    this.results = [];

    switch (field) {
      case 'primaryColor':
      case 'secondaryColor':
      case 'accentColor':
        this.validateSingleColor(field, value);
        break;
      case 'fontFamily':
        this.validateFontFamily(value);
        break;
      case 'reportTitle':
        this.validateReportTitle(value);
        break;
      case 'backgroundOpacity':
        this.validateBackgroundOpacity(value);
        break;
      case 'shadowIntensity':
        this.validateShadowIntensity(value);
        break;
      case 'borderRadius':
        this.validateBorderRadius(value);
        break;
      case 'gradientAngle':
        this.validateGradientAngle(value);
        break;
      case 'cardStyle':
        this.validateCardStyle(value);
        break;
      case 'customCSS':
        this.validateCustomCSSContent(value);
        break;
      default:
        this.addResult(field, ValidationSeverity.INFO, 'Field validation not implemented');
    }

    return this.results.filter(r => r.field === field);
  }

  /**
   * Quick color validation
   */
  static isValidColor(color: string): boolean {
    return isValidColor(color);
  }

  /**
   * Auto-correct theme settings
   */
  autoCorrectSettings(settings: ExtendedThemeSettings): ExtendedThemeSettings {
    const corrected = { ...settings };

    // Auto-correct colors
    if (corrected.primaryColor && !isValidColor(corrected.primaryColor)) {
      corrected.primaryColor = '#FFFFFF';
    }
    if (corrected.secondaryColor && !isValidColor(corrected.secondaryColor)) {
      corrected.secondaryColor = '#1A1A1A';
    }
    if (corrected.accentColor && !isValidColor(corrected.accentColor)) {
      corrected.accentColor = '#FFD700';
    }

    // Auto-correct numeric values
    if (corrected.backgroundOpacity !== undefined) {
      corrected.backgroundOpacity = clampValue(corrected.backgroundOpacity, 0, 1);
    }
    if (corrected.shadowIntensity !== undefined) {
      corrected.shadowIntensity = clampValue(corrected.shadowIntensity, 0, 5);
    }
    if (corrected.borderRadius !== undefined) {
      corrected.borderRadius = clampValue(corrected.borderRadius, 0, 50);
    }
    if (corrected.gradientAngle !== undefined) {
      corrected.gradientAngle = clampValue(corrected.gradientAngle, 0, 360);
    }

    // Auto-correct card style
    if (corrected.cardStyle && !Object.values(CARD_STYLES).includes(corrected.cardStyle as any)) {
      corrected.cardStyle = CARD_STYLES.MODERN;
    }

    // Auto-correct font family
    if (corrected.fontFamily) {
      const validFont = FONT_FAMILIES.find(f => f.value === corrected.fontFamily);
      if (!validFont) {
        corrected.fontFamily = 'Inter, sans-serif';
      }
    }

    // Truncate long strings
    if (corrected.reportTitle && corrected.reportTitle.length > VALIDATION_RULES.maxTitleLength) {
      corrected.reportTitle = corrected.reportTitle.substring(0, VALIDATION_RULES.maxTitleLength);
    }
    if (corrected.customCSS && corrected.customCSS.length > VALIDATION_RULES.maxCustomCSSLength) {
      corrected.customCSS = corrected.customCSS.substring(0, VALIDATION_RULES.maxCustomCSSLength);
    }

    return corrected;
  }

  /**
   * Validate color contrast for accessibility
   */
  static validateColorContrast(
    foreground: string, 
    background: string
  ): { ratio: number; isAAACompliant: boolean; isAACompliant: boolean } {
    const getLuminance = (color: string): number => {
      // Simple luminance calculation
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      const gamma = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      
      return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
    };

    const fgLuminance = getLuminance(foreground);
    const bgLuminance = getLuminance(background);
    
    const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
    
    return {
      ratio: Math.round(ratio * 100) / 100,
      isAACompliant: ratio >= 4.5,
      isAAACompliant: ratio >= 7
    };
  }

  /**
   * Private validation methods
   */
  private validateColors(settings: ExtendedThemeSettings): void {
    if (settings.primaryColor) {
      this.validateSingleColor('primaryColor', settings.primaryColor);
    }
    if (settings.secondaryColor) {
      this.validateSingleColor('secondaryColor', settings.secondaryColor);
    }
    if (settings.accentColor) {
      this.validateSingleColor('accentColor', settings.accentColor);
    }

    // Validate color contrast
    if (settings.primaryColor && settings.secondaryColor) {
      const contrast = ThemeValidator.validateColorContrast(
        settings.primaryColor, 
        settings.secondaryColor
      );
      
      if (!contrast.isAACompliant) {
        this.addResult(
          'colorContrast',
          ValidationSeverity.WARNING,
          `Color contrast ratio is ${contrast.ratio}:1, which may not meet accessibility standards`,
          'Consider using colors with higher contrast for better readability'
        );
      } else if (contrast.isAAACompliant) {
        this.addResult(
          'colorContrast',
          ValidationSeverity.INFO,
          `Excellent color contrast ratio: ${contrast.ratio}:1`
        );
      }
    }
  }

  private validateSingleColor(field: string, color: string): void {
    if (!color || color.trim().length === 0) {
      this.addResult(field, ValidationSeverity.ERROR, 'Color value is required');
      return;
    }

    if (!isValidColor(color)) {
      this.addResult(
        field, 
        ValidationSeverity.ERROR, 
        `Invalid color format: ${color}`, 
        'Use hex format like #FFFFFF or #FFF',
        '#FFFFFF'
      );
      return;
    }

    // Check for potential issues
    if (color.toLowerCase() === '#ffffff' && field === 'secondaryColor') {
      this.addResult(
        field,
        ValidationSeverity.WARNING,
        'White background may not provide enough contrast in dark themes'
      );
    }

    if (color.toLowerCase() === '#000000' && field === 'primaryColor') {
      this.addResult(
        field,
        ValidationSeverity.WARNING,
        'Black text may not be visible on dark backgrounds'
      );
    }
  }

  private validateTypography(settings: ExtendedThemeSettings): void {
    if (settings.fontFamily) {
      this.validateFontFamily(settings.fontFamily);
    }

    if (settings.reportTitle) {
      this.validateReportTitle(settings.reportTitle);
    }
  }

  private validateFontFamily(fontFamily: string): void {
    if (!fontFamily || fontFamily.trim().length === 0) {
      this.addResult('fontFamily', ValidationSeverity.ERROR, 'Font family is required');
      return;
    }

    const validFont = FONT_FAMILIES.find(f => f.value === fontFamily);
    if (!validFont) {
      this.addResult(
        'fontFamily',
        ValidationSeverity.WARNING,
        `Custom font family "${fontFamily}" may not be available on all systems`,
        'Consider using a web-safe font with fallbacks'
      );
    }
  }

  private validateReportTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      this.addResult('reportTitle', ValidationSeverity.WARNING, 'Report title is empty');
      return;
    }

    if (title.length > VALIDATION_RULES.maxTitleLength) {
      this.addResult(
        'reportTitle',
        ValidationSeverity.ERROR,
        `Title exceeds maximum length of ${VALIDATION_RULES.maxTitleLength} characters`,
        'Shorten the title for better display',
        title.substring(0, VALIDATION_RULES.maxTitleLength)
      );
    }

    // Check for potentially problematic characters
    const problematicChars = /[<>\"'&]/g;
    if (problematicChars.test(title)) {
      this.addResult(
        'reportTitle',
        ValidationSeverity.WARNING,
        'Title contains characters that may cause display issues',
        'Avoid using HTML/XML special characters in titles'
      );
    }
  }

  private validateLayout(settings: ExtendedThemeSettings): void {
    if (settings.borderRadius !== undefined) {
      this.validateBorderRadius(settings.borderRadius);
    }

    if (settings.cardStyle) {
      this.validateCardStyle(settings.cardStyle);
    }

    if (settings.gradientAngle !== undefined) {
      this.validateGradientAngle(settings.gradientAngle);
    }
  }

  private validateBorderRadius(radius: number): void {
    if (radius < VALIDATION_RULES.minBorderRadius || radius > VALIDATION_RULES.maxBorderRadius) {
      this.addResult(
        'borderRadius',
        ValidationSeverity.ERROR,
        `Border radius must be between ${VALIDATION_RULES.minBorderRadius} and ${VALIDATION_RULES.maxBorderRadius}`,
        undefined,
        clampValue(radius, VALIDATION_RULES.minBorderRadius, VALIDATION_RULES.maxBorderRadius)
      );
    }

    if (radius > 30) {
      this.addResult(
        'borderRadius',
        ValidationSeverity.WARNING,
        'Very high border radius may cause display issues on small elements'
      );
    }
  }

  private validateCardStyle(style: string): void {
    if (!Object.values(CARD_STYLES).includes(style as any)) {
      this.addResult(
        'cardStyle',
        ValidationSeverity.ERROR,
        `Invalid card style: ${style}`,
        `Use one of: ${Object.values(CARD_STYLES).join(', ')}`,
        CARD_STYLES.MODERN
      );
    }
  }

  private validateGradientAngle(angle: number): void {
    if (angle < 0 || angle > 360) {
      this.addResult(
        'gradientAngle',
        ValidationSeverity.ERROR,
        'Gradient angle must be between 0 and 360 degrees',
        undefined,
        clampValue(angle, 0, 360)
      );
    }
  }

  private validateMedia(settings: ExtendedThemeSettings): void {
    if (settings.backgroundOpacity !== undefined) {
      this.validateBackgroundOpacity(settings.backgroundOpacity);
    }

    // Validate image URLs if present
    ['companyLogo', 'clientLogo', 'headerImage', 'backgroundImage'].forEach(field => {
      const value = (settings as any)[field];
      if (value) {
        this.validateImageUrl(field, value);
      }
    });
  }

  private validateBackgroundOpacity(opacity: number): void {
    if (opacity < 0 || opacity > 1) {
      this.addResult(
        'backgroundOpacity',
        ValidationSeverity.ERROR,
        'Background opacity must be between 0 and 1',
        undefined,
        clampValue(opacity, 0, 1)
      );
    }

    if (opacity < 0.3) {
      this.addResult(
        'backgroundOpacity',
        ValidationSeverity.WARNING,
        'Very low opacity may make background images too prominent'
      );
    }
  }

  private validateImageUrl(field: string, url: string): void {
    if (!url || url.trim().length === 0) return;

    // Check if it's a data URL or regular URL
    if (url.startsWith('data:')) {
      // Validate data URL format
      if (!url.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/)) {
        this.addResult(
          field,
          ValidationSeverity.WARNING,
          'Image data URL format may not be supported'
        );
      }
    } else {
      // Validate regular URL
      try {
        new URL(url);
      } catch {
        this.addResult(
          field,
          ValidationSeverity.ERROR,
          `Invalid image URL: ${url}`,
          'Provide a valid HTTP/HTTPS URL or data URL'
        );
      }
    }
  }

  private validateEffects(settings: ExtendedThemeSettings): void {
    if (settings.shadowIntensity !== undefined) {
      this.validateShadowIntensity(settings.shadowIntensity);
    }
  }

  private validateShadowIntensity(intensity: number): void {
    if (intensity < VALIDATION_RULES.minShadowIntensity || intensity > VALIDATION_RULES.maxShadowIntensity) {
      this.addResult(
        'shadowIntensity',
        ValidationSeverity.ERROR,
        `Shadow intensity must be between ${VALIDATION_RULES.minShadowIntensity} and ${VALIDATION_RULES.maxShadowIntensity}`,
        undefined,
        clampValue(intensity, VALIDATION_RULES.minShadowIntensity, VALIDATION_RULES.maxShadowIntensity)
      );
    }

    if (intensity > 3) {
      this.addResult(
        'shadowIntensity',
        ValidationSeverity.WARNING,
        'Very high shadow intensity may impact performance and readability'
      );
    }
  }

  private validateCustomCSS(settings: ExtendedThemeSettings): void {
    if (settings.customCSS) {
      this.validateCustomCSSContent(settings.customCSS);
    }
  }

  private validateCustomCSSContent(css: string): void {
    if (css.length > VALIDATION_RULES.maxCustomCSSLength) {
      this.addResult(
        'customCSS',
        ValidationSeverity.ERROR,
        `Custom CSS exceeds maximum length of ${VALIDATION_RULES.maxCustomCSSLength} characters`,
        'Optimize CSS for better performance',
        css.substring(0, VALIDATION_RULES.maxCustomCSSLength)
      );
    }

    // Check for potentially dangerous CSS
    const dangerousPatterns = [
      /javascript:/gi,
      /expression\s*\(/gi,
      /@import/gi,
      /behavior\s*:/gi
    ];

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(css)) {
        this.addResult(
          'customCSS',
          ValidationSeverity.ERROR,
          'Custom CSS contains potentially unsafe content',
          'Remove JavaScript expressions and imports'
        );
      }
    });

    // Check CSS syntax (basic)
    const braceCount = (css.match(/\{/g) || []).length - (css.match(/\}/g) || []).length;
    if (braceCount !== 0) {
      this.addResult(
        'customCSS',
        ValidationSeverity.WARNING,
        'CSS appears to have unmatched braces',
        'Check CSS syntax for missing opening or closing braces'
      );
    }
  }

  private validateAccessibility(settings: ExtendedThemeSettings): void {
    // Check animation settings for accessibility
    if (settings.animationsEnabled === true) {
      this.addResult(
        'accessibility',
        ValidationSeverity.INFO,
        'Consider providing option to disable animations for users with motion sensitivity'
      );
    }

    // Check for adequate text sizing with current font
    if (settings.fontFamily && settings.fontFamily.includes('serif')) {
      this.addResult(
        'accessibility',
        ValidationSeverity.INFO,
        'Serif fonts may be less readable at small sizes on screens'
      );
    }
  }

  private addResult(
    field: string,
    severity: ValidationSeverity,
    message: string,
    suggestion?: string,
    correctedValue?: any
  ): void {
    this.results.push({
      field,
      severity,
      message,
      suggestion,
      correctedValue
    });
  }

  private generateSummary(settings: ExtendedThemeSettings): ValidationSummary {
    const errors = this.results.filter(r => r.severity === ValidationSeverity.ERROR);
    const warnings = this.results.filter(r => r.severity === ValidationSeverity.WARNING);
    const info = this.results.filter(r => r.severity === ValidationSeverity.INFO);

    const correctedSettings: Partial<ExtendedThemeSettings> = {};
    
    this.results.forEach(result => {
      if (result.correctedValue !== undefined) {
        (correctedSettings as any)[result.field] = result.correctedValue;
      }
    });

    return {
      isValid: errors.length === 0,
      hasWarnings: warnings.length > 0,
      hasInfo: info.length > 0,
      errors,
      warnings,
      info,
      correctedSettings: Object.keys(correctedSettings).length > 0 ? correctedSettings : undefined
    };
  }
}

// Export singleton instance
export const themeValidator = new ThemeValidator();

/**
 * Convenience wrapper functions for easier importing
 * These provide direct access to themeValidator methods
 */

/**
 * Validate complete theme settings
 */
export const validateThemeSettings = (settings: ExtendedThemeSettings): ValidationSummary => {
  return themeValidator.validateThemeSettings(settings);
};

/**
 * Validate individual setting
 */
export const validateSingleSetting = (
  field: string,
  value: any,
  settings: ExtendedThemeSettings
): ValidationResult[] => {
  return themeValidator.validateSingleSetting(field, value, settings);
};

/**
 * Get validation severity for a result
 */
export const getValidationSeverity = (result: ValidationResult): ValidationSeverity => {
  return result.severity;
};

/**
 * Quick color validation
 */
export const isValidColor = (color: string): boolean => {
  return ThemeValidator.isValidColor(color);
};

/**
 * Auto-correct theme settings
 */
export const autoCorrectSettings = (settings: ExtendedThemeSettings): ExtendedThemeSettings => {
  return themeValidator.autoCorrectSettings(settings);
};

/**
 * Validate color contrast
 */
export const validateColorContrast = (foreground: string, background: string) => {
  return ThemeValidator.validateColorContrast(foreground, background);
};

/**
 * Utility functions for theme validation
 */
export const validationUtils = {
  /**
   * Quick validation for a single color
   */
  validateColor: (color: string): boolean => {
    return ThemeValidator.isValidColor(color);
  },

  /**
   * Quick validation for the most common settings
   */
  validateBasicSettings: (settings: Partial<ExtendedThemeSettings>): boolean => {
    const validator = new ThemeValidator();
    const result = validator.validateThemeSettings(settings as ExtendedThemeSettings);
    return result.isValid;
  },

  /**
   * Get validation error count
   */
  getErrorCount: (settings: ExtendedThemeSettings): number => {
    const validator = new ThemeValidator();
    const result = validator.validateThemeSettings(settings);
    return result.errors.length;
  },

  /**
   * Auto-fix common issues
   */
  autoFix: (settings: ExtendedThemeSettings): ExtendedThemeSettings => {
    return ThemeValidator.prototype.autoCorrectSettings.call(new ThemeValidator(), settings);
  },

  /**
   * Check color contrast
   */
  checkContrast: (foreground: string, background: string) => {
    return ThemeValidator.validateColorContrast(foreground, background);
  }
};
