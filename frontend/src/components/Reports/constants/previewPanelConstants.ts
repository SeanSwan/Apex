/**
 * Preview Panel Constants - Configuration and Default Values
 * Extracted from EnhancedPreviewPanel for better modularity
 * Production-ready constants for professional report preview functionality
 */

// === PREVIEW VIEW TYPES ===
export const PREVIEW_VIEW_TYPES = {
  FULL: 'full',
  PAGE1: 'page1',
  PAGE2: 'page2', 
  PAGE3: 'page3'
} as const;

export type PreviewViewType = typeof PREVIEW_VIEW_TYPES[keyof typeof PREVIEW_VIEW_TYPES];

// === SECTION TYPES ===
export const SECTION_TYPES = {
  HEADER: 'header',
  INFO: 'info',
  METRICS: 'metrics',
  CHART: 'chart',
  DAILY: 'daily',
  NOTES: 'notes',
  MEDIA: 'media',
  VIDEOS: 'videos'
} as const;

export type SectionType = typeof SECTION_TYPES[keyof typeof SECTION_TYPES];

// === SECTION VISIBILITY MAPPING ===
export const SECTION_VISIBILITY_MAP: Record<PreviewViewType, SectionType[]> = {
  [PREVIEW_VIEW_TYPES.FULL]: [
    SECTION_TYPES.HEADER,
    SECTION_TYPES.INFO,
    SECTION_TYPES.METRICS,
    SECTION_TYPES.CHART,
    SECTION_TYPES.MEDIA,
    SECTION_TYPES.DAILY,
    SECTION_TYPES.NOTES,
    SECTION_TYPES.VIDEOS
  ],
  [PREVIEW_VIEW_TYPES.PAGE1]: [
    SECTION_TYPES.HEADER,
    SECTION_TYPES.INFO,
    SECTION_TYPES.METRICS
  ],
  [PREVIEW_VIEW_TYPES.PAGE2]: [
    SECTION_TYPES.CHART,
    SECTION_TYPES.MEDIA
  ],
  [PREVIEW_VIEW_TYPES.PAGE3]: [
    SECTION_TYPES.DAILY,
    SECTION_TYPES.NOTES,
    SECTION_TYPES.VIDEOS
  ]
};

// === PDF GENERATION CONSTANTS ===
export const PDF_GENERATION_CONFIG = {
  QUALITY: {
    STANDARD: 0.8,
    COMPRESSED: 0.6,
    HIGH: 0.9
  },
  SCALE: {
    DEFAULT: 2,
    HIGH_RES: 3,
    MOBILE: 1.5
  },
  FORMATS: {
    A4: 'a4',
    LETTER: 'letter',
    LEGAL: 'legal'
  },
  ORIENTATIONS: {
    PORTRAIT: 'portrait',
    LANDSCAPE: 'landscape'
  },
  MARGINS: {
    TOP: 20,
    RIGHT: 30,
    BOTTOM: 20,
    LEFT: 30
  }
} as const;

export type PDFQualityType = keyof typeof PDF_GENERATION_CONFIG.QUALITY;
export type PDFExportType = 'standard' | 'compressed' | 'both';

// === EXPORT CONFIGURATION ===
export const EXPORT_CONFIG = {
  IMAGE: {
    FORMAT: 'image/png',
    QUALITY: 0.9,
    SCALE: 2
  },
  PDF: {
    DEFAULT_FILENAME: 'Security-Report',
    DATE_FORMAT: 'yyyyMMdd',
    WATERMARK_REMOVAL: true,
    LOGGING: false,
    USE_CORS: true
  },
  CANVAS: {
    SCALE: 2,
    LOGGING: false,
    USE_CORS: true,
    WINDOW_WIDTH: 1200,
    ALLOW_TAINT: false
  }
} as const;

// === LOADING STATES ===
export const LOADING_STATES = {
  IDLE: 'idle',
  GENERATING_PDF: 'generating_pdf',
  EXPORTING_IMAGE: 'exporting_image',
  PROCESSING: 'processing',
  ERROR: 'error',
  SUCCESS: 'success'
} as const;

export type LoadingState = typeof LOADING_STATES[keyof typeof LOADING_STATES];

// === SECURITY CODE STYLING ===
export const SECURITY_CODE_STYLES = {
  'Code 4': {
    backgroundColor: 'rgba(209, 250, 229, 0.2)',
    color: '#2ecc71',
    priority: 4
  },
  'Code 3': {
    backgroundColor: 'rgba(255, 249, 196, 0.2)',
    color: '#f1c40f',
    priority: 3
  },
  'Code 2': {
    backgroundColor: 'rgba(255, 204, 188, 0.2)',
    color: '#e67e22',
    priority: 2
  },
  'Code 1': {
    backgroundColor: 'rgba(254, 202, 202, 0.2)',
    color: '#e74c3c',
    priority: 1
  }
} as const;

export type SecurityCodeType = keyof typeof SECURITY_CODE_STYLES;

// === BACKGROUND TEXTURE POSITIONS ===
export const TEXTURE_POSITIONS = [
  'top left',
  'center', 
  'top right',
  'bottom left',
  'bottom right',
  '25% 75%',
  '75% 25%',
  '30% 70%',
  '70% 30%',
  '20% 20%',
  '15% 85%',
  '45% 55%',
  '10% 90%',
  '35% 65%',
  '65% 35%',
  '90% 10%',
  '20% 40%',
  '80% 60%',
  '40% 20%',
  '60% 40%'
] as const;

// === MARBLE TEXTURE CONFIGURATION ===
export const MARBLE_TEXTURE_CONFIG = {
  BASE_SIZE: 120,
  SIZE_VARIATION: 60,
  OPACITY_BASE: 0.6,
  OPACITY_VARIATION: 0.15,
  POSITIONS: TEXTURE_POSITIONS
} as const;

// === RESPONSIVE BREAKPOINTS ===
export const RESPONSIVE_BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 640,
  DESKTOP: 768,
  LARGE: 1024
} as const;

// === ANIMATION CONFIGURATIONS ===
export const ANIMATION_CONFIG = {
  SPIN_DURATION: '2s',
  TRANSITION_DURATION: '0.2s',
  HOVER_TRANSFORM: 'translateY(-2px)',
  OPACITY_TRANSITION: '0.3s'
} as const;

// === DEFAULT FALLBACK VALUES ===
export const FALLBACK_VALUES = {
  CLIENT_NAME: 'Client Name',
  PROPERTY_NAME: 'Property',
  LOCATION: 'N/A',
  CAMERA_TYPE: 'Standard IP',
  REPORT_TITLE: 'AI Live Monitoring Report',
  SECURITY_EMAIL: 'it@defenseic.com',
  SECURITY_SIGNATURE: 'Sean Swan',
  FONT_FAMILY: 'inherit',
  BACKGROUND_OPACITY: 0.7
} as const;

// === GRID CONFIGURATIONS ===
export const GRID_CONFIG = {
  PROPERTY_INFO: {
    COLUMNS: {
      DESKTOP: 'repeat(3, 1fr)',
      TABLET: 'repeat(2, 1fr)', 
      MOBILE: '1fr'
    },
    GAP: '1rem'
  },
  METRICS: {
    COLUMNS: {
      DESKTOP: 'repeat(4, 1fr)',
      TABLET: 'repeat(2, 1fr)',
      MOBILE: 'repeat(2, 1fr)'
    },
    GAP: {
      DESKTOP: '1rem',
      MOBILE: '0.75rem'
    }
  },
  MEDIA: {
    COLUMNS: {
      DESKTOP: 'repeat(auto-fill, minmax(200px, 1fr))',
      TABLET: 'repeat(auto-fill, minmax(150px, 1fr))',
      MOBILE: 'repeat(2, 1fr)'
    },
    GAP: {
      DESKTOP: '1rem',
      MOBILE: '0.5rem'
    }
  }
} as const;

// === UTILITY FUNCTIONS ===
export const getRandomTexturePosition = (): string => {
  const positions = MARBLE_TEXTURE_CONFIG.POSITIONS;
  return positions[Math.floor(Math.random() * positions.length)];
};

