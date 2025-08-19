// client-portal/src/components/incidents/IncidentDetailsModal.tsx
/**
 * Incident Details Modal Component
 * ===============================
 * Comprehensive incident investigation modal providing detailed incident view,
 * evidence browser, call logs, response actions, and professional reporting
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  ShieldCheckIcon,
  PhoneIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  BuildingOfficeIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { ClientAPI, formatIncidentType, getSeverityColor, getStatusColor, getConfidenceBadgeColor, formatFileSize } from '@/services/clientAPI';
import { 
  Incident, 
  IncidentDetails, 
  EvidenceFile,
  CallLog,
  ResponseAction,
  Notification 
} from '@/types/client.types';

// ===========================
// INTERFACES & TYPES
// ===========================

interface IncidentDetailsModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children: React.ReactNode;
  value: string;
  currentTab: string;
}

interface EvidenceGalleryProps {
  evidence: EvidenceFile[];
  onDownload: (evidence: EvidenceFile) => void;
  isLoading: boolean;
}

interface CallLogTimelineProps {
  callLogs: CallLog[];
}

type DetailTab = 'overview' | 'evidence' | 'calls' | 'timeline';

// ===========================
// TAB PANEL COMPONENT
// ===========================

const TabPanel: React.FC<TabPanelProps> = ({ children, value, currentTab }) => {
  if (value !== currentTab) return null;
  return <div className="mt-6">{children}</div>;
};

// ===========================
// EVIDENCE GALLERY COMPONENT
// ===========================

const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({ evidence, onDownload, isLoading }) => {
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'video':
        return <VideoCameraIcon className="h-8 w-8 text-blue-600" />;
      case 'image':
        return <PhotoIcon className="h-8 w-8 text-green-600" />;
      case 'audio':
        return <SpeakerWaveIcon className="h-8 w-8 text-purple-600" />;
      default:
        return <DocumentTextIcon className="h-8 w-8 text-gray-600" />;
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="h-8 w-8 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (evidence.length === 0) {
    return (
      <div className="text-center py-12">
        <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Evidence Files</h3>
        <p className="mt-1 text-sm text-gray-500">No evidence has been collected for this incident yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {evidence.map((file) => (
        <div key={file.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              {getFileIcon(file.fileType)}
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getFileTypeColor(file.fileType)}`}>
                {file.fileType.toUpperCase()}
              </span>
            </div>
            
            <h4 className="text-sm font-medium text-gray-900 truncate mb-1" title={file.originalFileName}>
              {file.originalFileName}
            </h4>
            
            <div className="text-xs text-gray-500 space-y-1">
              <div>Size: {file.fileSizeFormatted}</div>
              <div>Created: {new Date(file.createdAt).toLocaleDateString()}</div>
              {file.hasWatermark && (
                <div className="flex items-center text-blue-600">
                  <ShieldCheckIcon className="h-3 w-3 mr-1" />
                  Watermarked
                </div>
              )}
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
            <button
              onClick={() => onDownload(file)}
              className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ===========================
// CALL LOG TIMELINE COMPONENT
// ===========================

const CallLogTimeline: React.FC<CallLogTimelineProps> = ({ callLogs }) => {
  if (callLogs.length === 0) {
    return (
      <div className="text-center py-12">
        <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Call Logs</h3>
        <p className="mt-1 text-sm text-gray-500">No phone interactions have been recorded for this incident.</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {callLogs.map((call, index) => (
          <li key={call.callId}>
            <div className="relative pb-8">
              {index !== callLogs.length - 1 && (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                    call.callStatus === 'completed' 
                      ? 'bg-green-500' 
                      : call.callStatus === 'failed' 
                        ? 'bg-red-500' 
                        : 'bg-blue-500'
                  }`}>
                    <PhoneIcon className="h-5 w-5 text-white" />
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {call.callDirection === 'inbound' ? 'Incoming Call' : 'Outgoing Call'}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        call.callStatus === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : call.callStatus === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {call.callStatus.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-500 space-y-1">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-2" />
                        {call.callerName || 'Unknown Caller'} ({call.callerPhone})
                      </div>
                      
                      {call.duration && (
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          Duration: {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            call.aiHandled 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {call.aiHandled ? 'AI Handled' : 'Human Only'}
                          </span>
                        </div>
                        
                        {call.humanTakeover && (
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Human Takeover
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {call.callSummary && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 font-medium mb-1">Call Summary:</p>
                          <p className="text-sm text-gray-600">{call.callSummary}</p>
                        </div>
                      )}
                      
                      {call.takeoverReason && (
                        <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-700 font-medium mb-1">Takeover Reason:</p>
                          <p className="text-sm text-yellow-600">{call.takeoverReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                    <div>{new Date(call.callStarted).toLocaleDateString()}</div>
                    <div>{new Date(call.callStarted).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ===========================
// MAIN INCIDENT DETAILS MODAL
// ===========================

export const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({
  incident,
  isOpen,
  onClose
}) => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [incidentDetails, setIncidentDetails] = useState<IncidentDetails | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ [key: number]: number }>({});

  // ===========================
  // DATA FETCHING
  // ===========================

  const loadIncidentDetails = useCallback(async (incidentId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const details = await ClientAPI.Incidents.getIncidentDetails(incidentId);
      setIncidentDetails(details);
    } catch (err: any) {
      console.error('Failed to load incident details:', err);
      setError(err.message || 'Failed to load incident details');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===========================
  // EFFECTS
  // ===========================

  useEffect(() => {
    if (isOpen && incident) {
      loadIncidentDetails(incident.id);
      setActiveTab('overview'); // Reset to overview tab
    } else {
      setIncidentDetails(null);
      setError(null);
    }
  }, [isOpen, incident, loadIncidentDetails]);

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleDownload = async (evidence: EvidenceFile) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [evidence.id]: 0 }));

      await ClientAPI.Evidence.downloadEvidenceFile(
        evidence.id,
        evidence.originalFileName,
        (progress) => {
          setDownloadProgress(prev => ({ ...prev, [evidence.id]: progress }));
        }
      );

      // Clear progress after completion
      setTimeout(() => {
        setDownloadProgress(prev => {
          const newState = { ...prev };
          delete newState[evidence.id];
          return newState;
        });
      }, 2000);

    } catch (err: any) {
      console.error('Download failed:', err);
      setDownloadProgress(prev => {
        const newState = { ...prev };
        delete newState[evidence.id];
        return newState;
      });
    }
  };

  const handleClose = () => {
    setActiveTab('overview');
    setError(null);
    setIncidentDetails(null);
    onClose();
  };

  // ===========================
  // RENDER HELPERS
  // ===========================

  const renderOverviewTab = () => {
    if (!incidentDetails) return null;

    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Incident Information</h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Incident Number</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">#{incidentDetails.incidentNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatIncidentType(incidentDetails.incidentType)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Severity</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getSeverityColor(incidentDetails.severity)}`}>
                  {incidentDetails.severity === 'critical' && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
                  {incidentDetails.severity}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(incidentDetails.status)}`}>
                  {incidentDetails.status === 'resolved' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                  {incidentDetails.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">AI Confidence</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceBadgeColor(incidentDetails.aiConfidence)}`}>
                  {incidentDetails.aiConfidence}%
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Reported By</dt>
              <dd className="mt-1 text-sm text-gray-900">{incidentDetails.reportedBy}</dd>
            </div>
          </dl>
        </div>

        {/* Location & Time */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Location & Timing</h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                Property
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                <div className="font-medium">{incidentDetails.propertyName}</div>
                <div className="text-gray-500">{incidentDetails.propertyAddress}</div>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2" />
                Specific Location
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{incidentDetails.location}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <CalendarDaysIcon className="h-4 w-4 mr-2" />
                Incident Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(incidentDetails.incidentDate).toLocaleDateString()} at{' '}
                {new Date(incidentDetails.incidentDate).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </dd>
            </div>
            {incidentDetails.resolvedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Resolved Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(incidentDetails.resolvedAt).toLocaleDateString()} at{' '}
                  {new Date(incidentDetails.resolvedAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Description */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{incidentDetails.description}</p>
        </div>

        {/* Resolution Notes */}
        {incidentDetails.resolutionNotes && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-green-900 mb-4 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Resolution Notes
            </h3>
            <p className="text-sm text-green-700 whitespace-pre-wrap">{incidentDetails.resolutionNotes}</p>
            {incidentDetails.resolvedByName && (
              <p className="text-sm text-green-600 mt-2">
                Resolved by: {incidentDetails.resolvedByName}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderResponseActionsTimeline = () => {
    if (!incidentDetails?.responseActions || incidentDetails.responseActions.length === 0) {
      return (
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Response Actions</h3>
          <p className="mt-1 text-sm text-gray-500">No automated response actions have been recorded for this incident.</p>
        </div>
      );
    }

    return (
      <div className="flow-root">
        <ul className="-mb-8">
          {incidentDetails.responseActions.map((action, index) => (
            <li key={action.id}>
              <div className="relative pb-8">
                {index !== incidentDetails.responseActions.length - 1 && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                      action.status === 'completed' 
                        ? 'bg-green-500' 
                        : action.status === 'failed' 
                          ? 'bg-red-500' 
                          : 'bg-yellow-500'
                    }`}>
                      {action.status === 'completed' ? (
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                      ) : action.status === 'failed' ? (
                        <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                      ) : (
                        <ClockIcon className="h-5 w-5 text-white" />
                      )}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{action.action}</p>
                      <p className="text-sm text-gray-500">Performed by: {action.performedBy}</p>
                      {action.details && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">{action.details}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      <div>{new Date(action.timestamp).toLocaleDateString()}</div>
                      <div>{new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // ===========================
  // MODAL RENDER
  // ===========================

  if (!isOpen || !incident) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h3 className="text-2xl font-bold text-gray-900">
                Incident #{incident.incidentNumber}
              </h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getSeverityColor(incident.severity)}`}>
                {incident.severity === 'critical' && <ExclamationTriangleIcon className="h-4 w-4 mr-1" />}
                {incident.severity}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {formatIncidentType(incident.incidentType)} • {incident.propertyName} • {new Date(incident.incidentDate).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6 pt-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: DocumentTextIcon },
              { key: 'evidence', label: `Evidence (${incidentDetails?.evidence?.length || 0})`, icon: EyeIcon },
              { key: 'calls', label: `Calls (${incidentDetails?.callLogs?.length || 0})`, icon: PhoneIcon },
              { key: 'timeline', label: 'Response Timeline', icon: ClockIcon }
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
          {error ? (
            <div className="mt-6 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Details</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <div className="mt-6">
                <button
                  onClick={() => incident && loadIncidentDetails(incident.id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="mt-6 space-y-6">
              <div className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-32"></div>
              </div>
              <div className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-24"></div>
              </div>
              <div className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-16"></div>
              </div>
            </div>
          ) : (
            <>
              <TabPanel value="overview" currentTab={activeTab}>
                {renderOverviewTab()}
              </TabPanel>

              <TabPanel value="evidence" currentTab={activeTab}>
                <EvidenceGallery
                  evidence={incidentDetails?.evidence || []}
                  onDownload={handleDownload}
                  isLoading={false}
                />
              </TabPanel>

              <TabPanel value="calls" currentTab={activeTab}>
                <CallLogTimeline callLogs={incidentDetails?.callLogs || []} />
              </TabPanel>

              <TabPanel value="timeline" currentTab={activeTab}>
                {renderResponseActionsTimeline()}
              </TabPanel>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailsModal;