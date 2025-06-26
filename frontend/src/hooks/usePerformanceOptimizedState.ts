// usePerformanceOptimizedState.ts - Custom Hook for Performance Optimization
// Handles localStorage persistence with debouncing

import { useState, useCallback } from 'react';

/**
 * Performance-optimized state hook with localStorage persistence
 * Debounces localStorage writes to prevent excessive I/O operations
 */
export const usePerformanceOptimizedState = <T>(
  initialValue: T,
  key: string
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const debouncedSetState = useCallback(
    (value: React.SetStateAction<T>) => {
      setState(value);
      
      // Debounced localStorage save to prevent excessive writes
      const timeoutId = setTimeout(() => {
        try {
          const valueToSave = typeof value === 'function' 
            ? (value as (prev: T) => T)(state) 
            : value;
          localStorage.setItem(key, JSON.stringify(valueToSave));
        } catch (error) {
          console.warn(`Failed to save ${key} to localStorage:`, error);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [key, state]
  );

  return [state, debouncedSetState];
};
