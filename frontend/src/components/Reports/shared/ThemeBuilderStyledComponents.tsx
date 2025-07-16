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

export const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.4);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
  }
  
  h4 {
    margin: 0;
    color: #FFD700;
    font-weight: 600;
    font-size: 1.125rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .toggle-icon {
    color: #FFD700;
    transition: transform 0.3s ease;
    
    &.expanded {
      transform: rotate(180deg);
    }
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    padding: 0.875rem 1.25rem;
    
    h4 {
      font-size: 1rem;
    }
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.75rem 1rem;
    
    h4 {
      font-size: 0.875rem;
    }
  }
`;

export const SectionContent = styled.div<{ $expanded?: boolean }>`
  padding: 0 1.5rem 1.5rem;
  max-height: ${({ $expanded = true }) => $expanded ? '2000px' : '0'};
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: ${({ $expanded = true }) => $expanded ? '1' : '0'};
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0 0 12px 12px;
  
  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    padding: 0 1.25rem 1.25rem;
  }

  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0 1rem 1rem;
  }
`;

export const ValidationMessage = styled.div<{ $type?: 'error' | 'warning' | 'success' | 'info' }>`
  padding: 0.75rem 1rem;
  margin: 0.5rem 0;
  border-radius: 8px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  ${({ $type = 'info' }) => {
    switch ($type) {
      case 'error':
        return `
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        `;
      case 'warning':
        return `
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
        `;
      case 'success':
        return `
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
        `;
      default:
        return `
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #3b82f6;
        `;
    }
  }}
  
  &:hover {
    transform: translateX(2px);
  }
  
  .icon {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }
  
  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    padding: 0.625rem 0.875rem;
    font-size: 0.8rem;
  }
`;

export const CustomCSSEditor = styled.div`
  margin: 1.5rem 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.8) 100%);
  border-radius: 12px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  overflow: hidden;
  backdrop-filter: blur(10px);
  
  .editor-header {
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
    border-bottom: 1px solid rgba(255, 215, 0, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h4 {
      margin: 0;
      color: #FFD700;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .editor-actions {
      display: flex;
      gap: 0.5rem;
      
      button {
        padding: 0.375rem 0.75rem;
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 6px;
        background: rgba(255, 215, 0, 0.1);
        color: #FFD700;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(255, 215, 0, 0.2);
          border-color: rgba(255, 215, 0, 0.5);
        }
      }
    }
  }
  
  .editor-content {
    position: relative;
    
    textarea {
      width: 100%;
      min-height: 200px;
      padding: 1.5rem;
      border: none;
      background: transparent;
      color: #e0e0e0;
      font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      resize: vertical;
      outline: none;
      
      &::placeholder {
        color: #666;
        font-style: italic;
      }
    }
    
    .line-numbers {
      position: absolute;
      left: 0;
      top: 0;
      padding: 1.5rem 0.75rem;
      color: #666;
      font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      pointer-events: none;
      border-right: 1px solid rgba(255, 215, 0, 0.1);
      background: rgba(0, 0, 0, 0.3);
    }
  }
  
  .editor-footer {
    padding: 1rem 1.5rem;
    background: rgba(0, 0, 0, 0.2);
    border-top: 1px solid rgba(255, 215, 0, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: #888;
    
    .character-count {
      color: #666;
    }
    
    .syntax-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      &.valid {
        color: #22c55e;
      }
      
      &.invalid {
        color: #ef4444;
      }
    }
  }
  
  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    margin: 1rem 0;
    
    .editor-header {
      padding: 0.75rem 1rem;
      
      h4 {
        font-size: 0.875rem;
      }
    }
    
    .editor-content textarea {
      padding: 1rem;
      min-height: 150px;
      font-size: 0.8rem;
    }
    
    .editor-footer {
      padding: 0.75rem 1rem;
    }
  }
  
  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    .editor-header {
      flex-direction: column;
      gap: 0.5rem;
      
      .editor-actions {
        justify-content: center;
      }
    }
    
    .editor-content textarea {
      padding: 0.75rem;
      min-height: 120px;
    }
    
    .editor-footer {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }
  }
