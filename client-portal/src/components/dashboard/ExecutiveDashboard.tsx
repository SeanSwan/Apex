// APEX AI CLIENT PORTAL - ENHANCED EXECUTIVE DASHBOARD
// Enhanced with property image galleries and visual intelligence

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Building2, Image as ImageIcon, Eye, Grid, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { clientAPI } from '../../services/clientAPI';
import { imageManagementService } from '../../services/imageManagementService';
import PropertyImageGallery from '../common/PropertyImageGallery';

interface DashboardData {
  overview: any;
  incidents: any[];
  hotspots: any[];
  properties: any[];
  imageStats: any;
  loading: boolean;
  error: string | null;
}

interface PropertyWithImages {
  id: string;
  name: string;
  address: string;
  imageCount: number;
  primaryImage: string | null;
  lastImageUpdate: string | null;
}

export const ExecutiveDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    overview: null,
    incidents: [],
    hotspots: [],
    properties: [],
    imageStats: null,
    loading: true,
    error: null
  });

  const [showPropertyGallery, setShowPropertyGallery] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'properties'>('overview');

  const loadDashboardData = useCallback(async () => {
    console.log('🚨 DASHBOARD: Loading dashboard data...');
    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Load dashboard overview
      console.log('🚨 DASHBOARD: Fetching overview...');
      const overviewResponse = await clientAPI.getDashboardOverview({ dateRange: '30' });
      console.log('🚨 DASHBOARD: Overview loaded successfully:', overviewResponse.data);

      // Load incidents
      console.log('🚨 DASHBOARD: Fetching incidents...');
      const incidentsResponse = await clientAPI.getIncidents({
        page: 1,
        limit: 20,
        sortBy: 'incidentDate',
        sortOrder: 'desc',
        severity: 'critical,high'
      });
      console.log('🚨 DASHBOARD: Incidents loaded successfully:', incidentsResponse.data);

      // Load hotspots
      console.log('🚨 DASHBOARD: Fetching hotspots...');
      const hotspotsResponse = await clientAPI.getSecurityHotspots({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        riskThreshold: 'medium'
      });
      console.log('🚨 DASHBOARD: Hotspots loaded successfully:', hotspotsResponse.data);

      // Load image statistics
      console.log('🚨 DASHBOARD: Fetching image statistics...');
      let imageStats = null;
      try {
        imageStats = await imageManagementService.getImageStatistics();
        console.log('🚨 DASHBOARD: Image statistics loaded:', imageStats);
      } catch (imgError) {
        console.log('🚨 DASHBOARD: Image stats not available:', imgError.message);
      }

      setData({
        overview: overviewResponse.data,
        incidents: incidentsResponse.data.incidents || [],
        hotspots: hotspotsResponse.data.hotspots || [],
        properties: overviewResponse.data?.properties || [],
        imageStats,
        loading: false,
        error: null
      });

      console.log('🚨 DASHBOARD: All data loaded successfully!');
      toast.success('Dashboard loaded successfully');

    } catch (error: any) {
      console.error('🚨 DASHBOARD: Error loading dashboard:', error);
      // Don't show the error popup - just log it
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }));
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (data.loading) {
    return (
      <div className="space-y-6">
        <div className="apex-page-header">
          <div className="apex-page-title">
            <h1 className="apex-page-heading">Executive Dashboard</h1>
            <p className="apex-page-description">
              Real-time security intelligence for {user?.clientName}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="apex-card animate-pulse">
              <div className="apex-card-body p-6">
                <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="apex-card">
          <div className="apex-card-body p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate comprehensive stats from the loaded data
  const stats = {
    totalIncidents: data.incidents.length,
    criticalIncidents: data.incidents.filter(i => i.severity === 'critical').length,
    resolvedIncidents: data.incidents.filter(i => i.status === 'resolved').length,
    averageConfidence: data.incidents.length > 0 
      ? Math.round(data.incidents.reduce((acc, i) => acc + (i.aiConfidence || 0), 0) / data.incidents.length)
      : 0,
    totalProperties: data.imageStats?.totalProperties || data.properties.length || 0,
    propertiesWithImages: data.imageStats?.propertiesWithImages || 0,
    totalImages: data.imageStats?.totalImages || 0,
    lastImageUpload: data.imageStats?.lastImageUpload || null
  };

  const openPropertyGallery = (propertyId: string) => {
    setSelectedProperty(propertyId);
    setShowPropertyGallery(true);
  };

  const closePropertyGallery = () => {
    setShowPropertyGallery(false);
    setSelectedProperty(null);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Dashboard Header */}
      <div className="apex-page-header">
        <div className="apex-page-title">
          <h1 className="apex-page-heading">Executive Dashboard</h1>
          <p className="apex-page-description">
            Real-time security intelligence for {user?.clientName}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'overview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-1 inline" />
              Overview
            </button>
            <button
              onClick={() => setViewMode('properties')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'properties'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4 mr-1 inline" />
              Properties
            </button>
          </div>
          
          <button
            onClick={loadDashboardData}
            disabled={data.loading}
            className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 mr-2 ${data.loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="apex-card">
          <div className="apex-card-body p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Incidents</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalIncidents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="apex-card">
          <div className="apex-card-body p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Critical Incidents</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.criticalIncidents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="apex-card">
          <div className="apex-card-body p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.resolvedIncidents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="apex-card">
          <div className="apex-card-body p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Property Images</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalImages}</dd>
                  <dd className="text-xs text-gray-400">{stats.propertiesWithImages} of {stats.totalProperties} properties</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area Based on View Mode */}
      {viewMode === 'overview' ? (
        <>
          {/* Recent Incidents */}
      <div className="apex-card">
        <div className="apex-card-header px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Critical Incidents</h3>
        </div>
        <div className="apex-card-body">
          {data.incidents.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 text-green-500">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">All Clear</h4>
              <p className="text-sm text-gray-600">No critical incidents in the selected time period.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {data.incidents.slice(0, 10).map((incident, index) => (
                <div key={incident.id || index} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      incident.severity === 'critical' ? 'bg-red-500' :
                      incident.severity === 'high' ? 'bg-orange-500' :
                      incident.severity === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {incident.incidentType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Security Incident'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {incident.propertyName || 'Property'} - {incident.location || 'Location'} 
                        {incident.severity && (
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            incident.severity === 'critical' ? 'text-red-700 bg-red-100' :
                            incident.severity === 'high' ? 'text-orange-700 bg-orange-100' :
                            incident.severity === 'medium' ? 'text-yellow-700 bg-yellow-100' :
                            'text-green-700 bg-green-100'
                          }`}>
                            {incident.severity}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {incident.incidentDate ? new Date(incident.incidentDate).toLocaleString() : 'Unknown date'}
                        {incident.aiConfidence && ` • AI: ${incident.aiConfidence}%`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        </>
      ) : (
        /* Property Gallery View */
        <div className="space-y-6">
          {/* Property Overview */}
          <div className="apex-card">
            <div className="apex-card-header px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Property Portfolio</h3>
              <p className="text-sm text-gray-600 mt-1">
                Visual overview of your {stats.totalProperties} properties
              </p>
            </div>
            <div className="apex-card-body p-6">
              {data.properties.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Properties Found</h4>
                  <p className="text-sm text-gray-600">Property information will appear here once available.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.properties.map((property: any) => (
                    <div key={property.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
                      {/* Property Image */}
                      <div className="h-48 bg-gray-100 relative">
                        {property.primaryImage ? (
                          <img
                            src={`/property-images/${property.primaryImage}`}
                            alt={property.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.style.setProperty('display', 'flex');
                            }}
                          />
                        ) : null}
                        <div
                          className={`absolute inset-0 flex items-center justify-center flex-col bg-gray-50 ${
                            property.primaryImage ? 'hidden' : 'flex'
                          }`}
                        >
                          <Building2 className="w-12 h-12 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">
                            {property.imageCount || 0} image{(property.imageCount || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {/* Image Count Badge */}
                        {(property.imageCount || 0) > 0 && (
                          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <ImageIcon className="w-3 h-3 mr-1" />
                            {property.imageCount}
                          </div>
                        )}
                      </div>
                      
                      {/* Property Info */}
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{property.name}</h4>
                        <p className="text-sm text-gray-600 mb-3 flex items-center">
                          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{property.address}</span>
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {property.lastImageUpdate && (
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                Updated {new Date(property.lastImageUpdate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            {(property.imageCount || 0) > 0 && (
                              <button
                                onClick={() => openPropertyGallery(property.id)}
                                className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View Gallery
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Image Statistics */}
          {data.imageStats && (
            <div className="apex-card">
              <div className="apex-card-header px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Image Portfolio Statistics</h3>
              </div>
              <div className="apex-card-body p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{data.imageStats.totalProperties}</div>
                    <div className="text-sm text-gray-600">Total Properties</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{data.imageStats.propertiesWithImages}</div>
                    <div className="text-sm text-gray-600">With Images</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{data.imageStats.totalImages}</div>
                    <div className="text-sm text-gray-600">Total Images</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{data.imageStats.averageImagesPerProperty}</div>
                    <div className="text-sm text-gray-600">Avg per Property</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Property Gallery Modal */}
      {showPropertyGallery && selectedProperty && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Property Gallery</h3>
              <button
                onClick={closePropertyGallery}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <PropertyImageGallery
                propertyId={selectedProperty}
                showDownload={true}
                showMetadata={true}
                enableLightbox={true}
                gridCols={4}
              />
            </div>
          </div>
        </div>
      )}

      {/* Debug Info - Can be removed later */}
      {data.error && (
        <div className="apex-card">
          <div className="apex-card-body p-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Debug info: {data.error}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveDashboard;