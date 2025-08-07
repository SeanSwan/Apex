// APEX AI STYLED-COMPONENTS THEME
// Migrated from TailwindCSS configuration to preserve design tokens
// Enhanced with dynamic font system support

export const theme = {
  // Color System (Preserved from TailwindCSS config)
  colors: {
    // Semantic colors (shadcn/ui compatible)
    border: 'hsl(214.3 31.8% 91.4%)',
    input: 'hsl(214.3 31.8% 91.4%)',
    ring: 'hsl(222.2 84% 4.9%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)',
    
    primary: {
      DEFAULT: 'hsl(222.2 47.4% 11.2%)',
      foreground: 'hsl(210 40% 98%)',
    },
    
    secondary: {
      DEFAULT: 'hsl(210 40% 96%)',
      foreground: 'hsl(222.2 84% 4.9%)',
    },
    
    destructive: {
      DEFAULT: 'hsl(0 84.2% 60.2%)',
      foreground: 'hsl(210 40% 98%)',
    },
    
    muted: {
      DEFAULT: 'hsl(210 40% 96%)',
      foreground: 'hsl(215.4 16.3% 46.9%)',
    },
    
    accent: {
      DEFAULT: 'hsl(210 40% 96%)',
      foreground: 'hsl(222.2 84% 4.9%)',
    },
    
    popover: {
      DEFAULT: 'hsl(0 0% 100%)',
      foreground: 'hsl(222.2 84% 4.9%)',
    },
    
    card: {
      DEFAULT: 'hsl(0 0% 100%)',
      foreground: 'hsl(222.2 84% 4.9%)',
    },

    // Custom brand colors
    black: '#000000',
    
    gold: {
      50: '#FFF8E1',
      100: '#FFECB3',
      200: '#FFE082',
      300: '#FFD54F',
      400: '#FFCA28',
      500: '#FFD700', // Primary gold
      600: '#FFC107',
      700: '#FFB300',
      800: '#FFA000',
      900: '#FF8F00',
    },
    
    // IRIDESCENT TEAL SYSTEM - Award-winning holographic colors
    teal: {
      50: '#F0FDFA',   // Lightest teal
      100: '#CCFBF1',  // Very light teal
      200: '#99F6E4',  // Light teal
      300: '#5EEAD4',  // Medium light teal
      400: '#2DD4BF',  // Main teal
      500: '#14B8A6',  // Primary iridescent teal
      600: '#0D9488',  // Darker teal
      700: '#0F766E',  // Deep teal
      800: '#115E59',  // Very dark teal
      900: '#134E4A',  // Darkest teal
    },
    
    // HOLOGRAPHIC GRADIENT COLORS
    holographic: {
      cyan: '#00FFFF',        // Electric cyan
      teal: '#14B8A6',        // Primary teal
      mint: '#10F2C5',        // Mint green
      purple: '#8B5CF6',      // Electric purple
      pink: '#EC4899',        // Hot pink
      blue: '#3B82F6',        // Electric blue
      green: '#10B981',       // Neon green
    },
    
    // NEON GLOW COLORS
    neon: {
      teal: '#14B8A6',        // Primary neon teal
      cyan: '#06B6D4',        // Neon cyan
      purple: '#A855F7',      // Neon purple
      pink: '#EC4899',        // Neon pink
      green: '#10B981',       // Neon green
      blue: '#3B82F6',        // Neon blue
      white: '#FFFFFF',       // Neon white
    },

    silver: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB', // Primary silver
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    
    gray: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#3F3F3F',
      800: '#2D2D2D',
      900: '#1A1A1A',
    },
  },

  // Spacing system
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    medium: '1rem',   // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
  },

  // Typography (Enhanced for dynamic font system)
  typography: {
    fontFamily: {
      // Primary font - can be dynamically overridden by FontProvider
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      // Monospace font - used for code and technical displays
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      // System fallback - always available as backup
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
    },
  },

  // Border radius
  borderRadius: {
    none: '0',
    small: '0.25rem',
    medium: '0.375rem',
    large: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Breakpoints for responsive design
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },

  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    base: '250ms ease-in-out',
    slow: '350ms ease-in-out',
    glow: '300ms ease-in-out',
    rainbow: '2s linear infinite',
    holographic: '4s ease-in-out infinite',
  },
  
  // AWARD-WINNING ANIMATIONS & EFFECTS
  animations: {
    // Holographic rainbow gradient keyframes
    holographicShift: 'holographicShift 6s ease-in-out infinite',
    neonPulse: 'neonPulse 2s ease-in-out infinite alternate',
    rainbowFlow: 'rainbowFlow 8s linear infinite',
    glowPulse: 'glowPulse 3s ease-in-out infinite',
    iridescent: 'iridescent 10s ease-in-out infinite',
  },
  
  // GLOW EFFECTS
  glowEffects: {
    teal: '0 0 20px rgba(20, 184, 166, 0.5), 0 0 40px rgba(20, 184, 166, 0.3), 0 0 60px rgba(20, 184, 166, 0.1)',
    cyan: '0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.3), 0 0 60px rgba(6, 182, 212, 0.1)',
    purple: '0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3), 0 0 60px rgba(168, 85, 247, 0.1)',
    rainbow: '0 0 30px rgba(20, 184, 166, 0.4), 0 0 60px rgba(139, 92, 246, 0.3), 0 0 90px rgba(236, 72, 153, 0.2)',
  },
  
  // HOLOGRAPHIC GRADIENTS
  gradients: {
    holographic: 'linear-gradient(45deg, #14B8A6, #8B5CF6, #EC4899, #10B981, #3B82F6, #14B8A6)',
    iridescent: 'linear-gradient(90deg, #00FFFF, #14B8A6, #8B5CF6, #EC4899, #10B981, #3B82F6)',
    neonTeal: 'linear-gradient(135deg, #14B8A6, #06B6D4, #10F2C5)',
    cyberpunk: 'linear-gradient(45deg, #14B8A6, #A855F7, #EC4899, #3B82F6)',
  },
} as const;

export type Theme = typeof theme;

// Base theme for dynamic font system - exported for createDynamicTheme utility
export const baseTheme = theme;

// Dark mode theme (for future use)
export const darkTheme: Theme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: 'hsl(222.2 84% 4.9%)',
    foreground: 'hsl(210 40% 98%)',
    primary: {
      DEFAULT: 'hsl(210 40% 98%)',
      foreground: 'hsl(222.2 84% 4.9%)',
    },
    secondary: {
      DEFAULT: 'hsl(217.2 32.6% 17.5%)',
      foreground: 'hsl(210 40% 98%)',
    },
    muted: {
      DEFAULT: 'hsl(217.2 32.6% 17.5%)',
      foreground: 'hsl(215 20.2% 65.1%)',
    },
    card: {
      DEFAULT: 'hsl(222.2 84% 4.9%)',
      foreground: 'hsl(210 40% 98%)',
    },
  },
};
