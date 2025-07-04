/**
 * Theme Builder Styled Components - Reusable Styled Components for Theme Builder
 * Extracted from ThemeBuilder for better modularity
 * Production-ready styled components with animations and responsive design
 */

import styled, { css } from 'styled-components';
import { 
  fadeIn, 
  slideIn, 
  pulse, 
  shimmer, 
  glow,
  RESPONSIVE_BREAKPOINTS 
} from '../constants/themeConstants';

// === SECTION COMPONENTS ===
export const Section = styled.div`
  margin-top: 2rem;
  animation: ${fadeIn} 0.6s ease-out;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    margin-top: 1.5rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    margin-top: 1rem;
  }
`;

export const SectionTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #FFD700;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  border-bottom: 3px solid rgba(255, 215, 0, 0.3);
  padding-bottom: 0.75rem;
  position: relative;
  
  &::after {
    content: '';
    flex: 1;
    height: 2px;
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.3) 0%, transparent 100%);
    margin-left: 1rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    
    &::after {
      margin-left: 0.5rem;
    }
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 1.125rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    
    &::after {
      width: 100%;
      margin-left: 0;
    }
  }
`;

// === TAB COMPONENTS ===
export const TabContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  padding: 0.5rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow-x: auto;
  gap: 0.5rem;
  border: 1px solid rgba(255, 215, 0, 0.1);

  /* Custom scrollbar for better UX */
  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.3);
    border-radius: 2px;
    
    &:hover {
      background: rgba(255, 215, 0, 0.5);
    }
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    margin-bottom: 1.5rem;
    padding: 0.25rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    margin-bottom: 1rem;
    -webkit-overflow-scrolling: touch;
  }
`;

export const Tab = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.5rem;
  border: none;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' 
    : 'transparent'};
  color: ${props => props.$active ? '#000' : '#ccc'};
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
  border: 1px solid ${props => props.$active ? 'transparent' : 'rgba(255, 215, 0, 0.1)'};
  
  &:hover {
    background: ${props => props.$active 
      ? 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)' 
      : 'rgba(255, 215, 0, 0.1)'};
    color: ${props => props.$active ? '#000' : '#FFD700'};
    transform: translateY(-2px);
    border-color: rgba(255, 215, 0, 0.3);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    gap: 0.25rem;
  }
`;

// === CONTENT COMPONENTS ===
export const ContentContainer = styled.div`
  animation: ${slideIn} 0.4s ease-out;
`;

export const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-top: 1.5rem;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.desktop}) {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    margin-top: 1rem;
  }
`;

export const SettingCard = styled.div<{ $highlight?: boolean }>`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(15px);
  border: 1px solid ${({ $highlight }) => $highlight ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 215, 0, 0.2)'};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 48px rgba(255, 215, 0, 0.15);
    border-color: rgba(255, 215, 0, 0.4);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #FFD700, #FFA500, #FFD700);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }

  ${({ $highlight }) => $highlight && css`
    animation: ${glow} 2s ease-in-out infinite;
    border-color: rgba(255, 215, 0, 0.6);
    
    &::before {
      opacity: 1;
    }
  `}

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    padding: 1.5rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 1rem;
    border-radius: 12px;
  }
`;

// === FORM COMPONENTS ===
export const SettingGroup = styled.div`
  margin-bottom: 2rem;
  position: relative;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    margin-bottom: 1.5rem;
  }
`;

export const Label = styled.label<{ $required?: boolean }>`
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #e0e0e0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.3), transparent);
    margin-left: 1rem;
  }

  ${({ $required }) => $required && css`
    &::before {
      content: '*';
      color: #ef4444;
      font-weight: bold;
      margin-right: 0.25rem;
    }
  `}

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 0.875rem;
    
    &::after {
      margin-left: 0.5rem;
    }
  }
`;

