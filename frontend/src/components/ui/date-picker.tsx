// frontend/src/components/ui/DatePicker.tsx

import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { format } from 'date-fns';
import { DayPicker, DayPickerSingleProps } from 'react-day-picker';
import 'react-day-picker/dist/style.css'; // Base styles
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

// --- Styled Components for Popover ---
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverContent = styled(PopoverPrimitive.Content)`
  z-index: 50;
  width: auto;
  border-radius: 0.5rem;
  border: 1px solid #333; /* Dark border */
  background-color: #1a1a1a; /* Dark background */
  color: #e8e8e8; /* Light text */
  padding: 0.5rem; /* Padding for the content area */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  outline: none;

  /* Animation (optional) */
  &[data-state='open'] {
    animation: fadeIn 0.2s ease-out;
  }
  &[data-state='closed'] {
    animation: fadeOut 0.2s ease-in;
  }
  @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  @keyframes fadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
`;

// --- Styled Components for DayPicker ---
const dayPickerBaseStyles = css`
  .rdp {
    margin: 0; /* Remove default margin */
    --rdp-cell-size: 36px; /* Adjust size as needed */
    --rdp-accent-color: #D4AF37; /* Gold */
    --rdp-background-color: #F4D160; /* Light Gold for selected background */
    --rdp-accent-color-dark: #D4AF37;
    --rdp-background-color-dark: #F4D160;
    font-size: 0.875rem;
  }
  .rdp-months {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .rdp-month {
    space-y-4; /* Tailwind class equivalent */
  }
  .rdp-caption {
    display: flex;
    justify-content: center;
    position: relative;
    align-items: center;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
  .rdp-caption_label {
    font-size: 0.95rem;
    font-weight: 600;
    color: #C0C0C0; /* Silver */
  }
  .rdp-nav {
    display: flex;
    align-items: center;
    gap: 0.25rem; /* Space between nav buttons */
  }
  .rdp-nav_button {
    height: 32px;
    width: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.375rem;
    background-color: transparent;
    border: 1px solid #444; /* Darker border for buttons */
    color: #C0C0C0; /* Silver */
    cursor: pointer;
    transition: all 0.2s ease;
    &:hover {
      background-color: #333;
      border-color: #555;
      color: #F4D160; /* Light Gold */
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  .rdp-nav_button_previous {
    position: absolute;
    left: 0.5rem;
  }
  .rdp-nav_button_next {
    position: absolute;
    right: 0.5rem;
  }
  .rdp-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 0.5rem;
  }
  .rdp-head_row,
  .rdp-row {
    display: flex;
    width: 100%;
    margin-top: 0.5rem;
  }
  .rdp-head_cell {
    color: #999; /* Dimmer silver */
    border-radius: 0.375rem;
    width: var(--rdp-cell-size);
    font-weight: 500;
    font-size: 0.8rem;
    text-align: center;
  }
  .rdp-cell {
    height: var(--rdp-cell-size);
    width: var(--rdp-cell-size);
    text-align: center;
    font-size: 0.875rem;
    position: relative;
    display: flex; /* Use flex for centering */
    align-items: center;
    justify-content: center;
  }
  .rdp-day {
    height: var(--rdp-cell-size);
    width: var(--rdp-cell-size);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    border: 1px solid transparent;
    &:hover {
      background-color: #333; /* Dark hover */
      color: #F4D160; /* Light Gold */
      border-color: #555;
    }
    &:focus {
      outline: none;
      border-color: var(--rdp-accent-color);
      box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.3); /* Gold focus ring */
    }
  }
  .rdp-day_selected {
    background-color: var(--rdp-accent-color) !important; /* Gold */
    color: #000000 !important; /* Black text */
    font-weight: bold;
    &:hover {
        background-color: #b8860b !important; /* Darker Gold */
    }
  }
  .rdp-day_today {
    color: var(--rdp-accent-color); /* Gold */
    border: 1px solid var(--rdp-accent-color);
  }
  .rdp-day_outside {
    color: #555; /* Dimmer color for outside days */
    opacity: 0.7;
    pointer-events: none; /* Prevent interaction */
  }
  .rdp-day_disabled {
    color: #444;
    opacity: 0.5;
    cursor: not-allowed;
  }
  /* Custom dropdown styles if using captionLayout="dropdown-buttons" */
  .rdp-caption_dropdowns {
    display: flex;
    gap: 0.5rem;
  }
  .rdp-vhidden { /* Hide default DayPicker visually hidden elements */
      display: none;
  }
  select.rdp-dropdown { /* Style native select if used */
      background-color: #333;
      color: #C0C0C0;
      border: 1px solid #555;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 0.9em;
  }
`;

// Apply styles to a container div
const StyledDayPickerContainer = styled.div`
  ${dayPickerBaseStyles}
`;

// --- Component Props ---
interface DatePickerProps extends Omit<DayPickerSingleProps, 'onSelect' | 'mode'> {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  children?: React.ReactNode; // To allow custom trigger
  placeholder?: string;
}

// --- DatePicker Component ---
export const DatePicker: React.FC<DatePickerProps> = ({
  date,
  onDateChange,
  children,
  placeholder = "Select date",
  ...props // Pass remaining DayPicker props
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate);
    setIsOpen(false); // Close popover on selection
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children ? ( // Use provided trigger if available
          children
        ) : (
          // Default trigger button
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-[280px] justify-start text-left font-normal text-muted-foreground">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP') : <span>{placeholder}</span>}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start">
        <StyledDayPickerContainer>
          <DayPicker
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus={isOpen} // Focus calendar when opened
            // Add custom components for navigation for better styling control
            components={{
              IconLeft: () => <ChevronLeft size={16} />,
              IconRight: () => <ChevronRight size={16} />,
            }}
            // Pass through any other props like disabled dates, etc.
            {...props}
          />
        </StyledDayPickerContainer>
      </PopoverContent>
    </Popover>
  );
};