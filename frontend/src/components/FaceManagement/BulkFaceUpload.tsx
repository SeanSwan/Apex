/**
 * APEX AI BULK FACE UPLOAD COMPONENT
 * ==================================
 * Bulk face enrollment with batch processing capabilities
 * 
 * Features:
 * - Multiple file upload with drag & drop
 * - CSV metadata import
 * - Batch processing with progress tracking
 * - Error handling and retry mechanisms
 * - Preview and validation
 * - Success/failure reporting
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import {
  Upload,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  X,
  Play,
  Pause,
  RotateCcw,
  Download,
  Eye,
  Trash2,
  Plus,
  Loader,
  Image,
  AlertTriangle,
  Clock,
  Target
} from 'lucide-react';

// Styled Components
const BulkUploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 1rem;
  
  h2 {
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }
  
  p {
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    font-size: 0.9rem;
  }
`;

const UploadMethodTabs = styled.div`
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.25rem;
  margin-bottom: 2rem;
`;

const UploadTab = styled.button`
  flex: 1;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    color: white;
  }
  
  &.active {
    background: #4ade80;
    color: white;
  }
`;

const UploadSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.15);
  }
  
  &.dragover {
    border-color: #4ade80;
    background: rgba(74, 222, 128, 0.1);
  }
  
  &.has-files {
    border-style: solid;
    border-color: #4ade80;
    background: rgba(74, 222, 128, 0.1);
  }
`;

const UploadIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  
  svg {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const UploadText = styled.div`
  color: white;
  
  .primary {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  .secondary {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
  }
`;

const HiddenInput = styled.input`
  position: absolute;
  left: -9999px;
  opacity: 0;
`;

const FilesList = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 2rem;
`;

const FilesHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 1rem;
  
  h3 {
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const FilesActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.primary {
    background: #4ade80;
    border-color: #4ade80;
    
    &:hover:not(:disabled) {
      background: #22c55e;
    }
  }
  
  &.danger {
    color: #ef4444;
    border-color: #ef4444;
    
    &:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.1);
    }
  }
`;

const FileItem = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto auto auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &.processing {
    border-left: 4px solid #3b82f6;
  }
  
  &.success {
    border-left: 4px solid #4ade80;
  }
  
  &.error {
    border-left: 4px solid #ef4444;
  }
`;

const FilePreview = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 6px;
  }
  
  .placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const FileInfo = styled.div`
  min-width: 0;
  
  .file-name {
    color: white;
    font-weight: 500;
    margin-bottom: 0.25rem;
    word-break: break-word;
  }
  
  .file-meta {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8rem;
    display: flex;
    gap: 1rem;
  }
`;

const FileStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .status-icon {
    &.processing {
      color: #3b82f6;
      animation: spin 1s linear infinite;
    }
    
    &.success {
      color: #4ade80;
    }
    
    &.error {
      color: #ef4444;
    }
    
    &.pending {
      color: rgba(255, 255, 255, 0.5);
    }
  }
  
  .status-text {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.8rem;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const FileActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const FileAction = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  padding: 0.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &.danger {
    color: #ef4444;
    border-color: #ef4444;
    
    &:hover {
      background: rgba(239, 68, 68, 0.1);
    }
  }
`;

const ProgressSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 2rem;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ProgressTitle = styled.h3`
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

const ProgressStats = styled.div`
  display: flex;
  gap: 2rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(to right, #3b82f6, #4ade80);
    transition: width 0.3s ease;
  }
`;

const ResultsSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const ResultCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  
  .result-icon {
    margin-bottom: 0.5rem;
    
    &.success { color: #4ade80; }
    &.error { color: #ef4444; }
    &.pending { color: #f59e0b; }
  }
  
  .result-value {
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .result-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
  }
`;

// Interface
export interface BulkFaceUploadProps {
  onSuccess?: (results: any) => void;
  className?: string;
}

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  department?: string;
  access_level?: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  result?: any;
}

const BulkFaceUpload: React.FC<BulkFaceUploadProps> = ({ onSuccess, className }) => {
  const [uploadMethod, setUploadMethod] = useState<'files' | 'csv'>('files');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  // Calculate statistics
  const stats = useMemo(() => {
    const total = files.length;
    const processed = files.filter(f => f.status === 'success' || f.status === 'error').length;
    const successful = files.filter(f => f.status === 'success').length;
    const failed = files.filter(f => f.status === 'error').length;
    const pending = files.filter(f => f.status === 'pending').length;
    const processing = files.filter(f => f.status === 'processing').length;
    
    return { total, processed, successful, failed, pending, processing };
  }, [files]);
  
  // Generate unique ID
  const generateId = useCallback(() => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }, []);
  
  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    const newFiles: UploadFile[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Only allow image files
      if (!file.type.startsWith('image/')) continue;
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) continue;
      
      const id = generateId();
      const preview = URL.createObjectURL(file);
      
      // Extract name from filename (remove extension)
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const cleanName = nameWithoutExt.replace(/[_-]/g, ' ').trim();
      
      newFiles.push({
        id,
        file,
        preview,
        name: cleanName,
        status: 'pending'
      });
    }
    
    setFiles(prev => [...prev, ...newFiles]);
  }, [generateId]);
  
  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const fileList = new DataTransfer();
      droppedFiles.forEach(file => fileList.items.add(file));
      handleFileSelect(fileList.files);
    }
  }, [handleFileSelect]);
  
  // File input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(selectedFiles);
    }
  }, [handleFileSelect]);
  
  // Update file metadata
  const updateFile = useCallback((id: string, updates: Partial<UploadFile>) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));
  }, []);
  
  // Remove file
  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);
  
  // Clear all files
  const clearAllFiles = useCallback(() => {
    files.forEach(file => {
      URL.revokeObjectURL(file.preview);
    });
    setFiles([]);
    setCurrentIndex(0);
  }, [files]);
  
  // Process single file
  const processFile = useCallback(async (uploadFile: UploadFile) => {
    updateFile(uploadFile.id, { status: 'processing' });
    
    try {
      const formData = new FormData();
      formData.append('image', uploadFile.file);
      formData.append('name', uploadFile.name);
      
      if (uploadFile.department) formData.append('department', uploadFile.department);
      if (uploadFile.access_level) formData.append('access_level', uploadFile.access_level);
      
      const response = await fetch('/api/face/enroll', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        updateFile(uploadFile.id, { 
          status: 'success', 
          result: result.data 
        });
      } else {
        updateFile(uploadFile.id, { 
          status: 'error', 
          error: result.error || 'Upload failed'
        });
      }
      
    } catch (error) {
      updateFile(uploadFile.id, { 
        status: 'error', 
        error: error.message || 'Network error'
      });
    }
  }, [updateFile]);
  
  // Start batch processing
  const startProcessing = useCallback(async () => {
    setIsProcessing(true);
    setIsPaused(false);
    
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    for (let i = 0; i < pendingFiles.length; i++) {
      if (isPaused) break;
      
      setCurrentIndex(i);
      await processFile(pendingFiles[i]);
      
      // Small delay between uploads to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsProcessing(false);
    
    // Call success callback with results
    const results = {
      total: stats.total,
      successful: files.filter(f => f.status === 'success').length,
      failed: files.filter(f => f.status === 'error').length
    };
    
    onSuccess?.(results);
  }, [files, isPaused, processFile, onSuccess, stats.total]);
  
  // Pause/resume processing
  const toggleProcessing = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);
  
  // Retry failed uploads
  const retryFailed = useCallback(() => {
    setFiles(prev => prev.map(file => 
      file.status === 'error' ? { ...file, status: 'pending', error: undefined } : file
    ));
  }, []);
  
  // Handle CSV upload (simplified)
  const handleCSVUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // TODO: Implement CSV parsing and validation
    console.log('CSV upload:', file.name);
  }, []);
  
  return (
    <BulkUploadContainer className={className}>
      <Header>
        <h2>
          <Upload size={24} />
          Bulk Face Upload
        </h2>
        <p>Upload multiple face images for batch enrollment</p>
      </Header>
      
      {/* Upload Method Tabs */}
      <UploadMethodTabs>
        <UploadTab
          className={uploadMethod === 'files' ? 'active' : ''}
          onClick={() => setUploadMethod('files')}
        >
          <Image size={16} />
          Upload Images
        </UploadTab>
        <UploadTab
          className={uploadMethod === 'csv' ? 'active' : ''}
          onClick={() => setUploadMethod('csv')}
        >
          <FileText size={16} />
          CSV Import
        </UploadTab>
      </UploadMethodTabs>
      
      {uploadMethod === 'files' ? (
        <>
          {/* File Upload Section */}
          <UploadSection
            className={`${isDragOver ? 'dragover' : ''} ${files.length > 0 ? 'has-files' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <HiddenInput
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleInputChange}
            />
            
            <UploadIcon>
              <Upload size={48} />
            </UploadIcon>
            <UploadText>
              <div className="primary">
                {files.length === 0 ? 'Click to upload or drag & drop images' : `${files.length} files selected`}
              </div>
              <div className="secondary">
                Multiple JPEG, PNG, or WebP images up to 5MB each
              </div>
            </UploadText>
          </UploadSection>
          
          {/* Files List */}
          {files.length > 0 && (
            <FilesList>
              <FilesHeader>
                <h3>
                  <Image size={18} />
                  Selected Files ({files.length})
                </h3>
                <FilesActions>
                  {!isProcessing && (
                    <>
                      <ActionButton onClick={() => fileInputRef.current?.click()}>
                        <Plus size={16} />
                        Add More
                      </ActionButton>
                      <ActionButton className="danger" onClick={clearAllFiles}>
                        <Trash2 size={16} />
                        Clear All
                      </ActionButton>
                    </>
                  )}
                  {stats.failed > 0 && !isProcessing && (
                    <ActionButton onClick={retryFailed}>
                      <RotateCcw size={16} />
                      Retry Failed
                    </ActionButton>
                  )}
                  {stats.pending > 0 && !isProcessing && (
                    <ActionButton className="primary" onClick={startProcessing}>
                      <Play size={16} />
                      Start Upload
                    </ActionButton>
                  )}
                  {isProcessing && (
                    <ActionButton onClick={toggleProcessing}>
                      {isPaused ? <Play size={16} /> : <Pause size={16} />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </ActionButton>
                  )}
                </FilesActions>
              </FilesHeader>
              
              <div>
                {files.map((file) => (
                  <FileItem key={file.id} className={file.status}>
                    <FilePreview>
                      <img src={file.preview} alt={file.name} />
                    </FilePreview>
                    
                    <FileInfo>
                      <div className="file-name">{file.name}</div>
                      <div className="file-meta">
                        <span>{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span>{file.file.type}</span>
                        {file.department && <span>{file.department}</span>}
                      </div>
                    </FileInfo>
                    
                    <FileStatus>
                      {file.status === 'pending' && (
                        <>
                          <Clock size={16} className="status-icon pending" />
                          <span className="status-text">Pending</span>
                        </>
                      )}
                      {file.status === 'processing' && (
                        <>
                          <Loader size={16} className="status-icon processing" />
                          <span className="status-text">Processing...</span>
                        </>
                      )}
                      {file.status === 'success' && (
                        <>
                          <CheckCircle size={16} className="status-icon success" />
                          <span className="status-text">Success</span>
                        </>
                      )}
                      {file.status === 'error' && (
                        <>
                          <AlertCircle size={16} className="status-icon error" />
                          <span className="status-text">{file.error}</span>
                        </>
                      )}
                    </FileStatus>
                    
                    <FileActions>
                      <FileAction>
                        <Eye size={14} />
                      </FileAction>
                      <FileAction 
                        className="danger"
                        onClick={() => removeFile(file.id)}
                        disabled={isProcessing}
                      >
                        <X size={14} />
                      </FileAction>
                    </FileActions>
                  </FileItem>
                ))}
              </div>
            </FilesList>
          )}
          
          {/* Progress Section */}
          {(isProcessing || stats.processed > 0) && (
            <ProgressSection>
              <ProgressHeader>
                <ProgressTitle>Upload Progress</ProgressTitle>
                <ProgressStats>
                  <span>Processed: {stats.processed}/{stats.total}</span>
                  <span>Success: {stats.successful}</span>
                  <span>Failed: {stats.failed}</span>
                </ProgressStats>
              </ProgressHeader>
              
              <ProgressBar>
                <div 
                  className="progress-fill"
                  style={{ width: `${stats.total > 0 ? (stats.processed / stats.total) * 100 : 0}%` }}
                />
              </ProgressBar>
              
              <ResultsSummary>
                <ResultCard>
                  <div className="result-icon success">
                    <CheckCircle size={24} />
                  </div>
                  <div className="result-value">{stats.successful}</div>
                  <div className="result-label">Successful</div>
                </ResultCard>
                
                <ResultCard>
                  <div className="result-icon error">
                    <AlertCircle size={24} />
                  </div>
                  <div className="result-value">{stats.failed}</div>
                  <div className="result-label">Failed</div>
                </ResultCard>
                
                <ResultCard>
                  <div className="result-icon pending">
                    <Clock size={24} />
                  </div>
                  <div className="result-value">{stats.pending}</div>
                  <div className="result-label">Pending</div>
                </ResultCard>
                
                <ResultCard>
                  <div className="result-icon">
                    <Target size={24} />
                  </div>
                  <div className="result-value">
                    {stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="result-label">Success Rate</div>
                </ResultCard>
              </ResultsSummary>
            </ProgressSection>
          )}
        </>
      ) : (
        /* CSV Import Section */
        <UploadSection onClick={() => csvInputRef.current?.click()}>
          <HiddenInput
            ref={csvInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
          />
          
          <UploadIcon>
            <FileText size={48} />
          </UploadIcon>
          <UploadText>
            <div className="primary">Upload CSV file with face data</div>
            <div className="secondary">
              CSV should contain columns: name, image_path, department, access_level
            </div>
          </UploadText>
        </UploadSection>
      )}
    </BulkUploadContainer>
  );
};

export default BulkFaceUpload;
