// BulkPropertyOperations.tsx
/**
 * BULK PROPERTY OPERATIONS COMPONENT
 * ==================================
 * Comprehensive bulk operations for property management:
 * - CSV/Excel import with validation and error handling
 * - Bulk export with filtering and format options
 * - Bulk editing for multiple properties
 * - Template generation and download
 * - Progress tracking and error reporting
 */

import React, { useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Edit, 
  Save,
  RotateCcw,
  Filter,
  Table,
  FileSpreadsheet,
  Database,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';

// Types
interface BulkOperation {
  id: string;
  type: 'import' | 'export' | 'bulk_edit';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  fileName?: string;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  errors: BulkError[];
  startedAt: string;
  completedAt?: string;
  progress: number;
}

interface BulkError {
  row: number;
  field: string;
  value: string;
  error: string;
  severity: 'error' | 'warning';
}

interface ImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  columns: string[];
  sample: Record<string, any>[];
  errors: BulkError[];
}

interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  includeImages: boolean;
  includeMetadata: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: {
    status?: string;
    propertyType?: string;
    clientId?: string;
  };
}

interface BulkEditOptions {
  propertyIds: string[];
  updates: {
    status?: string;
    securityLevel?: string;
    timezone?: string;
    [key: string]: any;
  };
}

interface BulkPropertyOperationsProps {
  isOpen: boolean;
  onClose: () => void;
  onOperationComplete?: (operation: BulkOperation) => void;
  properties?: any[];
}

// Styled Components
const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ModalContainer = styled.div`
  background: rgba(20, 20, 20, 0.95);
  border-radius: 16px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  max-width: 1000px;
  width: 100%;
  max-height: 95vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(20px);
`;

const ModalHeader = styled.div`
  padding: 2rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    margin: 0;
    color: #FFD700;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.5rem;
  }
  
  .close-button {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #FFD700;
    }
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
`;

const OperationTabs = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 1rem 1.5rem;
  background: ${props => props.$active ? 'rgba(255, 215, 0, 0.1)' : 'transparent'};
  border: none;
  border-bottom: 2px solid ${props => props.$active ? '#FFD700' : 'transparent'};
  color: ${props => props.$active ? '#FFD700' : '#B0B0B0'};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  
  &:hover {
    color: #FFD700;
    background: rgba(255, 215, 0, 0.05);
  }
`;

const OperationPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const SectionCard = styled.div`
  background: rgba(30, 30, 30, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  padding: 1.5rem;
  
  h3 {
    margin: 0 0 1rem 0;
    color: #FFD700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
  }
`;

const FileUploadArea = styled.div<{ $isDragOver: boolean }>`
  border: 2px dashed ${props => props.$isDragOver ? '#FFD700' : 'rgba(255, 215, 0, 0.3)'};
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  background: ${props => props.$isDragOver ? 'rgba(255, 215, 0, 0.1)' : 'rgba(40, 40, 40, 0.3)'};
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    border-color: rgba(255, 215, 0, 0.6);
    background: rgba(40, 40, 40, 0.5);
  }
  
  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    
    .upload-icon {
      padding: 1.5rem;
      background: rgba(255, 215, 0, 0.1);
      border-radius: 50%;
      color: #FFD700;
    }
    
    .upload-text {
      color: #E0E0E0;
      font-size: 1.1rem;
      
      .highlight {
        color: #FFD700;
        font-weight: 600;
      }
    }
    
    .upload-hint {
      color: #B0B0B0;
      font-size: 0.9rem;
      line-height: 1.4;
    }
  }
  
  input[type="file"] {
    display: none;
  }
