// Fixed DatePicker component - NO button nesting
import React from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';

const DateInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: #2a2a2a;
  color: #e0e0e0;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #e5c76b;
    box-shadow: 0 0 0 2px rgba(229, 199, 107, 0.2);
  }
  
  &::placeholder {
    color: #777;
  }
`;

const DatePickerWrapper = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
`;

const TriggerDiv = styled.div`
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: #2a2a2a;
  color: #e0e0e0;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:focus {
    outline: none;
    border-color: #e5c76b;
    box-shadow: 0 0 0 2px rgba(229, 199, 107, 0.2);
  }
  
  &:hover {
    background-color: #333;
  }
`;

const HiddenInput = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
`;

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  children?: React.ReactNode;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  date,
  onDateChange,
  placeholder = "Select date",
  children
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      onDateChange(new Date(value));
    } else {
      onDateChange(undefined);
    }
  };

  const dateValue = date ? format(date, 'yyyy-MM-dd') : '';

  // If children are provided, use them as trigger with hidden input overlay
  if (children) {
    return (
      <DatePickerWrapper>
        <TriggerDiv>
          {children}
        </TriggerDiv>
        <HiddenInput
          type="date"
          value={dateValue}
          onChange={handleChange}
        />
      </DatePickerWrapper>
    );
  }

  // Default: just return the native date input
  return (
    <DateInput
      type="date"
      value={dateValue}
      onChange={handleChange}
      placeholder={placeholder}
    />
  );
};

// Also export as default for flexibility
export default DatePicker;
