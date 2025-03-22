// File: frontend/src/components/Reports/FileUploadPanel.tsx

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

// Styled components
const UploadContainer = styled.div`
  margin-top: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
`;

// Using $isDragActive instead of isDragActive to prevent the prop from leaking to the DOM
const DropZone = styled.div<{ $isDragActive: boolean }>`
  padding: 2rem;
  border: 2px dashed ${props => props.$isDragActive ? '#0070f3' : '#e0e0e0'};
  background-color: ${props => props.$isDragActive ? '#f0f7ff' : '#f5f5f5'};
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1.5rem;
  
  &:hover {
    border-color: #0070f3;
    background-color: #f0f7ff;
  }
`;

const UploadIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #0070f3;
`;

const UploadText = styled.div`
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const UploadSubtext = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const FilesList = styled.div`
  margin-top: 1.5rem;
`;

const FileItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: white;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
`;

const FileTypeIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-right: 1rem;
  font-size: 1.25rem;
`;

const FileDetails = styled.div``;

const FileName = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const FileSize = styled.div`
  font-size: 0.75rem;
  color: #666;
`;

const FileActions = styled.div``;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #0070f3;
  cursor: pointer;
  margin-left: 0.5rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ProgressContainer = styled.div`
  height: 4px;
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 2px;
  margin-top: 0.5rem;
`;

const ProgressBar = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${props => `${props.$progress}%`};
  background-color: #0070f3;
  border-radius: 2px;
  transition: width 0.2s ease;
`;

const UploadLimits = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #666;
`;

const UploadWarning = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fff9c4;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #f57f17;
`;

interface File {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  progress?: number;
  status: 'uploading' | 'success' | 'error';
}

interface FileUploadPanelProps {
  onFileUploaded: (fileUrl: string, fileName: string, fileType: string) => void;
  autoDeleteDays?: number;
}

const FileUploadPanel: React.FC<FileUploadPanelProps> = ({
  onFileUploaded,
  autoDeleteDays = 30
}) => {
  const [files, setFiles] = useState<File[]>([]);
  
  // File size formatter
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Get file type icon
  const getFileTypeIcon = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    if (type === 'application/pdf') return '📄';
    return '📁';
  };
  
  // Handle file upload
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    
    // Find the original File object from the dropped files
    const fileBlob = files.find(f => f.id === file.id);
    if (!fileBlob) return;
    
    formData.append('file', fileBlob as any);
    
    try {
      // In a real implementation, this would be your API endpoint
      // const response = await axios.post('/api/upload', formData, {
      //   onUploadProgress: (progressEvent) => {
      //     const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
      //     updateFileProgress(file.id, percentCompleted);
      //   }
      // });
      
      // Simulate upload progress for development
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        updateFileProgress(file.id, progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // Simulate successful upload
          const fileUrl = `https://example.com/uploads/${file.name}`;
          
          setFiles(prevFiles => 
            prevFiles.map(f => 
              f.id === file.id 
                ? { ...f, status: 'success', url: fileUrl, progress: 100 } 
                : f
            )
          );
          
          // Notify parent component
          onFileUploaded(fileUrl, file.name, file.type);
        }
      }, 300);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === file.id 
            ? { ...f, status: 'error' } 
            : f
        )
      );
    }
  };
  
  // Update file progress
  const updateFileProgress = (fileId: string, progress: number) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === fileId 
          ? { ...file, progress } 
          : file
      )
    );
  };
  
  // Handle file drop
  const onDrop = useCallback((acceptedFiles: any[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // Start uploading each file
    newFiles.forEach(file => {
      uploadFile(file);
    });
  }, []);
  
  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': []
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 5
  });
  
  // Remove file
  const handleRemoveFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };
  
  // Retry upload
  const handleRetryUpload = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      uploadFile(file);
    }
  };
  
  // View file
  const handleViewFile = (fileUrl?: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };
  
  return (
    <UploadContainer>
      <SectionTitle>File Attachments</SectionTitle>
      
      <DropZone {...getRootProps()} $isDragActive={isDragActive}>
        <input {...getInputProps()} />
        <UploadIcon>{isDragActive ? '📂' : '📁'}</UploadIcon>
        <UploadText>
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag & drop files here, or click to select files'}
        </UploadText>
        <UploadSubtext>
          Supported formats: Images (JPG, PNG, GIF), Videos (MP4, MOV)
        </UploadSubtext>
      </DropZone>
      
      <UploadLimits>
        <strong>Upload Limits:</strong> Maximum 5 files, 100MB per file. Files will be automatically deleted after {autoDeleteDays} days.
      </UploadLimits>
      
      {files.length > 0 && (
        <FilesList>
          {files.map((file) => (
            <FileItem key={file.id}>
              <FileInfo>
                <FileTypeIcon>{getFileTypeIcon(file.type)}</FileTypeIcon>
                <FileDetails>
                  <FileName>{file.name}</FileName>
                  <FileSize>{formatFileSize(file.size)}</FileSize>
                  {file.status === 'uploading' && (
                    <ProgressContainer>
                      <ProgressBar $progress={file.progress || 0} />
                    </ProgressContainer>
                  )}
                </FileDetails>
              </FileInfo>
              <FileActions>
                {file.status === 'success' && (
                  <ActionButton onClick={() => handleViewFile(file.url)}>
                    View
                  </ActionButton>
                )}
                {file.status === 'error' && (
                  <ActionButton onClick={() => handleRetryUpload(file.id)}>
                    Retry
                  </ActionButton>
                )}
                <ActionButton onClick={() => handleRemoveFile(file.id)}>
                  Remove
                </ActionButton>
              </FileActions>
            </FileItem>
          ))}
        </FilesList>
      )}
      
      <UploadWarning>
        <strong>Note:</strong> Uploaded files will be publicly accessible. Do not upload sensitive personal information or confidential data.
      </UploadWarning>
    </UploadContainer>
  );
};

export default FileUploadPanel;