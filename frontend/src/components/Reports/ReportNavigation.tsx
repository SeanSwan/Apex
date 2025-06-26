// ReportNavigation.tsx - Navigation Component for Report Builder
// Handles tab navigation and PDF export controls

import React from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { NavigationContainer, Button, PDFButtonGroup } from './ReportBuilder.styles';

interface NavigationProps {
  activeTab: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLoading: boolean;
  selectedClient: any;
  themeSettings: any;
  onPrevious: () => void;
  onNext: () => void;
  onDownloadReport: (type: 'standard' | 'compressed' | 'both') => Promise<void>;
}

/**
 * Navigation component for report builder
 * Provides tab navigation and PDF export functionality
 */
export const ReportNavigation: React.FC<NavigationProps> = ({
  activeTab,
  canGoPrevious,
  canGoNext,
  isLoading,
  selectedClient,
  themeSettings,
  onPrevious,
  onNext,
  onDownloadReport
}) => {
  const isPreviewTab = activeTab === 'preview';

  return (
    <NavigationContainer>
      <Button 
        $variant="secondary" 
        onClick={onPrevious} 
        disabled={!canGoPrevious}
        theme={themeSettings}
      > 
        <ChevronLeft size={16} /> Previous 
      </Button>

      {!isPreviewTab ? (
        <Button 
          $variant="primary" 
          onClick={onNext} 
          disabled={!canGoNext}
          theme={themeSettings}
        > 
          Next <ChevronRight size={16} /> 
        </Button>
      ) : (
        <PDFButtonGroup>
          <Button 
            $variant="success" 
            onClick={() => onDownloadReport('standard')} 
            disabled={isLoading || !selectedClient}
            theme={themeSettings}
            title="Download standard quality PDF"
          > 
            <Download size={16} /> Standard PDF 
          </Button>
          
          <Button 
            $variant="secondary" 
            onClick={() => onDownloadReport('compressed')} 
            disabled={isLoading || !selectedClient}
            theme={themeSettings}
            title="Download compressed PDF (smaller file size)"
          > 
            <Download size={16} /> Compressed 
          </Button>
          
          <Button 
            $variant="primary" 
            onClick={() => onDownloadReport('both')} 
            disabled={isLoading || !selectedClient}
            theme={themeSettings}
            title="Download both standard and compressed versions"
          > 
            <Download size={16} /> Both Versions 
          </Button>
        </PDFButtonGroup>
      )}
    </NavigationContainer>
  );
};

export default ReportNavigation;
