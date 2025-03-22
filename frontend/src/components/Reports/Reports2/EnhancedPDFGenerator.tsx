// File: frontend/src/components/Reports/EnhancedPDFGenerator.tsx

import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import styled from 'styled-components';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { FilePdf, Download, Eye, Send, Copy, Edit } from 'lucide-react';
import { ThemeSettings, PropertyDataItem, DailyReport } from '../../types/reports';

// Styled components for PDF preview
const PreviewContainer = styled.div`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
`;

const PreviewTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PDFPreview = styled.div`
  width: 100%;
  max-width: 210mm; /* A4 width */
  margin: 0 auto;
  padding: 15px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  position: relative;
  min-height: 297mm; /* A4 height */
  transform-origin: top left;
  transform: scale(0.75);
  overflow: hidden;
  
  @media (max-width: 768px) {
    transform: scale(0.6);
  }
`;

const PageCounter = styled.div`
  position: absolute;
  bottom: 10mm;
  right: 10mm;
  font-size: 10px;
  color: #666;
`;

const PageBreak = styled.div`
  page-break-after: always;
  height: 0;
  margin: 0;
  border: 0;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  
  &::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #0070f3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
`;

const VideoLinkSection = styled.div`
  margin-top: 20px;
  padding: 15px;
  background-color: #f0f7ff;
  border-left: 4px solid #0070f3;
  border-radius: 4px;
`;

const QRCodePlaceholder = styled.div`
  width: 80px;
  height: 80px;
  background-color: #e0e0e0;
  margin: 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #666;
`;

interface EnhancedPDFGeneratorProps {
  reportTitle: string;
  leftLogo?: string;
  rightLogo?: string;
  backgroundImage?: string;
  backgroundOpacity: number;
  themeSettings: ThemeSettings;
  propertyData: PropertyDataItem[];
  chartImageURL: string;
  dailyReports: DailyReport[];
  summaryNotes: string;
  signature: string;
  dateRange: { start: Date; end: Date };
  clientName: string;
  videoLinks?: Array<{ url: string; title: string; expiryDate: Date }>;
  onSend?: (pdfBlob: Blob) => Promise<void>;
}

/**
 * Enhanced PDF Generator component
 * Creates professional PDF reports with customizable headers, logos, and secure video links
 */
