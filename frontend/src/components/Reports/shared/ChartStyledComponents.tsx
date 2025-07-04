/**
 * Chart Styled Components - Reusable Styled Components for Chart Visualizations
 * Extracted from DataVisualizationPanel for better modularity
 * Production-ready styled components with theme integration
 */

import styled, { keyframes } from 'styled-components';

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

const slideIn = keyframes`
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// === MAIN SECTION CONTAINER ===
export const Section = styled.div`
  margin-bottom: 2rem;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  padding: 1.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.md};
  position: relative;
  animation: ${fadeIn} 0.3s ease-out;
  
  @media (max-width: 768px) {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    margin-bottom: 1rem;
  }
`;

// === SECTION TITLE ===
export const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.gold[500]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  padding-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: ${slideIn} 0.4s ease-out;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }
  
  @media (max-width: 480px) {
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }
`;

// === CHART CONTAINER ===
export const ChartContainer = styled.div`
  margin-top: 1.5rem;
  background-color: ${({ theme }) => theme.colors.card.DEFAULT};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: 1.5rem;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  transition: ${({ theme }) => theme.transitions.base};
  position: relative;
  animation: ${fadeIn} 0.5s ease-out;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.xl};
    transform: translateY(-3px);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    margin-top: 1rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    margin-top: 0.75rem;
  }
`;

// === DATA GRID ===
export const DataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.6s ease-out;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: ${({ theme }) => theme.spacing.medium};
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

// === METRIC CARD ===
export const MetricCard = styled.div`
  background-color: ${({ theme }) => theme.colors.card.DEFAULT};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.base};
  text-align: center;
  transition: ${({ theme }) => theme.transitions.base};
  position: relative;
  animation: ${fadeIn} 0.7s ease-out;

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
    border-color: ${({ theme }) => theme.colors.gold[500]};
    animation: ${pulse} 0.3s ease-out;
  }

  @media (max-width: 480px) {
    padding: ${({ theme }) => theme.spacing.medium};
  }
`;

// === METRIC VALUE ===
export const MetricValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gold[500]};
  animation: ${fadeIn} 0.8s ease-out;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  }
  
  @media (max-width: 480px) {
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }
`;

// === METRIC LABEL ===
export const MetricLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.muted.foreground};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
  
  @media (max-width: 480px) {
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
  }
`;

// === CHART TABS ===
export const ChartTab = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  overflow-x: auto;
  animation: ${slideIn} 0.5s ease-out;

  @media (max-width: 640px) {
    -webkit-overflow-scrolling: touch;
    padding-bottom: 1px;
  }
`;

// === TAB BUTTON ===
export const TabButton = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.spacing.medium} ${({ theme }) => theme.spacing.lg};
  background: transparent;
  color: ${({ $active, theme }) => 
    $active ? theme.colors.gold[500] : theme.colors.muted.foreground};
  border: none;
  font-weight: ${({ $active, theme }) => 
    $active ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal};
  cursor: pointer;
  border-bottom: 2px solid ${({ $active, theme }) => 
    $active ? theme.colors.gold[500] : 'transparent'};
  transition: ${({ theme }) => theme.transitions.base};
  white-space: nowrap;
  position: relative;

  &:hover {
    color: ${({ $active, theme }) => 
      $active ? theme.colors.gold[500] : theme.colors.foreground};
    background-color: ${({ theme }) => theme.colors.muted.DEFAULT}22;
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.gold[500]};
    outline-offset: 2px;
  }

  @media (max-width: 480px) {
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.medium};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

// === TIMEFRAME TABS ===
export const TimeframeTab = styled.div`
  display: flex;
  margin-bottom: 1rem;
  gap: ${({ theme }) => theme.spacing.sm};
  overflow-x: auto;
  animation: ${slideIn} 0.6s ease-out;
`;

// === TIMEFRAME BUTTON ===
export const TimeframeButton = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.medium};
  background: ${({ $active, theme }) => 
    $active ? theme.colors.gold[500] : theme.colors.secondary.DEFAULT};
  color: ${({ $active, theme }) => 
    $active ? theme.colors.primary.foreground : theme.colors.gold[500]};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: ${({ theme }) => theme.transitions.base};
  white-space: nowrap;

  &:hover {
    background: ${({ $active, theme }) => 
      $active ? theme.colors.gold[600] : theme.colors.secondary.foreground};
    transform: translateY(-1px);
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.gold[500]};
    outline-offset: 2px;
  }

  @media (max-width: 480px) {
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
  }
`;

