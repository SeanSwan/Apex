// ReportBuilder.styles.ts - Extracted Styled Components
// Separated from main component for better maintainability and performance

import styled, { createGlobalStyle, css } from 'styled-components';

// Types for styled component props
interface TabProps {
  $active: boolean;
  $isNew?: boolean;
  theme?: any;
}

interface ButtonProps {
  $variant?: 'primary' | 'secondary' | 'success' | 'danger';
  theme?: any;
}

// Global styles for the report builder
export const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: sans-serif;
    background-color: #0f1419;
  }
`;

// Main container with gradient background
export const Container = styled.div`
  max-width: 1400px;
  margin: 2rem auto;
  padding: 1.5rem;
  position: relative;
  border-radius: 10px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: #FAF0E6;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: inherit;
    z-index: 1;
  }

  & > * {
    position: relative;
    z-index: 2;
  }

  @media (max-width: 768px) {
    margin: 1rem;
    padding: 1rem;
  }
`;

// Main title styling
export const Title = styled.h1`
  text-align: center;
  color: #EEE8AA;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

// Date range container
export const DateRangeContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  color: #F0E6D2;
  font-size: 1rem;
  font-weight: 500;
  flex-wrap: wrap;
`;

// Date picker button
export const DatePickerButton = styled.button`
  padding: 6px 12px;
  font-size: 0.9em;
  gap: 6px;
  background-color: rgba(30, 30, 35, 0.6);
  color: #F0E6D2;
  border: 1px solid rgba(238, 232, 170, 0.3);
  border-radius: 5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.2s ease;
  
  &:hover { 
    background-color: rgba(50, 50, 55, 0.6); 
  }
`;

// Tab container with responsive overflow
export const TabContainer = styled.div`
  display: flex;
  overflow-x: auto;
  margin-bottom: 2rem;
  border-bottom: 2px solid rgba(238, 232, 170, 0.3);
  padding-bottom: 1px;
  scrollbar-width: none;
  
  &::-webkit-scrollbar { 
    display: none; 
  }

  @media (min-width: 1024px) {
    overflow-x: visible;
    justify-content: center;
    flex-wrap: wrap;
  }
`;

// Individual tab styling with active states
export const Tab = styled.button<TabProps>`
  padding: 12px 18px;
  cursor: pointer;
  border: none;
  border-bottom: 3px solid transparent;
  background-color: transparent;
  font-size: 0.95em;
  font-weight: 500;
  color: #A0A0A0;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
  position: relative;

  ${({ $active, theme }) => $active && css`
    color: ${theme?.primaryColor || '#FFD700'};
    border-bottom-color: ${theme?.primaryColor || '#FFD700'};
    font-weight: 600;
  `}

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme?.primaryColor || '#FFD700'};
    background-color: rgba(255, 215, 0, 0.1);
  }

  &:disabled {
    color: #444444;
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  ${({ $isNew }) => $isNew && css`
    &::after {
      content: 'NEW';
      position: absolute;
      top: -8px;
      right: -8px;
      background: linear-gradient(45deg, #e74c3c, #c0392b);
      color: white;
      font-size: 0.6rem;
      padding: 2px 6px;
      border-radius: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `}
`;

// Navigation container
export const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(238, 232, 170, 0.3);
`;

// Versatile button component with variants
export const Button = styled.button<ButtonProps>`
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:disabled {
    background-color: #333333;
    color: #666666;
    cursor: not-allowed;
    opacity: 0.7;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.4);
  }

  ${({ $variant = 'secondary', theme }) => {
    const primary = theme?.primaryColor || '#FFD700';
    
    switch ($variant) {
      case 'primary': 
        return css`
          background-color: ${primary}; 
          color: #0a0a0a; 
          &:hover:not(:disabled) { 
            background-color: ${primary}dd; 
          }
        `;
      case 'success': 
        return css`
          background-color: #25914B; 
          color: white; 
          &:hover:not(:disabled) { 
            background-color: #1e7940; 
          }
        `;
      case 'danger': 
        return css`
          background-color: #b52e3c; 
          color: white; 
          &:hover:not(:disabled) { 
            background-color: #9e2635; 
          }
        `;
      case 'secondary': 
      default: 
        return css`
          background-color: rgba(30, 30, 35, 0.7); 
          color: #F0E6D2; 
          border: 1px solid rgba(238, 232, 170, 0.3); 
          &:hover:not(:disabled) { 
            background-color: rgba(50, 50, 55, 0.7); 
          }
        `;
    }
  }}
`;

// Loading overlay for async operations
export const LoadingOverlay = styled.div`
  position: fixed; 
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(10, 10, 12, 0.8);
  display: flex; 
  flex-direction: column; 
  justify-content: center; 
  align-items: center;
  z-index: 1000;
`;

// Animated loading spinner
export const LoadingSpinner = styled.div`
  border: 4px solid #222222;
  border-top: 4px solid #FFD700;
  border-radius: 50%;
  width: 40px; 
  height: 40px;
  animation: spin 1.5s linear infinite;
  
  @keyframes spin { 
    0% { transform: rotate(0deg); } 
    100% { transform: rotate(360deg); } 
  }
`;

// Loading message text
export const LoadingMessage = styled.div`
  margin-top: 1rem; 
  color: #F0E6D2; 
  font-weight: 500;
`;

// Error container for error boundaries
export const ErrorContainer = styled.div`
  padding: 2rem;
  text-align: center;
  background-color: #1a1a1a;
  color: #e0e0e0;
  border-radius: 8px;
  margin: 2rem;
`;

// Tab content wrapper
export const TabContent = styled.div`
  margin-top: 1.5rem;
`;

// PDF download button group container
export const PDFButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    
    & > * {
      justify-content: center;
    }
  }
`;
