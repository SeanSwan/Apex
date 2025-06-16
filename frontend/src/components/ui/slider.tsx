import React, { useState, useRef, useEffect, forwardRef } from 'react';
import styled from 'styled-components';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../lib/utils';

// Container for the entire slider component
const SliderContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

// Value display
const SliderValue = styled.div`
  font-size: 0.875rem;
  color: #666;
  margin-left: auto;
`;

// Styled track component (the line)
const StyledTrack = styled(SliderPrimitive.Track)`
  position: relative;
  height: 0.5rem;
  background-color: #e4e4e7;
  border-radius: 9999px;
  flex-grow: 1;
  overflow: hidden;

  &[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Styled range component (the filled part)
const StyledRange = styled(SliderPrimitive.Range)`
  position: absolute;
  height: 100%;
  background-color: #3b82f6;
  border-radius: 9999px;
`;

// Styled thumb component
const StyledThumb = styled(SliderPrimitive.Thumb)`
  display: block;
  width: 1.25rem;
  height: 1.25rem;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  border-radius: 50%;
  border: 2px solid #3b82f6;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f8fafc;
  }
  
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }

  &[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// The root component with all styles
const StyledSlider = styled(SliderPrimitive.Root)`
  position: relative;
  display: flex;
  align-items: center;
  user-select: none;
  touch-action: none;
  width: 100%;
  height: 1.5rem;

  &[data-orientation="horizontal"] {
    flex-direction: row;
    height: 1.5rem;
  }

  &[data-orientation="vertical"] {
    flex-direction: column;
    width: 1.5rem;
    height: 100%;
  }

  &[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    height: 2rem;
    
    ${StyledThumb} {
      width: 1.5rem;
      height: 1.5rem;
    }
  }
`;

export interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

/**
 * Slider Component
 * 
 * A fully customizable slider component built on Radix UI's Slider primitive.
 * Features touch-friendly controls, animated state changes, and responsive design.
 * 
 * @param {SliderProps} props - Component props
 * @returns {JSX.Element} - Slider component
 * 
 * @example
 * // Basic usage
 * <Slider value={[50]} min={0} max={100} step={1} onValueChange={handleChange} />
 * 
 * // With value display and formatting
 * <Slider 
 *   value={[75]} 
 *   min={0} 
 *   max={100} 
 *   step={5} 
 *   showValue 
 *   valueSuffix="%" 
 *   formatValue={(v) => v.toFixed(0)} 
 *   onValueChange={handleChange} 
 * />
 */
const Slider = forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ 
    className, 
    showValue = false, 
    valuePrefix = '', 
    valueSuffix = '', 
    formatValue,
    value, 
    ...props 
  }, ref) => {
    // Get current value for display purposes
    const displayValue = Array.isArray(value) ? value[0] : 0;
    const formattedValue = formatValue ? formatValue(displayValue) : displayValue.toString();

    return (
      <SliderContainer className={className}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {props.name && (
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{props.name}</div>
          )}
          {showValue && (
            <SliderValue>
              {valuePrefix}{formattedValue}{valueSuffix}
            </SliderValue>
          )}
        </div>
        
        <StyledSlider
          ref={ref}
          value={value}
          className={cn(className)}
          {...props}
        >
          <StyledTrack>
            <StyledRange />
          </StyledTrack>
          {Array.isArray(value) && 
            value.map((_, i) => <StyledThumb key={i} aria-label={props['aria-label'] || `Value ${i + 1}`} />)
          }
        </StyledSlider>
      </SliderContainer>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };  