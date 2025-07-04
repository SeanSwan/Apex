/**
 * Preview Styled Components - Comprehensive Styled Components for Preview Panel
 * Extracted from EnhancedPreviewPanel for better modularity
 * Production-ready styled components with theme integration and responsive design
 */

import styled, { keyframes, css } from 'styled-components';
import { 
  getRandomTexturePosition, 
  getRandomOpacity,
  getRandomTextureSize,
  RESPONSIVE_BREAKPOINTS,
  ANIMATION_CONFIG,
  COMPONENT_CONFIG,
  GRID_CONFIG,
  MARBLE_TEXTURE_CONFIG
} from '../constants/previewPanelConstants';
import marbleTexture from '../../../assets/marble-texture.png';

// === ANIMATIONS ===
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInFromLeft = keyframes`
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideInFromRight = keyframes`
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const scaleIn = keyframes`
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

// === MAIN CONTAINER ===
export const Section = styled.div`
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.6s ease-out;
`;

export const SectionTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.TABLET}px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

// === PREVIEW CONTROLS ===
export const PreviewControlsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.TABLET}px) {
    width: 100%;
    justify-content: space-between;
  }
`;

export const PreviewControls = styled.div`
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 4px;
  padding: 0.5rem;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    width: 100%;
    justify-content: center;
  }
`;

export const PreviewButton = styled.button<{ $active?: boolean }>`
  padding: 0.5rem 1rem;
  background-color: ${props => props.$active ? '#0070f3' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#333'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all ${ANIMATION_CONFIG.TRANSITION_DURATION} ease;
  font-weight: 500;

  &:hover {
    background-color: ${props => props.$active ? '#0060df' : '#e0e0e0'};
    transform: ${props => props.$active ? 'none' : ANIMATION_CONFIG.HOVER_TRANSFORM};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    flex: 1;
    text-align: center;
    font-size: 0.75rem;
    padding: 0.5rem;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    width: 100%;
    justify-content: stretch;
  }
`;

export const ActionButton = styled.button<{ 
  $variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  $size?: 'small' | 'medium' | 'large';
}>`
  padding: ${props => {
    switch (props.$size) {
      case 'small': return '0.25rem 0.75rem';
      case 'large': return '0.75rem 1.5rem';
      default: return '0.5rem 1rem';
    }
  }};
  background-color: ${props => {
    switch (props.$variant) {
      case 'primary': return '#0070f3';
      case 'success': return '#28a745';
      case 'danger': return '#dc3545';
      case 'warning': return '#ffc107';
      default: return '#6c757d';
    }
  }};
  color: ${props => props.$variant === 'warning' ? '#000' : 'white'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: ${props => {
    switch (props.$size) {
      case 'small': return '0.75rem';
      case 'large': return '1rem';
      default: return '0.875rem';
    }
  }};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all ${ANIMATION_CONFIG.TRANSITION_DURATION} ease;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: ${ANIMATION_CONFIG.HOVER_TRANSFORM};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.TABLET}px) {
    width: 100%;
    justify-content: center;
  }
`;

export const DownloadButton = styled(ActionButton).attrs({ $variant: 'success' })``;
export const PDFButton = styled(ActionButton).attrs({ $variant: 'danger' })``;

// === PREVIEW CONTAINER ===
export const PreviewContainer = styled.div<{ $fontFamily?: string; $zoom?: number }>`
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
  font-family: ${props => props.$fontFamily || 'inherit'};
  position: relative;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  background-color: #1e1e1e;
  color: #e0e0e0;
  transform: ${props => props.$zoom ? `scale(${props.$zoom})` : 'scale(1)'};
  transform-origin: top left;
  transition: transform 0.3s ease;
  animation: ${scaleIn} 0.6s ease-out;
`;

// === HEADER SECTION ===
export const HeaderSection = styled.div<{ 
  $backgroundImage?: string; 
  $opacity?: number;
}>`
  background-image: ${props => props.$backgroundImage ? `url(${props.$backgroundImage})` : `url(${marbleTexture})`};
  background-size: cover;
  background-position: center;
  min-height: ${COMPONENT_CONFIG.HEADER.MIN_HEIGHT.DESKTOP};
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${COMPONENT_CONFIG.HEADER.PADDING.DESKTOP};
  position: relative;
  background-color: #191919;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, ${props => props.$opacity || 0.7});
    z-index: 1;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    min-height: ${COMPONENT_CONFIG.HEADER.MIN_HEIGHT.MOBILE};
    padding: ${COMPONENT_CONFIG.HEADER.PADDING.MOBILE};
  }
`;

export const LogoContainer = styled.div`
  z-index: 2;
  max-width: ${COMPONENT_CONFIG.LOGO.MAX_WIDTH.DESKTOP};
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    max-height: ${COMPONENT_CONFIG.LOGO.MAX_HEIGHT.DESKTOP};
    max-width: 100%;
    object-fit: contain;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    max-width: ${COMPONENT_CONFIG.LOGO.MAX_WIDTH.MOBILE};

    img {
      max-height: ${COMPONENT_CONFIG.LOGO.MAX_HEIGHT.MOBILE};
    }
  }
`;

