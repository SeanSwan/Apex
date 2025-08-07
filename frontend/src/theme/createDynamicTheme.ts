// APEX AI DYNAMIC THEME GENERATOR
// Utility function to create theme objects with dynamic font families
// Decouples base theme from dynamic font logic for better scalability

import { theme as baseTheme, Theme } from './theme';
import { DEFAULT_FONT, getFontByName } from './fonts';

/**
 * Creates a complete theme object with a dynamic font family
 * @param fontName - The name of the font to apply (e.g., "Orbitron")
 * @returns Complete theme object with updated typography
 */
export const createDynamicTheme = (fontName?: string): Theme => {
  // Get font configuration or fall back to default
  const selectedFont = fontName ? getFontByName(fontName) : null;
  const fontConfig = selectedFont || DEFAULT_FONT;
  
  // Create dynamic theme by merging base theme with new font family
  const dynamicTheme: Theme = {
    ...baseTheme,
    typography: {
      ...baseTheme.typography,
      fontFamily: {
        ...baseTheme.typography.fontFamily,
        // Override primary font family with the selected font
        primary: fontConfig.family,
        // Keep monospace as-is unless a monospace font is selected
        mono: selectedFont?.category === 'Futuristic Monospace' 
          ? fontConfig.family 
          : baseTheme.typography.fontFamily.mono
      }
    }
  };

  return dynamicTheme;
};

/**
 * Loads a Google Font dynamically into the document head
 * Cleans up previously loaded custom fonts to prevent performance issues
 * Also sets global CSS custom property AND body font for app-wide font changes
 * @param fontConfig - Font configuration object with googleFontUrl
 * @param cleanup - Whether to remove existing custom font links (default: true)
 */
export const loadGoogleFont = (
  fontConfig: { googleFontUrl: string; name: string; family: string }, 
  cleanup: boolean = true
): void => {
  // Cleanup existing custom font links if requested
  if (cleanup) {
    const existingLinks = document.querySelectorAll('link[data-font-loader="apex-ai"]');
    existingLinks.forEach(link => link.remove());
  }

  // Check if this specific font is already loaded
  const existingFont = document.querySelector(
    `link[href="${fontConfig.googleFontUrl}"]`
  );
  
  if (!existingFont) {
    // Create and append new font link
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontConfig.googleFontUrl;
    link.setAttribute('data-font-loader', 'apex-ai');
    link.setAttribute('data-font-name', fontConfig.name);
    
    // Add to document head
    document.head.appendChild(link);
  }

  // CRITICAL: Set global CSS custom property for styled-components
  document.documentElement.style.setProperty('--apex-font-primary', fontConfig.family);
  
  // AGGRESSIVE: Directly set body font-family for maximum coverage
  document.body.style.fontFamily = fontConfig.family;
  
  // SUPER AGGRESSIVE: Set font on all text elements that might have hardcoded fonts
  const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, button, input, textarea, label');
  textElements.forEach(element => {
    // Only override if the element doesn't have an explicit font-family that's different
    const computedStyle = window.getComputedStyle(element);
    const currentFont = computedStyle.fontFamily;
    
    // If it's using a default/system font, override it
    if (!currentFont || 
        currentFont.includes('serif') || 
        currentFont.includes('Arial') || 
        currentFont.includes('Helvetica') ||
        currentFont.includes('Segoe UI') ||
        currentFont.includes('Tahoma') ||
        currentFont.includes('Geneva') ||
        currentFont.includes('Verdana') ||
        currentFont.includes('sans-serif')) {
      element.style.fontFamily = fontConfig.family;
    }
  });
  
  console.log(`✅ Font changed to: ${fontConfig.name} (${fontConfig.family})`);
};

/**
 * Removes all dynamically loaded Google Fonts and resets global font
 * Useful for cleanup or resetting to system fonts
 */
export const clearLoadedFonts = (): void => {
  const fontLinks = document.querySelectorAll('link[data-font-loader="apex-ai"]');
  fontLinks.forEach(link => link.remove());
  
  // Reset global CSS custom property
  document.documentElement.style.removeProperty('--apex-font-primary');
  
  // Reset body font-family
  document.body.style.fontFamily = '';
  
  console.log('🔄 Fonts reset to default');
};

/**
 * Gets the currently loaded custom fonts
 * @returns Array of font names currently loaded in the document
 */
export const getLoadedFonts = (): string[] => {
  const fontLinks = document.querySelectorAll('link[data-font-loader="apex-ai"]');
  return Array.from(fontLinks).map(link => 
    link.getAttribute('data-font-name') || 'Unknown'
  );
};

/**
 * Preloads multiple fonts for better performance
 * Useful for loading commonly used fonts in advance
 * @param fontNames - Array of font names to preload
 */
export const preloadFonts = (fontNames: string[]): void => {
  fontNames.forEach(fontName => {
    const fontConfig = getFontByName(fontName);
    if (fontConfig) {
      // Create font config with family for loadGoogleFont
      const configWithFamily = {
        ...fontConfig,
        family: fontConfig.family
      };
      loadGoogleFont(configWithFamily, false); // Don't cleanup when preloading
    }
  });
};

// Type exports for external use
export type { Theme } from './theme';