`;

const PreviewTable = styled.div`
  background: rgba(20, 20, 20, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  overflow: hidden;
  
  .table-header {
    padding: 1rem;
    background: rgba(255, 215, 0, 0.1);
    border-bottom: 1px solid rgba(255, 215, 0, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h4 {
      margin: 0;
      color: #FFD700;
    }
    
    .table-actions {
      display: flex;
      gap: 0.5rem;
    }
  }
  
  .table-content {
    max-height: 300px;
    overflow: auto;
    
    table {
      width: 100%;
      border-collapse: collapse;
      
      th, td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 0.9rem;
      }
      
      th {
        background: rgba(40, 40, 40, 0.5);
        color: #FFD700;
        font-weight: 600;
        position: sticky;
        top: 0;
        z-index: 1;
      }
      
      td {
        color: #E0E0E0;
        
        &.error {
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
        }
        
        &.warning {
          background: rgba(245, 158, 11, 0.1);
          color: #F59E0B;
        }
      }
    }
  }
`;

const ProgressBar = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  height: 8px;
  overflow: hidden;
  margin: 1rem 0;
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #FFD700, #FFA500);
    transition: width 0.3s ease;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      animation: shimmer 2s infinite;
    }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

const OperationStatus = styled.div<{ $status: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: ${props => {
    switch(props.$status) {
      case 'completed': return 'rgba(34, 197, 94, 0.1)';
      case 'failed': return 'rgba(239, 68, 68, 0.1)';
      case 'processing': return 'rgba(59, 130, 246, 0.1)';
      default: return 'rgba(245, 158, 11, 0.1)';
    }
  }};
  border-radius: 8px;
  border: 1px solid ${props => {
    switch(props.$status) {
      case 'completed': return 'rgba(34, 197, 94, 0.3)';
      case 'failed': return 'rgba(239, 68, 68, 0.3)';
      case 'processing': return 'rgba(59, 130, 246, 0.3)';
      default: return 'rgba(245, 158, 11, 0.3)';
    }
  }};
  color: ${props => {
    switch(props.$status) {
      case 'completed': return '#22C55E';
      case 'failed': return '#EF4444';
      case 'processing': return '#3B82F6';
      default: return '#F59E0B';
    }
  }};
`;

const ErrorList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  background: rgba(20, 20, 20, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  
  .error-item {
    padding: 0.75rem;
    border-bottom: 1px solid rgba(239, 68, 68, 0.1);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    
    &:last-child {
      border-bottom: none;
    }
    
    .error-icon {
      color: #EF4444;
    }
    
    .error-text {
      color: #E0E0E0;
      
      .error-field {
        color: #FFD700;
        font-weight: 500;
      }
      
      .error-message {
        color: #EF4444;
      }
    }
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    
    label {
      color: #FFD700;
      font-size: 0.9rem;
      font-weight: 500;
    }
    
    input, select {
      padding: 0.75rem;
      background: rgba(40, 40, 40, 0.9);
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 8px;
      color: #E0E0E0;
      font-size: 0.9rem;
      
      &:focus {
        outline: none;
        border-color: #FFD700;
        box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
      }
    }
    
    &.full-width {
      grid-column: 1 / -1;
    }
  }
`;

// Main Component
const BulkPropertyOperations: React.FC<BulkPropertyOperationsProps> = ({
  isOpen,
  onClose,
  onOperationComplete,
  properties = []
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'edit'>('import');
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<BulkOperation | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeImages: false,
    includeMetadata: true
  });
  const [bulkEditOptions, setBulkEditOptions] = useState<BulkEditOptions>({
    propertyIds: [],
    updates: {}
  });

  // File upload handlers
  const handleFileUpload = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (!file.name.match(/\.(csv|xlsx)$/i)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file.",
        variant: "destructive"
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Preview the import
      const response = await fetch('/api/internal/v1/properties/preview-import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const preview = await response.json();
        setImportPreview(preview.data);
        
        toast({
          title: "File Processed",
          description: `Found ${preview.data.totalRows} rows. ${preview.data.validRows} valid, ${preview.data.invalidRows} with errors.`,
          variant: "default"
        });
      } else {
        throw new Error('Failed to process file');
      }
    } catch (error) {
      console.error('Import preview error:', error);
      toast({
        title: "Preview Failed",
        description: "Unable to preview import file. Please check the format.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files?.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length > 0) {
      handleFileUpload(e.target.files);
    }
  }, [handleFileUpload]);

  // Import operations
  const handleImport = useCallback(async () => {
    if (!importPreview) return;

    const operation: BulkOperation = {
      id: `import_${Date.now()}`,
      type: 'import',
      status: 'processing',
      totalRecords: importPreview.validRows,
      processedRecords: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      startedAt: new Date().toISOString(),
      progress: 0
    };

    setCurrentOperation(operation);

    try {
      const formData = new FormData();
      const fileInput = fileInputRef.current;
      if (fileInput?.files?.[0]) {
        formData.append('file', fileInput.files[0]);
      }

      const response = await fetch('/api/internal/v1/properties/bulk-import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        
        const completedOperation: BulkOperation = {
          ...operation,
          status: 'completed',
          processedRecords: result.data.successful + result.data.failed,
          successCount: result.data.successful,
          errorCount: result.data.failed,
          errors: result.data.errors || [],
          completedAt: new Date().toISOString(),
          progress: 100
        };

        setCurrentOperation(completedOperation);
        onOperationComplete?.(completedOperation);

        toast({
          title: "Import Completed",
          description: `${result.data.successful} properties imported successfully. ${result.data.failed} failed.`,
          variant: result.data.failed > 0 ? "destructive" : "default"
        });
      } else {
        throw new Error('Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      
      const failedOperation: BulkOperation = {
        ...operation,
        status: 'failed',
        completedAt: new Date().toISOString()
      };
      
      setCurrentOperation(failedOperation);
      
      toast({
        title: "Import Failed",
        description: "Unable to complete import. Please try again.",
        variant: "destructive"
      });
    }
  }, [importPreview, onOperationComplete, toast]);

  // Export operations
  const handleExport = useCallback(async () => {
    const operation: BulkOperation = {
      id: `export_${Date.now()}`,
      type: 'export',
      status: 'processing',
      totalRecords: properties.length,
      processedRecords: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      startedAt: new Date().toISOString(),
      progress: 0
    };

    setCurrentOperation(operation);

    try {
      const queryParams = new URLSearchParams({
        format: exportOptions.format,
        includeImages: exportOptions.includeImages.toString(),
        includeMetadata: exportOptions.includeMetadata.toString(),
        ...exportOptions.filters
      });

      const response = await fetch(`/api/internal/v1/properties/export?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `properties_export_${Date.now()}.${exportOptions.format}`;
        link.click();
        window.URL.revokeObjectURL(url);

        const completedOperation: BulkOperation = {
          ...operation,
          status: 'completed',
          processedRecords: properties.length,
          successCount: properties.length,
          completedAt: new Date().toISOString(),
          progress: 100
        };

        setCurrentOperation(completedOperation);
        onOperationComplete?.(completedOperation);

        toast({
          title: "Export Completed",
          description: `${properties.length} properties exported successfully.`,
          variant: "default"
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      
      const failedOperation: BulkOperation = {
        ...operation,
        status: 'failed',
        completedAt: new Date().toISOString()
      };
      
      setCurrentOperation(failedOperation);
      
      toast({
        title: "Export Failed",
        description: "Unable to complete export. Please try again.",
        variant: "destructive"
      });
    }
  }, [exportOptions, properties.length, onOperationComplete, toast]);

  // Template download
  const handleDownloadTemplate = useCallback(() => {
    const template = [
      'name,address,city,state,zipCode,country,propertyType,clientId,timezone',
      'Sample Property,123 Main St,New York,NY,10001,United States,luxury_apartment,client_001,America/New_York',
      'Another Property,456 Oak Ave,Los Angeles,CA,90210,United States,commercial,client_002,America/Los_Angeles'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'property_import_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Import template has been downloaded to your computer.",
      variant: "default"
    });
  }, [toast]);

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen}>
      <ModalContainer>
        <ModalHeader>
          <h2>
            <Database size={24} />
            Bulk Property Operations
          </h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </ModalHeader>
        
        <ModalBody>
          {/* Operation Tabs */}
          <OperationTabs>
            <TabButton
              $active={activeTab === 'import'}
              onClick={() => setActiveTab('import')}
            >
              <Upload size={16} />
              Import Properties
            </TabButton>
            <TabButton
              $active={activeTab === 'export'}
              onClick={() => setActiveTab('export')}
            >
              <Download size={16} />
              Export Properties
            </TabButton>
            <TabButton
              $active={activeTab === 'edit'}
              onClick={() => setActiveTab('edit')}
            >
              <Edit size={16} />
              Bulk Edit
            </TabButton>
          </OperationTabs>

          {/* Import Tab */}
          {activeTab === 'import' && (
            <OperationPanel>
              <SectionCard>
                <h3>
                  <FileText size={18} />
                  Import Properties from File
                </h3>
                
                <FileUploadArea
                  $isDragOver={isDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="upload-content">
                    <div className="upload-icon">
                      <Upload size={32} />
                    </div>
                    <div className="upload-text">
                      <span className="highlight">Click to upload</span> or drag and drop
                    </div>
                    <div className="upload-hint">
                      Supports CSV and Excel files (.csv, .xlsx)<br />
                      Maximum file size: 10MB
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileInputChange}
                  />
                </FileUploadArea>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <Button variant="outline" onClick={handleDownloadTemplate}>
                    <Download size={16} />
                    Download Template
                  </Button>
                </div>
              </SectionCard>

              {/* Import Preview */}
              {importPreview && (
                <SectionCard>
                  <h3>
                    <Table size={18} />
                    Import Preview
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                    <div>
                      <strong style={{ color: '#FFD700' }}>Total Rows:</strong> {importPreview.totalRows}
                    </div>
                    <div>
                      <strong style={{ color: '#22C55E' }}>Valid:</strong> {importPreview.validRows}
                    </div>
                    <div>
                      <strong style={{ color: '#EF4444' }}>Invalid:</strong> {importPreview.invalidRows}
                    </div>
                  </div>

                  <PreviewTable>
                    <div className="table-header">
                      <h4>Sample Data</h4>
                    </div>
                    <div className="table-content">
                      <table>
                        <thead>
                          <tr>
                            {importPreview.columns.map(col => (
                              <th key={col}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.sample.map((row, idx) => (
                            <tr key={idx}>
                              {importPreview.columns.map(col => (
                                <td 
                                  key={col}
                                  className={
                                    importPreview.errors.some(e => e.row === idx && e.field === col) 
                                      ? 'error' 
                                      : ''
                                  }
                                >
                                  {row[col]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </PreviewTable>

                  {importPreview.errors.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <h4 style={{ color: '#EF4444', marginBottom: '0.5rem' }}>
                        Validation Errors ({importPreview.errors.length})
                      </h4>
                      <ErrorList>
                        {importPreview.errors.slice(0, 10).map((error, idx) => (
                          <div key={idx} className="error-item">
                            <AlertTriangle className="error-icon" size={16} />
                            <div className="error-text">
                              Row {error.row + 1}, field <span className="error-field">{error.field}</span>: 
                              <span className="error-message"> {error.error}</span>
                            </div>
                          </div>
                        ))}
                        {importPreview.errors.length > 10 && (
                          <div style={{ padding: '0.75rem', color: '#B0B0B0', textAlign: 'center' }}>
                            ...and {importPreview.errors.length - 10} more errors
                          </div>
                        )}
                      </ErrorList>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outline"
                      onClick={() => setImportPreview(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={importPreview.validRows === 0 || currentOperation?.status === 'processing'}
                    >
                      <Play size={16} />
                      Import {importPreview.validRows} Properties
                    </Button>
                  </div>
                </SectionCard>
              )}
            </OperationPanel>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <OperationPanel>
              <SectionCard>
                <h3>
                  <FileSpreadsheet size={18} />
                  Export Options
                </h3>
                
                <FormGrid>
                  <div className="form-group">
                    <label>Export Format</label>
                    <select
                      value={exportOptions.format}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        format: e.target.value as 'csv' | 'excel' | 'json'
                      }))}
                    >
                      <option value="csv">CSV File</option>
                      <option value="excel">Excel File</option>
                      <option value="json">JSON File</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Property Status Filter</label>
                    <select
                      value={exportOptions.filters?.status || 'all'}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        filters: { ...prev.filters, status: e.target.value === 'all' ? undefined : e.target.value }
                      }))}
                    >
                      <option value="all">All Properties</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                      <option value="maintenance">Under Maintenance</option>
                    </select>
                  </div>
                  
                  <div className="form-group full-width">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={exportOptions.includeImages}
                        onChange={(e) => setExportOptions(prev => ({ 
                          ...prev, 
                          includeImages: e.target.checked 
                        }))}
                      />
                      Include Property Images
                    </label>
                  </div>
                  
                  <div className="form-group full-width">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={exportOptions.includeMetadata}
                        onChange={(e) => setExportOptions(prev => ({ 
                          ...prev, 
                          includeMetadata: e.target.checked 
                        }))}
                      />
                      Include Metadata (creation dates, last updated, etc.)
                    </label>
                  </div>
                </FormGrid>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                  <Button
                    onClick={handleExport}
                    disabled={currentOperation?.status === 'processing'}
                  >
                    <Download size={16} />
                    Export {properties.length} Properties
                  </Button>
                </div>
              </SectionCard>
            </OperationPanel>
          )}

          {/* Bulk Edit Tab */}
          {activeTab === 'edit' && (
            <OperationPanel>
              <SectionCard>
                <h3>
                  <Settings size={18} />
                  Bulk Edit Properties
                </h3>
                
                <div style={{ marginBottom: '1rem', color: '#B0B0B0' }}>
                  Select properties and choose which fields to update. All selected properties will be updated with the same values.
                </div>

                <FormGrid>
                  <div className="form-group">
                    <label>Update Status</label>
                    <select
                      value={bulkEditOptions.updates.status || ''}
                      onChange={(e) => setBulkEditOptions(prev => ({
                        ...prev,
                        updates: { ...prev.updates, status: e.target.value || undefined }
                      }))}
                    >
                      <option value="">Don't Update</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Under Maintenance</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Update Security Level</label>
                    <select
                      value={bulkEditOptions.updates.securityLevel || ''}
                      onChange={(e) => setBulkEditOptions(prev => ({
                        ...prev,
                        updates: { ...prev.updates, securityLevel: e.target.value || undefined }
                      }))}
                    >
                      <option value="">Don't Update</option>
                      <option value="basic">Basic Security</option>
                      <option value="standard">Standard Security</option>
                      <option value="enhanced">Enhanced Security</option>
                      <option value="maximum">Maximum Security</option>
                    </select>
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Update Timezone</label>
                    <select
                      value={bulkEditOptions.updates.timezone || ''}
                      onChange={(e) => setBulkEditOptions(prev => ({
                        ...prev,
                        updates: { ...prev.updates, timezone: e.target.value || undefined }
                      }))}
                    >
                      <option value="">Don't Update</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                </FormGrid>

                <div style={{ 
                  color: '#B0B0B0', 
                  fontSize: '0.9rem', 
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <strong style={{ color: '#F59E0B' }}>Note:</strong> Bulk edit functionality will be applied to properties selected in the main property list. Make sure to select the properties you want to update before proceeding.
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outline"
                    disabled={Object.values(bulkEditOptions.updates).every(v => !v)}
                  >
                    <Edit size={16} />
                    Apply Bulk Updates
                  </Button>
                </div>
              </SectionCard>
            </OperationPanel>
          )}

          {/* Operation Progress */}
          {currentOperation && (
            <SectionCard>
              <h3>
                <RefreshCw size={18} />
                Operation Progress
              </h3>
              
              <OperationStatus $status={currentOperation.status}>
                {currentOperation.status === 'processing' && <RefreshCw size={16} className="spin" />}
                {currentOperation.status === 'completed' && <CheckCircle size={16} />}
                {currentOperation.status === 'failed' && <AlertTriangle size={16} />}
                
                <div>
                  <strong>{currentOperation.type.charAt(0).toUpperCase() + currentOperation.type.slice(1)}</strong>
                  {' - '}
                  {currentOperation.status === 'processing' && 'In Progress...'}
                  {currentOperation.status === 'completed' && 'Completed Successfully'}
                  {currentOperation.status === 'failed' && 'Failed'}
                </div>
              </OperationStatus>

              {currentOperation.status === 'processing' && (
                <ProgressBar>
                  <div 
                    className="progress-fill" 
                    style={{ width: `${currentOperation.progress}%` }}
                  />
                </ProgressBar>
              )}

              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#B0B0B0' }}>
                <div>
                  <strong>Processed:</strong> {currentOperation.processedRecords} / {currentOperation.totalRecords}
                </div>
                <div style={{ color: '#22C55E' }}>
                  <strong>Success:</strong> {currentOperation.successCount}
                </div>
                {currentOperation.errorCount > 0 && (
                  <div style={{ color: '#EF4444' }}>
                    <strong>Errors:</strong> {currentOperation.errorCount}
                  </div>
                )}
              </div>
            </SectionCard>
          )}
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default BulkPropertyOperations;