// === ACTION BUTTONS ===
export const ExportButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.medium};
  background-color: ${({ theme }) => theme.colors.gold[500]};
  color: ${({ theme }) => theme.colors.primary.foreground};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  transition: ${({ theme }) => theme.transitions.base};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.gold[600]};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.muted.DEFAULT};
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.gold[500]};
    outline-offset: 2px;
  }

  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
    margin-top: 0.5rem;
  }
`;

export const SaveButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.medium};
  background-color: ${({ theme }) => theme.colors.primary.DEFAULT};
  color: ${({ theme }) => theme.colors.primary.foreground};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  transition: ${({ theme }) => theme.transitions.base};
  margin-left: ${({ theme }) => theme.spacing.sm};

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary.DEFAULT};
    outline-offset: 2px;
  }

  @media (max-width: 480px) {
    margin-left: 0;
    margin-top: 0.5rem;
    width: 100%;
    justify-content: center;
  }
`;

// === INSIGHT BOX ===
export const InsightBox = styled.div`
  margin-top: 1.5rem;
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.muted.DEFAULT};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border-left: 4px solid ${({ theme }) => theme.colors.gold[500]};
  animation: ${fadeIn} 0.9s ease-out;

  h4 {
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: ${({ theme }) => theme.colors.gold[500]};
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  }

  p {
    margin-bottom: 0.75rem;
    font-size: ${({ theme }) => theme.typography.fontSize.base};
    line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
    color: ${({ theme }) => theme.colors.foreground};
  }

  strong {
    color: ${({ theme }) => theme.colors.gold[500]};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  }

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.medium};
    margin-top: 1rem;

    h4 {
      font-size: ${({ theme }) => theme.typography.fontSize.base};
    }

    p {
      font-size: ${({ theme }) => theme.typography.fontSize.sm};
    }
  }
`;

// === LOADING COMPONENTS ===
export const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 5;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  animation: ${fadeIn} 0.2s ease-out;
`;

export const LoadingSpinner = styled.div`
  border: 4px solid ${({ theme }) => theme.colors.border};
  border-top: 4px solid ${({ theme }) => theme.colors.gold[500]};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: ${spin} 2s linear infinite;
`;

export const LoadingText = styled.div`
  color: ${({ theme }) => theme.colors.foreground};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

// === STATUS COMPONENTS ===
export const StatusMessage = styled.div<{ $type: 'info' | 'success' | 'warning' | 'error' }>`
  padding: ${({ theme }) => theme.spacing.medium};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  margin-bottom: ${({ theme }) => theme.spacing.medium};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  animation: ${slideIn} 0.3s ease-out;

  ${({ $type, theme }) => {
    switch ($type) {
      case 'success':
        return `
          background-color: ${theme.colors.success}22;
          color: ${theme.colors.success};
          border: 1px solid ${theme.colors.success}44;
        `;
      case 'warning':
        return `
          background-color: ${theme.colors.warning}22;
          color: ${theme.colors.warning};
          border: 1px solid ${theme.colors.warning}44;
        `;
      case 'error':
        return `
          background-color: ${theme.colors.error}22;
          color: ${theme.colors.error};
          border: 1px solid ${theme.colors.error}44;
        `;
      default:
        return `
          background-color: ${theme.colors.info}22;
          color: ${theme.colors.info};
          border: 1px solid ${theme.colors.info}44;
        `;
    }
  }}
`;

// === CHART WRAPPER ===
export const ChartWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  
  .recharts-wrapper {
    animation: ${fadeIn} 0.5s ease-out;
  }
  
  .recharts-tooltip-wrapper {
    z-index: 10;
  }
  
  .recharts-legend-wrapper {
    margin-top: 1rem;
  }
`;

// === RESPONSIVE GRID ===
export const ResponsiveGrid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns || 1}, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.medium};
  }
`;

// === BUTTON GROUP ===
export const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  flex-wrap: wrap;
  
  @media (max-width: 480px) {
    flex-direction: column;
    width: 100%;
    
    > * {
      width: 100%;
    }
  }
`;

// === ACCESSIBILITY HELPERS ===
export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

// === FOCUS TRAP ===
export const FocusTrap = styled.div`
  &:focus-within {
    outline: 2px solid ${({ theme }) => theme.colors.gold[500]};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.borderRadius.small};
  }
`;

// === ANIMATION DELAY HELPERS ===
export const AnimationDelay = styled.div<{ $delay: number }>`
  animation-delay: ${({ $delay }) => $delay}ms;
`;

// === THEME TRANSITION WRAPPER ===
export const ThemeTransitionWrapper = styled.div`
  * {
    transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
  }
`;