export const HeaderContent = styled.div`
  z-index: 2;
  color: #e5c76b;
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: ${slideInFromLeft} 0.8s ease-out;
`;

export const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
  animation: ${fadeIn} 1s ease-out 0.2s both;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.TABLET}px) {
    font-size: 1.5rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    font-size: 1.25rem;
  }
`;

export const HeaderSubtitle = styled.div`
  font-size: 1.125rem;
  margin-top: 0.5rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  animation: ${fadeIn} 1s ease-out 0.4s both;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.TABLET}px) {
    font-size: 0.875rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    font-size: 0.75rem;
  }
`;

// === CONTENT SECTION ===
export const ContentSection = styled.div<{ 
  $primaryColor?: string; 
  $secondaryColor?: string;
}>`
  padding: 1.5rem;
  background-color: ${props => props.$secondaryColor || '#121212'};
  color: ${props => props.$primaryColor || '#e0e0e0'};
  position: relative;
  animation: ${slideInFromRight} 0.8s ease-out 0.2s both;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    padding: 1rem;
  }
`;

export const ContentSectionHeader = styled.h2<{ $accentColor?: string }>`
  color: ${props => props.$accentColor || '#e5c76b'};
  margin-bottom: 1.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${props => props.$accentColor || '#e5c76b'};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: ${slideInFromLeft} 0.6s ease-out;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    font-size: 1.25rem;
  }
`;

// === LOADING AND STATUS ===
export const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
`;

export const LoadingSpinner = styled.div<{ $size?: 'small' | 'medium' | 'large' }>`
  border: 4px solid #2a2a2a;
  border-top: 4px solid #e5c76b;
  border-radius: 50%;
  width: ${props => {
    switch (props.$size) {
      case 'small': return '24px';
      case 'large': return '60px';
      default: return '40px';
    }
  }};
  height: ${props => {
    switch (props.$size) {
      case 'small': return '24px';
      case 'large': return '60px';
      default: return '40px';
    }
  }};
  animation: ${spin} ${ANIMATION_CONFIG.SPIN_DURATION} linear infinite;
`;

export const StatusIndicator = styled.div<{ 
  $status: 'loading' | 'success' | 'error' | 'warning';
  $size?: 'small' | 'medium' | 'large';
}>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: ${props => {
    switch (props.$size) {
      case 'small': return '0.75rem';
      case 'large': return '1rem';
      default: return '0.875rem';
    }
  }};
  font-weight: 500;
  background-color: ${props => {
    switch (props.$status) {
      case 'loading': return 'rgba(108, 117, 125, 0.1)';
      case 'success': return 'rgba(40, 167, 69, 0.1)';
      case 'error': return 'rgba(220, 53, 69, 0.1)';
      case 'warning': return 'rgba(255, 193, 7, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'loading': return '#6c757d';
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'warning': return '#ffc107';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$status) {
      case 'loading': return '#6c757d';
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'warning': return '#ffc107';
    }
  }};

  &::before {
    content: '${props => {
      switch (props.$status) {
        case 'loading': return '⏳';
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
      }
    }}';
  }

  ${props => props.$status === 'loading' && css`
    animation: ${pulse} 2s infinite;
  `}
`;

// === CONTACT INFORMATION ===
export const ContactSection = styled.div`
  margin-top: 1.5rem;
  padding: 1.25rem;
  background-color: transparent;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  background-image: url(${marbleTexture});
  background-size: 150%;
  background-position: 30% 70%;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.58);
    z-index: 0;
    border-radius: 8px;
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

export const ContactInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    flex-direction: column;
  }
`;

export const ContactItem = styled.div`
  display: flex;
  flex-direction: column;
  animation: ${fadeIn} 0.6s ease-out;
`;

export const ContactLabel = styled.div`
  font-size: 0.75rem;
  color: #9e9e9e;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  font-weight: 500;
`;

export const ContactValue = styled.div`
  font-weight: 600;
  color: #e5c76b;
  font-size: 0.875rem;
`;

// === NOTES SECTION ===
export const NotesSection = styled.div`
  margin-top: 1.5rem;
  padding: 1.25rem;
  background-color: transparent;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  background-image: url(${marbleTexture});
  background-size: 140%;
  background-position: 60% 40%;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 0;
    border-radius: 8px;
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

export const NotesContent = styled.div`
  font-size: 0.875rem;
  line-height: 1.6;
  white-space: pre-line;
  color: #e0e0e0;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    font-size: 0.825rem;
  }
`;

// === DAILY REPORTS ===
export const DailyReportsSection = styled.div`
  margin-top: 2rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
`;

export const DailyReportItem = styled.div`
  padding: 1rem;
  background-color: transparent;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  background-image: url(${marbleTexture});
  background-size: ${getRandomTextureSize()};
  background-position: ${getRandomTexturePosition()};
  position: relative;
  animation: ${fadeIn} 0.6s ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, ${getRandomOpacity()});
    z-index: 0;
    border-radius: 8px;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    padding: 0.75rem;
  }
`;