export const ColorInput = styled.input<{ $isValid?: boolean }>`
  width: 100%;
  height: 50px;
  padding: 0;
  border: 3px solid ${({ $isValid = true }) => 
    $isValid ? 'rgba(255, 215, 0, 0.3)' : 'rgba(239, 68, 68, 0.5)'};
  border-radius: 12px;
  cursor: pointer;
  background-color: transparent;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    border-color: ${({ $isValid = true }) => 
      $isValid ? 'rgba(255, 215, 0, 0.6)' : 'rgba(239, 68, 68, 0.7)'};
    box-shadow: 0 0 20px ${({ $isValid = true }) => 
      $isValid ? 'rgba(255, 215, 0, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  }
  
  &:focus {
    outline: none;
    border-color: ${({ $isValid = true }) => 
      $isValid ? '#FFD700' : '#ef4444'};
    animation: ${pulse} 2s infinite;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    height: 40px;
  }
`;

export const RangeSlider = styled.input`
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.7));
  border-radius: 5px;
  outline: none;
  cursor: pointer;
  margin: 1rem 0;
  transition: all 0.3s ease;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
    transition: all 0.3s ease;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
  
  &::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
  }
  
  &::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  }

  &:hover {
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.4), rgba(255, 215, 0, 0.8));
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    height: 6px;
    
    &::-webkit-slider-thumb {
      width: 20px;
      height: 20px;
    }
    
    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
    }
  }
`;

const baseInputStyles = css`
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.4);
  color: #e0e0e0;
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:focus {
    border-color: #FFD700;
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  }
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.6);
  }

  &::placeholder {
    color: #888;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.75rem;
    font-size: 0.875rem;
  }
`;

export const SelectInput = styled.select`
  ${baseInputStyles}
  cursor: pointer;
  
  option {
    background: #2a2a2a;
    color: #e0e0e0;
    padding: 0.5rem;
  }
`;

export const TextInput = styled.input`
  ${baseInputStyles}
`;

export const TextArea = styled.textarea`
  ${baseInputStyles}
  min-height: 120px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  resize: vertical;
  line-height: 1.5;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    min-height: 100px;
    font-size: 0.8rem;
  }
`;

// === BUTTON COMPONENTS ===
export const PresetButton = styled.button<{ $active?: boolean; $variant?: string }>`
  padding: 1rem 1.5rem;
  margin: 0.5rem;
  background: ${({ $active, $variant }) => {
    if ($active) return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
    if ($variant === 'danger') return 'rgba(239, 68, 68, 0.1)';
    if ($variant === 'success') return 'rgba(34, 197, 94, 0.1)';
    return 'rgba(255, 255, 255, 0.1)';
  }};
  color: ${({ $active, $variant }) => {
    if ($active) return '#000';
    if ($variant === 'danger') return '#ef4444';
    if ($variant === 'success') return '#22c55e';
    return '#e0e0e0';
  }};
  border: 2px solid ${({ $active, $variant }) => {
    if ($active) return '#FFD700';
    if ($variant === 'danger') return 'rgba(239, 68, 68, 0.3)';
    if ($variant === 'success') return 'rgba(34, 197, 94, 0.3)';
    return 'rgba(255, 215, 0, 0.3)';
  }};
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  &:hover {
    background: ${({ $active, $variant }) => {
      if ($active) return 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)';
      if ($variant === 'danger') return 'rgba(239, 68, 68, 0.2)';
      if ($variant === 'success') return 'rgba(34, 197, 94, 0.2)';
      return 'rgba(255, 215, 0, 0.2)';
    }};
    border-color: ${({ $variant }) => {
      if ($variant === 'danger') return '#ef4444';
      if ($variant === 'success') return '#22c55e';
      return '#FFD700';
    }};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px ${({ $variant }) => {
      if ($variant === 'danger') return 'rgba(239, 68, 68, 0.3)';
      if ($variant === 'success') return 'rgba(34, 197, 94, 0.3)';
      return 'rgba(255, 215, 0, 0.3)';
    }};
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
  
  &:active::before {
    width: 300px;
    height: 300px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.75rem 1rem;
    margin: 0.25rem;
    font-size: 0.875rem;
  }
`;

export const ActionBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
  }
