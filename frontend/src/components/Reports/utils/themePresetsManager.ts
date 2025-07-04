/**
 * Theme Presets Manager - Advanced Theme Preset Management
 * Extracted from ThemeBuilder for better modularity
 * Production-ready preset management with validation and persistence
 */

import { 
  THEME_PRESETS, 
  DEFAULT_THEME_SETTINGS,
  ThemePreset,
  CARD_STYLES,
  GRADIENT_DIRECTIONS,
  isValidColor,
  clampValue,
  VALIDATION_RULES
} from '../constants/themeConstants';

/**
 * Extended theme settings interface
 */
export interface ExtendedThemeSettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  companyLogo?: string;
  clientLogo?: string;
  headerImage?: string;
  backgroundImage?: string;
  backgroundOpacity: number;
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
 * Preset application result interface
 */
export interface PresetApplicationResult {
  success: boolean;
  settings: ExtendedThemeSettings;
  warnings: string[];
  errors: string[];
}

/**
 * Preset validation result interface
 */
export interface PresetValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Custom preset interface
 */
export interface CustomPreset extends ThemePreset {
  id: string;
  createdAt: string;
  modifiedAt: string;
  author?: string;
  description?: string;
  category?: 'business' | 'creative' | 'technical' | 'custom';
  tags?: string[];
}

/**
 * Preset manager class for handling theme presets
 */
export class ThemePresetsManager {
  private customPresets: CustomPreset[] = [];
  private localStorage: Storage | null = null;
  private readonly STORAGE_KEY = 'apex_ai_custom_theme_presets';

  constructor() {
    this.localStorage = typeof window !== 'undefined' ? window.localStorage : null;
    this.loadCustomPresets();
  }

  /**
   * Get all available presets (built-in + custom)
   */
  getAllPresets(): (ThemePreset | CustomPreset)[] {
    return [...THEME_PRESETS, ...this.customPresets];
  }

  /**
   * Get built-in presets only
   */
  getBuiltInPresets(): ThemePreset[] {
    return [...THEME_PRESETS];
  }

  /**
   * Get custom presets only
   */
  getCustomPresets(): CustomPreset[] {
    return [...this.customPresets];
  }

  /**
   * Find preset by name
   */
  findPresetByName(name: string): ThemePreset | CustomPreset | undefined {
    return this.getAllPresets().find(preset => preset.name === name);
  }

  /**
   * Apply preset to settings with validation
   */
  applyPreset(
    presetName: string, 
    currentSettings: ExtendedThemeSettings
  ): PresetApplicationResult {
    const preset = this.findPresetByName(presetName);
    
    if (!preset) {
      return {
        success: false,
        settings: currentSettings,
        warnings: [],
        errors: [`Preset "${presetName}" not found`]
      };
    }

    const validationResult = this.validatePreset(preset);
    if (!validationResult.isValid) {
      return {
        success: false,
        settings: currentSettings,
        warnings: validationResult.warnings,
        errors: validationResult.errors
      };
    }

    const newSettings: ExtendedThemeSettings = {
      ...currentSettings,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      fontFamily: preset.fontFamily,
      cardStyle: preset.cardStyle,
      enableGradient: preset.enableGradient,
      gradientDirection: (preset.gradientDirection as any) || 'linear',
      shadowIntensity: preset.shadowIntensity,
      borderRadius: preset.borderRadius,
      textShadow: preset.textShadow || false,
      animationsEnabled: preset.animationsEnabled !== undefined ? preset.animationsEnabled : true,
      darkMode: preset.darkMode !== undefined ? preset.darkMode : true,
    };

    // Handle background image if present
    if ('backgroundImage' in preset && preset.backgroundImage) {
      newSettings.backgroundImage = preset.backgroundImage;
    }

    return {
      success: true,
      settings: newSettings,
      warnings: validationResult.warnings,
      errors: []
    };
  }

  /**
   * Create a new custom preset from current settings
   */
  createCustomPreset(
    name: string,
    settings: ExtendedThemeSettings,
    options: {
      description?: string;
      category?: CustomPreset['category'];
      tags?: string[];
      author?: string;
    } = {}
  ): { success: boolean; preset?: CustomPreset; error?: string } {
    // Validate name
    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Preset name is required' };
    }

    if (name.length > 50) {
      return { success: false, error: 'Preset name must be 50 characters or less' };
    }

    // Check for duplicate names
    if (this.findPresetByName(name)) {
      return { success: false, error: 'A preset with this name already exists' };
    }

    // Validate settings
    const validationResult = this.validateSettings(settings);
    if (!validationResult.isValid) {
      return { success: false, error: validationResult.errors.join(', ') };
    }

