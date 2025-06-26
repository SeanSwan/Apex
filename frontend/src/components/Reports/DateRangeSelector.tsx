// DateRangeSelector.tsx - Date Range Selection Component
// Handles date selection and navigation for report periods

import React from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { DateRangeContainer, DatePickerButton, Button } from './ReportBuilder.styles';
import { DatePicker } from '../ui/date-picker';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeSelectorProps {
  currentDate: Date;
  dateRange: DateRange;
  onDateChange: (date: Date) => void;
  themeSettings?: any;
}

/**
 * Date range selector component for report builder
 * Provides week navigation and date picking functionality
 */
export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  currentDate,
  dateRange,
  onDateChange,
  themeSettings
}) => {
  const handlePreviousWeek = () => {
    onDateChange(subDays(currentDate, 7));
  };

  const handleNextWeek = () => {
    onDateChange(addDays(currentDate, 7));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
    }
  };

  return (
    <DateRangeContainer>
      <span>Report for week:</span>
      
      <DatePicker
        date={currentDate}
        onDateChange={handleDateSelect}
      >
        <DatePickerButton>
          <CalendarIcon size={16} />
          {`${format(dateRange.start, 'MMM dd')} - ${format(dateRange.end, 'MMM dd, yyyy')}`}
        </DatePickerButton>
      </DatePicker>
      
      <Button 
        $variant="secondary" 
        onClick={handlePreviousWeek} 
        title="Previous Week"
        theme={themeSettings}
      >
        <ChevronLeft size={16}/> Prev
      </Button>
      
      <Button 
        $variant="secondary" 
        onClick={handleNextWeek} 
        title="Next Week"
        theme={themeSettings}
      >
        Next <ChevronRight size={16}/>
      </Button>
    </DateRangeContainer>
  );
};

export default DateRangeSelector;
