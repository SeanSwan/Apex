// APEX AI FONT SELECTOR COMPONENT
// Production-ready font selection UI with live preview and categorized options
// Integrates with the existing gold/black theme aesthetic

import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { useFontContext } from '../../contexts/FontContext';
import { AVAILABLE_FONTS, getAllCategories, getFontsByCategory } from '../../theme/fonts';

// =============================================================================
// STYLED COMPONENTS
// =============================================================================

const SelectorContainer = styled.div`
  position: relative;
  min-width: 280px;
  z-index: ${props => props.theme.zIndex.dropdown};
`;

const SelectorButton = styled.button<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, ${props => props.theme.colors.black} 0%, ${props => props.theme.colors.gray[900]} 100%);
  border: 2px solid ${props => props.theme.colors.gold[500]};
  border-radius: ${props => props.theme.borderRadius.medium};
  color: ${props => props.theme.colors.white};
  font-weight: 600;
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  box-shadow: ${props => props.theme.shadows.sm};

  &:hover {
    border-color: ${props => props.theme.colors.gold[400]};
    box-shadow: 0 0 15px ${props => props.theme.colors.gold[500]}40;
    transform: translateY(-1px);
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.gold[400]};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.gold[500]}30;
  }
  
  /* ENSURE DROPDOWN OPENS ON FIRST CLICK */
  &:active {
    transform: translateY(0);
  }
`;

const SelectorLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.gold[400]};
  margin-bottom: 0.25rem;
  display: block;
  font-weight: 500;
`;

const CurrentFontName = styled.span`
  font-size: ${props => props.theme.typography.fontSize.base};
  flex: 1;
  text-align: left;
`;

const DropdownIcon = styled.span<{ $isOpen: boolean }>`
  font-size: 0.8rem;
  transition: transform ${props => props.theme.transitions.fast};
  color: ${props => props.theme.colors.gold[400]};
  
  ${props => props.$isOpen && css`
    transform: rotate(180deg);
  `}
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.black};
  border: 2px solid ${props => props.theme.colors.gold[500]};
  border-top: none;
  border-radius: 0 0 ${props => props.theme.borderRadius.medium} ${props => props.theme.borderRadius.medium};
  max-height: 400px;
  overflow-y: auto;
  box-shadow: ${props => props.theme.shadows.lg};
  z-index: ${props => props.theme.zIndex.dropdown + 10};
  
  /* IMMEDIATE SHOW/HIDE - NO TRANSITIONS */
  display: ${props => props.$isOpen ? 'block' : 'none'};

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.gray[800]};
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.gold[500]};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.gold[400]};
  }
`;

const CategoryHeader = styled.div`
  padding: 0.75rem 1rem 0.5rem;
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: 700;
  color: ${props => props.theme.colors.gold[400]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: linear-gradient(135deg, ${props => props.theme.colors.gray[900]} 0%, ${props => props.theme.colors.black} 100%);
  border-bottom: 1px solid ${props => props.theme.colors.gold[500]}30;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const FontOption = styled.button<{ $isActive: boolean; $fontFamily: string }>`
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  background: none;
  border: none;
  color: ${props => props.theme.colors.white};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-family: ${props => props.$fontFamily};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  border-left: 3px solid transparent;

  &:hover {
    background: linear-gradient(135deg, ${props => props.theme.colors.gold[500]}20 0%, ${props => props.theme.colors.gold[400]}10 100%);
    border-left-color: ${props => props.theme.colors.gold[400]};
    color: ${props => props.theme.colors.gold[100]};
  }

  &:focus {
    outline: none;
    background: linear-gradient(135deg, ${props => props.theme.colors.gold[500]}20 0%, ${props => props.theme.colors.gold[400]}10 100%);
    border-left-color: ${props => props.theme.colors.gold[400]};
  }

  ${props => props.$isActive && css`
    background: linear-gradient(135deg, ${props => props.theme.colors.gold[500]}30 0%, ${props => props.theme.colors.gold[400]}15 100%);
    border-left-color: ${props => props.theme.colors.gold[500]};
    color: ${props => props.theme.colors.gold[200]};
    font-weight: 600;

    &::after {
      content: ' ✓';
      color: ${props => props.theme.colors.gold[400]};
      font-weight: bold;
      float: right;
    }
  `}