export const getRandomTextureSize = (): string => {
  const base = MARBLE_TEXTURE_CONFIG.BASE_SIZE;
  const variation = MARBLE_TEXTURE_CONFIG.SIZE_VARIATION;
  return `${base + Math.random() * variation}%`;
};

export const getRandomOpacity = (): number => {
  const base = MARBLE_TEXTURE_CONFIG.OPACITY_BASE;
  const variation = MARBLE_TEXTURE_CONFIG.OPACITY_VARIATION;
  return base + Math.random() * variation;
};

export const getSecurityCodeStyle = (code: string) => {
  return SECURITY_CODE_STYLES[code as SecurityCodeType] || SECURITY_CODE_STYLES['Code 4'];
};

export const shouldShowSection = (
  section: SectionType, 
  previewView: PreviewViewType
): boolean => {
  if (previewView === PREVIEW_VIEW_TYPES.FULL) return true;
  return SECTION_VISIBILITY_MAP[previewView].includes(section);
};

// === DATE FORMATTING ===
export const DATE_FORMAT_PATTERNS = {
  DISPLAY: 'MMM d, yyyy',
  FILE_NAME: 'yyyyMMdd',
  ISO: 'yyyy-MM-dd',
  READABLE: 'MMMM d, yyyy'
} as const;

// === THEME INTEGRATION ===
export const THEME_DEFAULTS = {
  PRIMARY_COLOR: '#FFFFFF',
  SECONDARY_COLOR: '#1A1A1A',
  ACCENT_COLOR: '#FFD700',
  FONT_FAMILY: 'inherit',
  BACKGROUND_OPACITY: 0.7
} as const;

// === ERROR MESSAGES ===
export const ERROR_MESSAGES = {
  PDF_GENERATION_FAILED: 'PDF generation failed. Please try again.',
  INVALID_CHART_FORMAT: 'Chart data format is invalid.',
  EXPORT_FAILED: 'Export operation failed. Please try again.',
  PREVIEW_NOT_AVAILABLE: 'Preview is not available for this component.',
  MISSING_DATA: 'Required data is missing for preview generation.'
} as const;

// === SUCCESS MESSAGES ===
export const SUCCESS_MESSAGES = {
  PDF_GENERATED: 'PDF report generated successfully!',
  IMAGE_EXPORTED: 'Preview image exported successfully!',
  BOTH_EXPORTED: 'Both standard and compressed PDFs generated successfully!'
} as const;

// === COMPONENT CONFIGURATIONS ===
export const COMPONENT_CONFIG = {
  HEADER: {
    MIN_HEIGHT: {
      DESKTOP: '150px',
      MOBILE: '120px'
    },
    PADDING: {
      DESKTOP: '1.5rem',
      MOBILE: '0.75rem'
    }
  },
  LOGO: {
    MAX_HEIGHT: {
      DESKTOP: '80px',
      MOBILE: '60px'
    },
    MAX_WIDTH: {
      DESKTOP: '30%',
      MOBILE: '25%'
    }
  },
  METRICS_CARD: {
    HEIGHT: '100%',
    PADDING: {
      DESKTOP: '1.25rem',
      MOBILE: '0.75rem'
    }
  },
  MEDIA_ITEM: {
    HEIGHT: {
      DESKTOP: '150px',
      MOBILE: '120px'
    }
  }
} as const;

export default {
  PREVIEW_VIEW_TYPES,
  SECTION_TYPES,
  SECTION_VISIBILITY_MAP,
  PDF_GENERATION_CONFIG,
  EXPORT_CONFIG,
  LOADING_STATES,
  SECURITY_CODE_STYLES,
  MARBLE_TEXTURE_CONFIG,
  RESPONSIVE_BREAKPOINTS,
  ANIMATION_CONFIG,
  FALLBACK_VALUES,
  GRID_CONFIG,
  DATE_FORMAT_PATTERNS,
  THEME_DEFAULTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  COMPONENT_CONFIG,
  // Utility functions
  getRandomTexturePosition,
  getRandomTextureSize,
  getRandomOpacity,
  getSecurityCodeStyle,
  shouldShowSection
};
