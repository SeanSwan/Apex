// useChartGeneration.ts - Custom Hook for Chart Generation Logic
// Handles complex chart rendering with enhanced loading detection

import { useState, useCallback, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

interface UseChartGenerationProps {
  activeTab: string;
  contextMetrics: any;
  toast: any;
}

interface UseChartGenerationReturn {
  chartDataURL: string;
  setChartDataURL: (url: string) => void;
  isLoading: boolean;
  loadingMessage: string;
  isChartGenerationRequested: boolean;
  setIsChartGenerationRequested: (requested: boolean) => void;
  generateChartWithErrorHandling: (chartRef: React.RefObject<HTMLDivElement>) => Promise<void>;
  handleRefreshChart: () => void;
}

/**
 * Custom hook for managing chart generation with enhanced loading detection
 * Handles complex async chart rendering and error handling
 */
export const useChartGeneration = ({
  activeTab,
  contextMetrics,
  toast
}: UseChartGenerationProps): UseChartGenerationReturn => {
  const [chartDataURL, setChartDataURL] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isChartGenerationRequested, setIsChartGenerationRequested] = useState<boolean>(false);

  // Enhanced chart generation with full loading detection
  const generateChartWithErrorHandling = useCallback(async (chartRef: React.RefObject<HTMLDivElement>) => {
    if (!chartRef.current) return;

    setIsLoading(true);
    setLoadingMessage('Generating chart preview...');
    
    try {
      console.log('📊 ENHANCED: Starting chart generation with full loading detection...');
      
      // Step 1: Wait for initial DOM stabilization
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Check for loading indicators and wait for them to disappear
      let attempts = 0;
      const maxAttempts = 15; // 15 attempts = ~7.5 seconds max wait
      
      while (attempts < maxAttempts) {
        const loadingElements = chartRef.current.querySelectorAll(
          '[class*="loading"], [class*="Loading"], .recharts-loading, .loading-spinner, [data-loading="true"]'
        );
        const hasLoadingText = chartRef.current.textContent?.includes('Loading') || 
                              chartRef.current.textContent?.includes('loading');
        
        // Check if SVG/Canvas elements are present (indicates chart is rendered)
        const chartElements = chartRef.current.querySelectorAll('svg, canvas, .recharts-surface');
        const hasChartContent = chartElements.length > 0;
        
        console.log(`📊 ENHANCED: Chart loading check ${attempts + 1}/${maxAttempts}:`, {
          loadingElementsFound: loadingElements.length,
          hasLoadingText,
          hasChartContent,
          chartElementsCount: chartElements.length
        });
        
        // Chart is ready when: no loading elements, no loading text, has chart content
        if (loadingElements.length === 0 && !hasLoadingText && hasChartContent) {
          console.log('✅ ENHANCED: Chart fully loaded and ready for capture!');
          break;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between checks
      }
      
      if (attempts >= maxAttempts) {
        console.warn('⚠️ ENHANCED: Chart capture proceeding after max wait time');
      }
      
      // Step 3: Check if chart is actually visible and in viewport
      const isChartVisible = chartRef.current.offsetHeight > 0 && 
                            chartRef.current.offsetWidth > 0 &&
                            chartRef.current.getBoundingClientRect().height > 0;
      
      if (!isChartVisible) {
        console.warn('⚠️ ENHANCED: Chart element not visible, waiting...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Step 4: Additional stabilization wait for animations/transitions
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 5: Capture with enhanced settings
      if (chartRef.current) {
        console.log('📸 ENHANCED: Capturing fully loaded chart...');
        
        const canvas = await html2canvas(chartRef.current, { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#1e1e1e', // Ensure dark background
          logging: false,
          allowTaint: true,
          foreignObjectRendering: true,
          width: chartRef.current.scrollWidth,
          height: chartRef.current.scrollHeight,
          windowWidth: chartRef.current.scrollWidth,
          windowHeight: chartRef.current.scrollHeight
        });
        
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        setChartDataURL(dataUrl);
        
        console.log('✅ ENHANCED: Chart captured successfully:', {
          dataUrlLength: dataUrl.length,
          isValidDataUrl: dataUrl.startsWith('data:image/png'),
          canvasWidth: canvas.width,
          canvasHeight: canvas.height
        });
        
        toast({ 
          title: "Enhanced Chart Generated", 
          description: "Chart preview captured with full loading detection.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('❌ ENHANCED: Chart generation failed:', error);
      toast({ 
        variant: "destructive", 
        title: "Chart Generation Failed", 
        description: "Unable to generate chart preview. Please try again."
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      setIsChartGenerationRequested(false);
    }
  }, [toast]);

  // Refresh chart handler
  const handleRefreshChart = useCallback(() => { 
    setChartDataURL(''); // Clear existing chart
    setIsChartGenerationRequested(true); 
  }, []);

  // Effect for automatic chart generation when metrics change
  useEffect(() => {
    if ((activeTab === 'viz' || activeTab === 'preview') && contextMetrics) {
      console.log('📈 CONTEXT metrics changed - requesting chart regeneration:', {
        totalHumanIntrusions: Object.values(contextMetrics.humanIntrusions || {}).reduce((a: number, b: number) => a + b, 0),
        totalVehicleIntrusions: Object.values(contextMetrics.vehicleIntrusions || {}).reduce((a: number, b: number) => a + b, 0),
        potentialThreats: contextMetrics.potentialThreats,
        totalCameras: contextMetrics.totalCameras,
        aiAccuracy: contextMetrics.aiAccuracy
      });
      
      // Shorter debounce for preview
      const debounceTime = activeTab === 'preview' ? 500 : 1000;
      const timeoutId = setTimeout(() => {
        setIsChartGenerationRequested(true);
      }, debounceTime);
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    // Watch ALL metric properties that could change
    JSON.stringify(contextMetrics?.humanIntrusions || {}),
    JSON.stringify(contextMetrics?.vehicleIntrusions || {}),
    contextMetrics?.potentialThreats, 
    contextMetrics?.proactiveAlerts,
    contextMetrics?.aiAccuracy, 
    contextMetrics?.responseTime,
    contextMetrics?.totalCameras,
    contextMetrics?.camerasOnline,
    contextMetrics?.operationalUptime,
    activeTab
  ]);

  // Effect for immediate chart generation when switching to preview
  useEffect(() => {
    if (activeTab === 'preview' && !isLoading) {
      console.log('⚡ IMMEDIATE chart generation for preview');
      
      // Generate immediately, don't wait
      const timeoutId = setTimeout(() => {
        setIsChartGenerationRequested(true);
      }, 100); // Very short delay
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, isLoading]);

  return {
    chartDataURL,
    setChartDataURL,
    isLoading,
    loadingMessage,
    isChartGenerationRequested,
    setIsChartGenerationRequested,
    generateChartWithErrorHandling,
    handleRefreshChart
  };
};
