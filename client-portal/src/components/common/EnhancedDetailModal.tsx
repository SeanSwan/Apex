// client-portal/src/components/common/EnhancedDetailModal.tsx
/**
 * APEX AI ENHANCED DETAIL MODAL COMPONENT
 * =======================================
 * Comprehensive detail view for incidents, properties, and evidence
 * Features: Rich data display, image galleries, timeline view, actionable insights
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  Download, 
  Image as ImageIcon,
  Building2,
  Phone,
  Mail,
  Shield,
  Activity,
  FileText,
  Camera,
  Play,
  Pause,
  Volume2,
  ExternalLink,
  TrendingUp,
  Star,
  Tag
} from 'lucide-react';
import { imageManagementService } from '../../services/imageManagementService';
import { clientAPI } from '../../services/clientAPI';
import PropertyImageGallery from './PropertyImageGallery';

// ===========================
// TYPE DEFINITIONS
// ===========================

interface EnhancedDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'incident' | 'property' | 'evidence' | 'contact';
  itemId: string;
  initialData?: any;
  showRelatedItems?: boolean;
  enableActions?: boolean;
  className?: string;
}

interface DetailData {
  main: any;
  related: any[];
  timeline: any[];
  evidence: any[];
  images: any[];
  contacts: any[];
  statistics: any;
  loading: boolean;
  error: string | null;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  user?: string;
  metadata?: any;
}

// ===========================
// MAIN COMPONENT
// ===========================

export const EnhancedDetailModal: React.FC<EnhancedDetailModalProps> = ({
  isOpen,
  onClose,
  type,
  itemId,
  initialData,
  showRelatedItems = true,
  enableActions = true,
  className = ''
}) => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================

  const [data, setData] = useState<DetailData>({
    main: initialData || null,
    related: [],
    timeline: [],
    evidence: [],
    images: [],
    contacts: [],
    statistics: null,
    loading: true,
    error: null
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // ===========================
  // DATA FETCHING
  // ===========================

  const fetchDetailData = useCallback(async () => {
    if (!itemId || !isOpen) return;

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      let mainData = null;
      let relatedData = [];
      let timelineData = [];
      let evidenceData = [];
      let imagesData = [];
      let contactsData = [];
      let statisticsData = null;

      switch (type) {
        case 'incident':
          mainData = await fetchIncidentDetails(itemId);
          if (mainData) {
            timelineData = await fetchIncidentTimeline(itemId);
            evidenceData = await fetchIncidentEvidence(itemId);
            relatedData = await fetchRelatedIncidents(mainData.propertyId);
          }
          break;

        case 'property':
          mainData = await fetchPropertyDetails(itemId);
          if (mainData) {
            imagesData = await fetchPropertyImages(itemId);
            relatedData = await fetchPropertyIncidents(itemId);
            contactsData = await fetchPropertyContacts(itemId);
            statisticsData = await fetchPropertyStatistics(itemId);
          }
          break;

        case 'evidence':
          mainData = await fetchEvidenceDetails(itemId);
          if (mainData) {
            relatedData = await fetchRelatedEvidence(mainData.incidentId);
          }
          break;

        case 'contact':
          mainData = await fetchContactDetails(itemId);
          if (mainData) {
            relatedData = await fetchContactHistory(itemId);
          }
          break;
      }

      setData({
        main: mainData,
        related: relatedData,
        timeline: timelineData,
        evidence: evidenceData,
        images: imagesData,
        contacts: contactsData,
        statistics: statisticsData,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error(`Error fetching ${type} details:`, error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load details'
      }));
    }
  }, [itemId, type, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchDetailData();
    }
  }, [fetchDetailData, isOpen]);

  // ===========================
  // API FETCH FUNCTIONS
  // ===========================

  const fetchIncidentDetails = async (id: string) => {
    const response = await clientAPI.getIncidents({ incidentId: id });
    return response.data.incidents?.[0] || null;
  };

  const fetchIncidentTimeline = async (id: string): Promise<TimelineEvent[]> => {
    // Mock timeline data - replace with actual API call
    return [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        type: 'created',
        description: 'Incident detected by AI system',
        user: 'AI Detection System'
      },
      {
        id: '2', 
        timestamp: new Date(Date.now() - 300000).toISOString(),
        type: 'assigned',
        description: 'Incident assigned to security team',
        user: 'System'
      }
    ];
  };

  const fetchIncidentEvidence = async (id: string) => {
    try {
      const response = await clientAPI.getEvidence({ incidentId: id });
      return response.data.evidence || [];
    } catch (error) {
      console.error('Error fetching incident evidence:', error);
      return [];
    }
  };

  const fetchRelatedIncidents = async (propertyId: string) => {
    try {
      const response = await clientAPI.getIncidents({ 
        propertyId, 
        limit: 5,
        sortBy: 'incidentDate',
        sortOrder: 'desc'
      });
      return response.data.incidents || [];
    } catch (error) {
      console.error('Error fetching related incidents:', error);
      return [];
    }
  };

  const fetchPropertyDetails = async (id: string) => {
    // Use dashboard API to get property details
    try {
      const response = await clientAPI.getDashboardOverview();
      const properties = response.data.properties || [];
      return properties.find(p => p.id === id) || null;
    } catch (error) {
      console.error('Error fetching property details:', error);
      return null;
    }
  };

  const fetchPropertyImages = async (id: string) => {
    try {
      return await imageManagementService.getPropertyImages(id);
    } catch (error) {
      console.error('Error fetching property images:', error);
      return [];
    }
  };

  const fetchPropertyIncidents = async (id: string) => {
    try {
      const response = await clientAPI.getIncidents({ 
        propertyId: id, 
        limit: 10,
        sortBy: 'incidentDate',
        sortOrder: 'desc'
      });
      return response.data.incidents || [];
    } catch (error) {
      console.error('Error fetching property incidents:', error);
      return [];
    }
  };

  const fetchPropertyContacts = async (id: string) => {
    // Mock contact data - replace with actual API
    return [
      {
        id: '1',
        name: 'Property Manager',
        email: 'manager@property.com',
        phone: '(555) 123-4567',
        role: 'Primary Contact'
      }
    ];
  };

  const fetchPropertyStatistics = async (id: string) => {
    // Mock statistics - replace with actual API
    return {
      totalIncidents: 12,
      resolvedIncidents: 10,
      avgResponseTime: '4.2 minutes',
      lastIncident: '2 days ago'
    };
  };

  const fetchEvidenceDetails = async (id: string) => {
    try {
      const response = await clientAPI.getEvidence({ evidenceId: id });
      return response.data.evidence?.[0] || null;
    } catch (error) {
      console.error('Error fetching evidence details:', error);
      return null;
    }
  };

  const fetchRelatedEvidence = async (incidentId: string) => {
    try {
      const response = await clientAPI.getEvidence({ incidentId });
      return response.data.evidence || [];
    } catch (error) {
      console.error('Error fetching related evidence:', error);
      return [];
    }
  };

  const fetchContactDetails = async (id: string) => {
    // Mock contact details - replace with actual API
    return {
      id,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      role: 'Security Manager'
    };
  };

  const fetchContactHistory = async (id: string) => {
    // Mock contact history - replace with actual API
    return [];
  };

  // ===========================
  // RENDER HELPERS
  // ===========================

  const renderOverviewTab = () => {
    if (!data.main) return null;

    switch (type) {
      case 'incident':
        return renderIncidentOverview();
      case 'property':
        return renderPropertyOverview();
      case 'evidence':
        return renderEvidenceOverview();
      case 'contact':
        return renderContactOverview();
      default:
        return <div>Unknown item type</div>;
    }
  };

  const renderIncidentOverview = () => {
    const incident = data.main;
    
    return (
      <div className="space-y-6">
        {/* Incident Header */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {incident.incidentType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Security Incident'}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(incident.incidentDate).toLocaleString()}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {incident.location || 'Unknown Location'}
                </div>
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-1" />
                  {incident.propertyName || 'Property'}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                incident.severity === 'critical' ? 'text-red-700 bg-red-100' :
                incident.severity === 'high' ? 'text-orange-700 bg-orange-100' :
                incident.severity === 'medium' ? 'text-yellow-700 bg-yellow-100' :
                'text-green-700 bg-green-100'
              }`}>
                {incident.severity || 'Unknown'} Priority
              </span>
              
              {incident.aiConfidence && (
                <div className="mt-2 text-sm text-gray-600">
                  AI Confidence: {incident.aiConfidence}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Incident Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Incident Details</h4>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium flex items-center">
                  {incident.status === 'resolved' ? 
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" /> :
                    <AlertCircle className="w-4 h-4 text-orange-500 mr-1" />
                  }
                  {incident.status || 'Unknown'}
                </span>
              </div>
              
              {incident.reportedBy && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reported By:</span>
                  <span className="font-medium">{incident.reportedBy}</span>
                </div>
              )}
              
              {incident.assignedTo && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Assigned To:</span>
                  <span className="font-medium">{incident.assignedTo}</span>
                </div>
              )}
              
              {incident.responseTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time:</span>
                  <span className="font-medium">{incident.responseTime}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Description</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">
                {incident.description || 'No description available.'}
              </p>
            </div>
          </div>
        </div>

        {/* Evidence Summary */}
        {data.evidence.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Evidence Files ({data.evidence.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.evidence.slice(0, 6).map((evidence, index) => (
                <div key={evidence.id || index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    {evidence.fileType?.startsWith('image/') ? 
                      <ImageIcon className="w-5 h-5 text-blue-500 mr-2" /> :
                      evidence.fileType?.startsWith('video/') ?
                      <Camera className="w-5 h-5 text-purple-500 mr-2" /> :
                      <FileText className="w-5 h-5 text-gray-500 mr-2" />
                    }
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {evidence.fileName || 'Evidence File'}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-3">
                    {evidence.fileSize && `${(evidence.fileSize / 1024 / 1024).toFixed(1)} MB`}
                    {evidence.capturedAt && ` • ${new Date(evidence.capturedAt).toLocaleString()}`}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="flex-1 flex items-center justify-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </button>
                    <button className="flex items-center justify-center px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPropertyOverview = () => {
    const property = data.main;
    
    return (
      <div className="space-y-6">
        {/* Property Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {property.name}
              </h3>
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4 mr-1" />
                {property.address}
                {property.city && `, ${property.city}`}
                {property.state && `, ${property.state}`}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-1" />
                  {property.propertyType || 'Property'}
                </div>
                {data.statistics && (
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-1" />
                    {data.statistics.totalIncidents} incidents
                  </div>
                )}
              </div>
            </div>
            
            {data.images.length > 0 && (
              <button
                onClick={() => setShowImageGallery(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                View Gallery ({data.images.length})
              </button>
            )}
          </div>
        </div>

        {/* Property Statistics */}
        {data.statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{data.statistics.totalIncidents}</div>
              <div className="text-sm text-gray-600">Total Incidents</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{data.statistics.resolvedIncidents}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{data.statistics.avgResponseTime}</div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{data.images.length}</div>
              <div className="text-sm text-gray-600">Images</div>
            </div>
          </div>
        )}

        {/* Property Images Preview */}
        {data.images.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Property Images</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.images.slice(0, 8).map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" 
                     onClick={() => setShowImageGallery(true)}>
                  <img
                    src={imageManagementService.getThumbnailUrl(image)}
                    alt={`Property image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {image.isPrimary && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {data.images.length > 8 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowImageGallery(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View All {data.images.length} Images
                </button>
              </div>
            )}
          </div>
        )}

        {/* Contact Information */}
        {data.contacts.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Key Contacts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.contacts.map((contact, index) => (
                <div key={contact.id || index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">{contact.name}</h5>
                      <p className="text-sm text-gray-600 mb-2">{contact.role}</p>
                      
                      <div className="space-y-1">
                        {contact.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                              {contact.email}
                            </a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                              {contact.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {contact.email && (
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <Mail className="w-4 h-4" />
                        </button>
                      )}
                      {contact.phone && (
                        <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                          <Phone className="w-4 h-4" />
                        </button>
                      )}
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

  const renderEvidenceOverview = () => {
    const evidence = data.main;
    
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Evidence: {evidence.fileName}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(evidence.capturedAt).toLocaleString()}
            </div>
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              {evidence.fileType}
            </div>
            {evidence.fileSize && (
              <div className="flex items-center">
                <Activity className="w-4 h-4 mr-1" />
                {(evidence.fileSize / 1024 / 1024).toFixed(1)} MB
              </div>
            )}
          </div>
        </div>

        {/* Evidence preview or download */}
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Evidence File</h4>
          <p className="text-gray-600 mb-4">Click to download or view this evidence file</p>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Download Evidence
          </button>
        </div>
      </div>
    );
  };

  const renderContactOverview = () => {
    const contact = data.main;
    
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6 border border-green-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{contact.name}</h3>
          <p className="text-gray-600 mb-4">{contact.role}</p>
          
          <div className="space-y-2">
            {contact.email && (
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 mr-2 text-gray-500" />
                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 mr-2 text-gray-500" />
                <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                  {contact.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTimelineTab = () => {
    if (data.timeline.length === 0) {
      return (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Timeline Available</h4>
          <p className="text-gray-600">Timeline events will appear here when available.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.timeline.map((event, index) => (
          <div key={event.id} className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">{event.description}</p>
                <p className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
              {event.user && (
                <p className="text-xs text-gray-600 mt-1">by {event.user}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRelatedTab = () => {
    if (data.related.length === 0) {
      return (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Related Items</h4>
          <p className="text-gray-600">Related items will appear here when available.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.related.map((item, index) => (
          <div key={item.id || index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">
                  {item.name || item.incidentType || 'Related Item'}
                </h5>
                <p className="text-sm text-gray-600 mt-1">
                  {item.description || item.location || 'No description'}
                </p>
                {item.incidentDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(item.incidentDate).toLocaleString()}
                  </p>
                )}
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ===========================
  // MAIN RENDER
  // ===========================

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className={`bg-white rounded-lg max-w-6xl max-h-[90vh] w-full overflow-hidden shadow-xl ${className}`}>
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {type.charAt(0).toUpperCase() + type.slice(1)} Details
              </h2>
              {data.main && (
                <p className="text-sm text-gray-600 mt-1">
                  {data.main.name || data.main.incidentType || data.main.fileName || 'Details'}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {enableActions && (
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Refresh">
                  <TrendingUp className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex h-[calc(90vh-80px)]">
            {/* Tabs Sidebar */}
            <div className="w-48 border-r border-gray-200 bg-gray-50">
              <nav className="p-4 space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Overview
                </button>
                
                {data.timeline.length > 0 && (
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'timeline'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Timeline
                  </button>
                )}
                
                {showRelatedItems && data.related.length > 0 && (
                  <button
                    onClick={() => setActiveTab('related')}
                    className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'related'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Related Items
                  </button>
                )}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {data.loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading details...</span>
                  </div>
                ) : data.error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Error Loading Details</h4>
                    <p className="text-gray-600">{data.error}</p>
                    <button
                      onClick={fetchDetailData}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div>
                    {activeTab === 'overview' && renderOverviewTab()}
                    {activeTab === 'timeline' && renderTimelineTab()}
                    {activeTab === 'related' && renderRelatedTab()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Property Image Gallery Modal */}
      {showImageGallery && type === 'property' && data.main && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-7xl max-h-[95vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {data.main.name} - Image Gallery
              </h3>
              <button
                onClick={() => setShowImageGallery(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              <PropertyImageGallery
                propertyId={data.main.id}
                images={data.images}
                showDownload={true}
                showMetadata={true}
                enableLightbox={true}
                gridCols={4}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedDetailModal;