    const customPreset: CustomPreset = {
      id: this.generatePresetId(),
      name: name.trim(),
      primaryColor: settings.primaryColor || DEFAULT_THEME_SETTINGS.primaryColor,
      secondaryColor: settings.secondaryColor || DEFAULT_THEME_SETTINGS.secondaryColor,
      accentColor: settings.accentColor || DEFAULT_THEME_SETTINGS.accentColor,
      fontFamily: settings.fontFamily || DEFAULT_THEME_SETTINGS.fontFamily,
      cardStyle: settings.cardStyle || DEFAULT_THEME_SETTINGS.cardStyle,
      enableGradient: settings.enableGradient || false,
      gradientDirection: settings.gradientDirection,
      shadowIntensity: settings.shadowIntensity || DEFAULT_THEME_SETTINGS.shadowIntensity,
      borderRadius: settings.borderRadius || DEFAULT_THEME_SETTINGS.borderRadius,
      textShadow: settings.textShadow || false,
      animationsEnabled: settings.animationsEnabled !== undefined ? settings.animationsEnabled : true,
      darkMode: settings.darkMode !== undefined ? settings.darkMode : true,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      description: options.description,
      category: options.category || 'custom',
      tags: options.tags || [],
      author: options.author
    };

    this.customPresets.push(customPreset);
    this.saveCustomPresets();

