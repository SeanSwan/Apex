// EXAMPLE STYLED COMPONENT - DEMONSTRATES NEW WORKFLOW
// This shows how to use the new styled-components theme system

import React from 'react';
import styled from 'styled-components';

interface ExampleButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'medium' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

// ✅ Styled Component with Theme Integration
const StyledButton = styled.button<ExampleButtonProps>`
  /* Spacing from theme */
  padding: ${({ size, theme }) => {
    switch (size) {
      case 'sm': return `${theme.spacing.sm} ${theme.spacing.medium}`;
      case 'lg': return `${theme.spacing.lg} ${theme.spacing.xl}`;
      default: return `${theme.spacing.medium} ${theme.spacing.lg}`;
    }
  }};

  /* Colors from theme */
  background-color: ${({ variant, theme }) => 
    variant === 'secondary' 
      ? theme.colors.secondary.DEFAULT 
      : theme.colors.primary.DEFAULT
  };
  
  color: ${({ variant, theme }) => 
    variant === 'secondary' 
      ? theme.colors.secondary.foreground 
      : theme.colors.primary.foreground
  };

  /* Border radius from theme */
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  
  /* Typography from theme */
  font-family: ${({ theme }) => theme.typography.fontFamily.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  
  /* No border */
  border: none;
  
  /* Transitions from theme */
  transition: ${({ theme }) => theme.transitions.base};
  
  /* Cursor */
  cursor: pointer;

  /* Hover effects */
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  /* Focus styles */
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.ring};
    outline-offset: 2px;
  }

  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

// ✅ React Component Using Styled Component
const ExampleButton: React.FC<ExampleButtonProps> = ({ 
  variant = 'primary', 
  size = 'medium', 
  children, 
  onClick 
}) => {
  return (
    <StyledButton 
      variant={variant} 
      size={size} 
      onClick={onClick}
    >
      {children}
    </StyledButton>
  );
};

export default ExampleButton;

// 🎯 USAGE EXAMPLE:
// <ExampleButton variant="primary" size="lg" onClick={() => console.log('clicked')}>
//   Save Report
// </ExampleButton>
//
// 🏆 BENEFITS OF THIS APPROACH:
// ✅ All styles in one file - scroll up to see them!
// ✅ TypeScript safety for props and theme
// ✅ Theme consistency across all components  
// ✅ No CSS class naming conflicts
// ✅ Dynamic styling with props
// ✅ Excellent IntelliSense support
