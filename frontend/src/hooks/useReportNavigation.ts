// useReportNavigation.ts - Custom Hook for Report Builder Navigation
// Handles tab switching, validation, and state management

import { useMemo, useCallback } from 'react';
import { usePerformanceOptimizedState } from './usePerformanceOptimizedState';

interface TabDefinition {
  id: string;
  label: string;
  disabled: boolean;
  isNew?: boolean;
}

interface UseReportNavigationProps {
  isClientSelected: boolean;
}

interface UseReportNavigationReturn {
  activeTab: string;
  tabs: TabDefinition[];
  currentTabIndex: number;
  isFirstTab: boolean;
  isLastTab: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  setActiveTab: (tab: string) => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleTabChange: (newTab: string) => void;
}

/**
 * Custom hook for managing report builder navigation
 * Centralizes tab logic and provides navigation controls
 */
export const useReportNavigation = ({
  isClientSelected
}: UseReportNavigationProps): UseReportNavigationReturn => {
  const [activeTab, setActiveTab] = usePerformanceOptimizedState<string>('client', 'activeTab');

  // Memoized tab definitions to prevent unnecessary recalculations
  const tabs = useMemo((): TabDefinition[] => [
    { id: 'client', label: '1. Client Selection', disabled: false },
    { id: 'info', label: '2. Property Info', disabled: !isClientSelected },
    { id: 'reports', label: '3. Daily Reports', disabled: !isClientSelected },
    { id: 'media', label: '4. Media Management', disabled: !isClientSelected },
    { id: 'viz', label: '5. Data Visualization', disabled: !isClientSelected },
    { id: 'theme', label: '6. Theme Customization', disabled: !isClientSelected },
    { id: 'delivery', label: '7. Delivery Options', disabled: !isClientSelected },
    { id: 'preview', label: '8. PDF Preview & Export', disabled: !isClientSelected },
  ], [isClientSelected]);

  // Current tab index for navigation calculations
  const currentTabIndex = useMemo(() => 
    tabs.findIndex(tab => tab.id === activeTab), 
    [tabs, activeTab]
  );

  // Navigation state calculations
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;
  const canGoNext = !isLastTab && 
    currentTabIndex + 1 < tabs.length && 
    !tabs[currentTabIndex + 1]?.disabled;
  const canGoPrevious = !isFirstTab;

  // Enhanced tab change handler with data persistence events
  const handleTabChange = useCallback((newTab: string) => {
    console.log('🚀 TAB NAVIGATION: From', activeTab, 'to', newTab, '- SAVING DATA BEFORE SWITCH');
    
    // Critical: Save all current data to context before switching tabs
    if (activeTab === 'reports') {
      console.log('💾 SAVE CHECKPOINT: Leaving Daily Reports tab - ensuring all data persisted');
      
      // Emit save event to ensure Daily Reports saves all pending changes
      const saveEvent = new CustomEvent('forceSaveBeforeTabSwitch', {
        detail: {
          fromTab: activeTab,
          toTab: newTab,
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(saveEvent);
    }
    
    // Immediate data sync event for any components listening
    const tabSwitchEvent = new CustomEvent('tabSwitchDataSync', {
      detail: {
        fromTab: activeTab,
        toTab: newTab,
        action: 'ENSURE_DATA_SYNC',
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(tabSwitchEvent);
    
    // Switch to the new tab
    setActiveTab(newTab);
    
    console.log('✅ TAB SWITCH COMPLETE: Now on', newTab, 'tab with data saved');
  }, [activeTab, setActiveTab]);

  // Next tab navigation
  const handleNext = useCallback(() => { 
    let nextIndex = currentTabIndex + 1; 
    while(nextIndex < tabs.length && tabs[nextIndex].disabled) {
      nextIndex++; 
    }
    if(nextIndex < tabs.length) {
      handleTabChange(tabs[nextIndex].id); 
    }
  }, [currentTabIndex, tabs, handleTabChange]);
  
  // Previous tab navigation  
  const handlePrevious = useCallback(() => { 
    let prevIndex = currentTabIndex - 1; 
    while(prevIndex >= 0 && tabs[prevIndex].disabled) {
      prevIndex--; 
    }
    if(prevIndex >= 0) {
      handleTabChange(tabs[prevIndex].id); 
    }
  }, [currentTabIndex, tabs, handleTabChange]);

  return {
    activeTab,
    tabs,
    currentTabIndex,
    isFirstTab,
    isLastTab,
    canGoNext,
    canGoPrevious,
    setActiveTab,
    handleNext,
    handlePrevious,
    handleTabChange
  };
};
