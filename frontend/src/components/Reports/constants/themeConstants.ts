/**
 * Theme Constants - Theme Presets, Animations, and Configuration Values
 * Extracted from ThemeBuilder for better modularity
 * Production-ready constants for theme customization
 * ✅ FIXED: Removed all duplicate definitions
 */

import { keyframes } from 'styled-components';

// === ANIMATION KEYFRAMES ===
export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const slideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

export const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
`;

export const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

export const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.7); }
  100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.3); }
`;

// === THEME TAB DEFINITIONS ===
export const THEME_TABS = {
  PRESETS: 'presets',
  COLORS: 'colors',
  LAYOUT: 'layout',
  MEDIA: 'media',
  EFFECTS: 'effects',
  ADVANCED: 'advanced'
} as const;

export type ThemeTabType = typeof THEME_TABS[keyof typeof THEME_TABS];

// === CARD STYLE TYPES ===
export const CARD_STYLES = {
  MODERN: 'modern',
  CLASSIC: 'classic',
  MINIMAL: 'minimal',
  LUXURY: 'luxury'
} as const;

export type CardStyleType = typeof CARD_STYLES[keyof typeof CARD_STYLES];

// === GRADIENT DIRECTIONS ===
export const GRADIENT_DIRECTIONS = {
  LINEAR: 'linear',
  RADIAL: 'radial'
} as const;

export type GradientDirectionType = typeof GRADIENT_DIRECTIONS[keyof typeof GRADIENT_DIRECTIONS];

