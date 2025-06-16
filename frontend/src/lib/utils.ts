import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class values using clsx and tailwind-merge
 * 
 * This utility helps combine Tailwind CSS classes in a safe way,
 * handling conflicts and merging appropriately.
 * 
 * @param inputs - Class values to combine
 * @returns Combined class string
 * 
 * @example
 * const className = cn(
 *   'text-blue-500',
 *   condition && 'bg-red-500',
 *   'p-4'
 * );
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number to a specific decimal precision with thousands separators
 * 
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234.56); // "1,234.56"
 * formatNumber(1234.56, 0); // "1,235"
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Debounce a function call
 * 
 * @param fn - Function to debounce
 * @param ms - Milliseconds to wait
 * @returns Debounced function
 * 
 * @example
 * const debouncedSearch = debounce((query) => {
 *   fetchSearchResults(query);
 * }, 300);
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Get a value from localStorage with type safety
 * 
 * @param key - Storage key
 * @param fallback - Default value if key doesn't exist
 * @returns Parsed value or fallback
 * 
 * @example
 * const theme = getStorageValue('theme', 'light');
 */
export function getStorageValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return fallback;
  }
}

/**
 * Set a value in localStorage with type safety
 * 
 * @param key - Storage key
 * @param value - Value to store
 * 
 * @example
 * setStorageValue('theme', 'dark');
 */
export function setStorageValue<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

/**
 * Truncate text to a specific length with ellipsis
 * 
 * @param text - Text to truncate
 * @param length - Maximum length
 * @returns Truncated text
 * 
 * @example
 * truncateText("This is a long text", 10); // "This is a..."
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}