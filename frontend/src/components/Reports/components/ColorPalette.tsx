/**
 * Color Palette Component - Advanced Color Selection and Management
 * Extracted from ThemeBuilder for better modularity
 * Production-ready color picker with accessibility and validation
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Copy, Check, Palette, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { 
  fadeIn, 
  pulse,
  TIMING_CONSTANTS,
  isValidColor
} from '../constants/themeConstants';
import { ThemeValidator } from '../utils/themeValidator';

/**
 * Color palette interfaces
 */
export interface ColorValue {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  name?: string;
}

export interface ColorPaletteProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  showPreview?: boolean;
  showCopyButton?: boolean;
  showValidation?: boolean;
  predefinedColors?: string[];
  width?: string | number;
  height?: string | number;
  className?: string;
  onColorHover?: (color: string | null) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

export interface ColorContrastDisplayProps {
  foregroundColor: string;
  backgroundColor: string;
  showRatio?: boolean;
  showCompliance?: boolean;
}

/**
 * Styled components
 */
const ColorPaletteContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ColorInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ColorInput = styled.input<{ $isValid: boolean; $width?: string | number; $height?: string | number }>`
  width: ${({ $width }) => typeof $width === 'number' ? `${$width}px` : $width || '100%'};
  height: ${({ $height }) => typeof $height === 'number' ? `${$height}px` : $height || '50px'};
  padding: 0;
  border: 3px solid ${({ $isValid, theme }) => 
    $isValid ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 0, 0, 0.5)'};
  border-radius: 12px;
  cursor: pointer;
  background-color: transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    border-color: ${({ $isValid, theme }) => 
      $isValid ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 0, 0, 0.7)'};
    box-shadow: 0 0 20px ${({ $isValid }) => 
      $isValid ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'};
    transform: scale(1.02);
  }
  
  &:focus {
    outline: none;
    border-color: ${({ $isValid }) => 
      $isValid ? '#FFD700' : '#FF0000'};
    animation: ${pulse} 2s infinite;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  // Hide the default color picker UI in some browsers
  &::-webkit-color-swatch-wrapper {
    padding: 0;
    border: none;
    border-radius: 8px;
  }
  
  &::-webkit-color-swatch {
    border: none;
    border-radius: 8px;
  }

  &::-moz-color-swatch {
    border: none;
    border-radius: 8px;
  }
`;

const ColorActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ActionButton = styled.button<{ $variant?: 'copy' | 'refresh' | 'validate' }>`
  padding: 0.5rem;
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'copy': return 'rgba(34, 197, 94, 0.2)';
      case 'refresh': return 'rgba(59, 130, 246, 0.2)';
      case 'validate': return 'rgba(168, 85, 247, 0.2)';
      default: return 'rgba(255, 215, 0, 0.2)';
    }
  }};
  color: ${({ $variant }) => {
    switch ($variant) {
      case 'copy': return '#22c55e';
      case 'refresh': return '#3b82f6';
      case 'validate': return '#a855f7';
      default: return '#FFD700';
    }
  }};
  border: 1px solid ${({ $variant }) => {
    switch ($variant) {
      case 'copy': return 'rgba(34, 197, 94, 0.4)';
      case 'refresh': return 'rgba(59, 130, 246, 0.4)';
      case 'validate': return 'rgba(168, 85, 247, 0.4)';
      default: return 'rgba(255, 215, 0, 0.4)';
    }
  }};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${({ $variant }) => {
      switch ($variant) {
        case 'copy': return 'rgba(34, 197, 94, 0.3)';
        case 'refresh': return 'rgba(59, 130, 246, 0.3)';
        case 'validate': return 'rgba(168, 85, 247, 0.3)';
        default: return 'rgba(255, 215, 0, 0.3)';
      }
    }};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ColorPreview = styled.div<{ $color: string; $size?: number }>`
  width: ${({ $size }) => $size || 32}px;
  height: ${({ $size }) => $size || 32}px;
  background-color: ${({ $color }) => $color};
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: scale(1.1);
    border-color: rgba(255, 215, 0, 0.6);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, 
      transparent 40%, 
      rgba(255, 255, 255, 0.1) 50%, 
      transparent 60%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::after {
    opacity: 1;
  }
`;

const PredefinedColorsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.2);
`;

const ColorInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #ccc;
  margin-top: 0.25rem;
`;

const ColorValue = styled.span<{ $isValid: boolean }>`
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: ${({ $isValid }) => $isValid ? '#FFD700' : '#ef4444'};
  letter-spacing: 0.5px;