`;

const LoadingIndicator = styled.div`
  padding: 1rem;
  text-align: center;
  color: ${props => props.theme.colors.gold[400]};
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

const ErrorMessage = styled.div`
  padding: 0.75rem 1rem;
  background: ${props => props.theme.colors.destructive.DEFAULT}20;
  border-left: 3px solid ${props => props.theme.colors.destructive.DEFAULT};
  color: ${props => props.theme.colors.destructive.foreground};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-bottom: 0.5rem;
`;

// =============================================================================
// COMPONENT
// =============================================================================

interface FontSelectorProps {
  /** Custom class name for styling */
  className?: string;
  /** Whether to show the label */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Callback when font changes */
  onFontChange?: (fontName: string) => void;
}

/**
 * FontSelector Component
 * STREAMLINED UX: 1 click opens full dropdown, 1 click selects font
 */
export const FontSelector: React.FC<FontSelectorProps> = ({
  className,
  showLabel = true,
  label = "Application Font",
  onFontChange
}) => {
  // Context and state
  const { activeFontFamily, setFontFamily, isLoading, error } = useFontContext();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get all categories for organization
  const categories = getAllCategories();

  // SIMPLE TOGGLE - NO COMPLEX LOGIC
  const handleToggleDropdown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('Toggle clicked, current state:', isOpen);
    setIsOpen(!isOpen);
  }, [isOpen]);

  // Handle font selection - CLOSE AFTER SELECTION
  const handleFontSelect = useCallback((fontName: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Font selected:', fontName);
    setFontFamily(fontName);
    setIsOpen(false); // Close dropdown
    onFontChange?.(fontName);
    
    // Return focus to button
    buttonRef.current?.focus();
  }, [setFontFamily, onFontChange]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen]);

  // Simplified keyboard handling
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
    }
  }, [isOpen]);

  return (
    <SelectorContainer className={className} ref={containerRef}>
      {showLabel && (
        <SelectorLabel>{label}</SelectorLabel>
      )}
      
      {error && (
        <ErrorMessage>
          ⚠️ {error}
        </ErrorMessage>
      )}

      <SelectorButton
        ref={buttonRef}
        $isOpen={isOpen}
        onClick={handleToggleDropdown}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select application font"
        title="Click to select font"
      >
        <CurrentFontName>
          {isLoading ? 'Loading...' : `Font: ${activeFontFamily}`}
        </CurrentFontName>
        <DropdownIcon $isOpen={isOpen}>
          {isOpen ? '▲' : '▼'}
        </DropdownIcon>
      </SelectorButton>

      <DropdownMenu $isOpen={isOpen} role="listbox" aria-label="Font options">
        {isLoading ? (
          <LoadingIndicator>
            Loading font options...
          </LoadingIndicator>
        ) : (
          categories.map(category => {
            const categoryFonts = getFontsByCategory(category);
            
            if (categoryFonts.length === 0) return null;

            return (
              <div key={category}>
                <CategoryHeader>
                  {category}
                </CategoryHeader>
                {categoryFonts.map(font => (
                  <FontOption
                    key={font.name}
                    $isActive={font.name === activeFontFamily}
                    $fontFamily={font.family}
                    onClick={(e) => handleFontSelect(font.name, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleFontSelect(font.name, e as any);
                      }
                    }}
                    type="button"
                    role="option"
                    aria-selected={font.name === activeFontFamily}
                    tabIndex={isOpen ? 0 : -1}
                  >
                    {font.name}
                  </FontOption>
                ))}
              </div>
            );
          })
        )}
      </DropdownMenu>
    </SelectorContainer>
  );
};

export default FontSelector;