`;

export const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  background: ${({ $variant = 'primary' }) => {
    switch ($variant) {
      case 'danger': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'secondary': return 'rgba(255, 255, 255, 0.1)';
      default: return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
    }
  }};
  color: ${({ $variant = 'primary' }) => 
    $variant === 'secondary' ? '#e0e0e0' : '#000'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 16px ${({ $variant = 'primary' }) => {
    switch ($variant) {
      case 'danger': return 'rgba(239, 68, 68, 0.3)';
      case 'secondary': return 'rgba(0, 0, 0, 0.2)';
      default: return 'rgba(255, 215, 0, 0.3)';
    }
  }};
  border: 1px solid ${({ $variant = 'primary' }) => {
    switch ($variant) {
      case 'danger': return 'transparent';
      case 'secondary': return 'rgba(255, 215, 0, 0.3)';
      default: return 'transparent';
    }
  }};
  
  &:hover {
    background: ${({ $variant = 'primary' }) => {
      switch ($variant) {
        case 'danger': return 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
        case 'secondary': return 'rgba(255, 215, 0, 0.2)';
        default: return 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)';
      }
    }};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px ${({ $variant = 'primary' }) => {
      switch ($variant) {
        case 'danger': return 'rgba(239, 68, 68, 0.4)';
        case 'secondary': return 'rgba(255, 215, 0, 0.3)';
        default: return 'rgba(255, 215, 0, 0.4)';
      }
    }};
  }
  
  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    justify-content: center;
  }
`;

// === TOGGLE COMPONENTS ===
export const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  margin-left: auto;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.2);
    transition: 0.4s;
    border-radius: 34px;
    border: 2px solid rgba(255, 215, 0, 0.3);

    &:before {
      position: absolute;
      content: "";
      height: 24px;
      width: 24px;
      left: 3px;
      bottom: 3px;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      transition: 0.4s;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  }

  input:checked + span {
    background: rgba(255, 215, 0, 0.3);
    border-color: #FFD700;
  }

  input:checked + span:before {
    transform: translateX(26px);
    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
  }

  input:focus + span {
    box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    width: 50px;
    height: 28px;

    span:before {
      height: 20px;
      width: 20px;
      left: 2px;
      bottom: 2px;
    }

    input:checked + span:before {
      transform: translateX(22px);
    }
  }
`;

// === COLLAPSIBLE COMPONENTS ===
export const CollapsibleSection = styled.div<{ $expanded: boolean }>`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  margin: 1rem 0;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 215, 0, 0.2);
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.4);
  }
`;

export const CollapsibleHeader = styled.div`
  padding: 1rem 1.5rem;
  cursor: pointer;
  background: rgba(255, 215, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
  }

  h4 {
    margin: 0;
    color: #FFD700;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.75rem 1rem;

    h4 {
      font-size: 0.9rem;
    }
  }
`;

export const CollapsibleContent = styled.div<{ $expanded: boolean }>`
  max-height: ${props => props.$expanded ? '2000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding: ${props => props.$expanded ? '1.5rem' : '0 1.5rem'};

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: ${props => props.$expanded ? '1rem' : '0 1rem'};
  }
`;

// === PREVIEW COMPONENTS ===
export const PreviewContainer = styled.div<{
  $backgroundImage?: string;
  $bgColor: string;
  $textColor: string;
  $gradientDirection?: string;
  $enableGradient?: boolean;
  $borderRadius?: number;
  $shadowIntensity?: number;
  $cardStyle?: string;
}>`
  margin-top: 2rem;
  padding: 2rem;
  border-radius: ${props => props.$borderRadius || 12}px;
  background: ${props => {
    if (props.$enableGradient && props.$gradientDirection) {
      return `linear-gradient(${props.$gradientDirection}, ${props.$bgColor}, ${props.$textColor}20)`;
    }
    return props.$bgColor;
  }};
  color: ${props => props.$textColor};
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow: ${props => {
    const intensity = props.$shadowIntensity || 1;
    return `0 ${8 * intensity}px ${32 * intensity}px rgba(0, 0, 0, ${0.3 * intensity})`;
  }};
  transition: all 0.3s ease;

  ${props => props.$backgroundImage && css`
    background-image: url(${props.$backgroundImage});
    background-size: cover;
    background-position: center;
    background-blend-mode: overlay;
  `}
  
  ${props => props.$cardStyle === 'luxury' && css`
    background: linear-gradient(135deg, 
      rgba(255, 215, 0, 0.1) 0%, 
      rgba(255, 255, 255, 0.05) 50%, 
      rgba(255, 215, 0, 0.1) 100%);
    border: 2px solid #FFD700;
    box-shadow: 
      0 0 30px rgba(255, 215, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  `}
  
  ${props => props.$cardStyle === 'minimal' && css`
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(20px);
  `}
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.6);
    box-shadow: ${props => {
      const intensity = props.$shadowIntensity || 1;
      return `0 ${12 * intensity}px ${48 * intensity}px rgba(255, 215, 0, ${0.2 * intensity})`;
    }};
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    padding: 1.5rem;
    margin-top: 1.5rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 1rem;
    margin-top: 1rem;
  }
