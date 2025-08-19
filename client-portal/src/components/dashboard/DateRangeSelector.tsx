// client-portal/src/components/dashboard/DateRangeSelector.tsx
/**
 * Date Range Selector Component
 * ============================
 * Professional date range selector for dashboard filtering
 */

import React from 'react';
import { DateRange } from '../../types/client.types';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const dateRangeOptions = [
  { value: '7' as DateRange, label: 'Last 7 days' },
  { value: '30' as DateRange, label: 'Last 30 days' },
  { value: '90' as DateRange, label: 'Last 90 days' },
  { value: '365' as DateRange, label: 'Last year' }
];

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DateRange)}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        border border-gray-300 rounded-md
        bg-white text-gray-900
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
    >
      {dateRangeOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default DateRangeSelector;
