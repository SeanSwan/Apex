// APEX AI FONT CONFIGURATION
// Centralized font management for dynamic theme system
// Tech-focused, high-performance font collection for security platform

export const FONT_CATEGORIES = {
  GEOMETRIC: 'Geometric & Technical',
  MODERN_SANS: 'Modern Sans-Serif',
  FUTURISTIC_MONO: 'Futuristic Monospace',
  CORPORATE: 'Corporate Professional',
  DISPLAY: 'Display & Headers'
} as const;

export interface FontConfig {
  name: string;
  family: string;
  googleFontUrl: string;
  category: string;
}

export const AVAILABLE_FONTS: FontConfig[] = [
  // ===== GEOMETRIC & TECHNICAL FONTS =====
  {
    name: 'Orbitron',
    family: "'Orbitron', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap',
    category: FONT_CATEGORIES.GEOMETRIC
  },
  {
    name: 'Exo 2',
    family: "'Exo 2', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700&display=swap',
    category: FONT_CATEGORIES.GEOMETRIC
  },
  {
    name: 'Rajdhani',
    family: "'Rajdhani', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&display=swap',
    category: FONT_CATEGORIES.GEOMETRIC
  },
  {
    name: 'Electrolize',
    family: "'Electrolize', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Electrolize&display=swap',
    category: FONT_CATEGORIES.GEOMETRIC
  },
  {
    name: 'Michroma',
    family: "'Michroma', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Michroma&display=swap',
    category: FONT_CATEGORIES.GEOMETRIC
  },
  {
    name: 'Audiowide',
    family: "'Audiowide', cursive",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Audiowide&display=swap',
    category: FONT_CATEGORIES.GEOMETRIC
  },
  {
    name: 'Saira',
    family: "'Saira', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Saira:wght@400;600;700&display=swap',
    category: FONT_CATEGORIES.GEOMETRIC
  },
  {
    name: 'Zen Dots',
    family: "'Zen Dots', cursive",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Zen+Dots&display=swap',
    category: FONT_CATEGORIES.GEOMETRIC
  },

  // ===== MODERN SANS-SERIF FONTS =====
  {
    name: 'Inter',
    family: "'Inter', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    category: FONT_CATEGORIES.MODERN_SANS
  },
  {
    name: 'Poppins',
    family: "'Poppins', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    category: FONT_CATEGORIES.MODERN_SANS
  },
  {
    name: 'Nunito Sans',
    family: "'Nunito Sans', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&display=swap',
    category: FONT_CATEGORIES.MODERN_SANS
  },
  {
    name: 'Work Sans',
    family: "'Work Sans', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap',
    category: FONT_CATEGORIES.MODERN_SANS
  },
  {
    name: 'DM Sans',
    family: "'DM Sans', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap',
    category: FONT_CATEGORIES.MODERN_SANS
  },
  {
    name: 'Plus Jakarta Sans',
    family: "'Plus Jakarta Sans', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
    category: FONT_CATEGORIES.MODERN_SANS
  },
  {
    name: 'Outfit',
    family: "'Outfit', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap',
    category: FONT_CATEGORIES.MODERN_SANS
  },
  {
    name: 'Manrope',
    family: "'Manrope', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap',
    category: FONT_CATEGORIES.MODERN_SANS
  },
  {
    name: 'Red Hat Display',
    family: "'Red Hat Display', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;600;700&display=swap',
    category: FONT_CATEGORIES.MODERN_SANS
  },

  // ===== FUTURISTIC MONOSPACE FONTS =====
  {
    name: 'JetBrains Mono',
    family: "'JetBrains Mono', monospace",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap',
    category: FONT_CATEGORIES.FUTURISTIC_MONO
  },
  {
    name: 'Fira Code',
    family: "'Fira Code', monospace",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap',
    category: FONT_CATEGORIES.FUTURISTIC_MONO
  },
  {
    name: 'Space Mono',
    family: "'Space Mono', monospace",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap',
    category: FONT_CATEGORIES.FUTURISTIC_MONO
  },
  {
    name: 'IBM Plex Mono',
    family: "'IBM Plex Mono', monospace",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap',
    category: FONT_CATEGORIES.FUTURISTIC_MONO
  },
  {
    name: 'Source Code Pro',
    family: "'Source Code Pro', monospace",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;700&display=swap',
    category: FONT_CATEGORIES.FUTURISTIC_MONO
  },
  {
    name: 'Roboto Mono',
    family: "'Roboto Mono', monospace",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap',
    category: FONT_CATEGORIES.FUTURISTIC_MONO
  },
  {
    name: 'Courier Prime',
    family: "'Courier Prime', monospace",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap',
    category: FONT_CATEGORIES.FUTURISTIC_MONO
  },

  // ===== CORPORATE PROFESSIONAL FONTS =====
  {
    name: 'Roboto',
    family: "'Roboto', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
    category: FONT_CATEGORIES.CORPORATE
  },
  {
    name: 'Open Sans',
    family: "'Open Sans', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap',
    category: FONT_CATEGORIES.CORPORATE
  },
  {
    name: 'Lato',
    family: "'Lato', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
    category: FONT_CATEGORIES.CORPORATE
  },
  {
    name: 'Montserrat',
    family: "'Montserrat', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap',
    category: FONT_CATEGORIES.CORPORATE
  },
  {
    name: 'Source Sans Pro',
    family: "'Source Sans Pro', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap',
    category: FONT_CATEGORIES.CORPORATE
  },
  {
    name: 'Fira Sans',
    family: "'Fira Sans', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;700&display=swap',
    category: FONT_CATEGORIES.CORPORATE
  },
  {
    name: 'PT Sans',
    family: "'PT Sans', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap',
    category: FONT_CATEGORIES.CORPORATE
  },
  {
    name: 'Ubuntu',
    family: "'Ubuntu', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap',
    category: FONT_CATEGORIES.CORPORATE
  },
  {
    name: 'Oxygen',
    family: "'Oxygen', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Oxygen:wght@300;400;700&display=swap',
    category: FONT_CATEGORIES.CORPORATE
  },

  // ===== DISPLAY & HEADERS FONTS =====
  {
    name: 'Oswald',
    family: "'Oswald', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap',
    category: FONT_CATEGORIES.DISPLAY
  },
  {
    name: 'Bebas Neue',
    family: "'Bebas Neue', cursive",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
    category: FONT_CATEGORIES.DISPLAY
  },
  {
    name: 'Anton',
    family: "'Anton', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Anton&display=swap',
    category: FONT_CATEGORIES.DISPLAY
  },
  {
    name: 'Righteous',
    family: "'Righteous', cursive",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Righteous&display=swap',
    category: FONT_CATEGORIES.DISPLAY
  },
  {
    name: 'Titillium Web',
    family: "'Titillium Web', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700&display=swap',
    category: FONT_CATEGORIES.DISPLAY
  },
  {
    name: 'Squada One',
    family: "'Squada One', cursive",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Squada+One&display=swap',
    category: FONT_CATEGORIES.DISPLAY
  },
  {
    name: 'Comfortaa',
    family: "'Comfortaa', cursive",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;700&display=swap',
    category: FONT_CATEGORIES.DISPLAY
  },
  {
    name: 'Quicksand',
    family: "'Quicksand', sans-serif",
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap',
    category: FONT_CATEGORIES.DISPLAY
  }
];

// Default font fallback
export const DEFAULT_FONT: FontConfig = {
  name: 'Inter',
  family: "'Inter', sans-serif",
  googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  category: FONT_CATEGORIES.MODERN_SANS
};

// Utility functions
export const getFontByName = (name: string): FontConfig | undefined => {
  return AVAILABLE_FONTS.find(font => font.name === name);
};

export const getFontsByCategory = (category: string): FontConfig[] => {
  return AVAILABLE_FONTS.filter(font => font.category === category);
};

export const getAllCategories = (): string[] => {
  return Object.values(FONT_CATEGORIES);
};