// === FONT FAMILIES ===
export const FONT_FAMILIES = [
  { value: 'Inter, sans-serif', label: 'Inter (Modern)' },
  { value: 'Arial, sans-serif', label: 'Arial (Standard)' },
  { value: 'Georgia, serif', label: 'Georgia (Traditional)' },
  { value: 'Roboto, sans-serif', label: 'Roboto (Clean)' },
  { value: 'Verdana, sans-serif', label: 'Verdana (Readable)' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica (Professional)' },
  { value: 'Times New Roman, serif', label: 'Times New Roman (Formal)' },
  { value: 'Playfair Display, serif', label: 'Playfair Display (Elegant)' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat (Contemporary)' },
  { value: 'Source Sans Pro, sans-serif', label: 'Source Sans Pro (Technical)' }
] as const;

// === THEME PRESETS ===
export interface ThemePreset {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  backgroundImage?: string;
  cardStyle: CardStyleType;
  enableGradient: boolean;
  gradientDirection?: string;
  shadowIntensity: number;
  borderRadius: number;
  textShadow?: boolean;
  animationsEnabled?: boolean;
  darkMode?: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Professional Dark',
    primaryColor: '#FFFFFF',
    secondaryColor: '#1A1A1A',
    accentColor: '#FFD700',
    fontFamily: 'Inter, sans-serif',
    cardStyle: CARD_STYLES.MODERN,
    enableGradient: false,
    shadowIntensity: 1.2,
    borderRadius: 12,
    textShadow: false,
    animationsEnabled: true,
    darkMode: true,
  },
  {
    name: 'Luxury Gold',
    primaryColor: '#2c3e50',
    secondaryColor: '#f8f9fa',
    accentColor: '#FFD700',
    fontFamily: 'Georgia, serif',
    cardStyle: CARD_STYLES.LUXURY,
    enableGradient: true,
    gradientDirection: '135deg',
    shadowIntensity: 1.5,
    borderRadius: 16,
    textShadow: true,
    animationsEnabled: true,
    darkMode: false,
  },
  {
    name: 'Minimal Clean',
    primaryColor: '#2c3e50',
    secondaryColor: '#ffffff',
    accentColor: '#3498db',
    fontFamily: 'Helvetica, sans-serif',
    cardStyle: CARD_STYLES.MINIMAL,
    enableGradient: false,
    shadowIntensity: 0.5,
    borderRadius: 8,
    textShadow: false,
    animationsEnabled: false,
    darkMode: false,
  },
  {
    name: 'Corporate Blue',
    primaryColor: '#ffffff',
    secondaryColor: '#1e3a8a',
    accentColor: '#60a5fa',
    fontFamily: 'Arial, sans-serif',
    cardStyle: CARD_STYLES.MODERN,
    enableGradient: true,
    gradientDirection: '45deg',
    shadowIntensity: 1,
    borderRadius: 10,
    textShadow: false,
    animationsEnabled: true,
    darkMode: true,
  },
  {
    name: 'Security Red',
    primaryColor: '#f8fafc',
    secondaryColor: '#1f2937',
    accentColor: '#ef4444',
    fontFamily: 'Roboto, sans-serif',
    cardStyle: CARD_STYLES.MODERN,
    enableGradient: false,
    shadowIntensity: 1.3,
    borderRadius: 14,
    textShadow: false,
    animationsEnabled: true,
    darkMode: true,
  },
  {
    name: 'Elegant Purple',
    primaryColor: '#faf5ff',
    secondaryColor: '#4c1d95',
    accentColor: '#a855f7',
    fontFamily: 'Playfair Display, serif',
    cardStyle: CARD_STYLES.LUXURY,
    enableGradient: true,
    gradientDirection: '315deg',
    shadowIntensity: 1.4,
    borderRadius: 18,
    textShadow: true,
    animationsEnabled: true,
    darkMode: false,
  },
  {
    name: 'Tech Green',
    primaryColor: '#ecfdf5',
    secondaryColor: '#064e3b',
    accentColor: '#10b981',
    fontFamily: 'Montserrat, sans-serif',
    cardStyle: CARD_STYLES.MODERN,
    enableGradient: true,
    gradientDirection: '135deg',
    shadowIntensity: 1.1,
    borderRadius: 12,
    textShadow: false,
    animationsEnabled: true,
    darkMode: true,
  },
  {
    name: 'Executive Gray',
    primaryColor: '#f9fafb',
    secondaryColor: '#374151',
    accentColor: '#6b7280',
    fontFamily: 'Source Sans Pro, sans-serif',
    cardStyle: CARD_STYLES.CLASSIC,
    enableGradient: false,
    shadowIntensity: 0.8,
    borderRadius: 6,
    textShadow: false,
    animationsEnabled: false,
    darkMode: false,
  }
];

// === SLIDER CONFIGURATIONS ===
export const SLIDER_CONFIGS = {
  backgroundOpacity: {
    min: 0.1,
    max: 1,
    step: 0.1,
    default: 0.7
  },
  shadowIntensity: {
    min: 0,
    max: 3,
    step: 0.1,
    default: 1
  },
  borderRadius: {
    min: 0,
    max: 30,
    step: 2,
    default: 12
  },
  gradientAngle: {
    min: 0,
    max: 360,
    step: 15,
    default: 135
  }
} as const;

// === COLOR PICKER CONFIGURATION ===
export const COLOR_PICKER_CONFIG = {
  width: '100%',
  height: 50,
  borderWidth: 3,
  borderRadius: 12,
  hoverScale: 1.02,
  focusScale: 1.05,
  transitionDuration: '0.3s'
} as const;

// === MEDIA UPLOAD TYPES ===
export const MEDIA_UPLOAD_TYPES = {
  COMPANY_LOGO: 'companyLogo',
  CLIENT_LOGO: 'clientLogo',
  HEADER_IMAGE: 'headerImage',
  BACKGROUND_IMAGE: 'backgroundImage'
} as const;

export type MediaUploadType = typeof MEDIA_UPLOAD_TYPES[keyof typeof MEDIA_UPLOAD_TYPES];

// === COLLAPSIBLE SECTIONS ===
export const COLLAPSIBLE_SECTIONS = {
  BASIC: 'basic',
  ADVANCED: 'advanced',
  EFFECTS: 'effects',
  CUSTOM: 'custom'
} as const;

export type CollapsibleSectionType = typeof COLLAPSIBLE_SECTIONS[keyof typeof COLLAPSIBLE_SECTIONS];

// === ACCESSIBILITY COLORS ===
export const ACCESSIBILITY_COLORS = {
  highContrast: {
    background: '#000000',
    foreground: '#FFFFFF',
    accent: '#FFFF00'
  },
  lowContrast: {
    background: '#F5F5F5',
    foreground: '#333333',
    accent: '#0066CC'
  }
} as const;

// === EXPORT FORMATS ===
export const EXPORT_FORMATS = {
  JSON: 'json',
  CSS: 'css',
  SCSS: 'scss',
  THEME_OBJECT: 'themeObject'
} as const;

export type ExportFormatType = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS];

// === THEME BUILDER STATES ===
export const THEME_BUILDER_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SAVING: 'saving',
  EXPORTING: 'exporting',
  ERROR: 'error'
} as const;

export type ThemeBuilderStateType = typeof THEME_BUILDER_STATES[keyof typeof THEME_BUILDER_STATES];

// === RESPONSIVE BREAKPOINTS ===
export const RESPONSIVE_BREAKPOINTS = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1200px'
} as const;

// === TIMING CONSTANTS ===
export const TIMING_CONSTANTS = {
  animationDuration: 300,
  hoverDelay: 150,
  colorCopyTimeout: 2000,
  debounceDelay: 500,
  autoSaveInterval: 30000
} as const;