export const DailyReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const DailyReportDay = styled.div`
  font-weight: 600;
  color: #e5c76b;
  font-size: 1.1rem;
`;

export const DailyReportContent = styled.div`
  font-size: 0.875rem;
  line-height: 1.6;
  white-space: pre-line;
  color: #e0e0e0;

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    font-size: 0.825rem;
    line-height: 1.5;
  }
`;

// === SECURITY CODE BADGE ===
export const SecurityCodeBadge = styled.span<{ $code: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => {
    switch(props.$code) {
      case 'Code 4': return 'rgba(209, 250, 229, 0.2)';
      case 'Code 3': return 'rgba(255, 249, 196, 0.2)';
      case 'Code 2': return 'rgba(255, 204, 188, 0.2)';
      case 'Code 1': return 'rgba(254, 202, 202, 0.2)';
      default: return 'rgba(209, 250, 229, 0.2)';
    }
  }};
  color: ${props => {
    switch(props.$code) {
      case 'Code 4': return '#2ecc71';
      case 'Code 3': return '#f1c40f';
      case 'Code 2': return '#e67e22';
      case 'Code 1': return '#e74c3c';
      default: return '#2ecc71';
    }
  }};
  transition: all ${ANIMATION_CONFIG.TRANSITION_DURATION} ease;

  &:hover {
    transform: scale(1.05);
  }
`;

// === ACCESSIBILITY ===
export const VisuallyHidden = styled.span`
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
`;

export const FocusTrap = styled.div`
  &:focus-within {
    outline: 2px solid #e5c76b;
    outline-offset: 2px;
  }
`;

// === RESPONSIVE UTILITIES ===
export const ResponsiveGrid = styled.div<{ 
  $columns: { desktop: string; tablet: string; mobile: string };
  $gap?: string;
}>`
  display: grid;
  grid-template-columns: ${props => props.$columns.desktop};
  gap: ${props => props.$gap || '1rem'};

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.DESKTOP}px) {
    grid-template-columns: ${props => props.$columns.tablet};
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    grid-template-columns: ${props => props.$columns.mobile};
  }
`;

export const ResponsiveText = styled.div<{
  $sizes: { desktop: string; tablet?: string; mobile?: string };
}>`
  font-size: ${props => props.$sizes.desktop};

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.TABLET}px) {
    font-size: ${props => props.$sizes.tablet || props.$sizes.desktop};
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
    font-size: ${props => props.$sizes.mobile || props.$sizes.tablet || props.$sizes.desktop};
  }
`;

// === ANIMATION HELPERS ===
export const AnimationDelay = styled.div<{ $delay: number }>`
  animation-delay: ${props => props.$delay}s;
`;

export const ThemeTransitionWrapper = styled.div`
  transition: all 0.3s ease;
`;

// === SKELETON LOADING ===
export const SkeletonLoader = styled.div<{ 
  $width?: string; 
  $height?: string;
  $borderRadius?: string;
}>`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 2s infinite;
  border-radius: ${props => props.$borderRadius || '4px'};
  width: ${props => props.$width || '100%'};
  height: ${props => props.$height || '1rem'};
`;

// === SCROLL CONTAINERS ===
export const ScrollContainer = styled.div<{ $maxHeight?: string }>`
  max-height: ${props => props.$maxHeight || '400px'};
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #e5c76b #2a2a2a;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #2a2a2a;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #e5c76b;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #d4af37;
  }
`;

// === TOOLTIP ===
export const TooltipWrapper = styled.div<{ $tooltip: string }>`
  position: relative;
  cursor: help;

  &:hover::after {
    content: '${props => props.$tooltip}';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    white-space: nowrap;
    z-index: 1000;
    opacity: 0;
    animation: ${fadeIn} 0.3s ease-out forwards;
  }
`;

// Default export with all components
export default {
  // Layout
  Section,
  SectionTitle,
  PreviewContainer,
  ContentSection,
  
  // Controls
  PreviewControlsContainer,
  PreviewControls,
  PreviewButton,
  ButtonGroup,
  ActionButton,
  DownloadButton,
  PDFButton,
  
  // Header
  HeaderSection,
  LogoContainer,
  HeaderContent,
  HeaderTitle,
  HeaderSubtitle,
  
  // Content
  ContentSectionHeader,
  NotesSection,
  NotesContent,
  ContactSection,
  ContactInfo,
  ContactItem,
  ContactLabel,
  ContactValue,
  
  // Daily Reports
  DailyReportsSection,
  DailyReportItem,
  DailyReportHeader,
  DailyReportDay,
  DailyReportContent,
  SecurityCodeBadge,
  
  // Loading & Status
  LoadingOverlay,
  LoadingSpinner,
  StatusIndicator,
  
  // Utilities
  VisuallyHidden,
  FocusTrap,
  ResponsiveGrid,
  ResponsiveText,
  AnimationDelay,
  ThemeTransitionWrapper,
  SkeletonLoader,
  ScrollContainer,
  TooltipWrapper
};