`;

export const ProgressIndicator = styled.div<{ $progress?: number; $variant?: 'primary' | 'success' | 'warning' | 'error' }>`
  margin: 1rem 0;
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    
    .progress-label {
      color: #e0e0e0;
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .progress-percentage {
      color: ${({ $variant = 'primary' }) => {
        switch ($variant) {
          case 'success': return '#22c55e';
          case 'warning': return '#f59e0b';
          case 'error': return '#ef4444';
          default: return '#FFD700';
        }
      }};
      font-size: 0.875rem;
      font-weight: 600;
    }
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(255, 215, 0, 0.2);
    
    .progress-fill {
      height: 100%;
      width: ${({ $progress = 0 }) => Math.min(Math.max($progress, 0), 100)}%;
      background: ${({ $variant = 'primary' }) => {
        switch ($variant) {
          case 'success': 
            return 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)';
          case 'warning': 
            return 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
          case 'error': 
            return 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
          default: 
            return 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)';
        }
      }};
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
        animation: ${shimmer} 2s infinite;
      }
    }
    
    &:hover {
      box-shadow: 0 0 12px ${({ $variant = 'primary' }) => {
        switch ($variant) {
          case 'success': return 'rgba(34, 197, 94, 0.3)';
          case 'warning': return 'rgba(245, 158, 11, 0.3)';
          case 'error': return 'rgba(239, 68, 68, 0.3)';
          default: return 'rgba(255, 215, 0, 0.3)';
        }
      }};
    }
  }
  
  .progress-details {
    margin-top: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: #888;
    
    .progress-eta {
      color: #666;
    }
    
    .progress-status {
      color: ${({ $variant = 'primary' }) => {
        switch ($variant) {
          case 'success': return '#22c55e';
          case 'warning': return '#f59e0b';
          case 'error': return '#ef4444';
          default: return '#FFD700';
        }
      }};
      font-weight: 500;
    }
  }
  
  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    .progress-header {
      .progress-label,
      .progress-percentage {
        font-size: 0.8rem;
      }
    }
    
    .progress-bar {
      height: 6px;
    }
    
    .progress-details {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
      
      .progress-eta,
      .progress-status {
        font-size: 0.7rem;
      }
    }
  }
`;

export const TooltipWrapper = styled.div<{ $position?: 'top' | 'bottom' | 'left' | 'right' }>`
  position: relative;
  display: inline-block;
  
  .tooltip-trigger {
    cursor: help;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    
    .help-icon {
      width: 16px;
      height: 16px;
      color: #FFD700;
      opacity: 0.7;
      transition: opacity 0.3s ease;
      
      &:hover {
        opacity: 1;
      }
    }
  }
  
  .tooltip-content {
    position: absolute;
    z-index: 1000;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%);
    color: #e0e0e0;
    border-radius: 8px;
    font-size: 0.875rem;
    line-height: 1.4;
    max-width: 250px;
    word-wrap: break-word;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    border: 1px solid rgba(255, 215, 0, 0.3);
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    
    /* Position variants */
    ${({ $position = 'top' }) => {
      switch ($position) {
        case 'bottom':
          return `
            top: calc(100% + 8px);
            left: 50%;
            transform: translateX(-50%) translateY(-4px);
            
            &::before {
              content: '';
              position: absolute;
              top: -6px;
              left: 50%;
              transform: translateX(-50%);
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-bottom: 6px solid rgba(0, 0, 0, 0.95);
            }
          `;
        case 'left':
          return `
            top: 50%;
            right: calc(100% + 8px);
            transform: translateY(-50%) translateX(4px);
            
            &::before {
              content: '';
              position: absolute;
              top: 50%;
              right: -6px;
              transform: translateY(-50%);
              border-top: 6px solid transparent;
              border-bottom: 6px solid transparent;
              border-left: 6px solid rgba(0, 0, 0, 0.95);
            }
          `;
        case 'right':
          return `
            top: 50%;
            left: calc(100% + 8px);
            transform: translateY(-50%) translateX(-4px);
            
            &::before {
              content: '';
              position: absolute;
              top: 50%;
              left: -6px;
              transform: translateY(-50%);
              border-top: 6px solid transparent;
              border-bottom: 6px solid transparent;
              border-right: 6px solid rgba(0, 0, 0, 0.95);
            }
          `;
        default: // top
          return `
            bottom: calc(100% + 8px);
            left: 50%;
            transform: translateX(-50%) translateY(4px);
            
            &::before {
              content: '';
              position: absolute;
              bottom: -6px;
              left: 50%;
              transform: translateX(-50%);
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid rgba(0, 0, 0, 0.95);
            }
          `;
      }
    }}
  }
  
  &:hover .tooltip-content {
    opacity: 1;
    visibility: visible;
    transform: ${({ $position = 'top' }) => {
      switch ($position) {
        case 'bottom': return 'translateX(-50%) translateY(0)';
        case 'left': return 'translateY(-50%) translateX(0)';
        case 'right': return 'translateY(-50%) translateX(0)';
        default: return 'translateX(-50%) translateY(0)';
      }
    }};
  }
  
  /* Ensure tooltip stays within viewport */
  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    .tooltip-content {
      max-width: 200px;
      font-size: 0.8rem;
      padding: 0.625rem 0.875rem;
    }
  }
  
  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    .tooltip-content {
      max-width: 150px;
      font-size: 0.75rem;
      padding: 0.5rem 0.75rem;
      
      /* Force bottom position on mobile for better UX */
      top: calc(100% + 8px) !important;
      bottom: auto !important;
      left: 50% !important;
      right: auto !important;
      transform: translateX(-50%) translateY(-4px) !important;
      
      &::before {
        top: -6px !important;
        bottom: auto !important;
        left: 50% !important;
        right: auto !important;
        transform: translateX(-50%) !important;
        border-left: 6px solid transparent !important;
        border-right: 6px solid transparent !important;
        border-bottom: 6px solid rgba(0, 0, 0, 0.95) !important;
        border-top: none !important;
      }
    }
    
    &:hover .tooltip-content {
      transform: translateX(-50%) translateY(0) !important;
    }
  }