`;

const ValidationMessage = styled.div<{ $type: 'error' | 'warning' | 'success' }>`
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ $type }) => {
    switch ($type) {
      case 'error': return 'rgba(239, 68, 68, 0.1)';
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
      case 'success': return 'rgba(34, 197, 94, 0.1)';
    }
  }};
  color: ${({ $type }) => {
    switch ($type) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'success': return '#22c55e';
    }
  }};
  border: 1px solid ${({ $type }) => {
    switch ($type) {
      case 'error': return 'rgba(239, 68, 68, 0.3)';
      case 'warning': return 'rgba(245, 158, 11, 0.3)';
      case 'success': return 'rgba(34, 197, 94, 0.3)';
    }
  }};
`;

const ContrastDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.2);
`;

const ContrastPreview = styled.div<{ $fg: string; $bg: string }>`
  padding: 1rem;
  background-color: ${({ $bg }) => $bg};
  color: ${({ $fg }) => $fg};
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ContrastInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
`;

const ContrastRatio = styled.span<{ $isGood: boolean }>`
  font-weight: bold;
  color: ${({ $isGood }) => $isGood ? '#22c55e' : '#ef4444'};
`;

const ComplianceBadge = styled.span<{ $type: 'AAA' | 'AA' | 'fail' }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  background: ${({ $type }) => {
    switch ($type) {
      case 'AAA': return 'rgba(34, 197, 94, 0.2)';
      case 'AA': return 'rgba(245, 158, 11, 0.2)';
      case 'fail': return 'rgba(239, 68, 68, 0.2)';
    }
  }};
  color: ${({ $type }) => {
    switch ($type) {
      case 'AAA': return '#22c55e';
      case 'AA': return '#f59e0b';
      case 'fail': return '#ef4444';
    }
  }};
  border: 1px solid ${({ $type }) => {
    switch ($type) {
      case 'AAA': return 'rgba(34, 197, 94, 0.4)';
      case 'AA': return 'rgba(245, 158, 11, 0.4)';
      case 'fail': return 'rgba(239, 68, 68, 0.4)';
    }
  }};
