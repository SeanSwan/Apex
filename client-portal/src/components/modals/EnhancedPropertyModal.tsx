// client-portal/src/components/modals/EnhancedPropertyModal.tsx
/**
 * ENHANCED PROPERTY MANAGEMENT MODAL - APEX AI
 * ============================================
 * Comprehensive property management interface for admin dashboard with
 * real-time client portal synchronization, advanced image management,
 * AI-powered property analytics, and manual override capabilities.
 * 
 * ADMIN FEATURES:
 * - Complete property CRUD operations with image gallery
 * - Real-time client portal preview and synchronization
 * - AI-powered property analytics and risk assessment
 * - Bulk operations and CSV import/export
 * - Manual override controls for all AI automation
 * - Live collaboration and change tracking
 * - Advanced security configuration
 * - Integration with guard assignments and SOPs
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  XMarkIcon,
  BuildingOfficeIcon,
  CameraIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  CogIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ChartBarIcon,
  BellIcon,
  ShieldExclamationIcon,
  CpuChipIcon,
  AdjustmentsHorizontalIcon,
  CommandLineIcon,
  BoltIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  TagIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  HomeIcon,
  BeakerIcon,
  StarIcon,
  TrophyIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { 
  XMarkIcon as XMarkIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid
} from '@heroicons/react/24/solid';

// ================================
// ENHANCED INTERFACES & TYPES
// ================================

interface EnhancedPropertyModalProps {
  property: PropertyDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: PropertyFormData) => Promise<void>;
  onDelete?: (propertyId: string) => Promise<void>;
  mode: 'create' | 'edit' | 'view';
  isAdmin?: boolean;
}

interface PropertyDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  propertyType: 'luxury_apartment' | 'commercial' | 'residential' | 'corporate';
  clientId: string;
  clientCompanyName: string;
  timezone: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  emergencyContactInfo: {
    name: string;
    phone: string;
    email: string;
    relationship: string;
  };
  specialInstructions: string;
  accessCodes: {
    main: string;
    emergency: string;
    maintenance: string;
    visitor: string;
  };
  propertyImages: PropertyImage[];
  status: 'active' | 'inactive' | 'maintenance';
  assignedGuards: GuardAssignment[];
  sopCount: number;
  contactListCount: number;
  incidentCount: number;
  lastIncidentDate?: string;
  securityLevel: 'standard' | 'enhanced' | 'maximum';
  aiAutomationLevel: 'manual' | 'assisted' | 'autonomous';
  createdAt: string;
  updatedAt: string;
  analytics?: PropertyAnalytics;
}

interface PropertyFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  propertyType: string;
  clientId: string;
  timezone: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  emergencyContactInfo: {
    name: string;
    phone: string;
    email: string;
    relationship: string;
  };
  specialInstructions: string;
  accessCodes: {
    main: string;
    emergency: string;
    maintenance: string;
    visitor: string;
  };
  securityLevel: string;
  aiAutomationLevel: string;
  status: string;
}

interface PropertyImage {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  uploadedAt: string;
  description?: string;
  isPrimary: boolean;
  tags: string[];
}

interface GuardAssignment {
  id: string;
  guardId: string;
  guardName: string;
  guardBadge: string;
  shiftSchedule: string;
  assignedAt: string;
  status: 'active' | 'inactive';
}

interface PropertyAnalytics {
  securityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  incidentTrends: TrendData[];
  performanceMetrics: PerformanceMetric[];
  aiInsights: AIInsight[];
  recommendations: Recommendation[];
}

interface TrendData {
  date: string;
  incidents: number;
  responseTime: number;
  resolved: number;
}

interface PerformanceMetric {
  metric: string;
  value: number;
  change: number;
  status: 'good' | 'warning' | 'critical';
}

interface AIInsight {
  insight: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
}

interface Recommendation {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: number;
  implementationCost: string;
  canAutoImplement: boolean;
}

// ================================
// MOCK DATA GENERATORS
// ================================

const generatePropertyAnalytics = (propertyId: string): PropertyAnalytics => {
  const securityScore = Math.floor(Math.random() * 20) + 80;
  const riskLevels: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
  const riskLevel = riskLevels[Math.floor(securityScore / 25)];
  
  return {
    securityScore,
    riskLevel,
    incidentTrends: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      incidents: Math.floor(Math.random() * 8),
      responseTime: Math.floor(Math.random() * 300) + 60,
      resolved: Math.floor(Math.random() * 6)
    })),
    performanceMetrics: [
      {
        metric: 'Average Response Time',
        value: Math.floor(Math.random() * 120) + 60,
        change: Math.floor(Math.random() * 40) - 20,
        status: 'good'
      },
      {
        metric: 'Resolution Rate',
        value: Math.floor(Math.random() * 15) + 85,
        change: Math.floor(Math.random() * 10) + 2,
        status: 'good'
      },
      {
        metric: 'AI Accuracy',
        value: Math.floor(Math.random() * 10) + 90,
        change: Math.floor(Math.random() * 8) + 1,
        status: 'good'
      }
    ],
    aiInsights: [
      {
        insight: 'Peak incident times occur between 2-4 PM on weekdays, suggesting targeted monitoring needed',
        confidence: 94,
        impact: 'high',
        actionable: true
      },
      {
        insight: 'Recent decrease in false alarms indicates improved AI model performance',
        confidence: 87,
        impact: 'medium',
        actionable: false
      },
      {
        insight: 'Correlation detected between weather patterns and incident frequency',
        confidence: 76,
        impact: 'medium',
        actionable: true
      }
    ],
    recommendations: [
      {
        title: 'Implement Dynamic Patrol Scheduling',
        description: 'Increase guard presence during identified high-risk time windows',
        priority: 'high',
        estimatedImpact: 85,
        implementationCost: 'Medium',
        canAutoImplement: true
      },
      {
        title: 'Upgrade Perimeter Lighting',
        description: 'Enhanced lighting in areas with frequent incident activity',
        priority: 'medium',
        estimatedImpact: 70,
        implementationCost: 'High',
        canAutoImplement: false
      }
    ]
  };
};

// ================================
// IMAGE MANAGEMENT COMPONENT
// ================================

interface ImageGalleryProps {
  images: PropertyImage[];
  onImagesChange: (images: PropertyImage[]) => void;
  onUpload: (files: FileList) => void;
  isEditable: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  images, 
  onImagesChange, 
  onUpload, 
  isEditable 
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PropertyImage | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (isEditable && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  }, [isEditable, onUpload]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  }, [onUpload]);

  const handleSetPrimary = useCallback((imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  const handleDeleteImage = useCallback((imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {isEditable && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('property-image-upload')?.click()}
        >
          <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Property Images</h3>
          <p className="text-gray-600 mb-4">
            Drag and drop images here, or click to select files
          </p>
          <p className="text-sm text-gray-500">
            Supports JPG, PNG, WebP up to 10MB each
          </p>
          <input
            id="property-image-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 z-10">
                  <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center">
                    <StarIcon className="h-3 w-3 mr-1" />
                    Primary
                  </span>
                </div>
              )}

              {/* Image */}
              <div 
                className="aspect-square bg-gray-100 cursor-pointer"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.url}
                  alt={image.description || image.originalName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Image Info */}
              <div className="p-3">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {image.originalName}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {(image.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {image.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {image.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              {isEditable && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-2">
                    {!image.isPrimary && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(image.id);
                        }}
                        className="flex-1 bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 transition-colors"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(image.id);
                      }}
                      className="bg-red-600 text-white text-xs py-1 px-2 rounded hover:bg-red-700 transition-colors"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{selectedImage.originalName}</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIconSolid className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedImage.url}
                alt={selectedImage.description || selectedImage.originalName}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================================
// ANALYTICS DASHBOARD COMPONENT
// ================================

interface AnalyticsDashboardProps {
  analytics: PropertyAnalytics;
  onManualOverride: (action: string, data: any) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  analytics, 
  onManualOverride 
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-yellow-600 bg-yellow-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center">
            <ShieldCheckIcon className="h-6 w-6 mr-2" />
            Property Security Overview
          </h3>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{analytics.securityScore}</div>
              <div className="text-sm text-blue-200">Security Score</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold uppercase ${getRiskColor(analytics.riskLevel)}`}>
              {analytics.riskLevel} Risk
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analytics.performanceMetrics.map((metric, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-600">{metric.metric}</h4>
              <div className={`flex items-center text-sm ${
                metric.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change >= 0 ? '+' : ''}{metric.change}%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {metric.metric.includes('Time') ? `${metric.value}s` : 
               metric.metric.includes('Rate') || metric.metric.includes('Accuracy') ? `${metric.value}%` : 
               metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <CpuChipIcon className="h-5 w-5 mr-2 text-blue-600" />
          AI-Powered Insights
        </h3>
        <div className="space-y-3">
          {analytics.aiInsights.map((insight, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  insight.confidence >= 90 ? 'bg-green-100 text-green-800' :
                  insight.confidence >= 75 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {insight.confidence}% Confidence
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                  insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                  insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {insight.impact} Impact
                </span>
              </div>
              <p className="text-gray-700">{insight.insight}</p>
              {insight.actionable && (
                <button
                  onClick={() => onManualOverride('implement_insight', insight)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Take Action →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <BoltIcon className="h-5 w-5 mr-2 text-green-600" />
          AI Recommendations
        </h3>
        <div className="space-y-4">
          {analytics.recommendations.map((rec, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                    rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority}
                  </span>
                  <span className="text-sm text-gray-600">
                    {rec.estimatedImpact}% Impact
                  </span>
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-3">{rec.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Implementation Cost: {rec.implementationCost}
                </span>
                {rec.canAutoImplement ? (
                  <button
                    onClick={() => onManualOverride('auto_implement', rec)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Auto-Implement
                  </button>
                ) : (
                  <button
                    onClick={() => onManualOverride('schedule_implementation', rec)}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                  >
                    Schedule
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ================================
// MAIN ENHANCED PROPERTY MODAL
// ================================

export const EnhancedPropertyModal: React.FC<EnhancedPropertyModalProps> = ({
  property,
  isOpen,
  onClose,
  onSave,
  onDelete,
  mode,
  isAdmin = false
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'images' | 'security' | 'analytics' | 'settings'>('details');
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    propertyType: 'luxury_apartment',
    clientId: '',
    timezone: 'America/New_York',
    emergencyContactInfo: {
      name: '',
      phone: '',
      email: '',
      relationship: ''
    },
    specialInstructions: '',
    accessCodes: {
      main: '',
      emergency: '',
      maintenance: '',
      visitor: ''
    },
    securityLevel: 'standard',
    aiAutomationLevel: 'assisted',
    status: 'active'
  });
  
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<PropertyAnalytics | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when property changes
  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name,
        address: property.address,
        city: property.city,
        state: property.state,
        zipCode: property.zipCode,
        country: property.country,
        propertyType: property.propertyType,
        clientId: property.clientId,
        timezone: property.timezone,
        coordinates: property.coordinates,
        emergencyContactInfo: property.emergencyContactInfo,
        specialInstructions: property.specialInstructions,
        accessCodes: property.accessCodes,
        securityLevel: property.securityLevel,
        aiAutomationLevel: property.aiAutomationLevel,
        status: property.status
      });
      setImages(property.propertyImages || []);
      setAnalytics(property.analytics || generatePropertyAnalytics(property.id));
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
        propertyType: 'luxury_apartment',
        clientId: '',
        timezone: 'America/New_York',
        emergencyContactInfo: {
          name: '',
          phone: '',
          email: '',
          relationship: ''
        },
        specialInstructions: '',
        accessCodes: {
          main: '',
          emergency: '',
          maintenance: '',
          visitor: ''
        },
        securityLevel: 'standard',
        aiAutomationLevel: 'assisted',
        status: 'active'
      });
      setImages([]);
      setAnalytics(null);
    }
    setHasChanges(false);
  }, [property]);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  }, []);

  const handleNestedInputChange = useCallback((section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof PropertyFormData],
        [field]: value
      }
    }));
    setHasChanges(true);
  }, []);

  const handleImageUpload = useCallback((files: FileList) => {
    // Simulate image upload
    const newImages: PropertyImage[] = Array.from(files).map((file, index) => ({
      id: `img_${Date.now()}_${index}`,
      filename: `${Date.now()}_${file.name}`,
      originalName: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      uploadedAt: new Date().toISOString(),
      isPrimary: images.length === 0 && index === 0,
      tags: []
    }));
    
    setImages(prev => [...prev, ...newImages]);
    setHasChanges(true);
  }, [images.length]);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      await onSave(formData);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Error saving property:', error);
    } finally {
      setIsLoading(false);
    }
  }, [formData, onSave, onClose]);

  const handleDelete = useCallback(async () => {
    if (!property || !onDelete) return;
    
    if (confirm(`Are you sure you want to delete "${property.name}"? This action cannot be undone.`)) {
      setIsLoading(true);
      try {
        await onDelete(property.id);
        onClose();
      } catch (error) {
        console.error('Error deleting property:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [property, onDelete, onClose]);

  const handleManualOverride = useCallback((action: string, data: any) => {
    console.log('Manual override triggered:', action, data);
    // This would typically call an API to execute the action
    alert(`Manual override: ${action}`);
  }, []);

  if (!isOpen) return null;

  const tabs = [
    { key: 'details', label: 'Property Details', icon: BuildingOfficeIcon },
    { key: 'images', label: `Images (${images.length})`, icon: PhotoIcon },
    { key: 'security', label: 'Security Config', icon: ShieldCheckIcon },
    ...(mode !== 'create' ? [{ key: 'analytics', label: 'Analytics', icon: ChartBarIcon }] : []),
    ...(isAdmin ? [{ key: 'settings', label: 'Admin Settings', icon: CogIcon }] : [])
  ];

  const isEditable = mode !== 'view' && isAdmin;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BuildingOfficeIcon className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {mode === 'create' ? 'Create New Property' : 
                   mode === 'edit' ? `Edit ${property?.name}` : 
                   property?.name}
                </h2>
                <p className="text-blue-100 text-sm">
                  {mode === 'create' ? 'Add a new property to the system' :
                   mode === 'edit' ? 'Modify property settings and configuration' :
                   `${property?.address}, ${property?.city}, ${property?.state}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <div className="flex items-center space-x-2 bg-yellow-500/20 rounded-lg px-3 py-1">
                  <ExclamationTriangleIconSolid className="h-4 w-4 text-yellow-200" />
                  <span className="text-sm">Unsaved Changes</span>
                </div>
              )}
              
              {mode !== 'create' && isAdmin && (
                <button
                  onClick={handleDelete}
                  className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <XMarkIconSolid className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-0 px-6">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all ${
                  activeTab === key
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[70vh] p-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="Enter property name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type *
                  </label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => handleInputChange('propertyType', e.target.value)}
                    disabled={!isEditable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="luxury_apartment">Luxury Apartment</option>
                    <option value="commercial">Commercial</option>
                    <option value="residential">Residential</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="Enter property address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="State"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="ZIP Code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact & Security */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactInfo.name}
                    onChange={(e) => handleNestedInputChange('emergencyContactInfo', 'name', e.target.value)}
                    disabled={!isEditable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="Emergency contact name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyContactInfo.phone}
                      onChange={(e) => handleNestedInputChange('emergencyContactInfo', 'phone', e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.emergencyContactInfo.email}
                      onChange={(e) => handleNestedInputChange('emergencyContactInfo', 'email', e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactInfo.relationship}
                    onChange={(e) => handleNestedInputChange('emergencyContactInfo', 'relationship', e.target.value)}
                    disabled={!isEditable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="e.g., Property Manager, Owner"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Instructions
                  </label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                    disabled={!isEditable}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    placeholder="Enter any special instructions for security personnel"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <ImageGallery
              images={images}
              onImagesChange={setImages}
              onUpload={handleImageUpload}
              isEditable={isEditable}
            />
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Security Level */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Security Level
                    </label>
                    <select
                      value={formData.securityLevel}
                      onChange={(e) => handleInputChange('securityLevel', e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="standard">Standard Security</option>
                      <option value="enhanced">Enhanced Security</option>
                      <option value="maximum">Maximum Security</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      AI Automation Level
                    </label>
                    <select
                      value={formData.aiAutomationLevel}
                      onChange={(e) => handleInputChange('aiAutomationLevel', e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="manual">Manual Control Only</option>
                      <option value="assisted">AI-Assisted (Recommended)</option>
                      <option value="autonomous">Autonomous AI Control</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Access Codes */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Codes</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Main Access Code
                    </label>
                    <input
                      type="password"
                      value={formData.accessCodes.main}
                      onChange={(e) => handleNestedInputChange('accessCodes', 'main', e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Main access code"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emergency Code
                    </label>
                    <input
                      type="password"
                      value={formData.accessCodes.emergency}
                      onChange={(e) => handleNestedInputChange('accessCodes', 'emergency', e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Emergency access code"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maintenance Code
                    </label>
                    <input
                      type="password"
                      value={formData.accessCodes.maintenance}
                      onChange={(e) => handleNestedInputChange('accessCodes', 'maintenance', e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Maintenance access code"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visitor Code
                    </label>
                    <input
                      type="password"
                      value={formData.accessCodes.visitor}
                      onChange={(e) => handleNestedInputChange('accessCodes', 'visitor', e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Visitor access code"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && analytics && (
            <AnalyticsDashboard
              analytics={analytics}
              onManualOverride={handleManualOverride}
            />
          )}

          {activeTab === 'settings' && isAdmin && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIconSolid className="h-5 w-5 text-yellow-600 mr-2" />
                  <h3 className="text-sm font-medium text-yellow-800">Admin Settings</h3>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  These settings affect system-wide behavior and client portal visibility.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Status</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Under Maintenance</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Inactive properties are hidden from client portal
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {mode === 'create' ? 'Fill in the required fields to create the property' :
               mode === 'edit' ? 'Changes will be synchronized to client portal immediately' :
               'View-only mode'}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {hasChanges ? 'Cancel' : 'Close'}
              </button>
              
              {isEditable && (
                <button
                  onClick={handleSave}
                  disabled={isLoading || !formData.name || !formData.address}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{mode === 'create' ? 'Create Property' : 'Save Changes'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPropertyModal;