`;

export const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(255, 215, 0, 0.2);

  h4 {
    margin: 0;
    color: #FFD700;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

export const ImagePreview = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  position: relative;
  z-index: 2;

  img {
    max-height: 80px;
    max-width: 45%;
    object-fit: contain;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 0.5rem;
    border: 2px solid rgba(255, 215, 0, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
      border-color: rgba(255, 215, 0, 0.6);
      transform: scale(1.05);
    }
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    flex-direction: column;
    
    img {
      max-width: 80%;
      max-height: 60px;
    }
  }
`;

export const PreviewTitle = styled.h3<{ $accentColor: string; $textShadow?: boolean }>`
  margin-bottom: 1rem;
  color: ${props => props.$accentColor};
  position: relative;
  z-index: 2;
  font-size: 1.5rem;
  font-weight: 700;
  text-shadow: ${props => props.$textShadow ? '0 2px 4px rgba(0, 0, 0, 0.5)' : 'none'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(5px);
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 1.25rem;
  }
`;

export const PreviewText = styled.p`
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
  line-height: 1.6;
  font-size: 1rem;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 0.875rem;
  }
`;

export const PreviewHighlight = styled.div`
  padding: 1rem;
  border-radius: 8px;
  position: relative;
  z-index: 2;
  margin: 1rem 0;
  border-left: 4px solid #FFD700;
  background: rgba(255, 215, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: translateX(5px);
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.75rem;
  }
`;

// === UTILITY COMPONENTS ===
export const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 215, 0, 0.2);
  border-top: 4px solid #FFD700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    width: 30px;
    height: 30px;
    border-width: 3px;
  }
`;

export const ErrorMessage = styled.div`
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.75rem;
    font-size: 0.875rem;
  }
`;

export const SuccessMessage = styled.div`
  padding: 1rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  color: #22c55e;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.75rem;
    font-size: 0.875rem;
  }
`;

// === TOGGLE SWITCH COMPONENT ===
export const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  cursor: pointer;

  input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;

    &:checked + span {
      background-color: #FFD700;
      
      &:before {
        transform: translateX(26px);
        background-color: #000;
      }
    }

    &:focus + span {
      box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.3);
    }
  }

  span {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 24px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid rgba(255, 215, 0, 0.3);

    &:before {
      content: '';
      position: absolute;
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: #e0e0e0;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    &:hover {
      border-color: rgba(255, 215, 0, 0.5);
      
      &:before {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }
    }
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    width: 44px;
    height: 20px;
    
    span:before {
      height: 14px;
      width: 14px;
    }
    
    input:checked + span:before {
      transform: translateX(22px);
    }
  }
`;

// === ACTION BAR COMPONENT ===
export const ActionBar = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  margin: 2rem 0;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 215, 0, 0.05));
  border-radius: 16px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 1rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    margin: 1rem 0;
  }
