/**
 * PDF Generation Engine - Advanced PDF Generation and Export Utilities
 * Extracted from EnhancedPreviewPanel for better modularity
 * Production-ready PDF generation with compression and fallback options
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { 
  PDF_GENERATION_CONFIG, 
  EXPORT_CONFIG, 
  PDFExportType,
  LOADING_STATES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DATE_FORMAT_PATTERNS
} from '../constants/previewPanelConstants';

/**
 * PDF Generation Options Interface
 */
export interface PDFGenerationOptions {
  element: HTMLElement;
  filename?: string;
  quality?: number;
  scale?: number;
  generateCompressed?: boolean;
  removeWatermarks?: boolean;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter' | 'legal';
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

/**
 * PDF Generation Result Interface
 */
export interface PDFGenerationResult {
  success: boolean;
  filename?: string;
  compressedFilename?: string;
  error?: string;
  size?: number;
  compressedSize?: number;
  generationTime?: number;
}

/**
 * Canvas Generation Options Interface
 */
export interface CanvasGenerationOptions {
  scale?: number;
  logging?: boolean;
  useCORS?: boolean;
  width?: number;
  height?: number;
  windowWidth?: number;
  windowHeight?: number;
  allowTaint?: boolean;
}

/**
 * Enhanced PDF Generator Class
 * Provides comprehensive PDF generation capabilities with fallback options
 */
export class EnhancedPDFGenerator {
  /**
   * Generate PDF with advanced options and error handling
   */
  static async generatePDF(options: PDFGenerationOptions): Promise<PDFGenerationResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 PDF Generation: Starting with options:', {
        filename: options.filename,
        quality: options.quality,
        scale: options.scale,
        generateCompressed: options.generateCompressed
      });

      // Validate input element
      if (!options.element) {
        throw new Error('Element is required for PDF generation');
      }

      // Prepare element for PDF generation
      const preparedElement = await this.prepareElementForPDF(options.element);
      
      // Generate canvas from element
      const canvas = await this.generateCanvas(preparedElement, {
        scale: options.scale || PDF_GENERATION_CONFIG.SCALE.DEFAULT,
        logging: EXPORT_CONFIG.PDF.LOGGING,
        useCORS: EXPORT_CONFIG.PDF.USE_CORS,
        width: preparedElement.scrollWidth,
        height: preparedElement.scrollHeight,
        windowWidth: EXPORT_CONFIG.CANVAS.WINDOW_WIDTH,
        windowHeight: preparedElement.scrollHeight
      });

      // Clean up prepared element
      this.cleanupPreparedElement(preparedElement);

      // Generate base filename
      const baseFilename = this.generateFilename(options.filename);

      // Generate standard PDF
      const standardResult = await this.generatePDFFromCanvas(
        canvas, 
        baseFilename,
        options.quality || PDF_GENERATION_CONFIG.QUALITY.STANDARD,
        options.orientation || PDF_GENERATION_CONFIG.ORIENTATIONS.PORTRAIT,
        options.format || PDF_GENERATION_CONFIG.FORMATS.A4,
        options.margins
      );

      let compressedResult: { filename: string; size: number } | null = null;

      // Generate compressed PDF if requested
      if (options.generateCompressed) {
        const compressedFilename = baseFilename.replace('.pdf', '-compressed.pdf');
        compressedResult = await this.generatePDFFromCanvas(
          canvas,
          compressedFilename,
          PDF_GENERATION_CONFIG.QUALITY.COMPRESSED,
          options.orientation || PDF_GENERATION_CONFIG.ORIENTATIONS.PORTRAIT,
          options.format || PDF_GENERATION_CONFIG.FORMATS.A4,
          options.margins
        );
      }

      const generationTime = Date.now() - startTime;

      console.log('✅ PDF Generation: Completed successfully', {
        standardSize: standardResult.size,
        compressedSize: compressedResult?.size,
        generationTime: `${generationTime}ms`
      });

      return {
        success: true,
        filename: standardResult.filename,
        compressedFilename: compressedResult?.filename,
        size: standardResult.size,
        compressedSize: compressedResult?.size,
        generationTime
      };

    } catch (error) {
      const generationTime = Date.now() - startTime;
      console.error('❌ PDF Generation: Failed', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.PDF_GENERATION_FAILED,
        generationTime
      };
    }
  }

  /**
   * Prepare HTML element for optimal PDF generation
   */
  private static async prepareElementForPDF(element: HTMLElement): Promise<HTMLElement> {
    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Apply PDF-specific styling
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.boxShadow = 'none';
    clone.style.borderRadius = '0';
    clone.style.border = 'none';
    clone.style.width = '1200px';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0px';
    clone.style.zIndex = '-1000';
    clone.style.background = 'inherit';

    // Optimize fonts for PDF
    const textElements = clone.querySelectorAll('*');
    textElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.style) {
        // Ensure text is readable in PDF
        const computedStyle = window.getComputedStyle(htmlEl);
        if (computedStyle.fontSize) {
          htmlEl.style.fontSize = computedStyle.fontSize;
        }
        // Fix text rendering issues
        htmlEl.style.textRendering = 'geometricPrecision';
        htmlEl.style.fontSmooth = 'always';
        htmlEl.style.webkitFontSmoothing = 'antialiased';
      }
    });

    // Add to DOM for proper rendering
    document.body.appendChild(clone);
    
    // Allow time for rendering
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return clone;
  }

  /**
   * Generate canvas from HTML element
   */
  private static async generateCanvas(
    element: HTMLElement, 
    options: CanvasGenerationOptions = {}
  ): Promise<HTMLCanvasElement> {
    const canvasOptions = {
      scale: options.scale || EXPORT_CONFIG.CANVAS.SCALE,
      logging: options.logging ?? EXPORT_CONFIG.CANVAS.LOGGING,
      useCORS: options.useCORS ?? EXPORT_CONFIG.CANVAS.USE_CORS,
      allowTaint: options.allowTaint ?? EXPORT_CONFIG.CANVAS.ALLOW_TAINT,
      width: options.width || element.scrollWidth,
      height: options.height || element.scrollHeight,
      windowWidth: options.windowWidth || EXPORT_CONFIG.CANVAS.WINDOW_WIDTH,
      windowHeight: options.windowHeight || element.scrollHeight
    };

    console.log('🖼️ PDF Generation: Generating canvas with options:', canvasOptions);

    return await html2canvas(element, canvasOptions);
  }

  /**
   * Generate PDF from canvas with specified options
   */
  private static async generatePDFFromCanvas(
    canvas: HTMLCanvasElement,
    filename: string,
    quality: number,
    orientation: 'portrait' | 'landscape',
    format: 'a4' | 'letter' | 'legal',
    margins?: { top?: number; right?: number; bottom?: number; left?: number; }
  ): Promise<{ filename: string; size: number }> {
    
    // Create PDF document
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    // Get PDF dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Apply margins
    const effectiveMargins = {
      top: margins?.top || PDF_GENERATION_CONFIG.MARGINS.TOP,
      right: margins?.right || PDF_GENERATION_CONFIG.MARGINS.RIGHT,
      bottom: margins?.bottom || PDF_GENERATION_CONFIG.MARGINS.BOTTOM,
      left: margins?.left || PDF_GENERATION_CONFIG.MARGINS.LEFT
    };

    const contentWidth = pdfWidth - effectiveMargins.left - effectiveMargins.right;
    const contentHeight = pdfHeight - effectiveMargins.top - effectiveMargins.bottom;

    // Convert canvas to image data with specified quality
    const imgData = canvas.toDataURL(EXPORT_CONFIG.IMAGE.FORMAT, quality);
    
    // Calculate image dimensions
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = contentWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    // Add pages as needed
    let heightLeft = imgHeight;
    let position = effectiveMargins.top;

    // Add first page
    pdf.addImage(
      imgData, 
      'PNG', 
      effectiveMargins.left, 
      position, 
      imgWidth, 
      imgHeight
    );
    heightLeft -= contentHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = effectiveMargins.top - contentHeight;
      pdf.addPage();
      pdf.addImage(
        imgData, 
        'PNG', 
        effectiveMargins.left, 
        position, 
        imgWidth, 
        imgHeight
      );
      heightLeft -= contentHeight;
    }

    // Save the PDF
    pdf.save(filename);

    // Calculate approximate file size (rough estimation)
    const estimatedSize = Math.round(imgData.length * 0.75 * quality);

    return {
      filename,
      size: estimatedSize
    };
  }

  /**
   * Clean up prepared element from DOM
   */
  private static cleanupPreparedElement(element: HTMLElement): void {
    try {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    } catch (error) {
      console.warn('⚠️ PDF Generation: Failed to cleanup prepared element:', error);
    }
  }

  /**
   * Generate filename with timestamp
   */
  private static generateFilename(baseFilename?: string): string {
    const timestamp = format(new Date(), DATE_FORMAT_PATTERNS.FILE_NAME);
    const base = baseFilename || EXPORT_CONFIG.PDF.DEFAULT_FILENAME;
    
    // Remove .pdf extension if present
    const nameWithoutExt = base.replace(/\.pdf$/i, '');
    
    return `${nameWithoutExt}-${timestamp}.pdf`;
  }

  /**
   * Basic fallback PDF generation for compatibility
   */
  static async generateBasicPDF(
    element: HTMLElement,
    filename?: string
  ): Promise<PDFGenerationResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 PDF Generation: Using basic fallback method');

      if (!element) {
        throw new Error('Element is required for PDF generation');
      }

      // Prepare element
      const preparedElement = await this.prepareElementForPDF(element);
      
      // Generate canvas with basic options
      const canvas = await html2canvas(preparedElement, {
        scale: PDF_GENERATION_CONFIG.SCALE.DEFAULT,
        logging: false,
        useCORS: true,
        width: preparedElement.scrollWidth,
        height: preparedElement.scrollHeight,
        windowWidth: preparedElement.scrollWidth,
        windowHeight: preparedElement.scrollHeight
      });

      // Clean up
      this.cleanupPreparedElement(preparedElement);

      // Generate PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const finalFilename = this.generateFilename(filename);
      pdf.save(finalFilename);

      const generationTime = Date.now() - startTime;

      console.log('✅ PDF Generation: Basic fallback completed successfully');

      return {
        success: true,
        filename: finalFilename,
        generationTime
      };

    } catch (error) {
      const generationTime = Date.now() - startTime;
      console.error('❌ PDF Generation: Basic fallback failed', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.PDF_GENERATION_FAILED,
        generationTime
      };
    }
  }
}

/**
 * PDF Generation Hook for React Components
 */
export interface UsePDFGenerationOptions {
  onSuccess?: (result: PDFGenerationResult) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onComplete?: () => void;
}

export interface UsePDFGenerationReturn {
  generatePDF: (element: HTMLElement, options?: Partial<PDFGenerationOptions>) => Promise<PDFGenerationResult>;
  generateBasicPDF: (element: HTMLElement, filename?: string) => Promise<PDFGenerationResult>;
  isGenerating: boolean;
  lastResult: PDFGenerationResult | null;
  error: string | null;
}

/**
 * React hook for PDF generation
 */
export const usePDFGeneration = (options: UsePDFGenerationOptions = {}): UsePDFGenerationReturn => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<PDFGenerationResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const generatePDF = React.useCallback(async (
    element: HTMLElement, 
    pdfOptions: Partial<PDFGenerationOptions> = {}
  ): Promise<PDFGenerationResult> => {
    setIsGenerating(true);
    setError(null);
    options.onStart?.();

    try {
      const result = await EnhancedPDFGenerator.generatePDF({
        element,
        ...pdfOptions
      });

      setLastResult(result);

      if (result.success) {
        options.onSuccess?.(result);
      } else {
        setError(result.error || ERROR_MESSAGES.PDF_GENERATION_FAILED);
        options.onError?.(result.error || ERROR_MESSAGES.PDF_GENERATION_FAILED);
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.PDF_GENERATION_FAILED;
      setError(errorMessage);
      options.onError?.(errorMessage);
      
      const result: PDFGenerationResult = {
        success: false,
        error: errorMessage
      };
      setLastResult(result);
      return result;

    } finally {
      setIsGenerating(false);
      options.onComplete?.();
    }
  }, [options]);

  const generateBasicPDF = React.useCallback(async (
    element: HTMLElement, 
    filename?: string
  ): Promise<PDFGenerationResult> => {
    setIsGenerating(true);
    setError(null);
    options.onStart?.();

    try {
      const result = await EnhancedPDFGenerator.generateBasicPDF(element, filename);
      setLastResult(result);

      if (result.success) {
        options.onSuccess?.(result);
      } else {
        setError(result.error || ERROR_MESSAGES.PDF_GENERATION_FAILED);
        options.onError?.(result.error || ERROR_MESSAGES.PDF_GENERATION_FAILED);
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.PDF_GENERATION_FAILED;
      setError(errorMessage);
      options.onError?.(errorMessage);
      
      const result: PDFGenerationResult = {
        success: false,
        error: errorMessage
      };
      setLastResult(result);
      return result;

    } finally {
      setIsGenerating(false);
      options.onComplete?.();
    }
  }, [options]);

  return {
    generatePDF,
    generateBasicPDF,
    isGenerating,
    lastResult,
    error
  };
};

// For backward compatibility, export the EnhancedPDFGenerator as default
export default EnhancedPDFGenerator;

// Add React import for the hook
import React from 'react';