`;

/**
 * Color utility functions
 */
export const colorUtils = {
  /**
   * Convert hex to RGB
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
   * Convert RGB to hex
   */
  rgbToHex: (r: number, g: number, b: number): string => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  },

  /**
   * Convert hex to HSL
   */
  hexToHsl: (hex: string): { h: number; s: number; l: number } | null => {
    const rgb = colorUtils.hexToRgb(hex);
    if (!rgb) return null;

    const { r, g, b } = rgb;
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const delta = max - min;
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

      switch (max) {
        case rNorm:
          h = (gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0);
          break;
        case gNorm:
          h = (bNorm - rNorm) / delta + 2;
          break;
        case bNorm:
          h = (rNorm - gNorm) / delta + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  },

  /**
   * Generate color variants
   */
  generateVariants: (baseColor: string): string[] => {
    const variants: string[] = [];
    const rgb = colorUtils.hexToRgb(baseColor);
    
    if (!rgb) return [];

    // Generate lighter variants
    for (let i = 1; i <= 3; i++) {
      const factor = 1 + (i * 0.2);
      variants.push(colorUtils.rgbToHex(
        Math.min(255, Math.round(rgb.r * factor)),
        Math.min(255, Math.round(rgb.g * factor)),
        Math.min(255, Math.round(rgb.b * factor))
      ));
    }

    // Add original
    variants.push(baseColor);

    // Generate darker variants
    for (let i = 1; i <= 3; i++) {
      const factor = 1 - (i * 0.2);
      variants.push(colorUtils.rgbToHex(
        Math.max(0, Math.round(rgb.r * factor)),
        Math.max(0, Math.round(rgb.g * factor)),
        Math.max(0, Math.round(rgb.b * factor))
      ));
    }

    return variants;
  },

  /**
   * Get random color
   */
  getRandomColor: (): string => {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  }
};

/**
 * Color Palette Component
 */
export const ColorPalette: React.FC<ColorPaletteProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  showPreview = true,
  showCopyButton = true,
  showValidation = true,
  predefinedColors,
  width,
  height,
  className,
  onColorHover,
  onValidationChange
}) => {
  const [copiedRecently, setCopiedRecently] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Validate color when value changes
  useEffect(() => {
    const errors: string[] = [];
    let valid = true;

    if (!value || value.trim().length === 0) {
      errors.push('Color is required');
      valid = false;
    } else if (!isValidColor(value)) {
      errors.push('Invalid color format');
      valid = false;
    }

    setValidationErrors(errors);
    setIsValid(valid);
    onValidationChange?.(valid, errors);
  }, [value, onValidationChange]);

  // Convert color to different formats
  const colorValue: ColorValue | null = useMemo(() => {
    if (!isValidColor(value)) return null;

    const rgb = colorUtils.hexToRgb(value);
    const hsl = colorUtils.hexToHsl(value);
    
    if (!rgb || !hsl) return null;

    return {
      hex: value.toUpperCase(),
      rgb,
      hsl
    };
  }, [value]);

  // Handle color change
  const handleColorChange = useCallback((newColor: string) => {
    onChange(newColor);
  }, [onChange]);

  // Handle copy to clipboard
  const handleCopyColor = useCallback(async () => {
    if (!colorValue) return;

    try {
      await navigator.clipboard.writeText(colorValue.hex);
      setCopiedRecently(true);
      setTimeout(() => setCopiedRecently(false), TIMING_CONSTANTS.colorCopyTimeout);
    } catch (error) {
      console.error('Failed to copy color:', error);
    }
  }, [colorValue]);

  // Handle random color generation
  const handleRandomColor = useCallback(() => {
    const randomColor = colorUtils.getRandomColor();
    handleColorChange(randomColor);
  }, [handleColorChange]);

  // Handle predefined color selection
  const handlePredefinedColorClick = useCallback((color: string) => {
    handleColorChange(color);
  }, [handleColorChange]);

  // Handle color hover
  const handleColorHover = useCallback((color: string | null) => {
    onColorHover?.(color);
  }, [onColorHover]);

  return (
    <ColorPaletteContainer className={className}>
      <ColorInputWrapper>
        <ColorInput
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => handleColorChange(e.target.value)}
          disabled={disabled}
          $isValid={isValid}
          $width={width}
          $height={height}
          onMouseEnter={() => handleColorHover(value)}
          onMouseLeave={() => handleColorHover(null)}
        />
        
        <ColorActions>
          {showPreview && colorValue && (
            <ColorPreview 
              $color={colorValue.hex}
              onClick={() => inputRef.current?.click()}
              title={`Preview: ${colorValue.hex}`}
            />
          )}
          
          {showCopyButton && (
            <ActionButton
              $variant="copy"
              onClick={handleCopyColor}
              disabled={!colorValue}
              title="Copy color to clipboard"
            >
              {copiedRecently ? <Check size={16} /> : <Copy size={16} />}
            </ActionButton>
          )}
          
          <ActionButton
            $variant="refresh"
            onClick={handleRandomColor}
            disabled={disabled}
            title="Generate random color"
          >
            <RefreshCw size={16} />
          </ActionButton>
        </ColorActions>
      </ColorInputWrapper>

      {colorValue && (
        <ColorInfo>
          <ColorValue $isValid={isValid}>
            {colorValue.hex}
          </ColorValue>
          <span>
            RGB({colorValue.rgb.r}, {colorValue.rgb.g}, {colorValue.rgb.b})
          </span>
          <span>
            HSL({colorValue.hsl.h}°, {colorValue.hsl.s}%, {colorValue.hsl.l}%)
          </span>
        </ColorInfo>
      )}

      {showValidation && validationErrors.length > 0 && (
        <ValidationMessage $type="error">
          <Eye size={16} />
          {validationErrors.join(', ')}
        </ValidationMessage>
      )}

      {predefinedColors && predefinedColors.length > 0 && (
        <PredefinedColorsGrid>
          {predefinedColors.map((color, index) => (
            <ColorPreview
              key={index}
              $color={color}
              onClick={() => handlePredefinedColorClick(color)}
              onMouseEnter={() => handleColorHover(color)}
              onMouseLeave={() => handleColorHover(null)}
              title={color}
            />
          ))}
        </PredefinedColorsGrid>
      )}
    </ColorPaletteContainer>
  );
};

/**
 * Color Contrast Display Component
 */
export const ColorContrastDisplay: React.FC<ColorContrastDisplayProps> = ({
  foregroundColor,
  backgroundColor,
  showRatio = true,
  showCompliance = true
}) => {
  const contrastData = useMemo(() => {
    return ThemeValidator.validateColorContrast(foregroundColor, backgroundColor);
  }, [foregroundColor, backgroundColor]);

  const complianceLevel = useMemo(() => {
    if (contrastData.isAAACompliant) return 'AAA';
    if (contrastData.isAACompliant) return 'AA';
    return 'fail';
  }, [contrastData]);

  return (
    <ContrastDisplay>
      <ContrastPreview $fg={foregroundColor} $bg={backgroundColor}>
        Sample text with current colors
      </ContrastPreview>
      
      <ContrastInfo>
        {showRatio && (
          <div>
            Contrast Ratio: <ContrastRatio $isGood={contrastData.isAACompliant}>
              {contrastData.ratio}:1
            </ContrastRatio>
          </div>
        )}
        
        {showCompliance && (
          <ComplianceBadge $type={complianceLevel}>
            WCAG {complianceLevel}
          </ComplianceBadge>
        )}
      </ContrastInfo>
    </ContrastDisplay>
  );
};

export default ColorPalette;