`;

export const QuickActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'; $size?: 'small' | 'medium' | 'large' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  /* Size variants */
  ${({ $size = 'medium' }) => {
    switch ($size) {
      case 'small':
        return `
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          min-height: 32px;
        `;
      case 'large':
        return `
          padding: 0.875rem 1.75rem;
          font-size: 1rem;
          min-height: 48px;
        `;
      default: // medium
        return `
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
          min-height: 40px;
        `;
    }
  }}
  
  /* Color variants */
  ${({ $variant = 'primary' }) => {
    switch ($variant) {
      case 'secondary':
        return `
          background: rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
          border: 1px solid rgba(255, 215, 0, 0.3);
          
          &:hover {
            background: rgba(255, 215, 0, 0.15);
            border-color: rgba(255, 215, 0, 0.5);
            color: #FFD700;
          }
        `;
      case 'success':
        return `
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #ffffff;
          border: 1px solid #22c55e;
          
          &:hover {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
          }
        `;
      case 'warning':
        return `
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #ffffff;
          border: 1px solid #f59e0b;
          
          &:hover {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
            box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
          }
        `;
      case 'danger':
        return `
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #ffffff;
          border: 1px solid #ef4444;
          
          &:hover {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
          }
        `;
      case 'info':
        return `
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #ffffff;
          border: 1px solid #3b82f6;
          
          &:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
          }
        `;
      default: // primary
        return `
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #000000;
          border: 1px solid #FFD700;
          
          &:hover {
            background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
            box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
          }
        `;
    }
  }}
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
  
  /* Ripple effect */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
  }
  
  &:active::before {
    width: 120%;
    height: 120%;
  }
  
  .button-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    
    svg {
      width: 100%;
      height: 100%;
    }
  }
  
  .button-text {
    white-space: nowrap;
  }
  
  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    ${({ $size = 'medium' }) => {
      switch ($size) {
        case 'small':
          return `
            padding: 0.3rem 0.6rem;
            font-size: 0.7rem;
            min-height: 28px;
          `;
        case 'large':
          return `
            padding: 0.75rem 1.5rem;
            font-size: 0.9rem;
            min-height: 44px;
          `;
        default:
          return `
            padding: 0.5rem 1rem;
            font-size: 0.8rem;
            min-height: 36px;
          `;
      }
    }}
  }
  
  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    ${({ $size = 'medium' }) => {
      switch ($size) {
        case 'small':
          return `
            padding: 0.25rem 0.5rem;
            font-size: 0.65rem;
            min-height: 24px;
          `;
        case 'large':
          return `
            padding: 0.675rem 1.25rem;
            font-size: 0.85rem;
            min-height: 40px;
          `;
        default:
          return `
            padding: 0.4rem 0.8rem;
            font-size: 0.75rem;
            min-height: 32px;
          `;
      }
    }}
    
    .button-icon {
      width: 14px;
      height: 14px;
    }
  }
`;