const EnhancedPDFGenerator: React.FC<EnhancedPDFGeneratorProps> = ({
  reportTitle,
  leftLogo,
  rightLogo,
  backgroundImage,
  backgroundOpacity,
  themeSettings,
  propertyData,
  chartImageURL,
  dailyReports,
  summaryNotes,
  signature,
  dateRange,
  clientName,
  videoLinks = [],
  onSend
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Generate QR code for video links (placeholder function)
  const generateQRCode = (url: string) => {
    // In a real implementation, you would use a QR code generation library
    // For now, we'll return a placeholder
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==`;
  };
  
  // Format the date range for display
  const formattedDateRange = `${format(dateRange.start, 'MMMM d')} - ${format(dateRange.end, 'MMMM d, yyyy')}`;
  
  // Generate PDF document
  const generatePDF = async (forPreview: boolean = false): Promise<Blob | null> => {
    if (!forPreview) {
      setIsGenerating(true);
    }
    
    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      }) as any; // Type assertion to avoid TypeScript errors with jsPDF plugins
      
      // Set default font
      doc.setFont('helvetica', 'normal');
      
      // Constants for page layout
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      
      // Helper function to add headers to each page
      const addHeader = (pageNum: number) => {
        // Add background image if provided
        if (backgroundImage) {
          try {
            doc.addImage(
              backgroundImage,
              'JPEG',
              0,
              0,
              pageWidth,
              pageHeight,
              'bg',
              'FAST',
              backgroundOpacity
            );
          } catch (error) {
            console.error('Error adding background image:', error);
          }
        }
        
        // Add left logo if provided
        if (leftLogo) {
          try {
            doc.addImage(
              leftLogo,
              'JPEG',
              margin,
              margin,
              25,
              15,
              'leftLogo',
              'FAST'
            );
          } catch (error) {
            console.error('Error adding left logo:', error);
          }
        }
        
        // Add right logo if provided
        if (rightLogo) {
          try {
            doc.addImage(
              rightLogo,
              'JPEG',
              pageWidth - margin - 25,
              margin,
              25,
              15,
              'rightLogo',
              'FAST'
            );
          } catch (error) {
            console.error('Error adding right logo:', error);
          }
        }
        
        // Add title
        doc.setFontSize(20);
        doc.setTextColor(themeSettings.primaryColor || '#0070f3');
        doc.text(reportTitle, pageWidth / 2, margin + 20, { align: 'center' });
        
        // Add client name and date range
        doc.setFontSize(12);
        doc.setTextColor('#333333');
        doc.text(`${clientName} - ${formattedDateRange}`, pageWidth / 2, margin + 28, { align: 'center' });
        
        // Add page number
        doc.setFontSize(8);
        doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        
        // Add line separator
        doc.setDrawColor(themeSettings.primaryColor || '#0070f3');
        doc.setLineWidth(0.5);
        doc.line(margin, margin + 32, pageWidth - margin, margin + 32);
      };
      
      // Add first page
      let currentPage = 1;
      addHeader(currentPage);
      
      // Add property data section
      let yPos = margin + 40;
      
      doc.setFontSize(14);
      doc.setTextColor(themeSettings.primaryColor || '#0070f3');
      doc.text('Security Metrics Summary', margin, yPos);
      yPos += 8;
      
      // Add property data table
      if (propertyData.length > 0) {
        doc.autoTable({
          startY: yPos,
          head: [['Metric', 'Value']],
          body: propertyData.map(item => [item.type, item.count]),
          theme: 'striped',
          headStyles: {
            fillColor: themeSettings.primaryColor || [0, 112, 243],
            textColor: [255, 255, 255]
          },
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 10
          }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
      
      // Add chart if available
      if (chartImageURL) {
        try {
          // Check if we need a new page
          if (yPos + 100 > pageHeight - margin) {
            doc.addPage();
            currentPage++;
            addHeader(currentPage);
            yPos = margin + 40;
          }
          
          doc.setFontSize(14);
          doc.setTextColor(themeSettings.primaryColor || '#0070f3');
          doc.text('Security Activity Visualization', margin, yPos);
          yPos += 8;
          
          doc.addImage(
            chartImageURL,
            'PNG',
            margin,
            yPos,
            contentWidth,
            80
          );
          
          yPos += 85;
        } catch (error) {
          console.error('Error adding chart image:', error);
        }
      }
      
      // Add daily reports
      doc.setFontSize(14);
      doc.setTextColor(themeSettings.primaryColor || '#0070f3');
      
      // Check if we need a new page
      if (yPos + 20 > pageHeight - margin) {
        doc.addPage();
        currentPage++;
        addHeader(currentPage);
        yPos = margin + 40;
      }
      
      doc.text('Daily Security Reports', margin, yPos);
      yPos += 8;
      
      // Add each daily report
      for (const report of dailyReports) {
        if (report.content) {
          // Check if we need a new page
          if (yPos + 40 > pageHeight - margin) {
            doc.addPage();
            currentPage++;
            addHeader(currentPage);
            yPos = margin + 40;
          }
          
          doc.setFontSize(12);
          doc.setTextColor(themeSettings.primaryColor || '#0070f3');
          doc.text(`${report.day} (${report.securityCode || 'Code 4'})`, margin, yPos);
          yPos += 6;
          
          doc.setFontSize(10);
          doc.setTextColor('#333333');
          const splitContent = doc.splitTextToSize(report.content, contentWidth);
          
          // Check if content will fit on current page
          if (yPos + splitContent.length * 5 > pageHeight - margin) {
            doc.addPage();
            currentPage++;
            addHeader(currentPage);
            yPos = margin + 40;
            
            doc.setFontSize(12);
            doc.setTextColor(themeSettings.primaryColor || '#0070f3');
            doc.text(`${report.day} (${report.securityCode || 'Code 4'}) (continued)`, margin, yPos);
            yPos += 6;
            
            doc.setFontSize(10);
            doc.setTextColor('#333333');
          }
          
          doc.text(splitContent, margin, yPos);
          yPos += splitContent.length * 5 + 8;
        }
      }
      
      // Add summary notes
      if (summaryNotes) {
        // Check if we need a new page
        if (yPos + 40 > pageHeight - margin) {
          doc.addPage();
          currentPage++;
          addHeader(currentPage);
          yPos = margin + 40;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(themeSettings.primaryColor || '#0070f3');
        doc.text('Additional Notes & Compliance', margin, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setTextColor('#333333');
        const splitSummary = doc.splitTextToSize(summaryNotes, contentWidth);
        
        // Check if summary will fit on current page
        if (yPos + splitSummary.length * 5 > pageHeight - margin) {
          doc.addPage();
          currentPage++;
          addHeader(currentPage);
          yPos = margin + 40;
        }
        
        doc.text(splitSummary, margin, yPos);
        yPos += splitSummary.length * 5 + 10;
      }
      
      // Add video links section if available
      if (videoLinks.length > 0) {
        // Check if we need a new page
        if (yPos + 50 > pageHeight - margin) {
          doc.addPage();
          currentPage++;
          addHeader(currentPage);
          yPos = margin + 40;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(themeSettings.primaryColor || '#0070f3');
        doc.text('Secure Video Evidence', margin, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setTextColor('#333333');
        doc.text('Scan QR codes to view secure videos. Links expire for security reasons.', margin, yPos);
        yPos += 8;
        
        for (const video of videoLinks) {
          // Check if we need a new page
          if (yPos + 30 > pageHeight - margin) {
            doc.addPage();
            currentPage++;
            addHeader(currentPage);
            yPos = margin + 40;
          }
          
          // Add video title
          doc.setFontSize(11);
          doc.setTextColor('#333333');
          doc.text(video.title, margin, yPos);
          yPos += 5;
          
          // Add expiry info
          doc.setFontSize(9);
          doc.setTextColor('#666666');
          doc.text(`Expires: ${format(video.expiryDate, 'MMM d, yyyy h:mm a')}`, margin, yPos);
          yPos += 5;
          
          // Add QR code
          try {
            const qrCode = generateQRCode(video.url);
            doc.addImage(qrCode, 'PNG', margin, yPos, 20, 20);
          } catch (error) {
            console.error('Error adding QR code:', error);
          }
          
          // Add URL text
          doc.setFontSize(8);
          doc.text(video.url, margin + 25, yPos + 10);
          
          yPos += 25;
        }
      }
      
      // Add signature if provided
      if (signature) {
        // Check if we need a new page
        if (yPos + 20 > pageHeight - margin) {
          doc.addPage();
          currentPage++;
          addHeader(currentPage);
          yPos = margin + 40;
        }
        
        doc.setFontSize(10);
        doc.setTextColor('#333333');
        doc.text('Security Operations Manager:', margin, yPos);
        doc.text(signature, margin + 50, yPos);
        
        // Add date
        yPos += 6;
        doc.text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`, margin, yPos);
      }
      
      // Add footer with generated timestamp
      doc.setFontSize(8);
      doc.setTextColor('#666666');
      doc.text(
        `Report generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`,
        margin,
        pageHeight - 10
      );
      
      // Add company info in footer
      doc.text(
        'Security System - Professional Monitoring Services',
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      
      // Either return the PDF as a Blob or save it
      if (forPreview) {
        return doc.output('blob');
      } else {
        const blob = doc.output('blob');
        setPdfBlob(blob);
        return blob;
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      if (!forPreview) {
        toast({
          title: 'Error',
          description: 'Failed to generate PDF report',
          variant: 'destructive'
        });
      }
      return null;
    } finally {
      if (!forPreview) {
        setIsGenerating(false);
      }
    }
  };
  
  // Handle download PDF
  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      
      // If we already have a PDF blob, use it; otherwise generate a new one
      const blob = pdfBlob || await generatePDF();
      
      if (blob) {
        // Create a download link and trigger download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${clientName.replace(/\s+/g, '-')}-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Success',
          description: 'PDF report downloaded successfully',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to download PDF report',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle send PDF
  const handleSendPDF = async () => {
    if (!onSend) {
      toast({
        title: 'Error',
        description: 'Send function not provided',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // If we already have a PDF blob, use it; otherwise generate a new one
      const blob = pdfBlob || await generatePDF();
      
      if (blob) {
        await onSend(blob);
        
        toast({
          title: 'Success',
          description: 'PDF report sent successfully',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error sending PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to send PDF report',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Toggle PDF preview
  const handleTogglePreview = async () => {
    if (!showPreview) {
      setShowPreview(true);
      
      // Give time for the component to render before generating preview
      setTimeout(async () => {
        const blob = await generatePDF(true);
        if (blob) {
          setPdfBlob(blob);
        }
      }, 100);
    } else {
      setShowPreview(false);
    }
  };
  
  // Create a PDF preview component that resembles the actual PDF
  const renderPDFPreview = () => {
    return (
      <PreviewContainer>
        <PreviewTitle>
          <FilePdf size={20} />
          PDF Preview
        </PreviewTitle>
        
        <PDFPreview ref={previewRef}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            {leftLogo && (
              <div style={{ width: '80px', height: '50px' }}>
                <img src={leftLogo} alt="Left logo" style={{ maxWidth: '100%', maxHeight: '100%' }} />
              </div>
            )}
            
            <div style={{ textAlign: 'center', flex: 1 }}>
              <h1 style={{ color: themeSettings.primaryColor || '#0070f3', fontSize: '24px', margin: '0 0 5px' }}>
                {reportTitle}
              </h1>
              <div style={{ fontSize: '14px' }}>
                {clientName} - {formattedDateRange}
              </div>
            </div>
            
            {rightLogo && (
              <div style={{ width: '80px', height: '50px' }}>
                <img src={rightLogo} alt="Right logo" style={{ maxWidth: '100%', maxHeight: '100%' }} />
              </div>
            )}
          </div>
          
          {/* Line separator */}
          <div style={{ 
            height: '2px', 
            backgroundColor: themeSettings.primaryColor || '#0070f3', 
            margin: '0 0 20px' 
          }} />
          
          {/* Property data */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ color: themeSettings.primaryColor || '#0070f3', fontSize: '18px', marginBottom: '10px' }}>
              Security Metrics Summary
            </h2>
            
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '12px'
            }}>
              <thead>
                <tr style={{ backgroundColor: themeSettings.primaryColor || '#0070f3', color: 'white' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Metric</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {propertyData.map((item, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.type}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Chart */}
          {chartImageURL && (
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ color: themeSettings.primaryColor || '#0070f3', fontSize: '18px', marginBottom: '10px' }}>
                Security Activity Visualization
              </h2>
              
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={chartImageURL} 
                  alt="Security activity chart" 
                  style={{ maxWidth: '100%', height: 'auto', maxHeight: '200px' }} 
                />
              </div>
            </div>
          )}
          
          {/* Daily reports */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ color: themeSettings.primaryColor || '#0070f3', fontSize: '18px', marginBottom: '10px' }}>
              Daily Security Reports
            </h2>
            
            {dailyReports.slice(0, 2).map((report, index) => (
              <div key={index} style={{ marginBottom: '15px' }}>
                <h3 style={{ 
                  color: themeSettings.primaryColor || '#0070f3', 
                  fontSize: '14px', 
                  marginBottom: '5px' 
                }}>
                  {report.day} ({report.securityCode || 'Code 4'})
                </h3>
                <p style={{ fontSize: '12px', margin: '0', lineHeight: '1.5' }}>
                  {report.content && report.content.length > 150 
                    ? `${report.content.substring(0, 150)}...` 
                    : report.content}
                </p>
              </div>
            ))}
            
            {dailyReports.length > 2 && (
              <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#666' }}>
                + {dailyReports.length - 2} more daily reports in full PDF
              </div>
            )}
          </div>
          
          {/* Page break indicator */}
          <PageBreak />
          
          {/* Second page preview */}
          <div style={{ marginTop: '20px' }}>
            <h2 style={{ color: themeSettings.primaryColor || '#0070f3', fontSize: '18px', marginBottom: '10px' }}>
              Additional Notes & Compliance
            </h2>
            
            <p style={{ fontSize: '12px', margin: '0 0 15px', lineHeight: '1.5' }}>
              {summaryNotes && summaryNotes.length > 200 
                ? `${summaryNotes.substring(0, 200)}...` 
                : summaryNotes}
            </p>
            
            {/* Video links preview */}
            {videoLinks.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h2 style={{ color: themeSettings.primaryColor || '#0070f3', fontSize: '18px', marginBottom: '10px' }}>
                  Secure Video Evidence
                </h2>
                
                <p style={{ fontSize: '12px', margin: '0 0 15px' }}>
                  Scan QR codes to view secure videos. Links expire for security reasons.
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                  {videoLinks.slice(0, 2).map((video, index) => (
                    <div key={index} style={{ width: '45%' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                        {video.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                        Expires: {format(video.expiryDate, 'MMM d, yyyy h:mm a')}
                      </div>
                      <QRCodePlaceholder>QR Code</QRCodePlaceholder>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Signature */}
            {signature && (
              <div style={{ marginTop: '40px', fontSize: '12px' }}>
                <span>Security Operations Manager: </span>
                <span style={{ fontWeight: 'bold', borderBottom: '1px solid #666', paddingBottom: '2px' }}>
                  {signature}
                </span>
                <div style={{ marginTop: '5px' }}>
                  Date: {format(new Date(), 'MMMM d, yyyy')}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div style={{ 
            position: 'absolute', 
            bottom: '20px', 
            left: '0', 
            right: '0',
            fontSize: '10px',
            color: '#666',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <div>Report generated: {format(new Date(), 'MMM d, yyyy h:mm a')}</div>
            <div>Security System - Professional Monitoring Services</div>
          </div>
          
          <PageCounter>Page 1 of 2</PageCounter>
        </PDFPreview>
        
        <ButtonContainer>
          <Button onClick={handleTogglePreview} variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Close Preview
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          {onSend && (
            <Button onClick={handleSendPDF}>
              <Send className="mr-2 h-4 w-4" />
              Send Report
            </Button>
          )}
        </ButtonContainer>
      </PreviewContainer>
    );
  };
  
  return (
    <div>
      {!showPreview ? (
        <ButtonContainer>
          <Button onClick={handleTogglePreview} variant="outline" disabled={isGenerating}>
            <Eye className="mr-2 h-4 w-4" />
            Preview PDF
          </Button>
          
          <Button onClick={handleDownloadPDF} disabled={isGenerating}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          
          {onSend && (
            <Button onClick={handleSendPDF} disabled={isGenerating}>
              <Send className="mr-2 h-4 w-4" />
              Send Report
            </Button>
          )}
          
          {isGenerating && (
            <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '10px', color: '#666' }}>
              Generating PDF...
            </span>
          )}
        </ButtonContainer>
      ) : (
        renderPDFPreview()
      )}
    </div>
  );
};

export default EnhancedPDFGenerator;