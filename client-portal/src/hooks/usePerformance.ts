// client-portal/src/hooks/usePerformance.ts
/**
 * Performance Monitoring Hook
 * ==========================
 * Hook for monitoring component performance
 */

import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
}

interface UsePerformanceOptions {
  enableMetrics?: boolean;
  enableOptimizations?: boolean;
  enableLoadingStates?: boolean;
  thresholds?: {
    slowPageLoad?: number;
    highMemoryUsage?: number;
    slowNetwork?: number;
  };
}

interface LoadingState {
  isLoading: boolean;
  message: string;
  progress: number;
  stage: 'idle' | 'fetching' | 'processing' | 'complete';
}

export const usePerformance = (componentName: string, options: UsePerformanceOptions = {}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: '',
    progress: 0,
    stage: 'idle'
  });

  const performanceScore = Math.max(0, Math.min(100, 
    100 - (metrics.loadTime / 100) - (metrics.renderTime / 10)
  ));

  const startLoading = useCallback((message: string, estimatedSteps: number = 1) => {
    setIsLoading(true);
    setLoadingState({
      isLoading: true,
      message,
      progress: 0,
      stage: 'fetching'
    });
  }, []);

  const updateLoadingProgress = useCallback((
    progress: number, 
    stage: LoadingState['stage'],
    message?: string
  ) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      stage,
      message: message || prev.message
    }));
  }, []);

  const finishLoading = useCallback(() => {
    setLoadingState({
      isLoading: false,
      message: '',
      progress: 100,
      stage: 'complete'
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (options.enableMetrics) {
      const startTime = performance.now();
      
      const measurePerformance = () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        setMetrics(prev => ({
          ...prev,
          loadTime: Math.round(loadTime),
          renderTime: Math.round(performance.now() - startTime)
        }));
      };

      // Measure on next tick
      const timeoutId = setTimeout(measurePerformance, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [options.enableMetrics]);

  return {
    metrics,
    performanceScore: Math.round(performanceScore),
    isLoading,
    loadingState,
    startLoading,
    updateLoadingProgress,
    finishLoading
  };
};

export default usePerformance;