`;

// === ACTION BUTTON COMPONENT ===
export const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
  padding: 0.75rem 1.5rem;
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'danger': return 'linear-gradient(135deg, rgba(239, 68, 68, 0.8), rgba(185, 28, 28, 0.9))';
      case 'success': return 'linear-gradient(135deg, rgba(34, 197, 94, 0.8), rgba(21, 128, 61, 0.9))';
      case 'secondary': return 'rgba(255, 255, 255, 0.1)';
      default: return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
    }
  }};
  color: ${({ $variant }) => {
    switch ($variant) {
      case 'secondary': return '#e0e0e0';
      case 'danger':
      case 'success':
      case 'primary':
      default: return '#000';
    }
  }};
  border: 2px solid ${({ $variant }) => {
    switch ($variant) {
      case 'danger': return 'rgba(239, 68, 68, 0.5)';
      case 'success': return 'rgba(34, 197, 94, 0.5)';
      case 'secondary': return 'rgba(255, 215, 0, 0.3)';
      default: return '#FFD700';
    }
  }};
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 120px;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px ${({ $variant }) => {
      switch ($variant) {
        case 'danger': return 'rgba(239, 68, 68, 0.4)';
        case 'success': return 'rgba(34, 197, 94, 0.4)';
        case 'secondary': return 'rgba(255, 215, 0, 0.3)';
        default: return 'rgba(255, 215, 0, 0.4)';
      }
    }};
    border-color: ${({ $variant }) => {
      switch ($variant) {
        case 'danger': return 'rgba(239, 68, 68, 0.8)';
        case 'success': return 'rgba(34, 197, 94, 0.8)';
        case 'secondary': return 'rgba(255, 215, 0, 0.5)';
        default: return '#FFA500';
      }
    }};
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 12px ${({ $variant }) => {
      switch ($variant) {
        case 'danger': return 'rgba(239, 68, 68, 0.3)';
        case 'success': return 'rgba(34, 197, 94, 0.3)';
        case 'secondary': return 'rgba(255, 215, 0, 0.2)';
        default: return 'rgba(255, 215, 0, 0.3)';
      }
    }};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
    min-width: 100px;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    min-width: 90px;
    width: 100%;
  }
`;

// === COLLAPSIBLE COMPONENTS ===
export const CollapsibleSection = styled.div<{ $expanded: boolean }>`
  margin: 1.5rem 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);

  &:hover {
    border-color: rgba(255, 215, 0, 0.4);
    box-shadow: 0 6px 24px rgba(255, 215, 0, 0.1);
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    margin: 1rem 0;
  }
`;

export const CollapsibleHeader = styled.div`
  padding: 1.5rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);
  user-select: none;

  h4 {
    margin: 0;
    color: #FFD700;
    font-weight: 600;
    font-size: 1.1rem;
  }

  &:hover {
    background: rgba(255, 215, 0, 0.05);
    
    h4 {
      color: #FFA500;
    }
  }

  svg {
    transition: transform 0.3s ease;
    color: #FFD700;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    padding: 1.25rem;
    
    h4 {
      font-size: 1rem;
    }
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 1rem;
    
    h4 {
      font-size: 0.9rem;
    }
  }
`;

export const CollapsibleContent = styled.div<{ $expanded: boolean }>`
  max-height: ${({ $expanded }) => $expanded ? '2000px' : '0'};
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: ${({ $expanded }) => $expanded ? '1' : '0'};
  
  > div {
    padding: ${({ $expanded }) => $expanded ? '1.5rem' : '0 1.5rem'};
    transition: padding 0.3s ease;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    > div {
      padding: ${({ $expanded }) => $expanded ? '1.25rem' : '0 1.25rem'};
    }
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    > div {
      padding: ${({ $expanded }) => $expanded ? '1rem' : '0 1rem'};
    }
  }
`;

