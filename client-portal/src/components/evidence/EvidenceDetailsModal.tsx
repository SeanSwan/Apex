// client-portal/src/components/evidence/EvidenceDetailsModal.tsx
/**
 * Evidence Details Modal Component
 * ===============================
 * Comprehensive evidence file viewer providing detailed metadata,
 * incident context, secure download options, and professional file preview
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  ClockIcon,
  TagIcon,
  EyeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { ClientAPI, formatIncidentType, getSeverityColor, getStatusColor, formatFileSize } from '@/services/clientAPI';
import { EvidenceFile } from '@/types/client.types';

// ===========================
// INTERFACES & TYPES
// ===========================

interface EvidenceDetailsModalProps {
  evidence: EvidenceFile | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children: React.ReactNode;
  value: string;
  currentTab: string;
}

interface FilePreviewProps {
  evidence: EvidenceFile;
  onDownload: () => void;
  downloadProgress: number | null;
}

interface MetadataTableProps {
  evidence: EvidenceFile;
}

type DetailTab = 'preview' | 'metadata' | 'incident';

// ===========================
// TAB PANEL COMPONENT
// ===========================

const TabPanel: React.FC<TabPanelProps> = ({ children, value, currentTab }) => {
  if (value !== currentTab) return null;
  return <div className="mt-6">{children}</div>;
};

// ===========================
// FILE PREVIEW COMPONENT
// ===========================

const FilePreview: React.FC<FilePreviewProps> = ({ evidence, onDownload, downloadProgress }) => {
  const [thumbnailError, setThumbnailError] = useState(false);
  
  const getFileIcon = (fileType: string) => {
    const iconClass = "h-16 w-16";
    switch (fileType) {
      case 'video':
        return <VideoCameraIcon className={`${iconClass} text-blue-600`} />;
      case 'image':
        return <PhotoIcon className={`${iconClass} text-green-600`} />;
      case 'audio':
        return <SpeakerWaveIcon className={`${iconClass} text-purple-600`} />;
      default:
        return <DocumentTextIcon className={`${iconClass} text-gray-600`} />;
    }
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'video':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'image':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'audio':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const thumbnailUrl = evidence.hasThumbnail ? ClientAPI.Evidence.getThumbnailUrl(evidence.id) : null;

  return (
    <div className="space-y-6">
      {/* File Preview Area */}
      <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 min-h-96 flex items-center justify-center">
        {thumbnailUrl && !thumbnailError ? (
          <div className="relative">
            <img 
              src={thumbnailUrl}
              alt={evidence.originalFileName}
              className="max-h-80 max-w-full object-contain rounded-lg shadow-lg"
              onError={() => setThumbnailError(true)}
            />
            {/* File Type Badge on Preview */}
            <div className="absolute top-2 left-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getFileTypeColor(evidence.fileType)}`}>
                {evidence.fileType.toUpperCase()}
              </span>
            </div>
            {/* Watermark Indicator */}
            {evidence.hasWatermark && (
              <div className="absolute top-2 right-2">
                <div className="bg-white bg-opacity-90 rounded-full p-2">
                  <ShieldCheckIcon className="h-6 w-6 text-blue-600" title="Watermarked File" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            {getFileIcon(evidence.fileType)}
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900">{evidence.originalFileName}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {evidence.fileType.charAt(0).toUpperCase() + evidence.fileType.slice(1)} file • {evidence.fileSizeFormatted}
              </p>
              {!evidence.hasThumbnail && (
                <p className="text-xs text-gray-400 mt-2">No preview available for this file type</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* File Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic File Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-400" />
            File Information
          </h4>
          <dl className="space-y-2">
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">File Name:</dt>
              <dd className="text-gray-900 font-medium truncate ml-2" title={evidence.originalFileName}>
                {evidence.originalFileName}
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">File Type:</dt>
              <dd>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getFileTypeColor(evidence.fileType)}`}>
                  {evidence.fileType.toUpperCase()}
                </span>
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">File Size:</dt>
              <dd className="text-gray-900 font-medium">{evidence.fileSizeFormatted}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Created:</dt>
              <dd className="text-gray-900">{new Date(evidence.createdAt).toLocaleDateString()}</dd>
            </div>
            {evidence.hasWatermark && (
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Security:</dt>
                <dd className="flex items-center text-blue-600">
                  <ShieldCheckIcon className="h-4 w-4 mr-1" />
                  <span className="font-medium">Watermarked</span>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Location & Context */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
            Location Context
          </h4>
          <dl className="space-y-2">
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Property:</dt>
              <dd className="text-gray-900 font-medium">{evidence.propertyName}</dd>
            </div>
            <div className="text-sm">
              <dt className="text-gray-500 mb-1">Specific Location:</dt>
              <dd className="text-gray-900">{evidence.location}</dd>
            </div>
            <div className="text-sm">
              <dt className="text-gray-500 mb-1">Incident Date:</dt>
              <dd className="text-gray-900">
                {new Date(evidence.incidentDate).toLocaleDateString()} at{' '}
                {new Date(evidence.incidentDate).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Download Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ArrowDownTrayIcon className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Secure Download</h4>
              <p className="text-xs text-blue-700">
                {evidence.hasWatermark ? 'Watermarked file for legal compliance' : 'Original file download'}
              </p>
            </div>
          </div>
          <button
            onClick={onDownload}
            disabled={downloadProgress !== null}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadProgress !== null ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {downloadProgress}%
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===========================
// METADATA TABLE COMPONENT
// ===========================

const MetadataTable: React.FC<MetadataTableProps> = ({ evidence }) => {
  const formatMetadataValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getMetadataIcon = (key: string) => {
    const iconClass = "h-4 w-4 text-gray-400";
    
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
      return <ClockIcon className={iconClass} />;
    }
    if (key.toLowerCase().includes('size') || key.toLowerCase().includes('dimension')) {
      return <DocumentTextIcon className={iconClass} />;
    }
    if (key.toLowerCase().includes('location') || key.toLowerCase().includes('gps')) {
      return <MapPinIcon className={iconClass} />;
    }
    
    return <TagIcon className={iconClass} />;
  };

  // Extract and organize metadata
  const coreMetadata = [
    { key: 'File ID', value: evidence.id },
    { key: 'Original Filename', value: evidence.originalFileName },
    { key: 'File Type', value: evidence.fileType },
    { key: 'File Size (Bytes)', value: evidence.fileSize },
    { key: 'File Size (Formatted)', value: evidence.fileSizeFormatted },
    { key: 'Has Thumbnail', value: evidence.hasThumbnail },
    { key: 'Has Watermark', value: evidence.hasWatermark },
    { key: 'Created At', value: new Date(evidence.createdAt).toLocaleString() }
  ];

  const incidentMetadata = [
    { key: 'Incident ID', value: evidence.incidentId },
    { key: 'Incident Number', value: evidence.incidentNumber },
    { key: 'Incident Type', value: formatIncidentType(evidence.incidentType) },
    { key: 'Incident Date', value: new Date(evidence.incidentDate).toLocaleString() },
    { key: 'Location', value: evidence.location },
    { key: 'Property', value: evidence.propertyName }
  ];

  const customMetadata = evidence.metadata ? Object.entries(evidence.metadata) : [];

  return (
    <div className="space-y-6">
      {/* Core File Metadata */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
            Core File Information
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {coreMetadata.map(({ key, value }) => (
            <div key={key} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                {getMetadataIcon(key)}
                <span className="ml-2 text-sm font-medium text-gray-700">{key}</span>
              </div>
              <span className="text-sm text-gray-900 font-mono">
                {formatMetadataValue(value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Incident Context Metadata */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-orange-400" />
            Incident Context
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {incidentMetadata.map(({ key, value }) => (
            <div key={key} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                {getMetadataIcon(key)}
                <span className="ml-2 text-sm font-medium text-gray-700">{key}</span>
              </div>
              <span className="text-sm text-gray-900 font-mono">
                {formatMetadataValue(value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom/Technical Metadata */}
      {customMetadata.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <TagIcon className="h-5 w-5 mr-2 text-blue-400" />
              Technical Metadata
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {customMetadata.map(([key, value]) => (
              <div key={key} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    {getMetadataIcon(key)}
                    <span className="ml-2 text-sm font-medium text-gray-700">{key}</span>
                  </div>
                  <div className="ml-4 text-right">
                    <pre className="text-sm text-gray-900 font-mono whitespace-pre-wrap text-right max-w-md">
                      {formatMetadataValue(value)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ===========================
// MAIN EVIDENCE DETAILS MODAL
// ===========================

export const EvidenceDetailsModal: React.FC<EvidenceDetailsModalProps> = ({
  evidence,
  isOpen,
  onClose
}) => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [activeTab, setActiveTab] = useState<DetailTab>('preview');
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ===========================
  // EFFECTS
  // ===========================

  useEffect(() => {
    if (isOpen && evidence) {
      setActiveTab('preview'); // Reset to preview tab
      setDownloadProgress(null);
      setError(null);
    }
  }, [isOpen, evidence]);

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleDownload = async () => {
    if (!evidence) return;

    try {
      setDownloadProgress(0);
      setError(null);

      await ClientAPI.Evidence.downloadEvidenceFile(
        evidence.id,
        evidence.originalFileName,
        (progress) => {
          setDownloadProgress(progress);
        }
      );

      // Clear progress after completion
      setTimeout(() => {
        setDownloadProgress(null);
      }, 2000);

    } catch (err: any) {
      console.error('Download failed:', err);
      setError(err.message || 'Download failed');
      setDownloadProgress(null);
    }
  };

  const handleClose = () => {
    setActiveTab('preview');
    setError(null);
    setDownloadProgress(null);
    onClose();
  };

  // ===========================
  // RENDER HELPERS
  // ===========================

  const renderIncidentTab = () => {
    if (!evidence) return null;

    return (
      <div className="space-y-6">
        {/* Incident Overview */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-orange-500" />
            Related Incident
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Incident Number</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">#{evidence.incidentNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatIncidentType(evidence.incidentType)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(evidence.incidentDate).toLocaleDateString()} at{' '}
                    {new Date(evidence.incidentDate).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </dd>
                </div>
              </dl>
            </div>
            <div>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Property</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{evidence.propertyName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{evidence.location}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Evidence Role</dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Supporting Evidence
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Evidence Context */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-500" />
            Evidence Context
          </h4>
          <div className="prose prose-sm max-w-none text-gray-700">
            <p>
              This {evidence.fileType} file was captured as part of incident #{evidence.incidentNumber}, 
              a {formatIncidentType(evidence.incidentType).toLowerCase()} incident that occurred at {evidence.propertyName} 
              on {new Date(evidence.incidentDate).toLocaleDateString()}.
            </p>
            <p className="mt-3">
              The file is {evidence.fileSizeFormatted} in size and was processed by our secure evidence 
              management system. {evidence.hasWatermark ? 'This file includes digital watermarking for legal compliance and chain of custody verification.' : 'This file maintains its original format for maximum evidential value.'}
            </p>
            {evidence.hasWatermark && (
              <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-400 mr-2" />
                  <p className="text-sm text-blue-700 font-medium">
                    Legal Compliance: This evidence file is digitally watermarked to ensure authenticity 
                    and maintain chain of custody for legal proceedings.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chain of Custody Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2 text-green-500" />
            Chain of Custody
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">File Created</span>
              <span className="text-sm text-gray-900">{new Date(evidence.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">Secure Storage</span>
              <span className="text-sm text-green-600 font-medium">✓ Verified</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">Digital Watermark</span>
              <span className={`text-sm font-medium ${evidence.hasWatermark ? 'text-green-600' : 'text-gray-500'}`}>
                {evidence.hasWatermark ? '✓ Applied' : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-700">File Integrity</span>
              <span className="text-sm text-green-600 font-medium">✓ Verified</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===========================
  // MODAL RENDER
  // ===========================

  if (!isOpen || !evidence) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h3 className="text-2xl font-bold text-gray-900" title={evidence.originalFileName}>
                {evidence.originalFileName.length > 40 
                  ? `${evidence.originalFileName.substring(0, 40)}...` 
                  : evidence.originalFileName}
              </h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                evidence.fileType === 'video' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                evidence.fileType === 'image' ? 'bg-green-50 text-green-700 border border-green-200' :
                evidence.fileType === 'audio' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                'bg-gray-50 text-gray-700 border border-gray-200'
              }`}>
                {evidence.fileType}
              </span>
              {evidence.hasWatermark && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  <ShieldCheckIcon className="h-3 w-3 mr-1" />
                  Watermarked
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Incident #{evidence.incidentNumber} • {evidence.propertyName} • {evidence.fileSizeFormatted}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Download Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6 pt-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'preview', label: 'File Preview', icon: EyeIcon },
              { key: 'metadata', label: 'Metadata', icon: TagIcon },
              { key: 'incident', label: 'Incident Context', icon: ExclamationTriangleIcon }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as DetailTab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="px-6 pb-6" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <TabPanel value="preview" currentTab={activeTab}>
            <FilePreview 
              evidence={evidence}
              onDownload={handleDownload}
              downloadProgress={downloadProgress}
            />
          </TabPanel>

          <TabPanel value="metadata" currentTab={activeTab}>
            <MetadataTable evidence={evidence} />
          </TabPanel>

          <TabPanel value="incident" currentTab={activeTab}>
            {renderIncidentTab()}
          </TabPanel>
        </div>
      </div>
    </div>
  );
};

export default EvidenceDetailsModal;