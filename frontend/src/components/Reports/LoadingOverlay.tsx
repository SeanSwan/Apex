// LoadingOverlay.tsx - Loading Overlay Component
// Provides loading state feedback during async operations

import React from 'react';
import { LoadingOverlay as StyledLoadingOverlay, LoadingSpinner, LoadingMessage } from './ReportBuilder.styles';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children?: React.ReactNode;
}

/**
 * Loading overlay component for async operations
 * Shows a spinner and optional message during loading states
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  children
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <StyledLoadingOverlay>
        <LoadingSpinner />
        <LoadingMessage>{message}</LoadingMessage>
      </StyledLoadingOverlay>
    </>
  );
};

export default LoadingOverlay;
