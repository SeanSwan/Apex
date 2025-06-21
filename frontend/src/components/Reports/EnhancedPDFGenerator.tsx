// Enhanced PDF Generator with Compression Options (Simplified Version)
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Removed pdf-lib import for now - install it later for advanced compression
// import { PDFDocument } from 'pdf-lib';

export interface PDFExportOptions {
  element: HTMLElement;
  filename: string;
  quality?: number; // 0.1 to 1.0 for compression
  format?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  scale?: number; // Canvas scale (1-3)
  generateCompressed?: boolean; // Whether to create compressed version
  removeWatermarks?: boolean; // Remove preview watermarks
}

export interface PDFExportResult {
  success: boolean;
  filename?: string;
  compressedFilename?: string;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
}

/**
 * Enhanced PDF Generator with compression and optimization
 */
export class EnhancedPDFGenerator {
  
  /**
   * Generate PDF with optional compression
   */
  static async generatePDF(options: PDFExportOptions): Promise<PDFExportResult> {
    const {
      element,
      filename,
      quality = 0.8,
      format = 'a4',
      orientation = 'portrait',
      scale = 2,
      generateCompressed = true,
      removeWatermarks = true
    } = options;

    try {
      console.log('🔄 Starting PDF generation...');
      
      // Clone element and prepare for PDF
      const clonedElement = await this.prepareElementForPDF(element, removeWatermarks);
      
      // Generate high-quality canvas
      console.log('📸 Generating canvas...');
      const canvas = await html2canvas(clonedElement, {
        scale: scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: clonedElement.scrollWidth,
        height: clonedElement.scrollHeight,
        windowWidth: clonedElement.scrollWidth,
        windowHeight: clonedElement.scrollHeight,
      });

      // Clean up cloned element
      if (clonedElement.parentNode) {
        clonedElement.parentNode.removeChild(clonedElement);
      }

      // Generate standard PDF
      console.log('📄 Creating PDF...');
      const standardPDF = await this.createPDFFromCanvas(canvas, { format, orientation, quality: 0.9 });
      const standardBlob = standardPDF.output('blob');
      
      // Download standard PDF
      this.downloadBlob(standardBlob, filename);
      
      const result: PDFExportResult = {
        success: true,
        filename: filename,
        originalSize: standardBlob.size
      };

      // Generate compressed version if requested
      if (generateCompressed) {
        console.log('🗜️ Creating compressed version...');
        try {
          // Create a lower quality version for compression
          const compressedPDF = await this.createPDFFromCanvas(canvas, { 
            format, 
            orientation, 
            quality: Math.max(0.3, quality * 0.7) // Lower quality for compression
          });
          const compressedBlob = compressedPDF.output('blob');
          const compressedFilename = this.getCompressedFilename(filename);
          
          // Download compressed PDF
          this.downloadBlob(compressedBlob, compressedFilename);
          
          result.compressedFilename = compressedFilename;
          result.compressedSize = compressedBlob.size;
          
          console.log(`✅ PDF generated successfully!
            📄 Standard: ${this.formatFileSize(standardBlob.size)}
            🗜️ Compressed: ${this.formatFileSize(compressedBlob.size)} 
            💾 Savings: ${Math.round((1 - compressedBlob.size / standardBlob.size) * 100)}%`);
        } catch (compressionError) {
          console.warn('⚠️ Compression failed, using standard PDF only:', compressionError);
        }
      }

      return result;

    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Prepare element for PDF by cloning and cleaning
   */
  private static async prepareElementForPDF(element: HTMLElement, removeWatermarks: boolean): Promise<HTMLElement> {
    const cloned = element.cloneNode(true) as HTMLElement;
    
    // Remove watermarks
    if (removeWatermarks) {
      const watermarks = cloned.querySelectorAll('[data-preview-message="true"], [data-watermark="true"]');
      watermarks.forEach(el => el.remove());
    }

    // Optimize for PDF
    cloned.style.margin = '0';
    cloned.style.padding = '0';
    cloned.style.boxShadow = 'none';
    cloned.style.borderRadius = '0';
    cloned.style.border = 'none';
    cloned.style.width = '1200px';
    cloned.style.position = 'absolute';
    cloned.style.left = '-9999px';
    cloned.style.top = '0';
    cloned.style.backgroundColor = '#ffffff';

    // Ensure images are loaded
    const images = cloned.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => this.ensureImageLoaded(img)));

    // Add to DOM temporarily
    document.body.appendChild(cloned);
    
    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return cloned;
  }

  /**
   * Ensure image is loaded
   */
  private static ensureImageLoaded(img: HTMLImageElement): Promise<void> {
    return new Promise((resolve) => {
      if (img.complete && img.naturalHeight !== 0) {
        resolve();
      } else {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Continue even if image fails
        // Timeout after 3 seconds
        setTimeout(() => resolve(), 3000);
      }
    });
  }

  /**
   * Create PDF from canvas
   */
  private static async createPDFFromCanvas(
    canvas: HTMLCanvasElement, 
    options: { format: string; orientation: string; quality: number }
  ): Promise<jsPDF> {
    const { format, orientation, quality } = options;
    
    const pdf = new jsPDF({
      orientation: orientation as 'portrait' | 'landscape',
      unit: 'mm',
      format: format as any,
      compress: true
    });

    const imgData = canvas.toDataURL('image/jpeg', quality);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pdfWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = position - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    return pdf;
  }

  /**
   * Create compressed PDF using lower quality settings
   * Note: For advanced compression, install pdf-lib package
   */
  private static async createCompressedPDF(originalPDF: jsPDF, quality: number): Promise<jsPDF> {
    try {
      // For now, return a PDF with lower quality settings
      // This is a simplified compression - install pdf-lib for advanced compression
      console.log('Using simplified compression (lower quality)');
      return originalPDF;
    } catch (error) {
      console.warn('PDF compression failed, returning original:', error);
      return originalPDF;
    }
  }

  /**
   * Download blob as file
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get compressed filename
   */
  private static getCompressedFilename(originalFilename: string): string {
    const lastDotIndex = originalFilename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return `${originalFilename}_compressed.pdf`;
    }
    const name = originalFilename.substring(0, lastDotIndex);
    const extension = originalFilename.substring(lastDotIndex);
    return `${name}_compressed${extension}`;
  }

  /**
   * Format file size for display
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Quick export method for simple use cases
   */
  static async quickExport(element: HTMLElement, filename: string): Promise<boolean> {
    const result = await this.generatePDF({
      element,
      filename,
      quality: 0.8,
      generateCompressed: true,
      removeWatermarks: true
    });
    return result.success;
  }

  /**
   * High quality export (larger file size)
   */
  static async highQualityExport(element: HTMLElement, filename: string): Promise<boolean> {
    const result = await this.generatePDF({
      element,
      filename,
      quality: 1.0,
      scale: 3,
      generateCompressed: false,
      removeWatermarks: true
    });
    return result.success;
  }

  /**
   * Compressed export only (smaller file size)
   */
  static async compressedExport(element: HTMLElement, filename: string): Promise<boolean> {
    const result = await this.generatePDF({
      element,
      filename,
      quality: 0.6,
      scale: 1.5,
      generateCompressed: false, // Direct compression
      removeWatermarks: true
    });
    return result.success;
  }
}

// Export convenience functions
export const { quickExport, highQualityExport, compressedExport } = EnhancedPDFGenerator;
