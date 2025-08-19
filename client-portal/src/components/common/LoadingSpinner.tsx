// client-portal/src/components/common/LoadingSpinner.tsx
/**
 * Professional Loading Components
 * ===============================
 * 
 * Comprehensive loading indicators and skeleton screens for professional
 * user experience during data loading and route transitions.
 * 
 * Features:
 * - Multiple loading spinner variants for different contexts
 * - Skeleton loading screens for content placeholders
 * - Animated loading states with smooth transitions
 * - Accessible loading indicators with proper ARIA labels
 * - Responsive design for all screen sizes
 */

import React from 'react';
import { 
  ArrowPathIcon,
  Cog6ToothIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

// ===========================
// INTERFACES & TYPES
// ===========================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  text?: string;
  className?: string;
  inline?: boolean;
}

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

interface PageLoadingProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

interface FullPageLoadingProps {
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'auth' | 'error';
}

// ===========================
// BASIC LOADING SPINNER
// ===========================

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  text,
  className = '',
  inline = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const variantClasses = {
    default: 'text-gray-500',
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const spinnerElement = (
    <ArrowPathIcon 
      className={`animate-spin ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      aria-hidden="true"
    />
  );

  if (inline) {
    return (
      <span className="inline-flex items-center gap-2">
        {spinnerElement}
        {text && (
          <span className={`${textSizeClasses[size]} ${variantClasses[variant]} font-medium`}>
            {text}
          </span>
        )}
      </span>
    );
  }

  return (
    <div 
      className="flex flex-col items-center justify-center space-y-2"
      role="status"
      aria-label={text || 'Loading'}
    >
      {spinnerElement}
      {text && (
        <span className={`${textSizeClasses[size]} ${variantClasses[variant]} font-medium`}>
          {text}
        </span>
      )}
    </div>
  );
};

// ===========================
// SKELETON LOADING COMPONENT
// ===========================

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = false,
  animate = true
}) => {
  const baseClasses = 'bg-gray-200';
  const animationClasses = animate ? 'animate-pulse' : '';
  const roundedClasses = rounded ? 'rounded-full' : 'rounded';
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  return (
    <div 
      className={`${baseClasses} ${animationClasses} ${roundedClasses} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

// ===========================
// CARD SKELETON COMPONENT
// ===========================

export const CardSkeleton: React.FC<{ showImage?: boolean; lines?: number }> = ({ 
  showImage = true, 
  lines = 3 
}) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
    {showImage && (
      <Skeleton 
        height="200px" 
        className="mb-4" 
      />
    )}
    <div className="space-y-3">
      <Skeleton height="1.5rem" width="75%" />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index}
          height="1rem" 
          width={index === lines - 1 ? '60%' : '100%'} 
        />
      ))}
    </div>
    <div className="flex justify-between items-center mt-4">
      <Skeleton height="1.5rem" width="30%" />
      <Skeleton height="2rem" width="80px" />
    </div>
  </div>
);

// ===========================
// TABLE SKELETON COMPONENT
// ===========================

export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number; 
  showHeader?: boolean;
}> = ({ 
  rows = 5, 
  columns = 4, 
  showHeader = true 
}) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <table className="min-w-full">
      {showHeader && (
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <Skeleton height="1rem" width="80%" />
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((rowIndex) => (
          <tr key={rowIndex} className="animate-pulse">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex} className="px-6 py-4">
                <Skeleton 
                  height="1rem" 
                  width={colIndex === 0 ? '60%' : '80%'} 
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ===========================
// PAGE LOADING COMPONENT
// ===========================

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = 'Loading...',
  progress,
  showProgress = false
}) => (
  <div className="min-h-96 flex items-center justify-center p-8">
    <div className="text-center max-w-sm">
      <div className="mb-4">
        <LoadingSpinner size="lg" variant="primary" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {message}
      </h3>
      
      {showProgress && typeof progress === 'number' && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
      
      <p className="text-sm text-gray-500">
        Please wait while we load your data...
      </p>
    </div>
  </div>
);

// ===========================
// FULL PAGE LOADING COMPONENT
// ===========================

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({
  title = 'APEX AI',
  subtitle = 'Aegis Portal',
  variant = 'default'
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'auth':
        return <ShieldCheckIcon className="h-12 w-12 text-blue-600" />;
      case 'error':
        return <Cog6ToothIcon className="h-12 w-12 text-red-600" />;
      default:
        return <ShieldCheckIcon className="h-12 w-12 text-blue-600" />;
    }
  };

  const getMessage = () => {
    switch (variant) {
      case 'auth':
        return 'Verifying credentials...';
      case 'error':
        return 'Initializing application...';
      default:
        return 'Loading Aegis Client Portal...';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        {/* Logo and Branding */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            {getIcon()}
          </div>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-lg text-gray-600">
            {subtitle}
          </p>
        </div>
        
        {/* Loading Animation */}
        <div className="mb-6">
          <LoadingSpinner size="lg" variant="primary" />
        </div>
        
        <p className="text-sm text-gray-500 mb-8">
          {getMessage()}
        </p>
        
        {/* Loading Progress Dots */}
        <div className="flex items-center justify-center space-x-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
              style={{
                animationDelay: `${index * 0.3}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-gray-400">
          © 2025 APEX AI Security Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
};

// ===========================
// DASHBOARD SKELETON LAYOUTS
// ===========================

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <Skeleton height="2rem" width="250px" className="mb-2" />
      <Skeleton height="1rem" width="400px" />
    </div>
    
    {/* KPI Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <Skeleton height="1rem" width="60%" />
            <Skeleton height="1.5rem" width="1.5rem" rounded />
          </div>
          <Skeleton height="2.5rem" width="50%" className="mb-2" />
          <Skeleton height="0.75rem" width="80%" />
        </div>
      ))}
    </div>
    
    {/* Chart Skeleton */}
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <Skeleton height="1.5rem" width="200px" className="mb-4" />
      <Skeleton height="300px" />
    </div>
  </div>
);

export const IncidentListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Skeleton height="1.25rem" width="200px" className="mb-2" />
            <Skeleton height="1rem" width="150px" />
          </div>
          <Skeleton height="1.5rem" width="80px" rounded />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Skeleton height="0.75rem" width="50px" className="mb-1" />
            <Skeleton height="1rem" width="80px" />
          </div>
          <div>
            <Skeleton height="0.75rem" width="40px" className="mb-1" />
            <Skeleton height="1rem" width="60px" />
          </div>
          <div>
            <Skeleton height="0.75rem" width="60px" className="mb-1" />
            <Skeleton height="1rem" width="100px" />
          </div>
          <div>
            <Skeleton height="0.75rem" width="45px" className="mb-1" />
            <Skeleton height="1rem" width="70px" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ===========================
// LOADING BUTTON COMPONENT
// ===========================

export const LoadingButton: React.FC<{
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}> = ({
  loading = false,
  children,
  className = '',
  disabled = false,
  onClick,
  type = 'button'
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`
      inline-flex items-center justify-center px-4 py-2 border border-transparent 
      text-sm font-medium rounded-md transition-colors duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `}
  >
    {loading && (
      <LoadingSpinner 
        size="sm" 
        variant="default" 
        className="mr-2" 
        inline 
      />
    )}
    {children}
  </button>
);

// ===========================
// EXPORT ALL COMPONENTS
// ===========================

export default LoadingSpinner;