    return { success: true, preset: customPreset };
  }

  /**
   * Update an existing custom preset
   */
  updateCustomPreset(
    id: string,
    updates: Partial<CustomPreset>
  ): { success: boolean; preset?: CustomPreset; error?: string } {
    const index = this.customPresets.findIndex(preset => preset.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Custom preset not found' };
    }

    // Validate updates if they include settings
    if (updates.primaryColor || updates.secondaryColor || updates.accentColor) {
      const validationResult = this.validateSettings(updates as any);
      if (!validationResult.isValid) {
        return { success: false, error: validationResult.errors.join(', ') };
      }
    }

    const updatedPreset: CustomPreset = {
      ...this.customPresets[index],
      ...updates,
      modifiedAt: new Date().toISOString()
    };

    this.customPresets[index] = updatedPreset;
    this.saveCustomPresets();

    return { success: true, preset: updatedPreset };
  }

  /**
   * Delete a custom preset
   */
  deleteCustomPreset(id: string): { success: boolean; error?: string } {
    const index = this.customPresets.findIndex(preset => preset.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Custom preset not found' };
    }

    this.customPresets.splice(index, 1);
    this.saveCustomPresets();

    return { success: true };
  }

  /**
   * Export preset to JSON
   */
  exportPreset(name: string): { success: boolean; data?: string; error?: string } {
    const preset = this.findPresetByName(name);
    
    if (!preset) {
      return { success: false, error: 'Preset not found' };
    }

    try {
      const exportData = {
        ...preset,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      return { 
        success: true, 
        data: JSON.stringify(exportData, null, 2) 
      };
    } catch (error) {
      return { 
        success: false, 
        error: 'Failed to export preset: ' + (error as Error).message 
      };
    }
  }

  /**
   * Import preset from JSON
   */
  importPreset(jsonData: string): { success: boolean; preset?: CustomPreset; error?: string } {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate imported data structure
      if (!data.name || !data.primaryColor || !data.secondaryColor || !data.accentColor) {
        return { success: false, error: 'Invalid preset format' };
      }

      // Create custom preset from imported data
      return this.createCustomPreset(
        data.name,
        {
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          accentColor: data.accentColor,
          fontFamily: data.fontFamily,
          cardStyle: data.cardStyle,
          enableGradient: data.enableGradient,
          shadowIntensity: data.shadowIntensity,
          borderRadius: data.borderRadius,
          textShadow: data.textShadow,
          animationsEnabled: data.animationsEnabled,
          darkMode: data.darkMode,
          backgroundOpacity: data.backgroundOpacity || DEFAULT_THEME_SETTINGS.backgroundOpacity
        },
        {
          description: data.description,
          category: data.category,
          tags: data.tags,
          author: data.author
        }
      );
    } catch (error) {
      return { 
        success: false, 
        error: 'Failed to parse preset data: ' + (error as Error).message 
      };
    }
  }

  /**
   * Get presets by category
   */
  getPresetsByCategory(category: CustomPreset['category']): CustomPreset[] {
    return this.customPresets.filter(preset => preset.category === category);
  }

  /**
   * Search presets by name or tags
   */
  searchPresets(query: string): (ThemePreset | CustomPreset)[] {
    const lowerQuery = query.toLowerCase();
    
    return this.getAllPresets().filter(preset => {
      const nameMatch = preset.name.toLowerCase().includes(lowerQuery);
      const tagMatch = 'tags' in preset && preset.tags 
        ? preset.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        : false;
      
      return nameMatch || tagMatch;
    });
  }

  /**
   * Validate preset data
   */
  private validatePreset(preset: ThemePreset | CustomPreset): PresetValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate colors
    if (!isValidColor(preset.primaryColor)) {
      errors.push(`Invalid primary color: ${preset.primaryColor}`);
    }
    if (!isValidColor(preset.secondaryColor)) {
      errors.push(`Invalid secondary color: ${preset.secondaryColor}`);
    }
    if (!isValidColor(preset.accentColor)) {
      errors.push(`Invalid accent color: ${preset.accentColor}`);
    }

    // Validate numeric values
    if (preset.shadowIntensity < 0 || preset.shadowIntensity > 5) {
      warnings.push('Shadow intensity should be between 0 and 5');
    }
    if (preset.borderRadius < 0 || preset.borderRadius > 50) {
      warnings.push('Border radius should be between 0 and 50');
    }

    // Validate card style
    if (!Object.values(CARD_STYLES).includes(preset.cardStyle as any)) {
      errors.push(`Invalid card style: ${preset.cardStyle}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate settings object
   */
  private validateSettings(settings: Partial<ExtendedThemeSettings>): PresetValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate colors if present
    if (settings.primaryColor && !isValidColor(settings.primaryColor)) {
      errors.push(`Invalid primary color: ${settings.primaryColor}`);
    }
    if (settings.secondaryColor && !isValidColor(settings.secondaryColor)) {
      errors.push(`Invalid secondary color: ${settings.secondaryColor}`);
    }
    if (settings.accentColor && !isValidColor(settings.accentColor)) {
      errors.push(`Invalid accent color: ${settings.accentColor}`);
    }

    // Validate numeric values
    if (settings.shadowIntensity !== undefined) {
      const clamped = clampValue(settings.shadowIntensity, 0, 5);
      if (clamped !== settings.shadowIntensity) {
        warnings.push(`Shadow intensity clamped to ${clamped}`);
      }
    }

    if (settings.borderRadius !== undefined) {
      const clamped = clampValue(settings.borderRadius, 0, 50);
      if (clamped !== settings.borderRadius) {
        warnings.push(`Border radius clamped to ${clamped}`);
      }
    }

    if (settings.backgroundOpacity !== undefined) {
      const clamped = clampValue(settings.backgroundOpacity, 0, 1);
      if (clamped !== settings.backgroundOpacity) {
        warnings.push(`Background opacity clamped to ${clamped}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate unique preset ID
   */
  private generatePresetId(): string {
    return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load custom presets from localStorage
   */
  private loadCustomPresets(): void {
    if (!this.localStorage) return;

    try {
      const stored = this.localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (Array.isArray(data)) {
          this.customPresets = data.filter(preset => this.isValidCustomPreset(preset));
        }
      }
    } catch (error) {
      console.warn('Failed to load custom presets:', error);
      this.customPresets = [];
    }
  }

  /**
   * Save custom presets to localStorage
   */
  private saveCustomPresets(): void {
    if (!this.localStorage) return;

    try {
      this.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.customPresets));
    } catch (error) {
      console.error('Failed to save custom presets:', error);
    }
  }

  /**
   * Validate custom preset structure
   */
  private isValidCustomPreset(preset: any): preset is CustomPreset {
    return (
      preset &&
      typeof preset === 'object' &&
      typeof preset.id === 'string' &&
      typeof preset.name === 'string' &&
      typeof preset.primaryColor === 'string' &&
      typeof preset.secondaryColor === 'string' &&
      typeof preset.accentColor === 'string' &&
      typeof preset.createdAt === 'string'
    );
  }

  /**
   * Clear all custom presets
   */
  clearCustomPresets(): void {
    this.customPresets = [];
    this.saveCustomPresets();
  }

  /**
   * Get preset statistics
   */
  getPresetStatistics(): {
    total: number;
    builtIn: number;
    custom: number;
    byCategory: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};
    
    this.customPresets.forEach(preset => {
      const category = preset.category || 'custom';
      byCategory[category] = (byCategory[category] || 0) + 1;
    });

    return {
      total: THEME_PRESETS.length + this.customPresets.length,
      builtIn: THEME_PRESETS.length,
      custom: this.customPresets.length,
      byCategory
    };
  }
}

// Export singleton instance
export const themePresetsManager = new ThemePresetsManager();

/**
 * Utility functions for preset management
 */
export const presetUtils = {
  /**
   * Create a preset from current settings
   */
  createFromSettings: (settings: ExtendedThemeSettings, name: string) => {
    return themePresetsManager.createCustomPreset(name, settings);
  },

  /**
   * Apply preset by name
   */
  applyByName: (name: string, currentSettings: ExtendedThemeSettings) => {
    return themePresetsManager.applyPreset(name, currentSettings);
  },

  /**
   * Get all preset names
   */
  getAllNames: (): string[] => {
    return themePresetsManager.getAllPresets().map(preset => preset.name);
  },

  /**
   * Check if preset exists
   */
  exists: (name: string): boolean => {
    return themePresetsManager.findPresetByName(name) !== undefined;
  },

  /**
   * Get preset preview data
   */
  getPreviewData: (name: string) => {
    const preset = themePresetsManager.findPresetByName(name);
    if (!preset) return null;

    return {
      name: preset.name,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      cardStyle: preset.cardStyle,
      hasGradient: preset.enableGradient
    };
  }
};
