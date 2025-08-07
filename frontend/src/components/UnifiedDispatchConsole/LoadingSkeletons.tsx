/**
 * LOADING SKELETONS - MASTER PROMPT v52.0
 * =======================================
 * Reusable skeleton loading components for Voice AI Dispatcher
 * 
 * Features:
 * - Animated skeleton placeholders for all major components
 * - Responsive design with mobile-first approach
 * - Accessibility-compliant loading states
 * - Customizable sizes and layouts
 * - Component-specific skeleton patterns
 * - Performance-optimized animations
 * - Screen reader friendly loading announcements
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animate?: boolean;
}

/**
 * Base Skeleton Component
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = 'md',
  animate = true
}) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  return (
    <div
      className={`bg-gray-700 ${roundedClasses[rounded]} ${
        animate ? 'animate-pulse' : ''
      } ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="Loading..."
    />
  );
};

/**
 * Live Call Monitor Skeleton
 */
export const LiveCallMonitorSkeleton: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => (
  <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`} role="status" aria-label="Loading call monitor...">
    {/* Header Skeleton */}
    <div className="border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton width={24} height={24} rounded="sm" />
          <Skeleton width={180} height={20} />
          <Skeleton width={100} height={20} rounded="full" />
        </div>
        <Skeleton width={80} height={16} />
      </div>
    </div>

    <div className="flex h-96">
      {/* Call List Skeleton */}
      <div className="w-1/3 border-r border-gray-700 p-3">
        <Skeleton width={120} height={16} className="mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Skeleton width={16} height={16} />
                  <Skeleton width={120} height={14} />
                </div>
                <Skeleton width={16} height={16} />
              </div>
              <div className="flex items-center justify-between text-xs mb-2">
                <Skeleton width={80} height={12} />
                <Skeleton width={40} height={12} />
              </div>
              <Skeleton width="100%" height={12} />
            </div>
          ))}
        </div>
      </div>

      {/* Call Details Skeleton */}
      <div className="flex-1">
        <div className="border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton width={160} height={20} className="mb-2" />
              <div className="flex items-center space-x-4">
                <Skeleton width={100} height={14} />
                <Skeleton width={60} height={14} />
                <Skeleton width={120} height={14} />
              </div>
            </div>
            <div className="flex space-x-2">
              <Skeleton width={80} height={32} rounded="lg" />
              <Skeleton width={80} height={32} rounded="lg" />
            </div>
          </div>
        </div>

        {/* Transcript Skeleton */}
        <div className="p-4">
          <Skeleton width={100} height={16} className="mb-3" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`p-3 rounded-lg ${i % 2 === 0 ? 'ml-8 mr-0' : 'ml-0 mr-8'} bg-gray-800 border border-gray-700`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Skeleton width={8} height={8} rounded="full" />
                    <Skeleton width={80} height={12} />
                  </div>
                  <Skeleton width={60} height={12} />
                </div>
                <Skeleton width="90%" height={14} className="mb-1" />
                <Skeleton width="75%" height={14} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * System Status Dashboard Skeleton
 */
export const SystemStatusDashboardSkeleton: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => (
  <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`} role="status" aria-label="Loading system status...">
    {/* Header Skeleton */}
    <div className="border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton width={24} height={24} />
          <Skeleton width={200} height={20} />
          <Skeleton width={24} height={24} />
          <Skeleton width={80} height={16} />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton width={80} height={28} rounded="sm" />
          <Skeleton width={80} height={28} rounded="sm" />
        </div>
      </div>

      {/* System Overview Skeleton */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-800 rounded p-3">
            <Skeleton width={100} height={14} className="mb-2" />
            <Skeleton width={60} height={18} />
          </div>
        ))}
      </div>
    </div>

    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Services Skeleton */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Skeleton width={20} height={20} />
            <Skeleton width={100} height={18} />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="rounded-lg border border-gray-600 bg-gray-800 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Skeleton width={20} height={20} />
                    <div>
                      <Skeleton width={100} height={16} className="mb-1" />
                      <Skeleton width={80} height={12} />
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Skeleton width={16} height={16} />
                    <Skeleton width={50} height={24} rounded="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration & Alerts Skeleton */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Skeleton width={20} height={20} />
            <Skeleton width={140} height={18} />
          </div>
          
          {/* Configuration Status Skeleton */}
          <div className="mb-4 p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Skeleton width={120} height={16} />
              <Skeleton width={80} height={20} rounded="sm" />
            </div>
            <div className="space-y-1">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton width={12} height={12} />
                  <Skeleton width={150} height={12} />
                </div>
              ))}
            </div>
          </div>

          {/* Alerts Skeleton */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton width={100} height={16} />
              <Skeleton width={60} height={12} />
            </div>
            <div className="space-y-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-2 rounded bg-gray-700 flex items-start justify-between">
                  <div className="flex items-start space-x-2 flex-1">
                    <Skeleton width={16} height={16} />
                    <div className="flex-1">
                      <Skeleton width="90%" height={14} className="mb-1" />
                      <Skeleton width={60} height={12} />
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Skeleton width={12} height={12} />
                    <Skeleton width={12} height={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * API Status Indicator Skeleton
 */
export const ApiStatusIndicatorSkeleton: React.FC<{ 
  className?: string; 
  size?: 'small' | 'medium' | 'large' 
}> = ({ 
  className = '', 
  size = 'medium' 
}) => {
  const padding = size === 'small' ? 'p-2' : size === 'medium' ? 'p-3' : 'p-4';
  const iconSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24;
  const textHeight = size === 'small' ? 14 : size === 'medium' ? 16 : 18;

  return (
    <div className={`rounded-lg border border-gray-600 bg-gray-800 ${padding} ${className}`} role="status" aria-label="Loading API status...">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton width={iconSize} height={iconSize} />
          <div>
            <Skeleton width={100} height={textHeight} className="mb-1" />
            <Skeleton width={80} height={12} />
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Skeleton width={16} height={16} />
          <Skeleton width={50} height={24} rounded="sm" />
        </div>
      </div>
    </div>
  );
};

/**
 * Call Intervention Panel Skeleton
 */
export const CallInterventionPanelSkeleton: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => (
  <div className={`bg-gray-900 rounded-lg border border-gray-700 p-4 ${className}`} role="status" aria-label="Loading intervention panel...">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <Skeleton width={24} height={24} />
        <Skeleton width={160} height={20} />
      </div>
      <Skeleton width={80} height={32} rounded="lg" />
    </div>

    {/* Quick Actions */}
    <div className="mb-6">
      <Skeleton width={100} height={16} className="mb-3" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} width="100%" height={40} rounded="lg" />
        ))}
      </div>
    </div>

    {/* Current Incident */}
    <div className="mb-6">
      <Skeleton width={120} height={16} className="mb-3" />
      <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
        <Skeleton width="100%" height={16} className="mb-2" />
        <Skeleton width="80%" height={14} className="mb-2" />
        <Skeleton width="60%" height={14} />
      </div>
    </div>

    {/* Action Buttons */}
    <div className="flex space-x-3">
      <Skeleton width={100} height={36} rounded="lg" />
      <Skeleton width={120} height={36} rounded="lg" />
      <Skeleton width={80} height={36} rounded="lg" />
    </div>
  </div>
);