export const ImportExportPanel = styled.div`
  margin: 2rem 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 16px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  overflow: hidden;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  
  .panel-header {
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
    border-bottom: 1px solid rgba(255, 215, 0, 0.2);
    
    h3 {
      margin: 0;
      color: #FFD700;
      font-size: 1.25rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .panel-description {
      margin-top: 0.5rem;
      color: #ccc;
      font-size: 0.875rem;
      line-height: 1.5;
    }
  }
  
  .panel-content {
    padding: 2rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    
    .import-section,
    .export-section {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid rgba(255, 215, 0, 0.1);
      transition: all 0.3s ease;
      
      &:hover {
        border-color: rgba(255, 215, 0, 0.3);
        background: rgba(0, 0, 0, 0.3);
      }
      
      .section-title {
        margin: 0 0 1rem 0;
        color: #FFD700;
        font-size: 1.1rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .section-description {
        margin-bottom: 1.5rem;
        color: #aaa;
        font-size: 0.875rem;
        line-height: 1.4;
      }
    }
  }
  
  .import-area {
    border: 2px dashed rgba(255, 215, 0, 0.3);
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    
    &:hover,
    &.drag-over {
      border-color: rgba(255, 215, 0, 0.6);
      background: rgba(255, 215, 0, 0.05);
    }
    
    .import-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 1rem;
      color: #FFD700;
      opacity: 0.7;
    }
    
    .import-text {
      color: #e0e0e0;
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }
    
    .import-hint {
      color: #999;
      font-size: 0.875rem;
    }
    
    input[type="file"] {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }
  }
  
  .export-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    
    .format-selector {
      display: flex;
      gap: 0.5rem;
      
      .format-option {
        flex: 1;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 8px;
        color: #e0e0e0;
        cursor: pointer;
        text-align: center;
        transition: all 0.3s ease;
        font-size: 0.875rem;
        
        &:hover {
          background: rgba(255, 215, 0, 0.1);
          border-color: rgba(255, 215, 0, 0.5);
        }
        
        &.active {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #000;
          border-color: #FFD700;
        }
      }
    }
    
    .export-settings {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      
      .setting-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0;
        
        .setting-label {
          color: #e0e0e0;
          font-size: 0.875rem;
        }
        
        .setting-control {
          display: flex;
          align-items: center;
        }
      }
    }
  }
  
  .operation-status {
    margin: 1rem 0;
    padding: 1rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    
    &.success {
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #22c55e;
    }
    
    &.error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }
    
    &.info {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #3b82f6;
    }
    
    .status-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
  }
  
  .panel-actions {
    padding: 1.5rem 2rem;
    background: rgba(0, 0, 0, 0.2);
    border-top: 1px solid rgba(255, 215, 0, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .action-group {
      display: flex;
      gap: 1rem;
    }
    
    .panel-info {
      color: #888;
      font-size: 0.75rem;
    }
  }
  
  @media (max-width: ${RESPONSIVE_BREAKPOINTS.desktop}) {
    .panel-content {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }
  
  @media (max-width: ${RESPONSIVE_BREAKPOINTS.tablet}) {
    margin: 1.5rem 0;
    
    .panel-header {
      padding: 1.25rem 1.5rem;
      
      h3 {
        font-size: 1.125rem;
      }
    }
    
    .panel-content {
      padding: 1.5rem;
      
      .import-section,
      .export-section {
        padding: 1.25rem;
      }
    }
    
    .import-area {
      padding: 1.5rem;
      
      .import-icon {
        width: 40px;
        height: 40px;
      }
    }
    
    .panel-actions {
      padding: 1.25rem 1.5rem;
      flex-direction: column;
      gap: 1rem;
      
      .action-group {
        width: 100%;
        justify-content: center;
      }
    }
  }
  
  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    margin: 1rem 0;
    
    .panel-header {
      padding: 1rem;
      
      h3 {
        font-size: 1rem;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
    
    .panel-content {
      padding: 1rem;
      
      .import-section,
      .export-section {
        padding: 1rem;
      }
    }
    
    .import-area {
      padding: 1rem;
      
      .import-icon {
        width: 32px;
        height: 32px;
      }
      
      .import-text {
        font-size: 0.875rem;
      }
      
      .import-hint {
        font-size: 0.75rem;
      }
    }
    
    .export-options {
      .format-selector {
        flex-direction: column;
      }
    }
    
    .panel-actions {
      padding: 1rem;
      
      .action-group {
        flex-direction: column;
        gap: 0.5rem;
      }
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

export const FileInput = styled.input`
  ${baseInputStyles}
  cursor: pointer;
  padding: 0.75rem;
  
  &::file-selector-button {
    padding: 0.5rem 1rem;
    margin-right: 1rem;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    color: #000;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
      transform: translateY(-1px);
    }
  }
  
  &::-webkit-file-upload-button {
    padding: 0.5rem 1rem;
    margin-right: 1rem;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    color: #000;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
      transform: translateY(-1px);
    }
  }
  
  @media (max-width: ${RESPONSIVE_BREAKPOINTS.mobile}) {
    &::file-selector-button,
    &::-webkit-file-upload-button {
      padding: 0.4rem 0.8rem;
      font-size: 0.875rem;
    }
  }
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

// CollapsibleSection is already defined above in the COLLAPSIBLE COMPONENTS section


 // CollapsibleHeader is already defined above in the COLLAPSIBLE COMPONENTS section


// CollapsibleContent is defined later in the file with enhanced styling

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

// All duplicate preview components removed - they are already defined in the first PREVIEW COMPONENTS section above

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

// ToggleSwitch is already defined above in the TOGGLE COMPONENTS section

// ActionBar is already defined above in the BUTTON COMPONENTS section



















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

// Duplicate PREVIEW COMPONENTS section removed - components already defined above


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