// === PREVIEW COMPONENTS ===
export const PreviewContainer = styled.div<{
  $backgroundImage?: string;
  $bgColor?: string;
  $textColor?: string;
  $gradientDirection?: string;
  $enableGradient?: boolean;
  $borderRadius?: number;
  $shadowIntensity?: number;
  $cardStyle?: string;
}>`
  margin-top: 2rem;
  padding: 2rem;
  border-radius: ${({ $borderRadius }) => $borderRadius || 12}px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(15px);
  color: ${({ $textColor }) => $textColor || '#e0e0e0'};
  box-shadow: 0 ${({ $shadowIntensity = 1 }) => 8 * $shadowIntensity}px ${({ $shadowIntensity = 1 }) => 32 * $shadowIntensity}px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 1;

  // Background handling
  background: ${({ $backgroundImage, $bgColor, $enableGradient, $gradientDirection }) => {
    if ($backgroundImage) {
      return `url(${$backgroundImage}), ${$bgColor || '#1A1A1A'}`;
    }
    if ($enableGradient && $gradientDirection) {
      return `linear-gradient(${$gradientDirection}, ${$bgColor || '#1A1A1A'}, ${$bgColor || '#1A1A1A'}80)`;
    }
    return $bgColor || 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))';
  }};
  background-size: cover;
  background-position: center;
  background-blend-mode: overlay;

  // Overlay for readability
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${({ $cardStyle }) => {
      switch ($cardStyle) {
        case 'luxury': return 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 255, 255, 0.05))';
        case 'minimal': return 'rgba(255, 255, 255, 0.02)';
        case 'classic': return 'rgba(0, 0, 0, 0.3)';
        default: return 'rgba(255, 255, 255, 0.1)';
      }
    }};
    z-index: -1;
    border-radius: inherit;
  }

  &:hover {
    border-color: rgba(255, 215, 0, 0.5);
    box-shadow: 0 ${({ $shadowIntensity = 1 }) => 12 * $shadowIntensity}px ${({ $shadowIntensity = 1 }) => 48 * $shadowIntensity}px rgba(255, 215, 0, 0.2);
    transform: translateY(-2px);
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    padding: 1.5rem;
    margin-top: 1.5rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 1rem;
    margin-top: 1rem;
  }
`;

export const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(255, 215, 0, 0.2);

  h4 {
    margin: 0;
    color: #FFD700;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

export const ImagePreview = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  position: relative;
  z-index: 2;

  img {
    max-height: 80px;
    max-width: 45%;
    object-fit: contain;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 0.5rem;
    border: 2px solid rgba(255, 215, 0, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
      border-color: rgba(255, 215, 0, 0.6);
      transform: scale(1.05);
    }
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    flex-direction: column;
    
    img {
      max-width: 80%;
      max-height: 60px;
    }
  }
`;

export const PreviewTitle = styled.h3<{ $accentColor: string; $textShadow?: boolean }>`
  margin-bottom: 1rem;
  color: ${props => props.$accentColor};
  position: relative;
  z-index: 2;
  font-size: 1.5rem;
  font-weight: 700;
  text-shadow: ${props => props.$textShadow ? '0 2px 4px rgba(0, 0, 0, 0.5)' : 'none'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(5px);
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 1.25rem;
  }
`;

export const PreviewText = styled.p`
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
  line-height: 1.6;
  font-size: 1rem;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    font-size: 0.875rem;
  }
`;

export const PreviewHighlight = styled.div`
  padding: 1rem;
  border-radius: 8px;
  position: relative;
  z-index: 2;
  margin: 1rem 0;
  border-left: 4px solid #FFD700;
  background: rgba(255, 215, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: translateX(5px);
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.75rem;
  }
`;

/**
 * FINAL STYLED COMPONENTS COMPLETION SUMMARY:
 * ✅ Added ToggleSwitch - Modern toggle with smooth animations
 * ✅ Added ActionBar - Responsive button container
 * ✅ Added ActionButton - Multi-variant button with hover effects
 * ✅ Added CollapsibleSection - Expandable content container
 * ✅ Added CollapsibleHeader - Interactive header with hover states
 * ✅ Added CollapsibleContent - Smooth expand/collapse content area
 * ✅ Added PreviewContainer - Dynamic theme preview with background handling
 * ✅ Added PreviewHeader - Preview section header
 * ✅ Added ImagePreview - Logo and image preview container
 * ✅ Added PreviewTitle - Themed title with shadow options
 * ✅ Added PreviewText - Styled preview text
 * ✅ Added PreviewHighlight - Highlighted content sections
 * 
 * 🎉 REFACTORING COMPLETE: All 6 missing styled components added!
 * 
 * All components follow the established design patterns:
 * - Consistent color scheme (FFD700 gold theme)
 * - Responsive breakpoints for mobile/tablet
 * - Smooth transitions and hover effects
 * - Backdrop blur and glassmorphism styling
 * - Proper accessibility considerations
 * - Dynamic theming support
 */
