// APEX AI LIVE MONITORING - SHARED STYLED COMPONENTS - FIXED VERSION
// Reusable styled components with proper prop filtering for DOM compatibility

import styled, { keyframes } from 'styled-components';

// Animation keyframes
export const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

export const alertGlow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.5); }
  50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.8); }
`;

export const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Status indicator component - FIXED: Using transient prop
export const StatusIndicator = styled.div<{ $status: 'online' | 'offline' | 'warning' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => 
    props.$status === 'online' ? '#10B981' : 
    props.$status === 'warning' ? '#F59E0B' : '#EF4444'
  };
  animation: ${props => props.$status === 'online' ? pulse : 'none'} 2s infinite;
`;

// Status badge component - FIXED: Using transient prop
export const StatusBadge = styled.span<{ $type: 'ai' | 'face' | 'alert' | 'recording' | 'priority' }>`
  padding: 0.125rem 0.375rem;
  border-radius: 8px;
  font-size: 0.6rem;
  font-weight: 500;
  background: ${props => {
    switch(props.$type) {
      case 'ai': return 'rgba(34, 197, 94, 0.2)';
      case 'face': return 'rgba(59, 130, 246, 0.2)';
      case 'alert': return 'rgba(245, 158, 11, 0.2)';
      case 'recording': return 'rgba(239, 68, 68, 0.2)';
      case 'priority': return 'rgba(147, 51, 234, 0.2)';
    }
  }};
  color: ${props => {
    switch(props.$type) {
      case 'ai': return '#22C55E';
      case 'face': return '#3B82F6';
      case 'alert': return '#F59E0B';
      case 'recording': return '#EF4444';
      case 'priority': return '#9333EA';
    }
  }};
  border: 1px solid ${props => {
    switch(props.$type) {
      case 'ai': return 'rgba(34, 197, 94, 0.3)';
      case 'face': return 'rgba(59, 130, 246, 0.3)';
      case 'alert': return 'rgba(245, 158, 11, 0.3)';
      case 'recording': return 'rgba(239, 68, 68, 0.3)';
      case 'priority': return 'rgba(147, 51, 234, 0.3)';
    }
  }};
`;

// Loading spinner component
export const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #333;
  border-top: 2px solid #FFD700;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin: 0 auto 0.5rem;
`;

// Common section styling
export const Section = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

// Common button styling for controls - FIXED: Using transient prop
export const ControlButton = styled.button<{ $active?: boolean }>`
  padding: 0.5rem;
  background: ${props => props.$active ? 'rgba(255, 215, 0, 0.2)' : 'rgba(40, 40, 40, 0.7)'};
  border: 1px solid ${props => props.$active ? '#FFD700' : 'rgba(255, 215, 0, 0.3)'};
  border-radius: 6px;
  color: ${props => props.$active ? '#FFD700' : '#E0E0E0'};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  
  &:hover {
    background: rgba(255, 215, 0, 0.1);
    border-color: rgba(255, 215, 0, 0.5);
  }
`;

// Common select styling
export const StyledSelect = styled.select`
  background: rgba(40, 40, 40, 0.9);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
  color: #E0E0E0;
  padding: 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #FFD700;
  }
`;

// Common input styling
export const StyledInput = styled.input`
  background: rgba(40, 40, 40, 0.9);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
  color: #E0E0E0;
  padding: 0.5rem;
  font-size: 0.8rem;
  
  &::placeholder {
    color: #666;
  }
  
  &:focus {
    outline: none;
    border-color: #FFD700;
  }
`;

// Common scrollbar styling mixin
export const customScrollbar = `
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.5);
    border-radius: 3px;
  }
`;