// === VALIDATION RULES (MERGED - No Duplicates) ===
export const VALIDATION_RULES = {
  // Color validation
  colorRegex: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  
  // Theme content limits
  maxTitleLength: 100,
  maxCustomCSSLength: 10000,
  
  // File upload limits
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  
  // Numeric ranges
  minOpacity: 0,
  maxOpacity: 1,
  minBorderRadius: 0,
  maxBorderRadius: 50,
  minShadowIntensity: 0,
  maxShadowIntensity: 5,
  minBackgroundOpacity: 0,
  maxBackgroundOpacity: 1
} as const;

// === CSS VARIABLES (UNIFIED - Prefixed for Namespace Safety) ===
export const CSS_VARIABLES = {
  PRIMARY_COLOR: '--theme-primary-color',
  SECONDARY_COLOR: '--theme-secondary-color',
  ACCENT_COLOR: '--theme-accent-color',
  FONT_FAMILY: '--theme-font-family',
  BORDER_RADIUS: '--theme-border-radius',
  SHADOW_INTENSITY: '--theme-shadow-intensity',
  BACKGROUND_OPACITY: '--theme-background-opacity'
} as const;

// === DEFAULT THEME SETTINGS (UNIFIED - Most Complete Version) ===
export const DEFAULT_THEME_SETTINGS = {
  primaryColor: '#FFFFFF',
  secondaryColor: '#1A1A1A',
  accentColor: '#FFD700',
  fontFamily: 'Inter, sans-serif',
  backgroundOpacity: 0.7,
  reportTitle: 'AI Live Monitoring Report',
  shadowIntensity: 1,
  borderRadius: 12,
  textShadow: false,
  cardStyle: 'modern' as CardStyleType,
  enableGradient: false,
  customCSS: '',
  animationsEnabled: true,
  darkMode: true,
  gradientDirection: 'linear' as GradientDirectionType,
  gradientAngle: 135
} as const;

// === ANIMATION PRESETS ===
export const ANIMATION_PRESETS = {
  NONE: 'none',
  SUBTLE: 'subtle',
  MODERATE: 'moderate',
  DYNAMIC: 'dynamic'
} as const;

export type AnimationPresetType = typeof ANIMATION_PRESETS[keyof typeof ANIMATION_PRESETS];

// === UTILITY FUNCTIONS ===
export const getPresetByName = (name: string): ThemePreset | undefined => {
  return THEME_PRESETS.find(preset => preset.name === name);
};

export const getDefaultSettings = () => ({ ...DEFAULT_THEME_SETTINGS });

export const getFontFamilyLabel = (value: string): string => {
  const font = FONT_FAMILIES.find(f => f.value === value);
  return font?.label || value;
};

export const isValidColor = (color: string): boolean => {
  return VALIDATION_RULES.colorRegex.test(color);
};

export const clampValue = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const generateCSSVariables = (settings: any): string => {
  return `
    ${CSS_VARIABLES.PRIMARY_COLOR}: ${settings.primaryColor || DEFAULT_THEME_SETTINGS.primaryColor};
    ${CSS_VARIABLES.SECONDARY_COLOR}: ${settings.secondaryColor || DEFAULT_THEME_SETTINGS.secondaryColor};
    ${CSS_VARIABLES.ACCENT_COLOR}: ${settings.accentColor || DEFAULT_THEME_SETTINGS.accentColor};
    ${CSS_VARIABLES.FONT_FAMILY}: ${settings.fontFamily || DEFAULT_THEME_SETTINGS.fontFamily};
    ${CSS_VARIABLES.BORDER_RADIUS}: ${settings.borderRadius || DEFAULT_THEME_SETTINGS.borderRadius}px;
    ${CSS_VARIABLES.SHADOW_INTENSITY}: ${settings.shadowIntensity || DEFAULT_THEME_SETTINGS.shadowIntensity};
    ${CSS_VARIABLES.BACKGROUND_OPACITY}: ${settings.backgroundOpacity || DEFAULT_THEME_SETTINGS.backgroundOpacity};
  `.trim();
};

/**
 * CONSTANTS CLEANUP SUMMARY:
 * ✅ Merged duplicate VALIDATION_RULES (theme + file validation)
 * ✅ Unified CSS_VARIABLES (using prefixed names for namespace safety)
 * ✅ Consolidated DEFAULT_THEME_SETTINGS (kept most complete version)
 * ✅ Added missing ANIMATION_PRESETS export
 * ✅ Maintained all utility functions
 * ✅ Zero duplicate definitions
 */