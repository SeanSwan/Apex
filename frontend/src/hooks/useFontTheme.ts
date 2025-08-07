// APEX AI FONT THEME HOOK
// Custom React hook for managing font state, localStorage persistence, and dynamic font loading
// Encapsulates all font-related logic for clean separation of concerns

import { useState, useEffect, useCallback } from 'react';
import { getFontByName, DEFAULT_FONT, type FontConfig } from '../theme/fonts';
import { loadGoogleFont, createDynamicTheme, type Theme } from '../theme/createDynamicTheme';

// LocalStorage key for font persistence
const FONT_STORAGE_KEY = 'apex-ai-selected-font';

// Custom hook interface
interface UseFontThemeReturn {
  // Current state
  activeFontFamily: string;
  activeFontConfig: FontConfig;
  dynamicTheme: Theme;
  
  // Actions
  setFontFamily: (fontName: string) => void;
  resetToDefault: () => void;
  
  // Status
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for managing font theme state
 * Handles localStorage persistence, Google Font loading, and theme generation
 */
export const useFontTheme = (): UseFontThemeReturn => {
  // State management
  const [activeFontFamily, setActiveFontFamily] = useState<string>(DEFAULT_FONT.name);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Derived state
  const activeFontConfig = getFontByName(activeFontFamily) || DEFAULT_FONT;
  const dynamicTheme = createDynamicTheme(activeFontFamily);

  /**
   * Load font from localStorage on component mount
   */
  useEffect(() => {
    const loadInitialFont = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get saved font from localStorage
        const savedFont = localStorage.getItem(FONT_STORAGE_KEY);
        
        if (savedFont) {
          // Validate that the saved font still exists in our font config
          const fontConfig = getFontByName(savedFont);
          
          if (fontConfig) {
            // Load the Google Font stylesheet and set global CSS property
            loadGoogleFont({
              googleFontUrl: fontConfig.googleFontUrl,
              name: fontConfig.name,
              family: fontConfig.family
            });
            setActiveFontFamily(savedFont);
          } else {
            // Font no longer exists, reset to default
            console.warn(`Font "${savedFont}" no longer available, resetting to default`);
            localStorage.removeItem(FONT_STORAGE_KEY);
            setActiveFontFamily(DEFAULT_FONT.name);
            // Set default font in CSS
            loadGoogleFont({
              googleFontUrl: DEFAULT_FONT.googleFontUrl,
              name: DEFAULT_FONT.name,
              family: DEFAULT_FONT.family
            });
          }
        } else {
          // No saved font, use default and set CSS property
          setActiveFontFamily(DEFAULT_FONT.name);
          loadGoogleFont({
            googleFontUrl: DEFAULT_FONT.googleFontUrl,
            name: DEFAULT_FONT.name,
            family: DEFAULT_FONT.family
          });
        }
      } catch (err) {
        console.error('Error loading initial font:', err);
        setError('Failed to load saved font preference');
        setActiveFontFamily(DEFAULT_FONT.name);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialFont();
  }, []);

  /**
   * Change the active font family
   * Handles localStorage persistence and Google Font loading
   */
  const setFontFamily = useCallback(async (fontName: string) => {
    try {
      setError(null);
      
      // Validate font exists
      const fontConfig = getFontByName(fontName);
      if (!fontConfig) {
        throw new Error(`Font "${fontName}" not found in configuration`);
      }

      // Load Google Font stylesheet and set global CSS property
      loadGoogleFont({
        googleFontUrl: fontConfig.googleFontUrl,
        name: fontConfig.name,
        family: fontConfig.family
      });
      
      // Update state
      setActiveFontFamily(fontName);
      
      // Persist to localStorage
      localStorage.setItem(FONT_STORAGE_KEY, fontName);
      
    } catch (err) {
      console.error('Error setting font family:', err);
      setError(err instanceof Error ? err.message : 'Failed to change font');
    }
  }, []);

  /**
   * Reset font to default
   */
  const resetToDefault = useCallback(() => {
    setFontFamily(DEFAULT_FONT.name);
  }, [setFontFamily]);

  // Return hook interface
  return {
    // Current state
    activeFontFamily,
    activeFontConfig,
    dynamicTheme,
    
    // Actions
    setFontFamily,
    resetToDefault,
    
    // Status
    isLoading,
    error
  };
};

// Additional utility hooks

/**
 * Hook to get font loading status
 * Useful for showing loading states in UI components
 */
export const useFontLoadingStatus = () => {
  const [isLoadingFont, setIsLoadingFont] = useState(false);

  const trackFontLoading = useCallback((fontConfig: FontConfig) => {
    setIsLoadingFont(true);
    
    // Create a temporary link to test font loading
    const testLink = document.createElement('link');
    testLink.rel = 'stylesheet';
    testLink.href = fontConfig.googleFontUrl;
    
    testLink.onload = () => {
      setIsLoadingFont(false);
    };
    
    testLink.onerror = () => {
      setIsLoadingFont(false);
      console.error(`Failed to load font: ${fontConfig.name}`);
    };
    
    // Cleanup
    return () => {
      setIsLoadingFont(false);
    };
  }, []);

  return { isLoadingFont, trackFontLoading };
};

/**
 * Hook for font preview functionality
 * Allows temporary font changes without persistence
 */
export const useFontPreview = () => {
  const [previewFont, setPreviewFont] = useState<string | null>(null);
  
  const startPreview = useCallback((fontName: string) => {
    const fontConfig = getFontByName(fontName);
    if (fontConfig) {
      loadGoogleFont({
        googleFontUrl: fontConfig.googleFontUrl,
        name: fontConfig.name,
        family: fontConfig.family
      }, false); // Don't cleanup other fonts during preview
      setPreviewFont(fontName);
    }
  }, []);
  
  const endPreview = useCallback(() => {
    setPreviewFont(null);
  }, []);
  
  const previewTheme = previewFont ? createDynamicTheme(previewFont) : null;
  
  return {
    previewFont,
    previewTheme,
    startPreview,
    endPreview,
    isPreviewActive: previewFont !== null
  };
};