/**
 * SOP Editor Skeleton
 */
export const SOPEditorSkeleton: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => (
  <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`} role="status" aria-label="Loading SOP editor...">
    {/* Header */}
    <div className="border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton width={24} height={24} />
          <Skeleton width={180} height={20} />
        </div>
        <div className="flex space-x-2">
          <Skeleton width={60} height={32} rounded="lg" />
          <Skeleton width={80} height={32} rounded="lg" />
        </div>
      </div>
    </div>

    <div className="p-4">
      {/* Form Fields */}
      <div className="space-y-4 mb-6">
        <div>
          <Skeleton width={80} height={16} className="mb-2" />
          <Skeleton width="100%" height={40} rounded="md" />
        </div>
        <div>
          <Skeleton width={100} height={16} className="mb-2" />
          <Skeleton width="100%" height={32} rounded="md" />
        </div>
        <div>
          <Skeleton width={120} height={16} className="mb-2" />
          <Skeleton width="100%" height={100} rounded="md" />
        </div>
      </div>

      {/* Steps */}
      <div>
        <Skeleton width={60} height={18} className="mb-3" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
              <Skeleton width={20} height={20} />
              <div className="flex-1">
                <Skeleton width="80%" height={16} className="mb-1" />
                <Skeleton width="60%" height={14} />
              </div>
              <Skeleton width={60} height={24} rounded="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/**
 * Generic Card Skeleton
 */
export const CardSkeleton: React.FC<{ 
  className?: string;
  lines?: number;
  showHeader?: boolean;
  showFooter?: boolean;
}> = ({ 
  className = '', 
  lines = 3,
  showHeader = true,
  showFooter = false
}) => (
  <div className={`bg-gray-800 rounded-lg border border-gray-700 p-4 ${className}`} role="status" aria-label="Loading...">
    {showHeader && (
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={120} height={18} />
        <Skeleton width={60} height={14} />
      </div>
    )}
    
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 ? '75%' : '100%'} 
          height={14} 
        />
      ))}
    </div>

    {showFooter && (
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
        <Skeleton width={80} height={12} />
        <Skeleton width={60} height={28} rounded="md" />
      </div>
    )}
  </div>
);

/**
 * Loading Spinner with Message
 */
export const LoadingSpinner: React.FC<{
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ 
  message = 'Loading...',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label={message}>
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-green-400 ${sizeClasses[size]} mx-auto`}></div>
        {message && (
          <p className="mt-3 text-gray-300 text-sm">{message}</p>
        )}
      </div>
    </div>
  );
};

export default {
  Skeleton,
  LiveCallMonitorSkeleton,
  SystemStatusDashboardSkeleton,
  ApiStatusIndicatorSkeleton,
  CallInterventionPanelSkeleton,
  SOPEditorSkeleton,
  CardSkeleton,
  LoadingSpinner
};
