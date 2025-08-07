// APEX AI FONT CONTEXT PROVIDER
// React context for global font theme management
// Provides font state and actions to the entire application

import React, { createContext, useContext, ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { useFontTheme } from '../hooks/useFontTheme';
import type { FontConfig } from '../theme/fonts';
import type { Theme } from '../theme/createDynamicTheme';

// Context interface
interface FontContextValue {
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

// Create context with undefined default (will be provided by FontProvider)
const FontContext = createContext<FontContextValue | undefined>(undefined);

// Provider component props
interface FontProviderProps {
  children: ReactNode;
}

/**
 * Font Context Provider Component
 * Manages global font state and provides it to child components
 * Also wraps children with styled-components ThemeProvider for theme integration
 */
export const FontProvider: React.FC<FontProviderProps> = ({ children }) => {
  // Use the font theme hook to get state and actions
  const fontTheme = useFontTheme();

  // Context value object
  const contextValue: FontContextValue = {
    activeFontFamily: fontTheme.activeFontFamily,
    activeFontConfig: fontTheme.activeFontConfig,
    dynamicTheme: fontTheme.dynamicTheme,
    setFontFamily: fontTheme.setFontFamily,
    resetToDefault: fontTheme.resetToDefault,
    isLoading: fontTheme.isLoading,
    error: fontTheme.error
  };

  return (
    <FontContext.Provider value={contextValue}>
      <ThemeProvider theme={fontTheme.dynamicTheme}>
        {children}
      </ThemeProvider>
    </FontContext.Provider>
  );
};

/**
 * Custom hook to consume the font context
 * Provides type-safe access to font state and actions
 * @returns FontContextValue with current font state and actions
 * @throws Error if used outside of FontProvider
 */
export const useFontContext = (): FontContextValue => {
  const context = useContext(FontContext);

  if (context === undefined) {
    throw new Error(
      'useFontContext must be used within a FontProvider. ' +
      'Make sure to wrap your component tree with <FontProvider>.'
    );
  }

  return context;
};

// Additional context hooks for specific use cases

/**
 * Hook to get only the font family (most common use case)
 * @returns Current active font family string
 */
export const useActiveFontFamily = (): string => {
  const { activeFontFamily } = useFontContext();
  return activeFontFamily;
};

/**
 * Hook to get only the font config object
 * @returns Current active font configuration
 */
export const useActiveFontConfig = (): FontConfig => {
  const { activeFontConfig } = useFontContext();
  return activeFontConfig;
};

/**
 * Hook to get only the font change function
 * @returns setFontFamily function
 */
export const useSetFontFamily = (): ((fontName: string) => void) => {
  const { setFontFamily } = useFontContext();
  return setFontFamily;
};

/**
 * Hook to get font loading status
 * @returns { isLoading, error } object
 */
export const useFontStatus = (): { isLoading: boolean; error: string | null } => {
  const { isLoading, error } = useFontContext();
  return { isLoading, error };
};

/**
 * Higher-Order Component for providing font context
 * Alternative to using FontProvider directly
 * @param Component - React component to wrap with font context
 * @returns Component wrapped with FontProvider
 */
export const withFontProvider = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  const WithFontProvider: React.FC<P> = (props) => (
    <FontProvider>
      <Component {...props} />
    </FontProvider>
  );

  WithFontProvider.displayName = `withFontProvider(${Component.displayName || Component.name})`;

  return WithFontProvider;
};

// Export context for advanced use cases
export { FontContext };

// Type exports
export type { FontContextValue, FontProviderProps };
