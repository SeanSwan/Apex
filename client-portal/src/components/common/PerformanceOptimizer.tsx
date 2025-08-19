// client-portal/src/components/common/PerformanceOptimizer.tsx
/**
 * Performance Optimizer Component
 * ==============================
 * Wrapper component for performance optimization
 */

import React, { memo, useEffect, useRef } from 'react';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
  level?: 'low' | 'medium' | 'high';
  className?: string;
}

const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = memo(({
  children,
  level = 'medium',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (level === 'high' && containerRef.current) {
      // Apply high-performance optimizations
      const container = containerRef.current;
      container.style.willChange = 'transform';
      container.style.transform = 'translateZ(0)';
      
      return () => {
        container.style.willChange = 'auto';
        container.style.transform = 'none';
      };
    }
  }, [level]);

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{
        containment: level === 'high' ? 'layout style paint' : 'none'
      }}
    >
      {children}
    </div>
  );
});

PerformanceOptimizer.displayName = 'PerformanceOptimizer';

export default PerformanceOptimizer;
