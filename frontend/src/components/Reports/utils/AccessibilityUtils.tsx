/**
 * Accessibility Utilities for Reports Components
 * Production-ready WCAG AA compliance helpers
 * Focus management, keyboard navigation, and screen reader support
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * WCAG AA Color Contrast Utilities
 */
export const colorContrast = {
  /**
   * Convert hex color to RGB values
   */
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  /**
   * Calculate relative luminance
   */
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      const srgb = c / 255;
      return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio: (color1: string, color2: string): number => {
    const rgb1 = colorContrast.hexToRgb(color1);
    const rgb2 = colorContrast.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const lum1 = colorContrast.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = colorContrast.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check if colors meet WCAG AA standards
   */
  isWCAGCompliant: (foreground: string, background: string, large = false): {
    ratio: number;
    AA: boolean;
    AAA: boolean;
    level: 'fail' | 'AA' | 'AAA';
  } => {
    const ratio = colorContrast.getContrastRatio(foreground, background);
    const aaThreshold = large ? 3 : 4.5;
    const aaaThreshold = large ? 4.5 : 7;
    
    const AA = ratio >= aaThreshold;
    const AAA = ratio >= aaaThreshold;
    
    return {
      ratio,
      AA,
      AAA,
      level: AAA ? 'AAA' : AA ? 'AA' : 'fail'
    };
  }
};

/**
 * Focus Management Hook
 */
export const useFocusManagement = () => {
  const focusableElements = useRef<HTMLElement[]>([]);
  const currentFocusIndex = useRef<number>(-1);

  const findFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])'
    ].join(', ');

    return Array.from(container.querySelectorAll(selectors)) as HTMLElement[];
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    focusableElements.current = findFocusableElements(container);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      e.preventDefault();
      
      const elements = focusableElements.current;
      if (elements.length === 0) return;
      
      if (e.shiftKey) {
        currentFocusIndex.current = currentFocusIndex.current <= 0 
          ? elements.length - 1 
          : currentFocusIndex.current - 1;
      } else {
        currentFocusIndex.current = currentFocusIndex.current >= elements.length - 1 
          ? 0 
          : currentFocusIndex.current + 1;
      }
      
      elements[currentFocusIndex.current]?.focus();
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    if (focusableElements.current.length > 0) {
      currentFocusIndex.current = 0;
      focusableElements.current[0].focus();
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [findFocusableElements]);

  const restoreFocus = useCallback((element: HTMLElement) => {
    element.focus();
  }, []);

  return { trapFocus, restoreFocus, findFocusableElements };
};

/**
 * Keyboard Navigation Hook
 */
export const useKeyboardNavigation = (options: {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onSpace?: () => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          options.onEscape?.();
          break;
        case 'Enter':
          e.preventDefault();
          options.onEnter?.();
          break;
        case 'ArrowUp':
          e.preventDefault();
          options.onArrowKeys?.('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          options.onArrowKeys?.('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          options.onArrowKeys?.('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          options.onArrowKeys?.('right');
          break;
        case ' ':
          e.preventDefault();
          options.onSpace?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [options]);
};

/**
 * Screen Reader Utilities
 */
export const screenReader = {
  /**
   * Announce message to screen readers
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(announcer);
    announcer.textContent = message;
    
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  },

  /**
   * Create accessible description
   */
  createDescription: (id: string, text: string): HTMLElement => {
    let existing = document.getElementById(id);
    if (existing) {
      existing.textContent = text;
      return existing;
    }

    const description = document.createElement('div');
    description.id = id;
    description.className = 'sr-only';
    description.textContent = text;
    description.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(description);
    return description;
  }
};

/**
 * Accessibility Hook for Components
 */
export const useAccessibility = (options: {
  announceOnMount?: string;
  announceOnUpdate?: string;
  enableFocusManagement?: boolean;
  enableKeyboardNavigation?: boolean;
}) => {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const { trapFocus, restoreFocus } = useFocusManagement();

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Check for high contrast preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Announce on mount
  useEffect(() => {
    if (options.announceOnMount) {
      screenReader.announce(options.announceOnMount);
    }
  }, [options.announceOnMount]);

  // Announce on updates
  useEffect(() => {
    if (options.announceOnUpdate) {
      screenReader.announce(options.announceOnUpdate);
    }
  }, [options.announceOnUpdate]);

  // Focus management
  useEffect(() => {
    if (options.enableFocusManagement && containerRef.current) {
      return trapFocus(containerRef.current);
    }
  }, [options.enableFocusManagement, trapFocus]);

  return {
    containerRef,
    isReducedMotion,
    isHighContrast,
    announce: screenReader.announce,
    createDescription: screenReader.createDescription,
    restoreFocus
  };
};

/**
 * Skip Link Component
 */
export const SkipLink: React.FC<{ 
  href: string; 
  children: React.ReactNode;
  className?: string;
}> = ({ href, children, className = '' }) => (
  <a
    href={href}
    className={`skip-link ${className}`}
    style={{
      position: 'absolute',
      left: '-10000px',
      top: 'auto',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      fontSize: '1rem',
      padding: '8px 16px',
      background: '#000',
      color: '#fff',
      textDecoration: 'none',
      zIndex: 999999,
      // Show on focus
      ':focus': {
        position: 'static',
        width: 'auto',
        height: 'auto'
      }
    }}
    onFocus={(e) => {
      e.target.style.position = 'static';
      e.target.style.width = 'auto';
      e.target.style.height = 'auto';
    }}
    onBlur={(e) => {
      e.target.style.position = 'absolute';
      e.target.style.left = '-10000px';
      e.target.style.width = '1px';
      e.target.style.height = '1px';
    }}
  >
    {children}
  </a>
);

/**
 * Accessible Button Component
 */
export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaPressed?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}> = ({ 
  children, 
  onClick, 
  disabled = false, 
  ariaLabel, 
  ariaDescribedBy,
  ariaPressed,
  className = '',
  type = 'button'
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    aria-describedby={ariaDescribedBy}
    aria-pressed={ariaPressed}
    className={className}
    style={{
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      // Ensure minimum touch target size (44px)
      minHeight: '44px',
      minWidth: '44px'
    }}
  >
    {children}
  </button>
);

/**
 * Type-safe accessibility attributes
 */
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  'aria-disabled'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-relevant'?: string;
  role?: string;
  tabIndex?: number;
}

/**
 * Export all utilities
 */
export default {
  colorContrast,
  useFocusManagement,
  useKeyboardNavigation,
  screenReader,
  useAccessibility,
  SkipLink,
  AccessibleButton
};